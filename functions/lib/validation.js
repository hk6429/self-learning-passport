import { MISSION_CATALOG } from "../../src/data/mission-catalog.js";

const EMAIL_PATTERN = /\b[\w.+-]+@[\w.-]+\.[a-z]{2,}\b/i;
const URL_PATTERN =
  /(?:https?:\/\/|www\.|\b[a-z0-9-]+\.(?:com|net|org|edu|gov|tw|io|dev|app)\b)/i;
const MISSION_IDS = new Set(MISSION_CATALOG.map(({ id }) => id));
const CLASS_INPUT_FIELDS = new Set(["title", "missionIds", "retentionDays"]);

export function validateClassInput(input) {
  for (const field of Object.keys(input)) {
    if (!CLASS_INPUT_FIELDS.has(field)) {
      throw new TypeError(`不允許的建班欄位：${field}`);
    }
  }

  if (![7, 30, 90].includes(input.retentionDays)) {
    throw new TypeError("保存期限只接受 7、30 或 90 天。");
  }

  const title = typeof input.title === "string" ? input.title.trim() : "";
  if (
    [...title].length < 1 ||
    [...title].length > 40 ||
    EMAIL_PATTERN.test(title) ||
    URL_PATTERN.test(title)
  ) {
    throw new TypeError("班級標題須為 1 至 40 字，且不得包含 Email 或網址。");
  }

  if (
    !Array.isArray(input.missionIds) ||
    input.missionIds.length < 1 ||
    input.missionIds.length > 14 ||
    new Set(input.missionIds).size !== input.missionIds.length ||
    input.missionIds.some((missionId) => !MISSION_IDS.has(missionId))
  ) {
    throw new TypeError("任務目錄須包含 1 至 14 個不重複的靜態任務 ID。");
  }

  return {
    title,
    missionIds: [...input.missionIds],
    retentionDays: input.retentionDays,
  };
}
