import assert from "node:assert/strict";
import test from "node:test";

import { jsonError, jsonOk } from "../../functions/lib/responses.js";
import { validateClassInput } from "../../functions/lib/validation.js";

const validInput = {
  title: "暑假七日任務",
  missionIds: ["ink-cave-first-thread", "wind-valley-first-leaf"],
  retentionDays: 30,
};

test("班級輸入接受安全標題、靜態任務與合法保存期限", () => {
  assert.deepEqual(validateClassInput(validInput), validInput);
});

test("保存期限只接受 7、30 或 90 天", () => {
  for (const retentionDays of [0, 14, 91, "30"]) {
    assert.throws(
      () => validateClassInput({ ...validInput, retentionDays }),
      /保存期限/,
    );
  }
});

test("班級標題須為 1 至 40 字且不得包含 Email 或網址", () => {
  for (const title of [
    "",
    "　",
    "任".repeat(41),
    "請寄信到 teacher@example.com",
    "任務說明 https://example.com/path",
    "更多內容 www.example.tw",
  ]) {
    assert.throws(
      () => validateClassInput({ ...validInput, title }),
      /班級標題/,
    );
  }
});

test("任務只能使用 1 至 14 個不重複的靜態目錄 ID", () => {
  for (const missionIds of [
    [],
    ["unknown-mission"],
    ["https://example.com/mission"],
    ["ink-cave-first-thread", "ink-cave-first-thread"],
    Array.from({ length: 15 }, (_, index) => `mission-${index}`),
  ]) {
    assert.throws(
      () => validateClassInput({ ...validInput, missionIds }),
      /任務目錄/,
    );
  }
});

test("建班輸入拒絕個人內容及所有未知欄位", () => {
  for (const field of [
    "reflection",
    "answer",
    "name",
    "minutes",
    "strategy",
    "encouragement",
    "measurementEvents",
  ]) {
    assert.throws(
      () =>
        validateClassInput({
          ...validInput,
          [field]: "不得進入後端",
        }),
      /不允許的建班欄位/,
    );
  }
});

test("API 回應固定使用不含內部資料的 JSON envelope", async () => {
  const success = jsonOk({ classCode: "ABC234" }, 201);
  assert.equal(success.status, 201);
  assert.match(success.headers.get("content-type"), /^application\/json/u);
  assert.deepEqual(await success.json(), {
    ok: true,
    data: { classCode: "ABC234" },
  });

  const failure = jsonError("INVALID_CLASS", "班級資料不合法。", 400);
  assert.equal(failure.status, 400);
  assert.deepEqual(await failure.json(), {
    ok: false,
    error: {
      code: "INVALID_CLASS",
      message: "班級資料不合法。",
    },
  });
});
