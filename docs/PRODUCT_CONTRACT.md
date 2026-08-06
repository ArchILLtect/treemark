# TreeMark Product Contract

Status: **Locked for MVP implementation**  
Target release: **0.1.0**

## 1. Product definition

TreeMark is a small, standalone CLI that scans a local directory and generates a deterministic, Markdown-compatible representation of its file structure.

TreeMark may also safely synchronize one explicitly marked section of an existing Markdown document and verify in CI that the stored visualization is current.

TreeMark does not require a documentation framework or ecosystem.

## 2. Core value

TreeMark is not intended to replace a general-purpose filesystem browser or documentation platform.

Its primary value is:

> Deterministic, documentation-aware directory-tree generation with safe Markdown synchronization and CI freshness verification.

## 3. Primary users

- Developers maintaining documentation folders in software repositories.
- Open-source maintainers who want a navigable documentation map.
- Teams that want CI to detect stale generated documentation.
- Technical writers working in repository-based Markdown documentation.

## 4. MVP workflow

```text
Scan directory
→ build neutral tree model
→ render selected text format
→ print, write, update, or compare
```

Typical usage:

```bash
treemark ./docs
treemark ./docs --format ascii
treemark ./docs --output docs/docs-map.md
treemark ./docs --update README.md
treemark ./docs --update README.md --check
```

## 5. MVP capabilities

### Required

- Accept one root directory as a positional argument.
- Recursively scan the root directory.
- Sort directories before files.
- Sort each group deterministically and alphabetically.
- Support a maximum traversal depth.
- Support repeatable ignore glob patterns.
- Generate nested Markdown-list output.
- Generate ASCII-tree output.
- Generate relative links in Markdown output.
- Print generated output to stdout by default.
- Write a complete generated file with `--output`.
- Replace exactly one marked region with `--update`.
- Compare without writing with `--check`.
- Return documented exit codes.
- Operate correctly on Windows, macOS, and Linux.
- Never modify a target document after a validation or rendering failure.

### Explicitly deferred

- Mermaid output.
- SVG generation.
- Standalone HTML.
- Watch mode.
- Automatic Git-hook installation or management.
- Automatic marker insertion.
- Symlink traversal.
- Configuration files.
- `.gitignore` import.
- Interactive prompts.
- Plugin architecture.
- Markdown AST parsing.
- Public programmatic library API.

## 6. CLI contract

```text
treemark <root> [options]
```

### Positional argument

`<root>` is the directory to scan. It is resolved from the current working directory.

### Options

```text
-f, --format <format>       markdown | ascii
-o, --output <file>         Write a complete generated document
-u, --update <file>         Update a marked section in an existing Markdown file
-i, --ignore <pattern>      Ignore a root-relative glob; repeatable
-d, --max-depth <number>    Maximum descendant depth
-c, --check                 Compare only; never write
    --include-root          Include the scanned root node
    --no-links              Disable links in Markdown output
-h, --help                  Display help
-v, --version               Display version
```

### Default behavior

- Default format: `markdown`.
- No output/update target: write generated content to stdout.
- Informational and error messages: stderr.
- Links enabled for Markdown output.
- Root omitted unless `--include-root` is supplied.
- Symbolic links are skipped in MVP.
- UTF-8 text is assumed.

### Invalid combinations

TreeMark must reject:

- `--output` with `--update`.
- `--check` without `--output` or `--update`.
- Negative or non-integer `--max-depth`.
- Unsupported formats.
- A missing root path.
- A root path that is not a directory.
- An output or update target that resolves to a directory.

## 7. Tree model

The scanner returns a renderer-independent model:

```ts
export interface TreeNode {
  name: string;
  relativePath: string;
  type: "file" | "directory";
  children?: TreeNode[];
}
```

Renderer-specific syntax, labels, indentation, IDs, and links must not be stored in the scanner model.

## 8. Sorting contract

For every directory:

1. Directories appear before files.
2. Each group is sorted using deterministic natural alphabetical ordering.
3. Case-insensitive equality uses the original string as a deterministic tie-breaker.
4. Native filesystem enumeration order is never exposed directly.

Representative ordering tests must include:

```text
API.md
api.md
guide2.md
guide10.md
```

## 9. Path contract

TreeMark distinguishes between:

- Native filesystem paths for reading and writing.
- Root-relative POSIX-style paths for matching and generated documents.

Glob matching and generated Markdown always use `/`, including on Windows.

Example:

```text
guides/setup/windows.md
```

## 10. Depth contract

Internally, the scanned root is depth `0`.

- `--max-depth 0`: root only.
- `--max-depth 1`: root and direct children.
- `--max-depth 2`: root, children, and grandchildren.

Omitting the root from rendered output does not change traversal depth semantics.

## 11. Ignore contract

