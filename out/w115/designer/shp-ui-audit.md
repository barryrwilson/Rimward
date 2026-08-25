# UI Audit: SHP remaining catalog leftover (Wave 115 CONSUME)

**Auditor:** `[designer]` (independent of `out/w115/shp/ui-audit.md`)
**Scope:** Wave 115 SHP remaining catalog CONSUME brief. Markdown only. Confirm CONSUME does **not** schedule new shipyard chrome, a seventh class, a new Digit, or Digit theft. Honor Digit 0 shipyard, Digit 8/9 stay, HUD-01 empty 80 px hub, six live class keys, empty Independent / Hollow yards as **explicit omit** (not a missing desk).
**Review file:** `out/w115/designer/shp-ui-audit.md`
**Method:** `C:\Users\barry\.grok\skills\orchestrator\assets\designer-persona.md` + `C:\Users\barry\.grok\skills\orchestrator\references\ui-audit.md`. Live cites: `src/game/shipyard.js`, `src/systems/shipyard-desk.js`, `src/systems/station.js`, `src/game/hangar.js`, `src/game/state.js`, `src/game/weapon-fit.js`, `src/game/save.js`, `src/game/authored-systems.js`, `src/ui/hud.css`, `src/systems/hud.js`. Pack: `docs/ShpRemainingCatalogDesign.md`, merge law `out/w115/shp/shared-contract.md`, inventory `out/w115/shp/current-shp-remaining-inventory.md`. Worker self-audit `out/w115/shp/ui-audit.md` read, not copied. No Playwright. No Vite. No Chrome. Did not spawn children. [NO BROWSER COVERAGE].
**Date:** 2026-08-24
**Product source:** review only (no `src/` / `scripts/` / integrator-doc edits)

Merge law: `out/w115/shp/shared-contract.md` wins if the brief forks. This wave does not ship desk or hub chrome. Findings bind **later workers**: do not invent a catalog SKU, seventh class, Digit, or aim-glass pip while live yards already sell six keys.

## UI Audit: SHP remaining catalog desk / Digit / hub freeze (CONSUME)

### Summary

No product UI ships this wave. The pack freezes leftover as **CONSUME**: Digit 0 Shipyard, Hangar/Yard panes, six live Offers (living frigate included), empty Independent / Hollow copy, HUD-01 empty 80 px hub, Digit 8/9 dock and outfitting papers. Named remaining serial is **none**. The brief does not schedule new shipyard chrome, a seventh class tile, or Digit theft. Empty Hollow / Independent Digit 0 is authored omit, not a missing desk. No 🔴 Blocker. No 🟠 Major.

### Verdict

**PASS.** 0 blockers, 0 majors, 2 minors (stale wishlist copy; accepted empty yards), 2 suggestions. CONSUME freeze holds.

### What's done well

- Player-facing yard is **already live**. `CORE_STOCK` and `LIVING_STOCK` both list six keys including `frigate` (`src/game/shipyard.js` 28–29). Beautiful / Unknowables alias living stock (`shipyard.js` 30, 60–61). Wave 94 living frigate buy stays in. The pack forbids omit-restore.
- Empty Independent / Hollow yards already have a desk state. Missing `YARD_STOCK` key returns `[]` (`shipyard.js` 51–62, 85–88). Yard pane paints `This dock has no hull catalog. No sale.` (`src/systems/shipyard-desk.js` 37, 336–338). Digit 0 still opens Shipyard (`station.js` 188, 6100–6102). That is a filled empty desk, not a hole.
- Fail-closed copy is distinct: hangar full `The hangar is full.` (`shipyard-desk.js` 34); hostile / reputation `No sale.` (`shipyard-desk.js` 36, 364–366); short credits keep Offer and refuse Confirm (`shipyard-desk.js` 35). No silent fail. No new spinner.
- Buy is two-step papers. Digit 3+ on Yard **arms** (`shipyard-desk.js` 376–379, 500–518). Confirm papers debits (`shipyard-desk.js` 353–356). Buy does not remount. Hangar cap 8 fail-closed (`src/game/hangar.js` 27, 201–205).
- Digit map is named and closed. `DOCK_KEY_SERVICES` last key is `shipyard` (`station.js` 188). Dock-root Digit 0 selects that last key (`station.js` 6100–6102). Menu labels Launch / Standing / Shipyard (`station.js` 5963). Digit 8 = `launch` (index 7). Digit 9 = `epics` (index 8). Outfitting Digit 8/9 stay launcher / turret papers (`station.js` 1644–1645, 1691–1712). Catalog freeze is **not** a dock verb. No new Digit.
- Hangar Digit 0 is row 8 (`shipyard-desk.js` 173–176, 490). Digit 1 Hangar / Digit 2 Yard stay panes (`shipyard-desk.js` 18–20, 478–487, 502–511).
- HUD-01 empty hub stays empty. `.rw-reticle` is 80×80, `pointer-events: none` (`src/ui/hud.css` 184–193). Live children stay pupil, three cilia, RANGE (`src/systems/hud.js` 726–729). Contract §0.2 forbids class pip, yard meter, or SKU name on the glass.
- HUD **reads** `hullKind` for family (`hud.js` 81–89). HUD never writes `hullKind`. Both families keep the same glance set. No family-specific yard widget.
- `h()` uses `textContent` (`station.js` 4398–4402). `innerHTML` is none in `station.js` / `shipyard-desk.js` / `hangar.js` / `shipyard.js`. Names and faction labels do not become HTML.
- `SHIP_CLASSES` is six keys (`src/game/state.js` 37–44). `MOUNT_TABLE` is six rows (`state.js` 66–73). `WEAPONS` is six ids (`state.js` 116–145). `LAUNCHER_IDS` is `dart` only; `TURRET_IDS` is `auto` only (`src/game/weapon-fit.js` 33–54). No seventh class. No new weapon family.
- Persist already has `hangar` (`src/game/save.js` 93–96). Prices stay in `shipyard.js`, not the blob. No new `WORLD_FIELDS` key. No new localStorage key.
- Reduced-motion graft line already exists (`GRAFT_WARN_REDUCED`, `shipyard-desk.js` 67–69, 391–395). Catalog leftover does not add motion.
- Serial plan names **none** (`docs/ShpRemainingCatalogDesign.md` Remaining serial; contract §3). Optional playtest successors are labeled **not scheduled**. That is the correct CONSUME picture: keep the live yard.

