import {
  afterEach,
  beforeEach,
  describe,
  expect,
  test,
  vi,
} from "vitest";
import {
  mkdir,
  mkdtemp,
  readFile,
  rm,
  stat,
  writeFile,
} from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { runCli } from "../src/cli/run-cli.js";
import {
  END_MARKER,
  START_MARKER,
} from "../src/sync/markers.js";

describe("TreeMark CLI check end-to-end", () => {
  let rootPath: string;

  beforeEach(async () => {
    rootPath = await mkdtemp(
      join(tmpdir(), "treemark-e2e-"),
    );

    await mkdir(
      join(rootPath, "guides"),
      { recursive: true },
    );

    await mkdir(
      join(rootPath, "drafts"),
      { recursive: true },
    );

    await writeFile(
      join(rootPath, "guides", "install.md"),
      "",
    );

    await writeFile(
      join(rootPath, "guides", "usage.md"),
      "",
    );

    await writeFile(
      join(rootPath, "drafts", "secret.md"),
      "",
    );

    await writeFile(
      join(rootPath, "overview.md"),
      "",
    );
  });

  afterEach(async () => {
    vi.restoreAllMocks();

    await rm(rootPath, {
      recursive: true,
      force: true,
    });
  });

  test("returns stale without modifying an update target in check mode", async () => {
    const updatePath = join(
      rootPath,
      "README.md",
    );

    const original = [
      START_MARKER,
      "old",
      END_MARKER,
      "",
    ].join("\n");

    await writeFile(
      updatePath,
      original,
      "utf8",
    );

    const exitCode = await runCli([
      "node",
      "treemark",
      rootPath,
      "--update",
      updatePath,
      "--check",
    ]);

    expect(exitCode).toBe(2);

    expect(
      await readFile(updatePath, "utf8"),
    ).toBe(original);
  });

  test("fails when an output check target does not exist without creating it", async () => {
    const outputPath = join(
      rootPath,
      "structure-map.md",
    );

    await expect(
      runCli([
        "node",
        "treemark",
        rootPath,
        "--output",
        outputPath,
        "--check",
      ]),
    ).rejects.toThrow();

    await expect(
      readFile(outputPath, "utf8"),
    ).rejects.toThrow();
  });

  test("returns current without modifying an output target in check mode", async () => {
    const outputPath = join(
      rootPath,
      "structure-map.md",
    );

    await runCli([
      "node",
      "treemark",
      rootPath,
      "--output",
      outputPath,
      "--no-links",
    ]);

    const beforeContents = await readFile(
      outputPath,
      "utf8",
    );

    const beforeStats = await stat(
      outputPath,
    );

    await new Promise((resolve) =>
      setTimeout(resolve, 20),
    );

    const stdoutWriteSpy = vi
      .spyOn(process.stdout, "write")
      .mockImplementation(() => true);

    const exitCode = await runCli([
      "node",
      "treemark",
      rootPath,
      "--output",
      outputPath,
      "--no-links",
      "--check",
    ]);

    const afterContents = await readFile(
      outputPath,
      "utf8",
    );

    const afterStats = await stat(
      outputPath,
    );

    expect(exitCode).toBe(0);

    expect(afterContents).toBe(
      beforeContents,
    );

    expect(afterStats.mtimeMs).toBe(
      beforeStats.mtimeMs,
    );

    expect(stdoutWriteSpy).not.toHaveBeenCalled();
  });

  test("returns stale without modifying an output target in check mode", async () => {
    const outputPath = join(
      rootPath,
      "structure-map.md",
    );

    await runCli([
      "node",
      "treemark",
      rootPath,
      "--output",
      outputPath,
      "--no-links",
    ]);

    await writeFile(
      join(rootPath, "new-file.md"),
      "",
      "utf8",
    );

    const beforeContents = await readFile(
      outputPath,
      "utf8",
    );

    const beforeStats = await stat(
      outputPath,
    );

    await new Promise((resolve) =>
      setTimeout(resolve, 20),
    );

    const stdoutWriteSpy = vi
      .spyOn(process.stdout, "write")
      .mockImplementation(() => true);

    const exitCode = await runCli([
      "node",
      "treemark",
      rootPath,
      "--output",
      outputPath,
      "--no-links",
      "--check",
    ]);

    const afterContents = await readFile(
      outputPath,
      "utf8",
    );

    const afterStats = await stat(
      outputPath,
    );

    expect(exitCode).toBe(2);

    expect(afterContents).toBe(
      beforeContents,
    );

    expect(afterStats.mtimeMs).toBe(
      beforeStats.mtimeMs,
    );

    expect(stdoutWriteSpy).not.toHaveBeenCalled();
  });

  test("returns current for ASCII output in check mode", async () => {
    const outputPath = join(
      rootPath,
      "structure-map.txt",
    );

    await runCli([
      "node",
      "treemark",
      rootPath,
      "--format",
      "ascii",
      "--output",
      outputPath,
    ]);

    const exitCode = await runCli([
      "node",
      "treemark",
      rootPath,
      "--format",
      "ascii",
      "--output",
      outputPath,
      "--check",
    ]);

    expect(exitCode).toBe(0);
  });

  test("returns stale for ASCII output in check mode", async () => {
    const outputPath = join(
      rootPath,
      "structure-map.txt",
    );

    await runCli([
      "node",
      "treemark",
      rootPath,
      "--format",
      "ascii",
      "--output",
      outputPath,
    ]);

    await writeFile(
      join(rootPath, "new-file.md"),
      "",
      "utf8",
    );

    const exitCode = await runCli([
      "node",
      "treemark",
      rootPath,
      "--format",
      "ascii",
      "--output",
      outputPath,
      "--check",
    ]);

    expect(exitCode).toBe(2);
  });

  test("uses structure-map.md for bare --output in check mode", async () => {
    const originalCwd = process.cwd();

    process.chdir(rootPath);

    try {
      const outputPath = join(
        rootPath,
        "structure-map.md",
      );

      await runCli([
        "node",
        "treemark",
        rootPath,
        "--output",
        "--no-links",
      ]);

      const exitCode = await runCli([
        "node",
        "treemark",
        rootPath,
        "--output",
        "--no-links",
        "--check",
      ]);

      expect(exitCode).toBe(0);

      expect(
        await readFile(outputPath, "utf8"),
      ).toBeTruthy();
    } finally {
      process.chdir(originalCwd);
    }
  });

  test("excludes an in-root output target in check mode", async () => {
    const outputPath = join(
      rootPath,
      "structure-map.md",
    );

    await runCli([
      "node",
      "treemark",
      rootPath,
      "--output",
      outputPath,
      "--no-links",
    ]);

    const exitCode = await runCli([
      "node",
      "treemark",
      rootPath,
      "--output",
      outputPath,
      "--no-links",
      "--check",
    ]);

    expect(exitCode).toBe(0);
  });

  test("does not exclude a matching root file when an output check target is outside the root", async () => {
    const outputDirectory = await mkdtemp(
      join(tmpdir(), "treemark-check-output-"),
    );

    try {
      const outputPath = join(
        outputDirectory,
        "overview.md",
      );

      await runCli([
        "node",
        "treemark",
        rootPath,
        "--output",
        outputPath,
        "--no-links",
      ]);

      const exitCode = await runCli([
        "node",
        "treemark",
        rootPath,
        "--output",
        outputPath,
        "--no-links",
        "--check",
      ]);

      expect(exitCode).toBe(0);
    } finally {
      await rm(outputDirectory, {
        recursive: true,
        force: true,
      });
    }
  });

  test("respects --no-links in output check mode", async () => {
    const outputPath = join(
      rootPath,
      "structure-map.md",
    );

    await runCli([
      "node",
      "treemark",
      rootPath,
      "--output",
      outputPath,
      "--no-links",
    ]);

    const exitCode = await runCli([
      "node",
      "treemark",
      rootPath,
      "--output",
      outputPath,
      "--no-links",
      "--check",
    ]);

    expect(exitCode).toBe(0);
  });

  test("returns current for a synchronized Markdown target in check mode", async () => {
    const updatePath = join(
      rootPath,
      "README.md",
    );

    await writeFile(
      updatePath,
      [
        START_MARKER,
        END_MARKER,
        "",
      ].join("\n"),
      "utf8",
    );

    await runCli([
      "node",
      "treemark",
      rootPath,
      "--update",
      updatePath,
      "--no-links",
    ]);

    const beforeContents = await readFile(
      updatePath,
      "utf8",
    );

    const beforeStats = await stat(
      updatePath,
    );

    await new Promise((resolve) =>
      setTimeout(resolve, 20),
    );

    const stdoutWriteSpy = vi
      .spyOn(process.stdout, "write")
      .mockImplementation(() => true);

    const exitCode = await runCli([
      "node",
      "treemark",
      rootPath,
      "--update",
      updatePath,
      "--no-links",
      "--check",
    ]);

    const afterContents = await readFile(
      updatePath,
      "utf8",
    );

    const afterStats = await stat(
      updatePath,
    );

    expect(exitCode).toBe(0);

    expect(afterContents).toBe(
      beforeContents,
    );

    expect(afterStats.mtimeMs).toBe(
      beforeStats.mtimeMs,
    );

    expect(stdoutWriteSpy).not.toHaveBeenCalled();
  });

  test("returns stale for a synchronized Markdown target after the scanned structure changes", async () => {
    const updatePath = join(
      rootPath,
      "README.md",
    );

    await writeFile(
      updatePath,
      [
        START_MARKER,
        END_MARKER,
        "",
      ].join("\n"),
      "utf8",
    );

    await runCli([
      "node",
      "treemark",
      rootPath,
      "--update",
      updatePath,
      "--no-links",
    ]);

    await writeFile(
      join(rootPath, "new-file.md"),
      "",
      "utf8",
    );

    const beforeContents = await readFile(
      updatePath,
      "utf8",
    );

    const beforeStats = await stat(
      updatePath,
    );

    await new Promise((resolve) =>
      setTimeout(resolve, 20),
    );

    const stdoutWriteSpy = vi
      .spyOn(process.stdout, "write")
      .mockImplementation(() => true);

    const exitCode = await runCli([
      "node",
      "treemark",
      rootPath,
      "--update",
      updatePath,
      "--no-links",
      "--check",
    ]);

    const afterContents = await readFile(
      updatePath,
      "utf8",
    );

    const afterStats = await stat(
      updatePath,
    );

    expect(exitCode).toBe(2);

    expect(afterContents).toBe(
      beforeContents,
    );

    expect(afterStats.mtimeMs).toBe(
      beforeStats.mtimeMs,
    );

    expect(stdoutWriteSpy).not.toHaveBeenCalled();
  });

  test("returns current for a synchronized ASCII target in check mode", async () => {
    const updatePath = join(
      rootPath,
      "README.md",
    );

    await writeFile(
      updatePath,
      [
        START_MARKER,
        END_MARKER,
        "",
      ].join("\n"),
      "utf8",
    );

    await runCli([
      "node",
      "treemark",
      rootPath,
      "--update",
      updatePath,
      "--format",
      "ascii",
    ]);

    const exitCode = await runCli([
      "node",
      "treemark",
      rootPath,
      "--update",
      updatePath,
      "--format",
      "ascii",
      "--check",
    ]);

    expect(exitCode).toBe(0);
  });

  test("returns stale for a synchronized ASCII target in check mode", async () => {
    const updatePath = join(
      rootPath,
      "README.md",
    );

    await writeFile(
      updatePath,
      [
        START_MARKER,
        END_MARKER,
        "",
      ].join("\n"),
      "utf8",
    );

    await runCli([
      "node",
      "treemark",
      rootPath,
      "--update",
      updatePath,
      "--format",
      "ascii",
    ]);

    await writeFile(
      join(rootPath, "new-file.md"),
      "",
      "utf8",
    );

    const exitCode = await runCli([
      "node",
      "treemark",
      rootPath,
      "--update",
      updatePath,
      "--format",
      "ascii",
      "--check",
    ]);

    expect(exitCode).toBe(2);
  });

  test("resolves a cwd-relative update target and respects --no-links in check mode", async () => {
    const updatePath = join(
      rootPath,
      "README.md",
    );

    await writeFile(
      updatePath,
      [
        START_MARKER,
        END_MARKER,
        "",
      ].join("\n"),
      "utf8",
    );

    const originalCwd = process.cwd();

    process.chdir(rootPath);

    try {
      await runCli([
        "node",
        "treemark",
        rootPath,
        "--update",
        "README.md",
        "--no-links",
      ]);

      const exitCode = await runCli([
        "node",
        "treemark",
        rootPath,
        "--update",
        "README.md",
        "--no-links",
        "--check",
      ]);

      expect(exitCode).toBe(0);
    } finally {
      process.chdir(originalCwd);
    }
  });

  test("does not exclude a matching root file when an update check target is outside the root", async () => {
    const outsideDirectory = await mkdtemp(
      join(
        tmpdir(),
        "treemark-check-update-",
      ),
    );

    const updatePath = join(
      outsideDirectory,
      "overview.md",
    );

    try {
      await writeFile(
        updatePath,
        [
          START_MARKER,
          END_MARKER,
          "",
        ].join("\n"),
        "utf8",
      );

      await runCli([
        "node",
        "treemark",
        rootPath,
        "--update",
        updatePath,
        "--no-links",
      ]);

      const exitCode = await runCli([
        "node",
        "treemark",
        rootPath,
        "--update",
        updatePath,
        "--no-links",
        "--check",
      ]);

      expect(exitCode).toBe(0);
    } finally {
      await rm(
        outsideDirectory,
        {
          recursive: true,
          force: true,
        },
      );
    }
  });

  test("returns current for an LF synchronized target in check mode", async () => {
    const updatePath = join(
      rootPath,
      "README.md",
    );

    const original = [
      "# Project",
      "",
      START_MARKER,
      END_MARKER,
      "",
    ].join("\n");

    await writeFile(
      updatePath,
      original,
      "utf8",
    );

    await runCli([
      "node",
      "treemark",
      rootPath,
      "--update",
      updatePath,
      "--no-links",
    ]);

    const exitCode = await runCli([
      "node",
      "treemark",
      rootPath,
      "--update",
      updatePath,
      "--no-links",
      "--check",
    ]);

    expect(exitCode).toBe(0);
  });

  test("returns current for a CRLF synchronized target in check mode", async () => {
    const updatePath = join(
      rootPath,
      "README.md",
    );

    const original = [
      "# Project",
      "",
      START_MARKER,
      END_MARKER,
      "",
    ].join("\r\n");

    await writeFile(
      updatePath,
      original,
      "utf8",
    );

    await runCli([
      "node",
      "treemark",
      rootPath,
      "--update",
      updatePath,
      "--no-links",
    ]);

    const exitCode = await runCli([
      "node",
      "treemark",
      rootPath,
      "--update",
      updatePath,
      "--no-links",
      "--check",
    ]);

    expect(exitCode).toBe(0);
  });

  test("treats invalid update markers as an operational failure in check mode", async () => {
    const updatePath = join(
      rootPath,
      "README.md",
    );

    const original =
      "# Important user content\n";

    await writeFile(
      updatePath,
      original,
      "utf8",
    );

    await expect(
      runCli([
        "node",
        "treemark",
        rootPath,
        "--update",
        updatePath,
        "--check",
      ]),
    ).rejects.toThrow(
      "missing start marker",
    );

    expect(
      await readFile(updatePath, "utf8"),
    ).toBe(original);
  });

  test("rejects --check without --output or --update", async () => {
    await expect(
      runCli([
        "node",
        "treemark",
        rootPath,
        "--check",
      ]),
    ).rejects.toThrow(
      "--check requires --output or --update",
    );
  });

  test("rejects a directory-valued output target in check mode", async () => {
    const outputPath = join(
      rootPath,
      "guides",
    );

    await expect(
      runCli([
        "node",
        "treemark",
        rootPath,
        "--output",
        outputPath,
        "--check",
      ]),
    ).rejects.toThrow();
  });

  test("rejects a missing update target in check mode", async () => {
    const missingPath = join(
      rootPath,
      "missing-readme.md",
    );

    await expect(
      runCli([
        "node",
        "treemark",
        rootPath,
        "--update",
        missingPath,
        "--check",
      ]),
    ).rejects.toThrow(
      `update target does not exist: ${missingPath}`,
    );

    await expect(
      readFile(missingPath, "utf8"),
    ).rejects.toThrow();
  });

  test("rejects a directory-valued update target in check mode", async () => {
    const updateDirectory = join(
      rootPath,
      "update-target",
    );

    await mkdir(updateDirectory);

    await expect(
      runCli([
        "node",
        "treemark",
        rootPath,
        "--update",
        updateDirectory,
        "--check",
      ]),
    ).rejects.toThrow(
      `update target is not a file: ${updateDirectory}`,
    );

    const stats = await stat(
      updateDirectory,
    );

    expect(stats.isDirectory()).toBe(true);
  });

  test("matches destination-relative Markdown links in output check mode", async () => {
    const outputDirectory = join(
      rootPath,
      "generated",
    );

    await mkdir(outputDirectory);

    const outputPath = join(
      outputDirectory,
      "structure-map.md",
    );

    await runCli([
      "node",
      "treemark",
      rootPath,
      "--output",
      outputPath,
    ]);

    const contents = await readFile(
      outputPath,
      "utf8",
    );

    expect(contents).toContain(
      "[install.md](../guides/install.md)",
    );

    expect(contents).toContain(
      "[overview.md](../overview.md)",
    );

    const exitCode = await runCli([
      "node",
      "treemark",
      rootPath,
      "--output",
      outputPath,
      "--check",
    ]);

    expect(exitCode).toBe(0);
  });

  test("matches destination-relative Markdown links in update check mode", async () => {
    const generatedDirectory = join(
      rootPath,
      "generated",
    );

    await mkdir(generatedDirectory);

    const updatePath = join(
      generatedDirectory,
      "README.md",
    );

    await writeFile(
      updatePath,
      [
        START_MARKER,
        END_MARKER,
        "",
      ].join("\n"),
      "utf8",
    );

    await runCli([
      "node",
      "treemark",
      rootPath,
      "--update",
      updatePath,
    ]);

    const contents = await readFile(
      updatePath,
      "utf8",
    );

    expect(contents).toContain(
      "[install.md](../guides/install.md)",
    );

    expect(contents).toContain(
      "[overview.md](../overview.md)",
    );

    const exitCode = await runCli([
      "node",
      "treemark",
      rootPath,
      "--update",
      updatePath,
      "--check",
    ]);

    expect(exitCode).toBe(0);
  });

  test("produces identical results across repeated unchanged checks", async () => {
    const outputPath = join(
      rootPath,
      "structure-map.md",
    );

    await runCli([
      "node",
      "treemark",
      rootPath,
      "--output",
      outputPath,
      "--no-links",
    ]);

    const firstExitCode = await runCli([
      "node",
      "treemark",
      rootPath,
      "--output",
      outputPath,
      "--no-links",
      "--check",
    ]);

    const firstContents = await readFile(
      outputPath,
      "utf8",
    );

    const firstStats = await stat(
      outputPath,
    );

    await new Promise((resolve) =>
      setTimeout(resolve, 20),
    );

    const secondExitCode = await runCli([
      "node",
      "treemark",
      rootPath,
      "--output",
      outputPath,
      "--no-links",
      "--check",
    ]);

    const secondContents = await readFile(
      outputPath,
      "utf8",
    );

    const secondStats = await stat(
      outputPath,
    );

    expect(firstExitCode).toBe(0);
    expect(secondExitCode).toBe(0);

    expect(secondContents).toBe(
      firstContents,
    );

    expect(secondStats.mtimeMs).toBe(
      firstStats.mtimeMs,
    );
  });
});

