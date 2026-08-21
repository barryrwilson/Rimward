# NAV-01 plotted route shared contract

**Wave:** 84. Design only. No NAV-01 feature ships in this wave.  
**Status:** MERGE LAW for the integrator brief. If `docs/Nav01RouteDesign.md` and this file ever disagree, **this file wins**.  
**Not this wave:** any edit under `src/`, `scripts/`, `public/`, `index.html`, `package.json`. Do not edit `docs/PLAYER-EXPERIENCE-WISHLIST.md`, `PROGRESS.md`, `docs/Nav02GuidanceDesign.md`, `docs/Nav03AutopilotDesign.md`, `out/w84/nav02/**`, or `out/w84/nav03/**`.  
**Locked sources:** wishlist Initiative NAV NAV-01; live inventory `out/w84/nav01/current-nav-inventory.md` (code wins); `src/systems/galaxychart.js`; `src/game/jump.js`; `src/systems/gate.js`; `src/game/save.js`; `src/core/ctx.js`; `src/systems/hud.js`; `src/systems/controls.js`; `src/game/state.js` (READ-ONLY); HUD-01 / HUD-02 / TGT lock closed.

Integrator rule: a **later** implementation wave obeys this file. Inventory cites live code. Code wins over stale comments.

---

## 0. Orchestrator merge law (do not weaken)

1. Wave 84 is markdown only. Implementation is a later **serial** wave. Do not schedule or land these PRs in `src/` in this wave.
2. `src/game/state.js` stays READ-ONLY (brief may read SYSTEMS/JUMP/FACTIONS; impl must not add NAV tables there unless inventory proves it is the only legal home — default is **no** `state.js` write).
3. Persist: **one** proposed `WORLD_FIELDS` key if inventory finds none. Proposed name **`nav`**. JSON-plain. NAV-01 **owns the record shape**. NAV-02/03 consume the same record and may propose extra fields on `world.nav` — they must **not** invent a second WORLD_FIELDS key. Live `WORLD_FIELDS` today (`src/game/save.js` 75–98) has **no** `nav` / `route`.
4. Chart: KeyM stays toggle (suppressed while docked/paused except close). Escape closes. Chart must not pause gameplay and must not call preventDefault/stopPropagation (wave 21 law in `galaxychart.js`).
5. Plotting a route must **not** set `ctx.targets.current` and must **not** steal KeyV / KeyT lock. HUD-01/HUD-02/TGT lock stay closed.
6. Digit 0–9 stay. Do not steal station overlay digits.
7. `innerHTML` forbidden. `textContent` / SVG attributes / `h()` only. System names from `SYSTEMS[id].name` are untrusted for HTML.
8. Galaxy chart must **never** read clue ids/text or landmark discovery (wave 21 law).
9. Pathfinding must use live graph: `SYSTEMS[id].gates[].to` (two-way physical) **and** one-way hub routes (`from.hub.routes`). Uncharted systems (no `chart` array) are not clickable. Unknown dest ids fail closed.
10. Jump ownership stays `jump.js` / `gate.js`. Route advance on successful `systemLoaded`, not on KeyD intent. Do not teleport.
11. Save restore: plotted **manual** route restores. Flying autopilot resume is NAV-03; NAV-01 must not auto-engage autopilot on restore.
12. Do not invent UU, standing deltas, BIO gift/pirate seed, police leave, Unknowables dock, BIO-04, power ledger, living frigate buy, aim-glass gauge.
13. Do not edit sibling files: `docs/Nav02GuidanceDesign.md`, `docs/Nav03AutopilotDesign.md`, `out/w84/nav02/**`, `out/w84/nav03/**`.
14. Prototype keys (`__proto__`, constructor, …) must never become dest / path ids. Reuse `SAFE_ID` / reserved-id discipline from `save.js`.
15. New `ctx.emit` types, if any, must be listed for a later `ctx.js` freeze comment. Payload must be primitives / ids, not live meshes. Do not smash `type` via object spread of untrusted blobs.

---

## 1. Persist record (`world.nav`) — NAV-01 owns the shape

