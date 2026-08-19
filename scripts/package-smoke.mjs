import {
  mkdir,
  mkdtemp,
  readFile,
  readdir,
  rm,
  writeFile,
} from "node:fs/promises";
import { tmpdir } from "node:os";
import {
  join,
  resolve,
} from "node:path";
import { spawn } from "node:child_process";

const projectRoot = resolve(".");

const npmCliPath =
  process.env.npm_execpath;

if (npmCliPath === undefined) {
  throw new Error(
    "npm_execpath is unavailable; run this script with npm run smoke:package",
  );
}

const temporaryRoot = await mkdtemp(
  join(
    tmpdir(),
    "treemark-package-smoke-",
  ),
);

const packDirectory = join(
  temporaryRoot,
  "pack",
);

const consumerDirectory = join(
  temporaryRoot,
  "consumer",
);

const sampleDirectory = join(
  consumerDirectory,
  "sample",
);

const packageJson = JSON.parse(
  await readFile(
    join(projectRoot, "package.json"),
    "utf8",
  ),
);

try {
  console.log(
    "TreeMark package smoke test",
  );

  await mkdir(
    packDirectory,
    { recursive: true },
  );

  await mkdir(
    consumerDirectory,
    { recursive: true },
  );

  console.log(
    "1. Packing TreeMark...",
  );

  await runCommand(
    process.execPath,
    [
      npmCliPath,
      "pack",
      "--pack-destination",
      packDirectory,
    ],
    projectRoot,
    0,
  );

  const packedFiles = await readdir(
    packDirectory,
  );

  const tarballs = packedFiles.filter(
    (file) => file.endsWith(".tgz"),
  );

  if (tarballs.length !== 1) {
    throw new Error(
      `expected exactly one packed tarball; found ${String(
        tarballs.length,
      )}`,
    );
  }

  const tarballPath = join(
    packDirectory,
    tarballs[0],
  );

  console.log(
    "2. Creating isolated consumer project...",
  );

  await runCommand(
    process.execPath,
    [
      npmCliPath,
      "init",
      "-y",
    ],
    consumerDirectory,
    0,
  );

  console.log(
    "3. Installing packed artifact...",
  );

  await runCommand(
    process.execPath,
    [
      npmCliPath,
      "install",
      tarballPath,
      "--no-audit",
      "--no-fund",
    ],
    consumerDirectory,
    0,
  );

  const treemarkCliPath = join(
    consumerDirectory,
    "node_modules",
    packageJson.name,
    "dist",
    "cli.js",
  );

  console.log(
    "4. Verifying --version...",
  );

  const versionResult =
    await runCommand(
      process.execPath,
      [
        treemarkCliPath,
        "--version",
      ],
      consumerDirectory,
      0,
    );

  assertEqual(
    versionResult.stdout.trim(),
    packageJson.version,
    "--version output",
  );

  console.log(
    "5. Verifying --help...",
  );

  const helpResult =
    await runCommand(
      process.execPath,
      [
        treemarkCliPath,
        "--help",
      ],
      consumerDirectory,
      0,
    );

  assertIncludes(
    helpResult.stdout,
    "Generate and synchronize Markdown-friendly directory trees.",
    "--help output",
  );

  await createSampleTree();

  console.log(
    "6. Verifying Markdown stdout...",
  );

  const markdownResult =
    await runCommand(
      process.execPath,
      [
        treemarkCliPath,
        sampleDirectory,
        "--no-links",
      ],
      consumerDirectory,
      0,
    );

  assertEqual(
    markdownResult.stdout,
    [
      "- **docs/**",
      "  - guide.md",
      "- **src/**",
      "  - index.ts",
      "- README.md",
      "",
    ].join("\n"),
    "Markdown stdout",
  );

  console.log(
    "7. Verifying ASCII stdout...",
  );

  const asciiResult =
    await runCommand(
      process.execPath,
      [
        treemarkCliPath,
        sampleDirectory,
        "--format",
        "ascii",
      ],
      consumerDirectory,
      0,
    );

  assertEqual(
    asciiResult.stdout,
    [
      "docs/",
      "└── guide.md",
      "src/",
      "└── index.ts",
      "README.md",
      "",
    ].join("\n"),
    "ASCII stdout",
  );

  console.log(
    "8. Verifying --output...",
  );

  const outputPath = join(
    sampleDirectory,
    "structure-map.md",
  );

  const outputResult =
    await runCommand(
      process.execPath,
      [
        treemarkCliPath,
        sampleDirectory,
        "--output",
        outputPath,
        "--no-links",
      ],
      consumerDirectory,
      0,
    );

  assertEqual(
    outputResult.stdout,
    "",
    "--output stdout",
  );

  const outputContents =
    await readFile(
      outputPath,
      "utf8",
    );

  assertIncludes(
    outputContents,
    "- README.md",
    "--output contents",
  );

  assertNotIncludes(
    outputContents,
    "structure-map.md",
    "--output self-exclusion",
  );

  console.log(
    "9. Verifying --update...",
  );

  const updatePath = join(
    sampleDirectory,
    "PROJECT.md",
  );

  await writeFile(
    updatePath,
    [
      "# Sample Project",
      "",
      "<!-- treemark:start -->",
      "<!-- treemark:end -->",
      "",
    ].join("\n"),
    "utf8",
  );

  const updateResult =
    await runCommand(
      process.execPath,
      [
        treemarkCliPath,
        sampleDirectory,
        "--update",
        updatePath,
        "--no-links",
      ],
      consumerDirectory,
      0,
    );

  assertEqual(
    updateResult.stdout,
    "",
    "--update stdout",
  );

  const updateContents =
    await readFile(
      updatePath,
      "utf8",
    );

  assertIncludes(
    updateContents,
    "# Sample Project",
    "--update preserved content",
  );

  assertIncludes(
    updateContents,
    "<!-- Generated by TreeMark. Do not edit manually. -->",
    "--update generated notice",
  );

  assertNotIncludes(
    updateContents,
    "- PROJECT.md",
    "--update self-exclusion",
  );

  console.log(
    "10. Verifying current --check exit 0...",
  );

  await runCommand(
    process.execPath,
    [
      treemarkCliPath,
      sampleDirectory,
      "--update",
      updatePath,
      "--no-links",
      "--check",
    ],
    consumerDirectory,
    0,
  );

  console.log(
    "11. Verifying stale --check exit 2...",
  );

  await writeFile(
    join(
      sampleDirectory,
      "new-file.md",
    ),
    "",
    "utf8",
  );

  await runCommand(
    process.execPath,
    [
      treemarkCliPath,
      sampleDirectory,
      "--update",
      updatePath,
      "--no-links",
      "--check",
    ],
    consumerDirectory,
    2,
  );

  console.log(
    "12. Verifying operational exit 1...",
  );

  const failureResult =
    await runCommand(
      process.execPath,
      [
        treemarkCliPath,
        sampleDirectory,
        "--update",
        join(
          sampleDirectory,
          "DOES-NOT-EXIST.md",
        ),
        "--check",
      ],
      consumerDirectory,
      1,
    );

  assertIncludes(
    failureResult.stderr,
    "update target does not exist",
    "operational error output",
  );

  console.log("");
  console.log(
    "Package smoke test passed.",
  );
} finally {
  await rm(
    temporaryRoot,
    {
      recursive: true,
      force: true,
    },
  );
}

