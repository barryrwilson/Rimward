# Security Review: TGT-03 remaining radar (Wave 98 design)

**Scope:** `docs/Tgt03RadarDesign.md`, `out/w98/radar/shared-contract.md`, `out/w98/radar/current-tgt03-radar-inventory.md`. No `src/` in this worker.  
**Mode:** Deep audit of the **freeze** (persist collision, XSS/copy on pips, innerHTML, Digit theft, proto, scanner heal, emit smash). Live HUD/save cited as trust boundaries the later serial must not widen.  
**Persona:** `security-auditor.md` + `orchestrator/references/security-review.md`.  
**Pass:** 2 (after `world.contacts` smash + live sibling toast/lock-park cites).

### Risk Level: Low

### Summary

Design-only markdown. The freeze reuses the live scanner-gated `.rw-contacts` picture, forbids a new persist key and forbids writing pips into the existing `WORLD_FIELDS` `'contacts'` people roster, keeps scanner heal 0/1/2, and keeps pip copy as shape plus static `«` / `»`. No HIGH/CRITICAL remain open.

## Security Audit: TGT-03 radar freeze

### Summary

Overall risk assessment: **low**. One HIGH (`world.contacts` persist smash) was found in pass 1 and **addressed** in the contract. Remaining items are residual later-impl nits.

### Finding 1: Persist radar into WORLD_FIELDS `contacts`
- **Severity**: high (pass 1) → **addressed**
- **Category**: Data integrity / persist collision
- **Location**: `src/game/save.js:80`; `src/core/ctx.js:162`; `src/game/contacts.js:510–544`; freeze `out/w98/radar/shared-contract.md` §0.3, §5
- **Description**: `'contacts'` already persists the station NPC roster. A later “radar contacts” snapshot on that key would overwrite people on save/restore.
- **Impact**: Lost dock NPCs; possible blob shape mismatch on restore.
- **Reproduction**: Later PR assigns `ctx.world.contacts = pipRows` or adds a same-named field merge.
- **Remediation**: Contract: no new `WORLD_FIELDS` key. HUD never writes `ctx.world.contacts`. Picture is live `ctx.ships` + `scanner`.
- **Status**: addressed (pass 2)

### Finding 2: Ship names on contact pips
- **Severity**: high if opened → **not opened**
- **Category**: XSS / injection
- **Location**: `hud.js:1491` (`textContent` for `«`/`»` only); `hud.js:240–245` `el()`
- **Description**: `record.name` / `state.name` are save strings. Interpolating them onto pips (or `innerHTML` of the SVG) would put untrusted text on the HUD. Live `pushToast` is `textContent`. Live pip labels are static glyphs.
- **Impact**: Control chars / spoofed traffic labels from a crafted save blob.
- **Reproduction**: `slot.close.textContent = live.state.name`.
- **Remediation**: Contract §1.5 / §5: no names; glyphs only; `innerHTML` forbidden.
- **Status**: addressed by freeze

### Finding 3: Mk III / unknown scanner bypasses heal
- **Severity**: high if opened → **not opened**
- **Category**: Authorization / save tamper
- **Location**: `hangar.js:44–46`; `save.js:1079–1082`
- **Description**: Unknown scanner values heal to **0**. A new radar SKU writing `3` would vanish on restore **or** force a heal widen that grants Mk II-class picture from a hand-edited save.
- **Impact**: Free long-range traffic picture, or silent gear loss.
- **Remediation**: Contract §0.2 / §1.3: no Mk III; heal stays `[0,1,2]` else 0.
- **Status**: addressed by freeze

### Finding 4: Digit 0 / 8 / 9 theft
- **Severity**: high if opened → **not opened**
- **Category**: Authorization / control binding
- **Location**: `station.js:186, 1622-1702, 5920-5922`
- **Description**: Binding radar to Digit 0/8/9 would steal shipyard / papers. Outfitting 2/4 already buy Wolfeye.
- **Remediation**: Contract §0.5 / §6. Freeze: untouched. No extra radar Digit.
- **Status**: addressed by freeze

### Finding 5: innerHTML / emit smash
- **Severity**: high if opened → **not opened**
- **Category**: XSS / event flood
- **Location**: `hud.js` grep innerHTML 0; `hud.js:1502–1508` existing `hudMechContact` / `hostileEnter`
- **Description**: New emit types or `innerHTML` SVG/pips would widen the queue and DOM.
- **Remediation**: Reuse live emits. `el()` / `textContent` / `createElementNS` + attributes only. No new song cue.
- **Status**: addressed by freeze

### Finding 6: Prototype ids as object keys
- **Severity**: medium
- **Category**: Prototype pollution
- **Location**: `hud.js:1443` `live.id || live.record.id || ('i'+i)`; `seenHostiles` Set
- **Description**: Live code uses a `Set` (safe). A later map `pips[id] =` with `__proto__` would be unsafe. Radar serial must not switch to proto-unsafe maps.
- **Impact**: Polluted Object.prototype if a later PR used a raw object dictionary.
- **Remediation**: Contract §5: reserved ids; keep Set / slot arrays. Do not index `WEAPONS` / `SYSTEMS` with pip id.
- **Status**: addressed by freeze (residual: later PR1 pins should include a reserved id that still paints as a pip, not as a key)

### Finding 7: Scanner-ungate as a free radar
- **Severity**: medium if opened → **not opened**
- **Category**: Economy / authorization
- **Location**: `station.js:4384–4399`; `hud.js:1383`
- **Description**: Showing the arc at scanner 0 steals the 400/900 UU Wolfeye buys without persist tamper.
- **Remediation**: Contract: tier 0 = no arc.
- **Status**: addressed by freeze

### Finding 8: Design markdown cannot execute
- **Severity**: informational
- **Category**: Scope
- **Location**: this write-set
- **Description**: No runtime. Residual risk is a later impl ignoring merge law.
- **Status**: open (inherent)

### Positive Observations
- Live pip pool is created once; no per-frame `innerHTML`.
- SVG stroke `d` is numeric `toFixed`.
- Scanner restore already allowlists 0/1/2.
- Settings load iterates `Object.keys(FIELDS)`, not `for-in` of the blob.
- Sibling `npcFireToast` already fail-closes reserved weapon keys; this serial does not touch it.

### Passed Checks
- [x] No secrets in the write-set
- [x] No new persist key
- [x] `world.contacts` write forbidden
- [x] innerHTML forbidden in freeze
- [x] Digit 0/8/9 frozen
- [x] No new emit type
- [x] No NPC name interpolation on pips
- [x] Scanner heal 0/1/2 frozen
- [x] HUD never writes `hullKind` (restated)
- [x] No `state.js` write

### Recommendations
1. Later PR3 must grep that HUD does not assign `ctx.world.contacts`.
2. Later PR1 pins must include scanner `99` / `'2'` / `__proto__` → treat as 0 (hide).
3. Do not “helpfully” persist the pip list.