### CONSUME steal check (Blocker if the brief scheduled these)

| Forbidden later work | Brief / contract | Live honor | Result |
|---|---|---|---|
| New shipyard chrome / seventh class tile / Career Digit | Remaining serial **none**; Goals 3 / 11; Non-goals; contract §0.1, §0.8, §3 | Six Offers on live Yard (`shipyard.js` 28–29; `shipyard-desk.js` 330–380) | **Pass.** Not scheduled. |
| Seventh `SHIP_CLASSES` key | Owner request; Wave 112 §4; contract §0.5 / §0.8 | Six keys (`state.js` 37–44) | **Pass.** Forbidden. Do not append. |
| Digit theft / new Digit | Honor; contract §0.3 | Digit 0 last `DOCK_KEY_SERVICES` = shipyard (`station.js` 188, 6100–6102); 8 launch; 9 epics; outfit 8/9 papers (`station.js` 1644–1712) | **Pass.** Catalog freeze is not a dock verb. |
| HUD-01 class pip / yard gauge on 80 px hub | Honor; contract §0.2 | `.rw-reticle` 80×80; pupil + 3 cilia + RANGE (`hud.css` 184–193; `hud.js` 726–729) | **Pass.** Hub stays empty of catalog chrome. |
| Fill Independent / Hollow as “missing desk” | Goals 7; contract §0.10; inventory §3 | `YARD_STOCK` has neither key (`shipyard.js` 51–62); empty copy (`shipyard-desk.js` 336–338); Hollow docks still `faction: 'hollow'` (`src/game/authored-systems.js` 123–127, 161–164, 198–202) | **Pass.** Explicit omit. Digit 0 still opens Shipyard. |
| New `WEAPONS` id / mount power ledger / kit mutate | Non-goals; contract §0.11–§0.14 | Six weapon ids (`state.js` 116–145); `POWER` afterburner + psionic (`state.js` 147) | **Pass.** Not this leftover. |
| Steal HUD-02 / HUD-03 write-set | Honor; contract §0.22 | Sibling paths cited, not edited | **Pass.** |

If a later worker adds a class pip on `.rw-reticle`, a seventh Offer row, a new Digit, fills Independent / Hollow without a successor owner file, or restores Wave 86 omit, that **violates this freeze** and is a Blocker then. This pack does not schedule that work.

### Freeze confirmation (later serial)

| Surface | Live | Spec freeze | Later serial |
|---|---|---|---|
| HUD-01 80 px hub | `.rw-reticle` 80×80; pupil + 3 cilia + RANGE | Contract §0.2; brief Honor | **Must not** add class pip, SKU, or yard meter |
| Digit 0 dock root | shipyard (`station.js` 188, 6100–6102) | §0.3 | **Must not steal** |
| Digit 8 dock root | launch | §0.3 | **Must not steal** |
| Digit 9 dock root | epics / Standing | §0.3 | **Must not steal** |
| Outfitting 8/9 | dart launcher / auto turret papers | §0.3 / §0.12 | **Must not steal** |
| Digit 1 / 2 in Shipyard | Hangar / Yard panes | brief Honor later | **Must not** mint a third pane Digit |
| Class set | six keys | §0.8 | **Must not append or strip** |
| Independent / Hollow | empty catalog copy | §0.10 | **Must not fill** without successor owner file |
| Persist catalog | none extra; `hangar` already on blob | §0.6 | **Must not** add `world.yardCatalog` |
| `innerHTML` | none on desk `h()` | §0.4 | **Must not** HTML a fallback catalog |

