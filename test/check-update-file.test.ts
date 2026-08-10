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
  checkUpdateFile,
} from "../src/check/check-update-file.js";
import {
  END_MARKER,
  GENERATED_NOTICE,
  START_MARKER,
} from "../src/sync/markers.js";

const temporaryDirectories: string[] = [];

async function createTemporaryDirectory(): Promise<string> {
  const directory = await mkdtemp(
    join(
      tmpdir(),
      "treemark-check-update-",
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

describe("checkUpdateFile", () => {
  it("returns current when the synchronized document already matches", async () => {
    const directory =
      await createTemporaryDirectory();

    const targetPath = join(
      directory,
      "README.md",
    );

    const document = [
      "# Project",
      "",
      START_MARKER,
      GENERATED_NOTICE,
      "",
      "- src/",
      END_MARKER,
      "",
    ].join("\n");

    await writeFile(
      targetPath,
      document,
      "utf8",
    );

    await expect(
      checkUpdateFile(
        targetPath,
        "- src/\n",
        "markdown",
      ),
    ).resolves.toBe("current");
  });

  it("returns stale when synchronization would change the document", async () => {
    const directory =
      await createTemporaryDirectory();

    const targetPath = join(
      directory,
      "README.md",
    );

    const document = [
      "# Project",
      "",
      START_MARKER,
      GENERATED_NOTICE,
      "",
      "- old/",
      END_MARKER,
      "",
    ].join("\n");

    await writeFile(
      targetPath,
      document,
      "utf8",
    );

    await expect(
      checkUpdateFile(
        targetPath,
        "- src/\n",
        "markdown",
      ),
    ).resolves.toBe("stale");
  });
});