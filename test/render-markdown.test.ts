import { expect, test } from "vitest";

import { renderMarkdown } from "../src/render/render-markdown.js";
import type { TreeNode } from "../src/types.js";

const tree: TreeNode = {
  name: "docs",
  relativePath: "",
  type: "directory",
  children: [
    {
      name: "architecture",
      relativePath: "architecture",
      type: "directory",
      children: [
        {
          name: "overview.md",
          relativePath: "architecture/overview.md",
          type: "file",
        },
      ],
    },
    {
      name: "getting-started.md",
      relativePath: "getting-started.md",
      type: "file",
    },
  ],
};

test("omits the root node by default", () => {
  expect(renderMarkdown(tree)).toBe(
    "- **architecture/**\n" +
      "  - overview.md\n" +
      "- getting-started.md\n",
  );
});

test("includes the root node when requested", () => {
  expect(
    renderMarkdown(tree, {
      includeRoot: true,
    }),
  ).toBe(
    "- **docs/**\n" +
      "  - **architecture/**\n" +
      "    - overview.md\n" +
      "  - getting-started.md\n",
  );
});

test("renders an empty root as an empty string", () => {
  const emptyTree: TreeNode = {
    name: "empty",
    relativePath: "",
    type: "directory",
    children: [],
  };

  expect(renderMarkdown(emptyTree)).toBe("");
});

test("renders empty nested directories", () => {
  const treeWithEmptyDirectory: TreeNode = {
    name: "docs",
    relativePath: "",
    type: "directory",
    children: [
      {
        name: "drafts",
        relativePath: "drafts",
        type: "directory",
        children: [],
      },
    ],
  };

  expect(renderMarkdown(treeWithEmptyDirectory)).toBe(
    "- **drafts/**\n",
  );
});

test("ends non-empty output with exactly one newline", () => {
  const output = renderMarkdown(tree);

  expect(output.endsWith("\n")).toBe(true);
  expect(output.endsWith("\n\n")).toBe(false);
});

test("preserves existing child order", () => {
  const orderedTree: TreeNode = {
    name: "docs",
    relativePath: "",
    type: "directory",
    children: [
      {
        name: "zeta.md",
        relativePath: "zeta.md",
        type: "file",
      },
      {
        name: "alpha.md",
        relativePath: "alpha.md",
        type: "file",
      },
    ],
  };

  expect(renderMarkdown(orderedTree)).toBe(
    "- zeta.md\n" +
      "- alpha.md\n",
  );
});

test("produces deterministic output across repeated renders", () => {
  const first = renderMarkdown(tree);
  const second = renderMarkdown(tree);

  expect(second).toBe(first);
});

test("does not mutate the input tree", () => {
  const before = structuredClone(tree);

  renderMarkdown(tree, {
    includeRoot: true,
  });

  expect(tree).toEqual(before);
});

test("renders file links when enabled with a link base path", () => {
  expect(
    renderMarkdown(tree, {
      links: true,
      linkBasePath: "../docs",
    }),
  ).toBe(
    "- **architecture/**\n" +
      "  - [overview.md](../docs/architecture/overview.md)\n" +
      "- [getting-started.md](../docs/getting-started.md)\n",
  );
});

test("renders plain file labels when links are disabled", () => {
  expect(
    renderMarkdown(tree, {
      links: false,
      linkBasePath: "../docs",
    }),
  ).toBe(
    "- **architecture/**\n" +
      "  - overview.md\n" +
      "- getting-started.md\n",
  );
});

test("renders plain file labels when no link base path is provided", () => {
  expect(
    renderMarkdown(tree, {
      links: true,
    }),
  ).toBe(
    "- **architecture/**\n" +
      "  - overview.md\n" +
      "- getting-started.md\n",
  );
});