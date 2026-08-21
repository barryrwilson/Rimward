# NAV-03 full-route autopilot shared contract

**Wave:** 84. Design only. No autopilot feature ships in this wave.  
**Status:** MERGE LAW for the integrator brief. If `docs/Nav03AutopilotDesign.md` and this file ever disagree, **this file wins**.  
**Not this wave:** any edit under `src/`, `scripts/`, `public/`, `index.html`, `package.json`. Do not edit `docs/PLAYER-EXPERIENCE-WISHLIST.md`, `PROGRESS.md`, `docs/Nav01RouteDesign.md`, `docs/Nav02GuidanceDesign.md`, `out/w84/nav01/**`, `out/w84/nav02/**`.  
**Locked sources:** wishlist Initiative NAV NAV-03; live inventory `out/w84/nav03/current-nav-autopilot-inventory.md` (code wins); `src/systems/ship.js`; `src/systems/controls.js`; `src/game/jump.js`; `src/systems/gate.js`; `src/systems/npc.js` (read); `src/systems/galaxychart.js`; `src/systems/hud.js`; `src/core/ctx.js`; `src/game/save.js`; `src/game/state.js` (READ-ONLY); `src/game/physics.js`.

Integrator rule: a **later** implementation wave obeys this file. Inventory cites live code. Code wins over stale comments.

---

## 0. Orchestrator merge law (do not weaken)

1. Wave 84 markdown only. No `src/`.
2. `state.js` READ-ONLY.
3. Persist: consume **`world.nav`** (NAV-01 owns shape). Extra autopilot fields go on **the same record**. No second WORLD_FIELDS key.
4. **Fail-closed save restore (default, mark as owner-confirm):** restore of a plotted route does **not** auto-resume flying autopilot. Return manual control. Persist `autopilot: false` after restore (or omit flying flag). Document the alternative as needs-owner if you disagree, but default is no auto-resume.
5. Autopilot must **never teleport**, skip `jump.js` charge, skip gate zone, or emit `jumpRequested` unless `ctx.gate.inZone` for the **routed** dest (same as player D). Hub junction route selection must use existing `nearRouteIndex` / hub law — do not invent a second jump path.
6. Autopilot is **not** immunity. Combat, sun heat, collisions, hail, and world events still apply. Interrupt (disengage, keep route) on: player steer/throttle/strafe/afterburner input, cancel control, `flags.combat` rising, hull warn/crit, sunHeat, bodyHit above a documented threshold, missing routed gate, dock overlay, pause/origin overlay.
7. TGT-02 law: `ship.js` does not write `ctx.input.throttle` for MATCH. Autopilot must name a **single writer** for steer/throttle while engaged (propose `ship.js` or a new `src/game/autopilot.js` owned module). Do not fight MATCH: if MATCH is on, either refuse engage or cancel MATCH with a visible reason. Default: **refuse engage while MATCH** (fail closed).
8. PHY-02 NPC avoid is lookahead bias, not full path planning. Autopilot may **reuse** the same avoid helpers; do not promise full path planning this feature. Collision remains the safety net. Do not fly into the sun core.
9. Must not set `ctx.targets.current`. Must not steal KeyV. HUD-01/02 closed.
10. Chart Autopilot control: only while chart is open **or** a small in-flight cancel that does not occupy the 80 px hub. `innerHTML` forbidden. Digit 0–9 stay. KeyM stays.
11. Do not invent UU, standing, BIO gift/pirate, police leave, Unknowables dock, BIO-04, power ledger, living frigate, aim-glass.
12. Do not edit `docs/Nav01RouteDesign.md`, `docs/Nav02GuidanceDesign.md`, `out/w84/nav01/**`, `out/w84/nav02/**`.
13. Events: primitives/ids; later `ctx.js` freeze. No mesh payloads.
14. NPC traffic ownership stays npc.js. Autopilot is **player only**.
15. Docked: cannot engage. Jumping: hold heading policy documented (usually no steer during jump).

---

## 1. Law in one page (integrator freeze)

