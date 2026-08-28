# RIMWARD agent guide

These instructions apply to repository worktrees created from GitHub issues,
including Orca AI tasks.

## Source-of-truth order

1. The assigned GitHub issue: outcome, scope, acceptance criteria, and explicit
   exclusions.
2. Current code and tests.
3. `docs/REMAINING-WORK.md` for backlog context and dependency/readiness notes.
4. The relevant design brief under `docs/`.
5. `docs/PLAYER-EXPERIENCE-WISHLIST.md` for product intent.
6. `PROGRESS.md` for history and architecture contracts.

Do not mine an old `OPEN`, `later`, or `optional` line from `PROGRESS.md` as new
scope. Later waves often close or supersede earlier notes.

## Working rules

- Confirm the behavior in current code before editing. Wishlist mechanisms are
  hypotheses; preserve the desired player outcome when implementation differs.
- Keep the issue write set bounded. If another outcome is discovered, report or
  propose it as a separate issue instead of expanding the active task. Create
  the issue only when the user or task explicitly authorizes external writes.
- Preserve unrelated user changes and untracked verification artifacts.
- Do not commit `node_modules/`, `dist/`, browser profiles, caches, or ad-hoc
  screenshots unless the issue explicitly names durable evidence as a
  deliverable.
- Player-facing UI, controls, combat feel, motion, and graphics require a live
  browser verification in addition to automated tests.
- Use text-safe DOM APIs for world/content strings. Do not move secrets, model
  credentials, or an LLM runner into the browser bundle.
- Keep the agent bridge loopback-only and fail closed on invalid actions.

## Architecture invariants

- `src/core/ctx.js` owns the frozen event vocabulary and subsystem contract.
- `src/game/state.js` owns tuning/data; persisted records must remain JSON-safe.
- Per-system content rebuilds on `systemLoaded`.
- `ctx.asteroids.list` keeps `id === array index`.
- System initialization order in `src/main.js` is load-bearing.
- Aim-glass gauges, new persistent fields, new keys/digits, equipment SKUs, and
  kit mutation require explicit issue scope; never add them incidentally.

## Definition of done

1. The issue's acceptance criteria pass.
2. `npm run build` passes.
3. `npm run test:boot` passes. Do not weaken or hide the test.
4. Relevant live browser flows are exercised and console errors are checked.
5. Security and regression risks are reviewed in proportion to the change.
6. The wishlist/backlog status is updated when the issue completes an outcome.
7. The pull request explains verification, risks, and any intentionally parked
   follow-up.
