# WAVE99 radar PR2 jump-park verify

**Status:** CLEAN  
**Date:** 2026-08-23  
**Domain:** mixed / frontend  
**Vite:** http://127.0.0.1:5174 (this session). No CDP 9412.

Did not edit `src/`, `scripts/boot-test.mjs`, or docs. Evidence only under `out/w99/radar/verify/`.

## Probe

```
node out/w99/radar/probe.mjs
```

Exit 0. Line: `WAVE99 contactsGate PASS`. 24 pins green (heal, garbage scanner, dock, jump, Mk I/II show).

## Static

| Check | Result |
|---|---|
| `contactsGate(scanner, ctx.flags.docked, jumping)` | `src/systems/hud.js` 1384–1385. `jumping = !!ctx.gate.jumping` at 1171 |
| Assign `ctx.world.scanner` | none in `hud.js` |
| Assign `ctx.world.contacts` | none in `hud.js` |
| `.rw-radar` | none in `src/` |
| Live classes | `.rw-contacts` / `.rw-edge-arrow` / `.rw-nav-gate-cue` |
| CSS | no new radar class; hide via `#hud .is-hidden { display: none }` |
| Mk I / Mk II | `CONTACT_MK1_CAP = 16`, `CONTACT_SLOTS = 24`; range `U.ENCOUNTER_BUBBLE` / `* 2`; kinds `civ` / `hostile` / `lock` |
| Helper | `src/game/contacts-gate.js` — no DOM; garbage scanner heals to 0; park does not mutate scanner |
| `innerHTML` in `hud.js` | 0 |

Park is HUD-only. Hangar/save still own scanner writes.

## Browser (Playwright MCP)

CONTINUE on title (autosave). Space at Freehold Drift. `window.__ctx` drives scanner / docked / jumping.

| State | `.rw-contacts` | Scanner |
|---|---|---|
| Scanner 0, space | `is-hidden`, `display:none` | 0 |
| Scanner 1, space | shown, `display:block`, pips `is-civ` / `is-hostile` | 1 |
| Scanner 2, space | shown; Mk II `is-far` drops vs Mk I | 2 |
| Jumping, scanner 2 | hidden | still 2 |
| Docked flag, scanner 2 | hidden | still 2 |
| After park clear | shown again | 2 |

Hub computed size 80×80. Crop `05-arc-crop.png` is a thin bottom arc, not a PPI disc. Hub crop `06-hub.png` is the empty dashed ring.

Console: 0 errors, 0 warnings from this change. `Incoming fire.` / SAVE BLOCKED toasts come from the Continue save (sibling / combat), not this PR.

Dock and jump used the live flags HUD reads (`ctx.flags.docked`, `ctx.gate.jumping`). Did not walk station outfitting or a real gate charge. Those writers are still station.js / jump.js.

## Ports / teardown

Started Vite 5174. Did not start Chrome CDP 9412. Playwright MCP browser closed after shots. Vite stopped. Evidence files stay.

## Screenshots

- `01-space-mk2.png` — arc visible
- `02-jumping.png` — JUMP chrome; arc gone
- `03-docked.png` — arc gone (flag dock)
- `04-scanner0.png` — arc gone
- `05-arc-crop.png` — tick / chevron pips
- `06-hub.png` — empty 80 px hub
- `browser-states.json` — eval dump
