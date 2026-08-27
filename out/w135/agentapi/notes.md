# Wave 135 — Agent API PR6 close-out (loopback CDP bridge)

**Status:** implemented (Node bridge + npm script + design/PROGRESS header).
**Merge law:** `out/w126/agentapi/shared-contract.md` wins.
**Graph:** resolve returned CRM workflow (false match on generic terms). This worker did not read or write CRM. No graph write. No in-repo LLM.

## Landed

- `scripts/agent-bridge.mjs` — HTTP/WS on `127.0.0.1` (optional `::1`). Refuse `0.0.0.0` / `::` before listen. Bearer token. Equal-length `timingSafeEqual`. CDP `Runtime.evaluate` of `window.rimward.observe` / `act`. Mock evaluator for `--self-test`. Fail closed `no-ctx`. No CORS star. Token stays in Node.
- `package.json` — `scripts.agent:bridge` only. No new deps.
- `docs/AgentApiDesign.md` — header Status/Wave only.
- `PROGRESS.md` — Wave 135 bullet. OPEN leftover: no in-repo LLM. PR6 closed.
- This notes file plus security/code reviews.

Did not edit `src/**`, `scripts/boot-test.mjs`, `index.html`, `hud.js`, `hud.css`, wishlist, or `out/w126/agentapi/shared-contract.md`. Did not add `scripts/agent-demo.mjs`. Did not start Vite.

## Pins (all must print true)

| Key | Law |
|---|---|
| `bindLoopbackOk` | `127.0.0.1` allowed |
| `bindV6LoopbackOk` | `::1` allowed |
| `bindAllV4Refused` | `0.0.0.0` refused, no listen |
| `bindAllV6Refused` | `::` refused, no listen |
| `tokenLenMismatchFalse` | length mismatch returns false, no throw |
| `tokenMatchTrue` | equal buffers true |
| `tokenWrongSameLenFalse` | wrong same-length false |
| `httpMissingAuth401` | GET /observe without Authorization → 401 |
| `httpWrongToken401` | wrong Bearer → 401 |
| `httpObserveForwards` | GET /observe returns mock observe |
| `httpActForwards` | POST /act forwards `{ v, name, args }` |
| `noCorsStar` | no `Access-Control-Allow-Origin: *` |
| `noTokenOrSnapshotLogs` | logs omit token and snapshot credits |

## OPEN leftovers

No in-repo LLM (owner 4C). Agent API serial PR1–PR6 complete. Hail01 / HUD-06 / Hail02 / HUD-07 / NAV-09 / NAV-10 / TGT-07 / MSN-04 / CTL-03 / AI-05 / CTL-04 PR2 still optional.

## VERIFY

`node scripts/agent-bridge.mjs --self-test` (exit 0):

```
{
  "bindLoopbackOk": true,
  "bindV6LoopbackOk": true,
  "bindAllV4Refused": true,
  "bindAllV6Refused": true,
  "tokenLenMismatchFalse": true,
  "tokenMatchTrue": true,
  "tokenWrongSameLenFalse": true,
  "httpMissingAuth401": true,
  "httpWrongToken401": true,
  "httpObserveForwards": true,
  "httpActForwards": true,
  "noCorsStar": true,
  "noTokenOrSnapshotLogs": true
}
```

`npm run agent:bridge -- --help` prints usage (exit 0). `--host 0.0.0.0` prints `bind host refused` (exit 1).

Default verifier uses `--self-test`. Live CDP needs an existing Chrome on `--cdp-port` (default 9222) or `--launch-chrome`, plus a game URL with `?agent=1`. Do not call `enable()`.

## Reviews (self-applied)

Security: no HIGH/CRITICAL open. Bind allow-list, token compare, CSRF/CORS, no key on socket, no page WS. MEDIUM: no rate limit (loopback). LOW: `/health` unauth (spec); Chrome CDP `--remote-allow-origins=*` only when spawned.

Code: no Blocker/Major open. Self-test uses `http.request` + `closeAllConnections` (Windows libuv). WS requires masked client frames. `--game-url` is loopback http(s) only.

Design audit: not applicable (backend/non-UI task).

## Teardown

Self-test closed the mock server. Help/refuse did not listen. No Vite. No Chrome. Ports 517x–519x, 8765, 94xx were not left LISTENING by this worker.
