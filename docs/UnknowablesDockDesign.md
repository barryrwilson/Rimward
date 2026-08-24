# RIMWARD Unknowables live site: presence first, dock waits

| Field | Value |
|---|---|
| **Title** | RIMWARD Unknowables live site: presence first, dock waits |
| **Author** | Wave 92 Unknowables integrator |
| **Date** | 2026-08-22 |
| **Status** | Wave 94 — Wait reversed. Origin dock is `veil` / The Quiet. Presence landmark `th_veil` on hush. |
| **Wave** | 92 — design. Later — impl. |
| **Owner request** | Content decision for an Unknowables live site. Wave 42: content, not rendering. Wave 82: system Wait; do not invent a dock; EXP rival 900 for cubes at a later dock; own crystal 400 at origin. Honor live `DETAIL_STATIONS` (10 keys; unknowables build none). No `src/` this wave. |
| **Merge law** | [`out/w92/unk/shared-contract.md`](../out/w92/unk/shared-contract.md). If this brief and that file conflict, the contract wins. |
| **Honor** | [`docs/OwnerDecisionsWave82.md`](OwnerDecisionsWave82.md) (do not edit). [`docs/ExpDataTradeDesign.md`](ExpDataTradeDesign.md) (read; do not edit). Wave 42 notes in `PROGRESS.md` (do not edit). |

**Verifier record:**

| Note | Path |
|---|---|
| Inventory (code wins) | [`out/w92/unk/current-unk-inventory.md`](../out/w92/unk/current-unk-inventory.md) |
| Merge law | [`out/w92/unk/shared-contract.md`](../out/w92/unk/shared-contract.md) |
| Security review | [`out/w92/unk/security-review.md`](../out/w92/unk/security-review.md) |
| Design-doc review | [`out/w92/unk/code-review.md`](../out/w92/unk/code-review.md) |
| UI audit | [`out/w92/unk/ui-audit.md`](../out/w92/unk/ui-audit.md) |

Do **not** edit `src/`, `PROGRESS.md`, `docs/PLAYER-EXPERIENCE-WISHLIST.md`, Bio0x docs, Nav docs, `docs/OwnerDecisionsWave82.md`, or `docs/ExpDataTradeDesign.md`.

---

## Overview

Unknowables already have a faction key, GLB ships, a gate sculpt, overlay FX, portraits, living-hull force, and a yard catalog row. **No live `SYSTEMS` row flies the banner.** Assembly Archive already files legal cubes at 400 UU and rival crystals at 900 UU. An Unknowables origin desk that would file own crystals at 400 and rival cubes at 900 **does not exist**. Wave 82 left that desk on **Wait**.

Wave 42 said giving them a live site is a **content** decision. This brief picks **one** first site: a wreck / beacon / anomaly **presence** on an existing system (Wave 27 kinds). It is **not** a generated SYSTEM with a station. It is **not** a dock. `DETAIL_STATIONS` stays without `unknowables` (D3). Digit 0 stays shipyard. Player Unknowables hulls stay hangar-forced living. EXP numbers are copied from Wave 82, not invented. Wave 92 lands this markdown only.

---

## Background & Motivation

### Current state (inventory)

Source of truth: [`out/w92/unk/current-unk-inventory.md`](../out/w92/unk/current-unk-inventory.md). Code wins over Wave 42 table counts.

| Surface | Today | Cite |
|---|---|---|
| `FACTIONS.unknowables` | live | `state.js` 581 |
| Live systems flying it | **0** | `authored-systems.js`; `galaxy.generated.js`; `generate-galaxy.mjs` 261–265 |
| `DETAIL_STATIONS` | **10** keys; no `unknowables`; no `beautiful` | `station.js` 546–557 |
| Beautiful station | grown `buildBeautifulStation` | `station.js` 294–295 |
| Unknown faction station | placeholder | `station.js` 296–299 |
| Models Browser station | 10 + beautiful + placeholder; **no** `station:unknowables` | `model-catalog.js` 116–145 |
| `GATE_BUILDERS` | **12** keys including `unknowables` | `gates/index.js` 14–27 |
| Unknowables gate FX | lenses + plasma | `gate.js` 411 |
| Ships | GLB + idle clip; `NPC_FACTIONS` includes `unknowables` | `ship-assets.js` 7–10, 33 |
| Wave 42 field builder | **stale**; not in live `npc.js` | inventory §1 |
| Cast spawn | `def.faction` / neighbor / independent / redledger | `world.js` 327–380 |
| Contacts | no Unknowables system | `contacts.js` 90–100 |
| `EPICS` | freehold, redledger, veridian, hollow only | `state.js` 773–834 |
| Archive | Assembly only; cube 400; crystal 900 | `station.js` 1167–1168; `data-trade.js` 21–24, 187–201 |
| Drop | 0.20 on Assembly / Unknowables hulls | `data-trade.js` 18–19 |
| Yard | living `light`; no live dock | `shipyard.js` 30, 42 |
| HullKind | Unknowables → `living` | `hangar.js` 96–100, 417–424 |
| Portraits | `PORTRAIT_SOURCES.unknowables` + webp files | `portraits.js` 35–46; `public/assets/portraits/` |
| Digit 0 | shipyard | `station.js` 180, 5780–5788 |
| `h()` | `textContent` | `station.js` 4238–4243 |
| Generator Unknowables | no cluster, no `LM_TONE`/`CT_TONE` | `generate-galaxy.mjs` |

