export const STORY_CATALOG = Object.freeze([
  {
    id: "journey-complete",
    trigger: "complete",
    subject: null,
    lines: Object.freeze([
      "今日妖霧，已照亮一段。",
      "這滴習光墨，會留在你的西行圖上。",
    ]),
  },
  {
    id: "journey-partial",
    trigger: "partial",
    subject: null,
    lines: Object.freeze([
      "你已經走出一段，這份進度是真的。",
      "今天找到的線索，會安穩留在原地。",
    ]),
  },
  {
    id: "journey-rest",
    trigger: "rest",
    subject: null,
    lines: Object.freeze([
      "今天先在驛站歇歇腳。",
      "走過的路不會消失，行路燈也不會熄滅。",
    ]),
  },
  {
    id: "journey-return",
    trigger: "return",
    subject: null,
    lines: Object.freeze([
      "你回來了，路一直都在。",
      "今天願意再走一步，就是新的開始。",
    ]),
  },
  {
    id: "language-clue-reveal",
    trigger: "clue-reveal",
    subject: "language",
    lines: Object.freeze([
      "盤絲墨洞的字絲鬆開了一個結。",
      "仔細聽，字音正領你找到下一條路。",
    ]),
  },
  {
    id: "english-clue-reveal",
    trigger: "clue-reveal",
    subject: "english",
    lines: Object.freeze([
      "芭蕉風語谷飄回一片風語葉。",
      "它的聲音和意思，終於一起回家了。",
    ]),
  },
  {
    id: "math-clue-reveal",
    trigger: "clue-reveal",
    subject: "math",
    lines: Object.freeze([
      "金箍算陣嶺的一枚金環轉正了。",
      "沿著規律看，下一步山路正在浮現。",
    ]),
  },
]);
