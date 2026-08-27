## Status
CLEAN

## What I tested
Static read of `src/systems/hud.js` and `src/ui/hud.css` against merge law `out/w130/dockapproach/shared-contract.md` and pins `out/w136/dockapproach/boot-pins.md`.

Node pin run: `out/w136/dockapproach/verify/static-pins.json`. All listed pins pass.

Git diff of worker files: `hud.js`, `hud.css`, `docs/Nav10DockApproachDesign.md`. Sibling `controls.js`, `station.js`, and `agent-api.js` also have local edits. Those diffs have no `DOCK_SLOW` / `.rw-slow-lamp` strings. This worker did not steal TGT-07 `cycleTarget` or MSN-04 mining dock rewrite.

Live Vite `127.0.0.1:5176`. Chrome CDP `9410` with profile `out/w136/dockapproach/verify/chrome-profile`. New Game + origin, then console pose of the hull.

Live stills (first pass, origin closed):

- `01-inzone-slow.png`: key `J`, verb `Dock · SLOW — approach under 20 u/s` (HUD uppercase draw), self SPD `SLOW` lamp on, MATCH off, reticle 80 px.
- `02-inzone-dock.png`: key `J`, verb `Dock`, lamp off at low speed.
- `03-band-100.png`: ~102 u, lamp `SLOW` on, no Dock prompt (`T TARGET`).
- `04-band-200.png`: 200 u, lamp off.

CDP inspect also shows `tgtSlowCount: 0`, MATCH text `MATCH`, no thrown exceptions.

Second CDP pass (`05`–`08`) opened the origin overlay again. Do not use those stills for HUD pass/fail.

## Bugs found
None.

Pin and contract checks that pass:

- In-zone finite speed `> 20`: `J` + authored `Dock · SLOW — approach under 20 u/s`.
- Distinct `.rw-slow-lamp` on self SPD only. `makeSpeed()` still has MATCH only. `tgtSpeed.set(targetSpeedNow)` stays speed-only.
- Lamp band `U.DOCK_RANGE * 3`. Hide on docked / `berthHold` / `gate.jumping` / jump-owns-verb.
- Fail-closed non-finite dist/speed. No `innerHTML` / `insertAdjacentHTML` / `document.write`. No `flags.paused` write. No `state.js` `DOCK_SLOW`. No toast SLOW. HOME inset 108. Hub `.rw-reticle` 80 px. No new Digit. `.rw-slow-lamp` has no animation pulse.

## Environmental issues
JSON samples in `live-results.json` can lag the 5 Hz HUD text tick. Stills `01`–`04` are the live source of truth.

Second Chrome profile pass (`chrome-profile-2`) hit the origin picker. HUD stills `05`–`08` are invalid.

PHY bounce is not a defect (contract). REDMARCH `castMatches` was not in this run.

Vite 5176 and CDP 9410 are not LISTENING after teardown.

## Evidence
- `out/w136/dockapproach/verify/static-pins.json`
- `out/w136/dockapproach/verify/static-pins.mjs`
- `out/w136/dockapproach/verify/live-results.json`
- `out/w136/dockapproach/verify/live-log.txt`
- `out/w136/dockapproach/verify/01-inzone-slow.png`
- `out/w136/dockapproach/verify/02-inzone-dock.png`
- `out/w136/dockapproach/verify/03-band-100.png`
- `out/w136/dockapproach/verify/04-band-200.png`
