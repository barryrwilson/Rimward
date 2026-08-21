# TGT-05 reticle-lock shared contract

**Wave:** 73. Design only. No TGT-05 feature ships in this wave.  
**Status:** MERGE LAW for the integrator brief. If `docs/Tgt05ReticleLockDesign.md` and this file ever disagree, **this file wins**.  
**Not this wave:** any edit under `src/`, `scripts/`, `public/`, `index.html`, `package.json`. Do not edit `docs/PLAYER-EXPERIENCE-WISHLIST.md`, `PROGRESS.md`, `docs/Hud02IdentitiesDesign.md`, `docs/ShpDesign.md`, `docs/Shp03WeaponsDesign.md`, `docs/BioLivingShipsDesign.md`, `docs/MsnMissionsDesign.md`, `docs/AstOrbitsDesign.md`, `docs/RepStandingDesign.md`, `docs/ExpDataTradeDesign.md`, or sibling `out/w73/{rep,exp}` files.  
**Locked sources:** wishlist Initiative TGT TGT-05 (`docs/PLAYER-EXPERIENCE-WISHLIST.md` ~270–309); live inventory `out/w73/tgt05/current-tgt-inventory.md`; `src/systems/controls.js`; `src/game/reticle-aim.js`; `src/core/ctx.js`; `src/systems/hud.js`; `src/systems/combat.js`; `src/systems/ship.js`; `src/game/state.js` (`U.TARGET_RANGE`); HUD-01 / HUD-02; AST rock `id === index`.

Integrator rule: a **later** implementation wave obeys this file. Inventory cites live code. Code wins over stale comments.

---

## 0. Law in one page

1. Wave 73 is markdown only. Implementation is a later **serial** wave. Do not schedule or land TGT-05 PRs in `src/` in this wave.
2. Keep **KeyT** `cycleTarget`. Reticle-lock is a **new** command. Do not overload `input.targetPressed`.
3. Binding: do not steal WASD RF QE, **H/D/C/X/T**, Digit **1–4**, Space, Shift, LMB, Digit **0**, G, M, L, P, O. Multiple unused keys exist. Default proposal is **KeyV**. Status: **proposed, needs owner**. Until the owner picks, do not ship a binding.
4. Prefer the object whose **on-screen target disc** contains the reticle. Small forgiving cone **only** when no disc hit. Cone size is **proposed, needs owner**. Do not invent degrees. Do not copy `CONVERGE_DOT` 0.72 (~44°) as a pick cone. If the owner has not set a pixel (or equivalent) cap by PR2, PR2 ships **direct-hit only** (fail closed).
5. Foreground / nearer **unobscured** eligible object wins. Same camera ray as `reticleAimPoint` (visible reticle, first-person recenter, `RETICLE_EDGE` 44). No raw mouse-behind-camera ray. No full-scene `Raycaster` (decorative children must not steal).
6. First impl **in:** live ships (skip destroyed) + asteroids (list refs). First impl **out (named):** stations, gates, pods, landmarks, anomalies, aftermath wrecks as new lock kinds. Salvage hail stays a **ship** lock. Owner may override station/gate (open question); if overridden, §5.3 applies.
7. Asteroids on reticle-lock: **in** even when `weaponGroup !== 3` (default). Cycle-T rocks stay group-3-only. Owner may override (open question).
8. Preserve eligibility: destroyed ships skip. Decorative geometry must not steal from the owning object. AST `id === index` stays. Do not invent rock UUIDs.
9. Confirmation: existing bracket / card is the **visual** lock. Miss: `commLine` toast, authored static line, `textContent` only. Unique lock **audio** cannot ride an existing cue without lying (`hailOpened` opens hail; `saveBlocked` says SAVE BLOCKED; HUD-02 family ticks are identity-gated). PR4 may add **one** frozen event `reticleLock` `{ hit: boolean }` + song `CUES` only. No HUD-03 audio checkbox. No second persist key.
10. Non-ship locks fail closed on combat rails: no seeker, no ship vitals rail, no lead, no RANGE pop, no hail. Rock MATCH **stays**. Unknown / later kinds must not match rock helpers.
11. Group-3 mining still works. Cycle-T still works. Lead / RANGE stay **selected-weapon** based (TGT-01).
12. World strings: `textContent` only. No `innerHTML`. Prototype keys fail closed. No `for…in` blob merge.
13. `state.js` READ-ONLY. No new `U.*` unless a named later serial data owner lands a tiny constant. Default range cap is live `U.TARGET_RANGE` (600).
14. Do not reopen HUD-01 layout, HUD-02 skins, SHP, AST rock UUID, POD, BIO, MSN.
15. Do not persist `targets.current`. Jump / despawn / destroy already drop it.

