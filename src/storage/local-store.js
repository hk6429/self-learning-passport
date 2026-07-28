export const STORAGE_KEY = "self-learning-passport:v1";
export const RAW_BACKUP_KEY = `${STORAGE_KEY}:raw-backup`;

export function createDefaultState() {
  return {
    schemaVersion: 1,
    activeRole: null,
    student: {
      participantId: null,
      northStar: null,
      primarySubject: "language",
      dailyMinutes: 5,
      visualPreference: {
        passportStyle: "ink",
        reducedMotion: false,
        focusMode: false,
        worldGuideDismissed: false,
      },
      favoriteMissionIds: [],
      trackedBadgeId: null,
      missionStarts: [],
      activeDays: [],
      weeklyStrategyReviews: [],
      missionHistory: {},
      passport: {
        sealId: "ink-tail",
        featuredRelicId: null,
        featuredBadgeId: null,
      },
      encouragement: {
        message: "",
        helpfulness: null,
        updatedAt: null,
      },
      measurementEvents: [],
    },
    classes: {},
    teacher: {
      managedClasses: {},
    },
    syncQueue: [],
  };
}

function isRecord(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function isSchemaV1State(value) {
  return (
    isRecord(value) &&
    value.schemaVersion === 1 &&
    isRecord(value.student) &&
    isRecord(value.classes) &&
    isRecord(value.teacher) &&
    isRecord(value.teacher.managedClasses) &&
    Array.isArray(value.syncQueue)
  );
}

function storageFailureStatus(error) {
  return error?.name === "QuotaExceededError" ||
    error?.name === "NS_ERROR_DOM_QUOTA_REACHED" ||
    error?.code === 22 ||
    error?.code === 1014
    ? "quota-exceeded"
    : "storage-unavailable";
}

function isPrivateSyncKey(key) {
  const normalized = key.toLowerCase().replace(/[^a-z]/g, "");
  return (
    normalized.includes("reflection") ||
    normalized.includes("answer") ||
    normalized.endsWith("name") ||
    normalized.includes("measurementevents")
  );
}

function sanitizeSyncValue(value) {
  if (Array.isArray(value)) {
    return value.map(sanitizeSyncValue);
  }
  if (!isRecord(value)) {
    return value;
  }

  return Object.fromEntries(
    Object.entries(value)
      .filter(([key]) => !isPrivateSyncKey(key))
      .map(([key, nestedValue]) => [key, sanitizeSyncValue(nestedValue)]),
  );
}

export function createLocalStore(storage) {
  function recover(raw, reason) {
    let backupStatus = "saved";
    try {
      storage.setItem(RAW_BACKUP_KEY, raw);
    } catch (error) {
      backupStatus = storageFailureStatus(error);
    }

    if (backupStatus === "saved") {
      try {
        storage.removeItem(STORAGE_KEY);
      } catch {
        // 已有 raw backup，主要資料即使暫時無法移除也不影響安全 fallback。
      }
    }

    return {
      ok: true,
      status: "recovered",
      reason,
      backupStatus,
      state: createDefaultState(),
    };
  }

  return {
    load() {
      let raw;
      try {
        raw = storage.getItem(STORAGE_KEY);
      } catch (error) {
        return {
          ok: false,
          status: storageFailureStatus(error),
          state: createDefaultState(),
        };
      }
      if (raw === null) {
        return { ok: true, status: "empty", state: createDefaultState() };
      }

      let state;
      try {
        state = JSON.parse(raw);
      } catch {
        return recover(raw, "invalid-json");
      }

      if (!isRecord(state)) {
        return recover(raw, "invalid-state");
      }
      if (state.schemaVersion !== 1) {
        return recover(raw, "unsupported-schema");
      }
      if (!isSchemaV1State(state)) {
        return recover(raw, "invalid-state");
      }

      return { ok: true, status: "loaded", state };
    },

    save(state) {
      let serialized;
      try {
        serialized = JSON.stringify({
          ...state,
          syncQueue: sanitizeSyncValue(state.syncQueue),
        });
      } catch {
        return { ok: false, status: "serialization-failed" };
      }

      try {
        storage.setItem(STORAGE_KEY, serialized);
        return { ok: true, status: "saved" };
      } catch (error) {
        return { ok: false, status: storageFailureStatus(error) };
      }
    },

    clear() {
      try {
        storage.removeItem(STORAGE_KEY);
        storage.removeItem(RAW_BACKUP_KEY);
        return { ok: true, status: "cleared", state: createDefaultState() };
      } catch (error) {
        return {
          ok: false,
          status: storageFailureStatus(error),
          state: createDefaultState(),
        };
      }
    },
  };
}
