import {
  readFile,
} from "node:fs/promises";
import {
  checkContent,
  type FreshnessStatus,
} from "./check-content.js";

export async function checkOutputFile(
  targetPath: string,
  expectedContent: string,
): Promise<FreshnessStatus> {
  const currentContent = await readFile(
    targetPath,
    "utf8",
  );

  return checkContent(
    currentContent,
    expectedContent,
  );
}