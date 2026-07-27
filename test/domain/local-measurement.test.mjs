import assert from "node:assert/strict";
import test from "node:test";

import {
  appendMeasurement,
  getLocalMeasurementSnapshot,
  pruneMeasurements,
} from "../../src/domain/local-measurement.js";

const EVENT_TYPES = [
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
];

test("只接受規格列出的 20 種本機量測事件", () => {
  let events = [];

  for (const [index, type] of EVENT_TYPES.entries()) {
    events = appendMeasurement(events, {
      id: `event-${index}`,
      type,
      occurredAt: "2026-07-27T10:00:00.000Z",
      context: {},
    });
  }

  assert.deepEqual(events.map((event) => event.type), EVENT_TYPES);
  assert.throws(
    () =>
      appendMeasurement(events, {
        id: "event-unknown",
        type: "free_text_submitted",
        occurredAt: "2026-07-27T10:00:00.000Z",
        context: {},
      }),
    /不支援的量測事件/,
  );
});

test("事件必須提供安全識別碼與有效 ISO 時間", () => {
  const event = {
    id: "event-valid_01",
    type: "mission_started",
    occurredAt: "2026-07-27T10:00:00.000Z",
    context: {},
  };

  assert.equal(appendMeasurement([], event)[0].id, event.id);

  for (const invalid of [
    { ...event, id: "" },
    { ...event, id: "含有 空白" },
    { ...event, occurredAt: "不是日期" },
    { ...event, occurredAt: "2026-07-27" },
  ]) {
    assert.throws(() => appendMeasurement([], invalid), TypeError);
  }
});

test("context 只保存任務列舉與非負整數，拒絕自由文字及敏感欄位", () => {
  const event = {
    id: "event-safe-context",
    type: "mission_reported",
    occurredAt: "2026-07-27T10:00:00.000Z",
    context: {
      missionId: "ink-cave-first-thread",
      routeLevel: "light",
      elapsedMs: 12_000,
      outcome: "partial",
    },
  };

  const [saved] = appendMeasurement([], event);
  assert.deepEqual(saved.context, event.context);

  for (const field of [
    "reflection",
    "answer",
    "name",
    "classTitle",
    "token",
    "freeText",
  ]) {
    assert.throws(
      () =>
        appendMeasurement([], {
          ...event,
          id: `event-${field}`,
          context: { ...event.context, [field]: "不應保存" },
        }),
      /不允許的 context 欄位/,
    );
  }

  assert.throws(
    () =>
      appendMeasurement([], {
        ...event,
        id: "event-invalid-enum",
        context: { ...event.context, routeLevel: "legendary" },
      }),
    /context 值不合法/,
  );
  assert.throws(
    () =>
      appendMeasurement([], {
        ...event,
        id: "event-invalid-integer",
        context: { ...event.context, elapsedMs: "12000" },
      }),
    /context 值不合法/,
  );
  assert.throws(
    () => appendMeasurement([], { ...event, reflection: "不應保存" }),
    /不允許的事件欄位/,
  );
});

test("append 最多保留最新 500 筆本機事件", () => {
  const existing = Array.from({ length: 500 }, (_, index) => ({
    id: `event-${index}`,
    type: "mission_started",
    occurredAt: new Date(Date.UTC(2026, 6, 1, 0, index)).toISOString(),
    context: {},
  }));

  const events = appendMeasurement(existing, {
    id: "event-500",
    type: "mission_started",
    occurredAt: "2026-07-27T10:00:00.000Z",
    context: {},
  });

  assert.equal(events.length, 500);
  assert.equal(events[0].id, "event-1");
  assert.equal(events.at(-1).id, "event-500");
});

test("prune 移除超過 90 天的事件並保留期限邊界", () => {
  const now = Date.parse("2026-07-27T10:00:00.000Z");
  const daysAgo = (days) => new Date(now - days * 86_400_000).toISOString();
  const events = [
    {
      id: "event-expired",
      type: "map_viewed",
      occurredAt: daysAgo(91),
      context: {},
    },
    {
      id: "event-boundary",
      type: "map_viewed",
      occurredAt: daysAgo(90),
      context: {},
    },
    {
      id: "event-recent",
      type: "map_viewed",
      occurredAt: daysAgo(1),
      context: {},
    },
  ];

  assert.deepEqual(
    pruneMeasurements(events, { now: new Date(now).toISOString() }).map(
      ({ id }) => id,
    ),
    ["event-boundary", "event-recent"],
  );
});

test("安全快照只供本機使用且不暴露可變參照或網路 payload", () => {
  const events = appendMeasurement([], {
    id: "event-snapshot",
    type: "mission_reported",
    occurredAt: "2026-07-27T10:00:00.000Z",
    context: {
      missionId: "ink-cave-first-thread",
      elapsedMs: 12_000,
      outcome: "complete",
    },
  });

  const snapshot = getLocalMeasurementSnapshot(events, {
    now: "2026-07-27T10:00:00.000Z",
  });

  assert.deepEqual(Object.keys(snapshot), ["localOnly", "events"]);
  assert.equal(snapshot.localOnly, true);
  assert.deepEqual(snapshot.events, events);
  assert.equal("payload" in snapshot, false);

  snapshot.events[0].context.elapsedMs = 1;
  assert.equal(events[0].context.elapsedMs, 12_000);
});
