export const STRATEGY_OPTIONS = Object.freeze([
  Object.freeze({
    id: "shorter",
    label: "縮短時間",
    guidance: "下一次先走短一點，觀察節奏是否更合適。",
  }),
  Object.freeze({
    id: "different-type",
    label: "換一種題型",
    guidance: "下一次換個入口，觀察哪種練習比較好開始。",
  }),
  Object.freeze({
    id: "retry",
    label: "再試同一站",
    guidance: "保留同一條航線，下一次用自己的速度再試。",
  }),
]);

export const STRATEGY_REVIEW_OPTIONS = Object.freeze([
  Object.freeze({ id: "keep", label: "保留這個方法" }),
  Object.freeze({ id: "adjust", label: "再調整一次" }),
  Object.freeze({ id: "drop", label: "先不設定" }),
]);

export const STRATEGY_NOTICE =
  "策略只記錄這次自我嘗試，不代表學業成效。";

export const WEEKLY_STRATEGY_OPTIONS = Object.freeze([
  Object.freeze({
    id: "quick-start",
    label: "先做 5 分鐘最好開始",
  }),
  Object.freeze({
    id: "favorite-first",
    label: "先選喜歡的科目比較有力氣",
  }),
  Object.freeze({
    id: "ask-for-company",
    label: "有人陪我開始會更穩",
  }),
  Object.freeze({
    id: "still-exploring",
    label: "我還在找適合的方法",
  }),
]);

const VALID_STRATEGIES = new Set([
  ...STRATEGY_OPTIONS.map(({ id }) => id),
  null,
]);
const VALID_REVIEW_DECISIONS = new Set(
  STRATEGY_REVIEW_OPTIONS.map(({ id }) => id),
);
const VALID_WEEKLY_STRATEGIES = new Set([
  ...WEEKLY_STRATEGY_OPTIONS.map(({ id }) => id),
  null,
]);

export function selectStrategy({ status, strategy } = {}) {
  if (status !== "partial") {
    return null;
  }

  if (!VALID_STRATEGIES.has(strategy)) {
    throw new RangeError("不支援的策略選項");
  }

  return strategy;
}

export function reviewStrategy({ strategy, decision } = {}) {
  if (strategy === null) {
    return null;
  }

  if (!VALID_STRATEGIES.has(strategy)) {
    throw new RangeError("不支援的策略選項");
  }

  if (!VALID_REVIEW_DECISIONS.has(decision)) {
    throw new RangeError("不支援的策略回顧選項");
  }

  return { strategy, decision };
}

export function getWeeklyReview({ activeDays = [], reviews = [] } = {}) {
  const activeCount = new Set(activeDays).size;
  const milestone = Math.floor(activeCount / 7) * 7;
  if (
    milestone < 7 ||
    reviews.some((review) => review?.milestone === milestone)
  ) {
    return null;
  }

  return { milestone };
}

export function recordWeeklyReview(
  reviews = [],
  { milestone, strategyId, reviewedAt } = {},
) {
  if (
    !Number.isInteger(milestone) ||
    milestone < 7 ||
    milestone % 7 !== 0
  ) {
    throw new RangeError("回顧里程碑必須是七的正倍數");
  }
  if (!VALID_WEEKLY_STRATEGIES.has(strategyId)) {
    throw new RangeError("不支援的每週策略選項");
  }
  if (
    typeof reviewedAt !== "string" ||
    !Number.isFinite(Date.parse(reviewedAt))
  ) {
    throw new TypeError("回顧時間必須是有效日期");
  }
  if (reviews.some((review) => review?.milestone === milestone)) {
    return reviews;
  }

  return [
    ...reviews,
    Object.freeze({ milestone, strategyId, reviewedAt }),
  ];
}
