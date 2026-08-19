# Changelog

All notable changes to TreeMark will be documented in this file.

The format is based on Keep a Changelog, and the project will use Semantic Versioning after its first public release.

## [Unreleased]

#### [nothing]

## [1.0.0] - 2026-08-18

### Added

- Initial MVP product contract.
- TypeScript and ESM repository skeleton.
- CLI executable and argument definitions.
- Strict type checking, linting, tests, and build scripts.
- Cross-platform GitHub Actions CI matrix for Node 22 and Node 24.
- Initial npm package boundary and publication safety guard.
- Renderer-independent `TreeNode` directory model.
- Recursive directory scanning with root validation and maximum-depth support.
- Deterministic folders-first natural sorting and normalized root-relative paths.
- Picomatch-based ignore patterns with default `.git/**` and `node_modules/**` exclusions.
- Explicit path exclusions for scanner-generated trees.
- Safe MVP symlink handling by skipping symbolic links.
- Filesystem traversal error propagation and cross-platform scanner test coverage.
- Markdown nested-list renderer with optional root inclusion.
- ASCII tree renderer with nested branch connectors and optional root inclusion.
- Deterministic renderer newline behavior and non-mutating renderer guarantees.
- Cross-renderer tests confirming Markdown and ASCII output can share the same `TreeNode` hierarchy.
- End-to-end CLI pipeline connecting argument parsing, directory scanning, renderer selection, and stdout output.
- CLI support for Markdown and ASCII format selection, repeatable ignore patterns, maximum depth, and optional root inclusion.
- Standalone file output with `--output`, including the default `structure-map.md` filename and custom output paths.
- Automatic exclusion of in-root output files so generated structure maps do not include themselves.
- Full-file overwrite behavior for generated output artifacts.
- Markdown directory formatting with bold directory labels and destination-relative file links.
- `--no-links` support for plain Markdown file labels.
- Deterministic output-file path handling across Windows, macOS, and Linux.
- CLI and filesystem error normalization with concise user-facing messages and operational exit code `1`.
- Context-specific validation for missing roots, missing output directories, and directory-valued output targets.
- Expanded scanner hardening tests for repeated-scan determinism, file ignores, multiple ignore patterns, symlinked files, outside-root exclusions, and traversal error path context.
- End-to-end file-output coverage for Markdown, ASCII, overwrite behavior, self-exclusion, default and custom filenames, outside-root outputs, deterministic repeated runs, and invalid output targets.
- Canonical TreeMark synchronization markers and generated-content ownership notice.
- Pure marked-section replacement for existing Markdown documents, preserving all content outside the managed region.
- Strict synchronization marker validation requiring exactly one start/end pair in the correct order.
- Full-line marker safety rules requiring markers to be the only non-whitespace content on their lines.
- LF and CRLF-aware marked-region replacement with deterministic newline handling.
- Markdown synchronized-region composition with a generated-content notice.
- ASCII synchronized-region composition using fenced `text` blocks while keeping the ASCII renderer Markdown-unaware.
- Deterministic empty-region and repeated-replacement behavior for synchronized content.
- Focused synchronization tests covering missing, duplicate, reversed, inline, and whitespace-surrounded markers.
- Deferred-feature tracking for intentionally postponed TreeMark capabilities and future safety enhancements.
- End-to-end `--update <file>` synchronization for existing Markdown documents.
- Update-target validation for missing paths and directory-valued targets.
- Automatic exclusion of in-root update targets so synchronized documents do not include themselves.
- Markdown link resolution relative to the update document location, including `--no-links` support.
- Safe Markdown updates using full-document in-memory replacement, same-directory temporary files, and rename-based target replacement.
- Idempotent update behavior that skips rewriting unchanged targets and preserves file modification times.
- Temporary-file cleanup after successful updates and simulated replacement failures.
- Failure-safe update behavior that preserves the original target when marker validation or filesystem replacement fails.
- CLI-level LF and CRLF preservation for synchronized Markdown targets.
- End-to-end synchronization coverage for Markdown, fenced ASCII, cwd-relative update targets, outside-root targets, self-exclusion, idempotence, and invalid update targets.
- Explicit Phase 6 rejection of `--check` so deferred stale-comparison behavior cannot write through either `--output` or `--update`.
- Pure current/stale content comparison primitive for check-mode freshness evaluation.
- Read-only full-file output comparison helper for existing generated artifacts.
- Read-only synchronized-document comparison that reuses the existing `buildUpdatedDocument()` path.
- Exact current/stale comparison semantics shared across output and update check paths.
- Focused Phase 7A unit coverage for matching and stale full-file outputs and synchronized Markdown documents.
- Deferred-feature tracking for future structured stale-diff reporting.
- End-to-end `--check` support for both generated output files and synchronized Markdown targets.
- Check-mode exit-code contract with `0` for current content, `2` for stale content, and `1` for operational or validation failures.
- Read-only `--output --check` comparisons that preserve target contents and modification times.
- Read-only `--update --check` comparisons that reuse the existing synchronization pipeline and never mutate the target.
- Check-mode support for Markdown and ASCII output, including synchronized fenced ASCII regions.
- Check-mode parity for destination-relative Markdown links, `--no-links`, default `structure-map.md` resolution, cwd-relative update targets, in-root self-exclusion, and outside-root targets.
- LF and CRLF parity for synchronized check-mode comparisons.
- Explicit validation that `--check` requires either `--output` or `--update`.
- Process-boundary verification of exit codes `0`, `1`, and `2`.
- Cross-platform path canonicalization for existing check targets to avoid macOS path-alias mismatches during containment and exclusion checks.
- Deterministic repeated check behavior with unchanged contents, unchanged modification times, and clean stdout.
- Expanded end-to-end check-mode coverage for current, stale, invalid, missing, and directory-valued targets.
- E2E test-suite reorganization into focused base CLI, output, update, check, and process-boundary suites.
- Public npm package metadata for the TreeMark homepage, GitHub repository, issue tracker, author, and expanded discovery keywords.
- Phase 8 package-boundary hardening for a CLI-only public artifact, keeping the supported package surface limited to the executable distribution and public documentation.
- Lean production builds that omit TypeScript declaration files, declaration maps, and JavaScript source maps from the published CLI artifact.
- npm tarball inspection confirming the packed package contains only the intended runtime and public-documentation files.
- Manual packed-package verification by installing the generated tarball into an isolated consumer project outside the TreeMark repository.
- Automated packed-package smoke testing with `npm run smoke:package`, covering installation, version/help output, Markdown and ASCII rendering, file output, Markdown synchronization, current/stale checks, and operational failure handling.
- Cross-platform smoke-test subprocess handling that runs npm and the installed TreeMark CLI through their JavaScript entry points instead of relying on Windows `.cmd` shim execution.
- ESLint coverage for Node-based release tooling while preserving strict type-aware linting for the TypeScript application and test code.
- Comprehensive public README documentation for installation, rendering, file output, synchronization, check mode, exit codes, ignore patterns, maximum depth, root inclusion, CLI usage, limitations, development, and project links.
- README marker documentation designed to avoid duplicate live synchronization markers while still providing users with an exact discoverable marker source.
- TreeMark dogfooding in its own README through a live synchronized Project structure section with generated destination-relative file links.
