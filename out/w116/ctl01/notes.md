# Wave 116 CTL-01 leftover — dock/jump interaction bind

## Verdict

**Leftover is real.** Serial name: **PR1 dedicated dock/jump bind**. Serial is **not** none. **Not CONSUME.**

Deputize: **KeyJ**. Owner may override after playtest. Do not park.

## Census (code wins)

- `controls.js` 274–276: `case 'KeyD': pendingDock = true`.
- `controls.js` 440: `strafeX` from held KeyD / KeyA.
- Help 343 “A/D — lateral strafe (D = right)” and 353 “H — hail · D — dock”.
- `ctx.js` 76 / 88 comments name D for both strafe-right and dock edge.
- `gate.js` 648: human `dockPressed` OR AP `wantJump`.
- `station.js` 6250–6259: `dockPressed` within `U.DOCK_RANGE`.
- HUD prompt 2127–2138 still paints D for Dock/Jump (hub G + “D — Jump”).
- Onboarding 50 / 53: “D — dock” / “D — jump the gate”.
- WAVE21 `dispatchKey('KeyD')` at `scripts/boot-test.mjs` 706 and 732.
- WAVE6 pin `'D — dock'` at 1732. KeyZ at 1723 is unbound dismiss — do not steal.
- Direct `ctx.input.dockPressed = true` dock helpers 1137 / 4460 / 6572 stay valid after remap.
- Title is `systems[0]` (`main.js` 105–106). Capture swallows KeyJ. Enter is first-entry — **not** deputized.
- Unused letters in `src/`: I, J, U. Deputize **J**.

KeyD dual-bind is **not** a feature. Treating it as CONSUME would keep the P0 prompt-vs-strafe bug.

## Deputize

- `pendingDock` from **KeyJ** only.
- KeyD = lateral strafe-right only.
- Keep `ctx.input.dockPressed`. Do not invent `jumpPressed`.
- Dock and gate jump stay the same key.
- AP `wantJump` independent. Do not require J. Do not write `dockPressed` from AP.
- Skip `pendingDock` while title / models open / typing.
- Do **not** add KeyJ to AP or automine `inputBreak` helm. Holding D still cancels AP via `strafeX`.
- No hub pip, no Digit, no `state.js` write, no new persist key, no `innerHTML`.

## Later PR1 may write

- `src/systems/controls.js` (bind + help literals)
- `src/systems/onboarding.js` (hint strings)
- `src/systems/hud.js` **context prompt copy only** (`pKey`/`pVerb` dock/jump family) — **not** combat rails
- `src/core/ctx.js` comments on `strafeX` / `dockPressed` only
- `scripts/boot-test.mjs` **string / KeyD-jump pins on purpose**

Must **not** claim `src/systems/hud.js` combat rails (HUD-02 sibling) or `src/game/autopilot.js` (NAV-05). This worker wrote **no** `src/`.

## Honor

- Wishlist Idea inbox P0 CONTROLS — cite, do not edit.
- `docs/Nav*.md` — NAV-05 sibling owns AP handoff copy.
- `docs/Hud02RemainingTargetSilhouettesDesign.md` — cite, do not rewrite.
- `docs/OwnerDecisions*.md` — cite, do not edit. No `docs/OwnerDecisionsWave116.md`.
- Do not steal `out/w116/hud02tgt/**` or `out/w116/nav05/**`.
- No wishlist. No `PROGRESS.md`.

## Coupling for orchestrator

- WAVE21 jump pins `dispatchKey('KeyD')` **will fail** until the impl wave retargets them to KeyJ. That update is **required**, not a drive-by.
- WAVE6 `'D — dock'` string pin must move with onboarding copy.
- `dockAtCurrentStation` injects `dockPressed` directly — no key change.
- HUD-02 sibling may shift `hud.js` line numbers; impl re-greps `pKey = 'D'`.
- P1 overlay stacking (hail/chart/berth) remains residual; live D already leaks through those overlays.
- After remap: hold D in zone **never** jumps (today it jumps on tap/keydown). Intended.

## Ports / processes

This worker did not start Vite or Chrome. No ports claimed.
