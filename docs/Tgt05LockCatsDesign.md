# RIMWARD TGT-05 remaining lock categories

| Field | Value |
|---|---|
| **Title** | RIMWARD TGT-05 remaining lock categories |
| **Author** | Wave 81 TGT-05 integrator |
| **Date** | 2026-08-21 |
| **Status** | Wave 82 impl: remaining lock categories + LOCK_CONE_PX 12. |
| **Wave** | 81 — design. Later — impl. |
| **Owner request** | TGT-05 remaining lock categories brief. Do not ship `src/` or live bindings in this wave. |
| **Merge law** | [`out/w81/tgt05/shared-contract.md`](../out/w81/tgt05/shared-contract.md). If this brief and that file conflict, the contract wins. |

**Verifier record:**

| Note | Path |
|---|---|
| Inventory (code wins) | [`out/w81/tgt05/current-tgt-inventory.md`](../out/w81/tgt05/current-tgt-inventory.md) |
| Merge law | [`out/w81/tgt05/shared-contract.md`](../out/w81/tgt05/shared-contract.md) |
| Security review | [`out/w81/tgt05/security-review.md`](../out/w81/tgt05/security-review.md) |
| Design-doc review | [`out/w81/tgt05/code-review.md`](../out/w81/tgt05/code-review.md) |

Wave 73/74 record for ships + rocks stays [`docs/Tgt05ReticleLockDesign.md`](Tgt05ReticleLockDesign.md). **Do not edit that file.** Live code wins over its Wave 73 line numbers. KeyV already ships.

---

## Overview

KeyV reticle-lock already selects ships and asteroids (Wave 74). Cycle-T still wraps in-range ships (and asteroids only in weapon group 3). Stations, gates, pods, and landmarks have live meshes, but V on their hull is a miss. Wishlist TGT-05 wants the object under the visible reticle — including those categories — to become `ctx.targets.current` **without** stealing MATCH, mining, hail, or combat rails.

This brief is the integrator document for a **later** implementation wave. It freezes `lockKind`, tight body pick spheres, fail-closed rails, and a serial PR plan. Wave 81 lands this markdown only. Bindings do not change here.

HUD-02 is closed. HUD never writes `hullKind`. Digit 0 stays shipyard. Lead/RANGE stay selected-weapon based (TGT-01). `state.js` stays READ-ONLY. Cone pixel cap is **`LOCK_CONE_PX = 12`** (Wave 82). Do not invent degrees. Do not reopen KeyV vs KeyT.

---

## Background & Motivation

### Current state (inventory)

Source of truth for “TGT today”: [`out/w81/tgt05/current-tgt-inventory.md`](../out/w81/tgt05/current-tgt-inventory.md). Code wins over stale comments. Wave 73 cites are stale.

| Surface | Today | Cite |
|---|---|---|
| Cycle | `cycleTarget` on KeyT. Ships in `U.TARGET_RANGE` 600. Rocks **only** if `weaponGroup === 3`. Nearest then wrap | `controls.js` 54–82 |
| KeyV | `tryReticleLock` → `pickReticleLock`. Ships + rocks, any group, **direct-hit disc**, no cone | `controls.js` 114–127, 190–191; `reticle-aim.js` 91–144 |
| Lock ref | `ctx.targets.current` = live `ctx.ships` member **or** asteroid list row. **No `lockKind` in `src/`** | `ctx.js` 168–172 |
| Reticle | Mouse offset published as `reticleScreen`; HUD first-person recenters; edge 44 | `controls.js` 310–311; `hud.js` 998–1009 |
| Aim ray | `reticleAimPoint` unprojects that reticle; guns/mining use it | `reticle-aim.js` 54–88 |
| MATCH | `X`; `ship.js` owns `flags.matchSpeed`; rock uses sampled world velocity | `ship.js` 649–703; `hud.js` 1467 |
| Seeker | Live ship in launcher range; rock → null | `combat.js` 1146–1152 |
| Mining | Group 3 beam vs list spheres; locked rock may pull if `position && !object` | `combat.js` 1253–1274 |
| Keys | `TRACKED` includes KeyV. LMB fires. Digit 0 = shipyard | `controls.js` 37–44; `station.js` 152, 5175–5177 |
| Event | Frozen `'reticleLock' { hit }` already. Cue in `song.js` | `ctx.js` 227; `song.js` 119 |
| Dock | D in `U.DOCK_RANGE` 45. Station envelope `\|x\|,\|z\| <= 32` | `state.js` 28; `station.js` 389–390, 5276–5281 |
| Jump | D in `JUMP.zone` 60. Bore 30. Glow scale 96 | `state.js` 542–543; `gate-scale.js` 14; `gate.js` 78, 558–560 |
| Pods | Auto-scoop at `U.SCOOP_RANGE` 10; hull 0.9 | `pods.js` 35, 603–616 |
| Landmarks | Discovery 100; clues 35; HUD chart marks inert | `mystery.js` 37–38; `hud.js` 1332–1372 |

