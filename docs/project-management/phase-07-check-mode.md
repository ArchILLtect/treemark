# Phase 7 — Check Mode

Status: **Planned**

## Goal

Add TreeMark's non-mutating freshness-check capability.

By the end of this phase, users should be able to ask whether a generated
TreeMark artifact or synchronized Markdown region is current without modifying
any file.

Phase 7 activates:

```text
-c, --check
```

and introduces the MVP stale-result exit code:

```text
0 = current / success
1 = operational or validation failure
2 = generated content is stale
```

---

## Core Contract

Check mode is comparison-only.

```text
scan
→ render expected content
→ build expected target content
→ compare against existing target
→ return status
→ never write
```

Rules:

- `--check` requires either `--output` or `--update`.
- `--check` never writes, renames, creates, truncates, or deletes files.
- Current content exits with code `0`.
- Stale content exits with code `2`.
- Operational or validation failures exit with code `1`.
- Normal check-mode operation should not print generated tree content to stdout.
- Existing Phase 5/6 path, exclusion, rendering, marker, and newline semantics
  remain the source of truth.

---

## Scope

### 7A — Pure Freshness Comparison

- Define a small freshness result model.
- Compare expected full-file output against an existing `--output` target.
- Compare expected synchronized Markdown content against an existing
  `--update` target.
- Reuse existing render/synchronization logic instead of reimplementing it.
- Keep comparison logic pure where practical.
- Add unit tests for current vs stale results.

### 7B — CLI Integration and Exit Codes

- Activate `--check` in `run-cli.ts`.
- Restore the `--check requires --output or --update` validation rule.
- Route `--output --check` through non-mutating full-file comparison.
- Route `--update --check` through non-mutating synchronized-document comparison.
- Set exit code `2` for stale content.
- Preserve exit code `1` for operational/validation errors through the existing
  top-level CLI error boundary.
- Keep stdout clean.
- Add end-to-end check-mode tests.
- Verify the full OS/Node CI matrix.

---

## Intended Runtime Flows

### `--output --check`

```text
resolve root + output target
→ validate CLI combination
→ scan
→ render expected output
→ read existing output target
→ compare bytes/text
→ current: exit 0
→ stale: exit 2
```

No file is written.

### `--update --check`

```text
resolve root + update target
→ validate target
→ scan
→ render expected tree
→ read existing Markdown target
→ validate markers
→ build expected full updated document in memory
→ compare with current document
→ current: exit 0
→ stale: exit 2
```

No file is written.

---

## Exit-Code Contract

### Exit `0`

Use when:

- `--output --check` target exactly matches expected generated output.
- `--update --check` target exactly matches expected synchronized document.

### Exit `1`

Use for operational or validation failures, including:

- missing root;
- invalid root;
- missing check target;
- directory-valued check target;
- malformed synchronization markers;
- unsupported CLI combinations;
- filesystem read failure.

### Exit `2`

Use only when:

- the target is valid and readable;
- expected content can be generated successfully;
- comparison succeeds;
- the current target content differs from expected content.

Exit code `2` means stale, not broken.

---

## Output Check Semantics

`--output --check` compares the complete expected generated file against the
existing target.

Examples:

```bash
treemark ./docs --output structure-map.md --check
treemark ./docs --output --check
treemark ./docs --format ascii --output structure-map.txt --check
```

Rules:

- Bare `--output` still resolves to `structure-map.md`.
- The output target must already exist in check mode.
- The output target remains excluded from the scanned tree when inside the root.
- Markdown links use the same destination-relative link-base rules as normal
  `--output`.
- `--no-links`, `--format`, `--ignore`, `--max-depth`, and `--include-root`
  affect expected content exactly as they do during generation.
- No parent directories or files are created in check mode.

---

## Update Check Semantics

`--update --check` compares the current Markdown document against the complete
document TreeMark would produce during a normal update.

Examples:

```bash
treemark ./docs --update README.md --check
treemark ./docs --update README.md --no-links --check
treemark ./docs --update README.md --format ascii --check
```

Rules:

- The update target must exist and be a file.
- Marker validation is identical to normal `--update`.
- The update target is excluded from scanning when inside the root.
- Markdown link context is identical to normal `--update`.
- ASCII content is compared using the same fenced `text` composition used by
  normal synchronization.
- LF/CRLF handling must reuse the existing synchronization path so check mode
  does not disagree with update mode.

---

## Architectural Rule

Check mode should answer:

> "Would TreeMark change this target if I ran the corresponding write command?"

Therefore, comparison must reuse the same expected-content construction used
by write mode.

Avoid separate check-only rendering or synchronization rules.

Conceptually:

```text
normal write mode:
expected content → compare → unchanged return / changed write

check mode:
expected content → compare → current 0 / stale 2
```

The expected-content path should be shared.

---

## Proposed Architecture

Potential additions:

```text
src/
├── check/
│   ├── check-output-file.ts
│   └── ...
├── sync/
│   ├── build-updated-document.ts
│   ├── update-markdown-file.ts
│   └── ...
└── cli/
    └── run-cli.ts
```

Exact file boundaries may change during implementation.

Prefer small helpers over duplicating comparison logic in `run-cli.ts`.

---

