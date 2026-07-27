import assert from "node:assert/strict";
import test from "node:test";

import {
  STRATEGY_OPTIONS,
  STRATEGY_NOTICE,
  STRATEGY_REVIEW_OPTIONS,
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
