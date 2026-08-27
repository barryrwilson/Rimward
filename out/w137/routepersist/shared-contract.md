# NAV-11 chart-close dest keep shared contract

**Wave:** 137. Design only. No route-persist ships in this wave.  
**Status:** MERGE LAW for `docs/Nav11RoutePersistDesign.md`. If that document and this file ever disagree, **this file wins**.  
**Leftover:** **CONSUME.** Not REAL. Serial is **none**. Named later serial: **none**.  
**Name:** **no remaining NAV-11 leftover.**  
**Not this wave:** any edit under `src/`, `scripts/`, `public/`, `index.html`, `package.json`. Do not edit `docs/PLAYER-EXPERIENCE-WISHLIST.md`, `PROGRESS.md`, `docs/Nav01*`–`docs/Nav10*`, `docs/Hail01*`, `docs/Hail02*`, `docs/Hud06*`, `docs/Hud07*`, `docs/Ctl*`, `docs/AgentApiDesign.md`, `docs/Tgt*`, `docs/Msn*`, `docs/OwnerDecisions*`. Do not steal sibling Wave 137 packs (`out/w137/oreguide/**`, `out/w137/evade/**`). Do not steal Hail01 / HUD-06 / Hail02 / HUD-07 / NAV-09 / NAV-10 governor / TGT-07 stills / MSN-04 other families / CTL-03 / AI-05 / CTL-04 / Agent API in-repo LLM / pad 2B optional PR2s. Do not write `out/w137/routepersist/verify/**`.

**Locked sources:** wishlist INBOX (P2, NAV) lines **207–210** (cite, do not edit); live inventory `out/w137/routepersist/current-nav11-route-persist-inventory.md` (code wins); NAV-01 `world.nav` **live**; NAV-06 Autopilot **button** `setOpen(false)` **live**; Agent `plotRoute` / `clearRoute` / `engageAutopilot` **live** (cite only).

Integrator rule: a **later** implementation wave obeys this file. Inventory cites live code. Because leftover is **CONSUME**, there is **no** named implementation PR1.

**This leftover is chart-close dest keep.** It is **not** NAV-03 Autopilot fly. It is **not** NAV-06 auto-close-on-AP. It is **not** NAV-09 zoom/filter. It is **not** NAV-10 SLOW cue. It is **not** Agent pad 2B.

**Census:** `setOpen(false)` does **not** call `clearRoute` / `dropNav` (`galaxychart.js` **935–962**). `update()` always `retargetPlot` + `syncApButton` from `world.nav` (**1375–1376**). Plot-first aria is **only** `!navHasRoute` (**1129–1134**). `WORLD_FIELDS` already has `'nav'` (`save.js` **107–108**). **Leftover is CONSUME. Serial is none.**

If a later census finds chart close / reopen drops dest, AP button says plot-first with a live dest, or `world.nav` idle after close, re-open this leftover as **REAL** and name **PR1** only after that census. Prefer **UI re-sync** on `setOpen(true)` (`retargetPlot(true)` + `syncApButton`). Do **not** add a WORLD_FIELD. Do **not** park.

---

## 0. Orchestrator merge law (do not weaken)

