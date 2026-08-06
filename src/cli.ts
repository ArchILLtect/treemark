#!/usr/bin/env node

import { runCli } from "./run-cli.js";

try {
  runCli(process.argv);
} catch (error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`TreeMark: ${message}`);
  process.exitCode = 1;
}
