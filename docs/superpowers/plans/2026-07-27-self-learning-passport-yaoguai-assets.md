# 《萬妖習行錄：霧海西行》視覺資產生產計畫

- 日期：2026-07-27
- 規格：`docs/superpowers/specs/2026-07-27-self-learning-passport-yaoguai-design.md`
- 生產模式：`imagegen` built-in tool
- 狀態：Batch 0、Batch 1 已核准；Batch 2 三域狀態圖已完成，等待整組確認

## 1. 目標

建立一套可供網站直接使用、角色一致、兒少友善、原創且具酒精墨水質感的視覺資產。

不一次盲目生成全部圖片。先建立風格錨點，再以錨點作參考逐批生成、檢查、選版與接線。

## 2. 固定藝術規格

### 2.1 角色

- Q 版，頭高：頸部以下身體高度約 1:1。
- 全身 1.8～2.2 個頭高。
- 角色資產為 1:1 正方形。
- 大眼、小鼻、短四肢、圓手圓腳。
- 只有一個主輪廓、兩個母題、一件道具。
- 中央 80% 安全區。
- 無文字、Logo、水印。

### 2.2 媒材

- 酒精墨水 illustration。
- 半透明疊色、羽化邊緣、圓形水痕、自然留白。
- 少量金色墨脈。
- 清楚塊面線稿維持小尺寸辨識。
- 不呈現飲酒或酒瓶。

### 2.3 世界

- 東方奇幻妖界。
- 神祕但不陰暗。
- 奇幻但不恐怖。
- 童趣但不幼稚。
- 妖怪是導師與同行者。

### 2.4 原創性

- 只使用古典《西遊記》母題。
- 不使用任何現代影視、動畫、漫畫或遊戲名稱作風格提示。
- 不仿特定作品的角色輪廓、服裝、武器、UI、Logo、鏡頭或配色。
- 孫悟空、唐僧、豬八戒、沙悟淨不作主角。

## 3. 檔案結構

```text
assets/
├── references/
│   ├── style-anchor.webp
│   ├── character-proportion-anchor.webp
│   └── palette-anchor.webp
├── characters/
│   ├── mo-wei/
│   ├── jade-rabbit/
│   ├── fire-cloud/
│   ├── spider-weaver/
│   ├── yellow-wind/
│   ├── plantain-princess/
│   ├── black-bear/
│   └── nine-lion/
├── worlds/
│   ├── mist-sea-gate.webp
│   ├── ink-spider-cave.webp
│   ├── plantain-word-valley.webp
│   └── golden-ring-math-ridge.webp
├── textures/
├── icons/
├── stamps/
└── manifest.json
```

每張正式資產都進入 `manifest.json`：

```js
{
  id: "character-mo-wei-idle",
  path: "assets/characters/mo-wei/idle.webp",
  kind: "character",
  ratio: "1:1",
  role: "首頁引路",
  alt: "Q版墨尾行者站在霧海路口",
  promptVersion: 1,
  referenceIds: ["style-anchor", "proportion-anchor"],
  approved: true
}
```

## 4. 生產批次

### Batch 0：風格錨點

**2026-07-27 結果：已核准**

- 使用者選擇 B「加強小妖獸感」。
- 正式錨點為 `assets/references/style-anchor.webp`。
- 墨尾行者固定為圓猴耳、雙墨筆尾與無文字雙向木路籤。

先生成三張預覽，不接入網站：

1. 藝術風格板：一位原創小妖＋妖山＋宣紙卡片氣氛。
2. 角色比例板：同一角色待機、專注、慶祝、復原四狀態。
3. 色彩材質板：靛紫、朱橙、藍綠酒精墨水與金色墨脈。

**驗收**

- 一眼看出 Q 版 1:1 頭身。
- 酒精墨水不溶掉臉與輪廓。
- 沒有現代改編既視感。
- 手機縮圖仍可辨認。
- 背景不妨礙宣紙文字區。

使用者確認風格錨點後才進 Batch 1。

### Batch 1：主角墨尾行者

**2026-07-27 結果：四狀態已完成**

