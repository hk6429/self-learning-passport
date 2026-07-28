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
  const completedBooks = Math.floor(activeDays.length / 7);
  const remainder = activeDays.length % 7;
  return {
    completed: completedBooks > 0,
    completedAt:
      completedBooks > 0 ? activeDays[completedBooks * 7 - 1] : null,
    litCount: remainder === 0 && activeDays.length > 0 ? 7 : remainder,
    completedBooks,
    currentBook: completedBooks + 1,
  };
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
