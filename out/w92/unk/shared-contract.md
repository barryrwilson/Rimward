# Unknowables live-site shared contract

**Wave:** 92. Design only. No Unknowables feature ships in this wave.  
**Status:** MERGE LAW for `docs/UnknowablesDockDesign.md`. If that brief and this file ever disagree, **this file wins**.  
**Not this wave:** any edit under `src/`, `scripts/`, `public/`, `index.html`, `package.json`. Do not edit `docs/PLAYER-EXPERIENCE-WISHLIST.md`, `PROGRESS.md`, `docs/OwnerDecisionsWave82.md`, `docs/ExpDataTradeDesign.md`, Bio0x docs, Nav docs.  
**Locked sources:** live inventory `out/w92/unk/current-unk-inventory.md` (code wins); Wave 42 content notes in `PROGRESS.md` (honor; do not edit); Wave 82 owner file (copy numbers; do not invent UU / drop / standing); EXP brief (read-only).

Integrator rule: a **later** implementation wave obeys this file. Inventory cites live code. Code wins over stale comments (`OVERLAY_FACTIONS` 9, `DETAIL_STATIONS` 8, `npc.js` field builder).

---

## 0. Law in one page

1. Wave 92 is markdown only. Implementation is a later **serial** wave. Do not schedule or land these PRs in `src/` in this wave.
2. **First live site (PICK):** wreck / beacon / anomaly **presence** on an **existing** `SYSTEMS` row. **Not** a generated SYSTEM with a station. **Not** a dock.
3. Wave 82 Unknowables system: **Wait.** Do not invent a dock, a `DETAIL_STATIONS.unknowables` sculpt, or a generator cluster.
4. Copy EXP numbers from `docs/OwnerDecisionsWave82.md` only:
   - `DATA_DROP_RATE = 0.20`
   - Own UU **400** (legal cube / legal crystal at **origin** desk)
   - Rival UU **900** (Assembly pays 900 for crystals **today**; a **later** Unknowables dock would pay 900 for cubes)
   - Launder UU **250**
   - Archive hostile: `standingRead(assembly) < 0` → no sale
   - Data tint: untinted steel
5. Do **not** invent a third data SKU. Tokens stay `dataCrystal` / `dataCube`.
6. Unknowables player hull stays hangar-forced **`living`**. No Unknowables **train desk**. No invented dock Digit steal. Digit 0 stays **shipyard**.
7. `textContent` / `h()` only in later impl. **`innerHTML` forbidden.**
8. No new `WORLD_FIELDS` key. No new `localStorage` key. Autosave stays `rimward-save-v1`.
9. Portraits: `PORTRAIT_SOURCES.unknowables` and `public/assets/portraits/unknowables-a.webp` / `b.webp` **exist**. Later People/hail **must** call `portraitFor`. Do not force text-only. Hollow/independent stay text-only (no files).
10. No power ledger, police leave, BIO-01/02/04, NAV, living-frigate buy, aim-glass.
11. Do not invent standing deltas, drop rates, or UU. Point leftovers at Wave 82.
12. Do not “fix” known boot FAILs WAVE4 fence, WAVE26 ferry/haul, WAVE35 haul.

---

## 1. First live site — wreck / beacon / anomaly only

### 1.1 The pick (frozen)

| Question | Freeze |
|---|---|
| Generated SYSTEM with a station? | **No** |
| Placeholder station as an Unknowables dock? | **No** (`buildPlaceholderStation` is unknown-faction fallback only) |
| `DETAIL_STATIONS.unknowables`? | **No** (D3: they build no stations by their sheets) |
| Grown Bloom-style Unknowables station? | **No** this serial. Owner successor required |
| First live site | **Presence:** one authored landmark, kinds `wreck` \| `beacon` \| `anomaly` |
| Host system | **Existing** `SYSTEMS` id. Default host **`hush`**. Do **not** change `SYSTEMS.hush.faction` (stays `hollow`) |
| New `SYSTEMS` row / generator cluster? | **No** |
| Dock / market / yard / people / archive / epic at that site? | **No** |
| Gate overlay Unknowables? | **No** (host faction still dresses the gate) |
| Cast Unknowables NPCs from `createRecords`? | **No** (would require `def.faction === 'unknowables'`) |

