import assert from "node:assert/strict";
import test from "node:test";

import {
  CURIOSITY_CATALOG,
  unlockCuriosityReveal,
} from "../../src/domain/curiosity.js";
import { MISSION_CATALOG } from "../../src/data/mission-catalog.js";

test("每個內容線索唯一對應一個任務與揭露，並可直接略過", () => {
  assert.equal(CURIOSITY_CATALOG.length, MISSION_CATALOG.length);

  const promptIds = CURIOSITY_CATALOG.map(({ curiosityPromptId }) =>
    curiosityPromptId
  );
  const missionIds = CURIOSITY_CATALOG.map(({ missionId }) => missionId);
  const revealIds = CURIOSITY_CATALOG.map(({ revealId }) => revealId);

  assert.equal(new Set(promptIds).size, CURIOSITY_CATALOG.length);
  assert.equal(new Set(missionIds).size, CURIOSITY_CATALOG.length);
  assert.equal(new Set(revealIds).size, CURIOSITY_CATALOG.length);

  for (const clue of CURIOSITY_CATALOG) {
    const mission = MISSION_CATALOG.find(({ id }) => id === clue.missionId);

    assert.equal(clue.curiosityPromptId, mission.curiosityPromptId);
    assert.equal(clue.revealId, mission.revealId);
    assert.equal(clue.skippable, true);
  }
});

test("只有同一任務的完成或部分完成回報能解鎖對應揭露", () => {
  const [clue, otherClue] = CURIOSITY_CATALOG;
  const report = {
    curiosityPromptId: clue.curiosityPromptId,
    missionId: clue.missionId,
  };

  assert.equal(
    unlockCuriosityReveal({ ...report, status: "complete" }),
    clue.revealId,
  );
  assert.equal(
    unlockCuriosityReveal({ ...report, status: "partial" }),
    clue.revealId,
  );
  assert.equal(
    unlockCuriosityReveal({ ...report, status: "skipped" }),
    null,
  );
  assert.equal(
    unlockCuriosityReveal({ ...report, status: "rest" }),
    null,
  );
  assert.equal(
    unlockCuriosityReveal({
      ...report,
      missionId: otherClue.missionId,
      status: "complete",
    }),
    null,
  );
  assert.equal(
    unlockCuriosityReveal({
      curiosityPromptId: null,
      missionId: clue.missionId,
      status: "complete",
    }),
    null,
  );
});
