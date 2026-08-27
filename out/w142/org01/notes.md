# Wave 142 Org01 PR1 notes

**Verdict:** leftover **REAL** implemented as **PR1**. Flavor title kept. Mechanical preview now paints **before** Digit/click confirm. Named serial after this pack: optional PR2 stills / PR3 two-step (owner-asked). Not CONSUME of the leftover until playtest stills if the parent wants them.

## Method

- Copied `out/w141/org01/shared-contract.md` → `out/w142/org01/shared-contract.md`. Header: Wave 142, this worker implements PR1. Honor / fail-closed / deputize kept.
- Did **not** call `graph_propose` / `graph_approve`.
- Applied security / code / UI reviews **self**. Did not spawn nested agents. Did not start Vite, Chrome, Playwright, or CDP. Did not run `npm run test:boot`.
- `state.js` READ-ONLY. Did not edit wishlist or `PROGRESS.md`. Did not edit `scripts/boot-test.mjs`.
- `node --check src/game/origins.js` passed.
- Derive smoke (node import of `state.js` only) matched the deputized compact table.

## What landed

| Surface | Live after PR1 |
|---|---|
| Digit map | authored `greenhand`, `ledgerDebt`, `marked`, `beautiful`, `drifter` |
| Confirm | Digit1–5 or click → `choose(id)` once |
| Row title | `[n] name — line` |
| Preview | hull / money / standings / danger / experience `textContent` sublines |
| Hull | `Hull light 100 · Mk I · hold 20` (shared; no kit mutate) |
| Digit2 money | `Money −1150 UU (debt)` |
| Digit4 | `New player — living-ship care` + cargo Living rock ×2 |
| Digit5 | `Start The Redmarch · fear 5 · clue tally-board` |
| Pause | overlay still sets `flags.paused` until pick |
| After pick | listener removed; Digit1–5 become WPN |

## Fail-closed

- Unknown / reserved / invalid origin id: skip row; Digit numbers do not reindex; choose returns `'unknown'`.
- Missing effect field: omit that preview part (no `fear 0` on Greenhand).
- Overlay paint never throws.
- Missing `ORIGINS[id]`: do not write `ctx.world.origin`.

## Neighbours not stolen

Onb01 (`onboarding.js`, `hud.js`, `hud.css`), Ctl05 (`main.js`, `title.js`, `save.js`), AI-05 grace, creditor `ORIGIN_ARCS`, HUD-01 hub, station `.screen-panel`.

## Verifier

Domain **frontend**. Parent verifier owns Vite `npx vite --port 5175 --strictPort` and fresh-boot overlay stills.
