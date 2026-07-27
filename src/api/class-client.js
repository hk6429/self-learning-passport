const COMPLETION_STATUSES = new Set(["complete", "partial"]);
const DEFAULT_CLOCK = Object.freeze({
  setTimeout: (callback, delay) => globalThis.setTimeout(callback, delay),
  clearTimeout: (timerId) => globalThis.clearTimeout(timerId),
});
const ERROR_KIND_BY_STATUS = new Map([
  [401, "unauthorized"],
  [403, "forbidden"],
  [404, "not-found"],
  [410, "expired"],
]);

const requireText = (value, field) => {
  if (typeof value !== "string" || value.length === 0) {
    throw new TypeError(`${field} 必須是非空字串`);
  }

  return value;
};

export function buildCompletionPayload(source = {}) {
  if (!COMPLETION_STATUSES.has(source.status)) {
    throw new RangeError("完成狀態只接受 complete 或 partial");
  }

  return {
    eventId: requireText(source.eventId, "eventId"),
    missionId: requireText(source.missionId, "missionId"),
    status: source.status,
    completedAt: requireText(source.completedAt, "completedAt"),
  };
}

export class ApiClientError extends Error {
  constructor(message, { kind, code, status = null, retryable = false }) {
    super(message);
    this.name = "ApiClientError";
    this.kind = kind;
    this.code = code;
    this.status = status;
    this.retryable = retryable;
  }
}

export function createClassClient({
  baseUrl = "",
  fetchImpl = globalThis.fetch,
  timeoutMs = 8_000,
  clock = DEFAULT_CLOCK,
} = {}) {
  const requestJson = async (path, options) => {
    const controller = new AbortController();
    const timerId = clock.setTimeout(() => controller.abort(), timeoutMs);
    let response;

    try {
      response = await fetchImpl(`${baseUrl}${path}`, {
        ...options,
        signal: controller.signal,
      });
    } catch (error) {
      if (controller.signal.aborted || error?.name === "AbortError") {
        throw new ApiClientError("連線逾時，請稍後再試。", {
          kind: "timeout",
          code: "TIMEOUT",
          retryable: true,
        });
      }

      throw new ApiClientError("目前無法連線，班級回報將稍後同步。", {
        kind: "offline",
        code: "OFFLINE",
        retryable: true,
      });
    } finally {
      clock.clearTimeout(timerId);
    }

    let envelope;
    try {
      envelope = await response.json();
    } catch {
      throw new ApiClientError("伺服器回應格式無法辨識。", {
        kind: "invalid-response",
        code: "INVALID_RESPONSE",
        status: response.status,
      });
    }

    if (response.ok && envelope?.ok === true) {
      return envelope.data;
    }

    if (envelope?.ok === false && envelope.error) {
      throw new ApiClientError(
        envelope.error.message || "班級服務暫時無法完成請求。",
        {
          kind: ERROR_KIND_BY_STATUS.get(response.status) ?? "api",
          code: envelope.error.code || "API_ERROR",
          status: response.status,
        },
      );
    }

    throw new ApiClientError("伺服器回應格式無法辨識。", {
      kind: "invalid-response",
      code: "INVALID_RESPONSE",
      status: response.status,
    });
  };

  return Object.freeze({
    submitCompletion: ({ classCode, participantToken, source }) =>
      requestJson(
        `/api/classes/${encodeURIComponent(
          requireText(classCode, "classCode"),
        )}/completions`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${requireText(
              participantToken,
              "participantToken",
            )}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(buildCompletionPayload(source)),
        },
      ),
  });
}
