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
  symlink,
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

describe("TreeMark CLI end-to-end", () => {
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

  test("renders a real directory as Markdown by default", async () => {
    const stdoutWriteSpy = vi
      .spyOn(process.stdout, "write")
      .mockImplementation(() => true);

    await runCli([
      "node",
      "treemark",
      rootPath,
    ]);

    expect(stdoutWriteSpy).toHaveBeenCalledWith(
      "- **drafts/**\n" +
        "  - secret.md\n" +
        "- **guides/**\n" +
        "  - install.md\n" +
        "  - usage.md\n" +
        "- overview.md\n",
    );
  });

  test("renders a real directory as ASCII", async () => {
    const stdoutWriteSpy = vi
      .spyOn(process.stdout, "write")
      .mockImplementation(() => true);

    await runCli([
      "node",
      "treemark",
      rootPath,
      "--format",
      "ascii",
    ]);

    expect(stdoutWriteSpy).toHaveBeenCalledWith(
      "drafts/\n" +
        "└── secret.md\n" +
        "guides/\n" +
        "├── install.md\n" +
        "└── usage.md\n" +
        "overview.md\n",
    );
  });

  test("applies ignore patterns end-to-end", async () => {
    const stdoutWriteSpy = vi
      .spyOn(process.stdout, "write")
      .mockImplementation(() => true);

    await runCli([
      "node",
      "treemark",
      rootPath,
      "--ignore",
      "drafts/**",
    ]);

    expect(stdoutWriteSpy).toHaveBeenCalledWith(
      "- **guides/**\n" +
        "  - install.md\n" +
        "  - usage.md\n" +
        "- overview.md\n",
    );
  });

  test("applies maximum depth end-to-end", async () => {
    const stdoutWriteSpy = vi
      .spyOn(process.stdout, "write")
      .mockImplementation(() => true);

    await runCli([
      "node",
      "treemark",
      rootPath,
      "--max-depth",
      "1",
    ]);

    expect(stdoutWriteSpy).toHaveBeenCalledWith(
      "- **drafts/**\n" +
        "- **guides/**\n" +
        "- overview.md\n",
    );
  });

  test("skips symbolic links through CLI integration", async () => {
    const targetPath = join(
      rootPath,
      "guides",
    );

    const symlinkPath = join(
      rootPath,
      "guides-link",
    );

    await symlink(
      targetPath,
      symlinkPath,
      process.platform === "win32"
        ? "junction"
        : "dir",
    );

    const stdoutWriteSpy = vi
      .spyOn(process.stdout, "write")
      .mockImplementation(() => true);

    await runCli([
      "node",
      "treemark",
      rootPath,
    ]);

    expect(stdoutWriteSpy).toHaveBeenCalledWith(
      "- **drafts/**\n" +
        "  - secret.md\n" +
        "- **guides/**\n" +
        "  - install.md\n" +
        "  - usage.md\n" +
        "- overview.md\n",
    );

    expect(stdoutWriteSpy).toHaveBeenCalledTimes(1);
  });

  test("writes Markdown links relative to the output file location", async () => {
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

    expect(contents).toBe(
      "- **drafts/**\n" +
        "  - [secret.md](../drafts/secret.md)\n" +
        "- **generated/**\n" +
        "- **guides/**\n" +
        "  - [install.md](../guides/install.md)\n" +
        "  - [usage.md](../guides/usage.md)\n" +
        "- [overview.md](../overview.md)\n",
    );
  });

  test("writes plain Markdown labels when links are disabled", async () => {
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

    const contents = await readFile(
      outputPath,
      "utf8",
    );

    expect(contents).toBe(
      "- **drafts/**\n" +
        "  - secret.md\n" +
        "- **guides/**\n" +
        "  - install.md\n" +
        "  - usage.md\n" +
        "- overview.md\n",
    );
  });

  test("replaces an existing output file instead of appending", async () => {
    const outputPath = join(
      rootPath,
      "structure-map.md",
    );

    await writeFile(
      outputPath,
      "THIS SHOULD BE REPLACED\n",
      "utf8",
    );

    await runCli([
      "node",
      "treemark",
      rootPath,
      "--output",
      outputPath,
      "--no-links",
    ]);

    const contents = await readFile(
      outputPath,
      "utf8",
    );

    expect(contents).toBe(
      "- **drafts/**\n" +
        "  - secret.md\n" +
        "- **guides/**\n" +
        "  - install.md\n" +
        "  - usage.md\n" +
        "- overview.md\n",
    );

    expect(contents).not.toContain(
      "THIS SHOULD BE REPLACED",
    );
  });

  test("does not write rendered tree to stdout when using file output", async () => {
    const outputPath = join(
      rootPath,
      "structure-map.md",
    );

    const stdoutWriteSpy = vi
      .spyOn(process.stdout, "write")
      .mockImplementation(() => true);

    await runCli([
      "node",
      "treemark",
      rootPath,
      "--output",
      outputPath,
      "--no-links",
    ]);

    expect(stdoutWriteSpy).not.toHaveBeenCalled();
  });

  test("uses structure-map.md when output is requested without a filename", async () => {
    const originalCwd = process.cwd();

    process.chdir(rootPath);

    try {
      await runCli([
        "node",
        "treemark",
        rootPath,
        "--output",
        "--no-links",
      ]);

      const outputPath = join(
        rootPath,
        "structure-map.md",
      );

      const contents = await readFile(
        outputPath,
        "utf8",
      );

      expect(contents).toBe(
        "- **drafts/**\n" +
          "  - secret.md\n" +
          "- **guides/**\n" +
          "  - install.md\n" +
          "  - usage.md\n" +
          "- overview.md\n",
      );
    } finally {
      process.chdir(originalCwd);
    }
  });

  test("excludes an output file located inside the scanned root", async () => {
    const outputPath = join(
      rootPath,
      "structure-map.md",
    );

    await writeFile(
      outputPath,
      "old generated content\n",
      "utf8",
    );

    await runCli([
      "node",
      "treemark",
      rootPath,
      "--output",
      outputPath,
      "--no-links",
    ]);

    const contents = await readFile(
      outputPath,
      "utf8",
    );

    expect(contents).not.toContain(
      "structure-map.md",
    );

    expect(contents).toBe(
      "- **drafts/**\n" +
        "  - secret.md\n" +
        "- **guides/**\n" +
        "  - install.md\n" +
        "  - usage.md\n" +
        "- overview.md\n",
    );
  });

  test("fails cleanly when the output directory does not exist", async () => {
    const outputPath = join(
      rootPath,
      "missing",
      "structure-map.md",
    );

    await expect(
      runCli([
        "node",
        "treemark",
        rootPath,
        "--output",
        outputPath,
      ]),
    ).rejects.toThrow();
  });

  test("fails cleanly when the output target is a directory", async () => {
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
      ]),
    ).rejects.toThrow();
  });

  test("does not write rendered output to stdout when file writing fails", async () => {
    const outputPath = join(
      rootPath,
      "missing",
      "structure-map.md",
    );

    const stdoutWriteSpy = vi
      .spyOn(process.stdout, "write")
      .mockImplementation(() => true);

    await expect(
      runCli([
        "node",
        "treemark",
        rootPath,
        "--output",
        outputPath,
      ]),
    ).rejects.toThrow();

    expect(stdoutWriteSpy).not.toHaveBeenCalled();
  });

  test("writes ASCII output to a file", async () => {
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

    const contents = await readFile(
      outputPath,
      "utf8",
    );

    expect(contents).toBe(
      "drafts/\n" +
        "└── secret.md\n" +
        "guides/\n" +
        "├── install.md\n" +
        "└── usage.md\n" +
        "overview.md\n",
    );
  });

  test("does not exclude scan entries when output is outside the scanned root", async () => {
    const outputDirectory = await mkdtemp(
      join(tmpdir(), "treemark-output-"),
    );

    try {
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
        "--no-links",
      ]);

      const contents = await readFile(
        outputPath,
        "utf8",
      );

      expect(contents).toBe(
        "- **drafts/**\n" +
          "  - secret.md\n" +
          "- **guides/**\n" +
          "  - install.md\n" +
          "  - usage.md\n" +
          "- overview.md\n",
      );
    } finally {
      await rm(outputDirectory, {
        recursive: true,
        force: true,
      });
    }
  });

  test("produces identical file output across repeated unchanged runs", async () => {
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

    const first = await readFile(
      outputPath,
      "utf8",
    );

    await runCli([
      "node",
      "treemark",
      rootPath,
      "--output",
      outputPath,
      "--no-links",
    ]);

    const second = await readFile(
      outputPath,
      "utf8",
    );

    expect(second).toBe(first);
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

  test("rejects --output and --update together", async () => {
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

    await expect(
      runCli([
        "node",
        "treemark",
        rootPath,
        "--output",
        join(rootPath, "structure-map.md"),
        "--update",
        updatePath,
      ]),
    ).rejects.toThrow(
      "--output and --update cannot be used together",
    );
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

  test("rejects --check without modifying an update target", async () => {
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
      "--check is not implemented yet",
    );

    expect(
      await readFile(updatePath, "utf8"),
    ).toBe(original);
  });

  test("rejects --check without creating an output file", async () => {
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
    ).rejects.toThrow(
      "--check is not implemented yet",
    );

    await expect(
      readFile(outputPath, "utf8"),
    ).rejects.toThrow();
  });
});