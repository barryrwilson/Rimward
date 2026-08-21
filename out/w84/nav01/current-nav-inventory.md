# NAV-01 live inventory (Wave 84)

**Date:** 2026-08-21  
**Rule:** Code wins over comments. Wave 21 chart comments are cited only where they still match live lines.  
**Scope:** Galaxy chart, gate/jump graph, save, HUD, ctx, controls. No `src/` edits in this wave.

If this file and live `src/` disagree later, **live `src/` wins**. Re-cite before the impl wave.

---

## 0. Verdict (what NAV-01 does not have today)

| Claim | Live? | Cite |
|---|---|---|
| Click-to-select a chart node | **No.** Nodes are painted; no pointer handlers | `galaxychart.js` 174–210, 238–281 |
| Plotted multi-system path | **No.** `.rw-galaxy-route` is **hub** gold dashes, not a player plot | `galaxychart.js` 156–172; `hud.css` 1510–1516 |
| Persist key `nav` / `route` | **No** on `WORLD_FIELDS` | `save.js` 75–98 |
| `ctx.world.nav` | **No.** World bag has `currentSystem`, not a route | `ctx.js` 125–149 |
| Chart pause / key swallow | **No.** KeyM/Escape do not `preventDefault` / `stopPropagation` | `galaxychart.js` 21–24, 240–250 |
| Chart reads clues / landmarks | **No** (wave 21 law still holds) | `galaxychart.js` 14–19 |
| Plot sets `ctx.targets.current` | **N/A** (no plot). Jump **already nulls** lock at midpoint | `jump.js` 85–87 |
| innerHTML on chart | **None** | grep 0 in `galaxychart.js`; labels use `textContent` 207 |

---

## 1. Galaxy chart overlay

**File:** `src/systems/galaxychart.js`  
**Init:** `initGalaxyChart` after onboarding, before HUD (`main.js` 89–91, 125–127).

### 1.1 Build (once)

- Catalog: `Object.keys(SYSTEMS)` (`galaxychart.js` 59).
- Uncharted skip: `if (!Array.isArray(c)) continue` for bbox, gates, hub lines, nodes (`64–65`, `140`, `161`, `181`).
- SVG `viewBox` fitted to data bbox + `MARGIN` 80 (`33–34`, `71–75`, `127–132`).
- Physical gates: undirected dedupe `id|to` (`135–154`). Stroke class `.rw-galaxy-gate`.
- Hub routes: one-way `from.hub.routes` (`156–172`). Stroke class **`.rw-galaxy-route`** (Lamplighter gold). **Do not reuse this class for a player plot.**
- Nodes: `.rw-galaxy-node`, `data-system-id`, `data-faction`, CSS `--rw-node-color` from `FACTIONS[sys.faction].color` (`184–192`). Radius `NODE_R = 8` (`35`).
- Hub ring: `.rw-galaxy-hub-ring`, `HUB_RING_R = 15` (`36`, `194–198`). Appended **after** the node. CSS has **no** `pointer-events: none` (`hud.css` 1530–1536). Current marker and labels already have `pointer-events: none` (`1543`, `1554`).
- Labels: authored six + pinned specials + hubs only (`43–44`, `201–208`). `label.textContent = sys.name ?? id`.
- Current marker: one reused dashed ring `.rw-galaxy-current-marker`, `MARKER_R = 22` (`37`, `214–220`).

Authored ids: `freehold`, `veridian`, `redmarch`, `hollowreach`, `hush`, `verge` (`43`).  
Pinned: `stolenwomb`, `lastbeacon`, `blackstation`, `fx_bastion`, `gc_auction` (`44`).

### 1.2 Open / close

| Binding | Behavior | Cite |
|---|---|---|
| KeyM | Toggle. If open → close. If closed → open only when **not** docked and **not** paused | 242–247 |
| Escape | Close if open | 248–250 |
| Close `<button>` | `setOpen(false)` | 97–101, 238 |
| Docked while open | `update()` force-closes (station overlay owns the screen) | 258 |
| Pause | KeyM may **close** only; does not open | 247 |
| Gameplay | `aria-modal="false"`. Chart does **not** pause. Loop still runs unless `ctx.flags.paused` | 81; `main.js` 140–142 |
| Keys | **No** `preventDefault` / `stopPropagation` on the keydown listener | 21–24, 243–244 |

Root: `.rw-galaxy-chart`, `role="dialog"`, `aria-hidden` tracks open (`78–84`, `232–235`).

### 1.3 Per-frame `update()`

