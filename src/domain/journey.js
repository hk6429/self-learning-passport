export const NORTH_STAR_VALUES = Object.freeze([
  "habit",
  "breakthrough",
  "class-route",
  "find-my-way",
]);

export function validateNorthStar(value) {
  if (value === null || NORTH_STAR_VALUES.includes(value)) {
    return value;
  }

  throw new TypeError("不支援的學習北極星");
}
