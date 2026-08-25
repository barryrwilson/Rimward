# UI Audit: PHY-05 remaining pad-home (Wave 109 HUD / Digit freeze)

**Auditor:** `[designer]` (independent of `out/w109/padhome/ui-audit.md`)
**Scope:** HUD-01 empty 80 px hub; Digit 0 / 8 / 9; pad-home pip / toast / Digit; picture = hull spawn/hold, not chrome. Markdown only. No `src/` UI shipped this wave.
**Review file:** `out/w109/designer/padhome-ui-audit.md`
**Method:** `orchestrator/references/ui-audit.md` + `orchestrator/assets/designer-persona.md`. Spec + live HUD/Digit cites. No Playwright. No Vite. [NO BROWSER COVERAGE].
**Date:** 2026-08-24
**Product source:** review only (no `src/` edits; brief not edited)

Owner freeze: merge law `out/w109/padhome/shared-contract.md` wins over `docs/Phy05PadHomeDesign.md`. Later serials obey the contract. Inventory `out/w109/padhome/current-phy05-inventory.md` (code wins).

## UI Audit: pad-home HUD / Digit freeze (design-only)

### Summary

No product chrome ships this wave. The brief and contract freeze pad-home as **authorship / persist heal**: patrol `route[0]` becomes a hold outside D5; `recordPosition` spawn is the picture. Later implementation **cannot** steal HUD-01’s 80 px hub, Digit 0/8/9, or add a pad-home pip, toast, or Digit **if it obeys this pack**. Picture is hull spawn/hold, not chrome. 0 blockers. 0 majors.

### Verdict

**CLEAN.** 0 blockers, 0 majors, 1 minor, 2 suggestions remaining.

### What's done well

- Player-facing change is traffic, not a widget: after save/load, a patrol hull no longer pops from the D5 core (`docs/Phy05PadHomeDesign.md` Picture §6; Player outcome; contract leftover sentence after §0.19).
- HUD-01 is named and closed. Contract §0.2: no pad-home pip, hold marker, or station-ring on the aim glass; RANGE stays TGT-01; **do not** put pad-home chrome inside `.rw-reticle`; **no new DOM**.
- Live hub matches the freeze: `.rw-reticle` is 80×80 (`src/ui/hud.css` 184–193). `initHud` children are pupil, three cilia, RANGE (`src/systems/hud.js` 709–712). No hold child exists.
- Digit law is named and closed. Contract §0.3: Digit 0 shipyard; Digit 8 dock root launch; Digit 9 dock root epics / Standing; outfitting 8/9 launcher / turret papers; **no new Digit**; pad-home is **not** a dock verb. First remaining serial **must not steal** Digit 0/8/9.
- Live Digit map confirms the law (not the stale line cites — see Minor): `DOCK_KEY_SERVICES` last item is `shipyard` (`station.js` 188); dock-root Digit 0 selects that last key (`station.js` 6075–6077); Digit 8 → index 7 `launch`; Digit 9 → index 8 `epics` (`station.js` 5938–5941, 6073–6080); outfitting Digit 8/9 arm launcher / turret papers (`station.js` 1633–1634, 1710–1713, 5529–5586, 6152–6154).
- Ownership table writes HUD / Digit as **none** (contract §1; brief Ownership). PR1 does not land HUD or Digit. PR2 pins “no hub child; no Digit steal.”
- Explicit non-picks forbid pad-home pip / RANGE rewrite, Digit / SKU / UU, and toast “clear of station.”
- Fail-closed missing helper keeps live dest and **never** freezes hulls (contract §0.16, §2). That is the correct empty/error state: traffic keeps flying. No freeze overlay. No “wait for hold” chrome.
- `innerHTML` forbidden later; `textContent` / `h()` / `el()` / `createTextNode` only (contract §0.4, §4.2). XSS and glance copy stay on the live HUD channel.
- Reduced motion: heal has no `@keyframes`. Do not invent a “safe pad” pulse for vestibular users.
- Both HUD families keep the same glance set. No bio/mech hold widget.
- Manual stick is unchanged. Bounce / STAR HEAT remain the contact language (`hud.js` 587–593). RANGE stays TGT-01.

### Freeze confirmation (later serial)

| Surface | Live | Spec freeze | Later serial |
|---|---|---|---|
| HUD-01 80 px hub | `.rw-reticle` 80×80; pupil + 3 cilia + RANGE (`hud.css` 184–193; `hud.js` 709–712) | Contract §0.2; brief Honor / Picture | **Must not** add a child, pip, hold marker, or station-ring |
| RANGE | TGT-01 label inside reticle (`hud.js` 712) | RANGE stays TGT-01 | **Must not** paint hold distance |
| Pad-home pip | absent | Non-pick + §0.2 | **Forbidden** |
| Toast | hull strike / STAR HEAT / star-kill only (`hud.js` 587–593) | “No toast required”; non-pick “clear of station” = No; no new DOM | **Must not** add a pad-home toast |
| Digit 0 | shipyard (`station.js` 188, 6075–6077) | §0.3 | **Must not steal** |
| Digit 8 dock root | launch | §0.3 | **Must not steal** |
| Digit 9 dock root | epics / Standing | §0.3 | **Must not steal** |
| Outfitting 8/9 | launcher / turret papers | §0.3 | **Must not steal** |
| New Digit / dock verb | none | Pad-home is not a dock verb | **Forbidden** |
| Picture | hull spawn via `recordPosition` | Picture §6; not a HUD label | **Must not** sell the heal with chrome |

