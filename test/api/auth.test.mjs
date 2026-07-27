import assert from "node:assert/strict";
import test from "node:test";

import {
  generateClassCode,
  generateToken,
  hashToken,
  verifyToken,
} from "../../functions/lib/auth.js";

test("Web Crypto 產生不可預測權杖並只比對雜湊", async () => {
  const first = generateToken();
  const second = generateToken();

  assert.match(first, /^[A-Za-z0-9_-]{40,}$/);
  assert.notEqual(first, second);

  const hash = await hashToken(first);
  assert.match(hash, /^[A-Fa-f0-9]{64}$/);
  assert.equal(await verifyToken(first, hash), true);
  assert.equal(await verifyToken(second, hash), false);
});

test("班級碼固定六碼並排除 0、1、I、O 等易混淆字元", () => {
  for (let index = 0; index < 200; index += 1) {
    assert.match(generateClassCode(), /^[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]{6}$/);
  }
});
