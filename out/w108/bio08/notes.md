# BIO-08 Wave 108 notes

First impl of anatomy-native gait. Write-set only: `src/game/living-gait.js`, `src/systems/ship.js`, `src/systems/ship-assets.js`, `scripts/boot-test.mjs` (WAVE108 append), `docs/Bio08LocomotionDesign.md` (status/verifier), `out/w108/bio08/**`.

## Landed PRs

| PR | Result |
|---|---|
| PR1 data | `src/game/living-gait.js` THREE-free. `LIVING_GAIT` + `GAIT_AXES` + `gaitFor` hasOwn → light. Unknown gaitId → live mix 1,1,0,0. |
| PR2 player CPU | Light (and unknown → light) unweighted sculpt. Other living remounts: spine/flap × gait, add Z kick + radial pulse after breath/heart. `makeLivingHull` not replaced. |
| PR3 NPC GPU | One shader. Uniforms `uSwimSpineX/FlapY/KickZ/Radial`. Sweep still on flap. Program key `rimward-beautiful-swim-gait`. aSwim bake unchanged. Beautiful only. |
| PR4 | NPC amp 0 under reducedMotion. WAVE108 pins after WAVE107. Probe `out/w108/bio08/probe.mjs`. |

## Verify commands

```
node out/w108/bio08/probe.mjs
npm run test:boot
```

Probe: BIO08 PROBE PASS (exit 0).
Boot: WAVE107 all true. WAVE108 all true. BOOT TEST FAIL — 5 errors, all WAVE26 (known). Not WAVE108.

Live Beautiful flap-axis: `[NO BROWSER COVERAGE]`. No Vite on 5178. No CDP on 9410.

## Coupling

- Honor BIO-06 `living-cadence.js` (do not retune).
- Player light CPU honor is a call-site skip (`classKey !== 'light'` + hasOwn). `gaitFor('light')` is still shark-caudal for NPC GPU.
- `state.js` unread by gait module. Cruise stays in cadence.
- Mixer idle clip untouched. Yard living `update: null`.

## Process teardown

No Vite. No Chrome. No Playwright. Ports 5178 and 9410 not used.

## Reviews

Security: Low. No CRITICAL/HIGH.
Code: no Blocker/Major.
UI: no Blocker/Major. No hub child.
