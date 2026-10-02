/** Android quick-converter pairs, in its original order and precision. */
export const QUICK_CONVERSIONS = [
  ["kW", "hp", 1.34102209], ["hp", "kW", 1 / 1.34102209],
  ["N", "kgf", 1 / 9.80665], ["kgf", "N", 9.80665],
  ["N", "lbf", .224808943], ["lbf", "N", 1 / .224808943],
  ["km/h", "kt", 1 / 1.852], ["kt", "km/h", 1.852],
  ["km/h", "m/s", 1 / 3.6], ["m/s", "km/h", 3.6],
  ["m", "ft", 3.280839895], ["ft", "m", 1 / 3.280839895],
  ["mm", "in", 1 / 25.4], ["in", "mm", 25.4],
] as const;
export function quickConvert(value: number, mode: number): number {
  return value * QUICK_CONVERSIONS[mode][2];
}
