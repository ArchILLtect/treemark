# Phase 3 — Directory Scanner

Status: **Complete**

## Goal

Build TreeMark's filesystem scanning layer.

Given a valid root directory, TreeMark must produce a deterministic,
renderer-independent tree model representing the directory contents.

This phase does not generate Markdown, ASCII output, mutate documents,
or implement CI freshness checking.

---

## Scope

### 3A — Core Scanner

- Define the shared `TreeNode` model.
- Validate the requested root directory.
- Recursively scan directories using Node filesystem APIs.
- Represent files and directories independently from output formatting.
- Normalize root-relative paths.
- Sort directories before files.
- Apply deterministic natural alphabetical sorting.
- Support maximum traversal depth.

### 3B — Filtering and Hardening

- Support repeatable ignore glob patterns.
- Apply default ignores.
- Skip ignored directories before descending into them.
- Skip symbolic links.
- Support explicit target-file exclusions.
- Handle empty directories.
- Handle filesystem errors cleanly.
- Add comprehensive fixture-based tests.

---

## Proposed Architecture

```text
src/
├── scan/
│   ├── scan-directory.ts
│   ├── sort-entries.ts
│   ├── normalize-relative-path.ts
│   └── should-ignore.ts
└── types.ts
````

Exact file boundaries may change if implementation shows that a smaller
structure is clearer.

---

## Tree Model

```ts
export interface TreeNode {
  name: string;
  relativePath: string;
  type: "file" | "directory";
  children?: TreeNode[];
}
```

The scanner model must not contain:

* Markdown syntax.
* ASCII tree characters.
* Mermaid data.
* HTML markers.
* Link formatting.
* Renderer-specific indentation.

---

## Filesystem Rules

### Root

The requested root:

* Must exist.
* Must be a directory.
* Is depth `0`.
* Uses native filesystem paths internally.

### Relative Paths

Stored `relativePath` values:

* Are relative to the scan root.
* Use `/` separators on every operating system.
* Never expose Windows `\` separators.

Examples:

```text
README.md
guides/setup.md
architecture/decisions/001.md
```

### Symbolic Links

MVP behavior:

* Symbolic links are skipped.
* TreeMark does not follow symlinked directories or files.

This avoids cycles, duplicate traversal, and unexpected traversal outside
the requested root.

---

## Sorting Contract

For every directory:

1. Directories appear before files.
2. Directories are sorted alphabetically.
3. Files are sorted alphabetically.
4. Numeric portions use natural ordering.
5. Case-insensitive equality uses the original value as a deterministic
   tie-breaker.

Representative ordering:

```text
architecture/
guides/
API.md
api.md
guide2.md
guide10.md
```

Filesystem enumeration order must never determine final output order.

---

## Maximum Depth

Depth semantics:

```text
root                  depth 0
direct child          depth 1
grandchild            depth 2
great-grandchild      depth 3
```

Examples:

* `--max-depth 0`: root only.
* `--max-depth 1`: root + direct children.
* `--max-depth 2`: root + children + grandchildren.

Whether the root is later rendered is independent of these traversal
semantics.

---

## Ignore Rules

Ignore patterns use normalized root-relative POSIX-style paths.

Example:

```bash
treemark ./docs \
  --ignore "drafts/**" \
  --ignore "**/*.tmp.md"
