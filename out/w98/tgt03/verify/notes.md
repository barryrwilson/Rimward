# WAVE98 TGT-03 verify notes

Status: CLEAN

Verifier did not edit project source. Evidence lives under `out/w98/tgt03/verify/`.

## Probe

`node out/w98/tgt03/probe.mjs` exit 0.

All rows PASS. Final line: `WAVE98 helper matrix PASS`.

Log: `out/w98/tgt03/verify/probe-log.txt`.

Did not run full `npm run test:boot`.

## Static review

### `src/game/npc-fire-toast.js`

- Static literals `Incoming fire.` / `Incoming dart.` (`INCOMING_FIRE_TOAST` / `INCOMING_DART_TOAST`).
- Separate memos: `lastIncomingFireAt` vs `lastIncomingDartAt`.
- Both gaps `2.5` (`FIRE_TOAST_GAP` / `DART_TOAST_GAP`).
- Unknown / empty / missing / `__proto__` / `constructor` / `prototype` / inherited weapon fail closed (`null`).
- Cannon + omit / `null` / `'player'` → fire. Cannon + live ship object → `null`.
- Docked / jumping suppress fire only. Docked dart still returns dart.
- No DOM, no `WEAPONS[`, no `innerHTML`.

NPC emit still matches the matrix (`src/systems/npc.js`):

- Hunt: `weapon: 'cannon', target: ai.target`
- Ace: `weapon: 'cannon'` (omit)
- Missile: `target: 'player'`

### `src/systems/hud.js` `npcFire` branch

```js
case 'npcFire': {
  const t = npcFireToast(e, ctx, mem);
  if (!t) return null;
  if (t.text === INCOMING_DART_TOAST) return { text: INCOMING_DART_TOAST, cls: 'warn' };
  if (t.text === INCOMING_FIRE_TOAST) return { text: INCOMING_FIRE_TOAST, cls: 'warn' };
  return null;
}
```

- Fail-closed if helper text is not one of the two static strings.
- `pushToast` uses `slot.el.textContent` only. No `innerHTML` in `hud.js`.
- Mem inits both `lastIncomingDartAt` and `lastIncomingFireAt`.
- Local `INCOMING_DART_TOAST = 'Incoming dart.'` and unused `DART_TOAST_GAP = 2.5` remain so WAVE83 string pins still match. Gap enforcement for dart now lives in the helper.

### FORE / AFT

- `selfHitFlashUntil` / `selfHitFlashAft` set only on `ev.type === 'playerHit'`.
- `npcFire` case does not mention `selfHitFlash`.
- Facing glance uses that flash window only.

### Edge arrow

- Created once: `el('div', 'rw-edge-arrow is-hidden', root)` then `setAttribute('aria-hidden', 'true')`.
- Off-screen branch: `lockPark = docked || jumping` adds `is-hidden`; does not assign `ctx.targets.current`.
- No `rw-incoming` / `rw-inbound` / `aspect-ring` / `lock-box`.

### HUD-01 / toast column

- Reticle clamp still `cx - 44` / 80 px hub (`hud.js` ~1194; `.rw-reticle` 80×80 in `hud.css`).
- `.rw-toasts` is `top: 14px; right: 168px; left: auto` (off-column). Worker did not need to change `hud.css` for this toast.

### WAVE83 dart pins in `scripts/boot-test.mjs`

WAVE83 still asserts:

- `INCOMING_DART_TOAST = 'Incoming dart.'` in `hud.js`
- `npcFire` case contains `INCOMING_DART_TOAST`
- `DART_TOAST_GAP = 2.5` in `hud.js`
- toast copy `Incoming dart.`, throttle vs cannon, no new incoming gauge

Those strings are still present. WAVE98 block adds fire + park/aria pins.

### Radar / turret docs

Worker file list does not include `docs/Tgt03RadarDesign.md` or `docs/NpcTurretsDesign.md`. Awareness doc names radar as a sibling only.

`git diff --stat` shows `src/ui/hud.css` dirty in this worktree (~382 lines). Diff does not add incoming/lock-box/toast/edge-arrow tgt03 tokens. Treat as other-wave dirt, not this worker.

## Browser (Playwright MCP)

Vite: `npx vite --port 5179 --strictPort --host 127.0.0.1` (first bind was `::1` only; 127.0.0.1 refused until `--host 127.0.0.1`).

URL: `http://127.0.0.1:5179/` after New Game / Freehold Greenhand.

Idle `#hud`:

- 20 children. No incoming/inbound/lock-box/missile-gauge class.
- `.rw-reticle` 80×80.
- `.rw-toasts` at x≈709, y=14 (right, off hub).
- One `.rw-edge-arrow` with `aria-hidden="true"`, `is-hidden`.

Far dummy lock, flying: arrow shown (`display:block`), `aria-hidden` still `"true"`, lock kept.

Then `flags.docked = true`: arrow `is-hidden` / `display:none`, lock still the dummy at x=1e6.

Screenshots:

- `out/w98/tgt03/verify/hud-idle.png`
- `out/w98/tgt03/verify/hud-lock-arrow-fly.png`
- `out/w98/tgt03/verify/hud-docked-park.png`

Live `npcFire` toast: **not observed**. After `gate.jumping = true` with no destination, `jump.js` `midpointSwap` threw `Cannot read properties of undefined (reading 'hub')` and the animation loop stopped. Events sat on `ctx.events`. That is a verifier harness fault, not a toast-matrix miss. Probe covers the helper.

Console: that jump TypeError only (see `console.txt`). No new HUD module errors on idle/docked.

## Cleanup

Playwright `browser_close`. Vite job killed. Ports 5179 and 9419 not LISTENING after stop.

## Nits (not bugs)

- `DART_TOAST_GAP` in `hud.js` is unused at runtime (WAVE83/98 source pin).
- Fake jumping is unsafe in the live client (clears lock via `jump.js`, can throw). Docked park is the valid live park check.
