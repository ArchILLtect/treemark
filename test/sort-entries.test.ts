import type { Dirent } from "node:fs";

import { expect, test } from "vitest";

import { sortEntries } from "../src/scan/sort-entries.js";

function makeFileDirent(name: string): Dirent {
  return {
    name,
    isDirectory: () => false,
    isFile: () => true,
  } as Dirent;
}

test("uses a deterministic tie-breaker for case-equivalent names", () => {
  const entries = [
    makeFileDirent("api.md"),
    makeFileDirent("API.md"),
  ];

  const sorted = sortEntries(entries);

  expect(sorted.map((entry) => entry.name)).toEqual([
    "API.md",
    "api.md",
  ]);
});