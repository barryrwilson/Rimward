## UI Audit: TGT-03 remaining target closure-rate freeze (Wave 101)

**Auditor:** `[designer]` (parent pass). Worker `out/w101/closure/ui-audit.md` is a self-audit only; this file is the review of record.  
**Scope:** `docs/Tgt03ClosureDesign.md`, `out/w101/closure/shared-contract.md`, live `src/systems/hud.js` / `src/ui/hud.css`. No product source edited.  
**Applied:** `C:\Users\barry\.grok\skills\orchestrator\assets\designer-persona.md`, `C:\Users\barry\.grok\skills\orchestrator\references\ui-audit.md`.

### Summary

The freeze is rail-legal. CLOS is one labeled meter on `.rw-combat-target` next to live DIST. Hub theft, lock box, extra Digit, contacts/edge-arrow steal, color-only approach/recede, CLOS pulse, and a new scanner gate on DIST are all forbidden. Those remain **Blockers if a later serial violates them**. This markdown does not open any 🔴 or 🟠.

### What's done well

- Picture matches the live DIST pattern: `el()` + `.rw-label` + `.rw-value` / `textContent` (`hud.js` 855–857, 243–248). Same glance family as SPD/DIST.
- Empty 80 px hub stays empty of a CLOS child (`hud.css` 184–191; `hud.js` 700–703, 1198). RANGE stays TGT-01 (`hud.js` 703, 1348–1358).
- Four surfaces stay distinct: `.rw-contacts` (scanner arc), `.rw-contact-close` (Mk II «/»), `.rw-edge-arrow` (lock off-glass), `.rw-combat-target` (vitals + DIST + later CLOS). Contract §2.
- Fail-closed copies live `shipTgt` (`hud.js` 1221–1235): rock / station / gate / pod / landmark never get a ship LOS rate. SPD magnitude is not CLOS (`hud.js` 1261 vs 1285, 1487–1491).
- Scanner does **not** gate DIST today (`hud.js` 1385–1386, 2018–2035). Rail CLOS is frozen to follow DIST. Mk II «/» stays `scanner >= 2` on the lock pip only (`hud.js` 1481–1497).
- Approach/recede is not color-only: deputize `+N`/`-N`/`0` + unit `u/s` + label `CLOS` (`shared-contract.md` §1.1). Mk II «/» stays on the arc with exclusive `along < -4` / `along > 4` (`hud.js` 1490–1491). Live HUD law already says color is never the only signal (`hud.js` 43–44).
- `reducedMotion`: number stays; no new `@keyframes`. Live `body.rw-reduced-motion #hud *` already kills animation (`hud.css` 1179–1185). Contacts enter pulse is the pattern **not** to copy onto CLOS (`hud.css` 863–874).
- `innerHTML` stays 0 in `hud.js`. Q-ship names stay on the name row (`hud.js` 2022–2028); CLOS is numeric only.
- `measureRails()` is called out so bio `rw-hair-off` boxes track tgt height (`hud.js` 860–874, 1329–1345, 2026–2029).

### Findings

No 🔴 Blocker or 🟠 Major in this freeze.

#### 🟡 Minor: Extra CLOS row grows tgt rail; `measureRails()` must run after the node exists

**Location:** `hud.js` 860 `tgtSize.height = 120`; `hud.js` 863–874, 1714–1718, 2026–2029; `hud.css` 884–895 `min-width: 168px; max-width: 220px`; rail at `top: 57%` vs `.rw-contacts` at `bottom: 5.5%` (`hud.css` 787–795).

**Issue:** Live tgt rail already stacks name, FORE/AFT, SCREEN, SHELL, ENGINE, hull, SPD, DIST (`hud.js` 847–857). One more `.rw-meter` is ~17 px (`hud.css` 81–86). Bio hair boxes use `tgtSize` (`hud.js` 118–132). Init cache 120 px is stale until measure. `measureRails()` today runs on resize, textScale, and **name** change — not on DIST text width. Hidden rails use `#hud .is-hidden { display: none }` (`hud.css` 36), so offsetHeight is 0 until shown. Short viewports + `textScale` leave little gap above the contacts arc.

**Fix:** Later PR2: create the CLOS row once at init (performance contract `hud.js` 30–32). Call `measureRails()` after append and when the rail first unhides (name write already does this because hide clears `last.railName`). Do not steal `.rw-contacts` to “save space”. Keep CLOS immediately after DIST in DOM.

**Status:** frozen in brief §3 / contract §1.1; still a later-impl check.

#### 🟡 Minor: Optional «/» plus a leading minus double-marks approach — **closed in MERGE LAW**

