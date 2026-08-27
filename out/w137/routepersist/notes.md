# Wave 137 NAV-11 chart-close dest keep notes

**Verdict:** leftover **CONSUME**. Name: **no remaining NAV-11 leftover.** Named serial: **none**. Not REAL. Named serial is **not** PR1.

## Method

- Census live `src/systems/galaxychart.js` `setOpen` (**935–962**), close button (**1197**), `activateSystem` (**1188–1194**), dest `<select id="rw-galaxy-dest">` (**269–278**, **1204–1208**), AP `syncApButton` / plot-first (**1112–1134**), NAV-06 button `setOpen(false)` (**1161–1168**), `update` retarget + AP sync (**1375–1376**).
- Census `src/game/nav.js` owns `world.nav` (**4–6**); `writeNav` / `plotRoute` / `clearRoute` / `sanitizeNav` (**48–55**, **191–269**, **271–300**). Close does **not** call these.
- Census `src/game/save.js` `WORLD_FIELDS` `'nav'` (**107–108**); restore omit idle (**1205–1206**); snapshot/restore `sanitizeNav` (**983**, **1248**).
- Census `src/game/autopilot.js` `noDest` / `tryEngage` dest (**24**, **184–188**, **218–231**).
- Census Agent `plotRoute` / `clearRoute` / `engageAutopilot` (`agent-api.js` **206–223**, **317–326**) — **cite only**.
- Census NAV-06 live close-on-AP-button. Cite NAV-03/05/07/09/10; do not steal.
- Wishlist INBOX **207–210** cite, do not edit. Code wins.
- Domain is **data**. Did **not** start Vite or Chrome. Did **not** claim ports. Did **not** run boot tests. Did **not** write `src/`. Did **not** edit the wishlist. Did **not** `graph_propose` / `graph_approve`.

## Why CONSUME (not REAL)

Named hole is **not** live:

- `setOpen(false)` does not `clearRoute` / `dropNav`.
- `world.nav` is not idle after close.
- `update()` retargets dest and AP from the bag while the chart is closed.
- Plot-first aria is only `!navHasRoute`.
- Persist key `'nav'` already exists.

Inbox `"Veridian Reach · 1 jump"` matches live `SYSTEMS.veridian` + Freehold 1-gate + status `{name} · {n} jump(s)`. Stale 2026-08-25 playtest does not beat this census.

Do **not** CONSUME on NAV-06 close-on-AP alone. CONSUME is dest **keep** across close **without** engage. Census still keeps dest on × / KeyM / Escape close.

## Deputize (not parked)

| Knob | Freeze |
|---|---|
| Leftover | CONSUME |
| Serial | none |
| Channel | existing `world.nav` |
| New WORLD_FIELD | no |
| Later REAL (only if dest-drop census) | `setOpen(true)` `retargetPlot(true)` + `syncApButton` |
| NAV-06 | stays |
| Agent API | cite only |

## Later write-set (do not edit now)

- **none** (CONSUME).
- Do **not** claim `nav.js`, `save.js`, `autopilot.js`, `agent-api.js`, `state.js`.
- Do **not** invert NAV-06.

## Coupling (do not steal)

- NAV-03 Autopilot fly.
- NAV-05 `showApLive`.
- NAV-06 button close.
- NAV-07 dest `<select>`.
- NAV-09 zoom/filter (view reset on close is session).
- NAV-10 SLOW cue.
- Agent pad 2B / in-repo LLM.
- Wave 137 MSN-05 ore guidance / Agent evade.
- Hail01 / HUD-06 / Hail02 / HUD-07 / TGT-07 stills / MSN-04 / CTL-03 / AI-05 / CTL-04.

## Graph

Did **not** call `graph_propose` or `graph_approve`. Local markdown only. Owner forbids Vite, Chrome, Playwright, and CDP.

## Reviews

Security HIGH (XSS dest HTML, persist-resume AP, extra WORLD_FIELD, pause, teleport, Agent claim) **resolved in freeze**. Code Blocker/Major **resolved in freeze** (CONSUME vs playtest; AP dest-name reading; NAV-06 invert; `lastPlotKey` non-hole). UI Blocker/Major **resolved as CONSUME** (live dest text; no later chrome). Re-review after lock: still clean.

## Processes

Started none. No Vite. No Chrome. No CDP.
