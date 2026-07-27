# 自學複利護照 A＋B MVP 實作計畫

> **已被取代。** 本計畫只適用於第一版設計。2026-07-27 起改以
> `2026-07-27-self-learning-passport-yaoguai-implementation.md`
> 與 `2026-07-27-self-learning-passport-yaoguai-assets.md` 為準。

- 日期：2026-07-27
- 專案：`self-learning-passport`
- 規格來源：`docs/superpowers/specs/2026-07-27-self-learning-passport-design.md`
- 狀態：規格已核准，等待依本計畫實作

## 1. 目標

完成一個可在手機與桌機使用的「自學複利護照」MVP：

- 學生每天完成一個 5～15 分鐘的小任務，個人歷程與反思只保存在本機。
- 老師建立匿名班級、安排白名單任務並查看匿名完成統計。
- 學生用六碼班級碼加入，離線時仍能保存個人進度並稍後同步班級事件。
- 家長在孩子同一裝置查看七日週報並留下鼓勵句。
- Cloudflare Pages Functions 與 D1 保存班級資料；Vercel、Netlify 只作靜態鏡像，共用同一個 API。

## 2. 實作原則

1. 嚴格依核准規格，不擴充帳號、排名、AI、通知或跨裝置同步。
2. 每個功能先寫會失敗的測試，再寫最小實作使其通過。
3. `src/domain/` 保持純函式，不讀 DOM、網路或 `localStorage`。
4. 學生反思不得進入 API client、同步佇列、後端資料表或 log。
5. 操作身份只控制介面；後端權限只接受教師金鑰或參與者權杖。
6. 不建立正式外部資源、不部署、不推 GitHub，直到使用者另行授權。
7. 每項任務完成後做獨立 commit，方便回溯與審查。

## 3. 技術棧與驗證指令

- HTML5、CSS3、原生 JavaScript ES Modules。
- Node.js 內建 `node:test`。
- Cloudflare Pages Functions。
- Cloudflare D1；開發階段使用 Wrangler 本機資料庫。
- Playwright 做瀏覽器旅程與視覺尺寸驗收。

預定 `package.json` scripts：

```json
{
  "scripts": {
    "test": "node --test \"test/**/*.test.mjs\"",
    "test:unit": "node --test \"test/domain/**/*.test.mjs\" \"test/storage/**/*.test.mjs\"",
    "test:api": "node --test \"test/api/**/*.test.mjs\"",
    "test:static": "node --test \"test/static/**/*.test.mjs\"",
    "test:e2e": "playwright test",
    "dev": "wrangler pages dev . --d1 PASSPORT_DB --port 8788",
    "db:migrate:local": "wrangler d1 migrations apply PASSPORT_DB --local"
  }
}
```

每次 commit 前至少執行：

```sh
npm test
git diff --check
```

涉及介面或 API 的里程碑另執行：

```sh
npm run test:e2e
```

## 4. 工作拆解

### Task 1：建立可測試的專案地基

**建立檔案**

- `package.json`
- `.gitignore`
- `README.md`
- `index.html`
- `styles.css`
- `src/app.js`
- `test/static/project-structure.test.mjs`

**先寫失敗測試**

`test/static/project-structure.test.mjs` 檢查：

- `index.html` 存在並有 `lang="zh-Hant-TW"`、viewport、主內容容器及 ES module 入口。
- `styles.css` 與 `src/app.js` 存在。
- `package.json` 為 ESM，含必要 test scripts。
- `.gitignore` 排除 `.dev.vars*`、`.wrangler/`、`node_modules/`、Playwright 產物與 `.env*`。

**最小實作**

- 建立語意化頁面骨架與無 JavaScript 提示。
- `src/app.js` 只完成啟動與根節點保護，不先放身份功能。
- README 先寫產品目標、資料邊界、開發指令與尚未部署狀態。

**驗證**

```sh
npm install
npm run test:static
npm test
```

**Commit**

```text
chore: scaffold self-learning passport
```

### Task 2：建立任務目錄與白名單契約

**建立檔案**

- `src/data/mission-catalog.js`
- `src/domain/mission-engine.js`
- `test/domain/mission-engine.test.mjs`
- `test/static/mission-catalog.test.mjs`

**先寫失敗測試**

- 任務只使用三個核准網域。
- 每筆任務都有唯一 `id`、`siteId`、標題、科目、時間、階段、URL 與完成提示。
- 只有 5、10、15 分鐘的合法任務。
- 相同日期、設定與歷程會得到相同任務。
- 同一天不重派已完成或部分完成的任務。
- 沒有相容任務時回傳明確的空狀態，而不是任意 URL。

