import assert from "node:assert/strict";
import test from "node:test";

import { getRestSuggestion } from "../../src/domain/healthy-immersion.js";

test("投入時間超過自選時長兩倍時提出本機休息建議", () => {
  const suggestion = getRestSuggestion({
    selectedMinutes: 10,
    elapsedMinutes: 21,
    sessionStarts: [],
    now: "2026-07-27T10:00:00.000Z",
  });

  assert.deepEqual(suggestion, {
    recommended: true,
    reasons: ["duration"],
    message: "先讓眼睛和腦袋休息一下，想回來時路還在。",
    localOnly: true,
    blocksExit: false,
  });
});

test("30 分鐘內啟動三次時提出休息建議", () => {
  const suggestion = getRestSuggestion({
    selectedMinutes: 10,
    elapsedMinutes: 5,
    sessionStarts: [
      "2026-07-27T09:00:00.000Z",
      "2026-07-27T09:31:00.000Z",
      "2026-07-27T09:45:00.000Z",
      "2026-07-27T09:59:00.000Z",
    ],
    now: "2026-07-27T10:00:00.000Z",
  });

  assert.deepEqual(suggestion?.reasons, ["frequent-starts"]);
  assert.equal(suggestion?.localOnly, true);
  assert.equal(suggestion?.blocksExit, false);
});
