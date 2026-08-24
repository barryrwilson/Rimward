# BIO-02 remaining career branches shared contract (Wave 101)

**Wave:** 101. Design only. No BIO-02 career feature ships in this wave.  
**Status:** MERGE LAW for `docs/Bio02CareerDesign.md`. If that brief and this file ever disagree, **this file wins**.  
**Predecessor:** Wave 86 first-impl contract [`out/w86/bio02/shared-contract.md`](../../w86/bio02/shared-contract.md) plus live Wave 92/94 train. This file owns **remaining careers only**. It does not reopen growth, train dest membership, or living buy SKUs.  
**Not this wave:** any edit under `src/`, `scripts/`, `public/`, `index.html`, `package.json`. Do not edit `docs/PLAYER-EXPERIENCE-WISHLIST.md`, `PROGRESS.md`, `docs/BioLivingShipsDesign.md`, `docs/Bio02EvolutionDesign.md` (read-only sibling history), `docs/Bio01ObtainDesign.md`, `docs/Bio03*.md`, `docs/Bio04PsionicsDesign.md`, `docs/Bio05AbominationsDesign.md`, `docs/NpcTurretsDesign.md`, `docs/Tgt03*.md`, `docs/OwnerDecisions*.md`. Sibling `out/w101` NPC / TGT workers are other write-sets.  
**Locked sources:** wishlist BIO-02 career remainder (`docs/PLAYER-EXPERIENCE-WISHLIST.md` ~1222–1239); live inventory `out/w101/career/current-bio02-career-inventory.md`; `docs/OwnerDecisionsWave92.md` / `Wave93.md` / `Wave94.md` / `Wave97.md`; `src/game/hangar.js`; `src/game/shipyard.js`; `src/systems/shipyard-desk.js`; `src/systems/station.js`; `src/game/state.js` (READ-ONLY); `src/game/save.js`; `src/systems/hud.js`; `src/game/bio.js`; `src/systems/ship.js`; `src/core/ctx.js`.

Integrator rule: a **later** implementation wave obeys this file. Inventory cites live code. Code wins over stale Wave 86 comments.

---

## 0. Orchestrator merge law (do not weaken)

1. Wave 101 is **markdown only**. Later impl is **serial**. Do not schedule or land career `src/` PRs in this worker.
2. First impl (growth vs train, Beautiful Hangar papers, envelope, cargo keep) is **DONE**. This contract owns **named career branches** only.
3. Class set = live `SHIP_CLASSES` keys only: `light` `heavy` `freighter` `ace` `cutter` `frigate`. **Do not invent six career class keys.** Careers are **loadout + existing class**.
4. Live `LIVING_STOCK` is the six keys (`shipyard.js` 29). Beautiful / Unknowables **buy** that full set. Remaining work **must not** append keys and **must not** strip `frigate` / `ace` / `freighter` to restore a stale Wave 86 omit. Buy list is **frozen**.
5. Train dests stay live Wave 94 law: any other `LIVING_STOCK` key (`livingTrainDests`). Ace / freighter / frigate train is **DONE ladder**, not a new career verb. Same class: no Offer.
6. No new `DOCK_KEY_SERVICES` key. Digit **0** stays Shipyard (`station.js` 186, 5920–5922). Digit 1 Hangar / Digit 2 Yard stay. Digit 3+ on Hangar stay hull mount (Digit 0 on Hangar = row 8). Career chrome, if any, is a Hangar **click Offer** like train. Never a mid-list Digit. Never Digit 3 Career tab. Never Digit 5 (dock Repair / undocked psionic). Never Digit 6 steal from Outfitting.
7. No new `WORLD_FIELDS` key. No new `localStorage` key. Career state rides the hangar row (`classKey` + existing gear fields) the same way train and `writeMountedGear` already mutate. `ui.trainPending` stays session chrome. Do not persist `careerPending`.
8. HUD **never** writes `hullKind`. Career never remounts living → built or grafted.
9. `innerHTML` forbidden. `textContent` / `h()` / `el()` only. Static literals for career names. Hull `name` may ride `textContent` only.
10. Do **not** invent UU or standing deltas. Copy live `yardPrice` / `trainListPrice` / `YARD_LIST_UU` / `MIN_REP` / outfitter integers (`SCANNER_COST` 400, `SCANNER2_COST` 900, `CARGO_UPGRADE_COST` 600, `HIDDEN_MOUNTS.cost` 900, `MINING_LASERS` 1400 / 4200 / 11000). Success writes **no** standing.
11. `state.js` is READ-ONLY this wave **and** for the career serial unless a **named catalog PR** is a separate owner. Default: **no** `state.js` write. No `SHIP_CLASSES` row. No `MOUNT_TABLE` row. No `COMMODITIES` career SKU.
12. Do not reopen graft UU **4000**, ungraft (**forbidden**), NPC grafted (**off**). Pointer: `docs/OwnerDecisionsWave97.md`. Train still refuses grafted / built / Unknowables-faction rows.
13. `bio.growth` stays visual. It must not change `classKey` or career.
14. Prototype-safe: `hasOwnProperty` / `hasOwn` on `SHIP_CLASSES` and dest strings. `SAFE_ID` + `RESERVED_IDS`. No `for-in` merge of a raw blob. `ctx.emit` must not spread a hangar row (`{ type, t, ...data }` smash, `ctx.js` 263–264).
15. Do not open BIO-03 rebake, BIO-04 psionic rewrite, BIO-05 leftover, NPC turret (sibling), TGT-03 (sibling). Do not “fix” WAVE4 / WAVE26 / WAVE35 boot FAILs.
16. Player living CPU mesh (`makeLivingHull`) stays the quality bar. Career remount, if class already changed via train, keeps swim / breath / heartbeat.

