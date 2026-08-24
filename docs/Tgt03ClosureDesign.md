# RIMWARD TGT-03 remaining target closure rate

| Field | Value |
|---|---|
| **Title** | RIMWARD TGT-03 remaining target closure rate |
| **Author** | Wave 101 TGT-03 closure integrator |
| **Date** | 2026-08-23 |
| **Status** | first impl Wave 102 |
| **Wave** | 102 — CLOS on the tgt rail next to DIST. |
| **Owner request** | Remaining TGT-03 after DIST on the combat target rail: **closure rate** (approach / recede) **without** a new aim-glass gauge, **without** stealing HUD-01 empty 80 px hub, **without** a lock box, **without** stealing KeyT/KeyV or Digit 0/8/9, and **without** inventing UU / a SKU unless inventory proves reuse is a lie. |
| **Merge law** | [`out/w101/closure/shared-contract.md`](../out/w101/closure/shared-contract.md). If this brief and that file conflict, the contract wins. |
| **Honor** | HUD-01 empty hub. HUD-02 identities. Live DIST / SCREEN / SHELL / ENGINE / hull / SPD on `.rw-combat-target`. FORE/AFT hit-only. Live `.rw-contacts` Mk II «/» (sibling; do not reuse). Live `.rw-edge-arrow`. Live `.rw-nav-gate-cue`. TGT-01 lead/RANGE DONE. TGT-02 MATCH DONE. TGT-05 `LOCK_CONE_PX = 12` + `lockKind`. KeyT / KeyV stay. KeyK engine-select stays. Digit 0/8/9 stay. **Do not edit** those docs. Code wins where the wishlist still lumps “target distance and closure rate”. |

**Verifier record:**

| Note | Path |
|---|---|
| Inventory (code wins) | [`out/w101/closure/current-tgt03-closure-inventory.md`](../out/w101/closure/current-tgt03-closure-inventory.md) |
| Merge law | [`out/w101/closure/shared-contract.md`](../out/w101/closure/shared-contract.md) |
| Security review | [`out/w101/closure/security-review.md`](../out/w101/closure/security-review.md) |
| Design-doc review | [`out/w101/closure/code-review.md`](../out/w101/closure/code-review.md) |
| UI audit | [`out/w101/closure/ui-audit.md`](../out/w101/closure/ui-audit.md) |

Siblings vsNPC turrets (`docs/NpcTurretsDesign.md`, `npc.js` / `combat.js`) and BIO-02 career (`docs/Bio02CareerDesign.md`) are **other Wave 101 workers**. **Do not edit** those paths, `docs/Tgt03AwarenessDesign.md`, `docs/Tgt03RadarDesign.md`, `docs/Tgt03SubsystemDesign.md`, `docs/OwnerDecisions*.md`, `docs/Tgt05*.md`, `docs/Nav*.md`, `docs/NpcMissilesDesign.md`, `docs/Hud*.md`, `docs/Bio*.md`, `docs/Shp*.md`, the wishlist, or `PROGRESS.md`. Those sibling files need not exist for this brief to stand.

---

## Overview

TGT-03 already shipped the scanner-gated thin bottom bearing arc (`.rw-contacts`). Wave 98 closed `Incoming fire.` and lock park/aria. Wave 99 radar freeze reuses `.rw-contacts`. Wave 100 closed engine-select + ENGINE tgt-rail bar. TGT-01 lead/RANGE is DONE. TGT-02 MATCH is DONE.

Wishlist leftover still names **“target distance and closure rate”** as one bullet. Live code already paints **DIST** on the right combat rail for a live ship lock. Scanner does **not** gate DIST. What is still missing is a **numeric approach/recede rate on that same rail**.

Mk II Wolfeye already paints qualitative «/» on the **contacts lock pip**. That is a sibling. This brief does **not** reuse `.rw-contacts` for core rail closure.

This brief is the integrator document for a **later** implementation wave. Wave 101 lands this markdown only. Bindings do not change here.

HUD-01 empty aim glass stays empty. No lock box. No closure gauge on the 80 px hub. `state.js` stays READ-ONLY. No new SKU. No persist key. Digit 0 stays shipyard. Digit 8/9 stay launch/epics at dock and launcher/turret papers in outfitting. KeyT / KeyV stay. KeyK stays engine-select. Do not invent UU.

