# RIMWARD TGT-03 remaining radar

| Field | Value |
|---|---|
| **Title** | RIMWARD TGT-03 remaining radar |
| **Author** | Wave 98 TGT-03 radar integrator; Wave 99 jump-park impl |
| **Date** | 2026-08-23 |
| **Status** | Wave 99 jump-park impl |
| **Wave** | 99 — jump park (hide `.rw-contacts` while `ctx.gate.jumping`). Reuse `.rw-contacts`. No PPI. |
| **Owner request** | Remaining TGT-03 after Wave 97 closed lock-off-screen reuse and named later `Incoming fire.`: a scanner-gated nearby-traffic picture **without** a new aim-glass gauge, **without** stealing HUD-01 empty 80 px hub, and **without** duplicating the live contacts arc, lock edge-arrow, or NAV-02 gate cue. |
| **Merge law** | [`out/w98/radar/shared-contract.md`](../out/w98/radar/shared-contract.md). If this brief and that file conflict, the contract wins. |
| **Honor** | HUD-01 empty hub. HUD-02 identities. FORE/AFT hit-only. Live `.rw-contacts` scanner-gated thin bottom bearing arc (Wave F). Mk I `U.ENCOUNTER_BUBBLE`. Mk II 2× + lock closure glyph. Shape = friend/foe. Not a reticle ring. Live `.rw-edge-arrow` current-lock off-screen. Live `.rw-nav-gate-cue` NAV-02. TGT-05 `LOCK_CONE_PX = 12` + `lockKind`. KeyT / KeyV stay. NPC darts `Incoming dart.` Sibling `Incoming fire.` for cannon-vs-player. **Do not edit** those docs. Code wins where the wishlist still lists radar as absent. |

**Verifier record:**

| Note | Path |
|---|---|
| Inventory (code wins) | [`out/w98/radar/current-tgt03-radar-inventory.md`](../out/w98/radar/current-tgt03-radar-inventory.md) |
| Merge law | [`out/w98/radar/shared-contract.md`](../out/w98/radar/shared-contract.md) |
| Security review | [`out/w98/radar/security-review.md`](../out/w98/radar/security-review.md) |
| Design-doc review | [`out/w98/radar/code-review.md`](../out/w98/radar/code-review.md) |
| UI audit | [`out/w98/radar/ui-audit.md`](../out/w98/radar/ui-audit.md) |
| Wave 99 probe | [`out/w99/radar/probe.mjs`](../out/w99/radar/probe.mjs) |

Siblings TGT-03 awareness (`out/w98/tgt03/**`, `docs/Tgt03AwarenessDesign.md`) and NPC turrets (`out/w98/turrets/**`) are **other workers**. **Do not edit** those paths, `docs/NpcTurretsDesign.md`, `docs/OwnerDecisions*.md`, `docs/Tgt05*.md`, `docs/Nav*.md`, `docs/NpcMissilesDesign.md`, `docs/Hud*.md`, `docs/Bio*.md`, `docs/Shp*.md`, the wishlist, or `PROGRESS.md`. Those sibling files need not exist for this brief to stand.

---

## Overview

TGT-03 already shipped the scanner-gated thin bottom bearing arc (`.rw-contacts`). Wishlist leftover still names **radar** after Wave 97 closed lock-off-screen reuse and named later `Incoming fire.` Subsystem targeting, improved lead, and missile gauges stay **out**.

Live code already **is** the nearby-traffic picture. Radar is not a second instrument. A later serial may **reuse/extend** `.rw-contacts` under the existing Wolfeye ladder. It must not add a PPI disc on the hub, a new CSS class, or a new SKU.

Wave 99 ships **jump park** only (`contactsGate` + HUD hide). It does not add a PPI, a second class, or a new SKU.

HUD-01 empty aim glass stays empty. No lock box. No incoming gauge. No radar pip on the 80 px hub. `state.js` stays READ-ONLY. Later impl defaults to no `state.js` write. No new radar SKU unless inventory proves reuse of `world.scanner` is a lie — it is not a lie. Digit 0 stays shipyard. Digit 8/9 stay papers. Do not invent UU or standing deltas.

---

## Background & Motivation

### Current state (inventory)

Source of truth: [`out/w98/radar/current-tgt03-radar-inventory.md`](../out/w98/radar/current-tgt03-radar-inventory.md). Code wins over stale wishlist TGT-03 “radar” and over Wave 97 awareness inventory (radar was out of that pack).

