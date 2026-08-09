
export function formatCliError(error: unknown): string {
  if (isErrnoException(error)) {
    if (error.code === "ENOENT") {
      return "path does not exist";
    }

    if (error.code === "EACCES" || error.code === "EPERM") {
      return "permission denied";
    }

    if (error.code === "EISDIR") {
      return "expected a file but received a directory";
    }
  }

  return error instanceof Error
    ? error.message
    : String(error);
}

function isErrnoException(
  error: unknown,
): error is NodeJS.ErrnoException {
  return (
    error instanceof Error &&
    "code" in error &&
    typeof error.code === "string"
  );
}