- `idle`、`focus`、`celebrate`、`recover` 已生成並通過角色一致性 gate。
- `recover` 第一版因尾巴拓樸漂移退件，正式版為修正後的雙尾低喚醒坐姿。
- 每個狀態已提供 256、512、1024px WebP。
- 正式 1024px 單張為 65–76KiB，均低於 250KB 預算。
- 正式路徑與狀態文字已接入角色目錄；退件稿與來源 PNG 不進 bundle。

資產：

- `idle`
- `focus`
- `celebrate`
- `recover`
- `avatar`
- `silhouette`

先生成完整 1:1 插畫卡，不要求透明背景。

**單變量迭代**

1. 先鎖定輪廓與比例。
2. 再調表情。
3. 再調墨水材質。
4. 最後調背景留白與 UI 裁切。

選定版本成為後續角色 reference image。

### Batch 2：三域引路角色

**角色 lane 校正**

- 墨蛛小七、青角小牛妖、負碑小龜妖是三域主要 NPC。
- 織霞蛛娘、火雲小將是不同的系統功能角色，不得作為別名、替代演出或共用資產。

**2026-07-27 身份錨點結果**

- 墨蛛小七：X 形絨蛛肢、七枚朱墨珠、字網竹框。
- 青角小牛妖：青玉雙角與金環、奶白牛鼻、風語葉笛。
- 負碑小龜妖：低圓龜甲、六角金環甲紋、三環算陣石碑。
- 三者均通過 96px 剪影差異 gate。
- 身份錨點核准後，三位角色的 `focus`、`celebrate`、`recover`、`avatar` 已完成。
- 每位完整狀態皆提供 256、512、1024px WebP；頭像提供 128、256px WebP。
- 三域正式 WebP 合計 1.3MiB；1024px 單張為 51–96KiB，均低於 120KB 目標。
- 每個狀態皆有精準 alt 與圖片失效 fallback，並已登錄 `assets/manifest.json`。

本批角色：

- 墨蛛小七。
- 青角小牛妖。
- 負碑小龜妖。

每位先生成：

- `idle`
- `celebrate`
- `recover`
- `avatar`

角色需共享：

- 相同頭身比例。
- 相同眼睛語言。
- 相同線稿粗細。
- 相同金色墨脈用量。
- 不同且可辨識的剪影。

### Batch 3：支持角色

- 玉兔藥師。
- 黃風貂斥候。
- 芭蕉風姬。
- 黑風熊藏書官。
- 九靈獅導師。

依實際 UI 出場順序生成，不因角色池存在就提前全做。

### Batch 4：四座世界場景

格式：

- 桌機 16:9 寬景。
- 手機 9:16 裁切安全版本。
- 不含介面文字。
- 主 CTA 區域留乾淨負空間。

場景：

1. 霧海入口。
2. 盤絲墨洞。
3. 芭蕉風語谷。
4. 金箍算陣嶺。

每座場景提供：

- `mist`：尚未投入。
- `restored`：學習後恢復。

兩版構圖一致，只改道路、燈火、色彩與植物復甦程度。

### Batch 5：紋理、印章與圖示

生成點陣資產：

- 靛紫酒精墨水紋理。
- 朱橙酒精墨水紋理。
- 藍綠酒精墨水紋理。
- 朱砂完整行印。
- 半月行印。
- 歇腳亭插畫。

以下優先用程式原生 SVG／CSS，不用 imagegen：

- 導覽圖示。
- 箭頭。
- 勾選。
- 錯誤與資訊圖示。
- 進度線。
- 焦點框。

### Batch 6：社群與文件用視覺

網站核心驗收後才做：

- Open Graph 分享圖。
- README hero。
- 作品集封面。
- FB／Threads 宣傳圖。

不得反過來讓宣傳圖延誤核心網站。

## 5. 標準 Prompt 骨架

