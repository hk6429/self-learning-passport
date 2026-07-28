const SUBJECT_PROFILES = Object.freeze({
  language: {
    intent: "我能辨認容易混淆的字音字形，並說出判斷線索。",
    criteria: ["指出一個關鍵差異", "用自己的話說明判斷方法"],
    offline: "從課本找兩個相似字，圈出不同部件並讀給同伴聽。",
  },
  english: {
    intent: "我能把單字的聲音、意思與使用情境連起來。",
    criteria: ["說出一個單字的意思", "用單字造一個短句或情境"],
    offline: "選三個課內單字，畫圖或造短句表示意思。",
  },
  math: {
    intent: "我能找出解題規律，並說明其中一步。",
    criteria: ["標出已知與未知", "說明一個算式或步驟的理由"],
    offline: "從習作選一題，只寫出已知、未知與第一步。",
  },
  literature: {
    intent: "我能連結文人的人生選擇與作品特色。",
    criteria: ["指出一個人生轉折", "說明它與作品的可能關聯"],
    offline: "從課文作者介紹圈出一個轉折，寫一句影響推測。",
  },
  classical: {
    intent: "我能用語境理解一句文言文，並連結自己的經驗。",
    criteria: ["找出關鍵詞意", "用白話改寫或舉出相似情境"],
    offline: "抄一句課內古文，圈關鍵詞並寫一句白話翻譯。",
  },
  science: {
    intent: "我能根據現象提出問題，並用證據支持推論。",
    criteria: ["寫出一個可觀察現象", "提出一個有根據的解釋"],
    offline: "觀察身邊一個現象，分別寫下觀察與推測。",
  },
  leadership: {
    intent: "我能辨認可選擇的空間，決定下一個可行行動。",
    criteria: ["分開刺激與回應", "選出一個自己能做到的下一步"],
    offline: "把今天一件事畫成刺激—選擇—回應三格。",
  },
});

export const CHALLENGE_OPTIONS = Object.freeze([
  { id: "familiar", label: "先熟悉", guidance: "先找一個看得懂的例子。" },
  { id: "variation", label: "試變化", guidance: "換一種題型比較方法。" },
  { id: "stretch", label: "想挑戰", guidance: "挑一個需要多想一步的微目標。" },
]);

export const PRE_STRATEGIES = Object.freeze([
  { id: "example-first", label: "先看例子" },
  { id: "easy-first", label: "先做會的" },
  { id: "say-why", label: "邊做邊說理由" },
  { id: "five-minute", label: "先設定 5 分鐘" },
]);

export const STUCK_REASONS = Object.freeze([
  { id: "wording", label: "看不懂題意" },
  { id: "method", label: "想不起方法" },
  { id: "attention", label: "注意力不足" },
  { id: "time", label: "時間不夠" },
]);

export const NEXT_STEPS = Object.freeze([
  { id: "example", label: "先看例題" },
  { id: "retry", label: "重做這一題" },
  { id: "shorter", label: "換較短任務" },
  { id: "explain", label: "請人聽我說" },
]);

export const MICRO_GOALS = Object.freeze({
  habit: ["完成三次 5 分鐘開始", "試兩種開始方式"],
  breakthrough: ["留下兩則卡點原因", "完成一次策略調整"],
  "class-route": ["完成一次共同起點", "分享一則下一步"],
  "find-my-way": ["探索兩個不同領域", "比較兩種學習策略"],
});

export const SUPPORT_MODES = Object.freeze([
  { id: "example", label: "有提示範例" },
  { id: "independent", label: "獨立嘗試" },
  { id: "extension", label: "延伸挑戰" },
]);

export const COLLABORATION_PROTOCOLS = Object.freeze([
  { id: "solo", label: "個人修行", prompts: ["自己先想", "留下證據", "決定下一步"] },
  { id: "peer-explain", label: "同儕解釋", prompts: ["各自先想", "輪流說理由", "補上一個問題"] },
  { id: "think-pair-share", label: "想—配對—分享", prompts: ["安靜想一分鐘", "兩人交換", "全班分享方法"] },
]);

export function getMissionLearningProfile(mission = {}) {
  const profile = SUBJECT_PROFILES[mission.subject] ?? SUBJECT_PROFILES.language;
  return {
    intent: profile.intent,
    successCriteria: [...profile.criteria],
    offlineFallback: profile.offline,
    exitTicket: {
      id: `${mission.id}:exit`,
      prompt: mission.completionPrompt || "請說出今天看見的一個線索。",
      options: ["需要提示", "可以自己說明", "想再試一次"],
    },
  };
}

