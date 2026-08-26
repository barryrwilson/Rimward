# UI Audit: NAV-10 docking approach leftover integrator (designer, round 2)

**Reviewer:** designer (parent `[designer]` pass)  
**Review file:** `out/w130/designer/dockapproach-ui-audit.md`  
**Round:** 2 (overwrites round 1). Re-audit after worker froze MATCH / self-rail SLOW.  
**Scope:** Wave 130 markdown freeze only. No product `src/` edit this wave. Live HUD cites for PR1 risk.  
**Sources:** `docs/Nav10DockApproachDesign.md`; `out/w130/dockapproach/shared-contract.md` (merge law wins); inventory; worker `out/w130/dockapproach/ui-audit.md`; live `src/systems/hud.js`, `src/ui/hud.css`.  
**Worker self-audit:** agree. MATCH / target-rail Major is named in freeze. Verdict is CLEAN for the integrator freeze.

### Summary

Round-1 Major is **closed**. The freeze names a distinct `.rw-slow-lamp` on **self** SPD, keeps MATCH `textContent` as `MATCH`, forbids SLOW on `tgtSpeed`, and keeps the 80 px hub. The player loop is still the right one: name SLOW in text before the 0.088 s in-zone window, keep KeyJ as tap. Live `J — Dock` with no speed teaching stays leftover REAL until PR1. No Blocker or Major remains in the freeze. Minors stay PR1 watch items, not freeze gaps.

### Round-1 Major close-out

| Round-1 requirement | Freeze (contract wins) | Live cite (still true; PR1 later) | Status |
|---|---|---|---|
| Distinct SLOW node on self SPD | §0.1 Approach lamp: `.rw-slow-lamp` (or equal) on `.rw-combat-self .rw-speed` only; second node, not MATCH reuse | `makeSpeed()` still one MATCH node (`hud.js` 378–401); `selfSpeed = makeSpeed(selfRail)` (`hud.js` 1089) | **closed** |
| MATCH text stays MATCH | §0.23; later copy table; fail-closed: never toggle `.rw-match-lamp` for SLOW | lamp `textContent` `MATCH` (`hud.js` 386); CSS `.rw-match-lamp` (`hud.css` 222–229) | **closed** |
| No `tgtSpeed` SLOW | §0.14; `tgtSpeed.set(speed)` only; partial merge fails if SLOW is stuffed into shared `makeSpeed` / `tgtSpeed` | `tgtSpeed = makeSpeed(tgtRail)` (`hud.js` 1101); `tgtSpeed.set(targetSpeedNow)` (`hud.js` 2524) | **closed** |
| Hub 80 px | HUD-01 empty hub; no SLOW pip on aim glass; overflow tightens lamp letter-spacing, not the reticle | `.rw-reticle` 80×80 (`hud.css` 184–193) | **closed** |
| Independent hide | Own `is-hidden` for SLOW; MATCH hide stays independent | MATCH already uses `is-hidden` (`hud.js` 386–400; `hud.css` 229) | **closed** |

### What's done well

- Inbox copy is named, not color-only: `Dock · SLOW — approach under 20 u/s` plus self-SPD text `SLOW` (`shared-contract.md` §0.1, later copy table).
- KeyJ stays the in-zone key chip (`hud.js` 2535–2536). CTL-01 is not remapped. KeyD stays strafe.
- Cue band `3 × U.DOCK_RANGE` (135 u) matches inventory §10: in-zone-only copy cannot be read at cruise 120 u/s. Partial merge (verb without lamp) is forbidden.
- Jump copy stays behind dock in the live if/else (`hud.js` 2535–2546). Contract hides the **self** SLOW lamp when jump owns the verb. Does not write Jump copy.
- HUD-01 hub stays the 80×80 reticle (`hud.css` 184–193). No aim-glass SLOW pip. HUD-06 HOME inset 108 is not claimed (`hud.js` 75, 981–987).
- Hail02 miss stays out-of-range toast (`hud.js` 808, 816). SLOW is not a second toast stack.
- `reducedMotion`: no new pulse. Live HUD already kills animation/transition under `body.rw-reduced-motion` (`hud.css` 1261–1267).
- Prompt write is already `textContent` (`hud.js` 2591–2594). `innerHTML` stays forbidden.
- Fail-closed hides (non-finite, docked, jumping, `berthHeld`) match a11y and overlay honor.
- Design doc and contract now agree on MATCH / self-rail / target SPD. Contract still wins if they drift.

