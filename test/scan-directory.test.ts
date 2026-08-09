import {
  mkdir,
  mkdtemp,
  rm,
  symlink,
  writeFile,
} from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { expect, test } from "vitest";

import { scanDirectory, validateRoot } from "../src/scan/scan-directory.js";

const fixturesRoot = join(import.meta.dirname, "fixtures");

// Valid root test

test("accepts an existing directory as the root", async () => {
  await expect(
    validateRoot(join(fixturesRoot, "basic-tree")),
  ).resolves.toBeUndefined();
});

// Missing root test

test("rejects a missing root path", async () => {
  await expect(
    validateRoot(join(fixturesRoot, "does-not-exist")),
  ).rejects.toThrow();
});

// File passed as root test

test("rejects a file as the root", async () => {
  await expect(
    validateRoot(
      join(fixturesRoot, "basic-tree", "getting-started.md"),
    ),
  ).rejects.toThrow("Root path is not a directory");
});

// Basic traversal test

test("scans nested files and directories", async () => {
  const tree = await scanDirectory(
    join(fixturesRoot, "basic-tree"),
  );

  expect(tree.name).toBe("basic-tree");
  expect(tree.relativePath).toBe("");
  expect(tree.type).toBe("directory");

  expect(tree.children?.map((child) => child.name)).toEqual([
    "architecture",
    "guides",
    "getting-started.md",
  ]);
});

// Empty directory test

test("scans an empty directory", async () => {
  const emptyRoot = await mkdtemp(
    join(tmpdir(), "treemark-empty-"),
  );

  try {
    const tree = await scanDirectory(emptyRoot);

    expect(tree.type).toBe("directory");
    expect(tree.children).toEqual([]);
  } finally {
    await rm(emptyRoot, {
      recursive: true,
      force: true,
    });
  }
});

// Nested relative paths use / test

test("stores normalized nested relative paths", async () => {
  const tree = await scanDirectory(
    join(fixturesRoot, "basic-tree"),
  );

  const architecture = tree.children?.find(
    (child) => child.name === "architecture",
  );

  const overview = architecture?.children?.find(
    (child) => child.name === "overview.md",
  );

  expect(overview?.relativePath).toBe(
    "architecture/overview.md",
  );
});

// Sorting fixture test

test("sorts directories first with natural filename ordering", async () => {
  const tree = await scanDirectory(
    join(fixturesRoot, "sorting"),
  );

  expect(tree.children?.map((child) => child.name)).toEqual([
    "alpha",
    "Zebra",
    "API.md",
    "guide2.md",
    "guide10.md",
  ]);
});

// Max depth tests

// Depth 0 test

test("limits scanning to the root at max depth 0", async () => {
  const tree = await scanDirectory(
    join(fixturesRoot, "max-depth"),
    {
      maxDepth: 0,
    },
  );

  expect(tree.children).toEqual([]);
});

// Depth 1 test

test("includes direct children at max depth 1", async () => {
  const tree = await scanDirectory(
    join(fixturesRoot, "max-depth"),
    {
      maxDepth: 1,
    },
  );

  expect(tree.children?.map((child) => child.name)).toEqual([
    "level1",
    "root.md",
  ]);

  const level1 = tree.children?.find(
    (child) => child.name === "level1",
  );

  expect(level1?.children).toEqual([]);
});

// Depth 2 test

test("includes grandchildren at max depth 2", async () => {
  const tree = await scanDirectory(
    join(fixturesRoot, "max-depth"),
    {
      maxDepth: 2,
    },
  );

  const level1 = tree.children?.find(
    (child) => child.name === "level1",
  );

  expect(level1?.children?.map((child) => child.name)).toEqual([
    "level2",
    "level1.md",
  ]);

  const level2 = level1?.children?.find(
    (child) => child.name === "level2",
  );

  expect(level2?.children).toEqual([]);
});

// Depth 3 test

test("includes great-grandchildren at max depth 3", async () => {
  const tree = await scanDirectory(
    join(fixturesRoot, "max-depth"),
    {
      maxDepth: 3,
    },
  );
  const level1 = tree.children?.find(
    (child) => child.name === "level1",
  );
  const level2 = level1?.children?.find(
    (child) => child.name === "level2",
  );
  expect(level2?.children?.map((child) => child.name)).toEqual([
    "level3",
    "level2.md",
  ]);
  const level3 = level2?.children?.find(
    (child) => child.name === "level3",
  );

  expect(level3?.children).toEqual([]);
});

// Ignore default directories test

test("ignores default excluded directories", async () => {
  const tree = await scanDirectory(
    join(fixturesRoot, "filtering"),
  );

  expect(tree.children?.map((child) => child.name)).toEqual([
    "drafts",
    "guides",
    "overview.md",
  ]);
});

// Applies custom ignore patterns test

test("applies custom ignore patterns", async () => {
  const tree = await scanDirectory(
    join(fixturesRoot, "filtering"),
    {
      ignorePatterns: ["drafts/**"],
    },
  );

  expect(tree.children?.map((child) => child.name)).toEqual([
    "guides",
    "overview.md",
  ]);
});

// Pruning proof test

test("prunes ignored directories before adding them to the tree", async () => {
  const tree = await scanDirectory(
    join(fixturesRoot, "filtering"),
    {
      ignorePatterns: ["drafts/**"],
    },
  );

  const drafts = tree.children?.find(
    (child) => child.name === "drafts",
  );

  expect(drafts).toBeUndefined();
});

// Skips symbolic links test

test("skips symbolic links", async () => {
  const tempRoot = await mkdtemp(
    join(tmpdir(), "treemark-symlink-"),
  );

  const scanRoot = join(tempRoot, "root");
  const targetRoot = join(tempRoot, "target");

  try {
    await mkdir(scanRoot);
    await mkdir(targetRoot);

    await writeFile(
      join(scanRoot, "keep.md"),
      "keep",
    );

    await writeFile(
      join(targetRoot, "linked.md"),
      "linked",
    );

    await symlink(
      targetRoot,
      join(scanRoot, "linked-target"),
      "junction",
    );

    const tree = await scanDirectory(scanRoot);

    expect(tree.children?.map((child) => child.name)).toEqual([
      "keep.md",
    ]);
  } finally {
    await rm(tempRoot, {
      recursive: true,
      force: true,
    });
  }
});

// Exclude exact paths test

test("excludes only exact root-relative paths", async () => {
  const tree = await scanDirectory(
    join(fixturesRoot, "filtering"),
    {
      excludedPaths: ["guides/keep.md"],
    },
  );

  const guides = tree.children?.find(
    (child) => child.name === "guides",
  );

  expect(guides?.children?.map((child) => child.name)).toEqual([]);

  expect(tree.children?.map((child) => child.name)).toEqual([
    "drafts",
    "guides",
    "overview.md",
  ]);

  expect(
    tree.children?.some((child) => child.name === "overview.md"),
  ).toBe(true);
});