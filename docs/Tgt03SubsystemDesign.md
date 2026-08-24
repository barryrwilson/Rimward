# RIMWARD TGT-03 remaining subsystem targeting

| Field | Value |
|---|---|
| **Title** | RIMWARD TGT-03 remaining subsystem targeting |
| **Author** | Wave 99 TGT-03 subsystem integrator |
| **Date** | 2026-08-23 |
| **Status** | Wave 100 owner close + first impl |
| **Wave** | 99 design. 100 — KeyK engine-select after shields; ENGINE tgt-rail bar. |
| **Owner request** | Remaining TGT-03 after Wave 98 Incoming fire. + Wave 99 radar jump-park sibling: **subsystem targeting** **without** a new aim-glass gauge, **without** stealing HUD-01 empty 80 px hub, **without** a lock box, **without** stealing KeyT/KeyV or Digit 0/8/9, and **without** inventing UU / standing / a new SKU unless inventory proves reuse is a lie. |
| **Merge law** | [`out/w99/subsys/shared-contract.md`](../out/w99/subsys/shared-contract.md). HUD/Digit/persist: contract wins. Six Qs: [`docs/OwnerDecisionsWave100.md`](OwnerDecisionsWave100.md) wins. |
| **Honor** | HUD-01 empty hub. HUD-02 identities. FORE/AFT hit-only. Live `.rw-contacts` radar sibling. Live `.rw-edge-arrow` current-lock off-screen. Live `.rw-nav-gate-cue` NAV-02. TGT-05 `LOCK_CONE_PX = 12` + `lockKind`. KeyT / KeyV stay. NPC darts `Incoming dart.` Live `Incoming fire.` for cannon-vs-player. Live `applyHit` screen→shell→hull + aft engine. **Do not edit** those docs. Code wins where the wishlist still lists subsystem targeting as a named leftover. |

**Verifier record:**

| Note | Path |
|---|---|
| Inventory (code wins) | [`out/w99/subsys/current-tgt03-subsystem-inventory.md`](../out/w99/subsys/current-tgt03-subsystem-inventory.md) |
| Merge law | [`out/w99/subsys/shared-contract.md`](../out/w99/subsys/shared-contract.md) |
| Security review | [`out/w99/subsys/security-review.md`](../out/w99/subsys/security-review.md) |
| Design-doc review | [`out/w99/subsys/code-review.md`](../out/w99/subsys/code-review.md) |
| UI audit | [`out/w99/subsys/ui-audit.md`](../out/w99/subsys/ui-audit.md) |

Siblings TGT-03 radar (`out/w99/radar/**`, `docs/Tgt03RadarDesign.md`) and NPC turrets (`out/w99/turrets/**`) are **other Wave 99 workers**. **Do not edit** those paths, `docs/Tgt03AwarenessDesign.md`, `docs/NpcTurretsDesign.md`, `docs/OwnerDecisions*.md`, `docs/Tgt05*.md`, `docs/Nav*.md`, `docs/NpcMissilesDesign.md`, `docs/Hud*.md`, `docs/Bio*.md`, `docs/Shp*.md`, the wishlist, or `PROGRESS.md`. Those sibling files need not exist for this brief to stand.

---

## Overview

TGT-03 already shipped the scanner-gated thin bottom bearing arc (`.rw-contacts`). Wave 98 closed `Incoming fire.` and lock park/aria. Wave 98/99 radar freeze reuses `.rw-contacts`. Wishlist leftover still names **subsystem targeting**. Improved lead is TGT-01 DONE. MATCH is TGT-02 DONE. Missile **gauge** is closed. Off-screen lock is `.rw-edge-arrow`. Attacker warning is toast `Incoming fire.` / `Incoming dart.`

Live combat already peels **screen → shell → hull** and pressures **engine** on **aft** hits. The HUD-01 target rail already shows SCREEN / SHELL / hull. FORE/AFT already names the hemisphere. There is **no** part picker on `ctx.targets`.

This brief is the integrator document for a **later** implementation wave. Wave 99 lands this markdown only. Bindings do not change here.

HUD-01 empty aim glass stays empty. No lock box. No subsystem gauge on the 80 px hub. `state.js` stays READ-ONLY. Later impl defaults to no `state.js` write. No new SKU. Digit 0 stays shipyard. Digit 8/9 stay launch/epics at dock and launcher/turret papers in outfitting. KeyT / KeyV stay. Do not invent UU or standing deltas. If owner numbers for a picker are missing, later impl does **not** retarget damage.

---

## Background & Motivation

### Current state (inventory)

Source of truth: [`out/w99/subsys/current-tgt03-subsystem-inventory.md`](../out/w99/subsys/current-tgt03-subsystem-inventory.md). Code wins over stale wishlist TGT-03 “subsystem targeting” and over Wave 98 radar inventory (subsystem was out of that pack).

