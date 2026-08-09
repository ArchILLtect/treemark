#!/usr/bin/env node

import { runCli } from "./cli/run-cli.js";
import { formatCliError } from "./cli/format-error.js";

try {
  await runCli(process.argv);
} catch (error: unknown) {
  const message = formatCliError(error);
  console.error(`TreeMark: ${message}`);
  process.exitCode = 1;
}