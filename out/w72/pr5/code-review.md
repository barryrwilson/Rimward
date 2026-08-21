## Code Review: WAVE72 BIO PR5 boot pins

**Scope:** `scripts/boot-test.mjs` WAVE72 block.
**Pass:** final (`wave72 bio:` all true; no WAVE72 BIO FAIL).

### Summary

WAVE72 pins the first BIO impl on the live boot harness. Helpers match WAVE64 buy and WAVE66 People. Gilded travel restores system, dock, and hangar. No 🔴 Blocker or 🟠 Major findings.

### What's done well

- Starter swim fields match WAVE64 remount (`swim` / `breath` / `heartbeat` / `base`) and keep `makeLivingHull` as a function.
- HUD family is imported; `hud.js` is grep-only. Built+grafted reads `mech`.
- Beautiful buy uses `purchaseYardHull` on a stub dock. Mounted starter stays. `hullKind` stays `living`.
- Graft path docks at `gc_auction`, opens Digit 0 Hangar, clicks Offer graft, asserts `GRAFT_WARN` before write, then Confirm.
- Esc re-arms after the flag is cleared on the same plated hull. Standing is sampled before arm.
- Restore pins use `restore()` with a built grafted row (cap −10) and a living grafted row (flag drop).
- Unknowables: banner refuse, row refuse, living mounted Offer graft absent.
- `DOCK_KEY_SERVICES` last key is `shipyard`. Digit 0 opens SHIPYARD. No extra dock key.

### Findings

#### 🟡 Minor: Esc pin clears `grafted` on the confirmed hull instead of a second buy

**Location:** `scripts/boot-test.mjs` WAVE72 after Confirm graft
**Issue:** The brief allows a fresh built hull or a reset after a second buy. The pin deletes `grafted` on the hull that just confirmed, then arms Offer graft and hits Esc. Credits never change, so a second buy is not required for the cancel contract.
**Fix:** Keep unless a later owner wants a second Gilded light in hangar before Esc.
**Status:** accepted (pin passed; hangar cap from earlier waves can be tight)

#### 💡 Suggestion: live yard buy still autosaves

**Location:** `scripts/boot-test.mjs` WAVE72 `purchaseYardHull(ctx, 'light')`
**Issue:** Same as WAVE64 live buy. Restore undoes hangar and credits before later checks.
**Fix:** None for PR5.

### Recheck

`wave72 bio:` all true. No WAVE72 BIO FAIL. Known WAVE4 / WAVE26 / WAVE35 FAILs still print.
