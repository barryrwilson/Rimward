## Status
BUGS_FOUND

## What I tested
Graph resolve: `proceed_unmodeled` (`openclaw-janet/agent-qa`). Did not edit `src/`.

### Pins
`node out/w92/bio04/boot-pins.mjs` exit 0:

`WAVE92 BIO04 PASS catalog=Psionic bolt hex=0xff6ad5 livingHeat=8 builtDry=0 graftedHeat=8`

Covers living heat, built dry, grafted fire, unknown group not cannon, no `power`/`psi` on `createShipState`, Unknowables miss, NPC refuse family psionic.

### Grep
See `out/w92/bio04/verify/grep.txt`.

- `src/game/psionic.js` does not import `hangar.js` (comment only).
- `FAMILY_COLORS.psionic = 0xff6ad5`; no `beam: true` on `WEAPONS.psionic`.
- `Digit5` is in `TRACKED`; `PREVENT_DEFAULT` is Space-only.
- HUD empty copy is `5 · —`.
- Unknown `GROUP_WEAPON` returns `null`, not cannon.

### Frontend
Vite `http://127.0.0.1:5182/` (strictPort). Chrome CDP `9442`, profile `out/w92/bio04/verify/chrome-profile`. Harness: `live-cdp.mjs`.

New Game → origin Digit1 Freehold Greenhand.

| Check | Result |
|---|---|
| Digit 5 selects group 5 | PASS |
| Living starter WPN `5 · Psionic bolt` | FAIL — WPN `5 · —` |
| LMB heat + magenta `0xff6ad5` bolts | FAIL until hullKind is written |
| Digit 1 Energy cannon + cyan bolts + heat | PASS |
| Digit 2 Disruptor bolts | PASS |
| Digit 3 / 4 still map (`3 · Mining laser Mk I`, `4 · —`) | PASS |
| Dock Digit 5 → Repair bays | PASS (`REPAIR BAYS — HULL & SYSTEMS`) |
| No aim-glass extra gauge | PASS (reticle children = 5; no `.rw-incoming`) |
| Console / page exceptions | PASS (0 app errors) |
| Forced `hullKind='built'` → `5 · —`, heat 0, no spawn | PASS |
| Forced `grafted: true` → `5 · Psionic bolt`, family `mech`, magenta bolts, heat | PASS |
| No triad fields on player | PASS |

After dock autosave, HUD WPN behind the repair panel reads `5 · Psionic bolt` (hullKind now present). Verifier did not treat that as the New Game flight check.

Stopped Vite 5182 and Chrome 9442. Ports not LISTENING.

## Bugs found
### P2 — New Game living starter never gets `player.hullKind` until dock, so Digit 5 is dry

`canFirePsionic` is `hullKind === 'living'` or own-key `grafted === true`.

`createShipState` does not write `hullKind`. Hangar `writeStarterHangar` / `syncMountedToPlayer` write `'living'`, but a fresh New Game does not call those until save autosave on `'docked'`.

Live dump after Greenhand, still in Freehold flight (player keys have no `hullKind`):

- WPN `5 · —`
- LMB: `fireHeld` true, heat 0, `psiBolts` 0
- HUD family still `bio` (default), so the hull looks living
- Digit 1–2 still spawn conventional bolts

Same pattern on two full Chrome runs. Wait 10s after flight-ready did not write `hullKind`. Digit 1–4 dumps still `hullKindRaw: null`. Dock then shows `5 · Psionic bolt`.

`boot-pins.mjs` sets `ctx.player.hullKind = 'living'` in its harness, so the pin pass does not catch this path.

Contract player outcome: fly a living starter, press 5, WPN names the catalog row, LMB fires a heat-limited magenta bolt. That path fails until the first dock.

## Environmental issues
- Playwright was not used. Chrome CDP `Page.loadEventFired` often timed out; navigate still reached the app.
- First Chrome `/json/version` fetch failed; page websocket `/json/new` worked.
- Did not use ports 5180 / 5181 / 9440 / 9441.

## Evidence
- Pins: `out/w92/bio04/verify/boot-pins.txt`
- Grep: `out/w92/bio04/verify/grep.txt`
- Browser log: `out/w92/bio04/verify/browser-log.txt`, `browser-log.json`
- Harness: `out/w92/bio04/verify/live-cdp.mjs`
- Shots: `01-boot.png`, `02-digit5-wpn.png`, `03-digit5-fire.png`, `04-digit1.png`, `05-digit2.png`, `06-dock-repair.png`, `07-built-dry.png`, `08-grafted-fire.png`, `09-aim-glass.png`
