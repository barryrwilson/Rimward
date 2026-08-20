## Code Review: Wave 68 PR4 HUD group 4 readouts

**Scope:** `src/systems/hud.js`, `out/w68/pr4/probe.mjs`.
**Persona:** reviewer + orchestrator code-review checklist.
**Pass:** final (no Blocker/Major).

### Summary
One helper (`hudWeaponKey`) feeds lead, RANGE, and WPN so empty group 4 cannot drift to cannon. Seated dart prints `4 · Dart rack · 6`, RANGE 720, lead TOF from speed 260. Mining still hides lead. HUD stays read-only. Probe pins strings and source.

### What's done well
- Empty rack is `4 · —` and RANGE 0; seated includes integer ammo.
- Name prefers launcher catalog `name`, then `WEAPONS[wkey].name`.
- Lead still uses `dist / speed`; dart pip is advisory (comment) without a new instrument.
- `hudFamily` is untouched. Living hull stays `bio` with a dart seated.
- No new HUD node. Aux panels stay `.rw-aux`.
- `weaponHudLabel` is exported so the probe can pin exact strings without DOM.

### Findings

#### 🟡 Minor: HUD `| 0` vs combat `=== 4`
**Location:** `src/systems/hud.js` 190; `src/systems/combat.js` `groupWeapon`
**Issue:** HUD treats `'4'` as group 4. Combat does not.
**Fix:** Do not change combat in this PR. Keep HUD `| 0` with groups 1–3.
**Status:** open — session-only; Digit4 writes an integer.

#### 💡 Suggestion: duplicate seated-id lookup in the label
**Location:** `src/systems/hud.js` 202–206
**Issue:** `hudWeaponKey` already validated the launcher. Label looks up `LAUNCHER_IDS` again for `name`.
**Fix:** Keep. One extra own-key read per 5 Hz text tick is cheaper than a second helper.
**Status:** open — leave as-is.

#### 💡 Suggestion: combat `groupWeapon` and HUD `hudWeaponKey` are cousins
**Location:** `src/systems/hud.js` 189–196
**Issue:** Two files resolve group 4. Drift is possible later.
**Fix:** Do not import combat into HUD. Contract: HUD read-only PR.
**Status:** open — helper inside HUD is the three-site law.

### Resolved this pass
- Empty group 4 no longer used `WEAPON_KEYS[3] ?? 'cannon'` at lead, RANGE, and WPN.

### Test coverage
- `node out/w68/pr4/probe.mjs` covers: helper at three sites, no `innerHTML`, no new HUD child, empty `4 · —`, seated ammo string, RANGE 720 vs 0, lead 260 vs 0, mining hide, living `bio`, write-forbidden keys, XSS ammo.
- Did not run `npm run test:boot` (out of scope).
- Browser Digit4 WPN / RANGE / lead is a later check.
