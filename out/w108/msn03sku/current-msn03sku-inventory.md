# Wave 108 MSN-03 remaining unique SKU — live inventory

**Wave:** 108. Markdown only. Code wins.  
**Read:** `src/game/jobs-chains.js`, `src/systems/station.js`, `src/game/weapon-fit.js`, `src/game/hangar.js`, `src/game/save.js`, `src/game/state.js`, `src/systems/hud.js`, `src/ui/hud.css`.  
**Do not edit `src/`.** Line numbers are from this read. Stale Wave 81/103 comments lose.

This leftover is **last-step grants for remaining `EMPLOYER_KEYS`**, not a new Digit, not a new persist key, not unique-four complete, not chain splice.

---

## 1. Employers and grant table

| Surface | Today | Cite |
|---|---|---|
| Employer keys | `freehold`, `redledger`, `veridian`, `hollow` | `jobs-chains.js` 9 |
| Gilded | In `FACTIONS`; **not** in `EMPLOYER_KEYS`; **not** in `EPICS` | `state.js` 591–605, 797–857; `jobs-chains.js` 9 |
| `CHAIN_GRANT` Freehold | `{ id: 'dart', seat: 'missile', slot: 'launcher' }` | `jobs-chains.js` 28–29 |
| `CHAIN_GRANT` Red Ledger | `{ id: 'auto', seat: 'turret', slot: 'turret' }` | `jobs-chains.js` 30 |
| `CHAIN_GRANT` Veridian | **`null`** | `jobs-chains.js` 31 |
| `CHAIN_GRANT` Hollow | **`null`** | `jobs-chains.js` 32 |
| Comment | “dart/auto only when canSeat; Veridian/Hollow none” | `jobs-chains.js` 27 |
| `chainGrantSpec` | string + `Object.hasOwn(CHAIN_GRANT, key)` else `null`; may return `null` for a known key | `jobs-chains.js` 79–82 |
| Origins | freehold / redmarch / veridian / hollowreach | `jobs-chains.js` 12–17; `save.js` 164–169 |
| Dest2 | Freehold→veridian; Ledger→veridian; Veridian→freehold; Hollow→redmarch | `jobs-chains.js` 20–25; `save.js` 170–175 |
| Authored ids | 12 exact `chain-<emp>-<1\|2\|3>` | `jobs-chains.js` 35–42; `save.js` 176–181 |
| `parseChainId` | `isChainId` + split 3 + `Object.hasOwn(CHAIN_ORIGIN)` + step 1\|2\|3 | `jobs-chains.js` 48–57 |

Wave 82 owner table named Freehold `dart` / Red Ledger `auto` / Veridian+Hollow credits +2 (`docs/OwnerDecisionsWave82.md` 101–107). Live table matches. This leftover is the **null** rows.

---

## 2. Last-step path (station)

| Surface | Today | Cite |
|---|---|---|
| Tick | `kind === 'chain'` → `parseChainId` → dock match → `finishChainStep` | `station.js` 4195–4212 |
| Bad id | splice, no pay, no grant | `station.js` 4197–4201 |
| Need | must be `1` | `station.js` 4206 |
| Dock | step 2 dest; else `CHAIN_ORIGIN` | `station.js` 3488–3492, 4204–4208 |
| Steps 1–2 | standing `MINING_REP`; splice; push next; `'commLine'` | `station.js` 3505–3519 |
| Step 3 | `payQuoted` UU; `grantChainSku`; `completeJob` done | `station.js` 3521–3526 |
| `grantChainSku` | `chainGrantSpec` → `mountedClassKey` → `canSeat(classKey, spec.seat)` → `writeMountedGear` | `station.js` 3494–3503 |
| Null spec | **returns false** (Veridian/Hollow today) | `station.js` 3495–3496 |
| `!canSeat` | **returns false** | `station.js` 3498 |
| Launcher write | `{ launcher: spec.id }` **only** (no `missileAmmo`) | `station.js` 3499 |
| Turret write | `{ turret: spec.id }` | `station.js` 3500 |
| Unknown slot | return false | `station.js` 3501 |
| Write verify | **none**. Returns true even if `writeMountedGear` returns null or heal blanks | `station.js` 3499–3502 |
| Fail UU | **none**. No `credits += 2` anywhere under `src/` | grep 0 |
| Success copy | `' Gear seated.'` appended; else empty | `station.js` 3523–3525 |
| Standing | every chain step: employer `MINING_REP` **2** | `station.js` 232, 3508 |
| Pay | `payQuoted` if finite; stamp from `PATROL_REWARD` **300** | `station.js` 205, 3521–3522, 4992–4998 |
| Unique four | **do not** call `grantChainSku` | unique complete vs 3494 |

