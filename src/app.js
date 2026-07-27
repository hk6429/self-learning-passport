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
import { createLocalStore } from "./storage/local-store.js";

const app = document.querySelector("#app");

if (!app) {
  throw new Error("找不到應用程式根節點。");
}

const store = createLocalStore(window.localStorage);
const loaded = store.load();
let localState = loaded.state;
let selectedMissionId = null;
let pendingReturnMissionId = null;
let dockSafetyFrame = null;
let teacherPlatformFilters = {
  group: "all",
  duration: "all",
  context: "all",
};

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
  }
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

function checkInMission(mission, status, additions = {}) {
  localState = {
    ...localState,
    student: recordPassportCheckIn(localState.student, {
      mission,
      status,
      occurredAt: new Date().toISOString(),
      ...additions,
    }),
  };
  saveLocalState();
  render();
  window.requestAnimationFrame(() => {
    document
      .querySelector(`[data-feedback-mission="${mission.id}"]`)
      ?.focus({ preventScroll: false });
  });
}

function getMissionReward(mission, status = "complete") {
  return status === "complete"
    ? 20 + mission.durationMinutes
    : 10 + Math.floor(mission.durationMinutes / 2);
}

function hasStudentHistory() {
  return Object.keys(localState.student.missionHistory ?? {}).length > 0;
}

function markMissionLaunched(missionId) {
  pendingReturnMissionId = missionId;
}

