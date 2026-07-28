import assert from "node:assert/strict";
import test from "node:test";

import { MISSION_CATALOG } from "../../src/data/mission-catalog.js";
import { createDefaultState } from "../../src/storage/local-store.js";
import {
  buildPassportSnapshot,
  buildSupportMessage,
  getLatestMystery,
  recordPassportCheckIn,
} from "../../src/domain/passport-game.js";

const mission = MISSION_CATALOG.find(
  ({ id }) => id === "ink-cave-first-thread",
);

test("完成或部分完成任務會落印，且同一任務同一天不重複計次", () => {
  const initial = createDefaultState().student;
  const occurredAt = "2026-07-27T12:00:00.000Z";

  const first = recordPassportCheckIn(initial, {
    mission,
    status: "complete",
    occurredAt,
  });
  const repeated = recordPassportCheckIn(first, {
    mission,
    status: "partial",
    occurredAt,
  });
  const correctedToRest = recordPassportCheckIn(repeated, {
    mission,
    status: "rest",
    occurredAt,
  });

  assert.deepEqual(first.activeDays, ["2026-07-27"]);
  assert.equal(first.missionHistory["2026-07-27"].length, 1);
  assert.equal(first.missionHistory["2026-07-27"][0].status, "complete");
  assert.equal(repeated.missionHistory["2026-07-27"].length, 1);
  assert.equal(repeated.missionHistory["2026-07-27"][0].status, "partial");
  assert.deepEqual(
    correctedToRest.activeDays,
    [],
    "同日誤按完成後改為休息，不應殘留活躍日",
  );
});

test("老師與家長能產生不比較、不施壓的同行鼓勵卡", () => {
  const teacherMessage = buildSupportMessage({
    role: "teacher",
    tone: "notice-effort",
  });
  const parentMessage = buildSupportMessage({
    role: "parent",
    tone: "offer-choice",
  });

  assert.match(teacherMessage, /我看見你願意開始/);
  assert.match(parentMessage, /想走哪一條/);
  assert.doesNotMatch(`${teacherMessage}${parentMessage}`, /排名|落後|必須連續/);
  assert.throws(
    () => buildSupportMessage({ role: "student", tone: "notice-effort" }),
    RangeError,
  );
});

test("完成後才揭曉對應妖域的神祕線索，休息不會被當成失敗", () => {
  const completed = recordPassportCheckIn(createDefaultState().student, {
    mission,
    status: "complete",
    occurredAt: "2026-07-27T12:00:00.000Z",
  });
  const rested = recordPassportCheckIn(createDefaultState().student, {
    mission,
    status: "rest",
    occurredAt: "2026-07-27T12:00:00.000Z",
  });

  assert.match(getLatestMystery(completed).message, /字絲/);
  assert.equal(getLatestMystery(rested), null);
});

test("複利護照把真實投入換成習光、行為階段、妖域足跡與收藏", () => {
  const student = createDefaultState().student;
  student.northStar = "habit";
  student.passport.sealId = "ink-tail";
  student.missionHistory = {
    "2026-07-25": [
      {
        missionId: "ink-cave-first-thread",
        siteId: "zizizhuji",
        durationMinutes: 10,
        status: "complete",
        revealId: "ink-cave-first-thread-reveal",
        occurredAt: "2026-07-25T12:00:00.000Z",
      },
    ],
    "2026-07-26": [
      {
        missionId: "wind-valley-first-leaf",
        siteId: "vocab-duel",
        durationMinutes: 5,
        status: "partial",
        strategy: "shorter",
        revealId: "wind-valley-first-leaf-reveal",
        occurredAt: "2026-07-26T12:00:00.000Z",
      },
    ],
  };

  const snapshot = buildPassportSnapshot(student);

  assert.equal(snapshot.xp, 30);
  assert.equal(snapshot.growthStage.id, "adjusting");
  assert.equal(snapshot.stamps, 2);
  assert.equal(snapshot.restMarks, 0);
  assert.equal(snapshot.exploredRealms, 2);
  assert.equal(snapshot.northStarLabel, "養成每天一小步");
  assert.equal(snapshot.seal.label, "墨尾妖印");
  assert.equal(snapshot.reveals.length, 2);
  assert.ok(snapshot.unlockedRelics.some(({ id }) => id === "mist-compass"));
  assert.equal(snapshot.nextRelic.unlockAt, 60);
  assert.equal(snapshot.nextRelic.remainingXp, 30);
  assert.equal(snapshot.nextRelic.progressXp, 30);
  assert.equal(snapshot.collection.length >= 5, true);
  assert.equal(snapshot.realmProgress.length, 2);
  assert.equal(snapshot.recentHistory.length, 2);
  assert.ok(
    snapshot.collection.every(
      ({ rarity, realm, story, art }) => rarity && realm && story && art,
    ),
  );
  assert.ok(snapshot.badges.some(({ id }) => id === "first-step"));
  assert.ok(snapshot.badges.some(({ id }) => id === "strategy-maker"));
});

