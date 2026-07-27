import assert from "node:assert/strict";
import test from "node:test";

import { CHARACTER_CATALOG } from "../../src/data/character-catalog.js";
import { REALM_CATALOG } from "../../src/data/realm-catalog.js";

test("七個主域都有一致的 16:10 敘事配圖", () => {
  assert.deepEqual(
    REALM_CATALOG.map(({ siteId }) => siteId),
    [
      "zizizhuji",
      "vocab-duel",
      "bxws-math",
      "wenhao-xiaozhuan",
      "wenyan-jieyou-zhan",
      "science-hero",
      "fanren-lianxin",
    ],
  );

  for (const realm of REALM_CATALOG) {
    assert.ok(
      realm.primaryNpcId || realm.art,
      `${realm.name} 必須有主要角色或專屬配圖`,
    );
  }

  const illustratedRealms = REALM_CATALOG.filter(({ art }) => art);
  assert.equal(illustratedRealms.length, 7);
  for (const realm of illustratedRealms) {
    assert.match(realm.art.src, /^\/assets\/realms\/.+\.webp$/);
    assert.ok(realm.art.alt);
    assert.ok(realm.art.fallback);
  }
});

test("三個角色主域的 siteId、subject 與主要 NPC 對應固定且唯一", () => {
  const characterRealms = REALM_CATALOG.filter(
    ({ primaryNpcId }) => primaryNpcId,
  );
  assert.deepEqual(characterRealms.map(
    ({ id, name, siteId, subject, primaryNpcId }) => ({
      id,
      name,
      siteId,
      subject,
      primaryNpcId,
    }),
  ), [
    {
      id: "ink-spider-cave",
      name: "盤絲墨洞",
      siteId: "zizizhuji",
      subject: "language",
      primaryNpcId: "ink-cave-spider-seven",
    },
    {
      id: "plantain-word-valley",
      name: "芭蕉風語谷",
      siteId: "vocab-duel",
      subject: "english",
      primaryNpcId: "wind-valley-green-horn",
    },
    {
      id: "golden-ring-math-ridge",
      name: "金箍算陣嶺",
      siteId: "bxws-math",
      subject: "math",
      primaryNpcId: "golden-ridge-tablet-turtle",
    },
  ]);

  for (const field of ["id", "siteId", "primaryNpcId"]) {
    const values = characterRealms.map((realm) => realm[field]);
    assert.equal(new Set(values).size, 3, `${field} 不可重複`);
  }
});

test("有主要 NPC 的妖域都指向 realm-primary，不得 alias 功能支援角色", () => {
  const forbiddenAliases = new Set([
    "star-web-weaver",
    "fire-cloud-starter",
  ]);

  for (const realm of REALM_CATALOG.filter(({ primaryNpcId }) => primaryNpcId)) {
    assert.equal(forbiddenAliases.has(realm.primaryNpcId), false);
    const character = CHARACTER_CATALOG.find(
      ({ id }) => id === realm.primaryNpcId,
    );
    assert.ok(character, `${realm.name} 缺少主要 NPC`);
    assert.equal(character.characterType, "realm-primary");
    assert.equal(character.featureId, undefined);
  }
});

test("功能支援角色不得被寫入任何妖域的 primaryNpcId", () => {
  const primaryNpcIds = new Set(
    REALM_CATALOG.map(({ primaryNpcId }) => primaryNpcId),
  );
  const supportCharacters = CHARACTER_CATALOG.filter(
    ({ characterType }) => characterType === "functional-support",
  );

  assert.equal(supportCharacters.length, 8);
  for (const character of supportCharacters) {
    assert.ok(character.featureId, `${character.name} 缺少 featureId`);
    assert.equal(primaryNpcIds.has(character.id), false);
  }
});
