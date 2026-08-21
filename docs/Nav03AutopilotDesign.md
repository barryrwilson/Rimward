# RIMWARD NAV-03 full-route autopilot

| Field | Value |
|---|---|
| **Title** | RIMWARD NAV-03 full-route autopilot |
| **Author** | Wave 84 NAV-03 integrator |
| **Date** | 2026-08-21 |
| **Status** | Wave 84 — design. Later — impl. |
| **Wave** | 84 — design. Later — impl. |
| **Owner request** | After a plotted dest, click Autopilot; the ship flies gates for real; cancel keeps the route; never silent-lethal; restore does not resume flying. |
| **Merge law** | [`out/w84/nav03/shared-contract.md`](../out/w84/nav03/shared-contract.md). If this brief and that file conflict, the contract wins. |

**Verifier record:**

| Note | Path |
|---|---|
| Inventory (code wins) | [`out/w84/nav03/current-nav-autopilot-inventory.md`](../out/w84/nav03/current-nav-autopilot-inventory.md) |
| Merge law | [`out/w84/nav03/shared-contract.md`](../out/w84/nav03/shared-contract.md) |
| Security review | [`out/w84/nav03/security-review.md`](../out/w84/nav03/security-review.md) |
| Design-doc review | [`out/w84/nav03/code-review.md`](../out/w84/nav03/code-review.md) |
| UI audit | [`out/w84/nav03/ui-audit.md`](../out/w84/nav03/ui-audit.md) |

NAV-01 owns plot persist + chart highlight. NAV-02 owns in-flight next-gate guidance. **Do not edit those files.** Live code wins over wishlist line numbers. There is no autopilot in `src/` today.

---

## Overview

Wishlist NAV-03 wants one **Autopilot** command that flies a multi-jump plotted route: steer to the routed gate, enter the zone, jump through `jump.js`, reacquire the next hop, repeat until the dest system. Live today the player must mouse-steer every meter and tap **D** in `JUMP.zone` 60. `gate.js` is the only `jumpRequested` emitter. PHY-02 NPC avoid is lookahead bias, not a planner.

Wave 84 freezes the writer split (`autopilot.js` command computer, `ship.js` mesh writer), fail-closed restore (no auto-resume), sole jump emit, MATCH refuse **on the chart**, interrupt table + English, chart/in-flight chrome, and the serial PR plan. This wave lands markdown only. Bindings do not change here.

HUD-01/02 stay closed. Digit 0–9 stay. KeyM stays. KeyV stays. `state.js` stays READ-ONLY. `world.nav` stays one record (NAV-01 `{ dest, path, remaining, status }` + `autopilot: false` on restore). Next hop is `path[1]`. Do not invent a second persist key. Do not teleport.

---

## Background & Motivation

### Current state (inventory)

Source of truth: [`out/w84/nav03/current-nav-autopilot-inventory.md`](../out/w84/nav03/current-nav-autopilot-inventory.md). Code wins over stale comments.

| Surface | Today | Cite |
|---|---|---|
| Persist | `WORLD_FIELDS` has **no** `nav` | `save.js` 75–98 |
| Input | `controls.js` only; reticle always steers | `ctx.js` 15–16; `controls.js` 7–11 |
| Flight | `ship.js` only; MATCH must not write `input.throttle` | `ctx.js` 32; `ship.js` 649–706 |
| Jump emit | `inZone && dockPressed` → `{ to: near.to }` | `gate.js` 558–560 |
| Jump run | charge 2.5 s; midpoint swap + `lookAt` | `jump.js` 70–123, 139–166; `state.js` 543–547 |
| Hub | KeyG cycles `routeIndex`; HUD G/D copy | `gate.js` 500–507; `hud.js` 1758–1761 |
| NPC avoid | `applyAvoidBias` **not exported**; lookahead 40 | `npc.js` 590–638; `physics.js` 19–20 |
| Chart | KeyM overlay; **no** Autopilot button; no node click | `galaxychart.js` 21–24, 240–250 |
| 80 px hub | reticle clamp 44 px | `hud.js` 1077 |
| Combat / hull | `flags.combat` npc.js; hull warn ≤0.5 | `npc.js` 2260; `hud.js` 1520 |
| Restore | copies `WORLD_FIELDS`; omitted keys deleted for hangar/jobs/fieldOre | `save.js` 1156–1168 |

