# Wave 101 TGT-03 remaining target closure-rate inventory

**Wave:** 101. Design only. No `src/` in this worker.  
**Rule:** Code wins over stale comments, over wishlist TGT-03 “target distance and closure rate” as if both were missing, and over Wave 97–100 inventories (those packs **out-scoped** rail closure). Cites are live file:line as of this inventory.  
**Scope:** prove **DIST is live** on the combat target rail, prove **numeric approach/recede on that rail is absent**, prove Mk II `.rw-contacts` lock-pip «/» is a **scanner-gated sibling** (do not reuse for core rail closure), prove no SKU/Digit/persist is required.  
**Not inventory of:** TGT-01 lead / RANGE rewrite, TGT-02 MATCH rewrite, TGT-03 radar class (`.rw-contacts` jump-park sibling), TGT-03 subsystem picker, TGT-03 awareness toast, incoming-missile **gauge**, NAV-02 next-gate law, KeyT/KeyV **pick math rewrite**, Digit 0/8/9 papers, power ledger / aim-glass pip, BIO-05, NPC turret vsNPC, NPC missile Q1/Q2.

---

## 0. One-line result

**Target distance is live. Target-rail closure rate is not.** `hud.js` paints **DIST** on `.rw-combat-target` for a **live ship lock** and does **not** scanner-gate it. Mk II Wolfeye already paints a qualitative «/» on the **contacts lock pip** when `scanner >= 2`. That glyph is **not** the remaining TGT-03 aid. Reuse of a new SKU / Digit / `WORLD_FIELDS` key / hub gauge for rail closure is a **lie**. Do **not** mint UU. Fail-closed: later impl does **not** invent ship-relative **SPD** as closure, and does **not** show a ship LOS rate on rock / station / gate / pod / landmark locks.

---

## 1. Files read

| File | Why |
|---|---|
| `src/systems/hud.js` | DIST row, SPD, SCREEN/SHELL/ENGINE/hull, contacts «/», lead `relVel`, empty hub, no `innerHTML` |
| `src/ui/hud.css` | 80 px hub, `.rw-combat-target`, `.rw-contacts`, `.rw-contact-close`, `.rw-edge-arrow`, `.rw-nav-gate-cue`, `rw-reduced-motion` |
| `src/core/ctx.js` | `targets` bag; `ship.velocity`; `settings.reducedMotion`; persist vs live |
| `src/systems/controls.js` | KeyT / KeyV / KeyX / KeyK; `TRACKED`; Digit 1–5 weapons |
| `src/game/reticle-aim.js` | `LOCK_CONE_PX = 12`; `lockKind` wrappers |
| `src/game/save.js` | `WORLD_FIELDS`; no closure key |
| `src/systems/station.js` | Digit 0 shipyard; Digit 8/9 dock + papers |
| `src/game/contacts-gate.js` | Scanner heals; arc gate. DIST not in this file |
| `src/systems/npc.js` | `ENVELOPE_CLOSE_RATE` is **AI**, not HUD |
| `src/systems/ship.js` | Owns `ctx.ship.velocity` |
| `src/systems/settings.js` | `reducedMotion` → `body.rw-reduced-motion` |
| `docs/PLAYER-EXPERIENCE-WISHLIST.md` | TGT-03 leftover still names “target distance and closure rate” (read only) |

Grep `innerHTML` in `src/systems/hud.js`: **0 hits**.  
Grep `CLOS` as a HUD label: **absent**.  
Grep wishlist leftover: `docs/PLAYER-EXPERIENCE-WISHLIST.md` ~425.

---

## 2. Wishlist leftover vs live split

Wishlist TGT-03 candidate list still includes one bullet **“target distance and closure rate”** (`PLAYER-EXPERIENCE-WISHLIST.md` 425). Status block (408–418) already records the scanner-gated bearing arc, `Incoming fire.`, radar jump-park, and subsystem ENGINE bar. It does **not** record a tgt-rail closure number.

