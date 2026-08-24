# Wave 98 TGT-03 radar pack — verifier notes

**Date:** 2026-08-23  
**Domain:** data  
**Worker pack:** `docs/Tgt03RadarDesign.md`, `out/w98/radar/*.md`  
**Rule:** do not edit `src/` or sibling docs. Code wins.

## Status

**BUGS_FOUND** — freeze law matches live HUD. One integrator cite is wrong.

## What I tested

Read:

- `docs/Tgt03RadarDesign.md`
- `out/w98/radar/shared-contract.md`
- `out/w98/radar/current-tgt03-radar-inventory.md`
- `out/w98/radar/security-review.md`
- `out/w98/radar/code-review.md`
- `out/w98/radar/ui-audit.md`
- extra pack file `out/w98/radar/designer-audit.md` (not in the worker file list)

Spot-checked live:

- `src/systems/hud.js`
- `src/ui/hud.css`
- `src/game/save.js`
- `src/game/hangar.js`
- `src/game/state.js`
- `src/core/ctx.js`
- `src/game/contacts.js`
- `src/systems/station.js`
- `src/systems/controls.js`
- `src/game/reticle-aim.js`
- `src/game/npc-fire-toast.js`
- `src/systems/settings.js`

Did not start Vite. Did not run formatters, linters, or the full suite.

`git status` on the pack: untracked `docs/Tgt03RadarDesign.md` and `out/w98/radar/`. No `src/` file lives in this pack.

Dirty `src/systems/hud.js`, `src/ui/hud.css`, `src/game/save.js` exist in the tree (sibling TGT-03 / HUD). This worker does not own those diffs.

## Checklist

| Check | Result |
|---|---|
| Reuse `.rw-contacts` | **Pass.** Brief, contract §1, inventory §3. Live wrap `hud.js` 792. No proven new-class exception. |
| No hub PPI | **Pass.** Contract §1.1 / §6. Live hub is 80 px reticle (`hud.css` 184–189; clamp `hud.js` 1194). |
| No new SKU / Mk III | **Pass.** Reuse `world.scanner` 0/1/2. `healScanner` `hangar.js` 44–46. Restore allowlist `save.js` 1079–1082. |
| No new `WORLD_FIELDS` key | **Pass.** `scanner` at `save.js` 79. `contacts` at `save.js` 80 is people. No `radar` key in `save.js`. |
| Scanner still gates | **Pass.** `showArc = scanner >= 1 && !ctx.flags.docked && !!shipObj` `hud.js` 1382–1383. |
| Tier 0 = no arc | **Pass.** Same gate. Core DIST / edge / lead / MATCH stay. |
| Lock stays `.rw-edge-arrow` | **Pass.** `hud.js` 735–736; CSS `hud.css` 576–594. Not traffic. |
| Route stays `.rw-nav-gate-cue` | **Pass.** `hud.js` 737–741; CSS `hud.css` 1003–1037. Not traffic. |
| Serial PR named-only; no `src/` in pack | **Pass.** Brief § Serial PR plan; contract §8. Pack is markdown only. |
| Subsystem targeting / missile gauges / lead/MATCH out | **Pass.** Brief non-goals; contract §0.14 / §4 / §9. |
| `world.contacts` ≠ HUD arc | **Pass.** `ctx.js` 162 people roster; `contacts.js` 176, 518–544. HUD grep `world.contacts` = 0. Arc uses `ctx.ships` `hud.js` 1404–1418. |
| Digit 0/8/9 not stolen | **Pass.** Digit 0 shipyard `station.js` 186, 5920–5922. Dock 8 Launch / 9 Standing (`epics` key) `station.js` 5801, 5924–5925. Outfit 8/9 papers `station.js` 1699–1702, 5983–5986. Outfit 2/4 Wolfeye `station.js` 5347–5366, 5978–5980. |
| `innerHTML` forbidden | **Pass.** Freeze forbids it. Grep `innerHTML` in `hud.js` = 0. `el()` uses `textContent` `hud.js` 240–245. Closure glyphs `hud.js` 1491. |

## Live cite spot checks (code wins)

