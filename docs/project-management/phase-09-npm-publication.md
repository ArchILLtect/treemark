# Phase 9 — npm Publication

Status: **Planned**

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
- `treemark` is still available for publication as an unscoped package.
- The intended package owner/account is correct.
- Publishing authentication requirements are satisfied.
- No unexpected `.npmrc` setting redirects publication to another registry.
- Current local npm version is known.
- Public package visibility is understood.

No publication occurs in 9A.

### 9B — v1.0.0 Release Metadata

Prepare the exact first-release metadata.

Lock:

```json
{
  "name": "treemark",
  "version": "1.0.0"
}
```

Release changes:

- Change version from `0.0.0-development` to `1.0.0`.
- Remove `"private": true`.
- Keep the package unscoped and public.
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

Recommended commit message:

```text
chore(release): prepare v1.0.0
```

Do not rewrite earlier history as part of the release.

### 9E — npm Publication

Publish only after 9A–9D pass.

For an unscoped public package, publication is performed from the package root with npm's publish command.

Before confirming publication:

- Confirm current directory is the TreeMark repository root.
- Confirm package name is `treemark`.
- Confirm version is `1.0.0`.
- Confirm Git status is clean.
- Confirm the release tag/commit is pushed and CI is green.
- Confirm final dry-run contents one last time.

Then publish v1.0.0.

Record:

- npm CLI success output.
- Published package/version.
- Any registry integrity or provenance information surfaced by npm.
- Publication timestamp if useful for project records.

### 9F — Registry and Consumer Verification

Do not consider publication complete merely because `npm publish` exits successfully.

Verify the live registry result:

- `treemark@1.0.0` resolves from npm.
- npm package page exists and is public.
- npm page renders the intended README and branding.
- Description, license, repository, homepage, issue tracker, version, Node requirement, and install command are correct.
- Published tarball contents match expectations.
- `latest` resolves to v1.0.0.
- No accidental package files are visible.

After `treemark@1.0.0` is confirmed live and correct on npm:

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
install treemark from npm
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
npm install --global treemark
```

and confirm:

```bash
treemark --version
```

reports:

```text
1.0.0
```

Remove or retain the global installation according to local preference after verification.

### 9G — First-Release Closure

After registry verification:

- Confirm Git status is clean.
- Confirm release commit/tag remain present remotely.
- Confirm CI remains green.
- Confirm changelog represents the released version correctly.
- Record the npm package URL in project documentation if needed.
- Mark Phase 9 complete.
- Move immediately to Phase 10 — TreeMark landing page.

README-only or branding corrections made after publication require a new
package version before npm's package page will receive the updated README.

---

## Required Verification

### Registry / Account

* [ ] npm CLI is authenticated to the intended account.
* [ ] Active npm registry is correct.
* [ ] `treemark` package-name availability is confirmed immediately before publication.
* [ ] Intended package ownership is confirmed.
* [ ] Publishing authentication requirements are satisfied.
* [ ] Local npm configuration does not unexpectedly redirect publication.

### v1.0.0 Metadata

* [ ] `package.json` version is `1.0.0`.
* [ ] `package-lock.json` package metadata matches `1.0.0`.
* [ ] `"private": true` has been intentionally removed.
* [ ] Package remains an unscoped public CLI package.
* [ ] `bin` still points to `./dist/cli.js`.
* [ ] Node engine requirement remains `>=22`.
* [ ] License is MIT and matches `LICENSE`.
* [ ] Repository URL is correct.
* [ ] Issues URL is correct.
* [ ] Homepage is `https://nickhanson.me/projects/treemark`.
* [ ] README branding assets referenced by the README are included.
* [ ] Public package boundary remains intentional.
* [ ] No unsupported programmatic API is implied.

### Release Candidate

* [ ] `npm run check` passes.
* [ ] All 161+ tests pass.
* [ ] `npm run smoke:package` passes all smoke steps.
* [ ] `npm publish --dry-run` succeeds.
* [ ] Dry-run file list is intentionally minimal.
* [ ] `dist/cli.js` shebang/entry is correct.
* [ ] CLI reports version `1.0.0`.
* [ ] README renders correctly from the release candidate.
* [ ] Final Git diff contains only intended release changes.

### Git Release State

* [ ] Release commit created.
* [ ] Release commit is signed/verified.
* [ ] Release commit pushed.
* [ ] Full GitHub Actions Node 22/24 × Windows/macOS/Ubuntu matrix passes.
* [ ] Working tree is clean immediately before publication.
* [ ] npm publication succeeds before the release tag is created.
* [ ] Annotated signed `v1.0.0` tag created after npm verification.
* [ ] Tag points to the intended release commit.
* [ ] Tag signature is verified.
* [ ] Release tag pushed.
* [ ] GitHub Release `TreeMark v1.0.0` created from the `v1.0.0` tag.
* [ ] GitHub Release points to the intended release commit.

