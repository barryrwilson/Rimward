# UI Audit: FX-01 hull-local shield ripple (Wave 111 PR1)

**Auditor:** `[designer]` (independent of `out/w111/fx01/ui-audit.md`)
**Scope:** Wave 111 FX-01 PR1 — hull-local shield ripple. Confirm the ring rides the struck hull, first-person player host does not parent a full-size ring onto the living nose, `reducedMotion` snaps one frame, unshielded XOR stays sparks+marks, HUD-01 80 px hub stays empty, Digit 0/8/9 stay, no punch combo meter, facing-rail flash stays off the reticle.
**Review file:** `out/w111/designer/fx01-ui-audit.md`
**Method:** `C:\Users\barry\.grok\skills\orchestrator\references\ui-audit.md` + `C:\Users\barry\.grok\skills\orchestrator\assets\designer-persona.md`. Live cites: `src/systems/combat.js` (`spawnRipple` / `spawnHitFx` / park / FP skip), `src/ui/hud.css` hub 80 px, `src/systems/hud.js` reticle + facing rail, Digit 0/8/9 in `src/systems/station.js`, merge law `out/w110/fx01/shared-contract.md`. Worker self-audit `out/w111/fx01/ui-audit.md`. No Playwright. No Vite. [NO BROWSER COVERAGE].
**Date:** 2026-08-24
**Product source:** review only (no `src/` edits)

Honor: HUD-01 empty hub; Digit 0 shipyard; Digit 8/9 stay; no punch pip on `.rw-reticle`; kit mutate omit. Contract `out/w110/fx01/shared-contract.md` wins if the brief forks.

## UI Audit: hull-local shield ripple (Wave 111 PR1)

### Summary

PR1 parents the pooled shield ring to the struck host. The picture is world FX on the hull, not a HUD pip. First-person player host stays scene/world-space (no full-size parent on the living nose). `reducedMotion` still snaps one static frame at scale 5.5 then parks. Unshielded hits still XOR to sparks + pool-12 marks. The 80 px hub, Digit 0/8/9, RANGE, and facing-rail flash are untouched. No 🔴 Blocker. No 🟠 Major.

### Verdict

**CLEAN.** 0 blockers, 0 majors. Hull-local ring landed. Hub / Digit / facing-rail freeze held. Residual first-person world-space copy near the nose is contract-allowed, not a hub child.

### What's done well

- Shielded hits parent via `worldHitToLocal` + `RIPPLE_LIFT` (0.16, not `HULL_MARK_LIFT`) and `host.add(f.sprite)` (`src/systems/combat.js:207`, `:1050–1088`). Scale/opacity animate in local space (`combat.js:2047–2049`, `2.2 + 7.2*k`). `THREE.Sprite` still billboards. The ring rides the turn. It is not a `.rw-reticle` child.
- First-person + player host skips parent (`fpPlayer` at `combat.js:1065–1068`). Fail-closed world copy uses `scene.add` + `position.copy(pos)` (`combat.js:1097–1102`). Chase/third player host and NPC hosts still parent when pose is finite. Matches contract formula `out/w110/fx01/shared-contract.md:92–99` and §2 `:156`.
- `reducedMotion` sets `f.snap` and scale 5.5 / opacity 0.75 (`combat.js:1051–1063`). Tick shows one frame then `parkRipple` (`combat.js:2030–2038`). No extra pulse. No new `#hud` `@keyframes`. Shake/recoil already zero (`src/systems/ship.js:1207–1211`). HUD CSS still kills `#hud *` animation (`src/ui/hud.css:1185–1188`). Facing flash stays a static red outline under reduced motion (`hud.css:305–308`).
- XOR is intact: `spawnHitFx` shielded → `spawnRipple`; else `spawnSparks` + `stampHullMark` (`combat.js:1109–1116`). Unshielded does not get a ring. Sparks still gate under `reducedMotion` (`combat.js:961–962`, `:2053–2054`). Marks stay pool 12 (`src/game/hull-marks.js:7`).
- Park matches marks: `parkRipple` / `parkRipplesOnHost` / `parkAllRipples` (`combat.js:1031–1046`); destroy / `systemLoaded` / orphan parent (`combat.js:1163–1196`, `:1743–1745`, `:1800–1802`, `:1820–1821`). Busy pool skips a new ring; `applyHit` still ran. Fail closed never `speed = 0`.
- Family tint still uses engine `FAMILY_COLORS` on the shared `makeRippleRing` atlas (`combat.js:198`, `:402–419`, `:1060`). No user shader. No `innerHTML` in `combat.js`.
- HUD-01 hub is still 80×80, `pointer-events: none` (`hud.css:184–193`). `initHud` children remain pupil, three cilia, RANGE (`hud.js:709–712`). RANGE stays TGT-01 (`hud.css:207–220`). Combat does not mention `.rw-reticle`.
- Facing-rail flash stays on `.rw-combat-self` (`hud.js:846`, `:1109–1151`, `:1391–1399`; `hud.css:897–899` offset `calc(-100% - 78px)`). `playerHit` only sets `selfHitFlashUntil`. No move onto the hub.
- Digit 0 stays shipyard (`station.js:188`, labels `:5963–5966`, dock-root `d === 0` `:6098–6102`). Digit 8 dock root is launch (index 7); Digit 9 is epics / Standing (index 8). Outfitting 8/9 stay launcher / turret papers (`station.js:1644–1645`, `:1721–1750`, `:6177–6179`). FX-01 did not bind a Digit.
- No punch pip, combo meter, impact meter, or hit-count string in `hud.js` / `hud.css` / `combat.js`. Recoil and shake stay consume. Kit mutate omit.

