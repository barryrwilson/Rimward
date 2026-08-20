# Security Review: `out/w63/shp-02-hangar.md` (SHP-02 hangar)

**Method:** Self-applied `C:\Users\barry\.grok\skills\orchestrator\references\security-review.md` + `C:\Users\barry\.grok\bundled\skills\shared\personas\security-auditor.md`.  
**Mode:** Deep audit of the persist boundary (design-only; no runtime).  
**Scope:** `out/w63/shp-02-hangar.md` after re-dispatch (shared-contract merge + Unknowables numbered paths). No `src/` edits.  
**Threat model:** hand-edited `rimward-save-v1` / berth slots 1–3. Single-player `localStorage`. No network.

### Risk Level: Low (after note fixes)

### Summary

The brief puts hangar on `WORLD_FIELDS` as `{ mountedId, hulls }`, rebuilds rows from the contract allowlist, caps at 8, and forces Unknowables to `'living'` in every numbered writer. Remaining hole is the same class as editing `credits`: a crafted ownable `heavy` / `frigate` still mounts.

## Security Audit: SHP-02 hangar persist

### Summary

Overall risk: **low** for a client-only save. Unknowables+`'built'` no longer survives a coder who follows only numbered steps. Contract envelope wins over the old stored-only draft.

### Finding 1: Unknowables + `hullKind: 'built'`

- **Severity**: high → **resolved in note**
- **Category**: Authorization / unexpected state
- **Location**: hangar note §2.6, §3.2.1 step 6, §3.2.2 step 5, §3.3 step 2, §9.2 step 7, §9.3 step 4, §10 step 5, §12 step 2–3, §14.1 step 4
- **Description**: A single allowlist of `'built'|'living'` still permitted `faction: 'unknowables'` + `hullKind: 'built'`. The previous note claimed coerce only in §2.5 / §11.
- **Impact**: Tampered save mounts Unknowables as built. HUD family flips to mech.
- **Reproduction**: Edit a hulls row or `player.hullKind` to `'built'` with `faction: 'unknowables'`, restore, remount, `hudFamily`.
- **Remediation**: After every enum allowlist, if faction is Unknowables, write `'living'`. Same step on pack, load, sanitize, player allowlist, restore copy, remount, buy stock, and snapshot park.
- **Status**: resolved in the brief

### Finding 2: Stale mounted row on snapshot

- **Severity**: high → **resolved in note**
- **Category**: State integrity
- **Location**: hangar note §1.3
- **Description**: Live hull is a row in `hulls`. If `snapshot()` copied a stale row, restore §9.3 would overwrite live cargo / gear / vitals.
- **Impact**: Lost hold or gear after a mid-flight autosave.
- **Remediation**: Numbered park of the mounted row before WORLD_FIELDS copy. Park includes Unknowables force.
- **Status**: resolved in the brief

### Finding 3: `freshStart` leftover `hullKind` / parked fleet

- **Severity**: high → **resolved in note**
- **Category**: Unexpected state
- **Location**: `save.js` `freshStart` ~378–380; hangar note §12
- **Description**: `Object.assign` keeps extra keys. Contract rebuilds hangar to one living starter.
- **Impact**: Mech HUD on the recovery light, or a no-save death that keeps a purchased fleet (old Q6 vault).
- **Remediation**: Player allowlist + force `'living'` + replace hangar with one starter row + starter world mirrors.
- **Status**: resolved in the brief

### Finding 4: `Object.assign` of raw hangar JSON

- **Severity**: high → **resolved in note**
- **Category**: Prototype pollution / mass assignment
- **Location**: hangar note §2.2, §3.2, §9; `save.js` restore ~359
- **Description**: Today player restore assigns the whole blob. A hangar implementation that `Object.assign(ctx.player, record)` would copy unknown keys.
- **Impact**: Pollution or a second purse on the player.
- **Remediation**: Rebuild via `createShipState` + explicit fields. Delete unknown player keys. Credits only on world. Drop `__proto__` / `constructor` / `prototype`.
- **Status**: resolved in the brief

### Finding 5: Unbounded `hulls` array

- **Severity**: high → **resolved in note**
- **Category**: Privilege escalation (local)
- **Location**: hangar note §4, §9.1
- **Description**: An unsized array would admit infinite slots.
- **Impact**: Free fleet size.
- **Remediation**: Cap 8. Keep mounted row; drop tail. Purchase refuses at cap.
- **Status**: resolved in the brief

