# 萬妖習行錄：霧海西行

每天用 5～15 分鐘完成一項學習任務，把迷霧走成自己的路。

## 專案狀態

妖界 2.0 首頁、三身份入口、三座學習妖域與今日航線已完成第一輪正式發布。

## 正式網站

- Cloudflare Pages：https://self-learning-passport.pages.dev/
- Vercel：https://self-learning-passport.vercel.app/
- Netlify：https://self-learning-passport.netlify.app/
- GitHub：https://github.com/hk6429/self-learning-passport

## 資料邊界

- 個人歷程、反思、策略、鼓勵感受與量測事件只保存在使用者瀏覽器。
- 班級功能只保存匿名任務、匿名參與者與完成事件。
- 不收姓名、Email、學號、學校或班級真名。
- 不使用公開排名、抽卡、斷簽懲罰或倒數壓力。

## 本機開發

需求：

- Node.js 24 LTS
- npm

安裝與測試：

```sh
npm install
npm test
```

啟動 Cloudflare Pages Functions 與本機 D1：

```sh
npm run db:migrate:local
npm run dev
```

瀏覽器測試：

```sh
npx playwright install chromium
npm run test:e2e
```

## 文件

- 二版規格：`docs/superpowers/specs/2026-07-27-self-learning-passport-yaoguai-design.md`
- 實作計畫：`docs/superpowers/plans/2026-07-27-self-learning-passport-yaoguai-implementation.md`
- 資產計畫：`docs/superpowers/plans/2026-07-27-self-learning-passport-yaoguai-assets.md`

## 部署

正式版本同步發布至 Cloudflare Pages、Vercel 與 Netlify。Cloudflare Pages 使用正式 D1 `self-learning-passport`；個人學習資料仍只保存在瀏覽器本機。
