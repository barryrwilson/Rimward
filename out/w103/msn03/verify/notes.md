# Wave 103 MSN-03 unique DONE — verifier notes

Domain: data. No servers started. No `src/` / `scripts/` / `public/` edits by this verifier.

## Status
CLEAN

## What I tested

- Worker write-set vs claimed six markdown files (timestamps + git status).
- Shared-contract freeze vs brief (`docs/Msn03UniqueDoneDesign.md` + `out/w103/msn03/shared-contract.md`).
- Inventory cites vs live `src/game/save.js`, `src/systems/station.js`, `src/game/jobs-chains.js`, `src/systems/hud.js`, `src/ui/hud.css`, `scripts/boot-test.mjs`.
- uniqueRetry leftover documented, not patched in `src/`.
- Serial PR plan named only (PR1 `boardJobs` hide, PR2 boot pins).
- Forbidden paths: `docs/OwnerDecisionsWave103.md` absent; `docs/Msn03ChainsDesign.md` clean; wishlist / `PROGRESS.md` last-write before this worker.
- Reviews (`security-review.md`, `code-review.md`, `ui-audit.md`) are markdown-only.

## Bugs found

None. Contract freeze matches the brief. Inventory claims that matter for later impl match live code (line numbers within a few lines).

## Environmental issues

Repo working tree is dirty from sibling waves (`src/`, `scripts/`, `public/`, `PROGRESS.md`, wishlist, assets). That dirt is **not** this worker. This worker’s files last-wrote 2026-08-23 21:07–21:11. `station.js` last-wrote 18:08. `save.js` last-wrote 17:49. `Msn03ChainsDesign.md` last-wrote 2026-08-21. Wishlist / `PROGRESS.md` last-wrote 20:30.

Graph resolve returned Activar PR knowledge-capture (coverage 0.08). That workflow does not apply to this WebSim verify. No CRM / Open Knowledge write.

## Evidence

### 1. Write-set

Worker artifacts (only these for this pack):

| Path | LastWriteTime |
|---|---|
| `docs/Msn03UniqueDoneDesign.md` | 2026-08-23 21:09:30 |
| `out/w103/msn03/current-msn03-unique-inventory.md` | 21:07:44 |
| `out/w103/msn03/shared-contract.md` | 21:08:28 |
| `out/w103/msn03/security-review.md` | 21:10:01 |
| `out/w103/msn03/code-review.md` | 21:10:29 |
| `out/w103/msn03/ui-audit.md` | 21:11:09 |

No extra files under `out/w103/msn03/` besides those five. No `docs/OwnerDecisionsWave103.md`. Git: `?? docs/Msn03UniqueDoneDesign.md` and `?? out/w103/`. `git status --short -- docs/Msn03ChainsDesign.md` empty.

### 2. Contract freeze (brief + shared-contract)

| Freeze | Where | Result |
|---|---|---|
| Digit 2 Jobs | contract §0.2; brief honor / UI | `DOCK_KEY_SERVICES[1] === 'jobs'`; Digit `d-1` at `station.js` 6021–6028 |
| Digit 0 shipyard | contract §0.2 | Digit 0 → last key `shipyard` (`6023–6025`) |
| hide ≠ delete | contract §0.6, §2 | keep unique rows; no splice; `ensureJobs` empty-reseed `2109–2112` |
| UNIQUE_JOB_KIND four ids | contract §1 | `bounty-ace`, `patrol-lane`, `haul-provisions`, `ferry-consignment` |
| no innerHTML | contract §0.8 | live `h()` `textContent`; grep `innerHTML` in `station.js` = 0 |
| no new WORLD_FIELDS | contract §0.5 | unique stay in `jobs` (`save.js` 79) |
| no invented UU | contract §0.9; inventory §3 | live 2500 / 300+5 / haul quote / 350 |
| uniqueRetry leftover | contract §0.1, §4 | unreachable after hide; source stays |
| serial named only | contract §0, §6 | PR1 hide / PR2 pins; Wave 103 no `src/` |
| no memorial / no new Digit | contract §0.1, §3 | explicit |

Merge law: contract wins if brief disagrees. No conflict found.

### 3. Inventory spot-check vs live code

