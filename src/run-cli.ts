import { Command, InvalidArgumentError } from "commander";

const DEVELOPMENT_VERSION = "0.0.0-development";

function parseMaxDepth(value: string): number {
  const parsed = Number(value);

  if (!Number.isInteger(parsed) || parsed < 0) {
    throw new InvalidArgumentError("must be a non-negative integer");
  }

  return parsed;
}

function collect(value: string, previous: string[]): string[] {
  return [...previous, value];
}

export interface CliOptions {
  format: string;
  output?: string;
  update?: string;
  ignore: string[];
  maxDepth?: number;
  check: boolean;
  includeRoot: boolean;
  links: boolean;
}

export function createProgram(): Command {
  const program = new Command();

  program
    .name("treemark")
    .description(
      "Generate and synchronize Markdown-friendly directory trees.",
    )
    .version(DEVELOPMENT_VERSION, "-v, --version")
    .argument("<root>", "directory to scan")
    .option(
      "-f, --format <format>",
      "output format: markdown or ascii",
      "markdown",
    )
    .option("-o, --output <file>", "write a complete generated document")
    .option(
      "-u, --update <file>",
      "update a TreeMark-marked section in an existing Markdown file",
    )
    .option(
      "-i, --ignore <pattern>",
      "ignore a root-relative glob; repeatable",
      collect,
      [],
    )
    .option(
      "-d, --max-depth <number>",
      "maximum descendant depth",
      parseMaxDepth,
    )
    .option("-c, --check", "compare only; never write", false)
    .option("--include-root", "include the scanned root node", false)
    .option("--no-links", "disable links in Markdown output")
    .addHelpText(
      "after",
      `
Examples:
  $ treemark ./docs
  $ treemark ./docs --format ascii
  $ treemark ./docs --output docs/docs-map.md
  $ treemark ./docs --update README.md
  $ treemark ./docs --update README.md --check
`,
    );

  return program;
}

export function runCli(argv: string[]): void {
  const program = createProgram();
  program.parse(argv);

  const root = program.args[0];
  const options = program.opts<CliOptions>();

  if (options.format !== "markdown" && options.format !== "ascii") {
    throw new Error(
      `unsupported format "${options.format}"; expected "markdown" or "ascii"`,
    );
  }

  if (options.output !== undefined && options.update !== undefined) {
    throw new Error("--output and --update cannot be used together");
  }

  if (
    options.check &&
    options.output === undefined &&
    options.update === undefined
  ) {
    throw new Error("--check requires --output or --update");
  }

  // Phase 2 proves packaging and argument parsing only.
  // Phase 3 will replace this message with the scanner pipeline.
  console.log(
    JSON.stringify(
      {
        root,
        options,
      },
      null,
      2,
    ),
  );
}
