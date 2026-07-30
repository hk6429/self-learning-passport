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
  assert.match(styles, /\.progress-dock\s*\{[\s\S]*width:\s*56px;[\s\S]*overflow:\s*hidden/);
  assert.match(styles, /\.progress-dock\[data-expanded="true"\]\s*\{[\s\S]*width:\s*315px/);
  assert.match(app, /\$\{expanded \? "收合" : "展開"\}七燈進度/);
  assert.match(styles, /\.realm-card__route-options\s*\{\s*grid-template-columns:\s*1fr/);
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

test("手機與平板把今日任務排在前面，並提供足夠大的觸控區與橫滑導覽", async () => {
  const [index, styles] = await Promise.all([
    readProjectFile("index.html"),
    readProjectFile("styles.css"),
  ]);

  assert.match(index, /width=device-width,\s*initial-scale=1/);
  assert.match(styles, /\.mission-scroll\s*\{\s*grid-row:\s*1/);
  assert.match(styles, /\.role-summary\s*\{[^}]*min-height:\s*44px/s);
  assert.match(styles, /\.role-button\s*\{[^}]*min-height:\s*44px/s);
  assert.match(
    styles,
    /\.realm-grid,\s*\.platform-grid\s*\{[^}]*scroll-snap-type:\s*x mandatory/s,
  );
  assert.match(styles, /env\(safe-area-inset-bottom\)/);
  assert.match(styles, /-webkit-text-size-adjust:\s*100%/);
});

test("頁面只有一個主要內容地標，並提供三身分的頁內導覽", async () => {
  const [index, app, styles] = await Promise.all([
    readProjectFile("index.html"),
    readProjectFile("src/app.js"),
    readProjectFile("styles.css"),
  ]);

  assert.match(index, /<div id="app">/);
  assert.doesNotMatch(index, /<main id="app">/);
  assert.match(app, /createSectionNavigation/);
  assert.match(app, /今天任務/);
  assert.match(app, /我的護照/);
  assert.match(app, /班級航線/);
  assert.match(app, /陪伴重點/);
  assert.match(styles, /\.section-navigation/);
});

test("回訪者可收合節奏推薦與七燈細節，所有收合控制有可見焦點與觸控高度", async () => {
  const [app, styles] = await Promise.all([
    readProjectFile("src/app.js"),
    readProjectFile("styles.css"),
  ]);

  assert.match(app, /className:\s*"quick-start-panel"/);
  assert.match(app, /quick-start-summary/);
  assert.match(app, /learning-path-summary/);
  assert.match(styles, /summary:focus-visible/);
  assert.match(styles, /\.quick-start-summary[^}]*min-height:\s*44px/s);
  assert.match(styles, /\.learning-path-summary[^}]*min-height:\s*44px/s);
  assert.match(styles, /\.offline-fallback summary[^}]*min-height:\s*44px/s);
  assert.match(styles, /\.student-dialogue-card__copy[^}]*min-height:\s*44px/s);
});

test("快速開始按鈕使用品牌色並清楚區分目前選擇與主要行動", async () => {
  const [app, styles] = await Promise.all([
    readProjectFile("src/app.js"),
    readProjectFile("styles.css"),
  ]);

  assert.doesNotMatch(app, /recommendation\.mission/);
  assert.match(app, /getMissionLearningOutcome\(recommendation\)/);
  assert.match(styles, /\.quick-start-doors button\[aria-pressed="true"\]/);
  assert.match(styles, /\.quick-start-recommendation\s*\{[^}]*background/s);
  assert.match(styles, /\.quick-start-recommendation\s*\{[^}]*color/s);
});

test("學生進度浮層不會出現在教師或家長頁，親師主要控制維持 44px", async () => {
  const [app, styles] = await Promise.all([
    readProjectFile("src/app.js"),
    readProjectFile("styles.css"),
  ]);

  assert.match(
    app,
    /if \(activeRole === "student" && !localState\.student\.gameplay\?\.restMode\) \{\s*shell\.append\(createProgressDock\(\)\)/s,
  );
  assert.match(styles, /\.support-confirm[^}]*min-height:\s*44px/s);
  assert.match(styles, /\.reflection-share[^}]*min-height:\s*44px/s);
  assert.match(styles, /\.reflection-share input[^}]*width:\s*24px/s);
});

test("反思欄位標籤與任務連結朗讀名稱符合實際互動", async () => {
  const app = await readProjectFile("src/app.js");

  assert.match(app, /const reflectionId = `reflection-\$\{mission\.id\}`/);
  assert.match(app, /attributes: \{ for: reflectionId \}/);
  assert.match(app, /id: reflectionId/);
  assert.match(app, /compact\s*\?\s*`開新分頁前往/);
  assert.match(app, /:\s*`前往\$\{mission\.subject\}任務/);
});

