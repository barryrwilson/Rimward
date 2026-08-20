## Security Review: Wave 68 PR3b group 4 missiles + player turret

**Scope:** `src/systems/combat.js`, `src/systems/controls.js`, `src/core/ctx.js` (comments only), `out/w68/pr3-fire/probe.mjs`.
**Mode:** Deep audit (ammo spend, persist, pool caps, Unknowable miss, no new event / incoming gauge).
**Pass:** 2 (post-despawn ballistic fix).

### Risk Level: Low

### Summary
Combat spends missile ammo only after a dart leaves the 8-slot pool. Group 4 does not fall through to cannon. Event types stay frozen (`playerFire` reuse). No new persist. Unknowable hits stay non-beam misses. No HIGH or CRITICAL on this pass.

### Findings

#### 🟢 LOW: Missile lock is a live object reference
**Location:** `src/systems/combat.js` `tryPlayerMissile` / missile tick
**Issue:** The seeker holds `ctx.targets.current` until the lock is destroyed or its mesh leaves the scene (`object.parent` null). A console tamper can point the lock at any live ship.
**Impact:** Local-only aim cheat. No persist, no credits, no remote attacker.
**Status:** open
**Justification:** Same trust as the shipped target cycle. The game is a local browser client.

#### 🟢 LOW: `weaponGroup` is an unsanitized session integer
**Location:** `src/systems/controls.js` Digit1–4; `src/systems/combat.js` `groupWeapon`
**Issue:** Combat reads `ctx.input.weaponGroup` as written. A console write of a non-4 key still uses `GROUP_WEAPON[g] ?? 'cannon'`.
**Impact:** Session only. Contract forbids persisting `weaponGroup`. Digit 0 is not bound.
**Status:** open
**Justification:** Same as shipped groups 1–3. Fail-closed for group 4 (`isLauncherId` or null).

### Resolved this pass
- Despawn without `state.destroyed` now goes ballistic (`object.parent` check). Prevents a seeker chasing a removed mesh.

### Passed Checks
- [x] No secrets, tokens, or API keys
- [x] No `innerHTML` / `eval` / function hydrate
- [x] No `sessionStorage` / new `localStorage` weapons key
- [x] No `missileIncoming` event; no new persist event
- [x] `spendMissileAmmo` only after `spawnMissile` succeeds; dry pool and failed spend spend 0 and add no heat
- [x] Empty `launcher` / non-integer ammo / overheat / dock / no player: no shot
- [x] Group 4 empty rack does not fire cannon via `?? 'cannon'`
- [x] Missile pool cap 8; turret live-bolt sub-cap 2
- [x] `applyHit` family is `p.wkey` (`missile` / `turret`); Unknowables skip in `testNpcHits` (non-beam miss)
- [x] NPC `spawnNpcShot` still maps unknown weapons to cannon
- [x] Launcher / turret ids resolved with `isLauncherId` / `isTurretId` (`Object.hasOwn`)
- [x] Digit 0 not tracked; Digit4 is flight group only (dock overlap accepted)

### Recommendations
1. Keep ammo spend on the hangar helper only (already done).
2. Do not add an incoming-missile HUD lamp (contract frozen).
