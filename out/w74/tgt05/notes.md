# TGT-05 Wave 74 notes

Slice: contract PR2–PR4 (pick, eligible, feedback).

- KeyT `cycleTarget` unchanged.
- KeyV → `input.reticleLockPressed` (one frame).
- Pick: `pickReticleLock` in `src/game/reticle-aim.js` (same ray as `reticleAimPoint`; disc contains reticle; min positive t; `U.TARGET_RANGE`).
- Eligible: live ships (skip destroyed) + asteroid list rows. Rocks lock in any weapon group. Stations/gates/pods/landmarks out.
- Miss: `commLine` `'Nothing under the reticle.'` + `reticleLock { hit: false }`. Hit: existing bracket + `reticleLock { hit: true }`.
- Cue: `song.js` `reticleLock` square 1480 Hz, 0.06 s, gain 0.05. Not family-gated.
- combat.js not edited (seeker already ship-shaped).
- Probe: `node --import ./scripts/with-css-stub.mjs out/w74/tgt05/probe.mjs`

Live check: `npm run dev`, flight, point at a ship/rock, tap V.
