# PHY-04 Wave 108 leftover verify notes

Verifier: markdown only. No `src/` edit. No Vite. No Chrome. Did not stop 5173/9222.

Graph: `graph_resolve` returned `blocked_ambiguous` (Word / Sheets / Slides). Owner said `proceed_unmodeled`. No `graph_propose`.

Census date: 2026-08-24. Code wins.

---

## 1. Live lookahead (inventory vs `src/`)

| Claim | Cite | Live | Verdict |
|---|---|---|---|
| `AVOID_LOOKAHEAD` 40, `AVOID_GAIN` 1.4 | `physics.js` 19–20 | same | Match |
| PHY table 1–23; do not copy onto `state.js` | `physics.js` 4–5, 6–23 | comment + `Object.freeze` | Match |
| Kernel pins 40 / 1.4 | `out/phy-verify/kernel-pins.mjs` 34–35 | same | Match |
| One heading probe | `npc.js` 618–621 | `pos + fwd * look` | Match |
| No second sample | inventory §12 | no `AVOID_LOOKAHEAD / 2`; no NPC `sphereChordHit` | Match |
| `applyAvoidBias` 608–658 | export | 608–658 | Match |
| Module comments 57–60, 603–607 | PHY-02 + bias | 59–60, 603–606 | Match |
| `skipAvoidBody` 424–434 | player self + AP gate skip; NPC does not skip station/gate | 424–434 | Match |
| `stationKeepOutHits` hull + probe + XZ | 536–562 | fn 537–561 | Match |
| `gateProbeHits` torus, bore empty | 471–487 | 471–487 | Match |
| `appendSunBody` heat radius | 660–682; `r = sunR0 * SUN_HEAT_MULT` at 677 | same | Match |
| `steerLive` uses bias iff `_phyOn` | 748–754 | 748–754 | Match |
| Collect once per `initNpc` update | 2261–2267 | 2261–2267 | Match |
| Bounce when `_phyOn` | 2304, 2337 | disabled 2304; other modes 2337 | Drift is 2337, not 2304. Meaning still: bounce on. |
| Fail closed missing data | dest / live aim; never `speed = 0` | `applyAvoidBias` copies dest then returns | Match |
| `collectBodies` 345–455 | station, gates, hub lantern, rocks, ships, player; no sun; no `axis` | 345–455 | Match |
| `torusOverlap` axis = −position | `collision.js` 102–124 | `ax = -gx` | Match |
| `resolveMover` two passes, not CCD | 457–550 | 457–550 | Match |
| Player bounce, sun stripped, no lookahead | `ship.js` 904–936 | integrate 901–903; bounce 905–938; sun drop 908–915 | Cite starts one line early. No `applyAvoidBias` in `ship.js`. |
| AP dummy + `applyAvoidBias` after `planApPath` | `autopilot.js` 47–54, 247–275 | dummy 47–54; collect 247; bias 275 | Match |
| AP keep-out skip gate/player/ship/asteroid | `ap-path.js` 41–43 | 41–43 | Match |
| Holds / pad heal / patrol pad | `traffic-feel.js` 14, 71–107; `world.js` 98–102, 374–381, 398–399, 702–726, 899 | same | Match |
| Digit 0/8/9 | `station.js` 188, 6041–6046, 1633–1634 | 188 last = shipyard; Digit 0 6041–6043; Digit 8 i=7 launch; Digit 9 i=8 epics; outfitting comment 1633–1634 (papers 1680, 1710) | Match. Papers cite is the comment. |
| Hub 80 px + RANGE | `hud.css` 184–193; `src/systems/hud.js` 709–712 | same | Match. Path is `src/systems/hud.js`, not `src/ui/hud.js`. |
| Hull strike / STAR HEAT | `hud.js` 587–593 | 587–593 | Match |
| `WORLD_FIELDS` no avoid | `save.js` 76–101; key `rimward-save-v1` 66 | same | Match |
| `innerHTML` in `npc.js` | none | grep 0 | Match |
| Cruise vs 40 u | `state.js` SHIP_CLASSES | ace 135 … frigate 22 | Match |
| Laterals blend, not nearest | inventory §8 vs comment 603 “nearest” | one normalize of summed `_v2` | Inventory is honest. Comment still says nearest. |

No meaning-changing stale inventory line vs live PHY. Small cite nits only (bounce drift line; `ship.js` 904 vs 905).

---

## 2. Brief ≡ contract (required freeze)

| Freeze | Brief | Contract | Result |
|---|---|---|---|
| Digit 0/8/9 | no steal; first serial PR1 must not steal | §0.3, §3 | Match |
| Hub | no avoid pip; 80 px; RANGE TGT-01 | §0.2 | Match |
| `state.js` | READ-ONLY; no PHY keys; no UU | §0.5 | Match |
| Persist | no new `WORLD_FIELDS`; live steering | §0.6 | Match |
| Navmesh | forbidden | §0.15 | Match |
| Fail-closed live bias | live 40 u; never freeze hull | §0.16, §2 | **Text match.** Mermaid in brief §2 **does not**. |

Serial PR plan is named only (PR1–PR4). Wave 108 does not land JS. First remaining serial is **PR1**. PR1 must not steal Digit 0/8/9. PR1 must not write `state.js`.

Player FLT stays out. Inventory proved no player leftover (`ship.js` has no `applyAvoidBias`). Leftover is NPC.

---

## 3. `src/` write-set

`git status -- src`:

- `M src/systems/ship.js` — BIO-08 gait (CPU swim), not avoid
- `M src/systems/ship-assets.js` — same
- `?? src/game/living-gait.js` — same

PHY-04 paths are untracked markdown only:

- `docs/Phy04AvoidDesign.md`
- `out/w108/phy04/**`

This worker did not edit `src/` for PHY.

---

## 4. Meaning-changing brief mermaid

`docs/Phy04AvoidDesign.md` 167–168:

```
phyOn -->|no jump| destOnly[aim = dest]
phyOn -->|yes| bias[applyAvoidBias]
```

Live: `_phyOn = !ctx.gate.jumping` (`npc.js` 2261). Dest-only is **jump** / `!_phyOn`. Bias is **no jump** / `_phyOn`.

The no-branch label `no jump` names the live dest-only path with the opposite words. An implementer who follows the picture can drop avoid while flying.

Contract §2 and brief text (regression “Jump freeze”) stay correct. Contract wins. The picture still inverts fail-closed.

---

## 5. Extra markdown

`out/w108/phy04/designer-audit.md` exists. Worker `notes.md` did not list it. It is markdown. It does not edit `src/`.
