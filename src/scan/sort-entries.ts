import type { Dirent } from "node:fs";

export function sortEntries(entries: Dirent[]): Dirent[] {
  return [...entries].sort((a, b) => {
    if (a.isDirectory() && !b.isDirectory()) {
      return -1;
    }

    if (!a.isDirectory() && b.isDirectory()) {
      return 1;
    }

    const naturalComparison = a.name.localeCompare(b.name, "en", {
      numeric: true,
      sensitivity: "base",
    });

    if (naturalComparison !== 0) {
      return naturalComparison;
    }

    return a.name < b.name ? -1 : a.name > b.name ? 1 : 0;
  });
}