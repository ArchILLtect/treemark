import { describe, expect, test } from "vitest";

import { createProgram } from "../src/run-cli.js";

describe("TreeMark CLI", () => {
  test("defines the expected command name", () => {
    expect(createProgram().name()).toBe("treemark");
  });

  test("defines the root positional argument", () => {
    const program = createProgram();

    expect(program.registeredArguments).toHaveLength(1);
    expect(program.registeredArguments[0]?.name()).toBe("root");
    expect(program.registeredArguments[0]?.required).toBe(true);
  });

  test("defines the MVP options", () => {
    const optionNames = createProgram().options.map((option) => option.long);

    expect(optionNames).toEqual(
      expect.arrayContaining([
        "--version",
        "--format",
        "--output",
        "--update",
        "--ignore",
        "--max-depth",
        "--check",
        "--include-root",
        "--no-links",
      ]),
    );
  });
});
