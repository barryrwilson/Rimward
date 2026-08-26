## UI Audit: NAV-09 PR1 itinerary last-hop copy

### Summary
Itinerary still sits under Destination as `#rw-galaxy-itinerary` with heading, `ol`/`li`, and `textContent`. A 1-jump plot is one arrival row with a real gate token (`gate` / `hub route` / `gate + hub`). Clear still hides the list.

### What's done well
- Zoom controls stay real `<button type="button">` with visible text and matching `aria-label`, min 24 px (HUD-07 sibling owns CSS this pass).
- Filters stay labeled `<select>`s. Dest native typeahead remains search. Dest `#rw-galaxy-dest` stays.
- Itinerary identity is the **destination of the hop**, so Freehold→Veridian reads `Veridian Reach — Veridian Combine — … — gate — …` instead of an origin line plus dest-`unknown`.
- Idle hide is still `hidden` + `aria-hidden` when status is not plotted or path length < 2.
- Color is not the only cue: gate type is a word token. No clue / landmark prose.

### Findings

No Blocker or Major issues.

#### 🟡 Minor: Filter row wrap on a short panel
**Location:** `.rw-galaxy-filters`  
**Issue:** Zoom cluster `margin-left: auto` plus wrap can drop the buttons to a second row on a narrow window.  
**Fix:** Accept wrap; hit targets stay ≥ 24 px.  
**Justification:** Non-pointer zoom still exists; dest select stays first. Unchanged this re-dispatch.

#### 💡 Suggestion: Origin is no longer a list row
**Location:** `#rw-galaxy-itinerary`  
**Issue:** The list no longer repeats the current system as hop 0.  
**Fix:** None required. The player already has current-system chrome; each row is a decision about the next arrival.  
**Justification:** Matches the re-dispatch spec (leg rows).

### Keyboard
Tab order: Destination → Faction → Standing → Zoom in/out/reset → Close/AP (header is earlier in DOM). KeyM skip uses `isTypingFocus()` (SELECT/INPUT) plus dest/filter ids. Escape still closes.
