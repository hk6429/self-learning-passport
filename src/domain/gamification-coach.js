export const ENERGY_OPTIONS = Object.freeze([
  Object.freeze({
    id: "quick",
    label: "想快速開始",
    durationMinutes: 5,
    guidance: "先走五分鐘，讓開始變容易。",
  }),
  Object.freeze({
    id: "steady",
    label: "想穩穩前進",
    durationMinutes: 10,
    guidance: "留一段剛好的時間，完整走過一輪。",
  }),
  Object.freeze({
    id: "challenge",
    label: "今天想挑戰",
    durationMinutes: 15,
    guidance: "多留一點時間，試著整理自己的方法。",
  }),
]);

export const EVIDENCE_OPTIONS = Object.freeze([
  Object.freeze({ id: "explain", label: "我弄懂了一個重點" }),
  Object.freeze({ id: "question", label: "我仍有一個疑問" }),
  Object.freeze({ id: "practice", label: "我想再練一次" }),
]);

export const SUPPORT_NEED_OPTIONS = Object.freeze([
  Object.freeze({
    id: "self",
    label: "讓我自己試",
    message: "我想先自己試試看，需要時再請你陪我。",
  }),
  Object.freeze({
    id: "start-together",
    label: "陪我開始 5 分鐘",
    message: "可以陪我開始五分鐘嗎？開始後我想自己繼續。",
  }),
  Object.freeze({
    id: "listen",
    label: "聽我說卡住處",
    message: "我想說說卡住的地方，先聽我整理就好。",
  }),
]);

export const CLOSING_PROMPTS = Object.freeze([
  Object.freeze({ id: "method", label: "你今天找到哪個有效的方法？" }),
  Object.freeze({ id: "question", label: "你今天留下哪一個新問題？" }),
  Object.freeze({ id: "next-step", label: "下次你想從哪一步繼續？" }),
]);

const NORTH_STAR_REASONS = Object.freeze({
  habit: "你的北極星是養成一小步，先選走得完的節奏。",
  breakthrough: "你的北極星是突破卡關，今天保留一點挑戰空間。",
  "class-route": "你的北極星是和全班同行，先跟共同航線的節奏。",
  "find-my-way": "你的北極星是找到方法，今天可以觀察哪種走法最合適。",
});

const WEEKLY_STRATEGY_GUIDANCE = Object.freeze({
  "quick-start": Object.freeze({
    durationMinutes: 5,
    message: "上次回顧說先做 5 分鐘最好開始。",
  }),
  "favorite-first": Object.freeze({
    durationMinutes: null,
    message: "上次回顧說先選喜歡的科目比較有力氣。",
  }),
  "ask-for-company": Object.freeze({
    durationMinutes: 5,
    message: "上次回顧說有人陪著開始會更穩。",
  }),
  "still-exploring": Object.freeze({
    durationMinutes: null,
    message: "你還在找方法，今天的選擇都可以再調整。",
  }),
});

const GROWTH_STAGES = Object.freeze([
  Object.freeze({
    id: "starting",
    label: "起步",
    description: "願意選一條今天走得動的路。",
  }),
  Object.freeze({
    id: "exploring",
    label: "探路",
    description: "已經走過三個不同領域，開始比較學習方法。",
  }),
  Object.freeze({
    id: "adjusting",
    label: "會調整",
    description: "能在卡住時替自己換一種策略。",
  }),
  Object.freeze({
    id: "reflecting",
    label: "能回望",
    description: "能回顧一段旅程，替下一步做選擇。",
  }),
]);

const REALM_STAGES = Object.freeze([
  Object.freeze({ id: "first-sight", label: "初見" }),
  Object.freeze({ id: "awakening", label: "甦醒" }),
  Object.freeze({ id: "restored", label: "復明" }),
]);

export function getMissionRecommendation({
  missions = [],
  energyId = "quick",
  northStar = null,
  weeklyStrategyId = null,
} = {}) {
  const energy = ENERGY_OPTIONS.find(({ id }) => id === energyId) ??
    ENERGY_OPTIONS[0];
  const strategy = WEEKLY_STRATEGY_GUIDANCE[weeklyStrategyId] ?? null;
  const recommendedMinutes = strategy?.durationMinutes ?? energy.durationMinutes;
  const mission =
    missions.find(({ durationMinutes }) => durationMinutes === recommendedMinutes) ??
    missions[0] ??
    null;
  const reasons = [
    NORTH_STAR_REASONS[northStar] ? `北極星：${NORTH_STAR_REASONS[northStar]}` : null,
    strategy ? `每週策略：${strategy.message}` : null,
    energy.guidance,
  ].filter(Boolean);

  return {
    mission,
    energy,
    reason: reasons.join(" "),
    canOverride: true,
  };
}

export function buildMissionBrief({ mission, learningOutcome } = {}) {
  if (!mission?.title || !Number.isInteger(mission.durationMinutes)) {
    throw new TypeError("任務摘要需要有效任務");
  }
  return {
    learningOutcome,
    doneDefinition:
      "外站練習告一段落後回來落印；完成或部分完成都是真實完成這一步。",
    rewardNote: `習光只記錄這次 ${mission.durationMinutes} 分鐘投入，不是能力分數或學會證明。`,
  };
}

