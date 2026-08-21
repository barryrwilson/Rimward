## Security Review: TGT-05 reticle-lock design (Wave 73)

### Risk Level: Low

### Summary

Wave 73 is markdown only. The threat model is a local browser game: XSS through world names, prototype keys on later lock ids, event-payload spread of live objects, and persist smuggle. First-pass HIGH holes (innerHTML toasts, station-as-rock, spreading a lock ref on `emit`, miss line built from `record.name`) are closed in the contract. Remaining notes are implementation cautions.

### Findings

#### 🔴 CRITICAL: (none)

No network auth, no secrets, no server. Nothing in this design introduces remote code execution.

#### 🟠 HIGH (resolved): HUD / toast XSS via world names

**Location:** `hud.js` 224–229, 1561–1640; wishlist names; models-browser `innerHTML` (`modelsbrowser.js` 114+)  
**Issue:** Ship `record.name` / coverName, landmark `name`, and survivor `name` are world strings. A later lock card or miss toast that used `innerHTML` (copying models-browser) would execute a tampered save name.  
**Impact:** Script in the HUD overlay.  
**Fix applied:** Contract §0.12 / §6.2 / §6.4 / §7: `textContent` only. Miss `commLine.text` is a module string literal, not a concatenated name. TGT-05 does not touch models-browser.

#### 🟠 HIGH (resolved): Prototype pollution on later lock ids / `lockKind`

**Location:** contract §4; live `RESERVED_IDS` (`save.js` 105); asteroid `id === index`  
**Issue:** A later station/pod/landmark lock that `for…in` merged a blob onto `targets.current` or used unsanitized string ids could promote `__proto__` / `constructor`.  
**Impact:** Polluted Object prototype; confused MATCH/mining.  
**Fix applied:** First impl keeps untagged live list refs (no blob merge). Later `lockKind` allowlist + `Object.hasOwn` / `hasOwnProperty`. Reject reserved tokens. No `for…in` blob merge. AST ids stay indexes.

#### 🟠 HIGH (resolved): Station-shaped ref treated as a rock

**Location:** inventory §2; `controls.js` 82–85; `ship.js` 653; `combat.js` 1264–1266  
**Issue:** Live rock test is `position && !object && !state`. A `{ position, name }` station (or a tampered object with those keys) would arm rock MATCH and mining pull.  
**Impact:** MATCH/mining follow the wrong object; large station disc could steal.  
**Fix applied:** Stations deferred. If later in, required `lockKind: 'station'`. Untagged station-shaped writes forbidden; unknown fails closed (contract §4–§5).

#### 🟠 HIGH (resolved): `emit` spreading a live lock / save blob

**Location:** `ctx.emit(type, data)` spreads `data` onto the event (`ctx.js` 228–229); hail/saveBlocked side effects  
**Issue:** `emit('reticleLock', current)` or `emit('commLine', ship)` would put meshes/records on the queue and could open hail if the type were reused.  
**Impact:** Object graphs in the event log; wrong UI; name strings on the wrong path.  
**Fix applied:** `reticleLock` payload only `{ hit: boolean }` literals. Miss `commLine` is `{ text: LITERAL }`. Do not reuse `hailOpened` or `saveBlocked`.

#### 🟡 MEDIUM: Unique lock audio needs one new frozen event

**Location:** contract §6.3; `ctx.js` 197–226 frozen list  
**Issue:** Existing cues cannot carry lock audio without lying. An impl that emits an **undeclared** type still plays if `song.js` `CUES` has a key, but it breaks the architecture freeze. An impl that skips the `ctx.js` comment and still emits is a contract break, not XSS.  
**Impact:** Undeclared vocabulary; reviewers miss it.  
**Fix:** PR4 is the named `ctx.js` serial, or audio stays deferred. Documented.

#### 🟡 MEDIUM: Landmark / pod names later

**Location:** `pods.js` 491–496 copies `name`; `SYSTEMS[].landmarks[].name` authored  
**Issue:** First impl does not lock these. A later card must keep `textContent` + control-char strip (contract §6.4).  
**Impact:** Same XSS class as ship names if someone uses `innerHTML`.  
**Fix:** Deferred kinds inherit §6.4. No persist of lock.

#### 🟢 LOW: Chart-mark `for (const sysId in SYSTEMS)` is authored data

**Location:** `hud.js` 637–640  
**Issue:** Existing HUD walks `SYSTEMS` with `for…in`. That table is module data, not a save blob. TGT-05 must not copy this onto `targets` or pods.  
**Fix:** none in Wave 73. Contract forbids `for…in` blob merge on lock writes.

#### 🟢 LOW: No new persist key — lock cannot be save-tampered

**Location:** inventory §1; contract §0.15 / §7  
**Issue:** `targets.current` is live-only. Jump already nulls it. Tamper has nothing to restore.  
**Fix:** keep it off `WORLD_FIELDS`.

#### 🟢 LOW: No secrets in this design

No API keys, no tokens, no credentials.

### Passed Checks

- [x] No secrets in this design
- [x] No new `localStorage` key
- [x] No `innerHTML` for TGT-05 UI
- [x] Proto ids / `lockKind` allowlist required on later kinds
- [x] HUD does not write `hullKind`
- [x] Miss line is a source literal
- [x] Event payload is not a spread lock ref
- [x] `state.js` READ-ONLY
- [x] Digit 0 / dock digits not stolen

### Recommendations

1. Later PR4: land `reticleLock` on the `ctx.js` comment list in the same PR as `song.js` `CUES`, or ship silent audio.
2. Later PR3: add a harness pin that a `{ position, name }` object does not MATCH as a rock.
3. Do not copy `modelsbrowser.js` `innerHTML` into HUD toasts.
