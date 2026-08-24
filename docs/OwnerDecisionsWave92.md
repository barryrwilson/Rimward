# RIMWARD Owner decisions — Wave 92

| Field | Value |
|---|---|
| **Title** | Owner judgement calls that unblock BIO-04 catalog numbers |
| **Author** | Wave 92 BIO-04 worker (owner deputized catalog numbers) |
| **Date** | 2026-08-22 |
| **Status** | Binding. Later briefs must not re-invent these numbers. |
| **Wave** | 92 |
| **Predecessor** | [`docs/OwnerDecisionsWave82.md`](OwnerDecisionsWave82.md) |

The owner deputized catalog numbers for this wave (Wave 82 style). This file is the authored record. Do not pick different numbers.

---

## Closed this wave

### BIO-04 `WEAPONS.psionic`

**Decision:** ship this row in `src/game/state.js`.

```
psionic: {
  name: 'Psionic bolt',
  damage: 12,
  rof: 3,
  speed: 520,
  range: 420,
  heatPerShot: 8,
  family: 'psionic',
}
```

Not a seeker (`turn` omitted). Not hitscan. Not `beam: true`. Heat only on the live `HEAT` pool.

### BIO-04 `FAMILY_COLORS.psionic`

**Decision:** `FAMILY_COLORS.psionic = 0xff6ad5` in `src/systems/combat.js`.

Must not equal energy `0x53f2ff`, disruptor `0xc86bff`, mining `0x51ff9e`, or missile `0xff8a2a`.

### BIO-01 pirate seed rate

**Decision:** copy Wave 82 `0.05` into `PIRATE_SEED_DROP_RATE` on `src/game/bio-seed.js`. Gift `hull_seed_gift` ships this wave (Wave 82 defer was Wave 82 only).

### BIO-02 train debit

**Decision:** reuse live `yardPrice('heavy', beautifulRep)` via `trainListPrice`. Do not invent a new integer. Success writes no standing.
