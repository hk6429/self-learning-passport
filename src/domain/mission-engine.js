import { MISSION_CATALOG } from "../data/mission-catalog.js";
import { validateNorthStar } from "./journey.js";

const ROUTE_LEVELS = Object.freeze(["light", "standard", "challenge"]);

export function selectDailyRoutes({
  siteId,
  dateKey,
  northStar = null,
  missionHistory = {},
  catalog = MISSION_CATALOG,
} = {}) {
  validateNorthStar(northStar);

  const dailyHistory = missionHistory[dateKey];
  const dailyReports = Array.isArray(dailyHistory)
    ? dailyHistory
    : dailyHistory
      ? [dailyHistory]
      : [];
  const alreadyReported = new Set(
    dailyReports
      .filter(({ status }) => status === "complete" || status === "partial")
      .map(({ missionId }) => missionId),
  );

  return ROUTE_LEVELS.flatMap((routeLevel) => {
    const mission = catalog.find(
      (candidate) =>
        candidate.siteId === siteId &&
        candidate.routeLevel === routeLevel &&
        !alreadyReported.has(candidate.id),
    );
    return mission ? [mission] : [];
  });
}

export function buildDailyJourney({ changesUsed = 0, ...routeOptions } = {}) {
  if (!Number.isInteger(changesUsed) || changesUsed < 0) {
    throw new TypeError("更換次數必須是非負整數");
  }

  const canChange = changesUsed === 0;
  return {
    routes: selectDailyRoutes(routeOptions),
    canChange,
    changeCost: canChange ? 0 : null,
    canRest: true,
  };
}
