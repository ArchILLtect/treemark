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
  rm,
  symlink,
  writeFile,
} from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { runCli } from "../src/cli/run-cli.js";
import {
  END_MARKER,
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
});

