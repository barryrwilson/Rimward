# Code Review: HUD-02 PR3 living (bio) skin + AGEZ hide

**Method:** Self-applied `C:\Users\barry\.grok\skills\orchestrator\references\code-review.md` + `C:\Users\barry\.grok\bundled\skills\shared\personas\reviewer.md`.  
**Scope:** bio CSS, AGEZ math, fail-closed `rw-hair-off`, 5 Hz period, WAVE62 pins, `out/w62/bio/probe.mjs`.  
**Pass:** 2 (re-apply after hoist of `clipSeg` and `bioPeriodSec`).

## Code Review: bio family + AGEZ

### Summary

Living extras sit under `#hud[data-family='bio']`. Rails keep two outward hairlines with a 52 px outer inset. AGEZ hide runs on the reticle/lead path against a cached rail size. Mech CSS is untouched. Probe is CLEAN.

### What's done well

- Two hairlines per rail (`::before` top, `::after` bottom). Career 18 px, combat 10 px. No `overflow: hidden` on `.rw-combat-rail`.
- Fail-closed: `rw-hair-off` in `initHud`; 5 Hz `bio` write adds the class and does not clear it.
- `H=(600,513)` at 1600×900 with width 220 hits the self hair box (`l=554,t=495,r=722,b=671`) and hides.
- No `getBoundingClientRect` on the update loop. Measure uses `offsetWidth` at init, resize, and optional 5 Hz scale/name change.
- `--rw-bio-period`: serene 4 s, pained 2.2 s, keen/anxious/feral 1.2 s, reduced motion 0.
- Contacts identity is `stroke-linecap: round`. No extra Bio corners. Iris cilia gain +1 px width in career only.
- Exported `hairBoxForRail` / `agezHairOff` keep the boot pin deterministic.

### Findings

#### 🟡 Minor: Capsule test expands the AABB (L-inf), not a Euclidean disk

**Location:** `src/systems/hud.js:152-158`  
**Issue:** Lead corridor uses an AABB grown by 24 px, then a segment clip. Corner distance can hide a hairline when the true Euclidean capsule would miss (over-hide).  
**Fix:** Accept. Fail-closed is the AGEZ policy. A rounded-rect test is more code for no extra ink on glass.  
**Status:** documented — fail-closed over-hide only

#### 🟡 Minor: Init measure can miss first layout in a live browser

**Location:** `src/systems/hud.js:655-666`  
**Issue:** `measureRails()` runs in `initHud` before the first paint. `offsetWidth` may be 0; cache stays at 168×120 until resize, text-scale, or target-name change. 168 px still hides the legal `H=(600,513)` sample.  
**Fix:** Resize listener covers viewport change. Optional 5 Hz remasure on scale/name covers XL text.  
**Status:** documented — fallback box still fails closed on the pin sample

#### 💡 Suggestion: Resize listener is never removed

**Location:** `src/systems/hud.js:666`  
**Issue:** HUD is a boot singleton. No teardown exists.  
**Status:** accepted

### Contract checks

| Check | Result |
|---|---|
| No per-frame layout read | Pass — update loop has no `getBoundingClientRect` |
| Fail-closed start | Pass — both rails `rw-hair-off` at init; 5 Hz bio re-adds |
| Mech CSS untouched | Pass — bio block is after the mech block, before the galaxy chart |
| 5 Hz period | Pass — `bioPeriodSec` + `--rw-bio-period` write-on-change |
| AGEZ math | Pass — helper pin `H=(600,513)` hides self |
| No extra Bio/contacts length | Pass — probe `no.bio.corners` / `no.contacts.extra` |
| Reduced-motion hide both families | Pass — bio + mech `content: none` |

### Verdict

No blockers. No majors. Ready to report.
