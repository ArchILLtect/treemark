import {
  mkdtemp,
  rm,
  writeFile,
} from "node:fs/promises";
import {
  tmpdir,
} from "node:os";
import {
  join,
} from "node:path";
import {
  afterEach,
  describe,
  expect,
  it,
} from "vitest";
import {
  checkOutputFile,
} from "../src/check/check-output-file.js";

const temporaryDirectories: string[] = [];

async function createTemporaryDirectory(): Promise<string> {
  const directory = await mkdtemp(
    join(
      tmpdir(),
      "treemark-check-output-",
    ),
  );

  temporaryDirectories.push(directory);

  return directory;
}

afterEach(async () => {
  await Promise.all(
    temporaryDirectories.splice(0).map(
      (directory) =>
        rm(directory, {
          recursive: true,
          force: true,
        }),
    ),
  );
});

describe("checkOutputFile", () => {
  it("returns current when the existing file matches expected content", async () => {
    const directory =
      await createTemporaryDirectory();

    const targetPath = join(
      directory,
      "structure-map.md",
    );

    await writeFile(
      targetPath,
      "expected\n",
      "utf8",
    );

    await expect(
      checkOutputFile(
        targetPath,
        "expected\n",
      ),
    ).resolves.toBe("current");
  });

  it("returns stale when the existing file differs from expected content", async () => {
    const directory =
      await createTemporaryDirectory();

    const targetPath = join(
      directory,
      "structure-map.md",
    );

    await writeFile(
      targetPath,
      "old\n",
      "utf8",
    );

    await expect(
      checkOutputFile(
        targetPath,
        "expected\n",
      ),
    ).resolves.toBe("stale");
  });
});