# Current NPC turrets inventory (Wave 101 re-grep)

**Wave:** 101 vs already-hostile NPC. Code wins.  
**Merge law:** [`../../w98/turrets/shared-contract.md`](../../w98/turrets/shared-contract.md) still wins on HUD / Digit / catalog.  
**Q2 deputize:** [`../../../docs/OwnerDecisionsWave101.md`](../../../docs/OwnerDecisionsWave101.md).

Re-grep 2026-08-23 after vsNPC emit + spawn.

| Surface | Now | Cite |
|---|---|---|
| Q1 gate | `canNpcTurret`: `canSeat(classKey, 'turret')` and `mayHuntPlayer`. Unknowable never. Unchanged. | `npc.js` `canNpcTurret` |
| vsNPC emit | `tryNpcTurret`: phase `attack`; `ai.target === 'player'` emits literal `target: 'player'`; live NPC (`object`+`state`+not destroyed) emits that ship. | `npc.js` `tryNpcTurret` |
| `mayHuntPlayer` | Unchanged. No turret token. | `npc.js` `mayHuntPlayer` |
| Combat turret branch | `target === 'player'` → playerObj, `vsPlayer = true`. Live ship → `spawnNpcShot(..., tgt.object)`, `vsPlayer = false`. Missing / destroyed / non-object → drop (`if (e.target !== 'player') continue`). Unknowable shooter skip. | `combat.js` turret `npcFire` |
| NPC live cap | `NPC_TURRET_LIVE_CAP = 4`, count `fromPlayer === false && wkey === 'turret'` (shared vsPlayer+vsNPC). | `combat.js` |
| Hit split | Unchanged Wave 57. vsNPC `vsPlayer = false` → `testNpcHits` only. | `combat.js` projectile loop |
| Toast | Unchanged. Turret vsNPC (`target !== 'player'`) → null. | `npc-fire-toast.js` (not edited) |
| HUD / Digit 0/8/9 | Untouched. | `hud.js` / `station.js` |
| Persist | No new key. No hangar write. | spawn path |
