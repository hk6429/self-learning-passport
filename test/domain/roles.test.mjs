import assert from "node:assert/strict";
import test from "node:test";

import {
  ROLE_CATALOG,
  getRole,
  selectRole,
} from "../../src/domain/roles.js";

test("三種操作身份同時保留現實名稱與妖界身份", () => {
  assert.deepEqual(
    ROLE_CATALOG.map(({ id, label, worldLabel }) => ({
      id,
      label,
      worldLabel,
    })),
    [
      { id: "student", label: "學生", worldLabel: "小行者" },
      { id: "teacher", label: "老師", worldLabel: "引路仙師" },
      { id: "parent", label: "家長", worldLabel: "守燈人" },
    ],
  );
});

test("身份選擇只產生本機介面狀態，不宣告伺服器權限", () => {
  assert.deepEqual(selectRole("teacher"), {
    activeRole: "teacher",
    localOnly: true,
    grantsServerAccess: false,
  });
  assert.equal(getRole("student")?.worldLabel, "小行者");
  assert.throws(() => selectRole("admin"), /不支援的操作身份/);
});
