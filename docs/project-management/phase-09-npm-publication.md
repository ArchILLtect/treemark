# Phase 9 — npm Publication

Status: **In Progress — published and verified; final CI/closure checks remain**

## Goal

Publish TreeMark v1.0.0 to the npm public registry deliberately, verify the registry-hosted package independently of the repository, and leave behind a clean, traceable first-release state.

Phase 9 is the release phase. Phase 8 proved that the package is ready to publish; Phase 9 turns that verified artifact into the first public TreeMark release.

---

## Core Contract

Phase 9 should answer:

> "Can a developer discover TreeMark on npm, install v1.0.0 by package name,
> run the CLI successfully, and trace that release back to a clean repository
> state?"

Release flow:

```text
registry/auth preflight
→ lock v1.0.0 metadata
→ remove publication guard
→ final package verification
→ release commit
→ CI verification
→ publish to npm
→ verify npm registry/package page
→ create signed v1.0.0 tag
→ create GitHub Release
→ install from registry in isolation
→ final repository/release verification
```

Rules:

- Publish TreeMark as **v1.0.0**.
- Do not add new product functionality during Phase 9.
- Phase 8's packed-artifact behavior remains the release baseline.
- Treat the npm registry copy as the authoritative post-publish artifact.
- Do not publish until package name, account/authentication, metadata, and tarball contents have been rechecked.
- A published `name@version` is immutable; corrections require a new version.
- Keep the first release reproducible and traceable from Git.
- Do not begin Phase 10 until the npm-hosted package has been independently installed and verified.

---

## Scope

### 9A — Registry and Account Preflight

Verify the live npm publishing environment before changing release metadata.

Verify:

- npm account exists and is accessible.
- CLI is authenticated to the intended npm account.
- Active npm registry is the public npm registry.
- `@nickhansonsr/treemark` is available for publication under the intended npm scope.
- The intended package owner/account is correct.
- Publishing authentication requirements are satisfied.
- No unexpected `.npmrc` setting redirects publication to another registry.
- Current local npm version is known.
- Public package visibility is understood.

No publication occurs in 9A.

Integration note:
`treemark` was unused but npm rejected it as too similar to `remark`; `treemark-cli` was then rejected as too similar to `remark-cli`. The final registry name is the scoped package `@nickhansonsr/treemark`.

### 9B — v1.0.0 Release Metadata

Prepare the exact first-release metadata.

Lock:

```json
{
  "name": "@nickhansonsr/treemark",
  "version": "1.0.0"
}
```

Release changes:

- Change version from `0.0.0-development` to `1.0.0`.
- Remove `"private": true`.
- Keep the package scoped to `@nickhansonsr` and public.
- Reconfirm description, author, license, repository, bugs, homepage, keywords, `engines`, `type`, `bin`, and `files`.
- Ensure the README header asset and marker screenshots used by the public README are included by the package boundary.
- Update `package-lock.json` so its package metadata matches v1.0.0.
- Update the changelog/release heading as appropriate for the first release.
- Do not add `main` or `exports` merely for publication; TreeMark remains a CLI-first package with no supported public programmatic API.

### 9C — Final v1.0.0 Artifact Gate

Run the complete release candidate through the same gates that passed in Phase 8, now with final v1.0.0 metadata.

Verify:

- `npm run check` passes.
- `npm run smoke:package` passes.
- `npm publish --dry-run` succeeds.
- Final publish preview contains only intentional files.
- `dist/cli.js` exists and retains its executable shebang.
- README, LICENSE, package metadata, and README image assets are present.
- Development source, tests, project-management docs, maps, declarations, temporary files, and unrelated artifacts remain excluded.
- Version shown by the packed CLI is `1.0.0`.
- Package size remains reasonable.
- Git diff contains only intentional release changes.

### 9D — Release Commit and CI Gate

Create the repository state that corresponds exactly to the first public release.

Recommended sequence:

1. Stage the v1.0.0 release metadata/docs changes.
2. Commit with an explicit release message.
3. Confirm the release commit is signed/verified under the repository's signing policy.
4. Push the release commit.
5. Confirm the full GitHub Actions Node/OS matrix passes for the release commit.
6. Confirm the working tree is clean.

