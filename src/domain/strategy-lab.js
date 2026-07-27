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

const VALID_STRATEGIES = new Set([
  ...STRATEGY_OPTIONS.map(({ id }) => id),
  null,
]);
const VALID_REVIEW_DECISIONS = new Set(
  STRATEGY_REVIEW_OPTIONS.map(({ id }) => id),
);

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