There is no flying flag, no AP HUD, and no analog command except `ctx.input`.

### Pain points

- Wishlist NAV-03: dest is chosen, but the player still hand-flies every gate.
- A naive `currentSystem = dest` or `position.copy(gate)` is a teleport cheat.
- A naive `emit('jumpRequested', { to: dest })` skips zone and can stuff a proto id.
- Live MATCH must not fight AP on `input.throttle` (TGT-02).
- Live reticle **always** writes `steerX/Y`. Treating any non-zero steer as cancel would drop AP immediately. A chart **header** click leaves hypot ~1, so steer-break must ignore while the chart is open.
- `#hud` toasts sit at `z-index` 10. The chart overlay is `z-index` 30. MATCH refuse on `commLine` alone is invisible while Autopilot is clicked on the open chart.
- Restore of `autopilot: true` would grab the stick after load.
- PHY-02 is bias. Promising collision-free travel is a lie; collision is the net.
- Chart Autopilot in the 80 px hub would fight the reticle (HUD-01). `.rw-banner` is **top-right**, not top-center.

### Why now (design) / why not now (code)

The owner asked for the NAV-03 integrator brief in the same wave as NAV-01/NAV-02 markdown. Inventory and merge law exist. Implementation waits so jump emit, restore, MATCH, and the writer split land against a frozen contract instead of a drive-by `ship.js` autopilot.

---

## Goals & Non-Goals

### Goals

1. Document live flight, gate/jump, hub law, PHY-02 avoid, chart, HUD hub, save, MATCH from **live code**.
2. Freeze one Autopilot command that flies NAV-01 hops through **real** zone + `jump.js`.
3. Freeze cancel / manual break: control back, **route kept**.
4. Freeze interrupt table: never silent-continue into sun, combat, missing gate, hull warn/crit, hard impact, overlays.
5. Freeze restore: **no auto-resume** (`autopilot: false`). Owner-confirm default.
6. Freeze writer: `src/game/autopilot.js` + `ship.js` mesh; `gate.js` sole jump emitter.
7. Freeze MATCH **refuse engage**. Freeze no lock steal.
8. Freeze UI: chart button while open; small in-flight cancel **off** the 80 px hub; `textContent`; Digit 0–9; KeyM.
9. Freeze a serial PR plan. This wave writes the brief. A later wave ships serially.

### Non-goals (locked — do not reopen)

- No `src/` in Wave 84. No `scripts/` / `public/` / `package.json`.
- No NAV-01 plot math. No NAV-02 marker art. Do not edit those docs or `out/w84/nav01|nav02`.
- No full path planner. No NPC traffic ownership.
- No in-system dest (station / belt / landmark) this feature.
- No teleport. No skip charge. No skip zone.
- No second `WORLD_FIELDS` key. No new `localStorage` key.
- No `state.js` rewrite. No new `U.*`.
- No KeyV / Digit / KeyM bind. No HUD-01 layout move. No HUD-02 skin reopen.
- Do not invent UU, standing, BIO gift/pirate, police leave, Unknowables dock, BIO-04, power ledger, living frigate, aim-glass.
- Do not edit the wishlist or `PROGRESS.md`.

---

## Proposed Design

### 1. Merge resolutions (contract wins)

| Question | Integrator freeze | Why |
|---|---|---|
| New persist key? | **No.** Fields on `world.nav` | NAV-01 owns the record. Contract §0.3 |
| Flying flag? | `world.nav.autopilot` boolean | Same record. Restore forces **false** |
| Restore resume? | **No** (owner-confirm default) | Stuffed `true` must not grab the stick |
| Teleport? | **Forbidden** | Wishlist + §0.5 |
| `jumpRequested` writer? | **`gate.js` only**; `to: near.to` | Inventory §3; stuffing |
| Hub? | Existing KeyG / `nearRouteIndex` | No second path |
| Flight writer? | **`ship.js`** mesh; **`autopilot.js`** cmd | TGT-02; input ownership |
| MATCH? | **Refuse engage** | Fail closed. Do not write throttle. Chart-local live region while chart open |
| Avoid? | Reuse PHY-02 bias | Not a planner |
| Lock? | Must not write `targets.current` | HUD-01/02; KeyV |
| Chart control? | Button while chart open | Contract §0.10 / §8.1 |
| In-flight cancel? | Top-center chip `top: 14px; left: 50%` | Not banner, not hub, not `.rw-jump` |
| Next hop? | `world.nav.path[1]` | NAV-01 persist |
| Arrival? | Enter dest **system** | No in-system dest |
| Cancel clears route? | **No** | Wishlist |
| AP during jump? | Hold heading; no steer | Contract §0.15 |
| Docked engage? | **No** | Contract §0.15 |
| NPC AP? | **No.** Player only | Contract §0.14 |
| `innerHTML`? | **No** | Live HUD is `textContent` |
| `state.js`? | READ-ONLY | Architecture |
| New events? | `autopilotEngaged { dest }` / `autopilotDisengaged { reason }` | Primitives only |

