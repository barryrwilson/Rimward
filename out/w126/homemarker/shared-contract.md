# HUD-06 persistent home-station marker shared contract

**Wave:** 126. Design only. No home marker ships in this wave.  
**Status:** MERGE LAW for `docs/Hud06HomeMarkerDesign.md`. If that document and this file ever disagree, **this file wins**.  
**Leftover:** **REAL.** Not CONSUME. Serial is **not** none. Named later serial: **PR1** (persistent current-system station marker + distance).  
**Name:** persistent home-station marker with distance.  
**Not this wave:** any edit under `src/`, `scripts/`, `public/`, `index.html`, `package.json`. Do not edit `docs/PLAYER-EXPERIENCE-WISHLIST.md`, `PROGRESS.md`, `docs/AgentApiDesign.md`, `docs/Hail01DemandLifecycleDesign.md`, `docs/Ctl*.md`, `docs/Nav*.md`, `docs/Hud01*` through `docs/Hud05*`, `docs/Tgt*.md`, `docs/OwnerDecisions*.md`. Do not write `docs/OwnerDecisionsWave126.md`. Do not steal sibling Wave 126 packs (`out/w126/agentapi/**`, `out/w126/demand/**`). Do not steal Wave 125 overlay hold.

Integrator rule: a **later** implementation wave obeys this file. Inventory cites live code. Code wins over wishlist wording.

**This leftover is a session HUD cue to the current system's station: on-glass pip + off-screen home chevron + POS `HOME` distance row.** It is **not** a combat lock. It is **not** the NAV-02 next-gate ring/cue. It is **not** a selected-POI picker. It is **not** Agent API watch chrome. It is **not** hail demand copy.

**Live hole:** TGT `rw-edge-arrow` exists for `ctx.targets.current` (`hud.js` **816**, **1415**). Station has no persistent marker. POS is XYZ (`1028–1031`, **1974–1986**). **Leftover is real. Not CONSUME. Serial is not none.**

---

## 0. Orchestrator merge law (do not weaken)

1. This worker is **markdown only**. No `src/`. Later impl is **serial**. Serial PR plan is **named only**. Do **not** land these PRs in `src/` in this worker.
2. HUD-01 empty **80 px hub**. Aim-glass gauges stay off. Kit mutate omit. **No** home child inside `.rw-reticle`. RANGE stays. **Do not** steal Digit 0/8/9. **No new Digit.**
3. `innerHTML` forbidden later. Marker copy / POS HOME row use `textContent` / `createTextNode` / `el()` only. Live HUD already uses `el()` `textContent` (`hud.js` **283–288**). **No** `insertAdjacentHTML` / `document.write`. Station name through `stripHudText` (`421–428`).
4. `src/game/state.js` is READ-ONLY later. **No** HUD fields on `state.js`. Do **not** invent UU. Do **not** invent SKU. Do **not** invent Digit.
5. Persist: **no** new `WORLD_FIELDS` key. **No** new `localStorage` key. Marker is **session/UI only**. Restore does not need a home field. `ctx.station.position` already rebuilds with the system (`station.js` **4394–4421**, **6304–6306**).
6. Later write-set **this pack owns**:
    - **Writers:** `src/systems/hud.js` + `src/ui/hud.css` **only**.
    - **Reads (not owners):** `ctx.station.position` / `name` / `inZone`; `ctx.flags.docked`; `ctx.gate.jumping`; `ctx.flags.hailOpen` / `chartOpen` / `berthOpen`; `ctx.settings.reducedMotion`; `ctx.ship.object.position`; camera project. `U.DOCK_RANGE` is a **read** of `state.js` (already imported).
    - **Do not claim** `src/systems/galaxychart.js`. **Do not claim** `src/game/nav.js`. **Do not claim** `src/systems/station.js` except those reads. **Do not claim** `src/systems/controls.js`. **Do not claim** `src/game/agent-api.js`. **Do not claim** `src/systems/hail.js` / `src/systems/npc.js`. **Do not claim** `src/systems/nav-guidance.js` as exclusive (optional **call** `formatNavDist` is a number helper, not GATE chrome). **Do not claim** `overlay-policy.js` (read flags; do not edit mutex).
