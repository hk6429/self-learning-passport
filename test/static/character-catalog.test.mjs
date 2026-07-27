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

test("墨尾行者四種狀態提供精準 alt 與 fallback，其餘角色可沿用舊契約", () => {
  const inkTailGuide = CHARACTER_CATALOG.find(
    ({ id }) => id === "ink-tail-guide",
  );
  const states = ["idle", "focus", "celebrate", "recover"];

  assert.deepEqual(Object.keys(inkTailGuide.stateText).sort(), states.sort());

  for (const state of states) {
    assert.ok(inkTailGuide.stateText[state].alt, `${state} 缺少精準 alt`);
    assert.ok(
      inkTailGuide.stateText[state].fallback,
      `${state} 缺少精準 fallback`,
    );
  }

  assert.equal(
    new Set(states.map((state) => inkTailGuide.stateText[state].alt)).size,
    states.length,
    "四種狀態不應共用同一段 alt",
  );
  assert.equal(
    new Set(states.map((state) => inkTailGuide.stateText[state].fallback)).size,
    states.length,
    "四種狀態不應共用同一段 fallback",
  );

  const legacyCharacter = CHARACTER_CATALOG.find(
    ({ id }) => id === "moon-rabbit-healer",
  );
  assert.equal(legacyCharacter.stateText, undefined);
  assert.ok(legacyCharacter.alt);
  assert.ok(legacyCharacter.assets.fallback);
});
