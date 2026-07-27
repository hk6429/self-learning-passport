export function createD1Adapter(binding) {
  return {
    async hasClassCode(code) {
      const row = await binding
        .prepare("SELECT 1 AS found FROM classes WHERE code = ? LIMIT 1")
        .bind(code)
        .first();
      return Boolean(row);
    },

    async insertClassBundle({ classRecord, missionRecords }) {
      const statements = [
        binding
          .prepare(
            "INSERT INTO classes (id, code, title, teacher_key_hash, status, retention_days, created_at, expires_at, purge_after) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
          )
          .bind(
            classRecord.id,
            classRecord.code,
            classRecord.title,
            classRecord.teacherKeyHash,
            classRecord.status,
            classRecord.retentionDays,
            classRecord.createdAt,
            classRecord.expiresAt,
            classRecord.purgeAfter,
          ),
        ...missionRecords.map((mission) =>
          binding
            .prepare(
              "INSERT INTO missions (id, class_id, catalog_mission_id, position, available_on, created_at) VALUES (?, ?, ?, ?, ?, ?)",
            )
            .bind(
              mission.id,
              mission.classId,
              mission.catalogMissionId,
              mission.position,
              mission.availableOn,
              mission.createdAt,
            ),
        ),
      ];

      await binding.batch(statements);
    },
  };
}