`credits +2` in Wave 82 is **not** live UU. Live fail-closed is: no SKU, still `payQuoted`, still standing +2, commLine without `Gear seated.`

---

## 3. Live SKUs (reuse is true)

| Id | Table | Seat kind | Shop cost | Extra | Cite |
|---|---|---|---|---|---|
| `dart` | `LAUNCHER_IDS` | `missile` | **6500**; restock **400** / unit **2**; `ammoMax` **8** | name `Dart rack` | `weapon-fit.js` 33–43 |
| `auto` | `TURRET_IDS` | `turret` | **4200**; no magazine | name `Auto turret` | `weapon-fit.js` 46–53 |

No other launcher or turret id. `freezeIds` skips reserved ids and `ID_MAX` 64 (`weapon-fit.js` 9–25, 18–25). `isOwnSku` uses `Object.hasOwn` (`weapon-fit.js` 27–31).

**Reuse is not a lie.** A third SKU id would invent catalog.

Shop Digit 8/9 (outfitting **level 2**, not dock root): dart offer writes `{ launcher: id, missileAmmo: ammoMax }` (`station.js` 1775–1779). Turret offer writes `{ turret: id }` (`station.js` 1819–1822). Chain grant does **not** fill dart ammo.

Shop costs stay shop costs. Do not copy 6500/4200 onto chain pay.

---

## 4. Seating (light starters do not smash)

| `classKey` | missile | turret | Cite |
|---|---|---|---|
| `light` | 0 | 0 | `state.js` 67 |
| `cutter` | 0 | 0 | `state.js` 68 |
| `freighter` | 0 | 0 | `state.js` 69 |
| `heavy` | 2 | 2 | `state.js` 70 |
| `ace` | 2 | 1 | `state.js` 71 |
| `frigate` | 4 | 4 | `state.js` 72 |

`canSeat`: kind must be `'missile'` or `'turret'`; unknown classKey → **light** (`weapon-fit.js` 56–61).

Starter hangar: `classKeyOf(player.classKey)`; fallback **`light`**; `hullKind: 'living'` (`hangar.js` 289–328). Origins do not remount class (`state.js` 742–767). Light living starter: **`canSeat` false** for dart and auto.

Grant on light: live `grantChainSku` false. Heal would also blank: `healLauncher` / `healTurret` return `''` when `!canSeat` (`hangar.js` 56–64).

Seating a remaining SKU **cannot smash a light starter**. Fail-closed already refuses the hardpoint.

---

## 5. Persist (already holds the grant)

| Surface | Today | Cite |
|---|---|---|
| Autosave | `rimward-save-v1` | `save.js` 66 |
| `WORLD_FIELDS` jobs | `'jobs'` | `save.js` 79 |
| Hangar | `'hangar'` | `save.js` 94 |
| Flat mirrors | `'launcher'`, `'missileAmmo'`, `'turret'` | `save.js` 96 |
| New grant key | **none needed** | inventory |
| `writeMountedGear` | allowlisted keys only; unknown ignored; no remount; no combat stats | `hangar.js` 483–525 |
| `JOB_KINDS` | includes `'chain'` | `save.js` 150 |
| Cap | `4 + 14N + 16 + CHAIN_ROOM`; `CHAIN_ROOM` **7** | `save.js` 126–138 |
| Chain sanitize | exact `CHAIN_IDS`; `Object.hasOwn(CHAIN_ORIGIN)` | `save.js` 176–181, 345–349 |
| Unique hide | Digit 2 skip unique DONE; persist keep | `station.js` 3631–3634 |

No new `WORLD_FIELDS` key. Grant is hangar row + world mirrors.

---

## 6. Digit / HUD / DOM

