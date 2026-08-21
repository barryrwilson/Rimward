# NAV-02 in-flight next-gate guidance shared contract

**Wave:** 84. Design only. No NAV-02 feature ships in this wave.  
**Status:** MERGE LAW for the integrator brief. If `docs/Nav02GuidanceDesign.md` and this file ever disagree, **this file wins**.  
**Not this wave:** any edit under `src/`, `scripts/`, `public/`, `index.html`, `package.json`. Do not edit `docs/PLAYER-EXPERIENCE-WISHLIST.md`, `PROGRESS.md`, `docs/Nav01RouteDesign.md`, `docs/Nav03AutopilotDesign.md`, `out/w84/nav01/**`, `out/w84/nav03/**`, `docs/HudUtilityChangeProposal.md`, `docs/Hud02IdentitiesDesign.md`, `docs/Tgt05LockCatsDesign.md`, `docs/Tgt05ReticleLockDesign.md`.  
**Locked sources:** wishlist Initiative NAV NAV-02 (`docs/PLAYER-EXPERIENCE-WISHLIST.md` 730–740); live inventory `out/w84/nav02/current-nav-guidance-inventory.md` (code wins); NAV-01 persist shape `out/w84/nav01/shared-contract.md` §1.2–§1.3 / §2.3 / §4–§5 (code+that file win over this family’s older hopIndex draft); HUD-01 closed; TGT-03 contacts arc closed as scanner ships; TGT-05 gate lock already ships; `src/game/state.js` READ-ONLY.

Integrator rule: a **later** implementation wave obeys this file. Inventory cites live code. Code wins over stale comments.

Sibling Wave 84 workers own NAV-01 (plot persist + chart) and NAV-03 (autopilot). This file **consumes NAV-01 exactly**. It does **not** invent plot UI, pathfinding, hopIndex, or autopilot steering.

---

## 0. Orchestrator merge law (do not weaken)

1. Wave 84 is markdown only. No `src/` this wave.
2. `state.js` READ-ONLY.
3. Persist: consume **`world.nav`** owned by NAV-01. You may **propose extra fields on the same record**. Do **not** add a second WORLD_FIELDS key. Live save has no `nav` today (`src/game/save.js` 75–98).
4. Do **not** set `ctx.targets.current` from a route. KeyV/KeyT/MATCH/mining/hail/combat stay closed. HUD-01/HUD-02 stay closed. Guidance is **not** a lock.
5. Off-screen indicator must **not** be the TGT-03 scanner bearing arc (that arc is scanner-gated, friend/foe ships). Invent a distinct class / cue. Do not reopen HUD-01 hub occupancy.
6. Toasts/banner stay off the aim column (HUD-01). Prefer a small persistent readout that does not cover ship, target, lead, or projectile path.
7. `innerHTML` forbidden. Untrusted system names → `textContent`.
8. Digit 0–9 stay. KeyM stays chart. Do not steal KeyT/KeyV/KeyX.
9. Advance only on `systemLoaded` (jump.js midpoint), not on `jumpRequested`.
10. In-world marker must not be a pickable combat body (must not steal KeyV cone/disc). Decorative geometry must not become `lockKind`.
11. Jump zone / dock zone stay verbs, not pick discs.
12. Do not invent UU, standing, BIO gift/pirate, police leave, Unknowables dock, BIO-04, power ledger, living frigate, aim-glass.
13. Do not edit `docs/Nav01RouteDesign.md`, `docs/Nav03AutopilotDesign.md`, `out/w84/nav01/**`, `out/w84/nav03/**`.
14. New events: primitives/ids only; list for later `ctx.js` freeze. No live mesh in payload.
15. Chart must still never show clues/landmarks.

---

## 1. Law in one page (integrator freeze)

