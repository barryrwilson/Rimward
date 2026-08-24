# Wave 96 boot verify — authored veil (WAVE23)

Status: CLEAN

## Probe (`node out/w96/boot/probe.mjs`)

All checks PASS. Log: `out/w96/boot/verify/probe.log`

- SYSTEMS length 101
- veil authored (not generated)
- generated 94
- generated landmarks have landmarks[0]
- generated separation holds
- hush ids include th_veil
- veil.landmarks length 0

## Static (`scripts/boot-test.mjs`)

- AUTHORED_IDS23 includes veil (line 4915)
- lmShapeOk23 / lmSeparationOk23 only run on generatedIds23 (lines 4941–4942)
- authoredLmIds23 hush includes th_veil (line 4947)
- authoredLmIds23 veil is empty (line 4949)
- countOk uses 101 (line 545)
- dockmaster pins 101 (`dockmasterX101`)
- roster 104 (`fullRoster104` / `freshRoster104`)
- generatedCount94 and nonHubCount91 stay 94 / 91
- git diff does not change WAVE4 fenceChecks, WAVE26 ferry/haul quote check objects, or WAVE35 haul assertion bodies

## `npm run test:boot`

Partial run (~300s), then the harness was stopped. Log: `out/w96/boot/verify/boot-test.log`

Reached WAVE23 and WAVE26. Did not reach WAVE35 (timeout).

- gate network: systems=101, countOk true (no GATE NETWORK DATA FAIL)
- wave4 contacts data: fullRoster104 true, dockmasterX101 true
- wave23 generated landmarks: all true (no crash at lmSeparationOk23)
- wave23 save/restore roster 104
- wave24 generatedCount94, nonHubCount91, authoredThirteenFound, freshRoster104
- known FAILs still fail: WAVE4 FENCE FAVOR FAIL, WAVE26 FERRY QUOTE FAIL, WAVE26 HAUL QUOTE FAIL
