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
  GENERATED_NOTICE,
  START_MARKER,
} from "../src/sync/markers.js";

describe("TreeMark CLI update end-to-end", () => {
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

  test("updates a marked Markdown file with relative links and excludes the target", async () => {
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
        "# Structure",
        "",
        START_MARKER,
        "old content",
        END_MARKER,
        "",
      ].join("\n"),
      "utf8",
    );

    const stdoutWriteSpy = vi
      .spyOn(process.stdout, "write")
      .mockImplementation(() => true);

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

    expect(contents).toBe(
      [
        "# Structure",
        "",
        START_MARKER,
        GENERATED_NOTICE,
        "",
        "- **drafts/**",
        "  - [secret.md](../drafts/secret.md)",
        "- **generated/**",
        "- **guides/**",
        "  - [install.md](../guides/install.md)",
        "  - [usage.md](../guides/usage.md)",
        "- [overview.md](../overview.md)",
        END_MARKER,
        "",
      ].join("\n"),
    );

    expect(contents).not.toContain(
      "README.md",
    );

    expect(stdoutWriteSpy).not.toHaveBeenCalled();
  });

  test("resolves an update target from cwd and respects --no-links", async () => {
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
    } finally {
      process.chdir(originalCwd);
    }

    const contents = await readFile(
      updatePath,
      "utf8",
    );

    expect(contents).toBe(
      [
        START_MARKER,
        GENERATED_NOTICE,
        "",
        "- **drafts/**",
        "  - secret.md",
        "- **guides/**",
        "  - install.md",
        "  - usage.md",
        "- overview.md",
        END_MARKER,
        "",
      ].join("\n"),
    );
  });

  test("updates a marked file with fenced ASCII output", async () => {
    const updatePath = join(
      rootPath,
      "README.md",
    );

    await writeFile(
      updatePath,
      [
        START_MARKER,
        "old",
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

    const contents = await readFile(
      updatePath,
      "utf8",
    );

    expect(contents).toBe(
      [
        START_MARKER,
        GENERATED_NOTICE,
        "",
        "```text",
        "drafts/",
        "└── secret.md",
        "guides/",
        "├── install.md",
        "└── usage.md",
        "overview.md",
        "```",
        END_MARKER,
        "",
      ].join("\n"),
    );
  });

  test("does not exclude a matching root file when the update target is outside the root", async () => {
    const outsideDirectory = await mkdtemp(
      join(tmpdir(), "treemark-e2e-update-"),
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

      const contents = await readFile(
        updatePath,
        "utf8",
      );

      expect(contents).toContain(
        "- overview.md",
      );
    } finally {
      await rm(outsideDirectory, {
        recursive: true,
        force: true,
      });
    }
  });

  test("does not modify the update target when markers are invalid", async () => {
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
      ]),
    ).rejects.toThrow(
      "missing start marker",
    );

    expect(
      await readFile(updatePath, "utf8"),
    ).toBe(original);
  });

  test("rejects a missing update target", async () => {
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
      ]),
    ).rejects.toThrow(
      `update target does not exist: ${missingPath}`,
    );

    await expect(
      readFile(missingPath, "utf8"),
    ).rejects.toThrow();
  });

  test("rejects a directory-valued update target", async () => {
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
      ]),
    ).rejects.toThrow(
      `update target is not a file: ${updateDirectory}`,
    );

    const stats = await stat(
      updateDirectory,
    );

    expect(stats.isDirectory()).toBe(true);
  });

  test("does not rewrite an unchanged update target", async () => {
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

    const argv = [
      "node",
      "treemark",
      rootPath,
      "--update",
      updatePath,
    ];

    await runCli(argv);

    const firstContents = await readFile(
      updatePath,
      "utf8",
    );

    const firstStats = await stat(
      updatePath,
    );

    await new Promise((resolve) =>
      setTimeout(resolve, 20),
    );

    await runCli(argv);

    const secondContents = await readFile(
      updatePath,
      "utf8",
    );

    const secondStats = await stat(
      updatePath,
    );

    expect(secondContents).toBe(
      firstContents,
    );

    expect(secondStats.mtimeMs).toBe(
      firstStats.mtimeMs,
    );
  });

  test("preserves LF newline style when updating a Markdown target", async () => {
    const updatePath = join(
      rootPath,
      "README.md",
    );

    const original = [
      "# Project",
      "",
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

    expect(contents).not.toContain("\r\n");

    expect(contents).toContain(
      `${START_MARKER}\n${GENERATED_NOTICE}\n`,
    );
  });

  test("preserves CRLF newline style when updating a Markdown target", async () => {
    const updatePath = join(
      rootPath,
      "README.md",
    );

    const original = [
      "# Project",
      "",
      START_MARKER,
      "old",
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
    ]);

    const contents = await readFile(
      updatePath,
      "utf8",
    );

    expect(contents).toContain("\r\n");

    expect(
      contents.replaceAll("\r\n", ""),
    ).not.toContain("\n");

    expect(contents).toContain(
      `${START_MARKER}\r\n${GENERATED_NOTICE}\r\n`,
    );
  });
});

