#!/usr/bin/env node

import { runCli } from "./cli/run-cli.js";
import { formatCliError } from "./cli/format-error.js";

try {
  const exitCode = await runCli(
    process.argv,
  );

  process.exitCode = exitCode;
} catch (error: unknown) {
  const message = formatCliError(error);
  console.error(`TreeMark: ${message}`);
  process.exitCode = 1;
}