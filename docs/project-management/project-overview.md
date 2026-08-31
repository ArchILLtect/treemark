# TreeMark Project Management

This directory records implementation phases, decisions, acceptance criteria,
and completion status for the TreeMark MVP.

The authoritative product behavior is defined in:

- [`../PRODUCT_CONTRACT.md`](../PRODUCT_CONTRACT.md)

Phase documents describe how that contract is implemented.

## MVP Progress

TreeMark's planned MVP delivery is complete. Version 1.0.0 is publicly
available on npm, and the production landing page is live at
`https://nickhanson.me/projects/treemark`.

| Phase | Description | Status |
|---|---|---|
| 1  | Product contract | ✅ Complete |
| 2  | Repository setup | ✅ Complete |
| 3  | Directory scanner | ✅ Complete |
| 4  | Renderers | ✅ Complete |
| 5  | File output | ✅ Complete |
| 6  | Markdown synchronization | ✅ Complete |
| 7  | Check mode | ✅ Complete |
| 8  | Package hardening | ✅ Complete |
| 9  | npm publication | ✅ Complete |
| 10 | TreeMark landing page | ✅ Complete |

Future maintenance and feature work is post-MVP. See
[`DEFERRED_FEATURES.md`](DEFERRED_FEATURES.md) and the repository
[`TODO.md`](../../TODO.md) for the current backlog.

## Working Rules

- Lock the phase plan before implementation.
- Keep scope limited to the active phase.
- Record newly discovered work under **Deferred / Follow-up** rather than
  expanding scope automatically.
- Run `npm run check` before considering a phase complete.
- Keep the working tree clean at phase completion.
- Update the changelog for user-visible changes.
