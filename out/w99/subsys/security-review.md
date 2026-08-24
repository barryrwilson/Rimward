# Security Review: TGT-03 remaining subsystem targeting (Wave 99 design)

**Scope:** `docs/Tgt03SubsystemDesign.md`, `out/w99/subsys/shared-contract.md`, `out/w99/subsys/current-tgt03-subsystem-inventory.md`. No `src/` in this worker.  
**Mode:** Deep audit of the **freeze** (persist, XSS, Digit theft, proto, fail-closed numbers, `lockKind` smash, emit). Live HUD/save/combat cited as trust boundaries the later serial must not widen.  
**Persona:** `security-auditor.md` + `orchestrator/references/security-review.md`.  
**Pass:** 1 (design freeze already fail-closes HIGH classes found in radar/awareness siblings).

### Risk Level: Low

### Summary

Design-only markdown. The freeze reuses live peel + tgt-rail bars, forbids a hub gauge and a persist key, forbids `innerHTML` and Digit/Key theft, and fail-closes damage retarget until the owner names parts and a control. No HIGH/CRITICAL remain open.

## Security Audit: TGT-03 subsystem freeze

### Summary

Overall risk assessment: **low**. HIGH classes (persist smash, XSS names, Digit theft, peel rewrite as a free pierce, `lockKind` smash) are named and **not opened**. Remaining items are residual later-impl nits.

### Finding 1: Persist a part cursor into WORLD_FIELDS
- **Severity**: high if opened → **not opened**
- **Category**: Data integrity / persist collision
- **Location**: `src/game/save.js:76–100`; freeze `out/w99/subsys/shared-contract.md` §0.5, §5
- **Description**: `WORLD_FIELDS` already holds `scanner`, `contacts` (people), hangar, nav. A later “subsys” or “part” snapshot would ride restore and could collide if misnamed `contacts`.
- **Impact**: Lost dock NPCs, or a restored “aimed at engines” flag that lies in a new system.
- **Reproduction**: Later PR adds `'subsys'` to `WORLD_FIELDS` or assigns `ctx.world.contacts = parts`.
- **Remediation**: Contract: no new `WORLD_FIELDS` key. No new `localStorage` key. Autosave stays `rimward-save-v1`. Settings stay `rimward-settings-v1`. No part-cursor persist.
- **Status**: addressed by freeze

### Finding 2: Part labels from record / blob via innerHTML
- **Severity**: high if opened → **not opened**
- **Category**: XSS / injection
- **Location**: `hud.js:242–247` `el()`; `hud.js:1096–1115` `pushToast` `textContent`; `hud.js:2020–2022` rail name
- **Description**: `record.name` / `state.name` are save strings. A part list built with `innerHTML` or unstripped blob keys would put untrusted text on the HUD.
- **Impact**: Control chars / spoofed part names from a crafted save.
- **Reproduction**: `row.innerHTML = rec.subsysLabel`.
- **Remediation**: Contract §0.8 / §5: `innerHTML` forbidden; no part list from blobs; rail stays `textContent`.
- **Status**: addressed by freeze

### Finding 3: Digit 0 / 8 / 9 theft
- **Severity**: high if opened → **not opened**
- **Category**: Authorization / control binding
- **Location**: `station.js:186, 1622–1702, 5920–5926, 5983–5986`
- **Description**: Binding a part cycle to Digit 0/8/9 would steal shipyard, launch, epics, launcher papers, or turret papers.
- **Impact**: Dock/outfitting verbs stop working; economy papers skip confirm.
- **Remediation**: Contract §0.6 / §3 / §6. No extra subsystem Digit. Default no new TRACKED key.
- **Status**: addressed by freeze

