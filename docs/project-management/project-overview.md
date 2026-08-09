# TreeMark Project Management

This directory tracks implementation phases, decisions, acceptance criteria,
and completion status for the TreeMark MVP.

The authoritative product behavior is defined in:

- [`../PRODUCT_CONTRACT.md`](../PRODUCT_CONTRACT.md)

Phase documents describe how that contract is implemented.

## MVP Progress

| Phase | Description | Status |
|---|---|---|
| 1 | Product contract | ✅ Complete |
| 2 | Repository setup | ✅ Complete |
| 3 | Directory scanner | ⬜ Next |
| 4 | Renderers | ⬜ Planned |
| 5 | File output | ⬜ Planned |
| 6 | Markdown synchronization | ⬜ Planned |
| 7 | Check mode | ⬜ Planned |
| 8 | Package hardening | ⬜ Planned |
| 9 | npm publication | ⬜ Planned |

## Working Rules

- Lock the phase plan before implementation.
- Keep scope limited to the active phase.
- Record newly discovered work under **Deferred / Follow-up** rather than
  expanding scope automatically.
- Run `npm run check` before considering a phase complete.
- Keep the working tree clean at phase completion.
- Update the changelog for user-visible changes.