Stations, gates, pods, and landmarks have live meshes. Cycle-T cannot select them. KeyV cannot select them. Interaction is proximity (D dock/jump, auto-scoop, mystery radius).

### Pain points

- Wishlist TGT-05: the player already points the reticle at a station, gate, pod, or landmark. V currently misses.
- `pickReticleLock` only walks asteroid list rows and live ships (`reticle-aim.js` 106–142).
- A naive scene `Raycaster` would let station lights, gate glow (scale 96), or shutter chevrons steal the lock.
- A naive `{ position, name }` station ref matches live **rock** helpers (`position && !object && !state`) and would steal MATCH / mining pull / paint `ASTEROID` (`controls.js` 85–87; `ship.js` 653; `combat.js` 1266; `hud.js` 1564).
- Dock zone 45 and jump zone 60 are **verbs**, not pick discs. Landmark discovery 100 would swallow nearby ships.
- `CONVERGE_DOT` 0.72 is a **gun** cone (~44°). Using it as a pick cone would lock distant unrelated objects.

### Why now (design) / why not now (code)

Wave 74 shipped ships + rocks. Wave 73 deferred station/gate/pod/landmark with identity notes. The owner asked for the remaining-categories brief so a later serial can land `lockKind` and fail-closed rails against a frozen contract instead of a drive-by KeyV overload. Sibling Wave 81 workers own MSN-03 and BIO-03; this brief does **not** wait on their files and does **not** invent their numbers.

---

## Goals & Non-Goals

### Goals

1. Document live KeyV, KeyT, Digit 0, discriminators, station/gate/pod/landmark surfaces from **live code**.
2. Freeze KeyT cycle. Freeze KeyV. No new binding. No LMB overload.
3. Freeze first impl of **this** slice: station + gate + pod + landmark. Cone still fail-closed (direct-hit).
4. Freeze `lockKind` allowlist and the rock-test tighten (`list.indexOf`).
5. Freeze tight body spheres (envelope 32 / bore 30 / pod 0.9 / mesh bound). Not glow, not dock, not jump, not discovery.
6. Freeze MATCH / mining / hail / seeker / combat refuse on the four kinds.
7. Freeze landmark authored id only; chart marks inert; §25.
8. Freeze reuse of `'reticleLock' { hit }`. No new event. No persist. `state.js` READ-ONLY. No `innerHTML`.
9. Freeze a serial PR plan. This wave writes the brief. A later wave ships serially.

### Non-goals (locked — do not reopen)

- No `src/` or live bindings in Wave 81. No implementation PRs scheduled here.
- No KeyV vs KeyT reopen. No new letter. No LMB overload.
- No cone pixel number. No degrees.
- No HUD-01 layout move. No HUD-02 skin reopen. No HUD-03 audio checkbox.
- No SHP / AST UUID / POD trafficking / BIO / MSN reopen. Do not invent sibling numbers.
- No auto-aim. Guns still fire along the reticle ray. Turret pick stays independent.
- No gamepad map (no live API).
- No new `U.*` in a feature PR.
- No salvage kind. No aftermath wreck kind. No clue lock.
- No NPC missiles. No TGT-03 extras.
- Do not edit the wishlist, `PROGRESS.md`, or `docs/Tgt05ReticleLockDesign.md`.

---

## Proposed Design

