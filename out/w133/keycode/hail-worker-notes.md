# Hail PR4 key-code (worker notes)

## Change

`src/systems/hail.js` card digit `keydown` now:

1. `const code = decodeKeyCode(e);` (import `./key-code.js`)
2. `/^Digit([1-9])$/.exec(code)` — not `e.code`
3. `hailDigitsAllowed(ctx)` still gates (import from overlay-policy, policy file not written)

`hailApi.resolve` / peek unchanged. Card HTML/CSS unchanged.

## Overlay Digit skip

This worker does not write overlay-policy. Digit skip in controls still keys off `hailOpen` + `hailDigitsAllowed`. After decode, empty-`code` `key` `1`–`9` still become `Digit1`–`Digit9`, so hail shortcuts and overlay skip stay on the same Digit tokens.

## Verify (backend, no test:boot)

- Regex operand is `code` from `decodeKeyCode(e)`, not `e.code`.
- `hailDigitsAllowed` still runs after a Digit match.
- Overlay-policy.js mtime/content unchanged.
