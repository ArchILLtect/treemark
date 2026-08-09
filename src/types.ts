
export interface TreeNode {
  name: string;
  relativePath: string;
  type: "file" | "directory";
  children?: TreeNode[];
}

export interface ScanOptions {
  maxDepth?: number;
  ignorePatterns?: string[];
  excludedPaths?: string[];
}