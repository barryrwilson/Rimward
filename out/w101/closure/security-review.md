## Security Review: TGT-03 remaining target closure-rate brief (Wave 101, re-dispatch)

### Risk Level: Low

### Summary

Markdown-only pack. Re-dispatch freezes CLOS `textContent` to an authored numeric format (`+N u/s` / `-N u/s` / `0 u/s`). That removes the `«-12` concatenation footgun. XSS, persist, Digit, and SKU theft stay contract-frozen. No CRITICAL or HIGH.

Persona: security-auditor + orchestrator `security-review.md`. Self-applied.

---

### Findings

No 🔴 CRITICAL or 🟠 HIGH.

#### 🟡 MEDIUM: Later impl could still XSS if it concatenates `record.name` into CLOS

**Location:** `shared-contract.md` §1.1, §5; `hud.js` 1946–1949 name row.

**Issue:** This wave does not ship DOM. A later PR that does `innerHTML = glyph + name + rate` would XSS.

**Impact:** HTML injection on the combat rail.

**Fix (frozen):** authored `+N`/`-N`/`0` + `u/s` only; no names; `innerHTML` forbidden; grep `hud.js` must stay 0.

**Status:** mitigated in contract; not live.

#### 🟢 LOW: Persist / Digit / SKU theft if later serial ignores MERGE LAW

**Location:** `shared-contract.md` §0.5–0.6; `save.js` 76–101; `station.js` 186, 5920–5922, 5983–5985.

**Status:** accepted residual; design-only wave.

---

### Passed Checks

- [x] No secrets
- [x] No `src/` edits this pack
- [x] `innerHTML` freeze; `el()` / `textContent` only
- [x] CLOS string is digits, ASCII `+`/`-`, space, `u/s` — not blob names
- [x] No persist key; HUD must not write `ctx.world.contacts` (`ctx.js` 163)
- [x] Digit 0/8/9 steal forbidden
- [x] No `WEAPONS` index from a rate string
- [x] Prototype-safe persist law copied
- [x] No new `ctx.emit`
- [x] HUD never writes `hullKind`

### Recommendations

1. Later PR2: build CLOS with `text.nodeValue` like `makeSpeed` (`hud.js` 300–316), prefix `+` only when `n > 0`.
2. Later PR4: grep `innerHTML` in `hud.js` = 0; grep `WORLD_FIELDS` for a new token = fail.
3. Do not log lock names beside the rate.
