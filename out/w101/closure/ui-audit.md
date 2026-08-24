## UI Audit: TGT-03 remaining target closure-rate brief (Wave 101, re-dispatch)

### Summary

No product UI ships this wave. CLOS is one labeled meter on `.rw-combat-target` next to DIST. Hub theft is **not** proposed (Blocker if a later serial adds it). Authored format is **signed only:** `+N u/s` / `-N u/s` / `0 u/s`. Rail has **no** «/». Mk II «/» stays on the arc with exclusive `<` / `>`.

Applied `C:\Users\barry\.grok\skills\orchestrator\references\ui-audit.md` locally. Did **not** spawn `[designer]`.

### What's done well

- Picture matches DIST: `el()` + `.rw-label` `CLOS` + `.rw-value` / `textContent`.
- Color is never the only cue: label `CLOS` + explicit `+`/`-`/`0` + unit `u/s` (`hud.js` 43–44).
- XOR freeze: sign **or** glyph, not both. Deputize = sign. Forbids `«-12 u/s`.
- Fail-closed: hide with `shipTgt` or em-dash; no player SPD as rate.
- Four surfaces stay distinct. RANGE stays TGT-01.
- `measureRails()` still required after the extra row.
- `reducedMotion`: number stays; no pulse.

### Findings

No 🔴 Blocker or 🟠 Major.

#### 🟡 Minor: Extra rail row grows `.rw-combat-target` past cached 120 px height until `measureRails()`

**Location:** `hud.js` 860 `tgtSize.height = 120`; `hud.css` 884–895.

**Issue:** One more `.rw-meter`. Bio `rw-hair-off` uses `tgtSize`.

**Fix:** Later PR2: create once at init; `measureRails()` after append and first unhide.

**Status:** frozen in brief §3 / contract §1.1.

### Format pin (re-dispatch Bug 3)

| along after `Math.round` | Authored `textContent` |
|---|---|
| `n > 0` recede | `+N u/s` (ASCII `+` required) |
| `n < 0` approach | `-N u/s` (ASCII hyphen-minus) |
| `n === 0` | `0 u/s` (no sign, no «/») |

**Forbidden:** `«-12 u/s`, `« 12 u/s` on the signed deputize, any «/» plus `+`/`-`.

Glyph-only is owner override only. It must copy live exclusive Mk II: `along < -4` / `along > 4` (`hud.js` 1490–1491). At `|along| == 4`, **no** «/».

### Hub / glass freeze (Blocker if violated)

| Surface | Brief | Audit |
|---|---|---|
| 80 px `.rw-reticle` | No CLOS child | Pass |
| RANGE | Untouched TGT-01 | Pass |
| Lock box | Forbidden | Pass |
| `.rw-contacts` reuse | Forbidden | Pass |
| Digit / Key steal | Forbidden | Pass |
| Pulse animation | Forbidden | Pass |
| reducedMotion number | Stays | Pass |
| Rail «/» + signed number | XOR; deputize signed only | Pass |
| Inclusive `>=` glyph band | Forbidden; live is exclusive `<` / `>` | Pass |

### Verdict

No Blocker. Picture is rail-legal. Format pin is `+N` / `-N` / `0`. Hub theft remains a **Blocker** if a later serial puts CLOS on `.rw-reticle`.
