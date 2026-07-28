import assert from "node:assert/strict";
import test from "node:test";

import { MISSION_CATALOG } from "../../src/data/mission-catalog.js";
import {
  ENERGY_OPTIONS,
  EVIDENCE_OPTIONS,
  SUPPORT_NEED_OPTIONS,
  buildLocalMetrics,
  buildMissionBrief,
  buildRealmProgress,
  getEffortLight,
  getGrowthStage,
  getMissionRecommendation,
  getParentConversationPrompt,
  getRepeatReflection,
  getStrategyCarryover,
  getTeacherLoadGuidance,
} from "../../src/domain/gamification-coach.js";

const languageMissions = MISSION_CATALOG.filter(
  ({ siteId }) => siteId === "zizizhuji",
);

test("今日心力用中性語言推薦時長，北極星與每週策略提供可覆寫理由", () => {
  assert.deepEqual(
    ENERGY_OPTIONS.map(({ durationMinutes }) => durationMinutes),
    [5, 10, 15],
  );
  assert.equal(ENERGY_OPTIONS.some(({ label }) => /弱|差|落後/.test(label)), false);

  const quick = getMissionRecommendation({
    missions: languageMissions,
    energyId: "quick",
    northStar: "habit",
    weeklyStrategyId: "quick-start",
  });
  const challenge = getMissionRecommendation({
    missions: languageMissions,
    energyId: "challenge",
    northStar: "breakthrough",
  });

  assert.equal(quick.mission.durationMinutes, 5);
  assert.match(quick.reason, /北極星|每週策略/);
  assert.equal(challenge.mission.durationMinutes, 15);
  assert.notEqual(quick.reason, challenge.reason);
});

test("任務摘要先呈現能力與完成條件，獎勵只說投入而非學會", () => {
  const brief = buildMissionBrief({
    mission: languageMissions[0],
    learningOutcome: "辨認常見字音與字形。",
  });

  assert.equal(brief.learningOutcome, "辨認常見字音與字形。");
  assert.match(brief.doneDefinition, /完成|部分完成|回來落印/);
  assert.match(brief.rewardNote, /投入/);
  assert.match(brief.rewardNote, /不是能力分數/);
  assert.match(brief.rewardNote, /不是.*學會證明/);
});

test("完成與部分完成同時長同分，每日 30 分鐘後半額、60 分鐘後只留足跡", () => {
  assert.equal(
    getEffortLight({ durationMinutes: 5, status: "complete", dailyMinutesBefore: 0 }),
    10,
  );
  assert.equal(
    getEffortLight({ durationMinutes: 5, status: "partial", dailyMinutesBefore: 0 }),
    10,
  );
  assert.equal(
    getEffortLight({ durationMinutes: 15, status: "complete", dailyMinutesBefore: 20 }),
    30,
  );
  assert.equal(
    getEffortLight({ durationMinutes: 10, status: "partial", dailyMinutesBefore: 35 }),
    10,
  );
  assert.equal(
    getEffortLight({ durationMinutes: 15, status: "complete", dailyMinutesBefore: 60 }),
    0,
  );
  assert.equal(
    getEffortLight({ durationMinutes: 15, status: "rest", dailyMinutesBefore: 0 }),
    0,
  );
});

test("學習證據與支持需求都是低輸入、非評判選項", () => {
  assert.deepEqual(
    EVIDENCE_OPTIONS.map(({ id }) => id),
    ["explain", "question", "practice"],
  );
  assert.deepEqual(
    SUPPORT_NEED_OPTIONS.map(({ id }) => id),
    ["self", "start-together", "listen"],
  );
  assert.equal(
    [...EVIDENCE_OPTIONS, ...SUPPORT_NEED_OPTIONS].some(({ label }) =>
      /失敗|退步|落後|不會/.test(label),
    ),
    false,
  );
});

test("成長階段依行為而非習光，妖域進度不讓同任務重複刷階", () => {
  assert.equal(getGrowthStage({ activeDays: [] }).id, "starting");
  assert.equal(
    getGrowthStage({ activeDays: ["2026-07-01"], exploredRealms: 3 }).id,
    "exploring",
  );
  assert.equal(
    getGrowthStage({
      activeDays: ["2026-07-01"],
      exploredRealms: 3,
      hasStrategy: true,
    }).id,
    "adjusting",
  );
  assert.equal(
    getGrowthStage({
      activeDays: ["2026-07-01"],
      exploredRealms: 3,
      hasStrategy: true,
      weeklyReviewCount: 1,
    }).id,
    "reflecting",
  );

  const reports = [
    { missionId: "same", status: "complete", reflection: "能說明" },
    { missionId: "same", status: "partial", reflection: "仍有疑問" },
    { missionId: "other", status: "partial", reflection: "" },
  ];
  const progress = buildRealmProgress(reports);
  assert.equal(progress.distinctMissions, 2);
  assert.equal(progress.evidenceCount, 2);
  assert.equal(progress.stage.id, "awakening");
});

test("重複任務、策略回顧與家長提問形成非評判下一步", () => {
  const repeat = getRepeatReflection(
    [
      {
        missionId: "same",
        status: "partial",
        strategy: "shorter",
        reflection: "我還有一點卡住",
        occurredAt: "2026-07-20T00:00:00.000Z",
      },
      {
        missionId: "same",
        status: "complete",
        reflection: "我弄懂了一個重點",
        occurredAt: "2026-07-21T00:00:00.000Z",
      },
    ],
    "same",
  );
  assert.match(repeat.prompt, /這次哪裡不同/);
  assert.doesNotMatch(repeat.prompt, /退步|輸|贏/);

  assert.match(
    getStrategyCarryover([
      { milestone: 7, strategyId: "quick-start", reviewedAt: "2026-07-21T00:00:00.000Z" },
    ]).message,
    /5 分鐘/,
  );
  assert.match(
    getParentConversationPrompt({
      status: "partial",
      evidenceId: "question",
    }),
    /想說說|哪一步/,
  );
});

test("教師負荷提示只柔性提醒，並保留分享權", () => {
  const heavy = getTeacherLoadGuidance([
    { ...languageMissions[2], subject: "國語文" },
    { ...languageMissions[2], id: "two", subject: "英文" },
    { ...languageMissions[2], id: "three", subject: "數學" },
    { ...languageMissions[2], id: "four", subject: "自然科" },
  ]);
  assert.equal(heavy.overloaded, true);
  assert.equal(heavy.canShare, true);
  assert.match(heavy.message, /45 分鐘|三個領域/);
});

test("本機量測只提供健康循環彙整，不計排名或總時數 KPI", () => {
  const metrics = buildLocalMetrics([
    { type: "mission_started" },
    { type: "mission_started" },
    { type: "mission_returned" },
    { type: "strategy_selected" },
    { type: "rest_suggested", context: { outcome: "complete" } },
  ]);
  assert.equal(metrics.returnRate, 50);
  assert.equal(metrics.strategySelections, 1);
  assert.equal(metrics.restSuggestions, 1);
  assert.equal("ranking" in metrics, false);
  assert.equal("totalMinutes" in metrics, false);
});
