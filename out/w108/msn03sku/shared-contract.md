# MSN-03 remaining unique SKU shared contract

**Wave:** 108. Design only. No SKU feature ships in this wave.  
**Status:** MERGE LAW for `docs/Msn03UniqueSkuDesign.md`. If that brief and this file ever disagree, **this file wins**.  
**Not this wave:** any edit under `src/`, `scripts/`, `public/`, `index.html`, `package.json`, Vite. Do not edit `docs/PLAYER-EXPERIENCE-WISHLIST.md`, `PROGRESS.md`, `docs/Msn03ChainsDesign.md`, `docs/Msn03UniqueDoneDesign.md`, `docs/Msn02*.md`, `docs/MsnMissionsDesign.md`, `docs/Bio*.md`, `docs/Rep*.md`, `docs/Shp*.md`, `docs/Hud*.md`, `docs/Nav*.md`, `docs/Tgt*.md`, `docs/OwnerDecisions*.md`. Do not write `docs/OwnerDecisionsWave108.md`.  
**Locked sources:** wishlist MSN-03 (`docs/PLAYER-EXPERIENCE-WISHLIST.md` 808–820: rare/unique equipment from authored faction chains, not the procedural pool); Wave 82 owner table (`docs/OwnerDecisionsWave82.md` 101–107, READ; this leftover **names** the remaining two); live inventory `out/w108/msn03sku/current-msn03sku-inventory.md` (code wins); live `CHAIN_GRANT` / `grantChainSku` / hangar mirrors.

Integrator rule: a **later** implementation wave obeys this file. Inventory cites live code. Code wins over stale Wave 81 “fail-closed until owner names SKUs” copy. Chains already shipped Wave 83. Unique DONE hide shipped Wave 104. This leftover is **last-step grants for remaining employers**.

---

## 0. Orchestrator merge law (do not weaken)

1. This worker is **markdown only**. No `src/`. Later impl is **serial**. Serial PR plan is **named only**. Do **not** land these PRs in `src/` in this worker.
2. HUD-01 empty **80 px hub**. No quest widget, SKU pip, or chain meter on the aim glass. RANGE stays TGT-01 (`hud.js` 709–712; `hud.css` 184–193). **Do not** put Jobs chrome inside `.rw-reticle`.
3. Digit **2** stays **Jobs** (`DOCK_KEY_SERVICES[1]`, `station.js` 188, 5904, 6039–6046). Digit **0** stays **shipyard**. Digit **8** dock root stays **launch**. Digit **9** dock root stays **epics** / Standing. Outfitting Digit 8/9 stay launcher / turret **papers** on level 2. First remaining serial **must not steal** Digit 0/8/9. **No new Digit.** Grant is not a dock verb.
4. `innerHTML` forbidden later. `textContent` / existing `h()` / `btn()` / `createTextNode` only (`station.js` 4368–4374). Overlay wipe stays `overlay.textContent = ''` (5890, 6022).
5. HUD-02 identities closed. HUD **never** writes `hullKind`. HUD may **read** `player.hullKind` as today (`hud.js` 86–87).
6. `src/game/state.js` is READ-ONLY later. **No** `SHIP_CLASSES` grant fields. **No** new class keys. Live keys stay `light` `ace` `cutter` `heavy` `frigate` `freighter` (`state.js` 37–44). **Do not** write `state.js`. **Do not** invent UU tables. **Do not** invent standing deltas. **Do not** change `MOUNT_TABLE`.
7. Persist: **no** new `WORLD_FIELDS` key. Inventory proves hangar + `'launcher'` / `'missileAmmo'` / `'turret'` already hold the grant (`save.js` 76–101, 94–96). Autosave stays `rimward-save-v1` (`save.js` 66). **No** `world.chainSku`. **No** new `localStorage` key.
8. Prototype-safe later helpers: `Object.hasOwn` (or `Object.prototype.hasOwnProperty.call`) on employer keys and SKU ids. Unknown / reserved / non-string employer → **fail-closed credits +2 only**. Never userString index as existence. Never `for-in` merge from a job blob. Copy `chainGrantSpec` (`jobs-chains.js` 79–82). SKU id must pass `isLauncherId` / `isTurretId` (`weapon-fit.js` 27–31, 63–69).
9. Fail-closed: unknown employer → **credits +2 only**. `canSeat` false → **credits +2 only**. `writeMountedGear` null or heal-blank → **credits +2 only**. Do **not** mint a hull. Do **not** ignore `writeMountedGear`. Do **not** debit shop catalog costs.
10. BIO-02 kit mutate omit. BIO-05 graft closed (Wave 97). Do **not** grant graft / living hull / scanner / mining head / concealed mounts / cargo racks. `writeMountedGear` patch on this path may contain **only** `launcher` or **only** `turret` (plus live Freehold dart shape: no stuffed `missileAmmo` unless a later owner fills **all** dart grants including Freehold).
11. Do **not** reopen chain splice, unique four, unique DONE hide, family caps, dart/auto **shop** prices (`weapon-fit.js` 37–38, 49). Shop Digit 8/9 stay papers. Do **not** call `grantChainSku` from unique complete.
12. Live SKU ids: **`dart`** and **`auto` only**. Do **not** invent a third SKU id. Inventory proves reuse is true (`weapon-fit.js` 33–53).
13. Gilded is **not** an employer (`jobs-chains.js` 9). Do **not** add `gilded` to `EMPLOYER_KEYS` / `CHAIN_GRANT` / `CHAIN_IDS`.
14. Do not edit sibling Msn03/Msn02/Bio/Rep/Shp/Hud/wishlist/`PROGRESS.md`/`OwnerDecisions*`. Do not write `docs/OwnerDecisionsWave108.md`. Deputize defaults live in **this** contract.
15. Do not “fix” WAVE4 fence, WAVE26 ferry/haul, or WAVE35 haul boot FAILs. Do not “fix” uniqueRetry. Do not fill Freehold dart ammo in a remaining-only patch.
16. First remaining serial must **not** steal Digit 0/8/9 and must **not** write `state.js`. Preferred PR1 home: `src/game/jobs-chains.js` `CHAIN_GRANT` rows only.