1. Wave 84 is markdown only. Implementation is a later **serial** wave. Do not land these PRs in `src/` in this wave.
2. Consume `ctx.world.nav`. NAV-01 owns `{ dest, path, remaining, status }`. Next hop is **`path[1]`**. NAV-03 writes **only** `world.nav.autopilot` (boolean) plus a **live** `ctx.autopilot` command channel that does **not** persist.
3. No second `WORLD_FIELDS` key. Autosave stays `rimward-save-v1`.
4. Restore **never** resumes flying AP. Healer sets `world.nav.autopilot = false` (or deletes the flying key). **Owner-confirm default.** Alternative (resume flying) is **needs-owner** and is **out**.
5. Sole `jumpRequested` **emitter** stays `gate.js`. Payload `to` is always live `near.to`. AP may only set a one-frame `ctx.autopilot.wantJump`. Gate ORs that with `input.dockPressed` **after** `inZone` and **after** `near.to === NAV-01 next hop`.
6. No teleport. No `ship.object.position` write except the existing `jump.js` midpoint and collision slide. No skip of `JUMP.chargeTime` 2.5.
7. Single flight writer while engaged: **`ship.js`**. Command computer: **`src/game/autopilot.js`** (new). `autopilot.js` does not move the mesh. `ship.js` does not write `ctx.input.throttle` / `steer*`.
8. MATCH: **refuse engage** while `flags.matchSpeed`. Visible reason **on the chart** while the chart is open (header live region). Do not rely on `#hud` toasts (`z-index` 10) under `.rw-galaxy-chart` (`z-index` 30). Do not clear MATCH.
9. Cancel / qualifying manual input / listed hazards: `autopilot = false`, **keep** NAV-01 route.
10. Arrival: `ctx.world.currentSystem` equals NAV-01 dest after a completed jump (post-`systemLoaded`). Disengage. Do not add an in-system dest this feature.
11. Reuse PHY-02 lookahead bias (export or extract `applyAvoidBias`). No A\* this feature.
12. No `targets.current` write. No KeyV. No Digit steal. No KeyM steal. No `innerHTML`.
13. `state.js` READ-ONLY. No new `U.*`. AP numbers live in `autopilot.js` (or a later shared avoid module). Do not add `PHY` keys unless a later owner asks.
14. Prototype keys and unknown dest ids fail closed.

---

## 2. Persist

### 2.1 Record

NAV-01 adds `'nav'` to `WORLD_FIELDS` in its serial. NAV-03 **does not**. NAV-01 shape (do not rename here):

```
{ dest, path, remaining, status }
```

Next hop for AP approach / `nearTo` match is **`path[1]`**. Dest for arrival is `dest`. Do not invent a parallel hop index.

On that object, NAV-03 adds:

```
autopilot: boolean   // flying. Restore healer forces false.
```

Do **not** persist `wantJump`, steer cmd, mesh refs, or interrupt timers.

Omit-key restore: missing `autopilot` means **false** (do not keep a live true from a prior session). Same pattern as omitted `hangar` / `jobs` (`save.js` 1163–1168).

### 2.2 Restore healer (fail closed)

Call from the same `sanitizeRestored` (or NAV-01 `sanitizeNav`) walk:

1. If `world.nav` is missing / not a plain object / array → leave NAV-01 healer; do not create a flying flag.
2. Walk with `Object.keys`. Never `for…in`.
3. Fresh `{}` when copying. Never `Object.assign` a raw save object onto live `nav` without an allowlist.
4. Drop `__proto__`, `constructor`, `prototype`, and `RESERVED_IDS` (`save.js` 106–110).
5. **Always** write `autopilot: false` after a successful restore (even if the blob said `true`).
6. Dest / hop ids: NAV-01 allowlist. If `dest` is not `Object.hasOwn(SYSTEMS, id)`, AP must not engage (no dest). Next hop is `path[1]` when `Array.isArray(path) && path.length >= 2`.