Diffs `ctx.world.currentSystem` against a cached id (`257–273`). On change: move `.is-current`, set marker `cx`/`cy`. No SVG rebuild. No allocation on the hot path (`26–30`). Text scale applied only while open (`274–280`).

**No click listener. No hover title. No hop count. No path layer.**

Live hit geometry: painted `NODE_R = 8` chart units. Default SVG `pointer-events: visiblePainted`. Hub-ring stroke (`r=15`) sits on the node and can steal a later click. NAV-01 PR3 must use a filled hit disc ≥ 24 **CSS px** and set hub rings to `pointer-events: none` (contract §3.3.1). Do not treat 16 chart units as the floor.

### 1.4 Pointer vs guns (gap)

`controls.js` sets `fireHeld` from **window** `mousedown` button 0 (`314–316`). The chart is `position: fixed; inset: 0; z-index: 30` (`hud.css` 1421–1432). A later node click **bubbles** to `window` and would fire guns.

Orchestrator law 4: the chart must not call `preventDefault` / `stopPropagation` at all. The impl wave therefore gates LMB in `controls.js` via a session flag (`ctx.flags.chartOpen`, **absent** today — `ctx.js` 175–183). Wave 21 comments talk about keydown (`galaxychart.js` 21–24, 243–244`); merge law is stricter.

---

## 2. Live graph (pathfinding inputs)

**Catalog:** `SYSTEMS = { ...AUTHORED_SYSTEMS, ...GENERATED_SYSTEMS }` (`state.js` 541). Comment: authored lane first, then 94 generated (`537–540`). `save.js` `N_SYSTEMS = Object.keys(SYSTEMS).length` (`save.js` 124).

**Do not write `state.js` in the impl wave.** Read `SYSTEMS` / `JUMP` / `FACTIONS` only.

### 2.1 Physical gates (two-way in data)

Shape: `SYSTEMS[id].gates[]` = `{ position, to }` (`authored-systems.js` 7–10, 44).  
`gates[0]` is the primary. Jump arrival: dest gate whose `to` points **back** at origin; else `gates[0]` (`jump.js` 47–49, 104–110).

Example: Freehold `gates: [{ to: 'veridian' }]` (`authored-systems.js` 44). Veridian has a return gate to `freehold` (`73–75`). Generated `fh_hearth` has `to: 'freehold'` plus siblings (`galaxy.generated.js` 58–81).

Chart draws these as **undirected** pairs (`galaxychart.js` 135–154`). Pathfinding must still walk **listed** `gates[i].to` (directed as authored). Unknown `to` skipped: `SYSTEMS[gate.to]` falsy (`142–143`).

### 2.2 Hub routes (one-way)

Hubs on authored cores (`authored-systems.js`):

| System | `hub.routes` | Cite |
|---|---|---|
| `freehold` | `fh_hearth`, `fh_haven`, `fh_meridian`, `fx_bastion` | 37–38 |
| `veridian` | `vd_survey`, `vd_prospect`, `vd_canaan`, `gc_auction` | 67 |
| `redmarch` | `rl_toll`, `rl_reckoning`, `rl_cutter`, `blackstation` | 99 |
| `hollowreach` | `lastbeacon`, `uc_drift`, `uc_sorrow` | 131 |

`hush` / `verge` have **no** hub (`authored-systems.js` 161–204). Verge is a terminus: one gate back to `hush` (`204`).

Junction gameplay: hub assembly at `hub.position`; KeyG cycles `routes`; D emits `jumpRequested` with selected `to` (`gate.js` 35–36, 469–474, 499–507, 558–560). Arrival at a hub when `SYSTEMS[to].hub.routes` contains the origin: arrive at `hub.position`, not a ring (`jump.js` 50–52, 99–103).