Do not create the `v1.0.0` tag yet.

The release tag will be created only after npm publication succeeds and the registry-hosted package has been verified.

The final release state was reached through a small sequence of release-prep commits as registry naming was corrected before publication. The final scoped-package release commit was signed and pushed before publication.

Do not rewrite earlier history as part of the release.

### 9E — npm Publication

Publish only after 9A–9D pass.

For the scoped public package, publication is performed from the package root with `npm publish --access=public`.

Before confirming publication:

- Confirm current directory is the TreeMark repository root.
- Confirm package name is `@nickhansonsr/treemark`.
- Confirm version is `1.0.0`.
- Confirm Git status is clean.
- Confirm the release commit is pushed and CI is green.
- Confirm final dry-run contents one last time.

Then publish v1.0.0 with `npm publish --access=public`.

Publication record:

- Package: `@nickhansonsr/treemark@1.0.0`.
- Published successfully on 2026-08-19.
- npm publication timestamp: `2026-08-19T21:38:37.849Z`.
- npm package page: https://www.npmjs.com/package/@nickhansonsr/treemark
- npm CLI reported successful publication with public access and the `latest` tag.

### 9F — Registry and Consumer Verification

Do not consider publication complete merely because `npm publish` exits successfully.

Verify the live registry result:

- `@nickhansonsr/treemark@1.0.0` resolves from npm.
- npm package page exists and is public.
- npm page renders the intended README and branding.
- Description, license, repository, homepage, issue tracker, version, Node requirement, and install command are correct.
- Published tarball contents match expectations.
- `latest` resolves to v1.0.0.
- No accidental package files are visible.

After `@nickhansonsr/treemark@1.0.0` is confirmed live and correct on npm:

1. Create an annotated signed Git tag:

  ```text
  v1.0.0
  ```
2. Verify the tag points to the exact release commit that produced the npm publication.
3. Verify the tag signature.
4. Push the `v1.0.0` tag to GitHub.
5. Create a GitHub Release from that tag titled:

  ```text
  TreeMark v1.0.0
  ```
6. Add concise release notes summarizing the first public TreeMark release.
7. Verify the GitHub Release is publicly visible and associated with the correct tag/commit.

GitHub Packages is not used for the TreeMark v1.0.0 release. npm is the package registry; GitHub Releases provides the repository-facing release record.

Then test as a real consumer using the registry rather than the local tarball.

Create a clean temporary consumer environment and verify:

```text
install @nickhansonsr/treemark from npm
→ treemark --version
→ treemark --help
→ Markdown stdout
→ ASCII stdout
→ --output
→ --update
→ --check current = 0
→ --check stale = 2
→ operational failure = 1
```

Also verify a global registry install:

```bash
npm install --global @nickhansonsr/treemark
```

and confirm:

```bash
treemark --version
```

reports:

```text
1.0.0
```

The global install was verified successfully. On the release machine, npm's global prefix directory had to be added to the Windows user `PATH` before the globally installed `treemark` command was discoverable; the package installation and npm-generated command shims themselves were correct.

### 9G — First-Release Closure

After registry verification:

- Confirm Git status is clean.
- Confirm release commit/tag remain present remotely.
- Confirm CI remains green for the final release state.
- Confirm changelog represents the released version correctly.
- Record the npm package URL in project documentation.
- Mark Phase 9 complete.
- Move immediately to Phase 10 — TreeMark landing page.

README-only or branding corrections made after publication require a new
package version before npm's package page will receive the updated README.

---

## Required Verification

### Registry / Account

* [x] npm CLI is authenticated to the intended account.
* [x] Active npm registry is correct.
* [x] `@nickhansonsr/treemark` scoped package availability is confirmed immediately before publication.
* [x] Intended package ownership is confirmed.
* [x] Publishing authentication requirements are satisfied.
* [x] Local npm configuration does not unexpectedly redirect publication.

### v1.0.0 Metadata

