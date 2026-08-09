# Phase 4 — Renderers

Status: **Complete**

## Goal

Build TreeMark's first output-rendering layer.

Given a renderer-independent `TreeNode` hierarchy from Phase 3, TreeMark must be able to convert that structure into deterministic, Markdown-friendly directory maps without reading the filesystem itself.

Phase 4 introduces the two MVP renderers:

1. Markdown nested-list output.
2. ASCII tree output.

This phase does not write output files, mutate README files, implement marker synchronization, or perform CI freshness checks.

---

## Scope

### 4A — Markdown Renderer

- Define a renderer-facing options type if needed.
- Render a `TreeNode` hierarchy as a Markdown nested list.
- Preserve scanner ordering exactly.
- Represent files and directories consistently.
- Support nested indentation.
- Decide and lock root-node rendering behavior.
- Handle empty directories.
- Produce deterministic newline behavior.
- Add focused renderer unit tests.

### 4B — ASCII Renderer / Hardening

- Render a `TreeNode` hierarchy using conventional ASCII tree connectors.
- Preserve scanner ordering exactly.
- Render nested branches correctly.
- Distinguish intermediate and final siblings.
- Handle files and directories consistently.
- Handle empty directories.
- Verify renderers do not mutate the input tree.
- Add cross-renderer fixture tests.
- Run the full local and CI verification gates.

---

## Proposed Architecture

```text
src/
├── render/
│   ├── render-markdown.ts
│   └── render-ascii.ts
├── scan/
│   └── ...
└── types.ts
```

If a tiny shared renderer helper becomes clearly useful, it may be added under:

```text
src/render/
```

Do not introduce a generalized renderer framework unless the two MVP renderers actually demonstrate a need for one.

---

## Renderer Boundary

Renderers receive an already-built `TreeNode`.

They must not:

- Read directories.
- Call filesystem traversal APIs.
- Apply ignore rules.
- Resolve symlinks.
- Re-sort scanner output.
- Recalculate maximum depth.
- Decide which paths should be excluded.
- Mutate the input tree.

The intended flow is:

```text
filesystem
    ↓
scanner
    ↓
TreeNode hierarchy
    ↓
renderer
    ↓
string
```

The scanner owns structure.

The renderer owns presentation.

---

## Shared Rendering Contract

All MVP renderers must:

1. Accept a `TreeNode` hierarchy.
2. Return a string.
3. Preserve the order already present in `children`.
4. Produce deterministic output for the same input tree.
5. Use normalized node names/paths only as data.
6. Avoid filesystem access.
7. Avoid mutating `TreeNode` objects.
8. Handle an empty root without throwing.
9. Use predictable newline behavior.
10. Remain independent from future file-writing and README-sync behavior.

---

## Root Rendering

Phase 3 intentionally kept root traversal semantics independent from output formatting.

Phase 4 must explicitly lock whether the root node itself appears in rendered output.

The decision should be applied consistently where appropriate and covered by tests.

Example input:

```text
docs/
├── architecture/
│   └── overview.md
└── getting-started.md
```

Possible Markdown rendering if the root is included:

```md
- docs/
  - architecture/
    - overview.md
  - getting-started.md
```

Possible Markdown rendering if the root is omitted:

```md
- architecture/
  - overview.md
- getting-started.md
```

Do not leave this behavior accidental.

---

## Markdown Renderer Contract

The default TreeMark renderer is Markdown.

Initial MVP style:

```md
- architecture/
  - overview.md
- guides/
  - install.md
  - usage.md
- getting-started.md
```

Rules:

- Use Markdown unordered-list syntax.
- Use consistent indentation per nesting level.
- Preserve directory/file ordering from the scanner.
- Directory names should be visually distinguishable from files.
- Do not add Markdown headings automatically.
- Do not add code fences automatically.
- Do not add README markers.
- Do not add links during Phase 4.
- Do not include renderer-specific information in `TreeNode`.

The renderer should produce only the tree body.

---

## ASCII Renderer Contract

ASCII output should use a conventional tree representation.

Representative output:

```text
architecture/
└── overview.md
guides/
├── install.md
└── usage.md
getting-started.md
```

For nested structures, connectors must reflect whether a node has later siblings.

Representative deeper output:

```text
architecture/
└── decisions/
    ├── 001.md
    └── 002.md
guides/
└── setup.md
```

Rules:

- Use stable tree connector characters.
- Preserve scanner ordering.
- Correctly distinguish `├──` from `└──`.
- Preserve ancestor continuation bars where necessary.
- Do not use filesystem paths to determine indentation.
- Do not add headings, code fences, or explanatory prose.
- Return only the rendered tree body.

---

## Directory Display

For MVP clarity, directory nodes should be visually distinguishable from files.

The initial convention should be:

```text
directory-name/
file-name.md
```

The trailing `/` is renderer output only.

It must not be written back into:

```ts
TreeNode.name
```

or:

```ts
TreeNode.relativePath
```

---

## Empty Directories

