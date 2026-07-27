import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import { createClassService } from "../../functions/lib/class-service.js";
import { createD1Adapter } from "../../functions/lib/db.js";

const classInput = {
  title: "暑假七日任務",
  missionIds: ["ink-cave-first-thread", "wind-valley-first-leaf"],
  retentionDays: 30,
};

test("班級服務注入 fake adapter，碰撞重試且只保存教師金鑰雜湊", async () => {
  const saved = [];
  const db = {
    async hasClassCode(code) {
      return code === "AAAAAA";
    },
    async insertClassBundle(bundle) {
      saved.push(bundle);
    },
  };
  const codes = ["AAAAAA", "BBBBBB"];
  let idIndex = 0;
  const service = createClassService({
    db,
    generateCode: () => codes.shift(),
    generateSecret: () => "teacher-secret",
    hashSecret: async () => "hashed-secret",
    generateId: () => `id-${idIndex++}`,
    now: () => new Date("2026-07-27T00:00:00.000Z"),
  });

  const result = await service.createClass(classInput);

  assert.deepEqual(result, {
    classCode: "BBBBBB",
    teacherKey: "teacher-secret",
    expiresAt: "2026-08-26T00:00:00.000Z",
  });
  assert.equal(saved.length, 1);
  assert.equal(saved[0].classRecord.teacherKeyHash, "hashed-secret");
  assert.equal(JSON.stringify(saved[0]).includes("teacher-secret"), false);
  assert.deepEqual(
    saved[0].missionRecords.map(({ catalogMissionId, position }) => ({
      catalogMissionId,
      position,
    })),
    [
      { catalogMissionId: "ink-cave-first-thread", position: 0 },
      { catalogMissionId: "wind-valley-first-leaf", position: 1 },
    ],
  );
});

test("D1 adapter 以 prepared statements 寫入班級與任務交易批次", async () => {
  const prepared = [];
  const batches = [];
  const binding = {
    prepare(sql) {
      return {
        bind(...values) {
          const statement = {
            sql,
            values,
            async first() {
              return sql.startsWith("SELECT") ? null : undefined;
            },
          };
          prepared.push(statement);
          return statement;
        },
      };
    },
    async batch(statements) {
      batches.push(statements);
    },
  };
  const adapter = createD1Adapter(binding);

  assert.equal(await adapter.hasClassCode("ABC234"), false);
  await adapter.insertClassBundle({
    classRecord: {
      id: "class-1",
      code: "ABC234",
      title: "暑假七日任務",
      teacherKeyHash: "hashed-secret",
      status: "active",
      retentionDays: 30,
      createdAt: "2026-07-27T00:00:00.000Z",
      expiresAt: "2026-08-26T00:00:00.000Z",
      purgeAfter: "2026-09-02T00:00:00.000Z",
    },
    missionRecords: [
      {
        id: "mission-1",
        classId: "class-1",
        catalogMissionId: "ink-cave-first-thread",
        position: 0,
        availableOn: null,
        createdAt: "2026-07-27T00:00:00.000Z",
      },
    ],
  });

  assert.equal(batches.length, 1);
  assert.equal(batches[0].length, 2);
  assert.match(batches[0][0].sql, /^INSERT INTO classes/u);
  assert.match(batches[0][1].sql, /^INSERT INTO missions/u);
  assert.equal(JSON.stringify(prepared).includes("teacher-secret"), false);
});

test("D1 schema 僅建立匿名班級四表與索引，本機使用 PASSPORT_DB", async () => {
  const [sql, wrangler] = await Promise.all([
    readFile(
      new URL("../../migrations/0001_initial.sql", import.meta.url),
      "utf8",
    ),
    readFile(new URL("../../wrangler.toml", import.meta.url), "utf8"),
  ]);

  for (const table of ["classes", "missions", "participants", "completions"]) {
    assert.match(sql, new RegExp(`CREATE TABLE ${table}\\b`, "u"));
  }
  assert.match(sql, /CREATE INDEX idx_missions_class_position/u);
  assert.match(sql, /CREATE INDEX idx_participants_class/u);
  assert.match(sql, /CREATE INDEX idx_completions_class/u);
  assert.match(sql, /retention_days INTEGER NOT NULL CHECK \(retention_days IN \(7, 30, 90\)\)/u);
  assert.doesNotMatch(
    sql,
    /\b(reflection|answer|name|minutes?|strategy|encouragement|measurement)\b/iu,
  );

  assert.match(wrangler, /binding\s*=\s*"PASSPORT_DB"/u);
  assert.match(wrangler, /database_id\s*=\s*"local"/u);
  assert.doesNotMatch(
    wrangler,
    /database_id\s*=\s*"[0-9a-f]{8}-[0-9a-f-]{27,}"/iu,
  );
});
