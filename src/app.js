import { buildHomeState } from "./domain/home-state.js";
import { getDailyFlavor } from "./domain/daily-flavor.js";
import {
  PLATFORM_FILTERS,
  filterPlatforms,
  getPlatformsForRole,
} from "./domain/platform-guide.js";
import { getReturnVoyage, getSevenLights } from "./domain/progress.js";
import {
  NORTH_STAR_OPTIONS,
  PASSPORT_SEALS,
  SUPPORT_TONES,
  buildPassportSnapshot,
  buildSupportMessage,
  getLatestMystery,
  recordPassportCheckIn,
} from "./domain/passport-game.js";
import {
  STRATEGY_OPTIONS,
  WEEKLY_STRATEGY_OPTIONS,
  getWeeklyReview,
  recordWeeklyReview,
} from "./domain/strategy-lab.js";
import { selectRoleInterface } from "./ui/router.js";
import { createRealmCard } from "./ui/realm-card.js";
import { createDefaultState, createLocalStore } from "./storage/local-store.js";
import { MISSION_CATALOG } from "./data/mission-catalog.js";
import {
  buildSharedPlanSummary,
  createSharedPlanUrl,
  readSharedPlan,
} from "./domain/shared-plan.js";
import { qrcode } from "./vendor/qrcode.mjs";
import { getRestSuggestion } from "./domain/healthy-immersion.js";
import {
  CLOSING_PROMPTS,
  ENERGY_OPTIONS,
  EVIDENCE_OPTIONS,
  SUPPORT_NEED_OPTIONS,
  buildLocalMetrics,
  buildMissionBrief,
  getMissionRecommendation,
  getParentConversationPrompt,
  getRepeatReflection,
  getStrategyCarryover,
  getTeacherLoadGuidance,
} from "./domain/gamification-coach.js";
import { appendMeasurement } from "./domain/local-measurement.js";
import {
  PRIVACY_LAYERS,
  analyzeTeacherPlan,
  buildBadgePaths,
  buildFacilitationCard,
  buildFourteenDayPath,
  getFairCheckInXp,
  getMissionSuccessCue,
  normalizeReflection,
} from "./domain/gameful-guidance.js";

const app = document.querySelector("#app");

if (!app) {
  throw new Error("找不到應用程式根節點。");
}

const store = createLocalStore(window.localStorage);
const loaded = store.load();
let localState = loaded.state;
let selectedMissionId = null;
let pendingReturnMissionId =
  localState.student?.pendingReturn?.missionId ?? null;
let dockSafetyFrame = null;
let teacherPlanNotice = "";
let teacherTimeBudget = 45;
let restSuggestion = null;
let storageNotice =
  loaded.ok && loaded.status !== "recovered"
    ? ""
    : "本機紀錄目前可能無法保存；請確認瀏覽器儲存權限。";
let platformFiltersByRole = {
  teacher: { group: "all", duration: "all", context: "all" },
  parent: { group: "all", duration: "all", context: "all" },
};
const missionById = new Map(
  MISSION_CATALOG.map((mission) => [mission.id, mission]),
);
let teacherSelectedMissionIds = (
  Array.isArray(localState.teacher?.draftMissionIds)
    ? localState.teacher.draftMissionIds
    : []
).filter((missionId) => missionById.has(missionId));
let teacherAssignmentByMission = {
  ...(localState.teacher?.assignmentByMission ?? {}),
};
let teacherPhaseByMission = {
  ...(localState.teacher?.phaseByMission ?? {}),
};
let teacherClosingPromptId =
  localState.teacher?.closingPromptId ?? CLOSING_PROMPTS[0].id;
let sharedPlan = null;
try {
  if (new URL(window.location.href).searchParams.has("missions")) {
    sharedPlan = readSharedPlan(window.location.href, {
      catalog: MISSION_CATALOG,
    });
  }
} catch {
  sharedPlan = Object.freeze({ invalid: true, missions: Object.freeze([]) });
}

const SUBJECT_SITE_IDS = Object.freeze({
  language: "zizizhuji",
  english: "vocab-duel",
  math: "bxws-math",
  literature: "wenhao-xiaozhuan",
  classical: "wenyan-jieyou-zhan",
  science: "science-hero",
  leadership: "fanren-lianxin",
});

const PLATFORM_GROUP_LABELS = Object.freeze({
  language: "墨海文域",
  leadership: "煉心妖境",
  stem: "星火術域",
  teacher: "引路仙門",
});

const USER_MANUALS = Object.freeze({
  student: {
    tabLabel: "學生版",
    worldLabel: "小行者",
    title: "把每天的一小步，收進自己的護照",
    lead: "不用一次做很多。選一條今天走得動的航線，完成後回來落印，就算前進。",
    steps: [
      {
        title: "選「我是學生」",
        copy: "先決定今天想練的科目，以及願意投入 5、10 或 15 分鐘。",
      },
      {
        title: "從今日修行帖出發",
        copy: "按下任務按鈕後，學習網站會在新分頁開啟；原本的護照頁會保留。",
      },
      {
        title: "完成後回到護照落印",
        copy: "依真實情況選擇完成、部分完成或今天休息，不必為了累積而勉強。",
      },
      {
        title: "查看自己的累積",
        copy: "習光、七燈、妖印與收藏只和自己的投入比較，不和別人排名。",
      },
    ],
    tip: "想少一點干擾時，可開啟「純任務模式」，畫面只留下今天要做的事。",
  },
  parent: {
    tabLabel: "家長版",
    worldLabel: "守燈人",
    title: "陪孩子找到走得動的下一步",
    lead: "這裡重視能持續的節奏。家長負責守燈、提供選擇，不替孩子追趕。",
    steps: [
      {
        title: "選「我是家長」",
        copy: "先看平台卡上的年段、學習內容，以及「這一站會練到什麼」。",
      },
      {
        title: "和孩子一起選一站",
        copy: "依今天的心力與興趣，挑一個 5～15 分鐘能開始的小任務。",
      },
      {
        title: "讓孩子自己完成落印",
        copy: "任務結束後，由孩子判斷完成程度；休息與中斷都不會清除成果。",
      },
      {
        title: "留下同行鼓勵卡",
        copy: "肯定孩子的投入、策略或重新開始，不比較分數，也不催進度。",
      },
    ],
    tip: "比起問「做了幾題」，更適合問：「今天哪一個開始方式對你最有幫助？」",
  },
  teacher: {
    tabLabel: "老師版",
    worldLabel: "引路仙師",
    title: "快速找到適合課堂的學習平台",
    lead: "十二個非會考平台都標示能力目標，方便依課程目的選站，而不是只看遊戲外觀。",
    steps: [
      {
        title: "選「我是老師」",
        copy: "先確認上方七個主域與下方五個延伸平台各自適合的學習情境。",
      },
      {
        title: "依領域、時間與使用情境篩選",
        copy: "可交叉選擇科目、可用時間，以及個人練習、課堂活動或教師成長。",
      },
      {
        title: "先說明任務，再開啟平台",
        copy: "讓學生知道今天要練的能力、可用時間，以及完成後回站落印的方式。",
      },
      {
        title: "用同行鼓勵卡收尾",
        copy: "回饋投入與策略，不建立公開排名，也不要求學生提供姓名或學號。",
      },
    ],
    tip: "共用裝置使用完畢後，可提醒學生確認是否要保留本機紀錄，避免不同使用者混用。",
  },
});

const taipeiDateFormatter = new Intl.DateTimeFormat("en-CA", {
  timeZone: "Asia/Taipei",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});
const displayDateFormatter = new Intl.DateTimeFormat("zh-TW", {
  timeZone: "Asia/Taipei",
  month: "numeric",
  day: "numeric",
});

function node(tagName, { className = "", text = "", attributes = {} } = {}) {
  const element = document.createElement(tagName);
  element.className = className;
  element.textContent = text;
  for (const [name, value] of Object.entries(attributes)) {
    element.setAttribute(name, value);
  }
  return element;
}

function saveLocalState() {
  const result = store.save(localState);
  if (!result.ok) {
    console.warn("本機旅程暫時無法儲存。", result.status);
    storageNotice = "這次變更尚未存進瀏覽器；請保留此頁並稍後重試。";
  } else {
    storageNotice = "";
  }
}

function createStorageNotice() {
  if (!storageNotice) return null;
  const notice = node("aside", {
    className: "storage-notice",
    attributes: { role: "status", "aria-live": "polite" },
  });
  notice.append(node("span", { text: storageNotice }));
  const retry = node("button", { text: "重試保存", attributes: { type: "button" } });
  retry.addEventListener("click", () => {
    saveLocalState();
    render();
  });
  notice.append(retry);
  return notice;
}

function saveTeacherDraft() {
  localState = {
    ...localState,
    teacher: {
      ...localState.teacher,
      draftMissionIds: [...teacherSelectedMissionIds],
      assignmentByMission: { ...teacherAssignmentByMission },
      phaseByMission: { ...teacherPhaseByMission },
      closingPromptId: teacherClosingPromptId,
    },
  };
  saveLocalState();
}

