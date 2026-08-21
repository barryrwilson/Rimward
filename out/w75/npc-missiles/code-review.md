## Code Review: Wave 75 NPC missiles design docs

### Summary

Markdown-only integrator pack. Inventory cites live file:line. Contract wins. After the self-review pass, Blocker/Major holes (double toast, omitted ace `target`, `spawnNpcShot` reuse, HUD gauge creep) are closed in the brief + contract. Remaining notes are impl-time.

### What's done well

- Live inventory distinguishes player dart (`spawnMissile`, pool 8, `testNpcHits` only) from NPC cannon (`spawnNpcShot`, 64-pool).
- HUD-01/02 stay closed; warning is off-column; default **no NPC missiles** until Q1/Q2.
- Wave 57 hit-test split is spelled, not waved at.
- Unknowables: both `applyHit` miss and NPC emit gate.
- `state.js` READ-ONLY, Digit 0/8/9 untouched, no second player SKU, no chaff, no NPC `auto` turret.
- SHP-03 file is pointed at, not edited.
- Serial PRs refuse fire/warning until owner picks.

### Findings

#### 🔴 Blocker (resolved, re-dispatch): Ace cannon omits `target`; darts must not

**Location:** `npc.js` 1872; `combat.js` 1672–1675; brief §4.2 / §4.3  
**Issue:** Ace duel `npcFire` has no `target`. Combat treats `null` as player. A leftover brief clause still allowed “ace duel legacy missing-target-means-player” after the first review claimed the hole closed.  
**Fix applied:** Brief §4.2 step 5 and §4.3 now **match** contract §2.1 / §4.2.7. Missile `npcFire` always sets explicit `target`. Ace vs player copies `target: 'player'`. Missing target on a missile emit → drop, do not aim the player. Cannon omit stays cannon-only.

#### 🔴 Blocker (resolved): `spawnNpcShot('missile')` is not a seeker

**Location:** `combat.js` 1230–1250  
**Issue:** Weapon string `'missile'` already resolves `WEAPONS.missile` and would spawn a ballistic bolt.  
**Fix applied:** Contract §4.2 forbids that path. Inventory §2 watchout.

#### 🟠 Major (resolved): Two toast paths for one dart

**Location:** brief §5 first draft  
**Issue:** `commLine` + `toastForEvent(npcFire)` would double.  
**Fix applied:** One proposed toast path. `commLine` is Q2 alternative, not additive.

#### 🟠 Major (resolved, re-dispatch): Stale header cited as Wave 57 law

**Location:** `combat.js` 35–36 vs 1716–1718; contract §4.3; inventory §2  
**Issue:** Header says player-aimed use `testPlayerHit` only and ship-aimed never `testPlayerHit`. Live split is the opposite for player shots and NPC-vs-player. Inventory quoted the header as Wave 57 law.  
**Fix applied:** Contract and inventory cite **1716–1718**. Header marked stale. Missile later: `vsPlayer` → `testPlayerHit`; else `testNpcHits`; never `testPlayerHit` on NPC-vs-NPC.

#### 🟠 Major (resolved): Missile tick vs player never exists today

**Location:** `combat.js` 1738  
**Issue:** A PR that only gated `npcFire` and reused the missile loop would never `testPlayerHit`. Darts would pass through the player.  
**Fix applied:** Contract §4.3 table; PR2 is a dedicated hit-test PR.

#### 🟠 Major (resolved): Who-fires percent fanfic

**Location:** task risk; `npc.js` personality 1256–1261  
**Issue:** Personality is resolve, not a dart dice. A “30% of pirates” invented here would ship without an owner number.  
**Fix applied:** No percent. Role subset proposed. Unset cadence → cannon only. Default nobody until Q1.

#### 🟡 Minor: Suggested NPC pool cap 4 is a starting number

**Location:** contract §4.1  
**Issue:** Same class as SHP-03 pool 8 — impl may tune.  
**Fix:** Already labeled suggested / not persist. No change.

#### 🟡 Minor: `ctx.js` frozen comment does not list `npcFire`

**Location:** `ctx.js` 198–237 vs `npc.js` 40  
**Issue:** Live emit is documented at the site, not in the frozen block. Impl PR that first sends `weapon:'missile'` must edit the comment (contract §2.1).  
**Fix:** Already required. Not a Wave 75 src edit.

#### 💡 Suggestion: Boot pin for “unpicked Q1 ⇒ zero missile npcFire”

**Location:** contract §7 PR0/PR4  
**Issue:** Easy to skip if Q1 is picked in the same wave as PR1.  
**Fix:** Keep the pin even after Q1: count missile emits from traders/miners/Unknowables must stay 0.

### Verdict

**Approve for Wave 75 markdown (re-dispatch).** Brief §4.3 no longer allows omitted missile `target`. Hit-test law is 1716–1718, not the stale header. Do not implement until Q1/Q2. No `src/` in this worker.
