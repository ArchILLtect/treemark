# Phase 5 — CLI Integration and File Output

Status: **Planned**

## Goal

Connect TreeMark's completed scanner and renderer layers into a working end-to-end CLI pipeline.

By the end of this phase, a user should be able to run TreeMark against a real directory and receive fully rendered Markdown or ASCII output in the terminal, or write that rendered output to a file.

This phase turns the existing independently tested components into the first genuinely usable TreeMark prototype.

This phase does not yet mutate sections inside existing Markdown files, manage TreeMark markers, or implement freshness checking.

---

## Scope

### 5A — End-to-End CLI Rendering

- Wire CLI arguments into the scanner.
- Scan the requested root directory.
- Select the requested renderer.
- Render Markdown by default.
- Support ASCII output through the existing format option.
- Print rendered output to stdout when no output file is requested.
- Preserve renderer newline behavior.
- Pass scanner options through correctly.
- Pass renderer options through correctly.
- Add end-to-end CLI tests.

### 5B — File Output / Hardening

- Add or wire `--output` behavior.
- Write rendered output to the requested file.
- Exclude the output file from the generated tree when it falls inside the scan root.
- Define overwrite behavior.
- Handle invalid or unwritable output targets cleanly.
- Avoid partial or misleading success messages.
- Verify stdout remains clean when output is redirected to a file.
- Add file-output tests.
- Verify the full CI matrix.

---

## Proposed Architecture

```text
src/
├── cli/
│   ├── run-cli.ts
│   └── ...
├── render/
│   ├── render-markdown.ts
│   └── render-ascii.ts
├── scan/
│   └── ...
└── types.ts
```

Exact file boundaries may change if implementation shows that a small orchestration helper would make the flow clearer.

Do not merge scanner and renderer responsibilities into the CLI layer.

---

## End-to-End Pipeline

The intended runtime flow is:

```text
CLI arguments
    ↓
scanDirectory(...)
    ↓
TreeNode
    ↓
renderer selection
    ↓
renderMarkdown(...) / renderAscii(...)
    ↓
rendered string
    ↓
stdout OR output file
```

The CLI layer coordinates the operation.

It must not:

- Perform filesystem traversal itself.
- Reimplement sorting.
- Reimplement ignore matching.
- Reimplement renderer formatting.
- Mutate `TreeNode` values.
- Contain README marker logic.
- Perform `--check` freshness comparison.

---

## Format Selection

MVP renderer behavior:

```text
markdown = default
ascii    = optional
```

Representative commands:

```bash
treemark ./docs
treemark ./docs --format markdown
treemark ./docs --format ascii
```

The CLI should reject unsupported formats cleanly.

Renderer selection must only determine which renderer receives the completed `TreeNode`.

It must not alter scanner behavior.

---

## Root Rendering Option

Phase 4 locked:

```text
default: includeRoot = false
optional: includeRoot = true
```

Phase 5 should expose this through the CLI if the current argument contract does not already do so.

Representative behavior:

```bash
treemark ./docs
treemark ./docs --include-root
```

The CLI should pass this choice into the renderer rather than implementing root formatting itself.

---

## Stdout Behavior

When no output file is requested, TreeMark should write only the rendered tree to stdout during successful normal operation.

Example:

```bash
treemark ./docs --format ascii
```

should produce output such as:

```text
architecture/
└── overview.md
guides/
├── install.md
└── usage.md
getting-started.md
```

Successful stdout output should not be polluted with unrelated status text such as:

```text
Scanning...
Done!
Found 14 files.
```

This keeps TreeMark friendly to redirection and shell pipelines.

Diagnostic or error output should remain distinguishable from generated tree content.

---

## File Output

Representative command:

```bash
treemark ./docs --output docs-map.md
```

Expected flow:

```text
scan ./docs
→ render selected format
→ write rendered string to docs-map.md
```

The stored file should contain exactly the renderer output.

Do not automatically add:

- Headings.
- Code fences.
- TreeMark markers.
- Timestamps.
- Explanatory text.

Those concerns belong to later phases or future options.

---

## Output-File Self-Exclusion

If the requested output file is inside the scanned root, TreeMark must prevent the output file from including itself in the generated tree.

Example:

```bash
treemark ./docs --output ./docs/docs-map.md
```

The scanner should receive the corresponding normalized root-relative exclusion:

```text
docs-map.md
```

This should use the explicit exclusion mechanism built in Phase 3.

The scanner should not need to know that the excluded path is an output target.

---

## Overwrite Behavior

Phase 5 must explicitly lock file overwrite semantics.

Recommended MVP behavior:

- If the output file does not exist, create it.
- If the output file already exists, replace its entire contents.
- Do not append.
- Do not prompt interactively.
- Do not partially preserve existing content.

This behavior is appropriate for standalone generated output files.

README section preservation belongs to Phase 6.

---

## Output Paths

Output-path handling must be deterministic and cross-platform.

During implementation, verify:

- Relative output paths resolve from the current working directory.
- Absolute output paths work.
- Parent-directory handling is explicit.
- Output paths inside the scan root are converted correctly for explicit exclusion.
- Output paths outside the scan root do not create unintended exclusions.
- Windows separators do not leak into normalized scanner exclusions.

Do not silently create complicated missing directory trees unless that behavior is explicitly chosen and documented.

---

## Error Behavior