| Surface | Today | Cite |
|---|---|---|
| Contacts arc | Scanner-gated `.rw-contacts`. Mk I bubble / Mk II 2× + lock glyph | `hud.js` 53–56, 791–813, 1379–1531 |
| Friend / foe | Shape: tick / chevron / hollow diamond | `hud.js` 354–357; `hud.css` 825–849 |
| Scanner 0 | No arc. Core DIST / edge / lead / MATCH stay | `hud.js` 1379–1383 |
| Scanner persist | `WORLD_FIELDS` `'scanner'`; heal 0/1/2 | `save.js` 79, 1079–1082; `hangar.js` 44–46 |
| Wolfeye buy | Outfitting Digit 2 / Digit 4 | `station.js` 5347–5366 |
| `world.contacts` | Station **people** roster, not the HUD arc | `ctx.js` 162; `save.js` 80 |
| Lock off-screen | **LIVE** `.rw-edge-arrow` (aria + dock/jump park) | `hud.js` 735–736, 1206–1318 |
| NAV-02 cue | **LIVE** `.rw-nav-gate-cue`. Park docked/jumping | `hud.js` 737–741, 1575–1633; `hud.css` 1001–1037 |
| Cone / kinds | `LOCK_CONE_PX` 12; `lockKind` allowlist | `reticle-aim.js` 15, 279–310 |
| KeyT / KeyV | Cycle / reticle lock. Do not steal | `controls.js` 265–266, 280–281 |
| FORE / AFT | Flash on `playerHit.fromAft` 0.4 s. Not a toast | `hud.js` 1131–1133, 1357–1377 |
| Dart toast | `Incoming dart.` on missile+player | `hud.js` 62; `npc-fire-toast.js` 7, 46–50 |
| Cannon toast | **LIVE** `Incoming fire.` — sibling awareness; **not this brief** | `hud.js` 14, 568–573; `npc-fire-toast.js` 8, 53–58 |
| Empty hub | 80 px | `hud.js` 1194 |
| Persist radar snapshot | **None.** Picture is live | inventory §5 |
| Digit 0 | Shipyard | `station.js` 186, 5920–5922 |
| Digit 8/9 | Launch/Standing; outfit launcher/turret | `station.js` 1622–1702 |
| `innerHTML` | **none** in `hud.js` | grep 0 |
| Jumping | Arc parks (`contactsGate`). Scanner value unchanged | `hud.js`; `src/game/contacts-gate.js` |

The player with Wolfeye already sees nearby ships on the bottom arc, including aft. The player without a scanner already has DIST, the lock edge arrow, and lead/MATCH. Wishlist “radar” is a **name**, not a missing disc.

### Pain points

- A naive later PR that “adds radar” would double-paint `.rw-contacts` or steal the 80 px hub for a PPI.
- Merging traffic into `.rw-edge-arrow` would mix **lock** with **crowd**.
- Merging traffic into `.rw-nav-gate-cue` would mix **route** with **crowd**.
- Persisting pips into `WORLD_FIELDS` `'contacts'` would smash the station NPC roster.
- Ungating the arc would steal the Wolfeye buy and lie to starter hulls.
- Putting missiles on the arc would reopen the closed incoming gauge.
- Printing ship names on pips would put record strings on the HUD.
- A new `@keyframes` radar sweep would fight `reducedMotion`.
- Mk III / new SKU would desync `healScanner` (unknown → 0).

### Why now (design) / why not now (code)

The owner asked for an integrator brief so a later serial can add a scanner-gated nearby-traffic picture without a new glass gauge. Inventory already shows that picture. Merge law can exist without touching `hud.js`. Implementation waits so class steal, hub PPI, persist collision, Digit theft, and scanner-ungating are frozen before the first pip changes. Wave 98 does not ship `src/`.

---

## Goals & Non-Goals

### Goals

1. Document live contacts arc, scanner tiers, lock arrow, gate cue, toast channel, persist, and Digit 0/8/9 from **live code**.
2. Freeze **reuse** of `.rw-contacts` as radar. Distinct from `.rw-edge-arrow` and `.rw-nav-gate-cue`. All three may show.
3. Freeze scanner gate: tier 0 = no arc. Mk I / Mk II math stays. No Mk III.
4. Freeze fail-closed: no new widget, no hub PPI, no `world.contacts` write, no pip names, no new SKU.
5. Freeze persist: no new `WORLD_FIELDS` key. Scanner already persists.
6. Freeze a serial PR plan. This wave writes the brief. A later wave ships serially.

### Non-goals (locked — do not reopen)

