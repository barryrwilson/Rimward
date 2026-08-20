# Security Review: `out/w63/shared-contract.md` (SHP shared contract)

**Method:** Self-applied `C:\Users\barry\.grok\skills\orchestrator\references\security-review.md` + `C:\Users\barry\.grok\bundled\skills\shared\personas\security-auditor.md`.  
**Mode:** Deep audit of persist / dock / identity boundaries (design-only markdown; no runtime, no auth, no payments).  
**Scope:** `out/w63/shared-contract.md` only. No `src/` edits in this wave.  
**Pass:** 3 (re-apply after §4.2 flight / `ctx.config.ship` remount law).

### Risk Level: Low

### Summary

The brief is a client persist + dock-desk contract. It does not add network, auth, or settings keys. World-string XSS, hangar allowlists, `Object.assign` player leftovers, and catalog price trust are the real boundaries. No CRITICAL or HIGH remain in the markdown. SHP sanitize is still open on implementation.

## Security Audit: SHP shared contract

### Summary

Overall risk: **low**. Design-only. Implementation must land the allowlists or Finding 2 becomes live.

### Finding 1: World-string XSS if the yard desk uses `innerHTML`

- **Severity**: high (implementation risk) → **resolved in contract**
- **Category**: Injection (DOM XSS)
- **Location:** `src/systems/station.js` `h()` 1450–1454 (today `textContent`); contract §0.7, §2.4, §6.2
- **Description:** Hull names, `shipName`, faction names, catalog lines, and notices are world/save strings. An `innerHTML` desk would execute markup from a crafted save or hail-derived name.
- **Impact:** Script in the shipyard list or dock notice.
- **Reproduction:** Future PR sets `row.innerHTML = slot.name` from hangar JSON.
- **Remediation:** Contract law: `textContent` / `Text` nodes only. CSS authored. Overlay wipe via `overlay.textContent = ''` stays a wipe, not an interpolate.
- **Status:** resolved (contract law). Implementers must not regress `station.js` `h()`.

### Finding 2: `hullKind` and hangar persist without an allowlist today

- **Severity**: medium → **resolved in contract law** (SHP must still implement)
- **Category**: Client persistence / unexpected state
- **Location:** `src/game/save.js` `snapshot` 170, `restore` `Object.assign` 359, `sanitizeRestored` 232–241, `WORLD_FIELDS` 65–82; contract §1.2–§1.4, §6.1
- **Description:** Player is not a `WORLD_FIELDS` whitelist. Extra player keys keep. `sanitizeRestored` heals NaN vitals only. A HUD or desk write of `hullKind: 'built'` sticks and forces `mech`. A hangar parked on `ctx.player` would skip world sanitize. `freshStart` `Object.assign(createShipState('light'))` does not drop leftover keys (379).
- **Impact:** Unsanitized family switch; leftover purchased identity after a no-save death; unsanitized slots if hangar is stored on the player record.
- **Reproduction:** Edit `rimward-save-v1` `player.hullKind` or `__proto__` keys on a future `world.hangar`; restore; call `hudFamily` / remount.
- **Remediation:** HUD never writes `hullKind`. Hangar is `WORLD_FIELDS` only. Allowlist `living`|`built`; delete anything else. Unknowables force `'living'`. Copy hangar/hulls by allowlisted keys onto fresh literals. `freshStart` deletes or rewrites `hullKind` and rebuilds hangar to the living starter.
- **Status:** resolved in the brief. Open on SHP save code (not this wave).

### Finding 3: Trusting save-authored price / class / rep floor

- **Severity**: medium → **resolved in contract**
- **Category**: Integrity / privilege (local)
- **Location:** contract §4.1.14, §6.1, §6.4; `createShipState` `bookValue` `state.js` 135
- **Description:** If buy reads `slot.price` or `bookValue` from the blob, a hand-edit buys a heavy hull for 1 UU or skips the rep gate.
- **Impact:** Free capital ships; faction hulls without standing.
- **Reproduction:** Set hangar row `price: 0`, `classKey: 'frigate'`, `minRep: -999`; click Buy.
- **Remediation:** Catalog is code. Debit authored cost. Re-check live `reputation`. `classKey` must exist on `SHIP_CLASSES` (else `light`). Default omit `frigate` from buy lists. Tamper can still add rows (same class as credit edits); types and buy path stay fail-closed.
- **Status:** resolved (contract law).