**Owner-confirm:** no auto-resume. Do not “helpfully” re-engage because `autopilot` was true in the blob.

### 2.3 Snapshot

`snapshot()` already copies whatever sits on `WORLD_FIELDS`. After a restore, the next snapshot must see `autopilot: false` so a stuffed `true` cannot round-trip.

---

## 3. Live command channel

### 3.1 `ctx.autopilot` (not WORLD_FIELDS)

Later `ctx.js` freeze. Plain object, module-owned by `autopilot.js`:

```
{
  engaged: false,     // mirror of world.nav.autopilot for readers
  yaw: 0,             // -1..1, ship.js consumes while engaged
  pitch: 0,           // -1..1
  throttle: 0,        // 0..1 analog; ship.js applies locally — never copies onto ctx.input.throttle
  wantJump: false,    // latched like dockPressed: gate runs first and reads the previous publish
  cycleHub: false,    // same latch; gate.js applies KeyG law; clear when not engaged / not in hub zone
  reason: '',         // last interrupt token; HUD; not persist
}
```

Do not put live ships, meshes, or Vector3 on this object in events.

### 3.2 Single writer

| Channel | Writer | Reader |
|---|---|---|
| `ctx.input.*` | `controls.js` only | ship, gate, AP (cancel detect) |
| `ctx.autopilot.cmd` fields above | `autopilot.js` only | ship, gate, HUD, chart |
| `world.nav.autopilot` | `autopilot.js` (engage/disengage) + `save.js` healer (force false) | everyone |
| ship mesh / velocity | `ship.js` only (plus existing `jump.js` midpoint) | everyone |
| `jumpRequested` | **`gate.js` only** | `jump.js` |
| hub `routeIndex` / `to` | **`gate.js` only** (KeyG or `cycleHub`) | HUD |
| `flags.matchSpeed` | `ship.js` only | HUD, AP refuse |
| `flags.combat` | `npc.js` only | AP interrupt |
| `flags.docked` | `station.js` only | AP refuse |
| NPC AI | `npc.js` / `traffic.js` | AP does not write |

While `world.nav.autopilot === true`, `ship.js` applies `ctx.autopilot.yaw/pitch/throttle` instead of `input.steer*` / `input.throttle` for the **flight** step. It still **reads** input for the break table. It never writes `ctx.input`.

### 3.3 MATCH

- If `flags.matchSpeed` at engage click → **refuse**. Do not clear MATCH.
- Reporter while the chart is open: chart header live region (copy §8.3). Also emit `commLine` with the same English. `#hud` toasts are **not** the visible reporter while `flags.galaxyChart` (chart `z-index` 30 covers `#hud` `z-index` 10).
- While AP engaged, ignore `input.matchSpeedPressed` (do not turn MATCH on). KeyX is not an AP cancel.
- Do not write `ctx.input.throttle` to “win” MATCH.

### 3.4 Chart-open flag

Later `ctx.js` freeze. Writer: **`galaxychart.js` only**.

```
flags.galaxyChart: boolean   // true while the overlay is open; not persist
```

AP reads it for steer-break suppress and refuse surface. Do not put it on `world.nav`.

---

## 4. Jump and hub (no second path)

### 4.1 Approach

AP aims at the **routed** gate mesh for NAV-01 next hop (`world.nav.path[1]`):

- Two-way gate: assembly whose `to === nextHop`.
- Hub hop: the **hub** assembly when `hub.routes` contains `nextHop` (inventory `gate.js` 469–474). Do not fly a physical gate that does not list that dest.

If no such assembly exists after `systemLoaded` rebuild → interrupt `missingGate`. Keep route.

### 4.2 Hub law

Reuse live KeyG (`gate.js` 500–507):

- Only when `ctx.gate.inZone && ctx.gate.nearHub`.
- Apply `cycleHub` **inside `gate.update`** using the same modulo as the KeyG listener (`gate.js` 500–507). Do **not** dispatch a fake KeyG. The keydown listener stays for the player.
- `cycleHub` pulses until `ctx.gate.nearTo === nextHop` **or** a wrap count exceeds `nearRouteCount` (then `missingGate`).
- Do **not** assign `assembly.to` from `autopilot.js` / `ship.js`.
- Do **not** emit `jumpRequested` with a stuffed dest id from `world.nav`.