### Accessibility / theming / states (spec)

| Check | Result |
|---|---|
| Contrast / tokens | No new color. Reuse live `screen-note` / `screen-btn` / `screen-btn-warm` |
| Keyboard | Live Digit 0/1/2/3+/Confirm/Esc stay. No new control. Confirm is a `button` with visible name (`shipyard-desk.js` 353, 4405–4408) |
| Focus | Live `screen-btn` `:focus-visible`. No new overlay |
| Empty | Live `This dock has no hull catalog. No sale.` |
| Error | Live `No sale.` / full / credits / busy / stock |
| Disabled | Rank / hostile refuse at Confirm (`purchaseYardHull`); hostile paints `No sale.` then still lists Offers (live; see Suggestion) |
| Loading | Buy-in-flight `'busy'` copy. No catalog JSON spinner. Do not add one. |
| Hub | 80 px stays empty of catalog chrome |
| Responsive | No new overlay. Station panel unchanged |
| Reduced motion | Graft already shortens warn. Catalog freeze adds no `@keyframes` |

### Findings

None at 🔴 Blocker / 🟠 Major.

#### 🟡 Minor: Wishlist still tells a player-facing story that living yards omit frigate

**Location:** `docs/PLAYER-EXPERIENCE-WISHLIST.md:742` vs live Yard listing `frigate` (`src/game/shipyard.js:29`; `src/systems/shipyard-desk.js:330–380`)
**Severity:** minor
**Status:** accepted — wishlist is read-only in this write-set (contract §0.20).

**Issue:** A UI worker who reads only SHP-01 would hide living `frigate` Offers. Live desk already shows six living keys. Hide would restore Wave 86 omit.

**Fix:** None in this leftover. Pack marks the line **STALE**. Later UI consumes live Offers. Do not ship a hide. Do not edit the wishlist from a catalog freeze.

#### 🟡 Minor: Hollow / Independent Digit 0 still opens an empty Yard

**Location:** `src/game/authored-systems.js:125–127` (`hollowreach`), `161–164` (`hush`), `198–202` (`verge`); `src/game/shipyard.js:51–62, 85–88`; `src/systems/shipyard-desk.js:336–338`
**Severity:** minor
**Status:** accepted omit — not a missing desk.

**Issue:** Player can press Digit 0 at a Hollow (or generated Independent) dock and see no hulls. Shipyard chrome **is** there: Hangar pane, Yard pane, empty-catalog line. Filling the list would be new chrome **and** new SKUs.

**Fix:** Out of this leftover (contract §0.10). Keep `This dock has no hull catalog. No sale.` Do not add “coming soon.” Do not dump `Object.keys(SHIP_CLASSES)` onto those docks.

#### 💡 Suggestion: Hostile Yard still paints Papers under `No sale.`

**Location:** `src/systems/shipyard-desk.js:364–380`; Confirm still reputation-refuses (`shipyard.js` buy path; `BUY_REFUSE_LINES.reputation`)
**Severity:** suggestion
**Status:** optional — live consume; do not invent disabled tiles in this leftover.

**Issue:** Hostile `rep < 0` paints `No sale.` then still lists Offer cards with `N — Papers`. Confirm fails closed. That is reachable, not a crash. A naive “a11y fix” that greys tiles or hides the list would be new chrome.

**Fix:** Keep live copy + Confirm refuse. Do not add `disabled` mystery tiles. Do not hide the six keys on hostile docks as a catalog leftover.

#### 💡 Suggestion: Seed hangar “not for sale” copy is not a catalog SKU

**Location:** Wave 112 §9 optional; brief wishlist table last row; contract §1.2
**Severity:** suggestion
**Status:** out of scope.

**Issue:** Seed rows are hulls, not cargo. If play still confuses a seed with ore, desk copy could help. That is BIO/SHP copy, not a seventh class.

**Fix:** None here. Do not schedule it as SHP remaining catalog PR1. Named remaining serial stays **none**.

### Honor recap

- Digit 0 stays Shipyard.
- Digit 8/9 stay Launch / Standing on dock root; launcher / turret papers in outfitting.
- HUD-01 80 px hub stays empty of catalog chrome.
- Six live class keys. No seventh.
- No new Digit.
- Independent / Hollow empty yards are explicit omit, not a missing desk.
- Named remaining serial: **none**. No new shipyard chrome this wave.
