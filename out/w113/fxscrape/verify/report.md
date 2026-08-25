# Wave 113 FX scrape leftover brief — verify (iteration 2 re-check)

## Status
CLEAN

## What I tested
- Pack write-set vs `src/` and `scripts/` (mtime + git status). No Vite. No Chrome. No ports. No processes started.
- Live re-grep of `spawnHitFx` under `src/**/*.js`.
- Live read of `spawnHitFx` definition, two weapon callers, `bodyHit` emit, combat 1b applyHit loop, sun-heat path.
- Live read of `src/systems/hud.js` consume surfaces after iteration 2: toast, hub/RANGE, facing flash, `pushToast`, `worldEvent` copy, sysname CSS, contact-pip `lastX`.
- Pack freeze grep for stale 591–593 / 709–712 / 846–847 / 1149–1151 used **as** hull-strike / hub / facing bind.
- Contract forbids: hub pip, Digit, `state.js` write, `innerHTML`, IMPACT 8 / 0.35 retune, bounce steal, persist, extra toast, required flash map, required 80 u.
- Integrator brief merge law, cite of `docs/Fx01RemainingDesign.md`, named-only serial PR plan.
- Protected paths: `docs/Fx01RemainingDesign.md`, `docs/Phy04AvoidDesign.md`, wishlist, `PROGRESS.md`, `docs/Phy05PadHomeDesign.md`, `docs/OwnerDecisionsWave113.md`.
- Graph: first `graph_resolve` `blocked_ambiguous` (`r-mt7rxvr8-be22bda5`). Second call returned `execute_workflows` on `codex/workflow-spreadsheet-production` (`r-mt7ry6zo-205fa564`). That workflow is a spreadsheet / Google Drive path. This task is a markdown leftover check. Parent procedure is used. Spreadsheet tools are not used.

## Bugs found
None that fail leftover honesty, pack `src/`/`scripts/` writes, live HUD consume cites, merge law, named-only PR plan, or protected-doc edits.

Iteration 2 closed the stale HUD cite Major **in the pack freeze**. Inventory, contract, brief, worker ui-audit, code-review, and security-review bind toast **608–610**, hub **726–729**, facing **863** / **1127** / **1167** / **1407**. They do **not** freeze 591–593 as hull-strike toast. Mentions of 591–593 are anti-cites (`worldEvent` copy; do not bind).

Residual (not leftover fail): `out/w113/designer/fxscrape-ui-audit.md` still lists the Major as **open** against first-pass line numbers. That file is outside the pack freeze. Worker `out/w113/fxscrape/ui-audit.md` marks the same Major **fixed this pass**.

## Environmental issues
None. Domain is static data. No browser. No Vite. Dirty `src/` / `scripts/` / wishlist / `PROGRESS.md` mtimes are other waves, not this pack. `scripts/boot-test.mjs` mtime 17:55:16 overlaps this verify window; grep shows no scrape `spawnHitFx` pin. Cue list still has `bodyHit` only as an audio key.

## Evidence

### 1. Pack has no `src/` / `scripts/` writes
Worker files and mtimes (2026-08-24):

| Path | LastWriteTime |
|---|---|
| `docs/Fx01RemainingScrapeDesign.md` | 17:47:48 |
| `out/w113/fxscrape/current-fx-scrape-inventory.md` | 17:47:48 |
| `out/w113/fxscrape/shared-contract.md` | 17:47:48 |
| `out/w113/fxscrape/security-review.md` | 17:48:59 |
| `out/w113/fxscrape/code-review.md` | 17:48:59 |
| `out/w113/fxscrape/ui-audit.md` | 17:48:59 |
| `out/w113/fxscrape/notes.md` | 17:48:59 |

`src/systems/combat.js` mtime 15:15:47. `src/systems/ship.js` mtime 11:34:47. `src/systems/hud.js` mtime 17:31:20. All earlier than iteration 2 pack writes. This pack did not write those files.

Workspace git is dirty (`src/systems/combat.js`, `hud.js`, `scripts/boot-test.mjs`, wishlist, `PROGRESS.md`, …). Those diffs are other waves. Pack paths are untracked markdown only.

### 2. Inventory census still live — leftover REAL
`spawnHitFx` in `src/`:

| Role | Live |
|---|---|
| Definition | `src/systems/combat.js` 1110–1117 |
| NPC weapon caller | 1742 (`s.object`) |
| Player weapon caller | 1799 (`playerObj`) |
| Other `src/` callers | **none** |

`ctx.emit('bodyHit'` in `src/`: **one** site, `src/systems/ship.js` 935 `{ kind, speed, damage: 0 }`.

