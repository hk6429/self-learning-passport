import { buildHomeState } from "./domain/home-state.js";
import { getPlatformsForRole } from "./domain/platform-guide.js";
import { getReturnVoyage, getSevenLights } from "./domain/progress.js";
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
  const panel = node("section", {
    className: "role-panel",
    attributes: { "aria-label": "選擇使用身份" },
  });
  panel.append(
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

  panel.append(switcher);
  return panel;
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
  scroll.append(meta);
  scroll.append(
    node("p", {
      className: "clue-box",
      text: `先帶著一個線索出發：${mission.curiosityPrompt}`,
    }),
  );

  const link = node("a", {
    className: "primary-cta",
    text: `前往 ${mission.durationMinutes} 分鐘修行`,
    attributes: {
      href: mission.url,
      "aria-label": `開新分頁前往${mission.subject}任務：${mission.title}`,
    },
  });
  link.target = "_blank";
  link.rel = "noopener noreferrer";
  scroll.append(
    link,
    node("p", {
      className: "mission-note",
      text: "完成多少都可以回來落印；系統不會讀取外站成績。",
    }),
  );

  hero.append(stage, scroll);
  return hero;
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

  link.append(
    top,
    node("p", { className: "platform-subject", text: platform.subject }),
    node("h3", { text: platform.title }),
    node("strong", { className: "platform-caption", text: platform.caption }),
    node("p", {
      className: "platform-description",
      text: platform.description,
    }),
    tags,
  );
  return link;
}

function createPlatformSection(activeRole, { includeCore = false } = {}) {
  const platforms = getPlatformsForRole(activeRole, { includeCore });
  const content = {
    student: {
      eyebrow: "支線妖境",
      title: "還有更多世界，等你照興趣探路",
      description:
        "七座主域之外，閱讀解謎與習慣養成也能成為今天的一小步。",
    },
    teacher: {
      eyebrow: "完整站群",
      title: "把十二個非會考平台帶進教學現場",
      description:
        "上方七座主域適合每日任務；下方支線補上閱讀解謎、習慣經營與教師專業成長。",
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
  for (const platform of platforms) {
    grid.append(createPlatformCard(platform));
  }
  section.append(heading, grid);
  return section;
}

function createRealmSection(home, activeRole) {
  const section = node("section", {
    className: "realm-section",
    attributes: { "aria-labelledby": "realm-heading" },
  });
  const heading = node("header", { className: "section-heading" });
  const titleWrap = node("div");
  titleWrap.append(
    node("p", { className: "eyebrow", text: "七域同行" }),
    node("h2", {
      text: activeRole === "teacher" ? "安排班級今日航線" : "選一座今天想走的妖域",
      attributes: { id: "realm-heading" },
    }),
  );
  heading.append(
    titleWrap,
    node("p", {
      text:
        activeRole === "teacher"
          ? "所有任務都來自固定白名單；選擇時長，只安排合宜的共同節奏。"
          : "國語文、英文、數學各有三種時長。沒有最強路線，只有今天最合適的那一條。",
    }),
  );

  const grid = node("div", { className: "realm-grid" });
  for (const realm of home.realms) {
    const card = createRealmCard(
      document,
      { ...realm, missions: realm.routes },
      {
        onSelect(missionId) {
          selectedMissionId = missionId;
          const selected = realm.routes.find(({ id }) => id === missionId);
          if (activeRole === "student" && selected) {
            localState = {
              ...localState,
              student: {
                ...localState.student,
                primarySubject: realm.subject,
                dailyMinutes: selected.durationMinutes,
              },
            };
            saveLocalState();
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
  const dock = node("aside", {
    className: "progress-dock",
    attributes: {
      "aria-label": `七燈破霧，目前點亮 ${lights.litCount} 盞`,
    },
  });
  dock.append(
    node("span", {
      className: "lamp-count",
      text: String(lights.litCount),
      attributes: { "aria-hidden": "true" },
    }),
    node("span", { text: "七燈破霧・不必連續" }),
  );
  return dock;
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
    text: localState.student.visualPreference.focusMode
      ? "離開純任務模式"
      : "純任務模式",
    attributes: {
      type: "button",
      "aria-pressed": String(localState.student.visualPreference.focusMode),
    },
  });
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
    shell.append(
      createStudentHero(
        home,
        mission,
        localState.student.visualPreference.focusMode,
      ),
      createRestorativeBanner(home, mission),
      createRealmSection(home, activeRole),
      createPlatformSection(activeRole),
    );
  } else {
    shell.append(createRoleNotice(activeRole));
    if (activeRole === "teacher") {
      shell.append(
        createRealmSection(home, activeRole),
        createPlatformSection(activeRole),
      );
    }
    if (activeRole === "parent") {
      shell.append(
        createPlatformSection(activeRole, { includeCore: true }),
      );
    }
  }
  shell.append(createProgressDock());
  app.replaceChildren(shell);
}

render();
