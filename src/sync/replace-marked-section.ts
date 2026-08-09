import {
  END_MARKER,
  START_MARKER,
} from "./markers.js";

export function replaceMarkedSection(
  document: string,
  replacement: string,
): string {
  const newline = detectNewline(document);

  const startMarker = findMarkerLine(
    document,
    START_MARKER,
    "start",
  );

  const endMarker = findMarkerLine(
    document,
    END_MARKER,
    "end",
  );

  if (startMarker.lineStart > endMarker.lineStart) {
    throw new Error("markers are reversed");
  }

  const before = document.slice(
    0,
    startMarker.lineEnd,
  );

  const after = document.slice(
    endMarker.lineStart,
  );

  const normalizedReplacement =
    normalizeNewlines(replacement, newline).replace(
      new RegExp(`${escapeRegExp(newline)}+$`),
      "",
    );

  const managedContent =
    normalizedReplacement.length > 0
      ? `${newline}${normalizedReplacement}${newline}`
      : newline;

  return `${before}${managedContent}${after}`;
}

interface MarkerLine {
  lineStart: number;
  lineEnd: number;
}

function findMarkerLine(
  document: string,
  marker: string,
  label: "start" | "end",
): MarkerLine {
  const occurrences = findOccurrences(document, marker);

  if (occurrences.length === 0) {
    throw new Error(`missing ${label} marker`);
  }

  if (occurrences.length > 1) {
    throw new Error(`multiple ${label} markers`);
  }

  const markerIndex = occurrences[0];

  if (markerIndex === undefined) {
    throw new Error(`missing ${label} marker`);
  }

  const lineStart =
    document.lastIndexOf("\n", markerIndex - 1) + 1;

  const nextNewline = document.indexOf(
    "\n",
    markerIndex,
  );

  const lineEnd =
    nextNewline === -1
      ? document.length
      : document[nextNewline - 1] === "\r"
        ? nextNewline - 1
        : nextNewline;

  const line = document.slice(
    lineStart,
    lineEnd,
  );

  if (line.trim() !== marker) {
    throw new Error(
      `${label} marker must be on its own line`,
    );
  }

  return {
    lineStart,
    lineEnd,
  };
}

function findOccurrences(
  value: string,
  search: string,
): number[] {
  const indexes: number[] = [];

  let index = value.indexOf(search);

  while (index !== -1) {
    indexes.push(index);

    index = value.indexOf(
      search,
      index + search.length,
    );
  }

  return indexes;
}

function detectNewline(
  document: string,
): "\r\n" | "\n" {
  return document.includes("\r\n")
    ? "\r\n"
    : "\n";
}

function normalizeNewlines(
  value: string,
  newline: "\r\n" | "\n",
): string {
  return value
    .replaceAll("\r\n", "\n")
    .replaceAll("\r", "\n")
    .replaceAll("\n", newline);
}

function escapeRegExp(value: string): string {
  return value.replace(
    /[.*+?^${}()|[\]\\]/g,
    "\\$&",
  );
}