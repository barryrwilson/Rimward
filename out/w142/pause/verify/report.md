## Status
CLEAN

## What I tested
Live Ctl05 PR1 pause-menu ACCESS on Vite `http://127.0.0.1:5176/` (`--host 127.0.0.1 --strictPort`). Private Chrome CDP **9476**, profile `out/w142/pause/verify/chrome-profile/`. Driver: `out/w142/pause/verify/browser-verify.mjs` via `puppeteer-core` (not Playwright MCP).

Did not run formatters, linters, or `npm run test:boot`. Did not edit `src/`.

Fresh boot: title NEW GAME (no autosave) → Digit1 origin `greenhand` → in-run (`flags.paused` false, no `#rw-title`).

| Case | Result |
|---|---|
| KeyP pause dialog | `role="dialog"` `aria-label="Paused"`, z **50**, display flex. Buttons **RESUME / SETTINGS / BERTH RECORDS / TITLE**. Legend `P to resume`. Not copy-only `PAUSED — P to resume`. |
| SETTINGS from pause | Opens live Settings z **80**. `__ctx.flags.paused` stays **true**. `pauseEl` pointer-events **none**. Dim-ring click (16,16) does **not** resume. Esc closes settings; paused stays true. |
| KeyP while settings (from pause) | Toggles pause (`true` → `false`) while settings remain open. Matches contract item 20 (settings does not swallow KeyP). |
| BERTH RECORDS from pause | Opens while paused **true**. `berthHold` also true on open but is a **distinct** flag (toggling `berthHold` left `paused` true). SAVE slot 1 wrote `rimward-save-v1-slot-1` (39722 bytes). |
| LOAD while paused | Slot 1 named-disabled `LOAD — resume first` + `disabled`. Credits mutated to 424242; LOAD click left 424242 (no restore). Empty slots stay disabled `LOAD`. |
| Close berth | Esc closes berth; pause menu remains (`display:flex`, four named buttons). |
| TITLE remount | `#rw-title` remounts without document navigation (`navDelta` 0, single `navigate` entry). `sessionStorage rimward-title-skip` stays **null**. Pause chrome hidden while title owns. CONTINUE hides banner (`pauseDisplay none`) and sets `paused` false. |
| Typing / models KeyP guards | Synthetic INPUT focused: KeyP does not toggle. Models filter INPUT while models open: KeyP does not toggle. |
| Overlay-policy | Fetch `/src/systems/overlay-policy.js`: `flags.paused =` count **0**. Comment still says never writes paused. Workspace grep: reads + comments only. |
| Settings knobs | `settings.js` not in worker git diff. Live panel: colorblind / contrast / reduced motion / alerts / mute / hints / text size / master volume only. No invert / rebind / split volume. |
| KeyP still pause | In-run KeyP sets paused true and shows the menu. |

Static: `src/main.js` `setPaused` writes flag + display. `src/systems/title.js` `openFromPause` remounts without skip/reload. `src/game/save.js` `openFromPause` + `LOAD — resume first`. No `innerHTML` in those three files.

## Bugs found
None.

Hunt cases: dim-ring click-through resume **did not fire**; TITLE path **did not** set `rimward-title-skip`; LOAD while paused **did not** restore; CONTINUE **did not** leave the pause banner.

Notes (not bugs): KeyP with settings opened from pause still **toggles** pause (contract). `berthHold` may be true while paused when berth is open; they are not the same field.

## Environmental issues
First Chrome `goto` used `waitUntil: 'commit'` (invalid on this puppeteer-core) and hung on about:blank. Retry with `domcontentloaded`, `--remote-allow-origins=*`, `--enable-unsafe-swiftshader` reached title + `__ctx`. Not a product defect.

Did not use shared Playwright MCP.

Vite PID tree on 5176 and Chrome CDP 9476 were stopped after the pass. `netstat` showed **no LISTENING** on 5176 or 9476.

## Evidence
- Driver: [`out/w142/pause/verify/browser-verify.mjs`](browser-verify.mjs)
- Log: [`out/w142/pause/verify/browser-log.txt`](browser-log.txt), [`out/w142/pause/verify/browser-log.json`](browser-log.json)
- Write-set: [`out/w142/pause/verify/write-set.txt`](write-set.txt)
- Stills:
  - [`01-boot-title.png`](01-boot-title.png) — NEW GAME / MODELS / SETTINGS
  - [`03-in-run.png`](03-in-run.png) — greenhand in-run
  - [`04-pause-menu.png`](04-pause-menu.png) — named RESUME / SETTINGS / BERTH RECORDS / TITLE
  - [`05-settings-from-pause.png`](05-settings-from-pause.png) — Settings z 80, live FIELDS only
  - [`07-berth-from-pause.png`](07-berth-from-pause.png) — berth while paused
  - [`08-berth-load-disabled.png`](08-berth-load-disabled.png) — SLOT 1 `LOAD — resume first`
  - [`09-pause-after-berth-close.png`](09-pause-after-berth-close.png) — pause menu remains
  - [`10-title-from-pause.png`](10-title-from-pause.png) — remount with CONTINUE, no reload
  - [`11-after-continue.png`](11-after-continue.png) — live run, no pause banner (credits 424242 prove LOAD did not restore)
