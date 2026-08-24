# BIO-02 growth-and-training shared contract

**Wave:** 86. Design only. No BIO-02 feature ships in this wave.  
**Status:** MERGE LAW for `docs/Bio02EvolutionDesign.md`. If that brief and this file ever disagree, **this file wins**.  
**Not this wave:** any edit under `src/`, `scripts/`, `public/`, `index.html`, `package.json`. Do not edit `docs/PLAYER-EXPERIENCE-WISHLIST.md`, `PROGRESS.md`, `docs/BioLivingShipsDesign.md`, `docs/Bio01ObtainDesign.md`, `docs/Bio03*.md`, `docs/Bio04PsionicsDesign.md`, SHP/NAV docs, or sibling `out/w86/bio01/**` / `out/w86/bio04/**`.  
**Locked sources:** wishlist BIO-02 (`docs/PLAYER-EXPERIENCE-WISHLIST.md` 1068–1076); live inventory `out/w86/bio02/current-bio02-inventory.md`; Wave 70 living-ships §4 (`docs/BioLivingShipsDesign.md` — **read only**); `docs/OwnerDecisionsWave82.md`; `src/game/hangar.js`; `src/game/bio.js`; `src/game/shipyard.js`; `src/systems/ship.js`; `src/game/state.js` (READ-ONLY); `src/systems/station.js`; `src/systems/shipyard-desk.js`; `src/game/save.js`; `src/core/ctx.js`; `src/systems/hud.js`.

Integrator rule: a **later** implementation wave obeys this file. Inventory cites live code. Code wins over stale comments.

---

## 0. Law in one page

1. Wave 86 is markdown only. Implementation is a later **serial**. Do not schedule or land BIO-02 PRs here.
2. Live `bio.growth` is care made visible. It must **not** change `classKey`, `hullKind`, or `ctx.config.ship` by itself (`bio.js` 156–161).
3. Class set = live `SHIP_CLASSES` keys only: `light` `heavy` `freighter` `ace` `cutter` `frigate`. **No new career class keys.** Wishlist specialized forms (combat / mining / trade / exploration / stealth / support) are **out** of first impl.
4. First impl = **class-ladder** among existing **living buy** keys. Dest of first impl is **`heavy`**. Ladder stops at `heavy` (last `LIVING_STOCK` class).
5. Living **frigate buy stays omitted**. Training must **not** append `frigate` (or ace / freighter) to `LIVING_STOCK`. Frigate **evolution** is **owner-open** (owned-hull class change, not a yard SKU). Fail closed until that owner line exists: **do not** train to `frigate`.
6. Training is **Beautiful-dock-only** (`dockFactionOf === 'beautiful'`). Unknowables: **no dock** (Wave 42). Fail closed. Do not invent an Unknowables training desk. Unknowables-faction rows refuse even at a Beautiful Bloom.
7. No new `DOCK_KEY_SERVICES` key. Digit **0** stays Shipyard. Digit 1 Hangar / Digit 2 Yard stay. Training is a **Hangar-pane offer** at Beautiful docks (graft-pattern), not a mid-list Digit, not Digit 3 (would steal hull 3+).
8. Remount: mutate the **same hangar row** `classKey`, keep `hullKind: 'living'`, keep cargo, heal seats via existing `healLauncher` / `healTurret`. Then **`applyFlightEnvelope(ctx, classKey)`** (multiplier = **`burn / cruise`**, not `burn`) + living remount (`callRemount` / `applyMountedFlight`). `switchTo(id)` refuses `'already-mounted'` — do not call it for an in-place evolve.
9. HUD **never** writes `hullKind`. Grafted **built** hulls are not living and **must not** take this path.
10. Do **not** invent UU or standing deltas. Point at `docs/OwnerDecisionsWave82.md`. Price/rep **gates** are required; the integer and any extra rank floor are **owner-open**. Fail-closed candidate (not shipped until owner confirms): debit live `yardPrice('heavy', beautifulRep)` and refuse `rep.beautiful < 0`. **No** standing write on success.
11. `state.js` is READ-ONLY this wave **and** for the BIO-02 feature serial unless a **named catalog PR** is a separate owner. Prefer helpers next to `LIVING_STOCK` in `shipyard.js` / `hangar.js`.
12. No new `WORLD_FIELDS` key. No new `localStorage` key. Prototype-safe. No `innerHTML`. No new frozen `ctx.js` event unless an existing `notice` / `commLine` truly cannot carry the line (first impl: desk notice only).
13. Must not require a center visit before the starter can fire cannon. Feed Digit 4 stays feed. Training is optional.
14. Do not open BIO-01 gift/pirate, BIO-03 bake, BIO-04 psionics, power ledger, police leave, NAV, living-frigate **buy** SKU. Do not “fix” WAVE4 / WAVE26 / WAVE35 boot FAILs.

