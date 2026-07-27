import assert from "node:assert/strict";
import test from "node:test";

import {
  RAW_BACKUP_KEY,
  STORAGE_KEY,
  createDefaultState,
  createLocalStore,
} from "../../src/storage/local-store.js";

function createMemoryStorage(initialEntries = {}) {
  const entries = new Map(Object.entries(initialEntries));
  return {
    getItem(key) {
      return entries.has(key) ? entries.get(key) : null;
    },
    setItem(key, value) {
      entries.set(key, String(value));
    },
    removeItem(key) {
      entries.delete(key);
    },
    entries,
  };
}

test("以注入的 storage adapter 正常保存與載入 schema v1", () => {
  const storage = createMemoryStorage();
  const store = createLocalStore(storage);
  const defaultState = createDefaultState();

  assert.equal(STORAGE_KEY, "self-learning-passport:v1");
  assert.equal(defaultState.schemaVersion, 1);
  assert.ok(defaultState.student);
  assert.equal(
    defaultState.student.visualPreference.worldGuideDismissed,
    false,
  );
  assert.deepEqual(defaultState.student.weeklyStrategyReviews, []);
  assert.deepEqual(defaultState.classes, {});
  assert.deepEqual(defaultState.teacher, { managedClasses: {} });
  assert.deepEqual(defaultState.syncQueue, []);

  const emptyResult = store.load();
  assert.equal(emptyResult.ok, true);
  assert.equal(emptyResult.status, "empty");
  assert.deepEqual(emptyResult.state, defaultState);

  const state = createDefaultState();
  state.activeRole = "teacher";
  state.classes.ABC123 = {
    participantAlias: "青鳥 27",
    participantToken: "local-participant-secret",
  };
  state.teacher.managedClasses.ABC123 = {
    teacherKey: "local-teacher-secret",
  };
  state.student.measurementEvents.push({
    id: "event-1",
    type: "mission_started",
  });

  assert.deepEqual(store.save(state), { ok: true, status: "saved" });
  const loadedResult = store.load();
  assert.equal(loadedResult.ok, true);
  assert.equal(loadedResult.status, "loaded");
  assert.deepEqual(loadedResult.state, state);
});

test("壞 JSON、錯誤型別與未知 schema 安全復原並保留最新 raw backup", () => {
  const storage = createMemoryStorage();
  const store = createLocalStore(storage);
  const invalidCases = [
    ["{bad-json", "invalid-json"],
    [JSON.stringify([]), "invalid-state"],
    [
      JSON.stringify({
        ...createDefaultState(),
        schemaVersion: 2,
      }),
      "unsupported-schema",
    ],
  ];

  for (const [raw, reason] of invalidCases) {
    storage.setItem(STORAGE_KEY, raw);
    const result = store.load();

    assert.equal(result.ok, true);
    assert.equal(result.status, "recovered");
    assert.equal(result.reason, reason);
    assert.equal(result.backupStatus, "saved");
    assert.deepEqual(result.state, createDefaultState());
    assert.equal(storage.getItem(RAW_BACKUP_KEY), raw);
    assert.equal(storage.getItem(STORAGE_KEY), null);
  }

  assert.equal(
    storage.getItem(RAW_BACKUP_KEY),
    invalidCases.at(-1)[0],
    "raw backup 應只保留最新失敗來源",
  );
});

test("Quota 與不可用 storage 不拋例外並回傳可顯示狀態", () => {
  const quotaStorage = createMemoryStorage();
  quotaStorage.setItem = () => {
    const error = new Error("容量不足");
    error.name = "QuotaExceededError";
    throw error;
  };

  assert.deepEqual(createLocalStore(quotaStorage).save(createDefaultState()), {
    ok: false,
    status: "quota-exceeded",
  });

  const unavailableStorage = {
    getItem() {
      const error = new Error("瀏覽器拒絕存取");
      error.name = "SecurityError";
      throw error;
    },
    setItem() {
      throw new Error("不可用");
    },
    removeItem() {
      throw new Error("不可用");
    },
  };
  const unavailableStore = createLocalStore(unavailableStorage);

  assert.deepEqual(unavailableStore.load(), {
    ok: false,
    status: "storage-unavailable",
    state: createDefaultState(),
  });
  assert.deepEqual(unavailableStore.clear(), {
    ok: false,
    status: "storage-unavailable",
    state: createDefaultState(),
  });
});

test("序列化時隱私內容與 measurementEvents 留在本機、不進 syncQueue payload", () => {
  const storage = createMemoryStorage();
  const store = createLocalStore(storage);
  const state = createDefaultState();

  state.student.missionHistory["2026-07-27"] = {
    missionId: "ink-cave-first-thread",
    reflection: "這是只給自己看的反思",
  };
  state.student.measurementEvents.push({
    id: "measure-1",
    type: "mission_reported",
  });
  state.classes.ABC123 = {
    participantAlias: "青鳥 27",
    participantToken: "local-participant-secret",
  };
  state.teacher.managedClasses.ABC123 = {
    teacherKey: "local-teacher-secret",
  };
  state.syncQueue.push({
    eventId: "sync-1",
    participantToken: "local-participant-secret",
    payload: {
      missionId: "ink-cave-first-thread",
      status: "complete",
      reflection: "不可同步的反思",
      answer: "不可同步的答案",
      studentName: "不可同步的姓名",
      nested: {
        displayName: "仍不可同步的姓名",
        answerText: "仍不可同步的答案",
      },
      measurementEvents: [{ id: "不可同步" }],
    },
  });

  assert.deepEqual(store.save(state), { ok: true, status: "saved" });
  const serialized = JSON.parse(storage.getItem(STORAGE_KEY));

  assert.equal(
    serialized.student.missionHistory["2026-07-27"].reflection,
    "這是只給自己看的反思",
  );
  assert.deepEqual(serialized.student.measurementEvents, [
    { id: "measure-1", type: "mission_reported" },
  ]);
  assert.equal(
    serialized.classes.ABC123.participantToken,
    "local-participant-secret",
  );
  assert.equal(
    serialized.teacher.managedClasses.ABC123.teacherKey,
    "local-teacher-secret",
  );
  assert.deepEqual(serialized.syncQueue, [
    {
      eventId: "sync-1",
      participantToken: "local-participant-secret",
      payload: {
        missionId: "ink-cave-first-thread",
        status: "complete",
        nested: {},
      },
    },
  ]);
  assert.equal(state.syncQueue[0].payload.reflection, "不可同步的反思");
});

test("clear 同時清除三身份狀態與可能含舊資料的 raw backup", () => {
  const state = createDefaultState();
  state.activeRole = "parent";
  state.student.participantId = "student-local-id";
  state.classes.ABC123 = { participantToken: "participant-secret" };
  state.teacher.managedClasses.ABC123 = { teacherKey: "teacher-secret" };

  const storage = createMemoryStorage({
    [STORAGE_KEY]: JSON.stringify(state),
    [RAW_BACKUP_KEY]: "old-private-raw",
  });
  const store = createLocalStore(storage);
  const result = store.clear();

  assert.deepEqual(result, {
    ok: true,
    status: "cleared",
    state: createDefaultState(),
  });
  assert.equal(storage.getItem(STORAGE_KEY), null);
  assert.equal(storage.getItem(RAW_BACKUP_KEY), null);
  assert.equal(store.load().status, "empty");
});
