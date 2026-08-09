import {
  describe,
  expect,
  test,
} from "vitest";

import {
  END_MARKER,
  START_MARKER,
} from "../src/sync/markers.js";

import {
  replaceMarkedSection,
} from "../src/sync/replace-marked-section.js";

describe("replaceMarkedSection", () => {
  test("replaces content inside a valid marker pair", () => {
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

    const result = replaceMarkedSection(
      document,
      "new content",
    );

    expect(result).toBe(
      [
        "# Project",
        "",
        START_MARKER,
        "new content",
        END_MARKER,
        "",
        "Footer",
        "",
      ].join("\n"),
    );
  });

  test("populates an empty marked region", () => {
    const document = [
      START_MARKER,
      END_MARKER,
      "",
    ].join("\n");

    const result = replaceMarkedSection(
      document,
      "generated content",
    );

    expect(result).toBe(
      [
        START_MARKER,
        "generated content",
        END_MARKER,
        "",
      ].join("\n"),
    );
  });

  test("preserves content outside the marked region", () => {
    const before = [
      "# Important heading",
      "",
      "Do not change this.",
      "",
    ].join("\n");

    const after = [
      "",
      "Do not change this either.",
      "",
    ].join("\n");

    const document =
      `${before}${START_MARKER}\n` +
      `old\n${END_MARKER}${after}`;

    const result = replaceMarkedSection(
      document,
      "new",
    );

    expect(result.startsWith(before)).toBe(true);
    expect(result.endsWith(after)).toBe(true);
  });

  test("preserves the marker strings", () => {
    const document = [
      START_MARKER,
      "old",
      END_MARKER,
    ].join("\n");

    const result = replaceMarkedSection(
      document,
      "new",
    );

    expect(result).toContain(START_MARKER);
    expect(result).toContain(END_MARKER);
  });

  test("fails when the start marker is missing", () => {
    expect(() =>
      replaceMarkedSection(
        `${END_MARKER}\n`,
        "new",
      ),
    ).toThrow("missing start marker");
  });

  test("fails when the end marker is missing", () => {
    expect(() =>
      replaceMarkedSection(
        `${START_MARKER}\n`,
        "new",
      ),
    ).toThrow("missing end marker");
  });

  test("fails when multiple start markers exist", () => {
    const document = [
      START_MARKER,
      START_MARKER,
      END_MARKER,
    ].join("\n");

    expect(() =>
      replaceMarkedSection(document, "new"),
    ).toThrow("multiple start markers");
  });

  test("fails when multiple end markers exist", () => {
    const document = [
      START_MARKER,
      END_MARKER,
      END_MARKER,
    ].join("\n");

    expect(() =>
      replaceMarkedSection(document, "new"),
    ).toThrow("multiple end markers");
  });

  test("fails when the markers are reversed", () => {
    const document = [
      END_MARKER,
      START_MARKER,
    ].join("\n");

    expect(() =>
      replaceMarkedSection(document, "new"),
    ).toThrow("markers are reversed");
  });

  test("preserves CRLF newline style", () => {
    const document = [
      START_MARKER,
      "old",
      END_MARKER,
      "",
    ].join("\r\n");

    const result = replaceMarkedSection(
      document,
      "line one\nline two\n",
    );

    expect(result).toBe(
      [
        START_MARKER,
        "line one",
        "line two",
        END_MARKER,
        "",
      ].join("\r\n"),
    );
  });

  test("produces identical output when replacement is unchanged", () => {
    const document = [
      START_MARKER,
      "generated content",
      END_MARKER,
      "",
    ].join("\n");

    expect(
      replaceMarkedSection(
        document,
        "generated content\n",
      ),
    ).toBe(document);
  });

  test("allows surrounding whitespace on marker lines", () => {
    const document = [
      `   ${START_MARKER}   `,
      "old",
      `\t${END_MARKER}\t`,
      "",
    ].join("\n");

    expect(
      replaceMarkedSection(document, "new"),
    ).toBe(
      [
        `   ${START_MARKER}   `,
        "new",
        `\t${END_MARKER}\t`,
        "",
      ].join("\n"),
    );
  });

  test("fails when the start marker shares a line with other content", () => {
    const document = [
      `before ${START_MARKER}`,
      "old",
      END_MARKER,
    ].join("\n");

    expect(() =>
      replaceMarkedSection(document, "new"),
    ).toThrow(
      "start marker must be on its own line",
    );
  });

  test("fails when the end marker shares a line with other content", () => {
    const document = [
      START_MARKER,
      "old",
      `${END_MARKER} after`,
    ].join("\n");

    expect(() =>
      replaceMarkedSection(document, "new"),
    ).toThrow(
      "end marker must be on its own line",
    );
  });
});