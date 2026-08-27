# Onb01 PR1 notes (Wave 142)

## Coupling

- `onboarding.js` **reads** `ORIGINS` from `state.js` (`Object.hasOwn` only). Does not write `state.js`.
- HUD init reparents the existing `.rw-onboard-hint` onto `#hud`. Onboarding init stays **before** HUD (`main.js`).
- Combat collapse still owns CONTROLS hide; PR1 adds `aria-expanded` through the same helper.
- Do not claim `origins.js`, pause, hail, chart, berth, `save.js`.

## WAVE6 pins

- Section **a** (~1719–1752): first card is **look** (`look and turn`); `seen` includes `look` not `move`; pin `ctx.world.origin = 'greenhand'` in that SETUP only; dock suppression still uses id `dock` / fragment `J — dock`.
- Section **g** (~1930–1931) asserts `seen.includes('look')` on the dock autosave snapshot. Id `move` is retired. First lesson id is `look`.

## Surprises

- `dock` `when` is now origin-set, not 45 u range. WAVE6 still parks at the station for the suppression tick; the real mute is `settings.hints = false`.
- After section a restores `hints = true`, later WAVE6 ticks can show the next unseen lesson card (same as pre-PR1 advancing to `dock` once in range).
- Hint CSS keeps a `body > .rw-onboard-hint { position: fixed }` fallback if `#hud` is missing.

## Honor

- KeyH/J/L/M/P/D unchanged. No new Digit. No `flags.paused`. No teleport. No auto-open overlays. `textContent` only.

## Wave 142 pin retarget (orchestrator)

Section **g** `onboardingPersisted` now requires `look`. Grep of `scripts/boot-test.mjs` for `'move'` / `"move"` onboarding asserts: one hit, that pin. WAVE127 / WAVE132 / REDMARCH untouched.

### Security (append)

- Risk: Low. No new HIGH/CRITICAL.
- Pin change is a harness id string only. No `innerHTML`. No new `WORLD_FIELDS`. No persist-shape change. Hostile `seen` skip remains MEDIUM (cite only).

### Code review (append)

- No Blocker / Major. WAVE6 **a** banks `look`; WAVE6 **g** now keys the same id. Roundtrip can pass SAVE FIELDS if section a ran. Other waves not rewritten.

## Wave 142 HUD WAVE B `hintOffBottom` retarget

PR1 moved `.rw-onboard-hint` `left:14px; top:48px` into `hud.css`. Harness `hintEl.style.cssText` no longer holds those strings. WAVE B now pins: one node, class `rw-onboard-hint`, parent `#hud` or not `.rw-reticle`, `!cssText.includes('bottom:6%')`. Hail pins (`hailCard`, `hailLowerLeft`, `hailMax360`) stay. No inline `top:48px` / `left:14px` restore. WAVE127 / WAVE132 / origins / main / save / screens.css / wishlist / PROGRESS.md untouched.

Harness note: stub `querySelector` is null, so HUD reparent onto `#hud` does not run in boot-test. Hint parent is `document.body`. Body is not the reticle, so the parent clause still holds. CSS hook does not apply stylesheet pixels; do not pin computed top/left.

### Security (WAVE B append)

- Risk: Low. No new HIGH/CRITICAL.
- Harness assert only. No `innerHTML`. No persist. No new WORLD_FIELDS.

### Code review (WAVE B append)

- No Blocker / Major. Hail slot stays inline `bottom:22%`. Hint is not the hail bottom slot (`bottom:6%` absent on cssText).

## Wave 142 HUD WAVE B `hintOffBottom` parent-clause drop

Verifier WAVE B still failed: `hintOffBottom:false` with hail pins true. Extra parent/`#hud`/reticle clause was too strict under the CSS stub (`querySelector` is null so reparent never runs; `.parent` vs `.parentNode` is unreliable). Replaced `hintOffBottom` with: one node, class includes `rw-onboard-hint`, `!cssText.includes('bottom:6%')`, `!cssText.includes('bottom:22%')`. No parent/hud/reticle checks. Hail pins unchanged. No inline top/left restore. WAVE127 / WAVE132 / REDMARCH untouched.

### Security (WAVE B parent-clause drop)

- Risk: Low. No new HIGH/CRITICAL.
- Harness assert only. No `innerHTML`. No persist. No new WORLD_FIELDS.

### Code review (WAVE B parent-clause drop)

- No Blocker / Major. Removed unused `hudRootB` / `reticleB` / `hintParent` locals so they cannot fail the pin. Hail slot still owns `bottom:22%`; hint must not carry that token or `bottom:6%`.

