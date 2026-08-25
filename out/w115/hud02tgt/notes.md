# Wave 115 HUD-02 leftover — TARGET class silhouettes

## Verdict

**Leftover is real.** Serial name: **PR1 target facing class tokens**. Serial is **not** none. **Not CONSUME.**

## Census (code wins)

- `tgtFacing = makeFacing(tgtRail)` lives at `src/systems/hud.js` 875. FORE/AFT on the lock is live (1407–1426).
- `classKeyToken` (101–108) reads **`ctx.player.classKey` only**. Family gate is bio **or** mech. Allowlist `SHIP_CLASSES`.
- `applyClassKeyAttr` writes **`#hud.dataset.classKey`** (110–115, 1101, 1758). One root writer.
- WAVE113 bio CSS `hud.css` 1590–1669 and WAVE114 mech CSS `hud.css` 1286–1336 are **unscoped**. They restyle **both** rails from the **player** class.
- Grep: **zero** `.rw-combat-target[data-class-key]`. **Zero** lock `classKey` reads in `classKeyToken`. **Zero** `innerHTML` in `hud.js`.

Player leak onto `tgtFacing` is **not** a target-class feature. Wave 113/114 UI audits even named it an accepted residual (“do not key off lock classKey”). This leftover is that residual, now in scope.

## Deputize

- Narrow player `[data-class-key]` CSS to `.rw-combat-self` (scope fix; **do not** rewrite WAVE113/114 metrics).
- Allowlisted `data-class-key` on `.rw-combat-target` from **visible** lock class.
- Fail closed: omit rail attribute → generic **family** facing on the **target** row. Never freeze the sim.
- Do **not** put lock class on `#hud`.
- Q-ship: `coverClass` / `visualClassFor`. Never hidden `state.classKey`. Mk II name pierce does **not** unmask the glyph.
- Family stays **player** `hudFamily`. Class is inside family.
- No hub pip, no Digit, no `state.js` write, no new persist key, no `innerHTML`.

## Later PR1 may write

`src/systems/hud.js` and `src/ui/hud.css` only (plus optional boot pin in a later wave). This worker wrote **no** `src/`.

## Honor

- WAVE113 `docs/Hud02RemainingSilhouettesDesign.md` — cite, do not rewrite.
- WAVE114 `docs/Hud02RemainingMechSilhouettesDesign.md` — cite, do not rewrite.
- Wave 112 `docs/OwnerDecisionsWave112.md` — cite, do not edit.
- Do not steal `out/w115/hud03vis/**` or `out/w115/shp/**`.
- No `docs/OwnerDecisionsWave115.md`. No wishlist. No `PROGRESS.md`.

## Ports / processes

This worker did not start Vite or Chrome. No ports claimed.

## Coupling for orchestrator

- WAVE113/114 player pins may grep unscoped `#hud[data-class-key] .rw-facing`. PR1 scope-to-self is pin hygiene, not leftover art.
- Cover law must stay aligned with `npc.js` mesh class and `traffic-feel.js` `visualClassFor`.
- Target CSS family gate is **player** `#hud[data-family]`. Do not invent lock-family.
