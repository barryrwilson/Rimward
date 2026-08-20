# Wave 60 POD inventory (code wins)

**Wave:** 65 working notes. Design only.  
**Scope:** what Wave 60 (and later shipyard digits) actually shipped for survivors.  
**Rule:** file:line cites below. Stale comments lose to code.  
**Not this file:** trafficking prices, tone, or a Gilded desk. Those live in `docs/Pod02TraffickingDesign.md` and `out/w65/pod/shared-contract.md`.

---

## 1. Cargo shape

| Fact | Today | Cite |
|---|---|---|
| Live survivor row | JSON-plain `{ commodity: 'survivor', units, faction, source, name? }` | `src/game/pods.js` 19–21, 536–542 |
| `source` enum | `playerKill` or `other`. Anything else becomes `other`. | `pods.js` 46–47, 474–476, 462 |
| `survivorKey` | `` `${faction}:${source}` ``. Null when not survivor cargo. Empty-string faction is allowed in the key. | `pods.js` 458–464 |
| `isSurvivorCargo` | `entry.commodity === 'survivor'` | `pods.js` 454–456 |
| Reserved faction keys | `isFactionKey` rejects `''`, `__proto__`, `constructor`, `prototype` | `pods.js` 466–472 |
| Scoop merge | Survivors stack only when both rows are survivors, `isFactionKey(held.faction)`, same faction, same normalized source. Empty `[]` pods add nothing. | `pods.js` 478–487, 500–513 |
| Copy on scoop | Drops the row if faction fails `isFactionKey`. Copies `name` only when a non-empty string. **Does not** cap name length. | `pods.js` 489–497 |
| Spawn | `spawnSurvivorPod` returns `null` if faction fails `isFactionKey`. Units always `1`. Optional `name`. Tint `0x4a6e82`. Mesh name `survivor-pod`. | `pods.js` 44, 536–543 |

`addCargo(ctx, 'survivor', units)` in station **does not** attach faction/source (`station.js` 1024–1027). Market never calls it for people (`tryTrade` refuses first). A later sale verb must not use `addCargo` / `removeCargo` for survivors.

---

## 2. Spawn / scoop (do not reopen)

| Fact | Today | Cite |
|---|---|---|
| Crew spawn | `spawnShipSurvivor` → `spawnSurvivorPod` | `src/systems/npc.js` 1317–1336, 2134–2135; jettison 1303–1306 |
| Provenance | `lastAttackerOf(live) === 'player'` → `playerKill`, else `other` | `npc.js` 1308–1310, 1325 |
| Unknowables | **No spawn.** `faction === 'unknowables'` returns null. Missing faction also skips. | `npc.js` 1313–1322 |
| Double dump | `ai.survivorsSpawned` blocks a second crew pod | `npc.js` 1320, 1335 |
| Scoop | Auto-scoop in `initPods.update` when not docked, in range, hold has room. `mergePodContents`. | `pods.js` 598–611 |
| This design | Do **not** change scoop, spawn, tint, merge key, or Unknowables skip. | Locked non-goal |

---

## 3. Rescue (must stay)

| Fact | Today | Cite |
|---|---|---|
| Matching-faction count | `survivorUnitsForFaction` — same `faction`, finite units `1..floor(cargoCapacity)` else 0 | `station.js` 933–956 |
| Other-faction names | Display names from `FACTIONS` only. Unknown ids stay silent. | `station.js` 957–968 |
| Remove order | `'other'` first, unknown source next, `playerKill` last | `station.js` 943–947, 969–991 |
| Apply | `applySurvivorRescue` requires `Object.hasOwn(FACTIONS, faction)`. Writes `reputation[faction]`. Emits `survivorRescued` + `commLine`. | `station.js` 998–1022 |
| Rescue deltas | `other` **+4**, `playerKill` **+1** per unit | `src/game/state.js` 267–272; applied `station.js` 1011 |
| Spoken lines | Spare. `{faction}` is the display name. `playerKill` vs not. Mixed source speaks the non-kill line. | `state.js` 270–271; `station.js` 993–996, 1017–1018 |
| UI — People | Digit **7** service `people`. `renderRescue` then contacts. Button **Return survivors**. | `station.js` 119, 1976–1997, 2198 |
| UI — dock home | Level-1 **also** calls `renderRescue` (second Return if you opened People). | `station.js` 2208; `out/w60/rescue/code-review.md` |
| Non-matching cargo | Note only: `Some aboard belong with the {names}.` No return. | `station.js` 1991–1993 |
| People digits | Level-2 `people` has **no** Digit handler. Return is click-only. | `station.js` 2289–2313 |

---

## 4. Market cannot sell people

| Fact | Today | Cite |
|---|---|---|
| `COMMODITIES` | No `survivor` row. Staples + seven ores only. | `state.js` 286–300 |
| Market table | `COMMODITY_KEYS = Object.keys(COMMODITIES)`. Survivors never listed. | `station.js` 1468, 1674–1689 |
| `isMarketCommodity` | `Object.hasOwn(COMMODITIES, key)` | `station.js` 930–932 |
| `tryTrade` | Refuses `!isMarketCommodity(key) \|\| key === 'survivor'`. Notice: `This dock does not trade in people.` | `station.js` 1600–1604 |
| `removeCargo('survivor')` | Immediate no-op. Cannot drain people via sell. | `station.js` 1035–1036 |
| `priceOf('survivor')` | Not a market key → `ctx.world?.prices?.[key] ?? 0`. Live markets are built from `COMMODITY_KEYS` only (`buildTable` loops those keys), so the live value is **0**. A tampered `world.prices.survivor` would change this unless the impl adds an explicit guard. | `station.js` 1045–1048; `src/game/market.js` 35, 61–66 |
| `cargoValue` | `prices[c.commodity] ?? COMMODITIES[c.commodity]?.base ?? 0`. Same tamper hole. | `state.js` 1070–1071 |
| Market hotkeys | Q/W buy 1/5, A/S sell 1/5 on the selected `COMMODITY_KEYS` row. | `station.js` 2279–2286 |