function appendLocalEvent(type, context = {}) {
  try {
    const id =
      window.crypto?.randomUUID?.() ??
      `local_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
    localState = {
      ...localState,
      student: {
        ...localState.student,
        measurementEvents: appendMeasurement(
          localState.student.measurementEvents ?? [],
          {
            id,
            type,
            occurredAt: new Date().toISOString(),
            context,
          },
        ),
      },
    };
  } catch (error) {
    console.warn("本機健康循環事件未記錄。", error);
  }
}

function getCorePlatform(siteId, role = "teacher") {
  return getPlatformsForRole(role).find(
    ({ coreRealm, id }) => coreRealm && id === siteId,
  );
}

function getMissionLearningOutcome(mission) {
  return (
    getCorePlatform(mission.siteId)?.learningOutcome ??
    "依任務內容練習理解、判斷與自我調整。"
  );
}

function getTodayKey() {
  return taipeiDateFormatter.format(new Date());
}

function getTodayReport(missionId) {
  const dateKey = getTodayKey();
  const stored = localState.student.missionHistory?.[dateKey];
  const reports = Array.isArray(stored) ? stored : stored ? [stored] : [];
  return reports.find((report) => report.missionId === missionId) ?? null;
}

function getAllMissionReports() {
  return Object.values(localState.student.missionHistory ?? {})
    .flatMap((value) => (Array.isArray(value) ? value : [value]))
    .filter(Boolean);
}

function createStrategyCarryoverPanel(mission, currentReport) {
  const previous = getAllMissionReports()
    .filter(
      (report) =>
        report.siteId === mission.siteId &&
        report.strategy &&
        report.occurredAt !== currentReport?.occurredAt,
    )
    .sort((left, right) =>
      String(left.occurredAt).localeCompare(String(right.occurredAt)),
    )
    .at(-1);
  if (
    !previous ||
    localState.student.strategyFollowups?.[previous.occurredAt]
  ) {
    return null;
  }
  const strategyLabel =
    STRATEGY_OPTIONS.find(({ id }) => id === previous.strategy)?.label ??
    "上次的方法";
  const section = node("section", {
    className: "strategy-carryover",
    attributes: { "aria-label": "上次策略回問" },
  });
  section.append(
    node("strong", { text: `上次你選擇「${strategyLabel}」` }),
    node("p", { text: "這個方法對今天有什麼影響？不計分，也沒有標準答案。" }),
  );
  const actions = node("div", {
    attributes: { role: "group", "aria-label": "回顧上次策略" },
  });
  for (const [id, label] of [
    ["helpful", "有幫助"],
    ["adjust", "再調整"],
    ["drop", "先放下"],
  ]) {
    const button = node("button", {
      text: label,
      attributes: { type: "button" },
    });
    button.addEventListener("click", () => {
      localState = {
        ...localState,
        student: {
          ...localState.student,
          strategyFollowups: {
            ...(localState.student.strategyFollowups ?? {}),
            [previous.occurredAt]: id,
          },
        },
      };
      appendLocalEvent("strategy_reviewed", {
        missionId: mission.id,
        routeLevel: mission.routeLevel,
        outcome: null,
      });
      saveLocalState();
      render();
    });
    actions.append(button);
  }
  section.append(actions);
  return section;
}

function checkInMission(mission, status, additions = {}) {
  appendLocalEvent("mission_reported", {
    missionId: mission.id,
    routeLevel: mission.routeLevel,
    outcome: status === "rest" ? "skipped" : status,
  });
  if (additions.strategy) {
    appendLocalEvent("strategy_selected", {
      missionId: mission.id,
      routeLevel: mission.routeLevel,
      outcome: status,
    });
  }
  localState = {
    ...localState,
    student: {
      ...recordPassportCheckIn(localState.student, {
        mission,
        status,
        occurredAt: new Date().toISOString(),
        ...additions,
      }),
      pendingReturn: null,
    },
  };
  pendingReturnMissionId = null;
  saveLocalState();
  render();
  window.requestAnimationFrame(() => {
    document
      .querySelector(`[data-feedback-mission="${mission.id}"]`)
      ?.focus({ preventScroll: false });
  });
}

function getMissionReward(mission, status = "complete") {
  return getFairCheckInXp(status, mission.durationMinutes);
}

function hasStudentHistory() {
  return Object.keys(localState.student.missionHistory ?? {}).length > 0;
}

function markMissionLaunched(missionId) {
  pendingReturnMissionId = missionId;
  const startedAt = new Date().toISOString();
  const mission = missionById.get(missionId);
  if (mission) {
    appendLocalEvent("mission_started", {
      missionId,
      routeLevel: mission.routeLevel,
      outcome: null,
    });
  }
  localState = {
    ...localState,
    student: {
      ...localState.student,
      missionStarts: [
        ...(localState.student.missionStarts ?? []).slice(-9),
        { missionId, startedAt },
      ],
      pendingReturn: { missionId, launchedAt: startedAt },
    },
  };
  saveLocalState();
}

function focusPendingReturn() {
  if (!pendingReturnMissionId) return;
  const panel = [...document.querySelectorAll("[data-return-mission]")].find(
    ({ dataset }) => dataset.returnMission === pendingReturnMissionId,
  );
  if (!panel) return;
  const mission = missionById.get(pendingReturnMissionId);
  const starts = localState.student.missionStarts ?? [];
  const latest = [...starts]
    .reverse()
    .find(({ missionId }) => missionId === pendingReturnMissionId);
  if (mission && latest) {
    appendLocalEvent("mission_returned", {
      missionId: mission.id,
      routeLevel: mission.routeLevel,
      elapsedMs: Math.max(0, Date.now() - Date.parse(latest.startedAt)),
      outcome: null,
    });
    restSuggestion = getRestSuggestion({
      selectedMinutes: mission.durationMinutes,
      elapsedMinutes: Math.max(
        0,
        (Date.now() - Date.parse(latest.startedAt)) / 60_000,
      ),
      sessionStarts: starts.map(({ startedAt }) => startedAt),
      now: new Date().toISOString(),
    });
    if (restSuggestion) {
      appendLocalEvent("rest_suggested", {
        missionId: mission.id,
        routeLevel: mission.routeLevel,
        outcome: null,
      });
      saveLocalState();
      render();
    }
  }
  panel.classList.add("mission-return--welcome");
  panel.scrollIntoView({
    behavior: shouldReduceMotion() ? "auto" : "smooth",
    block: "center",
  });
  panel.focus({ preventScroll: true });
  pendingReturnMissionId = null;
}

function shouldReduceMotion() {
  return (
    localState.student.visualPreference.reducedMotion ||
    window.matchMedia?.("(prefers-reduced-motion: reduce)").matches === true
  );
}

function findDefaultMission(home) {
  const preferredSite = SUBJECT_SITE_IDS[home.studentPreferences.primarySubject];
  const preferredMinutes = home.studentPreferences.dailyMinutes;
  const preferredRealm =
    home.realms.find(({ siteId }) => siteId === preferredSite) ?? home.realms[0];

  return (
    preferredRealm.routes.find(
      ({ durationMinutes }) => durationMinutes === preferredMinutes,
    ) ?? preferredRealm.routes[0]
  );
}

function findMission(home) {
  const allMissions = home.realms.flatMap(({ routes }) => routes);
  return (
    allMissions.find(({ id }) => id === selectedMissionId) ??
    findDefaultMission(home)
  );
}

function selectStudentMission(realm, mission) {
  selectedMissionId = mission.id;
  localState = {
    ...localState,
    student: {
      ...localState.student,
      primarySubject: realm.subject,
      dailyMinutes: mission.durationMinutes,
    },
  };
  saveLocalState();
  render();
  document.querySelector("#daily-mission-title")?.focus();
}

function createGuideFigure(guide) {
  const figure = node("figure", { className: "guide-figure" });
  const image = node("img");
  image.src = guide.assetUrl;
  image.alt = guide.alt;
  image.width = 512;
  image.height = 512;

  const fallback = node("p", {
    className: "guide-fallback",
    text: guide.fallback,
    attributes: {
      role: "img",
      "aria-label": guide.alt,
    },
  });
  fallback.hidden = true;

  image.addEventListener("error", () => {
    image.hidden = true;
    fallback.hidden = false;
  });
  figure.append(image, fallback);
  return figure;
}

function createManualRoleContent(manual) {
  const content = node("section", {
    className: "manual-role-content",
    attributes: {
      id: "manual-role-content",
      "aria-live": "polite",
      "aria-atomic": "true",
    },
  });
  const heading = node("div", { className: "manual-role-heading" });
  heading.append(
    node("span", { text: manual.worldLabel }),
    node("h3", { text: manual.title }),
    node("p", { text: manual.lead }),
  );

  const steps = node("ol", { className: "manual-step-list" });
  manual.steps.forEach((step, index) => {
    const copy = node("div");
    copy.append(
      node("strong", { text: step.title }),
      node("p", { text: step.copy }),
    );
    const item = node("li");
    item.append(
      node("b", {
        text: String(index + 1).padStart(2, "0"),
        attributes: { "aria-hidden": "true" },
      }),
      copy,
    );
    steps.append(item);
  });

  const tip = node("aside", {
    className: "manual-tip",
    attributes: { "aria-label": "使用提醒" },
  });
  tip.append(
    node("strong", { text: "同行提醒" }),
    node("p", { text: manual.tip }),
  );
  content.append(heading, steps, tip);
  return content;
}

function createUserManualDialog(initialRole) {
  const dialog = node("dialog", {
    className: "manual-dialog",
    attributes: {
      id: "user-manual-dialog",
      "aria-labelledby": "user-manual-title",
      "aria-describedby": "user-manual-lead",
    },
  });
  const surface = node("div", { className: "manual-dialog__surface" });
  const top = node("header", { className: "manual-dialog__header" });
  const titleCopy = node("div");
  titleCopy.append(
    node("p", { className: "manual-eyebrow", text: "FIRST VOYAGE GUIDE" }),
    node("h2", {
      text: "三種身分使用說明書",
      attributes: { id: "user-manual-title" },
    }),
    node("p", {
      className: "manual-lead",
      text: "先選身分，再照四步開始；之後也能隨時回來查看。",
      attributes: { id: "user-manual-lead" },
    }),
  );
  const closeButton = node("button", {
    className: "manual-close-button",
    text: "×",
    attributes: {
      type: "button",
      "aria-label": "關閉使用說明書",
    },
  });
  closeButton.addEventListener("click", () => dialog.close());
  top.append(titleCopy, closeButton);

  const switcher = node("div", {
    className: "manual-role-switcher",
    attributes: {
      role: "group",
      "aria-label": "選擇說明書身分",
    },
  });
  const contentMount = node("div", { className: "manual-content-mount" });
  const roleButtons = new Map();

  const showRole = (roleId) => {
    const selectedRole = USER_MANUALS[roleId] ? roleId : "student";
    for (const [id, button] of roleButtons) {
      button.setAttribute("aria-pressed", String(id === selectedRole));
    }
    contentMount.replaceChildren(
      createManualRoleContent(USER_MANUALS[selectedRole]),
    );
  };

  for (const [roleId, manual] of Object.entries(USER_MANUALS)) {
    const button = node("button", {
      className: "manual-role-button",
      text: manual.tabLabel,
      attributes: {
        type: "button",
        "aria-pressed": "false",
        "aria-controls": "manual-role-content",
      },
    });
    button.addEventListener("click", () => showRole(roleId));
    roleButtons.set(roleId, button);
    switcher.append(button);
  }

  const privacy = node("aside", {
    className: "manual-privacy",
    attributes: { "aria-label": "資料保存說明" },
  });
  privacy.append(
    node("strong", { text: "不必註冊，也不蒐集身分資料" }),
    node("p", {
      text: "個人學習資料只保存在這台裝置的瀏覽器；換裝置或清除瀏覽資料後，不會自動同步。",
    }),
  );

  const doneButton = node("button", {
    className: "manual-done-button",
    text: "看懂了，開始使用",
    attributes: { type: "button" },
  });
  doneButton.addEventListener("click", () => dialog.close());
  surface.append(top, switcher, contentMount, privacy, doneButton);
  dialog.append(surface);
  dialog.addEventListener("click", (event) => {
    if (event.target === dialog) dialog.close();
  });
  showRole(initialRole);
  return dialog;
}

function createRolePanel(home, activeRole) {
  const activeRoleLabel =
    home.roles.find(({ id }) => id === activeRole)?.label ?? "學生";
  const panel = node("details", {
    className: "role-panel",
    attributes: { "aria-label": "選擇使用身份" },
  });
  panel.open = !localState.activeRole;
  panel.append(
    node("summary", {
      className: "role-summary",
      text: localState.activeRole
        ? `目前身份：${activeRoleLabel}・切換身份`
        : "先選擇今天的身份",
    }),
  );
  const content = node("div", { className: "role-panel__content" });
  content.append(
    node("p", {
      className: "role-intro",
      text: "不必註冊，先選擇你今天如何同行",
    }),
  );

  const switcher = node("div", {
    className: "role-switcher",
    attributes: { role: "group", "aria-label": "使用身份" },
  });

  for (const role of home.roles) {
    const button = node("button", {
      className: "role-button",
      text: `我是${role.label}｜成為${role.worldLabel}`,
      attributes: {
        type: "button",
        "aria-pressed": String(role.id === activeRole),
      },
    });
    button.addEventListener("click", () => {
      const selection = selectRoleInterface(role.id);
      localState = { ...localState, activeRole: selection.activeRole };
      saveLocalState();
      render();
    });
    switcher.append(button);
  }

  content.append(switcher);
  panel.append(content);
  return panel;
}

function createWorldGuide() {
  if (
    localState.student.visualPreference.worldGuideDismissed ||
    hasStudentHistory()
  ) {
    return null;
  }

  const guide = node("aside", {
    className: "world-guide",
    attributes: { "aria-label": "妖界詞語小提示" },
  });
  const copy = node("div");
  copy.append(
    node("strong", { text: "第一次來？三個詞就能開始" }),
    node("p", {
      text: "航線＝今天的任務・落印＝記錄完成・習光＝自己的成長點數",
    }),
  );
  const dismiss = node("button", {
    text: "知道了",
    attributes: { type: "button" },
  });
  dismiss.addEventListener("click", () => {
    localState = {
      ...localState,
      student: {
        ...localState.student,
        visualPreference: {
          ...localState.student.visualPreference,
          worldGuideDismissed: true,
        },
      },
    };
    saveLocalState();
    render();
  });
  guide.append(copy, dismiss);
  return guide;
}

function createMissionSwitcher(home, mission) {
  const switcher = node("details", { className: "mission-switcher" });
  switcher.append(
    node("summary", { text: "換科目／自己選妖域" }),
  );
  const options = node("div", {
    className: "mission-switcher__options",
    attributes: { role: "group", "aria-label": "選擇今日妖域" },
  });

  for (const realm of home.realms) {
    const nextMission =
      realm.routes.find(
        ({ durationMinutes }) =>
          durationMinutes === mission.durationMinutes,
      ) ?? realm.routes[0];
    const button = node("button", {
      text: `${realm.name}｜${nextMission.subject}`,
      attributes: {
        type: "button",
        "aria-pressed": String(nextMission.id === mission.id),
      },
    });
    button.addEventListener("click", () =>
      selectStudentMission(realm, nextMission),
    );
    options.append(button);
  }
  switcher.append(options);
  return switcher;
}

function createMissionOutlook(mission) {
  const snapshot = buildPassportSnapshot(localState.student);
  const lights = getSevenLights({
    activeDays: localState.student.activeDays,
  });
  const outlook = node("div", {
    className: "mission-outlook",
    attributes: { "aria-label": "完成任務後的成長預覽" },
  });
  outlook.append(
    node("span", {
      text: `今日微目標：${getMissionSuccessCue(mission)}`,
    }),
    node("span", {
      text: `七燈 ${lights.litCount}／7・不必連續`,
    }),
  );
  return outlook;
}

function createDailyFlavorCard(mission) {
  const flavor = getDailyFlavor({
    dateKey: getTodayKey(),
    siteId: mission.siteId,
  });
  const card = node("aside", {
    className: "daily-flavor",
    attributes: { "aria-label": "今日霧海變化" },
  });
  card.append(
    node("div", {
      className: "daily-flavor__heading",
      text: `今日霧海變化・${flavor.label}`,
    }),
    node("p", { text: flavor.message }),
    node("p", {
      className: "daily-flavor__collectible",
      text: flavor.collectibleHint,
    }),
    node("p", {
      className: "daily-flavor__clue",
      text: `今日線索：${mission.curiosityPrompt}`,
    }),
  );
  return card;
}

function createMissionLink(mission, { compact = false } = {}) {
  const link = node("a", {
    className: compact ? "return-player-hud__cta" : "primary-cta",
    text: compact
      ? `繼續 ${mission.durationMinutes} 分鐘任務`
      : `開始 ${mission.durationMinutes} 分鐘${mission.subject}任務`,
    attributes: {
      href: mission.url,
      "aria-label": `開新分頁前往${mission.subject}任務：${mission.title}`,
    },
  });
  link.target = compact ? "_blank" : "_self";
  if (compact) link.rel = "noopener noreferrer";
  link.addEventListener("click", () => markMissionLaunched(mission.id));
  return link;
}

function createReturnPlayerHud(home, mission) {
  const hud = node("section", {
    className: "return-player-hud",
    attributes: { "aria-labelledby": "return-player-heading" },
  });
  const copy = node("div", { className: "return-player-hud__copy" });
  copy.append(
    node("p", { className: "eyebrow", text: "歡迎回來・延續上次設定" }),
    node("h2", {
      text: mission.title,
      attributes: { id: "return-player-heading" },
    }),
    node("p", {
      text: `${mission.subject}・${mission.durationMinutes} 分鐘・完成可得＋${getMissionReward(mission)} 習光`,
    }),
  );

  const subjects = node("div", {
    className: "return-player-hud__subjects",
    attributes: { role: "group", "aria-label": "快速更換網站" },
  });
  for (const realm of home.realms) {
    const nextMission =
      realm.routes.find(
        ({ durationMinutes }) =>
          durationMinutes === mission.durationMinutes,
      ) ?? realm.routes[0];
    const button = node("button", {
      text: realm.name,
      attributes: {
        type: "button",
        "aria-pressed": String(nextMission.id === mission.id),
      },
    });
    button.addEventListener("click", () =>
      selectStudentMission(realm, nextMission),
    );
    subjects.append(button);
  }

  hud.append(copy, subjects, createMissionLink(mission, { compact: true }));
  return hud;
}

function createQuickStartPanel(home, mission) {
  const allMissions = home.realms.flatMap(({ routes }) => routes);
  const sameRealmMissions = allMissions.filter(
    ({ siteId }) => siteId === mission.siteId,
  );
  const weeklyStrategy = getStrategyCarryover(
    localState.student.weeklyStrategyReviews ?? [],
  );
  const energyId = localState.student.gameplay?.energyId ?? "quick";
  const recommendation = getMissionRecommendation({
    missions: sameRealmMissions,
    energyId,
    northStar: localState.student.northStar,
    weeklyStrategyId: weeklyStrategy?.strategyId ?? null,
  });
  const section = node("section", {
    className: "quick-start-panel",
    attributes: { "aria-labelledby": "quick-start-heading" },
  });
  section.append(
    node("p", { className: "eyebrow", text: "今天的心力・建議不是規定" }),
    node("h2", {
      text: "今天想怎麼開始？",
      attributes: { id: "quick-start-heading" },
    }),
    node("p", {
      className: "recommendation-reason",
      text: recommendation.reason,
    }),
    node("p", {
      className: "recommendation-outcome",
      text: `今天會練到：${getMissionLearningOutcome(recommendation.mission)}`,
    }),
  );
  const doors = node("div", {
    className: "quick-start-doors",
    attributes: { role: "group", "aria-label": "快速開始方式" },
  });
  for (const option of ENERGY_OPTIONS) {
    const optionMission =
      sameRealmMissions.find(
        ({ durationMinutes }) =>
          durationMinutes === option.durationMinutes,
      ) ?? mission;
    const button = node("button", {
      text: `${option.label}｜${option.durationMinutes} 分鐘`,
      attributes: {
        type: "button",
        "aria-pressed": String(energyId === option.id),
      },
    });
    button.addEventListener("click", () => {
      localState = {
        ...localState,
        student: {
          ...localState.student,
          dailyMinutes: option.durationMinutes,
          gameplay: {
            ...(localState.student.gameplay ?? {}),
            energyId: option.id,
          },
        },
      };
      selectedMissionId = optionMission.id;
      saveLocalState();
      render();
      document.querySelector("#daily-mission-title")?.focus();
    });
    doors.append(button);
  }
  const suggested = node("button", {
    className: "quick-start-recommendation",
    text: `採用推薦：${recommendation.mission.title}`,
    attributes: { type: "button" },
  });
  suggested.addEventListener("click", () => {
    selectedMissionId = recommendation.mission.id;
    render();
    document.querySelector("#daily-mission-title")?.focus();
  });
  section.append(doors, suggested);
  return section;
}

function createSupportNeedCard() {
  const selectedId =
    localState.student.gameplay?.supportNeedId ?? SUPPORT_NEED_OPTIONS[0].id;
  const selected =
    SUPPORT_NEED_OPTIONS.find(({ id }) => id === selectedId) ??
    SUPPORT_NEED_OPTIONS[0];
  const section = node("section", {
    className: "support-need-card",
    attributes: { "aria-labelledby": "support-need-heading" },
  });
  section.append(
    node("p", { className: "eyebrow", text: "我的同行方式・只記在本機" }),
    node("h2", {
      text: "我現在需要怎樣的陪伴？",
      attributes: { id: "support-need-heading" },
    }),
  );
  const choices = node("div", {
    className: "support-need-options",
    attributes: { role: "group", "aria-label": "選擇需要的陪伴方式" },
  });
  for (const option of SUPPORT_NEED_OPTIONS) {
    const button = node("button", {
      text: option.label,
      attributes: {
        type: "button",
        "aria-pressed": String(option.id === selected.id),
      },
    });
    button.addEventListener("click", () => {
      localState = {
        ...localState,
        student: {
          ...localState.student,
          gameplay: {
            ...(localState.student.gameplay ?? {}),
            supportNeedId: option.id,
          },
        },
      };
      saveLocalState();
      render();
    });
    choices.append(button);
  }
  const preview = node("blockquote", {
    className: "support-need-preview",
    text: selected.message,
  });
  const status = node("p", {
    className: "support-need-status",
    attributes: { "aria-live": "polite" },
  });
  const copy = node("button", {
    text: "複製我的同行需求卡",
    attributes: { type: "button" },
  });
  copy.addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText(selected.message);
      status.textContent = "已複製；你可以自己決定要不要傳給同行者。";
    } catch {
      status.textContent = "無法自動複製，可直接選取上方文字。";
    }
  });
  section.append(choices, preview, copy, status);
  return section;
}

function createHealthyRestCard() {
  if (!restSuggestion) return null;
  const card = node("aside", {
    className: "healthy-rest-card",
    attributes: { "aria-label": "健康休息提醒", "aria-live": "polite" },
  });
  card.append(
    node("strong", { text: "先讓眼睛和腦袋喘口氣？" }),
    node("p", { text: restSuggestion.message }),
  );
  const actions = node("div");
  const rest = node("button", {
    text: "先休息一下",
    attributes: { type: "button" },
  });
  const continueButton = node("button", {
    text: "我想繼續",
    attributes: { type: "button" },
  });
  const dismiss = (outcome) => {
    if (outcome === "complete") {
      appendLocalEvent("rest_adopted", {
        missionId: pendingReturnMissionId,
        outcome,
      });
    }
    restSuggestion = null;
    render();
  };
  rest.addEventListener("click", () => dismiss("complete"));
  continueButton.addEventListener("click", () => dismiss("skipped"));
  actions.append(rest, continueButton);
  card.append(actions);
  return card;
}

function createLearningPathPanel() {
  const snapshot = buildPassportSnapshot(localState.student);
  const sevenLights = getSevenLights({
    activeDays: localState.student.activeDays ?? [],
  });
  const reports = Object.values(localState.student.missionHistory ?? {})
    .flatMap((value) => (Array.isArray(value) ? value : [value]))
    .filter(Boolean);
  const restDays = reports
    .filter(({ status }) => status === "rest")
    .map(({ occurredAt }) => taipeiDateFormatter.format(new Date(occurredAt)));
  const path = buildFourteenDayPath(
    localState.student.activeDays,
    restDays,
    new Date(),
  );
  const section = node("section", {
    className: "learning-path-panel",
    attributes: { id: "learning-path", "aria-labelledby": "learning-path-heading" },
  });
  section.append(
    node("h2", {
      text: `七燈書・第 ${sevenLights.currentBook} 冊`,
      attributes: { id: "learning-path-heading" },
    }),
    node("p", {
      text: `每 7 個投入日永久完成一冊，目前已完成 ${sevenLights.completedBooks} 冊；不必連續，休息也會留下節奏記號。下方保留最近 14 天供自己回望。`,
    }),
  );
  const grid = node("ol", {
    className: "fourteen-day-path",
    attributes: { "aria-label": "最近十四天投入與休息紀錄" },
  });
  for (const day of path) {
    const labels = { active: "點亮", rest: "休息", open: "留白" };
    grid.append(
      node("li", {
        className: `day-path day-path--${day.state}`,
        text: `${day.dateKey.slice(5)} ${labels[day.state]}`,
      }),
    );
  }
  const badges = node("div", { className: "badge-paths" });
  for (const badge of buildBadgePaths(localState.student, snapshot)) {
    const button = node("button", {
      text: badge.unlocked
        ? `${badge.label}・已取得`
        : `${badge.label} ${badge.current}／${badge.target}`,
      attributes: {
        type: "button",
        "aria-pressed": String(
          localState.student.trackedBadgeId === badge.id,
        ),
      },
    });
    button.addEventListener("click", () => {
      localState = {
        ...localState,
        student: { ...localState.student, trackedBadgeId: badge.id },
      };
      saveLocalState();
      render();
    });
    badges.append(button);
  }
  section.append(grid, node("h3", { text: "我想追的徽章" }), badges);
  return section;
}

function createMissionLearningBrief(mission) {
  const brief = buildMissionBrief({
    mission,
    learningOutcome: getMissionLearningOutcome(mission),
  });
  const section = node("section", {
    className: "mission-learning-brief",
    attributes: { "aria-label": "任務學習目標與完成方式" },
  });
  section.append(
    node("strong", { text: "今天會練到什麼" }),
    node("p", { text: brief.learningOutcome }),
    node("strong", { text: "做到什麼算完成" }),
    node("p", { text: brief.doneDefinition }),
  );
  const reward = node("details", { className: "mission-reward-details" });
  reward.append(
    node("summary", { text: "查看投入紀錄方式" }),
    node("p", {
      text: `${brief.rewardNote} 這次完整或部分完成的基礎值皆為 ${getMissionReward(mission)} 習光；同日投入超過 30 分鐘後會減半，60 分鐘後停止增加，足跡仍會完整保留。`,
    }),
  );
  section.append(reward);
  return section;
}

function createStudentHero(home, mission, focusMode) {
  const hero = node("section", {
    className: "hero",
    attributes: {
      "aria-labelledby": focusMode ? "daily-mission-title" : "journey-heading",
    },
  });

  const stage = node("div", { className: "map-stage" });
  const copy = node("div");
  copy.append(
    node("p", { className: "eyebrow", text: "萬妖習行錄・霧海入口" }),
    node("h1", { text: "每天一小步，讓習光長成路", attributes: { id: "journey-heading" } }),
    node("p", {
      className: "hero-lead",
      text: "不用一口氣翻過整座山。選一條今天走得動的航線，讓微小投入在時間裡慢慢複利。",
    }),
  );
  stage.append(copy, createGuideFigure(home.guide));

  const scroll = node("article", {
    className: "mission-scroll",
    attributes: { "aria-labelledby": "daily-mission-title" },
  });
  scroll.append(
    node("p", { className: "mission-kicker", text: "今日修行帖" }),
    node(focusMode ? "h1" : "h2", {
      text: mission.title,
      attributes: { id: "daily-mission-title", tabindex: "-1" },
    }),
  );

  const meta = node("div", { className: "mission-meta" });
  meta.append(
    node("span", { className: "mission-chip", text: mission.subject }),
    node("span", {
      className: "mission-chip",
      text: `${mission.durationMinutes} 分鐘`,
    }),
    node("span", {
      className: "mission-chip",
      text:
        mission.routeLevel === "light"
          ? "輕量航線"
          : mission.routeLevel === "challenge"
            ? "挑戰航線"
            : "標準航線",
    }),
  );
  scroll.append(
    createMissionLearningBrief(mission),
    meta,
    createMissionOutlook(mission),
  );
  const newTab = node("a", {
    className: "secondary-mission-link",
    text: "另開分頁",
    attributes: {
      href: mission.url,
      target: "_blank",
      rel: "noopener noreferrer",
    },
  });
  newTab.addEventListener("click", () => markMissionLaunched(mission.id));
  scroll.append(
    createMissionLink(mission),
    newTab,
    node("p", {
      className: "mission-note",
      text: "主按鈕會在同分頁開啟，可用瀏覽器返回鍵回到護照；系統不讀取外站成績。",
    }),
    createDailyFlavorCard(mission),
    createMissionSwitcher(home, mission),
    createMissionReturnPanel(mission, home.guideCelebration),
  );

  hero.append(stage, scroll);
  return hero;
}

function createCheckInFeedback(mission, report, guideCelebration) {
  const feedback = node("section", {
    className: `checkin-feedback checkin-feedback--${report.status}`,
    attributes: {
      tabindex: "-1",
      "data-feedback-mission": mission.id,
      "aria-live": "polite",
      "aria-label": "落印結果",
    },
  });
  const reaction = node("figure", { className: "checkin-reaction" });
  const image = node("img");
  image.src = guideCelebration.assetUrl;
  image.alt = guideCelebration.alt;
  image.width = 256;
  image.height = 256;
  const fallback = node("span", {
    text: guideCelebration.fallback,
    attributes: { role: "img", "aria-label": guideCelebration.alt },
  });
  fallback.hidden = true;
  image.addEventListener("error", () => {
    image.hidden = true;
    fallback.hidden = false;
  });
  reaction.append(image, fallback);

  const copy = node("div");
  copy.append(node("strong", { text: "已記錄，可以離開；現在也可以安心結束" }));
  if (report.status === "rest") {
    copy.append(
      node("p", {
        text: "今天安心歇腳，不扣習光；走過的路與收藏都不會消失。",
      }),
    );
  } else {
    const lights = getSevenLights({
      activeDays: localState.student.activeDays,
    });
    const snapshot = buildPassportSnapshot(localState.student);
    const earnedXp =
      snapshot.recentHistory.find(
        (item) =>
          item.missionId === mission.id &&
          item.occurredAt === report.occurredAt,
      )?.earnedXp ?? 0;
    const mystery = getLatestMystery(localState.student);
    const rewards = node("div", { className: "checkin-rewards" });
    rewards.append(
      node("span", {
        text:
          earnedXp > 0
            ? `＋${earnedXp} 習光`
            : "今日習光已柔性收束，足跡仍完整保存",
      }),
      node("span", { text: `七燈 ${lights.litCount}／7` }),
    );
    copy.append(
      rewards,
      node("p", {
        className: "checkin-mystery",
        text: mystery?.message ?? "霧海記住了你今天走過的路。",
      }),
      node("details", {
        className: "checkin-next-target",
      }),
    );
    const target = copy.querySelector(".checkin-next-target");
    target.append(
      node("summary", { text: "想看下一個收藏目標" }),
      node("p", {
        text: snapshot.nextRelic
          ? `下一收藏：${snapshot.nextRelic.label}，目前 ${snapshot.nextRelic.progressXp}／${snapshot.nextRelic.unlockAt} 習光；七燈還差 ${Math.max(0, 7 - lights.litCount)} 盞。`
          : `七域收藏已全部解鎖；七燈還差 ${Math.max(0, 7 - lights.litCount)} 盞。`,
      }),
    );
  }
  const actions = node("div", { className: "checkin-closure-actions" });
  const done = node("button", {
    className: "primary-closure",
    text: "收好護照，今天到這裡",
    attributes: { type: "button" },
  });
  const passport = node("button", {
    text: "查看護照變化",
    attributes: { type: "button" },
  });
  const another = node("button", {
    text: "再選一條 5 分鐘航線",
    attributes: { type: "button" },
  });
  done.addEventListener("click", () => feedback.classList.add("checkin-feedback--closed"));
  passport.addEventListener("click", () =>
    document.querySelector(".passport-section")?.scrollIntoView({
      behavior: shouldReduceMotion() ? "auto" : "smooth",
    }),
  );
  another.addEventListener("click", () =>
    document.querySelector("#realm-heading")?.scrollIntoView({
      behavior: shouldReduceMotion() ? "auto" : "smooth",
    }),
  );
  actions.append(done, passport, another);
  copy.append(actions);
  feedback.append(reaction, copy);
  return feedback;
}

function createMissionReturnPanel(mission, guideCelebration) {
  const report = getTodayReport(mission.id);
  const panel = node("section", {
    className: "mission-return",
    attributes: {
      tabindex: "-1",
      "data-return-mission": mission.id,
      "aria-label": "回到護照落印",
    },
  });
  panel.append(
    node("strong", { text: "回到護照落印" }),
    node("p", {
      text: report
        ? report.status === "complete"
          ? "今天這一步已經收進護照。"
          : report.status === "partial"
            ? "走到哪裡都算數，這次投入已經收進護照。"
            : "今天安心歇腳，走過的路與收藏都不會消失。"
        : "從外站回來後，選擇最符合今天情況的一項。",
    }),
  );
  const repeat = getRepeatReflection(
    getAllMissionReports().filter(
      ({ occurredAt }) => occurredAt !== report?.occurredAt,
    ),
    mission.id,
  );
  if (repeat) {
    panel.append(
      node("aside", {
        className: "repeat-reflection",
        text: repeat.prompt,
      }),
    );
  }
  const strategyCarryover = createStrategyCarryoverPanel(mission, report);
  if (strategyCarryover) panel.append(strategyCarryover);

  const choices = node("div", {
    className: "checkin-options",
    attributes: { role: "group", "aria-label": "今日任務狀態" },
  });
  for (const option of [
    { id: "complete", label: "完成了" },
    { id: "partial", label: "做了一部分" },
    { id: "rest", label: "今天先休息" },
  ]) {
    const button = node("button", {
      className: "checkin-button",
      text: option.label,
      attributes: {
        type: "button",
        "aria-pressed": String(report?.status === option.id),
      },
    });
    button.addEventListener("click", () => checkInMission(mission, option.id));
    choices.append(button);
  }
  panel.append(choices);

  if (report) {
    panel.append(createCheckInFeedback(mission, report, guideCelebration));
  }

  if (report && report.status !== "rest") {
    const structured = normalizeReflection(report.reflection);
    const optional = node("details", { className: "optional-followup" });
    optional.append(
      node("summary", { text: "有力氣再補（選填）" }),
    );
    const evidenceOptions = node("div", {
      className: "learning-evidence-options",
      attributes: { role: "group", "aria-label": "快速留下學習證據" },
    });
    evidenceOptions.append(node("span", { text: "今天最接近：" }));
    // 既有快速證據「我弄懂了一個重點」由 EVIDENCE_OPTIONS 保留並集中管理。
    for (const evidence of EVIDENCE_OPTIONS) {
      const button = node("button", {
        text: evidence.label,
        attributes: {
          type: "button",
          "aria-pressed": String(
            report.evidenceId === evidence.id ||
              structured.evidence === evidence.label,
          ),
        },
      });
      button.addEventListener("click", () =>
        checkInMission(mission, report.status, {
          strategy: report.strategy ?? null,
          evidenceId: evidence.id,
          reflection: { ...structured, evidence: evidence.label },
        }),
      );
      evidenceOptions.append(button);
    }
    optional.append(evidenceOptions);
    if (report.status === "partial") {
      const strategy = node("div", { className: "strategy-lab" });
      strategy.append(
        node("span", { text: "下次換個走法：" }),
      );
      for (const option of STRATEGY_OPTIONS) {
        const button = node("button", {
          text: option.label,
          attributes: {
            type: "button",
            "aria-pressed": String(report.strategy === option.id),
            title: option.guidance,
          },
        });
        button.addEventListener("click", () =>
          checkInMission(mission, "partial", {
            strategy: option.id,
            evidenceId: report.evidenceId ?? null,
            reflection: structured,
          }),
        );
        strategy.append(button);
      }
      optional.append(strategy);
    }
    const reflection = node("label", { className: "reflection-field" });
    reflection.append(
      node("span", { text: mission.completionPrompt }),
    );
    const input = node("input", {
      attributes: {
        type: "text",
        maxlength: "120",
        placeholder: "可留白，只記在這台裝置",
        value: structured.note,
      },
    });
    input.value = structured.note;
    const save = node("button", {
      text: "保存我的發現",
      attributes: { type: "button" },
    });
    save.addEventListener("click", () =>
      checkInMission(mission, report.status, {
        strategy: report.strategy ?? null,
        evidenceId: report.evidenceId ?? null,
        reflection: { ...structured, note: input.value.trim() },
      }),
    );
    reflection.append(input, save);
    const share = node("label", { className: "reflection-share" });
    const checkbox = node("input", {
      attributes: {
        type: "checkbox",
        checked: structured.shareWithParent ? "" : null,
      },
    });
    checkbox.checked = structured.shareWithParent;
    checkbox.addEventListener("change", () =>
      checkInMission(mission, report.status, {
        strategy: report.strategy ?? null,
        evidenceId: report.evidenceId ?? null,
        reflection: {
          ...structured,
          shareWithParent: checkbox.checked,
        },
      }),
    );
    share.append(checkbox, node("span", { text: "願意讓家長看見這則發現" }));
    optional.append(reflection);
    optional.append(share);
    panel.append(optional);
  }

  return panel;
}

function createWeeklyStrategyReview() {
  const review = getWeeklyReview({
    activeDays: localState.student.activeDays,
    reviews: localState.student.weeklyStrategyReviews ?? [],
  });
  if (!review) return null;

  const section = node("section", {
    className: "weekly-strategy-review",
    attributes: {
      "aria-labelledby": `weekly-strategy-${review.milestone}`,
    },
  });
  section.append(
    node("p", {
      className: "eyebrow",
      text: `走過 ${review.milestone} 個活躍日・只記在這台裝置`,
    }),
    node("h3", {
      text: "這七步，哪個開始方式最適合你？",
      attributes: { id: `weekly-strategy-${review.milestone}` },
    }),
    node("p", {
      text: "不是考試，也不判斷成績；選一個最接近的答案，幫下一段路更好開始。",
    }),
  );

  const choices = node("div", {
    className: "weekly-strategy-review__choices",
    attributes: { role: "group", "aria-label": "選擇這一週的學習策略" },
  });
  const recordChoice = (strategyId) => {
    const weeklyStrategyReviews = recordWeeklyReview(
      localState.student.weeklyStrategyReviews ?? [],
      {
        milestone: review.milestone,
        strategyId,
        reviewedAt: new Date().toISOString(),
      },
    );
    localState = {
      ...localState,
      student: {
        ...localState.student,
        weeklyStrategyReviews,
      },
    };
    saveLocalState();
    render();
  };

  for (const option of WEEKLY_STRATEGY_OPTIONS) {
    const button = node("button", {
      text: option.label,
      attributes: { type: "button" },
    });
    button.addEventListener("click", () => recordChoice(option.id));
    choices.append(button);
  }
  const skip = node("button", {
    className: "weekly-strategy-review__skip",
    text: "這次先不選",
    attributes: { type: "button" },
  });
  skip.addEventListener("click", () => recordChoice(null));
  section.append(choices, skip);
  return section;
}

function createPassportSection(home) {
  const snapshot = buildPassportSnapshot(localState.student);
  const section = node("section", {
    className: "passport-section",
    attributes: { "aria-labelledby": "passport-heading" },
  });
  const heading = node("header", { className: "passport-heading" });
  const headingCopy = node("div");
  headingCopy.append(
    node("p", { className: "eyebrow", text: "我的成長資產" }),
    node("h2", {
      text: "我的複利護照",
      attributes: { id: "passport-heading" },
    }),
    node("p", {
      text: "每一次完成、部分完成與安心回航，都會留下自己的路；沒有排行，也不會因中斷而歸零。",
    }),
  );
  heading.append(
    node("span", {
      className: "passport-seal-preview",
      text: snapshot.seal.glyph,
      attributes: { "aria-label": snapshot.seal.label },
    }),
    headingCopy,
  );

  const metrics = node("div", { className: "passport-metrics" });
  for (const [value, label] of [
    [snapshot.xp, "習光"],
    [snapshot.growthStage.label, "成長階段"],
    [snapshot.stamps, "學習落印"],
    [snapshot.restMarks, "歇腳記號"],
    [snapshot.exploredRealms, "已探索主域"],
  ]) {
    const metric = node("article", { className: "passport-metric" });
    metric.append(
      node("strong", { text: String(value) }),
      node("span", { text: label }),
    );
    metrics.append(metric);
  }

  const progress = node("div", {
    className: "passport-progress growth-stage-note",
  });
  progress.append(
    node("strong", { text: `目前階段：${snapshot.growthStage.label}` }),
    node("span", {
      text: `${snapshot.growthStage.description} 階段依探索、策略與回顧形成，不靠重複刷習光升級。`,
    }),
  );

  const realmMap = node("section", {
    className: "realm-growth-map",
    attributes: { "aria-labelledby": "realm-growth-map-heading" },
  });
  realmMap.append(
    node("h3", {
      text: "七域能力足跡",
      attributes: { id: "realm-growth-map-heading" },
    }),
    node("p", {
      text: "不同任務與學習證據會讓妖域從初見、甦醒到復明；同一任務重複不會刷階。",
    }),
  );
  const realmMapGrid = node("div");
  if (snapshot.realmProgress.length === 0) {
    realmMapGrid.append(
      node("p", { text: "完成第一條航線後，能力足跡會從這裡亮起。" }),
    );
  } else {
    for (const realm of snapshot.realmProgress) {
      const platform = getCorePlatform(realm.siteId, "student");
      const card = node("article");
      card.append(
        node("strong", { text: platform?.title ?? realm.siteId }),
        node("span", { text: realm.stage.label }),
        node("p", {
          text: `${realm.distinctMissions} 條不同航線・${realm.evidenceCount} 則學習證據`,
        }),
        node("small", { text: realm.next }),
      );
      realmMapGrid.append(card);
    }
  }
  realmMap.append(realmMapGrid);

  const settings = node("div", { className: "passport-settings" });
  const northStar = node("fieldset", { className: "passport-choice" });
  northStar.append(node("legend", { text: "我的北極星" }));
  for (const option of NORTH_STAR_OPTIONS) {
    const button = node("button", {
      text: option.label,
      attributes: {
        type: "button",
        "aria-pressed": String(localState.student.northStar === option.id),
      },
    });
    button.addEventListener("click", () => {
      localState = {
        ...localState,
        student: { ...localState.student, northStar: option.id },
      };
      saveLocalState();
      render();
    });
    northStar.append(button);
  }

  const seals = node("fieldset", { className: "passport-choice" });
  seals.append(node("legend", { text: "我的專屬妖印" }));
  for (const option of PASSPORT_SEALS) {
    const button = node("button", {
      text: `${option.glyph} ${option.label}`,
      attributes: {
        type: "button",
        "aria-pressed": String(snapshot.seal.id === option.id),
      },
    });
    button.addEventListener("click", () => {
      localState = {
        ...localState,
        student: {
          ...localState.student,
          passport: {
            ...(localState.student.passport ?? {}),
            sealId: option.id,
          },
        },
      };
      saveLocalState();
      render();
    });
    seals.append(button);
  }
  settings.append(northStar, seals);

  const collection = node("div", { className: "passport-collection" });
  const badgeCard = node("article", { className: "badge-wall" });
  badgeCard.append(node("h3", { text: "我的徽章牆" }));
  const badges = node("div", {
    className: "badge-list",
    attributes: { role: "group", "aria-label": "選擇代表徽章" },
  });
  if (snapshot.badges.length === 0) {
    badges.append(node("span", { text: "完成第一小步，就會獲得第一枚徽記。" }));
  } else {
    for (const badge of snapshot.badges) {
      const button = node("button", {
        className: "badge-token",
        text: `${badge.glyph} ${badge.label}`,
        attributes: {
          type: "button",
          "aria-pressed": String(snapshot.featuredBadge?.id === badge.id),
          title: badge.achievedAt
            ? `取得於 ${displayDateFormatter.format(new Date(badge.achievedAt))}`
            : "設為護照代表徽章",
        },
      });
      button.addEventListener("click", () => {
        localState = {
          ...localState,
          student: {
            ...localState.student,
            passport: {
              ...(localState.student.passport ?? {}),
              featuredBadgeId: badge.id,
            },
          },
        };
        saveLocalState();
        render();
      });
      badges.append(button);
    }
  }
  badgeCard.append(badges);

  const featuredCard = node("article", { className: "featured-asset" });
  featuredCard.append(node("h3", { text: "稀有收藏展示位" }));
  if (snapshot.featuredRelic) {
    featuredCard.append(
      node("strong", {
        text: `${snapshot.featuredRelic.glyph} ${snapshot.featuredRelic.label}`,
      }),
      node("p", {
        text: `${snapshot.featuredRelic.rarity}收藏・來自${snapshot.featuredRelic.realm}`,
      }),
    );
  } else {
    featuredCard.append(
      node("strong", { text: "第一件收藏正在霧裡等你" }),
      node("p", { text: "完成一條今天走得動的任務，就會讓剪影更清楚。" }),
    );
  }
  if (snapshot.featuredBadge) {
    featuredCard.append(
      node("span", {
        className: "featured-badge",
        text: `代表徽章・${snapshot.featuredBadge.label}`,
      }),
    );
  }

  const mysteryCard = node("article", { className: "mystery-card" });
  const mystery = getLatestMystery(localState.student);
  mysteryCard.append(
    node("h3", { text: "神祕線索" }),
    node("p", {
      text: mystery?.message ?? "完成或部分完成一條航線，霧海才會揭開下一句密語。",
    }),
  );
  collection.append(featuredCard, badgeCard, mysteryCard);

  section.append(heading, metrics, progress, realmMap, settings, collection);
  const weeklyStrategyReview = createWeeklyStrategyReview();
  if (weeklyStrategyReview) {
    section.append(weeklyStrategyReview);
  }

  const cabinet = node("details", {
    className: "collection-cabinet",
    attributes: { "aria-labelledby": "collection-cabinet-heading" },
  });
  cabinet.open = localState.student.gameplay?.collectionExpanded === true;
  const cabinetHeading = node("summary", {
    className: "collection-cabinet__heading",
  });
  const cabinetHeadingCopy = node("div");
  cabinetHeadingCopy.append(
    node("p", { className: "eyebrow", text: "可擁有・可展示・不會消失" }),
    node("h3", {
      text: "妖界收藏櫃",
      attributes: { id: "collection-cabinet-heading" },
    }),
  );
  cabinetHeading.append(cabinetHeadingCopy);
  cabinetHeading.append(
    node("p", {
      text: snapshot.nextRelic
        ? `目前 ${snapshot.xp}／${snapshot.nextRelic.unlockAt} 習光，下一件是「${snapshot.nextRelic.label}」。`
        : "七域收藏已全部解鎖，走過的每一步都留在櫃中。",
    }),
  );
  const cabinetGrid = node("div", { className: "collection-cabinet__grid" });
  for (const relic of snapshot.collection) {
    const card = node("article", {
      className: "relic-card",
      attributes: {
        "data-unlocked": String(relic.unlocked),
        "aria-label": `${relic.label}，${relic.unlocked ? "已解鎖" : "尚未解鎖"}`,
      },
    });
    const art = node("figure", { className: "relic-card__art" });
    const image = node("img");
    image.src = relic.art;
    image.alt = relic.unlocked
      ? `${relic.label}收藏卡面`
      : `${relic.label}尚未解鎖的剪影`;
    image.width = 480;
    image.height = 300;
    art.append(
      image,
      node("span", {
        className: "relic-card__glyph",
        text: relic.glyph,
        attributes: { "aria-hidden": "true" },
      }),
    );
    const copy = node("div", { className: "relic-card__copy" });
    copy.append(
      node("span", {
        className: "relic-card__rarity",
        text: `${relic.rarity}・${relic.realm}`,
      }),
      node("h4", { text: relic.label }),
      node("p", { text: relic.story }),
      node("p", {
        className: "relic-card__meaning",
        text: `這件收藏記錄：${relic.learningMeaning}`,
      }),
    );
    if (relic.unlocked) {
      copy.append(
        node("span", {
          className: "relic-card__date",
          text: relic.acquiredAt
            ? `取得於 ${displayDateFormatter.format(new Date(relic.acquiredAt))}`
            : "已收入收藏櫃",
        }),
      );
      const equip = node("button", {
        text:
          snapshot.featuredRelic?.id === relic.id
            ? "目前展示中"
            : "設為護照展示",
        attributes: {
          type: "button",
          "aria-pressed": String(snapshot.featuredRelic?.id === relic.id),
        },
      });
      equip.addEventListener("click", () => {
        localState = {
          ...localState,
          student: {
            ...localState.student,
            passport: {
              ...(localState.student.passport ?? {}),
              featuredRelicId: relic.id,
            },
          },
        };
        saveLocalState();
        render();
      });
      copy.append(equip);
    } else {
      const relicProgress = node("div", {
        className: "relic-card__progress",
        attributes: {
          role: "progressbar",
          "aria-label": `${relic.label}解鎖進度`,
          "aria-valuemin": "0",
          "aria-valuemax": String(relic.unlockAt),
          "aria-valuenow": String(relic.progressXp),
        },
      });
      const fill = node("span");
      fill.style.width = `${Math.round((relic.progressXp / relic.unlockAt) * 100)}%`;
      relicProgress.append(fill);
      copy.append(
        node("span", {
          className: "relic-card__date",
          text: `${relic.progressXp}／${relic.unlockAt} 習光`,
        }),
        relicProgress,
      );
    }
    card.append(art, copy);
    cabinetGrid.append(card);
  }
  cabinet.append(cabinetHeading, cabinetGrid);
  cabinet.addEventListener("toggle", () => {
    localState = {
      ...localState,
      student: {
        ...localState.student,
        gameplay: {
          ...(localState.student.gameplay ?? {}),
          collectionExpanded: cabinet.open,
        },
      },
    };
    saveLocalState();
  });
  section.append(cabinet);

  const history = node("section", {
    className: "practice-history",
    attributes: { "aria-labelledby": "practice-history-heading" },
  });
  history.append(
    node("h3", {
      text: "我的修行史",
      attributes: { id: "practice-history-heading" },
    }),
  );
  const historyList = node("ol");
  if (snapshot.recentHistory.length === 0) {
    historyList.append(
      node("li", { text: "第一筆足跡會在完成、部分完成或安心休息後出現。" }),
    );
  } else {
    const missionNames = new Map(
      home.realms
        .flatMap(({ routes }) => routes)
        .map(({ id, title }) => [id, title]),
    );
    for (const item of snapshot.recentHistory) {
      const statusLabel =
        item.status === "complete"
          ? "完成"
          : item.status === "partial"
            ? "走了一部分"
            : "安心休息";
      const historyItem = node("li");
      historyItem.append(
        node("time", {
          text: displayDateFormatter.format(new Date(item.occurredAt)),
          attributes: { datetime: item.occurredAt },
        }),
        node("strong", {
          text: missionNames.get(item.missionId) ?? "今日修行",
        }),
        node("span", {
          text:
            item.earnedXp > 0
              ? `${statusLabel}・＋${item.earnedXp} 習光`
              : `${statusLabel}・收藏與足跡都保留`,
        }),
      );
      historyList.append(historyItem);
    }
  }
  history.append(historyList);
  section.append(history);
  if (localState.student.encouragement?.message) {
    const encouragement = node("blockquote", {
      className: "encouragement-card",
      text: localState.student.encouragement.message,
    });
    encouragement.append(
      node("footer", {
        text:
          localState.student.encouragement.sourceRole === "teacher"
            ? "老師留給你的話"
            : localState.student.encouragement.sourceRole === "parent"
              ? "家長留給你的話"
              : "同行者留給你的話",
      }),
    );
    const feedback = node("div", { className: "encouragement-feedback" });
    for (const [id, label] of [
      ["helpful", "這句有幫助"],
      ["self", "我現在想自己走"],
      ["hide", "今天先收起來"],
    ]) {
      const button = node("button", {
        text: label,
        attributes: { type: "button" },
      });
      button.addEventListener("click", () => {
        localState = {
          ...localState,
          student: {
            ...localState.student,
            encouragement: {
              ...localState.student.encouragement,
              helpfulness: id,
            },
          },
        };
        saveLocalState();
        if (id === "hide") encouragement.hidden = true;
        else button.setAttribute("aria-pressed", "true");
      });
      feedback.append(button);
    }
    encouragement.append(feedback);
    section.append(encouragement);
  }
  return section;
}

function createSupportStudio(activeRole) {
  const section = node("section", {
    className: "support-studio",
    attributes: { "aria-labelledby": `${activeRole}-support-heading` },
  });
  section.append(
    node("p", { className: "eyebrow", text: "社交支持・不排名" }),
    node("h2", {
      text: "製作一張同行鼓勵卡",
      attributes: { id: `${activeRole}-support-heading` },
    }),
    node("p", {
      text: "選一句真正能支持孩子的話。鼓勵會留在這台裝置，也能複製後傳給對方。",
    }),
  );

  const toneOptions = node("div", {
    className: "support-tone-options",
    attributes: { role: "group", "aria-label": "鼓勵語氣" },
  });
  const storedMessage = localState.student.encouragement?.message ?? "";
  const initialTone =
    SUPPORT_TONES.find(
      ({ id }) =>
        storedMessage === buildSupportMessage({ role: activeRole, tone: id }),
    )?.id ?? SUPPORT_TONES[0].id;
  const preview = node("blockquote", {
    className: "encouragement-card",
    text:
      storedMessage ||
      buildSupportMessage({ role: activeRole, tone: SUPPORT_TONES[0].id }),
  });
  const status = node("p", {
    className: "support-status",
    attributes: { "aria-live": "polite" },
  });

  for (const tone of SUPPORT_TONES) {
    const button = node("button", {
      text: tone.label,
      attributes: {
        type: "button",
        "aria-pressed": String(tone.id === initialTone),
      },
    });
    button.addEventListener("click", () => {
      const message = buildSupportMessage({
        role: activeRole,
        tone: tone.id,
      });
      preview.textContent = message;
      for (const toneButton of toneOptions.querySelectorAll("button")) {
        toneButton.setAttribute(
          "aria-pressed",
          String(toneButton === button),
        );
      }
      status.textContent = "已更新預覽；確認後才會放進學生護照。";
    });
    toneOptions.append(button);
  }

  const copy = node("button", {
    className: "support-copy",
    text: "複製鼓勵卡",
    attributes: { type: "button" },
  });
  const confirm = node("button", {
    className: "support-confirm",
    text: "確認放進學生護照",
    attributes: { type: "button" },
  });
  confirm.addEventListener("click", () => {
    localState = {
      ...localState,
      student: {
        ...localState.student,
        encouragement: {
          message: preview.textContent,
          sourceRole: activeRole,
          helpfulness: null,
          updatedAt: new Date().toISOString(),
        },
      },
    };
    saveLocalState();
    status.textContent = "鼓勵卡已放進學生護照。";
  });
  copy.addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText(preview.textContent);
      status.textContent = "已複製，可以傳給對方了。";
    } catch {
      status.textContent = "瀏覽器無法自動複製，請直接選取上方文字。";
    }
  });

  section.append(toneOptions, preview, confirm, copy, status);
  return section;
}

function createParentTodayCard(mission) {
  const report = getTodayReport(mission.id);
  const reflection = normalizeReflection(report?.reflection);
  const platform = getCorePlatform(mission.siteId, "parent");
  const section = node("section", {
    className: "parent-today-card",
    attributes: { "aria-labelledby": "parent-today-heading" },
  });
  const heading = node("div");
  heading.append(
    node("p", { className: "eyebrow", text: "今天怎麼陪" }),
    node("h2", {
      text: mission.title,
      attributes: { id: "parent-today-heading" },
    }),
    node("p", {
      text: `${mission.subject}・${mission.durationMinutes} 分鐘・${platform?.stage ?? "依孩子進度使用"}`,
    }),
  );
  const accompany = node("ol", { className: "parent-accompaniment" });
  for (const step of [
    "先問孩子今天有多少心力",
    "讓孩子自己選 5～15 分鐘",
    "結束後只問哪個方法有幫助",
  ]) {
    accompany.append(node("li", { text: step }));
  }
  const evidence = node("details", { className: "parent-evidence" });
  evidence.append(node("summary", { text: "查看今天的學習證據" }));
  evidence.append(
    node("strong", { text: "本次會練到" }),
    node("p", { text: getMissionLearningOutcome(mission) }),
    node("strong", { text: "孩子今天的自評" }),
    node("p", {
      text: report
        ? report.status === "complete"
          ? "孩子記錄：完成了"
          : report.status === "partial"
            ? "孩子記錄：做了一部分"
            : "孩子記錄：今天先休息"
        : "尚未落印；這不是成績，也不代表孩子沒有學習。",
    }),
    node("strong", { text: "孩子留下的學習發現" }),
    node("p", {
      text:
        reflection.shareWithParent
          ? reflection.note || reflection.evidence || "孩子已同意分享，但尚未填寫文字。"
          : "這則反思由孩子保留；家長只看見參與狀態。參與，不等於已經學會。",
    }),
  );
  const conversation = node("aside", { className: "parent-conversation-prompt" });
  conversation.append(
    node("strong", { text: "今晚可以這樣問" }),
    node("p", {
      text: getParentConversationPrompt({
        status: report?.status,
        evidenceId: report?.evidenceId,
      }),
    }),
  );
  const action = node("button", {
    className: "parent-today-action",
    text: report ? "切到學生護照查看" : "陪孩子開始這項任務",
    attributes: { type: "button" },
  });
  action.addEventListener("click", () => {
    const selection = selectRoleInterface("student");
    localState = { ...localState, activeRole: selection.activeRole };
    selectedMissionId = mission.id;
    saveLocalState();
    render();
    document.querySelector("#daily-mission-title")?.focus();
  });
  section.append(heading, accompany, evidence, conversation, action);
  return section;
}

function createPrivacyCenter(activeRole) {
  const section = node("section", {
    className: "privacy-center",
    attributes: { "aria-labelledby": `${activeRole}-privacy-heading` },
  });
  section.append(
    node("p", { className: "eyebrow", text: "隱私與平台來源" }),
    node("h2", {
      text: "資料留在哪裡，你可以自己決定",
      attributes: { id: `${activeRole}-privacy-heading` },
    }),
    node("p", {
      text: "不需註冊；個人任務、反思與鼓勵只存在這台裝置的瀏覽器。開啟外站後，資料處理由各平台自行負責，本入口不讀取外站成績。",
    }),
  );

  const facts = node("ul", { className: "privacy-facts" });
  for (const fact of [
    "不收姓名、Email、學號、學校或班級真名。",
    "分享班級航線只包含白名單任務 ID，不包含學生或老師資料。",
    "清除瀏覽資料或按下方按鈕後，本機護照無法復原。",
  ]) {
    facts.append(node("li", { text: fact }));
  }
  const layers = node("div", { className: "privacy-layers" });
  for (const layer of PRIVACY_LAYERS) {
    const item = node("article");
    item.append(
      node("strong", { text: layer.title }),
      node("p", { text: layer.copy }),
    );
    layers.append(item);
  }

  const sources = node("details", { className: "platform-source-list" });
  sources.append(node("summary", { text: "查看外站來源網域" }));
  const sourceList = node("ul");
  const hostnames = [
    ...new Set(
      getPlatformsForRole(activeRole).map(
        ({ url }) => new URL(url).hostname,
      ),
    ),
  ].sort();
  for (const hostname of hostnames) {
    sourceList.append(node("li", { text: hostname }));
  }
  sources.append(sourceList);

  const metrics = buildLocalMetrics(
    localState.student.measurementEvents ?? [],
  );
  const localMetrics = node("details", { className: "local-metrics" });
  localMetrics.append(
    node("summary", { text: "查看本機健康循環摘要" }),
    node("p", {
      text: "只用來檢查流程是否健康，不計總時數、不做排名，預設不會上傳。",
    }),
  );
  const metricList = node("ul");
  for (const [label, value] of [
    ["開始後回到護照", `${metrics.returnRate}%`],
    ["主動選擇策略", `${metrics.strategySelections} 次`],
    ["收到休息提醒", `${metrics.restSuggestions} 次`],
    ["採用休息提醒", `${metrics.restAccepted} 次`],
    ["留下真實落印", `${metrics.missionReports} 次`],
  ]) {
    metricList.append(node("li", { text: `${label}：${value}` }));
  }
  localMetrics.append(metricList);

  const actions = node("div", { className: "privacy-actions" });
  const issues = node("a", {
    text: "問題回報與專案來源",
    attributes: {
      href: "https://github.com/hk6429/self-learning-passport/issues",
      target: "_blank",
      rel: "noopener noreferrer",
    },
  });
  const clear = node("button", {
    text: "清除這台裝置的護照資料（全部）",
    attributes: { type: "button" },
  });
  const defaults = createDefaultState();
  const clearStudent = node("button", {
    text: "只清除學生護照與反思",
    attributes: { type: "button" },
  });
  clearStudent.addEventListener("click", () => {
    if (!window.confirm("確定只清除學生護照與反思嗎？")) return;
    localState = { ...localState, student: defaults.student };
    saveLocalState();
    render();
  });
  const clearTeacher = node("button", {
    text: "只清除教師航線草稿",
    attributes: { type: "button" },
  });
  clearTeacher.addEventListener("click", () => {
    localState = { ...localState, teacher: defaults.teacher };
    teacherSelectedMissionIds = [];
    saveLocalState();
    render();
  });
  const status = node("p", {
    className: "privacy-status",
    attributes: { "aria-live": "polite" },
  });
  clear.addEventListener("click", () => {
    if (
      !window.confirm(
        "確定清除這台裝置的護照、反思、鼓勵與教師草稿嗎？清除後無法復原。",
      )
    ) {
      return;
    }
    const result = store.clear();
    localState = result.state;
    teacherSelectedMissionIds = [];
    teacherPlanNotice = "";
    selectedMissionId = null;
    status.textContent =
      result.status === "cleared"
        ? "本機資料已清除。"
        : "目前無法清除，請檢查瀏覽器儲存權限。";
    if (result.status === "cleared") render();
  });
  actions.append(issues, clearStudent, clearTeacher, clear);
  section.append(facts, layers, localMetrics, sources, actions, status);
  return section;
}

function createQrFigure(value) {
  const qr = qrcode(0, "M");
  qr.addData(value);
  qr.make();
  const figure = node("figure", { className: "teacher-plan-qr" });
  figure.append(
    node("img", {
      attributes: {
        src: qr.createDataURL(4, 12),
        alt: "班級航線分享網址 QR Code",
        width: "220",
        height: "220",
      },
    }),
    node("figcaption", { text: "學生可掃描 QR Code 開啟同一份航線" }),
  );
  return figure;
}

function createTeacherPlanStudio() {
  const missions = teacherSelectedMissionIds
    .map((missionId) => missionById.get(missionId))
    .filter(Boolean);
  const section = node("section", {
    className: "teacher-plan-studio",
    attributes: { "aria-labelledby": "teacher-plan-heading" },
  });
  const top = node("header", { className: "teacher-plan-heading" });
  top.append(
    node("div", {
      className: "teacher-plan-heading__copy",
    }),
    node("strong", {
      className: "teacher-plan-count",
      text: `${missions.length}／14`,
      attributes: { "aria-label": `已選 ${missions.length} 個任務，上限 14 個` },
    }),
  );
  top.firstElementChild.append(
    node("p", { className: "eyebrow", text: "班級航線草稿" }),
    node("h2", {
      text: "選任務、確認摘要、分享給學生",
      attributes: { id: "teacher-plan-heading" },
    }),
    node("p", {
      text: "在下方主域勾選 1～14 個任務；分享內容只有任務 ID，不含姓名、班級或學校。",
    }),
  );
  section.append(top);

  const notice = node("p", {
    className: "teacher-plan-notice",
    text:
      teacherPlanNotice ||
      (missions.length === 0
        ? "尚未選任務。請從下方主域挑選 5、10 或 15 分鐘航線。"
        : "已建立草稿；可繼續加選或直接分享。"),
    attributes: { "aria-live": "polite" },
  });
  section.append(notice);
  const budgetField = node("label", { className: "teacher-budget" });
  budgetField.append(node("span", { text: "這堂課可用時間" }));
  const budgetSelect = node("select", { attributes: { "aria-label": "課堂時間預算" } });
  for (const minutes of [10, 20, 45, 90]) {
    budgetSelect.append(
      node("option", {
        text: `${minutes} 分鐘`,
        attributes: { value: String(minutes) },
      }),
    );
  }
  budgetSelect.value = String(teacherTimeBudget);
  budgetSelect.addEventListener("change", () => {
    teacherTimeBudget = Number(budgetSelect.value);
    render();
  });
  budgetField.append(budgetSelect);
  section.append(budgetField);
  if (missions.length === 0) return section;

  const list = node("ol", { className: "teacher-plan-list" });
  missions.forEach((mission, index) => {
    const item = node("li");
    const copy = node("div");
    copy.append(
      node("strong", { text: mission.title }),
      node("span", {
        text: `${mission.subject}・${mission.durationMinutes} 分鐘`,
      }),
      node("p", { text: getMissionLearningOutcome(mission) }),
    );
    const remove = node("button", {
      text: "移除",
      attributes: {
        type: "button",
        "aria-label": `從班級航線移除${mission.title}`,
      },
    });
    remove.addEventListener("click", () => {
      teacherSelectedMissionIds = teacherSelectedMissionIds.filter(
        (missionId) => missionId !== mission.id,
      );
      delete teacherAssignmentByMission[mission.id];
      delete teacherPhaseByMission[mission.id];
      teacherPlanNotice = `已移除「${mission.title}」。`;
      saveTeacherDraft();
      render();
      document.querySelector(".teacher-plan-studio")?.scrollIntoView({
        behavior: shouldReduceMotion() ? "auto" : "smooth",
        block: "start",
      });
    });
    const reorder = node("div", { className: "teacher-plan-reorder" });
    for (const [label, offset] of [["上移", -1], ["下移", 1]]) {
      const move = node("button", {
        text: label,
        attributes: {
          type: "button",
          disabled:
            (offset < 0 && index === 0) ||
            (offset > 0 && index === missions.length - 1)
              ? ""
              : null,
        },
      });
      move.disabled =
        (offset < 0 && index === 0) ||
        (offset > 0 && index === missions.length - 1);
      move.addEventListener("click", () => {
        const next = [...teacherSelectedMissionIds];
        [next[index], next[index + offset]] = [next[index + offset], next[index]];
        teacherSelectedMissionIds = next;
        saveTeacherDraft();
        render();
      });
      reorder.append(move);
    }
    const settings = node("div", { className: "teacher-mission-settings" });
    const assignment = node("label");
    assignment.append(node("span", { text: "任務規則" }));
    const assignmentSelect = node("select", {
      attributes: { "aria-label": `${mission.title}任務規則` },
    });
    for (const [value, label] of [["required", "共同必走"], ["choice", "任選一站"]]) {
      assignmentSelect.append(
        node("option", { text: label, attributes: { value } }),
      );
    }
    assignmentSelect.value =
      teacherAssignmentByMission[mission.id] ?? "required";
    assignmentSelect.addEventListener("change", () => {
      teacherAssignmentByMission[mission.id] = assignmentSelect.value;
      saveTeacherDraft();
      render();
    });
    assignment.append(assignmentSelect);

    const phase = node("label");
    phase.append(node("span", { text: "課堂階段" }));
    const phaseSelect = node("select", {
      attributes: { "aria-label": `${mission.title}課堂階段` },
    });
    for (const [value, label] of [
      ["warmup", "暖身"],
      ["core", "核心"],
      ["closing", "收尾"],
    ]) {
      phaseSelect.append(node("option", { text: label, attributes: { value } }));
    }
    phaseSelect.value = teacherPhaseByMission[mission.id] ?? "core";
    phaseSelect.addEventListener("change", () => {
      teacherPhaseByMission[mission.id] = phaseSelect.value;
      saveTeacherDraft();
      render();
    });
    phase.append(phaseSelect);
    settings.append(assignment, phase);
    item.append(copy, settings, reorder, remove);
    list.append(item);
  });

  const summary = buildSharedPlanSummary(missions);
  const planAnalysis = analyzeTeacherPlan(missions, teacherTimeBudget);
  const summaryLine = node("p", {
    className: "teacher-plan-summary",
    text: `${summary.missionCount} 個任務・建議總時間 ${summary.totalMinutes} 分鐘・${summary.subjects.join("、")}`,
  });
  const budgetNotice = node("p", {
    className: planAnalysis.withinBudget
      ? "teacher-budget-status"
      : "teacher-budget-status teacher-budget-status--over",
    text: planAnalysis.withinBudget
      ? `在 ${teacherTimeBudget} 分鐘預算內，仍保留轉場與收尾時間。`
      : `超出時間預算 ${planAnalysis.overBy} 分鐘；這是提醒，不會阻擋分享。`,
  });
  const facilitation = buildFacilitationCard(missions);
  const facilitationCard = node("details", { className: "teacher-facilitation-card" });
  facilitationCard.append(
    node("summary", { text: "開啟教師引導卡" }),
    node("p", { text: `開場：${facilitation.opening}` }),
    node("p", { text: `轉場：${facilitation.transition}` }),
  );
  const questions = node("ol");
  for (const question of facilitation.questions) {
    questions.append(node("li", { text: question }));
  }
  facilitationCard.append(questions);
  const closingField = node("label", { className: "teacher-closing-prompt" });
  closingField.append(node("span", { text: "全班共同收束問題" }));
  const closingSelect = node("select", {
    attributes: { "aria-label": "全班共同收束問題" },
  });
  for (const prompt of CLOSING_PROMPTS) {
    closingSelect.append(
      node("option", {
        text: prompt.label,
        attributes: { value: prompt.id },
      }),
    );
  }
  closingSelect.value = teacherClosingPromptId;
  closingSelect.addEventListener("change", () => {
    teacherClosingPromptId = closingSelect.value;
    saveTeacherDraft();
    render();
  });
  closingField.append(closingSelect);
  const loadGuidance = getTeacherLoadGuidance(missions);
  const loadNotice = node("p", {
    className: loadGuidance.overloaded
      ? "teacher-load-guidance teacher-load-guidance--over"
      : "teacher-load-guidance",
    text: loadGuidance.message,
  });
  const shareUrl = createSharedPlanUrl({
    baseUrl: `${window.location.origin}${window.location.pathname}`,
    missionIds: teacherSelectedMissionIds,
    catalog: MISSION_CATALOG,
    assignmentByMission: teacherAssignmentByMission,
    phaseByMission: teacherPhaseByMission,
    closingPromptId: teacherClosingPromptId,
  });
  const shareArea = node("div", { className: "teacher-plan-share" });
  const actions = node("div", { className: "teacher-plan-actions" });
  const copy = node("button", {
    text: "複製學生連結",
    attributes: { type: "button" },
  });
  copy.addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      notice.textContent = "學生連結已複製。";
    } catch {
      notice.textContent = "無法自動複製，請長按下方網址後複製。";
    }
  });
  actions.append(copy);
  if (typeof navigator.share === "function") {
    const share = node("button", {
      text: "開啟分享選單",
      attributes: { type: "button" },
    });
    share.addEventListener("click", async () => {
      try {
        await navigator.share({
          title: "萬妖習行錄｜班級航線",
          text: summaryLine.textContent,
          url: shareUrl,
        });
        notice.textContent = "分享選單已開啟。";
      } catch {
        notice.textContent = "這次沒有送出；仍可使用複製連結或 QR Code。";
      }
    });
    actions.append(share);
  }
  actions.append(
    node("a", {
      text: "預覽學生畫面",
      attributes: {
        href: shareUrl,
        target: "_blank",
        rel: "noopener noreferrer",
      },
    }),
  );
  shareArea.append(
    createQrFigure(shareUrl),
    actions,
    node("code", { className: "teacher-plan-url", text: shareUrl }),
  );
  section.append(
    list,
    summaryLine,
    budgetNotice,
    loadNotice,
    closingField,
    facilitationCard,
    shareArea,
  );
  return section;
}

function createSharedPlanSection() {
  if (!sharedPlan) return null;
  const section = node("section", {
    className: "shared-plan",
    attributes: { "aria-labelledby": "shared-plan-heading" },
  });
  section.append(
    node("p", { className: "eyebrow", text: "老師分享的班級航線" }),
    node("h2", {
      text: sharedPlan.invalid ? "這份航線無法辨識" : "照順序完成今天的班級任務",
      attributes: { id: "shared-plan-heading" },
    }),
    node("p", {
      text: sharedPlan.invalid
        ? "連結可能不完整或包含未核准任務，請向老師索取新的分享連結。"
        : "不用登入，也不會傳送姓名或成績；完成每站後回到這一頁，再前往下一站。",
    }),
  );
  if (sharedPlan.invalid) return section;

  const summary = buildSharedPlanSummary(sharedPlan.missions);
  section.append(
    node("p", {
      className: "shared-plan-summary",
      text: `${summary.missionCount} 個任務・建議總時間 ${summary.totalMinutes} 分鐘`,
    }),
  );
  const list = node("ol", { className: "shared-plan-list" });
  const phaseLabels = { warmup: "暖身", core: "核心", closing: "收尾" };
  for (const mission of sharedPlan.missions) {
    const item = node("li");
    const copy = node("div");
    copy.append(
      node("strong", { text: mission.title }),
      node("span", {
        text: `${mission.subject}・${mission.durationMinutes} 分鐘`,
      }),
      node("span", {
        className: "shared-plan-rule",
        text: `${phaseLabels[mission.phase]}・${
          mission.assignmentRole === "choice" ? "任選一站" : "共同必走"
        }`,
      }),
      node("p", { text: getMissionLearningOutcome(mission) }),
    );
    item.append(
      copy,
      node("a", {
        text: "開始任務",
        attributes: {
          href: mission.url,
          target: "_blank",
          rel: "noopener noreferrer",
        },
      }),
    );
    list.append(item);
  }
  const closing = node("aside", { className: "shared-plan-closing" });
  closing.append(
    node("strong", { text: "全班共同收束" }),
    node("p", { text: sharedPlan.closingPrompt.label }),
  );
  section.append(list, closing);
  return section;
}

function createRestorativeBanner(home, mission) {
  const returnVoyage =
    home.restorative ??
    getReturnVoyage(
      { activeDays: localState.student.activeDays },
      { now: new Date().toISOString() },
    );
  const banner = node("section", {
    className: "restorative-banner",
    attributes: {
      "aria-label": "安心回航",
    },
  });
  banner.hidden = !returnVoyage;
  banner.append(
    node("span", {
      className: "restorative-icon",
      text: "燈",
      attributes: { "aria-hidden": "true" },
    }),
  );
  const copy = node("div");
  copy.append(
    node("h2", { text: "你回來了，路還在" }),
    node("p", {
      text: "不用補進度，從一條五分鐘的小路重新出發就好。",
    }),
  );
  const button = node("button", {
    className: "restorative-link",
    text: "選擇 5 分鐘回航",
    attributes: { type: "button" },
  });
  button.addEventListener("click", () => {
    const fiveMinuteMission =
      returnVoyage?.mission ??
      home.realms
        .flatMap(({ routes }) => routes)
        .find(
          ({ siteId, durationMinutes }) =>
            siteId === mission.siteId && durationMinutes === 5,
        ) ?? home.realms[0].routes[0];
    selectedMissionId = fiveMinuteMission.id;
    render();
    document.querySelector("#daily-mission-title")?.focus?.();
  });
  banner.append(copy, button);
  return banner;
}

function createRoleNotice(activeRole) {
  const content = {
    teacher: {
      eyebrow: "引路仙師",
      title: "替全班安排一條走得完的路",
      description:
        "從七座主域的固定目錄挑選 1～14 個任務；班級只共享匿名共同節奏，不顯示排名、反思或落後名單。",
    },
    parent: {
      eyebrow: "守燈人",
      title: "看見穩定投入，也尊重孩子的步調",
      description:
        "先依孩子今天的心力與興趣，陪他挑一個走得動的入口。每天做一點就好；家長負責守燈，不替孩子追趕。",
    },
  }[activeRole];
  if (!content) return null;

  const notice = node("section", {
    className: "role-notice",
    attributes: { "aria-labelledby": `${activeRole}-title` },
  });
  notice.append(
    node("p", { className: "eyebrow", text: content.eyebrow }),
    node("h1", {
      text: content.title,
      attributes: { id: `${activeRole}-title` },
    }),
    node("p", { text: content.description }),
  );
  return notice;
}

function createPlatformCard(platform) {
  const link = node("a", {
    className: "platform-card",
    attributes: {
      href: platform.url,
      "aria-label": `開新分頁前往${platform.title}：${platform.caption}`,
      "data-platform-id": platform.id,
    },
  });
  link.target = "_blank";
  link.rel = "noopener noreferrer";

  const top = node("div", { className: "platform-card__top" });
  top.append(
    node("span", {
      className: `platform-seal platform-seal--${platform.group}`,
      text: PLATFORM_GROUP_LABELS[platform.group] ?? "支線妖境",
    }),
    node("span", {
      className: "platform-arrow",
      text: "↗",
      attributes: { "aria-hidden": "true" },
    }),
  );

  const tags = node("div", { className: "platform-tags" });
  for (const text of [platform.stage, platform.mode, platform.duration]) {
    tags.append(node("span", { text }));
  }

  const art = node("figure", { className: "platform-card__art" });
  const image = node("img", {
    attributes: {
      src: platform.art.src,
      alt: platform.art.alt,
      loading: "lazy",
      decoding: "async",
      width: "1280",
      height: "801",
    },
  });
  image.addEventListener(
    "error",
    () => {
      art.classList.add("platform-card__art--fallback");
      art.replaceChildren(
        node("span", {
          className: "platform-card__art-fallback",
          text: platform.art.fallback,
        }),
      );
    },
    { once: true },
  );
  art.append(image);

  const body = node("div", { className: "platform-card__body" });
  const learningOutcome = node("div", {
    className: "platform-learning-outcome",
  });
  learningOutcome.append(
    node("strong", { text: "這一站會練到什麼" }),
    node("p", { text: platform.learningOutcome }),
  );
  body.append(
    top,
    node("p", { className: "platform-subject", text: platform.subject }),
    node("h3", { text: platform.title }),
    node("strong", { className: "platform-caption", text: platform.caption }),
    node("p", {
      className: "platform-description",
      text: platform.description,
    }),
    learningOutcome,
    tags,
  );
  link.append(art, body);
  return link;
}

function createPlatformFilterPanel(activeRole) {
  const filters = platformFiltersByRole[activeRole];
  const allPlatforms = getPlatformsForRole(activeRole, {
    includeCore: activeRole === "parent",
  });
  const visiblePlatforms = filterPlatforms(
    allPlatforms,
    filters,
  );
  const section = node("section", {
    className: "platform-filter-panel",
    attributes: { "aria-labelledby": `${activeRole}-platform-filter-heading` },
  });
  section.append(
    node("div", { className: "platform-filter-panel__copy" }),
  );
  const copy = section.firstElementChild;
  copy.append(
    node("p", {
      className: "eyebrow",
      text: activeRole === "teacher" ? "教學選站器" : "親子選站器",
    }),
    node("h2", {
      text:
        activeRole === "teacher"
          ? "依課堂情境找到合適平台"
          : "依領域、時間與陪伴方式快速選站",
      attributes: { id: `${activeRole}-platform-filter-heading` },
    }),
    node("p", {
      text:
        activeRole === "teacher"
          ? "可同時選擇領域、時間與使用方式；篩選只改變畫面，不會保存學生資料。"
          : "先選孩子有興趣的領域與今天可用時間；各平台卡會直接標示適用年段。",
    }),
  );

  const controls = node("div", {
    className: "platform-filter-panel__controls",
  });
  for (const [key, label] of [
    ["group", "學習領域"],
    ["duration", "可用時間"],
    ["context", "使用情境"],
  ]) {
    const field = node("label", { className: "platform-filter-field" });
    field.append(node("span", { text: label }));
    const select = node("select", {
      attributes: { "aria-label": label },
    });
    for (const option of PLATFORM_FILTERS[key]) {
      const optionNode = node("option", {
        text: option.label,
        attributes: { value: option.id },
      });
      select.append(optionNode);
    }
    select.value = filters[key];
    select.addEventListener("change", () => {
      platformFiltersByRole = {
        ...platformFiltersByRole,
        [activeRole]: {
          ...platformFiltersByRole[activeRole],
          [key]: select.value,
        },
      };
      render();
      document
        .querySelector(`#${activeRole}-platform-filter-heading`)
        ?.scrollIntoView({
        behavior: shouldReduceMotion() ? "auto" : "smooth",
        block: "start",
      });
    });
    field.append(select);
    controls.append(field);
  }
  controls.append(
    node("p", {
      className: "platform-filter-status",
      text: `目前顯示 ${visiblePlatforms.length}／${allPlatforms.length} 個平台`,
      attributes: { "aria-live": "polite" },
    }),
  );
  section.append(controls);
  return section;
}

