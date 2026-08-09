
import { expect, test } from "vitest";

import { shouldIgnore } from "../src/scan/should-ignore.js";

test("returns true when a path matches an ignore pattern", () => {
  expect(
    shouldIgnore("architecture/overview.md", ["architecture/**"]),
  ).toBe(true);
});

test("returns false when a path does not match any ignore pattern", () => {
  expect(
    shouldIgnore("guides/install.md", ["architecture/**"]),
  ).toBe(false);
});

test("matches against multiple ignore patterns", () => {
  expect(
    shouldIgnore("guides/draft.tmp.md", [
      "architecture/**",
      "**/*.tmp.md",
    ]),
  ).toBe(true);
});