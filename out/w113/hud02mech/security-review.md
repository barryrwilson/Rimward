# Security Review: HUD-02 remaining plated / mech class silhouettes (Wave 113, iteration 2)

### Risk Level: Low

### Summary

Markdown-only pack. Freeze is extend live `classKeyToken` plus authored **mech** CSS on existing facing chrome, no hub DOM, no new persist key, no Digit, no `state.js` write, no `innerHTML`. Unknown keys omit the attribute and keep live **family** facing. Family not mech does not paint the mechanical plate and does not delete an allowlisted sibling attribute. XSS, proto-from-save, persist-world, Digit theft, sibling attribute steal, and HUD-03 skin picker stay contract-frozen. No CRITICAL or HIGH. No new trust boundary this wave.

Persona: orchestrator `security-review.md`. Self-applied. No `src/` edits.

Mode: Deep audit of trust boundaries in the **later** serial. This wave ships no JS.

---

### Findings

No 🔴 CRITICAL or 🟠 HIGH.

#### 🟡 MEDIUM: Later impl could interpolate `classKey` into HTML / CSS text

**Location:** live `el()` is `createElement` + `textContent` (`hud.js` 261–266); no `innerHTML` in `hud.js`; hangar `classKey` is a save-controlled string (`hangar.js` 40–42; `save.js` 93–94). Contract `out/w113/hud02mech/shared-contract.md` §0.4, §0.7, §0.12.

**Issue:** A later PR that did `sil.innerHTML = '<svg>' + classKey` or `style.cssText = userClip` would be XSS.

**Fix (frozen):** No `innerHTML`. No CSS string concat from save. Tokens are the six `SHIP_CLASSES` keys. Unknown omit.

**Status:** mitigated in contract; not live.

#### 🟡 MEDIUM: Later impl could `for-in` / assign a hangar row onto `#hud.dataset`

**Location:** live `applyClassKeyAttr` sets **one** `dataset.classKey` (`hud.js` 110–115); hangar heal uses `hasOwn` (`hangar.js` 40–42). Contract §0.6–0.7.

**Issue:** A naive `Object.assign(root.dataset, row)` from a tampered hangar blob would put `__proto__` keys on the HUD root.

**Fix (frozen):** Keep the one-writer `hasOwn` path. Extend `classKeyToken` family gate only. Never merge save objects into the HUD node.

**Status:** mitigated in contract; not live.

#### 🟢 LOW: Digit / SKU / hub theft if later serial ignores MERGE LAW

**Location:** contract §0.2–0.3; `station.js` 188, 5964–5965, 6101; `hud.js` 726–729.

**Status:** accepted residual; design-only wave.

#### 🟢 LOW: Session `rw-hud-family` must not grow a class value

**Location:** `hud.js` 92–97; contract §0.6, §0.8.

**Status:** mitigated in contract.

#### 🟢 LOW: Lock classKey restyle would leak cover identity

**Location:** contract §0.13; `npc.js` 277 cover mesh.

**Status:** mitigated in contract.

#### 🟢 LOW: Sibling attribute delete could drop living class tokens

**Location:** live `classKeyToken` omits when `family !== 'bio'` (`hud.js` 101–102); bio CSS `hud.css` 1538–1617. Contract §0.12, §0.11.

**Issue:** A later mech PR that deletes `data-class-key` whenever family is not mech, or that forces triangle+square onto bio, would blank sibling tokens.

**Fix (frozen, iteration 2):** unknown keys delete. Allowlisted keys stay. Mech CSS is family-gated. PR1 **extends** `classKeyToken` (one writer). Fail-closed copy now says live **family** facing, not “generic plate when not mech.”

**Status:** mitigated in contract §0.12 / §2 after designer Major.

#### 🟢 LOW: No secrets in the write-set

**Status:** pass.

---

### Passed Checks

- [x] No secrets in the write-set
- [x] No `src/` edits this pack
- [x] `innerHTML` freeze; no new hub DOM
- [x] No new `WORLD_FIELDS` key; hangar already has `classKey`
- [x] Digit 0/8/9 steal forbidden
- [x] No `SHIP_CLASSES` extra keys; `state.js` READ-ONLY
- [x] Allowlist before dataset write; no proto merge; one writer
- [x] No UU / SKU
- [x] Fail closed never freeze sim
- [x] `reducedMotion` mute of new facing loops frozen
- [x] HUD-03 `hudSkin` not added
- [x] Settings stay `rimward-settings-v1`
- [x] Session family override not extended to class
- [x] Lock classKey ignored
- [x] Sibling bio attribute not deleted on allowlisted keys
- [x] Fail-closed does not force mech plate onto bio

---

### Recommendations

1. Later PR1: extend `classKeyToken` family gate to `'bio' || 'mech'`; keep `applyClassKeyAttr`; delete attribute on miss.
2. Later PR2 grep: no `innerHTML`; no `WORLD_FIELDS` growth; no `.rw-reticle` child; `hudFamily` still ignores `classKey`; mech selectors stay under `[data-family="mech"]`; sil still 22×10.
3. Do not persist the DOM attribute.

---

### Re-review

Iteration 2 closed the sibling-steal copy hole in §0.12 / §2. Iteration 3 splits heavy vs freighter on geometry only (no new persist, no color-as-class, no innerHTML). Allowlist + omit-on-unknown remains the XSS/proto boundary. No remaining HIGH.
