import { MISSION_CATALOG } from "../data/mission-catalog.js";

const EVENT_TYPES = new Set([
  "onboarding_started",
  "north_star_selected",
  "route_options_viewed",
  "route_changed",
  "mission_started",
  "mission_returned",
  "mission_reported",
  "feedback_rendered",
  "curiosity_viewed",
  "curiosity_closed",
  "strategy_viewed",
  "strategy_selected",
  "strategy_reviewed",
  "map_viewed",
  "encouragement_viewed",
  "encouragement_rated",
  "peer_presence_viewed",
  "milestone_reached",
  "recovery_viewed",
  "rest_suggested",
  "rest_adopted",
]);

const MISSION_IDS = new Set(MISSION_CATALOG.map(({ id }) => id));
const ROUTE_LEVELS = new Set(["light", "standard", "challenge"]);
const OUTCOMES = new Set(["complete", "partial", "skipped", null]);
const RETENTION_MS = 90 * 86_400_000;
const EVENT_FIELDS = new Set(["id", "type", "occurredAt", "context"]);

const CONTEXT_VALIDATORS = {
  missionId: (value) => MISSION_IDS.has(value),
  routeLevel: (value) => ROUTE_LEVELS.has(value),
  elapsedMs: (value) => Number.isInteger(value) && value >= 0,
  outcome: (value) => OUTCOMES.has(value),
};

function validateContext(context) {
  if (
    context === null ||
    typeof context !== "object" ||
    Array.isArray(context)
  ) {
    throw new TypeError("context 值不合法");
  }

  for (const [field, value] of Object.entries(context)) {
    const validate = CONTEXT_VALIDATORS[field];

    if (!validate) {
      throw new TypeError(`不允許的 context 欄位：${field}`);
    }

    if (!validate(value)) {
      throw new TypeError(`context 值不合法：${field}`);
    }
  }
}

export function appendMeasurement(events, event) {
  for (const field of Object.keys(event)) {
    if (!EVENT_FIELDS.has(field)) {
      throw new TypeError(`不允許的事件欄位：${field}`);
    }
  }

  if (!EVENT_TYPES.has(event.type)) {
    throw new TypeError(`不支援的量測事件：${event.type}`);
  }

  if (
    typeof event.id !== "string" ||
    !/^[A-Za-z0-9_-]{1,100}$/.test(event.id)
  ) {
    throw new TypeError("事件識別碼不合法");
  }

  if (
    typeof event.occurredAt !== "string" ||
    !Number.isFinite(Date.parse(event.occurredAt)) ||
    new Date(event.occurredAt).toISOString() !== event.occurredAt
  ) {
    throw new TypeError("事件時間必須是完整 ISO timestamp");
  }

  validateContext(event.context);

  return [
    ...events,
    {
      id: event.id,
      type: event.type,
      occurredAt: event.occurredAt,
      context: { ...event.context },
    },
  ].slice(-500);
}

export function pruneMeasurements(events, { now }) {
  const retentionStart = Date.parse(now) - RETENTION_MS;

  return events
    .filter(({ occurredAt }) => Date.parse(occurredAt) >= retentionStart)
    .slice(-500);
}

export function getLocalMeasurementSnapshot(events, { now }) {
  return {
    localOnly: true,
    events: pruneMeasurements(events, { now }).map((event) => ({
      id: event.id,
      type: event.type,
      occurredAt: event.occurredAt,
      context: { ...event.context },
    })),
  };
}
