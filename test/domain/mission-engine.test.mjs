import assert from "node:assert/strict";
import test from "node:test";

import { MISSION_CATALOG } from "../../src/data/mission-catalog.js";
import {
  buildDailyJourney,
  selectDailyRoutes,
} from "../../src/domain/mission-engine.js";

test("同一學習目標最多回傳 light、standard、challenge 三條真實任務", () => {
  const routes = selectDailyRoutes({
    siteId: "zizizhuji",
    dateKey: "2026-07-27",
    northStar: "habit",
  });

  assert.equal(routes.length, 3);
  assert.deepEqual(
    routes.map(({ routeLevel }) => routeLevel),
    ["light", "standard", "challenge"],
  );
  assert.equal(routes[0].durationMinutes, 5, "第一項應優先提供 5 分鐘任務");

  for (const route of routes) {
    assert.equal(route.siteId, "zizizhuji");
    assert.ok(
      MISSION_CATALOG.includes(route),
      `${route.id} 必須直接來自任務目錄`,
    );
  }
});

test("同一天不重派已 complete 或 partial 的任務", () => {
  const dateKey = "2026-07-27";
  const routes = selectDailyRoutes({
    siteId: "zizizhuji",
    dateKey,
    northStar: "breakthrough",
    missionHistory: {
      [dateKey]: [
        { missionId: "ink-cave-first-thread", status: "complete" },
        { missionId: "ink-cave-woven-words", status: "partial" },
        { missionId: "ink-cave-pearl-path", status: "skipped" },
      ],
      "2026-07-26": [
        { missionId: "ink-cave-pearl-path", status: "complete" },
      ],
    },
  });

  assert.deepEqual(
    routes.map(({ id }) => id),
    ["ink-cave-pearl-path"],
    "同日完成與部分完成應排除；略過與其他日期不應誤傷",
  );
});

test("免費更換一次後仍保留今天先休息", () => {
  const options = {
    siteId: "vocab-duel",
    dateKey: "2026-07-27",
    northStar: "find-my-way",
  };

  const beforeChange = buildDailyJourney({
    ...options,
    changesUsed: 0,
  });
  assert.equal(beforeChange.canChange, true);
  assert.equal(beforeChange.changeCost, 0);
  assert.equal(beforeChange.canRest, true);
  assert.equal(beforeChange.routes.length, 3);

  const afterFreeChange = buildDailyJourney({
    ...options,
    changesUsed: 1,
  });
  assert.equal(afterFreeChange.canChange, false);
  assert.equal(afterFreeChange.changeCost, null);
  assert.equal(afterFreeChange.canRest, true, "用完免費更換仍可安心休息");
  assert.equal(afterFreeChange.routes.length, 3);
});

test("相同條件的任務選擇穩定且不受目錄排列順序影響", () => {
  const options = {
    siteId: "bxws-math",
    dateKey: "2026-07-27",
    northStar: "class-route",
  };

  const firstSelection = selectDailyRoutes(options).map(({ id }) => id);
  const repeatedSelection = selectDailyRoutes(options).map(({ id }) => id);
  const reorderedCatalogSelection = selectDailyRoutes({
    ...options,
    catalog: [...MISSION_CATALOG].reverse(),
  }).map(({ id }) => id);

  assert.deepEqual(repeatedSelection, firstSelection);
  assert.deepEqual(reorderedCatalogSelection, firstSelection);
});
