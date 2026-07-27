import assert from "node:assert/strict";
import test from "node:test";

import { CHARACTER_CATALOG } from "../../src/data/character-catalog.js";
import {
  CHARACTER_STATES,
  resolveCharacterDisplay,
} from "../../src/ui/character.js";

test("依 CHARACTER_CATALOG 解析四種角色狀態資產與可讀 alt", () => {
  assert.deepEqual(CHARACTER_STATES, [
    "idle",
    "focus",
    "celebrate",
    "recover",
  ]);

  for (const character of CHARACTER_CATALOG) {
    for (const state of CHARACTER_STATES) {
      const stateText = character.stateText?.[state];
      assert.deepEqual(
        resolveCharacterDisplay({
          characterId: character.id,
          state,
        }),
        {
          mode: "image",
          id: character.id,
          name: character.name,
          role: character.role,
          state,
          src: character.assets[state],
          alt: stateText?.alt ?? character.alt,
          fallbackText: stateText?.fallback ?? character.assets.fallback,
          reason: null,
        },
      );
    }
  }
});

test("未知角色、未知狀態與圖片失敗都提供文字 fallback 與 alt", () => {
  const unknownCharacter = resolveCharacterDisplay({
    characterId: "not-in-catalog",
    state: "idle",
  });
  assert.deepEqual(unknownCharacter, {
    mode: "text",
    id: null,
    name: "妖界引路者",
    role: "學習陪伴",
    state: null,
    src: null,
    alt: "妖界引路角色圖像暫不可用。",
    fallbackText: "妖界引路者正在前方，陪你繼續今天的修行。",
    reason: "unknown-character",
  });

  const character = CHARACTER_CATALOG[0];
  const unknownState = resolveCharacterDisplay({
    characterId: character.id,
    state: "attack",
  });
  assert.equal(unknownState.mode, "text");
  assert.equal(unknownState.src, null);
  assert.equal(unknownState.alt, character.alt);
  assert.equal(unknownState.fallbackText, character.assets.fallback);
  assert.equal(unknownState.reason, "unknown-state");

  const imageFailure = resolveCharacterDisplay({
    characterId: character.id,
    state: "focus",
    imageFailed: true,
  });
  const focusText = character.stateText?.focus;
  assert.equal(imageFailure.mode, "text");
  assert.equal(imageFailure.src, null);
  assert.equal(imageFailure.alt, focusText?.alt ?? character.alt);
  assert.equal(
    imageFailure.fallbackText,
    focusText?.fallback ?? character.assets.fallback,
  );
  assert.equal(imageFailure.reason, "image-failed");
});

test("狀態文字優先於角色層級文字，舊目錄格式仍可解析", () => {
  const modernCharacter = {
    id: "state-aware-guide",
    name: "狀態小妖",
    role: "契約測試",
    alt: "狀態小妖陪在路旁。",
    assets: {
      idle: "/idle.webp",
      fallback: "狀態小妖仍會用文字陪你。",
    },
    stateText: {
      idle: {
        alt: "狀態小妖豎起耳朵，在路旁等待出發。",
        fallback: "狀態小妖已在路旁等你，仍可直接出發。",
      },
    },
  };
  const legacyCharacter = {
    id: "legacy-guide",
    name: "舊契約小妖",
    role: "相容測試",
    alt: "舊契約小妖陪在路旁。",
    assets: {
      idle: "/legacy-idle.webp",
      fallback: "舊契約小妖仍會用文字陪你。",
    },
  };
  const catalog = [modernCharacter, legacyCharacter];

  const modernDisplay = resolveCharacterDisplay({
    characterId: modernCharacter.id,
    state: "idle",
    catalog,
  });
  assert.equal(modernDisplay.alt, modernCharacter.stateText.idle.alt);
  assert.equal(
    modernDisplay.fallbackText,
    modernCharacter.stateText.idle.fallback,
  );

  const legacyDisplay = resolveCharacterDisplay({
    characterId: legacyCharacter.id,
    state: "idle",
    catalog,
  });
  assert.equal(legacyDisplay.alt, legacyCharacter.alt);
  assert.equal(legacyDisplay.fallbackText, legacyCharacter.assets.fallback);
});