---

## 1. Preserve

| Must | Must not |
|---|---|
| Boot `buildLivingVisual` / `makeLivingHull` | Conventional starter as boot default |
| Living remount rebuilds swim / breath / heartbeat / veins / thrust surge | Skip vertex swim “because class evolved” |
| `GROWTH_SCALE_MAX` 0.15 still reads `bio.growth` | Use `bio.growth` as a classKey trigger |
| Unset `hullKind` → living mesh | Treat independent starter as `'built'` |
| Starter Digit 1/2 cannon ungated | Gate guns on a training visit |
| `ctx.bio` survives train / remount / park | Factory-reset companion |
| Envelope from `SHIP_CLASSES` via `applyFlightEnvelope` | Copy a parallel envelope table; `multiplier = burn` |

Player living mesh **does not** vary by `classKey` today (`ship.js` 526–528). First impl **keeps** that. Do not clone Beautiful NPC GLBs onto the player. Do not block BIO-02 on BIO-03 bake.

---

## 2. Growth vs training (split)

### 2.1 Live growth (keep, do not extend)

`bio.growth = min(1, bond * 0.7 + fedCount * 0.05)`. Visual only. `bio.js` remains the only `ctx.bio` writer.

Forbidden in `bio.js` / `ship.js` growth block:

- `player.classKey = …`
- hangar `classKey` mutate
- `applyFlightEnvelope`
- remount
- credit debit

### 2.2 Training (later impl — Beautiful Hangar papers)

A **paid, confirmed, dock-gated** class change on **one mounted living hangar row**.

Not a second hull. Not a yard buy. Buy still adds a row and does not remount (`purchaseYardHull`).

---

## 3. First-impl ladder (existing keys only)

### 3.1 Stock fence

Training dest keys ⊆ live `LIVING_STOCK` = `light` `cutter` `heavy`.

Never dest: `ace`, `freighter`, `frigate` in first impl.

Never **add** keys to `SHIP_CLASSES` or `LIVING_STOCK`.

### 3.2 Next class (freeze)

```
from ∈ { light, cutter }  →  dest = heavy
from === heavy            →  none (top)
else                      →  none (not on first-impl ladder)
```

`light` → `heavy` is the starter path. `cutter` → `heavy` is the larger living-buy hop (cutter hull 80 → heavy 160). Do **not** train `cutter` → `light` (starter class is not a “larger” form). Do **not** train `light` → `cutter` (cutter hull is smaller; that is a lateral career, which is **out**).

### 3.3 Frigate / ace / freighter

| Path | Freeze |
|---|---|
| Yard **buy** frigate / ace / freighter living | **Keep omit** (`LIVING_STOCK` unchanged) |
| Train to `frigate` | **Owner-open.** Fail closed: no. If a later owner line allows it, it is an **owned-hull `classKey` mutate**, never a SKU append |
| Train to `ace` / `freighter` | **Owner-open** (wishlist career-adjacent). Fail closed: no |

Persist may already store `classKey: 'frigate'` (`classKeyOf` admits live keys). That does not create a buy SKU and does not unlock first-impl training.

