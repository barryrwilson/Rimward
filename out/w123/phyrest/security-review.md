# Security Review: remaining PHY leftover after PHY-05 pack (Wave 123)

### Risk Level: Low

### Summary

Markdown-only CONSUME pack. No `src/` ships. Contract forbids later XSS (`innerHTML`), persist of avoid/padHome keys, proto merge of save waypoints, navmesh invention, Digit theft, and a hub collision pip. Live heal already uses `Object.hasOwn` + new `{x,y,z}`. No secrets in this pack.

Applied `C:\Users\barry\.grok\bundled\skills\shared\personas\security-auditor.md` and `C:\Users\barry\.grok\skills\orchestrator\references\security-review.md`. Did **not** spawn `[security-auditor]`. Scope is the Wave 123 markdown pack plus live PHY surfaces it cites. Review mode: quick scan of later-impl XSS / proto / persist / navmesh.

## Security Audit: `docs/Phy06RemainingPhyDesign.md` + `out/w123/phyrest/**`

### Summary

Overall risk: **low / clean**. Leftover is CONSUME so there is no later remaining-PHY PR1 to attack. Freezes still bind if an owner re-opens after a true missing-PHY census.

### Findings

No 🔴 CRITICAL or 🟠 HIGH (open).

#### 🟢 LOW: CONSUME still names live hold rewrite and bag slot shape

- **Severity**: informational
- **Category**: attack surface documentation
- **Location:** `out/w123/phyrest/current-phy-remaining-inventory.md` §7; `world.js` **709–732**; `collision.js` **50–65**
- **Description:** Inventory cites live `healPadHome` rewrite of `route[0]` and collision bag slots. That is census, not new code. A later invert could ignore CONSUME and `Object.assign` a save waypoint or `innerHTML` a debug pip.
- **Impact:** None this wave. Live heal assigns a new plain `{x,y,z}` via `writeStationHold`. Bag fill is typed slots, not user HTML.
- **Reproduction:** N/A (no `src/` from this pack).
- **Remediation:** Keep serial plan with **no PR1**. Optional census grep only.
- **Status:** accepted — CONSUME named in contract §0 / §3

### Positive Observations

- `innerHTML` forbidden later (contract §0.4). Grep `physics.js` / `collision.js` / `world.js` / `traffic-feel.js`: no `innerHTML`.
- Persist: no new `WORLD_FIELDS` key (contract §0.6). Avoid is live. Pad-home uses existing `record.route`. WAVE110 `noPadHomeField`.
- Proto: `healPadHome` uses `Object.hasOwn(SYSTEMS, sysId)` (`world.js` **715**). New hold object, not `Object.assign(route[0], saveWp)`.
- PHY table is frozen (`physics.js` **6**). Comment forbids duplicate keys on `state.js`.
- Fail-closed NaN / unknown system: heal no-ops; WAVE110 `nanUnknownNoThrow`.
- NPC avoid never freezes hulls (`speed = 0` not used as missing-bag path).
- No Digit / invented UU / SKU / `state.js` write (contract §0.3 / §0.5).
- No secrets, tokens, or credentials in this pack.
- No navmesh recipe (contract §0.10).

### Passed Checks

- [x] No secrets in pack markdown
- [x] No new DOM / `innerHTML` proposed
- [x] No new persist key / no `world.avoid` / `world.padHome`
- [x] No proto merge recipe
- [x] No Digit theft
- [x] No invented UU
- [x] Fail-closed heal / bounce cited
- [x] Prototype-safe SYSTEM / bag helpers cited
- [x] No navmesh recipe

### Recommendations

1. Keep CONSUME / serial **none**. Do not implement.
2. If owner re-opens after a true missing-PHY census, keep `textContent`, `Object.hasOwn`, new `{x,y,z}` holds, and no avoid blob.

## Security Audit: later helpers (named freeze; not implemented)

### Finding 1: none open

No critical or high in the freeze. PHY-04 PR3 80 u skippable is not a persistence vector.

**Re-review after markdown lock:** still no CRITICAL/HIGH. CONSUME stands.
