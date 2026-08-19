# TreeMark Project Management

This directory tracks implementation phases, decisions, acceptance criteria,
and completion status for the TreeMark MVP.

The authoritative product behavior is defined in:

- [`../PRODUCT_CONTRACT.md`](../PRODUCT_CONTRACT.md)

Phase documents describe how that contract is implemented.

## MVP Progress

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
| 9  | npm publication | 🚧 In Progress |
| 10 | TreeMark landing page | ⬜ Planned |

## Working Rules

- Lock the phase plan before implementation.
- Keep scope limited to the active phase.
- Record newly discovered work under **Deferred / Follow-up** rather than
  expanding scope automatically.
- Run `npm run check` before considering a phase complete.
- Keep the working tree clean at phase completion.
- Update the changelog for user-visible changes.