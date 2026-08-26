# NAV-09 chart readability leftover — verifier report (Wave 128)

**Domain:** data. Did not start Vite or Chrome. Did not run `npm run test:boot`. Did not edit `src/`.
**Graph:** `omp/workflow-software-delivery` (resolve `r-mt9mv017-766af39f`). Smoke = node census of `SYSTEMS`, not browser.
**Date:** 2026-08-26.

## Status

CLEAN

## What I tested

Live code vs pack census (leftover REAL vs CONSUME):

- `src/systems/galaxychart.js`: static `viewBox` at init (`MARGIN` 80, lines 44, 124–127, 254). No later `viewBox` write. Listeners: click / pointerover / pointerleave / keydown / resize / Autopilot. **No** `wheel`, `pointerdown`, `pointermove`, `mousedown`. **No** `#rw-galaxy-zoom-*`. **No** `#rw-galaxy-filter-*`. **No** itinerary. **No** `innerHTML`.
- Dest control: `<select id="rw-galaxy-dest">` (202). Options = every charted id after `sanitizeSystemId`, A–Z name then id (209–228). No faction/standing gate in the loop. Change calls `activateSystem` (742–746).
- Labels: `AUTHORED_IDS ∪ PINNED_IDS ∪ sys.hub` (54–55, 340–351). Node census: **12** ids (`freehold` `veridian` `redmarch` `hollowreach` `hush` `verge` `veil` `fx_bastion` `gc_auction` `stolenwomb` `blackstation` `lastbeacon`). Extra hubs outside that set: **0**.
- Plot status: `` `${name} · ${jumpPhrase(hops)}` `` (605). Blocked `No route from here.` (625). Arrived `` `Arrived · ${name}` `` (634). Not a hop list.
- KeyM close skips `isTypingFocus()` and `#rw-galaxy-dest` (766–779). Overlay `canOpenPlayCard(ctx, 'chart')` (482–486). Chart **reads** `flags.paused` to refuse open (781); does **not** assign `flags.paused`. `overlay-policy.js` header: never writes paused (line 4). `appliedScale` is settings `textScale` (406–407, 831–836).
- Catalog node census (`state.js` `SYSTEMS` spread 583): **101** keys, **101** charted, authored **7** including `veil` (`The Veil`, `unknowables`, chart `[890, 640]`, band 3), generated **94**. Gates **243**. `cast.pirates > 0` on **85** systems. `WORLD_FIELDS` includes `nav` not zoom (`save.js` 80–105, 103–104). `ctx.flags.chartOpen` session (`ctx.js` 217).
- NAV-08 leftover remains **CONSUME** / serial **none** (`docs/Nav08RemainingNavDesign.md`). This pack does not reopen it. NAV-07 dest select is frozen **kept**.

Write-set / siblings / honors:

- Worker paths are NAV-09 markdown only (`docs/Nav09ChartReadabilityDesign.md` + `out/w128/chartread/*.md` except this verify folder). `galaxychart.js` is **not** git-dirty. `hud.css` is dirty but **no** `.rw-galaxy*` hunk (other work). `hud.js` dirty is **not** this leftover.
- `docs/Hail02MissFeedbackDesign.md` and `docs/Hud07DeconflictionDesign.md` exist as sibling untracked docs. This pack did not rewrite them.
- Merge law: contract leftover **REAL**, serial **PR1**, dest select kept, later write-set `galaxychart.js` + `.rw-galaxy-*` CSS, no `hud.js` flight HUD. Integrator matches. Honors: KeyM stays; typing skip stays; CTL-02 never paused; `innerHTML` forbidden; zoom session; itinerary recorded-state only (no clue `line`).

## Bugs found

None that change leftover **REAL**, dest keep, 101 count, write-set, or named **PR1**.

Nits (do not fail CLEAN):

- Wishlist cite **106–111** includes the last HUD-inbox line (106). NAV inbox body is **107–111**.
- `sanitizeNav` cite **191–192** is the comment + export; `autopilot: false` is `writeNav` **54** (sanitize always calls `writeNav`).

## Environmental issues

None. Node census imported `src/game/state.js` without Vite. Browser skipped (owner: data domain).

## Evidence

| Probe | Result |
|---|---|
| `Object.keys(SYSTEMS).length` | 101 |
| Charted (`Array.isArray(sys.chart)`) | 101 / 101 |
| Authored / generated / veil | 7 / 94 / live |
| Label count | 12 |
| `#rw-galaxy-dest` | live; unfiltered |
| Zoom / pan / filter / itinerary | absent |
| Plot status | `{name} · N jumps` |
| `innerHTML` in `galaxychart.js` | 0 |
| Leftover | REAL |
| Serial | PR1 |
| Dest select freeze | kept |
| Later write-set | `galaxychart.js` + `.rw-galaxy-*` |
| Worker `src/` | none |

Artifacts: `out/w128/chartread/verify/write-set.txt`.