Combat 1b applyHit (`src/systems/combat.js` 1840–1856): `applyHit` family `'impact'`, fill `e.damage`, emit `playerHit`, `emitPlayerApplyHits`, gap, **no** `spawnHitFx`, **no** shielded sample, **no** park on scrape-kill.

Sun-heat 1859–1886 also `applyHit` `'impact'` with no `spawnHitFx`. Pack marks that out of leftover. Correct.

Honesty check: scrape does **not** call `spawnHitFx`. CONSUME would be a lie. Pack freeze **REAL** is honest.

### 3. HUD consume cites match live `hud.js` (iteration 2)

| Pack freeze | Live `src/systems/hud.js` |
|---|---|
| Hull-strike toast **608–610** `'▲ Hull strike.'` | `case 'bodyHit':` 608; `e.damage > 0` 609; string 610 |
| Toast write `pushToast` **1130–1150** (refresh 1133–1135) | `function pushToast` 1130–1150; same-key extend 1133–1135 |
| Hub **726–729** | `rw-reticle` 726; pupil 727; cilia 728; `RANGE` 729 |
| RANGE pop **1392–1404** | range pop block 1392–1405; `in-range` 1400–1402 |
| Facing rail **863** | `rw-combat-self` 863 |
| Declare **1127–1128** | `selfHitFlashUntil` 1127; `selfHitFlashAft` 1128 |
| Set **1167–1169** | `playerHit` 1167; assign 1168; `fromAft` 1169 |
| Apply **1407–1417** | facing glance 1407; `flashing` 1409; flash modes 1411–1417 |
| Do **not** bind 591–593 as hull-strike | 586–593 is `worldEvent` `known` copy; string at 593 is `'› Word travels — '` fallback |
| Stale 709–712 is not hub | 705–712 is injected `#hud .rw-sysname` CSS |
| Stale 846–847 is not facing | 847 is contact-pip `lastX`/`lastY` |
| `src/ui/hud.css` 184–193 | `.rw-reticle` 80×80 |

No pack freeze still points at 591–593 **as** hull-strike toast.

Grep `'▲ Hull strike.'` in `src/`: **one** site, `hud.js` 610.

### 4. Contract forbids (present, MERGE LAW)
`out/w113/fxscrape/shared-contract.md` forbids later:

- Hub pip / RANGE rewrite / punch chrome in `.rw-reticle` (§0.2)
- Digit 0/8/9 steal; no new Digit (§0.3)
- `src/game/state.js` write; no `WEAPONS.impact` (§0.5)
- `innerHTML` (§0.4)
- IMPACT retune 8 / 0.35 (§0.13; explicit-non-pick table)
- Bounce steal / proxy change (§0.12)
- New persist / `WORLD_FIELDS` / `world.hullMarks` (§0.6)
- Extra toast / extra `playerHit` / third cue (§0.2, §0.11)
- Required FX-01 flash map; required PHY-04 80 u (§0.21, §3)
- `spawnHitFx` on slide-only `speed < 8` (§0.26)

Fail closed: skip world FX; keep shake + `bodyHit` audio + HUD toast/flash; never freeze; never `speed = 0`; never skip `applyHit` (§0.19, §2).

Live copy still matches the frozen knobs: `src/game/physics.js` 11–12 (`0.35` / `8`); `AVOID_LOOKAHEAD` 40 at 19; `RIPPLE_POOL` 16 at `combat.js` 186; `innerHTML` in `combat.js` **none**; `WEAPONS.impact` in `src/` **absent**; `applyHit` unknown family `{}` at `state.js` 198.

### 5. Integrator: contract wins; PR1 named only
`docs/Fx01RemainingScrapeDesign.md` header: if brief and contract conflict, **the contract wins**.

Cites `docs/Fx01RemainingDesign.md` (“cite, do not rewrite”). That file mtime 15:16:09 is before this pack. Pack did not rewrite it.

Brief §5 and contract §3 name **PR1 scrape `spawnHitFx`**. Flash map and 80 u stay skippable. PR2 census is optional. Wave 113 does not implement. Live 1b loop has no call. Match.

### 6. Protected files
| Path | This pack |
|---|---|
| `docs/Fx01RemainingDesign.md` | untracked; mtime 15:16, not rewritten |
| `docs/Phy04AvoidDesign.md` | untracked; not rewritten this pass |
| `docs/Phy05PadHomeDesign.md` | untracked; not rewritten this pass |
| `docs/PLAYER-EXPERIENCE-WISHLIST.md` | dirty git; other wave |
| `PROGRESS.md` | dirty git; other wave |
| `docs/OwnerDecisionsWave113.md` | **absent** (grep: forbid text only) |

## Teardown
Started no processes.