function createPlatformSection(
  activeRole,
  { includeCore = false, filters = null } = {},
) {
  const allPlatforms = getPlatformsForRole(activeRole, { includeCore });
  const platforms = filters
    ? filterPlatforms(allPlatforms, filters)
    : allPlatforms;
  const content = {
    student: {
      eyebrow: "支線妖境",
      title: "還有更多世界，等你照興趣探路",
      description:
        "七座主域之外，閱讀解謎與習慣養成也能成為今天的一小步。",
    },
    teacher: {
      eyebrow: "完整站群",
      title: "七個主域與五個延伸平台",
      description:
        "上方七座主域適合每日任務；下方五個延伸平台補上閱讀解謎、習慣經營與教師專業成長。",
    },
    parent: {
      eyebrow: "親子選路",
      title: "替孩子選一條今天願意開始的路",
      description:
        "這裡整理十個適合孩子的非會考平台。先看興趣，再看年段與時間，不必一次做完。",
    },
  }[activeRole];

  const section = node("section", {
    className: `platform-section platform-section--${activeRole}`,
    attributes: { "aria-labelledby": `${activeRole}-platform-heading` },
  });
  const heading = node("header", { className: "section-heading" });
  const titleWrap = node("div");
  titleWrap.append(
    node("p", {
      className: "eyebrow",
      text: `${content.eyebrow}・${platforms.length} 道入口`,
    }),
    node("h2", {
      text: content.title,
      attributes: { id: `${activeRole}-platform-heading` },
    }),
  );
  heading.append(
    titleWrap,
    node("p", { text: content.description }),
  );

  const grid = node("div", { className: "platform-grid" });
  if (platforms.length === 0) {
    grid.append(
      node("p", {
        className: "platform-filter-empty",
        text: "這組條件暫時沒有延伸平台；可調整上方篩選，或查看仍符合條件的主域。",
      }),
    );
  } else {
    for (const platform of platforms) {
      grid.append(createPlatformCard(platform));
    }
  }
  section.append(heading, grid);
  return section;
}