test("平板使用雙欄主域與精簡平台卡，隱私設定預設收合", async () => {
  const [app, styles] = await Promise.all([
    readProjectFile("src/app.js"),
    readProjectFile("styles.css"),
  ]);

  assert.match(app, /className:\s*"privacy-disclosure"/);
  assert.match(
    styles,
    /@media \(max-width:\s*960px\)[\s\S]*\.realm-grid\s*\{[^}]*repeat\(2/s,
  );
  assert.match(
    styles,
    /@media \(max-width:\s*960px\)[\s\S]*\.platform-description\s*\{\s*display:\s*none/s,
  );
  assert.match(
    styles,
    /\.privacy-disclosure:not\(\[open\]\) > :not\(summary\)/,
  );
});

test("首頁提供學生、家長與老師可切換的使用說明書", async () => {
  const [app, styles] = await Promise.all([
    readProjectFile("src/app.js"),
    readProjectFile("styles.css"),
  ]);

  assert.match(app, /使用說明書/);
  assert.match(app, /id:\s*"user-manual-dialog"/);
  assert.match(app, /aria-label":\s*"開啟使用說明書"/);
  assert.match(app, /學生版/);
  assert.match(app, /家長版/);
  assert.match(app, /老師版/);
  assert.match(app, /回到護照落印/);
  assert.match(app, /同行鼓勵卡/);
  assert.match(app, /依領域、時間與使用情境篩選/);
  assert.match(app, /個人學習資料只保存在這台裝置的瀏覽器/);

  assert.match(styles, /\.manual-dialog/);
  assert.match(styles, /\.manual-role-switcher/);
  assert.match(styles, /\.manual-step-list/);
  assert.match(styles, /\.header-actions/);
  assert.match(styles, /\.manual-open-button\s*\{[^}]*min-height:\s*44px/s);
});

test("老師可複選班級任務並用連結、學生預覽與 QR Code 分享", async () => {
  const [app, styles] = await Promise.all([
    readProjectFile("src/app.js"),
    readProjectFile("styles.css"),
  ]);

  assert.match(app, /createTeacherPlanStudio/);
  assert.match(app, /teacherSelectedMissionIds/);
  assert.match(app, /複製學生連結/);
  assert.match(app, /預覽學生畫面/);
  assert.match(app, /createQrFigure/);
  assert.match(app, /已達 14 個任務上限/);
  assert.match(app, /sharedPlan && !sharedPlan\.invalid\s*\? "student"/);
  assert.match(styles, /\.teacher-plan-studio/);
  assert.match(styles, /\.teacher-plan-qr/);
});

test("家長首屏提供今日任務、學習證據、平台篩選與本機隱私控制", async () => {
  const [app, styles] = await Promise.all([
    readProjectFile("src/app.js"),
    readProjectFile("styles.css"),
  ]);

  assert.match(app, /createParentTodayCard/);
  assert.match(app, /孩子今天的自評/);
  assert.match(app, /參與，不等於已經學會/);
  assert.match(app, /createPlatformFilterPanel\("parent"\)/);
  assert.match(app, /createPrivacyCenter\("parent"\)/);
  assert.match(app, /清除這台裝置的護照資料/);
  assert.match(app, /\.parent-today-card, \.teacher-plan-studio, \.shared-plan/);
  assert.match(styles, /\.parent-today-card/);
  assert.match(styles, /\.privacy-center/);
});

test("學生可低輸入留下學習證據，純任務模式只出現在學生身份", async () => {
  const [app, styles] = await Promise.all([
    readProjectFile("src/app.js"),
    readProjectFile("styles.css"),
  ]);

  assert.match(app, /今天最接近/);
  assert.match(app, /我弄懂了一個重點/);
  assert.match(app, /activeRole === "student"/);
  assert.match(styles, /\.learning-evidence-options/);
});

test("四類專家優化完整接上學生自我調節、教師支架與低刺激休息流程", async () => {
  const [app, styles] = await Promise.all([
    readProjectFile("src/app.js"),
    readProjectFile("styles.css"),
  ]);

  for (const contract of [
    "getDailyEnergy",
    "recommendAcrossRealms",
    "MICRO_GOALS",
    "CHALLENGE_OPTIONS",
    "PRE_STRATEGIES",
    "STUCK_REASONS",
    "NEXT_STEPS",
    "getMissionLearningProfile",
    "buildStudentDialogueCard",
    "summarizeLearningCycle",
    "buildLessonPlan",
    "resolveLearningStory",
    "getRevealMessage",
    "共用裝置：結束這次學生工作階段",
    "回到自學星圖",
    "帶我去操作",
  ]) {
    assert.match(app, new RegExp(contract));
  }
  assert.match(styles, /\.rest-mode-screen/);
  assert.match(styles, /@media print/);
  assert.match(styles, /\.teacher-mode-controls/);
});

test("學生可收藏最多三個常用任務，休息模式收起任務、獎勵與進度浮層", async () => {
  const app = await readProjectFile("src/app.js");

  assert.match(app, /favoriteMissionIds/);
  assert.match(app, /slice\(-3\)/);
  assert.match(app, /我的常用任務（最多 3 個）/);
  assert.match(app, /restMode:\s*true/);
  assert.match(app, /現在只要休息/);
  assert.match(
    app,
    /activeRole === "student" && !localState\.student\.gameplay\?\.restMode/,
  );
});