function focusPendingReturn() {
  if (!pendingReturnMissionId) return;
  const panel = [...document.querySelectorAll("[data-return-mission]")].find(
    ({ dataset }) => dataset.returnMission === pendingReturnMissionId,
  );
  if (!panel) return;
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
  const expectedXp = getMissionReward(mission);
  const remainingAfterMission = snapshot.nextRelic
    ? Math.max(0, snapshot.nextRelic.remainingXp - expectedXp)
    : null;
  const outlook = node("div", {
    className: "mission-outlook",
    attributes: { "aria-label": "完成任務後的成長預覽" },
  });
  outlook.append(
    node("span", { text: `完成可得＋${expectedXp} 習光` }),
    node("span", {
      text: snapshot.nextRelic
        ? remainingAfterMission === 0
          ? `完成即可解鎖「${snapshot.nextRelic.label}」`
          : `完成後，下一收藏「${snapshot.nextRelic.label}」還差 ${remainingAfterMission} 習光`
        : "七域收藏已全部解鎖",
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
  link.target = "_blank";
  link.rel = "noopener noreferrer";
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
  scroll.append(meta, createMissionOutlook(mission));
  scroll.append(
    createMissionLink(mission),
    node("p", {
      className: "mission-note",
      text: "完成多少都可以回來落印；系統不會讀取外站成績。",
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
  copy.append(node("strong", { text: "已記錄，可以離開" }));
  if (report.status === "rest") {
    copy.append(
      node("p", {
        text: "今天安心歇腳，不扣習光；走過的路與收藏都不會消失。",
      }),
    );
  } else {
    const earnedXp = getMissionReward(mission, report.status);
    const lights = getSevenLights({
      activeDays: localState.student.activeDays,
    });
    const snapshot = buildPassportSnapshot(localState.student);
    const mystery = getLatestMystery(localState.student);
    const rewards = node("div", { className: "checkin-rewards" });
    rewards.append(
      node("span", { text: `＋${earnedXp} 習光` }),
      node("span", { text: `七燈 ${lights.litCount}／7` }),
    );
    copy.append(
      rewards,
      node("p", {
        className: "checkin-mystery",
        text: mystery?.message ?? "霧海記住了你今天走過的路。",
      }),
      node("p", {
        className: "checkin-next-target",
        text: snapshot.nextRelic
          ? `下一收藏：${snapshot.nextRelic.label}，目前 ${snapshot.nextRelic.progressXp}／${snapshot.nextRelic.unlockAt} 習光；七燈還差 ${Math.max(0, 7 - lights.litCount)} 盞。`
          : `七域收藏已全部解鎖；七燈還差 ${Math.max(0, 7 - lights.litCount)} 盞。`,
      }),
    );
  }
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
    const optional = node("details", { className: "optional-followup" });
    optional.append(
      node("summary", { text: "有力氣再補（選填）" }),
    );
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
            reflection: report.reflection ?? "",
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
        value: report.reflection ?? "",
      },
    });
    input.value = report.reflection ?? "";
    const save = node("button", {
      text: "保存我的發現",
      attributes: { type: "button" },
    });
    save.addEventListener("click", () =>
      checkInMission(mission, report.status, {
        strategy: report.strategy ?? null,
        reflection: input.value.trim(),
      }),
    );
    reflection.append(input, save);
    optional.append(reflection);
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
    [snapshot.level, "護照等級"],
    [snapshot.stamps, "任務妖印"],
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
    className: "passport-progress",
    attributes: {
      role: "progressbar",
      "aria-label": "下一等級進度",
      "aria-valuemin": "0",
      "aria-valuemax": "100",
      "aria-valuenow": String(snapshot.levelProgress),
    },
  });
  const progressFill = node("span");
  progressFill.style.width = `${snapshot.levelProgress}%`;
  progress.append(progressFill);

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

  section.append(heading, metrics, progress, settings, collection);
  const weeklyStrategyReview = createWeeklyStrategyReview();
  if (weeklyStrategyReview) {
    section.append(weeklyStrategyReview);
  }

  const cabinet = node("section", {
    className: "collection-cabinet",
    attributes: { "aria-labelledby": "collection-cabinet-heading" },
  });
  const cabinetHeading = node("header", {
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
      node("footer", { text: "同行者留給你的話" }),
    );
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
  const preview = node("blockquote", {
    className: "encouragement-card",
    text:
      localState.student.encouragement?.message ??
      buildSupportMessage({ role: activeRole, tone: SUPPORT_TONES[0].id }),
  });
  const status = node("p", {
    className: "support-status",
    attributes: { "aria-live": "polite" },
  });

  for (const tone of SUPPORT_TONES) {
    const button = node("button", {
      text: tone.label,
      attributes: { type: "button" },
    });
    button.addEventListener("click", () => {
      const message = buildSupportMessage({
        role: activeRole,
        tone: tone.id,
      });
      localState = {
        ...localState,
        student: {
          ...localState.student,
          encouragement: {
            message,
            helpfulness: null,
            updatedAt: new Date().toISOString(),
          },
        },
      };
      saveLocalState();
      preview.textContent = message;
      status.textContent = "鼓勵卡已放進學生護照。";
    });
    toneOptions.append(button);
  }

  const copy = node("button", {
    className: "support-copy",
    text: "複製鼓勵卡",
    attributes: { type: "button" },
  });
  copy.addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText(preview.textContent);
      status.textContent = "已複製，可以傳給對方了。";
    } catch {
      status.textContent = "瀏覽器無法自動複製，請直接選取上方文字。";
    }
  });

  section.append(toneOptions, preview, copy, status);
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