### Findings

No 🔴 Blocker. No 🟠 Major.

#### 🟠 Major: Do not reuse the MATCH lamp or the target SPD rail — **closed in freeze**

**Location:** `src/systems/hud.js:378-401`, `1089`, `1101`, `2243-2244`, `2524`; `src/ui/hud.css:184-193`, `222-229`; freeze `shared-contract.md` §0.14, §0.23, §0.1 Approach lamp, §2  
**Issue (round 1):** Shared `makeSpeed()` builds one MATCH node on self and target rails. An unnamed MATCH sibling would steal Wave D or put a pad cue on the lock glance.  
**Fix landed in freeze:** Distinct `.rw-slow-lamp` on **self** SPD only. MATCH `textContent` stays `MATCH`. Do not pass SLOW into `tgtSpeed.set`. Own `is-hidden`. Do not grow the 80 px hub. Shared-factory SLOW is allowed only if opt-in and **self-only**. Shipping a MATCH-text swap or `tgtSpeed` SLOW **fails** the pack.  
**Status:** closed (must still land this way in PR1 HUD write)

#### 🟡 Minor: Long uppercase addendum on `.rw-prompt-verb`

**Location:** `src/ui/hud.css:807-837`; live salvage verb `hud.js:2548-2550`  
**Issue:** `.rw-prompt` is a nowrap flex row (default). Verb uses `text-transform: uppercase` and `letter-spacing: 0.22em` at 11px. Authored `Dock · SLOW — approach under 20 u/s` is much longer than live `Hail — dead in space`. At `--rw-text-scale: 1.5` the chip can collide with rails or clip. Not a Blocker: salvage already ships a long verb; do not add a HUD-07 column.  
**Fix:** Keep one `promptVerb.textContent` string. After playtest, shorten if wrap/overflow shows. Optional: `max-width` + wrap **only** if HUD-07 allows.  
**Status:** accepted with justification (reuse live prompt)

#### 🟡 Minor: Inbox 20 u/s vs live creep 30 keeps SLOW on

**Location:** inventory / `state.js` (creep 30); contract §0.1 “20 vs creep 30”; player outcome (double-tap F)  
**Issue:** Throttle 0 still creeps at 30. SLOW stays true until fullStop or dock. A player who “slowed down” still sees SLOW. Copy is honest vs inbox 20. Do not retune `state.js`. Do not put F into a new Digit.  
**Fix:** Keep warn-only copy. Teaching path is existing double-tap F. Optional playtest: if SLOW feels stuck, owner may change the **cue** threshold later, not creep.  
**Status:** accepted with justification

#### 🟡 Minor: MATCH + SLOW on a 220 px self rail

**Location:** `src/ui/hud.css:950-955` (`min-width: 168px`; `max-width: 220px`); `hud.js:386` MATCH lamp; contract §0.1 “Rail overflow: tighten lamp letter-spacing, not the reticle”  
**Issue:** Two lamps share `.rw-value` with integer + `u/s`. At high text scale the row can overflow the combat rail. Text still names both verbs, so this is layout, not color-only. Freeze already forbids growing the hub to absorb overflow.  
**Fix:** Distinct SLOW span; `nowrap` + hide when false. Do not move lamps onto the reticle. If overflow, drop letter-spacing on the lamp, not the number, not `.rw-reticle`.  
**Status:** watch in PR1 CSS; not a freeze Blocker/Major

#### 🟡 Minor: Jump bubble can hide the 3× lamp

**Location:** `src/systems/hud.js:2532-2546`; contract §0.14 / §0.1 Jump hide  
**Issue:** Dock wins when `station.inZone`. Jump is `else if`. Hide SLOW when `gate.inZone && !station.inZone`. A pad approach that clips a gate zone loses the early SPD lamp, then may enter 45 u with little brake time. Comment says zones never overlap in practice. Correct to prefer Jump copy over SLOW.  
**Fix:** Keep the hide. Do not replace `Jump to {dest}` or hub `G` copy. Do not show SLOW on the jump charge bar.  
**Status:** accepted; Jump vs Dock collision handled

#### 💡 Suggestion: Prefer append on self rail, not a default factory lamp