### 4.3 Jump emit (sole site)

Replace the live predicate in spirit (later PR; this wave does not edit `src/`):

```
inZone
&& !docked
&& !jumping
&& (dockPressed
    || (world.nav.autopilot && autopilot.wantJump && nearTo === nextHop))
→ emit('jumpRequested', { to: near.to })
```

`to` is **only** `near.to`. `beginJump` still ignores unknown `SYSTEMS[to]` (`jump.js` 71).

`wantJump` is published by `autopilot.js` (after gate in the same frame, like `controls.js` `dockPressed`). Gate sees it **next** frame. Stuck `wantJump` must still fail the `nearTo === nextHop` and `world.nav.autopilot` checks.

`wantJump` is true only when:

- AP engaged (`world.nav.autopilot`)
- `ctx.gate.inZone`
- `ctx.gate.nearTo ===` NAV-01 next hop
- not MATCH (already refused)
- not docked

Never skip `JUMP.zone`. Never skip `jump.js` charge. Never set `ctx.world.currentSystem` from AP.

### 4.4 Jumping hold

While `ctx.gate.jumping`:

- AP does **not** write yaw/pitch/throttle (all 0).
- `ship.js` does **not** apply player steer either for AP (hold last heading). Existing jump midpoint still zeros velocity and `lookAt(0,0,0)` (`jump.js` 116–119).
- `wantJump` / `cycleHub` false.
- Do **not** disengage solely because a jump started. **Cancel still disengages** during charge.

After `systemLoaded`, AP reacquires the new next hop from NAV-01. If `currentSystem === dest`, arrive (disengage).

---

## 5. Interrupt table (disengage, **keep route**)

Set `world.nav.autopilot = false`. Set `ctx.autopilot.reason`. Emit `'autopilotDisengaged' { reason }`. Do **not** clear NAV-01 dest/hops.

| Token | Trigger | Notes |
|---|---|---|
| `cancel` | Chart Cancel or in-flight Cancel control | Prominent; click + keyboard on the **button** (not a Digit) |
| `input` | Strafe (WASD), roll (QE), `throttleHeld` (R/F), `afterburnerPressed`, `driftHeld`, `fullStop` double-tap F, **or** (when armed) `hypot(steerX,steerY) ≥ AP_STEER_BREAK` (0.65) for one frame | Live reticle **always** writes steer (`controls.js` 7–11). **Ignore the steer arm while `flags.galaxyChart`** (header click leaves hypot ~1). After the chart closes, arm steer-break only after hypot stays **below** 0.65 for one frame. Chart UI clicks are not flight input. WASD / throttle / afterburner / drift still cancel while the chart is open. 0.65 lives in `autopilot.js`, not `state.js`. |
| `combat` | Rising edge `flags.combat` false → true | Writer `npc.js`. AP is not immunity. |
| `hull` | Player hull band **warn** or **crit** (`hullFrac ≤ 0.5`) | Live bands `hud.js` 1520. |
| `sun` | Event `sunHeat` or `sunKill` | Also refuse engage if already in heat. |
| `impact` | `bodyHit` with `kind !== 'player'` and `speed ≥ PHY.IMPACT_MIN_SPEED` (8) | Scrapes below 8 slide only (`physics.js` 12; `combat.js` 1689). |
| `missingGate` | No routed assembly; hub wrap failed; `nearTo` cannot match next hop | Keep route. Tell the player. |
| `blocked` | Distance to routed gate does not fall by 10 u in 20 s **and** avoid reported a hit this window | Bias, not planner. Do not silently push the sun/station. |
| `dock` | `flags.docked` **or** station overlay opening | Cannot engage docked. |
| `pause` | `flags.paused` **rising** (pause banner, origin pick, title, models browser) | The sim loop does **not** tick while paused (`main.js` 140–143), so `autopilot.update` cannot see the edge. Later impl: export `disengage(ctx, reason)` and call it from the pause listener / title / origins / models **when they set `paused = true`**. Do not resume flying on unpause. |
| `hail` | `'hailOpened'` | Hail stays live (`hail.js` 8–10) and uses Digit 1..n. Disengage so digits stay hail. |
| `arrive` | `currentSystem ===` NAV-01 dest after jump completes | Success. Control returns. |
| `restore` | Save restore healer | Silent; no flying. |