### 1.1 Key

- `WORLD_FIELDS` gains **one** string: `'nav'`.
- No second key (`route`, `autopilot`, `guidance`).
- Autosave stays `rimward-save-v1`.
- JSON-plain object only. No functions, no meshes, no `THREE` objects, no `targets.current`.

### 1.2 Shape (allowlist)

```
world.nav = {
  dest: string,          // SYSTEMS key
  path: string[],        // origin-first, dest-last, unique consecutive hops
  remaining: number,     // integer hops left = path.length - 1 when plotted
  status: string         // allowlist below
}
```

| Field | Type | Rule |
|---|---|---|
| `dest` | string | `SAFE_ID`, length 1..`ID_MAX` (64), not `RESERVED_IDS`, `Object.hasOwn(SYSTEMS, dest)` |
| `path` | array of strings | Each id same rule as `dest`. Length 1..`N_SYSTEMS`. No prototype index holes. Consecutive duplicates drop the record |
| `remaining` | finite integer | `0 <= remaining <= N_SYSTEMS`. Truncate. Non-finite → drop record |
| `status` | string | **`idle` is not stored.** Allowlist: `'plotted'` \| `'blocked'` \| `'arrived'` |

**Idle:** omit `ctx.world.nav` (undefined). Snapshot copies only defined `WORLD_FIELDS` values (`save.js` 953). Restore **omitted `nav` → `delete ctx.world.nav`** (hangar/jobs precedent `save.js` 1163–1168). Do not keep a live plot across a legacy snapshot.

### 1.3 Status meanings

| Status | Path | Remaining | Player meaning |
|---|---|---|---|
| *(omit)* | — | — | No route |
| `plotted` | `path[0] === currentSystem`, `path[last] === dest`, length ≥ 2 | `path.length - 1` | Valid route |
| `blocked` | `[]` | `0` | Dest known; **no** path from here (or dest uncharted / unknown at plot time failed closed) |
| `arrived` | `[currentSystem]` and `dest === currentSystem` | `0` | Player is in dest |

`recalc` is an **event**, not a persist status. After a successful off-path `systemLoaded`, either write `plotted` (new BFS) or `blocked`.

### 1.4 Sibling fields

NAV-02 / NAV-03 may later add fields on **this same object**. They must not add `WORLD_FIELDS` keys.

NAV-01 sanitize **allowlist** (Wave 84 freeze): `dest`, `path`, `remaining`, `status` only.

- Unknown keys: **drop**.
- If a later sibling lands first and writes `autopilot`: NAV-01 sanitize still **drops** it until NAV-03’s serial extends the allowlist. Fail-closed: NAV-01 restore never leaves `autopilot.engaged === true`.
- NAV-01 must not invent `autopilot`, UU, or HUD guidance fields.

**Forbidden on this bag (never allowlist, never persist):** `hopIndex`, `cursor`, `next`, `active`, `recalc` as a stored status, a second hop cursor of any name. Recalc is `navRoute` / `commLine` only.

### 1.4.1 Sibling consume table (NAV-02 / NAV-03 MUST)

NAV-01 owns the record. Siblings **consume**; they do not redefine the cursor or the status enum. If a sibling brief and this table conflict, **this table wins**.

| Read | Rule |
|---|---|
| `dest` | Plotted / blocked / arrived destination id |
| `path` | Origin-first, dest-last. `path[0]` is **current** when `status === 'plotted'` (sanitize slices) |
| `remaining` | **Required** on the blob when the bag exists. Coherent: `remaining === path.length - 1` for `plotted`. Do **not** strip this field. Do **not** derive a parallel stored counter |
| `status` | **Only** `'plotted'` \| `'blocked'` \| `'arrived'`. Idle = bag omitted |

| Next hop | Rule |
|---|---|
| When | `status === 'plotted'` and `path.length >= 2` |
| Id | **`path[1]`** |
| Else | No next hop (`blocked` / `arrived` / omit) |

