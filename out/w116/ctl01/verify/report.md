## Status
CLEAN

## What I tested
- Read `docs/Ctl01DockBindDesign.md`, `out/w116/ctl01/shared-contract.md`, and `out/w116/ctl01/current-ctl01-dock-bind-inventory.md`. Cross-checked notes, code-review, security-review, and ui-audit for pack completeness.
- Grepped live `src/systems/controls.js` for `KeyD` / `pendingDock` / `strafeX` / help copy.
- Grepped `src/systems/gate.js` and `src/systems/station.js` for `dockPressed`.
- Grepped `src/systems/gate.js` and `src/game/autopilot.js` for `wantJump` / `apJump`. Confirmed `autopilot.js` does not mention `dockPressed`.
- Grepped `src/` for `KeyJ`, `KeyI`, and `KeyU`.
- Confirmed Enter on title first-entry and death recover.
- Confirmed WAVE21 `dispatchKey('KeyD')` at `scripts/boot-test.mjs` 706 and 732, and WAVE6 `'D — dock'` at 1732.
- Confirmed leftover freeze: real, not CONSUME, serial **PR1 dedicated dock/jump bind**, deputize **KeyJ**.
- Confirmed later impl may touch `controls.js`, HUD/onboarding copy, and boot string/KeyD jump pins; must not claim HUD-02 combat rails or `src/game/autopilot.js`.
- Checked worker write-set vs forbidden paths (`src/`, wishlist, `PROGRESS.md`, `out/w116/hud02tgt/**`, `out/w116/nav05/**`, `docs/OwnerDecisionsWave116.md`).
- Did not start Vite. Did not run formatters, linters, or the boot suite.

## Bugs found
None.

Live dual-bind matches the census:

- `controls.js` 274–276: `case 'KeyD': pendingDock = true`.
- `controls.js` 440: `input.strafeX = (has('KeyD') ? 1 : 0) - (has('KeyA') ? 1 : 0)`.
- Help 19 / 30 / 343 / 353 still names D for strafe-right and for dock.
- `TRACKED` (41–48) includes `KeyD` and does not include `KeyJ`.
- `input.dockPressed = pendingDock` at 370.
- `ctx.js` 76 / 88 comments still name D for both strafe-right and the dock edge.

World readers keep `dockPressed`:

- `gate.js` 643–648: `apJump` from `ctx.autopilot.wantJump`; human jump is `ctx.input.dockPressed || apJump`.
- `station.js` 6250–6259: dock when `ctx.input.dockPressed` and in range; station may clear the edge.

AP path is independent:

- `autopilot.js` 317 sets `wantJump` from zone + hop. No `dockPressed` write.
- `inputBreak` (142–162) uses `strafeX` as helm, not `dockPressed`.

Unused-key census:

- No `KeyJ`, `KeyI`, or `KeyU` in `src/`.
- Enter remains title first visible entry (`title.js` 217–222) and death recover (`save.js` 1341).

Pack freeze:

- Leftover is **real**. Not CONSUME. Serial is **PR1 dedicated dock/jump bind**. Deputize **KeyJ**. Keep `dockPressed`. Do not rename the event. Do not make AP write `dockPressed`. Do not require KeyJ for AP jumps.
- WAVE21 KeyD jump pins are cited in the design, contract §0.11, inventory §8, notes, and code-review so a later impl updates them on purpose.

Write-set:

- Worker files are markdown only under `docs/Ctl01DockBindDesign.md` and `out/w116/ctl01/*.md`.
- No `src/` files in that pack. `controls.js` is unchanged vs HEAD.
- No `docs/OwnerDecisionsWave116.md`.
- Sibling `out/w116/hud02tgt/**` and `out/w116/nav05/**` exist as other workers. CTL-01 did not write them.
- Dirty `PROGRESS.md`, wishlist, `scripts/boot-test.mjs`, and other `src/` files in the tree do not contain this leftover’s KeyJ remap and are not this worker’s listed write-set.

## Environmental issues
None for this census. Repo working tree has unrelated dirty files from other waves. They do not change the KeyD dual-bind or the unused KeyJ result.

Graph: `graph_resolve` bound `claude/workflow-research-and-briefing`. This check used live `src/` as the source of truth. Open-knowledge search did not return a CTL-01 bind note. No web page was required.

## Evidence
- Dual-bind: `C:\Projects\WebSim\src\systems\controls.js` 274–276 (`pendingDock` on `KeyD`) and 440 (`strafeX` from held `KeyD`).
- Help dual-name: same file 19, 30, 343, 353.
- Edge publish: same file 370 `input.dockPressed = pendingDock`.
- Human jump + AP OR: `C:\Projects\WebSim\src\systems\gate.js` 643–648.
- Station reader: `C:\Projects\WebSim\src\systems\station.js` 6250–6259.
- AP `wantJump` only: `C:\Projects\WebSim\src\game\autopilot.js` 317; no `dockPressed` in that file.
- HUD still paints D: `C:\Projects\WebSim\src\systems\hud.js` 2128, 2133–2137.
- Onboarding still paints D: `C:\Projects\WebSim\src\systems\onboarding.js` 50, 53.
- WAVE21 pins: `C:\Projects\WebSim\scripts\boot-test.mjs` 706, 732 `dispatchKey('KeyD')`.
- WAVE6 pin: same file 1732 `'D — dock'`.
- KeyJ unused: ripgrep `KeyJ|KeyI|KeyU` under `C:\Projects\WebSim\src` → no matches.
- Serial + deputize: `C:\Projects\WebSim\out\w116\ctl01\shared-contract.md` §0.1 / §3; `C:\Projects\WebSim\out\w116\ctl01\notes.md`; design §1 / §5.
- Later write-set freeze: contract §0.9–0.11 forbids `autopilot.js` and HUD-02 combat rails; allows `controls.js`, prompt/onboarding copy, and boot KeyD jump / `'D — dock'` pins.
- No OwnerDecisionsWave116 file on disk.
- Verifier write: this file and `C:\Projects\WebSim\out\w116\ctl01\verify\write-set.txt`.
