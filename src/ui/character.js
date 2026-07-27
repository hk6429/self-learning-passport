import { CHARACTER_CATALOG } from "../data/character-catalog.js";

export const CHARACTER_STATES = Object.freeze([
  "idle",
  "focus",
  "celebrate",
  "recover",
]);

const UNKNOWN_CHARACTER_DISPLAY = Object.freeze({
  mode: "text",
  id: null,
  name: "妖界引路者",
  role: "學習陪伴",
  state: null,
  src: null,
  alt: "妖界引路角色圖像暫不可用。",
  fallbackText: "妖界引路者正在前方，陪你繼續今天的修行。",
  reason: "unknown-character",
});

export function resolveCharacterDisplay({
  characterId,
  state = "idle",
  imageFailed = false,
  catalog = CHARACTER_CATALOG,
} = {}) {
  const character = catalog.find(({ id }) => id === characterId);
  if (!character) {
    return { ...UNKNOWN_CHARACTER_DISPLAY };
  }

  const stateText = character.stateText?.[state];
  const common = {
    id: character.id,
    name: character.name,
    role: character.role,
    state,
    alt: stateText?.alt || character.alt,
    fallbackText: stateText?.fallback || character.assets.fallback,
  };

  if (!CHARACTER_STATES.includes(state) || !character.assets[state]) {
    return {
      mode: "text",
      ...common,
      state: null,
      src: null,
      reason: "unknown-state",
    };
  }

  if (imageFailed) {
    return {
      mode: "text",
      ...common,
      src: null,
      reason: "image-failed",
    };
  }

  return {
    mode: "image",
    ...common,
    src: character.assets[state],
    reason: null,
  };
}