test("休息只留下歇腳記號，不增加習光、妖印、七燈或收藏", () => {
  const rested = recordPassportCheckIn(createDefaultState().student, {
    mission,
    status: "rest",
    occurredAt: "2026-07-27T12:00:00.000Z",
  });
  const snapshot = buildPassportSnapshot(rested);

  assert.equal(snapshot.xp, 0);
  assert.equal(snapshot.stamps, 0);
  assert.equal(snapshot.restMarks, 1);
  assert.equal(snapshot.unlockedRelics.length, 0);
  assert.deepEqual(rested.activeDays, []);
});

test("同日投入超過 30 分鐘後習光半額，60 分鐘後只留足跡", () => {
  const student = createDefaultState().student;
  student.missionHistory = {
    "2026-07-27": [
      {
        missionId: "one",
        siteId: "zizizhuji",
        durationMinutes: 15,
        status: "complete",
        occurredAt: "2026-07-27T01:00:00.000Z",
      },
      {
        missionId: "two",
        siteId: "vocab-duel",
        durationMinutes: 15,
        status: "partial",
        occurredAt: "2026-07-27T02:00:00.000Z",
      },
      {
        missionId: "three",
        siteId: "bxws-math",
        durationMinutes: 15,
        status: "complete",
        occurredAt: "2026-07-27T03:00:00.000Z",
      },
      {
        missionId: "four",
        siteId: "science-hero",
        durationMinutes: 15,
        status: "partial",
        occurredAt: "2026-07-27T04:00:00.000Z",
      },
      {
        missionId: "five",
        siteId: "fanren-lianxin",
        durationMinutes: 5,
        status: "complete",
        occurredAt: "2026-07-27T05:00:00.000Z",
      },
    ],
  };

  const snapshot = buildPassportSnapshot(student);
  assert.equal(snapshot.xp, 90);
  assert.equal(snapshot.recentHistory[0].earnedXp, 0);
});

test("只能把已解鎖收藏與徽章設為護照代表，並保留取得日期", () => {
  const student = createDefaultState().student;
  student.passport.featuredRelicId = "mist-compass";
  student.passport.featuredBadgeId = "first-step";
  student.missionHistory = {
    "2026-07-25": [
      {
        missionId: "ink-cave-first-thread",
        siteId: "zizizhuji",
        durationMinutes: 15,
        status: "complete",
        occurredAt: "2026-07-25T12:00:00.000Z",
      },
    ],
  };

  const unlocked = buildPassportSnapshot(student);
  assert.equal(unlocked.featuredRelic?.id, "mist-compass");
  assert.equal(unlocked.featuredRelic?.acquiredAt, "2026-07-25T12:00:00.000Z");
  assert.equal(unlocked.featuredBadge?.id, "first-step");

  student.passport.featuredRelicId = "seven-realm-scroll";
  student.passport.featuredBadgeId = "seven-lights";
  const locked = buildPassportSnapshot(student);
  assert.equal(locked.featuredRelic?.id, "mist-compass");
  assert.equal(locked.featuredBadge?.id, "first-step");
});
