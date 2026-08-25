# Security Review: HUD-02 remaining living class silhouettes (Wave 111)

### Risk Level: Low

### Summary

Markdown-only pack. Freeze is allowlisted `data-class-key` on existing bio facing chrome, no hub DOM, no new persist key, no Digit, no `state.js` write, no `innerHTML`, unknown keys keep today’s generic living glyph. XSS, proto-from-save, persist-world, Digit theft, and HUD-03 skin picker stay contract-frozen. No CRITICAL or HIGH. No new trust boundary this wave.

Persona: `C:\Users\barry\.grok\bundled\skills\shared\personas\security-auditor.md` + orchestrator `security-review.md`. Self-applied (no spawn tool in this worker). No `src/` edits.

Mode: Deep audit of trust boundaries in the **later** serial (save hangar `classKey`, settings localStorage, HUD/Digit, DOM). This wave ships no JS.

---

### Findings

No 🔴 CRITICAL or 🟠 HIGH.

#### 🟡 MEDIUM: Later impl could interpolate `classKey` into HTML / CSS text

**Location:** live `el()` is `createElement` + `textContent` (`hud.js` 244–249); no `innerHTML` in `hud.js`; hangar `classKey` is a save-controlled string (`hangar.js` 40–42; `save.js` 94). Contract `out/w111/hud02/shared-contract.md` §0.4, §0.7, §0.12.

**Issue:** This wave does not ship JS. A later PR that did `sil.innerHTML = '<svg>' + classKey` or `style.cssText = userClip` would be XSS in the overlay. Inventory proves PR1 needs **authored** CSS selectors and an allowlisted attribute only.

**Impact:** Not live. Prototype would be a new trust boundary.

**Fix (frozen):** No `innerHTML`. No CSS string concat from save. Tokens are the six `SHIP_CLASSES` keys. Unknown omit.

**Status:** mitigated in contract; not live.

#### 🟡 MEDIUM: Later impl could `for-in` / assign a hangar row onto `#hud.dataset`

**Location:** live family path sets `root.dataset.family` from `hudFamily` (`hud.js` 1083, 1730); hangar heal uses `hasOwn` (`hangar.js` 40–42). Contract §0.6–0.7.

**Issue:** PR1 copies one allowlisted token. A naive `Object.assign(root.dataset, row)` from a tampered hangar blob would put `__proto__` / unexpected keys on the HUD root.

**Impact:** Unexpected dataset keys; not RCE in the current engine if still assigned as attributes, but prototype keys must never become tokens.

**Fix (frozen):** `hasOwn` `SHIP_CLASSES` then set **one** `dataset.classKey` or delete it. Never merge save objects into the HUD node.

**Status:** mitigated in contract; not live.

#### 🟢 LOW: Digit / SKU / hub theft if later serial ignores MERGE LAW

**Location:** contract §0.2–0.3; `station.js` 188, 5963–5966, 6101, 1633–1712; `hud.js` 709–712.

**Status:** accepted residual; design-only wave.

#### 🟢 LOW: Session `rw-hud-family` must not grow a class value

**Location:** `hud.js` 92–97; contract §0.6, §0.8.

**Issue:** A later “debug class override” persisted to settings or session would reopen HUD-03-like skin picking and could stick a spoofed class on the overlay without hangar heal.

**Fix (frozen):** PR1 forbids a session class picker. Family override stays `'mech' | 'bio'`.

**Status:** mitigated in contract.

#### 🟢 LOW: Lock classKey restyle would leak cover identity

**Location:** contract §0.13; Q-ship cover names already use `textContent` (`out/w61/shared-contract.md` §7).

**Issue:** Driving facing glyphs from the lock’s `classKey` could reveal hull class before scanner pierce.

**Fix (frozen):** player mounted `classKey` only.

**Status:** mitigated in contract.

#### 🟢 LOW: No secrets in the write-set

**Location:** `docs/Hud02RemainingSilhouettesDesign.md`; `out/w111/hud02/**`.

**Issue:** None. No API keys, no tokens.

**Status:** pass.

---

### Passed Checks

- [x] No secrets in the write-set
- [x] No `src/` edits this pack
- [x] `innerHTML` freeze; no new hub DOM
- [x] No new `WORLD_FIELDS` key; hangar already has `classKey`
- [x] Digit 0/8/9 steal forbidden
- [x] No `SHIP_CLASSES` extra keys; `state.js` READ-ONLY
- [x] Allowlist before dataset write; no proto merge
- [x] No UU / SKU
- [x] Fail closed never freeze sim
- [x] `reducedMotion` mute of new facing loops frozen
- [x] HUD-03 `hudSkin` not added
- [x] Settings stay `rimward-settings-v1` (not world)
- [x] Session family override not extended to class
- [x] Lock classKey ignored

---

### Recommendations

1. Later PR1: copy the `classKeyOf` allowlist pattern; delete `data-class-key` on miss.
2. Later PR2 grep: no `innerHTML` on `hud.js`; no `WORLD_FIELDS` growth; no `.rw-reticle` child; `hudFamily` still ignores `classKey`.
3. Do not persist the DOM attribute.

---

### Re-review

Allowlist + omit-on-unknown was the XSS/proto boundary. Frozen in contract §0.4, §0.7, §0.12 and explicit non-picks. No remaining HIGH.
