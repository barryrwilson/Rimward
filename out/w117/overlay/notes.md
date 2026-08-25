# Wave 117 CTL-02 leftover — overlay-priority

## Verdict

**Leftover is real.** Serial name: **PR1 overlay-priority**. Serial is **not** none. **Not CONSUME.**

Deputize: mutex hail / chart / berth; defer incoming hail; session calm gate; **never pause** those three. Owner may override after playtest. Do not park.

## Census (code wins)

- `hail.js` 8–9: does not touch `flags.paused`.
- `hail.js` 108: z-index 40. Module `open` 122. No `flags.hailOpen`.
- `hail.js` 184–192: live `letGo` sets `calmUntil + 30`; salvage `letGo` does **not**.
- `hail.js` 326–403 / 421: `openCard` on every `hailOpened`; no calm / chart / berth test.
- `hail.js` 407–415: Digit1–9 resolve while `open` even if berth covers the card.
- `npc.js` 1377: `updateResolve` skips emit during calm; 1414–1417 bargaining hail once per instance (`ai.hailed`).
- `npc.js` 1869–1886: demand hail does **not** read `calmUntil`.
- `npc.js` 227 / 249: new AI `hailed: false`, `calmUntil: 0` (respawn reopen).
- `galaxychart.js` 24–27, 420–427, 669–674: KeyM; `chartOpen`; no pause; no hail/berth test.
- `galaxychart.js` 572–636, 623, 709–718: `showApLive` + chart stays open on AP engage; sibling already paints cancel/disengage live (NAV-05 / P2 — do not steal).
- `hud.css` 1908: chart z 30 (Wave 40 “banners 30” drifted — chart lives here).
- `save.js` 1352 / 1376 / 1382–1496: berth z 60; “records hold while you fly”; local `berthOpen`; KeyL ignores hail/chart.
- `main.js` 149–176: pause skips `system.update` and still flushes events (paused hailOpened is dropped).
- `ctx.flags` 200–208: `chartOpen` only overlay flag. No hail/berth flags.
- `save.js` WORLD_FIELDS 76–101: no calm / overlay key.
- Overlay helper: **absent**.
- `controls.js` 44, 288–292, 370: KeyH hail; **KeyJ dock already LIVE** (CTL-01 sibling). No KeyM/L in TRACKED. Do not remap J.

Stacking is **not** a feature. Treating it as CONSUME would keep hidden hail Digits under berth and "Let them go" salvage reopen.

## Deputize

- At most one of hail / chart / berth open.
- Incoming hail **defers** if chart or berth is already open (skip `openCard` only; keep `hailOpened` for npc/song). Do not add a toast.
- KeyM / KeyL while hail open: refuse.
- Hail / chart / berth never write `flags.paused`.
- `openCard` and KeyH refuse when `now < ai.calmUntil`.
- Salvage `letGo` writes `calmUntil = time + 30` (session).
- Optional `flags.hailOpen` / `flags.berthOpen` session only.
- New helper `src/systems/overlay-policy.js`.
- Chart file: KeyM / `setOpen` mutex **only**. Not `showApLive`.
- No hub pip, no Digit steal, no `state.js` write, no new persist key, no `innerHTML`.

## Later PR1 may write

- `src/systems/hail.js`
- `src/game/save.js` **berth overlay only**
- `src/systems/overlay-policy.js` (new)
- `src/systems/galaxychart.js` **open gate only** (not `showApLive`)
- `src/core/ctx.js` optional session flags + comments
- `src/ui/hud.css` z-index **only if required** (prefer none)

Must **not** claim `src/game/autopilot.js`, `src/systems/controls.js` KeyJ, `galaxychart.js` `showApLive`, or `src/systems/hud.js` combat rails / toasts. This worker wrote **no** `src/`.

## Honor

- Wishlist Idea inbox P1 OVERLAYS — cite, do not edit.
- `docs/Ctl01DockBindDesign.md` — KeyJ sibling; cite, do not rewrite.
- `docs/Nav05HandoffDesign.md` — `showApLive` / chart-open-on-engage; cite, do not steal.
- P1 toast-flood — different inbox; call out only.
- P2 close-chart-on-AP — do not steal.
- P2 chart-label a11y — do not solve.
- `docs/OwnerDecisions*.md` — cite, do not edit. No `docs/OwnerDecisionsWave117.md`.
- Do not steal `out/w117/nav05/**`, `out/w117/ctl01/**`, `out/w116/**`.
- No wishlist. No `PROGRESS.md`.

## Coupling for orchestrator

- NAV-05 later `galaxychart.js` `showApLive` and this leftover’s KeyM mutex **share the file**. Impl must touch **open gate only**. Re-grep `showApLive` after merge.
- CTL-01 KeyJ is **already LIVE** as dock (`controls.js` 291–292). This leftover stays disjoint if it **does not** edit `controls.js`. Hail KeyH stays.
- `flags.chartOpen` is already the AP steer-freeze signal. Mutex must **not** clear `chartOpen` except on real chart close.
- Pause + event flush: do not pause play cards or deferred `hailOpened` dies.
- Hail Digit vs weapon Digit1–5 is a **known overlap** (`hail.js` 405–406). Mutex reduces hidden-card harm; it does not remap Digit 0/8/9.
- Wave 40 title `systems[0]` capture still swallows KeyM/L/H. Keep that.
- Settings z 80 over berth 60: later Digit skip while settings open is required with mutex.

## Ports / processes

This worker did not start Vite or Chrome. No ports claimed. `[NO BROWSER COVERAGE]` is correct for this markdown freeze.