Wave 27 precedent: field/gate assets may exist while the live site is a wreck/beacon/anomaly POI, not a faction home. Beautiful glaze stays Beautiful-only (`landmarks.js` 32–36). Unknowables landmark uses **generic** `buildKind`. No new glaze. No new `landmarks/authored.js` hero unless a later owner names one.

### 1.2 Landmark row (later PR2, not this wave)

Fail closed until the later serial fills **all** of:

| Field | Rule |
|---|---|
| `id` | Authored string matching live landmark id allowlist (same family as `th_lanes_end`). Not player text. Not `__proto__` / reserved |
| `name` | Static Echo noun |
| `kind` | **`anomaly`** default (not a station). Owner may retune to `wreck` or `beacon` only |
| `position` | Away from hush station/field/gates, same rule as existing authored landmarks |
| `line` | Static Echo. `textContent` / `commLine` via existing `landmarkFound` |

Default proposed id **`th_veil`**, name **`The Veil`**, host **`hush`**. Owner may retune id/name/line. Do not ship a landmark in Wave 92.

Idle presence is **absence** of that id in `authored-systems.js` today.

### 1.3 Discovery

Reuse `mystery.js` landmark radius **100** u, `visited` push, `landmarkFound` + `commLine`. No new persist key. No cargo row. No clue id unless owner opens a mystery beat (default **no new clue** — authored clue count stays 6).

### 1.4 Visitor hulls (later, optional, fail-closed off)

Spawning Unknowables GLBs at the landmark is **not** part of the first presence PR. Default **off**. Requires a dedicated later PR with an explicit spawn helper. Do not set `SYSTEMS[id].faction` to sneak them through `world.js` `createRecords`.

Without visitor hulls, honest `dataCrystal` drops stay rare (only synthetic/browser spawns). That gap is recorded. Do not fake a dock to fix it.

---

## 2. Lockstep tables

### 2.1 First presence (wreck/beacon/anomaly) — tables that must stay in lockstep

| Table | Action |
|---|---|
| `AUTHORED_SYSTEMS.hush.landmarks` | Later: add one row. Do not change `faction` |
| `landmarks.js` kinds | Reuse `anomaly` / `wreck` / `beacon`. No Unknowables glaze |
| `mystery.js` | No API change |
| `FACTIONS` | Already has `unknowables`. Do not add a second key |
| `DETAIL_STATIONS` | **Do not add `unknowables`** |
| `GATE_BUILDERS` / overlay FX | Already has `unknowables`. Do not require a live system |
| `NPC_FACTIONS` / GLB | Already has `unknowables`. Do not require a live system |
| `PORTRAIT_SOURCES` | Already lockstep with files. No change |
| `generate-galaxy.mjs` | **Do not** add a cluster or retotal |
| `contacts.js` | **Do not** add a dockmaster |
| `EPICS` | **Do not** add stages |
| Market / Archive | **Do not** open an Unknowables desk |
| `DOCK_KEY_SERVICES` | **Do not** insert a key (Digit 0 stays shipyard) |

### 2.2 Later Unknowables **dock** (Wave 82 WAIT — not this serial)

A dock is a **successor owner line**, not PR2. If that line ever exists, **every** table below must move in lockstep in **named serial PRs**. Missing any row → fail closed (no dock).

| Table | Live today | Later dock must |
|---|---|---|
| `FACTIONS` | has `unknowables` | keep own-key checks |
| `SYSTEMS` / `AUTHORED_SYSTEMS` or `generate-galaxy.mjs` | 0 Unknowables systems | add **one** honest row; retotal `EXPECTED_FACTION_TOTALS`; add `FACTION_COLOR`, `PRICE_PROFILES`, `STATION_PATTERNS`, `LM_TONE`, `CT_TONE` |
| `DETAIL_STATIONS` | 10 keys; no unknowables | **still omit** unless owner reopens D3. Placeholder dock **forbidden** for Archive/yard as origin |
| Station path | beautiful grown; else detail; else placeholder | Owner must pick a non-placeholder path **before** desk UU |
| `GATE_BUILDERS` | already `unknowables` | live `def.faction` will dress; do not duplicate overlay tables |
| Ships (`NPC_FACTIONS`, GLB) | already `unknowables` | `world.js` will spawn from `def.faction` — accept or add an explicit skip |
| `contacts.js` + `CT_TONE` | none | one plain dockmaster; no invented fixer id |
| `FACTION_SERVICES` / `RECOGNITION` / `RUMOR` / `COMP` | no unknowables | add lines **or** accept missing notes (do not crash). Default: add static Echo lines in that successor PR |
| `EPICS` | 4 keys, no unknowables | default **omit**. Empty epic pane is legal. Do not invent stages here |
| Market | `COMMODITY_KEYS` every dock | ordinary goods ok; **data stays Archive desk**, not `COMMODITIES` |
| Archive | `archiveDeskAllowed` assembly-only | mirror: `faction === 'unknowables'` **and** a **non-placeholder** station path exists |
| `PORTRAIT_SOURCES` | files exist | People/hail use `portraitFor` |
| `shipyard.js` | `UNKNOWABLES_STOCK` light living | Digit 0 shipyard; hostile `rep < 0` no sale; no remount-on-buy |
| `hangar.js` | force living | keep |
| EXP prices | see §3 | cubes **900** rival; crystals **400** own. Copy Wave 82. No third SKU |

