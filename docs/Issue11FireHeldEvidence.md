# Issue #11 — Physical fire ownership

Implementation is ready for independent review. Release remains blocked by
the unchanged production byte budget; this document does not approve a new
exception or declare the issue complete.

## Reproduction and census

Baseline: `cb6465eebce524669c42d39b3b9017eca278f59a` (2026-09-09).
Real Chromium CDP mouse/key input reproduced three failures before source edits:

1. Hold LMB, open Settings with O: `fireHeld` remains true while Settings owns input.
2. Close Settings with Escape without releasing LMB: the stale hold keeps firing.
3. Pause with P, press LMB on the pause backdrop, resume with P: the paused click arms flight fire.

The old controls `mousedown` listener armed the physical latch regardless of
ownership. Its update masked only chart output, retaining the underlying hold.
Keyboard fire uses the existing binding map and private pressed-key set;
`keyup` deletes keys unconditionally, including during Settings/pause. Key
repeat is already ignored. `mouseup` releases the mouse latch. Neither release
handler was changed.

Station docking and launch already neutralize all physical input through
the issue #65 berth hook. No actual berth-transition defect is claimed;
the new gate additionally prevents station presses from arming fire while
docked. Berth records and chart use their existing ownership flags. Settings
uses its existing ownership helper. Title/Models capture keys and freeze the
simulation through pause, so controls updates alone cannot clear their latch.
Window blur already clears physical holds; explicit issue #61 combat authority
continues to retain its established focus-loss policy.

Hail is a flight-live card, not a full flight lock. Its own mousedown handler
already stops card clicks from reaching controls. Opening a hail now discards
the preceding physical hold, but a fresh flight press still fires so the
player can shoot to break a demand. A first implementation blocked all hail
fire; the unchanged full boot test exposed the regression. That approach was
removed, and the real shoot-to-break-demand boot scenario passes.

## Change and boundaries

Controls discard only the physical fire latch/key when chart, berth, dock,
Settings, typing focus, title, Models or pause owns input. New presses under
those owners cannot queue fire. Returning to flight requires a fresh press;
key repeat cannot rearm a cleared hold. Hail clears on entry while retaining
the fresh flight-fire contract above.

The pause owner clears synchronously. The existing render loop also clears
physical fire while paused, covering direct title/Models pause writes even
when simulation updates are frozen. The context-keyed callback remains in
controls; no persistent field or event vocabulary is added.

No changes to rebinding, station digits, other axes/edges, cadence, weapons,
combat balance, or the agent lease gates. Death/recovery behavior was read
for adjacent context but is not changed or claimed as verified by this issue.

## Verification

- `npm run test:fire-held`: 256/256 passed. Mouse0/1/2 and an existing keyboard
  binding exercise holds, releases, ownership changes, blocked presses,
  repeat, blur, and the special flight-live hail behavior.
- `npm run test:paused-input`: passed, with existing non-fire pause behavior retained.
- `npm run test:boot`: passed on the corrected implementation, including the
  original shoot-to-break-demand and chart fire checks. The test was not edited.
- Live ownership: 41/41 checks passed in real Chromium on the Intel platform
  renderer, including Settings, chart, berth records, pause, title, Models,
  keyboard release/repeat, actual dock/launch, and the hail card/flight split.
  Result: `live-final/fire-held/result.json` under the raw evidence root.
- Actual focus: all five checks passed in headed Chromium. Activating another
  tab made `document.hasFocus()` false and cleared fire; returning focus
  restored `document.hasFocus()` without rearming fire. Result:
  `focus-unsandboxed/physical-focus/result.json`. The first headed attempt
  failed before gameplay because the sandbox prevented GPU process startup;
  the authorized unsandboxed loopback-only retry passed.
- Both final browser runs have zero console errors/uncaught exceptions,
  matching start/end runtime source hashes, and closed Vite/CDP ports.
- `npm run build`: blocked by the unchanged exact-artifact byte gate. The
  previous approved exception belongs to the base artifact and does not
  authorize this changed JavaScript.

Reproduce live ownership with `npm run test:fire-held-live` and actual
headed-browser focus loss with `npm run test:fire-held-focus`. Set
`ISSUE11_OUT` to an absolute disposable evidence directory. Both use existing
loopback-only browser harnesses, isolated profiles, real rendering and CDP
input. The headless probe labels its dispatched blur/focus events explicitly;
the separate headed probe is the actual tab-focus check. The live hail arrival
is an explicitly injected event for an existing NPC, and the keyboard binding
is a temporary fixture; neither is claimed as natural gameplay availability.
Dock/launch use the real public approach and keyboard launch paths without
teleporting or setting dock flags.

Raw logs, screenshots, failed intermediate attempts and diagnostic output are
kept outside Git in `out/issue-11-evidence/` in the parent checkout. Baseline
live output records three expected failing checks; its runner PASS means the
baseline defects were reproduced, not that baseline behavior was correct.
The early exploratory unit matrix also included an overly broad hail
expectation; it is not the final acceptance matrix.

## Measured release blocker

Equivalent diagnostic Vite output (unchanged runtime source, normal production
options) measures the candidate without altering the repository build policy:

| Field | Candidate |
|---|---|
| Runtime source census SHA256 | `406749ead4b576b2def1dd88aaeee395397b2f8feeafb3df9ca47586b0430882` |
| JavaScript chunk | `assets/index-wgaNWMGI.js` |
| Chunk SHA256 | `05b1fc317b5218753d3923a6a64d6f2017d3b8b94da0bb42c0bedfc802bc31be` |
| Minified bytes | 1,824,955 (limit 1,800,000; +442 versus base) |
| Gzip bytes | 545,098 (limit 537,600; +93 versus base) |
| Browser dependency audit | PASS; only `three` |

The diagnostic reports raw byte policy FAIL and does not activate an
exception. Approval and independent review must precede any policy refresh.
Rollback is the two runtime-file changes; no data migration is involved.
