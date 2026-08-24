# WAVE99 TGT-03 subsystem targeting verify recheck

**Domain:** data (static). No Vite / CDP. No `src/` edits by this verifier.  
**Graph:** `codex/workflow-software-delivery` (`r-mt5z2uul-297fd84c`).  
**Date:** 2026-08-23.

## Status

CLEAN

## What I tested

1. `git status --short -- src scripts docs/Tgt03SubsystemDesign.md out/w99/subsys`
2. Contract vs brief freeze (hub, persist, Digit 0/8/9, KeyT/KeyV, cone 12, fail-closed, no UU)
3. Inventory live-line spot-check (working tree)
4. No `docs/OwnerDecisionsWave99.md`
5. Serial PR plan named only; not scheduled into `src/` this wave
6. Pack file set exists; sibling write-set not claimed

## Write-set / git

Subsystem pack (untracked, markdown only):

- `docs/Tgt03SubsystemDesign.md`
- `out/w99/subsys/` (inventory, contract, security, code-review, ui-audit, `verify/notes.md`)

`src/` and `scripts/` are dirty. Those files belong to other Wave 99 workers (hud, contacts-gate, npc, combat, ctx, toast, boot-test, plus other parallel waves). This pack does not add a part picker, `ctx.targets.part`, or subsystem Digit.

Grep `subsystem` in `src/**/*.js`: one `title.js` comment (save banks). Matches inventory.

No Vite started.

## Contract vs brief

| Freeze | Contract | Brief | Result |
|---|---|---|---|
| Empty 80 px hub | §0.2, §6 | Honor + overview + §1 | Match |
| No persist key | §0.5 | Goals 5; merge table | Match. No new `WORLD_FIELDS` / `localStorage` |
| Digit 0/8/9 freeze | §0.6 | Overview + Digit table | Match. 0 = shipyard; dock 8/9 = launch/epics; outfit 8/9 = papers |
| KeyT / KeyV stay | §0.7 | Honor | Match |
| Cone 12 | §0.7 | Honor; `LOCK_CONE_PX = 12` | Match |
| Fail-closed if owner numbers missing | §0.14, §8 PR3 | Overview + PR3 + Q1–Q5 | Match. No damage retarget |
| No invented UU | §0.10; Q4 default no | Open Q3 default no; no prices | Match |
| Serial named later, not this wave | §0.1, §8 | Serial PR plan | Match. Name: **TGT-03 remaining subsystem targeting serial** |
| No OwnerDecisionsWave99 impersonation | §0.12 | Non-goals | Match. File absent. Pack tells worker not to write it |

Merge law: brief points at `out/w99/subsys/shared-contract.md`. Contract wins.

## Inventory cite spot-check (working tree)

Mandatory:

| Claim | Live | Result |
|---|---|---|
| `applyHit` peel screen→shell→aft engine→hull | `src/game/state.js` 209–231 | Exact |
| Hub 80 px | `src/ui/hud.css` 184–191 `width/height: 80px` | Exact |
| Hub clamp | `src/systems/hud.js` 1196 `cx - 44` (inventory/code-review said 1194) | Behavior live; line +2 vs pack |
| Digit 0 shipyard | `src/systems/station.js` 5920–5922 + `DOCK_KEY_SERVICES` 186 last = `shipyard` | Exact |
| `LOCK_CONE_PX` | `src/game/reticle-aim.js` 15 `= 12`; use 321 | Exact |

Other pack cites that still match:

- `ctx.targets` 191–195 — `current` + `reticleScreen` only; no part field
- `DEFENSE` `state.js` 150–161; disruptor multipliers 119
- Target rail SCREEN/SHELL/hull `hud.js` 846–855; name `textContent` 2024
- FORE/AFT words `hud.js` 326–351; `playerHit` 0.4 s flash 1133–1135
- HUD `hullKind` read 79–85 / 1689–1700; no write (`hullKind =` absent in `hud.js`)
- `innerHTML` in `hud.js`: 0 hits; `el()` uses `textContent` 242–247
- KeyT 265–266 / KeyV 280–281; TRACKED 39–46
- `allowedLockKind` station/gate/pod/landmark `reticle-aim.js` 279–310; `controls.js` 90–93
- Digit 8/9 dock via array 5918–5926; papers `armOutfitPapers` 1700–1713, bind 5983–5986
- Repair all four `station.js` 196, 4353–4371, 5974–5975
- `WORLD_FIELDS` `save.js` 76–100 — no part key; autosave `rimward-save-v1` 66; settings `rimward-settings-v1` `settings.js` 23
- `Incoming dart.` / `Incoming fire.` `npc-fire-toast.js` 7–8
- Chart Digit 9 standing **copy** `galaxychart.js` 29, 389–395 (not a dock bind)
- Hangar vitals copy `hangar.js` 665–667
- `jump.js` clear is `src/game/jump.js` 87 (inventory wrote `jump.js 87`)

Citation drift (sibling dirty `combat.js` / `npc.js`, not a freeze lie):

| Pack cite | Live working-tree locus |
|---|---|
| NPC facet `combat.js` 1619–1625 | Facet comment + `'aft'` at 1635–1638. 1619–1625 is ellipse `rEff` math |
| Player `fromAft` `combat.js` 1679–1684 | 1695–1700 |
| Mining facet `combat.js` 1448–1451 | 1464–1467 (`1448–1457` is beam opacity) |
| Impact `'fore'` 1735, 1755, 1763 | 1751, 1771, 1779 |
| Guns ignore `lockKind` 1123–1216 | Muzzle skip `!t.lockKind` 1129; seeker `if (!t \|\| t.lockKind) return null` 1221 |
| `npc.js` 2325–2327 drop lock | 2359–2361 |

Described peel / facet / no-part-field behavior still exists. Later impl must grep, not paste stale combat line numbers.

## OwnerDecisions / serial

- `docs/OwnerDecisionsWave99.md` does not exist.
- Pack forbids writing it.
- Serial name is **TGT-03 remaining subsystem targeting serial**.
- Wave 99 text: markdown only; do not land PR1–PR4 in `src/` this wave.

## Bugs found

None that break the freeze. Line-number drift on `combat.js` / hub clamp is sibling `src/` churn, not a contract/brief conflict.

## Environmental issues

- Working tree has many dirty `src/` + `scripts/` files from other Wave 99 workers. Do not revert them.
- Sibling packs also untracked/dirty: `docs/Tgt03RadarDesign.md`, `docs/Tgt03AwarenessDesign.md`, `docs/NpcTurretsDesign.md`, `out/w99/radar/`, `out/w99/turrets/`, `PROGRESS.md`, wishlist. Subsystem pack does not claim those paths.
- No dev server started.

## Evidence

- Pack files present under `docs/Tgt03SubsystemDesign.md` and `out/w99/subsys/**`.
- `git status` write-set: `?? docs/Tgt03SubsystemDesign.md`, `?? out/w99/subsys/`.
- Live: `state.js` 209–231 peel; `hud.css` 184–191 80 px; `station.js` 5920–5922 Digit 0; `reticle-aim.js` 15 cone 12; `ctx.js` 191–195 no part field.