```text
Use case: illustration-story
Asset type: 1:1 square website character card
Primary request: an original chibi yaoguai guide for a student learning portal inspired only by classical Journey to the West motifs
Scene/backdrop: quiet mist-sea yaoguai world with generous clean negative space
Subject: <角色名稱與兩個辨識母題、一件道具>
Style/medium: alcohol ink illustration with crisp shape-based linework, translucent layered color pools, feathered edges, circular tide marks, subtle gold ink veins
Composition/framing: full-body centered character, square canvas, important silhouette within central 80 percent, head height and body-below-neck height approximately one to one
Lighting/mood: warm mysterious, curious, supportive, child-friendly, never frightening
Color palette: <角色兩個主色、一個點綴、一個中性色>
Constraints: large head, tiny rounded body, short limbs, readable at 96 pixels, original design, no text, no logo, no watermark
Avoid: photorealism, horror, blood, bones, realistic insect eyes, sharp weapons, seductive design, combat pose, alcohol bottles, gambling rewards, modern film animation comic or game adaptation resemblance
```

場景 Prompt 另加：

```text
Asset type: responsive website world background
Composition/framing: stable landmarks, desktop and mobile crop-safe composition, clean quiet region reserved for a readable UI card
Constraints: no embedded text, no UI screenshot, no character covering the primary action region
```

## 6. 生成與檢查流程

每張資產：

1. 用 built-in `image_gen` 生成。
2. 先作預覽，不立即接線。
3. 目視檢查主體、比例、材質、構圖、原創性與禁用項。
4. 只做一次一個變量的修正。
5. 選定後複製到 workspace 正式路徑。
6. 轉成網站合宜尺寸與 WebP；保留一份高品質來源。
7. 寫入 manifest。
8. 用 `view_image` 檢查磁碟上的正式檔。
9. 在真實瀏覽器 96px、卡片尺寸、手機首屏實看。

不得：

- 用一個 prompt 同時要求十多位角色。
- 用 `n` 代替不同角色的獨立 prompt。
- 未經目視就宣告完成。
- 讓網站引用仍留在 `$CODEX_HOME/generated_images/` 的檔案。
- 覆寫已核准資產；新版本使用 `-v2`。

## 7. 尺寸與效能

### 角色

- 生成／來源：1:1 正方形。
- 網站主檔：1024×1024 WebP。
- 小頭像：256×256 WebP。
- 目標主檔單張不超過 250KB，小頭像不超過 60KB。

### 場景

- 桌機：2048×1152 或等比例 WebP。
- 手機：1152×2048 或等比例 WebP。
- 目標單張不超過 450KB。

### 紋理

- 1024×1024 可平鋪 WebP。
- 目標單張不超過 180KB。

若壓縮後出現輪廓破損、色帶或墨水毛邊髒污，優先降低尺寸或調整 WebP 品質，不直接接受。

## 8. 無障礙

- 每張承載資訊的角色圖有簡潔繁中 `alt`。
- 純裝飾紋理與雲霧使用空 `alt`。
- 地圖永遠有文字清單替代。
- 角色與場景不是完成狀態的唯一提示。
- 圖片失效不阻斷核心流程。
- 動畫另由 CSS 控制；點陣圖本身不含閃爍。

## 9. 生產紅線

- 不生成現代改編角色相似版本。
- 不使用「像某部作品」的提示。
- 不生成血腥、死亡、擊殺、性感化女妖或宗教戲謔。
- 不生成含繁簡文字的角色圖；所有文字由 HTML 呈現。
- 不生成隨機寶箱、抽卡、商城與排名畫面。
- 不因漂亮而接受不符合 1:1 頭身比例的版本。
- 不為透明背景默默降級到 CLI `gpt-image-1.5`。
- 若未來確實需要複雜毛髮或羽毛的原生透明資產，先向使用者說明並取得 CLI fallback 授權。

## 10. 完成定義

- 風格錨點經使用者確認。
- 所有被網站引用的資產都在 workspace。
- manifest 完整。
- 每張資產通過角色比例、酒精墨水、兒少安全、原創性與裁切檢查。
- 手機與桌機實看無文字遮擋。
- 圖片失效 fallback 通過。
- 沒有未使用的大型圖片進入正式 bundle。