- No `src/` or live bindings in Wave 98.
- No PPI disc / reticle ring / second contacts class.
- No subsystem targeting. No improved lead (TGT-01 DONE). No MATCH (TGT-02 DONE).
- No incoming-missile **gauge** on the aim glass. NPC missiles stay toast+song.
- No redesign of `Incoming dart.` or sibling `Incoming fire.`
- No NAV-02 next-gate redesign. Do not reuse `.rw-nav-gate-cue` for traffic.
- No lock-arrow redesign. Do not reuse `.rw-edge-arrow` for traffic.
- No KeyT / KeyV steal. No cone rewrite. No Digit 0/8/9 steal. No extra radar Digit.
- No power ledger / aim-glass pip (Wave 93/94 out).
- No BIO-05. No NPC turrets (siblings).
- No UU or standing deltas. No `state.js` weapon or scanner retune.
- Do not edit the wishlist, `PROGRESS.md`, `docs/Tgt03AwarenessDesign.md`, or sibling design files.

---

## Proposed Design

### 1. Merge resolutions (contract wins)

| Question | Integrator freeze | Why |
|---|---|---|
| New persist key? | **No** | Scanner already persists; picture is live |
| Write pips to `world.contacts`? | **No** | That key is station NPCs (`ctx.js` 162) |
| New SKU / `state.js`? | **No** | Radar **is** `world.scanner` + `.rw-contacts` |
| Traffic CSS class? | Keep `.rw-contacts` | Already the picture |
| New `.rw-radar` class? | **No** | Inventory does not prove a new class |
| Hub PPI / reticle ring? | **No** | HUD-01 / Wave F closed |
| Lock CSS class? | Keep `.rw-edge-arrow` | Different job |
| Gate CSS class? | Keep `.rw-nav-gate-cue` | Different job |
| All three at once? | **Yes, may show** | Traffic / lock / route |
| Rocks / gates / missiles on arc? | **No** | Duplicate other surfaces; missile gauge closed |
| Names on pips? | **No** | Shape + closure glyphs only |
| Scanner-ungate? | **No** | Tier 0 = no arc |
| Park arc docked? | **Already** | `hud.js` 1382–1386 |
| Park arc jumping? | **Yes** (Wave 99) | Match NAV-02; do not clear scanner |
| Mk III / Digit for radar? | **No** | Heal 0/1/2; Digit 2/4 already Wolfeye |
| `innerHTML`? | **No** | `textContent` / `el()` / `h()` |
| New `@keyframes` on contacts? | **No** | Live enter pulse only; reduced-motion kills HUD anim |
| Color-only friend/foe? | **No** | Shape remains the cue |
| HUD-01 hub? | Closed | Empty 80 px; no gauge |
| Digit 0 / 8 / 9? | Untouched | Shipyard / papers |
| KeyT / KeyV? | Untouched | Cycle / reticle lock |
| `Incoming fire.` / `Incoming dart.`? | Untouched | Sibling / shipped |
| FORE/AFT on fire? | **No** | Hit-only |
| New `ctx.emit` type? | **No** | Keep `hudMechContact` / `hostileEnter` |
| WAVE4 / WAVE26 / WAVE35? | Do not “fix” | Orchestrator law |

### 2. Player outcome

Buy Wolfeye Mk I at outfitting (Digit 2). Nearby live ships sit on a thin bottom bearing arc. Civilians are ticks. Hostiles are chevrons. The current lock is a hollow diamond. Mk II (Digit 4) lengthens the bubble and adds `«` / `»` on the lock pip. Without a scanner, the arc is absent; DIST, the lock edge arrow, and lead/MATCH still work. A lock that leaves the glass still uses the amber triangle. A plotted gate still uses the NAV-02 chevron. The aim glass stays empty. No PPI disc.

### 3. Nearby-traffic picture

See contract §1.

Reuse live `.rw-contacts`. Scanner-gate as today. Ships only. Fail-closed if scanner is 0, docked, or jumping.

Do not point the arc at unlocked hostiles **instead of** the lock arrow — the arc already marks them when the scanner is on; the arrow is the **current lock** only.

### 4. Three surfaces stay three

See contract §1.1, §2, §3.

| Job | Class | Gate |
|---|---|---|
| Nearby ships | `.rw-contacts` | Scanner ≥ 1, not docked, not jumping |
| Current lock off-glass | `.rw-edge-arrow` | Core; lockOk |
| Next gate off-glass | `.rw-nav-gate-cue` | NAV-02 plot; not docked/jumping |

Do not merge.

### 5. Security / emit / persist

See contract §5.

No `WORLD_FIELDS` key. No `ctx.emit` addition. No `innerHTML`. No proto merge. No pip names. HUD must not write `ctx.world.contacts`. Scanner heal stays 0/1/2.

### 6. Closed HUD / lock / digits

- Do not write `ctx.targets.current` except via existing KeyT/KeyV.
- Do not change HUD-01 rails, MATCH, lead, RANGE, chart marks, power pips.
- Digit 0 shipyard. Digit 8/9 papers. Outfitting 2/4 stay Wolfeye. Weapon 1–5 stay.
- Cone 12 px stays.

