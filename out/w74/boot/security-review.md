## Security Review: Wave 74 boot pins (`scripts/boot-test.mjs` only)

### Risk Level: Low

### Summary
The WAVE74 block is a read/call harness. It does not ship feature code. It does not write `innerHTML`. Reputation and cargo poison blobs stay on stub contexts. XSS is N/A for this harness diff. No HIGH or CRITICAL findings after the miss-pin isolation fix.

### Findings

#### 🔴 CRITICAL
None.

#### 🟠 HIGH (resolved)
1. **Live `ctx.ships` replace (first draft).** The miss pin assigned `ctx.ships = []` for one tick. NPC spawn in that frame could land on the empty array and then be dropped on restore. **Fix:** miss uses the docked refuse path. It does not replace the live ship list or the asteroid list. **Status:** resolved.

#### 🟡 LOW
1. **Enumerable `__proto__` on stub bags.** The pin uses `Object.defineProperty` so sanitize must drop the reserved key. The bag is local to the stub. **Status:** accepted (required pin).
2. **Restore on stub worlds.** `w74Restore` runs against fresh stubs, not the live boot `ctx`. CrimeScore/wanted on the snap are omitted because they are not `WORLD_FIELDS`. **Status:** accepted.

### Passed Checks
- [x] XSS N/A — harness does not set `innerHTML`; miss pin asserts static `commLine` text
- [x] No secrets
- [x] `__proto__` reputation key dropped on sanitize/restore
- [x] NaN reputation reads as 0; Beautiful stays missing
- [x] Unknown commodity and missing data `source` drop
- [x] Survivor row shape unchanged
- [x] No `crimeScore` / `wanted` on `WORLD_FIELDS` or restored stub world
- [x] Existing WAVE72 BIO pins unchanged
- [x] Pins were not weakened

### Recheck
`npm run test:boot`: `wave74 pins` all true. No `WAVE74 PINS FAIL`. Pre-existing WAVE4 fence, WAVE26 ferry/haul, WAVE35 haul FAILs still print. Harness reaches the end.