| Aid | Live? | Gate | Surface |
|---|---|---|---|
| Target **distance** | **YES** | Core. Not scanner | `.rw-combat-target` DIST (`hud.js` 855–857, 2018–2035) |
| Bracket distance string | **YES** | Core on any `lockOk` | `meta` `dist + 'u'` (`hud.js` 1935, 1951, 1963) |
| Target **SPD** | **YES** (scalar speed) | Live ship rail only | `makeSpeed` / `tgtSpeed.set(targetSpeedNow)` (`hud.js` 300–325, 854, 1261, 2040) |
| MATCH lamp | **YES** TGT-02 DONE | Core | `rw-match-lamp` (`hud.js` 308, 318–322) |
| Lead pip + RANGE pop | **YES** TGT-01 DONE | Core. Scanner does not gate | `rw-lead`, `rw-reticle-range` (`hud.js` 703, 735–737, 1278–1304, 1348–1360) |
| Contacts lock «/» | **YES** Mk II | `scanner >= 2` and arc shown | `.rw-contact-close` (`hud.js` 75, 811, 1481–1497) |
| Tgt-rail **CLOS / signed LOS rate** | **NO** | — | Absent next to DIST |

Code wins: “add target distance” would **double-paint DIST**. The remaining brief is **rail closure**, not DIST, not Mk II «/».

---

## 3. Target rail (HUD-01 glance)

Created once (`hud.js` 847–857):

| Child | Label / class | Role |
|---|---|---|
| Name | `.rw-combat-name` | `textContent` name |
| FORE/AFT | `makeFacing` | Hemisphere glance |
| SCREEN | `.rw-screen` | Shield outer |
| SHELL | `.rw-shell` | Shield inner |
| ENGINE | `.rw-engine-tgt` | Wave 100 lock engine bar |
| Hull petals | `makeHull` | Structure |
| SPD | `makeSpeed` | Scalar **speed** of the lock (`targetVel.length()`), unit `u/s` |
| DIST | `.rw-combat-dist` | Rounded world distance + `' u'` |

CSS: `.rw-combat-target` (`hud.css` 901–903) sits 78 px right of center. Rails `min-width: 168px` (`hud.css` 884–895). Init size cache `tgtSize = { width: 168, height: 120 }` (`hud.js` 860); `measureRails()` on resize and name change (`hud.js` 863–874, 2029).

**Show rule** (`hud.js` 1221–1235): `shipTgt` = live ship lock with `state`, not destroyed, with position. Hide for no target, destroyed, **asteroid**, and TGT-05 kinds. Comment: rocks keep the **bracket** ore readout, never ship vitals.

**DIST write** (`hud.js` 2018–2035): only when `last.targetRail && shipTgt && target && target.state`. `distU = Math.round(targetDistNow)`; `tgtDistVal.textContent = distU + ' u'`. Throttled via `TEXT_UPDATE_INTERVAL` 0.2 s and write-on-change (`hud.js` 62, 31–32).

**Scanner does not gate DIST.** Contacts block comment (`hud.js` 1385–1386): “Core ships keep DIST / edge / lead / MATCH. Hide while docked or jumping.” `contactsGate` (`contacts-gate.js` 18–19) gates **the arc only**.

---

## 4. How distance and relative motion are already computed

| Quantity | Live | Cite |
|---|---|---|
| `targetDistNow` | `fromPos.distanceTo(targetPos)` for any `lockOk` | `hud.js` 1259–1260 |
| `fromPos` | `ctx.ship.object.position` else camera | `hud.js` 1218–1219 |
| Target vel estimate | Position delta lerp; clamp `dt` 0.1 s | `hud.js` 1245–1256 |
| `targetSpeedNow` | `shipTgt ? targetVel.length() : 0` | `hud.js` 1261 |
| Lead `relVel` | `targetVel - ctx.ship.velocity` | `hud.js` 1285 |
| Player velocity | `ctx.ship.velocity` Vector3 | `ctx.js` 120; `ship.js` owns |
| Contacts LOS `along` | `contactVel.dot(contactRel) / \|contactRel\|` after subtracting player vel | `hud.js` 1482–1491 |

**SPD is not closure.** SPD is speed magnitude. Closure is signed speed **along the line of sight**. Painting SPD in a CLOS slot would **lie**.

NPC chase uses a **different** floor: `ENVELOPE_CLOSE_RATE = 40` u/s along LOS (`npc.js` 112). Line 111 is `ENVELOPE_CLOSE_DIST = 220`. That rate is AI envelope, **not** a HUD number. Do **not** mint it as a SKU or as the rail deadband. HUD already named `CONTACT_CLOSE_FLOOR = 4` (`hud.js` 75) with **exclusive** `along < -4` / `along > 4` (`hud.js` 1490–1491). At `|along| == 4`, Mk II paints **no** «/».

---

## 5. Contacts Mk II closure glyph (sibling — do not reuse)