7. **Do not steal NAV-02:** do not write `gateCue`, `rw-nav-gate-cue`, GATE row, `world.nav`, `showApLive`, or `nav-guidance.js` ring.
8. **Do not steal TGT:** do not reuse `edgeArrow` / `.rw-edge-arrow`. Do not write `ctx.targets.current`. Do not restyle the amber lock triangle into a station pip. Do not put the station on the contacts arc.
9. **Do not steal Agent API watch badge (PR5).** Not the hub. Not this leftover.
10. **Do not steal hail-demand copy.** Do not edit `hail.js`. Hide the on-glass home mark while `flags.hailOpen`.
11. **Do not steal HUD-03 alerts or HUD-04 toast flood.** No new toast. No new live region required (POS row is enough).
12. Fail closed:
    - Never throw from missing `ctx.station` / `position`. Hide the mark. Flight still works.
    - Unknown system / non-finite coords → hide.
    - Do not project NPC / unspawned / hidden AI positions. **Station mesh/authored pad only.**
    - Prototype-safe: authored class names (`rw-home-mark`). Never `for-in` a blob into HUD nodes.
13. `reducedMotion`: **no pulse**. No `@keyframes` on the home mark. No `is-enter` flash. Transform/opacity only. Chartmark pattern (`hud.css` **597–598**).
14. Accessibility: **color is not the only cue**. Distance **text** is mandatory (POS `HOME` row and/or pip label). Named `HOME` in text. Marker on-glass may be `aria-hidden` (decorative) **if** the POS row stays visible whenever the mark would show.
15. CPU: **no** per-frame DOM alloc. One pip + one chevron + POS values, create-once. Transforms every frame; text throttled like other HUD text (`TEXT_UPDATE_INTERVAL` **63**). One scratch `Vector3` at init next to `chartProj` (**1101**).
16. Do not “fix” known boot FAILs (REDMARCH `castMatches` flake).
17. Do not steal sibling Wave 126 Agent API / hail-demand packs. Do not edit honor docs, the wishlist, or `PROGRESS.md`. Deputize defaults live in **this** contract.

---

## 0.1 Wave 126 deputize (owner may override after playtest)

Pick a playable **current-system station** cue. Inventory proves **persistent bearing + distance are not live**. Do not park. Do not invent UU / SKU / Digit / persist key. Do not invent HTML from save blobs.

### Marker kind

| Knob | Freeze |
|---|---|
| What | **Current system's station** (`ctx.station.position` + authored `name`) |
| Not | Origin-home across systems; mission dest; gate; landmark; NPC |
| Selected POI | **Omit later.** Not the same cheap path. Chartmarks already cover mystery landmarks (`hud.js` **824–841**). A picker needs UI + session state this leftover does not own. Inbox “or a selected point of interest” is **out of PR1**. |
| After jump | Follow rebuilt `ctx.station` (live). No extra persist. |

### On-screen vs off-screen

| Knob | Freeze |
|---|---|
| On-screen | Dedicated **square beacon pip** + label at projected pad. **Not** TGT bracket. **Not** chartmark diamond. **Not** reticle hub. |
| Off-screen | Dedicated **home chevron** at screen edge (NDC toward pad, same behind-camera flip as TGT **1373–1374**). **New** `.rw-home-mark` nodes. **Never** assign transforms onto `edgeArrow` or `gateCue`. |
| Edge inset | **`HOME_EDGE_INSET = 108`** px (TGT/NAV-02 keep **84**). Different seat so three cues in one bearing do not occupy one pixel. |
| When lock is station | **Hide on-glass pip + chevron** (`allowedLockKind === 'station'`). TGT bracket already names + `dist u` (**2073–2075**). **Keep POS HOME row.** |
| Pattern reuse | Chartmark **discipline** (create-once, edge, `textContent`, no pulse). **Not** chartmark slots. |

