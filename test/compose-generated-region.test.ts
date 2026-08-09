import {
  describe,
  expect,
  test,
} from "vitest";

import {
  GENERATED_NOTICE,
} from "../src/sync/markers.js";

import {
  composeAsciiRegion,
  composeMarkdownRegion,
} from "../src/sync/compose-generated-region.js";

describe("composeMarkdownRegion", () => {
  test("places the generated notice before Markdown content", () => {
    const renderedTree = [
      "- **guides/**",
      "  - setup.md",
      "",
    ].join("\n");

    expect(
      composeMarkdownRegion(renderedTree),
    ).toBe(
      [
        GENERATED_NOTICE,
        "",
        "- **guides/**",
        "  - setup.md",
      ].join("\n"),
    );
  });

  test("returns only the notice for an empty tree", () => {
    expect(
      composeMarkdownRegion(""),
    ).toBe(GENERATED_NOTICE);
  });

  test("removes trailing renderer newlines", () => {
    expect(
      composeMarkdownRegion("tree\n\n"),
    ).toBe(
      [
        GENERATED_NOTICE,
        "",
        "tree",
      ].join("\n"),
    );
  });
});

describe("composeAsciiRegion", () => {
  test("wraps ASCII output in a text fence", () => {
    const renderedTree = [
      "guides/",
      "└── setup.md",
      "",
    ].join("\n");

    expect(
      composeAsciiRegion(renderedTree),
    ).toBe(
      [
        GENERATED_NOTICE,
        "",
        "```text",
        "guides/",
        "└── setup.md",
        "```",
      ].join("\n"),
    );
  });

  test("returns only the notice for an empty tree", () => {
    expect(
      composeAsciiRegion(""),
    ).toBe(GENERATED_NOTICE);
  });

  test("does not alter internal ASCII formatting", () => {
    const renderedTree =
      "src/\n├── cli.ts\n└── index.ts\n";

    const result =
      composeAsciiRegion(renderedTree);

    expect(result).toContain(
      "src/\n├── cli.ts\n└── index.ts",
    );
  });
});