Stale Wave 42 counts (8 station keys, 9 overlay keys) are **not** live. `OVERLAY_FACTIONS` the table is gone; `GATE_BUILDERS` is the lockstep overlay set.

### Pain points

- Wishlist / EXP-02 “their stations”: no Unknowables dock. A worker who authored buy-at-Unknowables would ship a dead verb (EXP brief already said this).
- A generated system with a station would hit **placeholder** (D3: they build no stations) and would still need contacts, epic, market, Archive, generator tones, and totals in lockstep.
- Opening Archive on a placeholder would be a cheat origin desk.
- Inventing UU / a third SKU / a train Digit would fight Wave 82 and Digit 0 law.
- Inventing a field-only `npc.js` path would fight live GLB `NPC_FACTIONS`.

### Why now (design) / why not now (code)

The owner asked for the content decision so a later serial can land a **presence** against a frozen pick instead of a drive-by `SYSTEMS` faction flip. Wave 82 still **Waits** the dock. Implementation of even the landmark waits on a later wave so proto ids, mystery clue-count, Digit 0, and EXP lockstep exist on paper first. Wave 92 does not bind `src/`.

---

## Goals & Non-Goals

### Goals

1. Document live Unknowables coverage from **code** (systems, stations, gates, ships, markets, contacts, epics, EXP, portraits).
2. Pick **one** first live site: wreck/beacon/anomaly presence on an existing system.
3. List every table that must stay in lockstep for that pick, and the fuller set if a successor ever un-waits a dock.
4. Copy Wave 82 EXP integers. Do not invent a third SKU. Rival cubes 900 stay on a **later** Unknowables dock.
5. Freeze Digit 0 shipyard, living hull force, no train desk, `textContent` only, no new persist key.
6. Freeze portraits: files exist → later People may show them.
7. Freeze a serial PR plan. This wave writes the brief. A later wave ships serially. PR5 dock stays Wait.

### Non-goals (locked — do not reopen)

- No `src/` or live bindings in Wave 92. No GLB bake. No `package.json`.
- No generated Unknowables SYSTEM with a station.
- No `DETAIL_STATIONS.unknowables`. No placeholder origin desk.
- No Unknowables train desk. No Digit steal.
- No power ledger, police leave, BIO-01/02/04, NAV, living-frigate buy, aim-glass.
- No invented UU, drop %, or standing delta.
- No third data SKU.
- No Unknowables epic stages.
- No new clue (keep authored clue count 6).
- Do not edit the wishlist, `PROGRESS.md`, Wave 82, EXP brief, or Bio/Nav docs.
- Do not “fix” WAVE4 fence, WAVE26 ferry/haul, or WAVE35 haul boot FAILs.
- Do not restore the deleted `npc.js` field builder as a dock requirement.

---

## Proposed Design

### 1. Merge resolutions (contract wins)

| Question | Integrator freeze | Why |
|---|---|---|
| First live site? | **Wreck/beacon/anomaly presence** on existing system | Wave 27 kinds; D3; Wave 82 Wait dock |
| Generated SYSTEM + station? | **No** | Placeholder + lockstep smash; inventory §13 |
| Host? | Default **`hush`**. Faction stays `hollow` | Existing authored row; rim strangeness |
| Landmark kind? | Default **`anomaly`** | Not a station |
| Landmark id? | Default **`th_veil`**. Owner may retune | Authored literal |
| Dock / Archive 900 cubes? | **Wait** | Wave 82 |
| Own crystal 400? | Origin desk only. **Not** an Assembly buy | Live `archiveFilePrice`; contract §3 |
| Third SKU? | **No** | Wave 82; two tokens only |
| `DETAIL_STATIONS.unknowables`? | **No** | D3 |
| Digit 0? | Shipyard | `station.js` 5780–5788 |
| Train desk? | **No** | Task freeze |
| Player hull? | Unknowables → `living` | `hangar.js` |
| Portraits? | Files exist; later People use them | `PORTRAIT_SOURCES` |
| Visitor NPCs at landmark? | Default **off** | Avoid sneak `def.faction` flip |
| New persist key? | **No** | Ride `mystery` |
| `innerHTML`? | **No** | `textContent` / `h()` |
| Epic? | **Omit** | `EPICS` has 4 keys |
| `state.js` this wave? | READ-ONLY | Markdown only |

