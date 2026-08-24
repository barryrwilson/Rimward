# Wave 98 NPC turrets verify

**Date:** 2026-08-23  
**Domain:** data (markdown owner close). No Vite. No Playwright. No `src/` edits.  
**Result:** CLEAN

Graph resolve (`codex/agent-codex`) returned `blocked_ambiguous` on unrelated Activar PR workflows (coverage ~0.09). This verify used the parent task list. No graph write.

## Write-set

Worker (untracked):

- `docs/OwnerDecisionsWave98.md`
- `docs/NpcTurretsDesign.md`
- `out/w98/turrets/current-npc-turrets-inventory.md`
- `out/w98/turrets/shared-contract.md`
- `out/w98/turrets/security-review.md`
- `out/w98/turrets/code-review.md`
- `out/w98/turrets/ui-audit.md`

Extra (not in the parent write-list): `out/w98/turrets/designer-audit.md` (independent designer pass).

No worker path under `src/`. Dirty `src/` is sibling work (TGT-03 `npc-fire-toast.js`, radar/nav/BIO, hangar). Do not blame this worker.

Grep `weapon: 'turret'` in `src/` → 0 matches. Live `npcFire` sites remain cannon/missile only (`npc.js` 1545–1548, 1921–1923).

## Q1 / Q2

Owner file + contract agree.

**Q1:** class-gated `heavy` / `ace` / `frigate` **and** already-hostile (`mayHuntPlayer`). Not trader, miner, cutter-pirate, Unknowable, Beautiful-as-faction. Seat 0 never. Wave 97 default-off is replaced for a later serial. Wave 98 does not emit.

**Q2:** first slice vsPlayer only. Explicit `target: 'player'`. Missing target **drops**. vs already-hostile NPC later.

`docs/NpcTurretsDesign.md` names `docs/OwnerDecisionsWave98.md`. Status: Q1/Q2 closed on paper. Does not claim fire shipped. Repeat: live `src/` still has zero turret `npcFire`.

Serial PR1–PR3 are **later**. Not scheduled into `src/` in this wave.

## Live cites (code wins)

| Claim | Live | Verdict |
|---|---|---|
| `MOUNT_TABLE.turret` 0/0/0/2/1/4 | `state.js` 66–72 | match |
| `WEAPONS.turret` dmg 4, rof 3, spd 800, rng 380, heat 2, energy | `state.js` 135–138 | match |
| Unknown class → light (seat 0) | `weapon-fit.js` 56–61 | match |
| `mayHuntPlayer` civilian never; patrol standing ≤ −10 or player scratch; pirate/ace | `npc.js` 1079–1091; `HOSTILE_STANDING` −10 at 92 | match (cite of live, not invented) |
| Dart gate pirate+ace, not Unknowable | `npc.js` 1093–1100 | match; missiles Q1 stay closed |
| Hunt/duel cannon sets `target`; ace omit `target` | `npc.js` 1547, 1923 | match |
| Dart emit `target: 'player'` | `npc.js` 1545, 1921 | match |
| `spawnNpcShot` refuses missile/psionic; would accept turret | `combat.js` 1298–1320 | match |
| Ace omit aims player | `combat.js` 1787–1791 | match |
| Wave 57 split | `combat.js` 1848–1851 | match |
| Unknowable non-beam miss | `state.js` 197–199 | match |
| Player turret cap 2, no `fromPlayer` filter | `combat.js` 174, 1245–1250 | match |
| Hangar `healTurret` / world mirror | `hangar.js` 61–64, 233, 458, 523, 637, 684 | match (Wave 98 re-grep; Wave 97 `271` gone) |
| Digit 0 shipyard | `station.js` 186, 5917–5922 | match |
| Digit 8/9 player papers | `station.js` 1684–1727, 5392–5448 | match |
| `WORLD_FIELDS` player turret mirror | `save.js` 96 | match |
| Patrol spawn `heavy`; pirate `cutter`; miner light/cutter; ace `ace`; no frigate in loop | `src/game/world.js` 338–419 | match (`world.js` is `src/game/world.js`) |
| Song: turret would reuse cannon bark | `song.js` 68, 423 | match |
| PHY lookahead 40 / 1.4 | `physics.js` 19–20 | match |
| Chaff | grep `src/**/*.js` 0 | match |
| `innerHTML` in hud/combat/npc | 0 | match |
| Chain grant `auto` on player | `jobs-chains.js` 27–32 | match |

HUD line numbers in the Wave 98 inventory **copy Wave 97** (`hud.js` 61–62, 323–349, 567–571, 837–838, 1122–1124, 1185). Live working tree: dart const 62–63; WPN row 840–842; `playerHit` 1131–1134; 80 px hub 1194. Facts still true. Sibling HUD inserts (`npc-fire-toast.js`, nav, automine) shifted lines. Not a Q1/Q2 defect.

## Frozen gates

- No invented UU / standing delta / fire percent. Cadence is a named pin `1 / (WEAPONS.turret.rof * 0.5)`, not a dice. NPC live cap **4** is a copy pin, not live code.
- No new HUD widget. No turret toast. FORE/AFT stays `playerHit`.
- Digit 0 / 8 / 9 player-only. No hangar NPC rack key. No new `WORLD_FIELDS`.
- NPC missiles Q1/Q2 not reopened (`docs/NpcMissilesDesign.md` not in this write-set). Toast `Incoming dart.` stays missile-only in this pack.
- `Incoming fire.` is sibling TGT-03 (`src/game/npc-fire-toast.js`). Worker did not own it. Contract forbids designing it here. Inventory row “cannon toast none” is stale vs sibling HUD; ignore per brief.

## Processes

This verifier started no Vite and no Chrome. Did not bind 5173 / 4173 / 3000. Host already had `127.0.0.1:9222` LISTENING (pid 13036). Left it.

## Not bugs

- `docs/NpcTurretsDesign.md` Security still links `out/w97/turrets/security-review.md`. Wave 98 also wrote `out/w98/turrets/security-review.md`. Pointer is old, not a gate miss.
- Dirty `PROGRESS.md` / wishlist still say Wave 97 default-off. Worker must not edit those files.
- `designer-audit.md` is extra review, not `src/`.
