# Wave 124 remaining CTL-03 Berth Records sim freeze notes

**Verdict:** leftover **REAL**. Name: **berth-open hold + explicit resume**. Named serial: **PR1**.

## Method

- Graph resolve (`graph-engineering__graph_resolve`): `proceed_unmodeled` (`r-mt97kp95-3174f49e`). Did **not** `graph_approve` / `graph_propose`. Draft workflows non-binding. Agent `omp/agent-omp`.
- Read live `src/game/save.js` berth panel / `setBerthOpen` / KeyL / hint / `loadFromSlot`.
- Read `src/systems/overlay-policy.js` mutex; never writes `paused`.
- Read `src/main.js` pause skip of `system.update`.
- Read `src/systems/gate.js` emit; `src/game/jump.js` charge timer.
- Read `src/game/autopilot.js` paused/docked early-return.
- Read `src/core/ctx.js` `flags.berthOpen`; `berthHold` **absent**.
- Read `src/systems/combat.js` sun heat/kill; `src/systems/hail.js` defer.
- Read `src/game/nav.js` `writeNav` `autopilot: false`.
- Cite CTL-02 Wave 118 collision; Wave 28 LOAD pause-gate; NAV-05 sole `jumpRequested`; NAV-03 restore AP false.
- Honor: Ctl02 / Ctl01 briefs, wishlist inbox, Nav03/Nav05 — cite, do not edit.
- Code wins over stale hint “records hold while you fly”.
- Domain is **data**. Did **not** start Vite or Chrome. Did **not** claim ports. Did **not** run `npm run test:boot`.

## Why REAL (not CONSUME)

Named hole still live:

- Berth open keeps `system.update` running (`save.js` header; `main.js` pause-only skip).
- Autopilot still steers (`flyTick` ignores `berthOpen`).
- `gate.js` still emits `jumpRequested`; `jump.js` still charges and swaps.
- Sun / NPC damage still apply to the player.
- No `berthHold`. No resume-on-close.
- Hint still says records hold **while you fly**.

CTL-02 mutex **does** defer the hail card and block chart stack. That is **not** a flight hold. Do **not** CONSUME on mutex alone.

Owner-omitted / skippable (not this leftover):

- Hail defer/calm rewrite (CTL-02 landed; do not reopen).
- Chart pause (forbidden).
- `controls.js` menu digits (CTL-04).
- Pirate interest/spawn (AI-05).

Rejected as invented work: `flags.paused` from berth, full-loop skip, second jump emit, persist hold, new Digit, Enter resume, hub pip, `innerHTML`, `state.js` keys.

## LOAD vs pause (frozen)

Wave 28: `loadFromSlot` returns if `ctx.flags.paused` (`save.js` **1420**) because `main.js` **149–155** skips **all** `system.update` while paused, so `systemLoaded` can rotate out unseen.

**Contract wins:** `berthHold` is **not** `paused`. Do **not** skip the full systems loop. LOAD while hold (and not KeyP) stays possible. LOAD clears hold in the **same click**.

## Jump charge owner (contract vs brief)

The worker brief listed `gate.js` for charge/emit. Live charge timer is **`jump.js`**. Merge law adds `jump.js` as a **reader** (freeze timer; no new emit). `gate.js` stays the sole `src/` `jumpRequested` writer. Contract wins.

## This pack

Markdown only:

- `docs/Ctl03BerthFreezeDesign.md`
- `out/w124/berthfreeze/**` (no `verify/**`)

No `src/`. No `scripts/`. No `PROGRESS.md`. No wishlist edit. No sibling docs. No `docs/OwnerDecisionsWave124.md`. Did not steal starter-grace / menu-input sibling packs.

## Reviews

- Security: self-applied auditor + security-review.md. HIGH/CRITICAL fixed in contract (pause impersonation, full-loop skip, jump.js reader, LOAD same-click clear). Re-review after lock: clean.
- Code/design-doc: self-applied code-review.md + reviewer persona. No remaining Blocker/Major.
- UI: self-applied ui-audit.md. Resume copy is player-facing; not skipped. Re-audit after remainder lock: Major (hide LOAD) closed.

## Processes

Started none. No Vite. No Chrome. No CDP.

## Re-dispatch lock (designer Major)

Resume-only remainder is **forbidden**. Interrupt panel **stays** the records desk: SAVE/LOAD rows stay visible and clickable. Reason + `RESUME` sit **below** the slots. Drop “or shrinks to a resume dialog”. Remainder hint: `Ship holds. RESUME continues the interrupted leg. This is not Pause (P).` L/ESC keep the desk; they do not dump to live charge.

Graph re-resolve: `proceed_unmodeled` (`r-mt98b7yr-c886bf99`). Still no `src/`. Still no `verify/`.

## Coupling for orchestrator

Do **not** implement in this worker. Sibling CTL-04 owns `controls.js`. Sibling AI-05 owns npc interest. CTL-02 mutex must stay no-`paused`. Serial **PR1** is named only. Graph resolution ids `r-mt97kp95-3174f49e` (first pack), `r-mt98b7yr-c886bf99` (this lock).