---

## 1. Command and keys

### 1.1 Cycle-T (preserve)

`cycleTarget` stays on KeyT / `input.targetPressed` (`controls.js` 51–80, 139–141, 251).

Must not:

- drop asteroid candidates in group 3
- add stations/gates/pods to the cycle list in the first impl
- change nearest-first wrap
- bind reticle-lock to KeyT, LMB, or a hold that fires

### 1.2 New edge

Later impl adds a **new** one-frame edge (name **proposed:** `input.reticleLockPressed`). `controls.js` owns it. Same pulse pattern as `targetPressed`.

Must not reuse `fireHeld`, `targetPressed`, `matchSpeedPressed`, `dockPressed`, or `hailPressed`.

Dock overlay: Digit 0 stays shipyard. The new letter must not be Digit 0–9.

### 1.3 Binding (owner)

| Candidate | Why it is free in flight | Why it may still lose |
|---|---|---|
| **KeyV** (default proposal) | Unused in `TRACKED` and overlay | Owner taste |
| KeyZ | Unused in flight | Owner taste |
| KeyN | Unused in flight | Owner taste |
| Tab | Unused in game code | Browser focus cycle |
| Mouse button 1 (RMB) | Only LMB is bound | Easy to confuse with fire; no gamepad |

**Status: proposed, needs owner.** Do not steal the freeze list in §0.2–0.3. Do not ship until picked.

Gamepad: **no** live API. First impl is mouse reticle + keyboard edge. Gamepad map deferred.

### 1.4 When the command runs

Refuse (no write, miss feedback) when: no `ctx.ship.object`; docked; jumping; paused; models/title overlay as pause already skips. Miss when glass is empty or only ineligible objects sit under the reticle.

---

## 2. Pick math (later PR2)

### 2.1 Ray = visible reticle

1. Read `ctx.targets.reticleScreen`.
2. If `ctx.flags.firstPerson`, treat offset as `0,0` (HUD already does; `reticle-aim.js` 29–31).
3. Clamp with `RETICLE_EDGE` 44 (`reticle-aim.js` 11, 32–35; `hud.js` 1004).
4. Unproject from **`ctx.camera`**, not a world mouse behind the chase hull.

Prefer extending `reticleAimPoint` (or a sibling in that file) to **return the hit ref**, not a second ad-hoc ray.

### 2.2 Direct hit

For each **eligible** candidate inside `U.TARGET_RANGE`:

- Center = ship `object.position` or rock `position`.
- Radius = rock `radius`, or ship `state.radius ?? 4` (live aim default).
- Project center + radius to screen. If the reticle pixel lies inside that disc, it is a direct hit.

If several direct hits overlap, the **smallest positive ray-t** (nearer, unobscured) wins.

### 2.3 Occlusion

A farther eligible object does not win if a nearer eligible **or blocking** sphere sits on the same ray at smaller t. Instanced rock GPU mesh, gate glow sprites, station running lights, and ship scar planes are **not** blockers unless they are the owning list/object sphere.

Do not Raycast every Mesh in `ctx.scene`.

### 2.4 Forgiving cone (only if no direct hit)

**Proposed, needs owner.** No degree number in this contract.

Until the owner sets a **screen-pixel** (or equivalent authored) cap:

- PR2 ships direct-hit only.
- Do not use `CONVERGE_DOT` 0.72.
- Do not add `U.RETICLE_LOCK_CONE`.

When a cap exists: pick the eligible object with smallest screen error under that cap, still in `U.TARGET_RANGE`, still unobscured. Distant specks with tiny discs must not win a wide miss.

### 2.5 Range

Cap = live `U.TARGET_RANGE` (600). Feature PRs do not add a parallel range.

---

## 3. Eligible categories

### 3.1 First impl — in

| Kind | Ref stored in `targets.current` | Skip |
|---|---|---|
| Ship | The live `ctx.ships` member (same as cycle-T) | `!object`, `state.destroyed`, not in `ctx.ships` |
| Asteroid | The **list row** (`ctx.asteroids.list[i]`), not a copy | Missing `position`, not `list.indexOf(ref) >= 0` |

Asteroid reticle-lock **does not** require `weaponGroup === 3` (default). Mining still only **fires** in group 3.

### 3.2 First impl — out (deferred, identity frozen)

