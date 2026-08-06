# TreeMark

> Generate and synchronize Markdown-friendly directory trees.

TreeMark is currently in pre-release development. Publishing is intentionally disabled while the MVP contract and package identity are finalized.

## Current milestone

Phases 1 and 2:

- Product contract locked.
- TypeScript/ESM package skeleton.
- Executable CLI entry point.
- Strict type checking.
- Vitest test setup.
- ESLint flat configuration.
- Cross-platform GitHub Actions matrix.
- npm package boundary defined.

The current CLI validates and prints parsed arguments. Directory scanning begins in Phase 3.

## Requirements

- Node.js 22 or newer.
- npm.

## Setup

```bash
npm install
npm run check
```

The first `npm install` creates `package-lock.json`. Commit that file, then change the CI install command from `npm install` to `npm ci`.

## Try the development CLI

```bash
npm run build
node dist/cli.js ./docs
node dist/cli.js --help
```

After linking locally:

```bash
npm link
treemark ./docs
```

Remove the global link later with:

```bash
npm unlink --global treemark
```

## Planned MVP usage

```bash
treemark ./docs
treemark ./docs --format ascii
treemark ./docs --output docs/docs-map.md
treemark ./docs --update README.md
treemark ./docs --update README.md --check
```

## Product contract

See [`docs/PRODUCT_CONTRACT.md`](docs/PRODUCT_CONTRACT.md).

## Publishing safety

`package.json` currently contains:

```json
{
  "private": true,
  "version": "0.0.0-development"
}
```

Do not remove `private` until the final npm package name, scope, metadata, tarball contents, and release workflow have been reviewed.

## License

MIT
