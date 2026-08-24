# Static check: npc.js update skip

## Destroyed handling

```
if (st.destroyed) {
  if (live.ai && !live.ai.deathHandled) {
    live.ai.deathHandled = true;
    handleDestroyed(...)
  }
  continue;
}
```

Does not read `live.ai.deathHandled` when `ai` is missing.

Backstop lastEvents path:

```
e.ship && e.ship.ai && !e.ship.ai.deathHandled
```

Also skips missing `ai`.

## Live skip

After the destroyed block:

```
if (!live.ai) continue;
```

Then `const ai = live.ai` and `ai.velocity.length()`. WAVE74 `fakeShip74` has no `ai`.

## boot-test.mjs

WAVE74 `fakeShip74` exists in HEAD. `git diff` of `scripts/boot-test.mjs` has no WAVE74 / `fakeShip74` hunks.

File times:

- `scripts/boot-test.mjs` last write 2026-08-23 17:56:18
- `src/systems/npc.js` last write 2026-08-23 18:34:28

This worker wrote npc.js after boot-test.mjs. This worker did not edit boot-test.mjs.
