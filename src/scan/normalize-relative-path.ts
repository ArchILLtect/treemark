
export function normalizeRelativePath(relativePath: string): string {
  // Normalize the path to use forward slashes
  return relativePath.replaceAll("\\", "/");
}