### Distance units

| Knob | Freeze |
|---|---|
| Unit | World **u** (same as lock meta / chartmarks). Inbox 8,900 u. |
| Format | Chartmark convention (**1856–1858**): `<1000` → `Math.round(dist) + 'u'`; `>=1000` → `(Math.round(dist/100)/10) + 'k'`. Optional call `formatNavDist` for the **number string only**. |
| GATE row | **Untouched.** Do not print home dist on `navDistVal`. |
| POS row | Always when the cue is allowed: label `HOME`, value `stripHudText(name) + ' · ' + distText` (or `HOME · distText` if name empty). |

### When it hides

Show only when **all** are true:

1. `ctx.station` has finite `position`
2. `!ctx.flags.docked`
3. `!(ctx.gate && ctx.gate.jumping)`
4. `ctx.flags.hailOpen !== true`
5. `ctx.flags.chartOpen !== true`
6. `ctx.flags.berthOpen !== true`
7. HUD root exists

Hide on-glass (pip + chevron) additionally when current lock `lockKind === 'station'`. POS HOME still shows if 1–7 hold.

`reducedMotion`: still **show**; **never pulse**.

Combat: dim on-glass like chartmarks (`#hud.in-combat .rw-home-mark { opacity: 0.14 }`). POS already `rw-fade`.

### Copy (authored `textContent` literals)

| Slot | Literal / rule |
|---|---|
| POS label | `HOME` |
| POS value | `Name · 8900u` / `Name · 8.9k` via strip + format; empty name → `HOME · 8.9k` |
| Pip label | same dist string; name optional if POS row carries name |
| Chevron | no words required if POS row visible; `aria-hidden="true"` |

Do **not** interpolate system ids into HTML. Do **not** say GATE. Do **not** say TARGET.

### Fail-closed / home

| Piece | Freeze |
|---|---|
| Missing station | hide; no throw |
| `innerHTML` | forbidden |
| Persist | none |
| Home files | `hud.js` + `hud.css` |
| Overlay-policy | **do not edit** |

Owner freeze (do not invert):

- Leftover is **real**. Not CONSUME. Serial is **PR1**, not none.
- Home station **first**. Selected POI **omit**.
- Do **not** put a gauge in the HUD-01 80 px aim glass.
- Do **not** steal NAV-02 / TGT arrows / Agent API badge / hail copy / HUD-03 / HUD-04.
- If allowlist skip fires, flight still works. **Never stop.**

### Formulas (later impl; named only — **do not implement**)

```
// SESSION UI — not WORLD_FIELDS
const showHome = !!(stationPos)
  && !ctx.flags.docked
  && !(ctx.gate && ctx.gate.jumping)
  && ctx.flags.hailOpen !== true
  && ctx.flags.chartOpen !== true
  && ctx.flags.berthOpen !== true

// DIST — chartmark buckets; not GATE chrome
distText = dist >= 1000
  ? (Math.round(dist / 100) / 10) + 'k'
  : Math.round(dist) + 'u'

// OFF-SCREEN — own node, own inset
HOME_EDGE_INSET = 108
// do not: edgeArrow.style.transform = ...
// do not: gateCue.style.transform = ...
```

Do **not** persist a POI. Do **not** write `targets.current` from the marker.

### Explicit non-picks

