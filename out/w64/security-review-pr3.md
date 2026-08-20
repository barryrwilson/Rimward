# Security Review: Wave 64 PR3 shipyard desk + Digit 0

**Scope:** `src/systems/station.js` dock keys + Digit 0, `src/systems/shipyard-desk.js`, `src/ui/screens.css` desk styles, `scripts/boot-test.mjs` WAVE64 desk pins.
**Mode:** Deep audit (XSS via hull names, digit remap, no debit).
**Pass:** first pass after desk pins.

### Risk Level: Low

### Summary
World strings stay on `textContent` through `h()`. Digit 0 is a last-key special case and does not remap 1–9. The Yard pane has no catalog and never debits. No HIGH or CRITICAL finding.

### Findings

#### 🟢 LOW: hangar notice interpolates a stored hull name
**Location:** `src/systems/shipyard-desk.js:74`, `src/systems/shipyard-desk.js:126`
**Issue:** `Mounted ${name}` writes a hangar `name` into `ui.notice`. The notice lands on `h(..., ui.notice)` (`station.js` `textContent`).
**Impact:** A tampered name can show markup as text. It does not become a node.
**Status:** accept — sanitize + `textContent` already bound the string.
**Justification:** Boot pin `xss.nameAsText` + `xss.noImgNode` is true.

#### 🟢 LOW: `factionLabel` falls back to the raw faction token
**Location:** `src/systems/shipyard-desk.js:32-34`
**Issue:** Unknown faction prints the token. Render and switch both call `sanitizeHangar` first.
**Impact:** Display-only. No object-key write.
**Status:** accept — hangar sanitize already allowlists faction.

### Passed checks
- [x] No `innerHTML` / `insertAdjacentHTML` / `document.write` in desk or station overlay
- [x] Overlay wipe is `overlay.textContent = ''`
- [x] Hull names, faction names, notices, mounted id: `textContent` only
- [x] Digit 1–9 still Market…Standing (`DOCK_KEY_SERVICES[0..8]`)
- [x] Digit 0 selects last key `shipyard` (`Number('0')-1` is not used)
- [x] Launch stays index 7 (Digit 8). Standing stays index 8 (Digit 9)
- [x] No second dock service
- [x] Buy pane: fail-closed note, no SKU, no credit write
- [x] Digit 3+ on Yard pane does not sell
- [x] Hangar switch uses `switchTo` (dock / combat / jump / destroyed / paused / missing)
- [x] HUD does not write `hullKind`
- [x] No secrets in desk files
- [x] `FACTIONS[faction]` / `SHIP_CLASSES[classKey]` use allowlisted or `hasOwnProperty` lookups

### Recommendations
1. PR4 must keep catalog names on `textContent` and confirm before debit.
2. Keep Digit 3+ bound to the pane read at keydown.

### Re-review
No HIGH/CRITICAL. No desk code change after the first pass. Findings stay LOW.
