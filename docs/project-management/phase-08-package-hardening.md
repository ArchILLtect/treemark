# Phase 8 — Package Hardening

Status: **Complete**

## Goal

Prepare TreeMark for safe, predictable npm publication by hardening the public
package boundary, validating packed-artifact behavior, tightening public
documentation, and confirming release readiness before Phase 9 publication.

Phase 8 is the final pre-publication quality gate.

The focus is not new end-user functionality. The focus is ensuring that the
package users install is intentional, minimal, documented, executable, and
consistent with the already-completed MVP behavior.

---

## Core Contract

Phase 8 should answer:

> "If TreeMark were packed for npm right now, would the resulting package be
> complete, minimal, installable, executable, documented, and safe to publish?"

Hardening flow:

```text
inspect package metadata
→ lock public package boundary
→ build
→ pack
→ inspect tarball contents
→ install packed artifact in isolation
→ smoke-test CLI behavior
→ review public docs
→ verify publication guards
→ final release-readiness review
```

Rules:

- Do not add new product features during Phase 8.
- Existing MVP behavior from Phases 1–7 remains the source of truth.
- The packed npm artifact, not the repository working tree, is the object under
  test.
- Development-only files should not leak into the public package unless there
  is a deliberate reason.
- Public package metadata must be accurate and publication-ready.
- TreeMark must execute correctly after installation from its packed tarball.
- Phase 9 should begin only after the package boundary is intentionally locked.

---

## Scope

### 8A — Package Metadata and Public Boundary

Review and harden `package.json` and related package-level metadata.

Areas to verify:

- Package name.
- Description.
- Version strategy before first publication.
- `type`.
- `bin`.
- `files`.
- `main` / `exports` only if actually needed.
- `engines`.
- `license`.
- `repository`.
- `bugs` / issue tracker metadata if appropriate.
- `homepage` if appropriate.
- Keywords.
- Author metadata if desired.
- Build and verification scripts.
- Publication-safety fields and guards.
- Whether `private` should remain enabled until Phase 9.
- Whether any lifecycle scripts are needed or should explicitly be avoided.

The package boundary should expose only what the MVP intends to publish.

### 8B — npm Pack Inspection

Build TreeMark and create a local npm package tarball.

Inspect:

- Exact files included.
- Exact files excluded.
- Compiled CLI entry point.
- Shebang preservation.
- Package metadata inside the tarball.
- README inclusion.
- License inclusion.
- Source maps or declaration files, if present and intentionally public.
- Accidental inclusion of project-management docs, test files, local artifacts,
  caches, temporary files, screenshots, or unrelated repository content.
- Package size and obvious bloat.

Use the packed artifact as the authoritative preview of what npm users would
receive.

### 8C — Packed-Package Installation and Smoke Tests

Install the generated `.tgz` into a clean temporary consumer project.

Verify:

- Installation succeeds.
- The `treemark` executable is available from the installed package.
- `treemark --version` executes successfully.
- `treemark --help` executes successfully.
- Basic Markdown stdout generation works.
- ASCII stdout generation works.
- `--output` works from the installed package.
- `--update` works from the installed package.
- `--check` returns the expected current/stale exit semantics from the installed
  package.
- No runtime dependency is accidentally available only because the repository
  development environment contains it.
- The installed CLI does not depend on repository-relative paths.

The smoke test should validate the package as a consumer sees it, not merely
the source repository.

### 8D — Public README and Documentation Hardening

Review the README and other public-facing package documentation from the
perspective of a first-time npm user.

Recommended README coverage:

- What TreeMark does.
- Installation.
- Quick-start command.
- Basic stdout usage.
- Markdown and ASCII formats.
- `--output`.
- `--update`.
- Synchronization markers.
- Generated-content ownership warning.
- `--check`.
- Exit codes `0`, `1`, and `2`.
- `--no-links`.
- Ignore patterns.
- Maximum depth.
- Root inclusion.
- Safe update expectations.
- Recommendation to review the file or Git diff after `--update`.
- Cross-platform support expectations.
- Node version requirement.
- Current MVP limitations where users are likely to encounter them.
- License.
- Link to repository / issues if appropriate.

README examples should match the actual CLI exactly.

Do not document deferred features as if they already exist.

### 8E — Release-Readiness Review

Perform a final pre-publication audit.

Review:

