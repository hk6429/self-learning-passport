import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const readProjectFile = (path) =>
  readFile(new URL(`../../${path}`, import.meta.url), "utf8");

test("首頁提供繁體中文、行動裝置與模組入口", async () => {
  const html = await readProjectFile("index.html");

  assert.match(html, /<html[^>]+lang="zh-Hant-TW"/);
  assert.match(html, /<meta[^>]+name="viewport"/);
  assert.match(html, /<div[^>]+id="app"/);
  assert.match(
    html,
    /<script[^>]+type="module"[^>]+src="\.\/src\/app\.js(?:\?[^"]+)?"/,
  );
});

test("專案提供樣式與可安全啟動的應用程式", async () => {
  const [html, styles, app] = await Promise.all([
    readProjectFile("index.html"),
    readProjectFile("styles.css"),
    readProjectFile("src/app.js"),
  ]);

  assert.match(
    html,
    /<link[^>]+rel="stylesheet"[^>]+href="\.\/styles\.css(?:\?[^"]+)?"/,
  );
  assert.match(styles, /box-sizing:\s*border-box/);
  assert.match(app, /document\.querySelector\("#app"\)/);
});

test("專案指令可重跑且不提交機密或工具產物", async () => {
  const [packageText, gitignore] = await Promise.all([
    readProjectFile("package.json"),
    readProjectFile(".gitignore"),
  ]);
  const packageJson = JSON.parse(packageText);

  assert.equal(packageJson.type, "module");
  assert.equal(packageJson.scripts.test, 'node --test "test/**/*.test.mjs"');
  assert.equal(packageJson.scripts["test:static"], 'node --test "test/static/**/*.test.mjs"');
  assert.match(gitignore, /^node_modules\/$/m);
  assert.match(gitignore, /^\.env\*$/m);
  assert.match(gitignore, /^\.dev\.vars\*$/m);
  assert.match(gitignore, /^\.wrangler\/$/m);
  assert.match(gitignore, /^test-results\/$/m);
});

test("隨站散布的 QR Code Generator 保留完整 MIT 授權", async () => {
  const license = await readProjectFile("src/vendor/qrcode.LICENSE.txt");

  assert.match(license, /Copyright \(c\) 2009 Kazuhiko Arase/);
  assert.match(
    license,
    /The above copyright notice and this permission notice shall be included/,
  );
});
