import { CLOSING_PROMPTS } from "./gamification-coach.js";

const MAX_SHARED_MISSIONS = 14;
const ASSIGNMENT_ROLES = new Set(["required", "choice"]);
const MISSION_PHASES = new Set(["warmup", "core", "closing"]);

function getCatalogMap(catalog) {
  if (!Array.isArray(catalog) || catalog.length === 0) {
    throw new TypeError("分享航線需要任務目錄");
  }
  return new Map(catalog.map((mission) => [mission.id, mission]));
}

function validateMissionIds(missionIds, catalog) {
  if (!Array.isArray(missionIds)) {
    throw new TypeError("分享航線必須提供任務清單");
  }
  if (missionIds.length < 1 || missionIds.length > MAX_SHARED_MISSIONS) {
    throw new RangeError("分享航線只接受 1 至 14 個任務");
  }

  const catalogMap = getCatalogMap(catalog);
  const uniqueIds = [...new Set(missionIds)];
  if (
    uniqueIds.length !== missionIds.length ||
    uniqueIds.some((missionId) => !catalogMap.has(missionId))
  ) {
    throw new RangeError("分享航線只能包含不重複的白名單任務");
  }
  return { catalogMap, missionIds: uniqueIds };
}

function normalizeMissionSetting(
  settings,
  missionIds,
  validValues,
  fallback,
  fieldName,
) {
  const source = settings ?? {};
  return Object.fromEntries(
    missionIds.map((missionId) => {
      const value = source[missionId] ?? fallback;
      if (!validValues.has(value)) {
        throw new RangeError(`不支援的${fieldName}`);
      }
      return [missionId, value];
    }),
  );
}

export function createSharedPlanUrl({
  baseUrl,
  missionIds,
  catalog,
  assignmentByMission,
  phaseByMission,
  closingPromptId = "method",
} = {}) {
  const validated = validateMissionIds(missionIds, catalog);
  const assignments = normalizeMissionSetting(
    assignmentByMission,
    validated.missionIds,
    ASSIGNMENT_ROLES,
    "required",
    "任務選擇規則",
  );
  const phases = normalizeMissionSetting(
    phaseByMission,
    validated.missionIds,
    MISSION_PHASES,
    "core",
    "任務階段",
  );
  if (!CLOSING_PROMPTS.some(({ id }) => id === closingPromptId)) {
    throw new RangeError("不支援的班級收束提問");
  }
  const url = new URL(baseUrl);
  url.searchParams.set("missions", validated.missionIds.join(","));
  const choiceIds = validated.missionIds.filter(
    (missionId) => assignments[missionId] === "choice",
  );
  if (choiceIds.length > 0) {
    url.searchParams.set("choice", choiceIds.join(","));
  }
  url.searchParams.set(
    "phases",
    validated.missionIds
      .map((missionId) => `${missionId}:${phases[missionId]}`)
      .join(","),
  );
  url.searchParams.set("closing", closingPromptId);
  return url.toString();
}

export function readSharedPlan(candidate, { catalog } = {}) {
  const url = new URL(candidate);
  const missionIds = (url.searchParams.get("missions") ?? "")
    .split(",")
    .filter(Boolean);
  const validated = validateMissionIds(missionIds, catalog);
  const choiceIds = new Set(
    (url.searchParams.get("choice") ?? "").split(",").filter(Boolean),
  );
  if ([...choiceIds].some((missionId) => !missionIds.includes(missionId))) {
    throw new RangeError("任選任務必須包含在分享航線");
  }
  const phaseEntries = (url.searchParams.get("phases") ?? "")
    .split(",")
    .filter(Boolean)
    .map((entry) => entry.split(":"));
  const phaseByMission = Object.fromEntries(phaseEntries);
  for (const [missionId, phase] of phaseEntries) {
    if (!missionIds.includes(missionId) || !MISSION_PHASES.has(phase)) {
      throw new RangeError("分享航線包含不支援的任務階段");
    }
  }
  const closingPromptId = url.searchParams.get("closing") ?? "method";
  const closingPrompt = CLOSING_PROMPTS.find(
    ({ id }) => id === closingPromptId,
  );
  if (!closingPrompt) {
    throw new RangeError("分享航線包含不支援的收束提問");
  }
  return Object.freeze({
    missions: Object.freeze(
      validated.missionIds.map((missionId) =>
        Object.freeze({
          ...validated.catalogMap.get(missionId),
          assignmentRole: choiceIds.has(missionId) ? "choice" : "required",
          phase: phaseByMission[missionId] ?? "core",
        }),
      ),
    ),
    closingPrompt: Object.freeze({ ...closingPrompt }),
  });
}

export function buildSharedPlanSummary(missions = []) {
  if (
    !Array.isArray(missions) ||
    missions.some(
      (mission) =>
        !mission?.id ||
        !mission.subject ||
        !Number.isInteger(mission.durationMinutes),
    )
  ) {
    throw new TypeError("班級航線摘要需要有效任務");
  }
  return Object.freeze({
    missionCount: missions.length,
    totalMinutes: missions.reduce(
      (total, mission) => total + mission.durationMinutes,
      0,
    ),
    subjects: Object.freeze([
      ...new Set(missions.map(({ subject }) => subject)),
    ]),
  });
}
