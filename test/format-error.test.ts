import { expect, test } from "vitest";

import { formatCliError } from "../src/cli/format-error.js";

test("formats missing-path filesystem errors", () => {
  const error = Object.assign(
    new Error("raw ENOENT message"),
    {
      code: "ENOENT",
    },
  );

  expect(formatCliError(error)).toBe(
    "path does not exist",
  );
});

test("formats permission filesystem errors", () => {
  const error = Object.assign(
    new Error("raw EACCES message"),
    {
      code: "EACCES",
    },
  );

  expect(formatCliError(error)).toBe(
    "permission denied",
  );
});

test("formats directory-target filesystem errors", () => {
  const error = Object.assign(
    new Error("raw EISDIR message"),
    {
      code: "EISDIR",
    },
  );

  expect(formatCliError(error)).toBe(
    "expected a file but received a directory",
  );
});

test("preserves ordinary error messages", () => {
  expect(
    formatCliError(
      new Error("custom TreeMark failure"),
    ),
  ).toBe(
    "custom TreeMark failure",
  );
});

test("stringifies non-Error values", () => {
  expect(formatCliError("unexpected failure")).toBe(
    "unexpected failure",
  );
});