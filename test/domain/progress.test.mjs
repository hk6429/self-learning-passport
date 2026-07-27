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

test("14 日內七個非連續活躍日形成七燈，之後缺席也不清零", () => {
  const activeDays = [
    "2026-07-01",
    "2026-07-03",
    "2026-07-05",
    "2026-07-07",
    "2026-07-09",
    "2026-07-11",
    "2026-07-14",
  ];

  assert.deepEqual(getSevenLights({ activeDays }), {
    completed: true,
    completedAt: "2026-07-14",
    litCount: 7,
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