export function getDailyEnergy(gameplay = {}, dateKey) {
  return gameplay.energyDateKey === dateKey ? gameplay.energyId ?? null : null;
}

export function recommendAcrossRealms({
  missions = [],
  northStar,
  minutes = 5,
  challengeId = "familiar",
  lastSiteId = null,
  questionMissionId = null,
} = {}) {
  let candidates = missions.filter(({ durationMinutes }) => durationMinutes === minutes);
  if (northStar === "find-my-way" && lastSiteId) {
    candidates = candidates.filter(({ siteId }) => siteId !== lastSiteId);
  }
  if (northStar === "breakthrough" && questionMissionId) {
    candidates = [
      ...candidates.filter(({ id }) => id === questionMissionId),
      ...candidates.filter(({ id }) => id !== questionMissionId),
    ];
  }
  const level = { familiar: "light", variation: "standard", stretch: "challenge" }[
    challengeId
  ];
  return (
    candidates.find(({ routeLevel }) => routeLevel === level) ??
    candidates[0] ??
    missions[0] ??
    null
  );
}

export function summarizeLearningCycle(reports = []) {
  const recent = [...reports]
    .sort((a, b) => String(a.occurredAt).localeCompare(String(b.occurredAt)))
    .slice(-7);
  return {
    count: recent.length,
    fiveMinuteCount: recent.filter(({ durationMinutes }) => durationMinutes === 5).length,
    subjects: new Set(recent.map(({ subject }) => subject).filter(Boolean)).size,
    questions: recent.filter(
      ({ evidenceId, reflection }) =>
        evidenceId === "question" || reflection?.evidence === "我仍有一個疑問",
    ).length,
    strategies: recent.filter(({ strategy, preStrategy }) => strategy || preStrategy).length,
  };
}

export function buildStudentDialogueCard(report = {}) {
  const reflection =
    typeof report.reflection === "object" ? report.reflection : { note: report.reflection ?? "" };
  return {
    success: reflection.evidence ?? "",
    question: reflection.stuckReason ?? "",
    nextStep: reflection.nextStep ?? "",
    safeText: [reflection.evidence, reflection.stuckReason, reflection.nextStep]
      .filter(Boolean)
      .join("｜"),
  };
}

export function buildLessonPlan({
  missions = [],
  supportMode = "independent",
  protocol = "solo",
} = {}) {
  const support = SUPPORT_MODES.find(({ id }) => id === supportMode) ?? SUPPORT_MODES[1];
  const collaboration =
    COLLABORATION_PROTOCOLS.find(({ id }) => id === protocol) ??
    COLLABORATION_PROTOCOLS[0];
  return {
    title: "萬妖習行錄一頁教案",
    totalMinutes: missions.reduce((sum, mission) => sum + mission.durationMinutes, 0),
    supportLabel: support.label,
    protocolLabel: collaboration.label,
    prompts: collaboration.prompts,
    missions: missions.map((mission) => ({
      title: mission.title,
      ...getMissionLearningProfile(mission),
    })),
  };
}

const SUBJECT_STORY = Object.freeze({
  language: ["字絲鬆開一個結", "你留下的辨字線索開始發亮"],
  english: ["風語葉找回聲音", "聲音與意思在風裡連起來"],
  math: ["金環轉正一格", "規律讓下一步山路浮現"],
  literature: ["文人的側影走出墨卷", "人生選擇照亮作品一角"],
  classical: ["古卷展開一句解方", "古人的心事與今天相遇"],
  science: ["藥劑瓶閃出星光", "好問題引出新的證據"],
  leadership: ["心鏡映出選擇空間", "你的下一步由自己決定"],
});

export function resolveLearningStory({ mission, trigger = "complete" } = {}) {
  const lines = SUBJECT_STORY[mission?.subject] ?? SUBJECT_STORY.language;
  const ending = {
    complete: "這一步已收進護照。",
    partial: "走到這裡也是真實進度。",
    rest: "先歇腳，走過的路不會消失。",
    return: "你回來了，路一直都在。",
  }[trigger] ?? "霧海記住了這一步。";
  return [lines[mission?.durationMinutes === 15 ? 1 : 0], ending];
}

export function getRevealMessage(mission = {}) {
  return `${mission.curiosityPrompt} 你留下的線索是：${mission.completionPrompt}`;
}