### 3.4 Specialized careers

Wishlist branches into combat / mining / trade / exploration / stealth / support: **out**. Do not invent six keys. Do not alias `ace`/`freighter` as those careers in first impl.

---

## 4. Eligibility vs Hangar paint (fail closed)

**Mutate** and **paint** are not the same list. Do **not** copy `graftOfferVisible` (`shipyard-desk.js` 142–151): that helper hides on `dockReputation < 0`. Train at a hostile Bloom must still **say why** (`No sale.`). Credits short must still **show papers**. Never a mute Train button. Never the string “not available.”

Grafted built: not this path. Independent living at Beautiful: **yes** (starter is independent). Beautiful-faction living: **yes**.

### 4.1 Mutate gates (`trainMounted` / Confirm)

Confirm succeeds only when **all** are true. Helper refuse otherwise. No debit on refuse.

1. `ctx.flags.docked` and not combat / jump / paused / destroyed (same family as `switchTo` / `graftMounted`).
2. `dockFactionOf(ctx) === 'beautiful'`.
3. After `sanitizeHangar`, a mounted row exists.
4. Pending `mountedId` (if armed) **equals** `hangar.mountedId`. Mismatch → refuse `missing`, no debit (graft `shipyard-desk.js` 165–167).
5. Mounted `hullKind === 'living'` (unset living via `meshKindFor` is not enough if the row is `'built'`).
6. Row and player faction are **not** `'unknowables'`.
7. `grafted !== true` (living sanitize already drops it; still refuse if a blob smuggles it).
8. Current `classKey` is `light` or `cutter` (has dest `heavy`).
9. Beautiful standing `dockReputation(ctx, 'beautiful') >= 0` (live yard hostile rule). Do **not** invent a Sworn/min-rep extra. Live `MIN_REP.heavy` is **0**.
10. Owner UU is confirmed (see §6) **and** credits ≥ that debit. If the owner has not confirmed a number, later impl **must not ship a debit**.

### 4.2 Beautiful Hangar matrix (PR2 — one layout)

Non-Beautiful docks: **hide** all Train chrome (no note, no dead button).

Beautiful Hangar only (owner UU confirmed unless the last row):

| State | Control | Copy |
|---|---|---|
| Eligible + owner UU | `Train hull` button + price | none extra |
| Hostile `rep < 0` | **no** Train button | note `No sale.` (yard `shipyard-desk.js` 214–216, **not** graft hide) |
| Short credits | keep **Offer** so papers can show dest + cargo-keep; Confirm refuses | confirm / notice `Not enough credits.` |
| Already `heavy` | **no** Train button | `This hull is already as large as this dock trains.` |
| Built / grafted | **no** Train button | `Training is for living hulls.` |
| Unknowables | **no** Train button | `The Unknowables do not train here.` |
| Ace / freighter / frigate living | **no** Train button | `This dock does not train that class.` |
| Owner UU still open | **omit** offer (no mute button) | do not invent a price |

Hostile and short credits are **desk** states, not hull-hide states. A living `light`/`cutter` at a hostile Bloom still gets the `No sale.` note. A living `light`/`cutter` that is short UU still gets the Offer.

### 4.3 Refuse-line priority (first match, never stack)

One note. **No** Train button except Eligible and Short-credits Offer:

1. Unknowables
2. Built / grafted
3. Off-ladder or already-heavy (`ace` / `freighter` / `frigate` / `heavy`)
4. Hostile `No sale.`

Do not concatenate two reasons. Short credits does not replace those notes: if a hull is already ineligible, paint that hull line and skip the Offer.

---

## 5. Remount sequence (later impl)

`switchTo` is the only **row swap** remount today. In-place evolve **must not** call `switchTo(mountedId)` (`already-mounted`, `hangar.js` 692).

Confirm success (atomic; snap like `switchTo` on throw):