| Claim | Live | Verdict |
|---|---|---|
| `.rw-contacts` node + aria | `hud.js` 791–793 | OK |
| Pool 24 / Mk I cap 16 | `hud.js` 68–69, 804–805, 1401 | OK |
| Mk I / Mk II range | `hud.js` 1400; `U.ENCOUNTER_BUBBLE` 800 `state.js` 27 | OK |
| Ships-only loop | `hud.js` 1406–1412 | OK |
| `contactKind` lock > hostile | `hud.js` 354–357 | OK |
| Yaw: forward ends, aft center | `hud.js` 175–178, 1450–1457 | OK |
| Scanner hide docked, not jumping | `hud.js` 1382–1383 vs `navPark` 1577 | OK |
| Closure `«` / `»` `textContent` | `hud.js` 1476–1491 | OK |
| `.rw-edge-arrow` + aria + lockPark | `hud.js` 735–736, 1303–1306 | OK |
| `.rw-nav-gate-cue` off-glass | `hud.js` 737–741, 1577, 1603–1636 | OK |
| Empty hub clamp | `hud.js` 1194 (`cx - 44`) | OK |
| FORE/AFT on `playerHit` 0.4 s | `hud.js` 325–351, 1091–1092, 1131–1133, 1357–1377 | OK |
| `Incoming dart.` / `Incoming fire.` | `npc-fire-toast.js` 7–8; `hud.js` 14, 568–573 | OK |
| `WORLD_FIELDS` scanner + contacts | `save.js` 79–80 | OK |
| Digit 0 shipyard | `station.js` 186, 5920–5922 | OK |
| Digit 8/9 papers | `station.js` 1699–1702 | OK |
| Outfitting 2/4 Wolfeye | `station.js` 5347–5366 | OK |
| `LOCK_CONE_PX` 12 | `reticle-aim.js` 15 | OK |
| KeyT / KeyV | `controls.js` 265–266, 280–281 | OK |
| `innerHTML` in `hud.js` | 0 hits | OK |
| `is-aft` CSS | 0 hits in `hud.css` | OK |
| `--amber` aliases `--rw-warn` | `hud.css` 13, 23 | OK |
| Colorblind Okabe-Ito `--rw-warn` | `hud.css` 1134–1138 | OK |
| Reduced-motion kills `#hud *` | `hud.css` 1173–1177 | OK |
| Wishlist still names radar | `PLAYER-EXPERIENCE-WISHLIST.md` 391 | OK (code wins) |

## Bugs found

### 1. Brief cites FORE/AFT as the docked-hide line

- **Where:** `docs/Tgt03RadarDesign.md` merge table, “Park arc docked? **Already** `hud.js` 1368”
- **Live:** `hud.js` 1368 is `selfFacing.set(selfMode)` in the FORE/AFT block (1357–1377).
- **Correct docked hide:** `hud.js` 1382–1386 (`showArc = scanner >= 1 && !ctx.flags.docked && !!shipObj`).
- **Inventory is right:** `current-tgt03-radar-inventory.md` §3 cites 1383–1387.
- **Contract is right:** hide while docked, already, without that line.
- **Why it matters:** a later PR that opens 1368 for “docked park” lands on facing glance, not the contacts gate.
- **Merge law:** contract wins, so the freeze still says hide-when-docked. The integrator table is still a wrong cite.

### Nits (not freeze holes)

- Inventory §5 cites HUD arc as `hud.js` 800–817, 1365–1516. 1365–1377 is FORE/AFT. Dedicated §3 range 1379–1531 is the contacts block.
- Live contacts enter also has `#hud[data-family="mech"]` `@keyframes rw-mech-contact-enter` (`hud.css` 1302–1308). Inventory names only `rw-contact-enter`. Freeze still forbids **new** keyframes. Designer-audit names the mech keyframe.
- Dock Digit 8/9 live bind is `station.js` 5801 + 5918–5925. Inventory cites the comment at 1622–1623. Behavior is still Launch / Standing (`epics` key). Freeze does not steal those digits.

## Environmental issues

- I started no Vite and no Chrome.
- `netstat` on 5173 / 5174 / 4173 / 3000 / 8080 / 24678: no LISTENING rows.
- User Chrome and Node processes already run on this machine. I did not kill them.
- Working tree has sibling edits in `hud.js` / `hud.css` / `save.js`. Do not blame this markdown worker.

## Evidence

- Contacts wrap: `src/systems/hud.js` 791–813, gate 1379–1387, range/cap 1400–1401, ships loop 1404–1418.
- Lock arrow: `src/systems/hud.js` 735–736, 1303–1306; `src/ui/hud.css` 576–594.
- Gate cue: `src/systems/hud.js` 737–741, 1577, 1603–1636; `src/ui/hud.css` 1003–1037.
- Persist: `src/game/save.js` 76–101, 1079–1082.
- People roster: `src/core/ctx.js` 162; `src/game/contacts.js` 518–521.
- Wrong brief cite: `docs/Tgt03RadarDesign.md` line 134–135 vs live `hud.js` 1368 vs 1382–1386.