| Surface | Today | Cite |
|---|---|---|
| Damage channels | screen, shell, engine, hull | `state.js` 150–161, 167–188 |
| Peel | screen → shell → hull; aft engine × `aftEngineMult` | `state.js` 209–231 |
| Facet | Shooter behind target forward → `'aft'` | `combat.js` 1619–1625, 1679–1684 |
| Lock | Whole `ctx.targets.current`; no part field | `ctx.js` 191–195 |
| `lockKind` | station / gate / pod / landmark | `reticle-aim.js` 279–310 |
| Cone | `LOCK_CONE_PX = 12` | `reticle-aim.js` 15, 321 |
| KeyT / KeyV | Cycle / reticle lock | `controls.js` 265–266, 280–281 |
| Target rail | Name, FORE/AFT, SCREEN, SHELL, hull, SPD, DIST | `hud.js` 846–855, 2012–2034 |
| Lock ENGINE bar | **Absent** | inventory §5 |
| Player ENGINE | Plant aux OK/DAMAGED/OUT | `hud.js` 883–885, 1769–1774 |
| FORE / AFT | Flash on `playerHit.fromAft` 0.4 s. Not a toast | `hud.js` 326–351, 1131–1133, 1357–1377 |
| Dart toast | `Incoming dart.` on missile+player | `npc-fire-toast.js` 7, 46–50 |
| Cannon toast | **LIVE** `Incoming fire.` | `hud.js` 14, 568–573; `npc-fire-toast.js` 8, 53–58 |
| Empty hub | 80 px | `hud.css` 184–191; `hud.js` 1194 |
| HUD family | Reads `hullKind`; never writes | `hud.js` 76–85 |
| Persist part cursor | **None.** Peel is live | inventory §7 |
| Digit 0 | Shipyard | `station.js` 186, 5920–5922 |
| Digit 8/9 dock | Launch / epics | `station.js` 186, 5918–5926 |
| Digit 8/9 outfit | Launcher / turret papers | `station.js` 1622–1702 |
| Repair | Digit 1 restores all four channels | `station.js` 196, 4353–4371, 5974–5975 |
| `innerHTML` | **none** in `hud.js` | grep 0 |
| Radar class | `.rw-contacts` sibling | not this brief |

The player who sits on a lock’s tail after shields drop already pressures engines. The player who reads the right rail already sees three layers. Wishlist “subsystem targeting” is a **name** for a picker that does not exist. It is not a missing hub disc.

### Pain points

- A naive later PR that “adds subsystem targeting” would put a lock box or pip on the 80 px hub.
- Overloading `lockKind` with `'engine'` would smash TGT-05 station/gate/pod/landmark rails.
- Stealing KeyT or KeyV would break cycle and reticle lock.
- Stealing Digit 0/8/9 would smash shipyard, launch, epics, or arms papers.
- Inventing a targeting-computer SKU and UU would desync hangar heal and impersonate the owner.
- Skipping screen/shell because a part is “selected” would rewrite `applyHit` without owner numbers.
- Putting part names from `record` onto a new list with `innerHTML` would XSS the HUD.
- Persisting a part cursor in `WORLD_FIELDS` would lie after jump and collide with scanner/contacts keys if misnamed.
- Reusing `.rw-contacts` for parts would steal the radar sibling.
- Adding an incoming-style gauge for “engines targeted” would reopen the closed missile gauge.

### Why now (design) / why not now (code)

The owner asked for an integrator brief so a later serial can land subsystem targeting without a new glass gauge. Inventory shows the **picture** (rails + FORE/AFT) and the **damage law** (peel + aft). It also shows the **picker is absent**. Merge law can exist without touching `hud.js`. Implementation waits so hub theft, Digit theft, `lockKind` smash, persist collision, and invented UU are frozen before the first bar class changes. Wave 99 does not ship `src/`. Damage retarget stays fail-closed until the owner names parts and a control.

---

## Goals & Non-Goals

### Goals

1. Document live peel, facet, lock bag, target rail, Digit 0/8/9, FORE/AFT, toasts, persist, KeyT/KeyV, and TGT-05 cone/`lockKind` from **live code**.
2. Freeze the damage **taxonomy** as screen / shell / engine / hull. No FTL rooms.
3. Freeze **reuse** of tgt-rail bars + FORE/AFT as the picture. Distinct from `.rw-contacts` and `.rw-edge-arrow`.
4. Freeze fail-closed: no hub widget, no lock box, no `lockKind` part, no Digit steal, no invented SKU/UU, no damage retarget without owner numbers.
5. Freeze persist: no new `WORLD_FIELDS` key. No part cursor in `localStorage`.
6. Freeze a serial PR plan. This wave writes the brief. A later wave ships serially.

### Non-goals (locked — do not reopen)