| Claim | Live | Verdict |
|---|---|---|
| `UNIQUE_JOB_KIND` four ids `save.js` 152–157 | 152–157 exact map | OK |
| `uniqueJobId` `Object.hasOwn` 289–291 | `function uniqueJobId` 289–291; **not** exported | OK |
| `JOB_STATES` includes `done` 151 | 151 | OK |
| `WORLD_FIELDS` `'jobs'` 79 | `'jobs'` on line 79; array 76–101 | OK |
| Drop unique never 806–831 | every `dropJobsUntilCap` keeps `uniqueJobId` | OK |
| Overlay unique bounty 476–484 | overlay needs `system`; unique may copy | OK |
| Cap `4 + 14*N + 16 + 7` 126–138 | 4 + 7×2×N + 16 + CHAIN_ROOM 7 | OK |
| `makeJobs` / `ensureJobs` 2074–2112 | four rows; empty reseed | OK |
| `completeJob` done, no splice 3707–3720 | sets `done` only | OK |
| Chain hide `boardJobs` 3616 | `if (j.kind === 'chain' && j.state === 'done') continue;` | OK |
| Unique hide absent 3603–3628 | no unique-id skip | OK |
| uniqueRetry 5206–5208 | DONE haul/ferry Accept | OK |
| Ferry DONE reset 4687–4692 | `state = 'offered'`; clear origin/dest/`payQuoted` | OK |
| Digit accept offered-only 6082–6084 | `job.state === 'offered'` | OK |
| Digit 2 / 0 185, 6023–6028 | keys + Digit 0 last | OK |
| `h()` textContent 4350–4354 | 4350–4354 | OK |
| overlay wipe 5872 | `overlay.textContent = ''` | OK |
| `innerHTML` station.js | 0 matches | OK |
| `grantChainSku` 3481 vs unique complete 4199–4252 | unique paths do not call it | OK |
| `CHAIN_GRANT` dart/auto `jobs-chains.js` 27–33 | 28–33 | OK |
| Patrol 300 / +5 202–204 | 202–204 | OK |
| Ferry 350 / haul seed 0 | 207–208, 2093–2098 | OK |
| Ace default 2500 | `DEFAULT_ACE_BOUNTY` 219 | OK |
| HUD hub 80 px `hud.css` 184–189 | `.rw-reticle` 80×80 | OK |
| HUD reads `hullKind` `hud.js` 80–87 | reads `p.hullKind`; no write | OK |
| WAVE26 re-offer `boot-test.mjs` 5933 | mutates ferry to `'offered'` then Digit 2 at 5954 | OK |
| Chains leftover wording | `Msn03ChainsDesign.md` L187 | OK |

`station.js` does not import `uniqueJobId`. Board hide can use the four exact id strings (contract §1).

### 4. uniqueRetry leftover

Documented as live contradiction (haul/ferry DONE still Accept; ferry reset). Deputize: hide makes the button unreachable; do **not** rewrite `acceptJob`; do **not** “fix” WAVE26/WAVE35. `src/systems/station.js` uniqueRetry at 5206–5208 still present. Not silently fixed.

### 5. Serial PR plan

Named only in brief §8 and contract §6. No hide skip in live `boardJobs`. No `src/` from this worker.

### 6. Forbidden docs

- `docs/OwnerDecisionsWave103.md`: absent.
- `docs/Msn03ChainsDesign.md`: git clean; last write 2026-08-21.
- `docs/PLAYER-EXPERIENCE-WISHLIST.md` / `PROGRESS.md`: dirty in git, last write 20:30 (before this worker). No Wave 103 unique-DONE insert in those files from this pack.

### 7. Nits (not bugs)

A few cite backticks are extra (`5303`)` in the brief; `5206–5208`` in the contract; `3616`` in ui-audit). Claims still point at the right lines.

## Report

```
## Status
CLEAN

## What I tested
Write-set isolation by timestamp vs claimed six markdown files. Contract freeze (Digit 2 Jobs, Digit 0 shipyard, hide ≠ delete, UNIQUE_JOB_KIND four ids, no innerHTML, no new WORLD_FIELDS, no invented UU). Inventory cites vs live save.js / station.js / jobs-chains.js / hud.js / hud.css / boot-test.mjs. uniqueRetry leftover still in src. Serial PR named only. Forbidden docs not written by this worker.

## Bugs found
None.

## Environmental issues
Sibling-wave dirty tree (src/scripts/public/PROGRESS/wishlist). Not this worker. Graph resolve returned unrelated Activar capture workflow; ignored.

## Evidence
Worker files 21:07–21:11 2026-08-23. UNIQUE_JOB_KIND save.js 152–157. uniqueJobId Object.hasOwn 289–291. jobs WORLD_FIELDS 79. boardJobs chain done skip station.js 3616. uniqueRetry 5206–5208. Digit 0 shipyard 6023–6025. Digit jobs accept offered 6082–6084. innerHTML station.js = 0. OwnerDecisionsWave103.md absent. Msn03ChainsDesign.md git clean.
```
