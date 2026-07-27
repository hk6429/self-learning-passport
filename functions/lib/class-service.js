import {
  generateClassCode,
  generateToken,
  hashToken,
} from "./auth.js";
import { validateClassInput } from "./validation.js";

const addDays = (date, days) =>
  new Date(date.getTime() + days * 86_400_000);

export function createClassService({
  db,
  generateCode = generateClassCode,
  generateSecret = generateToken,
  hashSecret = hashToken,
  generateId = () => globalThis.crypto.randomUUID(),
  now = () => new Date(),
}) {
  return {
    async createClass(input) {
      const validated = validateClassInput(input);
      let classCode;

      for (let attempt = 0; attempt < 8; attempt += 1) {
        const candidate = generateCode();
        if (!(await db.hasClassCode(candidate))) {
          classCode = candidate;
          break;
        }
      }

      if (!classCode) {
        throw new Error("無法產生未使用的班級碼。");
      }

      const createdAtDate = now();
      const createdAt = createdAtDate.toISOString();
      const expiresAt = addDays(
        createdAtDate,
        validated.retentionDays,
      ).toISOString();
      const purgeAfter = addDays(
        createdAtDate,
        validated.retentionDays + 7,
      ).toISOString();
      const teacherKey = generateSecret();
      const classId = generateId();

      await db.insertClassBundle({
        classRecord: {
          id: classId,
          code: classCode,
          title: validated.title,
          teacherKeyHash: await hashSecret(teacherKey),
          status: "active",
          retentionDays: validated.retentionDays,
          createdAt,
          expiresAt,
          purgeAfter,
        },
        missionRecords: validated.missionIds.map(
          (catalogMissionId, position) => ({
            id: generateId(),
            classId,
            catalogMissionId,
            position,
            availableOn: null,
            createdAt,
          }),
        ),
      });

      return { classCode, teacherKey, expiresAt };
    },
  };
}