### 2. Player outcome

Plot a dest on the chart (NAV-01). Click **Autopilot**. The ship turns toward the routed gate, slows in the live zone, and jumps with the same D-verb the player uses. After the fade, it finds the next routed gate. Repeat until the dest system. The chip always shows dest, current hop, and **Cancel**. WASD, throttle, afterburner, or Cancel hands the stick back. The route stays. Combat, sun heat, a missing gate, or a blocked approach drops AP with a line. Load a save: the route may return (NAV-01); the stick does not.

### 3. Command

See contract §3 and §6.

- Engage: chart **Autopilot** click only. No new letter.
- Computer: `src/game/autopilot.js` (later).
- Mesh / velocity: `ship.js`.
- Jump: `gate.js` emit, `jump.js` run.
- Cancel: chart button or in-flight button.

### 4. Flight while engaged

Each unpaused frame (after controls, before or inside ship — impl ticks `autopilot.js` **before** `ship.js`):

1. If any interrupt in contract §5 → disengage, keep route, stop. Ignore steer-break while `flags.galaxyChart`. After close, arm only after hypot stays below 0.65 for one frame. WASD still cancels.
2. Resolve NAV-01 next hop (`path[1]`). If dest reached → `arrive`.
3. Aim at the routed assembly (gate `to` or hub). Bias with exported `applyAvoidBias`.
4. Write `yaw` / `pitch` / `throttle` onto `ctx.autopilot` (0..1 throttle, cruise cap, **no** afterburner). Near `JUMP.zone`, ease toward creep.
5. `ship.js` applies those analogs like steer/throttle but **does not** copy them onto `ctx.input`.
6. If `inZone && nearTo === hop` → latch `wantJump` (same previous-frame publish as `dockPressed`; gate runs **before** AP). If hub and `nearTo !== hop` → latch `cycleHub`. Gate must still require `world.nav.autopilot && nearTo === hop`.
7. While `gate.jumping`: zeros on cmd; hold heading.
8. Pause/origin/title/models: those writers call exported `disengage(ctx, 'pause')` when they set `flags.paused = true` (AP does not tick while paused).

Control handoff: on disengage, the live `input.throttle` setpoint is the player's (AP never overwrote it). Speed eases via existing accel (`ship.js` 824–828). Do not snap rotation to the reticle in one frame; next frames use live steer as today.

### 5. Jump (real)

Same as a player in the zone. Charge 2.5 s. Overlay + HUD bar unchanged. Midpoint is `jump.js` (despawn, null lock, relocate). AP does not write `currentSystem`. After `systemLoaded`, NAV-01 advances the hop (sibling). AP reads the new next hop.

Hub: wait in zone and cycle with the **same** modulo as KeyG until `nearTo` matches.

### 6. Restore

**Owner-confirm default:** after `restore()`, `world.nav.autopilot === false`. Manual stick. Route may exist. Chart Autopilot is clickable again if dest is valid.

Do not re-engage because the blob said `true`. Do not leave `ctx.autopilot.engaged` true across restore (save inits after ship; healer runs in `restore`).

### 7. UI

See contract §8.

- Chart header button in a flex cluster with ×. Always visible while the chart is open.
- Native `disabled` only when there is no dest/route. MATCH and other §6 refuses stay **clickable** (`aria-disabled` + header live region). Do not dump reason text into `aria-disabled`.
- Refuse while chart open: header `aria-live="polite"` node (4 s). `#hud` toasts are not the reporter (`z-index` 10 vs 30).
- In-flight chip: `#hud .rw-autopilot { top: 14px; left: 50%; transform: translateX(-50%); }`. Not `.rw-banner`, not hub, not `.rw-jump`, not NAV-02 readout.
- Jump charge stays center and `pointer-events: none` (`hud.js` 632–646). Cancel stays on the top chip.
- Space on the focused Autopilot / Cancel button: `preventDefault` so the button does not activate. Click or Enter activates.

