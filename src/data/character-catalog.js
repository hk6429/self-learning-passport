const characterAssets = (id, fallback) =>
  Object.freeze({
    idle: `/assets/characters/${id}/idle.webp`,
    focus: `/assets/characters/${id}/focus.webp`,
    celebrate: `/assets/characters/${id}/celebrate.webp`,
    recover: `/assets/characters/${id}/recover.webp`,
    avatar: `/assets/characters/${id}/avatar.webp`,
    silhouette: `/assets/characters/${id}/silhouette.webp`,
    fallback,
  });

const inkTailStateText = Object.freeze({
  idle: Object.freeze({
    alt: "墨尾行者豎起圓耳，握著路牌站在霧海岔路前。",
    fallback: "墨尾行者正在霧海岔路等你，仍可直接選擇今日航線。",
  }),
  focus: Object.freeze({
    alt: "墨尾行者指著木路籤，專注查看眼前的方向。",
    fallback: "墨尾行者正陪你查看修行帖，任務內容仍可正常閱讀。",
  }),
  celebrate: Object.freeze({
    alt: "墨尾行者握著木路籤，微抬腳舉拳慶祝一小步。",
    fallback: "墨尾行者正陪你回看今天的一小步，學習足跡仍可查看。",
  }),
  recover: Object.freeze({
    alt: "墨尾行者坐低身子，讓雙墨尾環繞腳邊安心歇腳。",
    fallback: "墨尾行者陪你在驛站歇腳，已走過的路不會消失。",
  }),
});

export const CHARACTER_CATALOG = Object.freeze([
  {
    id: "ink-tail-guide",
    name: "墨尾行者",
    role: "首頁引路與今日任務",
    alt: "墨尾行者甩動墨筆尾巴，指向今日航線。",
    assets: characterAssets(
      "ink-tail-guide",
      "墨尾行者正在前方，陪你選一條今日航線。",
    ),
    stateText: inkTailStateText,
  },
  {
    id: "moon-rabbit-healer",
    name: "玉兔藥師",
    role: "微習慣與安心回航",
    alt: "玉兔藥師托著微光丸，在月輪前溫柔等候。",
    assets: characterAssets(
      "moon-rabbit-healer",
      "玉兔藥師守著回航燈，走一小步也很好。",
    ),
  },
  {
    id: "fire-cloud-starter",
    name: "火雲小將",
    role: "五分鐘啟動",
    alt: "火雲小將握著點火筆，腳下浮著柔軟火雲。",
    assets: characterAssets(
      "fire-cloud-starter",
      "火雲小將備好五分鐘任務，隨時可以出發。",
    ),
  },
  {
    id: "star-web-weaver",
    name: "織霞蛛娘",
    role: "任務地圖與拆解",
    alt: "織霞蛛娘用梭子整理閃亮星網與任務地圖。",
    assets: characterAssets(
      "star-web-weaver",
      "織霞蛛娘已把大任務織成幾個小步驟。",
    ),
  },
  {
    id: "yellow-wind-scout",
    name: "黃風貂斥候",
    role: "支線與探索",
    alt: "黃風貂斥候舉起羅盤，蓬鬆大尾迎風擺動。",
    assets: characterAssets(
      "yellow-wind-scout",
      "黃風貂斥候找到一條可以自由探索的支線。",
    ),
  },
  {
    id: "plantain-wind-keeper",
    name: "芭蕉風姬",
    role: "節奏與休息",
    alt: "芭蕉風姬披著葉片披風，輕輕收起芭蕉扇。",
    assets: characterAssets(
      "plantain-wind-keeper",
      "芭蕉風姬提醒你照自己的節奏前進與休息。",
    ),
  },
  {
    id: "black-wind-archivist",
    name: "黑風熊藏書官",
    role: "成果收藏與回顧",
    alt: "黑風熊藏書官背著卷軸包，整理已留下的足跡。",
    assets: characterAssets(
      "black-wind-archivist",
      "黑風熊藏書官已收好你的成果與學習足跡。",
    ),
  },
  {
    id: "nine-spirit-mentor",
    name: "九靈獅導師",
    role: "班級共同星雲",
    alt: "九靈獅導師的八朵鬃毛環繞中央獅頭發光。",
    assets: characterAssets(
      "nine-spirit-mentor",
      "九靈獅導師守望班級共同照亮的匿名星雲。",
    ),
  },
]);