| Sibling must **not** | Why |
|---|---|
| Persist `hopIndex` or any second cursor | NAV-01 cursor is the sliced `path` (`path[0]` = here, `path[1]` = next). A stored index drifts after slice/recalc |
| Persist `status: 'active'` / `'recalc'` / `'broken'` | NAV-01 healer **deletes** the bag if status is outside `{ plotted, blocked, arrived }` |
| Treat recalc as a stored status | Off-path jump writes `plotted` or `blocked` and emits `navRoute` |
| Add a second `WORLD_FIELDS` key | Law 3 |
| Map `remaining` as forbidden | Remaining is owned and required |

Name map (docs only — **do not write the left column**):

| Sibling draft word | Persist / consume |
|---|---|
| `active` | `'plotted'` |
| `broken` | `'blocked'` |
| `recalc` | event, not a field |
| `arrived` | `'arrived'` |
| `hopIndex` | **do not store**; next = `path[1]` |
| HUD hops | read `remaining` (or `path.length - 1` when plotted — same if coherent) |

Unknown keys still **drop** until a sibling **serial** extends the allowlist. `autopilot` may be added later on this same object (NAV-03). `hopIndex` must **never** join the allowlist.

### 1.5 Sanitize (`sanitizeNav`)

Call on snapshot (before copy) and restore (after `WORLD_FIELDS` assign + `currentSystem` heal).

1. If `world.nav` is null / non-object / array → `delete world.nav`.
2. Read only `Object.hasOwn` fields. Never `for…in`. Drop `hopIndex` / `cursor` / `next` if present (unknown keys). Do **not** copy them into the healed bag.
3. `dest = sanitizeSystemId(raw.dest)` else delete bag.
4. `status` must be in `{ plotted, blocked, arrived }` else delete bag (`active` / `recalc` / `broken` **fail closed** — delete).
5. `path`: if not array → delete bag. Map each entry through `sanitizeSystemId`; any failure → delete bag. Cap `N_SYSTEMS`. Reject if any reserved / proto id.
6. `remaining = Math.trunc(n)`; require finite; clamp `0..N_SYSTEMS`.
7. Coherence:
   - `plotted`: `path.length >= 2`, `path[path.length-1] === dest`, `path[0] === ctx.world.currentSystem`, `remaining === path.length - 1`. If current is **on** the path but not at `[0]`, **slice** from the first `currentSystem` match (restore mid-route). If current is not on the path: **do not BFS inside sanitize**. Keep `dest`, set `path []`, `remaining 0`, `status 'blocked'` (first `nav` update recalculates).
   - `blocked`: force `path []`, `remaining 0`, dest still valid.
   - `arrived`: `dest === currentSystem`, `path = [dest]`, `remaining 0`.
8. Drop the bag if dest equals a reserved id even when `SAFE_ID` matches (`__proto__`).

`sanitizeSystemId(value)`:

- typeof string, non-empty, length ≤ `ID_MAX`
- reject if `RESERVED_IDS.has(value)` or `RESERVED_IDS.has(value.toLowerCase())` or `value === '__proto__'`
- `SAFE_ID.test(value)` (`save.js` 101 — **matches** `__proto__`; reserved check is mandatory)
- `Object.hasOwn(SYSTEMS, value)` — unknown dest **fail closed** (no keep)

`RESERVED_IDS` in `save.js` 106–110 is **not exported**. `controls.js` `reservedToken` is a **short** list (`__proto__` / `constructor` / `prototype` only) and is **not** enough. Fail-closed: `nav.js` **duplicates** the full `save.js` set (live pattern: `hangar.js` 28+) **or** PR1 exports `reservedId` from `save.js`. Do not invent a third shorter set.

Do not `SAFE_ID.test` a hyphenated invented route id. System ids are catalog keys.

### 1.6 Writers / readers

| Actor | Write `world.nav`? | Notes |
|---|---|---|
| Proposed `src/game/nav.js` | **Yes** (only gameplay writer) | Plot, clear, recalc on `systemLoaded` |
| `save.js` | Heal only | `sanitizeNav`; omit-delete |
| `galaxychart.js` | No bag writes | Calls nav helpers; paints |
| `jump.js` / `gate.js` | **No** | Stay jump owners |
| `hud.js` | **No** | NAV-02 may read later |
| `state.js` | **No** | READ-ONLY |

