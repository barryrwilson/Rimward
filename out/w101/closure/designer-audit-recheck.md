## UI Audit recheck: TGT-03 remaining target closure-rate freeze (Wave 101)

**Auditor:** `[designer]` recheck after XOR / exclusive-glyph freeze.  
**Scratch:** `out/w101/closure/designer-audit-recheck.md`. Review only. No product source edited.  
**Applied:** `C:\Users\barry\.grok\skills\orchestrator\assets\designer-persona.md`, `C:\Users\barry\.grok\skills\orchestrator\references\ui-audit.md`.  
**Prior pass:** `out/w101/closure/designer-audit.md` (CLEAN). Worker self-audit `out/w101/closure/ui-audit.md`.  
**Scope:** `docs/Tgt03ClosureDesign.md`, `out/w101/closure/shared-contract.md`, live `src/systems/hud.js` / `src/ui/hud.css` (read-only). No CLOS node in `src/` this wave.

### Summary

The freeze still holds. Deputize CLOS is glyph XOR sign: authored `+N u/s` / `-N u/s` / `0 u/s` only. Rail has no «/». Forbidden `«-12 u/s`. Mk II «/» stays exclusive `<` / `>` on the arc sibling (`.rw-contact-close`). Hub theft, Digit steal, color-only approach/recede, and a CLOS pulse under `reducedMotion` are still not proposed. This recheck opens **no** 🔴 Blocker and **no** 🟠 Major.

### What's done well

- **XOR format is MERGE LAW.** Contract §1.1 deputize is signed, no rail glyph. Recede always has ASCII `+`. Approach uses hyphen-minus from `String(n)`. Zero is `0 u/s` with no sign and no «/». Forbidden strings name `«-12 u/s`, `«+12 u/s`, `»+12 u/s`, `« 12 u/s`, and any «/» plus `+`/`-`. Brief table “Rail format?” and player outcome §2 match. PR2 names `+N u/s` / `-N u/s` / `0 u/s` and **no** rail «/».
- **Mk II stays on the arc.** Live tests are exclusive: `along < -CONTACT_CLOSE_FLOOR` → `'«'`, `along > CONTACT_CLOSE_FLOOR` → `'»'` (`hud.js` 75, 1490–1491, 1497). Glyph-only owner override must copy those inequalities; `|along| == 4` has no «/». Contract §0.14 / §2: scanner-gated pip only. Do not merge with rail CLOS.
- **Picture still matches DIST.** Later row: `el()` + `.rw-label` `CLOS` + `.rw-value` / `textContent` (`hud.js` 243–248, 855–857). New class on the **rail** only (`.rw-combat-clos`). Forbidden: `.rw-contacts`, `.rw-contact-close`, `.rw-contact-pip`, `.rw-edge-arrow`, `.rw-nav-gate-cue`, `.rw-reticle`, `.rw-lead`.
- **a11y: sign is the cue, not color.** Live HUD law: color is never the only signal (`hud.js` 43–44). Deputize carries `CLOS` + `+`/`-`/`0` + unit `u/s`. PR3 repeats that trio. Contrast vars still color the rail; they are redundant with the authored string (brief Acceptance 8).
- **`reducedMotion`: number stays; no pulse.** Contract §7 and brief goal 5: no new `@keyframes` on `.rw-combat-clos`. Live kill-switch already exists (`hud.css` 1179–1185). Contacts enter pulse (`hud.css` 863–874; `hud.js` 74, 1518–1519) stays **arc-only** — the pattern **not** to copy.
- **No product CLOS yet.** Grep of `src/` finds no `CLOS` / `.rw-combat-clos` widget. Hub still RANGE-only (`hud.js` 700–703). `innerHTML` in `hud.js` is still 0.

### Recheck: freeze claims vs live code