- Package name and npm naming availability status if not already confirmed.
- Version intended for first release.
- Repository state.
- Package contents.
- README accuracy.
- License.
- CLI help text.
- Version output.
- Public-facing error behavior.
- CI matrix.
- Local `npm run check`.
- Packed-package smoke tests.
- Changelog.
- Git status.
- Publication guard state.

Phase 8 should end with TreeMark ready for Phase 9, but still unpublished.

---

## Package-Boundary Decisions to Lock

Before implementation is considered complete, explicitly decide:

### Public files

Which repository files should npm users receive?

Expected categories may include:

```text
dist/
README.md
LICENSE
package.json
```

Anything else should be intentional.

### Source publication

Decide whether TypeScript source files under `src/` should ship in the npm
package.

MVP default recommendation:

```text
ship compiled runtime artifacts
do not ship tests/project-management files
```

Source inclusion is optional and should be a deliberate package-policy choice.

### Type declarations

TreeMark is currently a CLI-first package.

If no public programmatic API is exposed, TypeScript declaration files are not
required merely because the implementation is written in TypeScript.

Do not create a public API accidentally during package hardening.

### Publication safety

Lock the sequence for removing or changing any publication guard.

Recommended principle:

```text
Phase 8
→ keep publication blocked while inspecting and testing

Phase 9
→ intentionally remove/adjust the guard immediately before publication
```

---

## Required Verification

### Package Metadata

* [x] Package name is intentional and publication-ready.
* [x] Package description is accurate.
* [x] `bin` points to the compiled CLI entry point.
* [x] Node engine requirement matches the supported CI/runtime contract.
* [x] License metadata matches the actual repository license.
* [x] Repository metadata is correct.
* [x] Keywords are reasonable and not misleading.
* [x] Development-only metadata does not leak into the public contract.
* [x] Publication guard behavior is understood and documented for Phase 9.

### Public project URLs

TreeMark will use:

- Homepage: `https://nickhanson.me/projects/treemark`
- Repository: GitHub repository URL
- Issues: GitHub Issues URL

The homepage URL is part of the public package metadata and may be published
before the landing page is live. Phase 10 will implement the landing page
immediately after npm publication.

The homepage route is an MVP requirement.

### Packed Artifact

* [x] `npm pack` succeeds.
* [x] Tarball contains the compiled CLI.
* [x] Tarball contains README.
* [x] Tarball contains license.
* [x] Tarball contains correct package metadata.
* [x] Tests are excluded unless intentionally shipped.
* [x] Project-management docs are excluded unless intentionally shipped.
* [x] Local/temp/build-trash files are excluded.
* [x] No required runtime file is missing.
* [x] Tarball contents are intentionally minimal.
* [x] Package size is reasonable for the MVP.

### Installed-Package Smoke Test

* [x] Packed tarball installs into a clean temporary project.
* [x] Installed `treemark` executable resolves correctly.
* [x] `treemark --version` works.
* [x] `treemark --help` works.
* [x] Markdown stdout generation works.
* [x] ASCII stdout generation works.
* [x] `--output` works.
* [x] `--update` works.
* [x] `--check` current result exits `0`.
* [x] `--check` stale result exits `2`.
* [x] Operational CLI failure exits `1`.
* [x] Installed package does not rely on repository-only dependencies or paths.

### Public Documentation

* [x] README explains TreeMark's purpose clearly.
* [x] Installation instructions are correct.
* [x] Quick-start example is correct.
* [x] `--output` is documented.
* [x] `--update` is documented.
* [x] Marker syntax is documented exactly.
* [x] Generated-content ownership behavior is documented.
* [x] `--check` is documented.
* [x] Exit codes `0`, `1`, and `2` are documented.
* [x] Markdown/ASCII formats are documented.
* [x] `--no-links` is documented.
* [x] Ignore patterns are documented.
* [x] Maximum depth is documented.
* [x] Root inclusion is documented.
* [x] Safe-update review guidance is documented.
* [x] Node version requirement is documented.
* [x] MVP limitations are not misrepresented.
* [x] README commands match actual CLI help.

### Release Readiness

* [x] `npm run check` passes.
* [x] Packed-package smoke tests pass.
* [x] Full GitHub Actions Node/OS matrix passes.
* [x] Changelog reflects Phase 8 hardening.
* [x] Package metadata has received a final review.
* [x] Packed artifact has received a final review.
* [x] README has received a final user-facing review.
* [x] Publication remains intentionally blocked until Phase 9.
* [x] `git status` is clean after the final Phase 8 commit.

