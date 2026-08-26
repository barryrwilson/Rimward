# Code Review: NAV-09 leftover chart readability (Wave 128)

### Summary

Markdown-only integrator. Census matches leftover **REAL** / serial **PR1**. Dest `<select id="rw-galaxy-dest">` is frozen **kept**. Write-set is `galaxychart.js` + existing chart CSS. NAV-06/07/08 are cited, not stolen. Applied `C:\Users\barry\.grok\skills\orchestrator\references\code-review.md`. Did **not** edit `src/`. Did **not** start Vite or Chrome.

### What's done well

- Code-wins inventory with file:line for zoom absence, dest list length, 12 labels, missing itinerary.
- Catalog count is live **101** including Wave 94 `veil`; does not hardcode 100.
- Distinguishes NAV-08 CONSUME (remaining-NAV) from this new P1 inbox.
- Reuses `world.nav` as the only plot store; itinerary is a read.
- Gate type derived from live `gates[].to` vs `hub.routes` (no `state.js` field).
- KeyM typing skip + dest select + AP button close + overlay never-pause called out as neighbors.
- Optional PR2 itinerary split named if PR1 bloats.

### Findings

No 🔴 Blocker or 🟠 Major (open).

#### 🟠 Major (closed in freeze): leftover would have been wrongly CONSUME

**Location:** NAV-08 `docs/Nav08RemainingNavDesign.md` leftover CONSUME; dest typeahead live `galaxychart.js` **202–230**.

**Issue:** A worker could freeze “no NAV leftover” because NAV-07 already shipped a dest list. Wishlist **106–111** is a **different** hole (zoom, filters, itinerary, zoom labels).

**Fix landed (markdown):** REAL / PR1. Dest typeahead is **partial** search only.

**Status:** closed in design Overview + inventory §8–§9.

#### 🟠 Major (closed in freeze): dest `<select>` rewrite

**Location:** `galaxychart.js` **202**; honor NAV-07.

**Issue:** Replacing the named select with an unnamed custom listbox would drop keyboard typeahead and AT names. The hole is **length**, not the control.

**Fix landed (markdown):** keep `#rw-galaxy-dest`; filter/group options.

**Status:** closed in contract §0.4.

#### 🟡 Minor (closed in freeze): `appliedScale` vs map zoom

**Location:** `galaxychart.js` **406–407**, **831–836**.

**Issue:** A later PR that overloads `appliedScale` would retune HUD text size instead of the map.

**Fix landed (markdown):** keep settings `textScale` on `appliedScale`; map scale is a **separate** session variable.

**Status:** closed in contract §0.1 / regression table.

#### 🟡 Minor: itinerary vs plot-status duplication

**Location:** `setStatusText` **602–605**.

**Issue:** `{name} · N jumps` can stay as the short status. Itinerary is the decision table. Do not delete the live status line as a required PR1.

**Status:** accepted. Itinerary is additive. Status may remain.

#### 💡 Suggestion: split PR2 if `galaxychart.js` grows past one reviewable punch

**Location:** contract §2–§3.

**Issue:** Zoom + filter + itinerary in one file is one write-set but a large diff.

**Status:** named optional **PR2 itinerary**. Owner may override.

### Test coverage (later)

Named only. This wave does not add probes. Later: dest id still present; wheel changes viewBox; filter shortens options; itinerary row count = path length; no `innerHTML`; no new `WORLD_FIELDS`.
