# Wave 123 remaining PHY leftover — verify report

**Status:** CLEAN  
**Domain:** data (no Vite, no Chrome, no `npm run test:boot`)  
**Graph:** `graph-engineering__graph_resolve` → `proceed_unmodeled` (`r-mt948zu0-c52f2f15`). No `graph_approve` / `graph_propose`.  
**Processes started:** none.

## What I tested

1. Write-set vs honor freeze (`src/`, sibling AST/FX packs, wishlist, `PROGRESS.md`).
2. Brief Status leftover line vs contract leftover line vs inventory verdict.
3. Inventory file:line cites vs live `src/` (spot-check PHY-01..05, Digit, persist, HUD, boot pins).
4. Invented-work freeze: navmesh / Digit / persist key / hub pip / PR1 src plan / PHY-04 80 u as REAL leftover.

## Write-set

Worker files are only `docs/Phy06RemainingPhyDesign.md` and `out/w123/phyrest/**` (plus this verify dir).

| Path | Result |
|---|---|
| `src/` | **clean** — `git diff` empty; no PHY leftover `src/` plan landed |
| wishlist / `PROGRESS.md` / Phy04 / Phy05 / `OwnerDecisionsWave123.md` | **clean** — not in scoped `git status` |
| `out/w123/astrest/**` / `out/w123/fxrest/**` | present as **sibling** untracked packs; **not** copied into `phyrest/` |
| `src/systems/physics.js` | **absent** (inventory correctly uses `src/game/physics.js`) |

## Leftover / serial freeze

| Surface | Brief | Contract | Inventory |
|---|---|---|---|
| Leftover | CONSUME | CONSUME | CONSUME |
| Name | no remaining PHY leftover | no remaining PHY leftover | no remaining PHY leftover |
| Named serial | none | none | none |

PR1 is named only as a **counterfactual** if census had found a hole. Serial plan: **PR1 remaining PHY does not exist.** No this-wave `src/` PR1.

PHY-04 PR3 80 u: skippable omit, **not** a REAL leftover. `look * 2` absent in `npc.js`. Contract copies `far = look * 2 (80) — not leftover`.

No invented navmesh, Digit, persist key, hub collision pip.

## Cite spot-check (live code)

| Inventory / brief cite | Live | OK? |
|---|---|---|
| `physics.js` PHY table **6–23** | `Object.freeze` **6–23**; comment forbids `state.js` dup **4** | yes |
| bounce rest 0.15 / slide 0.85 / impact 8 / 0.35 | **13–14**, **11–12** | yes |
| avoid look 40 / gain 1.4 | **19–20** | yes |
| `collectBodies` **345–455**; station **352–360**; gate **377–385** | matches | yes |
| `torusOverlap` **102**; `resolveMover` gate **504–505** | matches | yes |
| `resolveMover` **457**; `resolveVelocity` **297** | **457**, **297** | yes |
| `sunZone` **318–342** zone 1/2 | **318–342** | yes |
| `ship.js` player bounce + sun strip **905–937** / **910–915** | matches; `damage: 0` then combat fills | yes |
| `npc.js` `applyAvoidBias` **643–703**; mid `look * 0.5` **657–660**; `addMidChordHit` **605–617** | matches | yes |
| fail-closed **643–650**; frame hold **781–817**, **835–839** | matches; no `record.route` write | yes |
| `bounceLive` **730–757**, **2401**, **2434** | matches | yes |
| collect + `appendSunBody` **2355–2358**; sun heat r **722** | matches | yes |
| `planApPath` / `navmesh` in `npc.js` | grep 0 | yes |
| `look * 2` in `npc.js` | grep 0 | yes |
| `station.clone()` in `src/` | grep 0 | yes |
| `world.js` patrol `writeStationHold(..., 'heavy', gate)` **381** | **381** | yes |
| `holdClassFor` patrol **669–677**; `healPadHome` **709–735**; `Object.hasOwn` **715**; eps **667**/**730** | matches | yes |
| rebuild/tick patrol heal **457**, **846** | matches | yes |
| trader/miner `writeStationHold` **99–102**, **116–118**, **398–399** | matches | yes |
| `recordPosition` **630–643**; `traffic.js` **105**, **117** | matches | yes |
| `traffic-feel.js` pad **14**; hold **71–102** | matches | yes |
| `combat.js` impact **1848–1852**; sun **1873–1898**; toast gap **164** | matches | yes |
| `hud.js` sunHeat/sunKill **656–659**; bodyHit **660–662**; RANGE **781** | matches | yes |
| `hud.css` 80 px hub **184–193** | matches | yes |
| Digit 0 last service shipyard **188**, **6171–6173**; Digit 8/9 indices 7/8 launch/epics | `DOCK_KEY_SERVICES` ends shipyard; Digit 8→`launch`, 9→`epics` | yes |
| `save.js` `WORLD_FIELDS` **77–102** no `padHome`/`avoid` | matches | yes |
| `state.js` PHY keys | grep 0 | yes |
| `innerHTML` physics/collision/world/traffic-feel | grep 0 | yes |
| `ship.js` `applyAvoidBias` | grep 0 | yes |
| `autopilot.js` `planApPath` **268** then `applyAvoidBias` **291** | matches | yes |
| `ctx.js` sunHeat/sunKill **246–247** | matches | yes |
| WAVE53 **11598–11658** | comment **11598**; FAIL **11658** | yes |
| WAVE58 **11783–11835**; `boreEmpty`/`tubeSolid` **11820–11821** | matches | yes |
| WAVE109 **22478** is MSN-03, not PHY-04 log | matches | yes |
| WAVE110 **22701–22869**; `pirateAceUnchanged` **22844**; `noPadHomeField` **22856** | matches | yes |
| kernel-pins `phy04.midSample` **181–184**; `phy04.noNavmeshPlan` **186–189** | inventory range **176–189** includes avoidKeys; symbols live | yes |
| wishlist Initiative PHY **1273–1313**; AI-01 **1081** | matches | yes |
| Owner Wave 112 §6 **108–114** linear curve | matches | yes |

Cites that are slightly wide (not invented): `torusOverlap` continues past **136**; `resolveVelocity` ends **316** not **314**; loiter ring radius is **260** (80–150), with **210–216** as loiter mode pick.

## Bugs found

None. CONSUME / serial none / skippable 80 u / no remaining PHY leftover hold vs live bounce, avoid, sun, pad-home.

## Environmental issues

None. Graph unmodeled (non-blocking). No processes to stop.