If later PR1 touches only `world.js` author / `healPadHome` / `holdClassFor` / callers, and PR2 greps no hub child and no Digit steal, this freeze holds.

### Findings

None at 🔴 Blocker / 🟠 Major.

#### 🟡 Minor: Digit freeze cites point at `undock()`, not Digit 0/8/9

**Location:** `out/w109/padhome/shared-contract.md:25–26` (and inventory `out/w109/padhome/current-phy05-inventory.md:167–169`); live `src/systems/station.js:188, 5938–5941, 6073–6080` vs cited `6041–6046`
**Severity:** minor
**Status:** open (law text is correct; line cites are stale; this wave is markdown-only — do not edit the brief from this audit)
**Issue:** Contract §0.3 cites Digit 0 at `station.js` 188, **6041–6043** and implies Digit 8/9 nearby. Live 6041–6046 is `undock()` clearing `compNote` / traffic pending flags, not Digit dispatch. Live Digit 0 is 6075–6077 (`d === 0` → last `DOCK_KEY_SERVICES` = shipyard). Live Digit 8/9 dock root is 6073–6080 (`d - 1` into the frozen array: index 7 launch, index 8 epics). Menu hotkeys 1–9, 0 are painted at 5938–5941. A later pin that greps **6041–6043** will miss a Digit steal and will not prove shipyard/launch/Standing still bind.
**Fix:** Later serial (PR2 pin, or a contract-cite heal in a markdown wave that is allowed to edit the contract) retarget cites to `188, 5938–5941, 6073–6080` and outfitting `1633–1634, 6152–6154`. Keep the **law**: Digit 0 shipyard; 8 launch; 9 epics / papers. Do not steal keys to “fix” the cite. This designer pass does not edit the brief.

#### 💡 Suggestion: Read “No toast required” as “do not add a toast”

**Location:** `out/w109/padhome/shared-contract.md:25`; `docs/Phy05PadHomeDesign.md:12, 103, 115, 243`; non-pick table contract §0.1 “Toast clear of station” = **No**
**Severity:** suggestion
**Status:** optional (combined with **No new DOM** and HUD ownership **none**, freeze already holds)
**Issue:** “Not required” is weaker than “forbidden.” A naive later PR could add an optional “hold clear” / “off pad” comm line and claim it is not a pip.
**Fix:** Later impl treats toast as forbidden on this leftover. Reuse live hull-strike / STAR HEAT only when bounce or sun already fires. Do not add a pad-home event kind.

#### 💡 Suggestion: Do not add world-space hold rings either

**Location:** contract §0.2 (aim glass only); brief Picture §6 “Reuse live cameras. No new chrome.”
**Severity:** suggestion
**Status:** optional (Picture + “no new chrome” already close the hole)
**Issue:** §0.2 names aim-glass pip / station-ring. A Three.js berth ring or pad sprite would not be a `.rw-reticle` child and would still steal the picture (hull spawn, not a marker).
**Fix:** Later serial adds **no** hold mesh, sprite, or station-ring in world or HUD. Readability is `recordPosition` outside D5.

### Accessibility / theming / layout

- No new controls, focus rings, or hit targets this wave or in the named PR1.
- Existing dock Digit 0/8/9 keyboard path stays; pad-home must not insert a service in `DOCK_KEY_SERVICES` (that would shift Digit 0 off shipyard).
- Station notice already has `aria-live="polite"` (`station.js` 5970–5972). Do not reuse it for hold heal.
- No new CSS tokens. No hardcoded pad-home color. No responsive overlay.
- Empty / error / loading: N/A (no panel). Fail closed = keep flying (contract §2). Do not paint a disabled freeze.
- Visual hierarchy: primary player read remains bounce on ram and live loiter hulls 80–150 u out. Do not add a second glance channel.

### Digit / hub freeze table

| Surface | Spec | Later serial |
|---|---|---|
| `.rw-reticle` child | none new (pupil / cilia / RANGE stay) | forbidden |
| Pad-home pip | none | forbidden |
| Hold marker / station-ring on glass | none | forbidden |
| RANGE rewrite | TGT-01 | forbidden |
| Digit 0 | shipyard | do not steal |
| Digit 8/9 dock | launch / epics | do not steal |
| Outfitting 8/9 | launcher / turret papers | do not steal |
| New Digit | none | forbidden |
| Toast | not required; “clear of station” = No | do not add |
| Picture | hull spawn / hold | not chrome |

### Required checks

| Check | Result |
| --- | --- |
| Later impl cannot steal HUD-01 empty 80 px hub | **Pass (spec).** Contract §0.2 + PR1 “does not land HUD” + PR2 “no hub child.” Live hub 80 px (`hud.css` 184–193). |
| Later impl cannot steal Digit 0/8/9 | **Pass (spec).** Contract §0.3 + first serial must-not-steal + ownership HUD/Digit **none**. Live binds: 6075–6077 / 6073–6080 / outfitting 6152–6154. Stale 6041 cites are a pin-quality Minor, not a law hole. |
| Later impl cannot add pad-home pip / toast / Digit | **Pass (spec).** Pip forbidden; new Digit forbidden; toast non-pick + no new DOM. Read “not required” as do-not-add (Suggestion). |
| Picture is hull spawn/hold, not chrome | **Pass.** Brief Picture §6 and Player outcome. Contract leftover is persist + author + spawn via `recordPosition`. |

### Verdict (repeat)

**CLEAN.** HUD-01 and Digit 0/8/9 stay frozen on paper. Later serials must not grow chrome to sell the persist heal.
