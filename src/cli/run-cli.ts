import { Command, InvalidArgumentError } from "commander";
import {
  dirname,
  isAbsolute,
  relative,
  resolve,
  sep,
} from "node:path";
import { writeFile } from "node:fs/promises";
import { scanDirectory } from "../scan/scan-directory.js";
import { validateOutputTarget } from "./validate-output-target.js";
import { validateUpdateTarget } from "./validate-update-target.js";
import { renderAscii } from "../render/render-ascii.js";
import { renderMarkdown } from "../render/render-markdown.js";
import { normalizeRelativePath } from "../scan/normalize-relative-path.js";
import {
  updateMarkdownFile,
} from "../sync/update-markdown-file.js";

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
  output?: string | boolean;
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
    .option(
      "-o, --output [file]",
      "write a complete generated file",
    )
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
        $ treemark ./docs --output
        $ treemark ./docs --output structure-map.md
        $ treemark ./docs --update README.md
      `,
    );

  return program;
}

function getRootRelativeExclusion(
  resolvedRootPath: string,
  resolvedTargetPath: string | undefined,
): string | undefined {
  if (resolvedTargetPath === undefined) {
    return undefined;
  }

  const relativePath = relative(
    resolvedRootPath,
    resolvedTargetPath,
  );

  const isInsideRoot =
    relativePath !== "" &&
    relativePath !== ".." &&
    !relativePath.startsWith(`..${sep}`) &&
    !isAbsolute(relativePath);

  return isInsideRoot
    ? normalizeRelativePath(relativePath)
    : undefined;
}

export async function runCli(argv: string[]): Promise<void> {
  const program = createProgram();
  program.parse(argv);

  const root = program.args[0];
  const options = program.opts<CliOptions>();

  const outputTarget =
    options.output === true
      ? "structure-map.md"
      : options.output;

  const resolvedOutputPath =
    typeof outputTarget === "string"
      ? resolve(outputTarget)
      : undefined;

  const resolvedUpdatePath =
    options.update !== undefined
      ? resolve(options.update)
      : undefined;

  if (options.format !== "markdown" && options.format !== "ascii") {
    throw new Error(
      `unsupported format "${options.format}"; expected "markdown" or "ascii"`,
    );
  }

  if (options.output !== undefined && options.update !== undefined) {
    throw new Error("--output and --update cannot be used together");
  }

  if (options.check) {
    throw new Error(
      "--check is not implemented yet",
    );
  }

  if (root === undefined) {
    throw new Error("missing root path");
  }

  const resolvedRootPath = resolve(root);

  if (resolvedUpdatePath !== undefined) {
    await validateUpdateTarget(
      resolvedUpdatePath,
    );
  }

  const outputExclusion =
    getRootRelativeExclusion(
      resolvedRootPath,
      resolvedOutputPath,
    );

  const updateExclusion =
    getRootRelativeExclusion(
      resolvedRootPath,
      resolvedUpdatePath,
    );

  const markdownTargetPath =
    resolvedOutputPath ??
    resolvedUpdatePath;

  const markdownLinkBasePath =
    markdownTargetPath !== undefined
      ? normalizeRelativePath(
          relative(
            dirname(markdownTargetPath),
            resolvedRootPath,
          ),
        )
      : undefined;

  const excludedPaths = [
    outputExclusion,
    updateExclusion,
  ].filter(
    (path): path is string =>
      path !== undefined,
  );

  const tree = await scanDirectory(root, {
    ignorePatterns: options.ignore,
    ...(options.maxDepth !== undefined
      ? { maxDepth: options.maxDepth }
      : {}),
    ...(excludedPaths.length > 0
      ? { excludedPaths }
      : {}),
  });

  const output =
    options.format === "ascii"
      ? renderAscii(tree, {
          includeRoot: options.includeRoot,
        })
      : renderMarkdown(tree, {
          includeRoot: options.includeRoot,
          links: options.links,
          ...(markdownLinkBasePath !== undefined
            ? { linkBasePath: markdownLinkBasePath }
            : {}),
        });

  if (resolvedOutputPath !== undefined) {
    await validateOutputTarget(resolvedOutputPath);

    await writeFile(
      resolvedOutputPath,
      output,
      "utf8",
    );

    return;
  }

  if (resolvedUpdatePath !== undefined) {
    await updateMarkdownFile(
      resolvedUpdatePath,
      output,
      options.format,
    );

    return;
  }

  process.stdout.write(output);
}
