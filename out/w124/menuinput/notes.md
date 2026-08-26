# Wave 124 remaining CTL-04 station-menu input notes

**Verdict:** leftover **REAL**. Name: **PR1 station-menu Digit skip**. Named serial is **not** none. **Not CONSUME.**

## Method

- Graph resolve (`graph-engineering__graph_resolve`): `proceed_unmodeled` (`r-mt97kkem-1ac804ba`). Did **not** `graph_approve` / `graph_propose`. Draft workflows non-binding.
- Read live `src/systems/controls.js` Digit1–5 → `input.weaponGroup` (no docked skip).
- Read `station.js` `DOCK_KEY_SERVICES` + level-1/2 Digit map (Repair / Feed & tend).
- Read `overlay-policy.js` `hailDigitsAllowed` / `playSurfaceBlocked`.
- Read `hail.js` Digit overlap comment **431–432**.
- Read `hud.js` WPN meter + `weaponHudLabel`.
- Census listener order: `main.js` initTitle capture → initStation bubble → initControls bubble. Station digits do **not** stop.
- Honor: Ctl01 / Ctl02 briefs, wishlist INBOX (P1, CONTROLS) — cite, do not edit.
- Code wins over any hope that Wave 118 already scoped WPN digits.
- Domain is **data**. Did **not** start Vite or Chrome. Did **not** claim ports. Did **not** run `npm run test:boot`.

## Why REAL (not CONSUME)

Inventory proves Digit1–5 **still write** `weaponGroup` while `flags.docked` and `ui.open`:

- `controls.js` **329–344**: unconditional assign.
- `station.js` **6156–6177**: Digit4 Feed, Digit5 Repair, no `stopPropagation`.
- `hud.js` **255–273**: `4 · —` / `5 · Psionic bolt` match inbox copy.
- Wave 118 `hailDigitsAllowed` is hail **resolution** only.

Owner-omitted / skippable (not this leftover):

- Settings rebind (P2 inbox).
- In-game pause-menu chrome (P2 inbox).
- Onboarding lesson.
- Hail-demand lifecycle.
- CTL-03 berth hold (`save.js`).
- AI-05 `npc.js`.

`fireHeld` while docked: combat **1825–1828** already cold. Residual LMB-through-undock is **PR2**, not PR1.

Rejected as invented work: Digit remap, hub pip, persist key, overlay mutex reopen, `stopImmediatePropagation` on station as default, “not available” WPN copy.

## This pack

Markdown only:

- `docs/Ctl04MenuInputDesign.md`
- `out/w124/menuinput/**` (no `verify/`)

No `src/`. No `scripts/`. No `PROGRESS.md`. No wishlist edit. No sibling docs. No `docs/OwnerDecisionsWave124.md`. Did not steal CTL-01/02 docs.

## Deputize (owner may override after playtest; do not park)

1. `flags.docked === true` → Digit1–5 must not set `weaponGroup`.
2. Also skip: title, models, settings, typing, hail card, chart, berth, pause (`hailDigitsAllowed === false`).
3. Open space, no overlay: flight WPN 1–5 stay.
4. Do not add Digit6–9/0 to controls. Station 0/8/9 stay station.
5. Prefer skip in the existing keydown switch. No stopImmediate wars.
6. Fail closed: missing flags = not-docked; never throw.

Tradeoff: player cannot change WPN while docked. Outfitting uses Digit 8/9 papers.

## Later PR1 may write

- `src/systems/controls.js` only
- Named `scripts/boot-test.mjs` pins: dispatch Digit while docked, assert group unchanged

Must **not** claim `station.js`, `hail.js`, `overlay-policy.js`, `save.js`, `npc.js`, `hud.js`, `state.js`. This worker wrote **no** `src/`.

## Honor

- Wishlist Idea inbox P1 CONTROLS — cite, do not edit.
- HUD-01 empty hub. Aim-glass gauges off. Kit mutate omit.
- Digit 0 shipyard. Digit 8/9 station. Digit 1–5 flight WPN.
- CTL-01 KeyJ. CTL-02 hail Digit skip is resolution, not WPN write.
- `hail.js` **431–432** known overlap — cite.
- `innerHTML` forbidden later. No persist. No bind schema.

## Reviews

- Security: self-applied auditor + security-review.md. No CRITICAL/HIGH. Re-review after pack write and after `settingsOwnsScreen` fallback lock: still clean.
- Code/design-doc: self-applied code-review.md + reviewer persona. No Blocker/Major. Settings-helper-miss minor closed in contract. Other minors accepted.
- UI: self-applied ui-audit.md. WPN must not silently change. No new chrome. Did not skip with “not available”. Re-review: no UI spec change after fallback.

## Processes

Started none. No Vite. No Chrome. No CDP.

## Coupling for orchestrator

Do **not** implement in Wave 124. Sibling CTL-03 / AI-05 own other files. Later serial **PR1**. Graph resolution id `r-mt97kkem-1ac804ba`.
