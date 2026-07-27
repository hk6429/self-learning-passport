import assert from "node:assert/strict";
import { access } from "node:fs/promises";
import test from "node:test";

import {
  LEARNING_PLATFORM_CATALOG,
  SOURCE_PLATFORM_CATALOG,
} from "../../src/data/platform-catalog.js";

test("平台來源保留 13 站，並明確排除唯一的會考平台", () => {
  assert.equal(SOURCE_PLATFORM_CATALOG.length, 13);
  assert.equal(new Set(SOURCE_PLATFORM_CATALOG.map(({ id }) => id)).size, 13);
  assert.equal(new Set(SOURCE_PLATFORM_CATALOG.map(({ url }) => url)).size, 13);

  const examPlatforms = SOURCE_PLATFORM_CATALOG.filter(
    ({ examPlatform }) => examPlatform,
  );
  assert.deepEqual(
    examPlatforms.map(({ id }) => id),
    ["xingyin-doushi"],
  );

  assert.equal(LEARNING_PLATFORM_CATALOG.length, 12);
  assert.equal(
    LEARNING_PLATFORM_CATALOG.some(({ examPlatform }) => examPlatform),
    false,
  );
});

test("每個可用平台都有角色、學習資訊、配圖與安全外連所需資料", async () => {
  for (const platform of LEARNING_PLATFORM_CATALOG) {
    assert.ok(platform.title);
    assert.ok(platform.subject);
    assert.ok(platform.caption);
    assert.ok(platform.description);
    assert.ok(platform.stage);
    assert.ok(platform.mode);
    assert.ok(platform.duration);
    assert.match(platform.url, /^https:\/\//);
    assert.ok(Array.isArray(platform.audiences));
    assert.ok(platform.audiences.length > 0);
    assert.match(platform.art.src, /^\/assets\/.+\.webp$/);
    assert.ok(platform.art.alt);
    assert.ok(platform.art.fallback);
    await access(new URL(`../..${platform.art.src}`, import.meta.url));
  }
});
