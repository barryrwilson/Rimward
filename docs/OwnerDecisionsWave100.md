# RIMWARD Owner decisions — Wave 100

| Field | Value |
|---|---|
| **Title** | Deputized TGT-03 subsystem gates + standing pick-and-continue |
| **Author** | Wave 100 (owner deputized 2026-08-23: pick, note, keep going) |
| **Date** | 2026-08-23 |
| **Status** | Binding. Owner may override in a successor file after playtest. |
| **Wave** | 100 |
| **Predecessor** | [`docs/Tgt03SubsystemDesign.md`](Tgt03SubsystemDesign.md) / [`out/w99/subsys/shared-contract.md`](../out/w99/subsys/shared-contract.md) |

The owner asked for judgement calls on the six Wave 99 fail-closed subsystem questions, and for that deputize rule to become the default. This file is the authored record. Later briefs must not re-invent these gates.

Integrator freeze: [`out/w99/subsys/shared-contract.md`](../out/w99/subsys/shared-contract.md) still wins on HUD-01 empty hub, Digit 0/8/9, KeyT/KeyV, cone 12, persist, and `innerHTML`. **This file wins** on the six named questions and on the standing deputize rule. Pointer: [`docs/Tgt03SubsystemDesign.md`](Tgt03SubsystemDesign.md).

Do not invent UU or standing. No targeting-computer SKU. No extra Digit.

---

## Standing rule (later waves)

When a brief fail-closes on missing owner numbers (who fires, UU, Digit, TRACKED key, peel skip, SKU), **do not park the serial**.

1. Pick a playable default that honors already-closed HUD / Digit / persist law.
2. Write `docs/OwnerDecisionsWaveNN.md` (or a successor).
3. Land the serial.
4. The owner may change the pick after playtest.

Do not impersonate prices that already exist in live `state.js`. Copy live numbers. Do not mint a new SKU to paper over a missing picker.

---

## Closed this wave (TGT-03 subsystem)

Live taxonomy stays **screen / shell / engine / hull**. No FTL rooms. Geometry peel stays until shields are down.

| # | Question | Decision |
|---|---|---|
| 1 | Selectable parts | **engine only**. Screen / shell / hull are not selectable. |
| 2 | New TRACKED key | **Yes: KeyK**. Not T, V, M, G, L, P, O, N, H, C, X. |
| 3 | Extra Digit | **No.** Digit 0/8/9 and weapon 1–5 stay. |
| 4 | New SKU / UU | **No.** Core, not a buy. No hangar flag. |
| 5 | Lock ENGINE bar | **Yes.** On `.rw-combat-target` next to SCREEN / SHELL / hull. Not on the 80 px hub. |
| 6 | Skip shield peel | **No.** Screen then shell still absorb first. |

**Control:** KeyK toggles `ctx.targets.part` `'engine' | null` on a **live ship lock** only. Rocks / station / gate / pod / landmark clear the part. Live only. No `WORLD_FIELDS` key.

**Damage (after shields are both 0):** if `part === 'engine'` and the lock is that ship and the shot is **from the player** and `engineOut` is false, remaining damage goes to **engine** (`engineMult`; × `aftEngineMult` only when facet is aft). Hull on that hit is skipped. After `engineOut`, later hits peel hull as live. NPC shots never read `targets.part`.

Unselected shots keep live geometry: aft pressures engine **and** hull; fore hull only.

HUD-01 empty 80 px hub stays empty. No lock box. No new toast. FORE/AFT stays hit-only. `Incoming fire.` / `Incoming dart.` stay.

`lockKind` is still object kinds only. Do not add `'engine'` as a lockKind.