Wave 101 deputize (recorded here and in the contract; owner may override after playtest): closure is **core**, not a buy. Picture = tgt rail next to DIST. Fail-closed on non-ship locks. `reducedMotion`: number may stay; no pulse. `textContent` / `el()` only.

---

## Background & Motivation

### Current state (inventory)

Source of truth: [`out/w101/closure/current-tgt03-closure-inventory.md`](../out/w101/closure/current-tgt03-closure-inventory.md). Code wins over stale wishlist TGT-03 “target distance and closure rate”.

| Surface | Today | Cite |
|---|---|---|
| Target rail | Name, FORE/AFT, SCREEN, SHELL, ENGINE, hull, SPD, DIST | `hud.js` 847–857 |
| DIST | Rounded `targetDistNow` + `' u'`. Live ship only | `hud.js` 855–857, 2018–2035 |
| DIST scanner gate | **None.** Core | `hud.js` 1385–1386, 2018 |
| SPD | Scalar `targetVel.length()`, unit `u/s`. **Not** LOS | `hud.js` 300–325, 1261, 2040 |
| ENGINE bar | Live; `is-part` on KeyK | `hud.js` 852, 2041–2045 |
| Rail hide | No ship / destroyed / rock / TGT-05 kinds | `hud.js` 1221–1235 |
| `targetDistNow` | `fromPos.distanceTo(targetPos)` any `lockOk` | `hud.js` 1259–1260 |
| Lead `relVel` | `targetVel - ctx.ship.velocity` | `hud.js` 1285; `ctx.js` 120 |
| Contacts «/» | Mk II lock pip; floor 4 u/s LOS | `hud.js` 75, 811, 1481–1497 |
| Contacts class | `.rw-contacts` / `.rw-contact-close` | `hud.css` 787, 851 |
| Lock off-screen | `.rw-edge-arrow` | `hud.js` 738; `hud.css` 576 |
| NAV-02 cue | `.rw-nav-gate-cue` | `hud.js` 740–744; `hud.css` 1011 |
| Cone / kinds | `LOCK_CONE_PX` 12; station/gate/pod/landmark | `reticle-aim.js` 15, 279–310 |
| Lock bag | `current` + live `part` (engine-select only) | `ctx.js` 193–197 |
| KeyT / KeyV | Cycle / reticle lock. Do not steal | `controls.js` 268–269, 283–284 |
| KeyK / KeyX | Engine-select / MATCH. Do not steal | `controls.js` 280–281, 289–290 |
| RANGE / lead | TGT-01 DONE on hub / pip | `hud.js` 703, 735–737, 1348–1358 |
| MATCH | TGT-02 DONE | `hud.js` 308 |
| Empty hub | 80 px | `hud.css` 184–191; `hud.js` 1198 |
| HUD family | Reads `hullKind`; never writes | `hud.js` 80–87 |
| Persist rate | **None** | `save.js` 76–101 |
| Digit 0 | Shipyard | `station.js` 186, 5920–5922 |
| Digit 8/9 dock | Launch / epics | `station.js` 186, 5918–5926 |
| Digit 8/9 outfit | Launcher / turret papers | `station.js` 1622–1702, 5983–5985 |
| `innerHTML` | **none** in `hud.js` | grep 0 |
| AI close rate | `ENVELOPE_CLOSE_RATE = 40` — **not HUD** | `npc.js` 112 |
| `el()` | `createElement` + `textContent` | `hud.js` 243–248 |
| reducedMotion | Kills HUD anim; setting on ctx | `hud.css` 1181–1184; `ctx.js` 217 |

The player who locks a live ship already reads DIST and SPD. SPD is how fast the lock **moves**, not whether range **shrinks**. Mk II already winks «/» on the **arc** if the player bought Wolfeye 2. Wishlist “closure rate” as a **core rail number** is absent. It is not a missing hub disc.

### Pain points

