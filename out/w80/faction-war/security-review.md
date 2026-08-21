## Security Review: MSN-02 renewable faction-war (Wave 80)

### Risk Level: Low

### Summary
War jobs extend `world.jobs` with hyphen-token ids, a raised sanitize cap, and hunt-style space-side pay. Restore and pay rebind dest and quarry from live tables. No `innerHTML`, no `job.faction` write, no target standing write, no new persist key.

### Findings

No open product findings. Stuffed dest/target, proto ids, Named Gun records, duplicate `recordId`, and `reputation[userString]` fail closed in live code.

### Passed Checks
- [x] Proto / reserved tokens: `war-__proto__-0` and `__proto__` drop on restore (`jobIdTokens` + `RESERVED_IDS`).
- [x] Hyphen tokens: full `job.id` is not `SAFE_ID.test`'d.
- [x] Stuffed `destSystem` kept on restore if it is a `SYSTEMS` key; pay/UI bind `warDestId(origin)`, not the stuffed dest.
- [x] Stuffed `job.target` is display-only; pay matches live `rec.name` after `recordId` lookup.
- [x] Ace / Named Gun `recordId` drops when a bank exists (`warSanitizeKeepsRecord` requires `role === 'patrol'` and not ace).
- [x] Duplicate `recordId` extra-drops offered twins (`extraDuplicateWarRecords`); accepted wins.
- [x] `need` must be integer 1; stuffed 2 drops the row.
- [x] `payQuoted` clamps 0…20000 on restore; expire has no pay branch; missing quote pays 0 then replace.
- [x] Employer write uses `SYSTEMS[origin].faction` with `Object.hasOwn(FACTIONS, faction)` only. Target key is not indexed.
- [x] Unknown job keys including `faction` and `asteroidId` are not copied.
- [x] `h()` / `textContent` only. No `innerHTML` in `station.js`.
- [x] Cards print quarry **name**, not `rec-n` / clue ids.
- [x] Honest offered mining/trade/hunt/passenger/explore/espionage/war are not extra-dropped to make room.
- [x] Unique four stay on the exact allowlist.

### Recommendations
1. Keep target-faction standing fail-closed until the owner authors a finite delta.
2. Isolated `out/w80/espionage/pin-check.mjs` still forbids `kind: 'war'` strings. Live boot-test ESPIONAGE pin was rewritten. Do not strip `'war'` from product to satisfy the stale replica.
