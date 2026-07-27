# 《萬妖習行錄：霧海西行》實作計畫

- 日期：2026-07-27
- 規格：`docs/superpowers/specs/2026-07-27-self-learning-passport-yaoguai-design.md`
- 狀態：二版規格已核准
- 方法：測試優先、垂直切片、每個 Task 獨立 commit

## 1. 實作目標

交付可在手機與桌機使用的 A＋B MVP：

- 學生在 20 秒、兩次點擊內開始一項 5～15 分鐘任務。
- 世界觀、角色與遊戲化機制服務真實學習，不阻擋學習。
- 個人反思、策略、鼓勵感受、量測事件與安全警戒只存在本機。
- 老師建立匿名班級航線，看到共同節奏而不是排行榜。
- 家長在同裝置看到七日旅記並留下支持自主的鼓勵。
- 離線不遺失個人足跡，匿名班級事件恢復後只同步一次。

## 2. 技術與指令

- 原生 HTML、CSS、JavaScript ES Modules。
- Node.js 內建 `node:test`。
- Cloudflare Pages Functions＋D1。
- Playwright 瀏覽器測試。
- 角色與場景點陣資產依獨立資產計畫生產。

預定 scripts：

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

每個 Task 收尾：

```sh
npm test
git diff --check
```

介面與整合里程碑另跑：

```sh
npm run test:e2e
```

## 3. 工作順序

### Task 0：收斂既有未提交骨架

**現況**

- `index.html`
- `styles.css`
- `src/app.js`
- `test/static/project-structure.test.mjs`

這些是舊計畫 Task 1 的未提交骨架，內容尚未包含舊世界觀功能。

**作法**

1. 逐檔確認只含通用 HTML、CSS reset、根節點與靜態測試。
2. 保留可沿用部分。
3. 不使用 destructive reset。
4. 將測試名稱與 README 改為《萬妖習行錄》用語。

**驗證**

```sh
node --test test/static/project-structure.test.mjs
git diff --check
```

**Commit**

```text
chore: scaffold yaoguai learning passport
```

### Task 1：建立專案地基與公開契約

**建立／修改**

- `package.json`
- `.gitignore`
- `README.md`
- `index.html`
- `styles.css`
- `src/app.js`
- `test/static/project-structure.test.mjs`
- `test/static/privacy-boundary.test.mjs`

**逐一 RED→GREEN 行為**

1. 首頁宣告 `zh-Hant-TW`、viewport、ES module 與樣式入口。
2. 無 JavaScript 時仍顯示可理解說明。
3. 專案為 ESM，測試指令可重跑。
4. `.env*`、`.dev.vars*`、`.wrangler/`、Playwright 產物與圖片中間檔不提交。
5. README 說明 A＋B 資料邊界與尚未部署狀態。

**Commit**

```text
chore: establish project contracts
```

### Task 2：任務、角色與故事靜態目錄

**建立**

- `src/data/mission-catalog.js`
- `src/data/character-catalog.js`
- `src/data/story-catalog.js`
- `test/static/mission-catalog.test.mjs`
- `test/static/character-catalog.test.mjs`
- `test/static/story-catalog.test.mjs`

**行為**

1. 任務只使用三個核准網域。
2. 每筆任務有 5／10／15 分鐘版本、領域、線索與揭露 ID。
3. 首波八位角色都有唯一 ID、名稱、職責、資產路徑、alt 與四種狀態。
4. 故事文字符合每句 30 字、每次兩句的上限。
5. 不含排名、抽卡、斷簽、羞辱、擊殺或現代改編名稱。
6. 資產缺失時目錄提供文字 fallback。

**Commit**

```text
feat: define yaoguai content catalogs
```

### Task 3：北極星與三選一航線

**建立**

- `src/domain/journey.js`
- `src/domain/mission-engine.js`
- `test/domain/journey.test.mjs`
- `test/domain/mission-engine.test.mjs`

**行為**