### 1. Merge resolutions (contract wins)

| Question | Integrator freeze | Why |
|---|---|---|
| KeyT? | **Keep cycle** | Live; dense systems still need wrap |
| KeyV? | **Keep.** Extend pick | Wave 74 shipped. Do not reopen |
| Overload LMB / T? | **No** | Fire and cycle must stay |
| New binding? | **No** | Owner request |
| Cone degrees / pixels? | **Do not invent.** Cap **proposed, needs owner**. Pick = direct-hit | `CONVERGE_DOT` is guns |
| Station / gate / pod / landmark? | **In** this slice | Owner request; Wave 73 deferred table |
| Aftermath wreck? | **Out** | Decorative `wreckMeshes` |
| Salvage kind? | **Forbidden** | Disabled ships are ships |
| MATCH on station/gate/pod/landmark? | **Refuse** | Must not look like a rock |
| Mining pull? | Asteroid **list rows** only (plus live Unknowable ship) | Shape test is the hole |
| Hail / seeker / combat rail? | Ship-only | Live already |
| Dock / jump? | Stay proximity. Lock does not replace | `U.DOCK_RANGE` / `JUMP.zone` |
| Landmark identity? | Authored landmark `id` only | §25. Never clue |
| Chart marks? | Inert HUD | Not a lock source |
| New persist? | **No** | Lock is live-only |
| New event? | **No.** Reuse `reticleLock { hit }` | Already frozen; inventory proves feedback uses it |
| `innerHTML`? | **No** | Live HUD is `textContent` |
| Digit 0? | Untouched | Shipyard |
| `state.js`? | READ-ONLY | Architecture |

### 2. Player outcome

Point the visible reticle at a visible station, gate, pod, or landmark. Press the **existing** reticle-lock command (KeyV). That object becomes `ctx.targets.current` with a discriminator that cannot steal MATCH, mining, hail, or combat rails.

Dense representative system: a nearer unobscured body disc that contains the reticle locks consistently. Foreground wins. Near miss waits on owner cone cap; without it, miss feedback, no surprise distant lock.

Cycle-T remains for “next in bubble” when the player is not pointing. Dock D and jump D remain proximity verbs.

### 3. Command

See contract §1.

- Writers of `targets.current` stay `controls.js` (select) + `npc.js` (ship availability) + existing jump/rock stale drops + **new kind stale drops**.
- Same edge: `input.reticleLockPressed`. Not `targetPressed`.
- Binding closed: KeyV.

### 4. Pick math

See contract §2.

Share the live `fillCamRay` path so chase / third / first-person agree with the HUD pip. First-person recenters; the ray must not use the raw mouse while the pip sits on the hull.

Direct hit = projected owner **body** sphere contains the reticle pixel.

| Kind | Sphere | Not |
|---|---|---|
| Station | Center `ctx.station.position`, radius **32** (horizontal envelope) | Glow, `U.DOCK_RANGE` 45 |
| Gate | Assembly position, radius **30** (`BORE_RADIUS`) | Glow 96, chevrons, `JUMP.zone` 60 |
| Pod | `mesh.position`, radius **0.9** | Scoop magnet 30 |
| Landmark | Authored position, **mesh bounding sphere**; skip if none | Discovery 100, clue 35, chart diamonds |

Occlusion = smaller ray-t on that same ray. Scene `Raycaster` on glow/lights is forbidden.

Forgiveness cone is **not** `CONVERGE_DOT`. No degrees in this brief. No pixel number in this brief.

### 5. Categories

#### 5.1 Already selectable (must not regress)

- **Ships:** live `ctx.ships` members. Skip destroyed. Same ref cycle-T uses. Untagged.
- **Asteroids:** list rows. `id === index`. Reticle-lock in even outside group 3. Cycle-T still group-3-only.

#### 5.2 This slice (in)

