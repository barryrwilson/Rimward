# Wave 97 NPC turrets — verifier notes

**Date:** 2026-08-23  
**Method:** static review. No Vite. No Playwright.  
**Write-set under test:** `docs/NpcTurretsDesign.md`, `out/w97/turrets/*.md` (integrator).  
**Verdict:** CLEAN.

## 1. Files exist

| Path | Present |
|---|---|
| `docs/NpcTurretsDesign.md` | yes (untracked) |
| `out/w97/turrets/current-npc-turrets-inventory.md` | yes |
| `out/w97/turrets/shared-contract.md` | yes |
| `out/w97/turrets/security-review.md` | yes |
| `out/w97/turrets/code-review.md` | yes |
| `out/w97/turrets/ui-audit.md` | yes |

Extra in the same folder (not in the integrator file list): `designer-audit.md` (independent HUD pass, 08:57). It agrees CLEAN. Not treated as an integrator defect.

## 2. Inventory cites vs live code (spot-check)

Code wins. Sampled rows against current `src/`.

| Claim | Live | Result |
|---|---|---|
| `WEAPONS.turret` damage 4, rof 3, speed 800, range 380, heat 2, family `energy` | `state.js` 135–138 | MATCH |
| `MOUNT_TABLE.turret` light/cutter/freighter 0, heavy 2, ace 1, frigate 4 | `state.js` 66–72 | MATCH |
| `TURRET_IDS.auto` wkey turret, cost 4200 | `weapon-fit.js` 46–54 | MATCH |
| `state.js` READ-ONLY header | `state.js` 7–11 | MATCH |
| `createShipState` does not attach `turret` | `state.js` 167–188 | MATCH |
| Unknowable non-beam miss | `state.js` 197–199 | MATCH |
| `TURRET_LIVE_CAP` 2; `countLiveTurretBolts` has no `fromPlayer` filter | `combat.js` 174, 1245–1250 | MATCH |
| `tryPlayerTurret` seated, forward cone `CONVERGE_DOT` 0.72 | `combat.js` 1253–1296, 182 | MATCH |
| `spawnNpcShot` maps unknown → cannon; refuses missile/psionic; **does not refuse turret** | `combat.js` 1298–1320 | MATCH |
| Wave 57 split `(fromPlayer \|\| !vsPlayer) ? testNpcHits : testPlayerHit` | `combat.js` 1848–1851 | MATCH |
| Ace-omit / missing target → player on cannon path | `combat.js` 1787–1791; `npc.js` 1923 | MATCH |
| NPC emit cannon + missile only; **no** `weapon: 'turret'` | `npc.js` 1545–1548, 1919–1923; repo grep 0 | MATCH |
| Hunt: civilian never; patrol scratch/standing; pirate/ace | `npc.js` 1079–1091 | MATCH |
| Dart gate pirate/ace, not Unknowable | `npc.js` 1093–1100 | MATCH |
| Empty 80 px hub clamp | `hud.js` 1185; `hud.css` 184–190 (80×80) | MATCH |
| Dart toast missile vs player only, authored `Incoming dart.` | `hud.js` 61–62, 567–571 | MATCH |
| WPN groups 1–5; turret not a Digit | `hud.js` 210–229, 837–838, 1808 | MATCH |
| FORE/AFT flash on `playerHit` | `hud.js` 323–349, 1122–1124 | MATCH |
| Digit 0 = last dock service = shipyard | `station.js` 186, 5917–5922 | MATCH |
| Digit 8 launcher papers; Digit 9 player `auto` | `station.js` 1684–1727, 5392–5448 | MATCH |
| Hangar `turret` player/flat; NPC record has no turret field | `hangar.js` 61–64, 233; `npc.js` 37–39 | MATCH |
| `WORLD_FIELDS` player `turret` mirror; no NPC rack | `save.js` 96 | MATCH |
| `npcFire` frozen comment cannon\|missile | `ctx.js` 244 | MATCH |
| Song: missile sting only if `weapon === 'missile'` | `song.js` 68–69, 423 | MATCH |
| PHY lookahead 40 / gain 1.4 | `physics.js` 19–20 | MATCH |
| World cast: trader freighter, pirate cutter (+Q-ship cover freighter), patrol heavy, miner light/cutter, ace | `world.js` 338, 348–370, 378, 395, 407–414 | MATCH |
| No `frigate` spawn in `world.js` | grep 0 | MATCH |
| No `chaff` in `src/game` | grep 0 | MATCH |
| Combat HUD/station: no `innerHTML`; `modelsbrowser.js` has it and is out of HUD | hud/combat/npc/station grep 0 | MATCH |