1. 北極星只接受四個列舉值或 `null`。
2. 同一目標最多回傳輕量、標準、挑戰三條合法航線。
3. 三條航線都有真實任務，不用裝飾性假選項。
4. 第一項任務優先提供 5 分鐘版本。
5. 同日不重派已回報任務。
6. 免費更換一次後仍保留休息選項。
7. 任務選擇具穩定性，可重現測試。

**Commit**

```text
feat: choose meaningful daily routes
```

### Task 4：進度、七燈與安心回航

**建立**

- `src/domain/progress.js`
- `src/domain/healthy-immersion.js`
- `test/domain/progress.test.mjs`
- `test/domain/healthy-immersion.test.mjs`

**行為**

1. 完成與部分完成建立活躍日，休息不建立。
2. 七個不同活躍日在 14 日內形成七燈路圖。
3. 不要求連續，缺席不清零。
4. 中斷至少一日後產生 5 分鐘回航入口。
5. 自選時長兩倍或 30 分鐘三次啟動時產生本機休息建議。
6. 安全警戒不阻擋離開，也不進後端。
7. 時區固定使用 `Asia/Taipei`。

**Commit**

```text
feat: build restorative progress system
```

### Task 5：內容線索與策略實驗室

**建立**

- `src/domain/curiosity.js`
- `src/domain/strategy-lab.js`
- `test/domain/curiosity.test.mjs`
- `test/domain/strategy-lab.test.mjs`

**行為**

1. 每個線索只對應一個任務與揭露。
2. 無關任務或未回報狀態不能解鎖揭露。
3. 線索可以略過，不阻擋出發。
4. 部分完成後可選縮短、換題型、重試或不設定。
5. 下一次可保留、調整或放棄策略。
6. 策略不宣稱能證明學業進步。

**Commit**

```text
feat: close curiosity and strategy loops
```

### Task 6：本機資料與量測事件

**建立**

- `src/storage/local-store.js`
- `src/domain/local-measurement.js`
- `test/storage/local-store.test.mjs`
- `test/domain/local-measurement.test.mjs`

**行為**

1. schema v1 正常保存與載入。
2. 壞 JSON、錯誤型別與未知版本安全復原。
3. 遷移失敗保留一份原始備份。
4. 量測事件只接受 20 個列舉型別。
5. context 只允許白名單整數與列舉值。
6. 自由文字、姓名、反思、答案、班級標題與金鑰被拒絕。
7. 事件最多 500 筆或 90 天。
8. 可計算 30 項指標所需的本機分子、分母與時長。
9. `syncQueue` 永不包含個人隱私欄位。

**Commit**

```text
feat: keep private progress and metrics local
```

### Task 7：入口、身份與 Onboarding

**建立**

- `src/ui/router.js`
- `src/ui/shared.js`
- `src/ui/character.js`
- `src/ui/student-view.js`
- `src/ui/teacher-view.js`
- `src/ui/parent-view.js`
- `playwright.config.js`
- `tests/e2e/onboarding.spec.js`

**修改**

- `index.html`
- `styles.css`
- `src/app.js`

**行為**

1. 入口可看見現實身份與世界身份。
2. 不用註冊即可進入。
3. 學生三步內完成北極星、領域／節奏與護照外觀。
4. 回訪直接到今日修行帖。
5. 角色圖片失效仍可完成設定。
6. 鍵盤與螢幕閱讀器可走完。

**Commit**

```text
feat: enter the mist-sea journey
```

### Task 8：學生今日修行薄切

**建立**

- `src/ui/world-map.js`
- `tests/e2e/student-daily-route.spec.js`

**修改**

- `src/ui/student-view.js`
- `src/app.js`
- `styles.css`

**行為**

1. 回訪首屏看見今日任務、時間、線索與主要 CTA。
2. 回訪者 20 秒、兩次點擊內可開啟外站。
3. 外站新分頁含安全 `rel`。
4. 回站可選完成、部分完成或今天先休息。
5. 完成後 300ms 內更新可讀資訊。
6. 動畫不超過 1,200ms 且可略過。
7. 自我回報文案不暗示系統已驗證外站成績。

**Commit**

```text
feat: deliver daily yaoguai learning loop
```