- A naive later PR that “adds target distance” would double-paint DIST.
- Putting CLOS on the 80 px hub would reopen HUD-01 / HUD-02 and collide with RANGE.
- Reusing `.rw-contacts` or `.rw-contact-close` would steal the radar sibling and scanner-gate a core aid.
- Reusing `.rw-edge-arrow` or `.rw-nav-gate-cue` would mix lock/gate direction with rate.
- Stealing KeyT / KeyV / KeyK / Digit 0/8/9 would smash cycle, lock, engine-select, shipyard, launch, epics, or arms papers.
- Inventing a targeting-computer SKU and UU would impersonate the owner. Inventory proves Wolfeye already exists **for the arc**, and DIST is ungated.
- Showing player SPD or lock SPD in a CLOS slot would lie: magnitude is not `d(dist)/dt`.
- Showing a ship LOS rate on a rock, station, gate, pod, or landmark would lie with ship-relative speed on a parked or unpowered body.
- Persisting last rate in `WORLD_FIELDS` would lie after jump.
- Putting record names into a new widget with `innerHTML` would XSS the HUD.
- Copying NPC `ENVELOPE_CLOSE_RATE = 40` into the HUD would mint a number from the wrong owner.
- A pulsing CLOS animation would fight `reducedMotion`.

### Why now (design) / why not now (code)

The owner asked for an integrator brief so a later serial can land closure without a new glass gauge. Inventory shows DIST **live**, Mk II «/» **live and gated**, rail CLOS **absent**. Merge law can exist without touching `hud.js`. Implementation waits so hub theft, Digit theft, class steal, persist collision, and invented UU are frozen before the first meter row changes. Wave 101 does not ship `src/`.

---

## Goals & Non-Goals

### Goals

1. Document live DIST, SPD, contacts «/», lead `relVel`, Digit 0/8/9, persist, KeyT/KeyV/KeyK, cone/`lockKind`, and empty hub from **live code**.
2. Freeze **reuse** of `.rw-combat-target` next to DIST as the picture. Distinct from `.rw-contacts`, `.rw-edge-arrow`, `.rw-nav-gate-cue`, and the 80 px hub.
3. Freeze closure as **core** (follows DIST). No SKU. No extra Digit. No persist.
4. Freeze fail-closed: no live ship lock / rock / station / gate / pod / landmark → hide or em-dash; never lie with ship-relative speed.
5. Freeze `innerHTML` = 0, `textContent` / `el()` only, `reducedMotion` keeps the number, no new pulse `@keyframes`.
6. Freeze a serial PR plan. This wave writes the brief. A later wave ships serially.

### Non-goals (locked — do not reopen)

- No `src/` or live bindings in Wave 101.
- No aim-glass closure gauge / pip / lock box / RANGE rewrite.
- No improved lead (TGT-01 DONE). No MATCH (TGT-02 DONE).
- No incoming-missile **gauge**. NPC missiles stay toast+song.
- No redesign of `Incoming dart.` or `Incoming fire.`
- No TGT-03 radar class rewrite. Do not reuse `.rw-contacts` or `.rw-contact-close` for rail CLOS.
- No lock-arrow redesign. Do not reuse `.rw-edge-arrow`.
- No NAV-02 steal. Do not reuse `.rw-nav-gate-cue`.
- No subsystem picker rewrite. ENGINE bar / KeyK stay.
- No KeyT / KeyV steal. No cone rewrite. No Digit 0/8/9 steal. No extra closure Digit.
- No power ledger / aim-glass pip (Wave 93/94 out).
- No BIO-05. No NPC turrets vsNPC (sibling Wave 101). No NPC missile Q1/Q2 reopen.
- No UU or standing deltas. No `state.js` weapon retune. No minted SKU.
- Do not edit the wishlist, `PROGRESS.md`, `docs/Tgt03RadarDesign.md`, `docs/Tgt03AwarenessDesign.md`, `docs/Tgt03SubsystemDesign.md`, or sibling design files.
- Do not write `docs/OwnerDecisionsWave101.md`.
- Do not fix known boot FAILs.

---

## Proposed Design

### 1. Merge resolutions (contract wins)

