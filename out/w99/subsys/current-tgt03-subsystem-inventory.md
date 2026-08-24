# Wave 99 TGT-03 remaining subsystem targeting inventory

**Wave:** 99. Design only. No `src/` in this worker.  
**Rule:** Code wins over stale comments, over wishlist TGT-03 “subsystem targeting” as if a lock box / hub gauge / FTL-style rooms were missing, and over Wave 98 radar inventory (that pack **out-scoped** subsystem targeting). Cites are live file:line as of this inventory.  
**Scope:** what a later serial may call “subsystem targeting” against **live damage channels**. Prove reuse of existing peel / facet / rails, or prove a picker is absent. Default: **reuse the live peel + FORE/AFT + target rail bars**. Do **not** invent a new damage taxonomy.  
**Not inventory of:** TGT-01 lead, TGT-02 MATCH, TGT-03 radar class (`.rw-contacts` reuse is the sibling), incoming-missile **gauge**, NAV-02 next-gate law, KeyT/KeyV **pick math rewrite**, Digit 0/8/9 papers, power ledger / aim-glass pip, BIO-05, NPC turret SKUs, NPC missile Q1/Q2.

---

## 0. One-line result

**There is no selectable subsystem lock.** `ctx.targets.current` is a whole ship, rock, or TGT-05 `lockKind` object. Combat already peels **screen → shell → hull** and pressures **engine** on **aft** facet hits. The target rail already paints SCREEN / SHELL / HULL. FORE/AFT is a facing glance, not a part picker. “Subsystem targeting” as a **picker** is absent. Reuse of a new SKU / Digit / `lockKind` value is a **lie**. Do **not** invent UU, standing, or a SKU to paper over that absence. Fail-closed: later impl does **not** ship damage retarget until the owner names selectable parts and a control.

---

## 1. Files read

| File | Why |
|---|---|
| `src/game/state.js` | `DEFENSE`, `createShipState`, `applyHit` peel, weapon multipliers (READ-ONLY this wave) |
| `src/systems/combat.js` | Facet from shooter geometry; `applyHit` at NPC / player / mining / impact |
| `src/systems/hud.js` | Target rail, FORE/AFT, empty hub, toasts, `hullKind` **read**, no `innerHTML` |
| `src/ui/hud.css` | 80 px hub, FORE/AFT, rails |
| `src/systems/controls.js` | KeyT cycle, KeyV reticle lock, `TRACKED`, `allowedLockKind` |
| `src/game/reticle-aim.js` | `LOCK_CONE_PX = 12`; `lockKind` wrappers |
| `src/core/ctx.js` | `targets.current`; `world.contacts` = people; persist vs live |
| `src/game/save.js` | `WORLD_FIELDS`; `rimward-save-v1`; vitals clamp; scanner heal |
| `src/game/hangar.js` | Mounted row hull/screen/shell/engine; `engineOut` from fraction |
| `src/systems/station.js` | Digit 0 shipyard; dock Digit 8/9; outfitting 8/9 papers; repair channels |
| `src/game/npc-fire-toast.js` | `Incoming dart.` / `Incoming fire.` (do not rewrite) |
| `src/systems/settings.js` | `rimward-settings-v1` |
| `src/systems/galaxychart.js` | Digit 9 **standing readout** on hover (not a dock bind) |
| `docs/PLAYER-EXPERIENCE-WISHLIST.md` | TGT-03 leftover still names subsystem targeting (read only) |

Grep `innerHTML` in `src/systems/hud.js`: **0 hits**.  
Grep `subsystem` in `src/**/*.js` (game): **0 combat/target hits** (`title.js` comment uses the English word for save banks).  
Grep `Incoming fire.` : **LIVE** `src/game/npc-fire-toast.js`. This serial must not steal or rewrite that copy.

---

## 2. What “subsystem” means against live damage

Live combat does **not** have FTL rooms, weapons banks, oxygen, or a part mesh.

`createShipState` (`state.js` 167–188) already stores four integrity channels:

