import { stat } from "node:fs/promises";
import { dirname } from "node:path";

export async function validateOutputTarget(
  outputPath: string,
): Promise<void> {
  const outputDirectory = dirname(outputPath);

  try {
    const directoryStats = await stat(outputDirectory);

    if (!directoryStats.isDirectory()) {
      throw new Error(
        `output directory is not a directory: ${outputDirectory}`,
      );
    }
  } catch (error: unknown) {
    if (
      error instanceof Error &&
      "code" in error &&
      error.code === "ENOENT"
    ) {
      throw new Error(
        `output directory does not exist: ${outputDirectory}`,
      );
    }

    throw error;
  }

  try {
    const outputStats = await stat(outputPath);

    if (outputStats.isDirectory()) {
      throw new Error(
        `output target is a directory: ${outputPath}`,
      );
    }
  } catch (error: unknown) {
    if (
      error instanceof Error &&
      "code" in error &&
      error.code === "ENOENT"
    ) {
      return;
    }

    throw error;
  }
}