1. This worker is **markdown only**. No `src/`. Because leftover is **CONSUME**, there is **no** named implementation PR1. Do **not** land chart-close dest keep in `src/` from this pack. Optional later census is named only.
2. HUD-01 empty **80 px hub**. Aim-glass gauges stay off. Kit mutate omit. Do **not** steal Digit 0/8/9. **No new Digit.**
3. Digit 0/8/9 stay. KeyH stays hail. KeyJ stays dock/jump. KeyL stays berth. KeyM stays chart. KeyP stays pause. KeyD stays strafe. **Do not remap those keys.**
4. `innerHTML` forbidden later. Chart / AP / dest copy use `textContent` / `createTextNode` / `el()` only. **No** `insertAdjacentHTML` / `document.write`. Live `innerHTML` in `galaxychart.js`: **none**.
5. `src/game/state.js` is READ-ONLY later. Persist: **no new key**. Do **not** invent UU. Do **not** invent SKU. Do **not** invent Digit. Do **not** add WORLD_FIELDS. `nav` already exists. Prefer no new persist key.
6. Overlay mutex stays CTL-02: hail / chart / berth exclusive. Hail / chart / berth **never** write `ctx.flags.paused`. Chart close is **not** pause. CTL-03 `berthHold` is **not** this pack.
7. NAV-03 Autopilot fly, NAV-05 `showApLive` / `#rw-galaxy-ap-live`, NAV-06 button `setOpen(false)`, NAV-07 dest `<select>`, NAV-09 zoom/filter, NAV-10 SLOW cue: **cite only**. Do **not** steal their PR2s. Do **not** invert NAV-06 close. Do **not** fly the pad.
8. Agent API: cite `plotRoute` / `clearRoute` / `engageAutopilot` only. Do **not** claim `agent-api.js`. Do **not** steal pad 2B. Do **not** steal in-repo LLM.
9. Do **not** invent a third helm. Do **not** pause. Do **not** teleport. Do **not** remap keys.
10. Fail closed:
    - Never throw from chart close/open.
    - Missing nav bag → idle, not crash.
    - Never `innerHTML` a system name.
    - Uncharted / reserved dest → no write (`nav.js` already).
    - Close still wins if blur throws (live).
    - `sanitizeNav` keep still forces `autopilot: false`.
11. `reducedMotion`: **no** new animation that ignores it. Color is not the only cue. CONSUME adds **no** new animation.
12. Accessibility: dest still named in **text** (status / dest `<select>` / HUD DEST). Plot-first stays the **no-route** name. **No new Digit.**
13. CPU: **no** per-frame DOM alloc invented here. Live `retargetPlot` is write-on-change via `lastPlotKey`.
14. Prototype-safe: authored literals only. Never `for-in` into `world`. Dest options already `Object.keys` + `Object.hasOwn` + `sanitizeSystemId`.
15. Do not “fix” known REDMARCH `castMatches` flake.
16. Do not steal sibling Wave 137 packs (MSN-05 ore guidance, Agent evade).
17. Do not steal optional PR2s: Hail01 / HUD-06 / Hail02 / HUD-07 / NAV-09 / NAV-10 governor / TGT-07 stills / MSN-04 other families / CTL-03 / AI-05 / CTL-04 / Agent API in-repo LLM / pad 2B.
18. Do not edit sibling honor docs, the wishlist, or `PROGRESS.md`. Deputize defaults live in **this** contract.
19. Do **not** pause. Do **not** teleport. Do **not** remap keys.
20. Do **not** persist-resume flying AP. `flags.chartOpen` stays session.
21. Bindings do not change here.

---

## 0.1 Wave 137 deputize (owner may override after playtest)

Pick the **smaller** freeze that closes the named hole. Inventory proves the hole is **not** live. Do **not** park. Do **not** invent UU / SKU / Digit / third helm. Prefer no new persist key if `world.nav` already exists.

**Freeze: CONSUME. Serial none.** Do not invent chart-close dest-keep work.

If a later true dest-drop census re-opens REAL: freeze **UI re-sync on reopen**, not a new WORLD_FIELD. Call `retargetPlot(true)` + `syncApButton()` from `setOpen(true)`. Do **not** write `clearRoute` on close. Do **not** add `WORLD_FIELDS`. Owner may skip.

Why not a new persist key: `save.js` **107–108** already lists `'nav'`. `nav.js` already owns the bag. Close does not delete it.

Why not PR1 paint-only now: close does not clear destSelect / status / plotLayer (`galaxychart.js` **952–961** vs idle paint **1008–1013**). `lastPlotKey` skip is not dest drop.

### Live knobs (do not retune as the “fix”)