export function getEffortLight({
  durationMinutes,
  status,
  dailyMinutesBefore = 0,
} = {}) {
  if (status !== "complete" && status !== "partial") return 0;
  if (!Number.isInteger(durationMinutes) || durationMinutes <= 0) {
    throw new TypeError("投入時間必須是正整數");
  }
  if (dailyMinutesBefore >= 60) return 0;
  const base = durationMinutes * 2;
  return dailyMinutesBefore >= 30 ? Math.round(base / 2) : base;
}

export function getGrowthStage({
  activeDays = [],
  exploredRealms = 0,
  hasStrategy = false,
  weeklyReviewCount = 0,
} = {}) {
  if (weeklyReviewCount > 0) return GROWTH_STAGES[3];
  if (hasStrategy) return GROWTH_STAGES[2];
  if (new Set(activeDays).size > 0 && exploredRealms >= 3) {
    return GROWTH_STAGES[1];
  }
  return GROWTH_STAGES[0];
}

export function buildRealmProgress(reports = []) {
  const activeReports = reports.filter(
    ({ status }) => status === "complete" || status === "partial",
  );
  const distinctMissions = new Set(
    activeReports.map(({ missionId }) => missionId).filter(Boolean),
  ).size;
  const evidenceCount = activeReports.filter(
    ({ evidenceId, reflection }) => Boolean(evidenceId || reflection),
  ).length;
  const stage =
    distinctMissions >= 3 && evidenceCount >= 3
      ? REALM_STAGES[2]
      : distinctMissions >= 2 && evidenceCount >= 1
        ? REALM_STAGES[1]
        : REALM_STAGES[0];

  return {
    distinctMissions,
    evidenceCount,
    stage,
    next:
      stage.id === "restored"
        ? "這座妖域已復明，仍可照自己的節奏回來練習。"
        : "嘗試另一條航線並留下一個學習證據，就能讓妖域更明亮。",
  };
}

export function getRepeatReflection(reports = [], missionId) {
  const previous = reports
    .filter((report) => report?.missionId === missionId)
    .sort((left, right) =>
      String(left.occurredAt ?? "").localeCompare(String(right.occurredAt ?? "")),
    )
    .at(-1);
  if (!previous) return null;
  const reflection =
    typeof previous.reflection === "string"
      ? previous.reflection
      : previous.reflection?.evidence ||
        previous.reflection?.note ||
        "留下足跡";
  return {
    previous,
    prompt: `上次你選擇「${reflection}」。這次哪裡不同？`,
  };
}

export function getStrategyCarryover(reviews = []) {
  const latest = [...reviews]
    .filter(Boolean)
    .sort((left, right) =>
      String(left.reviewedAt ?? "").localeCompare(String(right.reviewedAt ?? "")),
    )
    .at(-1);
  if (!latest) return null;
  const guidance = WEEKLY_STRATEGY_GUIDANCE[latest.strategyId];
  return guidance
    ? { strategyId: latest.strategyId, ...guidance }
    : null;
}

export function getParentConversationPrompt({ status, evidenceId } = {}) {
  if (evidenceId === "question") {
    return "想說說是哪一步還有疑問嗎？我先聽你整理。";
  }
  if (evidenceId === "practice") {
    return "如果再練一次，你想保留哪個方法？";
  }
  if (evidenceId === "explain") {
    return "願意用自己的話說一個今天弄懂的重點嗎？";
  }
  if (status === "partial") {
    return "今天走到哪一步？下次想從哪裡繼續？";
  }
  if (status === "rest") {
    return "今天需要怎樣的休息，會讓你比較舒服？";
  }
  if (status === "complete") {
    return "今天哪個方法最有幫助？";
  }
  return "今天想自己選一條路，還是需要我陪你開始？";
}

export function getTeacherLoadGuidance(missions = []) {
  const totalMinutes = missions.reduce(
    (sum, { durationMinutes = 0 }) => sum + durationMinutes,
    0,
  );
  const subjectCount = new Set(missions.map(({ subject }) => subject).filter(Boolean))
    .size;
  const overloaded = totalMinutes > 45 || subjectCount > 3;
  return {
    totalMinutes,
    subjectCount,
    overloaded,
    canShare: true,
    message: overloaded
      ? "這份航線超過 45 分鐘或跨越三個領域；可再確認暖身、核心與收尾節奏，仍可繼續分享。"
      : "這份航線在 45 分鐘與三個領域內，可再依班級步調調整。",
  };
}

export function buildLocalMetrics(events = []) {
  const count = (type) => events.filter((event) => event?.type === type).length;
  const starts = count("mission_started");
  const returns = count("mission_returned");
  const restSuggestions = count("rest_suggested");
  const restAccepted = count("rest_adopted");
  return {
    localOnly: true,
    returnRate: starts === 0 ? 0 : Math.round((returns / starts) * 100),
    strategySelections: count("strategy_selected"),
    restSuggestions,
    restAccepted,
    restAcceptanceRate:
      restSuggestions === 0
        ? 0
        : Math.min(100, Math.round((restAccepted / restSuggestions) * 100)),
    missionReports: count("mission_reported"),
  };
}
