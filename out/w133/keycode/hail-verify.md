# Hail PR4 key-code verify

## Status
CLEAN

## Method
- Read/grep only. Did not run `test:boot` or Vite.
- Graph resolve: `proceed_unmodeled` (no binding workflow).
- `git status` / `git diff` on `src/systems/hail.js` and `src/systems/overlay-policy.js`.
- No WebSim/vite/boot-test processes to stop.

## Claims

| Claim | Verdict | Evidence |
| --- | --- | --- |
| Digit regex runs on `decodeKeyCode(e)` result | PASS | `hail.js` **798–799**. Diff replaces `/^Digit([1-9])$/.exec(e.code)` with `const code = decodeKeyCode(e)` then `.exec(code)`. Import `./key-code.js` at **19**. Grep: no `e.code` left in `hail.js`. One `keydown` listener. |
| `hailDigitsAllowed` still gates | PASS | After Digit match, **801–807**: `hailDigitsAllowed(ctx) !== false`; `if (!digitsOk) return`. Still imported from `overlay-policy.js` (**13**, **18**). |
| overlay-policy not edited | PASS | `git status --porcelain -- src/systems/overlay-policy.js` empty. `hailDigitsAllowed` remains **175–185**. Hail worker did not write this file. |

## Key path (card open)

```
const code = decodeKeyCode(e);
const m = /^Digit([1-9])$/.exec(code);
if (!m) return;
… hailDigitsAllowed(ctx) !== false …
if (!digitsOk) return;
```

`decodeKeyCode` returns non-empty `e.code`, else maps `key` `"1"`–`"9"` to `Digit1`–`Digit9` (`key-code.js` **31–34**, **44–49**). Empty decode → regex miss → no resolve.

## Notes (not blockers for these claims)
- Same `hail.js` working-tree diff also adds `peek` / `resolve` and `ctx.hailApi` vs HEAD. Worker notes say hailApi unchanged. That attach is extra vs HEAD; it is not a Digit/gate/policy miss.
- Listener catch still fail-open (`digitsOk = true`). Pre-existing. `agent-api.js` hailResolve fail-closes. Unchanged by this regex swap.
- Did not execute boot tests.

## Files
- `C:\Projects\WebSim\src\systems\hail.js` (modified)
- `C:\Projects\WebSim\src\systems\key-code.js` (untracked helper; hail imports it)
- `C:\Projects\WebSim\src\systems\overlay-policy.js` (clean)
