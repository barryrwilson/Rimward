## Code Review: BIO PR3 Abomination desk

### Summary

PR3 lands a Gilded hangar-pane two-step graft, writes `grafted: true` on the mounted built row and player, and caps Beautiful standing at −10 while any sanitized row is grafted. Cancel is clean. Probe pins the contract. No 🔴 Blocker or 🟠 Major findings.

### What's done well

- `graftMounted` refuse reasons match the brief (`dock` / `combat` / `jump` / `paused` / `destroyed` / `missing` / `living` / `already` / `banner` / `reputation`).
- Standing uses a hangar-local `HOSTILE_STANDING = -10` with a cite; hangar does not import `npc.js`.
- `sanitizeHangar` applies hostility after row heal, so restore/tamper cannot skip the cap.
- Confirm does not remount, does not flip `hullKind`, does not debit, and does not call `requestAutosave` from hangar.js (desk matches `purchaseYardHull` by saving at the desk layer).
- Esc cancels graft pending before leaving the shipyard service (`cancelGraftPending` then `cancelYardPending`).
- Digit 3+ still mounts when idle; while armed, digits are swallowed and do not confirm.

### Findings

#### 🟡 Minor: `switchTo` applies standing twice

**Location:** `src/game/hangar.js:664` and `src/game/hangar.js:711`
**Issue:** `loadMountedRow` already calls `applyAbominationStanding`. `switchTo` calls it again after remount. The write is idempotent (`Math.min`).
**Fix:** Keep both if the brief’s named sites must stay explicit, or drop the `switchTo` tail call.

#### 🟡 Minor: `anyGrafted` trusts the current hangar blob

**Location:** `src/game/hangar.js:129-136`
**Issue:** The helper does not sanitize. Living/Unknowables junk flags would count until heal.
**Fix:** Do not call it except after `sanitizeHangar` or on already-healed rows. Current writers do that.

#### 💡 Suggestion: Back (←) leaves the service instead of staying on the armed pane

**Location:** `src/systems/station.js:2896-2899`
**Issue:** Esc on an armed graft stays in Hangar and clears pending. The Back button clears `graftPending` and returns to the service list. Same pattern as traffic pending.
**Fix:** Leave as-is unless the owner wants Back to match Esc stay-in-pane.

#### 💡 Suggestion: HOSTILE_STANDING comment is the required cite

**Location:** `src/game/hangar.js:110-111`
**Issue:** The comment names npc.js. That is why the constant exists (layer rule).
**Fix:** Keep.

### Test coverage

`out/w72/pr3/probe.mjs` pins: confirm grafted + hullKind built + credits unchanged; standing 0/missing → −10; −25 stays −25; cancel clears pending with no graft/standing change; living / Unknowables / already / freehold / Beautiful / gilded `rep < 0` / dock / paused / combat / jump refuse; sanitize tamper cap; living-only drop does not cap; mixed hangar caps; `applyMountedFlight` Unknowables deletes `player.grafted`; no `innerHTML`; no new ctx events; built+grafted `hudFamily` → `mech`.

Command: `node --import ./scripts/with-css-stub.mjs out/w72/pr3/probe.mjs` → PASS.

### Recheck (fix diff)

No HIGH/CRITICAL to land. Hangar, desk, and station unchanged after reviews.