| Claim | Live / freeze | Recheck |
|---|---|---|
| Authored rail format | `+N u/s` / `-N u/s` / `0 u/s` (`shared-contract.md` §1.1; brief §1 / §2) | **Pass.** XOR. No rail «/». |
| Forbidden double-mark | `«-12 u/s` named in contract §1.1, brief §1, PR2 | **Pass.** Closed from prior 🟡. |
| Mk II exclusive band | `along < -4` / `along > 4` (`hud.js` 1490–1491); `|along| == 4` → empty `textContent` | **Pass.** Inclusive `>=` still forbidden. |
| 80 px hub / RANGE | `hud.css` 184–191; RANGE child `hud.js` 703; clamp `hud.js` 1198 | **Pass.** No CLOS child. No lock box. |
| Digit 0 / 8 / 9 | Dock `DOCK_KEY_SERVICES` shipyard / launch / epics (`station.js` 186, 5917–5925). Outfit Digit 8/9 papers (`station.js` 5983–5985). | **Pass.** No extra Digit. No TRACKED key. |
| KeyT / KeyV / KeyX / KeyK | `controls.js` 268, 283, 280, 289 | **Pass.** Untouched. |
| Color-only close/recede | Sign + label + unit; live law `hud.js` 43–44 | **Pass.** Sign is the cue. |
| CLOS pulse / `reducedMotion` | No new `@keyframes`; `body.rw-reduced-motion #hud *` (`hud.css` 1181–1184) | **Pass.** Number stays. |
| DIST scanner gate | **None.** Comment + write `hud.js` 1385–1386, 2018–2035 | **Pass.** Rail CLOS follows DIST. |
| SPD ≠ CLOS | `targetSpeedNow = targetVel.length()` (`hud.js` 1261, 2040) | **Pass.** Formula is `along`, not magnitude. |
| NPC 40 | `ENVELOPE_CLOSE_RATE = 40` at `src/systems/npc.js` 112 | **Pass.** Not HUD. |
| Non-ship rate | `shipTgt` hide (`hud.js` 1221–1235) | **Pass.** Hide / em-dash; never player SPD. |
| Cone 12 px | `LOCK_CONE_PX = 12` (`reticle-aim.js` 15) | **Pass.** |

### Findings

No 🔴 Blocker. No 🟠 Major.

#### 🟡 Minor: Extra CLOS row still grows tgt rail until `measureRails()` (unchanged)

**Location:** `hud.js` 860 `tgtSize.height = 120`; `hud.js` 863–874, 2026–2029; `hud.css` 81–86, 884–895; rail `top: 57%` vs `.rw-contacts` `bottom: 5.5%` (`hud.css` 787–795).

**Issue:** Live tgt rail already stacks name, FORE/AFT, SCREEN, SHELL, ENGINE, hull, SPD, DIST. One more `.rw-meter` is ~17 px. Bio hair-off boxes use `tgtSize`. Init cache 120 px is stale until measure.

**Fix:** Later PR2: create the CLOS row once at init (`hud.js` 30–32). Call `measureRails()` after append and when the rail first unhides. Do not steal `.rw-contacts` to save space. Keep CLOS immediately after DIST in DOM.

**Status:** frozen in contract §1.1; later-impl check. Not a Wave 101 blocker.

#### 🟡 Minor: First-frame `0 u/s` can still lie before a velocity sample (unchanged)

**Location:** contract §1.3 “Em-dash `—` or `0 u/s`”; contacts wait for `haveLast` (`hud.js` 1483–1484); DIST init `'—'` (`hud.js` 857).

**Issue:** A first paint of `0 u/s` reads as “not closing” while `targetVel` is zeroed on lock change (`hud.js` 1247–1250).

**Fix:** Later impl: show `—` until one valid `dt` sample (copy contacts). Then write-on-change like DIST (`hud.js` 2031–2035). Never flash player SPD or lock scalar SPD into that slot.

**Status:** contract allows either; prefer em-dash.

#### 🟡 Minor: Orchestrator §0.8 still says “optional static «/» chars” (wording drift, not picture drift)

**Location:** `shared-contract.md` §0 line 8 vs §1.1 / §1.3 / §8 PR2 / §9 Q3.

**Issue:** §0.8 still allows “optional static «/» chars” on CLOS. Deputize MERGE LAW forbids rail «/». A later serial that reads only §0.8 could re-paint `«-12 u/s`.

