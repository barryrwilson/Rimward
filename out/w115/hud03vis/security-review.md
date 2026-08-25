# Security Review: HUD-03 remaining visual accessibility pack (Wave 115)

### Risk Level: Low

### Summary

Markdown-only CONSUME pack. No `src/` ships. Contract forbids later XSS (`innerHTML`), proto merge of settings blobs, new persist keys, Digit/UU theft, and a free skin picker. Live `settings.js` already walks `Object.keys(FIELDS)` with `hasOwnProperty`. No secrets in this pack.

Applied `C:\Users\barry\.grok\bundled\skills\shared\personas\security-auditor.md` and `C:\Users\barry\.grok\skills\orchestrator\references\security-review.md`. Did **not** spawn `[security-auditor]`. Scope is the Wave 115 markdown pack plus live KeyO / `body.rw-*` surfaces it cites. Review mode: quick scan of later-impl XSS / proto / persist.

## Security Audit: `docs/Hud03RemainingVisualDesign.md` + `out/w115/hud03vis/**`

### Summary

Overall risk: **low / clean**. Leftover is CONSUME so there is no later visual PR1 to attack. Freezes still bind if an owner re-opens after a true missing-field census.

### Findings

No 🔴 CRITICAL or 🟠 HIGH (open).

#### 🟢 LOW: CONSUME still names live `FIELDS` and `localStorage` key

- **Severity**: informational
- **Category**: attack surface documentation
- **Location:** `out/w115/hud03vis/current-hud03-visual-inventory.md` §3; `settings.js` 24, 29–38
- **Description:** Inventory cites live settings load/persist. That is census, not new code. A later invert could still ignore CONSUME and `JSON.parse` a blob unsafely.
- **Impact:** None this wave. Live load already rejects unknown keys (`settings.js` 58–59).
- **Reproduction:** N/A (no `src/` from this pack).
- **Remediation:** Keep serial plan with **no PR1**. Optional census grep only.
- **Status:** accepted — CONSUME named in contract §0 / §3

### Positive Observations

- `innerHTML` forbidden later (contract §0.4). Grep `settings.js` / `hud.js`: no `innerHTML`.
- Settings labels are authored `CHECKBOXES` strings + `createTextNode` (`settings.js` 40–46, 138). Contract forbids interpolating record names into the panel.
- Persist: no new `WORLD_FIELDS` key (contract §0.6). Visual flags stay on `rimward-settings-v1`.
- Proto: live load uses `Object.keys(FIELDS)` + `hasOwnProperty` (`settings.js` 58–59). Contract §0.7 forbids `for-in` merge of a raw blob.
- Fail closed: corrupt JSON → defaults (`settings.js` 63–65); storage denied → session-only (`settings.js` 79–81).
- No Digit / UU / SKU / `state.js` write (contract §0.3 / §0.5).
- No secrets, tokens, or credentials in this pack.
- Debug `sessionStorage` `rw-hud-family` is cited as **not** product chrome (contract §0.10). Pack does not promote it to KeyO.

### Passed Checks

- [x] No secrets in pack markdown
- [x] No new DOM / `innerHTML` proposed
- [x] No new persist key
- [x] No proto merge recipe
- [x] No Digit theft
- [x] Fail-closed defaults on corrupt JSON
- [x] No `src/` / `scripts/` writes in this pack
- [x] No user shader / HTML from save

### Recommendations

1. Keep CONSUME. Do not land a visual PR that reads a blob key into HTML or CSS custom properties without the `FIELDS` whitelist.
2. If owner re-opens after a true missing-field census, keep `createTextNode` labels — no `innerHTML`.
