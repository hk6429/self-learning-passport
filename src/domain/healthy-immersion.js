const REST_MESSAGE = "先讓眼睛和腦袋休息一下，想回來時路還在。";

export function getRestSuggestion({
  selectedMinutes,
  elapsedMinutes,
  sessionStarts = [],
  now,
}) {
  const reasons = [];

  if (elapsedMinutes > selectedMinutes * 2) {
    reasons.push("duration");
  }

  const nowTime = Date.parse(now);
  const recentStartCount = sessionStarts.filter((startedAt) => {
    const age = nowTime - Date.parse(startedAt);
    return age >= 0 && age <= 30 * 60 * 1_000;
  }).length;

  if (recentStartCount >= 3) {
    reasons.push("frequent-starts");
  }

  if (reasons.length === 0) {
    return null;
  }

  return {
    recommended: true,
    reasons,
    message: REST_MESSAGE,
    localOnly: true,
    blocksExit: false,
  };
}
