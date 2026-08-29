# RIMWARD RW-005 death-loss policy

| Field | Value |
|---|---|
| **Title** | RIMWARD RW-005 death-loss policy |
| **Issue** | [RW-005 / GitHub #6](https://github.com/barryrwilson/Rimward/issues/6) |
| **Author** | RW-005 (owner choice 1) |
| **Date** | 2026-08-28 |
| **Status** | **Accepted.** Owner chose option 1 on 2026-08-28. |
| **Accepted** | 2026-08-28 (owner) |
| **Honor** | HUD-01 empty hub. Aim-glass gauges stay off. Kit mutate omit. Digit 0 shipyard. `state.js` READ-ONLY. No new frozen events. No permadeath. No save deletion. No UU penalty. Labels `textContent`. Fail closed: never throw from death overlay or recover. |

**This stamp authorizes honest copy only.** Restore math stays live.

---

## Owner decision (GitHub #6)

**Keep zero-cost recovery, and make the copy honest.**

Rationale: live death already restores the last autosave (or a Freehold starter if no save exists) with no UU charge. The 2026-08-25 playtest found 350 UU and a free hull restore. The wishlist asked if that rule is intended. It did not authorize a penalty. Option 1 matches live code.

Out of scope: insurance charge, cargo strip, hull fee, permadeath, save deletion.

---

## Live restore (code wins)

| Path | What the player keeps | Cite |
|---|---|---|
| Autosave exists | Wholesale restore of the last `rimward-save-v1` snapshot (credits, cargo, hangar, hull, system). Bio mood forced `anxious`. | `save.js` `recover()` |
| No autosave | `freshStart`: living starter hull at Freehold Drift; cargo cleared; hangar rebuilt; **credits stay**; bio wounded. | `save.js` `freshStart()` |

Neither path subtracts UU. Insufficient credits cannot soft-lock this policy. Repeat deaths restore the same save again.

---

## Copy

Title stays `SHIP LOST` (the hull went down). Body text must not imply the dark kept UU, cargo, or the hull.

| State | Line | Hint |
|---|---|---|
| Autosave | `No UU charge. Credits, cargo, and hull return as they were at your last berth.` | `Returning to your last berth… (Enter to skip)` |
| No save | `No berth record. Credits stay. A starter hull waits at Freehold Drift.` | `Returning to Freehold Drift… (Enter to skip)` |

Comm line `She limped home.` stays. Overlay uses `textContent`. Color is not the only cue.

---

## Verification

- Source pins: death strings; `recover` does not write `credits`.
- WAVE5 death tenderness still restores mystery/bio; credits after recover match the snapshot.
- Live browser: emit `playerDestroyed` (or die); overlay states no UU charge; Enter restores; credits unchanged.