### Finding 4: Prototype keys on hangar / player extras

- **Severity**: low
- **Category**: Input validation / prototype pollution
- **Location:** contract §1.2, §6.3; `Object.assign(ctx.player, snap.player)` `save.js` 359
- **Description:** `JSON.parse` does not pollute `Object.prototype` on modern engines, but `Object.assign` from a raw slot can copy `constructor` or unexpected enumerables onto the live player.
- **Impact:** Unexpected methods/fields on `ctx.player` if implementers assign raw JSON.
- **Reproduction:** Hangar row `{ "constructor": { ... } }` then `Object.assign(player, rawRow)`.
- **Remediation:** Contract forbids `Object.assign(target, rawSlot)`. Allowlist copy onto a fresh literal or `Object.create(null)`.
- **Status:** resolved in the brief. Open as an implementation pin.

### Finding 5: New `localStorage` hangar key vs `clearAutosave`

- **Severity**: low
- **Category**: Persistence consistency
- **Location:** `save.js` `clearAutosave` 200–206; contract §1.1, §6.6
- **Description:** A side-channel hangar key would survive New Game or vanish from manual berths.
- **Impact:** Ghost fleets after New Game, or lost berth fleets.
- **Remediation:** Hangar rides the `{v:1}` envelope via `WORLD_FIELDS` only.
- **Status:** resolved (contract law).

### Finding 6: Save-authored cruise / burn on remount

- **Severity**: medium → **resolved in contract**
- **Category**: Integrity (local flight envelope)
- **Location:** contract §4.1.4, §4.2, §6.1; `ctx.config.ship` `ctx.js` 43–47; `ship.js` 547–561
- **Description:** Player cruise reads `ctx.config.ship`, not `classKey`. If remount copies `maxSpeed` / `creep` from the hangar blob, a hand-edit sets a 999 u/s envelope. If remount only writes `classKey`, the player keeps the light 120/30 baseline after a heavy / freighter buy.
- **Impact:** God-speed save, or a purchased freighter that still flies light.
- **Reproduction:** Hangar row `{ "classKey": "freighter", "maxSpeed": 999 }` then remount; or remount a `heavy` row without touching `ctx.config.ship`.
- **Remediation:** Copy cruise / burn / creep / stopTime from authored `SHIP_CLASSES[sanitized classKey]` onto `ctx.config.ship`. Do not persist `ctx.config.ship`. Do not read those numbers from the blob.
- **Status:** resolved (contract law). Open on SHP remount code (not this wave).

### Passed Checks

- [x] No secrets, API keys, or tokens in the brief
- [x] No new admin / privileged client path
- [x] No `innerHTML` of world strings directed
- [x] No HUD family persist key / no `settings.js` skin checkbox
- [x] HUD forbidden from writing `hullKind`
- [x] Unknowables cannot sanitize to `'built'`
- [x] Scanner / miningLaser / concealedMounts keep existing allowlists
- [x] Cargo uses existing `sanitizeCargoList`
- [x] Digit-0 service is append-only (no stolen Launch/Standing keys)
- [x] MATCH remount does not write `input.throttle`
- [x] Remount must not persist or blob-copy `ctx.config.ship`; envelope is authored `SHIP_CLASSES`
- [x] N/A: API auth, SQL, crypto, wallets, CORS, server sessions

### Recommendations

1. Implementation: pin restore of `hullKind: 'nope'` → key deleted → `hudFamily` `bio`.
2. Implementation: pin Unknowables row cannot remain `'built'`.
3. Implementation: pin buy ignores blob `price` / `bookValue`.
4. Implementation: `sessionHudFamilyOverride` stays session-only; never copy onto hangar.
5. Implementation: remount of `heavy` / `freighter` must change `ctx.config.ship.maxSpeed` / `creep` from authored `SHIP_CLASSES`, not from the blob.