Fire (LMB), camera C, KeyT, KeyV, KeyM, weapon digits **do not** cancel.

Player **D** in a **gate** zone while AP is on is the jump verb (same as `wantJump`), not `input` cancel. Player **D** in a **station** zone is `dock`.

---

## 6. Engage gates (all must hold)

Refuse (no write, visible reason from §8.3) if any:

- no NAV-01 dest / empty `path`, or dest === `currentSystem` (already there)
- no `path[1]` when dest is in another system
- `flags.docked`
- `ctx.gate.jumping`
- `flags.paused`
- `flags.matchSpeed`
- `flags.combat`
- hull warn/crit
- title/models/origin overlay (paused)
- missing next-hop assembly

Engage sets `world.nav.autopilot = true` and emits `'autopilotEngaged' { dest }` where `dest` is the **NAV-01 dest system id string**.

---

## 7. Avoid / sun / traffic

1. Export or extract live `applyAvoidBias` (`npc.js` 590–638). Same `PHY.AVOID_LOOKAHEAD` 40 / `AVOID_GAIN` 1.4. Include sun body (`npc.js` 641–661).
2. AP is **player only**. Do not drive `ctx.ships`.
3. Do not promise corridor planning, traffic-light holds, or station-pad parking.
4. If the biased aim still lies inside `sunRadius * PHY.SUN_LETHAL_MULT`, interrupt `sun` **before** advancing. Collision slide remains the net (`ship.js` 842–875).
5. Do not disable `bodyHit` / sun DPS / hail / world events.

---

## 8. UI

### 8.1 Chart (open only)

- Real `<button type="button">` in the chart **header**. Wrap Autopilot + × in a header cluster (`display: flex; gap: 8px`). Copy `.rw-galaxy-close` hover / `:focus-visible`. Min height ~24 px at `--rw-text-scale: 1`.
- Always show **Autopilot** while the chart is open (hide only with `.rw-galaxy-chart.is-hidden`). Do not hide the control when dest is missing.
- Idle + dest: label **Autopilot**. Flying: **Cancel autopilot**. `textContent` and `aria-label` stay in sync.
- **Native `disabled`:** only when there is **no dest / no route** (`!dest` or `path` not an array with length ≥ 1). Nothing to refuse. `aria-label` may still say `Autopilot unavailable — plot a destination first.`
- **Refuse-worthy with a dest** (MATCH, docked, jumping, paused, combat, hull, dest === here, missing hop): **stay clickable**. `aria-disabled="true"`. No native `disabled`. Click intercept writes §8.3 English to the chart live region and emits `commLine`. Visual: `--dim` / opacity. Keep `:focus-visible`.
- Chart-local refuse surface (Blocker): a header status node, `role="status"`, `aria-live="polite"`, `id` for `aria-describedby` on the button. Lifetime 4 s (`TOAST_LIFETIME`). `textContent` only. This is the **visible** reporter while `flags.galaxyChart`. Do **not** rely on `#hud .rw-toast` (`style.css` 28 `z-index: 10` vs chart `hud.css` 1431 `z-index: 30`).
- Click does not steal KeyM, Escape, Digit 0–9, KeyV.
- Chart still does not `preventDefault` on flight keys globally (`galaxychart.js` 21–24).
- **Space vs afterburner:** on Autopilot / Cancel `keydown` **Space only**, `preventDefault()` so the focused button does **not** activate. Afterburner may still fire (and `input`-cancel if flying). Activate the control with **click** or **Enter** only. Do not bind Digit or KeyM.