### 1b. Lockstep tables (named freeze)

Code-wins names in brackets. Stale Wave 42 names in quotes.

**This pick (presence only) — do not edit except `hush.landmarks` in a later PR2:**

| Task name | Live table | Presence serial |
|---|---|---|
| `DETAIL_STATIONS` | `station.js` 546–557 (10 keys) | **unchanged**; still no `unknowables` |
| `DETAIL_SHIPS` | `NPC_FACTIONS` + GLB (`ship-assets.js` 7–10) | **unchanged** (already has `unknowables`) |
| `OVERLAY_FACTIONS` | `GATE_BUILDERS` (`gates/index.js` 14–27) + `gate.js` FX | **unchanged** (already has `unknowables`) |
| `FACTIONS` | `state.js` 567–582 | **unchanged** |
| generate-galaxy | `scripts/generate-galaxy.mjs` clusters/totals/tones | **unchanged** |
| contacts | `contacts.js` roster + `CT_TONE` | **unchanged** |
| epics | `EPICS` (`state.js` 773–834) | **unchanged** |
| market | `market.js` + Archive `archiveDeskAllowed` | **unchanged** (no Unknowables desk) |

**Later dock (PR5 Wait):** every row above plus generator tones/colors/patterns, a non-placeholder station path, one dockmaster, optional voice lines, Archive mirror. Missing any required row → fail closed. See contract §2.

### 2. Player outcome (later serial)

Fly the hush. Find a new anomaly at travel distance. The existing landmark toast names it. The hush gate stays hollow. The hush station stays Threshold (hollow sculpt). There is **no** Unknowables market, yard, People, or Archive there.

Assembly Archive is unchanged: legal cubes 400, rival crystals 900. Crystals still come from Unknowable hull drops (0.20) when such hulls exist. This presence does not by itself spawn them.

A later owner line may un-wait a real origin desk. That desk is **not** this first site.

### 3. Persist / sanitize

See contract §4.

Landmark id is an authored constant. `mystery.visited` already stores landmark ids. Do not persist portrait variant. Do not add `WORLD_FIELDS.unknowables`.

### 4. Later dock (Wave 94 — Wait reversed)

See contract §2.2 and §3.

If a successor un-waits:

- Non-placeholder station path **before** any UU desk.
- Generator + contacts + voice tables in lockstep, or fail closed.
- Archive on Market pane, not a new Digit.
- Own crystal 400; rival cube 900. Copy Wave 82. Hostile `standingRead(unknowables) < 0` no sale.
- Yard Digit 0 still shipyard; living `light` only; `rep < 0` no sale; no remount-on-buy.
- People may show `portraitFor('unknowables', id)`.

### 5. UI

See contract §5 and [`out/w92/unk/ui-audit.md`](../out/w92/unk/ui-audit.md).

**This wave:** no chrome.

**Later presence:** no new dock UI. Reuse landmark `commLine`.

**Later dock (Wait):** Archive confirm-papers family. Real `<button>`s. `aria-live` polite on `ui.notice`. Labels `textContent`. Reduced motion: same copy.

### 6. Events

Prefer live `'landmarkFound'` / `'commLine'`. No new frozen event for presence. Later Archive reuses existing pending/confirm; no new `ctx.js` freeze line unless a later PR proves `commLine` cannot carry a notice.

### 7. Coupling

| Sibling | Boundary |
|---|---|
| EXP | Assembly desk live; Unknowables desk Wait; no third SKU |
| BIO-01 | Gift stays Beautiful People. No Unknowables seed desk |
| BIO-03 | GLB ships already exist. Do not bake this wave |
| BIO-04 / power ledger | out |
| NAV | out |
| TGT-05 | May lock the landmark later as `landmark`. This brief does not write `ctx.targets` |
| REP | No new standing table. Kill helper already may write Unknowables when `Object.hasOwn(FACTIONS, key)` |
| MSN | No Unknowables dock chain |

### 8. Security

See contract §7 and [`out/w92/unk/security-review.md`](../out/w92/unk/security-review.md).