Chart: dashed gold **hub → dest** (`galaxychart.js` 156–172`). Back-gate is already in the physical layer.

### 2.3 Chart coordinates

`system.chart` is `[x, y]` in a ~2000×1400 box (`galaxychart.js` 10–12; `authored-systems.js` 36). Generated rows also carry `chart` (`galaxy.generated.js` 12–15). Live skip is **missing/non-array** `chart`, not a separate flag.

### 2.4 Names / factions (untrusted for HTML)

`SYSTEMS[id].name` (e.g. `'Freehold Drift'`, `'Hearth'`) and `FACTIONS[id].name`. Chart already uses `textContent` / SVG attributes / `setAttribute`. `innerHTML` is forbidden on this overlay.

---

## 3. Jump ownership (do not teleport)

| Surface | Owner | Cite |
|---|---|---|
| Zone + `jumpRequested { to }` | `gate.js` | 535–560 |
| Consume request, charge, midpoint swap, `systemLoaded { to }` | `jump.js` | 33–53, 139–157 |
| `ctx.gate.jumping / progress / destination` | `jump.js` | `ctx.js` 159–161; `jump.js` 70–76, 160–166 |
| `ctx.world.currentSystem` write on jump | `jump.js` midpoint | 91–92 |
| Unknown dest | `beginJump` no-op | `jump.js` 70–71 |
| Lock drop | `ctx.targets.current = null` at midpoint | `jump.js` 85–87 |
| Autosave on jump | `save.js` if `JUMP.saveOnJump` | `state.js` 547; `save.js` 1499–1515 |

`JUMP` (`state.js` 542–548): `zone` 60, `chargeTime` 2.5, `arrivalOffset` 50, `graceSeconds` 5, `saveOnJump` true.

**KeyD** is `ctx.input.dockPressed` (`controls.js` 268–270, 353; `ctx.js` 85). Gate jumps only when `inZone && dockPressed` (`gate.js` 558–560`). Route advance must **not** key off that edge. It keys off **successful** `systemLoaded`.

Same-frame: `jump.js` inits **after** `gate.js` (`main.js` 82–83, 105, 114) and consumes `ctx.events` in `update` (`jump.js` 139–148`).

---

## 4. Save / sanitize

**File:** `src/game/save.js`

```
WORLD_FIELDS = [
  time, credits, fear, reputation, currentSystem, markets,
  recordBanks, records, incidents, aftermath, prices,
  activeEvent, milestones, jobs, scanner, shipName,
  jumpGraceUntil, contacts, mystery,
  epics, origin, onboarding, aceRivalry, originArc,
  concealedMounts, miningLaser, hangar,
  launcher, missileAmmo, turret, fieldOre
]
```

Cite: `75–98`. **No `nav`. No `route`.**

| Helper | Live | Cite |
|---|---|---|
| `SAFE_ID` | `/^[a-z0-9_]+$/i` | 101 |
| `ID_MAX` | 64 | 103 |
| `RESERVED_IDS` | `__proto__`, `prototype`, `constructor`, … | 106–110 |
| Snapshot | copy defined `WORLD_FIELDS` only | 948–953 |
| Restore | assign defined fields; **omit → delete** hangar / fieldOre / jobs | 1156–1168 |
| Unknown `currentSystem` | `'freehold'` | 1169–1171 |
| Cross-system restore | emit `systemLoaded { to }` | 1207–1208 |
| Autosave key | `rimward-save-v1` (unchanged; do not add a second key) | file header / `hasAutosave` |

`SAFE_ID` **matches** `__proto__`. Reserved-id checks are mandatory (`105`, `198`, `233`). System ids in the catalog use `[a-z0-9_]` (authored + generated). Hyphen job ids are a **jobs** exception (`236–245`); NAV ids must **not** copy that exception.

There is **no** `sanitizeNav` today.

---

## 5. ctx / events / flags

**File:** `src/core/ctx.js`

| Slot | Today | Cite |
|---|---|---|
| `world.currentSystem` | `'freehold'` at boot | 130 |
| `world.nav` | absent | 125–149 |
| `gate.*` | zone + jump scalars | 153–161 |
| `targets.current` | live ship **or** asteroid / lockKind wrapper | 168–172 |
| `flags.docked / paused` | station / pause | 175–178 |
| `flags.chartOpen` | **absent** (NAV-01 proposes session flag) | 175–183 |
| `input.dockPressed` | D edge | 85 |
| `input.reticleLockPressed` | V edge | 88 |
| `input.fireHeld` | LMB | 81 |
| `emit` | `push({ type, t, ...data })` — **spreads** `data` | 231–232 |

Frozen comment already lists `'jumpRequested' {to}` and `'systemLoaded' {to}` (`207`). **No `nav*` type.** Any new type must be listed on this comment in the impl wave.

---

## 6. HUD (do not steal rails)

**File:** `src/systems/hud.js`  
**CSS:** `src/ui/hud.css`

| Surface | Today | Cite |
|---|---|---|
| DOM factory | `el()` → `textContent`, never `innerHTML` | `hud.js` 226–231 |
| Toasts | `commLine` → `.rw-toasts` `aria-live=polite` | 723–731, 468–472 |
| Arrival banner | `systemLoaded` → system **name** + faction | 734–739, 1032–1044 |
| Jump bar | `ctx.gate.progress` | 741–745, 1051+ |
| Prompt | Dock D / Jump D / hub G cycle | 1750–1764 |
| Chart marks | **Landmark** diamonds from `mystery.charted` / `visited`. Pointer-inert, `aria-hidden` | 704–721, 1409–1510 |
| Combat rails / KeyV lock | HUD-01 / HUD-02 / TGT | `targets.current` consumers |

Galaxy overlay CSS lives in `hud.css` 1421–1623 (`.rw-galaxy-*`). Colorblind / contrast / reduced-motion already override the chart (`1599–1623`).

**NAV-01 must not read `mystery.charted` / clue ids in `galaxychart.js`.** HUD landmark marks stay HUD-only. NAV-02 (sibling) owns in-flight next-gate HUD. NAV-01 remaining-hop copy lives on the **map** plus optional `commLine`.

---

## 7. Controls / lock / station digits

| Binding | Owner | Cite |
|---|---|---|
| KeyV reticle lock | `controls.js` `TRACKED` + `tryReticleLock` | 37–44, 277–278 |
| KeyT cycle | `cycleTarget` | 53–80, 262–263 |
| Digit 1–4 weapon groups | `TRACKED` | 41, 289–301 |
| Digit 0–9 dock overlay | `station.js` while `ui.open` | 5703–5717; Digit 0 = shipyard (`5712–5714`) |
| KeyG hub cycle | `gate.js` (not `TRACKED`) | `gate.js` 501–507 |
| KeyM chart | `galaxychart.js` (not `TRACKED`) | `galaxychart.js` 240–247; help line `controls.js` 340 |
| LMB fire | window `mousedown` | `controls.js` 314–316 |

`TRACKED` does **not** include `KeyM`, `KeyG`, `Escape`, `Digit0`, `Digit5–9`. Chart must keep it that way. Plotting must **not** assign `ctx.targets.current` and must **not** reuse `reticleLockPressed`.

Jump already clears lock (`jump.js` 85–87`). `controls.js` also drops `lockKind` refs on `systemLoaded` (`369–375`).

