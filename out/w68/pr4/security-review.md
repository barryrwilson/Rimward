## Security Review: Wave 68 PR4 HUD group 4 readouts

**Scope:** `src/systems/hud.js`, `out/w68/pr4/probe.mjs`.
**Mode:** Deep audit (XSS of catalog names / ammo, persist writes, prototype launcher ids, new HUD sinks).
**Persona:** security-auditor + orchestrator security-review checklist.
**Pass:** final (no HIGH/CRITICAL to fix).

### Risk Level: Low

### Summary
HUD reads group 4 through `hudWeaponKey` / `weaponHudLabel` and prints with `textContent`. Empty rack does not fall through to cannon. Unknown launcher ids fail closed via `isLauncherId` (`Object.hasOwn`). HUD does not write `launcher`, `missileAmmo`, `turret`, `hullKind`, `faction`, `classKey`, or `input.throttle`. No new DOM sink.

### Findings

#### 🟡 MEDIUM: catalog `name` is printed raw
**Location:** `src/systems/hud.js` 205–209
**Issue:** WPN uses `LAUNCHER_IDS[id].name` or `WEAPONS.missile.name` with no HTML strip.
**Impact:** `innerHTML` of that string would XSS. This PR assigns `weaponName.textContent` only. Authored `Dart rack` has no `<`.
**Status:** open — contract requires `textContent` at the UI boundary.
**Justification:** Encoding belongs at render. Probe pins `!innerHTML` and integer-only ammo.

#### 🟢 LOW: `weaponGroup` is a session integer
**Location:** `src/systems/hud.js` 189–196
**Issue:** HUD coerces `ctx.input.weaponGroup | 0`. Combat still uses `g === 4` without coerce.
**Impact:** A console write of `'4'` can show dart WPN/RANGE/lead while combat does not fire. Session only. Not persist.
**Status:** open
**Justification:** Same HUD `| 0` as groups 1–3. Digit 4 is flight session. Contract forbids persisting `weaponGroup`.

#### 🟢 LOW: family debug still reads `sessionStorage`
**Location:** `src/systems/hud.js` 76–81
**Issue:** Pre-existing `rw-hud-family` override. This PR does not add a weapons key.
**Impact:** Local skin debug only. HUD-02 closed; weapons do not pick the family.
**Status:** open — out of write-set intent; do not grow a missile debug key.
**Justification:** Living + dart still returns `bio` from `hullKind`.

### Resolved this pass
None at HIGH/CRITICAL. Empty group 4 returns `null` from `hudWeaponKey` so RANGE/lead cannot use cannon 500 / 900.

### Passed Checks
- [x] No secrets, tokens, or API keys
- [x] No `innerHTML` / `eval` / `document.write`
- [x] WPN / names / ammo via `textContent`
- [x] No new `#hud` child, lock box, aspect ring, incoming-missile gauge, turret reticle, mass/power bar
- [x] Plant / Flight / Heat stay `.rw-aux`
- [x] `isLauncherId` (`Object.hasOwn`) before `LAUNCHER_IDS[id]`
- [x] `__proto__` / `god` / empty launcher → `4 · —`, RANGE 0, lead speed 0
- [x] Non-integer ammo (`'6'`, `2.9`, `'<img>'`) prints `0`, not HTML
- [x] No assignment to `world.launcher` / `missileAmmo` / `turret` / `input.throttle` / player `hullKind` / `classKey`
- [x] `hudFamily` still reads `hullKind`; living + dart stays `bio`
- [x] No `missileIncoming`; no new persist event
- [x] Probe does not edit boot-test

### Recommendations
1. Keep ammo and SKU names on `textContent` if a later HUD wave adds nodes.
2. Do not add an incoming-missile lamp (contract frozen).
