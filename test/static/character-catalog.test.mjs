import assert from "node:assert/strict";
import test from "node:test";

import { CHARACTER_CATALOG } from "../../src/data/character-catalog.js";

test("角色目錄收錄八位功能角色與三位妖域主要 NPC，名稱與 id 皆唯一", () => {
  assert.equal(CHARACTER_CATALOG.length, 11);

  const ids = CHARACTER_CATALOG.map(({ id }) => id);
  const names = CHARACTER_CATALOG.map(({ name }) => name);

  assert.equal(new Set(ids).size, 11, "角色 id 不可重複");
  assert.equal(new Set(names).size, 11, "角色名稱不可重複");

  for (const character of CHARACTER_CATALOG) {
    assert.ok(character.id);
    assert.ok(character.name);
    assert.ok(character.role);
    assert.ok(character.characterType);
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

test("既有八位角色皆為功能支援角色，且 featureId 對應固定", () => {
  const expectedFeatures = new Map([
    ["ink-tail-guide", "daily-route-guide"],
    ["moon-rabbit-healer", "habit-recovery"],
    ["fire-cloud-starter", "five-minute-start"],
    ["star-web-weaver", "mission-map"],
    ["yellow-wind-scout", "branch-exploration"],
    ["plantain-wind-keeper", "pace-rest"],
    ["black-wind-archivist", "achievement-review"],
    ["nine-spirit-mentor", "class-nebula"],
  ]);

  for (const [id, featureId] of expectedFeatures) {
    const character = CHARACTER_CATALOG.find((candidate) => candidate.id === id);
    assert.equal(character.characterType, "functional-support");
    assert.equal(character.featureId, featureId);
  }
});

test("三位妖域主要 NPC 是獨立角色，不使用功能角色作 alias", () => {
  const expectedPrimaryCharacters = new Map([
    ["ink-cave-spider-seven", "墨蛛小七"],
    ["wind-valley-green-horn", "青角小牛妖"],
    ["golden-ridge-tablet-turtle", "負碑小龜妖"],
  ]);

  const primaryCharacters = CHARACTER_CATALOG.filter(
    ({ characterType }) => characterType === "realm-primary",
  );
  assert.equal(primaryCharacters.length, 3);

  for (const [id, name] of expectedPrimaryCharacters) {
    const character = primaryCharacters.find((candidate) => candidate.id === id);
    assert.equal(character.name, name);
    assert.equal(character.featureId, undefined);
  }

  assert.equal(
    primaryCharacters.some(({ id }) => id === "star-web-weaver"),
    false,
    "織霞蛛娘不可冒充墨蛛小七",
  );
  assert.equal(
    primaryCharacters.some(({ id }) => id === "fire-cloud-starter"),
    false,
    "火雲小將不可冒充青角小牛妖",
  );
});

test("三位妖域主要 NPC 都提供四狀態精準文字", () => {
  const states = ["idle", "focus", "celebrate", "recover"];
  const primaryCharacters = CHARACTER_CATALOG.filter(
    ({ characterType }) => characterType === "realm-primary",
  );

  for (const character of primaryCharacters) {
    assert.deepEqual(Object.keys(character.stateText).sort(), [...states].sort());
    for (const state of states) {
      assert.ok(character.stateText[state].alt);
      assert.ok(character.stateText[state].fallback);
    }
  }
});