function createRealmSection(home, activeRole, { filters = null } = {}) {
  const section = node("section", {
    className: "realm-section",
    attributes: { "aria-labelledby": "realm-heading" },
  });
  const heading = node("header", { className: "section-heading" });
  const titleWrap = node("div");
  titleWrap.append(
    node("p", { className: "eyebrow", text: "七域同行" }),
    node("h2", {
      text: activeRole === "teacher" ? "安排班級今日航線" : "今天練哪個網站？",
      attributes: { id: "realm-heading" },
    }),
  );
  heading.append(
    titleWrap,
    node("p", {
      text:
        activeRole === "teacher"
          ? "所有任務都來自固定白名單；選擇時長，只安排合宜的共同節奏。"
          : "七個網站都有 5、10、15 分鐘任務。沒有最強路線，只有今天最合適的那一條。",
    }),
  );

  const grid = node("div", { className: "realm-grid" });
  const realms =
    activeRole !== "student" && filters
      ? (() => {
          const visibleIds = new Set(
            filterPlatforms(getPlatformsForRole("teacher"), filters)
              .filter(({ coreRealm }) => coreRealm)
              .map(({ id }) => id),
          );
          return home.realms.filter(({ siteId }) => visibleIds.has(siteId));
        })()
      : home.realms;
  if (realms.length === 0) {
    grid.append(
      node("p", {
        className: "platform-filter-empty",
        text: "這組條件沒有主域任務；下方仍可能有符合的延伸平台。",
      }),
    );
  }
  for (const realm of realms) {
    const platform = getCorePlatform(
      realm.siteId,
      activeRole === "student" ? "student" : activeRole,
    );
    const card = createRealmCard(
      document,
      {
        ...realm,
        missions: realm.routes,
        stage: platform?.stage ?? "依學習進度使用",
        learningOutcome:
          platform?.learningOutcome ??
          "依任務內容練習理解、判斷與自我調整。",
      },
      {
        onSelect(missionId) {
          selectedMissionId = missionId;
          const selected = realm.routes.find(({ id }) => id === missionId);
          if (activeRole === "student" && selected) {
            selectStudentMission(realm, selected);
            return;
          }
          if (activeRole === "teacher" && selected) {
            if (teacherSelectedMissionIds.includes(missionId)) {
              teacherSelectedMissionIds = teacherSelectedMissionIds.filter(
                (selectedId) => selectedId !== missionId,
              );
              delete teacherAssignmentByMission[missionId];
              delete teacherPhaseByMission[missionId];
              teacherPlanNotice = `已移除「${selected.title}」。`;
            } else if (teacherSelectedMissionIds.length >= 14) {
              teacherPlanNotice =
                "已達 14 個任務上限；請先移除一項再加入新的任務。";
            } else {
              teacherSelectedMissionIds = [
                ...teacherSelectedMissionIds,
                missionId,
              ];
              teacherAssignmentByMission[missionId] = "required";
              teacherPhaseByMission[missionId] = "core";
              teacherPlanNotice = `已加入「${selected.title}」。`;
            }
            saveTeacherDraft();
            render();
            document.querySelector(".teacher-plan-studio")?.scrollIntoView({
              behavior: shouldReduceMotion() ? "auto" : "smooth",
              block: "start",
            });
            return;
          }
          render();
          document.querySelector("#daily-mission-title")?.scrollIntoView({
            behavior: shouldReduceMotion() ? "auto" : "smooth",
            block: "center",
          });
        },
      },
    );
    card.dataset.subject = realm.subject;
    for (const button of card.querySelectorAll("[data-mission-id]")) {
      button.setAttribute(
        "aria-pressed",
        String(
          activeRole === "teacher"
            ? teacherSelectedMissionIds.includes(button.dataset.missionId)
            : button.dataset.missionId === selectedMissionId,
        ),
      );
    }
    grid.append(card);
  }

  section.append(heading, grid);
  return section;
}