---

## 8. CSS classes already taken (plot must not collide)

| Class | Meaning today |
|---|---|
| `.rw-galaxy-route` | One-way **hub** gold dash |
| `.rw-galaxy-routes` | Layer group for hub lines |
| `.rw-galaxy-gate` | Physical two-way stroke |
| `.rw-galaxy-node.is-current` | Current system outline |
| `.rw-galaxy-current-marker` | Current dashed accent ring |

Proposed plot classes (brief / CSS later): `.rw-galaxy-plot`, `.rw-galaxy-plot-node`, `.is-dest`, `.is-hop`, `.is-unreachable`, `.rw-galaxy-plot-status`, `.rw-galaxy-clear`. **Not** this wave.

---

## 9. Mystery / §25 (chart must not touch)

`authored-systems.js` 21–24: landmarks vs clues. `mystery.js` owns discovery. HUD chart marks read `ctx.world.mystery` (`hud.js` 1415–1423`). Galaxy chart comment still forbids clue ids/text and landmark discovery (`galaxychart.js` 14–19`). NAV-01 keeps that fence.

---

## 10. Init / pause

`main.js` 98–127: `initJump` before traffic; `initGalaxyChart` after onboarding; `initHud` last.  
Paused: `if (!ctx.flags.paused)` skips **all** `system.update` (`140–142`) **except** the renderer. Chart `update` therefore does not run while paused; KeyM listener is on `window` and can still close.

---

## 11. Gaps NAV-01 must freeze

1. No player plot record, no `WORLD_FIELDS` key, no sanitize.
2. No click / keyboard activate on nodes (`NODE_R` 8 is a small hit disc).
3. No unreachable-vs-far feedback.
4. No remaining-hop label.
5. LMB fire will collide with chart clicks unless the impl wave gates fire or stops pointer bubble.
6. `.rw-galaxy-route` name is already hub-owned.
7. Pathfinding must union `gates[].to` **and** `hub.routes` (one-way). Chart undirected-dedupe is **display**, not the graph.
8. Route advance = `systemLoaded`, not KeyD / `jumpRequested`.
9. Restore must not engage autopilot (NAV-03). No such flag exists yet.

---

## 12. Sibling boundaries (do not implement here)

| Id | Owner | NAV-01 |
|---|---|---|
| NAV-02 | In-flight next-gate HUD | Consume `world.nav` later; do not add HUD gate arrows in this brief’s impl PRs beyond map + `commLine` |
| NAV-03 | Autopilot | Must not auto-engage on restore; omit `autopilot` from NAV-01 sanitize |
