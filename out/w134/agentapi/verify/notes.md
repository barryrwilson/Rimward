# Wave 134 PR5 badge chrome — verifier notes

Date: 2026-08-26
Port: 5174 (claimed; not 5173)
Browser: Playwright MCP, viewport 1600×900 after CONTINUE
Title: CONTINUE from save (title overlay was present on first load)

## Boot harness

`npm run test:boot` exit 0.

- wave127 agent-observe: all true
- wave131 agent-intents: all true
- wave132 pulse-latch: all true
- wave133 key-code: all true
- wave134 agent-badge: all true (`mounted`, `noInnerHtml`, `queryOffDefault`, `untrustedEnable`, `trustedEnable`, `stopClears`, `lastLine`, `noThrow`)
- `BOOT TEST PASS — no update errors`

Log: `out/w134/agentapi/verify/boot-test.log`

## Default `/`

- Badge mounts as `document.body` child. Class `rw-agent-badge`. Not under `#hud`.
- Title overlay `#rw-title` z-index 70, solid background. Badge z-index 40. Badge exists in DOM on title (`Agent play` / `off` / `Last: none`) but the screenshot does not show it (title paints over it). Not treated as a PR5 bug.
- After CONTINUE: badge visible, bottom-right, status `off`.
- `page.evaluate(() => window.rimward.enable())` does not set opt-in. Result `ok:false`, token `opt-in`. Badge then shows `Last: enable` and `Error: opt-in`. State stays `off`.
- Real mouse click **Enable agent play** sets `observe().agentOptIn === true`, state `on`, class `is-on`.
- `act({ v:1, name:'ping' })` ok. Badge `Last: ping`. No `Error:` line.
- Real mouse click **Stop agent play** sets opt-in false, state `off`. Ping refuses with token `opt-in`.
- Copy: title `Agent play`; buttons `Enable agent play` / `Stop agent play`; hint `Stop does not cancel Autopilot.`; no `AGENT DRIVE`; no `innerHTML` on the badge.

Screenshots: `01-default-off.png` (title, badge hidden by overlay), `01b-live-off.png` (flight, off), `02-enabled-on.png`, `03-stopped-off.png`.

## Query `/?agent=1`

- Boots with `agentOptIn === true`, badge state `on`, class `is-on` (even while title is up).
- After CONTINUE: `04-query-on.png`.
- Cheap API plot: `plotRoute` to veridian then `engageAutopilot` both ok. `ctx.autopilot.engaged === true`.
- Mouse move on canvas center (800,420 → 860,380 → 740,460) does **not** cancel AP. (A Playwright hover on the page root once hit the AP Cancel chip and cancelled AP; that is HUD Cancel, not a badge/PR5 mouse-latch fail.)
- Click Stop while AP is on: opt-in false, ping token `opt-in`, **AP stays engaged**.

## Title / pause

- Title: badge in DOM, not visible (z 70 vs 40). After CONTINUE the badge is visible.
- KeyP pause: overlay z-index 50, full viewport, `PAUSED — P to resume`. `elementFromPoint` on the badge returns the pause overlay. Overlay background is translucent, so the badge still shows through. Hit-test is covered. Screenshot `05-paused.png`.

## A11y

- Tab: Enable then Stop. Both receive focus.
- Focus ring: `outline: rgb(111, 242, 224) solid 2px`, offset 2px. Visible on `06-focus.png` (Stop).
- Hit targets: Enable 145.5×44, Stop 131.5×44 (both ≥ 44 px).
- Status node `.rw-agent-badge-status` has `aria-live="polite"` and `aria-atomic="true"`.
- On/off is text, not color only (`off` / `on` plus `is-off` / `is-on` border).

## reducedMotion

- `document.body.classList.add('rw-reduced-motion')`.
- Every badge node: `animation: none`, `transition: none`. CSS has no pulse on the badge even without the class.
- Screenshot `07-reduced-motion.png`. (Live hail card was open at that time; unrelated.)

## Hub clear / layout

- Viewport 1600×900. Badge rect `{x:1304,y:676,w:280,h:208}`.
- Center 80 px aim box `{760–840, 410–490}`. No overlap.
- Bottom-right corner. It sits over PWR / BIO HUD chips. Contract only forbids the center aim glass.
- Screenshot `08-layout.png`.

## Rapid click

- Double-click Enable → `optIn true`, state `on`, class `is-on`.
- Double-click Stop → `optIn false`, state `off`, class `is-off`.
- Double-click Enable again → `on`. Badge class/`data-state` stay aligned with `ctx.agent.optIn`.

## Console / network

- Console: 0 errors, 0 warnings (2 info-or-debug messages, none returned at warning/error).
- Network on `?agent=1`: GET app assets 200 or 304. No 4xx/5xx.

## Cleanup

- Playwright page closed.
- Vite PID 36784 killed with `/T`. 5174 is not LISTENING. One TIME_WAIT leftover.

## Verdict

CLEAN. Contract literals, trusted Enable, untrusted Enable refuse, Stop without AP cancel, WAVE134 boot pins, a11y, layout, and reduced-motion all hold.
