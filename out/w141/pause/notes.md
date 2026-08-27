# Wave 141 CTL-05 pause menu notes

**Verdict:** leftover **REAL**. Name: **pause menu access (Settings / berth / title / resume)**. Named serial: **PR1**. Not CONSUME. Named serial is **not** none.

## Method

- Did **not** call `graph_propose` / `graph_approve`. Local markdown only under `docs/Ctl05PauseMenuDesign.md` and `out/w141/pause/**` except `verify/**`.
- `graph_resolve` returned `execute_workflows` → `hermes-hal/workflow-catalog-maintenance` (match on incidental “approve / graph / markdown”, coverage 0.16). That catalog workflow requires graph writes. The owner forbade `graph_propose` / `graph_approve` and scoped this worker to WebSim leftover markdown. **Did not** follow catalog writes. Did **not** change the graph.
- Applied security / code / UI reviews **self** on the freeze (parent: do not spawn `[designer]`; do not start Vite/Chrome).
- Census live `src/main.js` `pauseEl`, KeyP listener, loop skip.
- Census `src/systems/overlay-policy.js` never writes `flags.paused`; `hailDigitsAllowed` digit skip under pause; `setBerthHold`.
- Census `src/systems/title.js` capture, skip marker, `closeTitle`.
- Census `src/systems/settings.js` KeyO z 80, live FIELDS (no expansion knobs).
- Census `src/game/save.js` KeyL, LOAD paused refuse, SAVE writes, `berthHold`.
- Census `src/systems/modelsbrowser.js` KeyP swallow / filter INPUT.
- Census z ladder: pause 50, berth/origins 60, title 70, settings/models 80, fatal 99.
- Census wishlist **217–220** (cite, do not edit). Expansion inbox **131–135** cite, do not steal.
- Domain is **data**. Did **not** start Vite or Chrome. Did **not** claim ports. Did **not** write `src/`. Did **not** edit the wishlist or `PROGRESS.md`. Did **not** write sibling Onb01 / Org01 paths.

## Why REAL (not CONSUME)

CONSUME needed pause **already** to offer Settings, save, **and** title from inside a run.

Those paths **are not** live on `pauseEl`:

- Copy-only `'PAUSED — P to resume'` (`main.js` **172**).
- KeyL open refuses `flags.paused` (`save.js` **1625**).
- `closeTitle` removes `#rw-title` (`title.js` **251–256`).

KeyO **does** exist in a run (`settings.js` **228–234**). That is **not** a pause menu. Do **not** CONSUME on KeyO-exists.

## Deputize (not parked)

| Knob | Freeze |
|---|---|
| Menu | ACCESS: RESUME / SETTINGS / BERTH RECORDS / TITLE |
| Settings knobs | live FIELDS only; expansion inbox not this pack |
| Berth from pause | stay paused; SAVE writes; LOAD gated + named-disable |
| `berthHold` | not pause |
| Title from pause | remount; no reload; no skip |
| Overlay-policy | never write `paused` |
| Click-through | `pauseEl` pointer-events none while settings/berth/title cover |
| KeyP | stay; typing/models/title guards stay |
| Persist | none |
| `state.js` | read-only |
| Fail-closed | skip unknown; never throw |

## Later write-set (do not edit now)

- `src/main.js` — `pauseEl` menu + `setPaused`
- `src/systems/title.js` — reopen from pause
- `src/game/save.js` — berth open-from-pause; LOAD named-disable
- optional `src/systems/settings.js` — `setOpen` export only

Do **not** claim overlay-policy as a pause writer. Do **not** claim `controls.js`. Do **not** claim Onb01 / Org01.

## Honor holds

HUD-01 empty hub. No new Digit. KeyH/J/L/M/P/D stay. Digit 0/8/9 stay. CTL-02 never-write. CTL-03 hold distinct. Wave 28 LOAD gate. Wave 40 z ladder. No teleport. No credits. No innerHTML. Settings expansion not stolen. Sibling packs not stolen.

## Graph

Owner-scoped exception to catalog-maintenance: this task is WebSim Ctl05 markdown leftover census. Graph writes are forbidden by the worker brief.