### Findings

None at 🔴 Blocker / 🟠 Major.

#### 🟡 Minor: First-person player world-space ring can still sit near the glass

**Location:** `src/systems/combat.js:1065–1102` (`fpPlayer` skip + `position.copy(pos)`); scale grow `combat.js:2047–2048` (`2.2 + 7.2*k`); muzzle glass offset `combat.js:1004–1026`; camera `src/systems/ship.js:84` (`FIRST_PERSON_NOSE` z=−2.8); contract `out/w110/fx01/shared-contract.md:73`, `:92–94`, `:156`
**Severity:** minor
**Status:** open residual. Contract allows world-space copy. Not a hub pip. Not a full-size parent.

**Issue:** Forbidding **parent** of a full-size ring is not the same as keeping the 80 px glass clear. A shielded player hit in first person still occurs on the hull near the nose. PR1 copies that world `pos` at live ring scale. Muzzle already shrinks (`base` 1.15) and steps `addScaledVector(_dir, 2.4)`. The FP ripple path does not. A nose hit can still read large on the aim glass. It does not parent onto the living hull, so it does not fill the glass as a child of the ship.

**Fix:** Not required for PR1. Optional later playtest: skip the ring when `host === playerObj && firstPerson`, or scene-parent + muzzle-style small scale **and** push off the nose. Do not parent. Do not add a hub pip to cover the copy. Do not raise shake.

#### 🟡 Minor: Untextured hit flash can clash with a riding ring

**Location:** flash pool `src/systems/combat.js:594–606` (no `map`); `spawnFlash` `:990–999`; grow `:1992–2004`; optional PR2 `out/w110/fx01/shared-contract.md:165`
**Severity:** minor
**Status:** documented. Out of PR1. Do not fix in this leftover.

**Issue:** `spawnHitFx` still fires an untextured square at world `pos` on every hit, then the shielded ring. The square stays scene-parented while the ring may ride the hull. A hard square plus a parented ring can read cheap. This is not HUD chrome.

**Fix:** Optional PR2 `glowTex` after playtest. Do not put a flash pip on `.rw-reticle` to cover the square. Do not parent the flash through the mark pool.

#### 💡 Suggestion: HUD CSS `reducedMotion` is not the ripple safety net

**Location:** `src/ui/hud.css:1185–1188` (`#hud *` only); JS snap `src/systems/combat.js:1051–1057`, `:2030–2038`
**Severity:** suggestion
**Status:** honored in PR1 JS. Reminder only.

**Issue:** Ripple sprites live on the Three scene (or the host), not under `#hud`. CSS `animation: none` does not stop `sprite.scale` / `opacity` writes.

**Fix:** Keep the JS `f.snap` path. Do not add hit `@keyframes` on `#hud` “to honor reduced motion.”

#### 💡 Suggestion: Do not reuse RANGE, iris, or facing flash as punch chrome

**Location:** RANGE `hud.js:712`, `hud.css:207–220`; iris `hud.css:320–327`; facing flash `hud.js:1149–1151`, `:1391–1399`, `hud.css:293–308`; contract `out/w110/fx01/shared-contract.md:25`, `:117`
**Severity:** suggestion
**Status:** frozen. PR1 did not land this.

**Issue:** Painting hit-count on RANGE, pulsing `.rw-reticle::after` on shield hit, or moving `selfHitFlashUntil` onto the hub would smash TGT-01 / HUD-01 / HUD-02.

**Fix:** Keep the freeze. Combat continues to emit `playerHit` only.

### Accessibility / theming / layout / states

