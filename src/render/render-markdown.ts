import type { TreeNode } from "../types.js";

export interface RenderOptions {
  includeRoot?: boolean;
  links?: boolean;
  linkBasePath?: string;
}

export function renderMarkdown(
  tree: TreeNode,
  options: RenderOptions = {},
): string {
  const lines: string[] = [];

  if (options.includeRoot) {
    renderNode(tree, 0, lines, options);
  } else {
    for (const child of tree.children ?? []) {
      renderNode(child, 0, lines, options);
    }
  }

  return lines.length > 0
    ? `${lines.join("\n")}\n`
    : "";
}

function renderNode(
  node: TreeNode,
  depth: number,
  lines: string[],
  options: RenderOptions,
): void {
  const indent = "  ".repeat(depth);

  let label: string;

  if (node.type === "directory") {
    label = `**${node.name}/**`;
  } else if (
    options.links &&
    options.linkBasePath !== undefined
  ) {
    const linkPath = [
      options.linkBasePath,
      node.relativePath,
    ]
      .filter((part) => part !== "")
      .join("/");

    label = `[${node.name}](${linkPath})`;
  } else {
    label = node.name;
  }

  lines.push(`${indent}- ${label}`);

  for (const child of node.children ?? []) {
    renderNode(child, depth + 1, lines, options);
  }
}