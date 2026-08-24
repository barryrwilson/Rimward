# RIMWARD Owner decisions — Wave 101

| Field | Value |
|---|---|
| **Title** | Deputized NPC turret vs already-hostile NPC (TGT-04 leftover) |
| **Author** | Wave 101 (owner deputized 2026-08-23: pick, note, keep going) |
| **Date** | 2026-08-23 |
| **Status** | Binding. Owner may override in a successor file after playtest. |
| **Wave** | 101 |
| **Predecessor** | [`docs/OwnerDecisionsWave98.md`](OwnerDecisionsWave98.md) Q1/Q2; Wave 99 vsPlayer first impl; [`docs/OwnerDecisionsWave100.md`](OwnerDecisionsWave100.md) standing deputize |

Wave 99 shipped NPC turret **vsPlayer only**. Wave 98 Q2 left vs already-hostile NPC as later. Standing deputize (`docs/OwnerDecisionsWave100.md`): pick, note, keep going. Do not park.

This file is the authored record. Integrator freeze: [`out/w98/turrets/shared-contract.md`](../out/w98/turrets/shared-contract.md) still wins on HUD-01 empty hub, Digit 0/8/9, catalog reuse, cap 4, missing-target drop, Unknowable never, no chaff, no power ledger, no `state.js` fork. **This file wins** on Q2 vsNPC = **ON**. Pointer: [`docs/NpcTurretsDesign.md`](NpcTurretsDesign.md).

Do not invent UU, standing, or a fire percent. Do not widen `mayHuntPlayer`.

---

## Standing rule (copy)

When a brief fail-closes on a later slice that has no new owner numbers, **do not park the serial**.

1. Pick a playable default that honors already-closed HUD / Digit / persist law.
2. Write `docs/OwnerDecisionsWaveNN.md`.
3. Land the serial.
4. The owner may change the pick after playtest.

---

## Closed this wave (NPC turret vsNPC)

| # | Question | Decision |
|---|---|---|
| 1 | vs already-hostile NPC | **ON.** Same class gate as vsPlayer: `canSeat` turret (`heavy` / `ace` / `frigate`) + Unknowable never + civilians never + seat 0 never + Beautiful-as-faction no grant. Do **not** widen `mayHuntPlayer`. |
| 2 | vsNPC emit | Only when `ai.phase === 'attack'` and `ai.target` is a **live NPC** (`object` + `state` + not destroyed). Explicit `npcFire.target` = that live ship. Missing / non-object / `'player'`-omit path stays the vsPlayer branch. Missing turret target still **drops**. |
| 3 | vsPlayer path | **Unchanged.** `ai.target === 'player'` still emits `target: 'player'`. Keep the literal `weapon: 'turret', target: 'player'` in source. |
| 4 | Combat spawn | If `e.weapon === 'turret'` and `e.target === 'player'` → spawn at playerObj, `bolt.vsPlayer = true`. If `e.target` is a live ship with object → `spawnNpcShot(ship, 'turret', tgt.object)`, `bolt.vsPlayer = false`. Never `testPlayerHit` on vsNPC. Unknowable shooter still drops. |
| 5 | Toast | **No change.** Turret toast only when `target === 'player'` (`Incoming fire.`). Do not add a turret toast. Do not steal `Incoming dart.` Do not toast vsNPC. |
| 6 | Cadence / cap / catalog | Reuse `NPC_TURRET_INTERVAL`, `NPC_TURRET_LIVE_CAP = 4` (shared vsPlayer+vsNPC), `WEAPONS.turret`. No `state.js` write. No fire percent. No chaff. No power ledger. No new WORLD_FIELDS. No hangar write. Digit 0/8/9 untouched. |
| 7 | HUD-01 | Empty 80 px hub stays empty. No new glance class. FORE/AFT still hit-only on `playerHit`. |

Wave 98 Q1 stays closed (class gate). Wave 98 Q2 “later” is **replaced** by this ON pick. Do not reopen Q1.
