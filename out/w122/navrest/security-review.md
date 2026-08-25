# Security Review: remaining NAV leftover after NAV-07 pack (Wave 122)

### Risk Level: Low

### Summary

Markdown-only CONSUME pack. No `src/` ships. Contract forbids later XSS (`innerHTML`), persist-resume flying AP, proto merge of dest/nav blobs, teleport jump emit outside `gate.js`, Digit theft, and a hub PPI. Live chart already sanitizes system ids, dest options, and AP live `textContent`. No secrets in this pack.

Applied `C:\Users\barry\.grok\bundled\skills\shared\personas\security-auditor.md` and `C:\Users\barry\.grok\skills\orchestrator\references\security-review.md`. Did **not** spawn `[security-auditor]`. Scope is the Wave 122 markdown pack plus live NAV surfaces it cites. Review mode: quick scan of later-impl XSS / proto / persist / jump-emit.

## Security Audit: `docs/Nav08RemainingNavDesign.md` + `out/w122/navrest/**`

### Summary

Overall risk: **low / clean**. Leftover is CONSUME so there is no later remaining-NAV PR1 to attack. Freezes still bind if an owner re-opens after a true missing-NAV census.

### Findings

No 🔴 CRITICAL or 🟠 HIGH (open).

#### 🟢 LOW: CONSUME still names live dest `<select>` values and AP reason English

- **Severity**: informational
- **Category**: attack surface documentation
- **Location:** `out/w122/navrest/current-nav-remaining-inventory.md` §9; `galaxychart.js` **194–230**, **644–647**
- **Description:** Inventory cites live dest option values (`sanitizeSystemId`) and `#rw-galaxy-ap-live` `textContent`. That is census, not new code. A later invert could ignore CONSUME and `innerHTML` names or persist `ctx.autopilot`.
- **Impact:** None this wave. Live dest loop uses `Object.keys` + `Object.hasOwn` + `sanitizeSystemId`; `showApLive` is `textContent`.
- **Reproduction:** N/A (no `src/` from this pack).
- **Remediation:** Keep serial plan with **no PR1**. Optional census grep only.
- **Status:** accepted — CONSUME named in contract §0 / §3

### Positive Observations

- `innerHTML` forbidden later (contract §0.4). Grep `galaxychart.js` / `autopilot.js`: no `innerHTML`.
- Dest labels / hover / AP live go through `textContent` (`galaxychart.js` **201**, **349**, **455–457**, **646**).
- Persist: no new `WORLD_FIELDS` key (contract §0.6). `nav` already exists; restore `sanitizeNav` forces `autopilot: false` (`nav.js` **48–55**, **191–192**; `save.js` **1240**).
- Proto: `sanitizeSystemId` reserved ids (`nav.js` **8–36**). Dest options skip non-own keys. `hoverModel` reserved faction keys (`chart-hover.js` **11–20**, **39**).
- Jump emit fail-closed: `near.to` only when in zone (`gate.js` **672–678**). Autopilot does not emit.
- MATCH refuse / no dest / docked / jumping / paused fail closed (`autopilot.js` **175–188**).
- No Digit / invented UU / SKU / `state.js` write (contract §0.3 / §0.5).
- No secrets, tokens, or credentials in this pack.
- Overlay open still gated by `canOpenPlayCard` (`galaxychart.js` **482–486**).

### Passed Checks

- [x] No secrets in pack markdown
- [x] No new DOM / `innerHTML` proposed
- [x] No new persist key / no `ctx.autopilot` `WORLD_FIELDS`
- [x] No proto merge recipe
- [x] No Digit theft
- [x] No invented UU
- [x] Fail-closed jump emit cited
- [x] Prototype-safe dest / hover / nav helpers cited
- [x] No teleport recipe

### Recommendations

1. Keep CONSUME / serial **none**. Do not implement.
2. If owner re-opens after a true missing-NAV census, keep `textContent`, `sanitizeSystemId`, restore AP false, and `gate.js` sole emit.

## Security Audit: later helpers (named freeze; not implemented)

### Finding 1: none open

No critical or high in the freeze. WAVE117 zone teleport in **boot-test** (`position.set` ring) is a harness pin, not product teleport, and is not this leftover.

**Re-review after markdown lock:** still no CRITICAL/HIGH. CONSUME stands.