function createProgressDock() {
  const lights = getSevenLights({
    activeDays: localState.student.activeDays,
  });
  const snapshot = buildPassportSnapshot(localState.student);
  const dock = node("aside", {
    className: "progress-dock",
    attributes: {
      "data-expanded": "false",
      "data-safe": "clear",
      "aria-label": `七燈破霧，目前點亮 ${lights.litCount} 盞`,
    },
  });
  const toggle = node("button", {
    className: "progress-dock__toggle",
    attributes: {
      type: "button",
      "aria-expanded": "false",
      "aria-label": `查看七燈進度，目前點亮 ${lights.litCount} 盞`,
    },
  });
  toggle.append(
    node("span", {
      className: "lamp-count",
      text: String(lights.litCount),
      attributes: { "aria-hidden": "true" },
    }),
    node("span", {
      className: "progress-dock__label",
      text: snapshot.nextRelic
        ? `第 ${lights.currentBook} 冊 ${lights.litCount}／7・已完成 ${lights.completedBooks} 冊`
        : `第 ${lights.currentBook} 冊 ${lights.litCount}／7・收藏全解鎖`,
    }),
  );
  toggle.addEventListener("click", () => {
    const expanded = dock.dataset.expanded !== "true";
    dock.dataset.expanded = String(expanded);
    toggle.setAttribute("aria-expanded", String(expanded));
    scheduleProgressDockSafety();
  });
  const targets = node("nav", {
    className: "progress-dock__targets",
    attributes: { "aria-label": "三層成長目標" },
  });
  for (const [href, label] of [
    ["#daily-mission-title", "今天：目前任務"],
    ["#learning-path", `近期：七燈 ${lights.litCount}／7`],
    [
      ".passport-section",
      snapshot.nextRelic
        ? `長期：${snapshot.nextRelic.label}還差 ${snapshot.nextRelic.remainingXp}`
        : "長期：收藏已完成",
    ],
  ]) {
    const button = node("button", { text: label, attributes: { type: "button" } });
    button.addEventListener("click", () =>
      document.querySelector(href)?.scrollIntoView({
        behavior: shouldReduceMotion() ? "auto" : "smooth",
      }),
    );
    targets.append(button);
  }
  dock.append(toggle, targets);
  return dock;
}

