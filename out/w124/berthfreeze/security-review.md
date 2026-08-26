# Security Review: CTL-03 Berth Records sim freeze (Wave 124 markdown)

### Risk Level: Medium (design); no live `src/` change this wave

### Summary

Markdown-only leftover pack. Census proves berth does not hold the sim. The dangerous later mistake is impersonating KeyP pause (breaks LOAD) or skipping the full update loop (drops `systemLoaded`). Contract forbids those. No secrets, no `innerHTML` in live berth, no new persist key.

Review mode: **Deep Audit** on save/load + overlay flags (trust boundary = `localStorage` snapshots + session flags). Applied `C:\Users\barry\.grok\skills\orchestrator\references\security-review.md` and persona `security-auditor.md`.

---

## Security Audit: berth hold / save-load / resume

### Summary

Overall risk if PR1 follows the contract: **low**. Overall risk if PR1 maps hold → `flags.paused` or persists hold: **high**. Those paths are **forbidden** in merge law (fixed before DONE).

### Finding 1: Berth hold must not impersonate `flags.paused` (LOAD refuse)

- **Severity**: high (design; **resolved** in contract)
- **Category**: Availability / data integrity (restore desync)
- **Location**: `src/game/save.js:1416-1420`; `src/main.js:149-155`
- **Description**: `loadFromSlot` returns immediately when `ctx.flags.paused`. Pause skips every `system.update`. A cross-system restore emits `systemLoaded` into `ctx.events`; if the loop is frozen, station/gates/environment can stay on the old system. Using pause as berth exclusivity would make LOAD from the records desk a no-op.
- **Impact**: Player taps LOAD, panel may close or appear to restore, world furniture stays wrong until the next jump.
- **Reproduction**: Open berth, KeyP, tap LOAD — live refuse. A berth-sets-paused PR would refuse LOAD even without KeyP.
- **Remediation**: Session `berthHold` only. Overlay-policy still never writes `paused`. LOAD allowed while hold && !paused.
- **Status**: **resolved** — contract §0.7–0.8, §0.1 LOAD row, design Acceptance 2–3.

### Finding 2: Full `systems` loop skip repeats the Wave 28 hazard

- **Severity**: high (design; **resolved** in contract)
- **Location**: `src/main.js:149-155`; `save.js` restore `1233-1238` + `setBerthOpen(false)` `1434`
- **Description**: Button LOAD runs off-rAF, emits `systemLoaded` into `ctx.events`, then the next frames rotate `lastEvents`. If hold skips **all** system updates the way pause does, consumers never rebuild. Brief phrase “main.js skip player-facing ticks” must **not** mean `if (!paused && !berthHold) update`.
- **Impact**: Same desync as Finding 1, even if `flags.paused` stays false.
- **Reproduction**: Hypothetical PR skips the loop while `berthHold`, LOAD, next two rAFs drop the event.
- **Remediation**: Reader early-returns only. LOAD **clears hold in the same click** as restore.
- **Status**: **resolved** — contract §0.9, §0.15, §2 LOAD row.

### Finding 3: Jump charge is `jump.js`, not `gate.js` emit alone

- **Severity**: high (design; **resolved** in contract)
- **Location**: `src/systems/gate.js:677-678`; `src/game/jump.js:200-227`
- **Description**: Inbox hole is arrival **behind** the modal. Gating only `jumpRequested` leaves an in-flight charge (`timer += dt`, midpoint swap) running.
- **Impact**: Player opens L during charge, still arrives in another system.
- **Reproduction**: Enter zone, start charge, KeyL before midpoint, wait.
- **Remediation**: `jump.js` reader freezes timer and does not `beginJump` under hold. Do not teleport. Do not add a second emit writer.
- **Status**: **resolved** — contract §0.10–0.12.

### Finding 4: Hostile save must not persist a forever hold or flying AP

- **Severity**: medium (design; **resolved** in contract)
- **Location**: `save.js` WORLD_FIELDS `77-102`; `nav.js:48-55`; `ctx.js:210`
- **Description**: Overlay flags are session. `writeNav` always sets `autopilot: false`. A new WORLD_FIELDS key for hold would let a crafted snapshot freeze flight after boot. Persist-resume AP is already NAV-03 forbidden.
- **Impact**: Soft-lock / unexpected jump on load.
- **Reproduction**: Hand-edit `rimward-save-v1` (local XSS-adjacent; same-origin game).
- **Remediation**: No new persist key. LOAD clears hold. `sanitizeNav` untouched.
- **Status**: **resolved** — contract §0.6, §0.11.

### Finding 5: XSS via berth hint / resume / meta

