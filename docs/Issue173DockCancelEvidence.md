# Issue #173 — stop after dock cancellation

## Change

Dock-mode cancellation for `impact`, `blocked`, or `stale` now clears the old
manual throttle and latches `input.fullStop`, the same command as double-tap F.
Both paths call the controls-owned `commandFullStop` helper; autopilot does not
write input fields. Successful direct approach retries clear the latch only
after acceptance, while refused retries preserve it.
The real ship update brakes the hull below its 30 u/s creep floor. A live hail
or combat lease keeps its input ownership. Route-mode cancellation is unchanged.
The impact notice reads `Dock approach cancelled: hull contact.`

Only the physical collision path in `ship.js` emits `bodyHit`. The combat
projectile path emits `playerHit` with `shielded` and attacker identity; it does
not emit `bodyHit`. The reported weapon-only cancellation was not reproduced
on this baseline. No event suppression was added: a weapon hit and real body
contact in the same frame must still cancel. Zero-damage contact policy (#184)
is outside this change.

## Verification

`npm run test:dock-corridor` passes all five fresh-process cases: old ring,
new sweep, fresh approach, two-trip repeat, and cancellation. The cancellation
case in `scripts/issue-139-dock-corridor-test.mjs` covers contact kinds, actual
NPC cannon projectiles striking player shields, simultaneous weapon/contact,
real ship deceleration, invalid station state, chart-open blocked cancellation,
hail and real combat-lease ownership, and unchanged route cancellation.

`npm run build` and the ten direct autopilot watchdog scenarios pass. The first
unchanged boot run found a retry-latch regression and an input-ownership contract
violation; both were repaired in production code, with the boot test untouched.
The repeated unchanged `npm run test:boot` passes: all 17 Agent API playtest
regressions pass and the boot reports no update errors. Final focused dock
approach and combat full-stop suites also pass. Raw logs are under
`out/issue-173-evidence/` (`boot-retry.txt`, `build-retry.txt`,
`corridor-retry.txt`, `watchdog-retry.txt`, `dock-approach-retry.txt`, and
`combat-full-stop-retry.txt`). The rendered probe
`scripts/issue-173-dock-cancel-live-probe.mjs` labels its initial pose and
body-contact event fixtures explicitly; weapon flight and stopping use real
rendered frames. It does not claim that its injected contact is a live ram.

The rendered probe passed on 2026-09-14 with a stable runtime source SHA256
`3193167f5cbdb14e6519c7b4a6061cbb757f973232f83b64cc4b868db334b5b1`.
At simulation time 1.635 the real shield strike left approach engaged at
18.4979 u/s. After the tagged contact, time 1.687 recorded 13.4445 u/s with
full stop and zero throttle; by 4.7037 the hull was at 0 u/s. The screenshot
shows zero speed and the named cancellation notice. `chartOpen` was a flag
fixture; the chart panel itself was not visually exercised. No console errors
or exceptions occurred, and both disposable Vite and CDP ports closed.
Raw evidence: `out/issue-173-live/dock-cancel/result.json`.

## Artifact and gates

Rex used the explicitly designated Codex fallback after Claude Code returned
`ConnectionRefused`; the escalated retry was cancelled before execution.
Independent review with the required different engine remains pending. This
document is implementation evidence, not a QA approval, merge, or deployment.
The initial staging attempt was cancelled; the owner subsequently authorized
retrying the isolated commit. Independent review remains pending.
Base commit: `0dd126047a8764615b34bdb33c6d301a1864068f`.
No persistence or migration changes; rollback is reverting the isolated commit.
