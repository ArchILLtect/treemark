import type { TreeNode } from "../types.js";

export interface AsciiRenderOptions {
  includeRoot?: boolean;
}

export function renderAscii(
  tree: TreeNode,
  options: AsciiRenderOptions = {},
): string {
  const lines: string[] = [];

  if (options.includeRoot) {
    lines.push(formatNodeName(tree));

    renderChildren(tree.children ?? [], "", lines);
  } else {
    renderTopLevel(tree.children ?? [], lines);
  }

  return lines.length > 0
    ? `${lines.join("\n")}\n`
    : "";
}

function renderTopLevel(
  children: TreeNode[],
  lines: string[],
): void {
  for (const child of children) {
    lines.push(formatNodeName(child));

    renderChildren(child.children ?? [], "", lines);
  }
}

function renderChildren(
  children: TreeNode[],
  prefix: string,
  lines: string[],
): void {
  children.forEach((child, index) => {
    const isLast = index === children.length - 1;
    const connector = isLast ? "└── " : "├── ";

    lines.push(
      `${prefix}${connector}${formatNodeName(child)}`,
    );

    const childPrefix =
      prefix + (isLast ? "    " : "│   ");

    renderChildren(
      child.children ?? [],
      childPrefix,
      lines,
    );
  });
}

function formatNodeName(node: TreeNode): string {
  return node.type === "directory"
    ? `${node.name}/`
    : node.name;
}