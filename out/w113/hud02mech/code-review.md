# Code Review: HUD-02 remaining plated / mech class silhouettes (Wave 113, iteration 3)

Design-only. Inventory re-census: `hudFamily` (`hud.js` 81–89), sibling `classKeyToken` bio-only (**101–108**), `applyClassKeyAttr` (**110–115**, init **1101**, 5 Hz **1757–1758**), `makeFacing` (**354–361**, **864**, **875**), mech plate (`hud.css` **1262–1284**, 21/22 px fill), bio class tokens LIVE (**1538–1617**). MERGE LAW deputizes **extend one writer** + in-box triangle/square budgets. Census leftover is **real** (no mech `[data-class-key]` CSS). Designer Majors (22 px overflow; fail-closed vs sibling; heavy/freighter collide) **closed in markdown**. No open 🔴/🟠.

Applied `C:\Users\barry\.grok\skills\orchestrator\references\code-review.md`. Did **not** spawn a reviewer agent. Did **not** run project-wide formatters.

### Summary

Document and contract agree: leftover is **class hint on existing mech facing chrome**; fail closed is live **family** facing; smallest additive is extend `classKeyToken` + authored mech CSS inside the 22×10 numeric budget; PR plan is named-only. Living sibling is **LIVE** and named consume. Stale “overlay does not read classKey” lines are gone.

### What's done well

- Re-census treats bio `data-class-key` as sibling LIVE, not this leftover.
- Refuses CONSUME of the **mech** leftover (still one generic plate).
- Fail-closed no longer names “generic plate when not mech.”
- One-writer rule: extend `classKeyToken`; do not fork `applyClassKeyAttr`.
- Numeric budget table: `left+width ≤ 22`, sil size frozen, unreadable key omits CSS.
- WAVE62/65 pins stay. Digit/hub/`state.js`/`innerHTML`/HUD-03 stay frozen.

### Contract vs document consistency

| Topic | Integrator | Contract | Result |
|---|---|---|---|
| Merge winner | contract wins | this file wins | Match |
| Leftover | real mech plate | §0.1 not CONSUME | Match |
| Fail closed | live family facing | §0.12 / §2 | Match |
| 22 px budget | hint table + §0.14 copy | §0.14 numeric table | Match |
| Heavy vs freighter | heavy 16×8; freighter 18×8 realloc | §0.14 uniqueness | Match |
| Sibling | extend `classKeyToken` | §0.11 one writer | Match |
| New persist / Digit / hub / `state.js` | no | §0.2–0.6 | Match |
| Bio clip-path | consume 1538–1617 | §0.21 | Match |

### Findings

No 🔴 Blocker or 🟠 Major (open). Designer Majors **closed**.

#### 🟠 Major (closed): “Longer” cutter / frigate overflow

**Location:** contract §0.14 numeric table; integrator hint table.

**Fix landed:** sil 22×10 frozen. `left+width ≤ 22`. Cutter nose 4 / body 17. Frigate nose 3 / body 18×4. Unreadable key omits CSS. No wet-navy photocopy.

**Status:** closed in markdown.

#### 🟠 Major (closed): Fail-closed steal sibling chrome

**Location:** contract §0.12 / §2; integrator mermaid + deputize.

**Fix landed:** unknown → live family facing. Family not mech → no mech CSS, no mech plate, no attribute delete. PR1 extends `classKeyToken`. Stale “overlay does not read classKey” removed.

**Status:** closed in markdown. Do not reopen.

#### 🟠 Major (closed): Authored `heavy` and `freighter` share one plate

**Location:** contract §0.14 table (iter 2 both 5 / 5 / 1 / 16 / 8).

**Fix landed:** heavy stays tall-only (`16×8`, nose 5). Freighter is tall **and** realloc (`18×8`, nose 3, `left+width=21`, `top+height=9`). Uniqueness invariant: authored tuples must not collide. Color is not the cue.

**Status:** closed in markdown.

#### 🟡 Minor: Light PR1 may be a no-op visually

**Location:** light keeps live 5/16×6 plate.

**Status:** accepted; same as sibling light organism.

#### 🟡 Minor: Shared player token on self and target facing

**Location:** `makeFacing` 864 and 875.

**Status:** accepted; do not key off lock classKey.

#### 💡 Suggestion: Later optional WAVE pin under mech

**Status:** named-only PR2.

### Re-review

All three designer Majors closed. Overflow and sibling-steal stay closed. No new Blocker/Major.
