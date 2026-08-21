# RIMWARD Owner decisions — Wave 82

| Field | Value |
|---|---|
| **Title** | Owner judgement calls that unblock fail-closed serials |
| **Author** | Wave 82 orchestrator (owner deputized 2026-08-21) |
| **Date** | 2026-08-21 |
| **Status** | Binding. Later briefs must not re-invent these numbers. |
| **Wave** | 82 |

The owner asked for judgement calls on pending Owner questions so development can continue. This file is the authored record. Design briefs that still said “proposed, needs owner” now point here.

Do not invent further UU, drop rates, or standing deltas without a new owner line in this file or a successor.

---

## Closed this wave

### TGT-05 cone pixel cap

**Decision:** `LOCK_CONE_PX = 12`.

Screen-space radius around the visible reticle pip, in CSS pixels. Use it **only** when no body disc contains the pip. Nearest unobscured body whose projected center lies inside that radius may lock. Do not use degrees. Do not copy `CONVERGE_DOT` 0.72.

Wave 82 implements remaining lock categories (`station` / `gate` / `pod` / `landmark`) **with** this cone.

### NPC missiles Q1 / Q2 / cadence

**Q1 who fires:** `pirate` + `ace` only. Not trader, miner, patrol, Unknowable, Beautiful-as-faction.

**Q2 warning:** one HUD toast on missile `npcFire` **and** a song branch. No parallel `commLine` for the same spawn. FORE/AFT stays hit-only.

**Cadence:** not a percent. One dart after the existing hunt telegraph, then cannon. NPC dart pool cap 4. `vsPlayer` only. Unknowables never fire or eat darts.

**Impl:** later serial. Wave 82 TGT-05 owns `combat.js` / `hud.js`. Do not land NPC darts in Wave 82.

### REP kill standing

**Decision:** `KILL_STANDING_DELTA = -5`.

Victim NPC faction only. Skip pirate / ace / independent / reserved. Witness `lastAttacker === 'player'`. Unknowables **do** write when `Object.hasOwn(FACTIONS, key)`.

Wave 82 sets the constant and lets the existing helper write.

### Destroy-Abomination Beautiful delta

**Decision:** `ABOMINATION_DESTROY_BEAUTIFUL_DELTA = +5`.

When the kill helper already runs (player last attacker, civilian/patrol role, victim faction written) **and** the destroyed hull is `grafted: true`, also add +5 to Beautiful standing (`Object.hasOwn`). If the victim faction **is** Beautiful, do not double-apply: write only the kill delta (−5). NPC Abomination spawns stay later.

### Spy expose

**Decision:** on accepted spy **deadline / dest-fail** (exposed lapse): target faction **−2**. Employer **0**. No pay.

Secret **success** stays employer +2, target 0.

**Impl:** later serial (`station.js` overlap with EXP archive). Wave 82 records the number only.

### War target standing

**Decision:** on war **success**: employer +2 (live) and target faction **−2**. Expire still writes nothing.

**Impl:** later serial (`station.js`). Wave 82 records the number only.

### Restitution UU / police leave

**Restitution:** `RESTITUTION_UU = 1200`. Dock of the offended faction. Two-step confirm. Sets that key to 0 if it was negative. Esc cancels. Beautiful graft cap may pull to −10 after.

**Police leave:** **defer**. Law zone 300 u stays the first-impl law beat.

**Impl:** later serial (`station.js`). Wave 82 records the number only.

### EXP data trade

| Item | Decision |
|---|---|
| Drop rate | `DATA_DROP_RATE = 0.20` on destroy/jettison of Assembly or Unknowables hulls (matching token) |
| Own UU | legal cube **400**; legal crystal **400** (Unknowables dock still waits) |
| Rival UU | **900** (Assembly pays 900 for crystals; later Unknowables dock would pay 900 for cubes) |
| Launder UU | **250** per lot at the live fixer (Veridian / Redmarch). Two-step confirm. Sets `source: 'legal'` |
| Unknowables system | **Wait** (Wave 42). Do not invent a dock |
| Archive hostile-rep | `standingRead(assembly) < 0` → no sale (yard precedent) |
| Data tint | **untinted steel** |

Wave 82 implements drop, Archive debit/credit, and launder.

### BIO graft / gift / pirate / frigate

| Item | Decision |
|---|---|
| Graft list price | `GRAFT_LIST_UU = 4000` on `shipyard.js` next to `YARD_LIST_UU`. Gilded desk debits on confirm. Refuse `credits` if short |
| Sworn gift | **defer** (rank 50, one living `light` row, id `hull_seed_gift`) |
| Pirate seed | **defer**. If a later wave ships it: rate **0.05**, hangar row not cargo |
| Living frigate buy | **omit**. NPC visual may keep a frigate GLB |
| BIO-03 path | **keep GLB + GPU**. No procedural Three.js ships |
| BIO-04 | **out** |
| Power ledger | **out** |

Wave 82 implements graft debit only.

### MSN-03 unique SKU grants

| Employer | Last-step grant |
|---|---|
| Freehold | seat `dart` via `writeMountedGear` when `canSeat`; else credits +2 only |
| Red Ledger | seat `auto` when `canSeat`; else credits +2 only |
| Veridian / Hollow | credits +2 only |

**Impl:** with the MSN-03 chains serial (later; `station.js`). Wave 82 records the SKUs.

---

## Wave 82 implementation split (disjoint write-sets)

1. TGT-05 lock cats + 12 px cone.
2. EXP drop + Archive UU + launder.
3. Kill delta −5 + Abomination +5 + graft 4000 UU.

Not in Wave 82 `src/`: NPC missiles, MSN-03 chains, spy expose write, war target write, restitution desk, BIO-03 bake, BIO-04, police hail, Unknowables dock, gift, pirate seed.
