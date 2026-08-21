## Security Review: TGT-05 remaining lock categories (Wave 81)

### Risk Level: Low

### Summary

Wave 81 is markdown only. The threat model is a local browser game: XSS through world names, prototype keys on `lockKind` / landmark ids / gate `to`, `ctx.emit` spread of live objects, persist smuggle of lock refs, and station-shaped blobs stealing MATCH/mining. First-pass HIGH holes (stamp-on-pod leak, emit smash via `type`, station-as-rock, innerHTML toasts) are closed in the contract. Remaining notes are implementation cautions.

Persona: security-auditor (`C:\Users\barry\.grok\bundled\skills\shared\personas\security-auditor.md`) plus checklist (`C:\Users\barry\.grok\skills\orchestrator\references\security-review.md`). Mode: deep audit of design + live data flow (no `src/` edits in this wave).

### Findings

#### 🔴 CRITICAL: (none)

No network auth, no secrets, no server. Nothing in this design introduces remote code execution.

#### 🟠 HIGH (resolved): Station-shaped ref treated as a rock

**Location:** inventory §2; `controls.js` 85–87; `ship.js` 653; `combat.js` 1266–1269; `hud.js` 350–352, 1564  
**Issue:** Live rock test is `position && !object && !state`. A `{ position, name }` station (or a tampered wrapper missing `lockKind`) would arm rock MATCH and mining pull and paint `ASTEROID`.  
**Impact:** MATCH/mining follow the wrong object; large station disc could steal.  
**Fix applied:** Contract §4–§5: required `lockKind` wrappers; rock test = `list.indexOf`; unknown fails closed. PR3 tightens tests **before** assigning wrappers (PR2 must not write them).

#### 🟠 HIGH (resolved): Stamping `lockKind` onto live pods / `ctx.station`

**Location:** `pods.js` 613 `emit('podCollected', { pod })`; `ctx.js` 230–231 spread; `station.js` 3793–3800  
**Issue:** First-pass draft allowed `lockKind` on the live pod object. `podCollected` already emits that object. A stamped `ctx.station` would linger after jump.  
**Impact:** Lock identity and possibly proto-tainted keys ride unrelated events; HUD readers of `ctx.station` see leftover tags.  
**Fix applied:** Contract §4: wrappers only. Do not `Object.assign` onto station, gate assembly, pod, or `SYSTEMS` rows.

#### 🟠 HIGH (resolved): `emit` spreading a live lock / save blob

**Location:** `ctx.emit(type, data)` spreads `data` onto the event (`ctx.js` 230–231)  
**Issue:** `emit('reticleLock', current)` would put meshes/records on the queue. A wrapper with `type` or `__proto__` would smash the event `type` or pollute Object.prototype.  
**Impact:** Object graphs in the event log; wrong UI; prototype pollution.  
**Fix applied:** Reuse `'reticleLock' { hit: boolean }` literals only (contract §6.3 / §7). Wrappers must not carry `type` / `__proto__` / `constructor` / `t`. Do not reuse `hailOpened` or `saveBlocked`.

#### 🟠 HIGH (resolved): HUD / toast XSS via world names

**Location:** `hud.js` 224–229, 1563–1612, 1430–1432; `contacts.js` 400; `mystery.js` 127–128; `modelsbrowser.js` `innerHTML`  
**Issue:** Station names, landmark names, dest system names, survivor `name` on pods, and clue `line` are world strings. A later card that used `innerHTML` (copying models-browser) would execute a tampered save name. Printing clue text would break §25.  
**Impact:** Script in the HUD overlay; mystery spoiler.  
**Fix applied:** Contract §0.11 / §6 / §7: `textContent` only. Miss line stays the live module literal. Landmark bracket = authored name + dist. Never clue id/text. TGT-05 does not touch models-browser.

#### 🟠 HIGH (resolved): Prototype pollution on `lockKind` / ids

**Location:** contract §4; live `RESERVED_IDS` (`save.js` 106–110); asteroid `id === index` (`asteroids.js` 1878)  
**Issue:** A later `for…in` merge of a blob onto `targets.current`, or unsanitized landmark `id` / gate `to`, could promote `__proto__` / `constructor`.  
**Impact:** Polluted Object prototype; confused MATCH/mining.  
**Fix applied:** `Object.hasOwn` only. Reject reserved tokens. Gate `to` must `Object.hasOwn(SYSTEMS, to)`. Landmark `id` must match authored table lookup. No `for…in` blob merge. AST ids stay indexes.

#### 🟡 MEDIUM: Chart-mark `for (const sysId in SYSTEMS)` is authored data

**Location:** `hud.js` 637–640  
**Issue:** Existing HUD walks `SYSTEMS` with `for…in`. That table is module data, not a save blob. This slice must not copy that walk onto lock writes or pods.  
**Impact:** None today. A copied `for…in` on a save blob would be proto.  
**Fix:** none in Wave 81. Contract forbids `for…in` blob merge on lock writes. Chart marks stay inert HUD, not a lock source.

#### 🟡 MEDIUM: Landmark / pod names on the card

**Location:** `SYSTEMS[].landmarks[].name`; `pods.js` survivor `name` copy  
**Issue:** Later cards must keep `textContent` + control-char strip. Contract prefers a static `SURVIVOR` / `CARGO` word over stuffed survivor names on the **name** line.  
**Impact:** Same XSS class as ship names if someone uses `innerHTML`.  
**Fix:** Contract §6.1 / §6.4. No persist of lock.

#### 🟢 LOW: No new persist key — lock cannot be save-tampered

**Location:** inventory §1; contract §0.14 / §7; `save.js` 75–90  
**Issue:** `targets.current` is live-only. Jump already nulls it (`jump.js` 85–87). Tamper has nothing to restore.  
**Fix:** keep it off `WORLD_FIELDS`. Do not push lock ids into `mystery.charted`.

#### 🟢 LOW: Path injection

**Location:** n/a in this slice  
**Issue:** Lock ids are authored `SYSTEMS` keys / landmark tokens / list indexes, not filesystem paths.  
**Fix:** none. Contract forbids using clue ids or free strings as identity.

#### 🟢 LOW: No secrets in this design

No API keys, no tokens, no credentials.

### Passed Checks

- [x] No secrets in this design
- [x] No new `localStorage` key
- [x] No `innerHTML` for TGT-05 UI
- [x] Proto ids / `lockKind` allowlist / wrappers required
- [x] HUD does not write `hullKind`
- [x] Miss line is a source literal
- [x] `reticleLock` payload `{ hit }` only; no new frozen event
- [x] No persist of live refs
- [x] Chart marks not a lock source; §25 clue freeze
- [x] No cone number invented
- [x] KeyT / KeyV not reopened

### Recommendations

1. Impl PR3: land rock-test tighten before the first wrapper assign (contract §9).
2. Impl PR4: `textContent` + control-char strip on every copied world string.
3. Impl: never `emit('reticleLock', lockRef)`.

### Second pass (after HIGH fixes)

Wrappers-only, PR2-no-assign, emit `type` ban, and rock-test order are in the contract and brief. No remaining CRITICAL/HIGH.
