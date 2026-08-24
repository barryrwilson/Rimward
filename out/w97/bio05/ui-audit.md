## UI Audit: BIO-05 Wave 97 owner close (no new chrome)

### Summary
Wave 97 restates live Gilded graft papers and **omits** new desk/HUD chrome. No hangar grafted badge. No plated tissue overlay. NPC world look stays player-only. No new dock Digit. Reduced-motion already shortens the warn. No Blocker or Major remaining.

Persona: orchestrator `C:\Users\barry\.grok\skills\orchestrator\references\ui-audit.md`. Proposed desk/HUD copy is UI. Markdown only. Do not edit product UI. Nested subagents forbidden. Do not spawn `[designer]`.

### What's done well

- Graft already uses the yard two-step pattern: Offer → Confirm / Esc (`shipyard-desk.js` 360–418). Same Hangar pane as hull mounts.
- Wave 97 restates live warn only: `Beautiful Ones become immediate enemies. Patrols hunt at standing -10 or worse.` Reduced: `Beautiful Ones become enemies.`
- Warn is on the **confirm** row, not only in Digit 9 notes. Hostility is not silent (`GRAFT_WARN` 67–68).
- Reduced motion already swaps to `GRAFT_WARN_REDUCED` without extra animation.
- Success `Tissue sealed to the hull.` stays a notice, not a blocking modal.
- Refuse lines stay short (`GRAFT_REFUSE_LINES` 52–65). Living/Unknowables share `Grafts fit plated hulls only.` Hostile Gilded is `No sale.`
- Graft stays a Hangar **button**, not Digit 0–9 theft. Dock Digit 0 stays Shipyard.
- HUD grafted built stays **mech**. Digit 5 uses existing WPN `5 · name` / `5 · —`. Aim glass stays empty (HUD-01).
- Hangar badge **omit**. Digit 9 + Gilded warn already tell the beat (`shipyard-desk.js` 397–403).
- Overlay **omit**. Plated GLB stays. `makeLivingHull` stays the living quality bar.
- `h()` / `el()` `textContent` only. Color is not the only hostility cue.

### Findings

#### 🔴 Blocker

None remaining.

#### 🟠 Major (fixed in freeze)

##### U1: New warn copy that fights live papers

**Location:** live `shipyard-desk.js` 67–69, 363–365, 413–414  
**Issue:** An owner close that authored a second warning would desync the desk and Digit 9.  
**Fix applied:** Owner file restates live strings only. Contract §1.2 copies the live table. Brief does not propose replacements.

##### U2: Hangar grafted badge as required chrome

**Location:** `shipyard-desk.js` 397–403  
**Issue:** Adding a required `grafted` label would be a player-facing leftover PR. Inventory shows the loop already works without it.  
**Fix applied:** Wave 97 **omits** the badge. Closed. Successor only.

##### U3: Graft Digit stealing dock 0–9 or yard 1–2

**Location:** `station.js` 186, 5920–5922; `shipyard-desk.js` 18–20, 464–496  
**Issue:** A “Digit 5 graft” would fight BIO-04 WPN and dock Repair. Digit 0 graft would steal shipyard.  
**Fix applied:** Graft stays click Offer on Hangar. Digits unchanged. Digit 0 shipyard.

##### U4: Mech HUD rewritten to bio for Abominations / living overlay on plated

**Location:** `hud.js` 76–85; `ship.js` 535–560  
**Issue:** Skinning grafted built as bio would lie (plated mesh) and would look like a HUD `hullKind` write. Replacing `makeLivingHull` would weaken the living quality bar.  
**Fix applied:** HUD never writes `hullKind`. Grafted stays mech. Overlay **omit**. Keep plated.

#### 🟡 Minor

##### U5: Reduced warn omits the −10 hunt number

**Location:** `GRAFT_WARN_REDUCED` `shipyard-desk.js` 69  
**Issue:** Motion-sensitive players see a shorter enemy line. Digit 9 still names `min(current, -10)`.  
**Fix (accepted):** Keep live reduced string. Do not invent a third warn.

#### 💡 Suggestion

##### U6: If a successor later opens a hangar badge

Use static `textContent` `grafted` on the meta line. Never `innerHTML`. Not this wave.

### Recheck (after owner close)

No new desk string, HUD label, Digit map, or tissue overlay. Confirm papers still use live `GRAFT_WARN` / `GRAFT_WARN_REDUCED`. Player-outcome prose does not add a “friend standing” toast. NPC world look stays player-only. Verdict unchanged.

### Verdict

Keep live Gilded graft papers. No new BIO-05 chrome in Wave 97. NPC/visual stay skipped until a successor owner file opens them. Do not add aim-glass gauges or steal Digits.