function rectanglesOverlap(left, right, gap = 8) {
  return !(
    left.right + gap <= right.left ||
    left.left >= right.right + gap ||
    left.bottom + gap <= right.top ||
    left.top >= right.bottom + gap
  );
}

function syncProgressDockSafety() {
  dockSafetyFrame = null;
  const dock = document.querySelector(".progress-dock");
  const toggle = dock?.querySelector(".progress-dock__toggle");
  if (!dock || !toggle || dock.dataset.expanded === "true") return;

  dock.dataset.safe = "clear";
  toggle.removeAttribute("tabindex");
  const dockRect = dock.getBoundingClientRect();
  // 不再把 .parent-today-card, .teacher-plan-studio, .shared-plan 等大型容器視為碰撞物。
  const collision = [
    ...document.querySelectorAll(
      "a, button, input, summary, select, [tabindex]:not([tabindex='-1'])",
    ),
  ].some((element) => {
    if (dock.contains(element)) return false;
    const rect = element.getBoundingClientRect();
    if (
      rect.width === 0 ||
      rect.height === 0 ||
      rect.bottom <= 0 ||
      rect.top >= window.innerHeight
    ) {
      return false;
    }
    return rectanglesOverlap(dockRect, rect);
  });

  if (collision) {
    dock.dataset.safe = "hidden";
    toggle.setAttribute("tabindex", "-1");
  }
}