### Task 9：西行圖、七燈與策略回顧

**修改**

- `src/ui/world-map.js`
- `src/ui/student-view.js`
- `styles.css`
- `tests/e2e/student-progress.spec.js`

**行為**

1. 個人地圖顯示三座妖域。
2. 活躍日恢復道路與燈火。
3. 七個非連續活躍日形成七燈路圖。
4. 缺席後既有成果不變。
5. 部分完成可進策略實驗室。
6. 週報同時呈現領域、策略與小突破。
7. 純任務模式可隱藏所有非必要裝飾。

**Commit**

```text
feat: reveal the personal westward map
```

### Task 10：D1 與伺服器基礎

**建立**

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

**行為**

1. 建立班級、任務、匿名參與者與完成事件表。
2. schema 不含反思、答案、姓名、精確分鐘、策略、鼓勵或量測事件。
3. 權杖使用 Web Crypto 產生與雜湊。
4. 班級碼排除易混淆字元。
5. 保存期限只接受 7、30、90 天。
6. 任務只接受靜態目錄 ID。
7. 本機 migration 使用 `PASSPORT_DB` binding。

**Commit**

```text
feat: establish anonymous class storage
```

### Task 11：班級 API

**建立**

- `functions/api/classes/index.js`
- `functions/api/classes/[code]/index.js`
- `functions/api/classes/[code]/join.js`
- `functions/api/classes/[code]/completions.js`
- `functions/api/classes/[code]/summary.js`
- `test/api/classes-create.test.mjs`
- `test/api/classes-join.test.mjs`
- `test/api/classes-completions.test.mjs`
- `test/api/classes-summary.test.mjs`
- `test/api/classes-manage.test.mjs`

**行為**

1. 建班回傳六碼班級碼與只顯示一次的教師金鑰。
2. 學生加入取得匿名代號與參與者權杖。
3. 完成事件只有四個合法欄位。
4. 敏感或多餘欄位直接拒絕。
5. `eventId` 冪等。
6. 權杖不能跨班級。
7. 摘要不含反思、排名與個人量測。
8. 少於隱私門檻不顯示復歸聚合。
9. 關閉、到期、刪除班級拒絕新事件。

**Commit**

```text
feat: serve privacy-safe class journeys
```

### Task 12：API client 與離線同步

**建立**

- `src/api/class-client.js`
- `src/domain/sync-queue.js`
- `test/api/class-client.test.mjs`
- `test/domain/sync-queue.test.mjs`

**行為**

1. 完成 payload builder 永不包含個人欄位。
2. timeout、離線與權限錯誤可判讀。
3. 本機先保存，再嘗試班級回報。
4. 5 秒、30 秒、5 分鐘重試，之後等 `online` 或重新開站。
5. 成功才移除事件。
6. 同一 `eventId` 只同步一次。

**Commit**

```text
feat: sync anonymous journey events safely
```

### Task 13：老師引路總冊

**修改／建立**

- `src/ui/teacher-view.js`
- `tests/e2e/teacher-class.spec.js`
- `styles.css`

**行為**

1. 老師從三域目錄安排 1～14 個任務。
2. 金鑰只顯示一次，可下載備份，不進 URL。
3. 首畫面先呈現共同航線、七日匿名節奏與支持行動。
4. 匿名矩陣不以最快、最多或最少排序。
5. 不顯示落後名單。
6. 可發布全班共用支持卡、縮小未開始任務、關閉或刪除班級。

**Commit**

```text
feat: guide anonymous class journeys
```

### Task 14：學生共同星雲

**修改／建立**

- `src/ui/student-view.js`
- `src/ui/world-map.js`
- `tests/e2e/student-class.spec.js`

**行為**

1. 輸入班級碼後取得匿名代號。
2. 班級任務仍可三選一時長，但不可改成未核准任務。
3. 同行訊息只顯示符合隱私門檻的中性聚合。
4. 不顯示個人貢獻與精確少數數字。
5. API 離線時顯示本機已保存、班級待同步。
6. 到期班級不影響個人旅程。

