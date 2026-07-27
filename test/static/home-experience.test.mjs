import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const readProjectFile = (path) =>
  readFile(new URL(`../../${path}`, import.meta.url), "utf8");

test("首頁整合三身份、三妖域、今日修行帖與安心回航入口", async () => {
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
