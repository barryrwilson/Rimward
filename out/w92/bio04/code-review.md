## Code Review: BIO-04 psionic weapons (Wave 92)

### Summary
Catalog, combat group 5, Digit 5, and HUD WPN/lead/range land in the contract order. Living and grafted-built fire a magenta-rose projectile; built non-grafted selects `5 · —` with no spawn, heat, or emit.

### What's done well
- `WEAPONS.psionic` is a dedicated catalog row with owner numbers; no `beam`, no `turn`.
- `GROUP_WEAPON` 1–3 line is unchanged (Wave 68 pin). Group 5 is a catalog-gated branch. Unknown groups return null.
- `canFirePsionic` lives in `src/game/psionic.js` and duplicates the hangar own-key test without importing hangar.
- NPC refuse is belt-and-suspenders on wkey and family.
- HUD WPN is `textContent` only. Grafted built HUD family stays `mech`.

### Findings

No Blocker or Major issues.

#### 🟡 Minor: Eligible dry-pool still adds heat (cannon path)

**Location:** `src/systems/combat.js` `firePlayerGun`
**Issue:** Heat is added even if the 64-bolt pool is exhausted. Missiles/turret spend on spawn only.
**Why it matters:** Matches live cannon/disruptor. Contract said reuse the HEAT pool, not a new spend-on-spawn law.
**Fix:** Leave. A later weapons pass can unify spend-on-spawn for all bolts.

#### 💡 Suggestion: `groupWeapon` now coerces with `| 0`

**Location:** `src/systems/combat.js` `groupWeapon`
**Issue:** String `"5"` now maps to group 5. Wave 68 used a raw `=== 4`.
**Why it matters:** HUD already used `| 0`. Fail-closed for unknown groups still holds.
**Fix:** None required.

### Test coverage
- `out/w92/bio04/boot-pins.mjs` pins living fire, built dry, grafted fire, proto dry, unknown group not cannon, Digit 1–2 still shoot, dock cold, reduced-motion still simulates, Unknowables miss, NPC refuse, no triad fields.

### Contract drift
- Digit 0/8/9 remain untracked. Digit 5 is TRACKED and is not swallowed.
- No hangar persist key. No `npc.js` edit. `npcFire` comment stays cannon|missile.

---

## Re-review (unset hullKind)

No Blocker or Major. Combat and HUD still call `canFirePsionic`; no duplicate `hullKind === 'living'` test. Boot pins now fire a `createShipState` player with no `hullKind` field (starter-shaped). Built dry and grafted fire still pin.
