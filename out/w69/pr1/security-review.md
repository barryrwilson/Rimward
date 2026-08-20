## Security Review: AST PR1 fieldOre + orbit seed

### Risk Level: Low

### Summary
Save-boundary sanitise writes a fresh `fieldOre` object from `Object.keys` only. Tamper cannot mint ore above seed, pollute `Object.prototype`, or feed NaN into orbit trig. A snapshot that omits `fieldOre` deletes the live bag (hangar precedent). No new `localStorage` key.

### Findings

No CRITICAL, HIGH, or open LOW findings after the omit-key delete.

#### Resolved LOW: omitted `fieldOre` kept the live bag
**Location:** `src/game/save.js` `restore`
**Fix:** `if (snap.world.fieldOre === undefined) delete ctx.world.fieldOre` before sanitise. Overlay then sees `undefined !== lastOreRef` and refills from seed.

### Passed Checks
- [x] No secrets in code
- [x] No new `localStorage` key (`KEY` stays `rimward-save-v1`)
- [x] `Object.keys` only on `fieldOre` (no new `for…in`)
- [x] `RESERVED_IDS` + `__proto__` dropped; unknown SYSTEMS keys dropped
- [x] Child keys decimal integer strings `0..count-1` (cap 160)
- [x] Values finite integers `0..64`; remaining `99` dropped
- [x] Fresh `{}` assign; never write user keys onto `Object.prototype`
- [x] Overlay `min(seeded, persisted)` cannot mint above seed
- [x] Snapshot that omits `fieldOre` deletes the live bag (hangar precedent)
- [x] `world.time` null/NaN/negative heals to `0` before pose
- [x] `field.kind` `__proto__` / typo fails closed to band default
- [x] No new frozen event
- [x] Ore keys not persisted

### Recommendations
1. Keep sanitise on restore as the only trust boundary for `fieldOre`.
2. Later serial owner may export `SLOTS` from `solarsystem.js` so keep-out cannot drift.
