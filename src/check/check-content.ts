export type FreshnessStatus =
  | "current"
  | "stale";

export function checkContent(
  current: string,
  expected: string,
): FreshnessStatus {
  return current === expected
    ? "current"
    : "stale";
}