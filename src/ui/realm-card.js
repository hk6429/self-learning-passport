import { resolveCharacterDisplay } from "./character.js";
import { createTextElement, setSafeText } from "./shared.js";

const SUBJECT_LABELS = Object.freeze({
  language: "國語文",
  english: "英文",
  math: "數學",
});

const REQUIRED_DURATIONS = Object.freeze([5, 10, 15]);

function orderedMissions(missions) {
  if (!Array.isArray(missions) || missions.length !== 3) {
    throw new TypeError("妖域航線必須包含 5、10、15 分鐘");
  }

  const ordered = [...missions].sort(
    (left, right) => left.durationMinutes - right.durationMinutes,
  );
  if (
    ordered.some(
      ({ durationMinutes }, index) =>
        durationMinutes !== REQUIRED_DURATIONS[index],
    )
  ) {
    throw new TypeError("妖域航線必須包含 5、10、15 分鐘");
  }

  return ordered;
}

function createNpcFigure(documentAdapter, primaryNpcId) {
  const figure = documentAdapter.createElement("figure");
  figure.className = "realm-card__npc";

  const display = resolveCharacterDisplay({
    characterId: primaryNpcId,
    state: "idle",
  });
  const fallback = createTextElement(
    documentAdapter,
    "p",
    display.fallbackText,
    { className: "realm-card__npc-fallback" },
  );
  fallback.setAttribute("role", "img");
  fallback.setAttribute("aria-label", display.alt);

  if (display.mode === "image") {
    const image = documentAdapter.createElement("img");
    image.className = "realm-card__npc-image";
    image.src = display.src;
    image.alt = display.alt;
    fallback.hidden = true;

    image.addEventListener("error", () => {
      const failedDisplay = resolveCharacterDisplay({
        characterId: primaryNpcId,
        state: "idle",
        imageFailed: true,
      });
      image.hidden = true;
      setSafeText(fallback, failedDisplay.fallbackText);
      fallback.setAttribute("aria-label", failedDisplay.alt);
      fallback.hidden = false;
    });
    figure.append(image, fallback);
  } else {
    fallback.hidden = false;
    figure.append(fallback);
  }

  return figure;
}

export function createRealmCard(
  documentAdapter,
  realmViewModel,
  { onSelect = () => {} } = {},
) {
  if (typeof documentAdapter?.createElement !== "function") {
    throw new TypeError("需要可建立元素的 document adapter");
  }
  if (typeof onSelect !== "function") {
    throw new TypeError("onSelect 必須是函式");
  }

  const missions = orderedMissions(realmViewModel?.missions);
  const card = documentAdapter.createElement("article");
  card.className = "realm-card";
  card.setAttribute("aria-label", `${realmViewModel.name}學習妖域`);

  const heading = createTextElement(
    documentAdapter,
    "h2",
    realmViewModel.name,
    { className: "realm-card__title" },
  );
  const subject = createTextElement(
    documentAdapter,
    "p",
    SUBJECT_LABELS[realmViewModel.subject] ?? realmViewModel.subject,
    { className: "realm-card__subject" },
  );
  const routes = documentAdapter.createElement("div");
  routes.className = "realm-card__routes";
  routes.setAttribute("role", "group");
  routes.setAttribute("aria-label", `${realmViewModel.name}今日航線`);

  for (const mission of missions) {
    const button = createTextElement(
      documentAdapter,
      "button",
      `${mission.durationMinutes} 分鐘｜${mission.title}`,
      { className: "realm-card__route" },
    );
    button.type = "button";
    button.setAttribute(
      "aria-label",
      `${realmViewModel.name}，${mission.durationMinutes} 分鐘航線：${mission.title}`,
    );
    button.setAttribute("data-mission-id", mission.id);
    button.addEventListener("click", () => onSelect(mission.id));
    routes.append(button);
  }

  card.append(
    createNpcFigure(documentAdapter, realmViewModel.primaryNpcId),
    heading,
    subject,
    routes,
  );
  return card;
}
