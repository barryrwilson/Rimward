# Local checkout sync after a merge

A merged GitHub PR updates the remote branch. It does not update an existing
local branch, another worktree, or an already-running game server.

The designated everyday checkout is `C:/Projects/WebSim`, on
`codex/Rimward-20260916`. Feature work belongs on separate branches/worktrees.
Keep this designation current if the owner changes the everyday branch.

Graft must be installed separately (`@nanonets/graft`) and available on PATH;
check `graft --version` before using it. The shared instructions and ignore
rules do not install the tool. Editor/MCP hooks and machine-specific settings
kept locally through `.git/info/exclude` are not backed up by GitHub; preserve
them separately and configure them again on another machine.
On a fresh clone the ignored graph may also be absent. If the tool or graph is
missing, report that prerequisite; do not install tooling automatically. Use an
existing `graft/INDEX.md` when available, otherwise inspect the needed source
directly and record that the graph-assisted check was unavailable.

1. Inspect this checkout before touching it: `git status --short --branch`,
   `git branch --show-current`, and `git worktree list`. Confirm the directory
   and branch above. Do not switch, update, clean, or delete other worktrees.
2. Run `git fetch origin`, then `git rev-list --left-right --count HEAD...origin/master`.
   The first number is local-only commits; the second is commits still missing
   locally. Record `git rev-parse HEAD` and `git rev-parse origin/master`.
3. Preserve dirty tracked files and relevant untracked files before syncing.
   Make a recovery copy with paths and checksums in an ignored local evidence
   directory. Review it for completeness. A tracked diff alone does not save
   untracked files. Keep credentials and machine-specific settings local.
   Use a deliberate stash or isolated branch for remaining work, and record
   how it will be restored; never use a hard reset or clean to bypass dirt.
4. With the intended branch and a safe working tree, run
   `git merge --ff-only origin/master`. If histories diverge, stop the automatic
   sync and report the commits requiring reconciliation. Do not force a reset,
   invent a merge commit, or rewrite feature history to make the counts zero.
5. Reapply only still-needed local edits. Reconcile documentation against the
   newer implementation; do not overwrite upstream files with an old backup.
   Put shared changes through a reviewed PR. Keep machine-specific hooks and
   generated artifacts out of that PR.
6. Refresh the local Graft graph using the installed tool's supported rebuild
   workflow (`graft build`; inspect its options before running). The graph is
   ignored and regenerable. Run `npm run build` and the unchanged
   `npm run test:boot`. Exercise the relevant live browser flows against this
   checkout, check console errors, and record which server/build was tested.
   Restart or rebuild a stale local server as needed; a running tab alone does
   not prove it contains the fetched changes.
7. Report the checkout path, branch, local and fetched remote commit IDs,
   ahead/behind counts, remaining local changes, recovery location, and checks.
   Say explicitly if the checkout is current but a running game or deployment
   has not been verified. If changes prevent the sync, report that blocker
   rather than treating the GitHub merge as local completion.

For a fully synchronized checkout, the two commit IDs match and both counts
are zero. A feature branch may legitimately be ahead; name that state instead
of claiming equality. A remote branch can advance again after the fetch, so
the report identifies the exact fetched revision it verified.