| Check | Live PR1 |
|---|---|
| Contrast | No new HUD paint. Ring uses engine `makeRippleRing` + `FAMILY_COLORS` (`combat.js:198`, `:402–419`, `:1060`). `#hud` tokens (`hud.css:9–27`) unused by this leftover. Colorblind / contrast / reduced-motion body classes stay. |
| Focus / keyboard / semantics | No new control. `.rw-reticle` is `pointer-events: none` (`hud.css:191`). Digit 0/8/9 keyboard path in `station.js` is unchanged. |
| Theming | No new CSS variable. No hardcoded hub pip color. Family tint is combat atlas, not HUD chrome. |
| Responsive | No overlay. 80 px hub is center-absolute (`hud.css:184–190`). Rails stay 57% / ±78 px (`hud.css:885–903`). Full-size FP **parent** would ignore hub size and fill the canvas — **not landed**. |
| Loading / empty / error / disabled | N/A panel. Fail closed = keep firing (`combat.js:1097–1101`; contract §2). Busy pool skips a ring; never freeze sim. Missing host / NaN pose / helper false → world copy. |
| Hover / focus | N/A. |
| Vestibular | `reducedMotion` mutes ripple pulse (`combat.js:1051–1057`, `:2033–2038`) and zeros shake/recoil (`ship.js:1207–1211`). Sparks do not emit (`combat.js:961–962`). HUD CSS kills `#hud` animation (`hud.css:1185–1188`). Facing flash is a static outline (`hud.css:305–308`). |
| Visual hierarchy | Punch is world FX on the hull, not a label. Rails stay off the reticle. RANGE still means in-range (TGT-01). |

### Digit / hub / FX freeze table

| Surface | Live | Contract | Wave 111 PR1 |
|---|---|---|---|
| `.rw-reticle` | 80 px hub, pupil, 3 cilia, RANGE (`hud.css:184–220`; `hud.js:709–712`) | no punch pip §0.2 | **Held.** No new child |
| `.rw-reticle::before` / `::after` | dashed range ring + iris spin | consume | **Held.** Not a hit pip |
| RANGE | TGT-01 (`hud.js:712`; `hud.css:207–220`) | RANGE stays TGT-01 | **Held.** |
| Punch / combo / impact meter | absent | forbidden §0.2 | **Held.** No meter |
| Facing flash | `.rw-combat-self` 0.4 s (`hud.js:846`, `:1149–1151`, `:1391–1399`) | do not move to hub | **Held.** Off the reticle |
| Digit 0 | shipyard (`station.js:188`, `:6098–6102`) | §0.3 | **Held.** Not stolen |
| Digit 8 dock root | launch (`station.js:188`, `:5963–5966`, `:6104–6105`) | §0.3 | **Held.** |
| Digit 9 dock root | epics / Standing | §0.3 | **Held.** |
| Outfitting 8/9 | launcher / turret papers (`station.js:1721–1750`, `:6177–6179`) | §0.3 | **Held.** |
| New Digit | none | no new Digit | **Held.** `DOCK_KEY_SERVICES` length 10 |
| `reducedMotion` | snap one frame then park | §0.19 | **Held.** Scale 5.5; no extra pulse |
| FP player host | world-space copy; no `host.add` | no full-size parent | **Held.** Residual glass occupancy is 🟡 |
| Unshielded XOR | sparks + stamp | §0.18 | **Held.** No ring through shell |
| Hull-mark pool | 12 | do not resize | **Held.** |
| `innerHTML` | none in `combat.js` | §0.4 | **Held.** |
| Persist | scene pointers only | no `WORLD_FIELDS` | **Held.** Park on load |
| Picture | ring on hull | not a HUD pip | **Held.** |

### Cross-check vs worker `out/w111/fx01/ui-audit.md`

Worker found no Blocker/Major and one 💡 on first-person world-space near the glass. Designer agrees the freeze held (empty hub, Digit, XOR, snap, no full-size FP parent, facing rail off reticle). This pass raises the FP residual to 🟡 because glass occupancy is a real aim-read issue, still **not** a contract break. Extra 🟡: untextured `spawnFlash` (optional PR2, already named). CSS reduced-motion reminder stays 💡; PR1 JS snap is in place.

Wave 110 designer `out/w110/designer/fx01-ui-audit.md` froze punch pip / FP parent / extra pulse as **forbidden**. PR1 did not land those three. Flag paths stay dark.

### Honor

- HUD-01 empty hub.
- Digit 0/8/9 not bound.
- Aim-glass gauges stay off.
- Facing-rail flash stays on `.rw-combat-self`.
- Kit mutate omit.
- Unshielded XOR sparks + marks.
- `reducedMotion` snap-one-frame.

**CLEAN.** Live hull-local ripple parents to the host, keeps first-person player host off the living nose, snaps under `reducedMotion`, leaves the 80 px hub empty, and does not steal Digit 0/8/9 or the facing rail.