### Finding 4: KeyT / KeyV steal + cone rewrite
- **Severity**: high if opened → **not opened**
- **Category**: Authorization / control binding
- **Location**: `controls.js:39–46, 55–83, 199–216, 265–266, 280–281`; `reticle-aim.js:15`
- **Description**: Rebinding T/V to “next part” would drop ship cycle and reticle lock. Widening `LOCK_CONE_PX` would lock distant objects.
- **Remediation**: Contract §0.7: keys and cone stay. This serial does not rewrite pick math.
- **Status**: addressed by freeze

### Finding 5: lockKind smash (object kinds vs parts)
- **Severity**: high if opened → **not opened**
- **Category**: Integrity / confused deputy
- **Location**: `reticle-aim.js:279–310`; `controls.js:90–93, 210–214`; `combat.js:1123–1216`
- **Description**: Adding `lockKind: 'engine'` would make `allowedLockKind` fail closed (drop lock) **or** force an allowlist widen that lets a part wrapper look like a station/rock.
- **Impact**: Lost TGT-05 locks, or MATCH/mining/hail stolen by a fake rock/station.
- **Remediation**: Contract §1.1: no part `lockKind`. Default no `ctx.targets.part`.
- **Status**: addressed by freeze

### Finding 6: Damage retarget as a free shield pierce
- **Severity**: high if opened → **not opened**
- **Category**: Economy / combat authorization
- **Location**: `state.js:209–231`; freeze §0.14, §1.2
- **Description**: A picker that skips screen/shell without owner numbers would let every hull skip the shield layers. That is a balance and fairness change, not a HUD reuse.
- **Impact**: Starter cannon deletes engines/hull through full shields.
- **Remediation**: Fail-closed: later impl does not ship damage retarget while selectable parts / skip law stay unnamed. Default: geometry peel stays.
- **Status**: addressed by freeze

### Finding 7: Invented SKU / UU / standing
- **Severity**: high if opened → **not opened**
- **Category**: Economy tamper / owner impersonation
- **Location**: inventory §10; contract §0.10, §6
- **Description**: A new targeting-computer buy without an owner price would be a made-up debit, or a free gear flag that hangar heal does not know.
- **Impact**: Credits desync; heal 0 on unknown gear; standing used as a fake gate.
- **Remediation**: No new SKU. Do not invent UU or standing. Picker absence is **not** a license to mint a product.
- **Status**: addressed by freeze

### Finding 8: Prototype ids as object keys
- **Severity**: medium
- **Category**: Prototype pollution
- **Location**: `hud.js:360–362`; `reticle-aim.js:268–269`; `save.js:108–113`
- **Description**: Live code reserved-token checks exist. A later `parts[blobId] =` map would be unsafe if `__proto__` arrived from a record.
- **Impact**: Polluted Object.prototype.
- **Remediation**: Contract §0.11 / §5: reserved ids; no proto-unsafe merge; do not index `WEAPONS` with a part name.
- **Status**: addressed by freeze (residual: PR1 pins should include a reserved token that does not become a key)

### Finding 9: New emit type flood
- **Severity**: medium if opened → **not opened**
- **Category**: Event flood
- **Location**: `ctx.js:222–226`; `hud.js:1131–1136`
- **Description**: A per-shot `subsysHit` emit would fill the toast/song queue.
- **Remediation**: Contract §5: reuse `playerHit` / `npcHit` / `shieldDown` / `engineOut`. No new emit type.
- **Status**: addressed by freeze

## Security Review: subsystem freeze (checklist form)

### Risk Level: Low

### Findings

No open 🔴 CRITICAL or 🟠 HIGH.

### Passed Checks
- [x] No secrets in these markdown files
- [x] No new localStorage key
- [x] No new WORLD_FIELDS key
- [x] innerHTML forbidden
- [x] Digit 0/8/9 not stolen
- [x] KeyT/KeyV not stolen
- [x] Fail-closed numbers (no invented UU)
- [x] HUD never writes hullKind
- [x] world.contacts people roster not reused for parts

### Recommendations
1. Later PR1 pins: reserved token must not key a part map.
2. Later PR3 remains skipped until owner numbers exist.
