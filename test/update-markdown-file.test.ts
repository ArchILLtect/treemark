import {
  describe,
  expect,
  test,
  vi,
} from "vitest";

import {
  mkdtemp,
  readFile,
  readdir,
  rm,
  stat,
  writeFile,
} from "node:fs/promises";

import { tmpdir } from "node:os";
import { join } from "node:path";

import {
  END_MARKER,
  GENERATED_NOTICE,
  START_MARKER,
} from "../src/sync/markers.js";

import {
  updateMarkdownFile,
} from "../src/sync/update-markdown-file.js";

describe("updateMarkdownFile", () => {
  test("safely replaces a changed Markdown target", async () => {
    const root = await mkdtemp(
      join(tmpdir(), "treemark-update-file-"),
    );

    const targetPath = join(root, "README.md");

    try {
      await writeFile(
        targetPath,
        [
          "# Project",
          "",
          START_MARKER,
          "old",
          END_MARKER,
          "",
        ].join("\n"),
        "utf8",
      );

      const result = await updateMarkdownFile(
        targetPath,
        "- file.md\n",
        "markdown",
      );

      expect(result).toEqual({
        changed: true,
      });

      expect(
        await readFile(targetPath, "utf8"),
      ).toBe(
        [
          "# Project",
          "",
          START_MARKER,
          GENERATED_NOTICE,
          "",
          "- file.md",
          END_MARKER,
          "",
        ].join("\n"),
      );
    } finally {
      await rm(root, {
        recursive: true,
        force: true,
      });
    }
  });

  test("does not rewrite an unchanged target", async () => {
    const root = await mkdtemp(
      join(tmpdir(), "treemark-update-file-"),
    );

    const targetPath = join(root, "README.md");

    try {
      const document = [
        START_MARKER,
        GENERATED_NOTICE,
        "",
        "- file.md",
        END_MARKER,
        "",
      ].join("\n");

      await writeFile(
        targetPath,
        document,
        "utf8",
      );

      const beforeStats = await stat(targetPath);

      await new Promise((resolve) =>
        setTimeout(resolve, 20),
      );

      const result = await updateMarkdownFile(
        targetPath,
        "- file.md\n",
        "markdown",
      );

      const afterStats = await stat(targetPath);

      expect(result).toEqual({
        changed: false,
      });

      expect(
        await readFile(targetPath, "utf8"),
      ).toBe(document);

      expect(afterStats.mtimeMs).toBe(
        beforeStats.mtimeMs,
      );
    } finally {
      await rm(root, {
        recursive: true,
        force: true,
      });
    }
  });

  test("does not modify the target when marker validation fails", async () => {
    const root = await mkdtemp(
      join(tmpdir(), "treemark-update-file-"),
    );

    const targetPath = join(root, "README.md");

    try {
      const original =
        "# No TreeMark markers here\n";

      await writeFile(
        targetPath,
        original,
        "utf8",
      );

      await expect(
        updateMarkdownFile(
          targetPath,
          "- file.md\n",
          "markdown",
        ),
      ).rejects.toThrow(
        "missing start marker",
      );

      expect(
        await readFile(targetPath, "utf8"),
      ).toBe(original);
    } finally {
      await rm(root, {
        recursive: true,
        force: true,
      });
    }
  });

  test("cleans up temporary files after a successful update", async () => {
    const root = await mkdtemp(
      join(tmpdir(), "treemark-update-file-"),
    );

    const targetPath = join(root, "README.md");

    try {
      await writeFile(
        targetPath,
        [
          START_MARKER,
          "old",
          END_MARKER,
          "",
        ].join("\n"),
        "utf8",
      );

      await updateMarkdownFile(
        targetPath,
        "- file.md\n",
        "markdown",
      );

      const entries = await readdir(root);

      expect(entries).toEqual([
        "README.md",
      ]);
    } finally {
      await rm(root, {
        recursive: true,
        force: true,
      });
    }
  });

  test("supports ASCII synchronized content", async () => {
    const root = await mkdtemp(
      join(tmpdir(), "treemark-update-file-"),
    );

    const targetPath = join(root, "README.md");

    try {
      await writeFile(
        targetPath,
        [
          START_MARKER,
          "old",
          END_MARKER,
          "",
        ].join("\n"),
        "utf8",
      );

      await updateMarkdownFile(
        targetPath,
        "src/\n└── index.ts\n",
        "ascii",
      );

      expect(
        await readFile(targetPath, "utf8"),
      ).toBe(
        [
          START_MARKER,
          GENERATED_NOTICE,
          "",
          "```text",
          "src/",
          "└── index.ts",
          "```",
          END_MARKER,
          "",
        ].join("\n"),
      );
    } finally {
      await rm(root, {
        recursive: true,
        force: true,
      });
    }
  });

  test("cleans up the temporary file and preserves the target when replacement fails", async () => {
    const root = await mkdtemp(
      join(tmpdir(), "treemark-update-file-"),
    );

    const targetPath = join(root, "README.md");

    try {
      const original = [
        START_MARKER,
        "old",
        END_MARKER,
        "",
      ].join("\n");

      await writeFile(
        targetPath,
        original,
        "utf8",
      );

      const failingRename = vi.fn(
        () =>
          Promise.reject(
            new Error("simulated rename failure"),
          ),
      );

      await expect(
        updateMarkdownFile(
          targetPath,
          "- file.md\n",
          "markdown",
          {
            readFile,
            writeFile,
            rename: failingRename,
            rm,
          },
        ),
      ).rejects.toThrow(
        "simulated rename failure",
      );

      expect(
        await readFile(targetPath, "utf8"),
      ).toBe(original);

      expect(
        await readdir(root),
      ).toEqual([
        "README.md",
      ]);
    } finally {
      await rm(root, {
        recursive: true,
        force: true,
      });
    }
  });
});