CLI/output errors should:

- Produce a concise user-facing message.
- Avoid raw stack traces during normal CLI use.
- Return the existing operational failure exit code.
- Never claim that a file was written when writing failed.
- Avoid leaving knowingly incomplete generated output when practical.

Representative failures:

- Invalid root.
- Unsupported format.
- Output parent does not exist.
- Output path is a directory.
- Permission denied while writing.
- Unexpected scanner failure.
- Unexpected renderer/orchestration failure.

---

## Exit Codes

Continue the existing MVP exit-code contract:

```text
0 = success
1 = operational or validation failure
2 = reserved for stale output in future --check mode
```

Phase 5 should not use exit code `2`.

---

## Test Strategy

Keep lower-level scanner and renderer tests independent.

Phase 5 adds orchestration tests proving those layers work together through the CLI.

Prefer temporary directories for output-writing tests so tests do not mutate committed fixtures.

Representative end-to-end test structure:

```text
temporary root
├── guides/
│   └── setup.md
└── overview.md
```

Then execute the CLI orchestration and verify either:

```text
stdout
```

or:

```text
generated output file
```

contains the exact expected renderer output.

---

## Required Tests

### CLI Integration

* [ ] Default command scans and renders Markdown.
* [ ] ASCII format selects the ASCII renderer.
* [ ] Unsupported format fails cleanly.
* [ ] Scanner options reach `scanDirectory`.
* [ ] Renderer options reach the selected renderer.
* [ ] Root inclusion behavior works through the CLI.
* [ ] Successful stdout output contains only rendered tree content.
* [ ] Renderer output newline behavior is preserved.

### End-to-End Behavior

* [ ] A real temporary directory can be scanned and rendered through the CLI.
* [ ] Markdown output represents the real scanned hierarchy.
* [ ] ASCII output represents the real scanned hierarchy.
* [ ] Ignore patterns affect end-to-end output.
* [ ] Maximum depth affects end-to-end output.
* [ ] Symlink-skipping behavior remains intact through CLI integration.

### File Output

* [ ] `--output` creates a new file.
* [ ] Generated file contents exactly match renderer output.
* [ ] Existing output file is replaced rather than appended.
* [ ] Markdown can be written to a file.
* [ ] ASCII can be written to a file.
* [ ] Output-file path inside the scan root is excluded from the tree.
* [ ] Output path outside the scan root has no unintended exclusion effect.
* [ ] Writing to an invalid target fails cleanly.
* [ ] Failed writes do not report success.

### Separation / Hardening

* [ ] CLI orchestration does not duplicate scanner logic.
* [ ] CLI orchestration does not duplicate renderer logic.
* [ ] File-output logic does not leak into the scanner.
* [ ] File-output logic does not leak into renderers.
* [ ] Stdout behavior is deterministic.
* [ ] Repeated runs against unchanged input produce identical output.

---

## Implementation Checklist

### 5A — CLI Rendering Pipeline

* [ ] Review current CLI argument contract.
* [ ] Wire root path into `scanDirectory`.
* [ ] Wire scanner options into `scanDirectory`.
* [ ] Add renderer-selection orchestration.
* [ ] Make Markdown the default renderer.
* [ ] Wire ASCII format selection.
* [ ] Wire optional root inclusion.
* [ ] Print rendered output to stdout.
* [ ] Add CLI integration tests.
* [ ] Add real-directory end-to-end tests.
* [ ] Run `npm run check`.

### 5B — File Output / Hardening

* [ ] Lock overwrite behavior.
* [ ] Wire `--output` argument.
* [ ] Resolve output path correctly.
* [ ] Convert in-root output target to explicit scanner exclusion.
* [ ] Write rendered output to file.
* [ ] Ensure successful file output does not duplicate tree content to stdout.
* [ ] Add temporary-directory file-output tests.
* [ ] Add overwrite test.
* [ ] Add self-exclusion test.
* [ ] Add invalid-output error tests.
* [ ] Review orchestration boundaries.
* [ ] Verify all OS/Node CI jobs.
* [ ] Run final `npm run check`.

---

## Definition of Done

Phase 5 is complete when:

1. `treemark <root>` scans a real directory and prints Markdown output.
2. `--format ascii` prints ASCII output.
3. Renderer selection is controlled by the CLI without duplicating renderer logic.
4. Scanner options continue to work through the end-to-end CLI pipeline.
5. Optional root inclusion works through the CLI.
6. `--output` writes the rendered tree to a standalone file.
7. Existing generated output files are safely replaced.
8. An output file inside the scan root does not include itself.
9. Successful stdout output remains clean and pipe-friendly.
10. Operational failures return exit code `1`.
11. No Phase 6 README marker/update logic has leaked into Phase 5.
12. Unit and end-to-end tests pass.
13. All GitHub Actions matrix jobs pass.
14. `git status` is clean after the final commit.

---

## Deferred / Follow-up

Do not implement during Phase 5:

- README marker parsing.
- README section replacement.
- `--update`.
- `--check`.
- Stale-output exit code `2`.
- Automatic hook installation.
- Mermaid.
- SVG.
- HTML.
- Configuration files.
- `.gitignore` import.
- Symlink inclusion/following.
- Watch mode.
- Large-tree compact/collapsible presentation features.

Any newly discovered feature should be recorded here instead of automatically expanding Phase 5 scope.
