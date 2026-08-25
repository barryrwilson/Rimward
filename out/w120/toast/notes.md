# Wave 120 PR1 toast-flood — notes

**Status:** landed  
**Merge law:** `out/w118/toast/shared-contract.md` (wins on conflict)  
**Census:** re-read live `src/` this wave. Wave 118 inventory line numbers are historical.

## Live cites after PR1 (code wins)

| Piece | Cite |
|---|---|
| `TOAST_LIFETIME = 4` | `src/systems/hud.js` 64 |
| `TOAST_SLOTS = 5` | `hud.js` 65 |
| `TOAST_DEDUP_WINDOW = 8` | `hud.js` 66 |
| linger helpers (5-row ring, not chip-tied) | `hud.js` 530–555 |
| `saveBlocked` autosave vs berth copy | `hud.js` 597–600 |
| boot chips `aria-hidden=true` | `hud.js` 848–855 |
| `pushToast` window / real-show order | `hud.js` 1186–1213 |
| expire `aria-hidden`, keep text, keep linger | `hud.js` 1238–1244 |
| `requestAutosave` `source: 'autosave'` | `src/game/save.js` 1040 |
| berth emit `source: 'berth'` | `save.js` 1422, 1428, 1535, 1540 |
| optional hide | `src/ui/hud.css` 734 |

## Lands

1. Identical `cls|text` inside 8 s of last show/refresh: one visible chip, or suppress after expire.
2. Linger is five `{ key, lastShown }` rows. Chip reuse does not clear linger.
3. Visible match extends `until`, does not rewrite `textContent`, bumps linger.
4. Expire: `until=0`, remove `show`, `aria-hidden=true`, keep `textContent` and `slot.key`.
5. Real show: `aria-hidden=false` then `textContent`.
6. Autosave copy is `▲ AUTOSAVE HELD — hostiles near` (no berth reason concat).
7. Berth / missing / unknown `source` uses `▲ SAVE BLOCKED — ` + reason.
8. `save.js` emit tag only. Overlay import, KeyL, `setBerthOpen` untouched.
9. `frameLines`, npcFire 2.5 s, sunHeat throttles, five slots, lifetime 4 kept.

## Probe

```
node --import ./scripts/with-css-stub.mjs out/w120/toast/probe.mjs
```

Headless. No Vite. No Chrome.

## Did not touch

`state.js`, `controls.js`, `hail.js`, `galaxychart.js`, `overlay-policy.js`, `autopilot.js`, `scripts/boot-test.mjs`, wishlist, `PROGRESS.md`, Digit 0/8/9, toast z, hail toasts, persist, pause.
