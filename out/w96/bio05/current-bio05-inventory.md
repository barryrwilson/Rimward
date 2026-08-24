# Wave 96 BIO-05 live inventory (Abominations remaining)

**Wave:** 96. Design only. No `src/` in this worker.  
**Rule:** Code wins over stale comments, over `docs/BioLivingShipsDesign.md` §7 “later” lines, and over wishlist BIO-05 as if grafts were absent. Cites are live file:line as of this inventory.  
**Scope:** remaining BIO-05 Abominations — Gilded graft sale, ownership hostility, destroy-Abomination Beautiful bonus, HUD family, Digit 5 grafted path, NPC grafted look.  
**Not inventory of:** BIO-01 gift/pirate, BIO-02 train dests, BIO-03 bake, BIO-04 psionic numbers, NAV-04, police leave, Unknowables dock, power ledger, aim-glass gauge.

---

## 0. One-line result

The **player** Abomination loop is **LIVE** (Wave 72 graft + Wave 82 4000 UU and destroy +5). Remaining BIO-05 is **not** a re-design of grafts. Leftovers are **NPC grafted traffic** (absent) and **visual tissue overlay** on plated player meshes (absent). Do not reopen Gilded papers, UU, or standing deltas.

---

## 1. Files read

| File | Why |
|---|---|
| `src/game/hangar.js` | `grafted` allowlist, `graftMounted`, standing cap, sanitize |
| `src/game/shipyard.js` | `GRAFT_LIST_UU = 4000` |
| `src/systems/shipyard-desk.js` | Gilded two-step papers, warn copy, refuse lines |
| `src/systems/station.js` | Digit 0 shipyard, Digit 9 graft notes, `h()` `textContent` |
| `src/game/save.js` | `WORLD_FIELDS.hangar`, snapshot/restore sanitize |
| `src/game/kill-standing.js` | Destroy-Abomination +5, recap via hangar cap |
| `src/systems/npc.js` | Kill bind; spawn mesh; **no** `grafted` |
| `src/systems/hud.js` | Family reads `hullKind`; Digit 5 WPN; never writes kind |
| `src/game/psionic.js` | Digit 5 living / unset / own-key grafted |
| `src/systems/combat.js` | Digit 5 fire; Unknowables skip; NPC never fires psionic |
| `src/systems/ship.js` | `makeLivingHull` vs plated built; HUD family source |
| `src/game/state.js` | `createShipState` (no `grafted`); `applyHit` Unknowable miss |
| `src/core/ctx.js` | SHP owns `hullKind`; hangar on world |
| `src/systems/organic.js` | `isBeautiful` faction art only |
| `docs/OwnerDecisionsWave82.md` | Graft 4000 UU; destroy +5; NPC Abomination spawns later |
| `docs/PLAYER-EXPERIENCE-WISHLIST.md` | BIO-05 1204–1216 (read only) |
| `docs/BioLivingShipsDesign.md` | Honor Abomination = `built` + `grafted` (do not edit) |

Grep `grafted` in `src/systems/npc.js` and `src/systems/traffic.js`: **0 hits**.

---

## 2. What an Abomination is (live)

| Surface | Today | Cite |
|---|---|---|
| Definition | Built hangar row with own-key `grafted === true`. `hullKind` stays `'built'` | `hangar.js` 105–110, 743–775 |
| Living rows | Sanitize **deletes** `grafted` | `hangar.js` 108 |
| Unknowables | Force `hullKind: 'living'` and **delete** `grafted` | `hangar.js` 98–102, 109 |
| Player mirror | `copyGraftedFromRow` / `healPlayerGrafted` | `hangar.js` 112–121, 673, 445 |
| Own-key test | `hasOwnProperty` + `=== true` (not proto, not `'true'`) | `hangar.js` 94–96 |
| HUD family | Grafted built → **`mech`**. HUD does not read `grafted` | `hud.js` 76–85 |
| Mesh | Built → plated `buildBuiltVisual`. Living / unset → `makeLivingHull` | `ship.js` 535–560, 274 |

`isBeautiful(player.faction)` is **not** the Abomination test (`organic.js` 67–69).

---

## 3. Graft helpers (player sale) — DONE

