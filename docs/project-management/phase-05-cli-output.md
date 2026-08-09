# Phase 5 — CLI Integration and File Output

Status: **Complete**

## Goal

Connect TreeMark's completed scanner and renderer layers into a working end-to-end CLI pipeline.

By the end of this phase, a user should be able to run TreeMark against a real directory and receive fully rendered Markdown or ASCII output in the terminal, or write that rendered output to a file.

This phase turns the existing independently tested components into the first genuinely usable TreeMark prototype.

This phase does not yet mutate sections inside existing Markdown files, manage TreeMark markers, implement freshness checking, or create timestamped snapshot files.

---

## Locked Phase 5 Decisions

### Output Destination

- If `--output` is omitted, TreeMark writes the rendered tree to stdout.
- If `--output` is provided without an explicit filename, TreeMark uses:

```text
structure-map.md
```

- If the user supplies a filename/path, TreeMark writes exactly to that target.

Representative commands:

```bash
treemark ./docs
treemark ./src --output
treemark ./src --output architecture-tree.md
treemark . --output reports/project-structure.md
```

### Overwrite Behavior

For Phase 5:

- Existing output files are replaced in full.
- Output is never appended.
- TreeMark does not prompt interactively before replacement.
- TreeMark does not preserve old generated contents inside the same file.
- Snapshot/timestamp mode is intentionally deferred.

The long-term behavior should preserve room for a future option that creates timestamped historical snapshots instead of overwriting the canonical output file.

Conceptually:

```text
stdout                  = temporary/viewable output
--output                = canonical generated artifact
future snapshot mode    = historical preserved artifact
```

### Default Output Filename

The generalized default output filename is:

```text
structure-map.md
```

This name is intentionally not documentation-specific so TreeMark can describe application code, repositories, assets, configuration trees, documentation, or other directory structures.

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
- Support the default output filename `structure-map.md`.
- Support an explicitly supplied output filename/path.
- Write rendered output to the requested file.
- Exclude the output file from the generated tree when it falls inside the scan root.
- Replace existing output files in full.
- Handle invalid or unwritable output targets cleanly.
- Avoid partial or misleading success messages.
- Verify stdout remains clean when output is redirected to a file.
- Add file-output tests.
- Verify the full CI matrix.

---

## Proposed Architecture

```text
src/
├── cli.ts
├── index.ts
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
- Implement timestamped snapshot naming.

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

### Default Output Target

If the user selects file output but does not provide a custom filename, use:

```text
structure-map.md
```

Representative command:

```bash
treemark ./docs --output
```

Expected target:

```text
./structure-map.md
```

The default output target is resolved from the current working directory.

### User-Named Output Target

The user may provide a custom filename or path:

```bash
treemark ./docs --output docs-tree.md
treemark ./src --output reports/source-structure.md
```

TreeMark should write exactly to the requested target.

### Stored File Contents

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
treemark ./docs --output ./docs/structure-map.md
```

The scanner should receive the corresponding normalized root-relative exclusion:

```text
structure-map.md
```

This should use the explicit exclusion mechanism built in Phase 3.

The scanner should not need to know that the excluded path is an output target.

This logic should also be designed so a future timestamped snapshot target can reuse the same exclusion pathway.

---

## Overwrite Behavior

Phase 5 behavior is locked:

- If the output file does not exist, create it.
- If the output file already exists, replace its entire contents.
- Do not append.
- Do not prompt interactively.
- Do not partially preserve existing content.

This behavior applies to the canonical standalone generated artifact.

Historical snapshots are a separate concern and are deferred.

---

## Future Snapshot Compatibility

Phase 5 should avoid design choices that would make a future snapshot mode awkward.

A future feature may support behavior conceptually similar to:

```bash
treemark . --output structure-map.md --snapshot
```

or another final CLI shape chosen later.

That future mode may generate timestamped targets such as:

```text
structure-map-2026-08-09.md
structure-map-2026-08-09T1202.md
```

The exact syntax, timestamp format, timezone semantics, collision handling, storage location, and retention policy are explicitly deferred.

Phase 5 should only preserve architectural room for this capability.

---

## Output Paths

Output-path handling must be deterministic and cross-platform.

During implementation, verify:

- Relative output paths resolve from the current working directory.
- Absolute output paths work.
- The default `structure-map.md` target resolves predictably.
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

* [x] Default command scans and renders Markdown.
* [x] ASCII format selects the ASCII renderer.
* [x] Unsupported format fails cleanly.
* [x] Scanner options reach `scanDirectory`.
* [x] Renderer options reach the selected renderer.
* [x] Root inclusion behavior works through the CLI.
* [x] Successful stdout output contains only rendered tree content.
* [x] Renderer output newline behavior is preserved.

