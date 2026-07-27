import { LEARNING_PLATFORM_CATALOG } from "../data/platform-catalog.js";

const SUPPORTED_ROLES = new Set(["student", "teacher", "parent"]);
const FILTER_VALUES = Object.freeze({
  group: new Set(["all", "language", "leadership", "stem", "teacher"]),
  duration: new Set(["all", "5", "10-20", "flex"]),
  context: new Set(["all", "self", "class", "homeroom", "professional"]),
});

export const PLATFORM_FILTERS = Object.freeze({
  group: Object.freeze([
    Object.freeze({ id: "all", label: "全部領域" }),
    Object.freeze({ id: "language", label: "語文閱讀" }),
    Object.freeze({ id: "stem", label: "數理自然" }),
    Object.freeze({ id: "leadership", label: "自我領導" }),
    Object.freeze({ id: "teacher", label: "教師成長" }),
  ]),
  duration: Object.freeze([
    Object.freeze({ id: "all", label: "不限時間" }),
    Object.freeze({ id: "5", label: "5 分鐘可開始" }),
    Object.freeze({ id: "10-20", label: "10～20 分鐘" }),
    Object.freeze({ id: "flex", label: "可分段進行" }),
  ]),
  context: Object.freeze([
    Object.freeze({ id: "all", label: "全部情境" }),
    Object.freeze({ id: "self", label: "學生自學" }),
    Object.freeze({ id: "class", label: "全班共學" }),
    Object.freeze({ id: "homeroom", label: "導師時間" }),
    Object.freeze({ id: "professional", label: "教師研習" }),
  ]),
});

export function getPlatformsForRole(
  role,
  { includeCore = true } = {},
) {
  if (!SUPPORTED_ROLES.has(role)) {
    throw new RangeError(`不支援的平台角色：${role}`);
  }

  return LEARNING_PLATFORM_CATALOG.filter(
    ({ audiences, coreRealm }) =>
      audiences.includes(role) && (includeCore || !coreRealm),
  );
}

export function filterPlatforms(
  platforms,
  { group = "all", duration = "all", context = "all" } = {},
) {
  if (!Array.isArray(platforms)) {
    throw new TypeError("平台清單必須是陣列");
  }
  for (const [key, value] of Object.entries({ group, duration, context })) {
    if (!FILTER_VALUES[key].has(value)) {
      throw new RangeError(`不支援的平台篩選：${key}=${value}`);
    }
  }

  return platforms.filter(
    (platform) =>
      (group === "all" || platform.group === group) &&
      (duration === "all" || platform.durationOptions.includes(duration)) &&
      (context === "all" || platform.usageContexts.includes(context)),
  );
}
