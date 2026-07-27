export const APPROVED_MISSION_ORIGINS = Object.freeze([
  "https://zizizhuji.pages.dev",
  "https://vocab-duel.pages.dev",
  "https://bxws-math.pages.dev",
]);

export function isApprovedMissionUrl(candidate) {
  if (typeof candidate !== "string" || candidate.length === 0) {
    return false;
  }

  try {
    const url = new URL(candidate);
    return (
      APPROVED_MISSION_ORIGINS.includes(url.origin) &&
      url.pathname === "/" &&
      url.search === "" &&
      url.hash === "" &&
      url.username === "" &&
      url.password === ""
    );
  } catch {
    return false;
  }
}

export const MISSION_CATALOG = Object.freeze([
  Object.freeze({
    id: "ink-cave-first-thread",
    siteId: "zizizhuji",
    title: "解開第一縷字絲",
    subject: "國語文",
    durationMinutes: 5,
    stage: "onboarding",
    url: "https://zizizhuji.pages.dev/",
    completionPrompt: "你今天解開了哪一個字的線索？",
    curiosityPrompt: "今天哪一個字最容易叫錯名字？",
    curiosityPromptId: "ink-cave-first-thread-clue",
    revealId: "ink-cave-first-thread-reveal",
    routeLevel: "light",
  }),
  Object.freeze({
    id: "ink-cave-woven-words",
    siteId: "zizizhuji",
    title: "理順交錯的文字網",
    subject: "國語文",
    durationMinutes: 10,
    stage: "scaffolding",
    url: "https://zizizhuji.pages.dev/",
    completionPrompt: "哪一組字的差別，現在看得更清楚？",
    curiosityPrompt: "哪些字看起來相似，讀音卻不同？",
    curiosityPromptId: "ink-cave-woven-words-clue",
    revealId: "ink-cave-woven-words-reveal",
    routeLevel: "standard",
  }),
  Object.freeze({
    id: "ink-cave-pearl-path",
    siteId: "zizizhuji",
    title: "點亮洞頂墨珠",
    subject: "國語文",
    durationMinutes: 15,
    stage: "scaffolding",
    url: "https://zizizhuji.pages.dev/",
    completionPrompt: "今天哪道題讓你找到新的辨字方法？",
    curiosityPrompt: "你能找到文字網裡最難辨認的結嗎？",
    curiosityPromptId: "ink-cave-pearl-path-clue",
    revealId: "ink-cave-pearl-path-reveal",
    routeLevel: "challenge",
  }),
  Object.freeze({
    id: "wind-valley-first-leaf",
    siteId: "vocab-duel",
    title: "尋回第一片風語葉",
    subject: "英文",
    durationMinutes: 5,
    stage: "onboarding",
    url: "https://vocab-duel.pages.dev/",
    completionPrompt: "你今天讓哪個單字找回意思？",
    curiosityPrompt: "哪一片風語葉會先找到自己的意思？",
    curiosityPromptId: "wind-valley-first-leaf-clue",
    revealId: "wind-valley-first-leaf-reveal",
    routeLevel: "light",
  }),
  Object.freeze({
    id: "wind-valley-echoing-leaves",
    siteId: "vocab-duel",
    title: "喚回芭蕉谷風歌",
    subject: "英文",
    durationMinutes: 10,
    stage: "scaffolding",
    url: "https://vocab-duel.pages.dev/",
    completionPrompt: "哪一組單字的聲音和意思連起來了？",
    curiosityPrompt: "哪些單字聽起來像，意思卻不一樣？",
    curiosityPromptId: "wind-valley-echoing-leaves-clue",
    revealId: "wind-valley-echoing-leaves-reveal",
    routeLevel: "standard",
  }),
  Object.freeze({
    id: "wind-valley-restored-song",
    siteId: "vocab-duel",
    title: "讓風語葉唱完一曲",
    subject: "英文",
    durationMinutes: 15,
    stage: "scaffolding",
    url: "https://vocab-duel.pages.dev/",
    completionPrompt: "今天你用什麼方法記住最難的單字？",
    curiosityPrompt: "今天最難記的風語葉會是哪一片？",
    curiosityPromptId: "wind-valley-restored-song-clue",
    revealId: "wind-valley-restored-song-reveal",
    routeLevel: "challenge",
  }),
  Object.freeze({
    id: "golden-ridge-first-step",
    siteId: "bxws-math",
    title: "轉正第一格金環",
    subject: "數學",
    durationMinutes: 5,
    stage: "onboarding",
    url: "https://bxws-math.pages.dev/",
    completionPrompt: "你今天找到了哪一步規律？",
    curiosityPrompt: "腳下第一塊數字石藏著什麼規律？",
    curiosityPromptId: "golden-ridge-first-step-clue",
    revealId: "golden-ridge-first-step-reveal",
    routeLevel: "light",
  }),
  Object.freeze({
    id: "golden-ridge-turning-rings",
    siteId: "bxws-math",
    title: "校準三重金環",
    subject: "數學",
    durationMinutes: 10,
    stage: "scaffolding",
    url: "https://bxws-math.pages.dev/",
    completionPrompt: "你從哪一步開始看出算陣的規律？",
    curiosityPrompt: "三重金環會按照什麼順序轉動？",
    curiosityPromptId: "golden-ridge-turning-rings-clue",
    revealId: "golden-ridge-turning-rings-reveal",
    routeLevel: "standard",
  }),
  Object.freeze({
    id: "golden-ridge-opened-path",
    siteId: "bxws-math",
    title: "重開金箍算陣山路",
    subject: "數學",
    durationMinutes: 15,
    stage: "scaffolding",
    url: "https://bxws-math.pages.dev/",
    completionPrompt: "今天哪種解法讓山路變得更清楚？",
    curiosityPrompt: "哪一種解法能讓整條山路重新出現？",
    curiosityPromptId: "golden-ridge-opened-path-clue",
    revealId: "golden-ridge-opened-path-reveal",
    routeLevel: "challenge",
  }),
]);
