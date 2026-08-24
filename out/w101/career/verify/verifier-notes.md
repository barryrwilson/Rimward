# Wave 101 BIO-02 remaining career-branch independent verifier

Date: 2026-08-23
Scope: markdown pack only. No product `src/` edits. No Vite. Graph resolve `proceed_unmodeled`.

## Write-set

Listed worker files present. Extra pack file `out/w101/career/designer-audit.md` exists (designer pass; not in the listed integrator write-set).

No listed worker path is under `src/`. Brief and contract both freeze Wave 101 as markdown only.

Worktree also has dirty / untracked `src/` from other workers. Those files are not this pack.

## Live greps (code wins)

| Surface | Live | Pack claim |
|---|---|---|
| `SHIP_CLASSES` | `state.js` 37–44; six keys `light` `heavy` `freighter` `ace` `cutter` `frigate` | Match. No seventh career key |
| `MOUNT_TABLE` | `state.js` 66–73; same six keys | Match |
| `LIVING_STOCK` | `shipyard.js` 29 includes `frigate` | Frozen six-key buy. Wave 86 omit is stale |
| `UNKNOWABLES_STOCK` | alias of `LIVING_STOCK` (`30`) | Match |
| `YARD_STOCK` beautiful / unknowables | `51–62`; `hullKindFor` living (`91–94`) | Full live class set sold living |
| `livingTrainDests` | `33–43` any other stock key | DONE ladder. Ace/freighter/frigate dests live |
| `YARD_LIST_UU` / `MIN_REP` | `16–23` / `64–71` | List UU and ace 10 / frigate 25 match |
| `yardPrice` / `trainListPrice` | `110–126`; train is dest `yardPrice` | Match |
| `GRAFT_LIST_UU` | `26` = 4000 | Do not reopen |
| Digit 0 dock | `DOCK_KEY_SERVICES` last key `shipyard`; `station.js` 186, 5920–5922 | Digit 0 Shipyard |
| Hangar / Yard panes | Digit 1 / 2 (`shipyard-desk.js` 18–20, 469–476) | Match |
| Hangar hull digits | Digit 3+ → index n-3; Digit 0 → index 7 (`143–151`); cap 8 | Match (index 7 = row 8) |
| Train papers | Confirm hop `{from} → {dest}` (`376–394`); Offer click (`426–434`) | Reuse. No dest Digit |
| `WORLD_FIELDS` | `save.js` 76–101; `hangar` at 94; no career key | No new persist |
| HUD `hullKind` | reads only (`hud.js` 80–88, 1065, 1694) | HUD never writes |
| `HAIR_CAREER` | layout inset 18 (`hud.js` 101) | Not a career flag |
| `innerHTML` | none in desk / station `h()` | Forbidden |
| Outfitter UU | 400 / 900 / 600 / 900 / 1400 / 4200 / 11000 | Match |
| Growth | `bio.js` 156–161; weights 0.7 / 0.05 | Visual only |
| Silhouette | `cutter` / `heavy` only (`ship.js` 259–263) | Match |
| NPC `grafted` | no hits in `npc.js` / `traffic.js` | Off |
| `TRAIN_HEAVY_NOTE` | defined `94`; unused by `trainPaint` | Dead string; pack forbids revival |

Wave 86 “living frigate buy omit” is **stale**. Live Wave 94 `LIVING_STOCK` sells `frigate`.

Wishlist BIO-02 (~1224–1239) still says buy omit and ace/freighter train **no**. That file is sibling-locked. This pack treats it as remainder copy, not live law.

## Contract forbids (present)

- Digit steal / new `DOCK_KEY_SERVICES` / Career Digit
- New persist / `WORLD_FIELDS.career` / `localStorage`
- `innerHTML`
- HUD `hullKind` write
- SKU append to `LIVING_STOCK`
- Strip six-key buy / omit-restore
- Invented class keys; careers = loadout + existing class
- Hangar kit mutate omit unless a successor owner file
- Digit 0 remains Shipyard (Hangar Digit 0 stays last hull row)

## Invented keys

Grep of `docs/Bio02CareerDesign.md` and `out/w101/career/*.md` for `SHIP_CLASSES.mining` / stealth / support / exploration / combat / trade as keys: none. Wishlist names map onto the live six keys only.

Later serial PR1 = static words on existing dest Offers. PR2 skipped. PR3 pins. No Wave 101 `src/` land.

## Cite tightness (not a fail)

`writeMountedGear` body is `hangar.js` 489–524. Inventory range 483–518 starts at the comment and misses the turret tail. Same function. Not a false law.

## Processes

Verifier started none. No Vite.