| Surface | Today | Cite |
|---|---|---|
| Arc class | `.rw-contacts` | `hud.css` 787–795 |
| Pip close span | `.rw-contact-close` | `hud.css` 851–859; `hud.js` 811 |
| Floor | `CONTACT_CLOSE_FLOOR = 4` u/s along LOS | `hud.js` 75 |
| Gate | lock pip **and** `scanner >= 2` | `hud.js` 1481–1482 |
| Copy | `'«'` approach / `'»'` recede / `''` hide | `hud.js` 1496–1497 |
| Sign / glyph band | `along < -4` → in; `along > 4` → out; **equal 4 is neither** | `hud.js` 1490–1491 |
| Arc hide | docked / jumping / scanner heal 0 | `contacts-gate.js` 8–19; `hud.js` 1388 |
| Mk I | no «/» | `scanner === 1` |
| Enter pulse | `@keyframes rw-contact-enter` 0.45 s | `hud.css` 863–873 |
| reducedMotion | kills enter animation; glyph text stays | `hud.css` 872–873, 1181–1184; `hud.js` 1508 |

This serial **must not** put rail closure on `.rw-contacts` or steal `.rw-contact-close`. Mk II «/» may stay. Rail CLOS is a **second**, core, numeric glance next to DIST.

---

## 6. Lock bag / kinds / cone / keys

| Surface | Today | Cite |
|---|---|---|
| Bag | `current`, `part`, `reticleScreen` | `ctx.js` 193–197 |
| `part` | live `'engine' \| null`; controls.js only; **not** persist | `ctx.js` 29–30, 195 |
| Writers | controls cycle / reticle lock | `controls.js` 268–269, 283–284 |
| KeyT | Cycle | `controls.js` 44, 268–269 |
| KeyV | Reticle lock | `controls.js` 283–284 |
| KeyX | MATCH (TGT-02) | `controls.js` 280–281 |
| KeyK | Engine-select (Wave 100) | `controls.js` 289–290 |
| KeyN | Automine | `controls.js` 286–287 |
| `TRACKED` | includes those keys + Digit 1–5 | `controls.js` 41–48 |
| Cone | `LOCK_CONE_PX = 12` px | `reticle-aim.js` 15, 321 |
| `lockKind` | station / gate / pod / landmark | `reticle-aim.js` 279–310; `hud.js` 367–370 |
| Rock | asteroid list row | `hud.js` 389–396 |
| Ship lock | `ctx.ships` member; **no** `lockKind` | `hud.js` 1214–1216 |
| Closure field | **None** on `ctx.targets` | `ctx.js` 193–197 |

Do **not** add `targets.closure`. Do **not** steal KeyT / KeyV / KeyK / KeyX / Digit 0/8/9.

---

## 7. Empty hub / RANGE / lead (closed glass)

| Surface | Today | Cite |
|---|---|---|
| Hub size | 80×80 px | `hud.css` 184–191 |
| Clamp | `cx - 44` keeps 80 px hub on glass | `hud.js` 1198 |
| RANGE | `.rw-reticle-range` label `RANGE`; shown when `in-range` | `hud.js` 703; `hud.css` 207–218 |
| in-range | live ship + weapon envelope | `hud.js` 1348–1358 |
| Lead | `.rw-lead` + `LEAD` | `hud.js` 735–737 |
| Edge lock | `.rw-edge-arrow` | `hud.js` 738–739; `hud.css` 576–594 |
| Gate cue | `.rw-nav-gate-cue` | `hud.js` 740–744; `hud.css` 1011–1043 |

HUD-01 empty **center** stays empty of new gauges. RANGE is TGT-01 DONE. Do **not** put CLOS inside `.rw-reticle`.

---

## 8. Persist / scanner / digits / SKU

`WORLD_FIELDS` (`save.js` 76–101) includes `scanner`, `contacts` (station **people**, not the HUD arc), `nav`, hangar mirrors. **No** `closure` / `tgtRate` key.

`ctx.world.contacts` is named station NPCs (`ctx.js` 163), persisted via `WORLD_FIELDS` `'contacts'` (`save.js` 80). HUD must not write it.

Scanner ladder is already the Wolfeye buy (outfitting Digit 2 Mk I, Digit 4 Mk II: `station.js` 5978–5980). Inventory does **not** prove a targeting-computer SKU for rail CLOS. DIST is core. Closure **follows DIST** → **core**, not a buy.

