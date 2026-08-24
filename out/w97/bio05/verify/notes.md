# Wave 97 BIO-05 verifier notes

Date: 2026-08-23
Scope: owner markdown close only. No `src/` edits. No product `docs/**` edits.

## Write-set existence

| Path | Present |
|---|---|
| `docs/OwnerDecisionsWave97.md` | yes (untracked) |
| `docs/Bio05AbominationsDesign.md` | yes (untracked) |
| `out/w97/bio05/shared-contract.md` | yes |
| `out/w97/bio05/current-bio05-inventory.md` | yes |
| `out/w97/bio05/security-review.md` | yes |
| `out/w97/bio05/code-review.md` | yes |
| `out/w97/bio05/ui-audit.md` | yes |

## Owner close vs decision table

`docs/OwnerDecisionsWave97.md` headings under **Closed this wave** bind leftover BIO-05. Contract `out/w97/bio05/shared-contract.md` §2.1–2.4 uses the numbered labels. Owner prose matches:

| Item | Required | Owner file | Contract |
|---|---|---|---|
| NPC grafted traffic | **off**. Player-only. Kill helper stays | NPC spawn `grafted` **off**. Kill helper stays `+5` | §2.1 CLOSED (off) |
| Plated tissue overlay | **omit**. Keep plated GLB. Do not replace `makeLivingHull` | overlay omit; plated `buildBuiltVisual`; `makeLivingHull` no | §2.2 CLOSED (omit) |
| Hangar grafted badge | **omit** | omit. Digit 9 + Gilded warn | §2.3 CLOSED (omit) |
| Ungraft SKU | **forbidden**. No `state.js` SKU | forbidden. No commodity / COMMODITIES | §2.4 FORBIDDEN |
| Persist | hangar row only | hangar row only. No new WORLD_FIELDS. No new localStorage | §0.3 / §3 |
| `innerHTML` | forbidden | forbidden. `textContent` / `h()` / `el()` | §0.4 |
| Digit 0 | shipyard | shipyard | §0.5 |
| HUD `hullKind` | HUD never writes. Grafted stays mech | HUD never writes. Grafted stays mech | §0.6 |
| Player graft loop | closed | closed. Do not reopen sale/warn/UU/cap/Digit 5 | §1 / §1.7 |
| Wave 97 `src/` BIO-05 PRs | none | markdown only. PR3 skipped until successor | §0.1 / §5 |
| New UU / standing | none | copies Wave 82; do not invent | §0.8 / §6 |

Owner persist table does **not** name a new `WORLD_FIELDS` key or a new `localStorage` key. It only forbids them.

## Bio05 design cite

`docs/Bio05AbominationsDesign.md`:

- Status: remaining closed by Wave 97 owner line (NPC off, plated, no badge, no ungraft).
- Owner line pointer: `docs/OwnerDecisionsWave97.md`.
- Leftover section: closed by Wave 97. Not Wave 97 `src/`.
- Open questions: **None**. “Do not wait on a further owner line for NPC / plated / badge / ungraft.”
- Grep `owner-open` / `waiting on an owner`: 0 hits.

## `src/` leak check

`git diff --name-only` plus `git status --short`: many dirty `src/**` files from earlier waves. Instruction: that is **not** a bug.

Bio05 worker write-set is untracked markdown + `out/w97/bio05/**` only.

Grep `src/` for `Wave 97`, `BIO-05`, `ungraft`, `plated tissue`: **0 hits**.

`git diff` on `npc.js` / `traffic.js` / `state.js` / hangar / kill / shipyard / hud: no Wave 97 spawn writes. Hangar `graftedOwnTrue` / `delete rec.grafted` lines are live graft / train-living (earlier waves), not this worker.

## Live grep (NPC grafted spawn)

| Surface | Result |
|---|---|
| `src/systems/npc.js` `grafted` | **0 hits** |
| `src/game/traffic.js` `grafted` | **0 hits** (file exists) |
| `src/systems/traffic.js` | file absent (OK) |
| `createShipState` (`src/game/state.js` 167–188) | no `grafted` field copy |

## Integers vs Wave 82 / live

| Item | Wave 97 owner | Wave 82 | Live |
|---|---|---|---|
| Graft UU | 4000 | `GRAFT_LIST_UU = 4000` | `src/game/shipyard.js` 26 `GRAFT_LIST_UU = 4000` |
| Hostility cap | −10 | restitution note: graft cap may pull to −10 | `src/game/hangar.js` 124 `HOSTILE_STANDING = -10`; `npc.js` 92 same hunt floor |
| Kill | −5 | `KILL_STANDING_DELTA = -5` | `src/game/kill-standing.js` 6 `-5` |
| Destroy-Abomination Beautiful | +5 | `ABOMINATION_DESTROY_BEAUTIFUL_DELTA = +5` | `src/game/kill-standing.js` 9 `5` |

HUD family reads `hullKind`; does not assign `player.hullKind`. Built returns `mech` (`src/systems/hud.js` 76–85). Grafted built mesh stays plated (`ship.js` 535–560 `buildBuiltVisual`).

Live Gilded warn restated in owner file matches `shipyard-desk.js` 67–69.

## Processes

Verifier started none. No Vite/Chrome. No ports 517x–519x / 94xx opened by this run.

## Verdict

CLEAN. Owner close holds. No Bio05 `src/` leak. NPC `grafted` spawn grep still 0.
