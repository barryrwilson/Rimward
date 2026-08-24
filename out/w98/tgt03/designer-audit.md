# Designer audit: Wave 98 TGT-03 remaining awareness (HUD impl)

| Field | Value |
|---|---|
| **Reviewer** | UI/UX auditor (review only; product source not edited) |
| **Date** | 2026-08-23 |
| **Persona** | `orchestrator/assets/designer-persona.md` |
| **Checklist** | `orchestrator/references/ui-audit.md` |
| **Scope** | Live HUD after Wave 98 TGT-03 impl: toast `Incoming fire.` for cannon-vs-player; keep `Incoming dart.`; park `.rw-edge-arrow` when docked/jumping; `aria-hidden="true"`; no second arrow; no hub gauge |
| **Product source** | `src/systems/hud.js`, `src/game/npc-fire-toast.js`, `src/ui/hud.css` (unchanged class `.rw-edge-arrow`) |
| **Not in scope** | Product `src/` edits, Vite, Playwright, sibling radar/turrets trees, `PROGRESS.md` |
| **Prior notes** | Worker self-audit `out/w98/tgt03/ui-audit.md` (read; not copied). Probe `out/w98/tgt03/probe-results.txt`. Boot `out/w98/tgt03/boot-excerpt.txt`. Integrator brief `docs/Tgt03AwarenessDesign.md`. |
| **Method** | Read-only HUD + helper + CSS + existing probe/boot notes. No browser. No Vite. [NO BROWSER COVERAGE]. |
| **Graph** | `graph_resolve` returned `blocked_ambiguous` on unrelated Word/PPT/Drive workflows (false match on “review”). Owner already named this markdown scratch path. Those workflows are not this task. Draft Drive publishing is ignored. |
| **Verdict** | **CLEAN** — no Blocker, no Major |

This pass is independent of the worker `ui-audit.md`. It does not upgrade that file.

---

## UI Audit: attacker-fire toast + lock edge arrow (Wave 98 TGT-03)

### Summary

Cannon-vs-player reuses the existing off-column toast channel as static `Incoming fire.` with class `warn`. Dart stays a second line with its own clock. The lock cue stays one amber triangle (`.rw-edge-arrow`), parked while docked or jumping, `aria-hidden`, and distinct from NAV-02 `.rw-nav-gate-cue`. The 80 px hub stays empty. No incoming gauge. Digit 0/8/9 stay out of this serial.

### Confirm scorecard

| Check | Result | Evidence |
|---|---|---|
| Empty 80 px hub still empty | **Pass** | Reticle `80px` / `80px` `hud.css:184–191`. Clamp `cx - 44` `hud.js:1194`. No lock box, no incoming gauge, no extra hub child. Boot `noNewHudChild`. |
| Toasts off-column | **Pass** | `.rw-toasts` `top: 14px; right: 168px; left: auto` `hud.css:635–640`. Chip stack holds center (`hud.css:648–652`). Aim column stays free. |
| `textContent`, warn class, static literals | **Pass** | Helper returns `{ text: INCOMING_FIRE_TOAST, cls: 'warn' }` `npc-fire-toast.js:50, 58`. HUD remaps only those two literals `hud.js:568–573`. `pushToast` writes `slot.el.textContent` `hud.js:1112`. Class `rw-toast show warn` `hud.js:1113`. No ship-name interpolation. Probe `noShipName` / `staticFireCopy` / `fire cls warn`. |
| Dart and fire are two distinct lines / clocks | **Pass** | `INCOMING_DART_TOAST` vs `INCOMING_FIRE_TOAST` `npc-fire-toast.js:7–8`. Separate `lastIncomingDartAt` / `lastIncomingFireAt` `npc-fire-toast.js:48–57`; HUD mem `hud.js:1055–1056`. Gaps both `2.5` `npc-fire-toast.js:9–10`. Probe: dart then fire both PASS. Toast keys are `cls + '|' + text` `hud.js:1097` so the two lines do not collapse into one slot. |
| FORE/AFT still hit-only | **Pass** | Self flash arms only on `playerHit` `hud.js:1131–1134`. Facing set `hud.js:1357–1376`. `npcFire` does not flash FORE/AFT. Boot `foreAftHitOnly`. |
| Lock arrow vs NAV-02 gate cue stay distinct classes | **Pass** | One lock node `.rw-edge-arrow` `hud.js:735`. Gate node `.rw-nav-gate-cue` + ticks + notch `hud.js:737–741`. CSS triangle `hud.css:576–594` vs ticks/notch `hud.css:1003–1037`. Both may show. Boot `noSecondArrow` / `edgeArrowCount`. |
| Park `.rw-edge-arrow` when docked/jumping | **Pass** | `lockPark = !!(ctx.flags.docked \|\| ctx.gate.jumping)` then `is-hidden` `hud.js:1303–1306`. Does not clear `targets.current`. Fire toast also parks `npc-fire-toast.js:25–29, 55`. Dart still toasts while docked (WAVE83; probe `dock dart unchanged`). |
| `aria-hidden="true"` | **Pass** | `edgeArrow.setAttribute('aria-hidden', 'true')` `hud.js:736`. Name stays on the on-glass bracket. Toasts remain the live region `role="status"` `aria-live="polite"` `hud.js:763–766`. |
| No second arrow | **Pass** | Single `el('div', 'rw-edge-arrow …')` in `src/`. CSS class used once in JS. Chartmarks stay diamonds. Gate stays ticks + notch. |
| No hub gauge | **Pass** | No `rw-incoming` class. Reticle children stay pupil / cilia / RANGE `hud.js:697–700`. |
| Reduced motion: no new `@keyframes` on the arrow | **Pass** | `.rw-edge-arrow` is transform + `::before` triangle only `hud.css:576–594`. Comment on gate cue: transform only, no `@keyframes` `hud.css:1001–1002`. Global kill `body.rw-reduced-motion #hud *` `hud.css:1173–1177`. Boot `noKeyframes`. FORE/AFT flash CSS unchanged `hud.css:293–307`. |
| Color via CSS vars; triangle shape is the non-color cue | **Pass** | Fill `border-bottom: 14px solid var(--amber)` `hud.css:592`. `--amber` aliases `--rw-warn` `hud.css:23`. Colorblind remaps `--rw-warn` `hud.css:1134–1138`. Rotation via `atan2` `hud.js:1317`. Shape is a CSS triangle, not a color-only pip. |
| Digit 0/8/9 untouched | **Pass** | `hud.js` has no `Digit0` / `Digit8` / `Digit9` / `KeyT` / `KeyV`. Station papers stay in `station.js`. |
| Contrast / colorblind: warn toast uses existing classes | **Pass** | `.rw-toast.warn { border-left-color: var(--amber); }` `hud.css:736`. Contrast retints `.rw-toast` scrim `hud.css:1155–1164`. Colorblind retints `--rw-warn`. No new toast class. Words remain the primary cue (`text-transform: uppercase` `hud.css:720`). |