| Surface | Today | Cite |
|---|---|---|
| Price | `GRAFT_LIST_UU = 4000` | `shipyard.js` 25–26 |
| Helper | `graftMounted(ctx)` | `hangar.js` 743–775 |
| Gates | Docked; not combat/jump/destroyed/paused; **Gilded** banner; Gilded `rep >= 0`; mounted row exists; not Unknowables; `hullKind === 'built'`; not already grafted; integer price; enough credits | `hangar.js` 745–769 |
| Write | `row.grafted = true`; copy to player; debit; `applyAbominationStanding`; **no remount** | `hangar.js` 770–775 |
| Already | `{ ok: false, reason: 'already' }` | `hangar.js` 761 |
| Living / Unk | `{ ok: false, reason: 'living' }` | `hangar.js` 757–760 |
| Short UU | `{ ok: false, reason: 'credits' }` — **no flag** | `hangar.js` 762–768 |
| Hangar cap | Graft does **not** add a row. `HANGAR_CAP` 8 is buy/grant law | `hangar.js` 27, 200–206 |
| Train refuse | Grafted built trains as living-refuse | `hangar.js` 802 |

UI hide is not authorization. `graftMounted` re-checks every gate.

---

## 4. Gilded desk copy — DONE

| Surface | Today | Cite |
|---|---|---|
| Offer visible | Gilded dock; Gilded `rep >= 0`; mounted **built**; not Unknowables; not already grafted | `shipyard-desk.js` 190–198 |
| Offer card | `'Graft tissue'` / `` `${GRAFT_LIST_UU} UU · Mounted plated hull.` `` / `'Offer graft'` | `shipyard-desk.js` 411–418 |
| Confirm papers | `'Graft tissue'` / 4000 UU · warn / `'Confirm graft'` / `'Esc — Cancel'` | `shipyard-desk.js` 360–374 |
| Warn | `'Beautiful Ones become immediate enemies. Patrols hunt at standing -10 or worse.'` | `shipyard-desk.js` 67–68 |
| Reduced motion | `'Beautiful Ones become enemies.'` | `shipyard-desk.js` 69, 361–365 |
| Success | `'Tissue sealed to the hull.'` + `requestAutosave` | `shipyard-desk.js` 288–290 |
| Refuse map | dock/combat/jump/destroyed/paused/missing/living/already/banner/reputation/credits/busy | `shipyard-desk.js` 52–65 |
| Arm | `ui.graftPending` only. Esc/`cancelGraftPending` clears; **no write** | `shipyard-desk.js` 121–126, 201–205 |
| Digit panes | 1 Hangar, 2 Yard. Digits 3+ / 0 index hulls. Graft is **click Offer**, not a stolen Digit | `shipyard-desk.js` 18–20, 148–151, 464–496 |
| `innerHTML` | **none** in `shipyard-desk.js` | grep 0 |
| Host `h()` | `textContent` | `station.js` 4302–4307 |

Digit 9 standing notes also name the cap (`station.js` 1157, 1178).

---

## 5. Standing cap (own tissue) — DONE

| Surface | Today | Cite |
|---|---|---|
| Patrol floor | `HOSTILE_STANDING = -10` (local; same value as `npc.js` 92) | `hangar.js` 123–124 |
| Any graft | `anyGrafted` walks sanitized hangar rows | `hangar.js` 141–148 |
| Cap | `beautiful = min(current, HOSTILE_STANDING)` while any grafted row | `hangar.js` 151–167 |
| Create key | Missing bag / missing `beautiful` still writes if `FACTIONS` owns the key | `hangar.js` 157–166 |
| Proto | `RESERVED_IDS` skip | `hangar.js` 30–34, 162 |
| Call sites | Sanitize, starter rewrite, load/switch, `applyMountedFlight`, `graftMounted`, kill helper | `hangar.js` 366–394, 677, 724, 739, 774; `kill-standing.js` 172 |
| Strip last graft | **No auto-heal.** Cap simply stops applying when `anyGrafted` is false | `hangar.js` 152–153 |
| Ungraft SKU | **Absent** | grep `graftMounted` is the only writer |

Wishlist “immediate enemy standing while tissue is owned” is this invariant, not a one-shot −10 that then drifts up.

---

## 6. Persist sanitize — DONE