| Kind | Live mesh/id | Later lock identity | Notes |
|---|---|---|---|
| Station | `ctx.station` + dock mesh | `lockKind: 'station'` pointing at `ctx.station` (one per system) | Dock verb D stays proximity. Owner Q. |
| Gate | Gate assemblies | `lockKind: 'gate'` + destination system id / hub flag | Jump verb D / G stay zone. Owner Q. |
| Pod / cargo / survivor | `ctx.pods[]` | `lockKind: 'pod'` + live pod object | Auto-scoop stays. No persist. |
| Landmark / anomaly | `SYSTEMS[].landmarks` / clues / CONVERGENCE site | `lockKind: 'landmark'` + authored `id` | Chart marks stay inert. Mystery persist unchanged. |
| Aftermath wreck | `wreckMeshes` | **Out** unless a later world owner gives a stable selectable id | Decorative debris today |
| Salvage cargo as a new kind | — | **Forbidden** as a parallel to disabled ships | Hail salvage = ship lock + H |

Do not invent a target kind with no live mesh/id.

### 3.3 Salvage

Disabled ships remain **ships**. Reticle-lock may select them. Hail/salvage UI does not change.

### 3.4 Owner overrides

If the owner sets station/gate **in** for first impl, PR3 must obey §5.3 and §4. Do not treat them as rocks.

---

## 4. Lock identity (fail closed)

Live first impl **keeps untagged** ship and rock refs (cycle-T compatibility).

Later non-ship/non-rock locks **must** set `lockKind` from an allowlist:

```
'ship' | 'rock' | 'station' | 'gate' | 'pod' | 'landmark'
```

Sanitize / write:

- Only `Object.prototype.hasOwnProperty` (or `Object.hasOwn`) on incoming blobs. No `for…in` merge.
- Reject `__proto__`, `constructor`, `prototype`, and any key in live `RESERVED_IDS` if ids are strings.
- Asteroid `id` stays the list index. Never a UUID.

**Rock test (must stay true only for asteroid list rows):**

```
position && !object && !state && !lockKind
OR lockKind === 'rock'
```

A station `{ position, name }` **without** `lockKind: 'station'` must not be written. If a worker writes it anyway, MATCH / mining pull / HUD `ASTEROID` path must refuse (treat as no-lock / unknown), not as a rock.

NPC availability drop stays ship-shaped (`record` + `state`). Rock drop stays `dropStaleRockLock`. Jump still nulls `current`.

---

## 5. Consumer fail-closed matrix

| Consumer | Ship lock | Rock lock | Later station/gate/pod/landmark | Unknown |
|---|---|---|---|---|
| HUD bracket | Name / faction / resolve | `ASTEROID` + ore meta | Later: authored name + dist only. No ship vitals | Hide |
| Target combat rail | On | Hidden | Hidden | Hidden |
| Lead | Selected-weapon TOF | Hidden | Hidden | Hidden |
| RANGE pop | Selected-weapon envelope | Off | Off | Off |
| MATCH | Live (scalar) | Live (world vel) | **Refuse to arm.** Do not copy rock MATCH | Refuse |
| Missiles | `liveMissileLock` | null | null | null |
| Mining pull | Unknowable ship only | Pull if in cone | No pull | No pull |
| Hail H | Live | No-op | No-op | No-op |
| Dock D / Jump D | Unchanged (zone) | Unchanged | Unchanged (zone). Lock must not teleport dock | Unchanged |
| Turret | Unchanged (own pick) | Unchanged | Unchanged | Unchanged |
| Contacts lock pip | Ship object | Off | Off | Off |

A station lock must **not** silently break MATCH/combat: MATCH stays off; guns still fire along the reticle ray (live `playerMuzzleDir` does not snap to lock). Seeker stays null.

Group-3 mining: rock lock + beam ray-sphere stay. Reticle-lock of a rock in group 1/2/4 must not fire the laser.

---

## 6. Feedback

### 6.1 Visual hit

Existing target bracket + (for ships) target rail. Immediate. No new glance instrument. Do not move HUD-01 / HUD-02 layout.

### 6.2 Visual miss

Authored static miss line via existing `commLine` `{ text }` (HUD already toasts, `textContent`). `text` is a **module string literal** (for example `'Nothing under the reticle.'`). Do not build it from `record.name`, cover names, landmark ids, or save strings. Do not interpolate world names into HTML. Do not emit `saveBlocked`. Do not `emit('commLine', lockRef)`.

### 6.3 Audio

Existing events cannot carry a unique lock beep without side effects. First impl audio waits on **one** new frozen event in a named `ctx.js` serial (PR4):

```
'reticleLock' { hit: boolean }
```

`song.js` `CUES.reticleLock`: short UI tick, gain in the HUD-02 UI band (≤ 0.08), duration ≤ 0.35 s. Play for **both** families (not `FAMILY_CUES`). Reduced-motion may skip the HUD family ticks; lock audio should still play unless `settings.muted` / `masterVolume` (song already applies those).