1. Refuse list §4.1. In-flight lock (same family as `buyInFlight` / `graftMounted`).
2. `parkMounted` so the row holds live cargo / gear.
3. Mutate **that same row**: `classKey = 'heavy'`. Keep `id`, `hullKind: 'living'`, `faction`, `name`, `cargoCapacity` (do **not** reset to 20), `cargo`, scanner / mining / concealed.
4. Re-run seat heal: `healLauncher(newKey, launcher)` / `healTurret(newKey, turret)` / `healMissileAmmo`. Do not invent a parallel stripper. Light/cutter → heavy **gains** seats (table 0 → 2/2); empty stays empty.
5. Recompute vitals max from `createShipState('heavy')`; clamp current pools with `Math.min` (do **not** full-repair as a side effect). `sanitizeHangarRecord` already does this if the impl re-sanitizes the mutated raw row — prefer that over a new vitals helper.
6. `loadMountedRow` (or equivalent copies already in hangar.js).
7. `applyFlightEnvelope(ctx, 'heavy')`. Multiplier **`burn / cruise`**.
8. Unknowables force does not apply (refused). Keep `hullKind: 'living'`.
9. `callRemount` → `remountPlayerHull` → `buildLivingVisual()` (class-agnostic CPU mesh).
10. Debit credits; clamp `credits >= 0`. `requestAutosave`.
11. Do **not** reset `ctx.bio`. Do **not** write HUD. Do **not** emit a hangar blob.

If the trained row is **not** mounted (first impl: mounted-only, so this is out): only mutate the parked row; remount waits on a later `switchTo`.

---

## 6. Price and standing (no invented UU / deltas)

Wave 82 did **not** author a train UU or a train standing delta (`docs/OwnerDecisionsWave82.md` 87–99, 13).

| Item | Freeze |
|---|---|
| Debit required | Yes, on confirm only. Esc = no debit |
| UU integer | **Owner-open.** Do not invent `TRAIN_LIST_UU` in this brief |
| Fail-closed candidate | Reuse live `yardPrice('heavy', dockReputation(beautiful))` — catalog reuse, **still needs owner check-off** before impl ships |
| Rank discount | Only if owner confirms reuse of `yardPrice` |
| Hostile Beautiful | Mutate refuse `reputation`. Hangar **paints** `No sale.` — does **not** hide like graft |
| Success standing write | **None.** Do not invent +N |
| Extra Sworn gate | **Owner-open.** Default: no (live `MIN_REP.heavy` is 0) |
| Short credits | Mutate refuse `credits`. Hangar **keeps Offer** so papers can show dest + cargo-keep. No partial debit |

Until an owner line exists (this file’s candidate or a successor in OwnerDecisions), later impl **blocks on price**. Do not ship a magic number.

---

## 7. Desk / Digit / copy

### 7.1 Surface

Beautiful Shipyard → **Hangar** pane. Pattern = Gilded **Graft tissue** (`shipyard-desk.js` 238–275): after `hulls.forEach`, one **full-width** `shipyard-buy-row` **under** the hull list. Not beside the cards. Not a side column.

Paint that row from the §4.2 matrix. Eligible / short-credits: `Train hull` button. Hostile / ineligible hull: note only, **no** button. Pending pane uses `shipyard-buy-row shipyard-confirm` and **replaces** the hull list (graft 238–252), so Digit 3+ has nothing to mount.

Not:

- a new `DOCK_KEY_SERVICES` entry
- Digit 3 tab (steals hull Digit 3+)
- Feed & tend (Digit 4)
- Repair
- a new overlay or z-index (reuse `.shipyard-buy-row.shipyard-confirm`)

Digit 0 / KeyY still open Shipyard. Digit 1 Hangar, Digit 2 Yard unchanged. Hull 3+ still mount when the list is showing.

Beautiful Hangar legend (this banner only): append `Train on Hangar · Esc cancels papers`. Do not add a Digit for Train. Do not steal hull 3+ / 0.

### 7.2 Papers (mandatory)

Two-step, same family as yard **Confirm papers**:

