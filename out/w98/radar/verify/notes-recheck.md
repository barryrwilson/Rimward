# Wave 98 TGT-03 radar pack — verifier recheck (cite fix)

**Date:** 2026-08-23  
**Dispatch:** re-verify after docked-park cite fix. Do not edit `src/`. Do not start Vite.  
**Prior bug:** `docs/Tgt03RadarDesign.md` “Park arc docked?” cited `hud.js` 1368 (FORE/AFT). Worker now claims 1382–1386.

## Status

**CLEAN**

The docked-park cite now matches live `showArc` / `is-hidden`. Other brief `hud.js` cites point at the right blocks. Freeze is unchanged. Inventory nits from the first pass remain (FORE/AFT mixed into inventory HUD-arc range; `rw-mech-contact-enter`). Those are nits, not this re-dispatch.

## What I tested

Read:

- `docs/Tgt03RadarDesign.md` (all `hud.js` cites)
- `out/w98/radar/verify/notes.md` (prior BUGS_FOUND)
- `out/w98/radar/shared-contract.md` freeze
- live `src/systems/hud.js` around Wave F contacts, FORE/AFT, lock arrow, NAV-02, hub clamp, toasts
- live `src/ui/hud.css` friend/foe shapes and `.rw-nav-gate-cue`
- grep `innerHTML` in `hud.js` (0 hits)
- grep `1368` in the brief (gone)

Did not start Vite. Did not run Chrome. Did not edit product source.

## Bugs found

None for this dispatch.

### Docked-park cite (the re-dispatch)

| Item | Value |
|---|---|
| Brief | `docs/Tgt03RadarDesign.md` merge table: “Park arc docked? **Already** `hud.js` 1382–1386” |
| Live 1382 | `const scanner = ctx.world.scanner ?? 0;` |
| Live 1383 | `const showArc = scanner >= 1 && !ctx.flags.docked && !!shipObj;` |
| Live 1384–1385 | `if (showArc !== last.contactsShown) { last.contactsShown = showArc;` |
| Live 1386 | `contacts.classList.toggle('is-hidden', !showArc);` |
| Live 1368 | still `selfFacing.set(selfMode)` in FORE/AFT (1357–1377). Brief no longer cites 1368. |

**Verdict:** match. A later PR that opens 1382–1386 lands on the contacts gate, not facing glance.

### Other brief `hud.js` cites (spot-check)

| Brief claim | Cite | Live block | Verdict |
|---|---|---|---|
| Contacts arc | 53–56, 791–813, 1379–1531 | Wave F comment; `.rw-contacts` pool; contacts update through 1531 | OK |
| Friend / foe | 354–357 | `contactKind` lock / hostile / civ | OK (shapes in `hud.css` 825–849) |
| Scanner 0 | 1379–1383 | comment + `scanner` + `showArc` (hide toggle 1386, same block) | OK |
| Lock off-screen | 735–736, 1206–1318 | `.rw-edge-arrow` + lockPark 1303–1306 | OK |
| NAV-02 cue | 737–741, 1575–1633 | `.rw-nav-gate-cue`; `navPark` 1577; hide/show through 1633. Transform write 1634–1636 is the same block. | OK |
| FORE / AFT | 1131–1133, 1357–1377 | `playerHit` 0.4 s; facing glance. Not the contacts gate. | OK |
| Dart toast | 62 | `INCOMING_DART_TOAST = 'Incoming dart.'` | OK |
| Cannon toast | 14, 568–573 | `npcFireToast` / `INCOMING_FIRE_TOAST` | OK |
| Empty hub | 1194 | `cx - 44` 80 px hub clamp | OK |
| Jumping does not park arc | 1383 vs 1577 | `showArc` ignores jump; `navPark` includes jump | OK |
| `innerHTML` none | grep 0 | 0 hits in `hud.js` | OK |

No brief `hud.js` cite now points at the wrong block.

### Freeze unchanged

| Freeze | Result |
|---|---|
| Reuse `.rw-contacts` | Pass. Brief goals / merge table. Live wrap `hud.js` 792. No `.rw-radar`. |
| No hub PPI | Pass. 80 px reticle `hud.css` 184–189; clamp `hud.js` 1194. |
| No `src/` from this pack | Pass. Wave 98 markdown only. Serial PR named-only (PR1–PR4 later). |
| Serial named-only | Pass. Brief § Serial PR plan; contract §8. |
| Subsystem targeting / missile gauges out | Pass. Brief non-goals; contract §0.14 / §4. |
| Scanner still gates; docked already hides | Pass. `showArc` 1383. |

## Environmental issues

None for this dispatch.

- Vite was not started.
- No browser session.
- `graph_resolve` (`codex/agent-codex`): `proceed_unmodeled`.

## Evidence

- Brief docked park: `docs/Tgt03RadarDesign.md` line 134 → `hud.js` 1382–1386.
- Live hide: `src/systems/hud.js` 1379–1386 (`showArc` + `.rw-contacts` `is-hidden`).
- FORE/AFT still 1357–1377; `playerHit` 1131–1133. Brief cites those for FORE/AFT only.
- Contacts wrap: `src/systems/hud.js` 791–813.
- Lock: `src/systems/hud.js` 735–736, 1303–1306.
- Gate cue: `src/systems/hud.js` 737–741, 1575–1636; `src/ui/hud.css` 1001–1037.
- Hub: `src/systems/hud.js` 1194; `src/ui/hud.css` 184–189.
- Prior record: `out/w98/radar/verify/notes.md` BUGS_FOUND on 1368; this file supersedes that cite defect.

Inventory nits (not this dispatch): `current-tgt03-radar-inventory.md` §5 still cites HUD arc `hud.js` 800–817, 1365–1516 (FORE/AFT overlap). Live also has `#hud[data-family="mech"]` `@keyframes rw-mech-contact-enter`. Freeze still forbids **new** keyframes.