* [x] `package.json` version is `1.0.0`.
* [x] `package-lock.json` package metadata matches `1.0.0`.
* [x] `"private": true` has been intentionally removed.
* [x] Package is a public CLI package scoped to `@nickhansonsr`.
* [x] `bin` still points to `dist/cli.js`.
* [x] Node engine requirement remains `>=22`.
* [x] License is MIT and matches `LICENSE`.
* [x] Repository URL is correct.
* [x] Issues URL is correct.
* [x] Homepage is `https://nickhanson.me/projects/treemark`.
* [x] README branding assets referenced by the README are included.
* [x] Public package boundary remains intentional.
* [x] No unsupported programmatic API is implied.

### Release Candidate

* [x] `npm run check` passes.
* [x] All 161+ tests pass.
* [x] `npm run smoke:package` passes all smoke steps.
* [x] `npm publish --access public --dry-run` succeeds.
* [x] Dry-run file list is intentionally minimal.
* [x] `dist/cli.js` shebang/entry is correct.
* [x] CLI reports version `1.0.0`.
* [x] README renders correctly from the release candidate.
* [x] Final Git diff contains only intended release changes.

### Git Release State

* [x] Release commit created.
* [x] Release commit is signed/verified.
* [x] Release commit pushed.
* [ ] Full GitHub Actions Node 22/24 × Windows/macOS/Ubuntu matrix is confirmed green for the final scoped-package release state.
* [x] Working tree is clean immediately before publication.
* [x] npm publication succeeds before the release tag is created.
* [x] Annotated signed `v1.0.0` tag created after npm verification.
* [x] Tag points to the intended release commit.
* [x] Tag signature is verified.
* [x] Release tag pushed.
* [x] GitHub Release `TreeMark v1.0.0` created from the `v1.0.0` tag.
* [x] GitHub Release points to the intended release commit.

### npm Publication

* [x] Final package name/version rechecked immediately before publish.
* [x] Final dry-run reviewed.
* [x] `npm publish --access=public` succeeds.
* [x] Registry reports `@nickhansonsr/treemark@1.0.0`.
* [x] `latest` points to `1.0.0`.
* [x] Package page is publicly accessible.
* [x] npm README/banner renders correctly.
* [x] npm metadata is correct.
* [x] Published package contents are correct.

### Registry Consumer Test

* [x] Fresh consumer installs `@nickhansonsr/treemark` from the npm registry.
* [x] Registry-installed `treemark --version` reports `1.0.0`.
* [x] Registry-installed `treemark --help` works.
* [x] Markdown stdout works.
* [x] ASCII stdout works.
* [x] `--output` works.
* [x] `--update` works.
* [x] Current `--check` exits `0`.
* [x] Stale `--check` exits `2`.
* [x] Operational failure exits `1`.
* [x] Global `npm install --global @nickhansonsr/treemark` succeeds.
* [x] Globally installed `treemark --version` reports `1.0.0`.
* [x] Globally installed `treemark --help` works.

### Closure

* [ ] Git status is clean after pulling the final Phase 9 documentation update.
* [x] Release commit/tag are present remotely.
* [ ] CI remains green for the final release state.
* [x] Changelog reflects v1.0.0 release.
* [x] npm package URL is recorded in this phase document.
* [ ] Phase 9 status changed to **Complete**.
* [ ] Phase 10 landing-page work can begin.

---

## Implementation Checklist

### 9A — Registry / Account Preflight

* [x] Check npm account/authentication.
* [x] Check active registry.
* [x] Check local `.npmrc` publication-relevant settings.
* [x] Verify final `@nickhansonsr/treemark` scoped registry availability.
* [x] Verify intended ownership/account.
* [x] Verify publishing authentication readiness.
* [x] Record any account/security setup needed before publication.

### 9B — Prepare v1.0.0

* [x] Set version to `1.0.0`.
* [x] Update matching lockfile version metadata.
* [x] Remove `private` publication guard.
* [x] Review complete public metadata.
* [x] Review package `files` boundary including README assets.
* [x] Review README one final time in v1.0.0 state.
* [x] Update changelog from Unreleased to v1.0.0 as appropriate.
* [x] Confirm no new product behavior entered Phase 9.