---

### What's done well

- **Toast channel reuse.** Attacker fire does not add a glance node. It rides `rw-toasts` with the same `warn` treatment as `Incoming dart.`
- **Static copy.** Helper and HUD both pin `'Incoming fire.'` / `'Incoming dart.'`. Unknown helper text fail-closes (`hud.js:573`). HUD never interpolates a ship name.
- **Two clocks.** Dart then cannon can show two lines. Throttle is per-kind, 2.5 s. Probe matrix PASS.
- **Park is honest.** Docked / jumping hides the lock triangle and suppresses fire toast. The lock is not cleared. Dart WAVE83 path stays.
- **Three jobs stay three glyphs.** Crowd = `.rw-contacts`. Lock off-glass = amber triangle. Route = cyan ticks + notch.
- **AT.** Decorative triangle is `aria-hidden`. Incoming fire is announced through the existing polite live region via `textContent`.
- **Color is never the only cue.** Toast has words. Arrow has triangle + rotation. FORE/AFT has words + fill vs hollow. Colorblind/contrast remap `--rw-warn` / toast scrim without a new class.
- **CSS class freeze.** `.rw-edge-arrow` is not renamed and is not restyled into NAV-02.

---

### Findings

No 🔴 Blocker. No 🟠 Major.

#### 🔴 Blocker: None

#### 🟠 Major: None

#### 🟡 Minor: Edge-arrow drop-shadow is a hardcoded amber rgba

**Location:** `src/ui/hud.css:593`  
**Issue:** Triangle fill uses `var(--amber)` so colorblind remaps it. The `filter: drop-shadow(0 0 4px rgba(255, 180, 84, 0.6))` glow does not follow `--rw-warn`. Shape + rotation still carry the cue. This is the unchanged class, not a Wave 98 restyle.  
**Fix:** Out of this serial unless the owner opens a restyle. Later: `color-mix` on `var(--amber)` if a colorblind pin shows a mismatched halo. Do not add `@keyframes`. Do not merge with `.rw-nav-gate-cue`.  
**Status:** accepted (pre-existing; class freeze)

#### 💡 Suggestion: Edge arrow still has no `pointer-events: none`

**Location:** `src/ui/hud.css:576` (pre-existing)  
**Issue:** NAV-02 cue sets `pointer-events: none` (`hud.css:1010`). The lock triangle does not. Width/height are 0 so the hit area is already empty. `#hud` is `pointer-events: none` except listed buttons.  
**Fix:** Out of this serial unless the owner opens a restyle.  
**Status:** accepted (do not restyle into NAV-02)

---

### Reduced motion / contrast / colorblind

- No new `@keyframes` on `.rw-edge-arrow`. Motion is `transform` only (`hud.js:1318`).
- Global reduced-motion kill already covers toast fade and FORE/AFT flash (`hud.css:1173–1177`). Facing flash also has an explicit `animation: none` + outline (`hud.css:305–307`).
- Warn toast does not invent a palette. It uses `.rw-toast.warn` → `var(--amber)` → `--rw-warn`.
- Contrast strengthens toast scrim/border without changing copy or placement.

---

### Hub / digits / occupancy

- 80 px hub stays empty. No lock box. No incoming gauge. RANGE is existing in-envelope copy on the reticle, not an inbound widget.
- Digit 0/8/9 and KeyT/KeyV untouched.
- Off-column toasts (`right: 168px`) stay clear of the aim column and of the center autopilot/automine chips.
- Occupancy of lock triangle + gate chevron on the same edge is pre-existing NAV-02 law: both may show. This wave does not add a third arrow.

---

### Probe / boot (read, not re-run)

- Helper matrix: all PASS including dart then fire, separate gaps, dock/jump suppress fire, dart unchanged while docked (`out/w98/tgt03/probe-results.txt`).
- Boot WAVE98 TGT-03 flags all true, including `foreAftHitOnly`, `noNewHudChild`, `edgeAriaAttr`, `noSecondArrow`, `noKeyframes`, `lockPark`, `staticFireCopy`, `noShipName` (`out/w98/tgt03/boot-excerpt.txt`).

---

### Severity mapping (worker lifecycle)

🔴/🟠 = none. 🟡/💡 = pre-existing class freeze; do not restyle in this serial.