Reuse of `WEAPONS.turret` + 64-pool energy path is **true**. Hit tests already split on `vsPlayer`. Live NPCs still do not emit turret.

## 3. Freeze holds

Checked integrator brief + contract against the wave freeze:

- Empty 80 px hub; no aim-glass gauge / pip / lock box / new `#hud` glance.
- No turret toast; do not steal `Incoming dart.`
- Digit 0/8/9 player-only; hangar `turret` player/flat.
- Who-fires default **nobody** / **no NPC turret** until owner Q1/Q2.
- Proposed subset heavy / ace / frigate + already-hostile. Not a fire percent.
- Cadence is a proposed pin `1 / (WEAPONS.turret.rof * 0.5)`, unset → off. Not a percent.
- Unknowables: turret is not a beam; miss; Unknowable NPCs never fire turrets.
- Wave 57 split kept; NPC-vs-NPC never `testPlayerHit`.
- No chaff. No power ledger. `state.js` READ-ONLY this wave; later impl default no write.
- `textContent` / `h()` / `el()` only.

Supersede of NpcMissiles “no NPC player-style `auto` turret” is **explicit** in:

- `docs/NpcTurretsDesign.md` historical note (later impl serial only)
- `out/w97/turrets/shared-contract.md` header
- `out/w97/turrets/code-review.md` passed checklist

`docs/NpcMissilesDesign.md` still contains the freeze (goals item 6; non-goals). **That file was not edited** (`git status` clean; last commit 5ab745a). `docs/Shp03WeaponsDesign.md` clean.

## 4. This worker did not edit forbidden trees

Evidence:

- Integrator artifacts are **untracked** (`docs/NpcTurretsDesign.md`, `out/w97/turrets/`).
- `docs/NpcMissilesDesign.md` and `docs/Shp03WeaponsDesign.md` are not in `git status`.
- Worker-doc mtimes ~08:44–08:48. `combat.js` / `state.js` last write 2026-08-22 23:18; `npc.js` 2026-08-23 00:26 — **before** the integrator write.
- Working tree `src/**` is dirty vs HEAD from **earlier uncommitted waves**, not from this markdown pass. No `weapon: 'turret'` emit was added.

Sibling `out/w97/tgt03/` and `out/w97/bio05/` exist as other Wave 97 workers. Turret notes do not write those paths. Wishlist / `PROGRESS.md` mtimes 02:35 (other work); turret docs do not appear in those files.

## 5. Residual nits (not bugs)

1. `code-review.md` says face-cone lives at contract §4.2 **step 5**. Live cap is step 5; range/face is **step 7**. Review-note typo only.
2. `ui-audit.md` pins `reducedMotion` on `combat.js:1854` (seeker comment). Energy bolts already tick at `1836–1852` with no `reducedMotion` skip. Contract already says “same for energy.” Designer-audit records the same nit. Freeze still forbids hiding bolts.

No freeze break. No wrong inventory `file:line` on the sampled combat/NPC/HUD/Digit/catalog rows.

## 6. Processes

Did not start Vite or Chrome. No listener owned on 517x–519x / 94xx from this pass.
