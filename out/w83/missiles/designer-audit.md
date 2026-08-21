# UI Audit: Wave 83 NPC missile incoming warning (toast only)

**Auditor:** `[designer]`
**Scope:** NPC missile incoming warning UI only. `src/systems/hud.js` (`toastForEvent` `npcFire` missile branch). `src/systems/song.js` is audio, not visual. No new HUD nodes.
**Review file:** `C:\Projects\WebSim\out\w83\missiles\designer-audit.md`
**Method:** `orchestrator/references/ui-audit.md` + `orchestrator/assets/designer-persona.md`. Source + `src/ui/hud.css`. No Playwright. [NO BROWSER COVERAGE].
**Date:** 2026-08-21
**Product source:** review only (no `src/` edits)

Owner freeze: toast + song, no `commLine`, FORE/AFT hit-only, no aim-glass gauge. Literal `Incoming dart.` `textContent`. HUD-01 / HUD-02 stay closed. Brief: `docs/NpcMissilesDesign.md`. Q2: `docs/OwnerDecisionsWave82.md`.

## UI Audit: incoming dart toast (`toastForEvent` npcFire missile)

### Summary
The incoming warning reuses the existing off-column toast pool. Copy is the authored literal `Incoming dart.` via `textContent` and class `warn`. No new glance node, no aim-glass gauge, no toast restyle, no name leak, no parallel `commLine`. FORE/AFT still flashes only on `playerHit`. No Blocker. No Major.

### Verdict
**CLEAN.** 0 blockers, 0 majors, 0 minors, 2 suggestions.

### What's done well
- Warning rides the existing `rw-toasts` stack (`hud.js:724-730`). `initHud` does not add a child under `#hud` for inbound count, aspect ring, or lock box. HUD-01 empty hub and HUD-02 family skins stay closed.
- Copy is the frozen constant `INCOMING_DART_TOAST = 'Incoming dart.'` (`hud.js:53`). `pushToast` writes `slot.el.textContent` (`hud.js:997`). No `innerHTML` in `hud.js`. Attacker `state.name` / `from` never enter the node.
- Gate is `weapon === 'missile'` and `target === 'player'` (`hud.js:554-558`). Cannon `npcFire` returns `null`. Missing missile target does not toast.
- Throttle `DART_TOAST_GAP = 2.5` (`hud.js:54, 556-557`) plus same-key lifetime refresh (`hud.js:982-984`) keeps a volley from filling five slots. Matches the brief (2.5 s gap like `sunHeat`).
- Class is existing `.warn` (`hud.js:558`; `hud.css:621`). Toast CSS was not restyled for this slice. Color is not the only cue: the words name the threat; the 3 px left bar is redundant amber.
- `.rw-toast.warn` keeps `color: var(--white)` (`#dce8f4` on `rgba(2, 6, 13, 0.78)` ≈ `#02060d`). Contrast is ~16:1 (WCAG AAA). High-contrast mode only darkens the scrim (`hud.css:958-965`). Colorblind remap tints `--rw-warn` / `--amber` on the bar only (`hud.css:937-941`); body text stays white.
- Toasts sit off the aim column (`hud.css:589-594`: `top: 14px; right: 168px`). Combat fade hits chart marks, not toasts (`hud.css:586` vs toast block).
- Live region already on the pool: `role="status"` + `aria-live="polite"` (`hud.js:726-727`). No focus steal. Pointer-events none (`hud.css:6, 599`).
- FORE/AFT flash is still `playerHit` only (`hud.js:1015-1017, 1233-1243`). `npcFire` missile does not set `selfHitFlashUntil`.
- Hunt telegraph `say()` stays on telegraph (`npc.js:1514-1516, 1882`). Dart spawn emits `npcFire` only (`npc.js:1526-1528, 1892-1894`). No parallel `commLine` for the same spawn.
- `song.js` branches `npcFireMissile` (`song.js:69, 423`). No visual HUD node. Volley cap still applies (`song.js:429-437`).
- Bio mood treats `npcFire` as combat clock only (`bio.js:78-80`). No extra overlay.

### Findings

None at 🔴 Blocker / 🟠 Major / 🟡 Minor.

#### 💡 Suggestion: incoming dart uses polite status, not assertive alert
**Location:** `src/systems/hud.js:726-727, 554-558`
**Issue:** The toast pool is `role="status"` / `aria-live="polite"`. A dart warning is time-critical. A polite live region may queue behind other HUD status text. This is the frozen reuse of the existing channel, not a new node.
**Fix:** Do not add a second live region (that would be a new HUD node). If a later a11y pass promotes combat toasts, keep one pool and document assertive vs polite. Do not change copy. Do not open HUD-01.

#### 💡 Suggestion: expired toast slots keep text in the accessibility tree
**Location:** `src/systems/hud.js:1022-1029, 997`; `src/ui/hud.css:612-618`
**Issue:** Expire removes `.show` (opacity 0) but does not clear `textContent` or set `aria-hidden`. `Incoming dart.` can remain in a faded slot until that slot is reused. Pre-existing toast behavior; this slice inherits it.
**Fix:** Optional later on the shared pool: clear text or `aria-hidden="true"` when `until` hits 0. Do not restyle `.warn`. Do not add a dart-only node.

### Required checks

| Check | Result |
| --- | --- |
| Toast readable | **Pass.** Authored `Incoming dart.` via `textContent`. Uppercase CSS (`hud.css:605`) is visual only. White on void ~16:1. `--rw-text-scale` applies (`hud.css:603`). |
| Not name-leaking | **Pass.** Constant only. No `e.ship`, `state.name`, or `from`. XSS path closed (`textContent`). |
| No new glance node on the aim glass | **Pass.** No extra `el()` under reticle / hub / rails. Mem field `lastIncomingDartAt` only (`hud.js:957`). |
| Color + shape pairing (if restyled) | **Pass / N/A restyle.** `.rw-toast.warn` unchanged: 3 px left bar (`shape`) + `--amber` (`color`) + white words. Toast sheet not edited for this slice. |
| Contrast of `.warn` reuse | **Pass.** Warn body stays `--white` (not amber text like `.sting`). Colorblind and contrast overrides keep readable body text. |
| No `commLine` for same spawn | **Pass.** Missile emit is `npcFire` only. Telegraph hail is earlier and separate. |
| FORE/AFT hit-only | **Pass.** Flash gated on `playerHit` (`hud.js:1015-1017`). |
| Literal `Incoming dart.` | **Pass.** `INCOMING_DART_TOAST` (`hud.js:53, 558`). No `▲` prefix (other warn lines use glyphs; owner freeze forbids changing this copy). |
| HUD-01 / HUD-02 closed | **Pass.** No rail, hub, family, or contacts edits. |
| Song not visual | **Pass.** `song.js` cue only. |

### Severity mapping

- 🔴 / 🟠 = none. Worker may report DONE on UI.
- 🟡 = none.
- 💡 = document only. Do not change the frozen literal. Do not add HUD nodes.