## Required Tests

### Validation

* [ ] `--check` without `--output` or `--update` fails.
* [ ] `--output` with `--update` remains rejected.
* [ ] Missing output check target fails with exit `1`.
* [ ] Directory-valued output check target fails with exit `1`.
* [ ] Missing update check target fails with exit `1`.
* [ ] Directory-valued update check target fails with exit `1`.
* [ ] Invalid update markers fail with exit `1`.

### Output Check

* [ ] Current Markdown output returns exit `0`.
* [ ] Stale Markdown output returns exit `2`.
* [ ] Current ASCII output returns exit `0`.
* [ ] Stale ASCII output returns exit `2`.
* [ ] Bare `--output --check` uses `structure-map.md`.
* [ ] In-root output target is excluded during comparison.
* [ ] Outside-root output target causes no unintended exclusion.
* [ ] Destination-relative Markdown links match normal output behavior.
* [ ] `--no-links` affects expected output correctly.
* [ ] Check mode does not rewrite or create the output target.
* [ ] Check mode emits no generated tree content to stdout.

### Update Check

* [ ] Current synchronized Markdown returns exit `0`.
* [ ] Stale synchronized Markdown returns exit `2`.
* [ ] Current synchronized ASCII returns exit `0`.
* [ ] Stale synchronized ASCII returns exit `2`.
* [ ] CWD-relative update target resolution matches normal update behavior.
* [ ] In-root update target is excluded during comparison.
* [ ] Outside-root update target causes no unintended exclusion.
* [ ] Destination-relative Markdown links match normal update behavior.
* [ ] `--no-links` affects expected synchronized content correctly.
* [ ] Marker validation matches normal update behavior.
* [ ] LF targets compare correctly.
* [ ] CRLF targets compare correctly.
* [ ] Check mode does not rewrite the update target.
* [ ] Check mode emits no generated tree content to stdout.

### Exit Codes / Determinism

* [ ] Current target produces exit `0`.
* [ ] Stale target produces exit `2`.
* [ ] Operational failure produces exit `1`.
* [ ] Repeated checks against unchanged inputs produce identical results.
* [ ] Running check mode never changes target modification time.

### Separation / Hardening

* [ ] Check mode reuses existing renderers.
* [ ] Check mode reuses existing synchronization composition/replacement logic.
* [ ] Scanner remains unaware of check mode.
* [ ] Renderers remain unaware of check mode.
* [ ] Check comparison code performs no writes.
* [ ] Exit code `2` is used only for valid-but-stale content.

---

## Implementation Checklist

### 7A — Freshness Comparison

* [x] Review and lock check-mode user-facing semantics.
* [x] Define current/stale comparison result.
* [x] Add full-file output comparison helper.
* [x] Reuse `buildUpdatedDocument()` for update comparison.
* [x] Add unit tests for current output.
* [x] Add unit tests for stale output.
* [x] Add unit tests for current synchronized document.
* [x] Add unit tests for stale synchronized document.
* [x] Review comparison boundaries.
* [x] Run `npm run check`.

### 7B — CLI / Exit Codes

* [ ] Activate `--check`.
* [ ] Restore `--check requires --output or --update`.
* [ ] Wire `--output --check`.
* [ ] Wire `--update --check`.
* [ ] Return/set exit `0` for current targets.
* [ ] Return/set exit `2` for stale targets.
* [ ] Preserve exit `1` for operational failures.
* [ ] Keep check-mode stdout clean.
* [ ] Add output-check E2E tests.
* [ ] Add update-check E2E tests.
* [ ] Add no-mutation/mtime E2E tests.
* [ ] Add exit-code E2E tests.
* [ ] Review orchestration boundaries.
* [ ] Split E2E suites by responsibility if appropriate.
* [ ] Verify all OS/Node CI jobs.
* [ ] Run final `npm run check`.

---

## Definition of Done

Phase 7 is complete when:

1. `--check` works with `--output`.
2. `--check` works with `--update`.
3. Current targets return exit code `0`.
4. Stale targets return exit code `2`.
5. Operational and validation failures return exit code `1`.
6. Check mode never creates, modifies, renames, or deletes target files.
7. Check mode preserves target modification times.
8. Output comparison uses the exact same rendering/path semantics as normal
   `--output`.
9. Update comparison uses the exact same synchronization semantics as normal
   `--update`.
10. Marker-validation failures are treated as operational failures, not stale
    content.
11. LF and CRLF synchronized targets compare correctly.
12. Scanner and renderer boundaries remain clean.
13. Unit and end-to-end tests pass.
14. All GitHub Actions matrix jobs pass.
15. `git status` is clean after the final commit.

---

## Deferred / Follow-up

Do not implement during Phase 7:

- Automatic Git-hook installation.
- Watch mode.
- Timestamped snapshots.
- Update-target backup rotation.
- Automatic marker insertion.
- Multiple named marker regions.
- Custom marker strings.
- Configuration files.
- `.gitignore` import.
- Symlink traversal.
- Mermaid.
- SVG.
- HTML.
- Plugin architecture.
- Public programmatic API.

Check mode may later be used by CI, pre-commit hooks, or other automation, but
Phase 7 should implement only the comparison/exit-code capability itself.
