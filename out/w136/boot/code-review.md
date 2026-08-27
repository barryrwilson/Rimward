# Code review: Wave 136 boot harness

Scope: `scripts/boot-test.mjs` Wave 136 block only. Feature sources were not edited.

## Summary

Three pin groups follow Wave 129 source style and Wave 71 / 74 live style. Restores sit in `finally`. No Blocker or Major.

## What's done well

- Source greps match the pack `boot-pins.md` files.
- Live HUD holds pad distance each frame so cruise speed does not leave the dock zone.
- Cycle stubs isolate `ctx.ships` so other envelope hostiles cannot steal the first lock.
- Jobs Digit2 heal backs to services with Escape before the second Digit2.
- Unique four and the jobs array are restored after twin injection.

## Findings

### Blocker

None.

### Major

None.

### Minor

HUD live skips when `station.inZone` is false or `.rw-prompt-verb` is missing. That is fail-open on a brittle stub DOM, as allowed by the harvest note.

## Passed

- Earlier waves untouched.
- `castMatches` not touched.
- `try` / `finally` restores currentSystem, docked, jobs, targets, ships, pause.