### Finding 6: `requestAutosave` bypassing combat / jump gates

- **Severity**: medium → **resolved in note**
- **Category**: State integrity
- **Location**: hangar note §3.2 step 8; `save.js` `trySave` ~636–656
- **Description**: A new writer that `JSON.stringify(snapshot(ctx))` without `trySave` gates could persist mid-jump.
- **Remediation**: `requestAutosave` must reuse `trySave` gates.
- **Status**: resolved in the brief

### Finding 7: Crafted `SHIP_CLASSES` hull without purchase

- **Severity**: medium
- **Category**: Client persistence
- **Location**: hangar note §11, Q9; contract §1.2
- **Description**: A valid `{ classKey: 'frigate', faction: 'ferrous', hullKind: 'built' }` still mounts. Contract admits every `SHIP_CLASSES` key. BUY lists omit capital rows.
- **Impact**: Skip the yard. No server. Same class as editing `world.credits`.
- **Remediation**: Receipt list later (note §13). Out of first-slice scope.
- **Status**: open (accepted default; contract)

### Finding 8: World-string XSS in Shipyard rows

- **Severity**: low
- **Category**: Injection (DOM)
- **Location**: hangar note §5.2; `station.js` uses `textContent` / `h()` today
- **Description**: `name` / `shipName` come from save. `innerHTML` would execute markup.
- **Remediation**: Note requires `textContent` and `stripControlChars` + `NAME_MAX` 40.
- **Status**: resolved in the brief (implementation reminder)

### Finding 9: Prototype / reserved ids

- **Severity**: low
- **Category**: Prototype pollution
- **Location**: hangar note §2.2, §11
- **Description**: If an implementer later indexes `map[id] = rec`, `__proto__` is dangerous. The spec stores an array and drops reserved ids.
- **Remediation**: Already law. Do not introduce an id-keyed object.
- **Status**: resolved in the brief

### Finding 10: `sanitizeFaction` admits `SYSTEMS` ids

- **Severity**: low
- **Category**: Unexpected state
- **Location**: `save.js` ~111–118; hangar note §2.2; contract §1.2
- **Description**: Contract requires `sanitizeFaction` else `'independent'`. That helper also accepts system ids. A row can carry a system id as `faction`.
- **Impact**: Odd HUD / catalog lookup. Not Unknowables-as-built. Not a proto key (`__proto__` fails the helper).
- **Remediation**: Contract MERGE LAW. Do not invent a second faction helper in this brief.
- **Status**: accepted (contract)

### Passed Checks

- [x] No secrets, API keys, or tokens in the brief
- [x] Persist location is `WORLD_FIELDS` `'hangar'` as `{ mountedId, hulls }`
- [x] Record allowlist + unknown-key drop (contract keys only)
- [x] `classKey` is `SHIP_CLASSES` else `'light'`
- [x] `faction` via `sanitizeFaction` else `'independent'`
- [x] `hullKind` enum; Unknowables forced `'living'` on every numbered path
- [x] Credits not on hulls
- [x] Cargo via existing `sanitizeCargoList`; capacity finite ≥ 20 / `{20,30,40}`
- [x] Vitals reclamped from `SHIP_CLASSES` maxima
- [x] Hull cap 8; mounted row kept
- [x] Reserved ids dropped; array not a proto map
- [x] New Game does not touch berth keys
- [x] HUD must not write `hullKind`; no HUD persist key
- [x] Career gear on the hull row; world keys are mirrors
- [x] Snapshot parks the mounted row first
- [x] `freshStart` rebuilds one living starter
- [x] `requestAutosave` reuses save gates
- [x] Digit 0 opens appended `'shipyard'`
- [x] Shared contract wins on conflict
- [x] SHP-01 stock rows must pass `sanitizeHangarRecord` before use
- [x] N/A: API auth, SQL, crypto, wallets, CORS, server sessions

### Recommendations

1. Implementation: one `sanitizeHangarRecord` used by restore, park, load, and SHP-01 stock.
2. Boot test: inject a tampered snapshot (unknown class + 99 slots + `__proto__` id + Unknowables built + stale mounted cargo) and assert the heals in this note.
3. Leave receipts to a later SHP-01 wave (Finding 7).
