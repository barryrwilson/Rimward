# CTL-05 pause pack verify (Wave 141)

**Status:** CLEAN  
**Domain:** data (no Vite, Chrome, Playwright, CDP)  
**Date:** 2026-08-27

## Verdict

Leftover **REAL**. Named serial **PR1**. Named serial is **not** none. Live `pauseEl` is copy-only (`PAUSED — P to resume`, z 50, KeyP toggle). Pause does not offer Settings, save, or title from that surface. KeyO still opens Settings in a run; that is not a pause menu. Deputize stays ACCESS to existing Settings / berth / title / resume. Settings expansion inbox is not this pack. `berthHold` stays distinct. Markdown only. No `src/` from this worker.

## What I tested

- Brief + inventory + shared-contract + design doc + security/code/UI reviews + notes.
- Live `src/main.js` pause banner, KeyP listener, loop skip.
- Live `src/systems/overlay-policy.js` never-write + `hailDigitsAllowed` digit skip under pause.
- Live Settings FIELDS vs expansion inbox 131–135.
- Live CTL-03 `berthHold` vs pause; KeyL open refuse; LOAD refuse; SAVE writes.
- Live KeyP / typing / models / `#rw-title` guards.
- LOAD-while-paused named as gate, not a silent load.
- Honor: no optional-PR2 required steal, no pad 2B, no in-repo LLM, no sibling Onb01/Org01 path writes in this pack, no wishlist/PROGRESS edit by this pack.
- `src/` dirt in the worktree is other concurrent work (flee / recover / titleApi / mining). Pause pack files are markdown under `docs/Ctl05PauseMenuDesign.md` and `out/w141/pause/*.md` (no `verify/**` until this verifier).

## Live cites (code wins)

| Claim | Live | Result |
|---|---|---|
| Banner copy | `main.js` 172 `pauseEl.textContent = 'PAUSED — P to resume'` | match |
| z 50 | `main.js` 171 `z-index:50` | match |
| Menu actions absent | `main.js` 169–187: div + KeyP toggle only | match |
| Loop skip | `main.js` 156–161 `if (!ctx.flags.paused)` | match |
| KeyP + typing/models/title guards | `main.js` 175–184 | match |
| Overlay never writes `paused` | `overlay-policy.js` 4; no `flags.paused =` in file | match |
| Digit skip under pause | `hailDigitsAllowed` 177 returns false when paused; WAVE118 `digitSkipUnderPause` `boot-test.mjs` 23866–23868, listed 23967 | match |
| Settings FIELDS | `settings.js` 29–38: no mouse/invert/rebind/split volume; one `masterVolume` | match |
| KeyO global | `settings.js` 228–234; no pause guard | match |
| Settings z 80, pointer-events none scrim | 91–93 | match |
| Title capture KeyO/Escape pass | `title.js` 212–214 | match |
| `closeTitle` one-way remove | 251–256 | match |
| Title z 70 | `screens.css` 511–512 | match |
| KeyL open refuses paused | `save.js` 1625 | match |
| LOAD paused refuse | 1502 | match |
| SAVE `trySave` no paused check | 1643+ | match |
| `berthHold` not pause | `overlay-policy.js` 196–203; `save.js` 1433–1440; hint “This is not Pause (P).” 1395–1396; `ctx.js` 234 | match |
| Wishlist pause inbox | 217–220 (cite; unedited in that hunk) | match |
| Expansion inbox | 131–135 | match |
| `innerHTML` in `main.js` | none | match |
| KeyD strafe / KeyH hail / KeyJ dock / KeyM chart / KeyP pause | live bindings | stay |

CONSUME would need Settings **and** save **and** title already on the pause surface. Hidden KeyO is not that menu. KeyL cannot open berth while paused. Title root is removed on CONTINUE. REAL / PR1 is correct.

## Honor

- Deputize ACCESS only. No Settings expansion knobs in PR1.
- PR2 stills named **optional skip**, not required with PR1.
- Pad 2B / in-repo LLM / Onb01 / Org01 / CTL-04 `fireHeld` unclaimed.
- Contract forbids wishlist / `PROGRESS.md` / Ctl02–04 / sibling `out/w141/onb01/**` / `out/w141/org01/**` edits. This pack’s write-set is the listed markdown only.
- LOAD stays refused while paused. PR1 must not unpause to “make LOAD work”.
- Overlay-policy still never writes `flags.paused`.
- `berthHold` may set on berth open; must not equal pause.

## Residual (not leftover-verdict bugs)

1. Inventory §8 dual-cites galaxy chart z 30 as `hud.css` **1996** and `screens.css` **466**. `hud.css` 1996 is `.rw-galaxy-chart`. `screens.css` 466 is `.death-overlay { z-index: 30 }`, not the chart. Chart z is still 30. Leftover REAL unchanged.
2. Later PR1: Settings checkboxes / volume slider are `INPUT`. Existing typing guard will ignore KeyP while those are focused. Contract keeps the guard and also says KeyP still resumes while Settings is open. Impl must keep the typing guard; do not treat Settings `INPUT` focus as a remap.

## Graph

`graph_resolve` matched `codex/workflow-automation-management` on incidental “pause / verify / report” (coverage 0.17 then 0.3). Trigger is Codex scheduler automation. This task is leftover markdown verify. No scheduler tool. No graph write. No Vite/Chrome.

## Write-set (this verifier)

- `out/w141/pause/verify/report.md`
- `out/w141/pause/verify/write-set.txt`
