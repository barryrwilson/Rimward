# NAV-11 chart-close dest keep inventory

**Wave:** 137 leftover census. Markdown only. No `src/` writes.  
**Code wins.** Cites are live file:line at census time (2026-08-26).  
**Leftover:** **CONSUME.** Named serial **none**. Not REAL. Named serial is **not** PR1.  
**Name:** **no remaining NAV-11 leftover.**  
**Not this leftover:** NAV-03 Autopilot fly. NAV-06 auto-close-on-AP. NAV-09 zoom/filter. NAV-10 SLOW cue. Agent pad 2B. MSN-05 ore guidance. Agent evade.

Inbox source (`docs/PLAYER-EXPERIENCE-WISHLIST.md` Playtest capture 2026-08-25 second pass — **207–210** — cite, do not edit): Keep a plotted route when the chart closes. A plotted `"Veridian Reach · 1 jump"` route was gone after closing and reopening the chart without engaging, and the Autopilot button read `"plot a destination first"`. A plotted route should persist until cleared or replaced.

CONSUME test (owner): if plotted dest **survives chart close** **and** the Autopilot button still names that dest without a fresh plot → freeze **CONSUME** and named serial **none**. Census: **both** live. Hole (close/reopen drops dest, AP plot-first, or `world.nav` idle after close) is **not** live.

---

## 0. Verdict table

| Question | Answer | Why |
|---|---|---|
| Does `setOpen(false)` call `clearRoute` / `dropNav`? | **No** | `galaxychart.js` **935–962** hide + `resetView` + `clearHover` + blur only |
| Does close write `world.nav` idle? | **No** | `nav.js` owns the bag; close does not call it |
| Does reopen require a fresh plot to keep dest? | **No** | `update()` **1375–1376** `retargetPlot` + `syncApButton` from live bag |
| AP button plot-first after close with dest? | **No** | plot-first only when `!navHasRoute` (**1129–1134**) |
| `world.nav` persist key already exists? | **Yes** | `save.js` **107–108** `'nav'` |
| CONSUME? | **Yes** | dest survives; AP is not plot-first |
| Named serial | **none** | leftover CONSUME |

**Freeze leftover CONSUME.** Name later serial **none**. Name: **no remaining NAV-11 leftover.**

---

## 1. Chart open / close (`setOpen`)

| Surface | Today | Cite |
|---|---|---|
| Flag | `ctx.flags.chartOpen`; session only | `ctx.js` **218**; `galaxychart.js` **942** |
| Only writer | `setOpen` | `ctx.js` **276** |
| Open gate | `canOpenPlayCard(ctx, 'chart')` | `galaxychart.js` **936–939** |
| Open body | `resetView`; `applyFilters`; `paintItinerary` | **945–951** |
| Close body | `resetView`; `clearHover`; blur focused child | **952–961** |
| Close writers that drop dest | **none** | no `clearRoute` / `dropNav` / `destSelect.value = ''` in `setOpen` |
| Close button | `setOpen(false)` | **1197** |
| KeyM close | `setOpen(false)` unless typing dest/filters | **1325–1338** |
| Escape | `setOpen(false)` | **1345–1346** |
| Docked auto-close | `setOpen(false)` | **1359** |
| Pause write | **never** | overlay header `overlay-policy.js` **4**; chart reads `flags.paused` only **1340** |
| View reset | zoom/pan only; not `world.nav` | `resetView` **805–814**; file header **26–27** |

Close resets the **fitted view**. Close does **not** reset the plot bag.

---

## 2. Plot / clear / dest list (NAV-01 live)

| Surface | Today | Cite |
|---|---|---|
| Owner | `nav.js` owns `world.nav`. No chart UI. | `nav.js` **4–6** |
| Write bag | `{ dest, path, remaining, status, autopilot: false }` | `nav.js` **48–55** |
| Plot | BFS from `currentSystem`; uncharted fail closed | `nav.js` **279–300** |
| Clear | `delete world.nav`; emit idle | `nav.js` **271–275** |
| Chart click | `activateSystem` current → `clearRoute` else `plotRoute` | `galaxychart.js` **1188–1194** |
| Clear button | `clearRoute` + `retargetPlot(true)` + `syncApButton` | **1198–1201** |
| Dest list | `<select id="rw-galaxy-dest">`; placeholder `Plot a system` | **269–282** |
| Dest change | empty value **returns**; else `activateSystem` | **1204–1208** |
| Status copy | `${name} · ${jumpPhrase(hops)}` (inbox shape) | **1060–1063** |
| Dest select sync | plotted/blocked dest id; idle → `''` | **1008–1021** |
| Idle paint | only when bag missing / not an object | **1008–1013** |
| Per-frame | `retargetPlot(false)` even when chart closed | **1375** |

`dropNav` / `clearRoute` call sites in `src/` (product): `nav.js` sanitize/clear/plot-here; chart Clear / current-system click; Agent `clearRoute`. **Not** `setOpen`.

---

## 3. Autopilot button copy (plot-first is no-route only)

| Surface | Today | Cite |
|---|---|---|
| Visible label | `Autopilot` or `Cancel autopilot` | `galaxychart.js` **245**, **1127–1128** |
| `navHasRoute` | dest string **and** `path.length >= 1` | **1112–1116** |
| No route | `disabled`; aria `Autopilot unavailable — plot a destination first.` | **1129–1134** |
| Has route | enabled; aria = visible label | **1136–1137** |
| Per-frame | `syncApButton()` even when chart closed | **1376** |
| Engage need dest | `apRefuseToken` `noDest` | `autopilot.js` **24**, **184–188** |
| Engage | `tryEngage`; empty token → success | `autopilot.js` **218–231** |
| NAV-06 close | success → `showApLive('')` + `setOpen(false)` | `galaxychart.js` **1161–1168** |
| HUD AP chip | only while `nav.autopilot === true` | `hud.js` **1990–1993** |
| HUD DEST readout | plotted dest while chart closed | `hud.js` **2394–2434** |