- No `src/` or live bindings in Wave 99.
- No aim-glass subsystem gauge / pip / lock box.
- No improved lead (TGT-01 DONE). No MATCH (TGT-02 DONE).
- No incoming-missile **gauge**. NPC missiles stay toast+song.
- No redesign of `Incoming dart.` or `Incoming fire.`
- No TGT-03 radar class rewrite. Do not reuse `.rw-contacts` for parts.
- No lock-arrow redesign. Do not reuse `.rw-edge-arrow` for parts.
- No KeyT / KeyV steal. No cone rewrite. No Digit 0/8/9 steal. No extra subsystem Digit.
- No power ledger / aim-glass pip (Wave 93/94 out).
- No BIO-05. No NPC turrets (siblings). No NPC missile Q1/Q2 reopen.
- No UU or standing deltas. No `state.js` weapon or `DEFENSE` retune.
- Do not edit the wishlist, `PROGRESS.md`, `docs/Tgt03RadarDesign.md`, `docs/Tgt03AwarenessDesign.md`, or sibling design files.
- Do not write `docs/OwnerDecisionsWave99.md`.

---

## Proposed Design

### 1. Merge resolutions (contract wins)

| Question | Integrator freeze | Why |
|---|---|---|
| New persist key? | **No** | Peel is live; no part cursor |
| New `ctx.targets.part`? | **No** (default) | Owner must name a field; default none |
| New SKU / `state.js` write? | **No** | `DEFENSE` already holds live numbers |
| Damage taxonomy? | Keep screen/shell/engine/hull | Inventory §2 |
| Skip shields on “part” pick? | **No** | Fail-closed retarget |
| Facet source? | Shooter geometry | `combat.js` 1619–1625 |
| Picture? | Tgt rail + FORE/AFT | Already the glance |
| Hub pip / lock box / gauge? | **No** | HUD-01 empty 80 px |
| Lock ENGINE bar? | **No** (default) | Owner question |
| Traffic CSS class? | Keep `.rw-contacts` | Radar sibling |
| Lock CSS class? | Keep `.rw-edge-arrow` | Different job |
| `lockKind` for parts? | **No** | TGT-05 object kinds |
| Names on a part list? | **No** | Rail `textContent` name only |
| `innerHTML`? | **No** | `textContent` / `el()` / `h()` |
| New `@keyframes`? | **No** | reduced-motion kills HUD anim |
| HUD-01 hub? | Closed | Empty 80 px; no gauge |
| Digit 0 / 8 / 9? | Untouched | Shipyard / launch+epics / papers |
| KeyT / KeyV? | Untouched | Cycle / reticle lock |
| Cone 12 px? | Untouched | TGT-05 |
| `Incoming fire.` / `Incoming dart.`? | Untouched | Live |
| FORE/AFT on fire? | **No** | Hit-only |
| New `ctx.emit` type? | **No** | Keep playerHit / npcHit / shieldDown / engineOut |
| UU / standing? | **No** | Do not invent |
| WAVE4 / WAVE26 / WAVE35? | Do not “fix” | Orchestrator law |
| Damage retarget PR? | Fail-closed | Owner numbers missing |

### 2. Player outcome (later; no picker unless owner names it)

Lock a live ship. The right rail already shows that ship’s SCREEN, SHELL, and hull. FORE/AFT already tells which hemisphere you occupy. After shields drop, shots from the target’s aft already cut engine integrity twice as hard (`DEFENSE.aftEngineMult`). The aim glass stays empty. No lock box. No part pip. No new Digit.

If the owner later names selectable parts **and** a control, a serial PR3 may retarget. Until then, the player “targets subsystems” by **flying** and by **reading the rail**, not by buying a SKU.

### 3. Picture

See contract §2.

Reuse live `.rw-combat-target` bars and FORE/AFT. Optional later: class-toggle the bar that is currently peeling. Fail-closed if docked or no ship lock (rail already hides).

Do not put parts on `.rw-contacts`. Do not put parts on `.rw-edge-arrow`. Do not put parts inside `.rw-reticle`.

### 4. Three (plus) surfaces stay distinct

| Job | Class | Gate |
|---|---|---|
| Nearby ships | `.rw-contacts` | Scanner ≥ 1, not docked (sibling radar) |
| Current lock off-glass | `.rw-edge-arrow` | Core; lockOk |
| Next gate off-glass | `.rw-nav-gate-cue` | NAV-02 plot |
| Lock vitals / parts glance | `.rw-combat-target` | Live ship lock |

Do not merge.

### 5. Security / emit / persist

See contract §5.

No `WORLD_FIELDS` key. No `ctx.emit` addition. No `innerHTML`. No proto merge. No part names from blobs on a new widget. HUD must not write `ctx.world.contacts`. `state.js` unread-for-write.

### 6. Closed HUD / lock / digits

