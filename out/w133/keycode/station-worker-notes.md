# station.js overlay keydown (PR4)

Listener at `src/systems/station.js` dock overlay keydown:

- Assigns `const code = decodeKeyCode(e)` (import `./key-code.js`).
- Does not read raw `e.code` in that listener.
- Digit 0/8/9 keep station meaning (`d === 0` dock service; outfitting `n === 8 || n === 9`).
- Empty decode (`''`) fails Escape/Digit/Key* checks; no extra early return.

Do not run `npm run test:boot` for this path. Verify source only.
