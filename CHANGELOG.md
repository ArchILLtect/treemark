# Changelog

All notable changes to TreeMark will be documented in this file.

The format is based on Keep a Changelog, and the project will use Semantic Versioning after its first public release.

## [Unreleased]

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