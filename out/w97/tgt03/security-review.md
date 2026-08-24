# Security Review: TGT-03 remaining awareness (Wave 97 design)

**Scope:** `docs/Tgt03AwarenessDesign.md`, `out/w97/tgt03/shared-contract.md`, `out/w97/tgt03/current-tgt03-inventory.md`. No `src/` in this worker.  
**Mode:** Deep audit of the **freeze** (XSS/copy, persist, emit smash, innerHTML, Digit theft, proto). Live HUD/combat cited as trust boundaries the later serial must not widen.  
**Persona:** `security-auditor.md` + `orchestrator/references/security-review.md`.  
**Pass:** 2 (after fail-closed weapon allowlist).

### Risk Level: Low

### Summary

Design-only markdown. The freeze keeps attacker copy as static literals on the existing `textContent` toast path, forbids new persist/SKU/events, and fail-closes unknown `npcFire.weapon` so HUD does not copy combat’s “unknown → cannon” default. No HIGH/CRITICAL remain open.

## Security Audit: TGT-03 awareness freeze

### Summary

Overall risk assessment: **low**. One HIGH (HUD mirroring `spawnNpcShot` cannon default / `WEAPONS[e.weapon]`) was found in pass 1 and **addressed** in the contract. Remaining items are residual later-impl nits.

### Finding 1: Unknown npcFire.weapon must not toast as cannon
- **Severity**: high (pass 1) → **addressed**
- **Category**: Input validation / fail-closed
- **Location**: `src/systems/combat.js:1300`; freeze `out/w97/tgt03/shared-contract.md` §3.2, §5
- **Description**: `spawnNpcShot` does `WEAPONS[weapon] ? weapon : 'cannon'`. A toast helper that reused that default, or `WEAPONS[e.weapon]`, would treat `__proto__` / garbage as cannon-vs-player and could also pollute lookups.
- **Impact**: False attacker warnings; prototype-key indexing if a later PR used `WEAPONS[e.weapon]` as an object lookup.
- **Reproduction**: Later PR toasts whenever combat spawns a vsPlayer bolt, without `e.weapon === 'cannon'`.
- **Remediation**: Contract now: HUD `=== 'cannon'` / `=== 'missile'` only. Unknown / missing / `__proto__` → no toast. Do not index `WEAPONS` from HUD.
- **Status**: addressed (pass 2)

### Finding 2: Dynamic attacker names on the toast
- **Severity**: high (pass 1, preempted) → **addressed**
- **Category**: XSS / injection
- **Location**: `hud.js:1103` (`textContent`); freeze contract §3.3
- **Description**: `commLine` already prints `e.text`. A firing toast that interpolated `live.state.name` would put record/save strings on the HUD. Live `pushToast` is `textContent` (not `innerHTML`).
- **Impact**: Control chars / spoofed “Incoming …” lines if names are attacker-controlled via save blobs.
- **Reproduction**: `pushToast(ship.state.name + ' is firing')`.
- **Remediation**: Frozen literals `Incoming fire.` / `Incoming dart.` only. No `e.ship` on the node.
- **Status**: addressed (pass 2)

### Finding 3: New persist / settings keys
- **Severity**: high if opened → **not opened**
- **Category**: Data exposure / persist surface
- **Location**: `save.js:76-101` `WORLD_FIELDS`; `settings.js:23` `rimward-settings-v1`
- **Description**: Awareness is live lock + events. A new world key or settings key would widen sanitize/restore.
- **Impact**: Blob merge / extra localStorage.
- **Remediation**: Contract §0.3: no new `WORLD_FIELDS`, no new `localStorage` key.
- **Status**: addressed by freeze

### Finding 4: Digit 0 / 8 / 9 theft
- **Severity**: high if opened → **not opened**
- **Category**: Authorization / control binding
- **Location**: `station.js:186, 1622-1702, 5920-5922`
- **Description**: Binding awareness to Digit 0/8/9 would steal shipyard / papers.
- **Remediation**: Contract §0.5 / §6. Freeze: untouched.
- **Status**: addressed by freeze

### Finding 5: innerHTML / emit smash
- **Severity**: high if opened → **not opened**
- **Category**: XSS / event flood
- **Location**: `hud.js` grep innerHTML 0; `ctx.js:244` `npcFire` already exists
- **Description**: New emit types or `innerHTML` toasts would widen the queue and DOM.
- **Remediation**: Consume live `npcFire`. `el()` / `textContent` / `h()` only. No new song cue.
- **Status**: addressed by freeze

### Finding 6: Toast flood as a availability issue
- **Severity**: medium
- **Category**: Availability (HUD channel)
- **Location**: `npc.js:89` ~0.33 s; `hud.js:60` 5 slots
- **Description**: Untrottled cannon toasts would overwrite comm/milestone slots.
- **Impact**: Pilot misses `SAVE BLOCKED` / shield-down lines.
- **Remediation**: 2.5 s separate fire gap frozen. Documented, not residual in the freeze.
- **Status**: addressed by freeze (residual: later PR must keep the gap)

### Finding 7: Design markdown cannot execute
- **Severity**: informational
- **Category**: Scope
- **Location**: this write-set
- **Description**: No runtime. Residual risk is a later impl ignoring merge law.
- **Status**: open (inherent)

### Positive Observations
- Live `pushToast` already uses `textContent` and `cls|text` dedupe.
- Dart toast already fail-closes missing missile target.
- `stripHudText` / `reservedToken` already exist for lock names (this serial does not print them on the firing toast).
- Settings load already iterates `Object.keys(FIELDS)`, not `for-in` of the blob.

### Passed Checks
- [x] No secrets in the write-set
- [x] No new persist key
- [x] innerHTML forbidden in freeze
- [x] Digit 0/8/9 frozen
- [x] No new emit type
- [x] Static copy / no NPC name interpolation
- [x] Weapon allowlist fail-closed (pass 2)
- [x] Prototype / `WEAPONS[e.weapon]` indexing forbidden in HUD toast helper
- [x] HUD never writes `hullKind` (restated)

### Recommendations
1. Later PR1 pins must include `__proto__` / missing weapon → null toast.
2. Do not “helpfully” default unknown weapons to cannon on the HUD path.
