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

## Post-merge local handoff

A GitHub merge is not a local checkout update. Complete the designated everyday
checkout handoff in [Local checkout sync](docs/LocalCheckoutSync.md), preserving
local changes and reporting the actual commit and verification result. Never
update or remove unrelated worktrees as part of that handoff.

<!-- graft:start -->
## Graft — repo context graph

This repo is indexed in `graft/`: small linked markdown nodes that explain each
system and carry exact file:line spans. This graph is a local, regenerable
artifact ignored by Git; refresh it after checkout changes.
If Graft or the graph is absent (including on a fresh clone), report the missing
prerequisite without installing automatically. Use an existing `graft/INDEX.md`
if available; otherwise inspect the needed source directly and disclose that
graph-assisted context was unavailable.

For ANY task here — understanding how something works, finding where code lives,
or scoping a change — get context from the graph before grepping or opening
source files. Re-ask freely (it's cheap) and reuse literal identifiers you
already have (symbol, error string, file name) as the query. New to this repo?
Run `graft map` first — a token-budgeted orientation (dir clusters, hubs,
hotspots), no LLM, no key.

- Run `graft ask "<your question>" --source` → ranked nodes with the relevant
  code spans inlined (each hit's ≤8-line crux by default; `--full` for whole
  definitions when the crux isn't enough). Match the tool to the task shape:
  for understanding or editing, the top node IS the answer — cite its
  `covers:` file:line spans and edit straight from `--source`. For
  exhaustive tasks ("every occurrence / every caller of this pattern"), ranked
  results are top-N, not complete — run `graft grep "<literal>"` instead
  (exhaustive over indexed files, grouped by enclosing symbol), falling back
  to raw `grep -rn` only for unindexed files.
- `graft skeleton <file>` → every definition's signature + span, ~10× cheaper
  than reading the file; use it to skim an API surface.
- `graft callers <symbol>` gives precomputed, exact edges — who calls this.
  Add `--direction out` for what it calls, or `--depth N` to walk
  transitively for the full blast radius. For structural questions, skip
  ranking and use this directly.
- Or browse: `graft/INDEX.md` lists every node; follow the links.
- Monorepos and folders of multiple repos rank fairly across sub-projects —
  hits carry `[scope/]` labels naming which one they're from. Narrow with
  `graft ask "<task>" --in <scope>/` once you know where you're working.

If a returned span is truncated ("+N more lines"), open the file at that exact
range before finalizing. Only open source files when a node genuinely lacks a
needed detail, and then at the exact file:line the node points to — never
re-read whole files.

After big code changes, refresh the graph with `graft build` (deterministic,
no API key, $0).
<!-- graft:end -->
