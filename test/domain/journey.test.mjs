import assert from "node:assert/strict";
import test from "node:test";

import {
  NORTH_STAR_VALUES,
  validateNorthStar,
} from "../../src/domain/journey.js";

test("北極星只接受四個列舉值或 null", () => {
  assert.deepEqual(NORTH_STAR_VALUES, [
    "habit",
    "breakthrough",
    "class-route",
    "find-my-way",
  ]);

  for (const value of [...NORTH_STAR_VALUES, null]) {
    assert.equal(validateNorthStar(value), value);
  }

  for (const value of [
    "",
    "ranking",
    "habit ",
    undefined,
    0,
    false,
    {},
  ]) {
    assert.throws(
      () => validateNorthStar(value),
      {
        name: "TypeError",
        message: "不支援的學習北極星",
      },
      `${String(value)} 不應被接受`,
    );
  }
});