---

## 2. Graph and pathfinding

### 2.1 Neighbors of `id`

Build directed edges:

1. For each `g` in `SYSTEMS[id].gates` (array else skip): if `sanitizeSystemId(g.to)` → edge `id → to`.
2. If `SYSTEMS[id].hub && Array.isArray(hub.routes)`: for each `r` in `routes`, if `sanitizeSystemId(r)` → edge `id → r` (one-way).

Do **not** invent reverse hub edges. Physical reverse exists only if the dest record lists a gate `to` back (live data does).

Uncharted (`!Array.isArray(SYSTEMS[id].chart)`):

- **Not clickable** on the map.
- May exist as a **transit** node if a listed gate points there (fail-closed default: still walk them; cannot be a click dest). If a click dest is uncharted → treat as unknown (no plot).

### 2.2 Search

Unweighted BFS from `ctx.world.currentSystem` to `dest`. Hop cost = 1 per edge. No fuel, no UU, no standing, no band penalty.

- Same id: **not** a plot. See §3.4 clear.
- No path: **unreachable** (distinct from far).
- Path exists at any length ≤ `N_SYSTEMS`: **plot**. Do **not** invent a “too far” refuse cap.

Path stored origin-first, dest-last, no cycles (BFS). `remaining = path.length - 1`.

### 2.3 Next hop (for NAV-02; NAV-01 does not HUD it)

If `status === 'plotted'` and `path.length >= 2`, next system id = **`path[1]`**. NAV-02 matches that id against current `gates[].to` or `hub.routes`. NAV-01 does **not** persist a gate index (hub KeyG selection can change). NAV-01 does **not** persist `hopIndex`. See §1.4.1.

---

## 3. Chart interaction

### 3.1 Keys (closed)

Wave 21 law, restated:

- KeyM toggle. Open only if `!ctx.flags.docked && !ctx.flags.paused`. Close always allowed (docked/paused/open).
- Escape closes.
- Chart does **not** set `ctx.flags.paused`.
- Chart keydown listener must **not** call `preventDefault` or `stopPropagation`.
- Digit 0–9 untouched. KeyV / KeyT untouched. KeyG untouched.

Pointer: orchestrator law 4 forbids **any** `preventDefault` / `stopPropagation` on the chart module (keydown **and** pointer). Fire suppression lives in `controls.js`. See §3.3.

### 3.2 Plot verb

**Click** (or equivalent activation) on a **charted** node:

1. Read `data-system-id` from the node **this module created**. Do not parse free text.
2. `id = sanitizeSystemId(...)`. Fail → ignore (no plot, no event smash).
3. If `id === currentSystem` → **clear** (§3.4). Fail-closed default; owner Q1.
4. Else BFS.
   - Path found → write `{ dest: id, path, remaining, status: 'plotted' }`. Replace any previous route. Emit `navRoute`.
   - No path → do **not** write a plotted path. Session-highlight that node as `.is-unreachable` (not persist-required). Emit `navRoute` with `status: 'blocked'` and `dest: id`, `hops: 0`. Optional: persist `{ dest: id, path: [], remaining: 0, status: 'blocked' }` so the dest stays marked after close (**default: persist blocked dest**). Owner Q2.

Distant + reachable: always plot; show remaining hops on the map.

### 3.3 Pointer vs guns

Law 4: `galaxychart.js` must **not** call `preventDefault` or `stopPropagation` on any listener (keys or pointer).

While the chart is open, LMB must **not** publish `fireHeld`. Fail-closed:

- `galaxychart.js` owns **`ctx.flags.chartOpen`** (boolean, session-only, not `WORLD_FIELDS`). Set true/false in `setOpen`. Default false. Not persisted.
- `controls.js` ignores button-0 down / does not set `fireHeld` when `ctx.flags.chartOpen` is true.
- Do **not** sniff the DOM class from combat code as the only gate; the flag is the contract.

