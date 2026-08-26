# Wave 126 Hail01 pirate demand lifecycle notes

**Verdict:** leftover **REAL**. Name: **incoming pirate demand lifecycle** (source, timer, compliance, dock/jump-safe visible outcome). Named serial: **PR1**. Not CONSUME. Not Hail02. Named serial is **not** none.

## Method

- Graph resolve (`graph-engineering__graph_resolve`): `proceed_unmodeled` (`r-mt9gsvm6-2ec4d54d`). Did **not** `graph_approve` / `graph_propose`. Draft workflows non-binding. Agent `omp/agent-omp`. Namespace `omp`. Calendar/CRM/Activar: none binding (false bind if present — ignored).
- Census live `src/systems/hail.js` open/close/payTribute/Digit/`hailOpened`.
- Census `src/systems/npc.js` telegraph HEAVE-TO, demand emit, intents, demanding upkeep, hailClosed hold release, Illyx `updateDuel`.
- Census `src/systems/hud.js` `toastForEvent` (no `hailOpened`), `commLine` drops `from`, 4 s life / 8 s linger, `textContent`.
- Census `src/systems/overlay-policy.js` mutex, defer, `hailDigitsAllowed`, never `paused`, Wave 125 `berthHold`.
- Census `src/game/jump.js` midpoint `ctx.ships.length = 0` + `systemLoaded`; `src/main.js` order jump → npc → hail.
- Census Wave 30 intents; Wave 125 starter grace on demand emit; `HIDDEN_MOUNTS.demandMin`; `cargoValue` NaN path.
- Cite sibling Hail02 (wishlist **93–98**) — do not write. Cite Agent `hailResolve` — do not claim `agent-api.js`. Cite HUD-06 — do not claim hud layout.
- Code wins over playtest all-caps `HEAVE TO. CARGO OR HULL.` Live telegraph is `'Heave to. Cargo or hull.'`
- Domain is **data**. Did **not** start Vite or Chrome. Did **not** claim ports. Did **not** run `npm run test:boot`. Did **not** write `src/`. Did **not** edit the wishlist.

## Why REAL (not CONSUME)

Named hole still live:

- Nameless telegraph toast (no ship, no timer, no verbs).
- Demand has **no** deadline.
- Jump `closeCard` without `hailClosed` / visible outcome.
- Dock does not resolve an open demand.
- Illyx never emits pirate demand (ace duel) — Ninth Tooth can.
- `hailOpened` is not toasted; orphan HEAVE-TO is a **different** channel than the Wave 30 card.

Wave 30 pay-or-fight card **does** exist for pirates in range. That is **not** a full lifecycle. Do **not** CONSUME on Ninth Tooth card alone.

## Deputize (not parked)

| Knob | Freeze |
|---|---|
| Timer | 20 s session |
| Dock | close named `docked` |
| Jump | named `jumped`; drop defer |
| Illyx | **no** `payTribute`; duel stays |
| HEAVE-TO | not a second unpaid channel |
| Persist | none |
| Overlay | never `paused` |

## Later write-set (do not edit now)

- Prefer `src/systems/hail.js` + `src/systems/npc.js` demand emit/close.
- If a toast must change: `hud.js` **listeners only** for the demand event — do **not** claim HUD layout (HUD-06).
- Do **not** claim `controls.js`.
- Do **not** claim `agent-api.js`.

## Coupling (do not steal)

- Hail02 player-H-on-friendly feedback.
- Agent API observe/act / cheat tribute.
- HUD-06 home marker.
- CTL-02 overlay pause.
- CTL-03 PR2, CTL-04 PR2, AI-05 PR2, HUD-04 flood rewrite.

## Reviews

Security HIGH (NaN credits, pause, persist god-mode, Agent cheat) **resolved in freeze**. Code Blocker/Major **resolved in freeze** after demanding-without-surface lock. UI Blocker/Major **resolved as later copy** (live HEAVE-TO stays until PR1).

Re-review after contract Overlay / fail-closed edits: no new HIGH/CRITICAL. No new Blocker/Major.

## Graph

`resolution_id` `r-mt9gsvm6-2ec4d54d`. Decision `proceed_unmodeled`. `mandatory` false. `primary_workflow` null.
