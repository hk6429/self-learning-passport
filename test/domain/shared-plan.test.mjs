import assert from "node:assert/strict";
import test from "node:test";

import { MISSION_CATALOG } from "../../src/data/mission-catalog.js";
import {
  buildSharedPlanSummary,
  createSharedPlanUrl,
  readSharedPlan,
} from "../../src/domain/shared-plan.js";

test("老師可把 1 至 14 個白名單任務編成不含個資的分享網址", () => {
  const missionIds = [
    "ink-cave-first-thread",
    "golden-ridge-turning-rings",
  ];

  const url = createSharedPlanUrl({
    baseUrl: "https://self-learning-passport.pages.dev/",
    missionIds,
    catalog: MISSION_CATALOG,
  });
  const shared = readSharedPlan(url, { catalog: MISSION_CATALOG });

  assert.deepEqual(
    shared.missions.map(({ id }) => id),
    missionIds,
  );
  assert.equal(shared.missions.length, 2);
  assert.doesNotMatch(url, /name|email|student|teacher|school/iu);
  assert.equal(new URL(url).hash, "");
});

test("班級航線摘要會計算任務數與建議總時間", () => {
  const summary = buildSharedPlanSummary([
    MISSION_CATALOG.find(({ id }) => id === "ink-cave-first-thread"),
    MISSION_CATALOG.find(({ id }) => id === "science-nature-mission"),
  ]);

  assert.deepEqual(summary, {
    missionCount: 2,
    totalMinutes: 15,
    subjects: ["國語文", "自然科"],
  });
});