Stale names: treat **`OVERLAY_FACTIONS`** as `GATE_BUILDERS` + `gate.js` Unknowables FX. Treat **`DETAIL_SHIPS`** as `NPC_FACTIONS` + GLB catalog.

---

## 3. EXP numbers (copy, do not invent)

Live Assembly Archive (`data-trade.js` 18–26, 187–201; `station.js` 1167–1168, 1252–1254):

| Verb | SKU | Price |
|---|---|---|
| Buy legal Assembly cube | `dataCube` `legal` `assembly` | **400** |
| Sell legal Assembly cube | same | **400** |
| Sell Unknowable crystal (any allowlisted source) | `dataCrystal` `unknowables` | **900** |
| Buy crystal at Assembly | — | **refuse** (not a buy SKU) |
| Captured Assembly cube at Assembly | — | illegal in origin |

**Later Unknowables origin desk** (WAIT):

| Verb | SKU | Price |
|---|---|---|
| Buy/sell legal Unknowable crystal | `dataCrystal` `legal` `unknowables` | **400** own |
| Sell Assembly cube (any allowlisted source) | `dataCube` `assembly` | **900** rival |
| Captured Unknowable crystal at Unknowables | — | illegal in origin (mirror Assembly) |
| Hostile | `standingRead(unknowables) < 0` | no sale (yard/Archive precedent) |

Do not author these verbs in Wave 92 `src/`. Do not change Assembly prices. Launder stays **250** at live fixers (Veridian / Redmarch). Drop stays **0.20**.

**Own crystal 400 is not an Assembly price.** Assembly does not sell crystals. Task shorthand “own crystal 400 at Assembly” is **wrong**. This file wins: own 400 is origin-desk; Assembly’s live own SKU is the **cube**.

---

## 4. Persist

- Ride existing `mystery` for landmark `visited`.
- Ride existing hangar cargo for data lots (already shipped).
- **Forbidden new keys:** `'unknowables'`, `'unkDock'`, `'veil'`, extra `localStorage`.
- Landmark `id` / system `id` / contact `id`: authored constants. `Object.hasOwn`. `RESERVED_IDS` / proto family rejected.
- Do not persist meshes, `targets.current`, or portrait variant.

---

## 5. Desk / Digit / copy (later chrome)

### 5.1 First presence

No dock chrome. Discovery copy is the authored `line` through existing `commLine`. No new Digit. No train desk. No Archive block on hollow hush.

### 5.2 Later dock (WAIT)

- Additive `renderArchiveDesk` (or rename-safe twin) on Market pane after the commodity table.
- Gate: `ui.level === 2 && ui.service === 'market'` AND `currentDef.faction === 'unknowables'` AND a **non-placeholder** station path (never `buildPlaceholderStation`).
- **No new `DOCK_KEY_SERVICES` key.** Digit 0 remains shipyard (`station.js` 180, 5780–5788).
- People Digit 7 stays rescue + existing cards. No Unknowables gift. No Digit steal.
- Two-step confirm for UU debit/credit (Assembly Archive family). Esc / KeyB cancel.
- Digits do not debit data.
- Q/W/A/S remain `COMMODITY_KEYS` only.
- Copy: static Echo; `h(..., authoredLabel)` `textContent`. No `innerHTML`. No `row.name`.
- Reduced motion: keep the same words; Archive already has a short header.

### 5.3 Frozen later copy (do not invent UU in strings)

Reuse Assembly pattern with swapped SKUs **only after** the owner un-waits:

- Short: `Legal crystals ${ARCHIVE_OWN_UU} UU. Rival cubes ${ARCHIVE_RIVAL_UU} UU.`
- Hostile: `No sale.`
- Confirm family: existing Archive confirm buttons.
- Fail: `The archive will not file here.` on wrong banner / placeholder.

Do not show 900/400 as market `priceOf`. `priceOf` data stays **0**.

### 5.4 No train desk

No tutorial overlay, no “Unknowables training”, no Digit bound to a drill. Player living hull law stays hangar heal, not a desk.

---

## 6. Portraits

- First presence: no People card → no face.
- Later dock People/hail: `portraitFor('unknowables', contactId)`. Files exist. Null branch is **not** for this faction.
- Variant `'a'`/`'b'` hash, never persisted.
- Do not load `docs/FactionExamples/*.png` at runtime.

---

## 7. Security

1. **XSS:** authored strings only. `textContent`. No `innerHTML`. No landmark `line` from save blobs without the existing mystery sanitize path.
2. **Proto ids:** `Object.hasOwn(SYSTEMS, id)`, `Object.hasOwn(FACTIONS, faction)`, `RESERVED_IDS`. Never `for…in` merge a raw system blob.
3. **Persist:** no new key. Landmark ids are literals.
4. **Economy:** copy Wave 82 integers into named constants already in `data-trade.js`. Do not invent a third token or a second rival price.
5. **Desk gate:** UI hide is not authorization. Helper re-checks faction + non-placeholder + hostile standing + pending key.
6. **Emit:** prefer `commLine` `{ text, from }` literals. Do not spread world blobs.
7. **Placeholder origin:** opening Archive on placeholder is a cheat desk. Forbidden.

---

## 8. Ownership

| Object | Writer (later) | Reader |
|---|---|---|
| Landmark row | authored-systems (data) | mystery, landmarks |
| `mystery.visited` | mystery.js | epics, keepers |
| Data lots | data-trade / Archive (Assembly live; Unknowables WAIT) | hold, save |
| `hullKind` living | hangar | HUD (read only) |
| Digit 0 | station.js unchanged | dock |
| Portrait pick | none (hash) | People/hail |

`state.js` READ-ONLY this wave. Later presence PR should not need `state.js`. Later dock may need a **dedicated** `archiveDeskAllowed` serial in `station.js` + generator tables. Not Wave 92.

---

## 9. Serial PR plan (later wave — do not land in Wave 92)

| PR | Ships | Wave 92 |
|---|---|---|
| **PR1** | Boot pin: no `SYSTEMS` value with `faction === 'unknowables'`. Pin `DETAIL_STATIONS` misses `unknowables`. Pin `archiveDeskAllowed` assembly-only. Pin Digit 0 shipyard. Pin `GATE_BUILDERS` / `NPC_FACTIONS` already include `unknowables` | **not this wave** |
| **PR2** | Authored landmark on `hush` (or owner-retuned host). Generic kind mesh. `mystery` discovery only. No station, no desk, no spawn inject | **not this wave** |
| **PR3** | Optional visitor Unknowables hull at that landmark. Explicit helper. Fail closed default **skip** if owner has not opened spawn | **not this wave** |
| **PR4** | Boot pins for landmark id, kind, host faction still hollow, no Archive on hush | **not this wave** |
| **PR5** | Unknowables origin Archive desk (400/900 swap) | **WAIT** Wave 82. Skip unless a successor owner line un-waits the dock **and** a non-placeholder station path exists |

Do not implement in Wave 92. Do not sneak PR5 into PR2.

---

## 10. Open owner questions (fail-closed defaults)

1. **First site type?** **Closed here:** wreck/beacon/anomaly presence. Not a generated dock.
2. **Landmark id / name / line / host?** Default `th_veil` / `The Veil` / `hush` / kind `anomaly`. Owner may retune. No ship in Wave 92.
3. **Unknowables visitor spawn at the landmark?** Default **off** (PR3 skip).
4. **Unknowables dock / Archive 900 cubes?** Default **Wait** (Wave 82). PR5 skip.
5. **D3 station sculpt / placeholder dock?** Default **no**. Successor owner + non-placeholder path required before any origin desk.
6. **Unknowables epic stages?** Default **omit**.
7. **FACTION_SERVICES / voice lines for a later dock?** Default static Echo in that successor PR; do not invent standing deltas.
8. **New clue on hush?** Default **no** (keep authored clue count 6).

Do not invent UU / drop / standing while waiting.
