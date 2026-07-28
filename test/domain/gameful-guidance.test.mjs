import test from "node:test";
import assert from "node:assert/strict";
import {
  PRIVACY_LAYERS,
  analyzeTeacherPlan,
  buildBadgePaths,
  buildFacilitationCard,
  buildFourteenDayPath,
  getFairCheckInXp,
  normalizeReflection,
  recommendMission,
} from "../../src/domain/gameful-guidance.js";

test("完成與部分完成得到相同的誠實回站習光", () => {
  assert.equal(getFairCheckInXp("complete", 5), 25);
  assert.equal(getFairCheckInXp("partial", 5), 25);
  assert.equal(getFairCheckInXp("rest", 5), 0);
});

test("舊反思字串安全轉為結構化反思且預設不分享", () => {
  assert.deepEqual(normalizeReflection("找到規律"), {
    evidence: "",
    stuckReason: "",
    nextStep: "",
    note: "找到規律",
    shareWithParent: false,
  });
});

test("北極星與上次策略產生透明且可取消的推薦", () => {
  const missions = [
    { id: "a", durationMinutes: 5, siteId: "a", routeLevel: "light" },
    { id: "b", durationMinutes: 15, siteId: "b", routeLevel: "challenge" },
  ];
  assert.equal(recommendMission({ missions, student: { northStar: "habit" } }).mission.id, "a");
  assert.equal(recommendMission({ missions, student: { northStar: "breakthrough" } }).mission.id, "b");
});

test("徽章路徑、十四日燈路與教師時間預算皆可預先看見", () => {
  assert.equal(buildBadgePaths({ activeDays: ["2026-07-29"] }, { stamps: 1, badges: [] })[0].current, 1);
  assert.equal(buildFourteenDayPath(["2026-07-29"], [], new Date("2026-07-29T12:00:00+08:00")).length, 14);
  assert.deepEqual(analyzeTeacherPlan([{ durationMinutes: 15 }, { durationMinutes: 10 }], 20), {
    totalMinutes: 25,
    budgetMinutes: 20,
    overBy: 5,
    withinBudget: false,
  });
});

test("教師引導卡與三層隱私說明均有完整內容", () => {
  const card = buildFacilitationCard([{ subject: "國語文" }]);
  assert.equal(card.questions.length, 3);
  assert.equal(PRIVACY_LAYERS.length, 3);
});
