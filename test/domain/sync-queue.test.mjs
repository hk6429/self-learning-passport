import assert from "node:assert/strict";
import test from "node:test";

import {
  MAX_SYNC_QUEUE_SIZE,
  enqueueSyncEvent,
  syncNextEvent,
} from "../../src/domain/sync-queue.js";

const event = (eventId) => ({
  classCode: "ABC123",
  participantToken: "local-participant-secret",
  eventId,
  missionId: "golden-ridge-first-step",
  status: "complete",
  completedAt: "2026-07-27T10:00:00.000Z",
  reflection: "私人內容",
});

test("同步佇列依 eventId 去重、只存匿名 payload 且上限一百筆", () => {
  const once = enqueueSyncEvent([], event("event-1"));
  const duplicate = enqueueSyncEvent(
    once,
    { ...event("event-1"), missionId: "wind-valley-first-leaf" },
  );

  assert.equal(MAX_SYNC_QUEUE_SIZE, 100);
  assert.equal(duplicate.length, 1);
  assert.deepEqual(duplicate[0], {
    classCode: "ABC123",
    participantToken: "local-participant-secret",
    event: {
      eventId: "event-1",
      missionId: "golden-ridge-first-step",
      status: "complete",
      completedAt: "2026-07-27T10:00:00.000Z",
    },
    attemptCount: 0,
    nextAttemptAt: null,
    waitingForResume: false,
  });

  let fullQueue = [];
  for (let index = 0; index < 101; index += 1) {
    fullQueue = enqueueSyncEvent(fullQueue, event(`event-${index}`));
  }

  assert.equal(fullQueue.length, 100);
  assert.equal(
    fullQueue.some(({ event: queuedEvent }) => queuedEvent.eventId === "event-100"),
    false,
  );
});

test("同步時保留本機班級路由，但不把路由或權杖放入事件 payload", async () => {
  const queue = enqueueSyncEvent([], {
    ...event("event-routed"),
    classCode: "XYZ789",
    participantToken: "second-local-secret",
  });
  let received;

  const synced = await syncNextEvent(queue, {
    send: async (entry) => {
      received = entry;
    },
    clock: { now: () => 0 },
  });

  assert.equal(received.classCode, "XYZ789");
  assert.equal(received.participantToken, "second-local-secret");
  assert.deepEqual(Object.keys(received.event).sort(), [
    "completedAt",
    "eventId",
    "missionId",
    "status",
  ]);
  assert.equal("classCode" in received.event, false);
  assert.equal("participantToken" in received.event, false);
  assert.deepEqual(synced, []);
});

test("失敗保留事件與個人紀錄並排定重試，成功後才移除", async () => {
  const personalRecord = {
    missionHistory: {
      "2026-07-27": {
        missionId: "golden-ridge-first-step",
        reflection: "只留在本機",
      },
    },
  };
  const personalSnapshot = structuredClone(personalRecord);
  const queued = enqueueSyncEvent([], event("event-retry"));

  const failed = await syncNextEvent(queued, {
    send: async () => {
      throw new TypeError("offline");
    },
    clock: { now: () => 1_000 },
  });

  assert.deepEqual(personalRecord, personalSnapshot);
  assert.equal(failed.length, 1);
  assert.equal(failed[0].attemptCount, 1);
  assert.equal(failed[0].nextAttemptAt, 6_000);
  assert.equal(failed[0].waitingForResume, false);

  let sendCount = 0;
  const beforeDue = await syncNextEvent(failed, {
    send: async () => {
      sendCount += 1;
    },
    clock: { now: () => 5_999 },
  });

  assert.equal(sendCount, 0);
  assert.deepEqual(beforeDue, failed);

  const synced = await syncNextEvent(failed, {
    send: async () => {
      sendCount += 1;
      return { accepted: true };
    },
    clock: { now: () => 6_000 },
  });

  assert.equal(sendCount, 1);
  assert.deepEqual(synced, []);
  assert.deepEqual(personalRecord, personalSnapshot);
});

test("重試依五秒、三十秒、五分鐘進行，之後只等 online 或重開", async () => {
  let queue = enqueueSyncEvent([], event("event-backoff"));
  const fail = async () => {
    throw new TypeError("offline");
  };

  queue = await syncNextEvent(queue, {
    send: fail,
    clock: { now: () => 0 },
  });
  assert.deepEqual(
    {
      attemptCount: queue[0].attemptCount,
      nextAttemptAt: queue[0].nextAttemptAt,
      waitingForResume: queue[0].waitingForResume,
    },
    { attemptCount: 1, nextAttemptAt: 5_000, waitingForResume: false },
  );

  queue = await syncNextEvent(queue, {
    send: fail,
    clock: { now: () => 5_000 },
  });
  assert.equal(queue[0].nextAttemptAt, 35_000);

  queue = await syncNextEvent(queue, {
    send: fail,
    clock: { now: () => 35_000 },
  });
  assert.equal(queue[0].nextAttemptAt, 335_000);

  queue = await syncNextEvent(queue, {
    send: fail,
    clock: { now: () => 335_000 },
  });
  assert.deepEqual(
    {
      attemptCount: queue[0].attemptCount,
      nextAttemptAt: queue[0].nextAttemptAt,
      waitingForResume: queue[0].waitingForResume,
    },
    { attemptCount: 4, nextAttemptAt: null, waitingForResume: true },
  );

  let sendCount = 0;
  const waiting = await syncNextEvent(queue, {
    send: async () => {
      sendCount += 1;
    },
    clock: { now: () => 999_999 },
  });
  assert.equal(sendCount, 0);
  assert.deepEqual(waiting, queue);

  for (const resumeReason of ["online", "reopen"]) {
    const resumed = await syncNextEvent(structuredClone(queue), {
      send: async () => {
        sendCount += 1;
      },
      clock: { now: () => 999_999 },
      resumeReason,
    });

    assert.deepEqual(resumed, []);
  }
  assert.equal(sendCount, 2);
});
