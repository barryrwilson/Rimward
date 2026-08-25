# Security Review: remaining REP leftover pack (Wave 122)

### Risk Level: Low

### Summary

Markdown-only CONSUME pack. No `src/` ships. Contract forbids later XSS (`innerHTML`), persist of wanted/crimeScore, proto merge of reputation bags, Digit theft, invented UU, and patrol-employer as leftover PR1. Live Standing already uses `h()` `textContent`, `standingRead`, `sanitizeReputation`, and `restitutionBusy`. No secrets in this pack.

Applied `C:\Users\barry\.grok\bundled\skills\shared\personas\security-auditor.md` and `C:\Users\barry\.grok\skills\orchestrator\references\security-review.md`. Did **not** spawn `[security-auditor]`. Scope is the Wave 122 markdown pack plus live standing / leave / covering / jump / kill / restitution surfaces it cites. Review mode: quick scan of later-impl XSS / proto / persist / wanted.

## Security Audit: `docs/Rep06RemainingRepDesign.md` + `out/w122/represt/**`

### Summary

Overall risk: **low / clean**. Leftover is CONSUME so there is no later remaining-REP PR1 to attack. Freezes still bind if an owner re-opens after a true missing-law census.

### Findings

No 🔴 CRITICAL or 🟠 HIGH (open).

#### 🟢 LOW: CONSUME still names live credits debit and reputation writes

- **Severity**: informational
- **Category**: attack surface documentation
- **Location:** `out/w122/represt/current-rep-remaining-inventory.md` §5–§10; `restitution.js` 45–66; `kill-standing.js` 128–174
- **Description:** Inventory cites live restitution debit (credits + standing) and kill/spy/war standing writes. That is census, not new code. A later invert could ignore CONSUME and persist a wanted field or `innerHTML` rank names.
- **Impact:** None this wave. Live restitution already uses `restitutionBusy`, `standingRead`, and `textContent`. Kill skips reserved / independent / missing faction.
- **Reproduction:** N/A (no `src/` from this pack).
- **Remediation:** Keep serial plan with **no PR1**. Optional census grep only.
- **Status:** accepted — CONSUME named in contract §0 / §3

### Positive Observations

- `innerHTML` forbidden later (contract §0.4). Grep `station.js`: no `innerHTML`.
- Digit 9 labels go through `h()` `textContent` (`station.js` **4464–4468**) and authored copy / `FACTIONS[k].name` after `Object.hasOwn`.
- Kill emit strips control chars in faction display (`kill-standing.js` **115–120**).
- Persist: no new `WORLD_FIELDS` key (contract §0.6). `sanitizeReputation` drops reserved / non-finite (`save.js` **919–940**). WAVE74 restore drops planted `crimeScore` / `wanted`.
- Proto: `standingRead` + `reservedId` (`data-trade.js` **73–81**). Leave/covering `systemFactionOf` requires `Object.hasOwn(SYSTEMS)` and `Object.hasOwn(FACTIONS)`.
- Fail closed: leave/covering skip blocked flags and missing standing (read 0); jump skip dest flags; restitution `{ ok: false, reason }`; kill skip independent.
- `restitutionBusy` re-entry guard (`station.js` **5867–5882**).
- No Digit / invented UU / wanted / `state.js` write (contract §0.3 / §0.5 / §0.8).
- No secrets, tokens, or credentials in this pack.
- Patrol-employer forbidden as leftover PR1 so a naive writer cannot smash WAVE111 honesty or invent a persist employer key.

### Passed Checks

- [x] No secrets in pack markdown
- [x] No new DOM / `innerHTML` proposed
- [x] No new persist key / no wanted `WORLD_FIELDS`
- [x] No proto merge recipe
- [x] No Digit theft
- [x] No invented UU
- [x] Fail-closed leave / covering / jump / restitution cited
- [x] Prototype-safe standing helpers cited

### Recommendations

1. Keep CONSUME / serial **none**. Do not implement.
2. If owner re-opens after a true missing-law census, keep `textContent`, `standingRead`, reserved-id sanitize, and live integers (1200 / −5 / 10 / −25 / −2).

## Security Audit: later helpers (named freeze; not implemented)

### Finding 1: none open

No critical or high in the freeze. Live `standingOf` in `npc.js` **1138–1142** indexes `table[fac]` without `standingRead`. Census records it as **not leftover**. A later invert that widens hunt on proto keys would be a hunt PR, not this CONSUME pack.

**Re-review after markdown lock:** still no CRITICAL/HIGH. CONSUME stands.
