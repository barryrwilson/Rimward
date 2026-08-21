# RIMWARD TGT-05 reticle-lock

| Field | Value |
|---|---|
| **Title** | RIMWARD TGT-05 reticle-lock |
| **Author** | Wave 73 TGT-05 integrator |
| **Date** | 2026-08-20 |
| **Status** | Implemented. Wave 73 was markdown. Wave 74 shipped KeyV lock (ships + rocks, direct-hit). |
| **Wave** | 73 — design. 74 — first impl. |
| **Owner request** | TGT-05 design brief. Do not ship `src/` or live bindings in this wave. |
| **Merge law** | [`out/w73/tgt05/shared-contract.md`](../out/w73/tgt05/shared-contract.md). If this brief and that file conflict, the contract wins. |

**Verifier record:**

| Note | Path |
|---|---|
| Inventory (code wins) | [`out/w73/tgt05/current-tgt-inventory.md`](../out/w73/tgt05/current-tgt-inventory.md) |
| Merge law | [`out/w73/tgt05/shared-contract.md`](../out/w73/tgt05/shared-contract.md) |
| Security review | [`out/w73/tgt05/security-review.md`](../out/w73/tgt05/security-review.md) |
| Design-doc review | [`out/w73/tgt05/code-review.md`](../out/w73/tgt05/code-review.md) |

---

## Overview

Cycle-T walks in-range ships (and asteroids only in weapon group 3), nearest-first, then wraps. A dense system makes that list too long. Wishlist TGT-05 wants one command that locks the targetable object under the visible reticle.

This brief is the integrator document for a **later** implementation wave. It freezes KeyT preserve, a new command (binding **proposed, needs owner**), pick math (disc then small cone), live vs deferred categories, fail-closed non-ship rails, feedback, and a serial PR plan. Wave 73 lands this markdown only. Bindings do not change here.

HUD-02 is closed. HUD never writes `hullKind`. MATCH already works on ship and rock lock. Digit 0 stays shipyard. Lead/RANGE stay selected-weapon based (TGT-01). `state.js` stays READ-ONLY.

---

## Background & Motivation

### Current state (inventory)

Source of truth for “TGT today”: [`out/w73/tgt05/current-tgt-inventory.md`](../out/w73/tgt05/current-tgt-inventory.md). Code wins over stale comments.

| Surface | Today | Cite |
|---|---|---|
| Select | `cycleTarget` on KeyT. Ships in `U.TARGET_RANGE` 600. Rocks **only** if `weaponGroup === 3`. Nearest then wrap | `controls.js` 51–80 |
| Lock ref | `ctx.targets.current` = live `ctx.ships` member **or** asteroid list row | `ctx.js` 167–171 |
| Reticle | Mouse offset published as `reticleScreen`; HUD first-person recenters | `controls.js` 268–270; `hud.js` 998–1009 |
| Aim ray | `reticleAimPoint` unprojects that reticle; guns/mining use it | `reticle-aim.js` 17–68 |
| MATCH | `X`; `ship.js` owns `flags.matchSpeed`; rock uses sampled world velocity | `ship.js` 649–703; `hud.js` 1467–1471 |
| Seeker | Live ship in launcher range; rock → null | `combat.js` 1146–1152 |
| Mining | Group 3 beam vs list spheres; locked rock may pull | `combat.js` 1253–1274 |
| Keys | `TRACKED` = WASD RF QE THCX 1234 Shift Space. LMB fires | `controls.js` 35–42, 188–193 |
| Dock | Digit 0 = shipyard | `station.js` 132, 2963–2965 |

Stations, gates, pods, landmarks, and anomalies have live meshes. Cycle-T cannot select them. Interaction is proximity (D dock/jump, auto-scoop, mystery radius).

### Pain points

- Wishlist TGT-05: cycling through a crowded bubble is too slow. The player already points the reticle at the ship they want.
- `reticleAimPoint` already knows which rock/ship the glass hits, but it only aims guns. It does not write the lock.
- A naive scene `Raycaster` would let station lights, gate glow, or instanced rock children steal the lock.
- A naive `{ position, name }` station ref matches live **rock** helpers (`!object && !state`) and would steal MATCH / mining pull.
- `CONVERGE_DOT` 0.72 is a **gun** cone (~44°). Using it as a pick cone would lock distant unrelated objects.

