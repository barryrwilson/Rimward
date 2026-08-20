# Code Review: `out/w63/shared-contract.md` (SHP shared contract)

**Method:** Self-applied `C:\Users\barry\.grok\skills\orchestrator\references\code-review.md` + `C:\Users\barry\.grok\bundled\skills\shared\personas\reviewer.md`.  
**Scope:** Design brief vs locked SHP / HUD-02 / persist / dock / living-mesh sources. No `src/` or `docs/` edits.  
**Pass:** 3 (re-apply after §4.2 flight / `ctx.config.ship` remount law).

### Summary

The brief is merge-ready. It does not copy HUD glance tables. It matches `DOCK_KEY_SERVICES` append-only, `hudFamily` / Unknowables living, save wholesale-player + `WORLD_FIELDS` discipline, and the BIO living-mesh preserve. Remount now names `ctx.config.ship`. A later implementer cannot claim `classKey` alone changes cruise. No Blockers remain.

### What's done well

- Law page encodes the eleven frozen rules the orchestrator named.
- Persist table cites real `save.js` paths (`WORLD_FIELDS` 65–82, wholesale player 170/359, `sanitizeRestored` vitals-only 232–241, `clearAutosave` 200–206, `freshStart` leftover-key hazard 379).
- Dock contract quotes the frozen nine-key list and the `DigitN → N-1` mapper, then special-cases Digit 0 instead of renumbering 1–9.
- `hudFamily` is the shipped function (`hud.js` 65–74), not a new switch.
- SHP-03 first slice reuses scanner / miningLaser / concealedMounts / cargo as hull-owned with world mirrors, so combat/outfitter/HUD do not have to move in the same PR.
- Parallel-safety names the four files that are not parallel-safe.
- Open questions are real owner calls with implementable defaults.

### Findings

#### 🔴 Blocker: none

#### 🟠 Major: MATCH remount invented a new write (pass 1)

**Location:** former contract §4.1.11  
**Issue:** First draft said “Clear `ctx.flags.matchSpeed` on remount.” Shipped: MATCH is already forced false while docked (`ship.js` 468–470, 633). A remount API that writes MATCH is extra surface and could confuse implementers into touching `input.throttle`.  
**Fix:** Applied. Remount leaves MATCH to `ship.js`. Still forbids throttle writes.  
**Status:** resolved

#### 🟠 Major: “Each faction one yard” vs “every dock sells” (pass 1)

**Location:** former §8 Q5  
**Issue:** SHP-01 requires at least one shipyard per faction. The first default read as independent/hollow docks never sell, which could be taken as “those factions have no yard.”  
**Fix:** Applied. Hangar is every dock. Buy list only when the dock faction has a catalog. Each faction **with** a catalog has ≥1 yard in the galaxy. Empty independent/hollow catalogs are an explicit default until the owner adds stock.  
**Status:** resolved

#### 🟠 Major: §4.2 claimed `classKey` drives player cruise (pass 2)

**Location:** former contract §4.2 “Keep the previous class's cruise/turn…”  
**Issue:** Shipped `ship.js` does not import `SHIP_CLASSES`. Cruise / creep / maxSpeed come from `ctx.config.ship` (`ctx.js` 43–47: light 120/30). Turn already follows `classKey` via `hoverTurnRateFor` (`ship.js` 513–515). `SHIP_CLASSES` cruise feeds vitals / NPC only. Old remount steps never named `ctx.config.ship`.  
**Fix:** Applied. §4.1.4 must copy authored `SHIP_CLASSES[classKey]` onto `ctx.config.ship`. §4.2 states today's turn-vs-cruise split and forbids a leftover light baseline after a heavy / freighter mount. MATCH / no throttle-write and living swim / breath stay.  
**Status:** resolved

#### 🟡 Minor: `createShipState` re-rolls `personality`

**Location:** `state.js` 137; contract §4.1.15  
**Issue:** Remount via `createShipState` calls `Math.random()` for personality. Harmless if unused on the player; noisy if someone later persists it.  
**Fix:** Applied. Do not persist personality. Ignore the roll.  
**Status:** resolved

#### 🟡 Minor: `frigate` is a legal `classKey` and a 900-hull capital row

**Location:** `SHIP_CLASSES.frigate` `state.js` 40; contract §5  
**Issue:** Allowlisting every `SHIP_CLASSES` key for sanitize is correct. Selling `frigate` in the first catalog is a balance hole, not a sanitize hole.  
**Fix:** Applied. Sanitize still accepts the key. Default omit `frigate` from buy lists.  
**Status:** resolved

#### 💡 Suggestion: Pin Digit0 separately from `N - 1`

**Location:** `station.js` 2248–2251; contract §2.2  
**Issue:** `Number('0') - 1 === -1` will silently ignore Digit0 if someone only appends the array.  
**Fix:** Contract already requires a Digit0 special case. Implementation must pin `Digit0` → `shipyard`.  
**Status:** open (implementation wave)

#### 💡 Suggestion: Pin `freshStart` leftover `hullKind`

**Location:** `save.js` 379; contract §1.3  
**Issue:** `Object.assign` of a new light record does not delete `hullKind`.  
**Fix:** Already law. Pin no-save death → living starter, no leftover `'built'`.  
**Status:** open (implementation wave)

### Cross-check vs verification target

| Check | Result |
|---|---|
| Contradict Hud02IdentitiesDesign hullKind? | Pass. HUD reads only. Unknowables `'living'`. Unset → `bio`. No HUD-03 checkbox. Live default living until `'built'` mount. |
| Append-only dock services | Pass. One key `shipyard` after `epics`. Digits 1–9 frozen. |
| Markdown-only / no src diffs | Pass. This worker writes `out/w63/shared-*.md` only. |
| Persist allowlist + sanitize | Pass. `hangar` on `WORLD_FIELDS`. `hullKind` `living`\|`built` or delete. |
| BIO preserve | Pass. `makeLivingHull` motion/skin must survive living remount. Envelope copy must not idle swim / breath. Bio is not a hull. |
| Player flight remount | Pass. §4.1.4 names `ctx.config.ship`. §4.2: turn follows `classKey` today; cruise does not until remount copies `SHIP_CLASSES`. |
| Format vs Wave 61 | Pass. Same law-page + numbered sections. No HUD glance tables copied. |
| Open questions not silently decided | Pass. Six owner calls with defaults. |

### Verdict

Merge-ready as Wave 63 SHP law. Implementation wave must treat §0 and the four serial files as binding.
