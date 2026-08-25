# Security Review: HUD-02 remaining TARGET class silhouettes (Wave 115)

### Risk Level: Low

### Summary

Markdown-only pack. Freeze is a rail-scoped allowlisted `data-class-key` on `.rw-combat-target` from **visible lock class**, plus a player-CSS scope fix to `.rw-combat-self`. No hub DOM, no new persist key, no Digit, no `state.js` write, no `innerHTML`. Unknown keys omit the rail attribute and keep generic **family** facing on the **target** row. Q-ship glyph follows cover / visual class. XSS, proto-from-record, persist-world, Digit theft, player-vs-lock mix, and HUD-03 skin picker stay contract-frozen. No CRITICAL or HIGH. No new trust boundary this wave.

Persona: orchestrator `security-review.md` plus `C:\Users\barry\.grok\bundled\skills\shared\personas\security-auditor.md`. Self-applied. No `src/` edits.

Mode: Deep audit of trust boundaries in the **later** serial. This wave ships no JS.

---

## Security Audit: HUD-02 target class leftover (Wave 115)

### Summary

Overall risk assessment: **low risk**. Design-only. Later serial trust boundary is a lock-controlled string onto one dataset attribute, allowlisted against `SHIP_CLASSES`. Cover identity is the load-bearing security pick.

### Findings

No 🔴 CRITICAL or 🟠 HIGH.

#### 🟡 MEDIUM: Later impl could interpolate lock `classKey` into HTML / CSS text

- **Severity**: medium
- **Category**: Injection / XSS
- **Location:** live `el()` is `createElement` + `textContent` (`hud.js` 261–266); no `innerHTML` in `hud.js`; lock records are world/save-controlled (`npc.js` 276–277; `hangar.js` 40–42). Contract `out/w115/hud02tgt/shared-contract.md` §0.4, §0.7, §0.12.
- **Description:** A later PR that did `sil.innerHTML = '<svg>' + classKey` or concatenated lock keys into `style.cssText` would be XSS.
- **Impact:** Overlay script from a tampered record `classKey` / `coverClass`.
- **Reproduction:** Hostile save or record with `classKey` containing markup; naive innerHTML path (not live).
- **Remediation:** Frozen: no `innerHTML`. No CSS string concat from lock/save. Tokens are the six `SHIP_CLASSES` keys. Unknown omit.
- **Status:** mitigated in contract; not live.

#### 🟡 MEDIUM: Later impl could `for-in` / assign a ship record onto `tgtRail.dataset`

- **Severity**: medium
- **Category**: Prototype pollution / unexpected DOM attrs
- **Location:** live player writer sets **one** `dataset.classKey` on `#hud` (`hud.js` 110–115). Contract §0.6–0.7, §0.11.
- **Description:** A naive `Object.assign(tgtRail.dataset, rec)` from a tampered record would put `__proto__` keys on the target rail.
- **Impact:** Unexpected attributes; possible prototype pollution of dataset maps.
- **Reproduction:** Record with `__proto__` / extra enumerable keys; naive merge (not live).
- **Remediation:** One-field write-on-change after `hasOwn` `SHIP_CLASSES`. Never merge records onto HUD nodes. Never write lock class onto `#hud`.
- **Status:** mitigated in contract; not live.

#### 🟢 LOW: Digit / SKU / hub theft if later serial ignores MERGE LAW

- **Severity**: low
- **Category**: Product-control impersonation
- **Location:** contract §0.2–0.3; `station.js` 188, 5963–5966, 6100–6105; `hud.js` 726–729.
- **Description:** A later PR could park class on Digit 0 or the 80 px hub.
- **Impact:** Owner-map theft; HUD-01 reopen.
- **Reproduction:** Ignore contract.
- **Remediation:** Frozen non-picks.
- **Status:** accepted residual; design-only wave.

#### 🟢 LOW: Hidden Q-ship `state.classKey` if later serial ignores cover freeze

- **Severity**: low (informational given freeze)
- **Category**: Information disclosure
- **Location:** `npc.js` 272–277; `combat.js` 1651–1657; `traffic-feel.js` 114–121; rail name `hud.js` 2068–2071; contract §0.12.
- **Description:** Disguised Q-ships keep **real** `state.classKey` (cutter) under a cover mesh. Reading that for `tgtFacing` would leak identity. Mk II already unmasks **name**; unmasking the **glyph** while the mesh is still cover would leak twice.
- **Impact:** Cover blown on a 22 px sil.
- **Reproduction:** Lock unrevealed q-ship; paint `target.state.classKey`.
- **Remediation:** Frozen: visual / cover class (`coverClass ?? 'freighter'`). Mk II name pierce does **not** unmask the glyph. Reveal (`record.revealed`) may then follow true class.
- **Status:** mitigated in contract. This was the reason Wave 111/113 forbade lock class on the **player** glyph; this leftover scopes it to the **target** row **with** cover law.

#### 🟢 LOW: Session `rw-hud-family` must not grow a class value

- **Severity**: low
- **Location:** `hud.js` 92–97; contract §0.6, §0.8.
- **Status:** mitigated in contract.

#### 🟢 LOW: Putting lock class on `#hud` would restyle player facing

- **Severity**: low
- **Location:** live `applyClassKeyAttr` 110–115; unscoped CSS `hud.css` 1286–1336, 1590–1669; contract §0.11–0.13.
- **Description:** One root attribute cannot drive player vs lock without mixing. Census proves the mix already happens (player → both rails).
- **Remediation:** Rail writer on `.rw-combat-target` only. Narrow player CSS to `.rw-combat-self`.
- **Status:** mitigated in contract.

#### 🟢 LOW: No secrets in the write-set

- **Status:** pass.

---

### Passed Checks

- [x] No secrets in the write-set (`docs/` + `out/w115/hud02tgt/**` only)
- [x] No `src/` edits this pack
- [x] `innerHTML` freeze; no new hub DOM
- [x] No new `WORLD_FIELDS` key
- [x] Digit 0/8/9 steal forbidden
- [x] No `SHIP_CLASSES` extra keys; `state.js` READ-ONLY
- [x] HUD-03 `hudSkin` not added
- [x] Proto allowlist frozen
- [x] Q-ship cover / visual class frozen; hidden stats ignored
- [x] Fail-closed never freeze the sim
- [x] KeyT/KeyV/KeyK/KeyX stay
- [x] Sibling Wave 115 paths not stolen
- [x] API/auth/crypto N/A (no endpoints, no custom crypto)
- [x] No `localStorage` class key

### Recommendations

1. Later PR1 must keep `hasOwn` `SHIP_CLASSES` and cover-class reads. Do not copy `target.state.classKey` raw.
2. Later PR1 must not put lock class on `#hud`.
3. Later PR1 must omit the rail attribute when the rail hides.

### Review process notes

- Scope: design freeze for a later HUD overlay attribute.
- Trust boundary: lock record strings → one dataset field → authored CSS.
- Sensitive data: Q-ship hidden class (cover). Frozen visual class only.
- Automated grep this pack: no secrets, no `innerHTML` instruction except forbid.

### Re-review

No 🔴 CRITICAL or 🟠 HIGH opened. Cover-class freeze, `#hud` lock-write forbid, and `innerHTML` forbid stay. No markdown fix cycle required. No `src/` edits.
