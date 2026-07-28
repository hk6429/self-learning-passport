import test from "node:test";
import assert from "node:assert/strict";
import { MISSION_CATALOG } from "../../src/data/mission-catalog.js";
import {
  CHALLENGE_OPTIONS,
  COLLABORATION_PROTOCOLS,
  MICRO_GOALS,
  NEXT_STEPS,
  PRE_STRATEGIES,
  STUCK_REASONS,
  SUPPORT_MODES,
  buildLessonPlan,
  buildStudentDialogueCard,
  getDailyEnergy,
  getMissionLearningProfile,
  getRevealMessage,
  recommendAcrossRealms,
  resolveLearningStory,
  summarizeLearningCycle,
} from "../../src/domain/learning-experience.js";

test("21 條任務都有意圖、兩項成功規準、出口單與斷網備案", () => {
  for (const mission of MISSION_CATALOG) {
    const profile = getMissionLearningProfile(mission);
    assert.match(profile.intent, /^我能/);
    assert.equal(profile.successCriteria.length, 2);
    assert.equal(profile.exitTicket.id, `${mission.id}:exit`);
    assert.ok(profile.offlineFallback.length > 10);
  }
});

test("每日心力跨台灣日期重問，同日可保留", () => {
  assert.equal(getDailyEnergy({ energyId: "quick", energyDateKey: "2026-07-29" }, "2026-07-29"), "quick");
  assert.equal(getDailyEnergy({ energyId: "quick", energyDateKey: "2026-07-29" }, "2026-07-30"), null);
});

test("北極星可跨域推薦，時間與挑戰程度分開", () => {
  const result = recommendAcrossRealms({
    missions: MISSION_CATALOG,
    northStar: "find-my-way",
    minutes: 5,
    challengeId: "familiar",
    lastSiteId: "zizizhuji",
  });
  assert.notEqual(result.siteId, "zizizhuji");
  assert.equal(result.durationMinutes, 5);
});

test("低輸入反思、策略、微目標、支架與合作協議都有受控選項", () => {
  assert.equal(STUCK_REASONS.length, 4);
  assert.equal(NEXT_STEPS.length, 4);
  assert.equal(PRE_STRATEGIES.length, 4);
  assert.equal(CHALLENGE_OPTIONS.length, 3);
  assert.equal(SUPPORT_MODES.length, 3);
  assert.equal(COLLABORATION_PROTOCOLS.length, 3);
  assert.equal(Object.keys(MICRO_GOALS).length, 4);
});

test("七步摘要、學生對話卡與一頁教案只使用受控資料", () => {
  const reports = [
    { subject: "math", durationMinutes: 5, occurredAt: "2026-07-01", strategy: "shorter" },
    { subject: "english", durationMinutes: 10, occurredAt: "2026-07-02", evidenceId: "question" },
  ];
  assert.deepEqual(summarizeLearningCycle(reports), {
    count: 2,
    fiveMinuteCount: 1,
    subjects: 2,
    questions: 1,
    strategies: 1,
  });
  assert.equal(buildStudentDialogueCard({
    reflection: { evidence: "懂一點", stuckReason: "題意", nextStep: "看例題" },
  }).safeText, "懂一點｜題意｜看例題");
  assert.equal(buildLessonPlan({ missions: MISSION_CATALOG.slice(0, 2) }).missions.length, 2);
});

test("七域故事與 21 條揭曉都有任務級差異", () => {
  const subjects = new Set(MISSION_CATALOG.map(({ subject }) => subject));
  for (const subject of subjects) {
    const mission = MISSION_CATALOG.find((item) => item.subject === subject);
    assert.equal(resolveLearningStory({ mission, trigger: "complete" }).length, 2);
  }
  assert.equal(new Set(MISSION_CATALOG.map(getRevealMessage)).size, 21);
});
