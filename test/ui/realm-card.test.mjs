import assert from "node:assert/strict";
import test from "node:test";

import { CHARACTER_CATALOG } from "../../src/data/character-catalog.js";
import { MISSION_CATALOG } from "../../src/data/mission-catalog.js";
import { REALM_CATALOG } from "../../src/data/realm-catalog.js";
import { createRealmCard } from "../../src/ui/realm-card.js";

function createFakeDocument() {
  let innerHtmlWrites = 0;

  class FakeNode {
    constructor(tagName) {
      this.tagName = tagName;
      this.children = [];
      this.attributes = new Map();
      this.listeners = new Map();
      this.textContent = "";
      this.className = "";
      this.hidden = false;
      this.src = "";
      this.alt = "";
      this.type = "";
    }

    set innerHTML(_value) {
      innerHtmlWrites += 1;
      throw new Error("不得使用 innerHTML");
    }

    append(...children) {
      this.children.push(...children);
    }

    setAttribute(name, value) {
      this.attributes.set(name, String(value));
    }

    addEventListener(type, listener) {
      this.listeners.set(type, listener);
    }

    dispatch(type) {
      this.listeners.get(type)?.({ currentTarget: this });
    }
  }

  return {
    documentAdapter: {
      createElement(tagName) {
        return new FakeNode(tagName);
      },
    },
    get innerHtmlWrites() {
      return innerHtmlWrites;
    },
  };
}

function findAll(node, predicate, matches = []) {
  if (predicate(node)) {
    matches.push(node);
  }
  for (const child of node.children) {
    findAll(child, predicate, matches);
  }
  return matches;
}

function realmViewModel(siteId, overrides = {}) {
  const realm = REALM_CATALOG.find((candidate) => candidate.siteId === siteId);
  return {
    ...realm,
    missions: MISSION_CATALOG.filter(
      (mission) => mission.siteId === realm.siteId,
    ),
    ...overrides,
  };
}

test("安全建立含主要 NPC、妖域資訊與三條航線的可讀卡片", () => {
  const fake = createFakeDocument();
  const selectedMissionIds = [];
  const model = realmViewModel("vocab-duel", {
    name: '<img src=x onerror="alert(1)">芭蕉風語谷',
  });

  const card = createRealmCard(fake.documentAdapter, model, {
    onSelect(missionId) {
      selectedMissionIds.push(missionId);
    },
  });

  assert.equal(card.tagName, "article");
  assert.equal(card.className, "realm-card");
  assert.equal(fake.innerHtmlWrites, 0);

  const headings = findAll(card, ({ tagName }) => tagName === "h2");
  assert.equal(headings[0].textContent, model.name);

  const subject = findAll(
    card,
    ({ className }) => className === "realm-card__subject",
  )[0];
  assert.equal(subject.textContent, "英文");

  const npc = CHARACTER_CATALOG.find(
    ({ id }) => id === model.primaryNpcId,
  );
  const images = findAll(card, ({ tagName }) => tagName === "img");
  assert.equal(images.length, 1);
  assert.equal(images[0].src, npc.assets.idle);
  assert.equal(images[0].alt, npc.stateText.idle.alt);

  const buttons = findAll(card, ({ tagName }) => tagName === "button");
  assert.deepEqual(
    buttons.map(({ textContent }) => textContent),
    model.missions
      .toSorted((left, right) => left.durationMinutes - right.durationMinutes)
      .map(
        ({ durationMinutes, title }) => `${durationMinutes} 分鐘｜${title}`,
      ),
  );
  assert.deepEqual(
    buttons.map((button) => button.attributes.get("aria-label")),
    model.missions
      .toSorted((left, right) => left.durationMinutes - right.durationMinutes)
      .map(
        ({ durationMinutes, title }) =>
          `${model.name}，${durationMinutes} 分鐘航線：${title}`,
      ),
  );

  for (const button of buttons) {
    button.dispatch("click");
  }
  assert.deepEqual(
    selectedMissionIds,
    model.missions
      .toSorted((left, right) => left.durationMinutes - right.durationMinutes)
      .map(({ id }) => id),
  );
  assert.equal(fake.innerHtmlWrites, 0);
});

test("NPC 圖片失敗與未知角色都轉為可讀文字 fallback", () => {
  const knownFake = createFakeDocument();
  const knownCard = createRealmCard(
    knownFake.documentAdapter,
    realmViewModel("zizizhuji"),
  );
  const image = findAll(knownCard, ({ tagName }) => tagName === "img")[0];
  const knownFallback = findAll(
    knownCard,
    ({ className }) => className === "realm-card__npc-fallback",
  )[0];

  assert.equal(image.hidden, false);
  assert.equal(knownFallback.hidden, true);
  image.dispatch("error");
  assert.equal(image.hidden, true);
  assert.equal(knownFallback.hidden, false);
  assert.ok(knownFallback.textContent);
  assert.ok(knownFallback.attributes.get("aria-label"));

  const unknownFake = createFakeDocument();
  const unknownCard = createRealmCard(
    unknownFake.documentAdapter,
    realmViewModel("bxws-math", {
      primaryNpcId: "unknown-realm-npc",
    }),
  );
  assert.equal(
    findAll(unknownCard, ({ tagName }) => tagName === "img").length,
    0,
  );
  const unknownFallback = findAll(
    unknownCard,
    ({ className }) => className === "realm-card__npc-fallback",
  )[0];
  assert.equal(unknownFallback.hidden, false);
  assert.equal(
    unknownFallback.textContent,
    "妖界引路者正在前方，陪你繼續今天的修行。",
  );
});

test("航線必須恰好包含 5、10、15 分鐘", () => {
  const fake = createFakeDocument();
  const model = realmViewModel("vocab-duel");

  assert.throws(
    () =>
      createRealmCard(fake.documentAdapter, {
        ...model,
        missions: model.missions.slice(0, 2),
      }),
    {
      name: "TypeError",
      message: "妖域航線必須包含 5、10、15 分鐘",
    },
  );
});