Do not use KeyV. Do not assign `ctx.targets.current`.

While `chartOpen`, `fireHeld` is **false every frame** (held LMB from before KeyM must not keep firing). Still no `stopPropagation`.

### 3.3.1 Hit disc and paint order (PR3 freeze)

Live `NODE_R = 8` is **chart units**, not CSS pixels (`galaxychart.js` 35). The SVG `viewBox` is the data bbox + `MARGIN` 80 (~2000×1400; `galaxychart.js` 10–12, 33–34, 71–75, 127–132). The panel is `min(1100px, 92vw)` × `min(760px, 88vh)` (`hud.css` 1446–1447). Scale is ~0.3 CSS px per chart unit on a typical window, so `r = 16` chart units is ~10 CSS px — below a 24 CSS px floor.

PR3 **must** freeze all of:

1. **Hit floor:** diameter ≥ **24 CSS px** (compute chart-unit radius from the live viewBox × CSS size at open / resize). If adjacent catalog nodes overlap at that size, **topmost hit disc wins**; overlap is still a plot, never “no plot”. Do not grow **painted** `NODE_R` (stays 8).
2. **Fill:** the hit `circle` uses a painted fill (`fill="transparent"` or `fill-opacity="0"`) **or** `pointer-events: all`. Never `fill: none` as the only hit surface (`visiblePainted` would then miss the disc).
3. **`pointer-events: none`:** `.rw-galaxy-hub-ring`, `.rw-galaxy-current-marker`, labels, and plot strokes. Hub rings (`HUB_RING_R = 15`, `galaxychart.js` 194–198; `hud.css` 1530–1536) are **not** none today — PR3 must set them none so they cannot steal `data-system-id`.
4. **Paint order (bottom → top):** physical gates → hub routes → **plot overlay** (`.rw-galaxy-plot`, above hub gold and hub rings’ gold dashes) → painted nodes (`NODE_R` 8) + hub rings → **hit discs** (receive the click) → labels → current marker.
5. Hit disc is SVG-only. No second catalog. `data-system-id` lives on the hit disc (and may stay on the painted node). Click handler reads the hit disc.
6. No chart `preventDefault` / `stopPropagation`.

Nodes receive the click. Hub rings do not.

### 3.4 Clear / replace

- **Replace:** successful plot of a different dest overwrites the bag.
- **Clear:** header `Clear route` `<button type="button">` (tab order with Close). Also: click current node (Q1 default).
- Clear → `delete ctx.world.nav`. Emit `navRoute` `{ dest: '', hops: 0, status: 'idle' }`.
- Player may clear while flying, docked (chart is closed when docked — clear must also be possible **next time the map opens**, and via the same helper NAV-02/03 may call). Fail-closed: **map Clear button** is the NAV-01 control. A later HUD cancel is NAV-03. NAV-01 helper `clearRoute(ctx)` is public for siblings.

### 3.5 Paint (map only)

When `world.nav` is plotted:

- Highlight dest node (`.is-dest`) — shape + stroke, not fill-only.
- Highlight every hop node in `path` (`.is-hop`).
- Stroke every consecutive pair on a **new** layer `.rw-galaxy-plot` (solid, not gold dash). **Forbidden:** reuse `.rw-galaxy-route`.
- Status line `.rw-galaxy-plot-status` `textContent`: dest **name** + remaining hops (`N jumps` / `1 jump`). Names via `SYSTEMS[id].name` then `textContent`.
- Current marker stays the live current system (already `.rw-galaxy-current-marker`).

Blocked: dest outline `.is-unreachable` + status text that is **not** a hop count (`No route from here.`). Distinct from a large hop number.

Arrived: dest = current; status `Arrived · <name>`; no plot strokes.

Do not rebuild the whole SVG on the hot path. Rebuild or retarget the **plot layer** only when `nav` / `currentSystem` identity changes.

