const BADGE_PATHS = Object.freeze([
  { id: "first-step", label: "第一步行者", target: 1, metric: "stamps" },
  { id: "three-realms", label: "三域探路者", target: 3, metric: "realms" },
  { id: "strategy-maker", label: "自造路法師", target: 1, metric: "strategies" },
  { id: "rest-guardian", label: "安心守燈人", target: 1, metric: "rests" },
  { id: "seven-lights", label: "七燈破霧者", target: 7, metric: "activeDays" },
]);

export function getFairCheckInXp(status, durationMinutes = 0) {
  return status === "complete" || status === "partial"
    ? Math.max(0, durationMinutes) * 2
    : 0;
}

export function getMissionSuccessCue(mission = {}) {
  return mission.successCue || mission.completionPrompt || "留下今天看見的一個線索";
}

export function normalizeReflection(reflection) {
  if (reflection && typeof reflection === "object") {
    return {
      evidence: String(reflection.evidence ?? ""),
      stuckReason: String(reflection.stuckReason ?? ""),
      nextStep: String(reflection.nextStep ?? ""),
      note: String(reflection.note ?? ""),
      artifact: String(reflection.artifact ?? ""),
      exitTicket: String(reflection.exitTicket ?? ""),
      shareWithParent: reflection.shareWithParent === true,
    };
  }
  return {
    evidence: "",
    stuckReason: "",
    nextStep: "",
    note: typeof reflection === "string" ? reflection : "",
    artifact: "",
    exitTicket: "",
    shareWithParent: false,
  };
}

export function recommendMission({ missions = [], student = {} } = {}) {
  if (missions.length === 0) return null;
  const reports = Object.values(student.missionHistory ?? {})
    .flatMap((value) => (Array.isArray(value) ? value : [value]))
    .filter(Boolean);
  const latest = reports.at(-1);
  const strategy = latest?.strategy;
  let candidates = [...missions];
  let reason = "依你最近的選擇，先從走得動的一小步開始。";

  if (strategy === "shorter") {
    candidates = candidates.filter(({ durationMinutes }) => durationMinutes === 5);
    reason = "依你上次選的策略，先把時間縮短。";
  } else if (strategy === "retry" && latest?.missionId) {
    candidates = candidates.filter(({ id }) => id === latest.missionId);
    reason = "依你上次選的策略，再試同一站。";
  } else if (strategy === "different-type" && latest?.siteId) {
    candidates = candidates.filter(({ siteId }) => siteId !== latest.siteId);
    reason = "依你上次選的策略，換一種題型。";
  } else if (student.northStar === "habit") {
    candidates = candidates.filter(({ durationMinutes }) => durationMinutes === 5);
    reason = "你的北極星是養成習慣，先推薦 5 分鐘航線。";
  } else if (student.northStar === "breakthrough") {
    candidates = candidates.filter(({ routeLevel }) => routeLevel === "challenge");
    reason = "你的北極星是突破卡點，先推薦挑戰航線。";
  } else if (student.northStar === "find-my-way") {
    const lastSite = latest?.siteId;
    candidates = candidates.filter(({ siteId }) => siteId !== lastSite);
    reason = "你的北極星是找到方法，先推薦不同領域。";
  }

  return { mission: candidates[0] ?? missions[0], reason };
}

export function buildRewardDelta(before, after) {
  const beforeRelics = new Set((before?.unlockedRelics ?? []).map(({ id }) => id));
  const beforeBadges = new Set((before?.badges ?? []).map(({ id }) => id));
  return {
    xp: Math.max(0, (after?.xp ?? 0) - (before?.xp ?? 0)),
    levelUp: (after?.level ?? 1) > (before?.level ?? 1),
    relics: (after?.unlockedRelics ?? []).filter(({ id }) => !beforeRelics.has(id)),
    badges: (after?.badges ?? []).filter(({ id }) => !beforeBadges.has(id)),
  };
}

export function buildBadgePaths(student = {}, snapshot = {}) {
  const reports = Object.values(student.missionHistory ?? {})
    .flatMap((value) => (Array.isArray(value) ? value : [value]))
    .filter(Boolean);
  const metrics = {
    stamps: snapshot.stamps ?? 0,
    realms: snapshot.exploredRealms ?? 0,
    strategies: reports.filter(({ strategy }) => strategy).length,
    rests: reports.filter(({ status }) => status === "rest").length,
    activeDays: new Set(student.activeDays ?? []).size,
  };
  const unlocked = new Set((snapshot.badges ?? []).map(({ id }) => id));
  return BADGE_PATHS.map((badge) => ({
    ...badge,
    current: Math.min(metrics[badge.metric], badge.target),
    unlocked: unlocked.has(badge.id),
  }));
}

export function buildFourteenDayPath(activeDays = [], restDays = [], now = new Date()) {
  const active = new Set(activeDays);
  const rests = new Set(restDays);
  return Array.from({ length: 14 }, (_, index) => {
    const date = new Date(now);
    date.setDate(date.getDate() - (13 - index));
    const dateKey = new Intl.DateTimeFormat("en-CA", {
      timeZone: "Asia/Taipei",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(date);
    return {
      dateKey,
      state: active.has(dateKey) ? "active" : rests.has(dateKey) ? "rest" : "open",
    };
  });
}

export function analyzeTeacherPlan(missions = [], budgetMinutes = 45) {
  const totalMinutes = missions.reduce(
    (sum, mission) => sum + (mission.durationMinutes ?? 0),
    0,
  );
  return {
    totalMinutes,
    budgetMinutes,
    overBy: Math.max(0, totalMinutes - budgetMinutes),
    withinBudget: totalMinutes <= budgetMinutes,
  };
}

export function buildFacilitationCard(missions = []) {
  const subjects = [...new Set(missions.map(({ subject }) => subject))];
  return {
    opening: `今天共有 ${missions.length} 站，請先選一站說出你想練的能力。`,
    transition: "做不完也能落印；遇到卡點時，可以縮短、換路或先休息。",
    questions: [
      "今天哪個開始方式最有幫助？",
      `在${subjects.join("、") || "這些任務"}裡，你看見了什麼規律？`,
      "下次你想保留或調整哪一個策略？",
    ],
  };
}

export const PRIVACY_LAYERS = Object.freeze([
  {
    title: "這台裝置",
    copy: "護照、反思與鼓勵只存在目前瀏覽器，可由使用者自行清除。",
  },
  {
    title: "分享航線",
    copy: "分享網址只含白名單任務 ID，不含姓名、班級或學校。",
  },
  {
    title: "外部平台",
    copy: "開啟任務後由各平台處理資料，本入口不讀取外站成績。",
  },
]);
