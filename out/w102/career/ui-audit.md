## UI Audit: Beautiful Hangar train Offers (career words)

### Summary
Desk copy only. Career word is on the Offer **name** line. The Offer **button** stays `Offer heavy` / `Offer ace` (class key). Confirm papers hop stays `{from} → {dest}` keys. Yard buy names stay class keys. Esc cancel is unchanged.

Persona: `C:\Users\barry\.grok\skills\orchestrator\references\ui-audit.md`.

### What's done well
- Extra word is visible on the name line (`light → heavy combat`, `ace hunter`, `freighter trade`, `light explore`, `frigate capital`).
- Offer button stays short and exact: `Offer heavy`. WAVE92 and Digit habits keep that string.
- Cutter stays `cutter` on name and button. No fake class string.
- Confirm papers still show `light → heavy` (keys). Player sees the dest key before debit.
- Hostile / refuse notes, prices, and Esc — Cancel stay the same controls.
- `textContent` / `h()` / `btn()` only. No markup in copy.

### Findings

None at 🔴 Blocker or 🟠 Major.

#### 🟡 Minor: Offer name and Confirm hop differ by the extra word
**Location:** `src/systems/shipyard-desk.js` Offer `offerName` vs Confirm `hop`
**Issue:** Offer can read `light → heavy combat`. Confirm reads `light → heavy`. That is the contract: Confirm must not treat the career word as dest. The button stays `Offer heavy`.
**Fix:** Keep.

### Verdict
Approve for desk copy. No Digit change. No Yard name change. WAVE92 exact button lookup should work.
