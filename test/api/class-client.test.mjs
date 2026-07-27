import assert from "node:assert/strict";
import test from "node:test";

import {
  ApiClientError,
  buildCompletionPayload,
  createClassClient,
} from "../../src/api/class-client.js";

test("完成 payload 僅複製匿名事件白名單欄位", () => {
  const source = {
    eventId: "event-1",
    missionId: "ink-cave-first-thread",
    status: "partial",
    completedAt: "2026-07-27T08:00:00.000Z",
    reflection: "私人反思",
    answer: "私人答案",
    name: "真實姓名",
    minutes: 12,
    strategy: "shorter",
    nested: {
      reflection: "巢狀私人反思",
      answer: "巢狀私人答案",
      name: "巢狀真實姓名",
      minutes: 12,
      strategy: "retry",
    },
  };

  assert.deepEqual(buildCompletionPayload(source), {
    eventId: "event-1",
    missionId: "ink-cave-first-thread",
    status: "partial",
    completedAt: "2026-07-27T08:00:00.000Z",
  });
  assert.deepEqual(Object.keys(buildCompletionPayload(source)).sort(), [
    "completedAt",
    "eventId",
    "missionId",
    "status",
  ]);
  assert.throws(
    () => buildCompletionPayload({ ...source, status: "skipped" }),
    RangeError,
  );
});

test("client 統一解析成功與錯誤 JSON envelope", async () => {
  const requests = [];
  const successClient = createClassClient({
    baseUrl: "https://passport.example",
    fetchImpl: async (url, options) => {
      requests.push({ url, options });
      return {
        ok: true,
        status: 200,
        json: async () => ({ ok: true, data: { accepted: true } }),
      };
    },
    clock: {
      setTimeout: () => 1,
      clearTimeout: () => {},
    },
  });
  const source = {
    eventId: "event-1",
    missionId: "ink-cave-first-thread",
    status: "complete",
    completedAt: "2026-07-27T08:00:00.000Z",
    reflection: "不應送出",
  };

  assert.deepEqual(
    await successClient.submitCompletion({
      classCode: "ABC123",
      participantToken: "participant-secret",
      source,
    }),
    { accepted: true },
  );
  assert.equal(
    requests[0].url,
    "https://passport.example/api/classes/ABC123/completions",
  );
  assert.equal(
    requests[0].options.headers.Authorization,
    "Bearer participant-secret",
  );
  assert.deepEqual(JSON.parse(requests[0].options.body), {
    eventId: "event-1",
    missionId: "ink-cave-first-thread",
    status: "complete",
    completedAt: "2026-07-27T08:00:00.000Z",
  });

  const errorClient = createClassClient({
    fetchImpl: async () => ({
      ok: false,
      status: 400,
      json: async () => ({
        ok: false,
        error: { code: "INVALID_EVENT", message: "事件格式錯誤。" },
      }),
    }),
    clock: {
      setTimeout: () => 1,
      clearTimeout: () => {},
    },
  });

  await assert.rejects(
    errorClient.submitCompletion({
      classCode: "ABC123",
      participantToken: "participant-secret",
      source,
    }),
    (error) =>
      error instanceof ApiClientError &&
      error.kind === "api" &&
      error.status === 400 &&
      error.code === "INVALID_EVENT" &&
      error.message === "事件格式錯誤。",
  );
});

test("離線、逾時與權限狀態會轉成可判讀的 client error", async () => {
  const source = {
    eventId: "event-2",
    missionId: "wind-valley-first-leaf",
    status: "complete",
    completedAt: "2026-07-27T09:00:00.000Z",
  };
  const request = {
    classCode: "ABC123",
    participantToken: "participant-secret",
    source,
  };
  const statusKinds = new Map([
    [401, "unauthorized"],
    [403, "forbidden"],
    [404, "not-found"],
    [410, "expired"],
  ]);

  for (const [status, kind] of statusKinds) {
    const client = createClassClient({
      fetchImpl: async () => ({
        ok: false,
        status,
        json: async () => ({
          ok: false,
          error: { code: `HTTP_${status}`, message: `HTTP ${status}` },
        }),
      }),
      clock: {
        setTimeout: () => 1,
        clearTimeout: () => {},
      },
    });

    await assert.rejects(
      client.submitCompletion(request),
      (error) =>
        error instanceof ApiClientError &&
        error.kind === kind &&
        error.status === status &&
        error.retryable === false,
    );
  }

  const offlineClient = createClassClient({
    fetchImpl: async () => {
      throw new TypeError("network failed");
    },
    clock: {
      setTimeout: () => 1,
      clearTimeout: () => {},
    },
  });
  await assert.rejects(
    offlineClient.submitCompletion(request),
    (error) =>
      error instanceof ApiClientError &&
      error.kind === "offline" &&
      error.code === "OFFLINE" &&
      error.retryable === true,
  );

  let timeoutCleared = false;
  const timeoutClient = createClassClient({
    fetchImpl: async (_url, { signal }) => {
      assert.equal(signal.aborted, true);
      const error = new Error("aborted");
      error.name = "AbortError";
      throw error;
    },
    timeoutMs: 25,
    clock: {
      setTimeout: (callback, delay) => {
        assert.equal(delay, 25);
        callback();
        return 9;
      },
      clearTimeout: (timerId) => {
        assert.equal(timerId, 9);
        timeoutCleared = true;
      },
    },
  });
  await assert.rejects(
    timeoutClient.submitCompletion(request),
    (error) =>
      error instanceof ApiClientError &&
      error.kind === "timeout" &&
      error.code === "TIMEOUT" &&
      error.retryable === true,
  );
  assert.equal(timeoutCleared, true);
});
