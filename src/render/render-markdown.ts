import type { TreeNode } from "../types.js";

export interface RenderOptions {
  includeRoot?: boolean;
}

export function renderMarkdown(
  tree: TreeNode,
  options: RenderOptions = {},
): string {
  const lines: string[] = [];

  if (options.includeRoot) {
    renderNode(tree, 0, lines);
  } else {
    for (const child of tree.children ?? []) {
      renderNode(child, 0, lines);
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
): void {
  const indent = "  ".repeat(depth);
  const suffix = node.type === "directory" ? "/" : "";

  lines.push(`${indent}- ${node.name}${suffix}`);

  for (const child of node.children ?? []) {
    renderNode(child, depth + 1, lines);
  }
}