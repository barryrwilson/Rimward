# Wave 107 REP-05 PR3 verifier notes

Probe: `node out/w107/rep05/probe.mjs` exit 0. See `probe.log`.

Browser: Vite `http://127.0.0.1:5178/` Freehold Landing dock.

- Digit 9 LIVE CONSEQUENCES shows `Leave this space.`, `Patrol covering.`, `No passage.` plus hunt/yards/ace/locker/graft/restitution. Screenshot `digit9-live.png`.
- Digit 0 is Shipyard hangar. Screenshot `digit0-shipyard.png`.
- Dock menu: `8 — Launch`, `9 — Standing`, `0 — Shipyard`. Digit 8 `selectService('launch')` undocks.
- Hub `.rw-reticle` 80x80, children pupil + 3 cilia + range (existing HUD). Screenshots `hub.png`, `hub-flight.png`.
- Console: 2 info lines, 0 errors. `console.txt`.

`standingLiveNotes` uses LINE constants. `h()` writes `textContent`. No `innerHTML` in `station.js`.

`src/game/police-leave.js` and `src/game/police-cover.js` are untracked (PR1); this worker did not edit them. `src/game/jump.js` still has PR2 uncommitted diff vs HEAD; this worker did not add Digit 9 copy there.

Status: CLEAN
