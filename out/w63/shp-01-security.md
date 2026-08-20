## Security Review: out/w63/shp-01-shipyards.md

### Risk Level: Low

### Summary
Design-only note. Trust boundaries are UI click payload, `rimward-save-v1` player keys, and credit debit. HIGH items (price trust, `hullKind` smuggle, XSS, restore remount, double-debit) are written into the note as fail-closed law.

### Findings

#### 🟡 MEDIUM: Yard copy interpolates rank names
**Location:** `out/w63/shp-01-shipyards.md` §5 fail-closed copy
**Issue:** Notices embed `rankFor(rep).name`. Those strings are authored in `RANK_LADDER`, not save-supplied. Residual risk is a future innerHTML slip.
**Impact:** XSS only if an implementer abandons `h()` / `textContent`.
**Fix:** Implementer must use `station.js` `h()` / `btn()`. Note already forbids `innerHTML`.

#### 🟢 LOW: `parkMountedHull` is an untrusted peer boundary
**Location:** §7
**Issue:** SHP-01 will call a SHP-02 function with `ctx`. A buggy stub could mutate credits or `hullKind`.
**Impact:** Local persist corruption, not remote RCE.
**Fix:** SHP-01 debit stays after a boolean return. SHP-02 must not write `hullKind`.

### Passed Checks
- [x] No `innerHTML` of hull names (law §10.1)
- [x] Allowlist `classKey` / `faction` / `hullKind` on purchase (§10.2)
- [x] Never trust save-supplied price (§10.3)
- [x] Allowlist `hullKind` on restore; delete otherwise (§6, §10.4)
- [x] Restore remount only after allowlisted triple (§10.5)
- [x] Confirm + single-flight debit (§10.6–10.7)
- [x] HUD never writes `hullKind` (§0, §10.8)
- [x] No secrets, no new settings keys
- [x] No `src/` or `scripts/` edits in this wave

### Recommendations
1. Implementer: keep `h()` / `textContent` for every yard string.
2. Implementer: recompute `yardPrice` on confirm, not on first select.
3. Peer: SHP-02 stub returns boolean only; it does not write `hullKind` or credits.
