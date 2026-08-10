import {
  describe,
  expect,
  test,
} from "vitest";

import {
  END_MARKER,
  GENERATED_NOTICE,
  START_MARKER,
} from "../src/sync/markers.js";

import {
  buildUpdatedDocument,
} from "../src/sync/build-updated-document.js";

describe("buildUpdatedDocument", () => {
  test("builds a synchronized Markdown document", () => {
    const document = [
      "# Project",
      "",
      START_MARKER,
      "old content",
      END_MARKER,
      "",
      "Footer",
      "",
    ].join("\n");

    const renderedTree = [
      "- **guides/**",
      "  - setup.md",
      "",
    ].join("\n");

    expect(
      buildUpdatedDocument(
        document,
        renderedTree,
        "markdown",
      ),
    ).toBe(
      [
        "# Project",
        "",
        START_MARKER,
        GENERATED_NOTICE,
        "",
        "- **guides/**",
        "  - setup.md",
        END_MARKER,
        "",
        "Footer",
        "",
      ].join("\n"),
    );
  });

  test("builds a synchronized ASCII document", () => {
    const document = [
      START_MARKER,
      "old content",
      END_MARKER,
      "",
    ].join("\n");

    const renderedTree = [
      "guides/",
      "└── setup.md",
      "",
    ].join("\n");

    expect(
      buildUpdatedDocument(
        document,
        renderedTree,
        "ascii",
      ),
    ).toBe(
      [
        START_MARKER,
        GENERATED_NOTICE,
        "",
        "```text",
        "guides/",
        "└── setup.md",
        "```",
        END_MARKER,
        "",
      ].join("\n"),
    );
  });

  test("preserves content outside the synchronized region", () => {
    const document = [
      "Before",
      "",
      START_MARKER,
      "old",
      END_MARKER,
      "",
      "After",
      "",
    ].join("\n");

    const result = buildUpdatedDocument(
      document,
      "- file.md\n",
      "markdown",
    );

    expect(result.startsWith("Before\n\n")).toBe(
      true,
    );

    expect(result.endsWith("\nAfter\n")).toBe(
      true,
    );
  });

  test("is deterministic for unchanged generated content", () => {
    const document = [
      START_MARKER,
      GENERATED_NOTICE,
      "",
      "- file.md",
      END_MARKER,
      "",
    ].join("\n");

    expect(
      buildUpdatedDocument(
        document,
        "- file.md\n",
        "markdown",
      ),
    ).toBe(document);
  });
});