function createTeacherFilterPanel() {
  const allPlatforms = getPlatformsForRole("teacher");
  const visiblePlatforms = filterPlatforms(
    allPlatforms,
    teacherPlatformFilters,
  );
  const section = node("section", {
    className: "platform-filter-panel",
    attributes: { "aria-labelledby": "platform-filter-heading" },
  });
  section.append(
    node("div", { className: "platform-filter-panel__copy" }),
  );
  const copy = section.firstElementChild;
  copy.append(
    node("p", { className: "eyebrow", text: "教學選站器" }),
    node("h2", {
      text: "依課堂情境找到合適平台",
      attributes: { id: "platform-filter-heading" },
    }),
    node("p", {
      text: "可同時選擇領域、時間與使用方式；篩選只改變畫面，不會保存學生資料。",
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
    select.value = teacherPlatformFilters[key];
    select.addEventListener("change", () => {
      teacherPlatformFilters = {
        ...teacherPlatformFilters,
        [key]: select.value,
      };
      render();
      document.querySelector(".platform-filter-panel")?.scrollIntoView({
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
  const platforms =
    activeRole === "teacher" && filters
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
    activeRole === "teacher" && filters
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
    const card = createRealmCard(
      document,
      { ...realm, missions: realm.routes },
      {
        onSelect(missionId) {
          selectedMissionId = missionId;
          const selected = realm.routes.find(({ id }) => id === missionId);
          if (activeRole === "student" && selected) {
            selectStudentMission(realm, selected);
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
        String(button.dataset.missionId === selectedMissionId),
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
        ? `七燈 ${lights.litCount}／7・下一收藏差 ${snapshot.nextRelic.remainingXp}`
        : `七燈 ${lights.litCount}／7・收藏全解鎖`,
    }),
  );
  toggle.addEventListener("click", () => {
    const expanded = dock.dataset.expanded !== "true";
    dock.dataset.expanded = String(expanded);
    toggle.setAttribute("aria-expanded", String(expanded));
    scheduleProgressDockSafety();
  });
  dock.append(toggle);
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
  const collision = [
    ...document.querySelectorAll(
      "a, button, input, summary, [tabindex]:not([tabindex='-1']), .mission-scroll, .map-stage, .return-player-hud, .passport-section, .realm-card, .platform-card, .role-notice, .support-studio",
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

function createHeader() {
  const header = node("header", { className: "site-header" });
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
  header.append(brand, focusButton);
  return header;
}

function render() {
  const home = buildHomeState({
    state: localState,
    now: new Date().toISOString(),
  });
  const activeRole = localState.activeRole ?? "student";
  const mission = findMission(home);
  selectedMissionId = mission.id;

  const shell = node("div", {
    className: localState.student.visualPreference.focusMode
      ? "app-shell focus-mode"
      : "app-shell",
  });
  shell.append(
    node("div", {
      className: "ink-pool ink-pool--one",
      attributes: { "aria-hidden": "true" },
    }),
    node("div", {
      className: "ink-pool ink-pool--two",
      attributes: { "aria-hidden": "true" },
    }),
    createHeader(),
    createRolePanel(home, activeRole),
  );

  if (activeRole === "student") {
    if (
      hasStudentHistory() &&
      !localState.student.visualPreference.focusMode
    ) {
      shell.append(createReturnPlayerHud(home, mission));
    }
    const worldGuide = createWorldGuide();
    if (worldGuide) {
      shell.append(worldGuide);
    }
    shell.append(
      createStudentHero(
        home,
        mission,
        localState.student.visualPreference.focusMode,
      ),
      createRestorativeBanner(home, mission),
      createPassportSection(home),
      createRealmSection(home, activeRole),
      createPlatformSection(activeRole),
    );
  } else {
    shell.append(createRoleNotice(activeRole));
    if (activeRole === "teacher") {
      shell.append(
        createSupportStudio(activeRole),
        createTeacherFilterPanel(),
        createRealmSection(home, activeRole, {
          filters: teacherPlatformFilters,
        }),
        createPlatformSection(activeRole, {
          filters: teacherPlatformFilters,
        }),
      );
    }
    if (activeRole === "parent") {
      shell.append(
        createSupportStudio(activeRole),
        createPlatformSection(activeRole, { includeCore: true }),
      );
    }
  }
  shell.append(createProgressDock());
  app.replaceChildren(shell);
  scheduleProgressDockSafety();
}

window.addEventListener("focus", () => {
  window.requestAnimationFrame(focusPendingReturn);
});
window.addEventListener("scroll", scheduleProgressDockSafety, {
  passive: true,
});
window.addEventListener("resize", scheduleProgressDockSafety);

render();
