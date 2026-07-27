import { buildCompletionPayload } from "../api/class-client.js";

export const MAX_SYNC_QUEUE_SIZE = 100;
const RETRY_DELAYS_MS = [5_000, 30_000, 300_000];

const requireLocalRoutingValue = (value, field) => {
  if (typeof value !== "string" || value.length === 0) {
    throw new TypeError(`${field} 必須是非空字串`);
  }
  return value;
};

export function enqueueSyncEvent(queue, source) {
  const event = buildCompletionPayload(source);

  if (
    queue.some(({ event: queuedEvent }) => queuedEvent.eventId === event.eventId) ||
    queue.length >= MAX_SYNC_QUEUE_SIZE
  ) {
    return queue;
  }

  return [
    ...queue,
    {
      classCode: requireLocalRoutingValue(source.classCode, "classCode"),
      participantToken: requireLocalRoutingValue(
        source.participantToken,
        "participantToken",
      ),
      event,
      attemptCount: 0,
      nextAttemptAt: null,
      waitingForResume: false,
    },
  ];
}

export async function syncNextEvent(
  queue,
  { send, clock, resumeReason = null },
) {
  const now = clock.now();
  const canResume = resumeReason === "online" || resumeReason === "reopen";
  const entryIndex = queue.findIndex(
    ({ nextAttemptAt, waitingForResume }) =>
      (!waitingForResume || canResume) &&
      (nextAttemptAt === null || nextAttemptAt <= now),
  );

  if (entryIndex === -1) {
    return queue;
  }

  const entry = queue[entryIndex];

  try {
    await send({
      classCode: entry.classCode,
      participantToken: entry.participantToken,
      event: entry.event,
    });
    return queue.filter((_, index) => index !== entryIndex);
  } catch {
    const delay = RETRY_DELAYS_MS[entry.attemptCount];
    const updatedEntry = {
      ...entry,
      attemptCount: entry.attemptCount + 1,
      nextAttemptAt: delay === undefined ? null : now + delay,
      waitingForResume: delay === undefined,
    };

    return queue.map((item, index) =>
      index === entryIndex ? updatedEntry : item
    );
  }
}