1. Wave 84 is markdown only for this family. Implementation is a later **serial** wave **after** the NAV-01 persist PR. Do not land guidance PRs before `world.nav` exists and sanitizes.
2. **Consume** `ctx.world.nav` **exactly** as NAV-01 owns it (`out/w84/nav01/shared-contract.md` §1.2). Do **not** add `world.guidance`, `world.routeHud`, `hopIndex`, or any second `WORLD_FIELDS` name. Autosave stays `rimward-save-v1`.
3. NAV-01 shape (allowlist, unknown keys **drop**): `{ dest, path, remaining, status }`. `status` ∈ `{ 'plotted', 'blocked', 'arrived' }`. Idle = **omit** the bag. NAV-02 **never writes** this object. Session HUD memory (last `path[1]`, transient `REROUTE`) is live-only and must not ride save.
4. This slice **proposes no extra persist fields**. NAV-01 sanitize drops unknown keys. A `hopIndex` / `nextTo` / `recalc` status would vanish on restore and must not be required to show guidance.
5. Next hop: if `status === 'plotted'` and `path.length >= 2` and `Object.hasOwn(SYSTEMS, path[1])`, **`nextTo = path[1]`**. `path[0]` is current. Display **`remaining`** from the bag (NAV-01: `path.length - 1`). Never persist `nextTo`. Never invent `hopIndex`.
6. HUD copy map (persist tokens only):
   - omit bag → hide chrome
   - `plotted` → show `SYSTEMS[path[1]].name`, dest name, bag `remaining`, distance
   - `blocked` → `NO ROUTE` (distinct from a large hop count / “far”)
   - `arrived` → hide marker/cue; optional `ARRIVED` then hide
   Recalc is **not** a stored status. Transient `REROUTE` is a HUD reaction to `systemLoaded` then the **new** bag (and/or `'navRoute'`), not a persist enum.
7. Guidance identity is **`nav-gate`**, not `lockKind`. Never assign `ctx.targets.current` from plot, marker, chevron, or readout.
8. Off-screen cue class is **`.rw-nav-gate-cue`**. Not `.rw-edge-arrow`, not `.rw-contact-pip`, not `.rw-chartmark`, not the contacts SVG.
9. In-world marker: decorative only. `raycast = empty`. No `lockKind`. Not in `ctx.ships`. Not an asteroid list row. Pick stays authored bore 30 (`reticle-aim.js` 19, 172–203).
10. Readout: persistent, `textContent`, pointer-events none, off aim glass / rails / lead / prompt / contacts / jump bar. Place in `.rw-side-col` **above POS**. Cap width + ellipsis (§7). Dim with `.rw-aux` in combat. Hide while docked and while `gate.jumping` **in the first chrome PR**.
11. Advance: re-read after **`systemLoaded`**. Do not mutate the bag on `jumpRequested`. NAV-01 recalc writes `plotted` or `blocked` and emits `'navRoute'`. HUD follows §8.
12. `innerHTML` forbidden. Names = `stripHudText` + `Object.hasOwn(SYSTEMS, id)` then `SYSTEMS[id].name`. Fallback `'—'`.
13. `state.js` READ-ONLY. No new `U.*`, no new `JUMP.*`. Zone 60 and dock 45 stay verbs.
14. Keys: Digit 0–9, KeyM, KeyT, KeyV, KeyX, KeyG **untouched**. Do not auto-snap hub `routeIndex` to the plot. Marker still sits on the **physical** routed assembly.
15. New frozen types this slice: **none**. Consume live `'systemLoaded' { to }` and NAV-01 `'navRoute' { dest, hops, status }` (primitives/ids). Do not emit `'navGuidance'`. Never spread assemblies, groups, `world.nav`, or `targets.current`.
16. Chart: NAV-02 does not add clue/landmark layers. Flight HUD must work with the chart **closed**.
17. `reducedMotion`: no seizure pulses. Static ring + static chevron **in the first chrome that draws them**.
18. Prototype keys fail closed. Walk `Object.hasOwn` / index `for`. Reject reserved tokens on every system id.

---

## 2. Persist (consume NAV-01 `world.nav` exactly)

### 2.1 Owner

NAV-01 adds `'nav'` to `WORLD_FIELDS` and `sanitizeNav` (`out/w84/nav01/shared-contract.md` §1). Live inventory has neither (`save.js` 75–98, 1107–1109).

NAV-02 call sites **read** `ctx.world.nav` after that healer. Do not add a second walker. Do not write the bag.

