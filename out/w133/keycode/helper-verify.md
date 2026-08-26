# Wave 133 — key-code helper verify

**Verdict:** CLEAN

**Graph:** `graph_resolve` → `execute_workflows` (`r-mtafe8xa-1c8c9cf3`). Primary: `codex/workflow-cross-agent-coordination`. Read-only diagnose. No control actions.

**Harness:** `node out/w133/keycode/helper-probe.mjs` (no Vite, no `test:boot`). `total=36 fail=0`. Probe process exited. No WebSim/vite node process found.

## Frozen cases

| Input | Want | Got |
|---|---|---|
| `{code:'KeyW',key:'p'}` | `KeyW` | `KeyW` |
| `{code:'',key:'w'}` | `KeyW` | `KeyW` |
| `{code:'',key:'W'}` | `KeyW` | `KeyW` |
| `{code:'',key:'1'}` | `Digit1` | `Digit1` |
| `{code:'',key:'0'}` | `Digit0` | `Digit0` |
| `{code:'',key:' '}` | `Space` | `Space` |
| `{code:'',key:'Shift'}` | `ShiftLeft` | `ShiftLeft` |
| `{code:'',key:'Escape'}` | `Escape` | `Escape` |
| `{code:'',key:''}` | `''` | `''` |
| `{code:'',key:'__proto__'}` | `''` | `''` |
| `null` | `''` | `''` |

Also `{code:'Digit3', key:'w'}` → `Digit3`.

## Prototype / host getters (HIGH gate)

Simulated KeyboardEvent-like host: `code` / `key` are getters on the prototype. Instance `Object.hasOwn` is false.

- Getter `code='KeyW'` → `KeyW` (not `''`).
- Getter empty `code` + `key='w'` → `KeyW`.
- Getter empty `code` + `key='1'` → `Digit1`.
- Chain instance → KE → UIEvent → Event → Object.prototype with getters on KE → `KeyA`.

Empty-code a11y path does not fail on proto getters.

## Pollution / safety

- `Object.prototype.code` / `key` pollution does not fill `{}` (still `''`).
- Empty own `code`/`key` still `''` under pollution.
- Bad hosts (`undefined`, number, string, array, throwing getters) do not throw; return a string.
- `key-code.js`: no `for-in`; `Object.hasOwn`; stops at `Object.prototype`; depth cap 8; outer try/catch.

## controls.js

- `keydown` / `keyup` call `decodeKeyCode(e)`. No remaining `e.code` in this file.
- `TRACKED` has Digit1–5. Lacks Digit0, Digit8, Digit9.
- `agentPulse` does not call `decodeKeyCode`. Edges remain `dock` / `hail` / `target` / `reticleLock`.
- Note vs committed HEAD: `agentPulse` is uncommitted from earlier agent-API work, not from this decode wire. This worker does not rewrite the pulse body.

## Bugs

None.