1. Arm `ui.trainPending = { fromClass, destClass: 'heavy', mountedId }` next to `ui.graftPending` (`station.js` 4225).
2. Confirm name is the class hop in text: `light → heavy` or `cutter → heavy` (`classLabel` / `hasOwn(SHIP_CLASSES)`). Optional hull display name through `sanitizeName` / `stripControlChars` only. **Never** print `mountedId`.
3. Meta: `{price} UU · Confirm papers` once owner UU exists. Next sibling: `h('div', 'screen-note', box, 'Hold stays with this hull. The yard does not dump cargo.')` — always, including `reducedMotion`. Then Confirm papers (warm) **before** Esc — Cancel.
4. Confirm: re-read `mountedId`; mismatch → refuse, no debit. Then §5. `redraw()` so CREDITS / HOLD in the station head update (`station.js` 5607–5609). Notice on success or `Not enough credits.`
5. Clear pending with **no** debit and **no** mutate on every live graft chrome path:

| Site | Live graft cite | Train freeze |
|---|---|---|
| Leave Hangar pane | `setShipyardPane` 78–79 | Null `trainPending` when pane is not Hangar |
| Esc first (level 2 shipyard) | `station.js` 5723 | `cancelTrainPending` in the **same** gate as `cancelGraftPending \|\| cancelYardPending` |
| Esc fallthrough to level 1 | 5732 | Null `trainPending` with the other pendings |
| ← Back | 5628–5635 | Null `trainPending` |
| `selectService` | 5655 | Null `trainPending` |
| `dock` | 5674 | Null `trainPending` |
| `undock` (Esc/B from menu; KeyB from level 2) | 5697 | Null `trainPending` (`KeyB` does not hit the Esc cancel branch) |

Export `cancelTrainPending` next to `cancelGraftPending`. Hotkey must **not** one-click debit. Digit 3+ while pending: no-op like `graftPending` (`handleShipyardDigit` 324).

### 7.3 Copy (never “not available”)

Hangar layout = §4.2. Echo lines (owner may retune wording only):

| Case | Line |
|---|---|
| Cargo-keep (pending `screen-note`) | `Hold stays with this hull. The yard does not dump cargo.` |
| Confirm name | `light → heavy` or `cutter → heavy` |
| Success | `The hull takes the heavy form.` |
| Top already (`heavy`) | `This hull is already as large as this dock trains.` |
| Built / grafted | `Training is for living hulls.` |
| Unknowables faction | `The Unknowables do not train here.` |
| Off-ladder living (ace / freighter / frigate) | `This dock does not train that class.` |
| Hostile | `No sale.` |
| Credits | `Not enough credits.` |
| Dock / combat / jump / pause | Reuse switch family (`Dock first…` / `Cannot switch in combat.` etc.) or train-prefixed twins. Not “not available.” |
| Non-Beautiful dock | **Hide** the offer (no dead button) |

World strings: `textContent` / `h()` / `btn()`. **No `innerHTML`.** Names through existing `sanitizeName` / `stripControlChars`. Do not interpolate raw save ids.

---

## 8. Persist / events / HUD

| Object | Persist | Notes |
|---|---|---|
| Evolved class | Hangar row `classKey` | Existing allowlist |
| Envelope | **Do not persist** `config.ship` | Restore uses `applyMountedFlight` |
| `hullKind` | `'living'` stays | HUD reads; HUD never writes |
| `ctx.bio` | Wholesale bio | Unchanged by train |
| Train pending | Session `ui` only | Not `WORLD_FIELDS` |
| New `localStorage` | **Forbidden** | |
| New `WORLD_FIELDS` key | **Forbidden** | |
| New frozen event | **Forbidden** first impl | Desk `ui.notice`. If a later owner needs `commLine`, literal `{ text, from }` only. Never `emit('…', row)` |

Sanitize already maps unknown `classKey` → `light`. Do not add a train flag.

---

## 9. Security