---

## 1. DONE vs remaining

### 1.1 DONE — do not re-author

| Item | Law |
|---|---|
| Growth | Visual scale. Not remount |
| Train papers | Beautiful Hangar Offer → Confirm. Digit 0 Shipyard |
| Train dests | Any other live `LIVING_STOCK` key |
| Train debit | `trainListPrice` = `yardPrice(dest, beautifulRep)` |
| Rank | `minRepFor(dest)` (ace 10, frigate 25, else 0) |
| Envelope | `burn / cruise`. Cargo keep. Seat heal |
| Living buy | Full six keys on Beautiful and Unknowables yards |
| Ace / freighter / frigate dest | **DONE ladder** |
| Graft loop | Closed. 4000 UU. NPC off. Ungraft forbidden |

### 1.2 Remaining — named careers without new keys

Wishlist combat / mining / trade / exploration / stealth / support.

**Freeze:** each name is a **skin** on an existing `classKey` plus live outfitter gear. Not a seventh+ `SHIP_CLASSES` row. Not a second train helper.

---

## 2. Deputize defaults (Wave 101 — playable, not parked)

Do not wait on a further owner line for these. A successor owner file may override. This file binds the serial until then.

### 2.1 Class skins (existing keys only)

| Wishlist career | Default existing class | Why (live) |
|---|---|---|
| combat | `heavy` | `SHIP_CLASSES.heavy.role` is `combat`. Missile 2 / turret 2 |
| combat hunter | `ace` | Live train dest. Role `ace`. Not a new key |
| mining | `cutter` | Mining seat 1 on every class; cutter is the small living hull |
| trade | `freighter` | Role `trade`. Cargo 160 |
| exploration | `light` | Starter. Scanner seat 1 |
| stealth | `cutter` | `qship` 1 + live concealed-mounts SKU |
| support | `heavy` | Turret 2. Capital support skin = live `frigate` (turret 4), still not a new key |

`cutter` may serve mining **or** stealth. Career is loadout on the class, not exclusive ownership of the key.

Player **trains** to that class with the live Hangar verb (DONE). Career serial does **not** add `trainMountedCareer`.

### 2.2 Hangar career mutate verb

**Omit.** Outfitting (dock Digit 6) already sells scanner, mining heads, concealed mounts, hold racks, launcher, turret via `writeMountedGear`.

Do **not** add `careerPending` papers in first remaining serial. Do **not** bundle SKUs at a new integer.

If a **successor** owner file opens a one-confirm kit:

- Beautiful Hangar click Offer only (graft/train pattern).
- Debit = **sum of live** outfitter integers for SKUs the hull still lacks. No discount. No new UU.
- Writer = `writeMountedGear` only. No `classKey` write (train stays the class verb).
- No Digit. Hostile Bloom: `No sale.` Short credits: keep Offer; Confirm refuses.
- Grafted / built / Unknowables-faction: refuse.
- Pending is session `ui` only. Null on the same cancel sites as `trainPending`.

Until that successor file exists, treat Hangar kit mutate as **non-goal**.

### 2.3 Hangar dest labels (allowed remaining serial)

Later serial **may** append a static career word to train Offer copy, using `hasOwn` dest keys only. Examples (literals):

| Dest key | Allowed extra word |
|---|---|
| `heavy` | `combat` |
| `ace` | `hunter` |
| `freighter` | `trade` |
| `light` | `explore` |
| `cutter` | `cutter` (keep key; do not print a fake class) |
| `frigate` | `capital` |