---

## Ownership (later impl)

See contract §7.

Wave 99 added `contactsGate(scanner, docked, jumping)` in `src/game/contacts-gate.js`. `hud.js` owns DOM. `state.js` / `save.js` / `hangar.js` / `station.js` / `reticle-aim.js` / `controls.js` stay untouched.

Awareness sibling owns `.rw-edge-arrow` park/aria and `Incoming fire.` Turrets sibling owns NPC turret SKUs. This serial does not wait on those files.

---

## Serial PR plan (later wave — named only)

Do **not** land these in Wave 98. See contract §8.

1. **PR1** Scanner-gate / range / cap / kind pins (no UI).
2. **PR2** Jump park hide; no new class; no PPI; no extra entity kinds.
3. **PR3** Three classes still distinct; no pip names; no `world.contacts` write.
4. **PR4** Boot / reduced-motion / contrast; no new `@keyframes`; hub empty.

PR1 already matched live `hud.js`. Wave 99 shipped **PR2 jump park** only.

---

## Open owner questions

Defaults are in the contract. Inventory froze them. Do not invent SKUs while waiting.

1. **New `.rw-radar` class?** Live class already is the traffic picture.  
   **Default: keep `.rw-contacts`.**

2. **Hub PPI anyway?** HUD-01 empty 80 px and Wave F already closed the disc.  
   **Default: no.**

3. **Mk III / new SKU?** Heal allowlist is 0/1/2.  
   **Default: no.**

4. **Put rocks or missiles on the arc?** Would duplicate mining locks / closed missile gauge.  
   **Default: no.**

Do not treat class steal, glass gauge, Digit theft, `innerHTML`, a second persist key, `world.contacts` smash, or scanner-ungating as open.

---

## Risks (wishlist regressions)

| Risk | Freeze |
|---|---|
| Second contacts widget | Reuse `.rw-contacts` only |
| Hub PPI / radar pip | Hub stays empty |
| Gate cue stolen | Class stay `.rw-nav-gate-cue` |
| Lock arrow stolen | Class stay `.rw-edge-arrow` |
| Three jobs one glyph | Different classes; all may show |
| Aim-glass gauge | No; radar is the bottom arc |
| Persist smash people roster | Never write `world.contacts` from HUD |
| Starter hull fake radar | Tier 0 = no arc |
| Mk III desync heal | No new SKU |
| XSS names on pips | No names; `textContent` glyphs only |
| Toast copy collision | Do not touch `Incoming dart.` / `Incoming fire.` |
| Digit 0/8/9 steal | Untouched |
| KeyV cone change | Do not rewrite pick math |
| Missile gauge reopen | Out |
| WAVE4 / ferry / haul boot | Do not touch |

---

## Acceptance direction (later impl)

Testable later; not this wave.

1. Scanner 0: `.rw-contacts` hidden. DIST / edge arrow / lead still work.
2. Mk I: ships inside `U.ENCOUNTER_BUBBLE` on the bottom arc, cap 16. Shape = friend/foe. Not a reticle ring.
3. Mk II: 2× bubble, cap 24, lock pip may show `«` / `»`.
4. `.rw-edge-arrow` never receives traffic duty. `.rw-nav-gate-cue` never receives traffic duty. All three may be visible together.
5. KeyV cone stays 12 px. KeyT still cycles ships (rocks in group 3). Digit 0/8/9 unchanged. Outfitting 2/4 still Wolfeye.
6. No PPI on the hub. No innerHTML. No new `WORLD_FIELDS` key. HUD does not write `world.contacts`.
7. Docked: arc hidden. Jumping also hides the arc. Scanner value unchanged.
8. Reduced motion: no new contacts `@keyframes`. Contrast/colorblind CSS vars still color the marks. Shape still carries friend/foe.

---

## References

- [`out/w98/radar/shared-contract.md`](../out/w98/radar/shared-contract.md)
- [`out/w98/radar/current-tgt03-radar-inventory.md`](../out/w98/radar/current-tgt03-radar-inventory.md)
- [`docs/Tgt03AwarenessDesign.md`](Tgt03AwarenessDesign.md) (lock arrow + `Incoming fire.`; do not edit)
- [`docs/Hud02IdentitiesDesign.md`](Hud02IdentitiesDesign.md) (contacts arc already scanner-gated; do not edit)
- [`docs/Nav02GuidanceDesign.md`](Nav02GuidanceDesign.md) (gate cue; do not edit)
- [`docs/NpcMissilesDesign.md`](NpcMissilesDesign.md) (dart toast; do not edit)
- [`docs/Tgt05LockCatsDesign.md`](Tgt05LockCatsDesign.md) (`lockKind`; do not edit)
