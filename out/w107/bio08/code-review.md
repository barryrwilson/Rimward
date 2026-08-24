# Code Review: BIO-08 anatomy-native locomotion brief (Wave 107)

Design-only. Inventory cites live player CPU swim (`ship.js` 151–162, 279–339, 953–1009), NPC GPU uniforms (`ship-assets.js` 57–95, 432, 455, 492–509), six class keys (`state.js` 37–44; `ship-assets.js` 20), live BIO-06 `living-cadence.js`, Wave 106 body plans, Beautiful GLB path, and the reducedMotion split. MERGE LAW deputizes a four-id gait table without `state.js` write, without a universal `mixer.timeScale`, without weakening light 0.5→2.3, and without replacing `makeLivingHull`. No 🔴/🟠 remain after consistency pass (inventory refreshed after BIO-06 sibling landed).

Applied `C:\Users\barry\.grok\skills\orchestrator\references\code-review.md`. Did **not** spawn a reviewer agent. Did **not** run project-wide formatters or the full test suite.

### Summary

Brief and contract agree: gait is axis mix on **one** shader; BIO-06 cadence is honored not retuned; fail closed is live spine+flap, never a stub mesh; PR plan is named-only; Digit/hub/`state.js`/persist freezes are in MERGE LAW. Inventory line numbers match Wave 107 live `src/` (not stale Wave 104 `updateShipAsset` 457–470).

### What's done well

- Code-wins inventory: live four uniforms including `uSwimSweep`, live `living-cadence.js`, one `injectSwim` program, player Z not kicked, no gait id.
- Wave 104 BIO-06 contract is named as the **intended** cadence end state while sibling Wave 107 may still be landing it.
- Wave 106 class builders cited for anatomy (light shark, ace squid, cutter hammerhead not scaled light, heavy humpback, frigate travel-pose octopus, freighter blue whale).
- Player light CPU honor vs NPC light shark GPU is explicit — avoids “fixing” the quality bar.
- Fail-closed paths split classKey miss (→ light) from gait miss (→ live mix).
- Forbidden list matches frozen honor 1–15 plus Unknowables / yard-preview.

### Contract vs brief consistency

| Topic | Brief | Contract | Result |
|---|---|---|---|
| Merge winner | contract wins | this file wins | Match |
| PR1 home | `living-gait.js` | same; no `state.js` | Match |
| Gait map | six keys / four ids | same floats | Match |
| Fail closed | live spine+flap; never stub | §10 same | Match |
| Player light | CPU bit-identical | §0.1 same | Match |
| BIO-06 numbers | do not retune | §0.10 | Match |
| One shader | yes | §0.1 / §7 | Match |
| Digit 0/8/9 | freeze | §0.3 | Match |
| Hub | no gait pip | §0.2 | Match |
| Persist | none | §0.7 | Match |
| PR plan | PR1–PR4 named only | §8 | Match |

### Findings

No 🔴 Blocker or 🟠 Major.

#### 🟡 Minor: BIO-06 sibling landed mid-census; gait must not fork a second program

**Location:** `living-cadence.js`; `ship-assets.js` 55, 66–95; contract §0.1.

**Issue:** Cadence is live. A later BIO-08 PR3 that compiles a second `customProgramCacheKey` per gaitId would explode programs and reopen shader-string risk.

**Fix:** Contract already: one constant `rimward-beautiful-swim-hz-sweep`; gait as extra floats; do not retune cadence.

**Status:** documented.

#### 🟡 Minor: `canonicalClass` uses `Array.includes`, not `hasOwn`

**Location:** `ship-assets.js` 126–128; contract §0.8.

**Issue:** `NPC_CLASSES` is a frozen array, so `includes` is the right existence test **for that list**. Gait table is an object map and **must** use `hasOwn`. A later helper that copies `includes` onto the object map would be wrong; a helper that copies `hasOwn` onto the array would also be wrong.

**Fix:** PR1 `gaitFor` hasOwn on the freeze. PR3 class token from `canonicalClass` / `classKeyOf` only.

**Status:** contract §0.8 already states hasOwn on classKey for the gait freeze.

#### 💡 Suggestion: aSwim `|x|` wingness under-marks trailing arms

**Location:** `ship-assets.js` 297–300; contract §0.1 aSwim.

**Issue:** Octopus/squid trail mass is +Z, not |x|. Axis mix helps; bake bias is optional.

**Fix:** Contract already: keep live bake as fail-closed; optional PR3 bias inside the same attribute; skip if unsafe.

**Status:** frozen.

### Performance / maintainability

- One CPU loop, one GPU program, per-instance uniforms: honor Wave 76.
- Duplicate tables forbidden (gait vs cadence stay two modules).
- Named-only PRs: PR1 data cannot steal Digit 0/8/9.

### Test coverage (later serial; freeze)

PR4 boot pins: light 0.5→2.3; NPC amp 0 under reducedMotion; unknown classKey → light; no persist key; Digit 0 shipyard; grep `mixer.timeScale` 0 on touched files. This worker does not add tests.
