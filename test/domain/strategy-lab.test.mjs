import assert from "node:assert/strict";
import test from "node:test";

import {
  STRATEGY_OPTIONS,
  STRATEGY_NOTICE,
  STRATEGY_REVIEW_OPTIONS,
  getWeeklyReview,
  recordWeeklyReview,
  reviewStrategy,
  selectStrategy,
} from "../../src/domain/strategy-lab.js";

test("只有部分完成後可選縮短、換題型、重試或不設定", () => {
  assert.deepEqual(
    STRATEGY_OPTIONS.map(({ id }) => id),
    ["shorter", "different-type", "retry"],
  );

  for (const strategy of ["shorter", "different-type", "retry", null]) {
    assert.equal(selectStrategy({ status: "partial", strategy }), strategy);
  }

  assert.equal(
    selectStrategy({ status: "complete", strategy: "shorter" }),
    null,
  );
  assert.equal(
    selectStrategy({ status: "skipped", strategy: "retry" }),
    null,
  );
  assert.throws(
    () => selectStrategy({ status: "partial", strategy: "best-score" }),
    RangeError,
  );
});

test("下一次回顧只接受保留、調整或放棄，並明示不代表學業成效", () => {
  assert.deepEqual(
    STRATEGY_REVIEW_OPTIONS.map(({ id }) => id),
    ["keep", "adjust", "drop"],
  );

  for (const decision of ["keep", "adjust", "drop"]) {
    assert.deepEqual(
      reviewStrategy({ strategy: "shorter", decision }),
      { strategy: "shorter", decision },
    );
  }

  assert.equal(reviewStrategy({ strategy: null, decision: "keep" }), null);
  assert.throws(
    () => reviewStrategy({ strategy: "shorter", decision: "win" }),
    RangeError,
  );
  assert.throws(
    () => reviewStrategy({ strategy: "best-score", decision: "keep" }),
    RangeError,
  );
  assert.match(STRATEGY_NOTICE, /不代表學業成效/);

  const optionText = [
    ...STRATEGY_OPTIONS,
    ...STRATEGY_REVIEW_OPTIONS,
  ].map((option) => JSON.stringify(option)).join("");

  assert.doesNotMatch(optionText, /保證|證明|提升成績|學業進步/);
});

test("每七個活躍日提供一次低輸入策略回顧，完成或略過後不重複出現", () => {
  const activeDays = Array.from(
    { length: 14 },
    (_, index) => `2026-07-${String(index + 1).padStart(2, "0")}`,
  );

  assert.equal(getWeeklyReview({ activeDays: activeDays.slice(0, 6) }), null);
  assert.deepEqual(
    getWeeklyReview({ activeDays: activeDays.slice(0, 7), reviews: [] }),
    { milestone: 7 },
  );

  const firstReview = recordWeeklyReview([], {
    milestone: 7,
    strategyId: "quick-start",
    reviewedAt: "2026-07-07T12:00:00.000Z",
  });
  assert.equal(
    getWeeklyReview({
      activeDays: activeDays.slice(0, 13),
      reviews: firstReview,
    }),
    null,
  );
  assert.deepEqual(
    getWeeklyReview({ activeDays, reviews: firstReview }),
    { milestone: 14 },
  );

  const skippedReview = recordWeeklyReview(firstReview, {
    milestone: 14,
    strategyId: null,
    reviewedAt: "2026-07-14T12:00:00.000Z",
  });
  assert.equal(getWeeklyReview({ activeDays, reviews: skippedReview }), null);
  assert.deepEqual(
    recordWeeklyReview(skippedReview, {
      milestone: 14,
      strategyId: "favorite-first",
      reviewedAt: "2026-07-14T12:05:00.000Z",
    }),
    skippedReview,
  );
});
