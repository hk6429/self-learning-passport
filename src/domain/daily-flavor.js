const SITE_IDS = new Set([
  "zizizhuji",
  "vocab-duel",
  "bxws-math",
  "wenhao-xiaozhuan",
  "wenyan-jieyou-zhan",
  "science-hero",
  "fanren-lianxin",
]);

const DAILY_PHASES = Object.freeze([
  Object.freeze({
    label: "薄霧初開",
    message: "墨尾把路牌轉向你：今天不用走遠，先讓第一小段路亮起來。",
    collectibleHint: "霧裡露出一角金邊，像有一件收藏正在等你認出。",
  }),
  Object.freeze({
    label: "星屑回音",
    message: "遠處傳來小妖的回音：昨天走過的路沒有消失，今天可從這裡續上。",
    collectibleHint: "一枚星屑落在收藏剪影上，下一次落印會讓輪廓更清楚。",
  }),
  Object.freeze({
    label: "風葉巡遊",
    message: "風語葉繞著任務帖轉了一圈：換一科也可以，選今天最走得動的路。",
    collectibleHint: "風裡夾著一張未完成的藏品卡，還差幾點習光就能翻面。",
  }),
  Object.freeze({
    label: "月絲牽路",
    message: "一縷月絲連上你的護照：短短五分鐘，也會被妖界好好記住。",
    collectibleHint: "月光照出下一件收藏的剪影，走一步就會再清晰一點。",
  }),
  Object.freeze({
    label: "金環微光",
    message: "金環輕輕轉正一格：不用追趕任何人，只要完成自己的這一格。",
    collectibleHint: "收藏櫃響起一聲輕鈴，新的展示位正在慢慢開啟。",
  }),
]);

const SITE_OFFSETS = Object.freeze({
  zizizhuji: 0,
  "vocab-duel": 1,
  "bxws-math": 2,
  "wenhao-xiaozhuan": 3,
  "wenyan-jieyou-zhan": 4,
  "science-hero": 2,
  "fanren-lianxin": 1,
});

const dayNumber = (dateKey) => {
  const [year, month, day] = dateKey.split("-").map(Number);
  const timestamp = Date.UTC(year, month - 1, day);
  const normalized = new Date(timestamp).toISOString().slice(0, 10);
  if (normalized !== dateKey) {
    throw new TypeError("每日妖語需要有效日期");
  }
  return Math.floor(timestamp / 86_400_000);
};

export function getDailyFlavor({ dateKey, siteId } = {}) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateKey ?? "")) {
    throw new TypeError("每日妖語需要 YYYY-MM-DD 日期");
  }
  if (!SITE_IDS.has(siteId)) {
    throw new RangeError("每日妖語只支援七個主站");
  }

  const index =
    (dayNumber(dateKey) + SITE_OFFSETS[siteId]) % DAILY_PHASES.length;
  return { ...DAILY_PHASES[index] };
}
