import { expect, test } from "vitest";

import { renderAscii } from "../src/render/render-ascii.js";
import { renderMarkdown } from "../src/render/render-markdown.js";
import type { TreeNode } from "../src/types.js";

const tree: TreeNode = {
  name: "docs",
  relativePath: "",
  type: "directory",
  children: [
    {
      name: "guides",
      relativePath: "guides",
      type: "directory",
      children: [
        {
          name: "setup.md",
          relativePath: "guides/setup.md",
          type: "file",
        },
      ],
    },
  ],
};

test("renders the same tree in Markdown and ASCII", () => {
  const markdown = renderMarkdown(tree);
  const ascii = renderAscii(tree);

  expect(markdown).toContain("guides/");
  expect(markdown).toContain("setup.md");

  expect(ascii).toContain("guides/");
  expect(ascii).toContain("setup.md");
});

test("renderer selection does not alter the input tree", () => {
  const before = structuredClone(tree);

  renderMarkdown(tree);
  renderAscii(tree);

  expect(tree).toEqual(before);
});

test("both renderers represent the same hierarchy", () => {
  expect(renderMarkdown(tree)).toBe(
    "- **guides/**\n" +
      "  - setup.md\n",
  );

  expect(renderAscii(tree)).toBe(
    "guides/\n" +
      "└── setup.md\n",
  );
});