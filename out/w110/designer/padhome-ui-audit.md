# UI Audit: PHY-05 pad-home PR1+PR2 (Wave 110)

**Auditor:** `[designer]` (independent of `out/w110/padhome/ui-audit.md`)
**Scope:** Confirm Wave 110 first impl (persist/AI) did **not** add hub children, Digit steal, toast, or pad-home pip. Product chrome freeze vs live HUD/Digit.
**Review file:** `out/w110/designer/padhome-ui-audit.md`
**Method:** `orchestrator/references/ui-audit.md` + `orchestrator/assets/designer-persona.md`. Live cites + worker notes + WAVE110 pins. No Playwright. No Vite. [NO BROWSER COVERAGE].
**Date:** 2026-08-24
**Product source:** review only (no `src/` edits)

Honor: `docs/Phy05PadHomeDesign.md` Honor row + merge law `out/w109/padhome/shared-contract.md` §0.2–0.4. Worker self-audit: `out/w110/padhome/ui-audit.md`.

## UI Audit: pad-home HUD / Digit freeze (impl wave)

### Summary

Wave 110 PHY-05 shipped **no product UI**. PR1 is `world.js` author/heal only. PR2 is pins. Hub stays 80 px with pupil, three cilia, RANGE. Digit 0/8/9 stay shipyard / launch / Standing. No pad-home pip. No pad-home toast. Freeze held.

### Verdict

**CLEAN.** 0 blockers, 0 majors. No UI shipped. Freeze held.

### What's done well

- Picture is hull spawn/hold, not chrome (`docs/Phy05PadHomeDesign.md` Picture §6; Honor row). Patrol `route[0]` is a hold via `writeStationHold` (`src/game/world.js:381`).
- `healPadHome` is persist/author (`world.js:709–735`). Role allowlist is trader/miner/patrol. No `innerHTML`. No `createElement`. No `document`. No toast emit.
- `holdClassFor` patrol uses known scale else `'heavy'` (`world.js:669–679`). Fail-closed missing helper / bad system keeps the record flying. No freeze overlay.
- Live hub is unchanged: `.rw-reticle` is 80×80 (`src/ui/hud.css:184–193`). `initHud` children are pupil, three cilia, RANGE (`src/systems/hud.js:709–712`). No `padHome` / `pad-home` string in `hud.js` or `hud.css`.
- RANGE stays TGT-01 (`hud.js:712`; `.rw-reticle-range` at `hud.css:207–220`). Color uses `var(--cyan)`.
- Digit 0 stays shipyard: `DOCK_KEY_SERVICES` last key is `'shipyard'` (`station.js:188`); menu hot `0` (`station.js:5938–5941`); dock-root `d === 0` selects last key (`station.js:6073–6077`, `6118–6122`).
- Digit 8 dock root stays launch; Digit 9 stays epics / Standing (`station.js:188`, labels `5938`, dispatch `6073–6080`). Outfitting 8/9 stay launcher / turret papers (`station.js:1633–1634`, `1710–1713`, `6152–6154`).
- Existing toasts stay hull strike / STAR HEAT / star-kill (`hud.js:587–593`). `toastForEvent` has no pad-home / hold-clear case.
- WAVE110 pins grep Digit 0/8/9 and hub 80 px (`scripts/boot-test.mjs:22839–22844`; `out/w110/padhome/wave110-pins.mjs:167–172`).
- Uncommitted `station.js` delta vs HEAD is MSN-03 chain SKU copy (`grantChainSku` / jobs `chainSkuHint`). That is a **sibling**. Pad-home did not change Digit 0/8/9 binds.

### Freeze confirmation (this serial)

| Surface | Live | Spec freeze | Wave 110 |
|---|---|---|---|
| HUD-01 80 px hub | `.rw-reticle` 80×80; pupil + 3 cilia + RANGE (`hud.css:184–193`; `hud.js:709–712`) | Honor; contract §0.2 | **Held.** No new child |
| RANGE | TGT-01 label (`hud.js:712`) | RANGE stays TGT-01 | **Held.** No hold distance |
| Pad-home pip | absent | Honor; non-pick | **Held.** Forbidden; not added |
| Toast | hull strike / STAR HEAT / sun-kill (`hud.js:587–593`) | “No toast required” | **Held.** No pad-home event kind |
| Digit 0 | shipyard (`station.js:188, 5938–5941, 6075–6077`) | §0.3 | **Held.** Not stolen |
| Digit 8 dock root | launch | §0.3 | **Held.** Not stolen |
| Digit 9 dock root | epics / Standing | §0.3 | **Held.** Not stolen |
| Outfitting 8/9 | launcher / turret papers (`station.js:6152–6154`) | §0.3 | **Held.** Not stolen |
| New Digit / dock verb | none in this leftover | Pad-home is not a dock verb | **Held.** `DOCK_KEY_SERVICES` length 10 |
| `innerHTML` | none in `world.js` | Honor; §0.4 | **Held.** |
| Picture | hull spawn via `recordPosition` | Picture §6 | **Held.** No chrome to sell the heal |

