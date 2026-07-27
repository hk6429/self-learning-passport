import { MISSION_CATALOG } from "../data/mission-catalog.js";

const uniqueField = (items, field) => {
  const values = items.map((item) => item[field]);

  if (new Set(values).size !== values.length) {
    throw new Error(`內容線索的 ${field} 必須唯一`);
  }
};

const curiosityCatalog = MISSION_CATALOG.map(
  ({ id: missionId, curiosityPromptId, revealId }) =>
    Object.freeze({
      curiosityPromptId,
      missionId,
      revealId,
      skippable: true,
    }),
);

uniqueField(curiosityCatalog, "curiosityPromptId");
uniqueField(curiosityCatalog, "missionId");
uniqueField(curiosityCatalog, "revealId");

export const CURIOSITY_CATALOG = Object.freeze(curiosityCatalog);

const REVEALABLE_STATUSES = new Set(["complete", "partial"]);

export function unlockCuriosityReveal({
  curiosityPromptId,
  missionId,
  status,
} = {}) {
  if (!REVEALABLE_STATUSES.has(status)) {
    return null;
  }

  const clue = CURIOSITY_CATALOG.find(
    (candidate) =>
      candidate.curiosityPromptId === curiosityPromptId &&
      candidate.missionId === missionId,
  );

  return clue?.revealId ?? null;
}
