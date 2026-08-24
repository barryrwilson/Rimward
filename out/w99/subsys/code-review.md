# Code Review: TGT-03 remaining subsystem targeting (Wave 99 design-doc)

**Scope:** `docs/Tgt03SubsystemDesign.md`, `out/w99/subsys/shared-contract.md`, `out/w99/subsys/current-tgt03-subsystem-inventory.md`. No `src/` in this worker.  
**Persona:** `reviewer.md` + `orchestrator/references/code-review.md`.  
**Pass:** 1 after inventory cites checked against live files.

### Summary

The pack is internally consistent. The contract wins on Digit 9 dock = **epics** (code) vs a stale “Standing” comment. Fail-closed retarget matches the missing owner numbers. No Blocker or Major remains.

### What's done well
- Inventory cites live `applyHit`, facet call sites, rails, Digit table, and `lockKind` allowlist.
- Taxonomy reuses screen/shell/engine/hull instead of inventing FTL rooms.
- Serial is named (`TGT-03 remaining subsystem targeting serial`) and explicitly not scheduled into `src/` this wave.
- HUD-01 empty 80 px hub is repeated in contract §0.2, brief title table, and UI freeze.
- Sibling radar/awareness/turret paths are out of the write-set.

### Findings

#### 🔴 Blocker: none

#### 🟠 Major: none

#### 🟡 Minor: Dock Digit 9 comment vs array
**Location:** `src/systems/station.js:1622–1623` vs `station.js:186, 5918–5926`; inventory §6; contract §0.6  
**Issue:** Comment says Digit 9 dock root is Standing. Live `DOCK_KEY_SERVICES[8]` is `epics`. Chart hover uses “Digit 9 standing” as **copy** (`galaxychart.js:29`).  
**Fix:** Already frozen: code wins; do not steal either bind; do not “fix” the comment in this wave. Later impl greps the array, not the comment.

#### 💡 Suggestion: PR2 bar emphasis is optional
**Location:** contract §8 PR2; brief Serial PR plan  
**Issue:** If PR1 already matches live peel, PR2 is polish. A later worker could treat PR2 as mandatory UI.  
**Fix:** Contract already says the serial may stop after no src change or PR2 only. Keep that sentence.

### Contract vs brief (must match)

| Freeze | Contract | Brief | Match |
|---|---|---|---|
| Empty 80 px hub | §0.2, §6 | Honor + §1 table | Yes |
| HUD never writes hullKind | §0.3 | Honor + inventory | Yes |
| state.js READ-ONLY / no invented table | §0.4 | Overview + §1 | Yes |
| No WORLD_FIELDS / localStorage | §0.5 | Goals 5 | Yes |
| Digit 0/8/9 | §0.6 | Inventory table | Yes |
| KeyT/KeyV / cone 12 | §0.7 | Honor | Yes |
| innerHTML | §0.8 | Acceptance 6 | Yes |
| Do not reopen TGT-01/02, radar, missiles, turrets, power, incoming gauge | §0.9 | Non-goals | Yes |
| No UU / standing / SKU | §0.10 | Open Q3 | Yes |
| Fail-closed retarget | §0.14, §8 PR3 | Overview + PR3 | Yes |
| Serial named, not this wave | §0.1, §8 | Serial PR plan | Yes |
| WAVE4/26/35 | §0.13 | Risks table | Yes |

### Live cite spot-check
- `LOCK_CONE_PX = 12` at `reticle-aim.js:15`
- Hub clamp `cx - 44` at `hud.js:1194`
- `applyHit` peel at `state.js:209–231`
- Digit 0 shipyard at `station.js:5920–5922`
- `Incoming fire.` at `npc-fire-toast.js:8, 53–58`
- `hud.js` innerHTML: 0 hits
- `ctx.targets` has no part field at `ctx.js:191–195`

Verdict: **accept** as design-only freeze.
