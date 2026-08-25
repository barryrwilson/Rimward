# Security Review: EXP remaining Unknowables dock / Archive two-way pack (Wave 121)

### Risk Level: Low

### Summary

Markdown-only CONSUME pack. No `src/` ships. Contract forbids later XSS (`innerHTML`), persist of Archive papers as a new `WORLD_FIELDS` key, proto merge of origin/faction blobs, invented UU, Digit theft, and a second Unknowables dock. Live desk already sanitizes data rows, guards `dataBusy`, and refuses reserved ids. No secrets in this pack.

Applied `C:\Users\barry\.grok\bundled\skills\shared\personas\security-auditor.md` and `C:\Users\barry\.grok\skills\orchestrator\references\security-review.md`. Did **not** spawn `[security-auditor]`. Scope is the Wave 121 markdown pack plus live Archive / `veil` surfaces it cites. Review mode: quick scan of later-impl XSS / proto / persist / UU.

## Security Audit: `docs/Exp04RemainingDockDesign.md` + `out/w121/expdock/**`

### Summary

Overall risk: **low / clean**. Leftover is CONSUME so there is no later dock PR1 to attack. Freezes still bind if an owner re-opens after a true missing-dock census.

### Findings

No 🔴 CRITICAL or 🟠 HIGH (open).

#### 🟢 LOW: CONSUME still names live credits debit and cargo rows

- **Severity**: informational
- **Category**: attack surface documentation
- **Location:** `out/w121/expdock/current-exp-dock-inventory.md` §5; `station.js` 1309–1413
- **Description:** Inventory cites live Archive confirm (credits + hangar cargo). That is census, not new code. A later invert could ignore CONSUME and persist `ui.dataPending` or `innerHTML` lot names.
- **Impact:** None this wave. Live confirm already uses `dataBusy`, `sanitizeDataCargoRow`, and `textContent`.
- **Reproduction:** N/A (no `src/` from this pack).
- **Remediation:** Keep serial plan with **no PR1**. Optional census grep only.
- **Status:** accepted — CONSUME named in contract §0 / §3

### Positive Observations

- `innerHTML` forbidden later (contract §0.4). Grep `station.js` / `stations/unknowables.js`: no `innerHTML`.
- Desk labels go through `h()` `textContent` (`station.js` 4464–4469) and authored copy / `DATA_LABELS`.
- Persist: no new `WORLD_FIELDS` key (contract §0.6). `dataPending` is session UI (cleared dock/undock/service).
- Proto: `reservedId` + `isDataOriginFaction` require `unknowables`/`assembly` and `Object.hasOwn(FACTIONS)` (`data-trade.js` 28–32, 60–65). `archiveDeskAllowed('__proto__')` is false.
- Fail closed: hostile `No sale.`; missing price; short credits; full hold; illegal origin stay in hold (`station.js` 1323–1339, 222–228 of probe).
- `dataBusy` re-entry guard on confirm (`station.js` 1310–1311, 1414–1416).
- No Digit / invented UU / SKU / `state.js` write (contract §0.3 / §0.5).
- No secrets, tokens, or credentials in this pack.
- D3: pack forbids adding `unknowables` to `DETAIL_STATIONS` (contract §0.8).

### Passed Checks

- [x] No secrets in pack markdown
- [x] No new DOM / `innerHTML` proposed
- [x] No new persist key / no desk-state `WORLD_FIELDS`
- [x] No proto merge recipe
- [x] No Digit theft
- [x] No invented UU
- [x] Fail-closed Archive confirm cited
- [x] Prototype-safe origin helpers cited

### Recommendations

1. Keep CONSUME / serial **none**. Do not implement.
2. If owner re-opens after a true missing-dock census, keep `textContent`, session pending, reserved-id sanitize, and Wave 82 UU copy.

## Security Audit: later helpers (named freeze; not implemented)

### Finding 1: none open

No critical or high in the freeze. Live `Math.random` in `spawnDataPod` (`data-trade.js` 174) is existing drop jitter, not this leftover, and is not a persist/auth hole.

**Re-review after markdown lock:** still no CRITICAL/HIGH. CONSUME stands.
