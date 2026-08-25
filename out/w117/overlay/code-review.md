# Code Review: CTL-02 remaining overlay-priority (Wave 117)

Design-only. Inventory re-census: hail z **40** live, no pause (`hail.js` **8–9, 108**); chart z **30** + `chartOpen` (`hud.css` **1908**; `galaxychart.js` **422, 669–674**); berth z **60** local `berthOpen` (`save.js` **1352, 1382–1496**); `openCard` **421** no calm check; salvage `letGo` **185–186** no `calmUntil`; live `letGo` **192** +30 s; NPC `updateResolve` **1377** skips emit during calm but demand **1869** and `openCard` do not; no overlay helper; `flags` have `chartOpen` only (`ctx.js` **200–208**). MERGE LAW deputizes mutex + defer + session calm, forbids pause-the-sim, KeyJ, `showApLive`, toast-flood. Census leftover is **real** (not CONSUME; serial **PR1 overlay-priority**). No open 🔴/🟠.

Applied `C:\Users\barry\.grok\skills\orchestrator\references\code-review.md` plus persona `C:\Users\barry\.grok\bundled\skills\shared\personas\reviewer.md`. Did **not** spawn a reviewer agent. Did **not** run project-wide formatters.

### Summary

Document and contract agree: leftover is **overlay-priority / defer / hail-calm**; smallest additive is a session helper plus three open gates; play cards **never** pause; PR plan is named-only **PR1 overlay-priority**. NAV-05 file-share on `galaxychart.js` is called out as open-gate-only.

### What's done well

- Re-census treats live stack + reopen as leftover, not CONSUME.
- Refuses pause-the-sim (event flush `main.js` 149–156 would drop hails).
- Refuses persist calm (instance clock already exists).
- Write-set names `galaxychart.js` **mutex only** so NAV-05 `showApLive` stays sibling-owned.
- `controls.js` / KeyJ explicitly forbidden (CTL-01). Census: KeyJ **already LIVE** as `pendingDock` (`controls.js` 291–292). Do not remap.
- Toast-flood and chart-label a11y called out as other inbox items.
- Digit 0/8/9 and HUD-01 hub frozen.
- Fail-closed table covers title, models, typing, dead ship defer, helper miss.

### Contract vs document consistency

| Topic | Integrator | Contract | Result |
|---|---|---|---|
| Merge winner | contract wins | this file wins | Match |
| Leftover | real; not CONSUME | §0.1 not CONSUME; serial not none | Match |
| Serial name | **PR1 overlay-priority** | §3 | Match |
| Pause play cards | no | §0.7 | Match |
| Defer incoming hail | yes (DOM `openCard` only) | §0.1 | Match |
| Calm gate | `openCard` + salvage +30 s | formulas | Match |
| Persist | none | §0.6 | Match |
| Digit / hub / `state.js` | no | §0.2–0.5 | Match |
| `innerHTML` | no | §0.4 | Match |
| `showApLive` / close-chart-on-AP | do not steal | §0.8 | Match |
| KeyJ | cite only (LIVE dock; do not remap) | §0.3 | Match |
| Toast-flood | call out | §0.10 | Match |

### Findings

No 🔴 Blocker or 🟠 Major (open).

#### 🟡 Minor: `galaxychart.js` is in both NAV-05 and CTL-02 later write-sets (disjoint symbols)

**Location:** contract §4; NAV-05 `showApLive` `galaxychart.js` 572–576; this leftover KeyM 669–674.

**Issue:** Two named serials may edit one file. A sloppy PR1 overlay that reformats `showApLive` fights NAV-05.

**Fix:** Overlay PR1 touches **`setOpen` / KeyM open condition only**. Do not edit `showApLive`, AP button, hover, labels. Re-grep after merge.

**Status:** documented; serial coupling, not a Wave 117 defect.

#### 🟡 Minor: `ai.hailed` never resets; calm gate is still required

**Location:** `npc.js` 1415 vs 227; `hail.js` 421.

**Issue:** Same-instance bargaining hail already will not re-emit after `letGo`. The inbox hole is **DOM `openCard`**, salvage KeyH, demand emit, Callow, and **respawn**. A later PR that only sets `ai.hailed = true` again would miss salvage reopen.

**Fix:** Gate in `hail.js` `openCard` / KeyH as frozen. Still write salvage `calmUntil`.

**Status:** documented; contract formulas already put the gate in hail.js.

#### 🟡 Minor: Optional `ctx.flags.hailOpen` vs helper-only

**Location:** contract §1; `ctx.js` 200–208.

**Issue:** Chart KeyM cannot see module-local `open` / `berthOpen` without flags or helper import. Deputize allows **either** session flags **or** helper registers. Two mechanisms could drift.

**Fix:** Impl picks **helper as API**; flags are optional mirrors written by the same helper. Do not teach three openers three different booleans.

**Status:** accepted; impl note. Not a freeze contradiction.

#### 💡 Suggestion: Do not “fix” Wave 40 ladder comments in `PROGRESS.md`

**Location:** `PROGRESS.md` 4730–4733 vs live chart z 30.

**Issue:** Wave 40 text says banners 30; live chart CSS is 30. This leftover must **not** edit `PROGRESS.md`.

**Fix:** Inventory records the drift. Leave PROGRESS to other workers.

**Status:** frozen.

### Verdict

Spec is consistent with live code. Leftover REAL. Serial named only. No src/. No open Blocker/Major.
