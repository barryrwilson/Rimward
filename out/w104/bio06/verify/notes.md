# BIO-06 Wave 104 verifier notes

**Domain:** data (markdown freeze). No Vite. No Chrome.  
**Graph:** `graph_resolve` returned `blocked_ambiguous` (weak hits on research / presentation / spreadsheet). Owner brief said `proceed_unmodeled`. Verifier continued under that scoped exception. Resolution id `r-mt6o88dq-eae5ebfb`.  
**Date:** 2026-08-23.

## Write-set

Worker-listed pack (plus later `designer-audit.md` in the same folder):

- `docs/Bio06CadenceDesign.md` (untracked)
- `out/w104/bio06/shared-contract.md`
- `out/w104/bio06/current-bio06-inventory.md`
- `out/w104/bio06/security-review.md`
- `out/w104/bio06/code-review.md`
- `out/w104/bio06/ui-audit.md`
- `out/w104/bio06/designer-audit.md` (not on the dispatch list; still markdown under `out/w104/bio06/`)

This pack does **not** contain:

- `src/` (no `src/game/living-cadence.js`; grep `LIVING_CADENCE` / `hzScale` / `uSwimSweep` / `sweepScale` in `src/**/*.js` = 0)
- `scripts/`
- `public/`
- `docs/PLAYER-EXPERIENCE-WISHLIST.md`
- `PROGRESS.md`
- `docs/OwnerDecisions*.md` (no `docs/OwnerDecisionsWave104.md`)
- sibling `docs/Bio01*`–`Bio05*`, `docs/BioLivingShipsDesign.md`, `docs/Rep05*`, `docs/Msn03*`

Repo worktree is dirty from **other** Wave 104 / leftover workers (`src/`, `scripts/`, `public/` GLBs, wishlist, `PROGRESS.md`, Bio01–05, Rep05, Msn03). Those diffs are not this BIO-06 write-set. Wishlist `### BIO-06` text exists as a working-copy add under a BIO-02 hunk; it is not one of the listed worker files.

## Contract vs brief vs owner brief

Contract is merge law (`out/w104/bio06/shared-contract.md`). `docs/Bio06CadenceDesign.md` points at it. Numbers agree.

Deputize `hzScale` (owner brief):

| classKey | hzScale | Idle Hz | Cruise Hz |
|---|---|---|---|
| light | 1.00 | 0.50 | 2.30 |
| ace | 0.96 | 0.48 | 2.21 |
| cutter | 0.80 | 0.40 | 1.84 |
| heavy | 0.62 | 0.31 | 1.43 |
| frigate | 0.44 | 0.22 | 1.01 |
| freighter | 0.30 | 0.15 | 0.69 |

Matches contract §0.1 and design §3. Sweep column (1.00 / 1.06 / 1.22 / 1.42 / 1.68 / 2.00) is extra vs the owner hzScale list; it does not contradict it. Monotonic Hz: `light ≥ ace > cutter > heavy > frigate > freighter`.

Serial named only: PR1 data `living-cadence.js` preferred, no `state.js`; PR2 player CPU honor; PR3 NPC GPU; PR4 reducedMotion + pins. No `src/` impl this wave.

No contract/brief numeric fight. Soft wording only: brief says multiply Hz/amp; contract §1.1 names `swimHz` / `flapAmp` (contract wins). BIO-07 is leftover in both.

## Inventory vs live code (code wins)

Load-bearing claims **hold** on current `src/`:

| Claim | Live |
|---|---|
| Player idle 0.5 / cruise 2.3 | `src/systems/ship.js` 144–145 `IDLE_SWIM_HZ` / `CRUISE_SWIM_HZ` |
| Mood rates | `ship.js` 152–157 serene 1.0 / keen 1.25 / anxious 1.0 / pained 0.6 / feral 1.5 |
| Player loop Hz | `ship.js` 950–956 `min(speedNorm,1)` × mood.rate; amp × `restScale` 958–959; vertex 967–993; **no** `reducedMotion` gate |
| `makeLivingHull` | `ship.js` 274–334; restScale 252–256; silhouette cutter/heavy 258–263 |
| Remount living | `ship.js` 546–560; Unknowables force living 550 |
| NPC idle/cruise 0.5 / 2.3 | `src/systems/ship-assets.js` 46–47 |
| NPC `/120` every class | `SWIM_CRUISE_SPEED = 120` line 48; `speedNorm = min(spd/SWIM_CRUISE_SPEED, 1)` line 467; `uSwimHz` lerp line 470 |
| Beautiful-only uniforms | `buildShipAsset` 398 |
| No `userData.classKey` | 439–440 `assetInstanceKey` only |
| Six keys | `state.js` 37–44; `ship-assets.js` 11; `shipyard.js` 29 `LIVING_STOCK` |
| Cruise ints | light 120, ace 135, cutter 105, heavy 90, frigate 22, freighter 60 |
| `maxSpeed = cls.cruise` | `hangar.js` 563–568 |
| `classKeyOf` hasOwn → light | `hangar.js` 40–41 |
| `P` 6.6; targets | `ship-scale.js` 39; 73/92/101/131/158/170 |
| 80 px hub + RANGE | `hud.css` 184–193; `hud.js` 709–712 |
| HUD reads `hullKind` | `hud.js` 80–90; no `hullKind =` write |
| Digit 0 shipyard | `station.js` 185 last = `shipyard`; Digit 0 → last service (live 6026–6030) |
| reducedMotion NPC amp 0 | `ship-assets.js` 459, 469 |
| Yard living `update: null` | `yard-preview.js` 93–116 |
| Organics freeze | `organic.js` 647–648 |
| Settings default | `ctx.js` 217 `reducedMotion: false`; `ctx.js` 52 `maxSpeed: 120` |
| No cadence persist | `save.js` `WORLD_FIELDS` 76–101 — no cadence key |
| Beautiful GLB | `public/assets/ships/beautiful/{light,ace,cutter,heavy,frigate}/lod0-2` + freighter lod0–3 |

Implied NPC Hz table (inventory §4.4) matches `lerp(0.5, 2.3, min(speed/120,1))`.

### Cite drift (not a pack lie; sibling `src/` moved)

Inventory froze `npc.js` **2280** for the traffic `animateShipMesh` call. Live worktree is **2287**. `HEAD` is **2205**. Comment “omit speed = idle” is `npc.js` 187–188 (inventory said 186). Digit 0 handler: inventory `6023–6025`; live `6026–6030`; designer-audit already `6028–6030`. Models Browser `makeLivingHull()` is `model-catalog.js` **99** (inventory 98). Semantics still true. Later impl must re-grep (inventory §10 already says so).

## Frozen honors

- HUD-01 empty hub; no cadence chrome on `.rw-reticle`
- Digit 0 shipyard; 8 launch; 9 epics; no new Digit
- HUD never writes `hullKind`
- Player CPU `makeLivingHull` not replaced; NPC GPU stay
- BIO-05 graft / BIO-02 kit / BIO-07 bodies not reopened
- No persist key; no invented UU / class keys
- Light 1.00/1.00 bit-identical; no `mixer.timeScale`
- Serial named only; PR1 not `state.js`

## Not tested

- Browser / Vite / boot-test (forbidden / not this wave)
- Later PR math in running shaders (no `src/` yet)
