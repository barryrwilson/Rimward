# Wave 107 BIO-08 verifier notes

Domain: data (markdown). No Vite. No browser. No Chrome. No product-source edit.

Graph: `graph_resolve` `openclaw-janet/agent-qa` → `proceed_unmodeled`. Draft shareable-doc candidates ignored. Parent already scoped this leftover.

## Status

CLEAN

## What I tested

1. `git status --short` write-set vs sibling dirt.
2. Brief `docs/Bio08LocomotionDesign.md` vs merge law `out/w107/bio08/shared-contract.md` on Digit / hub / persist / shader / PR plan / fail-closed / LIVING_CADENCE / makeLivingHull / mixer.timeScale.
3. Inventory live file:line for player CPU swim and `injectSwim`.
4. Live `src/` greps: `LIVING_GAIT`, `living-gait`, `gaitId`, `uSwimSpineX`, `mixer.timeScale`, gait on `state.js` / `save.js`.
5. Pack reviews: inventory, security, code-review, ui-audit, designer-audit, worker notes.

## Git / write-set

BIO-08 pack is untracked markdown only:

- `docs/Bio08LocomotionDesign.md`
- `out/w107/bio08/` (`current-bio08-inventory.md`, `shared-contract.md`, `security-review.md`, `code-review.md`, `ui-audit.md`, `designer-audit.md`, `notes.md`)

`src/game/living-gait.js` is **absent**. `gait` string grep in `src/` = 0. `mixer.timeScale` grep in `src/` = 0.

`src/`, `scripts/boot-test.mjs`, and `public/` are dirty. Those diffs match sibling BIO-06 cadence / BIO-07 bodies / REP-05, not this worker. Not flagged as BIO-08 bugs.

This verifier started no process.

## Contract freeze (held)

| Freeze | Brief | Contract | Live check |
|---|---|---|---|
| Digit 0/8/9 | shipyard / launch / epics | shipyard / launch / epics+Standing; no new Digit | `DOCK_KEY_SERVICES` last=`shipyard`; [7]=`launch`; [8]=`epics`. Menu labels Launch / Standing / Shipyard (`station.js` 188, 5904–5908, 6041–6043) |
| 80 px hub empty of gait chrome | Honor + Goals 7; no pip/disc | §0.2 `.rw-reticle` 80×80; RANGE stays | `hud.css` 184–193; `hud.js` 709–712 pupil + 3 cilia + RANGE |
| `state.js` no gait fields | READ-ONLY; no class keys | §0.6 | `SHIP_CLASSES` 37–44: cruise/burn/creep/… only |
| no persist / localStorage gait key | none | §0.7 `WORLD_FIELDS`; key `rimward-save-v1` | `save.js` 16, 66, 76–101; no gait field |
| PR plan named only | §5 “Do not implement in Wave 107” | §8 named PR1–PR4; no src this worker | no `living-gait.js`; no gait uniforms |
| fail-closed = live spine+flap shader | miss gait → 1,1,0,0; never stub | §0.1 / §10 | live GPU still X spine + Y flap × `uSwimSweep` (`injectSwim` 66–95) |
| do not retune `LIVING_CADENCE` | honor Wave 104 numbers | §0.10 | `living-cadence.js` 8–26 light 1.00/1.00; idle 0.5 cruise 2.3 |
| do not clone `makeLivingHull` onto NPCs | Goals 6 / Non-goals | §0.9 | player 279–339 / 551–565; NPC GLB + GPU 421–479 |
| `mixer.timeScale` forbidden | Alternatives + PR3 | §0.11 | grep 0 in `src/` |

Axis table (six keys / four ids) matches between brief §3 and contract §0.1. Player **light** CPU ignores shark row; NPC light GPU may use `shark-caudal`. Fail-closed mix is `spineX=1 flapY=1 kickZ=0 radial=0`. One shader. Gait = floats later.

Brief Honor: if brief and contract conflict, contract wins. No Digit/hub/persist/shader contradiction found.

## Inventory cites (required)

Player CPU swim — live:

- `makeLivingHull` `src/systems/ship.js` **279–339** (inventory 279–339).
- Living tick `ship.js` **953–1009**: speedNorm 955; cadence 960; light 0.5→2.3 972–975; breath/heart 980–984; spine X 1000; flap Y 1002–1003; Z `const` 997 (no kick). Inventory 953–1009 / 986–1009.

NPC GPU swim — live:

- `makeSwimUniforms` **57–63** (`uSwimTime` / `uSwimAmp` / `uSwimHz` / `uSwimSweep`).
- `injectSwim` **66–95** (function closes 96): one `onBeforeCompile`; X spine + Y flap × sweep. Inventory 66–95.
- `aSwim` bake **278–310** / loop **294–300**. `updateShipAsset` **492–509**. Beautiful-only uniforms **432**. `userData.classKey` **455**.

## Residual nits (not bugs)

- Digit **law** is correct. Digit **line cites** in brief/inventory/contract still say `station.js` 185, 6026–6030/6033. Live bind is 188 / 5904–5908 / 6041–6043. Sibling `station.js` growth (REP-05) is expected. `designer-audit.md` already records this as Minor cite drift. Do not treat as Digit theft.
- Inventory `buildLivingVisual` “387–388”: function starts 387; `makeLivingHull(classKey)` is **392–393**.
- Inventory living preview cites `yard-preview.js` 89 as living; 89 is fallback `update: null`. Living SKU is **115**.
- `code-review.md` still says Wave 107 “may still be landing” BIO-06. Inventory + live `living-cadence.js` show cadence **landed**. Not a brief↔contract conflict.

## Bugs found

None.

## Environmental issues

None. Sibling src/public/boot-test dirt present; excluded per dispatch.

## Evidence

`out/w107/bio08/verify/notes.md`
