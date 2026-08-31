

- [ ] Review nested node_modules default-ignore behavior

    Confirm whether TreeMark’s built-in node_modules/** ignore is intended to exclude dependency folders at any depth.
    If so, update the default-ignore semantics to cover nested paths such as backend/node_modules/** (likely **/node_modules/**).
    Add regression tests for root-level and nested node_modules directories.

- [ ] Set up collapse/expand behavior for TreeMark nodes

    Implement a mechanism to collapse and expand nodes in the TreeMark structure.
    Ensure that the state of collapsed/expanded nodes is preserved across sessions.
    Add tests to verify the correct behavior of collapsing and expanding nodes.