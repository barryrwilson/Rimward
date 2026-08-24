## Code Review: Wave 101 NPC turret vsNPC

### Summary
vsNPC turret rides the Wave 99 class gate and independent clock. vsPlayer emit still uses the literal `weapon: 'turret', target: 'player'`. Combat splits vsPlayer / live-ship / drop. WAVE99 and WAVE101 boot pins were all true. Probe printed PASS.

### What's done well
- `canNpcTurret` unchanged (Unknowable, `mayHuntPlayer`, `canSeat`)
- vsNPC emit requires phase `attack` and a live NPC (`object` + `state` + not destroyed)
- Shared `NPC_TURRET_LIVE_CAP = 4` counts all NPC turret bolts
- Wave 57 split: `bolt.vsPlayer = false` never calls `testPlayerHit`
- Toast helper untouched

### Findings

#### 🟡 Minor: WAVE99 continue is a drop tail
**Location:** `src/systems/combat.js` turret `npcFire`  
**Issue:** `if (e.target !== 'player') continue` sits after the live-ship spawn. It is the omit / destroyed / non-object drop. WAVE99 `explicitTarget` grep requires that exact string.  
**Fix:** Keep. Do not delete for style.  
**Justification:** Frozen WAVE99 pin. Behavior is drop, not a second vsPlayer aim.

#### 💡 Suggestion: Beautiful faction still class-gated
**Location:** `src/systems/npc.js` `canNpcTurret`  
**Issue:** A Beautiful heavy that already hunts can emit turret vsNPC. Owner line is **no grant**, not Unknowable-style never.  
**Fix:** None. Do not add a `beautiful` word in the gate slice (WAVE99 `noBeautifulWord`).

### Passed
- Telegraph and demand-hold stay weapons-cold (caller returns before `tryNpcTurret`)
- Seat 0 / civilian / Unknowable never emit vsNPC
- Cap 4 drops the 5th (shared vsPlayer+vsNPC)
- Digit 0 still shipyard; empty hub; no new glance
- No `state.js` WEAPONS fork