### 8.2 In-flight chrome

- Small chip `.rw-autopilot`: dest **name** (`SYSTEMS[dest].name`), next hop name (`SYSTEMS[path[1]].name`), remaining jumps from NAV-01 `remaining`, Cancel button.
- **Pin CSS (later PR6):** `#hud .rw-autopilot { position: absolute; top: 14px; left: 50%; transform: translateX(-50%); }`. Empty band between CONTROLS (left) and toasts (`top: 14px; right: 168px`). **Not** `.rw-banner` (`top: 96px; right: 14px`). **Not** `.rw-jump` (center). **Not** `hud.js` 1077 hub. **Not** inside NAV-02 `.rw-nav-readout` (that readout hides while jumping).
- Chip root class `.rw-autopilot` only. No `.rw-fade`, `.rw-aux`, `.rw-chartmark`.
- `pointer-events: none` on the chip; `auto` on the button. Gate jump fade is already `pointer-events: none` (`gate.js` 486). Cancel still works **during** `gate.jumping` (`cancel` token).
- `textContent` / existing `el()` / `h()`. **No `innerHTML`.**
- Tokens: `--cyan`, `--dim`. Contrast: list `.rw-autopilot` beside `.rw-jump` under `body.rw-contrast`. No extra pulse (reduced-motion).
- Tab order: CONTROLS toggle, then chip Cancel when engaged. Helm (WASD / R F / Space) is the eyes-on-glass cancel. No new letter.
- Combat interrupt may land the same frame; Cancel must still be readable.

### 8.3 Player English (frozen)

Print these strings. Never print the token. Never print dest ids. Never print clue text. Chart-open refuse uses the header live region **plus** `commLine`. Chart-closed interrupt uses `commLine` + chip. Do **not** toast NAV-02 `NO ROUTE` onto the aim column.

| Token / refuse | Line |
|---|---|
| MATCH | `Autopilot refused — MATCH is on.` |
| no dest / no route | `Autopilot refused — plot a destination first.` (native `disabled`; `aria-label` may use this; no click required) |
| dest === current system | `Autopilot refused — already in the destination system.` |
| docked | `Autopilot refused — docked.` |
| jumping | `Autopilot refused — jump in progress.` |
| paused | `Autopilot refused — game paused.` |
| combat | `Autopilot refused — combat.` |
| hull | `Autopilot refused — hull warning.` |
| missing hop at engage | `Autopilot refused — next gate is missing.` |
| `cancel` | `Autopilot cancelled.` |
| `input` | `Autopilot cancelled — manual helm.` |
| `combat` (interrupt) | `Autopilot cancelled — combat.` |
| `hull` (interrupt) | `Autopilot cancelled — hull warning.` |
| `sun` | `Autopilot cancelled — star heat.` |
| `impact` | `Autopilot cancelled — collision.` |
| `missingGate` | `Autopilot cancelled — next gate is missing.` |
| `blocked` | `Autopilot cancelled — approach blocked.` |
| `dock` | `Autopilot cancelled — docking.` |
| `pause` | `Autopilot cancelled — paused.` |
| `hail` | `Autopilot cancelled — hail.` |
| `arrive` | `Arrived — autopilot off.` |
| `restore` | **Silent.** No `commLine`. |

---

## 9. Events (later ctx.js freeze)

New frozen types, primitives only:

```
'autopilotEngaged' { dest }       // dest = SYSTEMS key string
'autopilotDisengaged' { reason }  // reason = token from §5
```

No `ship`, no mesh, no Vector3, no route array on the payload (`emit` spreads `data`, `ctx.js` 230–231).

Reuse `'commLine'` for player-visible text. Do not add a third event.

---

## 10. Keys (closed)

