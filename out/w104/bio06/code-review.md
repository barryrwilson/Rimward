## Code Review: BIO-06 class-scaled living fin cadence design pack (Wave 104)

### Summary

Design-only. Inventory cites live player CPU swim (`ship.js` 144–147, 274–334, 948–959), NPC GPU uniforms (`ship-assets.js` 43–87, 457–470), six class keys (`state.js` 37–44; `ship-assets.js` 11), Beautiful GLB path, and the reducedMotion split. MERGE LAW deputizes a monotonic `LIVING_CADENCE` table without `state.js` write, without a universal `mixer.timeScale`, and without weakening light 0.5→2.3. No 🔴/🟠 remain.

Persona: reviewer (`C:\Users\barry\.grok\bundled\skills\shared\personas\reviewer.md`) + orchestrator `code-review.md`. Self-applied (no `src/` diff). Design-doc review also applied (completeness, live cites, alternatives, serial named only).

### What's done well

- Code wins: no live per-class Hz table. Amp already scales (`restScale` / `aSwim.w`); Hz does not.
- Player **already** norms to class cruise (`hangar.js` 568 + `ship.js` 950). The brief does not pretend NPC and player share the same denom. Player living **heavy remount** at cruise = 2.3 Hz is named as the worst CPU case.
- Light is bit-identical (`hzScale` 1.00). Quality bar is a freeze, not a slogan.
- Universal multiplier is named and forbidden (`mixer.timeScale`, global dt, one `uTime` scale on clip+swim).
- `makeLivingHull` clone onto NPC is fail-closed. GPU path stays.
- `state.js` READ-ONLY; preferred home `living-cadence.js`. Duplicate tables forbidden.
- BIO-07 is one line, not a hijack. BIO-05 graft stays closed.
- Serial is named only: data → player honor → NPC GPU → pins.
- Deputize numbers are in the contract (MERGE LAW), not parked on owner questions.

### Findings

No 🔴 Blocker or 🟠 Major.

#### 🟡 Minor: Two live copies of 0.5 / 2.3 already exist

**Location:** `ship.js` 144–145; `ship-assets.js` 46–47.

**Issue:** PR1 extract must become the single envelope for **light**, or CPU/GPU will drift again.

**Fix:** Contract already prefers `living-cadence.js` and forbids duplicate tables. PR4 pin both call sites equal light 0.5/2.3.

**Status:** frozen; acceptable.

#### 🟡 Minor: `userData.classKey` is not live on GPU instances

**Location:** `ship-assets.js` 439 `assetInstanceKey`; `npc.js` 2280 no class arg.

**Issue:** PR3 must stash an allowlisted class. Parsing `beautiful:frigate:trader` is fragile if a role ever contains `:`.

**Fix:** Contract §1.2: set `userData.classKey = resolvedClass` at `buildShipAsset`. Do not regex the instance key.

**Status:** frozen.

#### 🟡 Minor: Silhouette only special-cases cutter/heavy

**Location:** `ship.js` 258–263.

**Issue:** Ace/frigate/freighter living remounts use restScale only. BIO-06 cadence still applies by key. BIO-07 owns bodies. Do not “fix” silhouette here.

**Fix:** None this leftover.

**Status:** documented inventory §3.1.

#### 💡 Suggestion: Keep shader breath at 0.25 Hz

**Location:** `ship-assets.js` 79; `ship.js` 146.

**Issue:** GPU breath uses `uSwimTime * 2π * 0.25`, not `uSwimHz`. Class Hz must not accidentally retarget that 0.25.

**Fix:** PR3 only multiplies `uSwimHz` and `uSwimSweep`. Do not reuse Hz for breath.

**Status:** contract §0.10 / §0.1 formulas already leave breath unscaled.

### Design-doc completeness

| Check | Result |
|---|---|
| Title table + merge-law pointer | Pass |
| Honor / do-not-edit siblings | Pass |
| Inventory from live code | Pass (`file:line`) |
| Pain / goals / non-goals | Pass |
| Deputize numbers in contract | Pass |
| Serial PRs named only | Pass (PR1–PR4) |
| Security freeze | Pass |
| Acceptance later | Pass |
| Open questions parked? | No — deputized |
| BIO-07 scoped out | Pass |
| No `src/` in write-set | Pass |

### Contract vs brief vs inventory

Spot-check: light 1.00/1.00, freighter 0.30/2.00, no persist, no `state.js`, NPC `/120` is the bug, player light 0.5/2.3 honor, `makeLivingHull` not cloned. Agree. Contract wins on conflict (stated in both files).