| Category | Later identity | Verb that stays proximity |
|---|---|---|
| Station | Wrapper `lockKind: 'station'` (do not stamp `ctx.station`) | Dock D in `U.DOCK_RANGE` |
| Gate | Wrapper `lockKind: 'gate'` + dest system id + hub flag | Jump D in `JUMP.zone`; G hub cycle |
| Cargo / ore / survivor pods | Wrapper `lockKind: 'pod'` pointing at live `ctx.pods[]` member (do not stamp the pod; `podCollected` emits it) | Auto-scoop |
| Landmarks / anomalies | Wrapper `lockKind: 'landmark'` + authored id | Mystery radius; chart marks HUD-only |

#### 5.3 Stay out

- Aftermath wreck debris (`world.js` `wreckMeshes`).
- Clue motes.
- HUD chart marks as a pick source.
- Salvage as a parallel kind.

#### 5.4 Salvage

Not a new kind. Disabled ships are ships. H hail stays.

### 6. Fail-closed non-ship

See contract §4–§5.

Rock MATCH and mining pull stay **for list rows**. A station-shaped blob must not take those paths. The impl wave **must** change shape-only rock tests to require `ctx.asteroids.list.indexOf(t) >= 0` (and `!lockKind`).

Missiles, hail, lead, RANGE, combat rail stay ship-only. Dock/jump stay zone.

### 7. Feedback

Hit: existing bracket. Authored name + distance. `textContent`. Never clue text.

Miss: live `commLine` `'Nothing under the reticle.'` + `reticleLock { hit: false }`.

Audio: live `reticleLock` cue. No new frozen event. No HUD-03 checkbox.

### 8. Serial PR plan (later, named only)

PR1 inventory pins → PR2 pick math (four body spheres; helper may return hits; **do not assign** new kinds yet) → PR3 rock-test tighten **then** `lockKind` writes + fail-closed rails → PR4 HUD + stale drops → PR5 boot pins.

`dropStaleRockLock` still treats any `{ position, no object, no state }` as a rock (`controls.js` 85–94). A PR2 that writes wrappers before PR3 would null the lock the same frame.

Do not implement them in Wave 81. Do not land `src/` here.

---

## Open owner questions

**Closed Wave 82** — [`docs/OwnerDecisionsWave82.md`](OwnerDecisionsWave82.md).

1. Cone pixel cap: **`LOCK_CONE_PX = 12`**. Screen-space radius around the visible pip. Use only when no body disc contains the pip. Not degrees. Not `CONVERGE_DOT`.

Do not treat KeyV vs KeyT as open. Do not treat station/gate in/out as open (this slice is **in**).

---

## Risks (wishlist regressions)

| Risk | Freeze |
|---|---|
| Selection through occluding geometry | Nearer body sphere on the reticle ray wins |
| Glow / dock / jump steal | Body spheres 32 / 30 / 0.9 / mesh bound. Not 45 / 60 / 96 / 100 |
| Surprise distant lock | No 44° gun cone; cone deferred until owner cap |
| Station as rock | Required `lockKind`; rock test = list membership |
| Reticle vs camera ray | Must call the `reticleAimPoint`/`fillCamRay` path (FP zero + edge 44) |
| Fire-key conflict | Existing KeyV tap; not LMB, not KeyT |
| Chart mark as lock | HUD only. Authored landmark id is source of truth |
| Clue leak (§25) | Bracket never prints clue id/text |
| Event graph leak | `reticleLock` payload `{ hit }` literal only (`emit` spreads `data`) |
| Persist smuggle | No `targets` on `WORLD_FIELDS` |

---

## Acceptance (later impl)

- Point at a visible station, gate, pod, or landmark and press KeyV: that object is `targets.current` with `lockKind` from the allowlist.
- Cycle-T still wraps ships (rocks in group 3 only). Group-3 mining still cuts **rocks**. Lead/RANGE still follow the selected weapon.
- MATCH refuses the four kinds. Seeker null. Hail no-op. Combat rail hidden. Guns still fire along the reticle ray.
- Dock D still needs `U.DOCK_RANGE`. Jump D still needs `JUMP.zone`.
- First-person pick matches the centered pip.
- Miss is obvious. Hit shows the existing card with authored name + dist (`textContent`).
- Destroyed ships never lock. Decorations / glow / clues / aftermath never steal.
- Untagged `{position}` never MATCH / mining-pulls as a rock.
- Digit 0 still shipyard. `state.js` untouched. No new frozen event.
