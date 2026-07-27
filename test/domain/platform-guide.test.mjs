import assert from "node:assert/strict";
import test from "node:test";

import {
  filterPlatforms,
  getPlatformsForRole,
} from "../../src/domain/platform-guide.js";

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

test("七個主妖域已顯示時，支線清單不重複核心平台", () => {
  assert.equal(
    getPlatformsForRole("student", { includeCore: false }).length,
    3,
  );
  assert.equal(
    getPlatformsForRole("parent", { includeCore: false }).length,
    3,
  );
  assert.equal(
    getPlatformsForRole("teacher", { includeCore: false }).length,
    5,
  );
});

test("未知角色不會默默取得錯誤平台清單", () => {
  assert.throws(() => getPlatformsForRole("traveler"), RangeError);
});

test("老師可依領域、時間與使用情境交叉篩選十二個平台", () => {
  const platforms = getPlatformsForRole("teacher");

  assert.equal(filterPlatforms(platforms, { group: "teacher" }).length, 2);
  assert.equal(filterPlatforms(platforms, { duration: "flex" }).length, 5);
  assert.equal(filterPlatforms(platforms, { context: "homeroom" }).length, 5);
  assert.equal(
    filterPlatforms(platforms, {
      group: "leadership",
      context: "homeroom",
    }).length,
    3,
  );
  assert.throws(
    () => filterPlatforms(platforms, { duration: "all-day" }),
    RangeError,
  );
});
