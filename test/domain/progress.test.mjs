import assert from "node:assert/strict";
import test from "node:test";

import {
  getReturnVoyage,
  getSevenLights,
  recordProgress,
} from "../../src/domain/progress.js";

test("完成與部分完成依台灣日期建立不重複的活躍日，休息不建立", () => {
  let progress = { activeDays: [] };

  progress = recordProgress(progress, {
    status: "complete",
    occurredAt: "2026-07-26T16:30:00.000Z",
  });
  progress = recordProgress(progress, {
    status: "partial",
    occurredAt: "2026-07-27T01:00:00.000Z",
  });
  progress = recordProgress(progress, {
    status: "skipped",
    occurredAt: "2026-07-28T01:00:00.000Z",
  });

  assert.deepEqual(progress.activeDays, ["2026-07-27"]);
});

test("任意七個非連續活躍日完成一冊七燈，長期中斷不清零", () => {
  const activeDays = [
    "2026-07-01",
    "2026-07-13",
    "2026-08-05",
    "2026-09-07",
    "2026-10-09",
    "2026-11-11",
    "2026-12-14",
  ];

  assert.deepEqual(getSevenLights({ activeDays }), {
    completed: true,
    completedAt: "2026-12-14",
    litCount: 7,
    completedBooks: 1,
    currentBook: 2,
  });
});

test("七燈完成後開啟下一冊，燈數依永久活躍日循環", () => {
  assert.deepEqual(getSevenLights({
    activeDays: [
      "2026-01-01",
      "2026-01-02",
      "2026-01-03",
      "2026-01-04",
      "2026-01-05",
      "2026-01-06",
      "2026-01-07",
      "2026-02-01",
    ],
  }), {
    completed: true,
    completedAt: "2026-01-07",
    litCount: 1,
    completedBooks: 1,
    currentBook: 2,
  });
});

test("中斷至少一個台灣日後提供五分鐘安心回航", () => {
  const voyage = getReturnVoyage(
    { activeDays: ["2026-07-25"] },
    { now: "2026-07-27T02:00:00.000Z" },
  );

  assert.deepEqual(voyage, {
    durationMinutes: 5,
    message: "你回來了，路還在。",
  });
});
