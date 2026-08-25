# Code Review: NAV-06 remaining close-chart-on-AP (Wave 118)

Design-only. Re-census after overlay: AP button `tryEngage` **633–641** does **not** call `setOpen(false)`; `setOpen(false)` only at **644, 680, 687, 700**; `showApLive` cancel **629** and fly **719–730** live; `setOpen` open-gate **422–425**; `overlay-policy.js` **PRESENT**; hail flush `takeDeferredHail` (`hail.js` **512–516**). MERGE LAW deputizes button success → real `setOpen(false)` + blur / prefer HUD Cancel (§0.19), forbids pause-the-sim, `showApLive` rewrite, jump steal, KeyJ, toast-flood, second overlay-policy, CONSUME-via-NAV-05. Census leftover is **real**. No open 🔴/🟠.

Applied `C:\Users\barry\.grok\skills\orchestrator\references\code-review.md` plus persona `C:\Users\barry\.grok\bundled\skills\shared\personas\reviewer.md`. Did **not** spawn a reviewer agent. Did **not** run project-wide formatters.

### Summary

Document and contract agree: leftover is **close chart on successful AP engage only**; smallest additive is `setOpen(false)` on the Autopilot **button** success branch; `showApLive` stays sibling-owned; WAVE pins retune later via the **button**, because today’s pins call `tryEngage` directly. Overlay this wave keeps stay pins true and must not close on engage.

### What's done well

- Re-census treats stay-open as leftover, **not** CONSUME, even though NAV-05 pinned stay-open.
- Refuses pause-the-sim and teleport / skip-zone.
- Write-set names `galaxychart.js` **engage-success close only** so NAV-05 `showApLive` stays sibling-owned.
- Overlay coupling is explicit: real close, flush hail, do not fight open-gate mutex.
- WAVE117 pin **measurement vs product** is documented (imported `tryEngage` vs button). Later retune required.
- `controls.js` / KeyJ explicitly forbidden (CTL-01).
- Toast-flood and chart-label a11y called out as other inbox items.
- Digit 0/8/9 and HUD-01 hub frozen.
- Fail-closed table covers refuse, cancel, overlay helper miss, title, direct `tryEngage`.

### Contract vs document consistency

| Topic | Integrator | Contract | Result |
|---|---|---|---|
| Merge winner | contract wins | this file wins | Match |
| Leftover | real; not CONSUME | § header not CONSUME; serial not none | Match |
| Serial name | **PR1 chart-close-on-AP** | §3 | Match |
| Close on success | real `setOpen(false)` + blur / prefer HUD Cancel | §0.1 / §0.19 | Match |
| Close on refuse/cancel | no | §0.1 | Match |
| Pause | no | §0.7 | Match |
| `showApLive` rewrite | no | §0.8 | Match |
| Jump emit | `gate.js` only | §0.8 | Match |
| Overlay fight | real close; flush hail | §0.9 | Match |
| WAVE pins | overlay keeps true this wave; later button retune | §0.1 / §2 | Match |
| Persist / `state.js` | none | §0.5–0.6 | Match |
| Digit / hub | no | §0.2 | Match |
| `innerHTML` | no | §0.4 | Match |
| KeyJ / `controls.js` | cite only | §0.3 | Match |
| Toast-flood / labels | call out | §0.10 | Match |
| `overlay-policy.js` | none (already present; hail `takeDeferredHail`) | §4 | Match |

### Findings

No 🔴 Blocker or 🟠 Major (open).

#### 🟡 Minor: WAVE117 stay pins do not measure the Autopilot button

**Location:** `scripts/boot-test.mjs` 23547–23550, 23620–23627; contract §0.1 WAVE pins; inventory §6.

**Issue:** `chartStayOpen` / `chartEngageStay` call imported `tryEngage`. A later button-only `setOpen(false)` will **not** invert those pins. CI can stay green while the product is untested.

**Fix:** Later PR1 **must** retune those pins to `.rw-galaxy-ap` click on the not-flying branch: `chartOpen === false` && `nav.autopilot === true`. Keep `chartCancelLive` on cancel-while-open (reopen chart if needed). Overlay **this wave** must **not** retune them.

**Status:** documented; serial coupling, not a Wave 118 defect. Contract §2 partial-merge row covers it.

#### 🟡 Minor: `galaxychart.js` is in overlay, NAV-05, and this leftover write-sets (disjoint symbols)

**Location:** contract §4; overlay open-gate KeyM 674–688; NAV-05 `showApLive` 578–582, 629, 719–730; this leftover 633–641.

**Issue:** Three named serials may edit one file. A sloppy close PR that reformats `showApLive` or the KeyM mutex fights siblings.

**Fix:** PR1 touches **the success branch after `tryEngage` only** (empty token → `setOpen(false)` + blur / prefer HUD Cancel). **Re-census lines at impl.** Do not edit `showApLive`, cancel line, fly disengage loop, hover, labels, or overlay open-gate. Re-grep after merge.

**Status:** documented; serial coupling, not a Wave 118 defect.

#### 🟡 Minor: Success already calls `showApLive('')` — do not add chrome

**Location:** `galaxychart.js` 632–633; toast-flood sibling.

**Issue:** A later “announce engage” `commLine` or toast would steal P1 toast-flood. Live success is silent on the live node because the line is cleared.

**Fix:** Frozen: keep `showApLive('')`; visual close is the success cue. Do not emit extra `commLine` on empty token.

**Status:** accepted; contract §0.10.

#### 💡 Suggestion: Do not close from `autopilot.js` `tryEngage`

**Location:** `autopilot.js` 209–222; WAVE117 `e117(ctx)`.

**Issue:** Closing inside `tryEngage` would invert WAVE117 stay pins **this wave** if it landed early, and would close for every caller (boot, probes), not just the chart button.

**Fix:** Button path only. Frozen in explicit non-picks.

**Status:** frozen.

### Verdict

Spec is consistent with live code. Leftover REAL. Serial named only. No src/. No open Blocker/Major.

---

## Re-review (Wave 118 re-dispatch)

Designer Major (focus in `aria-hidden`) frozen in contract §0.19. Overlay helper present; hail flush is `takeDeferredHail` in `hail.js` update — later PR1 must not write those files. Inventory lines retuned to live overlay-shifted cites. Leftover still REAL. No new 🔴 Blocker or 🟠 Major. Did not steal `out/w118/toast/**` or `out/w118/overlay/**`.
