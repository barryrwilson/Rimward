## Security Review: WAVE72 BIO PR5 boot pins

**Scope:** `scripts/boot-test.mjs` WAVE72 block; `out/w72/pr5/**`. No `src/` edits.
**Mode:** Quick scan (harness fixtures only; no new game attack surface).
**Pass:** post-boot (all `wave72 bio:` keys true).

### Risk Level: Low

### Summary

PR5 pins living starter swim, HUD read-only `hullKind`, Beautiful/Unknowables frigate omit, Beautiful buy-without-remount, Gilded two-step graft, Esc cancel, restore/tamper standing, Unknowables refuse, `textContent` desk copy, and Digit 0 shipyard. The harness does not add a production path. No 🔴 CRITICAL or 🟠 HIGH findings.

### Findings

None CRITICAL/HIGH.

#### 🟢 LOW: live Gilded `purchaseYardHull` writes the harness autosave map

- **Severity**: informational
- **Category**: test isolation
- **Location:** `scripts/boot-test.mjs` WAVE72 live dock
- **Description:** Live yard buy calls `requestAutosave`. The boot harness `localStorage` is an in-process Map. WAVE72 restores hangar, credits, reputation, system, and dock before exit.
- **Impact:** None outside this Node process. A later pin in the same file would see the restored hangar, not the graft row.
- **Status:** accepted

### Passed Checks

- [x] No secrets in pins
- [x] No `eval` of overlay copy or save blobs
- [x] Restore tamper uses literal hull ids (`hull_graft_pin`, `hull_live_pin`); proto keys are not assigned from input
- [x] Standing cap is asserted on `restore()`, not by writing `reputation.beautiful` in the pin after the fact
- [x] Living+grafted restore drops the flag and does not cap from that row
- [x] Graft overlay is armed before confirm; credits and `grafted` stay unchanged until Confirm
- [x] Esc clears pending; no `grafted` write; standing unchanged from pre-arm
- [x] Source pin: no `innerHTML` in `shipyard-desk.js`
- [x] Source pin: no new quoted `ctx.js` events `grafted` / `abomination` / `hullKindChanged`
- [x] HUD source pin: no assignment to `player.hullKind` or `.grafted`
- [x] N/A: auth, sessions, SQL, RLS, CSP, wallet, admin endpoints (local sim)

### Recommendations

1. Keep WAVE72 last in the boot file, or keep the hangar restore if a later wave is appended.
2. Do not patch `src/` if a pin fails; report BLOCKED.

### Positive Observations

- Live graft uses the desk buttons (`Offer graft` / `Confirm graft` / Esc), not a silent `graftMounted` confirm.
- Frigate omit uses `yardStockFor` and `listYardOffers` with a plated Freehold control.
- Starter hangar is not rewritten to `built` for the rest of the harness; a plated hull is bought or selected, then the saved hangar is restored.