---

## 0.1 Wave 108 deputize (owner may override after playtest)

Pick playable last-step grants. **Do not park.** Wave 82 left Veridian/Hollow credits-only because SKUs were unnamed. This leftover **names** them. Owner may revert after playtest.

### Live numbers (do not retune)

| Knob | Live | Cite |
|---|---|---|
| Employer standing | **+2** `MINING_REP` every chain step | `station.js` 232, 3508 |
| Last-step pay | `payQuoted` from origin `jobPayFor(PATROL_REWARD)` | `station.js` 205, 3521–3522, 4992 |
| `PATROL_REWARD` | **300** | `station.js` 205 |
| Dart shop | **6500**; restock **400** / **2**; `ammoMax` **8** | `weapon-fit.js` 37–39 |
| Auto shop | **4200** | `weapon-fit.js` 49 |
| `CHAIN_STEPS` | **3** | `jobs-chains.js` 6 |
| Freehold grant | `dart` / missile / launcher | `jobs-chains.js` 29 |
| Red Ledger grant | `auto` / turret / turret | `jobs-chains.js` 30 |

Do **not** steal shop costs as mission pay. Do **not** change 300 / 6500 / 4200.

### Consolation UU (Wave 82 words; not live today)

| Knob | Deputize | Why |
|---|---|---|
| `CHAIN_GRANT_FAIL_UU` | **2** | Wave 82 “credits +2 only”. Inventory: live code does **not** add 2 UU (inventory §9.2) |
| When | last step **and** `grantChainSku` returns false | Null spec, unknown employer, `!canSeat`, blank write |
| When not | grant **succeeds** | Do not stack +2 UU on a seated SKU |
| Standing | still `MINING_REP` **2** | Already paid; this UU is the **SKU substitute**, not a second standing write |
| `payQuoted` | still paid | Consolation is **in addition** to last-step paper pay, **instead of** a SKU |

Integer **2**. Not 6500. Not 4200. Not `PATROL_REWARD`.

### Remaining employers — named last-step (not keep-credits-only)

Light / cutter / freighter **cannot** seat (`MOUNT_TABLE` `state.js` 67–69). Seating does **not** smash light starters: `canSeat` false → credits +2. Keep-credits-only for Veridian/Hollow is **not** required.

Reuse `dart` / `auto`. Veridian and Hollow **must differ**. Dest2 identity: Veridian already flies to Freehold (`dart` employer); Hollow already flies to Redmarch (`auto` employer). Do not copy the dest faction’s SKU.

| Employer | Grant | Seat | Slot | Why |
|---|---|---|---|---|
| `freehold` | `dart` | missile | launcher | **Keep live.** Do not reopen. |
| `redledger` | `auto` | turret | turret | **Keep live.** Do not reopen. |
| `veridian` | **`auto`** | turret | turret | Combine dock gun (heat-limited). Differs from Freehold dest `dart`. Catalog `Auto turret`. |
| `hollow` | **`dart`** | missile | launcher | Rim reach rack. Differs from Ledger dest `auto`. Catalog `Dart rack`. |
| unknown / gilded | **none** | — | — | `chainGrantSpec` null → credits +2 only. No fifth employer. |

Later `CHAIN_GRANT` freeze:

```
freehold:  { id: 'dart', seat: 'missile', slot: 'launcher' }
redledger: { id: 'auto',  seat: 'turret',  slot: 'turret' }
veridian:  { id: 'auto',  seat: 'turret',  slot: 'turret' }
hollow:    { id: 'dart', seat: 'missile', slot: 'launcher' }
```

Same object shape as live Freehold/Ledger rows (`jobs-chains.js` 29–30).

### Write shape (match live grant, not shop)

| SKU | Later `writeMountedGear` patch | Must not |
|---|---|---|
| `dart` | `{ launcher: 'dart' }` | `missileAmmo`, scanner, mining, graft, hull |
| `auto` | `{ turret: 'auto' }` | launcher, ammo, scanner, mining, graft, hull |