**最小實作**

- 為字字珠璣、字鬥英雄、步學吾數各建立至少三筆 5～15 分鐘任務。
- `selectDailyMission()` 只接受目錄、台灣日期、偏好科目、每日分鐘與歷程。
- 使用穩定排序，不使用不可重現的 `Math.random()`。

**驗證**

```sh
npm run test:unit
npm run test:static
```

**Commit**

```text
feat: add validated mission catalog
```

### Task 3：實作個人進度與七日週報純函式

**建立檔案**

- `src/domain/progress.js`
- `src/domain/roles.js`
- `test/domain/progress.test.mjs`
- `test/domain/roles.test.mjs`

**先寫失敗測試**

- 完成與部分完成會建立活躍日，跳過不會。
- 同一天重複更新不重複計入活躍日。
- 七日週報以 `Asia/Taipei` 日期切分。
- 週報回傳活躍天數、完成數、部分完成數、分鐘數與科目分布。
- 家長鼓勵只改鼓勵資料，不更動任務歷程。
- 角色只允許 `student`、`teacher`、`parent`。

**最小實作**

- 實作 `recordMissionResult()`、`calculateActiveDays()`、`buildWeeklyReport()`。
- 反思限制 200 字，超過時回傳驗證錯誤，不靜默截斷。
- 角色轉換只回傳新的本機 UI 狀態。

**驗證**

```sh
npm run test:unit
```

**Commit**

```text
feat: calculate local learning progress
```

### Task 4：建立可遷移、可復原的本機記憶

**建立檔案**

- `src/storage/local-store.js`
- `test/storage/local-store.test.mjs`

**先寫失敗測試**

- 空白儲存載入 schema v1 預設狀態。
- 正常資料可保存、重載。
- 壞 JSON、錯誤型別與未知 schema 不讓應用崩潰。
- 遷移失敗會保留原始備份並回到安全空白狀態。
- `clearLocalData()` 清除所有三身份資料。
- 序列化後的 `syncQueue` 不含 `reflection`。

**最小實作**

- 儲存鍵固定為 `self-learning-passport:v1`。
- 使用注入的 storage adapter，測試時不依賴瀏覽器。
- 對 `QuotaExceededError` 與禁用 storage 回傳可顯示的狀態。
- 備份鍵包含 schema 與 ISO timestamp，但最多保留一份最新壞資料。

**驗證**

```sh
npm run test:unit
```

**Commit**

```text
feat: persist private learning history locally
```

### Task 5：完成身份入口與學生今日任務薄切

**建立檔案**

- `src/ui/router.js`
- `src/ui/shared.js`
- `src/ui/student-view.js`
- `test/static/accessibility-contract.test.mjs`
- `tests/e2e/student-local-flow.spec.js`
- `playwright.config.js`

**修改檔案**

- `index.html`
- `styles.css`
- `src/app.js`

**先寫失敗測試**

- 首次進入可用鍵盤選擇三種身份。
- 學生可設定科目與每日 5、10、15 分鐘。
- 今日任務卡顯示網站、時間與明確的「前往練習」。
- 外站使用新分頁並包含安全的 `rel` 屬性。
- 回報完成、部分完成或跳過後，重新整理仍保留。
- 反思不超過 200 字並有即時計數。
- 360px 與 390px 不水平溢位。

**最小實作**

- 使用 hash route 或狀態 router，不導入 SPA 框架。
- 首次設定完成後進入學生首頁。
- 完成回報使用原生 dialog 或具完整焦點管理的自製對話框。
- 本階段只顯示個人本機星圖，不呼叫班級 API。

**驗證**

```sh
npm test
npm run test:e2e -- --grep "student local"
```

**人工檢查**

- 390×844 手機。
- 1440×900 桌機。
- 全鍵盤操作。
- `prefers-reduced-motion`。

**Commit**

```text
feat: deliver student daily mission loop
```

### Task 6：完成學生星圖與本機週報

**修改檔案**

- `src/ui/student-view.js`
- `styles.css`
- `tests/e2e/student-local-flow.spec.js`

**先寫失敗測試**

- 完成一天後出現一顆可讀取標籤的星點。
- 七個活躍日形成星座，但 reduced-motion 不播放動畫。
- 週報數字與 domain 函式一致。
- 顏色不是唯一的完成狀態提示。
- 跳過不會讓既有星點消失。

**最小實作**