| Temptation | Verdict |
|---|---|
| CONSUME / serial **none** | **Forbidden** — marker not live |
| Reuse `.rw-edge-arrow` | **Forbidden** §0.8 |
| Reuse `.rw-nav-gate-cue` / GATE row | **Forbidden** §0.7 |
| Station pip on contacts arc | **Forbidden** §0.8 |
| Child of `.rw-reticle` | **Forbidden** §0.2 |
| Selected POI picker in PR1 | **Forbidden** §0.1 |
| New `WORLD_FIELDS` / settings key | **Forbidden** §0.5 |
| `innerHTML` | **Forbidden** §0.3 |
| `state.js` write | **Forbidden** §0.4 |
| Claim `station.js` / `nav.js` / `galaxychart.js` / `hail.js` / `controls.js` / `agent-api.js` | **Forbidden** §0.6 |
| Agent API `?agent=1` badge | **Forbidden** §0.9 |
| Pulse / `@keyframes` | **Forbidden** §0.13 |
| Project hidden NPC banks | **Forbidden** §0.12 |
| New Digit / toast / live-region flood | **Forbidden** §0.11 |

---

## 1. Ownership later

| Object | Writer (later serial) | Reader |
|---|---|---|
| `.rw-home-mark` pip + chevron | PR1 `hud.js` create-once | player |
| POS `HOME` row | PR1 `hud.js` `textContent` | player |
| `.rw-home-mark` CSS | PR1 `hud.css` | — |
| `ctx.station.position` | **none** (`station.js` live) | HUD project |
| `ctx.targets.current` | **none** | hide-on-station-lock |
| `world.nav` / GATE | **none** (NAV-02) | — |
| `flags.hailOpen` | **none** (`hail.js`) | hide |
| Agent badge | **none** (PR5) | — |
| `state.js` | **none** | `U` already imported |
| Digit / toast | **none** | — |

---

## 2. Fail closed (normative)

| Condition | Result |
|---|---|
| No `#hud` | live already disables HUD (`772`). Keep |
| No `ctx.station.position` | hide mark + HOME row |
| Docked | hide |
| Jumping | hide |
| Hail / chart / berth open | hide on-glass **and** HOME row (no paint under cards) |
| Station is current lock | hide on-glass; **keep** HOME row if otherwise allowed |
| `reducedMotion` | show static; no pulse |
| Combat | dim on-glass; POS fade live |
| Overlay-policy missing | still read `ctx.flags.*Open` booleans |
| Hostile save | nothing new to spoof |
| Partial merge (pip without distance text) | **Forbidden** — PR1 lands POS HOME **with** pip |

---

## 3. Serial PR plan (named only)

| PR | Lands | Does not land |
|---|---|---|
| **PR1** home marker | `hud.js` + `hud.css`: pip, chevron inset 108, POS HOME row, hide rules, `textContent`, `stripHudText`, no pulse | `nav.js`; `galaxychart.js`; `station.js` writes; `hail.js`; `controls.js`; `agent-api.js`; TGT arrow restyle; GATE row; selected POI; persist; Digit; `innerHTML`; hub child; toast; known FAIL fixes |
| **PR2 stills (optional)** | Playtest: 8,900 u still has HOME dist + off-screen chevron; docked hides; hail hides; lock-station no double chrome | Required with PR1 |
| **PR3 census (optional skip)** | Re-grep: no `edgeArrow` reuse; no `innerHTML`; no new WORLD_FIELDS | POI picker |

First remaining serial is **PR1**. It must not steal Digit 0/8/9. It must not write `state.js`. **Named only. Do not implement in Wave 126.**

Serial is **not** none.

---

## 4. Persist / proto

No home in save. No settings schema. Authored class names only. No `for-in` of world into HUD. No `WORLD_FIELDS` growth. `nav` bag stays NAV-01. Autosave key unchanged.

---

## 5. Later write-set freeze (document only — do not edit those files now)

- `src/systems/hud.js`
- `src/ui/hud.css`

**Out:** `galaxychart.js`, `nav.js`, `station.js` (read-only), `controls.js`, `agent-api.js`, `hail.js`, `npc.js`, `overlay-policy.js`, `state.js`, `nav-guidance.js` (optional `formatNavDist` **call** from hud.js is allowed; **no edit** of that file).
