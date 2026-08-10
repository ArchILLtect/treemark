import {
  readFile,
  rename,
  rm,
  writeFile,
} from "node:fs/promises";
import { randomUUID } from "node:crypto";
import { basename, dirname, join } from "node:path";

import type { SyncFormat } from "./build-updated-document.js";
import {
  buildUpdatedDocument,
} from "./build-updated-document.js";

export interface UpdateMarkdownFileResult {
  changed: boolean;
}

interface UpdateFileSystem {
  readFile: typeof readFile;
  writeFile: typeof writeFile;
  rename: typeof rename;
  rm: typeof rm;
}

const defaultFileSystem: UpdateFileSystem = {
  readFile,
  writeFile,
  rename,
  rm,
};

export async function updateMarkdownFile(
  targetPath: string,
  renderedTree: string,
  format: SyncFormat,
  fileSystem: UpdateFileSystem = defaultFileSystem,
): Promise<UpdateMarkdownFileResult> {
  const currentDocument = await fileSystem.readFile(
    targetPath,
    "utf8",
  );

  const updatedDocument = buildUpdatedDocument(
    currentDocument,
    renderedTree,
    format,
  );

  if (updatedDocument === currentDocument) {
    return {
      changed: false,
    };
  }

  const temporaryPath = createTemporaryPath(
    targetPath,
  );

  try {
    await fileSystem.writeFile(
      temporaryPath,
      updatedDocument,
      {
        encoding: "utf8",
        flag: "wx",
      },
    );

    await fileSystem.rename(
      temporaryPath,
      targetPath,
    );
  } finally {
    await fileSystem.rm(temporaryPath, {
      force: true,
    });
  }

  return {
    changed: true,
  };
}

function createTemporaryPath(
  targetPath: string,
): string {
  const directory = dirname(targetPath);
  const filename = basename(targetPath);

  return join(
    directory,
    `.${filename}.treemark-${String(process.pid)}-${randomUUID()}.tmp`,
  );
}