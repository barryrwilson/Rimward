# Wave 122 tgtrest — notes

**Status:** leftover **CONSUME**. Named serial: **none**. Name: **no remaining TGT leftover.**  
**Write-set:** `docs/Tgt06RemainingTgtDesign.md`, `out/w122/tgtrest/**` only.  
**No `src/`.**

## Graph

`graph_resolve` → `proceed_unmodeled` (resolution_id `r-mt90uzqf-1a3f90f6`). Draft workflows none. Did **not** `graph_approve` or `graph_propose`.

## Census (code wins)

Named slices **live**:

- TGT-01 lead + RANGE — `hud.js` 813–815, 1387–1468
- TGT-02 MATCH + KeyX — `controls.js` 308–309; lamp `hud.js` 356, 1896
- TGT-03 arc — `.rw-contacts` `hud.js` 876, 1497; WAVE F pin
- TGT-03 awareness — Incoming fire. `npc-fire-toast.js`; `.rw-edge-arrow` park 1418–1420; WAVE98
- TGT-03 radar jump-park — `contacts-gate.js` 18–19; no PPI under `src/`
- TGT-03 CLOS — `hud.js` 937–942; WAVE102
- TGT-03 KeyK ENGINE — `subsys-aim.js`; WAVE100
- TGT-04 `auto` + NPC darts + turret vsPlayer/vsNPC — `weapon-fit.js` 47; `npc.js` 1207–1235; WAVE83/99/101
- TGT-05 KeyV + cats cone 12 — `reticle-aim.js` 15, 279–310; WAVE74/82

Wishlist TGT-03 candidate bullets map to those instruments or standing omit (PPI, aim-glass gauges, incoming **gauge**). Salvage kind is Wave 82 omit.

## Why CONSUME

Owner test: remaining leftover already gone; remaining wishlist bullets live or owner-omitted. Both hold.

Do **not** invent TGT-06 PR1 for a hub PPI, a second incoming live region, or salvage `lockKind`.

## WAVE99 boot-block name

`scripts/boot-test.mjs` WAVE99 block is **NPC turrets**. Jump-park lives in `contacts-gate.js` + WAVE F dock hide. That naming split is **not** a player-facing hole.

## Did not touch

`src/**`, `scripts/**`, wishlist, `PROGRESS.md`, `docs/Tgt03*.md`, `docs/Tgt05*.md`, `docs/Npc*.md`, `docs/OwnerDecisions*`, Hud/Nav/Rep leftover docs, `out/w122/navrest/**`, `out/w122/represt/**`, `out/w121/**`, `out/w102/**`–`out/w98/**`.

No Vite. No Chrome. No ports. No `docs/OwnerDecisionsWave122.md`. No `npm run test:boot`.

## Siblings

- HUD-02 `classKeyToken` cite only.
- HUD-04 toast cite only.
- NAV-07 / overlay cite only.

## Reviews

Security: Low, 0 HIGH/CRITICAL (second pass).  
Code: Approve CONSUME, 0 Blocker/Major.  
UI: self-applied checklist, 0 Blocker/Major; documented non-leftover minors (contacts/edge `aria-hidden`, banner not this pack).
