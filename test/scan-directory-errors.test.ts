import { beforeEach, expect, test, vi } from "vitest";

vi.mock("node:fs/promises", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("node:fs/promises")>();

  return {
    ...actual,
    readdir: vi.fn(),
  };
});

import { readdir } from "node:fs/promises";
import { scanDirectory } from "../src/scan/scan-directory.js";

const mockedReaddir = vi.mocked(readdir);

beforeEach(() => {
  mockedReaddir.mockReset();
});

test("rejects when directory traversal fails", async () => {
  mockedReaddir.mockRejectedValue(
    new Error("Simulated filesystem failure"),
  );

  await expect(
    scanDirectory(process.cwd()),
  ).rejects.toThrow("Simulated filesystem failure");
});