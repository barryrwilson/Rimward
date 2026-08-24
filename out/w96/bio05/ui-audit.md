## UI Audit: BIO-05 Gilded graft papers (design freeze)

### Summary
Proposed desk/warn copy is **keep live Gilded papers**. No new dock Digit, no new HUD rail, no hangar grafted badge. Reduced-motion already shortens the warn. No Blocker or Major remaining.

Persona: orchestrator `C:\Users\barry\.grok\skills\orchestrator\references\ui-audit.md`. Proposed desk/HUD copy is UI. Markdown only. Do not edit product UI. Nested subagents forbidden.

### What's done well

- Graft already uses the yard two-step pattern: Offer → Confirm / Esc (`shipyard-desk.js` 360–418). Same Hangar pane as hull mounts.
- Warn is on the **confirm** row, not only in Digit 9 notes. Hostility is not silent (`GRAFT_WARN` 67–68).
- Reduced motion swaps to `GRAFT_WARN_REDUCED` (`shipyard-desk.js` 361–365) without extra animation.
- Success `Tissue sealed to the hull.` is a notice, not a blocking modal.
- Refuse lines are short and specific (`GRAFT_REFUSE_LINES` 52–65). Living/Unknowables share `Grafts fit plated hulls only.` Hostile Gilded is `No sale.` (same grammar as yard buy).
- Graft is a Hangar **button**, not Digit 0–9 theft. Dock Digit 0 stays Shipyard.
- HUD grafted built stays **mech**. Digit 5 uses existing WPN `5 · name` / `5 · —`. Aim glass stays empty (HUD-01).
- `h()` / `el()` `textContent` only. Color is not the only hostility cue (Digit 9 notes + warn sentence + patrol hunt at −10).

### Findings

#### 🔴 Blocker

None remaining.

#### 🟠 Major (fixed in freeze)

##### U1: New warn copy that fights live papers

**Location:** live `shipyard-desk.js` 67–69, 363–365, 413–414  
**Issue:** A remaining brief that authored a second warning (“irreversible Marked”, fake UU, “not available”) would desync the desk and Digit 9.  
**Fix applied:** Contract §1.2 copies the live strings. Brief does not propose replacements.

##### U2: Hangar grafted badge as required chrome

**Location:** `shipyard-desk.js` 397–403  
**Issue:** Adding a required `grafted` label this freeze would be a player-facing leftover PR. Inventory shows the loop already works without it.  
**Fix applied:** Contract §2.3 default **omit**. Owner-open only.

##### U3: Graft Digit stealing dock 0–9 or yard 1–2

**Location:** `station.js` 186, 5920–5922; `shipyard-desk.js` 18–20, 464–496  
**Issue:** A “Digit 5 graft” would fight BIO-04 WPN and dock Repair. Digit 0 graft would steal shipyard.  
**Fix applied:** Graft stays click Offer on Hangar. Digits unchanged.

##### U4: Mech HUD rewritten to bio for Abominations

**Location:** `hud.js` 76–85  
**Issue:** Skinning grafted built as bio would lie (plated mesh) and would look like a HUD `hullKind` write.  
**Fix applied:** HUD-02 stays. Family is not the Digit 5 gate.

#### 🟡 Minor

##### U5: Reduced warn omits the −10 hunt number

**Location:** `GRAFT_WARN_REDUCED` `shipyard-desk.js` 69  
**Issue:** Motion-sensitive players see a shorter enemy line. Digit 9 still names `min(current, -10)`.  
**Fix (accepted):** Keep live reduced string. Do not invent a third warn.

#### 💡 Suggestion

##### U6: If owner later opens a hangar badge

Use static `textContent` `grafted` on the meta line. Never `innerHTML`. Not this wave.

### Recheck (after brief §2 split)

No new desk string, HUD label, or Digit map. Confirm papers still use live `GRAFT_WARN` / `GRAFT_WARN_REDUCED`. Player-outcome prose does not add a “friend standing” toast. Verdict unchanged.

### Verdict

Keep live Gilded graft papers. No new BIO-05 chrome in Wave 96. Optional NPC/visual later must not add aim-glass gauges or steal Digits.
