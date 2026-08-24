# HUD-03 Wave 103 first impl notes

Serial: remaining optional audio-alerts (PR1–PR4 together).
Merge law: `out/w102/hud03/shared-contract.md` wins. Wave 102 deputize stands. No `docs/OwnerDecisionsWave103.md`.

## Landed
- `ctx.settings.hudAlerts` default `false`.
- `settings.js` FIELDS boolean + CHECKBOXES `HUD audio alerts` after Reduced motion, before Mute all audio.
- Persist `rimward-settings-v1`. Load: `Object.keys(FIELDS)` + own-key copy. Corrupt JSON fail-closed.
- `song.js` `HUD_ALERT_TYPES` subset silent unless `hudAlerts === true`. Mute / volume 0 still zero master.
- Combat `npcFire` / `npcFireMissile` / `playerHit` / whalesong not gated by `hudAlerts`.
- Incoming toast copy frozen. No new CUES key. No `hud.js` edit.
- WAVE103 section appended to `scripts/boot-test.mjs`. Probe: `out/w103/hud03/probe.mjs`.

## Verify
```
node out/w103/hud03/probe.mjs
```
Expected: `WAVE103 PROBE PASS`.

Full `npm run test:boot` not run here. Treat WAVE4 / WAVE26 / WAVE35 fails as pre-existing.

Playtest: KeyO, tick HUD audio alerts, confirm RANGE/MATCH/lock ticks; mute-all still silences them; Incoming fire./Incoming dart. unchanged.

## Ports
None. Vite not started. Port 5177 not claimed.

## Coupling
Song reads `ctx.settings.hudAlerts` live. Settings is the only writer. HUD still emits family ticks; song skips when the toggle is off.
