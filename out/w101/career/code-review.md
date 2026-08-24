## Code Review: BIO-02 remaining career branches (Wave 101)

### Summary
Design-doc review of `docs/Bio02CareerDesign.md` and merge-law contract against **today’s** hangar / shipyard / `SHIP_CLASSES` / Digit map. Code wins. No Blocker or Major remaining. Remaining careers are skins + live outfitter. No `src/` in this write-set.

Persona: `C:\Users\barry\.grok\bundled\skills\shared\personas\reviewer.md` plus orchestrator `C:\Users\barry\.grok\skills\orchestrator\references\code-review.md`. Markdown only. Do not edit product `src/`. Cites checked against live files on 2026-08-23.

### What's done well

- Header matches RIMWARD brief shape (Title / Author Wave 101 / Date / Status design-only / Merge law / Honor).
- Overview states first impl is **DONE**; remainder is careers only.
- Inventory cites live `LIVING_STOCK` six keys (`shipyard.js` 29), `livingTrainDests` (`shipyard.js` 33–43), `SHIP_CLASSES` (`state.js` 37–44), Digit 0 (`station.js` 186, 5920–5922), papers (`shipyard-desk.js` 376–394), `yardPrice` / `trainListPrice` (`shipyard.js` 110–126), persist (`save.js` 76–101).
- Wave 86 dest=`heavy` / buy-omit comments are called **stale**. Ace/freighter train documented as **DONE ladder**.
- Careers do not mint keys. Kit mutate **omit**. Labels optional. Prices copy live rungs.
- Digit 0, no new persist, HUD never writes `hullKind`, `innerHTML` forbidden.
- Wave 97 graft fence restated, not reopened.
- `docs/Bio02EvolutionDesign.md` not edited.

### Findings

#### 🔴 Blocker

None remaining.

#### 🟠 Major (fixed in freeze)

##### C1: Invent six career `SHIP_CLASSES` keys

**Location:** wishlist ~1236–1239; live `state.js` 37–44  
**Issue:** A remainder brief that authored `mining` / `stealth` / … keys would fight READ-ONLY catalog.  
**Fix applied:** Contract §0.3 / §2.1 maps each wishlist name onto an existing key. Acceptance forbids those tokens as keys.

##### C2: Stale buy-omit as live law (or omit-restore)

**Location:** `docs/Bio02EvolutionDesign.md` inventory row still says Beautiful stock omits frigate; live `shipyard.js` 29  
**Issue:** Remaining work that “keeps omit” by stripping `LIVING_STOCK` would undo Wave 94. Remaining work that cites omit as today would lie.  
**Fix applied:** Inventory §4 records buy **in**. Contract §0.4 freezes the six-key list. Do not append. Do not strip.

##### C3: Ace / freighter as a new train verb

**Location:** live `livingTrainDests`; Wave 86 first-impl “no ace dest”  
**Issue:** Re-staging ace/freighter train would duplicate `trainMounted`.  
**Fix applied:** Documented as DONE ladder. Career serial does not add `trainMountedCareer`.

##### C4: Digit steal / new persist / innerHTML / HUD write

**Location:** `station.js` 5920–5922; `save.js` 94; `hud.js` 80–88  
**Issue:** Career Digit 0 or `WORLD_FIELDS.career` would smash dock and persist law.  
**Fix applied:** Contract §0.6–0.9. Kit mutate omit. PR1 copy only.

##### C5: Parse career word as dest / bind `HAIR_CAREER`

**Location:** `shipyard-desk.js` 261–266; `hud.js` 101  
**Issue:** Confirm must keep dest keys. HUD inset 18 is not BIO-02.  
**Fix applied:** Contract §2.3 and forbidden table.

#### 🟡 Minor

##### C6: `TRAIN_HEAVY_NOTE` still exported

**Location:** `shipyard-desk.js` 94; `trainPaint` unused  
**Issue:** Dead copy could be revived as dest-stop law.  
**Fix (accepted):** Inventory + contract forbid revival. No `src/` this wave.

##### C7: Living silhouette only special-cases `cutter` / `heavy`

**Location:** `ship.js` 259–263  
**Issue:** Ace / freighter / frigate remounts keep identity silhouette. Career labels will not magically sculpt them.  
**Fix (accepted):** Preserve `makeLivingHull`. BIO-03 is out. Not a career serial.

#### 💡 Suggestion

Cite `writeMountedGear` (`hangar.js` 483–518) if a successor opens kit mutate. Already in contract §2.2.

### Recheck

Cites match live line numbers sampled 2026-08-23. No invented class keys in the brief. No `src/` in the write-set. No Blocker / Major remaining.