### npm Publication

* [ ] Final package name/version rechecked immediately before publish.
* [ ] Final dry-run reviewed.
* [ ] `npm publish` succeeds.
* [ ] Registry reports `treemark@1.0.0`.
* [ ] `latest` points to `1.0.0`.
* [ ] Package page is publicly accessible.
* [ ] npm README/banner renders correctly.
* [ ] npm metadata is correct.
* [ ] Published package contents are correct.

### Registry Consumer Test

* [ ] Fresh consumer installs `treemark` from the npm registry.
* [ ] Registry-installed `treemark --version` reports `1.0.0`.
* [ ] Registry-installed `treemark --help` works.
* [ ] Markdown stdout works.
* [ ] ASCII stdout works.
* [ ] `--output` works.
* [ ] `--update` works.
* [ ] Current `--check` exits `0`.
* [ ] Stale `--check` exits `2`.
* [ ] Operational failure exits `1`.
* [ ] Global `npm install --global treemark` succeeds.
* [ ] Globally installed `treemark --version` reports `1.0.0`.

### Closure

* [ ] Git status is clean.
* [ ] Release commit/tag are present remotely.
* [ ] CI remains green.
* [ ] Changelog reflects v1.0.0 release.
* [ ] npm package URL is recorded where appropriate.
* [ ] Phase 9 status changed to **Complete**.
* [ ] Phase 10 landing-page work can begin.

---

## Implementation Checklist

### 9A — Registry / Account Preflight

* [x] Check npm account/authentication.
* [x] Check active registry.
* [x] Check local `.npmrc` publication-relevant settings.
* [x] Verify `treemark` live registry availability.
* [x] Verify intended ownership/account.
* [x] Verify publishing authentication readiness.
* [x] Record any account/security setup needed before publication.

### 9B — Prepare v1.0.0

* [ ] Set version to `1.0.0`.
* [ ] Update matching lockfile version metadata.
* [ ] Remove `private` publication guard.
* [ ] Review complete public metadata.
* [ ] Review package `files` boundary including README assets.
* [ ] Review README one final time in v1.0.0 state.
* [ ] Update changelog from Unreleased to v1.0.0 as appropriate.
* [ ] Confirm no new product behavior entered Phase 9.

### 9C — Final Artifact Gate

* [ ] Run `npm run check`.
* [ ] Run `npm run smoke:package`.
* [ ] Run `npm publish --dry-run`.
* [ ] Inspect complete dry-run file list.
* [ ] Verify CLI version output is `1.0.0`.
* [ ] Verify public README assets are present.
* [ ] Verify development-only files remain absent.
* [ ] Review final Git diff.

### 9D — Git Release Commit / CI Gate

* [ ] Create `chore(release): prepare v1.0.0` commit.
* [ ] Verify release commit signature.
* [ ] Push release commit.
* [ ] Wait for and verify 6/6 CI.
* [ ] Confirm working tree is clean.
* [ ] Confirm no `v1.0.0` tag has been created yet.

### 9E — Publish

* [ ] Confirm clean Git status.
* [ ] Reconfirm package name/version.
* [ ] Reconfirm registry/account.
* [ ] Re-run or review final publish dry-run.
* [ ] Publish `treemark@1.0.0`.
* [ ] Record successful publish result.

### 9F — Verify npm Release

* [ ] Verify npm package page.
* [ ] Verify npm metadata.
* [ ] Verify README/banner.
* [ ] Verify published tarball contents.
* [ ] Verify `latest` dist-tag.
* [ ] Install from registry into fresh consumer.
* [ ] Run registry consumer smoke checks.
* [ ] Install globally from registry.
* [ ] Verify global CLI version/help.
* [ ] Create annotated signed `v1.0.0` tag.
* [ ] Verify tag target and signature.
* [ ] Push `v1.0.0` tag.
* [ ] Create GitHub Release `TreeMark v1.0.0`.
* [ ] Verify GitHub Release points to the correct tag/commit.

### 9G — Close Phase

* [ ] Confirm clean repository.
* [ ] Confirm remote commit/tag.
* [ ] Confirm CI green.
* [ ] Confirm v1.0.0 changelog state.
* [ ] Record npm package URL.
* [ ] Mark Phase 9 **Complete**.
* [ ] Begin Phase 10 — TreeMark landing page.

---

## Definition of Done

Phase 9 is complete when:

1. TreeMark is published publicly to npm as `treemark@1.0.0`.
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
13. The full GitHub Actions Node/OS matrix passes for the release state.
14. The changelog reflects the v1.0.0 release.
15. Git status is clean after publication verification.
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