Threats: XSS copy, proto system/landmark ids, invented economy, placeholder Archive, Digit steal, `innerHTML`, new `localStorage` key.

### 9. PR plan (serial, later wave)

See contract §9. Named PR1–PR5. **Do not schedule or land them in Wave 92.** PR5 is Wait/skip by default.

---

## Key Decisions

1. First live site: **presence** (anomaly/wreck/beacon), not a generated dock.
2. Host default `hush`; faction stays `hollow`.
3. `DETAIL_STATIONS` does **not** gain `unknowables`.
4. EXP: copy 0.20 / 400 / 900 / 250. Cubes 900 at a **later** Unknowables dock only.
5. Own crystal 400 is Unknowables **origin**, not Assembly.
6. Digit 0 shipyard. No train desk. No Digit steal.
7. Player Unknowables hull stays `living`.
8. Portraits files exist; do not force text-only later.
9. `textContent` only. No new persist key.
10. Wave 92 is markdown. PR1–PR5 do not land here.

---

## Open owner questions (fail-closed defaults)

**Closed Wave 93** — [`docs/OwnerDecisionsWave93.md`](OwnerDecisionsWave93.md). Do not invent UU / drop rates / standing deltas. EXP copy: [`docs/OwnerDecisionsWave82.md`](OwnerDecisionsWave82.md).

1. **Landmark id / name / host / kind?** `th_veil` / `The Veil` / `hush` / `anomaly`.
2. **Visitor Unknowables hulls at the landmark?** **Off.**
3. **Un-wait the origin dock?** **Wait** (Wave 82). PR5 skip.
4. **Unknowables epic?** **Omit.**
5. **New hush clue?** **No.** Authored clue count stays 6.

---

## Regression risks

| Risk | Freeze |
|---|---|
| Generated Unknowables system hits placeholder dock | First site is presence only; no `SYSTEMS.faction` flip |
| Archive on placeholder | `archiveDeskAllowed` stays assembly; later dock requires non-placeholder |
| Invented UU / third SKU | Contract §3; Wave 82 copy |
| Own crystal 400 sold at Assembly | Assembly does not buy crystals (`station.js` 1252–1254) |
| Digit 0 stolen | No new `DOCK_KEY_SERVICES` key |
| Train desk | Explicit non-goal |
| Living hull becomes built | Hangar force stays |
| Text-only Unknowables faces despite files | `PORTRAIT_SOURCES` already has the key |
| `innerHTML` / proto id | `textContent`; authored ids; `Object.hasOwn` |
| New localStorage key | Ride `mystery` |
| Clue-count smash | No new clue |
| Generator totals drift | No cluster this serial |
| Restore Wave 42 field path as required | GLB is live; field comment is stale |
| Wave 82 Wait ignored | PR5 skip |
| WAVE4/26/35 “fixes” | Explicit non-goal |

---

## Acceptance direction (later impl)

Testable later; not this wave.

1. After PR2: `SYSTEMS.hush.faction === 'hollow'`. Landmark `th_veil` (or owner id) discoverable at 100 u. `mystery.visited` gains the id once. No Unknowables station, market, contact, or Archive.
2. No `SYSTEMS` value with `faction === 'unknowables'` until a successor dock line.
3. `Object.hasOwn(DETAIL_STATIONS, 'unknowables') === false`.
4. `archiveDeskAllowed('unknowables') === false`. Assembly Archive still 400/900 as live.
5. Digit 0 still shipyard. No `innerHTML`. No new `WORLD_FIELDS` key.
6. Hangar still forces Unknowables `hullKind: 'living'`.
7. Boot pins in PR1/PR4. Do not “fix” WAVE4/26/35.

---

## Ownership (summary)

See contract §8.

| Object | Writer | Reader |
|---|---|---|
| Landmark row | later authored-systems | mystery, landmarks |
| Data Archive Unknowables | PR5 Wait | — |
| `player.hullKind` | hangar | HUD |
| Digit 0 | none this serial | dock |

---

## Serial PR plan (implementable later)

Wave 92 does **not** touch `src/`. Later:

1. **PR1** Boot pins for absence (no Unknowables system; no `DETAIL_STATIONS.unknowables`; Archive assembly-only; Digit 0; kits already include ships/gates).
2. **PR2** Authored hush (or owner host) landmark. Generic kind. Discovery only.
3. **PR3** Optional visitor spawn — **skip** unless owner opens it.
4. **PR4** Boot pins for the landmark. Host faction unchanged.
5. **PR5** Unknowables origin Archive — **skip** unless Wave 82 Wait lifts **and** a non-placeholder station path exists.

No GLB bake, no `package.json`, no sibling-doc edits.
