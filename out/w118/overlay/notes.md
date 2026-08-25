# Wave 118 CTL-02 PR1 overlay-priority — notes

## Census shipped

- New `src/systems/overlay-policy.js`: authored ids `hail` / `chart` / `berth`; mutex `canOpenPlayCard`; `canShowHail` true | false | `'defer'`; one session defer slot; `hailCalmOk`; Digit/title/settings/models/paused gates. Boolean flag reads. No per-frame DOM alloc. Never throws. Never writes `flags.paused`.
- `hail.js`: `flags.hailOpen`; skip `openCard` on defer (keep `hailOpened`); flush on blocker close; `openCard` / KeyH read `calmUntil`; salvage `letGo` writes `time + 30`; Digit1–9 skip unless hail is exclusive and settings/title/models/pause are not on screen.
- `galaxychart.js`: `setOpen(true)` and KeyM **open** refuse if hail or berth is open. Close always; blur focused child on close. `showApLive` / AP button / hover / labels / hit discs **untouched**. Chart still stays open on AP engage.
- `save.js` berth: `setBerthOpen` / KeyL open gate; `flags.berthOpen`; blur focused child on close. Not WORLD_FIELDS, not death recover, not autosave math.
- `ctx.js`: session defaults `flags.hailOpen` / `flags.berthOpen` + ownership comments.
- No `hud.css` change (mutex holds). Play cards stay z 30/40/60 under settings 80 and fatal 99.
- `scripts/boot-test.mjs` WAVE118 after WAVE117, before `if (errors === 0)`. All WAVE118 pins true.
- `docs/Ctl02OverlayDesign.md`: status Wave 118 PR1 landed. Merge law still `out/w117/overlay/shared-contract.md`.

## Not shipped (honor)

- `autopilot.js`, `controls.js`, `hud.js`, `state.js`, `station.js`.
- No KeyJ remap. No Digit 0/8/9 steal. No new Digit. No UU/SKU. No persist key.
- P1 toast-flood: no toast dedupe, no `.rw-toasts` z-index.
- P2 chart-label a11y: not solved.
- P2 close-chart-on-AP: not stolen. WAVE117 `chartStayOpen` / `chartEngageStay` still true. `showApLive` still in `galaxychart.js`.
- Known boot FAILs (WAVE4 fence, WAVE26 ferry/haul, WAVE35 haul) not “fixed”.

## Coupling

- NAV-05: same file `galaxychart.js`. This PR touched `setOpen` / KeyM only. Re-grep `showApLive` after merge: 6 hits (function + cancel + engage line + clear + timeout + disengage reason).
- CTL-01 KeyJ: `controls.js` not edited. KeyH stays hail.
- `flags.chartOpen` still only written by `setOpen`. Mutex does not clear it except on real close.
- Pause still KeyP / title / models. Play cards do not pause, so deferred `hailOpened` is not dropped by the pause event flush.
- Hail Digit1–5 vs weapon groups: known overlap. Mutex stops hidden-card resolve under berth/settings/pause.
- Wave 40: `initTitle` still `systems[0]`. Settings still z 80.

## Ports / processes

This worker did not start Vite or Chrome. Port 5178 not claimed. No user-data-dir under `out/w118/overlay/`.

## Boot

`npm run test:boot`: WAVE118 overlay-priority all true. Pre-existing WAVE26 FAIL (and other known FAILs) still fail the process. Do not treat those as this PR.