- 使用 HTML／CSS 或小型 SVG 呈現星圖，不引入重量級圖表套件。
- 星點同時有文字標籤與狀態 icon。
- 所有數字來源統一由 `buildWeeklyReport()` 提供。

**驗證**

```sh
npm run test:unit
npm run test:e2e -- --grep "student local"
```

**Commit**

```text
feat: visualize compound learning progress
```

### Task 7：建立 D1 schema 與伺服器基礎模組

**建立檔案**

- `migrations/0001_initial.sql`
- `wrangler.toml`
- `functions/lib/responses.js`
- `functions/lib/validation.js`
- `functions/lib/auth.js`
- `functions/lib/db.js`
- `functions/lib/class-service.js`
- `test/api/validation.test.mjs`
- `test/api/auth.test.mjs`
- `test/api/class-service.test.mjs`

**先寫失敗測試**

- 班級碼排除 `0/O/1/I/L` 等易混淆字元。
- 教師與參與者權杖使用 Web Crypto 安全隨機值。
- 資料庫只保存權杖雜湊，不保存明文。
- 標題 1～40 字，Email 或網址格式被拒絕。
- 保存期限只接受 7、30、90 天。
- 任務只能使用靜態目錄 ID，每班最多 14 個。
- 班級最多 100 個參與者。
- schema 不含姓名、Email、學號、反思、答案、分數、分鐘或 IP 欄位。

**最小實作**

- migration 建立 `classes`、`missions`、`participants`、`completions` 與必要 index。
- `wrangler.toml` 使用 `PASSPORT_DB` binding；本機命令只引用 binding，不假設已存在正式資料庫 ID。
- `class-service.js` 接收 D1 adapter，讓測試可使用記憶體 fake。
- `auth.js` 僅處理金鑰產生、雜湊與常數時間比對。
- `responses.js` 統一成功與錯誤 envelope。

**驗證**

```sh
npm run test:api
npx wrangler d1 migrations apply PASSPORT_DB --local
```

**Commit**

```text
feat: establish anonymous class data layer
```

### Task 8：實作建班、公開讀取與加入 API

**建立檔案**

- `functions/api/classes/index.js`
- `functions/api/classes/[code]/index.js`
- `functions/api/classes/[code]/join.js`
- `test/api/classes-create.test.mjs`
- `test/api/classes-read.test.mjs`
- `test/api/classes-join.test.mjs`

**先寫失敗測試**

- `POST /api/classes` 建立班級並只回傳一次教師金鑰。
- 班級碼碰撞會重試，不覆寫資料。
- `GET /api/classes/:code` 只回傳公開任務與到期日。
- 不存在、關閉、到期與刪除班級回傳一致錯誤。
- `POST /join` 產生中性匿名代號與參與者權杖。
- 公開回應不含 hash、參與者清單或完成統計。
- 輸入多餘敏感欄位時拒絕。

**最小實作**

- Pages Functions 僅做 HTTP 轉譯，規則放在 service。
- 使用明確 method guard。
- 回應加上安全 CORS allowlist；不以 `*` 搭配授權。
- 不在 log 中輸出請求 body 或 Authorization。

**驗證**

```sh
npm run test:api
npm run dev
```

另開終端執行本機 smoke：

```sh
curl -i -X POST http://localhost:8788/api/classes \
  -H 'Content-Type: application/json' \
  --data '{"title":"七日複利任務","missionIds":["zizi-daily-basics"],"retentionDays":7}'
```

不得把回傳教師金鑰貼入對話或 commit。

**Commit**

```text
feat: create and join anonymous classes
```

### Task 9：實作完成回報、教師摘要與班級管理 API

**建立檔案**

- `functions/api/classes/[code]/completions.js`
- `functions/api/classes/[code]/summary.js`
- `test/api/classes-completions.test.mjs`
- `test/api/classes-summary.test.mjs`
- `test/api/classes-manage.test.mjs`

**修改檔案**

- `functions/api/classes/[code]/index.js`
- `functions/lib/class-service.js`

**先寫失敗測試**

- 有效參與者只能回報自己班級內任務。
- 完成狀態只接受 `complete`、`partial`。
- payload 出現反思、答案、姓名等禁止欄位就拒絕。
- 相同 `eventId` 重送不重複計數。
- 教師摘要需要有效教師金鑰。
- 參與者權杖不能取得教師摘要。
- 已有完成紀錄的任務不可刪除。
- 刪除班級後班級碼立即失效。
- 到期或關閉班級拒絕新事件。

**最小實作**

