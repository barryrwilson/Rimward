# Code Review: Wave 122 remaining TGT leftover (design pack)

**Scope:** `docs/Tgt06RemainingTgtDesign.md`, `out/w122/tgtrest/current-tgt-remaining-inventory.md`, `out/w122/tgtrest/shared-contract.md`. No `src/` diff.  
**Personas:** `reviewer.md` + orchestrator `code-review.md`.  
**Date:** 2026-08-25. Second pass after inventory §8 false-hole list (WAVE99 pin name, duplicate dart const).

## Code Review: Tgt06 remaining TGT leftover

### Summary

Pack matches the owner census: leftover **CONSUME**, named serial **none**, name **no remaining TGT leftover.** Live cites match `hud.js` / `controls.js` / `combat.js` / `npc.js` / helpers at Wave 122. Contract wins vs the brief. Named TGT docs are cite-only. No Blocker or Major.

### What's done well

- Inventory §0 verdict table maps every TGT-03 candidate bullet to LIVE or standing omit.
- Named slices TGT-01…05 have file:line cites, not wishful status.
- MERGE LAW forbids PPI, incoming gauge, second live region, salvage kind, Digit steal, persist, `state.js` write.
- Serial table names **PR1 remaining TGT** as **does not exist** — same CONSUME pattern as `docs/Hud05RemainingFeedbackDesign.md` / `docs/Exp04RemainingDockDesign.md`.
- Honor list matches the worker brief (empty hub, Digit 0/8/9, KeyT/V/K/X, gauges off, kit omit).
- False-hole section stops a later worker from treating WAVE99 boot-block title or Wave 82 salvage omit as REAL.

### Findings

None open at Blocker / Major.

#### 🟡 Minor: WAVE99 boot-test block is turrets, not radar

**Location:** `scripts/boot-test.mjs` 20926 (live, cite); inventory §3.5 / §8  
**Issue:** Radar jump-park has no dedicated WAVE99 console tag; park is `contactsGate` + WAVE F dock hide.  
**Fix:** Inventory already records this as **not leftover**. Do not add a PPI pin.  
**Status:** documented — resolved as census note, not a pack defect.

#### 💡 Suggestion: Do not add a probe this wave

**Location:** contract §3 PR-census  
**Issue:** CONSUME leftover does not need `out/w122/tgtrest/probe.mjs`.  
**Fix:** Keep markdown-only.  
**Status:** already frozen (no probe in write-set).

### Verdict

**Approve CONSUME freeze.** No Blocker. No Major.

Correctness: live lead/RANGE, MATCH, `.rw-contacts`, `.rw-edge-arrow`, Incoming fire./dart., CLOS, KeyK ENGINE, `auto`, NPC darts/turrets, KeyV cone 12 match boot pins WAVE F / 70 / 71 / 74 / 82 / 83 / 98–102 (read, not run).

Maintainability: contract §0 says this file wins on conflict with the brief. Deputize copies match.

Test coverage: none required (no `src/`). Did not run `npm run test:boot`. Did not “fix” known FAILs.
