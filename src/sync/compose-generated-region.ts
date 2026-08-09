import { GENERATED_NOTICE } from "./markers.js";

export function composeMarkdownRegion(
  renderedTree: string,
): string {
  const tree = trimTrailingNewlines(renderedTree);

  if (tree === "") {
    return GENERATED_NOTICE;
  }

  return [
    GENERATED_NOTICE,
    "",
    tree,
  ].join("\n");
}

export function composeAsciiRegion(
  renderedTree: string,
): string {
  const tree = trimTrailingNewlines(renderedTree);

  if (tree === "") {
    return GENERATED_NOTICE;
  }

  return [
    GENERATED_NOTICE,
    "",
    "```text",
    tree,
    "```",
  ].join("\n");
}

function trimTrailingNewlines(
  value: string,
): string {
  return value.replace(/(?:\r\n|\r|\n)+$/, "");
}