- 以 transaction 或唯一 index 保證 `eventId` 冪等。
- 摘要只回傳匿名代號、任務 ID 與彙總。
- `PATCH` 只允許規格列出的欄位。
- `DELETE` 移除該班完整資料，或依 D1 transaction 做一致性刪除。

**驗證**

```sh
npm run test:api
npm test
```

**Commit**

```text
feat: report and manage anonymous class progress
```

### Task 10：建立班級 API client 與離線同步佇列

**建立檔案**

- `src/api/class-client.js`
- `src/domain/sync-queue.js`
- `test/domain/sync-queue.test.mjs`
- `test/api/class-client.test.mjs`

**先寫失敗測試**

- client 統一解析成功與錯誤 envelope。
- timeout、離線、401、403、404、410 有可判讀錯誤。
- 完成事件 payload 只含 `eventId`、`missionId`、`status`、`completedAt`。
- 反思無論在來源物件哪一層都不會進入 payload。
- 佇列依 `eventId` 去重且上限 100 筆。
- 重試節奏為 5 秒、30 秒、5 分鐘，之後等待重新開站或 `online`。
- 成功同步才移除事件；失敗不會刪除個人紀錄。

**最小實作**

- API base URL 由同源預設值或非機密設定提供。
- 使用 `AbortController` timeout。
- 將 payload builder 設為獨立純函式，直接測試隱私不變量。
- 頁面關閉時不使用不可靠的同步成功假設。

**驗證**

```sh
npm run test:unit
npm run test:api
```

**Commit**

```text
feat: queue private-safe class sync events
```

### Task 11：完成老師建班與匿名儀表板

**建立檔案**

- `src/ui/teacher-view.js`
- `tests/e2e/teacher-class-flow.spec.js`

**修改檔案**

- `src/app.js`
- `src/ui/router.js`
- `styles.css`

**先寫失敗測試**

- 老師可選 1～14 個白名單任務並排序。
- 建班成功後顯示六碼班級碼與只顯示一次的教師金鑰。
- 教師金鑰可下載為純文字備份，不進 URL。
- 重新整理後可用本機金鑰開啟儀表板。
- 儀表板只顯示匿名代號與完成矩陣。
- 錯誤金鑰不洩漏額外班級資料。
- 可提前關閉與刪除班級。

**最小實作**

- 建班表單使用目錄任務勾選與明確排序控制。
- 金鑰顯示畫面警告「遺失無法復原」。
- 本機只保存老師自己建立的班級管理資訊。
- 顯示 API loading、empty、error 與 retry 狀態。

**驗證**

```sh
npm test
npm run test:e2e -- --grep "teacher class"
```

**Commit**

```text
feat: deliver teacher class dashboard
```

### Task 12：完成學生加入班級與匿名同步旅程

**修改檔案**

- `src/ui/student-view.js`
- `src/app.js`
- `styles.css`
- `tests/e2e/student-class-flow.spec.js`

**先寫失敗測試**

- 班級碼輸入正規化為六碼大寫。
- 加入後顯示 API 產生的匿名代號與任務。
- 參與者權杖只保存本機，不顯示在 URL 或畫面。
- 完成班級任務會同步匿名事件。
- API 離線時顯示「個人紀錄已保存，班級回報待同步」。
- API 恢復後只同步一次。
- 到期班級不影響本機自主任務歷程。

**最小實作**

- 將班級任務與個人今日任務共用同一張任務卡元件。
- 回報完成時先保存本機，再嘗試送 API。
- `online` 事件與開站時觸發佇列處理。
- 畫面區分「本機已保存」與「班級已同步」。

**驗證**

```sh
npm test
npm run test:e2e -- --grep "student class"
```

**Commit**

```text
feat: join classes and sync student progress
```

### Task 13：完成家長同裝置週報

**建立檔案**

- `src/ui/parent-view.js`
- `tests/e2e/parent-report-flow.spec.js`

**修改檔案**

- `src/app.js`
- `src/ui/router.js`
- `styles.css`

**先寫失敗測試**

- 家長只讀取同裝置七日資料。
- 沒有紀錄時顯示友善空狀態。
- 週報顯示活躍日、完成、部分完成、分鐘與科目分布。
- 只有學生標記願意分享的反思會出現。
- 家長鼓勵會顯示在學生下次首頁。
- 家長無法修改完成紀錄或發送班級回報。

**最小實作**

- 週報資料只透過 `buildWeeklyReport()` 取得。
- 反思增加本機 `shareWithParent` 布林值，預設為 `false`。
- 鼓勵句提供有限預設選項與短文字欄位，不做通知。

**驗證**

```sh
npm run test:unit
npm run test:e2e -- --grep "parent report"
```