| Key | Law |
|---|---|
| KeyM | Chart toggle. Untouched. |
| Digit 0–9 | Shipyard / jobs / hail / weapons. Untouched. |
| KeyV / KeyT | Lock / cycle. Untouched. AP must not write `targets.current`. |
| KeyD | Dock / jump. AP does not steal; gate predicate may OR `wantJump`. |
| KeyG | Hub cycle. AP pulses `cycleHub` through the **same** handler. |
| KeyX | MATCH. Refuse AP if on; ignore MATCH toggle while AP on. |
| New letter for AP | **No.** Click or **Enter** on the button. |
| Space on focused AP / Cancel | `preventDefault` on that button only so it does not activate. Afterburner may still fire. |

Gamepad: no live API. Out.

---

## 11. Serial PR plan (later, named only)

Do not implement in Wave 84.

1. **PR1** — Persist: `world.nav.autopilot` boolean + restore force-false (depends on NAV-01 `'nav'` key). Pins: stuffed `true` → false; proto dest dropped.
2. **PR2** — `ctx.autopilot` channel + `src/game/autopilot.js` stub + events listed in `ctx.js`. No motion.
3. **PR3** — `ship.js` consume cmd while engaged; MATCH refuse; input break table; **ignore steer-break while `flags.galaxyChart`**; no `input.throttle` write. Pins: MATCH throttle unchanged when refused.
4. **PR4** — Export/extract avoid bias; sun lethal abort; `blocked` timer.
5. **PR5** — `gate.js` `wantJump` / `cycleHub`; **no** dest stuffing; charge still 2.5 s. Pins: emit only when `inZone && near.to === hop`.
6. **PR6** — Chart button + header live region + in-flight top-center chip; HUD-01 hub empty; Digit/KeyM pins; steer-break suppress while `galaxyChart`; Space `preventDefault` on the buttons.

PR5 must not land before PR3 (or the ship will not aim at the gate). PR1 may land with NAV-01.

---

## 12. Tests (later impl; named)

- Multi-hop: Autopilot from a dest ≥2 jumps away; each `jumpRequested.to` equals live `near.to`; `gate.progress` visits (0,1).
- No teleport: player position never jumps except `jump.js` midpoint.
- Cancel / WASD: `autopilot === false` and NAV-01 dest **still set**.
- Restore blob `nav.autopilot: true` → flying false; route remains if NAV-01 restored it.
- MATCH on → engage no-op; `flags.matchSpeed` still true; `input.throttle` unchanged.
- Missing gate → `missingGate`; no emit.
- Hub: only KeyG law changes `routeIndex`.
- KeyV still locks; `targets.current` not written by AP.
- Digit 0 still shipyard when docked (cannot be flying).
- `innerHTML` still 0 on hud/chart.
- Chart open + MATCH: Autopilot click prints MATCH line on the **chart** live region (not only a hidden HUD toast).
- Chart header click after engage does **not** `input`-cancel via steer-break.
- Native `disabled` only when no dest; MATCH with dest still receives click.

---

## 13. Forbidden

- Second `WORLD_FIELDS` key or `localStorage` key.
- `ship.js` writing `ctx.input.throttle` / `steer*`.
- `autopilot.js` writing ship mesh or `currentSystem`.
- `jumpRequested` from stuffed dest / from AP module.
- Setting `targets.current`.
- Full path planner / traffic ownership.
- In-system dest (station/belt) this feature.
- Auto-resume after restore.
- `innerHTML`, Digit bind, KeyM bind, KeyV bind.
- Inventing UU, standing, BIO-04, living frigate, aim-glass, Unknowables dock, police leave, power ledger.
- Editing NAV-01 / NAV-02 files.

---

## 14. Open owner questions

1. **Restore auto-resume** — **Closed default:** no. Alternative needs-owner.
2. **`AP_STEER_BREAK` 0.65** — Freeze for impl; owner may retune without a `U.*` key.
3. **Hail interrupt** — Freeze **yes** (digits). Owner may drop later.
4. Pause **rising** disengage vs freeze-and-continue — Freeze **disengage** (`pause` token) so origin/title/models cannot leave a hidden flyer. Mid-flight **P** also drops AP and keeps route (player taps Autopilot again).