| Surface | Today | Cite |
|---|---|---|
| Persist key | `WORLD_FIELDS` includes `'hangar'` only. **No** `grafted` world key | `save.js` 76–101, 94 |
| Autosave | `localStorage` `'rimward-save-v1'` | `save.js` 16, 66 |
| Snapshot | `sanitizeHangar` then copy allowlisted world keys | `save.js` 951–957 |
| Restore | Omit hangar → delete; then `sanitizeHangar`; `healPlayerHullKind`; `syncMountedToPlayer`; `applyMountedFlight` | `save.js` 1168, 1216–1221 |
| Row healer | Allowlist fields; `hullKind` `'living'`\|`'built'`; then `applyGraftedAllowlist` | `hangar.js` 223–252 |
| Living drop | Tamper `'grafted': true` on living → flag gone | `hangar.js` 108 |
| Unknowables drop | Same | `hangar.js` 98–102 |
| Proto ids | `SAFE_ID` + `RESERVED_IDS`; bad id → `null` row | `hangar.js` 175–178, 226–227; `save.js` 104 |
| Merge | Healer **builds** a new object. No `for…in` merge of the raw blob onto a row | `hangar.js` 235–252 |
| Player restore | `Object.assign(ctx.player, snap.player)` then hangar heal wins | `save.js` 1203, 1216–1221 |

`grafted` rides the hangar row (and the mounted player copy). No new `localStorage` key.

---

## 7. Destroy-Abomination Beautiful bonus — DONE (helper); NPC victims absent

| Surface | Today | Cite |
|---|---|---|
| Constants | `KILL_STANDING_DELTA = -5`; `ABOMINATION_DESTROY_BEAUTIFUL_DELTA = 5` | `kill-standing.js` 6–9 |
| Owner line | +5 Beautiful when kill helper already runs **and** victim `grafted: true`; Beautiful victim → **only** −5, no double | `docs/OwnerDecisionsWave82.md` 45–49 |
| Bind | One call after `npcDestroyed` | `npc.js` 2181 |
| Gates | Player last attacker; civilian/patrol role; faction in `FACTIONS`; not pirate/ace/independent/reserved | `kill-standing.js` 128–166 |
| Victim graft | Own-key `grafted === true` on `ship.state`, `ship.player`, or hangar hulls | `kill-standing.js` 42–72 |
| Bonus | `bag.beautiful += 5` unless victim faction is `'beautiful'` | `kill-standing.js` 75–78, 169–171 |
| Recap | Always `applyAbominationStanding(ctx)` after the write | `kill-standing.js` 172 |
| Recap while player wears tissue | +5 then `min(current, −10)` → Beautiful stays ≤ −10 | `hangar.js` 151–167 |
| Emit | `commLine` `{ text }` primitives; faction **name** from `FACTIONS` | `kill-standing.js` 112–120, 173 |
| NPC spawn `grafted` | **Absent.** `createShipState` does not copy `grafted` | `state.js` 167–188; `npc.js` 262–283 |
| `npc.js` / `traffic.js` | No `grafted` token | grep 0 |

So: destroy +5 is **named and coded**. It does not fire on live traffic until a later serial writes NPC `grafted`. Owner Wave 82: “NPC Abomination spawns stay later.”

---

## 8. HUD family — DONE (read only)

| Surface | Today | Cite |
|---|---|---|
| Family | `built` → mech; `living` → bio; else bio (after optional session override) | `hud.js` 76–85 |
| Cache | `last.kind = player.hullKind` is a **read** | `hud.js` 1052, 1674 |
| Write `hullKind` | **none** in `hud.js` | grep 4 reads, 0 assigns |
| `el()` | `textContent` | `hud.js` 239–244 |
| `innerHTML` | **none** in `hud.js` | grep 0 |
| Digit 5 WPN | Ineligible / missing catalog → `'5 · —'`; else `'5 · ' + name` | `hud.js` 222–224 |
| Eligibility | `canFirePsionic` — **not** HUD family | `hud.js` 223; `psionic.js` 27–32 |

Grafted built stays **mech** and **may** fire Digit 5.

---

## 9. BIO-04 Digit 5 grafted path — DONE (do not retune)

| Surface | Today | Cite |
|---|---|---|
| Helper | Built → own-key grafted; else **true** (living **or unset** `hullKind`) | `psionic.js` 8–9, 27–32 |
| Catalog | `WEAPONS.psionic` heat + `powerPerShot` | `state.js` 140–144 |
| Combat | Digit 5 dry if `!canFirePsionic`; no spawn/heat/emit | `combat.js` 1813–1815 |
| NPC fire | `spawnNpcShot` **returns** on psionic | `combat.js` 1302 |
| Unknowables miss | Projectile skip + `applyHit` empty unless `beam === true` | `combat.js` 1544; `state.js` 197–199 |
| Group 5 | `psionicCatalogOk() ? 'psionic' : null` | `combat.js` 242; `hud.js` 207 |

