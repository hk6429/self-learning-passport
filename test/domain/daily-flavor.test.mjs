import assert from "node:assert/strict";
import test from "node:test";

import { getDailyFlavor } from "../../src/domain/daily-flavor.js";

test("相同日期與網站得到穩定的每日妖語，跨日會輪替", () => {
  const today = getDailyFlavor({
    dateKey: "2026-07-27",
    siteId: "zizizhuji",
  });
  const repeated = getDailyFlavor({
    dateKey: "2026-07-27",
    siteId: "zizizhuji",
  });
  const tomorrow = getDailyFlavor({
    dateKey: "2026-07-28",
    siteId: "zizizhuji",
  });

  assert.deepEqual(repeated, today);
  assert.notDeepEqual(tomorrow, today);
  assert.ok(today.label);
  assert.ok(today.message);
  assert.ok(today.collectibleHint);
});

test("每日妖語只接受正式日期與七個主站", () => {
  assert.throws(
    () => getDailyFlavor({ dateKey: "07/27/2026", siteId: "zizizhuji" }),
    TypeError,
  );
  assert.throws(
    () => getDailyFlavor({ dateKey: "2026-02-31", siteId: "zizizhuji" }),
    TypeError,
  );
  assert.throws(
    () => getDailyFlavor({ dateKey: "2026-07-27", siteId: "unknown" }),
    RangeError,
  );
});
