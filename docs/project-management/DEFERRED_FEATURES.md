# Deferred Features

This document tracks TreeMark features and enhancements that have been
explicitly considered and intentionally deferred.

Items listed here are not forgotten work and are not automatically part of
the current MVP scope.

When a deferred item becomes active work, move it into the appropriate phase
plan or implementation checklist.

---

## Output and Snapshot Features

### Timestamped structure snapshots

Allow users to preserve historical structure maps instead of overwriting the
same generated file.

Possible future behavior:

```bash
treemark . --output structure-map.md --snapshot
```

Potential generated names:

```text
structure-map-2026-08-09.md
structure-map-2026-08-09T1202.md
```

Open decisions:

- Final CLI syntax.
- Timestamp format.
- Local time vs UTC.
- Date-only vs date-and-time naming.
- Filename collision behavior.
- Snapshot storage location.
- Retention or cleanup policy.

Status: Deferred post-MVP.

### Large-tree presentation modes

Potential alternatives for very large directory structures:

- Directories-only output.
- Compact or summary modes.
- Collapsible Markdown using `<details>`.
- Separate generated structure-map files.
- Interactive HTML presentation.

Status: Deferred post-MVP.

---

## Additional Renderers

- Mermaid output.
- SVG generation.
- Standalone HTML output.

Status: Deferred post-MVP.

---

## Scanner and Filesystem Features

### Symlink traversal

MVP behavior skips symbolic links.

Potential future options may include:

- Show symlinks without following them.
- Include link targets.
- Safely follow symlinked directories.
- Cycle detection and traversal-boundary protection.

Status: Deferred post-MVP.

### `.gitignore` integration

Allow TreeMark to optionally read the scanned root's `.gitignore` file and
apply its rules in addition to TreeMark's built-in ignores and any explicit
`--ignore` patterns.

Potential future CLI behavior:

```bash
treemark . --gitignore
```

Recommended initial scope:

* Opt-in behavior rather than automatic `.gitignore` loading.
* Read only the `.gitignore` located at the scanned root.
* Support Git-style ignore patterns, including negation rules where practical.
* Combine `.gitignore` rules with TreeMark's built-in ignores.
* Keep explicit `--ignore` patterns additive.
* Treat a missing `.gitignore` as normal rather than an error.

Potential uses include:

* Avoiding duplicate ignore configuration between Git and TreeMark.
* Excluding generated output, caches, temporary files, and other repository
  artifacts already covered by `.gitignore`.
* Making common project scans easier to configure while keeping TreeMark's
  default behavior explicit and deterministic.

Open decisions:

* Whether nested `.gitignore` files should eventually be supported.
* Exact compatibility target with Git's ignore semantics.
* How ignored-but-already-tracked files should be handled.
* Precedence rules if future configuration files can also provide ignore
  patterns.
* Whether TreeMark should expose diagnostics showing which rule excluded a
  path.

Status: Deferred post-MVP.

### Configuration files

Support persistent TreeMark configuration instead of requiring all behavior
to be supplied through CLI flags.

Status: Deferred post-MVP.

### Automatic output-directory creation

Potential option to create missing parent directories for `--output`.

Current behavior requires the parent directory to already exist.

Status: Deferred unless demand justifies it.

---

## Synchronization Features

### Automatic marker insertion

Automatically create TreeMark markers when an update target does not already
contain them.

Current MVP contract requires markers to exist beforehand.

Status: Deferred post-MVP.

### Multiple named marker regions

Allow multiple independently managed TreeMark regions inside one Markdown
document.

Status: Deferred post-MVP.

### Custom marker strings

Allow users to configure marker names or marker syntax instead of requiring
TreeMark's default markers:

```html
<!-- treemark:start -->
<!-- treemark:end -->
```

Potential uses include:

* Matching an existing project's documentation conventions.
* Avoiding naming collisions with other tools.
* Using more descriptive marker names for specialized generated sections.
* Supporting multiple separately managed structure-map regions in the same
  document when combined with future named-region support.

Example future markers might look like:

```html
<!-- treemark:docs:start -->
<!-- treemark:docs:end -->

<!-- treemark:src:start -->
<!-- treemark:src:end -->
```

or user-defined alternatives such as:

```html
<!-- docs-tree:start -->
<!-- docs-tree:end -->
```

Open decisions:

* Whether customization belongs in CLI flags, configuration files, or both.
* Whether custom marker names should identify distinct managed regions.
* Validation rules for marker names.
* How custom markers interact with future multiple-region support.
* Whether default TreeMark markers remain reserved.

Status: Deferred post-MVP.

### Markdown AST parsing

Use structured Markdown parsing instead of the MVP marker/string-based
approach.

Status: Deferred post-MVP.

---

## Automation and Continuous Operation

### Watch mode

Automatically regenerate output when the filesystem changes.

Status: Deferred post-MVP.

### Automatic Git hook installation

TreeMark may support or document pre-commit integration, but automatic
installation or management of Git hooks is deferred.

Status: Deferred post-MVP.

---

## Extensibility

### Plugin architecture

Allow third-party renderers, scanners, or transformations.

Status: Deferred post-MVP.

### Public programmatic API

Expose TreeMark as a supported JavaScript/TypeScript library in addition to
the CLI.

Status: Deferred post-MVP.

---

## CLI / UX Features

### Interactive prompts

Interactive configuration or guided command flows.

Status: Deferred post-MVP.

---

## Safety and Security Features

### Update-target backups

Optionally preserve previous versions of user-authored files modified by
`--update`.

This is separate from generated structure snapshots. Structure snapshots
preserve historical TreeMark output artifacts; update-target backups preserve
the original host document before TreeMark modifies its managed region.

Potential approaches:

- Single rolling backup:
  `README.md.treemark.bak`
- Fixed backup rotation:
  `README.md.treemark.bak.1`
  `README.md.treemark.bak.2`
  `README.md.treemark.bak.3`
- Time-based backup retention.

Open decisions:

- Whether backups are enabled by default or opt-in.
- Maximum backup count.
- Rotation vs TTL retention.
- Backup naming convention.
- Whether unchanged updates create backups.
- Cleanup behavior.
- Interaction with Git-managed files.

Status: Deferred post-MVP.

## Check Mode and Drift Reporting

### Structured stale-diff reporting

Extend `--check` so TreeMark can explain how the current target differs from
the expected generated structure instead of reporting only a binary
current/stale result.

Potential future output:

```text
TreeMark: structure is stale

+ src/auth/session.ts
- src/auth/token.ts
```

Potential uses include:

- Faster diagnosis of stale generated files in CI.
- Clearer human review before regenerating documentation.
- Distinguishing additions, removals, and other structural drift.
- Supporting future automation or policy rules based on the kind of change.
- Providing more actionable --check output than exit code 2 alone.

A robust implementation should prefer structural comparison over attempting
to infer semantic changes from a textual Markdown or ASCII diff.

Open decisions:

- Whether to report files only or directories as well.
- How to represent moves or renames.
- Whether formatting-only differences should be reported separately.
- Whether detailed output is default or enabled by a flag.
- Whether structured results should eventually be available programmatically.
- How drift reporting should interact with Markdown links and synchronized regions.

Status: Deferred post-MVP.

---

## Notes

- `--check` is not listed here while it remains part of the MVP roadmap; it is
  scheduled for a later implementation phase rather than deferred from MVP.
- `--update` is likewise active MVP work and belongs to Phase 6, not this file.
- Items should only be added here when the project has explicitly decided to
  postpone them, not merely because they have not been implemented yet.

---