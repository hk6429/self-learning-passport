import assert from "node:assert/strict";
import test from "node:test";

import { STORY_CATALOG } from "../../src/data/story-catalog.js";

test("故事目錄涵蓋四種旅程結果與三座妖域的線索揭露", () => {
  const outcomeTriggers = new Set(
    STORY_CATALOG.filter(({ subject }) => subject === null).map(
      ({ trigger }) => trigger,
    ),
  );
  assert.deepEqual(
    [...outcomeTriggers].sort(),
    ["complete", "partial", "rest", "return"].sort(),
  );

  const revealSubjects = new Set(
    STORY_CATALOG.filter(({ trigger }) => trigger === "clue-reveal").map(
      ({ subject }) => subject,
    ),
  );
  assert.deepEqual(
    [...revealSubjects].sort(),
    ["language", "english", "math"].sort(),
  );
});

test("每次對話最多兩句且每句不超過三十字，並排除傷害與壓力詞彙", () => {
  const prohibitedTerms = [
    "排名",
    "抽卡",
    "斷簽",
    "羞辱",
    "擊殺",
    "七龍珠",
    "賽亞人",
    "龜派氣功",
    "黑神話",
    "大話西遊",
  ];
  const ids = STORY_CATALOG.map(({ id }) => id);

  assert.equal(new Set(ids).size, ids.length, "故事 id 不可重複");

  for (const story of STORY_CATALOG) {
    assert.ok(Array.isArray(story.lines), `${story.id} 缺少對話內容`);
    assert.ok(story.lines.length >= 1, `${story.id} 至少需要一句對話`);
    assert.ok(story.lines.length <= 2, `${story.id} 不可超過兩句對話`);

    for (const line of story.lines) {
      assert.ok(line.length > 0, `${story.id} 不可含空白對話`);
      assert.ok(
        Array.from(line).length <= 30,
        `${story.id} 的「${line}」超過三十字`,
      );
    }

    const fullText = story.lines.join("");
    for (const term of prohibitedTerms) {
      assert.equal(
        fullText.includes(term),
        false,
        `${story.id} 不可含「${term}」`,
      );
    }
  }
});
