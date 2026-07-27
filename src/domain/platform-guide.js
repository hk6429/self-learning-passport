import { LEARNING_PLATFORM_CATALOG } from "../data/platform-catalog.js";

const SUPPORTED_ROLES = new Set(["student", "teacher", "parent"]);

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