Payload is only `{ hit: true }` or `{ hit: false }` written as a literal. Do not spread a ship, rock, or save blob into `emit`. Do not put names, ids, or meshes on the event.

Must not:

- add a HUD-03 settings checkbox
- reuse `hailOpened`, `hudMechContact`, `hudMechMatch`, `saveBlocked`
- add a second event type for miss

If PR4 cannot land the `ctx.js` comment line, ship visual-only + `commLine` miss and **leave audio deferred**. Do not emit an undeclared type.

### 6.4 Names

Ship `record.name` / coverName / `CONTACT`. Rock label `ASTEROID` (live). Later landmark `name` from authored `SYSTEMS` tables. Always `textContent`. Strip / ignore control chars on any copied string. Q-ship cover rules stay (`hud.js` 1569–1578).

---

## 7. Persist, prototype, XSS

- No new `localStorage` key. Autosave stays `rimward-save-v1`.
- Do not add `targets` to `WORLD_FIELDS`.
- No nested lock blob on hangar / player.
- Prototype keys fail closed on any later `lockKind` / id.
- `innerHTML` forbidden on HUD / toasts / prompts. Models-browser `innerHTML` is out of scope (do not copy it).
- No secrets.

---

## 8. Closed neighbours

| Neighbour | Freeze |
|---|---|
| HUD-01 | Glance set and positions stay |
| HUD-02 | Family skins stay. HUD never writes `hullKind` |
| HUD-03 | No new audio/settings key |
| TGT-01 | Lead + RANGE = selected weapon. Mining hides lead |
| TGT-02 | MATCH lamp on ship **or** rock (live Wave 71). `ship.js` owns the flag |
| TGT-03 | Contacts arc scanner-gated. Not a reticle ring |
| TGT-04 | Turret pick stays independent of this command |
| SHP | Digit 0 shipyard. No dock-digit steal |
| AST | `id === index`. No rock UUID |
| POD | Scoop unchanged. No trafficking reopen |
| BIO / MSN | Closed |

---

## 9. Serial PR plan (later impl, named only)

Do **not** implement in Wave 73.

| PR | Name | Lands | Must not |
|---|---|---|---|
| **PR1** | Inventory pins | Boot/harness pins: KeyT cycle, group-3 rocks, `TRACKED` set, `reticleScreen` publish, `U.TARGET_RANGE` 600, Discriminators, Digit 0 | Change bindings |
| **PR2** | Pick math | Ray = visible reticle; disc hit; occlusion by nearer sphere; range cap | Invent cone degrees; full-scene Raycaster |
| **PR3** | Eligible + fail-closed | Ships + rocks; asteroid lock regardless of group (unless owner said no); unknown kinds refuse MATCH/seeker | Station-as-rock; new persist |
| **PR4** | Feedback | Bracket already works; miss `commLine`; optional one event `reticleLock` | HUD-03; `innerHTML`; steal hail/saveBlocked |
| **PR5** | Boot pins | Dense-system pick: ship under reticle; rock under reticle; miss; KeyT still cycles; mining group 3; FP recenter | Sibling docs |

Order is serial. PR3 must not expose station/gate until owner override + `lockKind`.

---

## 10. Open owner questions (block impl)

Defaults in this file stand unless the owner overrides.

1. **Binding key** among KeyV / KeyZ / KeyN / Tab / RMB. Default proposal **KeyV**.
2. **Asteroids outside group 3** on reticle-lock? Default **yes**. Cycle-T still group-3-only.
3. **Station / gate lock** in first impl? Default **defer**. If yes, `lockKind` + §5.3 + pick radius **proposed, needs owner** (must not use glow sprite / `U.DOCK_RANGE` 45 as a steal disc).

Cone pixel cap is also **proposed, needs owner** (not a fourth career question; it only gates forgiveness).

---

## 11. Verifier pins (later)

A later wave should pin:

1. KeyT still cycles ships; group 3 still adds rocks.
2. New command is not KeyT / LMB / Digit 0 / H/D/C/X / 1–4 / Space / Shift.
3. FP: pick uses centered reticle, not raw mouse.
4. Destroyed ships never lock.
5. Rock lock is the list row (`indexOf`), `id === index`.
6. Station-shaped `{position,name}` does not MATCH as a rock (if tests inject one).
7. Miss does not use `innerHTML` or `saveBlocked`.
8. Mining group 3 still cuts a locked rock.
9. Missile seeker still null on a rock.
10. `state.js` untouched unless a named data owner.