**Commit**

```text
feat: add same-device parent weekly report
```

### Task 14：完成視覺系統、響應式與無障礙

**修改檔案**

- `styles.css`
- `index.html`
- `src/ui/shared.js`
- `test/static/accessibility-contract.test.mjs`
- `tests/e2e/accessibility-responsive.spec.js`

**先寫失敗測試**

- 主要點擊目標至少 44×44px。
- heading 層級合理，表單有 label，狀態訊息使用 `role="status"`。
- 對話框焦點進出正確並支援 Escape。
- 360、390、768、1440px 無水平溢位。
- 200% 縮放仍可操作。
- reduced-motion 關閉非必要動畫。
- 完成狀態同時有文字或 icon。

**最小實作**

- 實作「深藍星圖＋米白紙本護照」tokens。
- 使用 CSS custom properties 統一色彩、間距、圓角、陰影與字級。
- 不使用紅色連續登入壓力、倒數或排名。
- 動畫只強化完成回饋，不阻斷操作。

**驗證**

```sh
npm run test:static
npm run test:e2e -- --grep "accessibility|responsive"
```

另做實際瀏覽器檢查，不以測試通過取代畫面驗收。

**Commit**

```text
style: complete passport visual system
```

### Task 15：建立完整驗收旅程與隱私負向測試

**建立檔案**

- `tests/e2e/mvp-acceptance.spec.js`
- `test/static/privacy-boundary.test.mjs`
- `docs/verification/mvp-checklist.md`

**修改檔案**

- `README.md`

**先寫失敗測試**

依規格第 18 節完整驗收故事：

1. 老師建立三站七日任務。
2. 學生加入並取得匿名代號。
3. 學生完成一項並寫本機反思。
4. 老師看到完成，但看不到反思。
5. 家長看到同裝置週報。
6. API 中斷時第二項任務保存在本機。
7. API 恢復後只同步一次。

隱私負向測試：

- 搜尋 Functions、migration、API payload 不得出現反思資料欄位。
- 教師摘要快照不得包含權杖、hash、姓名、Email 或反思。
- 錯誤訊息不得插入秘密值。
- public repo 檔案不得包含 `.dev.vars` 或正式 resource ID。

**最小實作**

- 只修正驗收測試揭露的本規格問題。
- README 補齊本機啟動、測試、資料流、隱私、備份金鑰及部署前置條件。
- `mvp-checklist.md` 記錄命令、結果、瀏覽器尺寸與已知非 MVP 項目。

**完整驗證**

```sh
npm test
npm run test:e2e
git diff --check
git status --short
```

**Commit**

```text
test: verify self-learning passport MVP
```

### Task 16：本機發布前審查

**不建立新外部資源，不部署**

**檢查項目**

- 對照設計規格第 4、18、22 節逐項勾稽。
- 確認每個 API route 有正向、權限負向及輸入負向測試。
- 確認反思僅存在本機。
- 確認 Git 工作樹乾淨。
- 確認 README 不宣稱尚未完成的正式部署。
- 記錄本機 commit SHA、測試 stdout 與瀏覽器畫面驗收結果。

**驗證**

```sh
npm test
npm run test:e2e
git log --oneline --decorate -20
git status --short
```

**只有使用者另行要求「三平台部署」後，才執行**

1. 檢查 Cloudflare、Vercel、Netlify 與 GitHub 認證。
2. 建立 D1 與正式 migration。
3. 設定正式、預覽與本機 CORS allowlist。
4. 建立／連結 GitHub public repo 並 push。
5. 依序部署 Cloudflare Pages、Vercel、Netlify。
6. 對三個正式網址做 cache-busting HTML／CSS／JS 讀取驗收。
7. 執行正式 API 正向與權限負向 smoke test。
8. 保存平台部署 ID、正式網址與回滾依據。

**Commit**

若審查產生文件更新：

```text
docs: record MVP verification evidence
```

## 5. 實作完成定義

以下條件全部成立才可回報 MVP 完成：

- 16 個 Task 全部完成，或明確標示經使用者核准移出範圍。
- `npm test` 與 `npm run test:e2e` 全數通過。
- 規格中的九步驗收故事已在真實瀏覽器重現。
- 學生反思未出現在任何網路請求或後端儲存。
- 360px 手機與桌機畫面實看無主要問題。
- API 離線與恢復同步已實測。
- Git 工作樹乾淨，每個里程碑有獨立 commit。
- README 與實際功能一致。
- 在未取得部署授權前，沒有建立或改動任何正式外部資源。