Uncharted nodes: never created today; keep it that way. If a transit id has no `nodesById` entry, skip that node highlight; still stroke between charted endpoints when both ends exist. Do not read mystery to “fill in” a hole.

### 3.6 Chart must not read mystery

No `ctx.world.mystery`. No clue ids/text. No landmark discovery. HUD `.rw-chartmark` stays unrelated.

---

## 4. Recalc on jump

### 4.1 Trigger

Listen for `systemLoaded` (same frame `ctx.events` if the nav module inits after `jump.js`, else `lastEvents` next frame). **Do not** listen for `jumpRequested`. **Do not** listen for `dockPressed`.

If no `world.nav` or status idle-omit: no-op.

### 4.2 Algorithm

Let `here = event.to` if `sanitizeSystemId(event.to)` else `ctx.world.currentSystem` (already swapped in `jump.js` before emit).

- If `here === dest` → `status 'arrived'`, `path [here]`, `remaining 0`. Emit `navRoute`.
- Else BFS `here → dest`.
  - Path → `status 'plotted'`, rewrite path/remaining. Emit `navRoute` (hops may change; this is the “recalc” report).
  - No path → `status 'blocked'`, `path []`, `remaining 0`, **keep dest**. Emit `navRoute` `{ dest, hops: 0, status: 'blocked' }`. Player-facing: `commLine` static text (not built from raw ids if a display name exists).

Do not teleport. Do not emit `jumpRequested`. Do not change `ctx.gate.*`.

Off-route physical jump is a normal jump; only the bag recalculates.

---

## 5. Events

### 5.1 New frozen type (impl wave lists it on `ctx.js`)

`'navRoute' { dest, hops, status }`

| Field | Rule |
|---|---|
| `dest` | System id string, or `''` when cleared. Never omit in a way that spreads leftover `type`. Always a primitive string |
| `hops` | Finite integer ≥ 0 |
| `status` | `'idle'` \| `'plotted'` \| `'blocked'` \| `'arrived'` |

Writer passes a **fresh literal** `{ dest, hops, status }`. Do **not** `emit('navRoute', world.nav)` (would spread `path` and any sibling keys; `path` is an array; a stuffed `type` would smash the queue because `emit` does `{ type, t, ...data }` — `ctx.js` 231–232).

### 5.2 `commLine`

Also emit `commLine` `{ text, from: 'Echo' }` with **static** templates:

| Case | Default text (fail-closed; owner may retune copy) |
|---|---|
| Plot | `'Route plotted: N jumps to <name>.'` |
| Replace | same as plot |
| Clear | `'Route cleared.'` |
| Recalc plotted | `'Route updated: N jumps to <name>.'` |
| Blocked (click or recalc) | `'No route to <name> from here.'` |
| Arrived | `'Arrived at <name>.'` |

`<name>` = `SYSTEMS[dest].name` via `textContent`/string concat, control-char stripped if copied from save. Do not concatenate clue lines. Do not invent UU.

Reuse toast rail (`hud.js` commLine). No new HUD glance row in NAV-01.

### 5.3 Audio

No new `song.js` cue required. `commLine` already plays. Do not add HUD-03 checkboxes.

---

## 6. HUD / lock / digits (closed)

- Do not set `ctx.targets.current`.
- Do not call `tryReticleLock` / `cycleTarget`.
- Do not change HUD-01 rails, MATCH, lead, RANGE, contacts, chart marks.
- NAV-02 owns in-flight next-gate marker. NAV-01 map status + `commLine` is enough while the map is closed (player re-opens KeyM). Owner Q3 default: **no** NAV-01 HUD hop strip.
- Digit 0 shipyard. Digits 1–9 station services. Weapon 1–4 stay.
- `state.js` READ-ONLY. No new `U.*`. No new `JUMP.*`.
- `ctx.flags.chartOpen` is session-only. `galaxychart.js` writes it. Not a `WORLD_FIELDS` key.

---

## 7. Security

