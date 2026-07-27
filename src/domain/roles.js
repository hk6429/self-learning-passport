export const ROLE_CATALOG = Object.freeze([
  Object.freeze({
    id: "student",
    label: "學生",
    worldLabel: "小行者",
  }),
  Object.freeze({
    id: "teacher",
    label: "老師",
    worldLabel: "引路仙師",
  }),
  Object.freeze({
    id: "parent",
    label: "家長",
    worldLabel: "守燈人",
  }),
]);

export function getRole(roleId) {
  return ROLE_CATALOG.find(({ id }) => id === roleId) ?? null;
}

export function selectRole(roleId) {
  if (!getRole(roleId)) {
    throw new RangeError("不支援的操作身份");
  }

  return {
    activeRole: roleId,
    localOnly: true,
    grantsServerAccess: false,
  };
}
