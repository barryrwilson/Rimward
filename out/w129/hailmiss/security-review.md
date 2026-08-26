## Security Review: Hail02 PR1 named miss-feedback

### Risk Level: Low

### Summary

PR1 emits a primitive `'hailMiss'` event and shows it with HUD `textContent`. No `ship` payload, no `innerHTML`, no Agent hail act, no persist mute, no `flags.paused`, no Fear write. No CRITICAL/HIGH remain open.

### Findings

#### 🔴 CRITICAL

None.

#### 🟠 HIGH

None after fix pass.

#### 🟡 MEDIUM: Linger key collision if `|` survived

**Location:** `src/systems/hud.js` `hailMissKeyName`  
**Issue:** A save-backed name with `|` could shift key fields.  
**Fix applied:** strip `|` and C0 (code < 32 / 127), cap 48. Display stays `textContent`.  
**Status:** resolved

#### 🟡 MEDIUM: Prototype bag read on dest id

**Location:** `src/systems/hail.js` `emitDockJumpMiss`  
**Issue:** `SYSTEMS[sysId]` with a reserved key could walk the prototype.  
**Fix applied:** `typeof === 'string'` and `Object.hasOwn`.  
**Status:** resolved

#### 🟢 LOW: Demand look-ahead silences overlay miss

**Location:** `src/systems/hud.js` `hailMissToast`; `hail.js` `hailMissFrameHas(..., 'hailOpened')`  
**Issue:** Same-frame `'hailOpened'` skips miss toast.  
**Justification:** Acceptance 8 forbids dual toast with a Hail01 demand card. Intentional fail-closed.

#### 🟢 LOW: `commLine.from` still dropped

**Location:** `hud.js` `toastForEvent` `'commLine'`  
**Justification:** Hail02 uses `'hailMiss'`, not `commLine`. HUD-04.

### Passed Checks

- [x] No secrets
- [x] No new persist / WORLD_FIELDS / localStorage
- [x] No `innerHTML` / `insertAdjacentHTML` / `document.write` on this path
- [x] Event fields primitives only `{ name, verb, reason, dist }`
- [x] HUD never reads `e.ship` for miss copy
- [x] No Agent `act({ name: 'hail' })`
- [x] No `flags.paused` write
- [x] No `bumpFear` / `'fearChanged'` from miss emit
- [x] Authored reason tokens only
- [x] `emitHailMiss` never throws
- [x] Title / settings / unknown overlay skip
- [x] Unseen contact is not the subject (current lock / station / gate dest)

### Recommendations

1. Keep observe harvest off `'hailMiss'` hulls (none exist).
2. Do not add Agent hail pulse in a follow-up Hail02 slice.