- **Severity**: medium (later impl; **locked** forbidden)
- **Location**: `save.js:1370, 1377, 1493-1497` live `textContent`
- **Description**: Slot meta concatenates `sysName` and credits via `textContent`. A later `innerHTML` hint or resume reason built from `snap.world.currentSystem` would be XSS if a blob injects HTML. `SYSTEMS[sysId].name` is authored, but credits/date are still better as text.
- **Impact**: Script in overlay z 60.
- **Reproduction**: Only if PR1 uses `innerHTML` / `insertAdjacentHTML`.
- **Remediation**: `textContent` / `el()` only. Contract §0.4.
- **Status**: **resolved** (lock). Live `save.js` has **zero** `innerHTML`.

### Finding 6: Prototype pollution into flags

- **Severity**: low
- **Location**: later `ctx.flags.berthHold`; overlay-policy authored ids `overlay-policy.js:7`
- **Description**: `for-in` merge from a save blob into `ctx.flags` could set `__proto__`. Live restore already sanitizes world via WORLD_FIELDS copy (`save.js:979-980`).
- **Impact**: Shared-object pollution.
- **Remediation**: Authored assignment `ctx.flags.berthHold = true/false` only. Contract §0.19.
- **Status**: **resolved** (lock).

### Finding 7: Resume control must not steal privileged keys

- **Severity**: low
- **Location**: death Enter `save.js:1341`; title Enter; Digit 0/8/9 station
- **Description**: Binding Enter or Digit1–9 to RESUME would recover death, continue title, or fire docked services if those overlays race.
- **Impact**: Privileged action from the wrong screen.
- **Remediation**: Text button only. No Enter. No new Digit. Contract §0.17.
- **Status**: **resolved** (lock).

### Finding 8: Fail-closed must not freeze the sim

- **Severity**: informational
- **Location**: `setBerthOpen` mutex try/catch `save.js:1387-1389`; overlay-policy `never throws`
- **Description**: A throw in a new helper could break the animation loop. Falling back to `flags.paused` would reintroduce Finding 1.
- **Impact**: Soft-lock.
- **Remediation**: catch; skip hold write; never pause; never throw. Contract §0.15.
- **Status**: **resolved** (lock).

### Positive Observations

- Live berth already `textContent` for title/hint/meta; no `innerHTML` in `save.js`.
- `WORLD_FIELDS` is an allowlist copy, not a `for-in` of the whole world.
- Overlay-policy documents **never writes paused**; hail digits already refuse when paused.
- LOAD mid-jump refused; SAVE mid-jump refused with toast.
- `SAFE_ID` / `RESERVED_IDS` already block `__proto__` as faction keys (`save.js:105-114`).
- `sanitizeNav` forces `autopilot: false` on every write.

---

### Findings (orchestrator format)

#### 🟠 HIGH: Pause impersonation would break LOAD
**Location:** `save.js:1420`  
**Issue:** Hold ≠ pause.  
**Impact:** LOAD no-op / desync.  
**Fix:** `berthHold` session; contract §0.7–0.8.  
**Status:** resolved in markdown

#### 🟠 HIGH: Full-loop skip = same LOAD hazard
**Location:** `main.js:149-155`  
**Issue:** Brief “skip player-facing ticks” misread.  
**Fix:** Reader early-return; LOAD clears hold same click.  
**Status:** resolved in markdown

#### 🟠 HIGH: In-flight jump charge is `jump.js`
**Location:** `jump.js:221-227`  
**Issue:** Emit-only gate is not enough.  
**Fix:** jump.js reader freeze timer.  
**Status:** resolved in markdown

#### 🟡 MEDIUM: Persist hold / AP
**Location:** `save.js:77-102`; `nav.js:54`  
**Status:** resolved in markdown (forbid)

#### 🟡 MEDIUM: innerHTML later
**Location:** `save.js:1377`  
**Status:** resolved in markdown (forbid)

#### 🟢 LOW: proto flags / Enter resume
**Status:** resolved in markdown (forbid)

### Passed Checks

- [x] No secrets in this pack or live berth path
- [x] No new localStorage key proposed
- [x] innerHTML forbidden later; live save.js clean
- [x] LOAD vs pause collision frozen
- [x] Fail-closed never throw / never pause-fallback
- [x] Authored overlay ids / flag names
- [x] NAV-03 AP false on restore kept
- [x] `controls.js` / npc spawn not claimed

### Recommendations

1. Later PR1 implementers must re-read contract §0.7–0.12 before touching `main.js`.
2. Boot pin later: LOAD from berth while `berthHold` && !paused still restores (optional PR2).
3. Do not add `berthHold` to `WORLD_FIELDS` even as “debug”.

### Re-review (after lock)

No remaining CRITICAL/HIGH. Medium/low locked as forbids. Authored hint/resume literals added so later copy cannot interpolate save blobs into HTML. Pack is markdown-only; no `src/` regression this wave.

### Re-review (after remainder lock)

Hiding SAVE/LOAD behind a resume-only card would block LOAD while hold is on (availability). Contract now forbids that remainder. Desk stays. LOAD same-click clear stays. No new persist. No `innerHTML`. No pause impersonation. No remaining CRITICAL/HIGH.
