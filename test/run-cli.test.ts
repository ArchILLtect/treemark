import {
  afterEach,
  beforeEach,
  describe,
  expect,
  test,
  vi,
} from "vitest";

import type { TreeNode } from "../src/types.js";

const {
  scanDirectoryMock,
  renderMarkdownMock,
  renderAsciiMock,
} = vi.hoisted(() => ({
  scanDirectoryMock: vi.fn(),
  renderMarkdownMock: vi.fn(),
  renderAsciiMock: vi.fn(),
}));

vi.mock("../src/scan/scan-directory.js", () => ({
  scanDirectory: scanDirectoryMock,
}));

vi.mock("../src/render/render-markdown.js", () => ({
  renderMarkdown: renderMarkdownMock,
}));

vi.mock("../src/render/render-ascii.js", () => ({
  renderAscii: renderAsciiMock,
}));

import {
  createProgram,
  runCli,
} from "../src/cli/run-cli.js";

const tree: TreeNode = {
  name: "docs",
  relativePath: "",
  type: "directory",
  children: [
    {
      name: "guide.md",
      relativePath: "guide.md",
      type: "file",
    },
  ],
};

describe("TreeMark CLI", () => {
  beforeEach(() => {
    scanDirectoryMock.mockReset();
    renderMarkdownMock.mockReset();
    renderAsciiMock.mockReset();

    scanDirectoryMock.mockResolvedValue(tree);
    renderMarkdownMock.mockReturnValue("- guide.md\n");
    renderAsciiMock.mockReturnValue("guide.md\n");
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

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
    const optionNames = createProgram().options.map(
      (option) => option.long,
    );

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

  test("scans the root and renders Markdown by default", async () => {
    const stdoutWriteSpy = vi
      .spyOn(process.stdout, "write")
      .mockImplementation(() => true);

    await runCli([
      "node",
      "treemark",
      "./docs",
    ]);

    expect(scanDirectoryMock).toHaveBeenCalledWith(
      "./docs",
      {
        ignorePatterns: [],
      },
    );

    expect(renderMarkdownMock).toHaveBeenCalledWith(
      tree,
      {
        includeRoot: false,
      },
    );

    expect(renderAsciiMock).not.toHaveBeenCalled();
    expect(stdoutWriteSpy).toHaveBeenCalledTimes(1);
    expect(stdoutWriteSpy).toHaveBeenCalledWith(
      "- guide.md\n",
    );
  });

  test("selects the ASCII renderer when requested", async () => {
    const stdoutWriteSpy = vi
      .spyOn(process.stdout, "write")
      .mockImplementation(() => true);

    await runCli([
      "node",
      "treemark",
      "./docs",
      "--format",
      "ascii",
    ]);

    expect(renderAsciiMock).toHaveBeenCalledWith(
      tree,
      {
        includeRoot: false,
      },
    );

    expect(renderMarkdownMock).not.toHaveBeenCalled();
    expect(stdoutWriteSpy).toHaveBeenCalledWith(
      "guide.md\n",
    );
  });

  test("passes scanner options to scanDirectory", async () => {
    vi.spyOn(process.stdout, "write").mockImplementation(
      () => true,
    );

    await runCli([
      "node",
      "treemark",
      "./docs",
      "--ignore",
      "drafts/**",
      "--ignore",
      "**/*.tmp.md",
      "--max-depth",
      "2",
    ]);

    expect(scanDirectoryMock).toHaveBeenCalledWith(
      "./docs",
      {
        ignorePatterns: [
          "drafts/**",
          "**/*.tmp.md",
        ],
        maxDepth: 2,
      },
    );
  });

  test("passes root inclusion to the renderer", async () => {
    vi.spyOn(process.stdout, "write").mockImplementation(
      () => true,
    );

    await runCli([
      "node",
      "treemark",
      "./docs",
      "--include-root",
    ]);

    expect(renderMarkdownMock).toHaveBeenCalledWith(
      tree,
      {
        includeRoot: true,
      },
    );
  });

  test("rejects unsupported output formats", async () => {
    vi.spyOn(process.stdout, "write").mockImplementation(
      () => true,
    );

    await expect(
      runCli([
        "node",
        "treemark",
        "./docs",
        "--format",
        "mermaid",
      ]),
    ).rejects.toThrow(
      'unsupported format "mermaid"; expected "markdown" or "ascii"',
    );

    expect(scanDirectoryMock).not.toHaveBeenCalled();
    expect(renderMarkdownMock).not.toHaveBeenCalled();
    expect(renderAsciiMock).not.toHaveBeenCalled();
  });
});