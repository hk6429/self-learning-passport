import assert from "node:assert/strict";
import test from "node:test";

import { buildHomeState } from "../../src/domain/home-state.js";
import { createDefaultState } from "../../src/storage/local-store.js";

test("首頁狀態提供三身份入口、墨尾引導與學生偏好", () => {
  const state = createDefaultState();
  state.activeRole = "teacher";
  state.student.dailyMinutes = 10;
  state.student.primarySubject = "english";

  const home = buildHomeState({ state, now: "2026-07-27T08:00:00.000Z" });

  assert.deepEqual(home.roles, [
    {
      id: "student",
      label: "學生",
      worldLabel: "小行者",
      active: false,
    },
    {
      id: "teacher",
      label: "老師",
      worldLabel: "引路仙師",
      active: true,
    },
    {
      id: "parent",
      label: "家長",
      worldLabel: "守燈人",
      active: false,
    },
  ]);
  assert.deepEqual(home.studentPreferences, {
    dailyMinutes: 10,
    primarySubject: "english",
  });
  assert.deepEqual(home.guide, {
    id: "ink-tail-guide",
    name: "墨尾行者",
    role: "首頁引路與今日任務",
    displayState: "idle",
    assetUrl: "/assets/characters/ink-tail-guide/idle.webp",
    alt: "墨尾行者豎起圓耳，握著路牌站在霧海岔路前。",
    fallback: "墨尾行者正在霧海岔路等你，仍可直接選擇今日航線。",
  });
});

test("首頁狀態提供三座妖域、各自 idle 角色與三種時長航線", () => {
  const home = buildHomeState({
    state: createDefaultState(),
    now: "2026-07-27T08:00:00.000Z",
  });

  assert.deepEqual(
    home.realms.map(({ id }) => id),
    [
      "ink-spider-cave",
      "plantain-word-valley",
      "golden-ring-math-ridge",
    ],
  );

  const expectedCharacters = new Map([
    ["ink-spider-cave", "ink-cave-spider-seven"],
    ["plantain-word-valley", "wind-valley-green-horn"],
    ["golden-ring-math-ridge", "golden-ridge-tablet-turtle"],
  ]);

  for (const realm of home.realms) {
    assert.equal(realm.character.id, expectedCharacters.get(realm.id));
    assert.equal(realm.character.displayState, "idle");
    assert.match(realm.character.assetUrl, /\/idle\.webp$/);
    assert.ok(realm.character.alt);
    assert.ok(realm.character.fallback);
    assert.deepEqual(
      realm.routes.map(({ durationMinutes }) => durationMinutes),
      [5, 10, 15],
    );
    assert.equal(
      realm.routes.every(({ siteId }) => siteId === realm.siteId),
      true,
    );
  }

  assert.deepEqual(home.realms[0].character, {
    id: "ink-cave-spider-seven",
    name: "墨蛛小七",
    role: "盤絲墨洞主要 NPC",
    displayState: "idle",
    assetUrl: "/assets/characters/ink-cave-spider-seven/idle.webp",
    alt: "墨蛛小七展開四條絨蛛臂，捧著字網竹框安靜等候。",
    fallback: "墨蛛小七正在盤絲墨洞等你，國語文任務仍可直接開始。",
  });
});

test("隔一個完整活躍日後提供偏好領域的五分鐘安心回航", () => {
  const state = createDefaultState();
  state.student.primarySubject = "english";
  state.student.activeDays = ["2026-07-25"];
  state.student.participantId = "private-participant-id";
  state.student.missionHistory["2026-07-25"] = {
    reflection: "只存在本機的私人反思",
  };

  const home = buildHomeState({
    state,
    now: "2026-07-27T02:00:00.000Z",
  });

  assert.equal(home.restorative.message, "你回來了，路還在。");
  assert.equal(home.restorative.durationMinutes, 5);
  assert.equal(home.restorative.mission.id, "wind-valley-first-leaf");
  assert.equal(home.restorative.mission.durationMinutes, 5);
  assert.equal(home.guide.displayState, "recover");
  assert.equal(
    home.guide.assetUrl,
    "/assets/characters/ink-tail-guide/recover.webp",
  );
  assert.doesNotMatch(
    JSON.stringify(home),
    /private-participant-id|只存在本機的私人反思/,
  );

  const recentState = createDefaultState();
  recentState.student.activeDays = ["2026-07-26"];
  assert.equal(
    buildHomeState({
      state: recentState,
      now: "2026-07-27T02:00:00.000Z",
    }).restorative,
    null,
  );
  assert.equal(
    buildHomeState({
      state: createDefaultState(),
      now: "2026-07-27T02:00:00.000Z",
    }).restorative,
    null,
  );
});
