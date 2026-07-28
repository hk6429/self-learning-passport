const MAX_SHARED_MISSIONS = 14;

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

export function createSharedPlanUrl({ baseUrl, missionIds, catalog } = {}) {
  const validated = validateMissionIds(missionIds, catalog);
  const url = new URL(baseUrl);
  url.searchParams.set("missions", validated.missionIds.join(","));
  return url.toString();
}

export function readSharedPlan(candidate, { catalog } = {}) {
  const url = new URL(candidate);
  const missionIds = (url.searchParams.get("missions") ?? "")
    .split(",")
    .filter(Boolean);
  const validated = validateMissionIds(missionIds, catalog);
  return Object.freeze({
    missions: Object.freeze(
      validated.missionIds.map((missionId) =>
        Object.freeze({ ...validated.catalogMap.get(missionId) }),
      ),
    ),
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
