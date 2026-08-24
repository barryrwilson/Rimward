# Current NPC turrets inventory (Wave 99 re-grep)

**Wave:** 99 first impl. Code wins.  
**Merge law:** [`../../w98/turrets/shared-contract.md`](../../w98/turrets/shared-contract.md) still wins. This file does not rewrite Wave 98 law.

Re-grep 2026-08-23 after PR1–PR3.

| Surface | Now | Cite |
|---|---|---|
| Q1 gate | `canNpcTurret`: `canSeat(classKey, 'turret')` and `mayHuntPlayer`. Unknowable never. | `npc.js` `canNpcTurret` |
| Cadence | `NPC_TURRET_INTERVAL = 1 / (WEAPONS.turret.rof * 0.5)`. `ai.turretFireAt` independent of `fireAt`. | `npc.js` 92, 1120–1131 |
| Emit | `npcFire { weapon: 'turret', target: 'player' }` after cannon/dart in hunt and duel. Telegraph and demand stay cold. | `npc.js` 1581, 1958 |
| `mayHuntPlayer` | Unchanged. No turret token in the hunt function. | `npc.js` 1083–1093 |
| Combat turret branch | Missing `target` drops. vsPlayer only. Unknowable shooter skip. | `combat.js` 1801–1808 |
| Cannon omit | Still `tgt == null` → player. Turret never takes this path. | `combat.js` 1810–1812 |
| NPC live cap | `NPC_TURRET_LIVE_CAP = 4`, count `fromPlayer === false && wkey === 'turret'`. | `combat.js` 176, 1258–1264, 1316 |
| Player turret cap | `TURRET_LIVE_CAP = 2`, count `fromPlayer` true only. | `combat.js` 175, 1250–1256 |
| Spawn | `spawnNpcShot('turret')` 64-pool energy. No `addHeat`. No hangar. | `combat.js` 1311–1335 |
| Hit split | Unchanged Wave 57. NPC turret vsPlayer sets `bolt.vsPlayer = true` → `testPlayerHit`. | `combat.js` 1806–1807, 1862–1865 |
| Toast | `weapon === 'turret'` and `target === 'player'` → `Incoming fire.` same `FIRE_TOAST_GAP` as cannon. | `npc-fire-toast.js` |
| ctx vocab | `'cannon'\|'missile'\|'turret'` | `ctx.js` npcFire comment |
| HUD | No new `#hud` child. 80 px hub comment stays. WPN 1–5. | `hud.js` (unread by this PR) |
| Digit 0/8/9 | Untouched. | `station.js` |
| Persist | No new key. NPC fire does not write `ctx.world.turret`. | probe `combat.noHangarWrite` |

Live emit: hostile heavy/ace/frigate vs player after telegraph. Seat 0 / civilian / Unknowable zero turret emit (WAVE99 boot pins).