Hop Confirm stays `{from} → {dest}` with live `classLabel` (today the key string). Dest on Confirm is the **key** from `livingTrainDests`, never a parsed career word. Do not interpolate `row.name` into Confirm via `innerHTML`. Do not revive `TRAIN_HEAVY_NOTE` as if dests stopped at `heavy`. Do not bind careers to HUD `HAIR_CAREER` (`hud.js` 101 — layout inset 18, not a flag).

### 2.4 Prices and ranks

Copy live tables. Do not mint.

Train: `trainListPrice(rep, dest)`. Rank floor: `minRepFor(dest)`.

Outfitter (if successor opens kits): 400 / 900 / 600 / 900 / 1400 / 4200 / 11000 as inventoried.

Standing on career success: **none**.

---

## 3. Forbidden (fail closed)

| Act | Why |
|---|---|
| New `SHIP_CLASSES` / `MOUNT_TABLE` keys | `state.js` READ-ONLY; wishlist forms are skins |
| Alias `ace` as a new key `combat` | Live key already trains |
| Append / strip `LIVING_STOCK` | Wave 94 buy frozen; no SKU sneak; no omit-restore |
| New Digit / `DOCK_KEY_SERVICES` | Digit 0 Shipyard; 3+ hulls |
| New persist / `localStorage` | Hangar row only |
| HUD `hullKind` write | HUD-02 |
| Parse career word as dest | Dest is `livingTrainDests` key only |
| Bind HUD `HAIR_CAREER` | Layout inset, not BIO-02 |
| `innerHTML` | XSS |
| Invented UU / standing | Owner integers only |
| `bio.growth` remount | Growth ≠ class |
| Graft 4000 reopen, ungraft, NPC grafted | Wave 97 |
| `switchTo(same id)` for in-place kit | `already-mounted` |
| Envelope `multiplier = burn` | Live `burn/cruise` |
| Player GLB swap / BIO-03 rebake | Quality bar |
| Unknowables-faction train/career at a Bloom | Live refuse |
| Unknowables **buy** change | Stock frozen; train remains Beautiful-only |

---

## 4. Eligibility vs paint (if successor opens kit)

Copy train matrix (`shipyard-desk.js` 207–232). Mutate ≠ hide.

| State | Control | Copy |
|---|---|---|
| Non-Beautiful | hide | none |
| Unknowables hull | no button | `The Unknowables do not train here.` |
| Built / grafted | no button | `Training is for living hulls.` |
| Hostile `rep < 0` | no button | `No sale.` |
| Short credits | keep Offer | Confirm `Not enough credits.` |
| Eligible | click Offer | static career word + live price |

One note. First-match refuse. Never “not available.” Never `graftOfferVisible` hostile hide.

---

## 5. Persist / emit / proto (later impl)

| Item | Rule |
|---|---|
| New `WORLD_FIELDS` | **Forbidden** |
| New `localStorage` | **Forbidden** |
| Class | Hangar `classKey` via existing `trainMounted` |
| Gear | `writeMountedGear` allowlist only |
| Proto dest | `typeof dest === 'string'` + `LIVING_STOCK.includes` + `hasOwnProperty(SHIP_CLASSES)` |
| Ids | `SAFE_ID` + reserved skip |
| Emit | Desk notice only. Never `{ ...row }` |
| innerHTML | **No** |

---

## 6. Ownership

| Owner | Writes |
|---|---|
| BIO career serial | Optional dest **labels** on Hangar. No class mint |
| BIO train (shipped) | Hangar `classKey` on Beautiful Confirm |
| Outfitter (shipped) | scanner / mining / concealed / racks / seats |
| SHP | `hullKind`, `MOUNT_TABLE`, guns |
| HUD | reads `hullKind` |
| `bio.js` | growth only |
| Wave 97 | graft closed |

---

## 7. Serial PR plan (later — not Wave 101)

| PR | Lands | Does not land |
|---|---|---|
| **PR1 labels** | Static career words on existing train Offers | New keys, Digit, persist, kit mutate |
| **PR2 kit mutate** | **Skipped** unless a successor owner file opens §2.2 | New UU, `classKey` write, Digit steal |
| **PR3 pins** | Boot asserts no career keys in `SHIP_CLASSES`; Digit 0 shipyard; `LIVING_STOCK` still six live keys | WAVE4/26/35 “fixes” |

`state.js` untouched. Prefer `shipyard-desk.js` copy for PR1.

---

## 8. Open questions

**None parked.** Defaults in §2 bind. Successor owner file may reopen Hangar kit mutate (§2.2). Until then, omit.
