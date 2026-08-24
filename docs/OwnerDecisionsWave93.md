# RIMWARD Owner decisions — Wave 93

| Field | Value |
|---|---|
| **Title** | Owner judgement calls that close remaining parked BIO / SHP / REP / Unknowables questions |
| **Author** | Wave 93 orchestrator (owner deputized 2026-08-23) |
| **Date** | 2026-08-23 |
| **Status** | Binding. Later briefs must not re-invent these numbers. Owner may override in a successor file. |
| **Wave** | 93 |
| **Predecessor** | [`docs/OwnerDecisionsWave92.md`](OwnerDecisionsWave92.md) |

The owner deputized judgement calls on the parked Wave 92 OPEN items (Wave 82 style). This file is the authored record. Do not pick different numbers.

Wave 93 is **markdown only**. Do not land `src/` against these lines until a later serial.

Do not invent further UU, drop rates, or standing deltas without a new owner line in this file or a successor.

---

## Closed this wave

### Police leave

**Decision:** ship a leave order in a later serial. Do not keep this item on **defer**.

| Item | Decision |
|---|---|
| Who | Local-system-faction `patrol` NPCs only. Not pirate, ace, trader, miner, Unknowable, Beautiful-as-faction |
| When | `standingRead(systemFaction) < 0` **and** `standingRead(systemFaction) > −10` |
| Range | existing law zone **300 u** |
| Hunt band | live hunt at **≤ −10** is unchanged. Skip the leave order in that band |
| Channel | one HUD toast **and** one `commLine`. No hail card. No song sting |
| Copy | `Leave this space.` |
| Repeat | once per `systemLoaded` visit |
| Persist | **none**. No `wanted`. No `crimeScore`. No new `WORLD_FIELDS` key |
| Restitution | still Wave 82 `RESTITUTION_UU = 1200` |

If the player is already in combat with that patrol, skip the leave order.

**Impl:** later serial (`npc.js` / `hud.js`). Wave 93 records the numbers only.

### Power ledger / aim-glass gauge

**Decision:** **out**. Close the wait.

Heat stays the only fire resource (`HEAT.max` 100 + `heatPerShot`). No power pool. No psi capacitor. No class power field. Mass stays seat-count (Wave 68).

HUD-01 empty aim glass stands. No incoming gauge. No lock box. No power pip on the glass.

A later owner file may reopen this. Until then, workers must not wait on a triad.

### Living frigate buy

**Decision:** **keep omit**. Close the wait.

Beautiful `LIVING_STOCK` stays `light` / `cutter` / `heavy`. Unknowables stock stays `light`. NPC Beautiful **may** keep a frigate GLB. Do not append `frigate` / `ace` / `freighter` to living buy lists.

### Seed commodity SKU

**Decision:** **omit**. Close the wait.

No `COMMODITIES` seed. No cargo `livingRock` seed. Purchase path is the Beautiful yard living `light` row (list **8000 UU**). Gift stays People `hull_seed_gift` at Sworn ≥ 50. Pirate stays hangar row at **0.05**.

Do not open a dedicated `state.js` SKU PR for this.

### BIO-02 train to frigate / ace / freighter

**Frigate evolve:** **yes**, owned living hull only.

| Item | Decision |
|---|---|
| From | living `heavy` only (`hullKind: 'living'`, Beautiful-care Hangar) |
| Dest | `frigate` |
| Buy SKU | still **omit** (`LIVING_STOCK` unchanged) |
| Debit | `yardPrice('frigate', beautifulRep)` (list **80000 UU**, Trusted **25** rank discount) |
| Standing | success writes **none** |
| Hostile Beautiful | Hangar paints `No sale.` Same as heavy train |
| Short credits | keep Offer; Confirm refuses |
| Grafted built | refuse |
| Unknowables hull | refuse |
| Ace dest | **no** |
| Freighter dest | **no** |
| Career forms | still **out** |

Confirm copy: `heavy → frigate`. Envelope same as Wave 92 heavy train (`burn` / `cruise`, cargo keep, no `switchTo`). Digit 0 stays Shipyard. Hangar pane only.

**Impl:** later serial after Wave 92 heavy train. Wave 93 records the numbers only.

### Unknowables live site

**Presence:** later serials **may** land [`docs/UnknowablesDockDesign.md`](UnknowablesDockDesign.md) PR1–PR4 against the defaults below.

**Dock:** **keep Wait** (Wave 82). Close the wait-for-owner. Do not un-wait origin Archive, a non-placeholder station, market, contacts, or a generated `SYSTEMS` faction flip.

| Item | Decision |
|---|---|
| Landmark id | `th_veil` |
| Name | `The Veil` |
| Host | `hush` |
| Kind | `anomaly` |
| Host faction | stays `hollow` |
| Visitor Unknowables hulls | **off** |
| Unknowables epic | **omit** |
| New hush clue | **no**. Authored clue count stays **6** |
| `DETAIL_STATIONS.unknowables` | still absent |
| EXP numbers | copy Wave 82: drop **0.20**, own **400**, rival **900**, launder **250**. Cubes at 900 wait for a later dock |

### BIO-03 look / bake

**Decision:** later serials **may** land [`docs/Bio03ClassLookDesign.md`](Bio03ClassLookDesign.md) look + bake. Path stays **GLB + GPU**. No procedural Three.js ships. No `makeLivingHull` on NPCs. Fail closed: keep the Wave 8 GLB for a class that misses the bar.

No new catalog integer.

---

## Wave 93 implementation split

This wave writes `docs/OwnerDecisionsWave93.md` and pointer lines only.

Not in Wave 93 `src/`: police leave, frigate evolve, Unknowables presence, BIO-03 bake.

Named later in Wave 93: power ledger, living-frigate buy, seed commodity, Unknowables dock, ace/freighter train. **Superseded by [`docs/OwnerDecisionsWave94.md`](OwnerDecisionsWave94.md)** (owner rejected the parks). Aim-glass gauge stays empty. Unknowables epic still omit.
