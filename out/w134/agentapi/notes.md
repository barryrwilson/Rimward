# Wave 134 — Agent API PR5 close-out (badge chrome)

**Status:** implemented (src badge + style + pins + design/PROGRESS).
**Merge law:** `out/w126/agentapi/shared-contract.md` wins.
**Graph:** `proceed_unmodeled` (`codex/agent-codex`). No graph write.

## Landed

- `src/systems/agent-api.js` — `createElement` badge on `document.body` in `initAgentApi`. Frozen copy. `textContent` only. Enable is trusted click. Stop calls `disable()` (clears `optIn` only). Refresh on `update` / enable / disable / act.
- `src/style.css` — `.rw-agent-badge` tokens (`--rw-accent` `#6ff2e0`, `--panel`, `--white`). z-index 40 (HUD 10, pause 50, berth 60). Hit target 44 px. Focus ring. No animation. `body.rw-reduced-motion` kills animation/transition.
- `scripts/boot-test.mjs` — WAVE134 named pins immediately before `if (errors === 0)`. WAVE127/131/132/133 stay.
- `docs/AgentApiDesign.md` — header Status/Wave only.
- `PROGRESS.md` — Wave 134 bullet.
- This notes file.

Did not edit `hud.js`, `hud.css`, `index.html`, `state.js`, `save.js`, autopilot/automine/controls, wishlist, or `package.json`.

## Pins (all must print true)

| Key | Law |
|---|---|
| `mounted` | Badge is a `document.body` child, not under `#hud`. Title `Agent play`. Status `aria-live="polite"`. Two `button type="button"` with Enable/Stop labels. Hint present. |
| `noInnerHtml` | `agent-api.js` has no `innerHTML` / `insertAdjacentHTML`. Style in `src/style.css`, not `hud.js`. |
| `queryOffDefault` | Default location (no `agent=1`): `optIn !== true`, status `off`. Restore first, then one `tick`. |
| `untrustedEnable` | `enable()` with no event, and harness `.click()` (no `isTrusted`), do not set `optIn`. Token `opt-in`. |
| `trustedEnable` | Fire Enable listeners with `{ isTrusted: true }`. `optIn === true`, status `on`, `act ping` ok. |
| `stopClears` | Stop/disable clears `optIn`; status `off`; later `ping` is `opt-in`. AP engaged first stays engaged. |
| `lastLine` | After `ping`, `Last: ping`. After refused `teleport`, `Error: ` + live error. No dest/id in badge text. |
| `noThrow` | Pins did not throw. |

## Restore

WAVE134 saves and restores `optIn`, lastIntent, paused, berthHold, docked, chartOpen, AP engaged, nav bag, `location.search` / `href`.

## OPEN leftovers

PR6 loopback bridge. No in-repo LLM. No HTTP this wave.

## VERIFY

`npm run test:boot` (exit 0):

```
wave134 agent-badge: { ... all true }
BOOT TEST PASS — no update errors
```

Did not start Vite/Chrome.

## Reviews (self-applied)

Security: no HIGH/CRITICAL. XSS closed (`textContent` only). Untrusted `enable()` stays `opt-in`. No HTTP bind. No cheat writers. LOW: command `name` is attacker-chosen but painted with `textContent` (no HTML parse). Colorblind HUD token overrides are `#hud`-scoped; on/off text + dashed/solid edge still carry state.

Code: no Blocker/Major. Handle freeze + module `badgePaint` is one-page singleton. Stop uses `disable()` (optIn only). Harness: parent with `document.body.appendChild`; never `getElementById('app')`.

UI: no Blocker/Major. Corner badge z-index 40; pause 50; berth 60; HUD 10. Hit target 44 px. Focus ring. `aria-live` + `aria-atomic` on status. Default no animation. Minor: bottom-right can overlap `.rw-bottom` visually; HUD stays `pointer-events: none` on that strip; hub stays clear.