### Findings

None at 🔴 Blocker / 🟠 Major.

#### 🟡 Minor: Digit freeze cites still point at `undock()`, not Digit 0/8/9

**Location:** `docs/Phy05PadHomeDesign.md:67` (cite `station.js` 188, **6041–6046**); contract `out/w109/padhome/shared-contract.md:25–26`; live `src/systems/station.js:188, 5938–5941, 6073–6080`
**Severity:** minor
**Status:** open (law text is correct; line cites are stale; this audit does not edit the brief)
**Issue:** Honor / inventory still cite Digit 0/8/9 at `6041–6046`. Live `6041–6058` is `undock()` clearing pending flags and hiding the overlay. Live Digit 0 is `6075–6077`. Live Digit 8/9 dock root is `6073–6080` (index 7 launch, index 8 epics). WAVE110 pins grep `'shipyard'` / hotkey `0` / `'launch', 'epics'` and do **not** grep 6041, so this serial still proves the freeze. A later pin that greps **6041–6046** would miss a Digit steal.
**Fix:** Later markdown that may edit the contract retargets cites to `188, 5938–5941, 6073–6080` and outfitting `1633–1634, 6152–6154`. Do not steal keys to “fix” the cite.

#### 💡 Suggestion: Hub emptiness is grepped, not live-DOM counted

**Location:** `scripts/boot-test.mjs:22842–22844`; `out/w110/padhome/wave110-pins.mjs:170–172`
**Severity:** suggestion
**Status:** accepted for this leftover (persist-only; independent read of `hud.js:709–712` confirms the tree)
**Issue:** `hubEmpty` greps `hud.css` for `80px` and forbids `padHome` / `pad-home` strings in `hud.js` / `world.js`. It does not count `.rw-reticle` children. `healPadHome` does not match `/padHome/` (case), so the persist-field grep is still useful. A chrome child named `rw-hold` would pass the string pin.
**Fix:** Keep the pin. This leftover added no HUD nodes. Independent cite: reticle children remain pupil, three cilia, RANGE.

### Accessibility / theming / layout

- No new controls, focus rings, or hit targets in this leftover.
- Dock Digit 0/8/9 keyboard path stays. Pad-home did not insert a `DOCK_KEY_SERVICES` entry (that would shift Digit 0 off shipyard).
- Station notice still has `aria-live="polite"` (`station.js:5970–5972`). Heal does not reuse it.
- No new CSS tokens. No pad-home color. RANGE still uses `var(--cyan)` (`hud.css:215`).
- Empty / error / loading: N/A (no panel). Fail closed = keep flying (`world.js:712–730`). Do not paint a disabled freeze.
- Visual hierarchy: player read remains bounce on ram and live loiter hulls. No second glance channel.

### Digit / hub freeze table

| Surface | Live after Wave 110 | Status |
|---|---|---|
| `.rw-reticle` child | pupil / cilia / RANGE only (`hud.js:709–712`) | held |
| Pad-home pip | none | held |
| Hold marker / station-ring on glass | none | held |
| RANGE rewrite | TGT-01 (`hud.js:712`) | held |
| Digit 0 | shipyard | held |
| Digit 8/9 dock | launch / epics | held |
| Outfitting 8/9 | launcher / turret papers | held |
| New Digit | none from this leftover | held |
| Toast | no pad-home kind | held |
| Picture | hull spawn / hold | held |

### Required checks

| Check | Result |
| --- | --- |
| Did not add hub children | **Pass.** `hud.js:709–712` unchanged vs freeze. No `padHome` in HUD. Uncommitted HUD/CSS diff empty. |
| Did not steal Digit 0/8/9 | **Pass.** `station.js:188, 5938–5941, 6073–6080, 6152–6154`. Pad-home did not touch those binds. |
| Did not add pad-home pip | **Pass.** Absent on glass. Honor Picture §6. |
| Did not add pad-home toast | **Pass.** `toastForEvent` has no hold/pad case (`hud.js:491–609`). `world.js` emits none. |
| Persist/AI only (no chrome) | **Pass.** `world.js` author `381`; heal `709–735`; callers `457`, `846`. |

### Verdict (repeat)

**CLEAN.** Wave 110 PHY-05 shipped no product UI. HUD-01 empty 80 px hub, Digit 0/8/9, no pip, and no toast freeze all held.