- `innerHTML` forbidden on chart, status, toasts, buttons.
- SVG: `createElementNS` + `setAttribute` + `textContent`. Never assign untrusted strings as **attribute names**. `svgEl` today uses `Object.entries(attrs)` (`galaxychart.js` 52–55`) — impl must pass **literal** attr maps, not save blobs.
- Prototype dest/path ids fail closed (§1.5).
- `ctx.emit` payloads are fresh literals (§5.1).
- No secrets. No new `localStorage` key.
- System names untrusted for HTML; OK as `textContent`.

---

## 8. Ownership (later impl)

| Module | Owns |
|---|---|
| `src/game/nav.js` (**new**, not `state.js`) | Graph BFS, `sanitizeNav` export, `plotRoute`, `clearRoute`, `recalcOnLoad`, `world.nav` writes, `navRoute` emit |
| `save.js` | `'nav'` on `WORLD_FIELDS`; call `sanitizeNav`; omit-delete |
| `galaxychart.js` | Click, paint plot layer, Clear button, status `textContent`, KeyM/Escape unchanged, **`ctx.flags.chartOpen`** |
| `jump.js` / `gate.js` | Unchanged jump sequence |
| `controls.js` | `fireHeld` suppress while `chartOpen`; no KeyV change |
| `hud.js` | No NAV-01 layout. Toasts already show `commLine` |
| `ctx.js` | Freeze-comment `'navRoute'`; session `flags.chartOpen`; no live `world.nav` default (omit) |
| `ui/hud.css` | Proposed `.rw-galaxy-plot*` only in the impl wave |

Init: `initNav` after `initJump`, before or with `initGalaxyChart`, so it can see same-frame `systemLoaded`.

Same-system restore emits **no** `systemLoaded` (`save.js` 1207–1208). `sanitizeNav` must **slice** a plotted path so `path[0] === currentSystem` when current is on the path. `initNav` also runs one `recalcIfNeeded` on first update so a dest-only `blocked` bag (or an off-path current) BFS without waiting for a jump.

---

## 9. Serial PR plan (later wave — named only)

Do **not** land these in Wave 84.

1. **PR1** `sanitizeNav` + `WORLD_FIELDS 'nav'` + omit-delete + boot pins (no UI).
2. **PR2** `nav.js` BFS pins: physical two-way + hub one-way; proto/unknown fail closed; uncharted not clickable.
3. **PR3** Chart click + plot layer + hops + unreachable vs far + Clear/replace. `ctx.flags.chartOpen` + `controls.js` LMB ignore (`fireHeld` false every frame while open). Hit disc ≥ 24 CSS px, filled, hub rings `pointer-events: none`, plot overlay above hub rings, hit discs on top. No chart `stopPropagation`. No lock steal. No `innerHTML`.
4. **PR4** `systemLoaded` recalc + `commLine` + `navRoute` freeze comment.
5. **PR5** Save roundtrip pins; restore does not engage autopilot; no teleport.

---

## 10. Non-goals (locked)

- No Wave 84 `src/` edits.
- No NAV-02 HUD arrows / off-screen gate pip.
- No NAV-03 Autopilot button, steering, or resume-on-load.
- No teleport / skip `JUMP.chargeTime`.
- No `state.js` neighbor tables.
- No clue/landmark on the galaxy chart.
- No standing / UU / BIO / power / aim-glass inventions.
- No persist `hopIndex`. Next hop is `path[1]`.

---

## 11. Fail-closed owner defaults (until owner answers)

See brief “Open owner questions”. Defaults **in this contract**:

| Q | Default |
|---|---|
| Click current system | **Clear** route |
| Persist blocked dest after failed recalc | **Yes** (`status: 'blocked'`, keep `dest`) |
| In-flight HUD hop strip in NAV-01 | **No** (map + `commLine`; NAV-02) |
| Keyboard node picker (arrows) | **No** (would fight WASD; chart does not pause). Click + Clear button + `aria-live` status |
| Hop refuse cap | **None** |
| Hit radius | Diameter ≥ **24 CSS px** (chart-unit radius from live viewBox). Paint stays `NODE_R` 8. Hub rings `pointer-events: none`. See §3.3.1 |