### 2.2 Record shape (NAV-01 §1.2 — copy, do not fork)

```
world.nav = {
  dest: string,          // SYSTEMS key
  path: string[],        // origin-first, dest-last
  remaining: number,     // hops left = path.length - 1 when plotted
  status: string         // 'plotted' | 'blocked' | 'arrived'
}
```

| Field | Type | Writer | NAV-02 |
|---|---|---|---|
| `dest` | `SYSTEMS` key | NAV-01 | Dest name |
| `path` | array of `SYSTEMS` keys | NAV-01 | Next hop = **`path[1]`** when plotted |
| `remaining` | finite int | NAV-01 | `JUMPS` line. Do **not** re-derive from a cursor |
| `status` | `'plotted' \| 'blocked' \| 'arrived'` | NAV-01 | HUD map §2.3 |

Idle: **omit** `ctx.world.nav`. Restore omitted `nav` → hide.

**Forbidden on the blob (NAV-01 drops unknown keys):** `hopIndex`, `nextTo`, `recalc`, `broken`, `active`, `gateIndex`, `position`, `mesh`, `lockKind`, HTML, clue ids, landmark ids.

**No extra persist field this slice.** Session-only HUD fields stay on the HUD module.

### 2.3 HUD map (persist tokens)

| `world.nav` | Marker + cue | Readout |
|---|---|---|
| omitted / non-object | hide | hide |
| `status === 'plotted'` and `path.length >= 2` and `Object.hasOwn(SYSTEMS, path[1])` | mark gate for `path[1]` | `NEXT` = `SYSTEMS[path[1]].name`; `DEST` = `SYSTEMS[dest].name`; `JUMPS` = bag `remaining`; `GATE` = distance |
| `plotted` but `path[1]` missing / not a `SYSTEMS` key | hide marker/cue | hide or dest-only fail-closed (do not invent a hop) |
| `status === 'blocked'` | hide marker/cue | `DEST` name if allowlisted + **`NO ROUTE`**. Not a hop count. Distinct from far. |
| `status === 'arrived'` | hide marker/cue | `ARRIVED` then hide after one throttle write |
| unknown `status` | hide | hide (NAV-01 deletes the bag; if a live blob leaks, fail closed) |

`remaining` display: use the bag integer if `Number.isFinite` and `>= 0`. Else hide the `JUMPS` digits (do not compute `path.length - hopIndex`; there is no hopIndex).

### 2.4 Recalc is an event, not a persist status

NAV-01 after off-path `systemLoaded`: write `'plotted'` (new BFS) or `'blocked'`; emit `'navRoute' { dest, hops, status }` (`out/w84/nav01/shared-contract.md` §4–§5). **Never** persist `'recalc'`.

NAV-02 transient `REROUTE` (readout status row only):

1. Remember last shown `path[1]` (session; not saved).
2. On `'systemLoaded'` and/or `'navRoute'`, re-read the bag.
3. If new bag is `'plotted'` and new `path[1]` **differs** from last shown next (same dest, still reachable) → show `REROUTE` until the live child’s next+dest+remaining text is unchanged for **one** 5 Hz tick.
4. If new bag is `'blocked'` → `NO ROUTE` (persist status; stays until NAV-01 plots or clears).
5. If new bag is `'arrived'` or omitted → §2.3.
6. Do **not** write `status` / `path` / `remaining`. Do **not** `commLine` a second hop toast (NAV-01 already toasts “Route updated” / “No route…”).

### 2.5 Smuggle / stuffed bag

Heal is NAV-01. NAV-02 must not “repair” the blob.

A stuffed `path[1]`, `dest`, or `remaining` must not:

- mark every gate
- write `targets.current`
- print HTML / raw proto ids
- skip the player visually to dest while `status` is still `'plotted'` in origin (if `path[0]` is not current, NAV-01 sanitize slices or blocks — HUD still requires `status==='plotted'` and allowlisted `path[1]`)

If `path[1]` fails `Object.hasOwn(SYSTEMS, …)` or reserved-token checks → hide marker/cue. If `status` is not in the allowlist → hide. Do not treat missing `hopIndex` as hide — **hopIndex does not exist**.

