import { expect, test } from "vitest";

import { renderAscii } from "../src/render/render-ascii.js";
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
      name: "guides",
      relativePath: "guides",
      type: "directory",
      children: [
        {
          name: "install.md",
          relativePath: "guides/install.md",
          type: "file",
        },
        {
          name: "usage.md",
          relativePath: "guides/usage.md",
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
  expect(renderAscii(tree)).toBe(
    "architecture/\n" +
      "└── overview.md\n" +
      "guides/\n" +
      "├── install.md\n" +
      "└── usage.md\n" +
      "getting-started.md\n",
  );
});

test("includes the root node when requested", () => {
  expect(
    renderAscii(tree, {
      includeRoot: true,
    }),
  ).toBe(
    "docs/\n" +
      "├── architecture/\n" +
      "│   └── overview.md\n" +
      "├── guides/\n" +
      "│   ├── install.md\n" +
      "│   └── usage.md\n" +
      "└── getting-started.md\n",
  );
});

test("renders an empty root as an empty string", () => {
  const emptyTree: TreeNode = {
    name: "empty",
    relativePath: "",
    type: "directory",
    children: [],
  };

  expect(renderAscii(emptyTree)).toBe("");
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

  expect(renderAscii(treeWithEmptyDirectory)).toBe(
    "drafts/\n",
  );
});

test("preserves deep ancestor branch guides", () => {
  const deepTree: TreeNode = {
    name: "root",
    relativePath: "",
    type: "directory",
    children: [
      {
        name: "src",
        relativePath: "src",
        type: "directory",
        children: [
          {
            name: "scan",
            relativePath: "src/scan",
            type: "directory",
            children: [
              {
                name: "scan-directory.ts",
                relativePath: "src/scan/scan-directory.ts",
                type: "file",
              },
              {
                name: "sort-entries.ts",
                relativePath: "src/scan/sort-entries.ts",
                type: "file",
              },
            ],
          },
          {
            name: "render",
            relativePath: "src/render",
            type: "directory",
            children: [
              {
                name: "render-ascii.ts",
                relativePath: "src/render/render-ascii.ts",
                type: "file",
              },
            ],
          },
        ],
      },
    ],
  };

  expect(
    renderAscii(deepTree, {
      includeRoot: true,
    }),
  ).toBe(
    "root/\n" +
      "└── src/\n" +
      "    ├── scan/\n" +
      "    │   ├── scan-directory.ts\n" +
      "    │   └── sort-entries.ts\n" +
      "    └── render/\n" +
      "        └── render-ascii.ts\n",
  );
});

test("preserves existing child order", () => {
  const orderedTree: TreeNode = {
    name: "root",
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

  expect(renderAscii(orderedTree)).toBe(
    "zeta.md\n" +
      "alpha.md\n",
  );
});

test("produces deterministic output across repeated renders", () => {
  const first = renderAscii(tree);
  const second = renderAscii(tree);

  expect(second).toBe(first);
});

test("does not mutate the input tree", () => {
  const before = structuredClone(tree);

  renderAscii(tree, {
    includeRoot: true,
  });

  expect(tree).toEqual(before);
});