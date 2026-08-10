import { stat } from "node:fs/promises";

export async function validateUpdateTarget(
  updatePath: string,
): Promise<void> {
  let stats;

  try {
    stats = await stat(updatePath);
  } catch (error: unknown) {
    if (
      error instanceof Error &&
      "code" in error &&
      error.code === "ENOENT"
    ) {
      throw new Error(
        `update target does not exist: ${updatePath}`,
      );
    }

    throw error;
  }

  if (!stats.isFile()) {
    throw new Error(
      `update target is not a file: ${updatePath}`,
    );
  }
}