---

## 5. Persist

| Fact | Today | Cite |
|---|---|---|
| `WORLD_FIELDS` | time, credits, fear, reputation, … hangar. **No** survivor-specific world key. Provenance rides cargo rows. | `src/game/save.js` 73–92 |
| Cargo snapshot | `sanitizeCargoList` → `sanitizeCargoRow` | `save.js` 160–168, 180 |
| Survivor row keep | `commodity`, `units` (finite ≥1), `source` (`playerKill` else `other`), optional `faction` via `sanitizeFaction`, optional `name` via `sanitizeSurvivorName` | `save.js` 136–155 |
| Name cap | Control chars stripped. `trim`. Slice **40** (`NAME_MAX`). Empty → omit. | `save.js` 96, 100–110, 130–134 |
| Faction allow | `FACTIONS` / `SYSTEMS` own key, or `SAFE_ID`. Length ≤ 64. | `save.js` 121–127 |
| Extra keys | Dropped. `__proto__` / `constructor` are not copied onto the row object. | `save.js` 146–155 |
| Milestones | `world.milestones` already persists (string ids). Hermit first-trade is `'hermitMarket'`. | `save.js` 76; `station.js` 1658–1660 |

---

## 6. Dock digit law (Wave 64, not Wave 60)

Wave 63 design said nine keys and Digit 0 rejected. **Code now has ten keys.** Digit 0 is Shipyard.

```
DOCK_KEY_SERVICES = market, jobs, bar, feed, repair, outfitting, people, launch, epics, shipyard
```

Cite: `station.js` 119, 2198–2209, 2262–2269.

| Index | Digit | Key | Label |
|---|---|---|---|
| 0 | 1 | `market` | Market |
| 1 | 2 | `jobs` | Jobs board |
| 2 | 3 | `bar` | Bar |
| 3 | 4 | `feed` | Feed & tend |
| 4 | 5 | `repair` | Repair |
| 5 | 6 | `outfitting` | Outfitting |
| 6 | 7 | `people` | People |
| 7 | 8 | `launch` | Launch |
| 8 | 9 | `epics` | Standing |
| 9 | **0** | `shipyard` | Shipyard |

Yard confirm law (pattern to copy, not to edit in this wave): Digit 3+ selects papers. It does **not** debit. `Confirm papers` buys. Pending Digit is a no-op. Cite: `src/systems/shipyard-desk.js` 123–127, 198–219. List prices live in code: `YARD_LIST_UU` (`src/game/shipyard.js` 16–23).

---

## 7. Events, HUD, settings

| Fact | Today | Cite |
|---|---|---|
| Frozen comment | `'survivorRescued' { faction, source, count, repDelta }` | `src/core/ctx.js` 213 |
| HUD toast | `■ A survivor is home.` / `■ ${n} survivors are home.` class `good`. Dedupes same-frame `commLine`. | `src/systems/hud.js` 409–416 |
| `survivorSold` | **Does not exist.** Do not emit in Wave 65. | — |
| Settings keys | `colorblind`, `highContrast`, `reducedMotion`, `muted`, `hints`, `textScale`, `masterVolume`. No copy-length key. | `src/systems/settings.js` 28–36 |
| Station DOM | `h()` sets `textContent` only. Overlay rebuild uses `overlay.textContent = ''`. | `station.js` 1454–1459, 2184 |
| Survivor names in UI | **Not shown.** Rescue copy uses counts + `FACTIONS[faction].name`. | `station.js` 1981–1993 |

---

## 8. Nearby numbers (for later tables)

| Table | Values | Cite |
|---|---|---|
| `RESCUE` | otherRep 4, playerKillRep 1 | `state.js` 267–272 |
| `RANK_LADDER` | Sworn 50 / Trusted 25 / Known 10 / Stranger −10 / Suspect −25 / Marked −1000 | `state.js` 650–657 |
| `ECON.fear` | capitulation 2, ransom 3, aceDefeated 5, killedSurrendered 8 | `state.js` 262 |
| `PATROL_REP` / `PATROL_REWARD` | 5 / 300 UU | `station.js` 136–137 |
| Commodity bases | provisions 100, rawOre 140, refinedMetals 240, restrictedComponents 550 | `state.js` 287–289 |
| `FACTIONS` keys | freehold, redledger, veridian, hollow, independent, ferrous, gilded, beautiful, congregation, assembly, lamplighter, unknowables | `state.js` 527–541 |
| Gilded display | `Gilded Chain` | `state.js` 536 |

---

## 8b. Hangar (Wave 64, adjacent)

Mounted cargo is `ctx.cargo`. Parked hulls carry their own `cargo` arrays on `world.hangar.hulls`. Rescue and market today read `ctx.cargo` only. A later sale must do the same.

---

## 9. What Wave 60 did **not** ship

- No Gilded sale. No black-market desk on Independent / Hollow / Beautiful / others.
- No `survivorSold` event. No `peopleTrafficked` milestone.
- No `COMMODITIES.survivor`. No market price walk for people.
- No confirm flow for Return.
- No trafficking copy.
- Unknowables still cannot spawn; a hand-edited save **can** carry `faction: 'unknowables'` because `sanitizeFaction` allows `FACTIONS` keys (`save.js` 123–126).