```

Initial default ignores:

```text
.git/**
node_modules/**
```

Ignored directories should be rejected before recursion whenever possible.

---

## Explicit Exclusions

The scanner must support explicit paths that should not appear in the result.

This will later allow TreeMark to exclude its own generated output:

```bash
treemark ./docs --output ./docs/docs-map.md
```

so that `docs-map.md` does not include itself.

The scanner should not need to know why a path was excluded.

---

## Error Behavior

Scanner errors must:

* Identify the relevant path.
* Avoid raw stack traces during normal CLI use.
* Abort rather than silently returning an incomplete tree when an unexpected
  filesystem error occurs.

Examples include:

* Root does not exist.
* Root is a file rather than a directory.
* Permission denied while scanning.
* Unexpected filesystem failure.

---

## Test Fixtures

Create fixtures for at least:

```text
test/fixtures/
├── basic-tree/
├── empty-directory/
├── sorting/
├── max-depth/
├── ignored/
└── unusual-names/
```

Symlink fixtures may require platform-aware test setup rather than committed
filesystem fixtures.

---

## Required Tests

### Root Validation

* [x] Existing directory succeeds.
* [x] Missing root fails.
* [x] File supplied as root fails.

### Basic Traversal

* [x] Empty directory produces a valid root node.
* [x] Direct files are discovered.
* [x] Nested directories are discovered.
* [x] Nested files receive correct relative paths.

### Sorting

* [x] Directories appear before files.
* [x] Alphabetical ordering is stable.
* [x] `guide2.md` appears before `guide10.md`.
* [x] Case-tie behavior is deterministic.
* [x] Repeated scans produce identical ordering.

### Paths

* [x] Root-relative paths are correct.
* [x] Stored paths use `/`.
* [x] Behavior is correct on Windows CI.
* [x] Behavior is correct on macOS CI.
* [x] Behavior is correct on Linux CI.

### Maximum Depth

* [x] Depth `0` behaves correctly.
* [x] Depth `1` behaves correctly.
* [x] Depth `2` behaves correctly.
* [x] Entries beyond maximum depth are not traversed.

### Ignore Patterns
* [x] Single ignored file is excluded.
* [x] Single ignored directory is excluded.
* [x] Multiple patterns work together.
* [x] Glob patterns operate on normalized paths.
* [x] `.git` is ignored by default.
* [x] `node_modules` is ignored by default.

### Symlinks
* [x] Symlinked file is skipped.
* [x] Symlinked directory is not traversed.
* [x] Symlink behavior cannot cause traversal cycles.

### Explicit Exclusions
* [x] Explicitly excluded file does not appear.
* [x] Exclusion outside the root has no unintended effect.

### Errors
* [x] Unexpected filesystem failure aborts the scan.
* [x] Errors identify the relevant path.

---

## Implementation Checklist

### 3A — Core

* [x] Add `TreeNode` type.
* [x] Add scanner options type.
* [x] Implement root validation.
* [x] Implement basic recursive traversal.
* [x] Normalize relative paths.
* [x] Implement folders-first sorting.
* [x] Implement deterministic natural sorting.
* [x] Implement maximum depth.
* [x] Add core scanner fixtures.
* [x] Add core tests.
* [x] Run `npm run check`.

### 3B — Filtering / Hardening

* [x] Add Picomatch-based ignore handling.
* [x] Add default ignores.
* [x] Prune ignored directories before recursion.
* [x] Skip symlinks.
* [x] Add explicit exclusion support.
* [x] Add filtering fixtures/tests.
* [x] Add filesystem error tests.
* [x] Verify all OS/Node CI jobs.
* [x] Review code for renderer leakage.
* [x] Run final `npm run check`.

---

## Definition of Done

Phase 3 is complete when:

1. A real directory can be converted into a `TreeNode` hierarchy.
2. Results are deterministic.
3. Directory-first natural sorting works.
4. Paths are platform-independent internally.
5. Maximum depth works.
6. Ignore patterns work.
7. Symlinks are safely skipped.
8. Explicit exclusions work.
9. Invalid roots and filesystem failures produce clean failures.
10. Unit and fixture tests pass.
11. All GitHub Actions matrix jobs pass.
12. `git status` is clean after the final commit.

---

## Deferred / Follow-up

Do not implement during Phase 3:

* Markdown rendering.
* ASCII rendering.
* Link generation.
* `--output` writing behavior.
* README marker parsing.
* README mutation.
* `--check` comparison.
* Mermaid.
* Configuration files.
* `.gitignore` import.
* Symlink traversal.
* Watch mode.

Any newly discovered feature should be recorded here instead of automatically
expanding Phase 3 scope.