### 2.6 Restore

Re-read `ctx.world.nav` each HUD/marker update (same discipline as `hud.js` mystery 1409–1417). Same-system restore emits **no** `systemLoaded` (`save.js` 1207–1208). Guidance must not wait on an event to show after load. NAV-01 sanitize slices so `path[0] === currentSystem` when current is on the path.

---

## 3. Next-gate resolution (live, authored positions)

Do **not** walk `gate.js` `assemblies` (private, `gate.js` 429).

`nextTo` is **`path[1]`** only when §2.3 `plotted` holds.

1. If `SYSTEMS[current].gates[i].to === nextTo` (allowlisted) → mark that **physical** gate at `gates[i].position`.
2. Else if `hub` exists and `hub.routes.indexOf(nextTo) >= 0` → mark **hub** at `hub.position`.
3. Else → no in-world marker this system (readout still shows names if `plotted`; off-screen cue hidden).

Only **one** marker. Other gates stay unmarked. Prefer the physical matching `to` over the hub if both exist.

Distance = player `ship.object.position` to that authored point. Finite u. Same k-abbreviation as chart marks (`hud.js` 1507–1509) for the readout.

---

## 4. Not a lock

| Actor | Must |
|---|---|
| Plot (NAV-01) | Must not assign `targets.current` |
| NAV-02 HUD / marker | Must not assign `targets.current` |
| KeyV on the routed gate | May lock the gate as today (`lockKind:'gate'`). Guidance **stays**. Two identities. |
| KeyT / KeyV / MATCH / mining / hail / combat | Unchanged. Gate lock still fails closed on MATCH/hail/seeker as TGT-05. |
| Jump midpoint | Still nulls `targets.current` (`jump.js` 85–87`). Must **not** null `world.nav`. |
| Locking a ship/rock/station | Must **not** clear `world.nav` |

HUD: lock chrome = bracket + **amber** `.rw-edge-arrow`. Nav chrome = **`.rw-nav-gate-cue`** + in-world ring + readout. They may show **together**.

Do not reuse `reticleLock`. Do not emit `reticleLock` from guidance.

---

## 5. Off-screen cue (distinct from TGT-03)

| Forbidden reuse | Why |
|---|---|
| `.rw-contacts` / contact pips | Scanner-gated, friend/foe **ships**, bottom occupancy (HUD-01 Wave F) |
| `.rw-edge-arrow` | Off-screen **lock** (amber) |
| `.rw-chartmark` | Landmarks / mystery. Combat fade 0.14. §25 |
| Reticle-centered ring | HUD-01: no contacts ring on the hub |

**Required:** new pooled DOM node `.rw-nav-gate-cue` under `#hud`.

- One slot. Created once (`hud.js` performance contract).
- Glyph: **gate chevron** (two parallel ticks + a notch), not a solid amber triangle, not a landmark diamond, not a hostile chevron pip.
- Color family: beacon cyan / wake — **shape carries meaning** (`hud.css` 4). High-contrast + colorblind tokens (`--rw-accent`).
- Project authored next-gate position with the same behind-camera flip as the lock arrow (`hud.js` 1141–1142, 1182–1196).
- Freeze: **hide edge cue when on-screen**; 3D marker is the on-glass find-aid.
- Off-screen / behind: clamp to `EDGE_MARGIN` 84 (or the lock-arrow inset math). Rotate the chevron toward the gate. Optional ~12 px inside the lock arrow if both sit in one quadrant.
- `pointer-events: none`. `aria-hidden="true"` (readout is the named instrument).
- Hide: omit bag, `blocked`, `arrived`, docked, jumping, no resolvable gate position.
- `reducedMotion`: no CSS pulse / blink / `@keyframes`. Transform rotate+translate only. **First cue PR**, not a later polish PR.

Do **not** add a pip onto the contacts SVG.

---

## 6. In-world marker

- One `THREE.Group` named `nav-gate-marker` (or reuse a single parked group).
- Visual: thin torus / ring **outside** the bore, scale ≤ glow rest (do not out-bloom 96). Additive optional; **no** strobe.
- Parent: scene or a nav-owned group. **Do not** stamp `lockKind` on assemblies. **Do not** `Object.assign` onto `SYSTEMS` rows.
- `traverse` set `raycast` to empty function. Not a `ctx.ships` member. Not pick-wrapped.
- Position = authored gate/hub point (§3). `visible` only when §3 finds a match (`plotted` + resolvable gate).
- Rebuild/hide on `systemLoaded` / `'navRoute'` and when `path[1]` changes. Dispose materials only if uniquely created (prefer one shared material).
- `reducedMotion`: no scale pulse, no spin. Static ring **in the first 3D PR**. Read `ctx.settings.reducedMotion` (world-space is not under `body.rw-reduced-motion #hud`).
- Must not change `JUMP.zone` or KeyV bore 30.

---

## 7. Readout (HUD)

Lines (all `textContent`, 5 Hz write-on-change):

1. `NEXT` + `path[1]` **name** (`plotted` only)
2. `DEST` + dest **name**
3. `GATE` + integer distance + `u` (or `k` past 1000) (`plotted` + resolvable gate)
4. `JUMPS` + bag `remaining` (`plotted` only)
5. Status word only when needed: transient `REROUTE` / persist `NO ROUTE` / `ARRIVED`

Placement freeze: `#hud .rw-nav-readout` inside `.rw-side-col` **above** `.rw-pos` (`hud.js` 878–881; `hud.css` 830–840). Bottom-right career cluster. Does **not** sit at `top:57%` rails, center hub, `bottom:20%` prompt, or contacts `bottom:5.5%`.

**Width freeze (first chrome PR, not a later pin):** slim instrument, not a Bio-sized panel.

- `min-width: 0`; **`max-width: 180px`** (POS-like; must not grow into `.rw-combat-target` at `textScale` 1.5)
- Name values: `white-space: nowrap; overflow: hidden; text-overflow: ellipsis`
- Type: `calc(10px * var(--rw-text-scale, 1))` to `calc(11px * var(--rw-text-scale, 1))`
- Do not `nowrap` the whole panel without a cap
- Prefer `hud.css` (no third W2 injected sheet)

Other:

- `pointer-events: none`
- Named instrument: `role="status"`. Put **next / dest / remaining / status** in an `aria-live="polite"` child. Distance sits **outside** that child. Do not `aria-atomic` the whole panel.
- **Hide when `ctx.flags.docked` or `ctx.gate.jumping` in PR1** (same pattern as contacts `hud.js` 1259 and chart marks `hud.js` 1420). Do not wait for a later PR.
- Combat: class `.rw-aux` (opacity 0.38), **not** `.rw-fade`
- Do **not** push this copy through `commLine`
- Arrival banner stays the system-name sting

---

## 8. Advance and wrong-gate HUD

| Event | NAV-02 |
|---|---|
| `jumpRequested` | **No** bag write. Hide chrome while `jumping` |
| `systemLoaded` | Re-read `world.nav` after NAV-01 recalc. Rebind. Transient `REROUTE` per §2.4 |
| `'navRoute' { dest, hops, status }` | Same rebind. Primitives only. Do not spread the bag |
| Restore, no `systemLoaded` | Re-read each frame |
| Wrong gate, dest still reachable | NAV-01 writes `'plotted'` + new `path` (`path[1]` is the new next). HUD: new NEXT + transient `REROUTE` |
| Wrong gate, unreachable | NAV-01 writes `'blocked'`, `path []`, `remaining 0`, **keep dest**. HUD: `NO ROUTE` + dest name |
| Arrive dest | NAV-01 `'arrived'`. Hide marker/cue. `ARRIVED` then hide |
| Clear / omit | hide |

Do not toast `REROUTE` / `NO ROUTE` from NAV-02. Persistent readout is this family’s report. NAV-01 `commLine` may already sting.

---

## 9. Events (later `ctx.js` freeze)

**Required new types from NAV-02: none.**

**Consume:**

| Type | Payload | Owner |
|---|---|---|
| `'systemLoaded'` | `{ to }` system id | live `jump.js` 123 |
| `'navRoute'` | `{ dest, hops, status }` primitives; `status` `'idle'\|'plotted'\|'blocked'\|'arrived'` | NAV-01 §5.1 |

Do **not** invent `'navGuidance'`. Do **not** `ctx.emit('navRoute', world.nav)`. Do **not** emit meshes.

Song: existing `systemLoaded` / `jumpRequested` cues stay (`song.js` 81–82). No new HUD-02 family tick.

---

## 10. XSS / proto / emit

- `textContent` only. Reuse `stripHudText` (`hud.js` 356–365`).
- `Object.hasOwn(SYSTEMS, id)` before `SYSTEMS[id].name`.
- Reject reserved tokens (`save.js` 106–110; `hud.js` `reservedToken` 346–348). `path[1]` and `dest` both.
- No `for…in` on the save blob.
- `ctx.emit` literals only if this family ever emits (default: never). No spread of assemblies.

---

## 11. Keys and HUD-01/02

- Digit 0–9: dock + weapons. Digit 0 = shipyard (`station.js` 174, 5710–5714).
- KeyM = chart (`galaxychart.js` 242–247).
- KeyT / KeyV / KeyX closed.
- KeyG still cycles hub destination independently of the plot.
- HUD-01 glance path unchanged. HUD-02 `#hud[data-family]` skins may restyle `.rw-nav-readout` / `.rw-nav-gate-cue` **without** moving them.

---

## 12. Non-goals (locked)

- No autopilot (NAV-03).
- No chart plot UI (NAV-01).
- No `hopIndex`. No persist `'recalc'` / `'broken'` / `'active'`.
- No `state.js` writes. No new `U.*`.
- No UU, standing, BIO gift/pirate, police leave, Unknowables dock, BIO-04, power ledger, living frigate, aim-glass.
- No scanner-arc gate pip. No lock steal. No innerHTML. No second persist key.
- Chart never shows clues/landmarks.

---

## 13. Serial PR plan (later wave, after NAV-01 persist)

| PR | Scope | Depends |
|---|---|---|
| **NAV-01 persist** | `'nav'` on `WORLD_FIELDS`, sanitize `{ dest, path, remaining, status }`, plot, `systemLoaded` recalc, `'navRoute'` | — |
| **NAV-02 PR1** | Readout DOM + **capped** CSS + ellipsis + `textContent` from **NAV-01 tokens**. Hide docked/jumping. `.rw-aux`. No 3D. No lock writes. No `hopIndex`. | NAV-01 persist |
| **NAV-02 PR2** | `.rw-nav-gate-cue` off-screen projection. Distinct class. **No `@keyframes`.** Hide docked/jumping. | PR1 |
| **NAV-02 PR3** | In-world decorative ring. Empty raycast. Static under `reducedMotion`. Hide non-routed gates. | PR1 |
| **NAV-02 PR4** | `systemLoaded` / `'navRoute'` rebind; transient `REROUTE`; `blocked`/`arrived` copy; restore without event | PR1–3 |
| **NAV-02 PR5** | Boot pins / screenshots (`textScale` 1.5, 1280×720). **Not** the first time hide/motion/width exist. | PR4 |

Do not merge PR2–5 before PR1. Do not merge PR1 before NAV-01 persist. Do not defer hide, `reducedMotion` static, or max-width to PR5.

---

## 14. Acceptance (design freeze)

1. Active `nav` with `status==='plotted'`: flight HUD names `path[1]` + dest + bag `remaining` + distance to the routed gate.
2. Off-screen chevron finds the routed gate when it is behind the camera.
3. In-world marker on the **routed** gate only; other gates stay unmarked.
4. Locking a ship/rock/station does not clear the route; route does not replace the lock.
5. Indicator rebinds after jump completes (`systemLoaded`); NAV-01 recalc writes `plotted` or `blocked`; HUD maps §2.3–§2.4 (`REROUTE` transient, `NO ROUTE` on `blocked`).
6. `reducedMotion`: no seizure pulses; static marker ok. Hide docked/jumping from PR1.
7. Legal NAV-01 persist **without** `hopIndex` still shows guidance.
