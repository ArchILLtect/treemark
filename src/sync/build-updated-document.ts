import {
  composeAsciiRegion,
  composeMarkdownRegion,
} from "./compose-generated-region.js";

import {
  replaceMarkedSection,
} from "./replace-marked-section.js";

export type SyncFormat =
  | "markdown"
  | "ascii";

export function buildUpdatedDocument(
  document: string,
  renderedTree: string,
  format: SyncFormat,
): string {
  const generatedRegion =
    format === "ascii"
      ? composeAsciiRegion(renderedTree)
      : composeMarkdownRegion(renderedTree);

  return replaceMarkedSection(
    document,
    generatedRegion,
  );
}