| Question | Integrator freeze | Why |
|---|---|---|
| New persist key? | **No** | Live lock + positions; inventory: none required |
| New `ctx.targets` field? | **No** | Do not add `closure`; `part` is engine-select only |
| New SKU / `state.js` write? | **No** | Core, like DIST. Wolfeye already gates the **arc** |
| Extra Digit / TRACKED key? | **No** | Readout, not a mode |
| Picture? | Tgt rail next to DIST | Owner request; inventory §3 |
| Hub pip / lock box / gauge? | **No** | HUD-01 empty 80 px |
| Label? | `CLOS` | Distinct from DIST and SPD |
| Units? | `u/s` | Copy SPD (`hud.js` 307) |
| Sign? | `along = d(dist)/dt`; negative = approach | Copy exclusive contacts (`hud.js` 1490–1491) |
| Rail format? | XOR: deputize `+N u/s` / `-N u/s` / `0 u/s`. **No** rail «/» | Never `«-12`. Glyph-only override copies `along < -4` / `along > 4` |
| Glyph band if owner picks glyph-only? | Exclusive `<` / `>`; `|along| == 4` → no «/» | Live Mk II (`hud.js` 1490–1491, 75, 1497) |
| Floor 40 from npc.js? | **No** | AI envelope, not HUD |
| Scanner-gate rail CLOS? | **No** | Follows DIST |
| Contacts «/» rewrite? | **No** | Sibling Mk II |
| Traffic CSS class? | Keep `.rw-contacts` | Radar sibling |
| Close CSS class? | Keep `.rw-contact-close` on the **arc** | Do not steal for the rail |
| Lock CSS class? | Keep `.rw-edge-arrow` | Different job |
| Gate CSS class? | Keep `.rw-nav-gate-cue` | Different job |
| New rail class? | `.rw-combat-clos` (or equivalent **rail** class) | Not a contacts/reticle class |
| SPD as CLOS? | **No** | Magnitude ≠ LOS |
| Rock / TGT-05 rate? | **No** | Hide; do not lie |
| Names on CLOS row? | **No** | Authored `+N`/`-N`/`0` + `u/s` only |
| `innerHTML`? | **No** | `textContent` / `el()` / `h()` |
| New `@keyframes`? | **No** | reduced-motion keeps the number |
| HUD-01 hub? | Closed | Empty 80 px; RANGE stays TGT-01 |
| Digit 0 / 8 / 9? | Untouched | Shipyard / launch+epics / papers |
| KeyT / KeyV / KeyK / KeyX? | Untouched | Cycle / lock / engine / MATCH |
| Cone 12 px? | Untouched | TGT-05 |
| `Incoming fire.` / `Incoming dart.`? | Untouched | Live |
| New `ctx.emit` type? | **No** | HUD reads positions |
| UU / standing? | **No** | Do not invent |
| WAVE4 / WAVE26 / WAVE35? | Do not “fix” | Orchestrator law |

### 2. Player outcome (later serial)

Lock a **live ship** with KeyV (or cycle with KeyT). The right rail already shows SCREEN, SHELL, ENGINE, hull, SPD, and DIST. Later, a **CLOS** row next to DIST shows how fast that range shrinks or grows as `+N u/s`, `-N u/s`, or `0 u/s`. No «/» on that row (XOR: sign, not glyph). The aim glass stays empty. RANGE still means weapon envelope. MATCH still means KeyX. Mk II «/» on the bottom arc still requires Wolfeye 2, still only marks the lock pip, and still uses exclusive `along < -4` / `along > 4` (`hud.js` 1490–1491). Rocks, stations, gates, pods, and landmarks do **not** grow a fake ship rate. No new Digit. No buy.

### 3. Picture

See contract §1.1–§2.

Reuse live `.rw-combat-target`. Add one meter sibling of DIST. `el('div', 'rw-label', row, 'CLOS')`. Value via `textContent`. Fail-closed if the rail is already hidden.

Do not put CLOS on `.rw-contacts`. Do not put CLOS on `.rw-edge-arrow`. Do not put CLOS inside `.rw-reticle`.

Later impl must call `measureRails()` so `tgtSize` and bio hair-off stay correct (`hud.js` 860–874, 1329–1345).

### 4. Surfaces stay distinct

| Job | Class | Gate |
|---|---|---|
| Nearby ships | `.rw-contacts` | Scanner ≥ 1, not docked |
| Mk II lock «/» | `.rw-contact-close` | Scanner ≥ 2 |
| Current lock off-glass | `.rw-edge-arrow` | Core; lockOk |
| Next gate off-glass | `.rw-nav-gate-cue` | NAV-02 plot |
| Lock vitals / DIST / CLOS | `.rw-combat-target` | Live ship lock |

Do not merge.