- Do not write `ctx.targets.current` except via existing KeyT/KeyV.
- Do not change HUD-01 rails layout into a hub card. MATCH, lead, RANGE, chart marks, power pips stay out of this serial.
- Digit 0 shipyard. Digit 8/9 papers and dock services stay. Weapon 1–5 stay.
- Cone 12 px stays.

---

## Ownership (later impl)

See contract §7.

`hud.js` owns DOM. `state.js` / `save.js` / `hangar.js` / `station.js` / `reticle-aim.js` / `controls.js` stay untouched unless the owner opens PR3 retarget — and even then Digit 0/8/9 and KeyT/KeyV stay.

Radar sibling owns `.rw-contacts` jump park. Awareness already shipped `.rw-edge-arrow` park/aria and `Incoming fire.` Turrets sibling owns NPC turret SKUs. This serial does not wait on those files.

---

## Serial PR plan (later wave — named only)

Do **not** land these in Wave 99. See contract §8.

Name: **TGT-03 remaining subsystem targeting serial**.

1. **PR1** Peel / facet / no-part-field pins (no UI).
2. **PR2** Optional existing-bar emphasis; no new class on the hub; no ENGINE bar unless owner named it.
3. **PR3** Damage retarget / picker — **fail-closed** until owner numbers.
4. **PR4** Boot / reduced-motion / contrast; hub empty; no `innerHTML`.

If PR1 finds live `applyHit` already correct, and owner numbers stay missing, ship **nothing** or **PR2 only**.

---

## Open owner questions

**Closed Wave 100** ([`docs/OwnerDecisionsWave100.md`](OwnerDecisionsWave100.md)). Owner may override after playtest.

1. Selectable: **engine only**.
2. TRACKED: **KeyK**. Extra Digit: **no**.
3. SKU / UU: **no**.
4. Lock ENGINE bar: **yes** (tgt rail, not hub).
5. Skip shield peel: **no**. After shields, selected engine takes remaining; hull skipped until `engineOut`.

---

## Risks (wishlist regressions)

| Risk | Freeze |
|---|---|
| Hub lock box / part pip | Hub stays empty |
| FTL-style rooms | Four live channels only |
| `lockKind` smash | Object kinds only |
| KeyT/KeyV steal | Untouched |
| Digit 0/8/9 steal | Untouched |
| Invented SKU / UU | Fail-closed; none |
| Peel rewrite | Fail-closed without owner numbers |
| Radar class steal | `.rw-contacts` stays traffic |
| Lock arrow steal | `.rw-edge-arrow` stays lock |
| Aim-glass gauge | No |
| Persist smash | No new WORLD_FIELDS; no contacts write |
| XSS names | `textContent`; no part list from blobs |
| Toast copy collision | Do not touch `Incoming dart.` / `Incoming fire.` |
| Missile gauge reopen | Out |
| WAVE4 / ferry / haul boot | Do not touch |

---

## Acceptance direction (later impl)

Testable later; not this wave.

1. Hub 80 px still empty. No subsystem child inside `.rw-reticle`.
2. Ship lock still paints SCREEN / SHELL / hull / DIST on the right rail. FORE/AFT still hit-flashes from `fromAft`.
3. `applyHit` still peels screen then shell then hull. Aft still pressures engine with live `aftEngineMult` after shields.
4. KeyV cone stays 12 px. KeyT still cycles ships (rocks in group 3). Digit 0/8/9 unchanged.
5. No `lockKind` in `{screen,shell,engine,hull}`. Guns still ignore TGT-05 kinds.
6. No innerHTML. No new `WORLD_FIELDS` key. HUD does not write `world.contacts`. HUD does not write `hullKind`.
7. Without owner numbers, a “part selected” fire still does **not** skip shields.
8. Reduced motion: no new part `@keyframes`. Contrast/colorblind CSS vars still color the bars. FORE/AFT still uses fill vs hollow plus the word.

---

## References

- [`out/w99/subsys/shared-contract.md`](../out/w99/subsys/shared-contract.md)
- [`out/w99/subsys/current-tgt03-subsystem-inventory.md`](../out/w99/subsys/current-tgt03-subsystem-inventory.md)
- [`docs/Tgt03RadarDesign.md`](Tgt03RadarDesign.md) (`.rw-contacts` reuse; do not edit)
- [`docs/Tgt03AwarenessDesign.md`](Tgt03AwarenessDesign.md) (lock arrow + `Incoming fire.`; do not edit)
- [`docs/Hud02IdentitiesDesign.md`](Hud02IdentitiesDesign.md) (HUD never writes `hullKind`; do not edit)
- [`docs/NpcMissilesDesign.md`](NpcMissilesDesign.md) (dart toast; do not edit)
- [`docs/Tgt05LockCatsDesign.md`](Tgt05LockCatsDesign.md) (`lockKind`; do not edit)