### End-to-End Behavior

* [x] A real temporary directory can be scanned and rendered through the CLI.
* [x] Markdown output represents the real scanned hierarchy.
* [x] ASCII output represents the real scanned hierarchy.
* [x] Ignore patterns affect end-to-end output.
* [x] Maximum depth affects end-to-end output.
* [x] Symlink-skipping behavior remains intact through CLI integration.

### File Output

* [x] `--output` without a filename creates `structure-map.md`.
* [x] `--output <path>` uses the user-supplied filename/path.
* [x] Generated file contents exactly match renderer output.
* [x] Existing output file is replaced rather than appended.
* [x] Markdown can be written to a file.
* [x] ASCII can be written to a file.
* [x] Output-file path inside the scan root is excluded from the tree.
* [x] Output path outside the scan root has no unintended exclusion effect.
* [x] Writing to an invalid target fails cleanly.
* [x] Failed writes do not report success.
* [x] Markdown file links are relative to the output document location.
* [x] Markdown link paths use `/` on all platforms.
* [x] Link-disabled Markdown output uses plain file labels.

### Separation / Hardening

* [x] CLI orchestration does not duplicate scanner logic.
* [x] CLI orchestration does not duplicate renderer logic.
* [x] File-output logic does not leak into the scanner.
* [x] File-output logic does not leak into renderers.
* [x] Snapshot/timestamp behavior is not implemented in Phase 5.
* [x] Current output-path design leaves room for future snapshot targets.
* [x] Stdout behavior is deterministic.
* [x] Repeated runs against unchanged input produce identical output.

---

## Implementation Checklist

### 5A — CLI Rendering Pipeline

* [x] Review current CLI argument contract.
* [x] Wire root path into `scanDirectory`.
* [x] Wire scanner options into `scanDirectory`.
* [x] Add renderer-selection orchestration.
* [x] Make Markdown the default renderer.
* [x] Wire ASCII format selection.
* [x] Wire optional root inclusion.
* [x] Print rendered output to stdout.
* [x] Add CLI integration tests.
* [x] Add real-directory end-to-end tests.
* [x] Run `npm run check`.

### 5B — File Output / Hardening

* [x] Lock default output filename as `structure-map.md`.
* [x] Lock overwrite behavior.
* [x] Wire `--output` with optional filename/path.
* [x] Use `structure-map.md` when file output is requested without a custom target.
* [x] Resolve user-supplied output paths correctly.
* [x] Convert in-root output target to explicit scanner exclusion.
* [x] Write rendered output to file.
* [x] Complete MVP Markdown link behavior for generated files.
* [x] Resolve Markdown links relative to the directory containing the output file.
* [x] Support plain file labels when links are disabled.
* [x] Add Markdown link/path tests for output files.
* [x] Replace existing output file contents in full.
* [x] Ensure successful file output does not duplicate tree content to stdout.
* [x] Add temporary-directory file-output tests.
* [x] Add default-filename test.
* [x] Add custom-filename test.
* [x] Add overwrite test.
* [x] Add self-exclusion test.
* [x] Add invalid-output error tests.
* [x] Review orchestration boundaries.
* [x] Review future snapshot compatibility.
* [x] Verify all OS/Node CI jobs.
* [x] Run final `npm run check`.

---

## Definition of Done

Phase 5 is complete when:

1. `treemark <root>` scans a real directory and prints Markdown output.
2. `--format ascii` prints ASCII output.
3. Renderer selection is controlled by the CLI without duplicating renderer logic.
4. Scanner options continue to work through the end-to-end CLI pipeline.
5. Optional root inclusion works through the CLI.
6. `--output` without a custom filename writes to `structure-map.md`.
7. `--output <path>` writes to the user-supplied target.
8. Existing generated output files are safely replaced.
9. An output file inside the scan root does not include itself.
10. Successful stdout output remains clean and pipe-friendly.
11. Operational failures return exit code `1`.
12. Snapshot/timestamp output remains deferred but is not blocked by Phase 5 architecture.
13. No Phase 6 README marker/update logic has leaked into Phase 5.
14. Markdown output files use correct destination-relative links, with plain labels available when links are disabled.
15. Unit and end-to-end tests pass.
16. All GitHub Actions matrix jobs pass.
17. `git status` is clean after the final commit.

---

## Deferred / Follow-up

Do not implement during Phase 5:

- Timestamped snapshot output.
- Snapshot naming syntax.
- Snapshot timezone behavior.
- Snapshot collision handling.
- Snapshot retention/cleanup policy.
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