---

## Implementation Checklist

### 8A — Metadata / Boundary

* [x] Review current `package.json`.
* [x] Review current npm/package publication guards.
* [x] Lock public package-file boundary.
* [x] Update package metadata as needed.
* [x] Add package homepage:
  `https://nickhanson.me/projects/treemark`.
* [x] Review `bin` and compiled CLI entry point.
* [x] Review Node engine requirement.
* [x] Review license/repository/keywords metadata.
* [x] Review package scripts for publication safety.
* [x] Run `npm run check`.

### 8B — Pack Inspection

* [x] Build the package.
* [x] Run `npm pack` or equivalent dry-run inspection.
* [x] Record tarball file list.
* [x] Verify expected files are present.
* [x] Verify development-only files are absent.
* [x] Verify compiled CLI shebang/entry behavior.
* [x] Review tarball size.
* [x] Adjust package boundary if needed.
* [x] Repeat pack inspection after changes.

### 8C — Packed Consumer Smoke Test

* [x] Create isolated temporary consumer project.
* [x] Install packed `.tgz`.
* [x] Verify executable resolution.
* [x] Verify `--version`.
* [x] Verify `--help`.
* [x] Smoke-test Markdown stdout.
* [x] Smoke-test ASCII stdout.
* [x] Smoke-test `--output`.
* [x] Smoke-test `--update`.
* [x] Smoke-test `--check` current behavior.
* [x] Smoke-test `--check` stale behavior.
* [x] Smoke-test operational exit `1`.
* [x] Verify no repository-only dependency leakage.
* [x] Decide whether the smoke flow should become an automated repository test.

### 8D — README / Public Docs

* [x] Review README from a new-user perspective.
* [x] Update installation instructions.
* [x] Update quick start.
* [x] Document output modes.
* [x] Document synchronization markers and ownership behavior.
* [x] Document safe `--update` workflow.
* [x] Document `--check` and exit codes.
* [x] Document relevant CLI options.
* [x] Document Node support.
* [x] Review limitations/deferred-feature wording.
* [x] Compare README examples against `treemark --help`.
* [x] Review repository links/contact paths.

### 8E — Final Readiness

* [x] Review package metadata one final time.
* [x] Review packed artifact one final time.
* [x] Review installed-package smoke results.
* [x] Review README one final time.
* [x] Update CHANGELOG.md.
* [x] Run final `npm run check`.
* [x] Verify all OS/Node CI jobs.
* [x] Verify publication remains blocked until Phase 9.
* [x] Confirm `git status` is clean.
* [x] Mark Phase 8 complete.

---

## Definition of Done

Phase 8 is complete when:

1. The npm package boundary is explicitly defined and intentionally minimal.
2. Package metadata is accurate and ready for first publication.
3. The compiled TreeMark CLI is correctly exposed through the package `bin`
   entry.
4. `npm pack` succeeds and the tarball contains all required runtime/public
   files.
5. The tarball does not unintentionally contain tests, project-management docs,
   local artifacts, or unrelated repository files.
6. The packed tarball installs successfully into a clean consumer project.
7. The installed `treemark` executable works independently of the source repo.
8. Installed-package smoke tests cover help/version, stdout generation,
   `--output`, `--update`, and `--check`.
9. Installed check-mode exit codes behave as `0` current, `1` operational
   failure, and `2` stale.
10. Public README documentation matches the actual CLI and MVP behavior.
11. Node support, license, and repository metadata are documented accurately.
12. Publication remains intentionally blocked until Phase 9.
13. `npm run check` passes.
14. All GitHub Actions matrix jobs pass.
15. The changelog reflects Phase 8 hardening.
16. `git status` is clean after the final Phase 8 commit.

---

## Deferred / Follow-up

Do not introduce these during Phase 8 unless they are required to fix a package
correctness problem:

- New renderers.
- New synchronization capabilities.
- Automatic marker insertion.
- Multiple named marker regions.
- Custom marker strings.
- Watch mode.
- Automatic Git-hook installation.
- Configuration files.
- `.gitignore` import.
- Symlink traversal.
- Plugin architecture.
- Public programmatic API.
- Structured stale-diff reporting.
- Snapshot/history features.
- Backup rotation.
- Release automation beyond what is necessary for the first safe publication.

Any newly discovered post-MVP package enhancement should be recorded in
`DEFERRED_FEATURES.md` rather than expanding Phase 8 automatically.