| Knob | Live | Cite |
|---|---|---|
| Dest bag | `world.nav` | `nav.js` **4–6**, **48–55** |
| Persist | `WORLD_FIELDS` `'nav'` | `save.js` **107–108** |
| Restore omit | delete bag → idle | `save.js` **1205–1206** |
| Restore AP | always `false` | `nav.js` **48–55**, **191–192** |
| Close | `setOpen(false)` hide + view + hover | `galaxychart.js` **952–961** |
| Reopen paint | itinerary + per-frame retarget | **949–951**, **1375–1376** |
| Plot-first | `!navHasRoute` only | **1129–1134** |
| NAV-06 | button success `setOpen(false)` | **1167–1168** |
| Overlay pause | **never** | `overlay-policy.js` **4** |
| Dest list | `#rw-galaxy-dest` | **276–278** |
| HUD-01 hub | 80×80 `.rw-reticle` | `hud.css` **184–193** |

Do **not** “fix” the hole by a second persist key, by pausing, or by keeping the chart open against NAV-06.

### Playable policy (already live)

**Name:** plotted dest stays in `world.nav` until `clearRoute`, replace `plotRoute`, sanitize drop, or arrive-here clear.

| Piece | Freeze |
|---|---|
| **Who** | Player (and Agent cite-only) vs `world.nav`. |
| **PR1** | **none** (CONSUME). |
| **Close** | Must **not** `clearRoute`. Live already. |
| **Reopen** | Must read the bag. Live already. |
| **AP button** | Plot-first **only** when idle. Live already. |
| **Persist** | existing `nav` only. |
| **Fail-closed** | never throw; missing bag idle; never pause. |

### Later copy (authored `textContent` literals — live; do not retune)

| Surface | Literal |
|---|---|
| Dest placeholder | `Plot a system` |
| No-route AP aria | `Autopilot unavailable — plot a destination first.` |
| AP ready | `Autopilot` |
| AP flying | `Cancel autopilot` |
| Status plotted | `{name} · {n} jump(s)` |
| Clear comm | `Route cleared.` |

`textContent` only. Do **not** interpolate hostile ids into HTML. Do **not** say Pause.

---

## 1. Later write-set (document now; do not edit those files this wave)

**This pack owns later:** **none** (CONSUME).

If owner re-opens after a **true** dest-drop census:

- Prefer `src/systems/galaxychart.js` — `setOpen(true)` re-sync only (`retargetPlot(true)` + `syncApButton`).
- Do **not** claim `src/game/nav.js` (already owns bag).
- Do **not** claim `src/game/save.js` (already has `'nav'`).
- Do **not** claim `src/game/state.js`.
- Do **not** claim `src/game/autopilot.js` (NAV-03).
- Do **not** claim `src/systems/agent-api.js`.
- Do **not** invert NAV-06 `setOpen(false)` on button success.

**Do not claim this wave:** any `src/` path.

---

## 2. Partial merge forbidden

CONSUME: do **not** ship a dest-keep PR that also rewrites NAV-06 close, NAV-03 fly, NAV-09 filters, or NAV-10 SLOW.

If REAL later: shipping a new WORLD_FIELD while `world.nav` exists **fails** this pack. Shipping close-clears-dest **fails** this pack.

---

## 3. Serial PR plan (named only)

| PR | Lands | Does not land |
|---|---|---|
| **none** (CONSUME) | no `src/` | dest-keep feature; new persist key; teleport; pause; Digit; pad 2B |
| **PR1 UI re-sync (only if later census REAL)** | `setOpen(true)` `retargetPlot(true)` + `syncApButton`; `textContent`; fail-closed | new WORLD_FIELD; `clearRoute` on close; NAV-03 fly; NAV-06 invert; Agent API; `innerHTML`; `state.js` |
| **PR2 census (optional skip)** | re-grep `setOpen` for `clearRoute`; AP plot-first while dest | new world field |

First remaining serial is **none**.
