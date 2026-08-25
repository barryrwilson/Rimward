# UI Audit: SHP remaining catalog leftover (Wave 115)

### Summary

No product chrome ships this wave. This audit treats the pack as a **desk/catalog spec freeze** — measured against live Digit 0 Shipyard, Hangar/Yard panes, empty-catalog copy, HUD-01 empty 80 px hub, Digit 8/9, and `textContent` papers. Picture is **keep the live yard**, not a new HUD widget, not a seventh class tile, not a Career Digit. Hub theft is **not** proposed (Blocker if a later serial adds a class pip). Digit theft is **not** proposed. Remaining serial **none** means no new empty/error/disabled states to design.

Applied `C:\Users\barry\.grok\skills\orchestrator\references\ui-audit.md`. Did **not** spawn `[designer]`. Spec audit, not a running page. Did **not** start Vite or Chrome.

### What's done well

- Player-facing catalog is **already live**: six class Offers including living frigate on Beautiful / Unknowables (`shipyard.js` 29; desk `renderBuyPane` `shipyard-desk.js` 330–380).
- Empty Independent / Hollow yards already have a state: `This dock has no hull catalog. No sale.` (`shipyard-desk.js` 336–338). Freeze keeps that copy. Does not invent a “coming soon” pane.
- Hostile already paints `No sale.` (364–366). Short credits keep Offer; Confirm refuses. Full hangar uses `The hangar is full.` Distinct states, no silent fail.
- Empty hub freeze is explicit: no class pip, SKU meter, or yard gauge on `.rw-reticle` (`src/ui/hud.css` 184–189).
- Digit 0 stays Shipyard. Digit 1 Hangar / Digit 2 Yard stay panes. Digit 8/9 dock stay Launch / Standing. Outfitting 8/9 stay launcher / turret papers (`station.js` 1644–1645). Catalog freeze is not a dock verb.
- Confirm papers stay two-step (arm then Confirm). Buy does not remount. Hangar list still mounts from any dock.
- `h()` is `textContent` (`station.js` 4398–4402). Names and faction labels do not become HTML.
- Both HUD families keep the same glance set. No family-specific yard widget.
- `reducedMotion` graft warn already has a shorter line (`GRAFT_WARN_REDUCED`). Catalog leftover does not add motion.

### Findings

No 🔴 Blocker or 🟠 Major (open).

#### 🟡 Minor: Wishlist still tells a player-facing story that living yards omit frigate

**Location:** `docs/PLAYER-EXPERIENCE-WISHLIST.md` ~742 vs live Yard pane listing `frigate`.

**Issue:** Designers reading only the wishlist would ship a hide. Live desk already shows the six living keys.

**Fix:** None in this write-set (wishlist is read-only). Pack marks the line stale so a later UI worker consumes live Offers.

**Status:** documented.

#### 🟡 Minor: Hollow / Independent Digit 0 still opens an empty Yard

**Location:** authored Hollow docks `authored-systems.js` 125–128, 161–164, 198–201; generated `independent` factions; desk empty copy 336–338.

**Issue:** Player can open Shipyard and see no hulls. That is Wave 64/67 **omit**, with explicit empty copy — not a missing spinner or a broken Digit. Filling the list would be new chrome **and** new SKUs.

**Fix:** Out of this leftover (contract §0.10). Keep empty copy. Do not add a fake catalog.

**Status:** accepted omit.

#### 💡 Suggestion: Seed hangar “not for sale” copy

**Location:** Wave 112 §9 optional later serial.

**Issue:** Seed rows are hulls, not cargo. If play still confuses a seed with ore, copy could help. That is **not** a catalog SKU and **not** this leftover.

**Fix:** None here.

**Status:** out of scope.

### Accessibility / theming / states (spec)

| Check | Result |
|---|---|
| Contrast / tokens | No new color. Reuse live `screen-note` / `screen-btn` |
| Keyboard | Live Digit 0/1/2/3+/Confirm/Esc stay. No new control |
| Empty | Live empty-catalog line |
| Error | Live `No sale.` / full / credits / busy |
| Disabled | Rank/hostile hide sale via copy, not a mystery disabled tile |
| Hub | 80 px stays empty of catalog chrome |
| Responsive | No new overlay; station panel unchanged |

### Verdict

**Approve** as non-UI consume freeze. No Blocker/Major. Later serial **none** means no product UI to land.
