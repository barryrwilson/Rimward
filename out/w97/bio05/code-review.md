## Code Review: BIO-05 Wave 97 owner close

### Summary
Design-doc review of the Wave 97 owner file, Bio05 status bump, and merge-law contract against live graft law and the Wave 96 inventory. Code wins. No Blocker or Major remaining. Remaining BIO-05 §2.1–2.4 is bound (NPC off, plated omit, no badge, no ungraft). No `src/` in this write-set.

Persona: `C:\Users\barry\.grok\bundled\skills\shared\personas\reviewer.md` plus orchestrator `C:\Users\barry\.grok\skills\orchestrator\references\code-review.md`. Markdown only. Do not edit product `src/`.

### What's done well

- Owner file matches Wave 93 shape: Title / Author / Date / Status / Wave / Predecessor.
- Integers copy Wave 82 / Wave 96: graft **4000**, hostility cap **−10**, kill **−5**, destroy-Abomination Beautiful **+5**. No new UU or standing.
- §2.1 NPC traffic **off**. Kill helper stays. Live grep: `src/systems/npc.js` 0 `grafted`; `src/game/traffic.js` 0 `grafted`; `createShipState` does not copy the flag.
- §2.2 overlay **omit**; plated GLB; `makeLivingHull` not replaced; HUD mech.
- §2.3 badge **omit**. Digit 9 + live Gilded warn restated, not rewritten.
- §2.4 ungraft **forbidden**. No `state.js` SKU.
- Player graft loop **closed**. Inventory still documents live Wave 72 / 82 helpers.
- Bio05 status no longer waits on an owner line. It cites Wave 97 close.
- PR1 optional, PR2 skipped, PR3 skipped until a **successor** owner file. Wave 97 schedules no BIO-05 `src/` PRs.
- Persist hangar-row only. `innerHTML` forbidden. Digit 0 shipyard. HUD never writes `hullKind`.

### Findings

#### 🔴 Blocker

None remaining.

#### 🟠 Major (fixed in freeze)

##### C1: Remaining still waiting on an owner line

**Location:** `docs/Bio05AbominationsDesign.md` status / Open questions (Wave 96 text)  
**Issue:** Wave 96 left §2.1–2.4 owner-open. A later serial that still waited would re-ask NPC spawn.  
**Fix applied:** Status = remaining closed by Wave 97 (NPC off, plated, no badge, no ungraft). Open questions: none. Owner file + contract §2 bind the answers.

##### C2: Re-opening Wave 72 as if grafts were absent

**Location:** task; `docs/BioLivingShipsDesign.md` §7 stale “later”  
**Issue:** An owner close that specified a new graft allowlist would fight shipped `graftMounted`.  
**Fix applied:** Player loop stays closed. Inventory table still cites live hangar / desk / kill helper. Living-ships not edited.

##### C3: Invented UU or a second standing delta

**Location:** wishlist “friend standing”; Living-ships §7 “do not invent”  
**Issue:** Picking +10 or a new graft price would fight Wave 82.  
**Fix applied:** Owner file copies 4000 / −10 / −5 / +5. Contract §0.8. No new SKU.

##### C4: `src/` scheduled in Wave 97 or NPC `grafted` spawn added

**Location:** orchestrator write-set  
**Issue:** This wave is markdown only. Adding NPC `grafted` would invent world look.  
**Fix applied:** Contract §0.1 / §5. PR3 skipped. Live grep still 0 hits. This worker did not edit `src/`.

#### 🟡 Minor

##### C5: Wave 96 inventory still labels NPC / overlay / badge OPEN

**Location:** `out/w96/bio05/current-bio05-inventory.md` §13  
**Issue:** That pack is the live-code cite and was not rewritten (correct: do not pretend grafts are absent, and do not edit Wave 96 leftover status in place). A later reader of w96 §13 alone could miss the Wave 97 close.  
**Fix (accepted):** `out/w97/bio05/current-bio05-inventory.md` is a pointer plus grep. Bio05 and the Wave 97 contract supersede leftover status. Do not mutate the Wave 96 inventory table.

##### C6: Scratch contract claims merge-law win over the owner file

**Location:** `docs/OwnerDecisionsWave97.md` integrator freeze; `out/w97/bio05/shared-contract.md` header  
**Issue:** Unusual for an owner file. Task required contract-wins for the owner file + Bio05 status bump.  
**Fix (accepted):** Keep the task rule. Successor owner files may override numbers; this scratch must not invent them.

#### 💡 Suggestion

##### C7: Optional PR1 pins if a later wave touches hangar.js

Re-assert living drop, Unknowables drop, cap, 4000 UU, HUD no-write. Skip if hangar.js is not in that wave’s write-set. Not scheduled in Wave 97.

### Recheck (after Bio05 status bump)

`docs/Bio05AbominationsDesign.md` status cites Wave 97 close. §2 leftover is closed (NPC off, plated omit, badge omit, ungraft forbidden). Open questions none. Owner file § Closed this wave matches the decision table. Live copy in contract §1.2 still matches `shipyard-desk.js` 52–69. No new Blocker/Major.

### Verdict

Owner close binds remaining BIO-05. Merge law wins over the brief. No Wave 97 BIO-05 `src/` PRs. Player graft loop stays closed.
