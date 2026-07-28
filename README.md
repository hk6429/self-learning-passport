# 萬妖習行錄：霧海西行

每天用 5～15 分鐘完成一項學習任務，把迷霧走成自己的路。

## 專案狀態

妖界 3.0 首頁、三身份入口、七座學習主域、今日航線、任務回站落印與個人複利護照已完成。

平台目錄以原「遊戲化自學入口」13 站為來源；本入口排除 1 個歷屆會考型平台後，老師版以上方 7 個主域加下方 5 個延伸平台呈現，共涵蓋 12 個非會考平台。七座主域包括字字珠璣、字鬥英雄、步學吾數、文豪笑傳、文言解憂站、科學英雄與凡人煉心訣。

## 遊戲化循環

- 外站練習後可選擇完成、部分完成或今天休息。
- 複利護照累積習光、等級、任務妖印、徽記與七域足跡。
- 學生可設定學習北極星、專屬妖印及下一次嘗試策略。
- 稀有收藏依投入逐步解鎖，不使用限時倒數或付費焦慮。
- 每條航線出發前有好奇問題，落印後揭曉妖域神祕密語。
- 老師與家長可製作不比較、不催趕的同行鼓勵卡。
- 首頁提供學生、家長、老師三種身分的使用說明書，可隨時切換查看四步操作。
- 每個平台卡都說明「這一站會練到什麼」，協助家長與老師判斷學習目的。
- 老師可依學習領域、可用時間與使用情境交叉篩選十二個平台，勾選 1～14 個任務後產生匿名學生連結與 QR Code。
- 家長可在首屏查看今日任務、孩子自評與本機學習證據，並依領域、時間與陪伴情境篩選平台。
- 家長與老師頁提供資料保存、外站來源、問題回報及清除本機護照的完整說明。
- 每七個活躍日提供一次低輸入策略回顧，可略過且只保存在本機。
- 休息與中斷不會清除成果，回來時可從五分鐘航線重新開始。
- 四位遊戲化專家提出的 30 條優化已落地：今日心力推薦、真實學習證據、永久七燈書、健康習光上限、同行需求卡、本機健康循環，以及班級共同／任選航線。
- 四位網站設計專家完成手機、平板、視覺與無障礙審查：三身份頁面提供頁內導覽、44px 觸控目標、可收合長內容與平板雙欄配置。

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
- 八角理論評分：`docs/verification/octalysis-score-2026-07-27.md`
- 四位專家 30 條審查：`docs/verification/gamification-review-2026-07-29.md`
- 30 項健康遊戲化實作紀錄：`docs/verification/gameful-optimization-30-2026-07-29.md`
- 手機、平板與無障礙設計審查：`docs/verification/website-design-review-2026-07-29.md`
- 四類專家 30 項優化驗收：`docs/verification/four-expert-optimization-30-2026-07-29.md`

## 部署

正式版本同步發布至 Cloudflare Pages、Vercel 與 Netlify。Cloudflare Pages 使用正式 D1 `self-learning-passport`；個人學習資料仍只保存在瀏覽器本機。
