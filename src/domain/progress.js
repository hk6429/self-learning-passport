const ACTIVE_STATUSES = new Set(["complete", "partial"]);

const taipeiDateFormatter = new Intl.DateTimeFormat("en-CA", {
  timeZone: "Asia/Taipei",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

const toTaipeiDate = (occurredAt) => taipeiDateFormatter.format(new Date(occurredAt));

const toDayNumber = (date) => Date.parse(`${date}T00:00:00.000Z`) / 86_400_000;

export function recordProgress(progress, event) {
  if (!ACTIVE_STATUSES.has(event.status)) {
    return progress;
  }

  const activeDays = [...new Set([...(progress.activeDays ?? []), toTaipeiDate(event.occurredAt)])]
    .sort();

  return { ...progress, activeDays };
}

export function getSevenLights(progress) {
  const activeDays = [...new Set(progress.activeDays ?? [])].sort();
  let windowStart = 0;
  let litCount = 0;

  for (let windowEnd = 0; windowEnd < activeDays.length; windowEnd += 1) {
    while (
      toDayNumber(activeDays[windowEnd]) - toDayNumber(activeDays[windowStart]) > 13
    ) {
      windowStart += 1;
    }

    const windowCount = windowEnd - windowStart + 1;
    litCount = Math.max(litCount, Math.min(windowCount, 7));

    if (windowCount >= 7) {
      return {
        completed: true,
        completedAt: activeDays[windowEnd],
        litCount: 7,
      };
    }
  }

  return { completed: false, completedAt: null, litCount };
}

export function getReturnVoyage(progress, { now }) {
  const lastActiveDay = [...new Set(progress.activeDays ?? [])].sort().at(-1);
  const currentDay = toTaipeiDate(now);

  if (!lastActiveDay || toDayNumber(currentDay) - toDayNumber(lastActiveDay) < 2) {
    return null;
  }

  return {
    durationMinutes: 5,
    message: "你回來了，路還在。",
  };
}
