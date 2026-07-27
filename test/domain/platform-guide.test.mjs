import assert from "node:assert/strict";
import test from "node:test";

import { getPlatformsForRole } from "../../src/domain/platform-guide.js";

test("學生與家長各看見 10 個自學平台，老師看見 12 個非會考平台", () => {
  assert.equal(getPlatformsForRole("student").length, 10);
  assert.equal(getPlatformsForRole("parent").length, 10);
  assert.equal(getPlatformsForRole("teacher").length, 12);

  for (const role of ["student", "parent", "teacher"]) {
    assert.equal(
      getPlatformsForRole(role).some(({ examPlatform }) => examPlatform),
      false,
    );
  }
});

test("主妖域已顯示時，支線清單不重複三個核心平台", () => {
  assert.equal(
    getPlatformsForRole("student", { includeCore: false }).length,
    7,
  );
  assert.equal(
    getPlatformsForRole("parent", { includeCore: false }).length,
    7,
  );
  assert.equal(
    getPlatformsForRole("teacher", { includeCore: false }).length,
    9,
  );
});

test("未知角色不會默默取得錯誤平台清單", () => {
  assert.throws(() => getPlatformsForRole("traveler"), RangeError);
});
