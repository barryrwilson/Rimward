# Code Review: HUD-02 remaining living class silhouettes (Wave 111)

Design-only. Inventory cites live `hudFamily` (`hud.js` 81–89), `dataset.family` without `classKey` (1083, 1719–1737), `makeFacing` one glyph (337–344), bio clip-path (`hud.css` 1503–1526), mech plate (1262–1284), `SHIP_CLASSES` six keys (`state.js` 37–44), `makeLivingHull` modest 3D sil (`ship.js` 264–268, 280–339), hangar `classKey` persist (`save.js` 94; `hangar.js` 40–42), WAVE62/WAVE65 pins. MERGE LAW deputizes `data-class-key` tokens without `state.js` write, without hub child, without family rewrite. Census leftover is **real** (not CONSUME). No open 🔴/🟠.

Applied `C:\Users\barry\.grok\skills\orchestrator\references\code-review.md` + persona `C:\Users\barry\.grok\bundled\skills\shared\personas\reviewer.md`. Design-doc checklist folded in. Did **not** spawn a reviewer agent (no spawn tool). Did **not** run project-wide formatters or the full test suite.

### Summary

Document and contract agree: leftover is **class hint on existing living facing chrome**, not a third family, not a hub gauge; fail closed is today’s generic bio glyph; smallest additive is allowlisted `data-class-key` + authored CSS in the 22×10 box; PR plan is named-only; Digit/hub/`state.js`/no-new-key/`innerHTML`/HUD-03 freezes sit in MERGE LAW. Inventory line numbers match Wave 111 live `src/`. Family skins and family audio named **LIVE consume**.

### What's done well

- Code-wins census: drops Wave 62 identities and Wave 65 audio from “remaining.”
- Correctly separates **one bio organism glyph** (LIVE) from **six class HUD glyphs** (ABSENT) so WAVE62 facing CSS is not inverted.
- Refuses CONSUME; does not invent a fake hub instrument.
- Fail-closed table matches live “HUD ignores classKey” and never-throw unknown keys.
- First serial named **PR1 living facing class tokens**; Digit 0/8/9 and `state.js` forbidden on that PR.
- WAVE62/65 boot pins fenced as honor, not invert.
- Player vs lock `classKey` split prevents a TGT/Q-ship leak.
- `hudFamily` must not switch on `classKey` — honors frozen Wave 61 contract §3.2.

### Contract vs document consistency

| Topic | Integrator doc | Contract | Result |
|---|---|---|---|
| Merge winner | contract wins | this file wins | Match |
| Leftover owner | class hint on bio chrome | §0 / §0.1 `data-class-key` | Match |
| Real vs CONSUME | real | §0.1; non-pick CONSUME | Match |
| Fail closed | generic bio; never stop | §0.12 / §2 | Match |
| Smallest additive | allowlisted attribute + CSS | §0.1 | Match |
| New persist key | no | §0.6 | Match |
| Family / audio | consume | §0 Wave 62/65 | Match |
| Digit 0/8/9 | freeze | §0.3 | Match |
| Hub | no class pip | §0.2 | Match |
| `state.js` | READ-ONLY | §0.5 | Match |
| First serial | PR1 | §3 PR1; no Digit; no state.js | Match |
| `innerHTML` | forbidden | §0.4 | Match |
| Lock classKey | ignore | §0.13 | Match |
| HUD-03 skin | closed | §0.8 | Match |

### Findings

No 🔴 Blocker or 🟠 Major (open).

#### 🟡 Minor: Light PR1 may be a no-op visually

**Location:** deputize table: `light` keeps live generic organism; `hud.css` 1503–1526 already is that glyph.

**Issue:** Five other keys carry the leftover. Light identity is intentional (wayfinder / player family). Reviewers might think PR1 “did nothing.”

**Fix:** Acceptance: light bit-identical facing clip is **pass**. Heavy/ace/cutter/frigate/freighter must differ **inside 22×10**. Optional PR2 stills prove the five.

**Status:** accepted; documented in integrator deputize table.

#### 🟡 Minor: `livingSilhouette` already hints cutter/heavy in 3D

**Location:** `ship.js` 264–268.

**Issue:** Overlay leftover is still real (HUD ignores classKey), but playtest may say 3D already “enough” for cutter/heavy.

**Fix:** Owner may skip PR2 stills. PR1 still frozen as smallest overlay hint. Do not CONSUME the overlay leftover from 3D scale alone.

**Status:** documented; census §4 vs §11.

#### 💡 Suggestion: Later PR2 add a WAVE pin `data-class-key`

**Location:** `boot-test.mjs` WAVE62 11875–11972 already greps `hudFamily`.

**Issue:** Boot will still pass if the attribute never lands. WAVE62 must **not** invert.

**Fix:** Later optional pin: allowlisted heavy sets `data-class-key="heavy"`; unknown omits; `hudFamily` still ignores classKey. Do not edit boot in this markdown worker.

**Status:** frozen as named-only PR2.

### Re-review

No Blocker/Major opened. Light no-op and 3D modest sil remain documented, not blocking.