| Channel | Role | Live behavior |
|---|---|---|
| `screen` / `screenMax` | Outer shield (~40% of class shield) | Peels first. Recharges after `DEFENSE.screenRechargeDelay` |
| `shell` / `shellMax` | Inner shield (remainder) | Peels second. Slower recharge |
| `engine` / `engineMax` | Drive integrity | Damaged on **aft** facet after shields; `engineOut` at `DEFENSE.engineOutAt` 0.3 |
| `hull` / `hullMax` | Structure | Peels last. Disable at 0.15 hull |

`DEFENSE` (`state.js` 150–161): `screenFraction` 0.4, `engineOutAt` 0.3, `aftEngineMult` 2, `disableAtHull` 0.15. These numbers already exist. Later impl must **not** invent a fifth channel.

Repair yard uses the **same four keys**: `REPAIR_RATES = { hull: 0.9, screen: 0.3, shell: 0.5, engine: 0.6 }` (`station.js` 196, 4366–4370). Digit 1 at repair is **Repair all**, not a part picker (`station.js` 5974–5975).

Do **not** invent weapons / life-support / reactor as combat parts. Code already named the taxonomy.

---

## 3. Lock / target current (whole object)

| Surface | Today | Cite |
|---|---|---|
| Bag | `ctx.targets.current` + `reticleScreen` | `ctx.js` 191–195 |
| Writers | `controls.js` cycle / reticle lock; jump clears; npc may clear | `controls.js` 55–83, 214; `jump.js` 87; `npc.js` 2325–2327 |
| KeyT | Cycle in-range ships; rocks only if `weaponGroup === 3` | `controls.js` 55–83, 265–266 |
| KeyV | `tryReticleLock` → `pickReticleLock`; miss does not steal | `controls.js` 199–216, 280–281 |
| Cone | `LOCK_CONE_PX = 12` (pixels, not degrees) | `reticle-aim.js` 15, 321 |
| `lockKind` allowlist | `station` / `gate` / `pod` / `landmark` | `reticle-aim.js` 279–310; `controls.js` 90–93; `hud.js` 364–367 |
| Rock | Asteroid list row; `lockKind === 'rock'` or untagged `{position}` | `controls.js` 96–102; `hud.js` 386–393 |
| Ship lock | Live `ctx.ships` member with `object` / `state`; **no** `lockKind` | `hud.js` 1206–1219 |
| Combat fire | Seeker / guns ignore `lockKind` objects | `combat.js` 1123–1124, 1215–1216 |
| Part field | **None** on `ctx.targets` | `ctx.js` 191–195 |

There is **no** `targets.part`, `targets.subsys`, or `lockKind: 'engine'`. Overloading TGT-05 `lockKind` with a damage channel would smash station/gate/pod/landmark rails.

---

## 4. Combat hit parts (geometry, not a picker)

`applyHit` (`state.js` 195–254):

1. If Unknowable and weapon is not `beam`, return `[]` (no stall of recharge).
2. Peel `screen` while `screen > 0`.
3. Peel `shell` while remaining and `shell > 0`.
4. If remaining: on `facet === 'aft'` and not already `engineOut`, subtract engine damage `remaining * (w.engineMult ?? 1) * DEFENSE.aftEngineMult`; emit `engineOut` at 0.3.
5. Subtract hull with `hullMult`.
6. Disable / destroy from hull fraction.

Call sites always pass **fore/aft from shooter geometry**, not from a player part cursor:

| Call | Facet | Cite |
|---|---|---|
| NPC projectile vs ship | shooter behind target forward → `'aft'` | `combat.js` 1619–1625 |
| Projectile vs player | `fromAft` same test | `combat.js` 1679–1686 |
| Mining beam vs ship | same test | `combat.js` 1448–1451 |
| Body impact / star | `'fore'` | `combat.js` 1735, 1755, 1763 |

Disruptor already biases shields/engines (`shieldMult: 2`, `engineMult: 2`, `hullMult: 0.25`) (`state.js` 119). That is a **weapon family**, not a subsystem lock.

**Live analog of “subsystem targeting”:** fly to the target’s aft hemisphere after shields drop → extra engine pressure. FORE/AFT on the rails tells the player which hemisphere they occupy. There is no button that says “hit engines now” while sitting on the nose.

