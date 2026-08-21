## Code Review: Wave 74 boot pins (`scripts/boot-test.mjs` only)

### Summary
WAVE74 appends one section after WAVE72. It does not rewrite the harness. Pins call exported pick, sanitize, desk-gate, `priceOf`, and spawn-skip helpers. Binding and missile seeker use source only where those symbols are not exported. Recheck is clean of Blocker/Major.

### What's done well
- WAVE72 BIO object is untouched.
- KeyT cycle is live input: group 1 excludes the planted rock; group 3 includes it.
- `pickReticleLock` / `reticleAimPoint` skip destroyed ships and return the list row (`id === index`).
- Persist pins use stub `restore` / `sanitizeReputation` / `sanitizeCargoList`, not the live hold.
- Archive gate uses `archiveDeskAllowed` plus the `DETAIL_STATIONS` table (Unknowables absent).
- Live targeting flags, weapon group, planted rock, and fake ship are restored.

### Findings

#### 🔴 Blocker
None.

#### 🟠 Major (resolved)
1. **Miss pin replaced live `ctx.ships`.** First draft emptied the NPC list for one tick. **Fix:** docked KeyV miss. Sentinel lock is not stolen. **Status:** resolved.

#### 🟡 Minor
1. **`TRACKED` and `liveMissileLock` are not exported.** The section slices `controls.js` and `combat.js` and mirrors the seeker predicate. Same class as WAVE71 source pins. **Status:** accepted.
2. **Docked miss is a refuse, not an empty-glass miss.** Contract still wants miss feedback and no `innerHTML`. Both are pinned. Isolated `pickReticleLock` covers empty glass. **Status:** accepted.

#### 💡 Suggestion
None required for this wave.

### Recheck
- `wave74 pins`: 33 keys, all true.
- `wave72 bio`: still all true.
- No `WAVE74 PINS FAIL`.
- Pre-existing WAVE4/WAVE26/WAVE35 FAILs unchanged as banners.

### Test coverage
Boot section covers TGT-05 §11, REP §13, EXP §8 PR5. Feature workers did not edit `src/` here.
