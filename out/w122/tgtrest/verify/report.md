# Wave 122 remaining TGT leftover — verify

## Status
CLEAN

## What I tested

Verifier only. File reads. No Vite. No Chrome. No `npm run test:boot`. No `src/` or `docs/` edits.

1. `graph_resolve` (task_description: verify Wave 122 remaining TGT leftover CONSUME freeze; agent_id: codex/agent-codex) → `proceed_unmodeled` (`r-mt91dmm3-99aec954`). Did not `graph_approve`. Did not `graph_propose`.
2. Brief, inventory, shared-contract leftover field: all three say leftover **CONSUME**, named serial **none**, name **no remaining TGT leftover.** No fork. Contract still wins if they later disagree.
3. Worker write-set (git status, those paths): markdown only. `docs/Tgt06RemainingTgtDesign.md` + `out/w122/tgtrest/*.md`. No `src/`. No `scripts/`. No wishlist. No `PROGRESS.md`. No `docs/OwnerDecisionsWave122.md`. Sibling `out/w122/navrest/**` and `out/w122/represt/**` exist as other leftover packs; this pack did not write TGT census into them.
4. Spot-check live cites vs `src/` (1-based). Named TGT-01…TGT-05 surfaces still exist.
5. Standing omit vs code: no PPI / `.rw-ppi` under `src/`; no salvage/cargo/anomaly `lockKind`; RANGE is a reticle pop, hub stays 80 px; incoming **gauge** still absent (boot pins `inboundGauge === false`; toast strings live).

## Bugs found

None. CONSUME does not hide a remaining player-facing TGT hole.

Wishlist TGT-03 candidate names (`docs/PLAYER-EXPERIENCE-WISHLIST.md` 699–707) still list radar / arrows / attacker warnings / DIST+CLOS / missile warnings / subsystem / improved lead. Code already ships those jobs or the owner omitted extra chrome (hub PPI, aim-glass gauges, incoming gauge). TGT-05 salvage/cargo/anomaly words stay Wave 82 omit; live `lockKind` allowlist is station / gate / pod / landmark.

## Environmental issues

None. Domain data. Browser coverage not required. Did not start a process.

## Evidence

### Leftover freeze (no fork)

| File | Leftover | Named serial |
|---|---|---|
| `docs/Tgt06RemainingTgtDesign.md` Status row | CONSUME | none |
| `out/w122/tgtrest/current-tgt-remaining-inventory.md` §0 / §9 | CONSUME | none |
| `out/w122/tgtrest/shared-contract.md` header + serial table | CONSUME; PR1 remaining TGT does not exist | none |

### Write-set

See `out/w122/tgtrest/verify/write-set.txt`.

`git status --short` on `src`, `scripts`, wishlist, `PROGRESS.md`, named Tgt03/Tgt05/Npc/Owner honor docs: empty. Worker pack files are untracked markdown.

No `out/w122/tgtrest/probe.mjs`.

### Live cites (file reads)

| Claim | Live |
|---|---|
| Lead + LEAD | `hud.js` 813–815 `.rw-lead` |
| RANGE pop | `hud.js` 781, 1457–1468; `hud.css` 207–219 |
| TOF / `LEAD_MIN_SPEED` | `hud.js` 71, 1387–1407 |
| MATCH lamp + KeyX | `hud.js` 356, 1896–1900; `controls.js` 44, 308–309 |
| Contacts arc | `hud.js` 876–906 `.rw-contacts`; `hud.css` 787–796 bottom 5.5% |
| Jump/dock park | `contacts-gate.js` 18–19; `hud.js` 1497–1501 |
| Edge arrow | `hud.js` 816–817, 1418–1420; `hud.css` 575–594 |
| Incoming dart. / fire. | `npc-fire-toast.js` 8–11, 47–64; `hud.js` 14, 649–654 |
| DIST + CLOS | `hud.js` 291–296, 937–942, 2143–2151 |
| KeyK ENGINE | `controls.js` 317–318; `subsys-aim.js` 5–35; `hud.js` 934, 2156–2162 |
| Player `auto` | `weapon-fit.js` 47–53; `combat.js` 1372–1390 |
| NPC dart | `npc.js` 1679–1681, 2063–2065 |
| NPC turret vsPlayer / vsNPC | `npc.js` 1207–1235; `combat.js` 1916–1929 |
| KeyT / KeyV / lockKind | `controls.js` 85–114, 120–123, 296–297, 311–312, 452; `reticle-aim.js` 15, 279–310, 321 |
| Empty hub 80 px | `hud.css` 184–193; `hud.js` 1293 `cx - 44` |
| Digit 0 shipyard | `station.js` 188 last service, 6034–6037 hot 0, 6171–6173 |
| `innerHTML` in `hud.js` | grep 0; copy via `textContent` / `el()` |
| PPI under `src/` | grep 0 |
| Incoming gauge | WAVE83/98 `inboundGauge` false; no gauge class in HUD |
| WORLD_FIELDS targeting extra | `save.js` 77–101: scanner/turret hangar only; no CLOS/part/MATCH |

### CONSUME vs remaining hole

Named slices TGT-01…TGT-05 are live. Remaining wishlist bullets map to those instruments or to standing omit. Do not invent TGT-06 PR1.

Documented non-holes (already in inventory §8 / code-review Minor): WAVE99 boot block titled TURRETS not RADAR; duplicate `INCOMING_DART_TOAST` const in `hud.js` 67 vs helper export. Not player-facing leftover.

### Graph

`proceed_unmodeled`. Mandatory false. No active workflow.