---

## 5. HUD target card / rails / hub

| Surface | Today | Cite |
|---|---|---|
| Empty hub | 80×80 px reticle; clamp `cx - 44` | `hud.css` 184–191; `hud.js` 1194 |
| No lock box | Target is right rail + world bracket, not a hub card | `hud.js` 846–855, 1206–1219 |
| Self rail | SCREEN / SHELL / hull petals / SPD / WPN | `hud.js` 836–844 |
| Target rail | Name, FORE/AFT, SCREEN, SHELL, hull petals, SPD, DIST | `hud.js` 846–855, 2012–2034 |
| Target ENGINE | **Absent** on tgt rail | same |
| Player ENGINE | Aux Plant panel: OK / DAMAGED / OUT | `hud.js` 883–885, 1769–1774 |
| FORE/AFT | Words + fill vs hollow. `playerHit.fromAft` flash 0.4 s | `hud.js` 326–351, 1131–1133, 1357–1377 |
| Lead / RANGE / MATCH | Core on hub / lamp. TGT-01 / TGT-02 DONE | `hud.js` 732–734, 1344–1354, 1778–1782 |
| Contacts arc | Scanner-gated `.rw-contacts` (sibling radar) | `hud.js` 1379–1383 |
| Off-screen lock | `.rw-edge-arrow` | `hud.js` 735–736 |
| HUD family | **Reads** `player.hullKind`; never writes | `hud.js` 76–85, 1689–1700 |
| `innerHTML` | **none**; `el()` uses `textContent` | `hud.js` 242–247 |
| Toasts | `pushToast` → `slot.el.textContent` | `hud.js` 1096–1115 |

The target “card” is the **HUD-01 right rail**. It already shows three of four channels. Engine on the **lock** is not a bar. Do not steal the 80 px hub for a part pip, lock box, or subsystem gauge.

---

## 6. Digit 0 / 8 / 9 (do not steal)

Live `DOCK_KEY_SERVICES` (`station.js` 186):  
`market, jobs, bar, feed, repair, outfitting, people, launch, epics, shipyard`.

| Digit | Live bind | Cite |
|---|---|---|
| Digit 0 dock level-1 | Last service = **shipyard** | `station.js` 5920–5922 |
| Digit 8 dock level-1 | Index 7 = **launch** | `station.js` 186, 5918–5926 |
| Digit 9 dock level-1 | Index 8 = **epics** (code wins; comment at 1622–1623 says “Standing”) | `station.js` 186, 5918–5926 |
| Outfitting Digit 8 | Launcher papers (`armOutfitPapers` n===8) | `station.js` 1622–1713, 5983–5986 |
| Outfitting Digit 9 | Turret papers (`armOutfitPapers` n===9) | `station.js` 1683–1690, 1699–1702 |
| Outfitting 2 / 4 | Wolfeye Mk I / II (radar sibling) | `station.js` 5977–5980 |
| Flight Digit 1–5 | Weapon groups (TRACKED) | `controls.js` 42–43 |
| Chart Digit 9 | Hover **standing** readout copy, not a dock Digit steal | `galaxychart.js` 29, 389–395 |

A later “subsystem Digit” would smash shipyard, launch, epics, launcher papers, or turret papers. Inventory does **not** free a Digit. Fail-closed: no extra Digit unless the owner names one that is not 0/8/9 and not weapon 1–5.

---

## 7. FORE/AFT, toasts, persist

