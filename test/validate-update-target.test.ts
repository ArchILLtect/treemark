import {
  describe,
  expect,
  test,
} from "vitest";

import {
  mkdtemp,
  mkdir,
  rm,
  writeFile,
} from "node:fs/promises";

import {
  join,
} from "node:path";

import {
  tmpdir,
} from "node:os";

import {
  validateUpdateTarget,
} from "../src/cli/validate-update-target.js";

describe("validateUpdateTarget", () => {
  test("accepts an existing file", async () => {
    const root = await mkdtemp(
      join(tmpdir(), "treemark-update-target-"),
    );

    const filePath = join(root, "README.md");

    try {
      await writeFile(
        filePath,
        "# README\n",
        "utf8",
      );

      await expect(
        validateUpdateTarget(filePath),
      ).resolves.toBeUndefined();
    } finally {
      await rm(root, {
        recursive: true,
        force: true,
      });
    }
  });

  test("rejects a missing target", async () => {
    const root = await mkdtemp(
      join(tmpdir(), "treemark-update-target-"),
    );

    const filePath = join(root, "missing.md");

    try {
      await expect(
        validateUpdateTarget(filePath),
      ).rejects.toThrow(
        `update target does not exist: ${filePath}`,
      );
    } finally {
      await rm(root, {
        recursive: true,
        force: true,
      });
    }
  });

  test("rejects a directory-valued target", async () => {
    const root = await mkdtemp(
      join(tmpdir(), "treemark-update-target-"),
    );

    const directoryPath = join(
      root,
      "README.md",
    );

    try {
      await mkdir(directoryPath);

      await expect(
        validateUpdateTarget(directoryPath),
      ).rejects.toThrow(
        `update target is not a file: ${directoryPath}`,
      );
    } finally {
      await rm(root, {
        recursive: true,
        force: true,
      });
    }
  });
});