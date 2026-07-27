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

const realmStateText = Object.freeze({
  "ink-cave-spider-seven": Object.freeze({
    idle: Object.freeze({
      alt: "墨蛛小七展開四條絨蛛臂，捧著字網竹框安靜等候。",
      fallback: "墨蛛小七正在盤絲墨洞等你，國語文任務仍可直接開始。",
    }),
    focus: Object.freeze({
      alt: "墨蛛小七用上方雙臂指向竹框，專注整理字網。",
      fallback: "墨蛛小七正陪你整理字網，任務內容仍可正常閱讀。",
    }),
    celebrate: Object.freeze({
      alt: "墨蛛小七小幅舉起絨蛛臂，慶祝文字網亮起一段。",
      fallback: "墨蛛小七正陪你回看亮起的字網，學習足跡仍可查看。",
    }),
    recover: Object.freeze({
      alt: "墨蛛小七坐低身子，用四條絨蛛臂安心抱著竹框。",
      fallback: "墨蛛小七陪你在墨洞歇腳，已整理的字網不會消失。",
    }),
  }),
  "wind-valley-green-horn": Object.freeze({
    idle: Object.freeze({
      alt: "青角小牛妖捧著風語葉笛，在谷口安靜等候。",
      fallback: "青角小牛妖正在風語谷等你，英文任務仍可直接開始。",
    }),
    focus: Object.freeze({
      alt: "青角小牛妖把葉笛靠近牛鼻，專注聽風中的聲音。",
      fallback: "青角小牛妖正陪你聽風辨字，任務內容仍可正常閱讀。",
    }),
    celebrate: Object.freeze({
      alt: "青角小牛妖微抬一隻前蹄，開心迎接回來的風語葉。",
      fallback: "青角小牛妖正陪你回看今天記住的單字。",
    }),
    recover: Object.freeze({
      alt: "青角小牛妖坐低身子，抱著風語葉笛安心歇腳。",
      fallback: "青角小牛妖陪你在風語谷歇腳，已走過的路不會消失。",
    }),
  }),
  "golden-ridge-tablet-turtle": Object.freeze({
    idle: Object.freeze({
      alt: "負碑小龜妖背著三環石碑，在算陣嶺安靜等候。",
      fallback: "負碑小龜妖正在算陣嶺等你，數學任務仍可直接開始。",
    }),
    focus: Object.freeze({
      alt: "負碑小龜妖抬起頭與前足，專注指出山路規律。",
      fallback: "負碑小龜妖正陪你找規律，任務內容仍可正常閱讀。",
    }),
    celebrate: Object.freeze({
      alt: "負碑小龜妖抬高頭與前足，慶祝金環轉正一格。",
      fallback: "負碑小龜妖正陪你回看找到的那一步規律。",
    }),
    recover: Object.freeze({
      alt: "負碑小龜妖放低頭、收攏短足，在石碑下安心歇腳。",
      fallback: "負碑小龜妖陪你在算陣嶺歇腳，已走過的路不會消失。",
    }),
  }),
});

export const CHARACTER_CATALOG = Object.freeze([
  {
    id: "ink-tail-guide",
    name: "墨尾行者",
    characterType: "functional-support",
    featureId: "daily-route-guide",
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
    characterType: "functional-support",
    featureId: "habit-recovery",
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
    characterType: "functional-support",
    featureId: "five-minute-start",
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
    characterType: "functional-support",
    featureId: "mission-map",
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
    characterType: "functional-support",
    featureId: "branch-exploration",
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
    characterType: "functional-support",
    featureId: "pace-rest",
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
    characterType: "functional-support",
    featureId: "achievement-review",
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
    characterType: "functional-support",
    featureId: "class-nebula",
    role: "班級共同星雲",
    alt: "九靈獅導師的八朵鬃毛環繞中央獅頭發光。",
    assets: characterAssets(
      "nine-spirit-mentor",
      "九靈獅導師守望班級共同照亮的匿名星雲。",
    ),
  },
  {
    id: "ink-cave-spider-seven",
    name: "墨蛛小七",
    characterType: "realm-primary",
    role: "盤絲墨洞主要 NPC",
    alt: "墨蛛小七用細短蛛足整理打結的文字絲。",
    assets: characterAssets(
      "ink-cave-spider-seven",
      "墨蛛小七正在盤絲墨洞等你，文字任務仍可直接開始。",
    ),
    stateText: realmStateText["ink-cave-spider-seven"],
  },
  {
    id: "wind-valley-green-horn",
    name: "青角小牛妖",
    characterType: "realm-primary",
    role: "芭蕉風語谷主要 NPC",
    alt: "青角小牛妖捧著風語葉，在芭蕉樹下側耳聆聽。",
    assets: characterAssets(
      "wind-valley-green-horn",
      "青角小牛妖正在芭蕉風語谷等你，英文任務仍可直接開始。",
    ),
    stateText: realmStateText["wind-valley-green-horn"],
  },
  {
    id: "golden-ridge-tablet-turtle",
    name: "負碑小龜妖",
    characterType: "realm-primary",
    role: "金箍算陣嶺主要 NPC",
    alt: "負碑小龜妖背著三環石碑，沿著金環山路緩緩前行。",
    assets: characterAssets(
      "golden-ridge-tablet-turtle",
      "負碑小龜妖正在金箍算陣嶺等你，數學任務仍可直接開始。",
    ),
    stateText: realmStateText["golden-ridge-tablet-turtle"],
  },
]);
