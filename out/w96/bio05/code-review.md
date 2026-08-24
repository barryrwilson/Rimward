## Code Review: BIO-05 remaining Abominations (design freeze)

### Summary
Design-doc review of inventory + merge law + integrator brief against live graft law. Code wins. First pass flagged one Major: the brief’s player-outcome section treated destroy +5 as a current world beat. That overclaim is fixed. No Blocker remains.

Persona: `C:\Users\barry\.grok\bundled\skills\shared\personas\reviewer.md` plus orchestrator `C:\Users\barry\.grok\skills\orchestrator\references\code-review.md`. Markdown only. Do not edit product `src/`.

### What's done well

- Inventory cites live file:line for helpers, cap, desk, persist, kill +5, HUD, Digit 5, NPC absence.
- Contract is merge law: no `src/` this wave, no new UU, Digit 0, no `innerHTML`, no persist key, `state.js` READ-ONLY.
- Player graft loop frozen **closed** instead of re-designed as Wave 72 absence.
- Destroy +5 points at `OwnerDecisionsWave82.md` / `kill-standing.js` 9. Recap −10 is named.
- NPC grafted default **off**. `makeLivingHull` is not replaced.
- PR2 skipped. PR3 optional only.

### Findings

#### 🔴 Blocker

None remaining.

#### 🟠 Major (fixed in freeze)

##### C1: Brief implied live world destroy-+5 traffic

**Location:** `docs/Bio05AbominationsDesign.md` §2 (first draft)  
**Issue:** Helper + recap are live (`kill-standing.js` 169–172). NPC spawn never sets `grafted` (inventory §7, §11). Calling that a current player outcome would contradict inventory DONE vs remaining.  
**Fix applied:** §2 splits **live Gilded graft** from **helper-ready destroy +5** (no NPC victims until owner opens §2.1).

##### C2: Re-opening Wave 72 as if grafts were absent

**Location:** task; `docs/BioLivingShipsDesign.md` §7 stale “later”  
**Issue:** A remaining brief that specified a new graft allowlist would fight shipped `graftMounted`.  
**Fix applied:** Contract §0.13 / §1. Inventory §13 DONE table. Honor shape only; do not edit Living-ships.

##### C3: Invented UU or a second standing delta

**Location:** wishlist “friend standing”; Living-ships §7 “do not invent”  
**Issue:** Picking +10 or a new graft price would fight Wave 82.  
**Fix applied:** Contract §0.8. Integers frozen: 4000 / −10 / −5 / +5.

##### C4: `src/` scheduled in Wave 96 or `state.js` write

**Location:** orchestrator write-set  
**Issue:** This wave is markdown only.  
**Fix applied:** Contract §0.1–0.2. PR plan says not Wave 96.

#### 🟡 Minor

##### C5: Hangar cards omit the word grafted

**Location:** `shipyard-desk.js` 397–403  
**Issue:** Player must infer Abomination from Digit 9 / mech HUD / Gilded warn.  
**Fix (accepted):** Contract §2.3 default **omit**. Not a player-loop hole.

#### 💡 Suggestion

##### C6: Optional PR1 pins if a later wave touches hangar.js

Re-assert living drop, Unknowables drop, cap, 4000 UU, HUD no-write. Skip if hangar.js is not in that wave’s write-set.

### Recheck (after C1 brief edit)

`docs/Bio05AbominationsDesign.md` §2 now labels destroy +5 **helper-ready, not current traffic**. Inventory §7 / §13, contract §1.4 / §2.1, and the brief agree. No new Blocker/Major. Live copy in contract §1.2 still matches `shipyard-desk.js` 52–69.

### Verdict

Design freeze matches live DONE vs remaining. Merge law wins. No further player graft PRs.