### 8. Feedback

Engage / refuse / interrupt: contract §8.3 English. Chart-open refuse uses the **chart** live region plus `commLine`. Chart-closed interrupt uses `commLine` + chip. Audio: later song cue may reuse a quiet existing event; **do not** require a new HUD-03 checkbox. Frozen events in contract §9.

### 9. Serial PR plan (later, named only)

PR1 persist force-false → PR2 `ctx.autopilot` + module stub + events → PR3 ship consume + MATCH refuse + break table → PR4 avoid export + sun abort → PR5 gate `wantJump`/`cycleHub` → PR6 chart + chip.

Do not implement them in Wave 84. Do not land `src/` here.

PR5 without PR3 would emit jumps while the player still aims by mouse. Forbidden.

---

## Open owner questions

**Closed in this pass (defaults):**

1. Restore auto-resume: **no**. Alternative needs-owner, out of this serial.
2. MATCH: **refuse engage**. Do not cancel MATCH.
3. Jumping: **hold heading**, no AP steer.
4. Hail overlay: **interrupt** (Digit 1..n).
5. Pause/origin/title/models: **interrupt** on pause rising.
6. `AP_STEER_BREAK` **0.65** in `autopilot.js` (not `U.*`). **Ignore** while the chart is open; re-arm after hypot stays below 0.65 for one frame.
7. MATCH / refuse reporter while chart open: **chart header live region**, not `#hud` toasts.

Do not treat teleport, lock steal, or a second jump path as open.

---

## Risks (wishlist regressions)

| Risk | Freeze |
|---|---|
| Pathfinding on missing / unusable hops | `missingGate`; no emit; keep route |
| Route HUD vs target lock | AP does not write `targets.current`; NAV-02 owns markers |
| Control handoff spike | Do not write `input.throttle`; ease via existing accel; steer-break deadzone; **no steer-break while chart open** |
| Chart click drops AP | Ignore steer arm while `flags.galaxyChart` |
| Silent MATCH refuse | Chart `aria-live` status; toasts stay secondary |
| Collide traffic / station / gate | PHY-02 bias + existing `resolveMover`; `blocked` / `impact` interrupts |
| Combat interrupt feel | Rising `flags.combat` drops AP; Cancel still visible that frame |
| Save restores flying | Healer forces `autopilot: false` |
| Teleport / skip charge | Sole emit in zone; `jump.js` only swap |
| Stuffed dest / proto id | `to: near.to`; `Object.hasOwn(SYSTEMS)`; `RESERVED_IDS` |
| MATCH fight | Refuse engage; no throttle write |
| Digit / KeyM / hub steal | Click controls; chip off hub |
| Sun core | Lethal-aim abort + `sunHeat` interrupt + existing lethal |

---

## Acceptance (later impl)

- One Autopilot click flies a representative multi-jump NAV-01 route using live gate zone + `jump.js` charge. No teleport.
- Cancel or WASD/throttle/afterburner returns control and **keeps** the route.
- Never silent-continues into sun, combat, missing gate, hull warn/crit, or a blocked approach.
- Restore never resumes flying AP. Route restore is NAV-01.
- MATCH on → refuse **visible on the open chart**. No lock steal. No Digit/KeyM steal. Header click does not steer-break cancel.
- Arrival in the dest **system** disengages AP.
- Digit 0 still shipyard. `state.js` untouched. `innerHTML` still unused on hud/chart.

---

## Coupling (for the orchestrator)

| Item | Freeze |
|---|---|
| Writer module | `src/game/autopilot.js` (cmd) + `ship.js` (mesh) |
| Jump emit | `gate.js` only |
| Persist | `world.nav.autopilot` on NAV-01 `{ dest, path, remaining, status }`; next hop `path[1]` |
| Restore | force false |
| Avoid | extract/export `applyAvoidBias`; NPC still `npc.js` |
| Tick | `autopilot.js` after controls, before ship; gate still before controls (prev-frame `wantJump` like `dockPressed`) |
| Chart open | `flags.galaxyChart` writer `galaxychart.js`; suppress steer-break; refuse on chart live region |
| Chip | `#hud .rw-autopilot` `top: 14px; left: 50%` |
