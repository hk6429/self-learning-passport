import assert from "node:assert/strict";
import test from "node:test";

import { CHARACTER_CATALOG } from "../../src/data/character-catalog.js";

test("首波角色目錄收錄八位名稱與 id 皆唯一的角色", () => {
  assert.equal(CHARACTER_CATALOG.length, 8);

  const ids = CHARACTER_CATALOG.map(({ id }) => id);
  const names = CHARACTER_CATALOG.map(({ name }) => name);

  assert.equal(new Set(ids).size, 8, "角色 id 不可重複");
  assert.equal(new Set(names).size, 8, "角色名稱不可重複");

  for (const character of CHARACTER_CATALOG) {
    assert.ok(character.id);
    assert.ok(character.name);
    assert.ok(character.role);
  }
});

test("每位角色都有可及文字、四種狀態與圖片缺失替代內容", () => {
  const imageAssets = [
    "idle",
    "focus",
    "celebrate",
    "recover",
    "avatar",
    "silhouette",
  ];

  for (const character of CHARACTER_CATALOG) {
    assert.ok(character.alt, `${character.name} 缺少 alt`);
    assert.deepEqual(
      Object.keys(character.assets).sort(),
      [...imageAssets, "fallback"].sort(),
    );

    for (const assetName of imageAssets) {
      assert.match(
        character.assets[assetName],
        new RegExp(`^/assets/characters/${character.id}/`),
        `${character.name} 的 ${assetName} 路徑不正確`,
      );
    }

    assert.ok(
      character.assets.fallback,
      `${character.name} 圖片失效時必須提供文字替代內容`,
    );
  }
});