**Location:** `hud.js:378-401`, `1089`, `1101`; contract §0.1 “Do not add SLOW inside shared `makeSpeed()` unless opt-in and used only by self”  
**Issue:** An opt-in flag is legal. A default extra node in `makeSpeed()` would still paint SLOW onto `tgtSpeed`.  
**Fix:** PR1 safest path: append `.rw-slow-lamp` after `selfSpeed = makeSpeed(selfRail)`. Leave `tgtSpeed.set(targetSpeedNow)` speed-only.

#### 💡 Suggestion: Early lamp names SLOW, not 20 u/s

**Location:** contract later copy (SPD lamp = `SLOW`); in-zone verb names 20  
**Issue:** A11y honor wants threshold in text. The readable band is 3×. Lamp at 135 u is only `SLOW`. The integer SPD still shows speed. Inbox 20 lives on the late in-zone line.  
**Fix:** Optional playtest: lamp `SLOW` is enough if the number is visible. Do not steal HUD-04 toast to repeat 20. Do not paint HOME pip with 20.

#### 💡 Suggestion: Warn token vs cyan MATCH

**Location:** `src/ui/hud.css:222-227` MATCH is `var(--cyan)`; palette `--rw-warn` amber  
**Issue:** Two cyan words `MATCH SLOW` can read as one state. Color must stay extra, never the only cue.  
**Fix:** Keep the word `SLOW`. If a token is used, amber/warn is fine **with** text. No pulse. `body.rw-reduced-motion` already zeros animation.

#### 💡 Suggestion: Optional PR2 still

One still: cruise in 3× band, self SPD shows `SLOW` (text), MATCH unchanged if off, target SPD has no SLOW, hub empty 80 px, HOME pip + inset 108 unchanged, prompt still Jump if gate owns, no hail-miss toast, no pause.

---

### Focus checklist (this brief)

| Focus | Verdict |
|---|---|
| Player-facing dock cue | Freeze is correct: keep `J` + `Dock`; addendum only when speed > 20. Live hole is leftover REAL (`hud.js:2535-2536`) until PR1. |
| SLOW lamp | Text lamp required. **Round-1 Major closed:** new node on **self** SPD; do not reuse MATCH (`hud.js:386`). |
| MATCH copy | Frozen `MATCH`. Never toggle `.rw-match-lamp` for SLOW. |
| Target SPD | Frozen speed-only (`hud.js:2524`). No SLOW node. |
| 3× range timing | Required. In-zone-only is ~0.088 s (inventory §10). Partial merge (verb without lamp) forbidden. |
| Color not only cue | Freeze correct. Honor matches live HUD comment (`hud.js:48-49`) and MATCH text pattern. |
| Empty 80 px hub | Freeze correct (`hud.css:184-193`). No SLOW pip on aim glass. Overflow is lamp tracking, not reticle size. |
| `reducedMotion` | Freeze correct: no new animation. Gate any CSS with `body.rw-reduced-motion` (`hud.css:1261-1267`), not `prefers-reduced-motion` alone. |
| KeyJ not remapped | Freeze correct. KeyJ tap stays. No hold governor in PR1. |
| No steal HUD-06 HOME | Freeze correct. Pip + chevron + inset 108 stay (`hud.js:75`, `981-987`). |
| No steal Hail02 miss | Freeze correct. Do not reuse `warn\|hailmiss\|*` (`hud.js:808-816`). |
| Jump vs Dock prompt | Live dock-first (`hud.js:2535-2546`). Hide SLOW lamp when jump owns verb. Do not write Jump copy. |

### Worker self-audit (agree / dissent)

- **Agree:** leftover REAL; PR1 HUD cue not governor; 3× lamp; color+text; hub empty; reducedMotion; KeyJ tap; Jump hide; Hail02 / HOME not this pack; uppercase-verb Minor; 20 vs creep Minor; MATCH + SLOW rail overflow is PR1 CSS watch, not freeze Major.
- **Agree (round 2):** “Designer Major (MATCH reuse / target SPD) is resolved in freeze” is true. Distinct `.rw-slow-lamp` on self; MATCH stays `MATCH`; no `tgtSpeed` SLOW; hub 80 px.
- **Dissent:** none this round.

### Verdict

**CLEAN.** No Blocker. No Major remaining in the integrator freeze. Round-1 MATCH / self-rail Major is closed. PR1 must still land self-rail SLOW **text** + in-zone addendum together, without MATCH theft, `tgtSpeed` SLOW, hub pip, Hail02 toast, HOME retune, Jump copy steal, KeyJ hold, or new animation.