Do not invent new Digit 5 numbers in BIO-05.

---

## 10. Digit 0 shipyard — DONE (do not steal)

| Surface | Today | Cite |
|---|---|---|
| Dock services | Last key `'shipyard'`; Digit 0 selects it | `station.js` 186, 5801–5804, 5920–5922 |
| Yard Digit 0 | Hangar **row 8** (index 7) | `shipyard-desk.js` 148–151 |
| Graft Digit | **None.** Offer is Hangar-pane button | `shipyard-desk.js` 411–418 |

---

## 11. NPC grafted look — ABSENT (remaining)

| Surface | Today | Cite |
|---|---|---|
| Spawn mesh | `buildShipMesh(class, faction, role)` GLB/asset. No graft overlay | `npc.js` 171–172, 274 |
| Player built | `buildBuiltVisual` plated; **not** `makeLivingHull` | `ship.js` 535–560 |
| Player living quality bar | `makeLivingHull` CPU swim / breath / veins | `ship.js` 274 |
| Hangar card | Name + class · faction · mounted. **No** “grafted” word | `shipyard-desk.js` 397–403 |
| World traffic Abominations | **None** | grep 0 in `npc.js`, `traffic.js` |

---

## 12. Fail-closed matrix (live)

| Case | Result |
|---|---|
| Hangar full | N/A for graft (no new row). Buy still `'The hangar is full.'` |
| Already grafted | Desk hides offer; helper `'already'` |
| Living mounted | Hide + `'Grafts fit plated hulls only.'` |
| Unknowables | Hide + living refuse; sanitize drops flag |
| Gilded hostile | Hide + `'No sale.'` |
| Wrong banner | Hide + `'The Chain does not graft here.'` |
| Short credits | Offer may show; confirm `'Not enough credits.'`; no flag |
| Esc / cancel | No `grafted`, no debit, no standing write |
| Tamper living grafted | Flag dropped; cap may lift if no other grafted row |
| Tamper built grafted | Flag kept; cap applies |
| Kill +5 while player grafted | +5 then recap ≤ −10 |
| Beautiful victim grafted | Kill −5 only; no +5 |

---

## 13. DONE vs remaining

| Wishlist / Wave 72 / 82 beat | Status |
|---|---|
| Gilded sells grafts (4000 UU, two-step warn) | **DONE** |
| Conventional hull → Abomination (`built` + `grafted`) | **DONE** |
| Beautiful immediate enemies while any grafted hangar row | **DONE** (`min(current, −10)`) |
| Destroy Abomination → Beautiful +5 (recap −10 if player still owns tissue) | **DONE** (helper; NPC victims not spawned) |
| Digit 0 shipyard | **DONE** |
| HUD grafted = mech; HUD never writes `hullKind` | **DONE** |
| Digit 5 living / unset / grafted; Unknowables miss | **DONE** |
| Living / Unknowables refuse graft | **DONE** |
| Persist `grafted` on hangar row; no new world key | **DONE** |
| NPC Abomination traffic / grafted plated meshes in the world | **OPEN** |
| Visual grafted tissue on **player** built mesh | **OPEN** (plated today) |
| Hangar-row “grafted” badge | **OPEN** (not required for the loop) |
| Ungraft / sell tissue SKU | **ABSENT** (not a wishlist beat; do not invent) |

`docs/BioLivingShipsDesign.md` §7 still says NPC destroy standing is later. **Code wins:** Wave 82 shipped `ABOMINATION_DESTROY_BEAUTIFUL_DELTA`. Honor the Abomination **shape**; do not edit that file; do not invent a second delta.

---

## 14. Owner numbers (do not re-author)

From `docs/OwnerDecisionsWave82.md` only:

- `GRAFT_LIST_UU = 4000`
- `HOSTILE_STANDING = -10` (ownership cap)
- `KILL_STANDING_DELTA = -5`
- `ABOMINATION_DESTROY_BEAUTIFUL_DELTA = +5`
- NPC Abomination **spawns** stay later

No further UU or standing integers in this wave.