Inbox `"plot a destination first"` is the **no-route** aria string. After a live plot, `navHasRoute` is true until `clearRoute` / sanitize drop / arrive-here clear. Close does not flip it.

The Autopilot **button** does not print the system name. Dest name lives on chart status (`Veridian Reach · 1 jump`), dest `<select>`, itinerary, and HUD DEST. Owner CONSUME “names that dest” = not plot-first **and** dest still on those surfaces without a second plot.

---

## 4. Persist / restore (`world.nav` already exists)

| Surface | Today | Cite |
|---|---|---|
| `WORLD_FIELDS` | `'nav'` | `save.js` **107–108** |
| Snapshot | `sanitizeNav` then copy fields | `save.js` **983**, **987** |
| Restore omit | omitted `nav` → `delete ctx.world.nav` (idle) | `save.js` **1205–1206** |
| Restore keep | `sanitizeNav` after restore | `save.js` **1248** |
| Heal | idle omit; `autopilot` always false after keep | `nav.js` **191–192**, **48–55** |
| Chart open flag | **not** a WORLD_FIELD | `ctx.js` **218** |

Chart close is **not** a save. Do **not** add a second persist key for dest keep. `world.nav` already is the dest bag.

---

## 5. NAV-06 chart-close-on-AP (cite; do not steal)

| Surface | Today | Cite |
|---|---|---|
| Button success | `setOpen(false)` | `galaxychart.js` **1167–1168** |
| Direct `tryEngage` | no `setOpen` | `autopilot.js` **218–231** |
| Close on AP drops dest? | **No** | same `setOpen(false)` as × / KeyM / Escape |

NAV-06 closes the overlay. It does **not** clear the route. This leftover must **not** invert button close.

---

## 6. Agent plot / clear / engage (cite only; do not claim)

| Surface | Today | Cite |
|---|---|---|
| `plotRoute` act | `plotRoute(ctx, dest)` then read bag | `agent-api.js` **206–223**, **317** |
| `clearRoute` act | `clearRoute(ctx)` | **318–320** |
| `engageAutopilot` | `tryEngage`; fail `noDest` if idle | **322–326**; `autopilot.js` **24**, **188** |

Agent plot writes the **same** `world.nav`. Chart close does not clear it. This pack does **not** claim `agent-api.js`. Pad 2B is not this leftover.

---

## 7. Playtest example vs live graph

Inbox example: `"Veridian Reach · 1 jump"` then close without engage.

| Fact | Live |
|---|---|
| Name | `SYSTEMS.veridian.name` = `'Veridian Reach'` (`authored-systems.js` **61–63**) |
| Freehold → veridian | one gate (`authored-systems.js` **44**) |
| Plot | `plotRoute` BFS path length 2 → remaining **1**; status `plotted`; comm `Route plotted: 1 jump to Veridian Reach.` (`nav.js` **297–299**) |
| Chart status | `Veridian Reach · 1 jump` (`galaxychart.js` **1063**; `jumpPhrase`) |
| Close | `setOpen(false)` — bag stays |
| Reopen | `setOpen(true)` paints itinerary from bag; `update` retargets from bag |
| AP | `navHasRoute` true → Autopilot, **not** plot-first |

Stale playtest (2026-08-25) does **not** beat this census. Code wins.

---

## 8. Neighbour leftovers (do not steal)

| Neighbour | Status vs this hole |
|---|---|
| NAV-03 Autopilot fly | cite; `tryEngage` still needs dest |
| NAV-05 handoff / `showApLive` | cite; do not rewrite live region |
| NAV-06 button close | live; close ≠ clear |
| NAV-07 dest `<select>` | live keyboard plot |
| NAV-09 zoom/filter | session view; close resets **view** only (`galaxychart.js` **26–27**, **805–814**) |
| NAV-10 SLOW cue | other leftover; HUD pad |
| Agent pad 2B | not this pack |
| MSN-05 ore guidance | sibling Wave 137 |
| Agent evade | sibling Wave 137 |

---

## 9. Fail-closed already live

| Case | Behavior | Cite |
|---|---|---|
| Missing bag | idle paint; dest `''`; AP plot-first | `galaxychart.js` **1008–1013**, **1129–1134** |
| Bad dest id | `sanitizeSystemId` null → no plot | `nav.js` **30–36**, **281–282** |
| `setOpen` mutex throw | catch skip | `galaxychart.js` **937–939** |
| Close blur throw | catch; close still wins | **955–960** |
| `retargetPlot` / filters | try/catch keep flying | **1000**, **877** |
| Uncharted dest | `plotRoute` no write | `nav.js` **283** |

Never throw from chart close/open in live `setOpen`. Missing nav bag is idle, not a crash.

---

## 10. Why CONSUME (not REAL)

Named hole from inbox is **not** live:

- Close does **not** drop `world.nav`.
- Reopen does **not** require a second plot.
- AP button is **not** plot-first while dest+path remain.
- Persist key `nav` already exists.

A UI-only `retargetPlot(true)` on `setOpen(true)` would be a later optional polish if dest **paint** ever desynced while the bag stayed. Census: close does **not** clear `destSelect`, status, or `plotLayer`. `lastPlotKey` skip keeps that paint. Do **not** freeze PR1 for a non-hole.

**Freeze leftover CONSUME.** Named serial **none**.