### Why now (design) / why not now (code)

The owner asked for the TGT-05 brief after HUD-02, SHP, and BIO/MSN design-only waves. Inventory and merge law exist. Implementation waits for a later serial wave so the binding, pick ray, and fail-closed non-ship rails land against a frozen contract instead of a drive-by KeyT overload.

---

## Goals & Non-Goals

### Goals

1. Document live cycle-T, discriminators, reticle ray, MATCH, seeker, and keys.
2. Freeze KeyT cycle. Add a **new** reticle-lock command.
3. Freeze pick order: on-screen disc contains reticle; small cone only on miss; nearer unobscured wins.
4. Freeze first-impl categories: ships + asteroids. Defer station/gate/pod/landmark/anomaly with identity notes.
5. Freeze fail-closed combat/MATCH for non-ship (rock MATCH stays).
6. Freeze feedback: existing bracket; miss `commLine`; at most one new event `reticleLock`.
7. Freeze XSS / prototype / no persist / `state.js` READ-ONLY / no `innerHTML`.
8. Freeze a serial PR plan. This wave writes the brief. A later wave ships serially.

### Non-goals (locked — do not reopen)

- No `src/` or live bindings in Wave 73. No implementation PRs scheduled here.
- No HUD-01 layout move. No HUD-02 skin reopen. No HUD-03 audio checkbox.
- No SHP / AST UUID / POD / BIO / MSN reopen.
- No auto-aim. Guns still fire along the reticle ray. Turret pick stays independent.
- No gamepad map (no live API).
- No new `U.*` in a feature PR.
- Do not edit the wishlist or `PROGRESS.md`.

---

## Proposed Design

### 1. Merge resolutions (contract wins)

| Question | Integrator freeze | Why |
|---|---|---|
| KeyT? | **Keep cycle.** New command | Wishlist + dense systems still need wrap |
| Binding? | **KeyV proposed, needs owner** | Unused in flight; several peers exist |
| Overload LMB / T? | **No** | Fire and cycle must stay |
| Pick order? | Disc contains reticle, then small cone, occlusion by nearer sphere | Wishlist; inventory has no pick cone |
| Cone degrees? | **Do not invent.** Pixel cap **proposed, needs owner**. PR2 fail-closed = direct-hit only | `CONVERGE_DOT` is guns |
| Asteroids outside group 3? | **Yes** on reticle-lock (default). Cycle-T unchanged | Player outcome: point at a visible rock |
| Station / gate lock? | **Defer** first impl (default). Owner Q | Proximity D already works; proxy steal risk |
| Salvage / cargo / pods / landmarks? | Salvage = ship. Others **defer** with `lockKind` | No cycle-T today; live meshes noted |
| MATCH on station? | **Refuse** | Must not look like a rock |
| New persist? | **No** | Lock is live-only |
| New event? | Only if PR4 needs unique audio: **one** `reticleLock { hit }` | Existing cues lie or open hail |
| `innerHTML`? | **No** | Live HUD is `textContent` |
| Digit 0? | Untouched | Shipyard |

---

### 2. Player outcome

Point the visible reticle at a visible targetable object. Press **one** command. That object becomes `ctx.targets.current`.

Dense representative system: a ship (or asteroid) whose disc contains the reticle locks consistently. Foreground wins. Near miss waits on owner cone cap; without it, miss feedback, no surprise distant lock.

Cycle-T remains for “next in bubble” when the player is not pointing.

---

### 3. Command

See contract §1.

- Writers of `targets.current` stay `controls.js` (select) + `npc.js` (ship availability) + existing jump/rock stale drops.
- New edge, not `targetPressed`.
- Binding **proposed, needs owner**: KeyV (alternates KeyZ, KeyN, Tab, RMB). Freeze list of stolen keys in the contract.

---

### 4. Pick math

See contract §2.

Share the live `reticleAimPoint` camera path so chase / third / first-person agree with the HUD pip. First-person recenters; the ray must not use the raw mouse while the pip sits on the hull.