Live Freehold dart grant does **not** fill `ammoMax` 8 (inventory §3). Remaining dart (Hollow) **matches** that empty-rack write. Do not make Hollow dart better than Freehold dart. Shop restock stays Digit 8 papers.

After write: if `row.launcher !== spec.id` (dart) or `row.turret !== spec.id` (auto), treat as fail-closed credits +2. Live `grantChainSku` lacks this check (inventory §2). Later impl **adds verify for all four employers** in the same function. That is not a Digit steal and is not a shop-price reopen.

### Copy (Jobs pane only)

| Card | Line |
|---|---|
| Last-step UU | Keep live `Last paper pays ${est} UU at the home dock` / `Chain paper — last step pays ${est} UU` (`station.js` 5213–5215) |
| Last-step SKU hint | One extra `textContent` line **only** when `chainGrantSpec` is non-null: `Last paper may seat a ${catalog.name} if this hull has a hardpoint.` Names: `Dart rack` / `Auto turret` (`weapon-fit.js` 41, 51) |
| Shop cost on Jobs | **Forbidden** |
| `commLine` seated | Keep `Gear seated.` (`station.js` 3524) |
| `commLine` fail | Append ` Compact thanks +2 UU.` |
| HUD / Digit 9 / memorial | **None** |

`reducedMotion`: no extra animation.

This deputize is playable. Owner may swap Veridian/Hollow SKUs or revert both to credits-only after playtest. Until then, implement named grants + fail-closed +2 UU. Do not park. Do not invent a third id.

---

## 1. Grant function law (later)

`grantChainSku(ctx, employerKey)` (`station.js` 3494):

1. If `typeof employerKey !== 'string'` → false.
2. `spec = chainGrantSpec(employerKey)`. If `spec` is null or not a frozen `{ id, seat, slot }` → false.
3. `id` must be `'dart'` or `'auto'` via `isLauncherId` / `isTurretId`. Else false.
4. `mountedClassKey(ctx)` then `canSeat(classKey, spec.seat)`. Else false.
5. Slot `'launcher'` → `writeMountedGear(ctx, { launcher: spec.id })`. Slot `'turret'` → `writeMountedGear(ctx, { turret: spec.id })`. Else false.
6. Verify the returned row’s field equals `spec.id`. Else false.
7. True only if seated.

`finishChainStep` last step (`station.js` 3521–3526):

1. Pay `payQuoted` as today.
2. `granted = grantChainSku(...)`.
3. If `!granted`, `ctx.world.credits += 2` only when `Number.isFinite(ctx.world.credits)`.
4. `completeJob` commLine as deputize copy.

`grantChainSku` **never** writes credits, standing, hull, or `jobs`. Fail UU lives only in `finishChainStep` after a successful `parseChainId` with `parsed.step === 3`. Tick already splices unparsed chain ids with **no** pay (`station.js` 4197–4201). Do **not** pay +2 UU to proto / unknown employer rows.

Do **not** pass user-controlled `job.sku` / `job.launcher` / `job.faction` into `writeMountedGear`. Employer comes from `parseChainId` allowlist only.

---

## 2. Persist / Digit / HUD (repeat)

| Question | Law |
|---|---|
| New persist key? | **No** |
| `state.js` write? | **No** |
| New Digit? | **No** |
| Digit 0/8/9 steal? | **Forbidden** |
| Hub child? | **Forbidden** |
| Unique four SKU? | **Forbidden** |
| Chain splice change? | **Forbidden** |
| Shop price change? | **Forbidden** |
| Third SKU id? | **Forbidden** |
| Gilded employer? | **Forbidden** |

---

## 3. Serial PR plan (named only — do not land this wave)

| PR | Lands | Must not |
|---|---|---|
| **PR1** `CHAIN_GRANT` rows | `jobs-chains.js` Veridian `auto`, Hollow `dart`; keep Freehold/Ledger | `state.js`; Digit 0/8/9; station UI; shop prices; unique four |
| **PR2** `grantChainSku` + fail UU | verify write; `credits += 2` on false; commLine fail suffix | hull mint; graft/scanner/mining; ignore `writeMountedGear`; Digit steal |
| **PR3** Digit 2 copy | last-step `textContent` hint from catalog **name** | shop cost on card; `innerHTML`; HUD; Digit 9 quest log |
| **PR4** boot pins | last-step Veridian/Hollow seat when `canSeat`; light starter +2 UU; proto employer drop; unique four still no `grantChainSku` | WAVE26/WAVE35 “fixes”; Digit 0 |

PR1 is the **first remaining serial**. It must not steal Digit 0/8/9. It must not write `state.js`.

---

## 4. XSS / injection (later)

- No `innerHTML`. Catalog names are authored ASCII (`Dart rack`, `Auto turret`).
- `employerKey` from `parseChainId` / `CHAIN_IDS` only. `chain-__proto__-1` already invalid (`save.js` 176–181, 345–349; `jobs-chains.js` 44–57).
- `writeMountedGear` ignores unknown patch keys (`hangar.js` 489–525). Do not pass a blob.
- Do not `JSON.parse` grant specs from save. Table is code freeze.
- Do not index `LAUNCHER_IDS[userString]` without `isLauncherId`.
