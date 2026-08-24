## Security Review: BIO-01 remaining obtain (gift + pirate seed)

### Risk Level: Low

### Summary
Gift and pirate seed write allowlisted hangar rows through `sanitizeHangarRecord`. Desk copy is static `textContent`. Pirate `commLine` is a fresh literal. No HIGH or CRITICAL issues.

### Findings

#### 🟡 MEDIUM: Loot roll uses `Math.random`
**Location:** `src/game/bio-seed.js` `rollPirate`
**Issue:** Pirate drop uses `Math.random` (or an injected `rng`) against `PIRATE_SEED_DROP_RATE`.
**Impact:** Predictable in a debug console. Not an auth or persist bypass.
**Fix:** None for this wave. Match live `DATA_DROP_RATE` style as the contract requires.
**Justification:** Game loot, not a secret. Owner rate 0.05. Do not switch to `crypto.getRandomValues`.

#### 🟢 LOW: Pirate stem `__proto__` would mint `hull___proto___1`
**Location:** `src/game/hangar.js` `nextSeedId`
**Issue:** Stem regex allows underscores, so `__proto__` is a legal stem. The minted id is not a reserved proto key.
**Impact:** None on the live desk. Callers pass `seed_pirate` only.
**Fix:** Not required. Gift id stays a source literal. `isSafeHullId` still rejects id `__proto__`.

### Passed Checks
- [x] No `innerHTML` in gift/pirate paths (`h()` / `textContent`)
- [x] Gift id `hull_seed_gift` is a source literal
- [x] Proto ids (`__proto__`, `constructor`) fail closed
- [x] Living sanitize drops `grafted`
- [x] `commLine` payload is `{ text, from: 'echo' }` — no hangar spread, no smash of `type`
- [x] Rank / banner / cap / once re-checked in `grantSwornGift`, not only UI hide
- [x] No new `localStorage` key (`requestAutosave` → `rimward-save-v1`)
- [x] No path join / remote URL / `eval`
- [x] No invented UU or standing delta
- [x] Grant does not remount or evict
- [x] No new `WORLD_FIELDS` key
- [x] HUD does not write `player.hullKind`

### Recommendations
1. Keep pirate rng as `Math.random` unless the owner opens a different entropy rule.
2. Keep gift papers on People. Do not add a dock service key.

### Re-review (Wave 92 pin fix)
Comment in `src/game/bio-seed.js` no longer contains the substring `DATA_DROP_RATE`. Rate remains `PIRATE_SEED_DROP_RATE = 0.05`. No new XSS, persist, or emit issues. No HIGH/CRITICAL.