Empty directories remain valid directory nodes.

A renderer must not fail simply because:

```ts
children: []
```

The directory itself should still be representable when it appears in the rendered tree.

Example:

```md
- empty-directory/
```

or:

```text
empty-directory/
```

depending on renderer.

---

## Determinism

Renderer output must be byte-for-byte stable for the same input tree.

Renderers must not:

- Re-sort entries.
- Depend on object iteration accidents.
- Add timestamps.
- Add environment-dependent separators.
- Add platform-specific line content.

Repeated calls with the same `TreeNode` must return identical strings.

---

## Newline Rules

Renderer output should use predictable line-oriented output.

During implementation, lock and test:

- Whether the returned string ends with one trailing newline.
- Whether empty output is `""` or another explicit representation.
- Whether internal lines always use `\n`.

The same policy should be used consistently across renderers unless a format requires otherwise.

---

## Test Strategy

Renderer tests should primarily use synthetic `TreeNode` objects rather than filesystem fixtures.

This keeps renderer tests independent from Phase 3 and proves that renderers operate only on the shared model.

A representative synthetic tree should include:

```text
root/
├── architecture/
│   └── overview.md
├── guides/
│   ├── install.md
│   └── usage.md
└── getting-started.md
```

Additional cases should cover:

- Empty root.
- Empty nested directory.
- Single child.
- Multiple siblings.
- Deep nesting.
- Directory followed by file.
- File names with spaces or punctuation.
- Repeated renders of the same tree.

---

## Required Tests

### Markdown Renderer

* [x] Root rendering behavior is explicit.
* [x] Direct files render correctly.
* [x] Direct directories render correctly.
* [x] Nested directories use correct indentation.
* [x] Nested files render correctly.
* [x] Directory names use the chosen visual convention.
* [x] Empty directories render correctly.
* [x] Scanner child ordering is preserved.
* [x] Output is deterministic.
* [x] Newline behavior is deterministic.

### ASCII Renderer

* [x] Root rendering behavior is explicit.
* [x] Direct files render correctly.
* [x] Direct directories render correctly.
* [x] Intermediate siblings use `├──`.
* [x] Final siblings use `└──`.
* [x] Deep nesting preserves ancestor branch guides.
* [x] Empty directories render correctly.
* [x] Scanner child ordering is preserved.
* [x] Output is deterministic.
* [x] Newline behavior is deterministic.

### Renderer Isolation

* [x] Renderers do not access the filesystem.
* [x] Renderers do not apply ignore/exclusion logic.
* [x] Renderers do not sort or reorder children.
* [x] Renderers do not mutate the input `TreeNode`.
* [x] Markdown-specific syntax does not leak into the scanner/model.
* [x] ASCII-specific syntax does not leak into the scanner/model.

### Cross-Renderer

* [x] The same `TreeNode` can be rendered as Markdown.
* [x] The same `TreeNode` can be rendered as ASCII.
* [x] Both renderers represent the same hierarchy.
* [x] Renderer selection does not alter the input tree.

---

## Implementation Checklist

### 4A — Markdown Renderer

* [x] Lock root-node rendering behavior.
* [x] Lock newline behavior.
* [x] Add Markdown renderer file.
* [x] Implement directory display convention.
* [x] Implement nested-list rendering.
* [x] Handle empty directories.
* [x] Add synthetic renderer fixtures/helpers if useful.
* [x] Add Markdown renderer tests.
* [x] Verify input tree is not mutated.
* [x] Run `npm run check`.

### 4B — ASCII Renderer / Hardening

* [x] Add ASCII renderer file.
* [x] Implement sibling connector selection.
* [x] Implement nested branch-prefix handling.
* [x] Handle empty directories.
* [x] Add ASCII renderer tests.
* [x] Add cross-renderer tests.
* [x] Verify scanner ordering is preserved.
* [x] Verify renderer/model separation.
* [x] Verify all OS/Node CI jobs.
* [x] Run final `npm run check`.

---

## Definition of Done

Phase 4 is complete when:

1. A `TreeNode` can be rendered as Markdown.
2. A `TreeNode` can be rendered as ASCII.
3. Rendering requires no filesystem access.
4. Scanner ordering is preserved exactly.
5. Directory presentation is renderer-owned.
6. Empty directories render correctly.
7. Nested indentation/connectors are correct.
8. Output is deterministic.
9. Renderers do not mutate the input tree.
10. Renderer-specific concerns do not leak into the scanner/model.
11. Unit tests pass.
12. All GitHub Actions matrix jobs pass.
13. `git status` is clean after the final commit.

---

## Deferred / Follow-up

Do not implement during Phase 4:

- File output behavior.
- `--output`.
- README marker parsing.
- README mutation.
- `--update`.
- `--check`.
- Link generation.
- Mermaid.
- SVG.
- HTML.
- Configuration files.
- `.gitignore` import.
- Symlink inclusion/following.
- Watch mode.

Any newly discovered rendering feature should be recorded here instead of automatically expanding Phase 4 scope.