**Commit**

```text
feat: light the shared class nebula
```

### Task 15：家長守燈週報

**修改／建立**

- `src/ui/parent-view.js`
- `tests/e2e/parent-report.spec.js`

**行為**

1. 只讀同裝置七日資料。
2. 先呈現穩定投入，不呈現戰力或排名。
3. 只顯示學生主動分享的反思。
4. 家長鼓勵不能改寫任務歷程。
5. 學生鼓勵感受只存本機。
6. 無資料時顯示不施壓的空狀態。

**Commit**

```text
feat: add the guardian lantern report
```

### Task 16：完整美術系統與資產接線

**修改**

- `styles.css`
- `src/ui/character.js`
- `src/ui/world-map.js`
- `index.html`
- `tests/e2e/visual-system.spec.js`

**使用**

- `assets/characters/`
- `assets/worlds/`
- `assets/textures/`
- `assets/icons/`
- `assets/stamps/`

**行為**

1. 套用核准色票與酒精墨水層次。
2. 角色 1:1 資產不擠壓任務 CTA。
3. 手機角色不超過首屏 28%。
4. 角色、背景與紋理缺失都有 fallback。
5. reduced-motion 停止視差、漂浮、擴散與彈跳。
6. 一般文字 4.5:1，大字 3:1。
7. 完成狀態不只靠顏色。
8. 360、390、768、1440px 無水平溢位。

**Commit**

```text
style: apply the mist-sea yaoguai world
```

### Task 17：30 指標契約與倫理負向測試

**建立**

- `test/domain/product-metrics.test.mjs`
- `test/static/ethical-gamification.test.mjs`
- `docs/verification/gamification-metrics.md`

**行為**

1. 30 項指標都有分子、分母、時窗與量測位置。
2. 五項北極星可用測試資料計算。
3. 稀缺挫折與過度沉浸是安全警戒，不是成長 KPI。
4. 文字與程式不含抽卡、斷簽、排名、倒數壓力與羞辱。
5. 行為事件不送到 API。
6. 共同星雲不洩漏少數群體。

**Commit**

```text
test: enforce ethical gamification metrics
```

### Task 18：端到端驗收

**建立**

- `tests/e2e/mvp-acceptance.spec.js`
- `tests/e2e/accessibility-responsive.spec.js`
- `docs/verification/mvp-checklist.md`

**驗收**

1. 規格第 24 節 16 步故事全部通過。
2. 手機與桌機實看學生、老師、家長流程。
3. 角色圖載入失敗仍可完成。
4. 純任務與 reduced-motion 可完成。
5. API 離線恢復後只同步一次。
6. 沒有主要 console error。
7. README 與實際功能一致。

**指令**

```sh
npm test
npm run test:e2e
git diff --check
git status --short
```

**Commit**

```text
test: verify mist-sea learning MVP
```

### Task 19：本機發布前審查

**不建立外部資源、不部署**

- 對照二版規格完成門檻。
- 保存完整測試 stdout。
- 保存 360、390、768、1440px 畫面驗收記錄。
- 檢查角色與場景資產清單。
- 檢查公開 repo 不含機密與生成中間檔。
- 確認工作樹乾淨。

只有使用者再次明確要求三平台部署，才：

1. 驗證 GitHub、Cloudflare、Vercel、Netlify 認證。
2. 建立正式 D1 與 migration。
3. 建立／連結 GitHub public repo。
4. 部署 Cloudflare Pages、Vercel、Netlify。
5. 對三站做 cache-busting HTML、CSS、JS 與資產驗收。
6. 執行正式 API 權限負向測試。

## 4. 完成定義

- 19 個 Task 全部完成或經使用者核准移出。
- 單元、API、靜態與瀏覽器測試全綠。
- 五項北極星可檢查，30 項指標有契約。
- 個人隱私資料未離開裝置。
- 視覺資產符合角色聖經且實際接入。
- 圖片失效與低動態仍可完成。
- 20 秒、兩次點擊開始任務的旅程實測通過。
- 在另行授權前沒有建立任何正式外部資源。