### 5. Security / emit / persist

See contract §5.

No `WORLD_FIELDS` key. No `ctx.emit` addition. No `innerHTML`. No proto merge. No names from blobs on the CLOS row. HUD must not write `ctx.world.contacts`. `state.js` unread-for-write.

### 6. Closed HUD / lock / digits

- Do not write `ctx.targets.current` except via existing KeyT/KeyV.
- Do not change HUD-01 rails into a hub card. MATCH, lead, RANGE, chart marks, power pips stay out of this serial except the one CLOS meter on the tgt rail.
- Digit 0 shipyard. Digit 8/9 papers and dock services stay. Weapon 1–5 stay.
- Cone 12 px stays.

---

## Ownership (later impl)

See contract §7.

`hud.js` owns DOM. Prefer a tiny `losCloseRate` helper so PR1 pins do not need jsdom. `state.js` / `save.js` / `hangar.js` / `station.js` / `reticle-aim.js` / `controls.js` stay untouched. `ship.js` stays unread-for-write of velocity.

Radar sibling owns `.rw-contacts`. Awareness already shipped `.rw-edge-arrow` park/aria and `Incoming fire.` Subsystem already shipped ENGINE + KeyK. Turrets sibling owns vsNPC. This serial does not wait on those files.

---

## Serial PR plan (later wave — named only)

Do **not** land these in Wave 101. See contract §8.

Name: **TGT-03 remaining target closure-rate serial**.

1. **PR1** LOS helper pins (no UI).
2. **PR2** `CLOS` meter on `.rw-combat-target` next to DIST; no hub; no class steal.
3. **PR3** reduced-motion / contrast / no new `@keyframes`; `innerHTML` still 0.
4. **PR4** Boot: hub empty; DIST/RANGE/MATCH/ENGINE/contacts «/» unchanged; no persist key.

---

## Open questions

**Wave 101 deputize** (copy live numbers; owner may override after playtest). Do **not** park the later serial.

1. Core vs SKU? **Core.** No SKU. No Digit. No persist.
2. Picture? **Tgt rail next to DIST.** Deputize `CLOS` + `+N u/s` / `-N u/s` / `0 u/s`. **No** rail «/». Never `«-12`.
3. Sign? Copy contacts `along` (`hud.js` 1490–1491). Negative = approach.
4. Floor / glyph inequalities? Copy `CONTACT_CLOSE_FLOOR = 4` (`hud.js` 75) with **exclusive** `<` / `>` (`hud.js` 1490–1491). `|along| == 4` → no «/» on Mk II. Not NPC 40 (`npc.js` 112).
5. Non-ship? Hide / em-dash. Never player SPD.
6. Scanner-gate rail? **No.**
7. reducedMotion? Number stays. No pulse.
8. Rewrite Mk II arc glyph? **No.**

Do not treat hub gauge, Digit theft, `innerHTML`, new persist key, Key steal, or UU invention as open.

---

## Risks (wishlist regressions)

| Risk | Freeze |
|---|---|
| Hub CLOS / RANGE collision | Hub stays empty of new children |
| Second DIST | DIST stays the distance aid |
| SPD painted as CLOS | Formula is LOS `along`, not `length()` |
| Contacts class steal | `.rw-contacts` / `.rw-contact-close` stay arc |
| Lock / gate cue steal | Classes stay |
| KeyT/KeyV/KeyK steal | Untouched |
| Digit 0/8/9 steal | Untouched |
| Invented SKU / UU | Fail-closed; none |
| Persist smash | No new WORLD_FIELDS |
| XSS names | Numeric `textContent` only |
| Toast copy collision | Do not touch `Incoming dart.` / `Incoming fire.` |
| Missile gauge reopen | Out |
| Lead / MATCH rewrite | Out |
| WAVE4 / ferry / haul boot | Do not touch |

---

## Architecture / ctx ownership

See contract §7.

| Field | Owner | This serial |
|---|---|---|
| `ctx.targets.current` | `controls.js` | Read |
| `ctx.targets.part` | `controls.js` | Untouched |
| `ctx.ship.velocity` | `ship.js` | Read |
| `ctx.world.scanner` | station / save | Read; does not gate rail CLOS |
| `ctx.settings.reducedMotion` | `settings.js` | Read |
| `ctx.flags.docked` | `station.js` | Read only if DIST already cares; do not invent a new park |
| New `ctx.targets.closure` | — | **Forbidden** |
| New emit | — | **Forbidden** |

