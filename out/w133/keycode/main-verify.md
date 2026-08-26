# Wave 133 — main.js pause key-code verify

**Worker scope:** `src/main.js` pause listener.  
**Not this worker:** `src/systems/key-code.js` (Task A / helper).  
**Graph:** `graph_resolve` (`omp/agent-omp`, namespace `omp`) → `execute_workflows` `omp/workflow-software-delivery` (`r-mtafgeeq-7cd9892f`). Binding: verify with a real smoke test; no source edit; no `test:boot`; no Vite.

## Status

CLEAN

## What I tested

- Static review of uncommitted `src/main.js` vs `HEAD`.
- Import path, decode-then-KeyP order, typing/models/title guards, pause overlay `cssText`.
- Node ESM import of `decodeKeyCode` (no Vite, no `test:boot`).
- KeyboardEvent-style prototype getters (Node has no `KeyboardEvent`).
- `Object.prototype.code` pollution on a bare `{}`.

## Checklist

| Check | Result |
|---|---|
| Import from `./systems/key-code.js` | PASS (`src/main.js` line 21) |
| `const code = decodeKeyCode(e)` then `code !== 'KeyP'` | PASS (lines 173–174) |
| Guards after KeyP (INPUT/TEXTAREA/SELECT/contentEditable, `ctx.models?.isOpen?.()`, `#rw-title`) | PASS (lines 177–182); unchanged vs HEAD |
| Pause overlay CSS | PASS; `pauseEl.style.cssText` and `textContent` not in the worker hunk |
| `{code:'',key:'p'}` → `KeyP` | PASS |
| `{code:'KeyW'}` → `KeyW` | PASS |

Uncommitted `src/main.js` hunk is only the import plus the two-line decode/KeyP swap. `e.code !== 'KeyP'` became `decodeKeyCode(e)` then `code !== 'KeyP'`.

Pause overlay string (unchanged):

```
position:fixed;inset:0;display:none;align-items:center;justify-content:center;color:#6ff2e0;font:18px monospace;background:rgba(0,0,8,.45);z-index:50;letter-spacing:.3em;
```

Text remains `PAUSED — P to resume`.

## Bugs found

None in this worker’s scope.

## Task A (helper owner — not this worker)

**Not raised.** Live KeyboardEvent getters are not ignored by the current `Object.hasOwn` walk.

`ownValue` walks the prototype chain (depth cap 8, stop at `Object.prototype`). When `Object.hasOwn(cur, name)` is true on a host proto, it returns `obj[name]`, which invokes the getter.

Node `typeof KeyboardEvent` is `undefined`, so a real DOM `KeyboardEvent` was not constructed. Mock that matches the host pattern:

- Instance `Object.hasOwn(e, 'code') === false`
- Proto accessor `Object.hasOwn(FakeKE.prototype, 'code') === true`
- `decodeKeyCode(e) === 'KeyP'`

Empty proto `code` plus `key: 'p'` still yields `KeyP`. Bare `{}` with `Object.prototype.code = 'KeyP'` still yields `''`.

Send Task A to the helper owner only if a later live `KeyboardEvent` in a browser shows getters that are not own on any proto in that walk.

## Environmental issues

None. Node import ran. No Vite. No `test:boot`. No leftover process from this verify.

## Evidence

- Diff: `git diff HEAD -- src/main.js` (import + decode/KeyP only).
- Decode smoke (Node `--input-type=module` import `./src/systems/key-code.js`):

| Input | Output | ok |
|---|---|---|
| `{code:'',key:'p'}` | `KeyP` | true |
| `{code:'KeyW'}` | `KeyW` | true |
| `{code:'KeyW',key:'p'}` | `KeyW` | true |
| proto getters `code=KeyP` (`hasOwn` instance false) | `KeyP` | true |
| proto empty `code` + `key=p` | `KeyP` | true |
| class proto getter | `KeyP` | true |
| `{}` + polluted `Object.prototype.code` | `''` | true |

- `[NO BROWSER COVERAGE]` — Vite and `test:boot` were forbidden. Overlay CSS checked by diff, not pixels.
