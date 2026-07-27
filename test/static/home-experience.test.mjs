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

test("主視覺角色圖不使用會侵入標題欄的負邊界", async () => {
  const styles = await readProjectFile("styles.css");
  const guideRule = styles.match(/\.guide-figure\s*\{([^}]*)\}/)?.[1] ?? "";

  assert.doesNotMatch(guideRule, /margin\s*:[^;]*-/);
  assert.match(guideRule, /margin\s*:\s*0/);
});
