import assert from "node:assert/strict";
import test from "node:test";

import { OCTALYSIS_SCORECARD } from "../../src/data/gamification-score.js";

test("八角理論八項核心驅動力都有至少 8 分，且每項列出可驗收功能證據", () => {
  assert.equal(OCTALYSIS_SCORECARD.length, 8);
  assert.equal(
    new Set(OCTALYSIS_SCORECARD.map(({ id }) => id)).size,
    8,
  );

  for (const drive of OCTALYSIS_SCORECARD) {
    assert.ok(drive.score >= 8, `${drive.name} 未達 8 分`);
    assert.ok(drive.score <= 10, `${drive.name} 超出 10 分`);
    assert.ok(
      drive.evidence.length >= 3,
      `${drive.name} 至少需要三項可驗收功能證據`,
    );
  }
});