`--ignore` may be supplied more than once:

```bash
treemark ./docs \
  --ignore "drafts/**" \
  --ignore "**/*.tmp.md"
```

Patterns match normalized root-relative paths.

MVP default ignores:

```text
.git/**
node_modules/**
```

The resolved `--output` file is automatically excluded when it is located inside the scanned root.

The `--update` target is automatically excluded when it is located inside the scanned root.

## 12. Markdown format

Example:

```md
- **architecture/**
  - [decisions.md](docs/architecture/decisions.md)
  - [overview.md](docs/architecture/overview.md)
- **guides/**
  - [installation.md](docs/guides/installation.md)
- [index.md](docs/index.md)
```

Rules:

- Directories render as bold labels.
- Files render as links by default.
- Links are relative to the directory containing the receiving Markdown document.
- `--no-links` renders plain file labels.
- Markdown labels and link destinations are escaped or encoded safely.
- Output ends with exactly one newline.

## 13. ASCII format

Example:

```text
architecture/
├── decisions.md
└── overview.md
guides/
└── installation.md
index.md
```

Rules:

- ASCII output is emitted inside a fenced `text` code block when inserted into Markdown.
- Raw stdout behavior may be finalized during renderer implementation, but must remain deterministic.
- ASCII labels are not clickable.

## 14. Marked-section contract

Default markers:

```html
<!-- treemark:start -->
<!-- treemark:end -->
```

Example:

```md
## Documentation map

<!-- treemark:start -->
<!-- Generated by TreeMark. Do not edit manually. -->

- **guides/**
  - [setup.md](docs/guides/setup.md)

<!-- treemark:end -->
```

Rules:

- Both markers must already exist.
- Markers must each appear exactly once.
- The start marker must precede the end marker.
- Marker lines are preserved.
- Only content between markers is replaced.
- Missing, duplicated, or reversed markers cause failure without modification.
- Automatic marker insertion is not part of the MVP.
- Running update twice against unchanged inputs causes no second file change.
- Existing newline style is preserved when practical.

## 15. Output and mutation contract

TreeMark must complete all scanning, rendering, and target validation before writing.

Safe update sequence:

1. Resolve and validate paths.
2. Scan.
3. Render expected output in memory.
4. Read and validate the complete target.
5. Compare expected and existing content.
6. Return without writing when unchanged or in check mode.
7. Write a temporary file in the target directory.
8. Rename the temporary file over the target.
9. Clean up temporary files after failure.

## 16. Check-mode contract

```bash
treemark ./docs --update README.md --check
```

`--check`:

- Never writes.
- Regenerates expected output in memory.
- Compares it with the current generated target.
- Reports whether the target is stale.
- Is suitable for pre-commit hooks and CI.
- Does not install or manage those integrations.

Recommended integration hierarchy:

```text
Manual refresh
→ optional pre-commit check
→ required CI check before merge
```

## 17. Exit codes

```text
0  Success; generated content is current or was written successfully
1  Validation, configuration, filesystem, rendering, or operational failure
2  Check completed successfully and detected stale generated content
```

These codes are part of the public CLI contract.

## 18. Error contract

Default errors must:

- Be concise.
- Identify the relevant path or option.
- Explain the corrective action when practical.
- Avoid raw stack traces.
- Never print ordinary diagnostics to stdout.
- Reserve stack traces for a future explicit debug option.

Example:

```text
TreeMark: README.md is out of date.

Run:
  treemark ./docs --update README.md
```

## 19. Cross-platform contract

CI must test supported Node versions on:

- Ubuntu.
- Windows.
- macOS.

Required cross-platform coverage includes:

- Native path resolution.
- POSIX-style generated links.
- Glob matching.
- Newline handling.
- CLI executable behavior.
- Output-target exclusion.

## 20. MVP acceptance criteria

Version `0.1.0` is ready for beta use when:

1. A fixture directory produces stable Markdown and ASCII output.
2. Ignore patterns and max depth behave as documented.
3. Relative links are correct for both `--output` and `--update`.
4. A valid marked document updates only the marked region.
5. Invalid markers never modify the target.
6. A repeated update is idempotent.
7. `--check` returns `0` when current and `2` when stale.
8. The actual npm tarball installs and runs in a separate project.
9. CI passes on Ubuntu, Windows, and macOS.
10. The README documents commands, markers, exit codes, limitations, and CI use.

## 21. Open decisions intentionally postponed

These are not blockers for repository setup:

- Final npm registry name and scope.
- Whether raw stdout ASCII includes a Markdown fence.
- Exact default ignore behavior beyond `.git` and `node_modules`.
- Whether all file types are linked or only Markdown-compatible files.
- Whether Node 22 remains the minimum at publication time.

Each must be resolved before its corresponding implementation is considered complete.
