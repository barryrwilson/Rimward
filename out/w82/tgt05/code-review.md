## Code Review: Wave 82 TGT-05 lock categories + 12 px cone

### Summary
Pick math, `lockKind` wrappers, rock-test tighten, HUD names, and stale drops match the Wave 81 contract plus owner `LOCK_CONE_PX = 12`. Probe (`out/w82/tgt05/probe.mjs`) is green (`fail=0`). No Blocker/Major findings.

### What's done well
- Disc hits win globally; the 12 px cone runs only when no body disc contains the pip.
- Body spheres are 32 / 30 / 0.9 / mesh bound — not dock 45, jump 60, glow 96, scoop 30, discovery 100.
- Ships and rocks stay untagged; the four new kinds are fresh `{ lockKind, … }` literals.
- Cycle-T is unchanged. `reticleAimPoint` still aims guns at ships/rocks only.
- MATCH / mining / hail / seeker / combat rail / lead / RANGE fail closed on kinds.
- `systemLoaded` clears kind locks; pods drop when `ctx.pods.indexOf(ref.pod) < 0`.

### Findings

None at Blocker or Major.

#### 🟡 Minor: `reservedToken` / `allowedLockKind` duplicated
**Location:** `src/systems/controls.js`, `src/systems/hud.js`, `src/game/reticle-aim.js`
**Issue:** The allowlist and reserved-token checks are copied in three files.
**Fix:** Leave as-is for this slice (no new shared module; `state.js` is read-only). Optional later helper.

#### 💡 Suggestion: station wrapper has no system id
**Location:** `src/game/reticle-aim.js` `materializeLock`
**Issue:** Station identity is `{ lockKind:'station', position }`. `systemLoaded` already nulls kind locks, so a jump cannot retarget the next station silently.
**Fix:** None required while the `systemLoaded` drop stays.

### Contract pins
| Pin | Result |
|---|---|
| KeyV extends pick | OK |
| KeyT no kind candidates | OK |
| `LOCK_CONE_PX = 12` in `reticle-aim.js` | OK |
| Allowlist `station\|gate\|pod\|landmark` | OK |
| Rock test = list `indexOf` + `!lockKind` | OK |
| Guns along reticle ray | OK |
| Digit 0 / `state.js` / NPC missiles | Untouched |