function scheduleProgressDockSafety() {
  if (dockSafetyFrame !== null) {
    window.cancelAnimationFrame(dockSafetyFrame);
  }
  dockSafetyFrame = window.requestAnimationFrame(syncProgressDockSafety);
}

function createHeader(onOpenManual, activeRole) {
  const header = node("header", { className: "site-header" });
  header.append(
    node("a", {
      className: "skip-link",
      text: "跳到主要內容",
      attributes: { href: "#main-content" },
    }),
  );
  const brand = node("div", { className: "brand-lockup" });
  const brandCopy = node("div", { className: "brand-copy" });
  brandCopy.append(
    node("strong", { text: "萬妖習行錄" }),
    node("span", { text: "SELF-LEARNING PASSPORT" }),
  );
  brand.append(
    node("span", {
      className: "brand-seal",
      text: "習",
      attributes: { "aria-hidden": "true" },
    }),
    brandCopy,
  );

  const actions = node("div", { className: "header-actions" });
  const manualButton = node("button", {
    className: "manual-open-button",
    attributes: {
      type: "button",
      "aria-label": "開啟使用說明書",
      "aria-haspopup": "dialog",
      "aria-controls": "user-manual-dialog",
    },
  });
  manualButton.append(
    node("strong", { text: "使用說明" }),
    node("span", { text: "學生・家長・老師" }),
  );
  manualButton.addEventListener("click", onOpenManual);

  const focusButton = node("button", {
    className: "mode-toggle",
    attributes: {
      type: "button",
      "aria-pressed": String(localState.student.visualPreference.focusMode),
    },
  });
  focusButton.append(
    node("strong", {
      text: localState.student.visualPreference.focusMode
        ? "離開純任務模式"
        : "純任務模式",
    }),
    node("span", {
      text: localState.student.visualPreference.focusMode
        ? "回到完整護照"
        : "只看今天要做什麼",
    }),
  );
  focusButton.addEventListener("click", () => {
    localState = {
      ...localState,
      student: {
        ...localState.student,
        visualPreference: {
          ...localState.student.visualPreference,
          focusMode: !localState.student.visualPreference.focusMode,
        },
      },
    };
    saveLocalState();
    render();
  });
  actions.append(manualButton);
  if (activeRole === "student") {
    actions.append(focusButton);
  }
  header.append(brand, actions);
  return header;
}

