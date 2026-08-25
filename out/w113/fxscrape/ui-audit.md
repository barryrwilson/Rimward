# UI Audit: FX remaining scrape / collision punch brief (Wave 113)

### Summary

No product chrome ships this wave. This audit treats the pack as a **player-facing FX spec** for later scrape `spawnHitFx` — measured against live Wave 111 weapon ripples, HUD-01 empty 80 px hub, Digit 0/8/9, `reducedMotion`, and the live hull-strike toast. Picture is the **same world punch family as a weapon hit** on a ram, not a new HUD widget. Hub theft is **not** proposed (Blocker if a later serial adds a punch pip). Digit theft is **not** proposed. Extra toast is **not** proposed. Fail-closed missing host keeps today’s shake+audio+HUD (combat does not halt).

Applied `C:\Users\barry\.grok\skills\orchestrator\references\ui-audit.md`. Did **not** spawn `[designer]`. Spec audit, not a running page.

### What's done well

- Player-facing change is **world FX** on an existing damaging scrape. No new string, Digit, or required toast.
- Empty hub freeze is explicit: no punch pip, ram counter, or impact gauge on `.rw-reticle` (`src/ui/hud.css` 184–193; `hud.js` **726–729** RANGE stays TGT-01; range pop **1392–1404**). Do not reuse crosshair **730–731** or contact pips **835–849**.
- Facing-rail `selfHitFlashUntil` stays on `.rw-combat-self` (`hud.js` rail **863**, declare **1127–1128**, set **1167–1169**, apply **1407–1417**) — HUD-02 hair, not a hub child. Scrape already emits `playerHit`, so the rail already flashes.
- Hull-strike toast `'▲ Hull strike.'` (`hud.js` **608–610**) is consume via `pushToast` **1130–1150** (same-key refresh 1133–1135). Contract forbids a second scrape toast. Do **not** bind consume to 591–593 (`worldEvent`).
- Digit 0/8/9 stay shipyard / launch / Standing. Scrape punch is not a dock verb.
- `reducedMotion` keeps live snap-one-frame; shake already zeros (`ship.js` 1207–1211). Existing `body.rw-reduced-motion` / `rw-colorblind` / `rw-contrast` stay.
- Slide-only rams (`speed < 8`) stay mute in the world — no ring spam while parking.
- First-person player host stays WAVE111 world-space so the ring does not fill the 80 px glass.
- Kit mutate omit. Aim-glass gauges stay off.

### Findings

No 🔴 Blocker or 🟠 Major (open).

#### 🟠 Major (fixed iteration 2): HUD consume cites were stale — later serial could add toast spam

**Location:** first-pass pack `hud.js` 591–593 / 709–712 / 846–847 / 1149–1151. Designer `out/w113/designer/fxscrape-ui-audit.md`.

**Issue:** Those lines are `worldEvent` copy, injected sysname CSS, contact-pip `lastX`, and `pushToast` `textContent`. A PR that “consumes” them can miss `'▲ Hull strike.'` and add `'▲ Scrape.'`.

**Fix:** Re-census. Toast **608–610** + `pushToast` **1130–1150**. Hub **726–729** + `hud.css` 184–193. Facing **863**, **1127–1128**, **1167–1169**, **1407–1417**. Grep `'▲ Hull strike.'` and `.rw-reticle`. No second toast. No hub child.

**Status:** fixed this pass.

#### 🟡 Minor: Origin-centered ring may read as a halo, not a scrape nick

**Location:** deputize pos = `playerObj.position`; weapon hits use bolt contact.

**Issue:** A ram at a station skin can show a ring around the ship core. Chase/third still reads as “the hull got punched.” First person stays world-space at origin, which is farther from the nose camera than a bolt hit on the glass would be — safer for HUD-01, slightly less “contact.”

**Fix:** Accept for PR1. Do not draw a HUD contact pip to “fix” it.

**Status:** documented.

#### 🟡 Minor: Untextured hit flash can still read cheap next to a parented ring

**Location:** `spawnFlash` without `map` (`combat.js` 594–607).

**Issue:** A hard square plus a riding ring can clash. Flash map stays skippable, not required PR1.

**Fix:** None required this leftover.

**Status:** documented.

#### 🟡 Minor: Damaging scrape already plays two audio cues plus a toast plus a facing flash

**Location:** `song.js` 51–63; hull-strike `hud.js` **608–610**; facing set **1167–1169**; `pushToast` **1130–1150**.

**Issue:** Adding world FX on top is the leftover, but a later serial that also adds a “SCRAPE” toast or a third cue would spam. Contract already forbids extra toast/cue.

**Fix:** Keep. Do not add chrome because the ram “needs to read.”

**Status:** frozen.

#### 💡 Suggestion: Do not reuse RANGE for ram combo

**Location:** `hud.js` **729** RANGE; pop **1392–1404**.

**Issue:** Painting hit-count on RANGE would smash TGT-01.

**Fix:** Contract already forbids. Later grep RANGE / `.rw-reticle`.

**Status:** frozen.

### Accessibility / theming / layout

- No new controls, focus rings, or hit targets.
- No new CSS tokens.
- No responsive overlay.
- Empty / error / loading states: N/A (no panel). Fail closed is **keep bouncing and damaging**, which is the correct disabled-data state (combat does not halt).
- Vestibular: `reducedMotion` must mute extra pulse; shake already gated. Do not add `@keyframes` on `#hud` for rams.
- Color: `'impact'` uses energy cyan fallback. Colorblind body class already tints HUD, not world sprites. Do not add a hub legend.

### Digit / hub freeze table

| Surface | Spec | Live cite | Later serial |
|---|---|---|---|
| `.rw-reticle` child | none new | `hud.js` **726–729**; `hud.css` 184–193 | forbidden |
| Punch pip / combo / impact meter | none | absent | forbidden |
| RANGE | TGT-01 | **729**, **1392–1404** | do not rewrite |
| Crosshair / contact pips | not scrape | **730–731**, **835–849** | do not reuse |
| Facing flash | `.rw-combat-self` consume | **863**, **1127–1128**, **1167–1169**, **1407–1417** | do not move to hub |
| Digit 0 | shipyard | `station.js` 188, 6098–6102 | do not steal |
| Digit 8/9 | launch / epics; outfitting papers | `station.js` 188, 1644–1645, 6104–6106 | do not steal |
| Toast | consume `'▲ Hull strike.'` | **608–610**; refresh **1133–1135** | do not add “SCRAPE” / “SHIELD HIT” |
| Screen/shell toast | consume live | **563–567** | do not add scrape shield copy |
| Aim-glass gauges | off | kit mutate omit | omit |

### Verdict

Spec honors HUD-01, Digit law, reducedMotion, and no-toast-spam. HUD consume cites now match live `hud.js` (iteration 2). Later serials must grep `'▲ Hull strike.'` and `.rw-reticle`, must not grow chrome to sell the scrape ring, must not parent a full-size ring to the first-person player hull, and must not duplicate the hull-strike toast.
