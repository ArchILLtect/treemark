import {
  readFile,
} from "node:fs/promises";
import {
  checkContent,
  type FreshnessStatus,
} from "./check-content.js";
import {
  buildUpdatedDocument,
  type SyncFormat,
} from "../sync/build-updated-document.js";

export async function checkUpdateFile(
  targetPath: string,
  renderedTree: string,
  format: SyncFormat,
): Promise<FreshnessStatus> {
  const currentDocument = await readFile(
    targetPath,
    "utf8",
  );

  const expectedDocument =
    buildUpdatedDocument(
      currentDocument,
      renderedTree,
      format,
    );

  return checkContent(
    currentDocument,
    expectedDocument,
  );
}