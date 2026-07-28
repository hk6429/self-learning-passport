import { recordProgress } from "./progress.js";
import {
  buildRealmProgress,
  getEffortLight,
  getGrowthStage,
} from "./gamification-coach.js";

const CHECK_IN_STATUSES = new Set(["complete", "partial", "rest"]);
const taipeiDateFormatter = new Intl.DateTimeFormat("en-CA", {
  timeZone: "Asia/Taipei",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

const toDateKey = (occurredAt) =>
  taipeiDateFormatter.format(new Date(occurredAt));

export const NORTH_STAR_OPTIONS = Object.freeze([
  Object.freeze({ id: "habit", label: "養成每天一小步" }),
  Object.freeze({ id: "breakthrough", label: "突破一個卡關點" }),
  Object.freeze({ id: "class-route", label: "跟全班一起前進" }),
  Object.freeze({ id: "find-my-way", label: "找到自己的學習方法" }),
]);

export const PASSPORT_SEALS = Object.freeze([
  Object.freeze({ id: "ink-tail", label: "墨尾妖印", glyph: "尾" }),
  Object.freeze({ id: "cloud-lamp", label: "雲燈妖印", glyph: "燈" }),
  Object.freeze({ id: "golden-leaf", label: "金葉妖印", glyph: "葉" }),
]);

const RELICS = Object.freeze([
  Object.freeze({
    id: "mist-compass",
    label: "霧海羅盤",
    glyph: "羅",
    rarity: "珍奇",
    realm: "霧海入口",
    story: "墨尾循著第一批足跡磨亮的羅盤，會永遠指向你今天走得動的路。",
    art: "/assets/characters/ink-tail-guide/idle.webp",
    unlockAt: 30,
  }),
  Object.freeze({
    id: "moon-thread",
    label: "月絲護符",
    glyph: "絲",
    rarity: "稀有",
    realm: "字字珠璣",
    story: "從字網鬆開的第一縷月絲織成，提醒小行者：辨清一點，整張網就會鬆動。",
    art: "/assets/realms/ink-spider-cave-v3.webp",
    unlockAt: 60,
  }),
  Object.freeze({
    id: "wind-leaf-pin",
    label: "風語葉徽",
    glyph: "葉",
    rarity: "稀有",
    realm: "字鬥英雄",
    story: "能把聲音、意思與情境別在一起的風葉，是芭蕉谷送給耐心聆聽者的記號。",
    art: "/assets/realms/plantain-word-valley-v3.webp",
    unlockAt: 100,
  }),
  Object.freeze({
    id: "golden-ring-fragment",
    label: "金環殘片",
    glyph: "環",
    rarity: "史詩",
    realm: "步學吾數",
    story: "每看懂一個規律，殘片便轉正一格；集滿時，沉睡的算陣山路會重新亮起。",
    art: "/assets/realms/golden-ring-math-ridge-v3.webp",
    unlockAt: 150,
  }),
  Object.freeze({
    id: "starlight-flask",
    label: "星光藥瓶",
    glyph: "星",
    rarity: "史詩",
    realm: "科學英雄",
    story: "瓶裡收藏的不是答案，而是一路追問留下的星光。",
    art: "/assets/realms/science-hero-v2.webp",
    unlockAt: 220,
  }),
  Object.freeze({
    id: "seven-realm-scroll",
    label: "七域祕卷",
    glyph: "卷",
    rarity: "傳說",
    realm: "七域同行",
    story: "七域足跡交會後才會展開的祕卷，記錄小行者如何把微小投入走成自己的路。",
    art: "/assets/realms/fanren-lianxin-v2.webp",
    unlockAt: 300,
  }),
]);

export const SUPPORT_TONES = Object.freeze([
  Object.freeze({ id: "notice-effort", label: "看見投入" }),
  Object.freeze({ id: "offer-choice", label: "尊重選擇" }),
  Object.freeze({ id: "welcome-return", label: "歡迎回來" }),
]);

const SUPPORT_MESSAGES = Object.freeze({
  teacher: Object.freeze({
    "notice-effort": "我看見你願意開始，這一步已經讓路亮起來了。",
    "offer-choice": "你可以選擇今天走得動的路，短短五分鐘也算前進。",
    "welcome-return": "歡迎回來，不必補進度，我們就從現在這一步繼續。",
  }),
  parent: Object.freeze({
    "notice-effort": "我看見你今天有投入，不用和任何人比較。",
    "offer-choice": "你今天想走哪一條？我陪你選，不替你追趕。",
    "welcome-return": "休息過再回來也很好，走過的路一直都在。",
  }),
});

const MYSTERY_MESSAGES = Object.freeze({
  zizizhuji: "墨洞深處亮起一縷字絲：辨清一點，整張文字網就會鬆開。",
  "vocab-duel": "風語葉翻過一面：聲音、意思與情境連起來，記憶才有方向。",
  "bxws-math": "金環轉正一格：看懂規律，比急著算完更能打開山路。",
  "wenhao-xiaozhuan": "墨卷浮出一道側影：作品背後，總藏著一個真實的人生選擇。",
  "wenyan-jieyou-zhan": "古卷送來一帖解方：讀懂古人的心事，也能照見今天的自己。",
  "science-hero": "藥劑瓶閃過一點星光：好問題，是每一場科學試煉的起點。",
  "fanren-lianxin": "心鏡映出一條新路：刺激與回應之間，永遠留著選擇的空間。",
});

const flattenReports = (missionHistory = {}) =>
  Object.entries(missionHistory)
    .flatMap(([dateKey, reports]) =>
      (Array.isArray(reports) ? reports : [reports])
        .filter(Boolean)
        .map((report) => ({ ...report, dateKey })),
    );

const reportTime = (report) =>
  report.occurredAt ?? `${report.dateKey}T00:00:00.000Z`;

const annotateEffortRewards = (reports) => {
  const dailyMinutes = new Map();
  return reports.map((report) => {
    const used = dailyMinutes.get(report.dateKey) ?? 0;
    const earnedXp = getEffortLight({
      durationMinutes: report.durationMinutes,
      status: report.status,
      dailyMinutesBefore: used,
    });
    if (report.status === "complete" || report.status === "partial") {
      dailyMinutes.set(report.dateKey, used + report.durationMinutes);
    }
    return { ...report, earnedXp };
  });
};

export function buildPassportSnapshot(student = {}) {
  const reports = flattenReports(student.missionHistory);
  const chronologicalReports = reports.sort((left, right) =>
    reportTime(left).localeCompare(reportTime(right)),
  );
  const rewardedReports = annotateEffortRewards(chronologicalReports);
  const activeReports = rewardedReports.filter(
    ({ status }) => status === "complete" || status === "partial",
  );
  const restReports = rewardedReports.filter(({ status }) => status === "rest");
  const xp = activeReports.reduce((sum, report) => sum + report.earnedXp, 0);
  const exploredRealms = new Set(
    activeReports.map(({ siteId }) => siteId).filter(Boolean),
  ).size;
  const reveals = [
    ...new Set(activeReports.map(({ revealId }) => revealId).filter(Boolean)),
  ];
  const level = Math.floor(xp / 60) + 1;
  const currentLevelStart = (level - 1) * 60;
  const levelProgress = Math.min(100, Math.round(((xp - currentLevelStart) / 60) * 100));
  const seal =
    PASSPORT_SEALS.find(({ id }) => id === student.passport?.sealId) ??
    PASSPORT_SEALS[0];
  const northStarLabel =
    NORTH_STAR_OPTIONS.find(({ id }) => id === student.northStar)?.label ??
    "尚未選定北極星";
  const acquiredAtByRelic = new Map();
  let runningXp = 0;
  for (const report of activeReports) {
    runningXp += report.earnedXp;
    for (const relic of RELICS) {
      if (
        runningXp >= relic.unlockAt &&
        !acquiredAtByRelic.has(relic.id)
      ) {
        acquiredAtByRelic.set(relic.id, reportTime(report));
      }
    }
  }
  const collection = RELICS.map((relic) => ({
    ...relic,
    unlocked: xp >= relic.unlockAt,
    progressXp: Math.min(xp, relic.unlockAt),
    acquiredAt: acquiredAtByRelic.get(relic.id) ?? null,
  }));
  const unlockedRelics = collection.filter(({ unlocked }) => unlocked);
  const lockedRelic = collection.find(({ unlocked }) => !unlocked) ?? null;
  const badges = [];

  if (activeReports.length >= 1) {
    badges.push({
      id: "first-step",
      label: "第一步行者",
      glyph: "步",
      achievedAt: reportTime(activeReports[0]),
    });
  }
  if (exploredRealms >= 3) {
    const visited = new Set();
    const thirdRealmReport = activeReports.find((report) => {
      if (report.siteId) visited.add(report.siteId);
      return visited.size >= 3;
    });
    badges.push({
      id: "three-realms",
      label: "三域探路者",
      glyph: "域",
      achievedAt: thirdRealmReport ? reportTime(thirdRealmReport) : null,
    });
  }
  const strategyReport = activeReports.find(({ strategy }) => strategy);
  if (strategyReport) {
    badges.push({
      id: "strategy-maker",
      label: "自造路法師",
      glyph: "法",
      achievedAt: reportTime(strategyReport),
    });
  }
  const restReport = chronologicalReports.find(({ status }) => status === "rest");
  if (restReport) {
    badges.push({
      id: "rest-guardian",
      label: "安心守燈人",
      glyph: "安",
      achievedAt: reportTime(restReport),
    });
  }
  if ((student.activeDays ?? []).length >= 7) {
    badges.push({
      id: "seven-lights",
      label: "七燈破霧者",
      glyph: "燈",
      achievedAt: [...new Set(student.activeDays)].sort()[6] ?? null,
    });
  }
  const featuredRelic =
    unlockedRelics.find(
      ({ id }) => id === student.passport?.featuredRelicId,
    ) ??
    unlockedRelics[0] ??
    null;
  const featuredBadge =
    badges.find(({ id }) => id === student.passport?.featuredBadgeId) ??
    badges[0] ??
    null;
  const realmProgress = [
    ...new Set(activeReports.map(({ siteId }) => siteId).filter(Boolean)),
  ].map((siteId) => ({
    siteId,
    ...buildRealmProgress(
      activeReports.filter((report) => report.siteId === siteId),
    ),
  }));
  const growthStage = getGrowthStage({
    activeDays: student.activeDays ?? [],
    exploredRealms,
    hasStrategy: activeReports.some(({ strategy }) => strategy),
    weeklyReviewCount: student.weeklyStrategyReviews?.length ?? 0,
  });

  return {
    xp,
    level,
    levelProgress,
    growthStage,
    stamps: activeReports.length,
    restMarks: restReports.length,
    exploredRealms,
    realmProgress,
    reveals,
    badges,
    seal,
    northStarLabel,
    collection,
    unlockedRelics,
    featuredRelic,
    featuredBadge,
    nextRelic: lockedRelic
      ? {
          ...lockedRelic,
          remainingXp: lockedRelic.unlockAt - xp,
        }
      : null,
    recentHistory: [...rewardedReports]
      .reverse()
      .slice(0, 6)
      .map((report) => ({
        missionId: report.missionId,
        siteId: report.siteId,
        status: report.status,
        occurredAt: reportTime(report),
        earnedXp: report.earnedXp,
      })),
  };
}

export function buildSupportMessage({ role, tone } = {}) {
  const roleMessages = SUPPORT_MESSAGES[role];
  if (!roleMessages) {
    throw new RangeError("只有老師與家長能製作同行鼓勵卡");
  }
  const message = roleMessages[tone];
  if (!message) {
    throw new RangeError("不支援的鼓勵語氣");
  }
  return message;
}

export function getLatestMystery(student = {}) {
  const report = flattenReports(student.missionHistory)
    .filter(({ revealId }) => revealId)
    .sort((left, right) =>
      String(left.occurredAt ?? "").localeCompare(String(right.occurredAt ?? "")),
    )
    .at(-1);
  if (!report) return null;

  return {
    revealId: report.revealId,
    message:
      MYSTERY_MESSAGES[report.siteId] ??
      "霧海裡浮出一條新線索：今天留下的足跡，會指向下一條路。",
  };
}

export function recordPassportCheckIn(
  student,
  {
    mission,
    status,
    occurredAt,
    strategy = null,
    reflection = "",
    evidenceId = null,
  } = {},
) {
  if (!mission?.id || !Number.isInteger(mission.durationMinutes)) {
    throw new TypeError("落印需要有效任務");
  }
  if (!CHECK_IN_STATUSES.has(status)) {
    throw new RangeError("不支援的落印狀態");
  }

  const dateKey = toDateKey(occurredAt);
  const existing = student.missionHistory?.[dateKey];
  const reports = Array.isArray(existing)
    ? existing
    : existing
      ? [existing]
      : [];
  const report = {
    missionId: mission.id,
    siteId: mission.siteId,
    subject: mission.subject,
    durationMinutes: mission.durationMinutes,
    status,
    strategy,
    reflection,
    evidenceId,
    revealId: status === "rest" ? null : mission.revealId,
    occurredAt,
  };
  const nextReports = [
    ...reports.filter(({ missionId }) => missionId !== mission.id),
    report,
  ];
  const progress = recordProgress(
    { activeDays: student.activeDays ?? [] },
    { status, occurredAt },
  );
  const hasActiveReport = nextReports.some(
    ({ status: reportStatus }) =>
      reportStatus === "complete" || reportStatus === "partial",
  );
  const activeDays = hasActiveReport
    ? progress.activeDays
    : progress.activeDays.filter((day) => day !== dateKey);

  return {
    ...student,
    activeDays,
    missionHistory: {
      ...(student.missionHistory ?? {}),
      [dateKey]: nextReports,
    },
  };
}
