# Code Review: NAV-05 remaining autopilot gate handoff (Wave 116)

Design-only. Inventory re-census: `AP_LINES` (`autopilot.js` **20–32**), `nextHopId` **path[1]** (**101–106**), `wantJump` (**317**), hub cancel (**319–350**), `flyTick` `systemLoaded` (**372–380**), `gate.js` `apJump` (**643–649**), `resolveNavGatePos` (**nav-guidance.js** 89–97), `planApPath` `ok: false` only non-finite (**ap-path.js** 360–369), WAVE85/88 pins steer/teleport/fake arrive — **no** live multi-hop `systemLoaded` sequence. MERGE LAW deputizes wrong-hub no-cancel + English split + live route pin. Census leftover is **real** (not CONSUME; serial not none). No open 🔴/🟠.

Applied `C:\Users\barry\.grok\skills\orchestrator\references\code-review.md` plus persona `C:\Users\barry\.grok\bundled\skills\shared\personas\reviewer.md`. Did **not** spawn a reviewer agent. Did **not** run project-wide formatters.

### Summary

Document and contract agree: leftover is **handoff reliability + distinct reason lines + live `systemLoaded` proof**; fail closed is no emit / keep route; smallest additive is hub-cycle gate + `AP_LINES` split; PR plan is named-only **PR1 autopilot gate handoff**. MATCH / PHY-02 / NAV-01 persist stay consume. Later write-set does not claim HUD/CTL files. Re-dispatch expands later PR1 to include `src/systems/galaxychart.js` **only** for `#rw-galaxy-ap-live` `showApLive(apLine(reason))` on fly `disengage` while `chartOpen` (incl. chart Cancel). Chart stays open on engage. HUD toast-under-overlay is not leftover law.

### What's done well

- Re-census treats Wave 84 “no autopilot in src” as **stale**. Live functions `wantJump`, `apJump`, `resolveNavGatePos`, `systemLoaded` are cited.
- Refuses CONSUME: identical English is not “distinct enough,” and WAVE88 steer pins are not a route.
- Refuses second emitter / teleport / skip charge.
- Keeps `wantJump` on nearest `nearTo === hop` (avoids false jump).
- Wrong-hub cancel is the inbox-shaped bug (nearest hub not-listed while ring is in `JUMP.zone`).
- English table splits lookup vs path vs hub vs hop vs gate vs arrive.
- PR3 pin required to close leftover unless PR1 lands it.
- Digit / KeyM / KeyV / hub / persist / `innerHTML` / `state.js` stay frozen.
- Sibling Wave 116 HUD/CTL paths named do-not-steal.
- AP jump independent of `dockPressed`.

### Contract vs document consistency

| Topic | Integrator | Contract | Result |
|---|---|---|---|
| Merge winner | contract wins | this file wins | Match |
| Leftover | real; not CONSUME | §0.1 not CONSUME; serial not none | Match |
| Sole emit | `gate.js` `near.to` | §0.2 | Match |
| English split | deputize table | §0.1 | Match |
| Next hop | `path[1]` | §0.5 | Match |
| MATCH / PHY-02 | consume | §0.6–0.7 | Match |
| HUD/CTL write-set | none | §0.12 | Match |
| `galaxychart.js` write-set | live-region fly cancel only | §0.15 / brief goals 10+12 | Match |
| Close chart on engage | forbidden this leftover | §0.15 | Match |
| Chip reason paragraph | forbidden | §0.12 | Match |
| Live `systemLoaded` pin | required to close | §0.9 / §3 PR3 | Match |
| First serial | **PR1 autopilot gate handoff** | §3 | Match |

### Findings

No 🔴 Blocker or 🟠 Major (open).

#### 🟡 Minor: `planApPath` `ok: false` is rare

**Location:** `ap-path.js` 360–369; inventory §5; contract `missingPath`.

**Issue:** Live `ok: false` is almost only NaN inputs. Distinct `missingPath` still matters so a future math fail is not a “missing gate.”

**Fix:** Keep the token. Do not invent a second planner to “make `ok: false` more common.”

**Status:** documented; do not inflate leftover into PHY.

#### 🟡 Minor: WAVE87 is a directory, not a boot pin

**Location:** inventory §9; `scripts/boot-test.mjs` has WAVE85 / WAVE88 only.

**Issue:** A later impl might grep `WAVE87` in boot-test and “add” a colliding pin.

**Fix:** Honor `out/w87/ap-path/**` as frozen probes. New pin is WAVE116/NAV-05 named, not a WAVE87 rewrite.

**Status:** documented in inventory §9.

#### 🟡 Minor: Chip does not show the new reason

**Location:** `hud.js` 1953–1960 dest/next/rem; contract §0.12.

**Issue:** Players see the split line on `commLine` / chart `apLine`, not on the chip.

**Fix:** Frozen. Claiming `hud.js` would steal HUD-02. Chart live region already shows refuse `apLine`. Re-dispatch: fly cancel also paints that live region while `chartOpen`. Chip dest/next/rem stays.

**Status:** accepted; product law.

#### 🟡 Minor (re-dispatch, closed in freeze): Fly cancel had no allowed chart paint path

**Location:** prior freeze wrote-set omitted `galaxychart.js`; live `galaxychart.js` 621–624, 572–576; `autopilot.js` 181–196.

**Issue:** Designer Major: fly `disengage` only `commLine`s HUD toasts under overlay z-index 30. Chart Cancel did not `showApLive`.

**Fix:** Contract §0.15 + brief: later PR1 may write `galaxychart.js` only for `showApLive(apLine(reason))` while `chartOpen`, including chart Cancel. Do not close the chart on engage. Do not steal `hud.js`.

**Status:** closed in freeze. Named only. No `src/` this wave.

#### 💡 Suggestion: Export a `routedIsHubOnly` helper from `gate.js` next to `lookupLiveNavGate`

**Location:** `gate.js` 459–476; contract formulas.

**Issue:** Duplicating “physical ring vs hub” in `autopilot.js` can drift from lookup order (ring wins).

**Fix:** Later PR1 may add a boolean helper beside `lookupLiveNavGate`. Must still fail closed on reserved ids. Optional.

**Status:** optional.

### Status

No 🔴/🟠 open. Design pack consistent with the chart-open paint path. Wave 116 re-dispatch may report DONE on code review.