HUD `update()` already estimates `targetVel` and `relVel` for lead. CLOS may reuse those scratch vectors. No per-frame alloc beyond existing contract (`hud.js` 30–33). Writes stay 5 Hz write-on-change like DIST.

---

## Security

See contract §5 and [`out/w101/closure/security-review.md`](../out/w101/closure/security-review.md).

Threats this brief freezes: `innerHTML`, persist key, Digit theft, proto merge, interpolating `record` into CLOS, indexing `WEAPONS` with a rate string, writing `hullKind` or `world.contacts`.

---

## Acceptance (later impl)

Testable later; not this wave.

1. Hub 80 px still empty of a CLOS child. No closure node inside `.rw-reticle`.
2. Live ship lock still paints SCREEN / SHELL / ENGINE / hull / SPD / DIST. New CLOS sits on that rail next to DIST.
3. Scanner 0: DIST and CLOS still show on a live ship lock. Mk II «/» on the arc still hidden.
4. Rock / station / gate / pod / landmark: no ship LOS rate. Rail stays hidden as today.
5. CLOS never equals lock SPD solely because the ship translates. Deputize paints `+N`/`-N`/`0` with no rail «/». A glyph-only override (owner) must match Mk II: `along < -4` / `along > 4`; at `|along| == 4` show **no** «/».
6. KeyV cone stays 12 px. KeyT still cycles ships (rocks in group 3). KeyK still engine-select. Digit 0/8/9 unchanged.
7. No innerHTML. No new `WORLD_FIELDS` key. HUD does not write `world.contacts`. HUD does not write `hullKind`.
8. Reduced motion: no new CLOS `@keyframes`; number still updates. Contrast/colorblind CSS vars still color the rail. `CLOS` + `+N`/`-N`/`0` + `u/s` carry meaning, not color alone.

---

## Alternatives

| Alternative | Verdict |
|---|---|
| Hub tape / RANGE dual-use | **Reject.** HUD-01 empty 80 px; RANGE is weapon envelope |
| Steal `.rw-contacts` «/» as the only closure aid | **Reject** as the remaining TGT-03 picture. That glyph is Mk II and qualitative. Keep it; add rail number |
| Gate rail CLOS on scanner Mk II | **Reject.** DIST is ungated. Inventory does not prove a SKU |
| New targeting-computer SKU + UU | **Reject.** Reuse-is-a-lie would require DIST to be gated too; it is not |
| Show SPD in the CLOS slot | **Reject.** Lie |
| Off-screen arrow length = rate | **Reject.** Arrow is direction; do not overload |
| Persist last CLOS | **Reject.** Live math |
| Extra Digit / Key | **Reject.** Readout |

---

## Observability

No new `ctx.emit`. Later pins cover `losCloseRate` sign, epsilon, and fail-closed kinds. HUD continues write-on-change (`last.railDist` pattern). Do not log ship names. Do not log credits.

---

## Rollout

Wave 101: this markdown pack only. Later named serial (contract §8) lands `src/` in order PR1→PR4. Do not bundle with vsNPC turrets or career BIO-02. Do not start Vite in the design wave.

---

## References

- [`out/w101/closure/shared-contract.md`](../out/w101/closure/shared-contract.md)
- [`out/w101/closure/current-tgt03-closure-inventory.md`](../out/w101/closure/current-tgt03-closure-inventory.md)
- [`docs/Tgt03RadarDesign.md`](Tgt03RadarDesign.md) (`.rw-contacts` reuse; do not edit)
- [`docs/Tgt03AwarenessDesign.md`](Tgt03AwarenessDesign.md) (lock arrow + `Incoming fire.`; do not edit)
- [`docs/Tgt03SubsystemDesign.md`](Tgt03SubsystemDesign.md) (ENGINE + KeyK; do not edit)
- [`docs/Hud02IdentitiesDesign.md`](Hud02IdentitiesDesign.md) (HUD never writes `hullKind`; do not edit)
- [`docs/Tgt05LockCatsDesign.md`](Tgt05LockCatsDesign.md) (`lockKind`; do not edit)
