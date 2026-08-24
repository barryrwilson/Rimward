# RIMWARD Owner decisions — Wave 98

| Field | Value |
|---|---|
| **Title** | Owner judgement calls that close NPC turret Q1 / Q2 |
| **Author** | Wave 98 orchestrator (owner deputized 2026-08-23) |
| **Date** | 2026-08-23 |
| **Status** | Binding. Later briefs must not re-invent these gates. Owner may override in a successor file. |
| **Wave** | 98 |
| **Predecessor** | [`docs/OwnerDecisionsWave97.md`](OwnerDecisionsWave97.md) |

The owner deputized judgement calls on NPC turret Q1 / Q2 that Wave 97 left unpicked (Wave 93 / Wave 97 BIO-05 style). This file is the authored record. Do not pick different gates.

Wave 98 is **markdown only**. Do not land `src/` against these lines in this wave. Wave 98 does **not** emit turret bolts. A later serial may land turret `npcFire`. Until that serial, live `src/` still has zero turret `npcFire`. That is correct.

Do not invent UU, standing deltas, or a fire percent without a new owner line in this file or a successor.

Player `auto` stays **closed** (Wave 68). NPC missiles Q1 / Q2 stay **closed** (pirate+ace, `Incoming dart.`). Do not reopen them.

Integrator freeze: [`out/w98/turrets/shared-contract.md`](../out/w98/turrets/shared-contract.md). If this file and that contract conflict, the **contract wins**. Pointer: [`docs/NpcTurretsDesign.md`](NpcTurretsDesign.md). Predecessor pack: [`out/w97/turrets/shared-contract.md`](../out/w97/turrets/shared-contract.md).

---

## Closed this wave

### Q1 — Who fires NPC turret?

**Decision:** class-gated `heavy` / `ace` / `frigate` **and** already-hostile (AI-04 `mayHuntPlayer`).

Not trader. Not miner. Not cutter-pirate. Not Unknowable. Not Beautiful-as-faction. Seat 0 still **never**.

Wave 97 default-off (**nobody**) is **replaced** by this named gate for a later serial. This wave does not emit.

| Item | Decision |
|---|---|
| Class gate | `heavy` / `ace` / `frigate` only (`MOUNT_TABLE.turret` as shipped) |
| Hostility | already-hostile: live `mayHuntPlayer` |
| `trader` / `miner` | **never** |
| cutter `pirate` | **never** (seat 0). Do not gift a turret on a cutter |
| Unknowable any | **never** emit. Never damage (beam-only) |
| Beautiful-as-faction | **no grant** |
| Unknown `classKey` | `light` (seat 0) → **never** |
| Hunt widen | **no**. Do not change `mayHuntPlayer` |

**Impl:** none in Wave 98. Later serial PR1 honours this gate.

### Q2 — vsPlayer vs vsNPC?

**Decision:** first slice **vsPlayer only**. Explicit `target: 'player'`. Missing target **drops**. vs already-hostile NPC stays later.

| Item | Decision |
|---|---|
| First slice | `target: 'player'` only |
| Missing `target` | **drop**. Do not copy ace cannon omit |
| vs already-hostile NPC | **later**. Not this slice |
| Wave 57 split | NPC-vs-player `testPlayerHit` only. NPC-vs-NPC never `testPlayerHit` |

**Impl:** none in Wave 98. Later serial PR1 sets `target` on emit. Later serial PR2 drops a missing turret target.

### Cadence / catalog / HUD (copy; do not invent)

| Item | Decision |
|---|---|
| Fire percent | **none**. Do not invent a dice |
| Cadence | later: independent clock. Named pin: **0.5×** player turret ROF (`1 / (WEAPONS.turret.rof * 0.5)`). Not a live percent. Unset clock in live `src/` → no turret emit (correct until serial) |
| Catalog | reuse `WEAPONS.turret` as shipped. No `state.js` fork. No new damage / ROF numbers |
| Player `auto` | stays. Digit 9 papers. Hangar `turret` player-only |
| NPC live cap | **separate** from player `TURRET_LIVE_CAP` (2). Exhausted → **drop**. Proposed pin (copy Wave 97): global **4** live NPC turret bolts (`fromPlayer === false && wkey === 'turret'`) |
| Turret toast | **none**. Do not steal `Incoming dart.` |
| Aim-glass gauge / lock box / pip | **none**. HUD-01 empty 80 px hub |
| FORE / AFT | `playerHit` hit-only |
| Song | reuse cannon bark. Do not route to `npcFireMissile` |
| TGT-03 `Incoming fire.` | sibling Wave 98 TGT-03 worker. If a later turret emit is vsPlayer cannon-family energy, that law applies automatically. **Do not design that toast here** |
| Telegraph | ≥ 3 s before first shot stays |
| Demand-hold | weapons-cold stays |
| Digit 0 / 8 / 9 | player-only. No hangar NPC rack key |
| Persist | no new `WORLD_FIELDS`. No new `localStorage` |
| Chaff / power ledger | **out** |
| `innerHTML` | **forbidden**. `textContent` / `h()` / `el()` |
| UU / standing | **none invented** |

NPC missiles Q1 / Q2 stay closed (pirate+ace, toast `Incoming dart.`).

---

## Wave 98 implementation split

This wave writes `docs/OwnerDecisionsWave98.md`, a NpcTurretsDesign status bump, and `out/w98/turrets/**` scratch only.

Not in Wave 98 `src/`: turret `npcFire`, spawn, cap, pins.

| PR | Wave 98 |
|---|---|
| **PR0 catalog** | **skipped**. Reuse `WEAPONS.turret`. No fork |
| **PR1 gate + emit** | **later serial**. Not scheduled into `src/` here |
| **PR2 spawn + cap** | **later serial**. Not scheduled into `src/` here |
| **PR3 pins** | **later serial**. Not scheduled into `src/` here |

Wave 98 does not schedule these into `src/`. Q1 / Q2 are **closed**. A later serial may land PR1 → PR2 → PR3 against [`out/w98/turrets/shared-contract.md`](../out/w98/turrets/shared-contract.md).
