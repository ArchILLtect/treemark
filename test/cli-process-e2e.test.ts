import {
  afterEach,
  beforeEach,
  describe,
  expect,
  test,
  vi,
} from "vitest";
import {
  mkdtemp,
  rm,
  writeFile,
} from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";

describe("TreeMark CLI process boundary", () => {
  let rootPath: string;
  let originalArgv: string[];
  let originalExitCode: typeof process.exitCode;

  beforeEach(async () => {
    rootPath = await mkdtemp(
      join(
        tmpdir(),
        "treemark-cli-process-",
      ),
    );

    await writeFile(
      join(rootPath, "source.md"),
      "",
      "utf8",
    );

    originalArgv = process.argv;
    originalExitCode = process.exitCode;

    process.exitCode = 0;

    vi.resetModules();
  });

  afterEach(async () => {
    process.argv = originalArgv;
    process.exitCode = originalExitCode;

    vi.restoreAllMocks();
    vi.resetModules();

    await rm(rootPath, {
      recursive: true,
      force: true,
    });
  });

  test("sets process exit code 0 when a checked target is current", async () => {
    const outputPath = join(
      rootPath,
      "structure-map.md",
    );

    await writeFile(
      outputPath,
      "- source.md\n",
      "utf8",
    );

    process.argv = [
      "node",
      "treemark",
      rootPath,
      "--output",
      outputPath,
      "--no-links",
      "--check",
    ];

    await import("../src/cli.js");

    expect(process.exitCode).toBe(0);
  });

  test("sets process exit code 2 when a checked target is stale", async () => {
    const outputPath = join(
      rootPath,
      "structure-map.md",
    );

    await writeFile(
      outputPath,
      "stale content\n",
      "utf8",
    );

    process.argv = [
      "node",
      "treemark",
      rootPath,
      "--output",
      outputPath,
      "--no-links",
      "--check",
    ];

    await import("../src/cli.js");

    expect(process.exitCode).toBe(2);
  });

  test("sets process exit code 1 when check mode encounters an operational failure", async () => {
    const missingPath = join(
      rootPath,
      "missing-map.md",
    );

    const consoleErrorSpy = vi
      .spyOn(console, "error")
      .mockImplementation(() => undefined);

    process.argv = [
      "node",
      "treemark",
      rootPath,
      "--output",
      missingPath,
      "--no-links",
      "--check",
    ];

    await import("../src/cli.js");

    expect(process.exitCode).toBe(1);

    expect(consoleErrorSpy).toHaveBeenCalledTimes(1);

    expect(consoleErrorSpy).toHaveBeenCalledWith(
      expect.stringContaining(
        "TreeMark:",
      ),
    );
  });
});