| Surface | Today | Cite |
|---|---|---|
| Dock keys | market, **jobs**, bar, feed, repair, outfitting, people, **launch**, **epics**, **shipyard** | `station.js` 188 |
| Labels | Jobs board; Launch; Standing; Shipyard | `station.js` 5904 |
| Digit 1–9 / 0 | index+1; Digit 0 = last = shipyard | `station.js` 6039–6046, 6084–6092 |
| Digit 2 | Jobs | `DOCK_KEY_SERVICES[1]` |
| Digit 0 | Shipyard | last key + `handleShipyardDigit` 6125 |
| Digit 8 dock root | Launch | index 7 |
| Digit 9 dock root | Standing / epics | index 8 |
| Outfitting 8/9 | launcher / turret papers **level 2** | `station.js` 1633–1634, 1680–1696 |
| `innerHTML` | **none** in `station.js` | grep 0 |
| `h()` | `textContent` | `station.js` 4368–4374 |
| Overlay wipe | `overlay.textContent = ''` | `station.js` 5890, 6022 |
| Empty hub | 80 px `.rw-reticle` | `hud.css` 184–193 |
| RANGE | TGT-01 child | `hud.js` 709–712 |
| HUD `hullKind` | **read** only (`hudFamily`) | `hud.js` 86–87 |
| HUD writes `player.hullKind` | **none** | grep 0 |
| Chain card | `chainCardCopy`; UU last-paper line; no SKU name | `station.js` 5106–5115, 5208–5215 |
| Chain done hide | skip `kind === 'chain' && state === 'done'` | `station.js` 3629 |
| `state.js` | READ-ONLY this leftover | `SHIP_CLASSES` 37–44; `MOUNT_TABLE` 66–73 |

---

## 7. Faction identity (deputize input)

| Employer | Doctrine | Epic / voice | Dest2 |
|---|---|---|---|
| Freehold | 0.4 | Shepherd’s Lane | veridian |
| Red Ledger | 0.7 | Unfinished Column | veridian |
| Veridian Combine | 0.5 | Sixth Berth; hulks/refinery; `jobPayMult` | **freehold** (already `dart`) |
| Hollow Reach | 0.3 | Quiet Beacon; “no ranks to give”; authored-only | **redmarch** (already `auto`) |

`FACTIONS` names: Freehold Compact, Red Ledger, Veridian Combine, Hollow Reach (`state.js` 592–595). EPICS only those four (`state.js` 797–857). Gilded Chain is **not** an MSN-03 employer.

---

## 8. Forbidden grant surfaces (live, do not use)

| Surface | Why | Cite |
|---|---|---|
| `scanner` / `miningLaser` / `concealedMounts` / `cargoCapacity` | BIO/SHP outfitter; `writeMountedGear` would accept if passed | `hangar.js` 494–510; `station.js` 4446–4491 |
| Graft / living hull / train | BIO-05 closed; Digit 0 | hangar graft paths |
| Hull mint | SHP closed | hangar `HANGAR_CAP` |
| Unique four complete | not chains | `completeJob` unique vs `grantChainSku` |
| Shop debit | chain must not charge 6500/4200 | `station.js` 1774–1826 vs 3494 |

---

## 9. Gaps (code vs Wave 82 words)

1. Veridian/Hollow `CHAIN_GRANT` null — leftover.
2. Wave 82 “credits +2 only” is **not** `world.credits += 2`. Live fail is no SKU + `payQuoted` + standing +2.
3. `grantChainSku` can say `Gear seated.` after a blank write.
4. Dart chain grant seats an **empty** rack; shop fills `ammoMax` 8.
5. Gilded has no chain. Do not add one.

---

## 10. Honor (do not break)

- HUD-01 empty 80 px hub. No quest widget.
- Digit 2 Jobs. Digit 0 shipyard. Digit 8/9 stay launch / Standing (dock root).
- `state.js` READ-ONLY later. No new class keys. No new Digit. No `innerHTML`.
- No new `WORLD_FIELDS` unless persist cannot hold the grant (it can).
- Fail-closed unknown employer / `canSeat` false → credits +2 only. Do not mint a hull. Do not ignore `writeMountedGear`.
- BIO-02 kit mutate omit. BIO-05 graft closed. No graft / living hull / scanner / mining head grant.
- Do not reopen chain splice, unique four, family caps, dart/auto shop prices.
- HUD never writes `hullKind`.
