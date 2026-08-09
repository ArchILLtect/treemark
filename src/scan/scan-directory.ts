import { readdir, stat } from "node:fs/promises";
import { basename, join, resolve } from "node:path";
import type { ScanOptions, TreeNode } from "../types.js";
import { normalizeRelativePath } from "./normalize-relative-path.js";
import { sortEntries } from "./sort-entries.js";
import { DEFAULT_IGNORE_PATTERNS } from "./default-ignore-patterns.js";
import { shouldIgnore } from "./should-ignore.js";

export async function validateRoot(rootPath: string): Promise<void> {
  const stats = await stat(rootPath);

  if (!stats.isDirectory()) {
    throw new Error(`Root path is not a directory: ${rootPath}`);
  }
}

export async function scanDirectory(
  rootPath: string,
  options: ScanOptions = {},
): Promise<TreeNode> {
  await validateRoot(rootPath);

  const resolvedRootPath = resolve(rootPath);

  const ignorePatterns = [
    ...DEFAULT_IGNORE_PATTERNS,
    ...(options.ignorePatterns ?? []),
  ];

  return scanDirectoryNode(
    resolvedRootPath,
    "",
    0,
    options,
    ignorePatterns,
  );
}

async function scanDirectoryNode(
  currentPath: string,
  relativePath: string,
  currentDepth: number,
  options: ScanOptions,
  ignorePatterns: string[],
): Promise<TreeNode> {
  if (
    options.maxDepth !== undefined &&
    currentDepth >= options.maxDepth
  ) {
    return {
      name: basename(currentPath),
      relativePath,
      type: "directory",
      children: [],
    };
  }

  const entries = sortEntries(
    await readdir(currentPath, {
      withFileTypes: true,
    }),
  );

  const children: TreeNode[] = [];

  for (const entry of entries) {
    const entryPath = join(currentPath, entry.name);
    const entryRelativePath = normalizeRelativePath(
      join(relativePath, entry.name),
    );

    if (options.excludedPaths?.includes(entryRelativePath)) {
      continue;
    }

    if (shouldIgnore(entryRelativePath, ignorePatterns)) {
      continue;
    }

    if (entry.isSymbolicLink()) {
      continue;
    }

    if (entry.isDirectory()) {
      const directoryNode = await scanDirectoryNode(
        entryPath,
        entryRelativePath,
        currentDepth + 1,
        options,
        ignorePatterns,
      );

      children.push(directoryNode);
    } else if (entry.isFile()) {
      children.push({
        name: entry.name,
        relativePath: entryRelativePath,
        type: "file",
      });
    }
  }

  return {
    name: basename(currentPath),
    relativePath,
    type: "directory",
    children,
  };
}