# Code Review: HUD-02 remaining TARGET class silhouettes (Wave 115)

Design-only. Inventory re-census: `hudFamily` (`hud.js` 81–89), `classKeyToken` **player** only (**101–108**), `applyClassKeyAttr` on `#hud` (**110–115**, init **1101**, 5 Hz **1758**), `makeFacing` (**354–361**, self **864**, tgt **875**), unscoped player class CSS (`hud.css` **1286–1336** mech, **1590–1669** bio), **zero** `.rw-combat-target[data-class-key]`. MERGE LAW deputizes rail writer + player selector scope + cite live 22×10 metrics. Census leftover is **real** (not CONSUME; serial not none). No open 🔴/🟠.

Applied `C:\Users\barry\.grok\skills\orchestrator\references\code-review.md` plus persona `C:\Users\barry\.grok\bundled\skills\shared\personas\reviewer.md`. Did **not** spawn a reviewer agent. Did **not** run project-wide formatters.

### Summary

Document and contract agree: leftover is **class hint on existing target facing chrome**; fail closed is generic **family** facing on the **target** row; smallest additive is `.rw-combat-target[data-class-key]` from visible lock class plus player CSS scoped to `.rw-combat-self`; PR plan is named-only **PR1 target facing class tokens**. WAVE113 / WAVE114 stay player facing (consume + scope). Q-ship uses cover class.

### What's done well

- Re-census treats WAVE113/114 `#hud[data-class-key]` as **player** LIVE, not a target token.
- Refuses CONSUME: player leak onto `tgtFacing` is a lie, not a lock-class feature.
- Refuses putting lock class on `#hud` (would restyle `selfFacing`).
- One root writer stays; target rail is a **different node** (not a second `#hud` writer).
- Cover / visual class freeze matches `npc.js` 276–277 and `traffic-feel.js` `visualClassFor`.
- Mk II name pierce explicitly does **not** unmask the glyph (mesh still cover).
- Digit / hub / persist / `innerHTML` / `state.js` / KeyT/V/K/X stay frozen.
- Wave 112 knobs cited, not edited.
- Sibling Wave 115 paths named do-not-steal.

### Contract vs document consistency

| Topic | Integrator | Contract | Result |
|---|---|---|---|
| Merge winner | contract wins | this file wins | Match |
| Leftover | real; not CONSUME | §0.1 not CONSUME; serial not none | Match |
| Fail closed | generic family facing on **target** row | §0.12 / §2 | Match |
| Writer | rail on `.rw-combat-target`; not `#hud` | §0.11 | Match |
| Player CSS | narrow to `.rw-combat-self` | §0.1 / §0.13 | Match |
| Metrics | cite WAVE113/114 | §0.14 / §0.21 | Match |
| Q-ship | cover / visual class | §0.12 | Match |
| New persist / Digit / hub / `state.js` | no | §0.2–0.6 | Match |
| Family | player hullKind | §0.8 | Match |

### Findings

No 🔴 Blocker or 🟠 Major (open).

#### 🟡 Minor: Light target PR1 may be a no-op visually

**Location:** contract §0.1 “light may keep generic family facing on the target row.”

**Issue:** Light lock vs omitted attribute look the same.

**Fix:** Accepted. Same as WAVE113/114 light. Do not put LIGHT on RANGE.

**Status:** documented; do not inflate.

#### 🟡 Minor: Player family language on a mismatched lock hull

**Location:** contract §0.14 last paragraph; integrator player outcome.

**Issue:** A mech player locking a living hull still sees **mech plate language** on the target row (family from player). Class hint is inside that language.

**Fix:** Frozen. Lock-family `data-family` would be a third family surface and is a non-pick.

**Status:** accepted; product law, not a bug in this leftover.

#### 🟡 Minor: WAVE113/114 boot pins may grep unscoped CSS

**Location:** `scripts/boot-test.mjs` 22960–23225; contract §0.10; integrator acceptance item 5.

**Issue:** PR1 narrowing selectors to `.rw-combat-self` can fail a pin that greps `#hud[data-family="mech"][data-class-key` without `.rw-combat-self`.

**Fix:** PR1 pin hygiene only. This wave does not edit `boot-test.mjs`. Do not treat pin updates as leftover art.

**Status:** documented for the implementation wave.

#### 💡 Suggestion: Optional import of live `visualClassFor`

**Location:** `src/game/traffic-feel.js` 114–121; contract formulas.

**Issue:** Duplicating the cover ternary in `hud.js` can drift from `visualClassFor`.

**Fix:** Later PR1 may import `visualClassFor` then allowlist. Must still `hasOwn` `SHIP_CLASSES` (helper can return undefined / non-allowlisted strings).

**Status:** optional; formula already matches the helper’s cover gate (no Mk II pierce).

#### 💡 Suggestion: Hide-rail omit must not wait for 5 Hz

**Location:** `hud.js` 1256–1268 already hides the rail on the frame path; contract §0.11.

**Issue:** If omit waits for textAccum, a hidden rail could keep the last lock class in the DOM.

**Fix:** Frozen: omit immediately when `!shipTgt`.

**Status:** named in contract.

### Re-review

No Blocker/Major opened. Census leftover stays **real**. Serial stays **PR1 target facing class tokens**.