async function createSampleTree() {
  await mkdir(
    join(
      sampleDirectory,
      "docs",
    ),
    { recursive: true },
  );

  await mkdir(
    join(
      sampleDirectory,
      "src",
    ),
    { recursive: true },
  );

  await writeFile(
    join(
      sampleDirectory,
      "README.md",
    ),
    "",
    "utf8",
  );

  await writeFile(
    join(
      sampleDirectory,
      "docs",
      "guide.md",
    ),
    "",
    "utf8",
  );

  await writeFile(
    join(
      sampleDirectory,
      "src",
      "index.ts",
    ),
    "",
    "utf8",
  );
}

function runCommand(
  command,
  args,
  cwd,
  expectedExitCode,
) {
  return new Promise(
    (resolvePromise, rejectPromise) => {
      const child = spawn(
        command,
        args,
        {
          cwd,
          stdio: [
            "ignore",
            "pipe",
            "pipe",
          ],
        },
      );

      let stdout = "";
      let stderr = "";

      child.stdout.on(
        "data",
        (chunk) => {
          stdout += chunk.toString();
        },
      );

      child.stderr.on(
        "data",
        (chunk) => {
          stderr += chunk.toString();
        },
      );

      child.on(
        "error",
        rejectPromise,
      );

      child.on(
        "close",
        (exitCode) => {
          if (
            exitCode !== expectedExitCode
          ) {
            rejectPromise(
              new Error(
                [
                  `command failed: ${command} ${args.join(" ")}`,
                  `expected exit code: ${String(
                    expectedExitCode,
                  )}`,
                  `actual exit code: ${String(
                    exitCode,
                  )}`,
                  "",
                  "stdout:",
                  stdout,
                  "",
                  "stderr:",
                  stderr,
                ].join("\n"),
              ),
            );

            return;
          }

          resolvePromise({
            stdout,
            stderr,
          });
        },
      );
    },
  );
}

function assertEqual(
  actual,
  expected,
  label,
) {
  if (actual !== expected) {
    throw new Error(
      [
        `${label} did not match expected value`,
        "",
        "expected:",
        expected,
        "",
        "actual:",
        actual,
      ].join("\n"),
    );
  }
}

function assertIncludes(
  value,
  expected,
  label,
) {
  if (!value.includes(expected)) {
    throw new Error(
      `${label} did not include "${expected}"`,
    );
  }
}

function assertNotIncludes(
  value,
  unexpected,
  label,
) {
  if (value.includes(unexpected)) {
    throw new Error(
      `${label} unexpectedly included "${unexpected}"`,
    );
  }
}