**Location:** `shared-contract.md` §1.1 (XOR); live contacts glyph has no digits (`hud.js` 1497).

**Issue (was):** signed integer plus `'«'` prefix painted `«-12 u/s`.

**Fix landed:** glyph XOR sign. Deputize is `+N u/s` / `-N u/s` / `0 u/s` only. Forbidden `«-12 u/s`. Glyph-only override copies exclusive `along < -4` / `along > 4`; `|along| == 4` has no «/».

**Status:** closed. Worker `ui-audit.md` pins `+N` / `-N` / `0`.

#### 🟡 Minor: First-frame `0 u/s` can lie before a velocity sample

**Location:** contract §1.3 “Em-dash `—` or `0 u/s`”; contacts wait for `haveLast` and sane `dt` (`hud.js` 1483–1484); DIST init text is `'—'` (`hud.js` 857).

**Issue:** Empty/error state is underspecified. A first paint of `0 u/s` reads as “not closing” when `targetVel` is still zeroed on lock change (`hud.js` 1247–1250). Contacts already fail closed until a prior sample exists.

**Fix:** Later impl: show `—` until one valid `dt` sample (copy contacts). Then write-on-change like DIST (`hud.js` 2031–2035). Never flash player SPD or lock scalar SPD into that slot.

**Status:** contract allows either; prefer em-dash.

#### 💡 Suggestion: Build CLOS like DIST, not `makeSpeed`

**Location:** `hud.js` 300–325 (`rw-match-lamp` on every `makeSpeed` row); MATCH is driven on **self** SPD (`hud.js` 1784–1785); tgt SPD is `tgtSpeed.set(targetSpeedNow)` only (`hud.js` 2040).

**Issue:** Cloning `makeSpeed` would put a hidden MATCH lamp on CLOS and invite a KeyX steal in review. MATCH is TGT-02 and out of this serial.

**Fix:** Copy the DIST row (`hud.js` 855–857): label `CLOS`, value node, `span.rw-unit` `u/s`. Class `.rw-combat-clos` on the rail row only.

#### 💡 Suggestion: No `aria-live`, no pulse class, no scanner pierce on CLOS

**Location:** contacts `aria-hidden` (`hud.js` 796); q-ship name pierce uses `scanner >= 2` (`hud.js` 2023–2025) for **name**, not DIST; enter pulse `is-enter` (`hud.js` 1518–1519, `hud.css` 863–874).

**Issue:** A 5 Hz live region would spam AT. Gating CLOS on scanner because the name row already reads scanner would newly gate a core aid. Copying `is-enter` / `CONTACT_PULSE` would fight `reducedMotion` even though CSS kills animation (`hud.css` 872–874, 1181–1184).

**Fix:** Visual readout only. Visibility follows `shipTgt` like DIST. `reducedMotion`: number still updates; no `@keyframes` on `.rw-combat-clos`.

### Hub / lock / Digit / scanner freeze (Blocker if a later serial violates)

| Surface | Live | Freeze | This audit |
|---|---|---|---|
| 80 px `.rw-reticle` | `hud.css` 184–191; RANGE child only `hud.js` 700–703 | No CLOS child, no lock box, no gauge | Pass (not proposed) |
| RANGE pop | `hud.js` 1348–1358 | Untouched TGT-01 | Pass |
| `.rw-contacts` / `.rw-contact-close` | `hud.js` 795–811, 1481–1497 | Forbidden for rail CLOS | Pass |
| `.rw-edge-arrow` | `hud.js` 738; `hud.css` 576–594 | Direction of lock, not rate | Pass |
| Digit 0/8/9 | station shipyard / launch / papers | No extra Digit | Pass |
| KeyT / KeyV / KeyK / KeyX | cycle / lock / engine / MATCH | Untouched | Pass |
| DIST scanner gate | **None** (`hud.js` 1385–1386, 2018) | CLOS follows DIST; do **not** newly gate DIST | Pass |
| Color-only close/recede | Contacts use «/» text (`hud.js` 1497) | Rail: `+N`/`-N`/`0` + unit; no rail «/» | Pass |
| CLOS pulse | Contacts pulse is arc-only | No new `@keyframes`; number stays under `reducedMotion` | Pass |
| Non-ship rate | Rail hidden (`hud.js` 1221–1235) | Hide / em-dash; never player SPD | Pass |

### Verdict

**CLEAN.** No open 🔴 Blocker or 🟠 Major in the Wave 101 freeze. Later serial: keep CLOS off the hub, off `.rw-contacts`, off `.rw-edge-arrow`; do not add a Digit; do not scanner-gate DIST; paint `+N`/`-N`/`0` (not color, not `«-12`); no pulse under `reducedMotion`.
