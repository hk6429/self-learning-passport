import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const readProjectFile = (path) =>
  readFile(new URL(`../../${path}`, import.meta.url), "utf8");

test("首頁整合三身份、七妖域、今日修行帖與安心回航入口", async () => {
  const [app, styles, roles] = await Promise.all([
    readProjectFile("src/app.js"),
    readProjectFile("styles.css"),
    readProjectFile("src/domain/roles.js"),
  ]);

  assert.match(app, /buildHomeState/);
  assert.match(app, /createRealmCard/);
  assert.match(app, /home\.roles/);
  assert.match(roles, /學生/);
  assert.match(roles, /老師/);
  assert.match(roles, /家長/);
  assert.match(app, /今日修行帖/);
  assert.match(app, /安心回航/);

  assert.match(styles, /\.realm-grid/);
  assert.match(styles, /\.role-switcher/);
  assert.match(styles, /prefers-reduced-motion/);
  assert.match(styles, /@media[^{]*\(max-width:\s*767px\)/);
});

test("今日任務外連保留新分頁安全屬性，裝飾不承載文字", async () => {
  const app = await readProjectFile("src/app.js");

  assert.match(app, /target\s*=\s*"?_blank"?/);
  assert.match(app, /noopener noreferrer/);
  assert.match(app, /aria-hidden/);
});

test("三身份都有平台入口，家長不再只看見空白說明", async () => {
  const [app, styles] = await Promise.all([
    readProjectFile("src/app.js"),
    readProjectFile("styles.css"),
  ]);

  assert.match(app, /getPlatformsForRole/);
  assert.match(app, /createPlatformSection/);
  assert.match(app, /createPlatformCard/);
  assert.match(app, /activeRole === "parent"/);
  assert.match(styles, /\.platform-section/);
  assert.match(styles, /\.platform-grid/);
  assert.match(styles, /\.platform-card/);
});

test("教師頁清楚區分上方七主域與下方五個延伸平台", async () => {
  const app = await readProjectFile("src/app.js");

  assert.match(app, /七個主域與五個延伸平台/);
  assert.match(app, /下方五個延伸平台/);
  assert.doesNotMatch(app, /把十二個非會考平台帶進教學現場/);
});

test("學生能完成回站落印並看見個人護照、稀有解鎖與神祕線索", async () => {
  const [app, styles] = await Promise.all([
    readProjectFile("src/app.js"),
    readProjectFile("styles.css"),
  ]);

  assert.match(app, /recordPassportCheckIn/);
  assert.match(app, /buildPassportSnapshot/);
  assert.match(app, /回到護照落印/);
  assert.match(app, /我的複利護照/);
  assert.match(app, /稀有收藏/);
  assert.match(app, /神祕線索/);
  assert.match(styles, /\.mission-return/);
  assert.match(styles, /\.passport-section/);
  assert.match(styles, /\.passport-progress/);
});

test("老師與家長可製作同行鼓勵卡，學生端能看見鼓勵", async () => {
  const [app, styles] = await Promise.all([
    readProjectFile("src/app.js"),
    readProjectFile("styles.css"),
  ]);

  assert.match(app, /buildSupportMessage/);
  assert.match(app, /同行鼓勵卡/);
  assert.match(app, /navigator\.clipboard/);
  assert.match(styles, /\.support-studio/);
  assert.match(styles, /\.encouragement-card/);
});

test("主視覺角色保持正方形比例並融入霧海舞台，不侵入標題欄", async () => {
  const styles = await readProjectFile("styles.css");
  const guideRule = styles.match(/\.guide-figure\s*\{([^}]*)\}/)?.[1] ?? "";
  const guideImageRule =
    styles.match(/\.guide-figure img\s*\{([^}]*)\}/)?.[1] ?? "";

  assert.doesNotMatch(guideRule, /margin\s*:[^;]*-/);
  assert.match(guideRule, /margin\s*:\s*0/);
  assert.match(guideRule, /aspect-ratio\s*:\s*1/);
  assert.match(guideRule, /overflow\s*:\s*hidden/);
  assert.match(guideImageRule, /height\s*:\s*auto/);
  assert.match(guideImageRule, /aspect-ratio\s*:\s*1/);
  assert.match(guideImageRule, /object-fit\s*:\s*cover/);
});

test("學生可快速換妖域，落印後原地看見回饋，選填內容預設收合", async () => {
  const [app, styles] = await Promise.all([
    readProjectFile("src/app.js"),
    readProjectFile("styles.css"),
  ]);

  assert.match(app, /換科目／自己選妖域/);
  assert.match(app, /開始 \$\{mission\.durationMinutes\} 分鐘\$\{mission\.subject\}任務/);
  assert.match(app, /已記錄，可以離開/);
  assert.match(app, /有力氣再補（選填）/);
  assert.match(app, /guideCelebration/);
  assert.match(styles, /\.mission-switcher__options/);
  assert.match(styles, /\.checkin-feedback/);
  assert.match(styles, /\.optional-followup/);
});

test("回訪身份選擇與七燈計數器可收合，首訪提供白話詞語提示", async () => {
  const [app, styles] = await Promise.all([
    readProjectFile("src/app.js"),
    readProjectFile("styles.css"),
  ]);

  assert.match(app, /目前身份：\$\{activeRoleLabel\}・切換身份/);
  assert.match(app, /航線＝今天的任務・落印＝記錄完成・習光＝自己的成長點數/);
  assert.match(app, /只看今天要做什麼/);
  assert.match(app, /data-expanded/);
  assert.match(styles, /\.role-summary/);
  assert.match(styles, /\.world-guide/);
  assert.match(styles, /\.progress-dock\[data-expanded="true"\]/);
  assert.match(styles, /\.realm-card__routes\s*\{\s*grid-template-columns:\s*1fr/);
});

test("玩家建議形成首屏短循環、收藏櫃與不遮擋 HUD", async () => {
  const [app, styles] = await Promise.all([
    readProjectFile("src/app.js"),
    readProjectFile("styles.css"),
  ]);

  assert.match(app, /createReturnPlayerHud/);
  assert.match(app, /今日霧海變化/);
  assert.match(app, /下一收藏/);
  assert.match(app, /妖界收藏櫃/);
  assert.match(app, /我的修行史/);
  assert.match(app, /featuredRelicId/);
  assert.match(app, /featuredBadgeId/);
  assert.match(app, /scheduleProgressDockSafety/);
  assert.match(styles, /\.return-player-hud/);
  assert.match(styles, /\.collection-cabinet/);
  assert.match(styles, /\.relic-card/);
  assert.match(styles, /\.progress-dock\[data-safe="hidden"\]/);
});

test("平台卡呈現學習能力，老師可篩選，學生每七個活躍日可做策略回顧", async () => {
  const [app, styles] = await Promise.all([
    readProjectFile("src/app.js"),
    readProjectFile("styles.css"),
  ]);

  assert.match(app, /這一站會練到什麼/);
  assert.match(app, /PLATFORM_FILTERS/);
  assert.match(app, /filterPlatforms/);
  assert.match(app, /WEEKLY_STRATEGY_OPTIONS/);
  assert.match(app, /getWeeklyReview/);
  assert.match(app, /這七步，哪個開始方式最適合你/);
  assert.match(styles, /\.platform-learning-outcome/);
  assert.match(styles, /\.platform-filter-panel/);
  assert.match(styles, /\.weekly-strategy-review/);
});
