import assert from "node:assert/strict";
import test from "node:test";

import {
  ROUTES,
  resolveRoute,
  selectRoleInterface,
} from "../../src/ui/router.js";
import {
  createTextElement,
  setSafeText,
} from "../../src/ui/shared.js";

test("router 只解析入口、學生、老師與家長四條明確路由", () => {
  assert.deepEqual(ROUTES, ["/", "/student", "/teacher", "/parent"]);

  const expected = new Map([
    ["/", { id: "entrance", path: "/", role: null }],
    ["/student", { id: "student", path: "/student", role: "student" }],
    ["/teacher", { id: "teacher", path: "/teacher", role: "teacher" }],
    ["/parent", { id: "parent", path: "/parent", role: "parent" }],
  ]);

  for (const [path, route] of expected) {
    assert.deepEqual(resolveRoute(path), {
      ...route,
      matched: true,
    });
  }

  for (const path of [
    "",
    "student",
    "/admin",
    "/teacher/ABC123",
    "https://example.com/student",
    null,
  ]) {
    assert.deepEqual(resolveRoute(path), {
      id: "entrance",
      path: "/",
      role: null,
      matched: false,
    });
  }
});

test("選擇身份只切換介面，不建立任何伺服器授權", () => {
  for (const role of ["student", "teacher", "parent"]) {
    const selection = selectRoleInterface(role);
    assert.deepEqual(selection, {
      activeRole: role,
      route: `/${role}`,
      localOnly: true,
      grantsServerAccess: false,
    });
    assert.equal("teacherKey" in selection, false);
    assert.equal("participantToken" in selection, false);
  }

  assert.throws(() => selectRoleInterface("admin"), {
    name: "RangeError",
    message: "不支援的操作身份",
  });
});

test("共用 DOM helper 只以 textContent 放入使用者文字", () => {
  let innerHtmlWrites = 0;
  const createdNodes = [];
  const documentAdapter = {
    createElement(tagName) {
      const node = {
        tagName,
        textContent: "",
        className: "",
        set innerHTML(_value) {
          innerHtmlWrites += 1;
          throw new Error("不得使用 innerHTML");
        },
      };
      createdNodes.push(node);
      return node;
    },
  };
  const unsafeUserText = '<img src=x onerror="alert(1)">大聖';

  const node = createTextElement(documentAdapter, "p", unsafeUserText, {
    className: "story-copy",
  });
  assert.equal(node, createdNodes[0]);
  assert.equal(node.textContent, unsafeUserText);
  assert.equal(node.className, "story-copy");
  assert.equal(innerHtmlWrites, 0);

  setSafeText(node, null);
  assert.equal(node.textContent, "");
  assert.equal(innerHtmlWrites, 0);
});
