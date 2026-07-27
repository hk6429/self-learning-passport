import assert from "node:assert/strict";
import test from "node:test";

import {
  APPROVED_MISSION_ORIGINS,
  MISSION_CATALOG,
  isApprovedMissionUrl,
} from "../../src/data/mission-catalog.js";

test("任務網址只使用三個核准來源", () => {
  assert.deepEqual(APPROVED_MISSION_ORIGINS, [
    "https://zizizhuji.pages.dev",
    "https://vocab-duel.pages.dev",
    "https://bxws-math.pages.dev",
  ]);

  const missionOrigins = new Set(
    MISSION_CATALOG.map(({ url }) => new URL(url).origin),
  );

  assert.deepEqual(
    [...missionOrigins].sort(),
    [...APPROVED_MISSION_ORIGINS].sort(),
  );
});

test("每筆任務都有完整且可引用的唯一資料契約", () => {
  const requiredFields = [
    "id",
    "siteId",
    "title",
    "subject",
    "durationMinutes",
    "stage",
    "url",
    "completionPrompt",
    "curiosityPromptId",
    "revealId",
    "routeLevel",
  ];

  for (const mission of MISSION_CATALOG) {
    assert.deepEqual(Object.keys(mission).sort(), requiredFields.sort());
    for (const field of requiredFields) {
      assert.notEqual(mission[field], "", `${mission.id ?? "未知任務"} 缺少 ${field}`);
      assert.notEqual(mission[field], undefined);
    }
  }

  const ids = MISSION_CATALOG.map(({ id }) => id);
  assert.equal(new Set(ids).size, ids.length, "任務 id 不可重複");
});

test("三座妖域各提供 5、10、15 分鐘的真實航線", () => {
  const expectedRouteLevel = new Map([
    [5, "light"],
    [10, "standard"],
    [15, "challenge"],
  ]);
  const expectedSiteIds = ["zizizhuji", "vocab-duel", "bxws-math"];

  assert.deepEqual(
    [...new Set(MISSION_CATALOG.map(({ durationMinutes }) => durationMinutes))].sort(
      (left, right) => left - right,
    ),
    [5, 10, 15],
  );

  for (const siteId of expectedSiteIds) {
    const siteMissions = MISSION_CATALOG.filter(
      (mission) => mission.siteId === siteId,
    );
    assert.equal(siteMissions.length, 3, `${siteId} 應有三條航線`);
    assert.deepEqual(
      siteMissions.map(({ durationMinutes }) => durationMinutes).sort(
        (left, right) => left - right,
      ),
      [5, 10, 15],
    );
  }

  for (const mission of MISSION_CATALOG) {
    assert.equal(
      mission.routeLevel,
      expectedRouteLevel.get(mission.durationMinutes),
      `${mission.id} 的時長與航線等級不一致`,
    );
  }
});

test("網址驗證拒絕任意路徑、參數、偽裝網域與無效輸入", () => {
  for (const { url } of MISSION_CATALOG) {
    assert.equal(isApprovedMissionUrl(url), true, `${url} 應在白名單`);
  }

  const rejectedUrls = [
    "https://example.com/",
    "https://zizizhuji.pages.dev.evil.example/",
    "https://zizizhuji.pages.dev/teacher-added-path",
    "https://vocab-duel.pages.dev/?next=https://example.com",
    "https://bxws-math.pages.dev/#任意任務",
    "javascript:alert(1)",
    "",
    null,
  ];

  for (const url of rejectedUrls) {
    assert.equal(isApprovedMissionUrl(url), false, `${String(url)} 不應通過`);
  }
});

test("妖域、學科與正式入口的對應不可被任務資料改寫", () => {
  const siteContracts = new Map([
    [
      "zizizhuji",
      { subject: "國語文", url: "https://zizizhuji.pages.dev/" },
    ],
    [
      "vocab-duel",
      { subject: "英文", url: "https://vocab-duel.pages.dev/" },
    ],
    [
      "bxws-math",
      { subject: "數學", url: "https://bxws-math.pages.dev/" },
    ],
  ]);

  const uniqueFields = [
    "id",
    "title",
    "completionPrompt",
    "curiosityPromptId",
    "revealId",
  ];

  for (const mission of MISSION_CATALOG) {
    const contract = siteContracts.get(mission.siteId);
    assert.ok(contract, `${mission.siteId} 不是核准妖域`);
    assert.equal(mission.subject, contract.subject);
    assert.equal(mission.url, contract.url);
    assert.ok(["onboarding", "scaffolding", "endgame"].includes(mission.stage));
  }

  for (const field of uniqueFields) {
    const values = MISSION_CATALOG.map((mission) => mission[field]);
    assert.equal(new Set(values).size, values.length, `${field} 不可重複`);
  }
});
