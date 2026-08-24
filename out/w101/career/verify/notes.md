# Wave 101 BIO-02 remaining career-branch verifier notes

Date: 2026-08-23
Scope: design markdown only. No `src/` edits. No `scripts/`. Do not edit wishlist, `PROGRESS.md`, `docs/Bio02EvolutionDesign.md`, Bio05, NPC turret, TGT-03, or OwnerDecisions.

## Write-set existence

| Path | Present |
|---|---|
| `docs/Bio02CareerDesign.md` | yes |
| `out/w101/career/current-bio02-career-inventory.md` | yes |
| `out/w101/career/shared-contract.md` | yes |
| `out/w101/career/security-review.md` | yes |
| `out/w101/career/code-review.md` | yes |
| `out/w101/career/ui-audit.md` | yes |
| `out/w101/career/verify/notes.md` | yes |

## Live inventory vs freeze

| Surface | Live cite | Brief / contract |
|---|---|---|
| `SHIP_CLASSES` | `state.js` 37–44 six keys | No seventh career key |
| `LIVING_STOCK` | `shipyard.js` 29 six keys including `frigate` | Frozen. No omit-restore. No append |
| Train dests | `livingTrainDests` any other stock key | DONE ladder. Ace/freighter not a new verb |
| Digit 0 | `station.js` 186, 5920–5922 Shipyard | Digit 0 stays Shipyard |
| Papers | Hangar Confirm `{from} → {dest}` | Reuse. Kit mutate omit |
| `yardPrice` | `shipyard.js` 110–126 | Copy. No invented UU |
| Persist | `save.js` 94 `hangar` | No new WORLD_FIELDS |
| HUD | `hud.js` 80–88 reads `hullKind` | HUD never writes |
| `innerHTML` | desk `h()` `textContent` | Forbidden |
| Graft | `GRAFT_LIST_UU` 4000 | Do not reopen. Ungraft forbidden. NPC off |

## Deputize defaults (not parked)

| Item | Default |
|---|---|
| Six career class keys | **No** |
| Career = | loadout + existing class |
| combat / hunter | `heavy` / `ace` |
| mining / stealth | `cutter` + outfitter |
| trade | `freighter` |
| exploration | `light` + scanner |
| support | `heavy` (capital skin `frigate`) |
| Hangar kit mutate | **omit** |
| Dest labels | optional PR1 static words |
| New Digit | **No** |
| New persist | **No** |

## Invented class keys check

Grep of this write-set for tokens as **proposed keys** (`SHIP_CLASSES.mining` etc.): none. Wishlist names appear only as skins mapped onto live keys.

## `src/` leak check

This worker writes only `docs/Bio02CareerDesign.md` and `out/w101/career/**`.

Grep this pack for scheduled Wave 101 career `src/` PRs: none land this wave. Serial PR1/PR3 later. PR2 skipped.

## Processes

Verifier started none. No Vite/Chrome.

## Graph note

`graph_resolve` bound `codex/workflow-calendar-management` on the words “brief” / “review” (coverage 0.08). That calendar stack cannot apply to this markdown pack. No calendar mutation. Assigned BIO-02 write-set followed.

## Verdict

CLEAN. Inventory cites live hangar / shipyard / `SHIP_CLASSES`. Shared-contract forbids Digit steal, new persist, frigate-buy omit-restore, `innerHTML`. No `src/` in this worker’s write-set.