| Digit | Live bind | Cite |
|---|---|---|
| Dock Digit 0 | Shipyard (last of `DOCK_KEY_SERVICES`) | `station.js` 186, 5920–5922 |
| Dock Digit 8 | Launch (`DOCK_KEY_SERVICES[7]`) | `station.js` 186, 5918–5926 |
| Dock Digit 9 | Epics (`DOCK_KEY_SERVICES[8]`) | `station.js` 186, 5918–5926 |
| Comment “Digit 9 is Standing” | **STALE** | `station.js` 1623 |
| Outfit Digit 8/9 | Launcher / turret papers | `station.js` 1622–1702, 5983–5985 |
| Weapon Digit 1–5 | `TRACKED` flight | `controls.js` 45 |

Do **not** steal Digit 0/8/9. Do **not** add a closure Digit.

---

## 9. DOM / a11y / motion / XSS posture

| Rule | Live | Cite |
|---|---|---|
| Create | `el()` → `createElement` + `textContent` | `hud.js` 243–248 |
| `innerHTML` in `hud.js` | **0** | grep |
| Names | `stripHudText` then `textContent` | `hud.js` 373–381, 1946–1949, 2028 |
| Toasts | `textContent` | `hud.js` 1116 |
| reducedMotion setting | `ctx.settings.reducedMotion` | `ctx.js` 217; `settings.js` 31, 41, 69 |
| Kill HUD anim | `body.rw-reduced-motion #hud * { animation/transition: none }` | `hud.css` 1181–1184 |
| HUD family | **reads** `hullKind`; never writes | `hud.js` 80–87, 1694 |
| Colorblind / contrast | body classes | `settings.js` 69 |

A later CLOS value is an **authored** `+N u/s` / `-N u/s` / `0 u/s` string (no rail «/»; glyph XOR sign). Do not interpolate `record.name` into the rate row. Do not paint `«-12 u/s`.

---

## 10. Fail-closed lock kinds (picture must not lie)

| Lock | DIST on tgt rail? | Live SPD on tgt rail? | Contacts «/»? | Rail CLOS today |
|---|---|---|---|---|
| Live ship | yes | yes (`targetVel.length()`) | Mk II lock pip only | **absent** |
| Rock | no (rail hidden) | 0 / hidden | no (arc is ships) | **must not fake** |
| Station / gate / pod / landmark | no (rail hidden) | hidden | no | **must not fake** |
| None / destroyed | rail hidden | — | — | hide |

Rocks and TGT-05 kinds still get **bracket** distance (`hud.js` 1932–1963). That is not a vitals rail. Do not park a ship-relative rate on a parked station.

---

## 11. What a naive later PR would smash

- “Add target distance” → second DIST.
- “Show closure on the 80 px hub” → HUD-01 / HUD-02 / RANGE collision.
- “Reuse `.rw-contacts` / `.rw-contact-close`” → steal Mk II / radar sibling.
- “Reuse `.rw-edge-arrow` / `.rw-nav-gate-cue`” → steal lock / gate cues.
- “Bind a Digit / KeyT / KeyV / KeyK” → steal shipyard, papers, cycle, lock, engine-select.
- “Buy a targeting computer” → invented SKU / UU.
- “Persist last rate” → new `WORLD_FIELDS` lie after jump.
- “Use SPD as CLOS” → magnitude is not LOS rate.
- “Copy NPC `ENVELOPE_CLOSE_RATE` 40 into HUD” → wrong owner, wrong floor.
- `innerHTML` of a signed string with a name → XSS.

---

## 12. Deputize numbers copied from live code (not minted)

| Number | Live source | This serial uses it as |
|---|---|---|
| DIST unit `' u'` | `hud.js` 2034 | Keep DIST copy |
| SPD unit `'u/s'` | `hud.js` 307 | CLOS unit |
| Text cadence 0.2 s | `hud.js` 62 | CLOS write-on-change |
| LOS deadband **4** u/s | `hud.js` 75 `CONTACT_CLOSE_FLOOR` | Mk II glyph band. Exclusive `<` / `>` at `hud.js` 1490–1491. **Not** 40 from `npc.js` 112 |
| Sign | `hud.js` 1490–1491 | `along < 0` approach (distance decreasing) |
| Glyph chars | `hud.js` 1497 `'«'` / `'»'` | **Arc Mk II only.** Rail deputize is signed `+N`/`-N`/`0` with **no** «/». New rail class, not `.rw-contact-close` |
| Hub 80 px | `hud.css` 184–191 | Untouched |
| Cone 12 px | `reticle-aim.js` 15 | Untouched |
| Scanner heal `{0,1,2}` | `contacts-gate.js` 8–9 | Untouched; **does not** gate rail CLOS |