function render() {
  const home = buildHomeState({
    state: localState,
    now: new Date().toISOString(),
  });
  const activeRole =
    sharedPlan && !sharedPlan.invalid
      ? "student"
      : (localState.activeRole ?? "student");
  const mission = findMission(home);
  selectedMissionId = mission.id;

  const shell = node("div", {
    className:
      activeRole === "student" &&
      localState.student.visualPreference.focusMode
      ? "app-shell focus-mode"
      : "app-shell",
  });
  const manualDialog = createUserManualDialog(activeRole);
  shell.append(
    node("div", {
      className: "ink-pool ink-pool--one",
      attributes: { "aria-hidden": "true" },
    }),
    node("div", {
      className: "ink-pool ink-pool--two",
      attributes: { "aria-hidden": "true" },
    }),
    createHeader(() => manualDialog.showModal(), activeRole),
    createRolePanel(home, activeRole),
  );
  const storageStatus = createStorageNotice();
  if (storageStatus) shell.append(storageStatus);
  const main = node("main", { attributes: { id: "main-content" } });
  const sharedPlanSection = createSharedPlanSection();
  if (sharedPlanSection) main.append(sharedPlanSection);

  if (activeRole === "student") {
    if (
      hasStudentHistory() &&
      !localState.student.visualPreference.focusMode
    ) {
      main.append(createReturnPlayerHud(home, mission));
    }
    const worldGuide = createWorldGuide();
    if (worldGuide) {
      main.append(worldGuide);
    }
    const healthyRest = createHealthyRestCard();
    if (healthyRest) main.append(healthyRest);
    main.append(
      createQuickStartPanel(home, mission),
      createStudentHero(
        home,
        mission,
        localState.student.visualPreference.focusMode,
      ),
      createSupportNeedCard(),
      createRestorativeBanner(home, mission),
      createPassportSection(home),
      createLearningPathPanel(),
      createRealmSection(home, activeRole),
      createPlatformSection(activeRole),
    );
  } else {
    main.append(createRoleNotice(activeRole));
    if (activeRole === "teacher") {
      main.append(
        createPlatformFilterPanel("teacher"),
        createTeacherPlanStudio(),
        createRealmSection(home, activeRole, {
          filters: platformFiltersByRole.teacher,
        }),
        createSupportStudio(activeRole),
        createPlatformSection(activeRole, {
          filters: platformFiltersByRole.teacher,
        }),
        createPrivacyCenter("teacher"),
      );
    }
    if (activeRole === "parent") {
      main.append(
        createParentTodayCard(mission),
        createPlatformFilterPanel("parent"),
        createSupportStudio(activeRole),
        createPlatformSection(activeRole, {
          includeCore: true,
          filters: platformFiltersByRole.parent,
        }),
        createPrivacyCenter("parent"),
      );
    }
  }
  shell.append(main, manualDialog, createProgressDock());
  app.replaceChildren(shell);
  scheduleProgressDockSafety();
}

window.addEventListener("focus", () => {
  window.requestAnimationFrame(focusPendingReturn);
});
window.addEventListener("pageshow", () => {
  window.requestAnimationFrame(focusPendingReturn);
});
document.addEventListener("visibilitychange", () => {
  if (document.visibilityState === "visible") {
    window.requestAnimationFrame(focusPendingReturn);
  }
});
window.addEventListener("scroll", scheduleProgressDockSafety, {
  passive: true,
});
window.addEventListener("resize", scheduleProgressDockSafety);

render();