Direct hit = projected owner **sphere** contains the reticle pixel. Owner sphere = asteroid list `radius` or ship `state.radius ?? 4`. Not glow sprites. Not decorative children.

Occlusion = smaller ray-t on that same ray.

Forgiveness cone is **not** `CONVERGE_DOT`. No degrees in this brief.

---

### 5. Categories

#### 5.1 Already selectable (first impl in)

- **Ships:** live `ctx.ships` members. Skip destroyed. Same ref cycle-T uses.
- **Asteroids:** list rows. `id === index`. Reticle-lock **in** even outside group 3 (default). Cycle-T still group-3-only.

#### 5.2 Live mesh, not selectable today (defer)

| Category | Why defer | Later identity |
|---|---|---|
| Station | Dock is D in `U.DOCK_RANGE`. Large hull would steal nearby ships | `lockKind: 'station'` |
| Gate | Jump is D in zone; G cycles hub. Glow scale is huge vs bore 30 | `lockKind: 'gate'` |
| Cargo / ore / survivor pods | Auto-scoop. No cycle-T | `lockKind: 'pod'` |
| Landmarks / anomalies | Mystery proximity + inert chart marks | `lockKind: 'landmark'` + authored id |
| Aftermath wreck debris | Decorative group, no stable gameplay id | Stay out |

Wishlist line “when it is targetable through other controls”: today those objects are **not** cycle-targets. Defer until they are, or until the owner overrides station/gate.

#### 5.3 Salvage

Not a new kind. Disabled ships are ships. H hail stays.

---

### 6. Fail-closed non-ship

See contract §4–§5.

Rock MATCH and mining pull stay. A station-shaped blob must not take those paths. Missiles and hail stay ship-only. Lead/RANGE stay ship + selected weapon (TGT-01). Target combat rail stays ship-only.

---

### 7. Feedback

Hit: existing bracket (and ship rail). That is immediate visual confirmation.

Miss: authored `commLine` toast. Clear, static module-literal copy. `textContent`. Never emit the lock ref as the event payload.

Audio: do not reuse hail or save-blocked. PR4 may add one frozen `reticleLock` event. No HUD-03 checkbox.

---

### 8. Serial PR plan (later, named only)

PR1 inventory pins → PR2 pick math → PR3 eligible + fail-closed → PR4 feedback → PR5 boot pins.

Do not implement them in Wave 73. Do not land `src/` here.

---

## Open owner questions

Only items that block impl. Defaults in [`shared-contract.md`](../out/w73/tgt05/shared-contract.md) stand unless the owner overrides.

1. Binding key (KeyV vs KeyZ vs KeyN vs Tab vs RMB).
2. Asteroids on reticle-lock outside weapon group 3? Default **yes**.
3. Station / gate lock in first impl? Default **defer**.

Cone pixel cap: **proposed, needs owner**. Not a fourth career question. Without a number, PR2 is direct-hit only.

---

## Risks (wishlist regressions)

| Risk | Freeze |
|---|---|
| Selection through occluding geometry | Nearer sphere on the reticle ray wins |
| Small/distant objects impossible | Disc hit uses true projected radius; range 600 |
| Surprise distant lock | No 44° gun cone; cone deferred until owner cap |
| Station/gate proxy steal | Deferred; if in, `lockKind` + tight body sphere, not glow / dock zone |
| Reticle vs camera ray | Must call the `reticleAimPoint` path (FP zero + edge 44) |
| Fire-key conflict | New tap; not LMB, not KeyT |
| Station as rock | Untagged `{position}` forbidden; unknown fails closed |

---

## Acceptance (later impl)

- Point at a visible ship or asteroid and press the command: that object is `targets.current` in a dense system.
- Cycle-T still wraps. Group-3 mining still cuts. Lead/RANGE still follow the selected weapon.
- First-person pick matches the centered pip.
- Miss is obvious. Hit shows the existing card.
- Destroyed ships never lock. Decorations never steal.
- Station/gate/pod/landmark stay unselected unless the owner overrode and PR3 landed `lockKind`.