**Fix:** Later doc pass (not this recheck): change §0.8 to “number + static unit; deputize has **no** rail «/». Glyph-only override is owner-only and XOR with sign.” Do not weaken §1.1.

**Status:** open as wording only. Picture, PR2, and forbidden-string list stay signed-only. Not 🟠 because §1.1 wins on conflict.

#### 💡 Suggestion: Build CLOS like DIST, not `makeSpeed` (unchanged)

**Location:** `hud.js` 300–325 (`rw-match-lamp` on every `makeSpeed` row); MATCH is TGT-02 (`hud.js` 1784–1785, 2040).

**Fix:** Copy the DIST row (`hud.js` 855–857). Class `.rw-combat-clos` on the rail row only. Do not clone MATCH.

#### 💡 Suggestion: No `aria-live`, no `is-enter`, no scanner pierce on CLOS (unchanged)

**Location:** contacts `aria-hidden` (`hud.js` 796); q-ship pierce is **name** only (`hud.js` 2023–2025); pulse `hud.js` 1518–1519.

**Fix:** Visual readout only. Visibility follows `shipTgt`. `reducedMotion`: number still updates; no `@keyframes` on `.rw-combat-clos`.

### Hub / lock / Digit / scanner / a11y freeze (Blocker if a later serial violates)

| Surface | Live | Freeze after XOR | Recheck |
|---|---|---|---|
| 80 px `.rw-reticle` | `hud.css` 184–191; RANGE only `hud.js` 700–703 | No CLOS child, no lock box, no gauge | **Pass** (not proposed) |
| RANGE pop | `hud.js` 1348–1358 | Untouched TGT-01 | **Pass** |
| `.rw-contacts` / `.rw-contact-close` | `hud.js` 795–811, 1481–1497 | Forbidden for rail CLOS. Mk II «/» exclusive on the **arc** | **Pass** |
| `.rw-edge-arrow` | `hud.js` 738; `hud.css` 576–594 | Direction of lock, not rate | **Pass** |
| Digit 0/8/9 | shipyard / launch / epics; outfit papers | No extra Digit | **Pass** |
| KeyT / KeyV / KeyK / KeyX | cycle / lock / engine / MATCH | Untouched | **Pass** |
| DIST scanner gate | **None** (`hud.js` 1385–1386, 2018) | CLOS follows DIST; do **not** newly gate DIST | **Pass** |
| Color-only close/recede | Contacts use «/» text (`hud.js` 1497) | Rail: `CLOS` + `+N`/`-N`/`0` + `u/s`. Sign is the cue | **Pass** |
| Rail «/» + signed number | — | XOR; deputize signed only; never `«-12` | **Pass** |
| Inclusive glyph band | Live is exclusive `<` / `>` | Copy live; `|along| == 4` → no «/» | **Pass** |
| CLOS pulse | Contacts pulse is arc-only | No new `@keyframes`; number stays under `reducedMotion` | **Pass** |
| Non-ship rate | Rail hidden (`hud.js` 1221–1235) | Hide / em-dash; never player SPD | **Pass** |

### Verdict

**CLEAN.** No open 🔴 Blocker or 🟠 Major after the freeze recheck.

Confirm:

- **No hub theft.** CLOS is a later sibling of DIST on `.rw-combat-target`. Not inside `.rw-reticle`. Not next to RANGE.
- **No Digit steal.** Digit 0/8/9 stay. No extra Digit. No KeyT/KeyV/KeyK/KeyX steal.
- **a11y is not color-only.** The sign (`+` / `-` / `0`) plus label `CLOS` plus unit `u/s` is the cue.
- **`reducedMotion` has no pulse.** Number still updates. No new CLOS `@keyframes`.
- **Format XOR.** Authored `+N u/s` / `-N u/s` / `0 u/s` only. Rail has no «/». Forbidden `«-12 u/s`. Mk II «/» stays exclusive `<` / `>` on the arc sibling.

Later serial: do not weaken `shared-contract.md` §1.1. Align §0.8 wording with XOR before PR2 if a later doc pass runs.
