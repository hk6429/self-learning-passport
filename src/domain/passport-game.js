import { recordProgress } from "./progress.js";

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
  Object.freeze({ id: "mist-compass", label: "霧海羅盤", unlockAt: 60 }),
  Object.freeze({ id: "moon-thread", label: "月絲護符", unlockAt: 150 }),
  Object.freeze({ id: "seven-realm-scroll", label: "七域祕卷", unlockAt: 300 }),
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
  Object.values(missionHistory)
    .flatMap((reports) => (Array.isArray(reports) ? reports : [reports]))
    .filter(Boolean);

const reportXp = ({ status, durationMinutes = 0 }) =>
  status === "complete"
    ? 20 + durationMinutes
    : status === "partial"
      ? 10 + Math.floor(durationMinutes / 2)
      : 0;

export function buildPassportSnapshot(student = {}) {
  const reports = flattenReports(student.missionHistory);
  const activeReports = reports.filter(
    ({ status }) => status === "complete" || status === "partial",
  );
  const xp = activeReports.reduce((sum, report) => sum + reportXp(report), 0);
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
  const unlockedRelics = RELICS.filter(({ unlockAt }) => xp >= unlockAt);
  const lockedRelic = RELICS.find(({ unlockAt }) => xp < unlockAt) ?? null;
  const badges = [];

  if (activeReports.length >= 1) {
    badges.push({ id: "first-step", label: "第一步行者" });
  }
  if (exploredRealms >= 3) {
    badges.push({ id: "three-realms", label: "三域探路者" });
  }
  if (activeReports.some(({ strategy }) => strategy)) {
    badges.push({ id: "strategy-maker", label: "自造路法師" });
  }
  if (reports.some(({ status }) => status === "rest")) {
    badges.push({ id: "rest-guardian", label: "安心守燈人" });
  }
  if ((student.activeDays ?? []).length >= 7) {
    badges.push({ id: "seven-lights", label: "七燈破霧者" });
  }

  return {
    xp,
    level,
    levelProgress,
    stamps: activeReports.length,
    exploredRealms,
    reveals,
    badges,
    seal,
    northStarLabel,
    unlockedRelics,
    nextRelic: lockedRelic
      ? {
          ...lockedRelic,
          remainingXp: lockedRelic.unlockAt - xp,
        }
      : null,
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
  { mission, status, occurredAt, strategy = null, reflection = "" } = {},
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
