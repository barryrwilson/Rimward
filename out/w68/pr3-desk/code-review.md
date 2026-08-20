## Code Review: Outfitting Digit 8/9 papers (Wave 68 PR3a)

**Scope:** `src/systems/station.js`, `out/w68/pr3-desk/probe.mjs`.
**Persona:** reviewer + orchestrator code-review checklist.
**Pass:** 2 (post-fix).

### Summary
Outfitting level 2 grows Digit 8 (dart offer / restock) and Digit 9 (auto turret offer). Confirm papers matches the yard law. Digit 1–7 one-shots stay. Helpers pin without WebGL. Keydown still needs DOM (`initStation`).

### What's done well
- State helpers are pure and exported: `outfitLauncherState`, `outfitTurretState`.
- Digit 8/9 arm papers only. Debit is `confirmOutfitPapers`.
- Live hangar row wins over a stale world mirror for launcher / turret / ammo.
- Esc extends the existing pending-cancel chain. Label is exactly `Confirm papers`.
- `writeMountedGear` heals ammo and class seat; desk checks the returned row before debit.
- Probe pins catalog prices, blob cost ignore, light refuse, living `hullKind`, restock heal, proto inherit, and source-level Digit-8 Launch.

### Findings

#### 🟡 Minor: `outfitLauncherState` takes `ammo` but does not use it
**Location:** `src/systems/station.js` `outfitLauncherState`
**Issue:** The tasked signature includes `ammo`. Kind is seat + launcher id only.
**Fix:** Keep the argument so the probe and later list UI share one shape.
**Status:** open — contract signature.

#### 🟡 Minor: restock of a near-full rack still charges list restock
**Location:** `src/systems/station.js` restock confirm
**Issue:** 7 + 2 heals to 8. Price stays 400.
**Fix:** Do not add a remainder price in this PR.
**Status:** open — heal-then-write law.

#### 💡 Suggestion: no `requestAutosave` after a successful debit
**Location:** `src/systems/station.js` `applyOutfitPending`
**Issue:** Yard buy autosaves. Digit 1–7 outfitting does not.
**Fix:** Match Digit 1–7. Snapshot / dock refresh still persist.
**Status:** open — parallel with existing outfitter.

### Resolved this pass
- Own-key pending fields (proto inherit no longer files papers).
- Level-2 service gate on arm and confirm.

### Test coverage
- `node --import ./scripts/with-css-stub.mjs out/w68/pr3-desk/probe.mjs` PASS.
- Does not drive `keydown` (needs DOM). Documents that. Pins helpers and source wiring instead.
- Did not run `npm run test:boot` (out of scope).
