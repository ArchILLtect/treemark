import picomatch from "picomatch";

export function shouldIgnore(
  relativePath: string,
  patterns: string[],
): boolean {
  return patterns.some((pattern) => picomatch.isMatch(relativePath, pattern));
}