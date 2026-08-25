# Wave 108 MSN-03 unique SKU leftover — verifier notes

Domain: data. Markdown-only check. No Vite. No Chrome. Ports 5173/9222 left alone.
Graph: `graph_resolve` returned `blocked_ambiguous` (spreadsheet/document/presentation). Owner said proceed_unmodeled. No `graph_propose`.

## 1. Inventory vs live code (code wins)

| Inventory claim | Live | Line meaning |
|---|---|---|
| `EMPLOYER_KEYS` four keys, no gilded | `jobs-chains.js` 9 | true |
| `CHAIN_GRANT` dart / auto / null / null | `jobs-chains.js` 27–33 | true |
| `chainGrantSpec` hasOwn, may return null | `jobs-chains.js` 79–82 | true |
| `grantChainSku` + last-step | `station.js` 3494–3526 | true |
| Fail UU none | `credits += 2` under `src/` = 0 hits | true |
| Write verify none | `grantChainSku` returns true after write, no row id check | true |
| Dart grant `{ launcher: spec.id }` no ammo | `station.js` 3499 | true |
| Shop dart fills `ammoMax` | `station.js` 1775–1779 | true |
| Shop auto `{ turret }` | `station.js` 1822 | true |
| Light missile/turret 0 | `state.js` 67; `canSeat` `weapon-fit.js` 56–61 | true |
| Persist hangar + launcher/ammo/turret | `save.js` 94–96 | true |
| Digit 2/0/8/9 | `station.js` 188, 5904, 6039–6046 | true |
| Empty 80 px hub + RANGE | `hud.css` 184–193; `hud.js` 709–712 | true |
| HUD `hullKind` read | `hud.js` 86–87; no `player.hullKind =` in `hud.js` | true |
| `innerHTML` none in `station.js` | 0 hits | true |
| Unique DONE hide | `station.js` 3631–3634 | true |
| Chain done hide | `station.js` 3629 | true |
| Proto chain id drop | `parseChainId` + `save.js` 345–349 `CHAIN_IDS.has` | true |
| Catalog ids `dart` / `auto` only | `weapon-fit.js` 33–53 | reuse is true |

Stale-line check: dart `ammoMax` sits on `weapon-fit.js` 36; inventory groups shop dart as 37–39 (cost/restock). Meaning of 6500/400/2 and empty-rack grant vs shop fill does not change. Unique-four “vs 3494” is a call-site claim: `grantChainSku` has one caller (`finishChainStep` 3523). Not a meaning drift.

Wave 82 table (`docs/OwnerDecisionsWave82.md` 101–107) still names Veridian/Hollow credits-only. Live table still null. Leftover correctly names remaining grants.

## 2. Brief ≡ shared-contract

Checked `docs/Msn03UniqueSkuDesign.md` against `out/w108/msn03sku/shared-contract.md`. Contract wins on conflict; none found on:

- Digit 2 Jobs (`DOCK_KEY_SERVICES[1]`)
- Empty 80 px hub, no quest widget
- `state.js` READ-ONLY later
- No new `WORLD_FIELDS`
- `canSeat` false → fail-closed +2 UU
- No Digit 0/8/9 steal
- No third SKU id (inventory proves reuse)

Also aligned: Veridian `auto` / Hollow `dart`; helper boolean only; +2 only in `finishChainStep` when `parsed.step === 3`; proto splice unpaid; serial PR table named only.

## 3. This worker did not edit MSN `src/`

`git status --short` for worker paths: untracked `docs/Msn03UniqueSkuDesign.md` and `out/w108/msn03sku/` only.

MSN live files (`jobs-chains.js`, `station.js`, `weapon-fit.js`, `hangar.js`, `save.js`, `state.js`, `hud.js`, `hud.css`) have no uncommitted diff.

Sibling BIO-08 dirt (ignore): `src/systems/ship.js`, `src/systems/ship-assets.js`, untracked `src/game/living-gait.js`.

No `docs/OwnerDecisionsWave108.md`. Sibling Msn/wishlist/`PROGRESS.md` not dirty.

Live `CHAIN_GRANT` still null for Veridian/Hollow → serial PRs were not landed.

## 4. Deputize vs `EMPLOYER_KEYS` / `canSeat`

Keys `veridian` / `hollow` already exist. No fifth employer. No gilded.

Seat kinds match live catalog: `auto` turret, `dart` missile. Light/cutter/freighter mounts are 0/0 → `canSeat` false → later +2, no hull mint. Grant write still goes through `writeMountedGear` when seated. Light fail-closed does not smash starters.

## 5. Security (design law, not live change)

- SKU id from frozen `CHAIN_GRANT`, not `job.sku` / `job.faction`
- Proto ids already fail `isChainId` / sanitize
- `grantChainSku` must stay boolean (no credits write on a stringy helper path)
- Patch only `{ launcher }` or `{ turret }` because `writeMountedGear` would honor scanner/mining if passed (`hangar.js` 494–510; outfitter `station.js` 4446–4491)

Security review + contract §1 already freeze those.

## Verdict

CLEAN. Later impl still required; this wave is design-only as claimed.
