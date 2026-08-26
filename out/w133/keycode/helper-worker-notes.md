# Wave 133 — key-code helper (controls wire)

**Scope:** `src/systems/key-code.js` (new), `src/systems/controls.js` (decode on keydown/keyup).  
**Not this worker:** main.js pause, station.js, hail.js, galaxychart.js, overlay-policy.js, title.js.

## Graph

`graph_resolve` → `proceed_unmodeled` (`r-mtaf8hx3-089939a9`). No binding workflow.

## Verification

Node import (no Vite, no `test:boot`):

| Input | Output |
|---|---|
| `{code:'KeyW',key:'p'}` | `KeyW` |
| `{code:'',key:'w'}` | `KeyW` |
| `{code:'',key:'W'}` | `KeyW` |
| `{code:'',key:'1'}` | `Digit1` |
| `{code:'',key:'0'}` | `Digit0` |
| `{code:'',key:' '}` | `Space` |
| `{code:'',key:'Shift'}` | `ShiftLeft` |
| `{code:'',key:'Escape'}` | `Escape` |
| `{code:'',key:''}` | `''` |
| `{code:'',key:'__proto__'}` | `''` |
| `null` | `''` |

Host proto (KeyboardEvent-style getters) still returns `code` when own `hasOwn` is false. `Object.prototype.code` pollution does not fill a bare `{}`.

`controls.js` keydown: `const code = decodeKeyCode(e)` then `TRACKED.has(code)` / `pressed.add(code)` / `switch (code)`. keyup: decode then `pressed.delete(code)` if non-empty. `TRACKED` contents unchanged (Digit 0/8/9 stay out). `agentPulse` unchanged.

## Security

Quick scan (no auth, no crypto). Prototype pollution on the key map.

- No object-index map of user `key`. Letters/digits use char codes. Named keys use equality.
- `__proto__` / `constructor` / `prototype` as `key` → `''`.
- Field read walks host proto, stops at `Object.prototype`, depth cap 8, cycle set.
- Never throw (outer try/catch).
- No secrets. No `innerHTML`. No new Digit product.

**Risk:** Low. No CRITICAL/HIGH.

## Code review

No blocker/major. Empty `code` is the primary token when non-empty; `key` fill is authored only. Digit 0/6–9 decode for station callers; this worker does not add them to `TRACKED`.