| Moment | Channel | Cite |
|---|---|---|
| Hull/shield hit on player | FORE/AFT flash 0.4 s from `fromAft` | `hud.js` 1131–1133, 1357–1368 |
| Screen/shell gone (player) | toast `✕ Screen down.` / `✕ Shell down.` | `hud.js` 534–538 |
| Engine out (player / lock) | `✕ Engine out.` / `▲ Their engine is out.` | `hud.js` 540–545 |
| NPC dart vs player | `Incoming dart.` | `npc-fire-toast.js` 7, 46–50 |
| Cannon vs player | `Incoming fire.` | `npc-fire-toast.js` 8, 53–58; `hud.js` 14, 568–573 |
| Incoming missile **gauge** | **Closed** | HUD-01 / sibling radar |
| Persist vitals | Hangar row hull/screen/shell/engine; save clamps to Max | `hangar.js` 665–667; `save.js` 1071 |
| Persist scanner | `WORLD_FIELDS` `'scanner'`; heal 0/1/2 | `save.js` 79, 1079–1082 |
| Persist people | `WORLD_FIELDS` `'contacts'` | `save.js` 80; `ctx.js` 162 |
| Autosave key | `rimward-save-v1` + slots 1..3 | `save.js` 16, 38, 66–67 |
| Settings key | `rimward-settings-v1` | `settings.js` 23 |
| Part cursor persist | **None** | no field |

Do **not** add a WORLD_FIELDS key for a part pick. Picture and peel are live. A persisted “aimed at engines” flag would lie after jump/dock/restore.

---

## 8. KeyT / KeyV / TGT-05 cone / `lockKind`

| Surface | Today | Cite |
|---|---|---|
| TRACKED | W A S D R F Q E T H C X V N; Digit 1–5; Shift; Space | `controls.js` 39–46 |
| KeyT | `pendingTarget` → `cycleTarget` | `controls.js` 265–266 |
| KeyV | `pendingReticleLock` | `controls.js` 280–281 |
| Cone | 12 px around pip if disc miss | `reticle-aim.js` 15, 104–105, 314–321 |
| `lockKind` materialize | station / gate / pod / landmark only | `reticle-aim.js` 279–310 |
| Reserved tokens | `__proto__` / `constructor` / `prototype` | `reticle-aim.js` 268–269; `hud.js` 360–362 |

This serial does **not** rewrite pick math. It does **not** add `lockKind: 'screen'|'shell'|'engine'|'hull'`. KeyT still cycles ships. KeyV still locks the object under the reticle.

No unused letter in TRACKED is “free for subsystems.” Owner must name a control if a picker ever ships. Default: **no new TRACKED key**.

---

## 9. Reuse vs lie

| Idea | Verdict |
|---|---|
| New aim-glass gauge / hub pip / lock box | **Forbidden.** HUD-01 empty 80 px hub is closed. |
| New damage taxonomy (FTL rooms) | **Lie.** Four channels already exist. |
| New `lockKind` for parts | **Lie.** TGT-05 kinds are world objects. |
| Steal KeyT/KeyV | **Forbidden.** Cycle / reticle lock stay. |
| Steal Digit 0/8/9 | **Forbidden.** Shipyard / launch+epics / papers. |
| New SKU / UU / standing | **Not proven.** Picker is absent; that does **not** authorize invented prices. Fail-closed. |
| Reuse `applyHit` peel + aft engine | **True.** Geometry already targets engine after shields. |
| Reuse tgt rail SCREEN/SHELL/HULL | **True.** Picture already exists off the hub. |
| Reuse FORE/AFT as the hemisphere cue | **True.** Not a toast; not a picker. |
| Reuse `.rw-contacts` for parts | **Lie.** That class is nearby ships (radar sibling). |
| Reuse `.rw-edge-arrow` for parts | **Lie.** Current lock off-glass. |
| Persist part cursor | **Lie.** No field; peel is live. |
| `state.js` new table of part HP | **Lie.** `DEFENSE` + ship state already hold the numbers. Later default: **no** `state.js` write. |

---

## 10. Owner numbers that are **missing** (fail-closed)

Do **not** invent these. Later impl does **not** ship damage retarget while they stay unnamed.

1. **Which channels are selectable** (subset of screen / shell / engine / hull, or none).
2. **Control** that is not KeyT, KeyV, Digit 0/8/9, or weapon Digit 1–5.
3. **SKU id and UU cost** if a targeting computer is required (inventory does not prove one).
4. **Whether the lock’s ENGINE becomes a tgt-rail bar** (today it does not).
5. **Whether peel order may skip screen/shell** when a part is “selected” (would change `applyHit`).

Default while unnamed: geometry + existing rails only. No picker. No SKU. No Digit. No hub widget.