### 9C — Final Artifact Gate

* [x] Run `npm run check`.
* [x] Run `npm run smoke:package`.
* [x] Run `npm publish --access public --dry-run`.
* [x] Inspect complete dry-run file list.
* [x] Verify CLI version output is `1.0.0`.
* [x] Verify public README assets are present.
* [x] Verify development-only files remain absent.
* [x] Review final Git diff.

### 9D — Git Release Commit / CI Gate

* [x] Create and finalize the signed v1.0.0 release-prep commit sequence.
* [x] Verify final release commit signature.
* [x] Push final release commit.
* [ ] Verify 6/6 CI for the final scoped-package release state.
* [x] Confirm working tree is clean before publication.
* [x] Confirm no `v1.0.0` tag has been created before npm publication.

### 9E — Publish

* [x] Confirm clean Git status.
* [x] Reconfirm package name/version.
* [x] Reconfirm registry/account.
* [x] Re-run and review final public-access publish dry-run.
* [x] Publish `@nickhansonsr/treemark@1.0.0` with `--access=public`.
* [x] Record successful publish result.

### 9F — Verify npm Release

* [x] Verify npm package page.
* [x] Verify npm metadata.
* [x] Verify README/banner.
* [x] Verify published tarball contents.
* [x] Verify `latest` dist-tag.
* [x] Install from registry into fresh consumer.
* [x] Run registry consumer smoke checks.
* [x] Install globally from registry.
* [x] Verify global CLI version/help.
* [x] Create annotated signed `v1.0.0` tag.
* [x] Verify tag target and signature.
* [x] Push `v1.0.0` tag.
* [x] Create GitHub Release `TreeMark v1.0.0`.
* [x] Verify GitHub Release points to the correct tag/commit.

### 9G — Close Phase

* [ ] Confirm clean repository after pulling this documentation commit.
* [x] Confirm remote commit/tag.
* [ ] Confirm final release-state CI is green.
* [x] Confirm v1.0.0 changelog state.
* [x] Record npm package URL.
* [ ] Mark Phase 9 **Complete**.
* [ ] Begin Phase 10 — TreeMark landing page.

---

## Definition of Done

Phase 9 is complete when:

1. TreeMark is published publicly to npm as `@nickhansonsr/treemark@1.0.0`.
2. The `latest` npm dist-tag resolves to v1.0.0.
3. The npm package page is public and renders the intended README/branding.
4. Public package metadata is accurate.
5. The published tarball contains only the intentional runtime and public documentation assets.
6. The npm-hosted package installs into a fresh consumer without relying on the source repository.
7. The registry-installed CLI reports version `1.0.0`.
8. Registry-installed help, Markdown, ASCII, `--output`, `--update`, and `--check` behavior work as intended.
9. Registry-installed check exit semantics remain `0` current, `1` operational, and `2` stale.
10. Global installation from npm succeeds and exposes the `treemark` command.
11. The npm publication corresponds to a clean, pushed, signed Git release commit that passed the full CI matrix before publication.
12. After successful npm publication, the release has an annotated signed `v1.0.0` tag pointing to the exact release commit, and a public GitHub Release has been created from that tag.
13. The full GitHub Actions Node/OS matrix passes for the final release state.
14. The changelog reflects the v1.0.0 release.
15. Git status is clean after publication verification and Phase 9 documentation closure.
16. TreeMark is ready for its Phase 10 public landing/showcase page.

---

## Out of Scope / Follow-up

Do not expand Phase 9 with post-MVP product work.

Keep deferred:

- `.gitignore` import.
- New renderers.
- New synchronization behavior.
- Public programmatic API.
- Structured stale diffs.
- Snapshots/history.
- Backup rotation.
- Configuration files.
- Watch mode.
- Plugin architecture.
- Automated future release pipelines.

Phase 10 handles the TreeMark landing/showcase page and the broader site-facing brand assets.

Future README or branding updates displayed on npm require publishing a new package version; they do not justify delaying v1.0.0 unless the current release documentation is actually incorrect.
