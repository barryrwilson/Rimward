# Security Review: remaining AST leftover after AST-01/02 pack (Wave 123)

### Risk Level: Low

### Summary

Markdown-only CONSUME pack. No `src/` ships. Contract forbids later XSS (`innerHTML`), proto merge of `fieldOre`, pose persist, UUID id remap, Digit theft, and a hub PPI. Live save already sanitizes `fieldOre`; overlay cannot exceed seed; HUD cue is `textContent`. No secrets in this pack.

Applied `C:\Users\barry\.grok\bundled\skills\shared\personas\security-auditor.md` and `C:\Users\barry\.grok\skills\orchestrator\references\security-review.md`. Did **not** spawn `[security-auditor]` (no spawn tool). Scope is the Wave 123 markdown pack plus live AST surfaces it cites. Review mode: quick scan of later-impl XSS / proto / persist / identity.

## Security Audit: `docs/Ast03RemainingAstDesign.md` + `out/w123/astrest/**`

### Summary

Overall risk: **low / clean**. Leftover is CONSUME so there is no later remaining-AST PR1 to attack. Freezes still bind if an owner re-opens after a true missing-AST census.

### Findings

No 🔴 CRITICAL or 🟠 HIGH (open).

#### 🟢 LOW: CONSUME still names live `fieldOre` shape and belt English

- **Severity**: informational
- **Category**: attack surface documentation
- **Location:** `out/w123/astrest/current-ast-remaining-inventory.md` §4–§5; `save.js` **184–232**; `jump.js` **48–58**; `hud.js` **2205**
- **Description:** Inventory cites live sparse `{ [systemId]: { [indexString]: remainingInt } }` and `Mine · belt` / `Belt lies` copy. That is census, not new code. A later invert could ignore CONSUME and `innerHTML` the cue or merge a raw `fieldOre` blob with `for-in`.
- **Impact:** None this wave. Live sanitize drops reserved ids / non-index keys / out-of-range remaining. Prompt uses `textContent`.
- **Reproduction:** N/A (no `src/` from this pack).
- **Remediation:** Keep serial plan with **no PR1**. Optional census grep only.
- **Status:** accepted — CONSUME named in contract §0 / §3

### Positive Observations

- `innerHTML` forbidden later (contract §0.4). Grep `asteroids.js` / `hud.js`: no `innerHTML`.
- Prompt / MATCH lamp go through `textContent` / `el()` (`hud.js` **356**, **2226–2227**).
- Persist: no new `WORLD_FIELDS` key (contract §0.6). `fieldOre` already exists; omit-delete (`save.js` **1193–1194**).
- Proto: `RESERVED_IDS`; `FIELD_ORE_INDEX`; `Object.hasOwn(SYSTEMS)`; `kindFromDef` `Object.hasOwn(FIELD_KINDS, k)` (`save.js` **110–118**; `asteroids.js` **88–91**).
- Overlay fail-closed: `min(seeded, trunc(v))` (`asteroids.js` **1607–1609**). Hand-edited remaining cannot exceed seed.
- Identity: `id === i` stays; UUID remap forbidden (contract §0.8).
- No Digit / invented UU / SKU / `state.js` write (contract §0.3 / §0.5).
- No secrets, tokens, or credentials in this pack.
- MATCH NaN pose fail-closed (`ship.js` **732–736**).

### Passed Checks

- [x] No secrets in pack markdown
- [x] No new DOM / `innerHTML` proposed
- [x] No new persist key / no pose on `WORLD_FIELDS`
- [x] No proto merge recipe
- [x] No Digit theft
- [x] No invented UU
- [x] Fail-closed `sanitizeFieldOre` cited
- [x] Prototype-safe kind / index helpers cited
- [x] Overlay cannot exceed seed
- [x] `id === index` freeze cited

### Recommendations

1. Keep CONSUME / serial **none**. Do not implement.
2. If owner re-opens after a true missing-AST census, keep `textContent`, `sanitizeFieldOre`, overlay min, and `id === i`.

## Security Audit: later helpers (named freeze; not implemented)

### Finding 1: none open

No critical or high in the freeze. Live `pickOreType` still uses `for…in` on `ORE_BAND_WEIGHTS` (Wave 67 contract: leave until a serial owner rewrites). This pack does not copy that pattern.

**Re-review after markdown lock:** still no CRITICAL/HIGH. CONSUME stands.