1. `classKey` dest must be `Object.prototype.hasOwnProperty.call(SHIP_CLASSES, dest)` **and** dest === `'heavy'` in first impl. Ignore pending blobs that name `__proto__` / career strings.
2. `RESERVED_IDS` on any faction/id read. `Object.prototype.hasOwnProperty` / `Object.hasOwn` — never `for…in` assignment from a save blob onto reputation or hangar.
3. Credits: `Number.isFinite`, integer debit, refuse if short, clamp `>= 0`.
4. `ctx.emit` never spreads a hangar row (smash `type`, `ctx.js` 248–249).
5. No `innerHTML`. No `eval`. No remote mesh.
6. Prototype hull ids already gated (`isSafeHullId`). Training does not mint ids.
7. `SAFE_ID` matches `__proto__` — do not use raw id strings as object keys.

---

## 10. Ownership (later impl)

| Object | Writer | Reader |
|---|---|---|
| `bio.growth` | `bio.js` | `ship.js` scale |
| Hangar `classKey` on train | New hangar helper (prefer `hangar.js`) | envelope, seats, HUD identity |
| `ctx.config.ship` | `applyFlightEnvelope` | `ship.js` flight |
| Player mesh | `remountPlayerHull` | cameras, combat |
| `player.hullKind` | hangar / yard / save / Unknowables force | HUD |
| Desk pending | `shipyard-desk.js` `ui.trainPending` | station keydown / Back / dock / undock / pane |
| `state.js` | **not BIO-02** | import only |
| Digit map / `DOCK_KEY_SERVICES` | **not BIO-02** | |

HUD must not write `classKey` or `hullKind`.

---

## 11. Serial PR plan (later wave only)

Do **not** land these in Wave 86.

| PR | Lands | Does not land |
|---|---|---|
| **PR1 helper + refuse** | `nextTrainClass` / `trainMounted` refuse matrix; dest `heavy` only; Beautiful banner; living-only; Unknowables refuse; no `state.js` | Debit if owner UU still open; desk |
| **PR2 papers desk** | Hangar matrix §4.2; `ui.trainPending` + cancel sites §7.2; hop name; cargo-keep `screen-note`; Digit 1/2 unchanged | New Digit service; graft-style hostile hide |
| **PR3 mutate + remount** | Same-row `classKey`; `applyFlightEnvelope` + `applyMountedFlight`; keep cargoCapacity + cargo; heal seats; bio untouched; autosave | Career keys; frigate dest; GLBs |
| **PR4 owner debit** | Integer debit **after** OwnerDecisions line (or confirmed `yardPrice('heavy')` reuse) | Invented UU |
| **PR5 boot pins** | Starter cannon ungated; growth still not remounting; Digit 0 shipyard; no innerHTML. `scripts/boot-test.mjs` in **that** wave | WAVE4/26/35 “fixes”; wishlist / PROGRESS.md |

If PR4 is blocked on owner UU, PR1–PR3 may land **behind a hard refuse `credits`** that never mutates, **or** wait. Do not debit 20000 “because the yard table exists” without the owner check-off.

---

## 12. Closed doors (do not reopen)

- Six career class keys / new dock Digit / new Digit 3 Shipyard tab
- `bio.growth` → `classKey`
- `multiplier = burn`
- `switchTo(mountedId)` as the in-place evolve call
- Living frigate / ace / freighter **buy** SKU
- Unknowables training desk
- HUD write of `hullKind`
- Grafted built training
- Copying `graftOfferVisible` reputation hide onto Train (hostile Bloom must paint `No sale.`)
- Leaving `ui.trainPending` armed after Back / Yard tab / B-launch
- Factory-reset `ctx.bio` or dump cargo
- Growth-center required for starter cannon
- New persist key / new frozen event / `innerHTML`
- Invented UU / standing deltas
- BIO-01 / BIO-03 bake / BIO-04 / power ledger / police leave / NAV
- Player living GLB swap “for class identity”
- `state.js` feature rewrite in the BIO-02 serial
