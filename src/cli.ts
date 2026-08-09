#!/usr/bin/env node

import { runCli } from "./cli/run-cli.js";

try {
  await runCli(process.argv);
} catch (error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`TreeMark: ${message}`);
  process.exitCode = 1;
}
