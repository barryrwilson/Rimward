# BIO living ships shared contract

**Wave:** 70. Design only. No BIO feature ships in this wave.  
**Status:** MERGE LAW for the integrator brief. If `docs/BioLivingShipsDesign.md` and this file ever disagree, **this file wins**.  
**Not this wave:** any edit under `src/`, `scripts/`, `public/`, `index.html`, `package.json`. Do not edit `docs/PLAYER-EXPERIENCE-WISHLIST.md`, `PROGRESS.md`, `docs/ShpDesign.md`, `docs/Shp03WeaponsDesign.md`, or `docs/Hud02IdentitiesDesign.md`.  
**Locked sources:** wishlist Initiative BIO (`docs/PLAYER-EXPERIENCE-WISHLIST.md` ~784–842); live inventory `out/w70/bio/current-bio-inventory.md`; `src/systems/ship.js`; `src/game/hangar.js`; `src/game/shipyard.js`; `src/systems/organic.js`; `src/systems/npc.js`; `src/systems/ship-assets.js`; `src/game/origins.js`; `src/game/bio.js`; `src/systems/hud.js`; `src/game/save.js`; `src/core/ctx.js`; Wave 64 remount; HUD-02 family; SHP-03 living+conventional mounts.

Integrator rule: a **later** implementation wave obeys this file. Inventory cites live code. Code wins over stale comments.

---

## 0. Law in one page

1. Wave 70 is markdown only. Implementation is a later **serial** wave. Do not schedule or land BIO PRs here.
2. Do not weaken `makeLivingHull` swim / breath / heartbeat / vein skin. Living remount must rebuild that path. Do not idle those fields to make growth or grafts easier.
3. The living **starter** stays the boot default. Every origin already flies it. Beautiful origin must not remount, must not write `hullKind`, must not change `player.faction`.
4. Persist living hulls as **hangar rows** + `hullKind: 'living' | 'built'`. No nested `loadout`. No second hangar blob. No new `localStorage` key.
5. HUD-02: `hullKind === 'living'` → `bio`; `'built'` → `mech`. HUD **never** writes `hullKind`, `grafted`, `faction`, or `classKey`. Do not reopen HUD-02 Q1–Q3. Do not add an Abomination HUD family.
6. `state.js` is READ-ONLY for feature workers unless a **named serial data owner** lands a tiny table. Do not invent `WEAPONS` psionic rows in a BIO feature PR.
7. BIO-04 psionic weapons are **out** of the first implementation wave. Do not invent a power triad. Living ships keep cannon / disruptor.
8. Beautiful / Unknowables **frigate buy stays omitted** in the first BIO impl. That is a BIO decision, not a Wave 67 catalog drive-by. Persist still admits `classKey: 'frigate'`. NPC Beautiful GLBs may keep a frigate.
9. BIO-03 Beautiful NPC fleet rebuild is **visual + motion**, serial, later. Wave 70 does not ship meshes. Do not pretend this brief lands GLBs.
10. Abomination = **conventional** hull (`hullKind: 'built'`) + `grafted: true`. Not a living hull with plated bits. Beautiful hostility is immediate. **Warn before purchase.** Gilded sells grafts. Beautiful docks do not.
11. Growth/evolution must not require a growth-center to keep the living starter’s cannon. Class evolution (later) mutates the **same hangar row** and calls `applyFlightEnvelope` + living remount. It does not factory-reset `ctx.bio` or dump cargo.
12. World strings use `textContent`. No `innerHTML`. No new frozen `ctx.js` event unless a later owner proves an existing emit cannot carry the line (`commLine` / desk notice first).
13. Prototype keys fail closed (`RESERVED_IDS`, `Object.prototype.hasOwnProperty`). Reputation writes never use `for…in` assignment from a blob.
14. Prices / gift / pirate-drop numbers that are not live constants are **proposed, needs owner**. Do not ship invented UU or drop rates.

---

## 1. Preserve the living starter

### 1.1 Mesh

| Must | Must not |
|---|---|
| Boot `buildLivingVisual` / `makeLivingHull` | Conventional starter as boot default |
| Living remount rebuilds swim + breath + heartbeat + veins | Static organic prop, plated GLB, or GPU-only swim as the player living path |
| Unset `hullKind` → living mesh (`meshKindFor`) | Treat independent starter as `'built'` because origin is not Beautiful |
| `GROWTH_SCALE_MAX` 0.15 remains a visual on `flesh` | ClassKey change as a side effect of `bio.growth` |

### 1.2 Companion

`ctx.bio` is not a hull. Buy, park, remount, graft, and New Game-adjacent hull work must not factory-reset it. Death keeps the companion wounded (`save.js` 517–525).

### 1.3 Guns

SHP-03 already: mounts follow `classKey`, not `hullKind`. First BIO impl must not strip Digit 1/2 on the living light. Do not gate cannon on a growth-center visit.

---

## 2. `hullKind` write sites (closed)

**Writers (SHP / hangar / save / ship Unknowables force only):**

- `sanitizeHangarRecord` / `healPlayerHullKind` / `loadMountedRow` / `switchTo` / `applyMountedFlight`
- `shipyard.js` `hullKindFor` + buy row
- `save.js` `freshStart` → `'living'`
- `ship.js` `remountPlayerHull` Unknowables force `'living'`

**BIO may write:** hangar row `grafted` (boolean, allowlisted). BIO must **not** flip `hullKind` to `'living'` to mean “has tissue,” and must **not** flip `'built'` to `'living'` on graft.

**Never write `hullKind`:** `hud.js`, `bio.js`, `origins.js`, `organic.js`, settings, sessionStorage.

Unknowables force `'living'` on every path stays. Grafts cannot mark Unknowables `'built'`. Sanitize: if faction is `unknowables`, delete `grafted` and set `hullKind: 'living'`.

---

## 3. BIO-01 — obtain a living hull or seed

### 3.1 Already shipped (do not re-solve)

Every origin mounts the living light. Beautiful origin only sets bond 0.35, hunger 0.4, two `livingRock` (`state.js` 716–719). That is **not** a second ship.

### 3.2 First implementation wave — in

| Path | Freeze |
|---|---|
| Beautiful yard buy | Live `LIVING_STOCK` (`light`, `cutter`, `heavy`). `hullKind: 'living'`. Buy **adds** a hangar row. Does not remount. Authored prices `YARD_LIST_UU`. Hostile Beautiful standing (`rep < 0`) is no sale. |
| Unknowables yard buy | Live `UNKNOWABLES_STOCK` (`light` only). Force `'living'`. |
| Hangar remount | Existing `switchTo`. Living row → `makeLivingHull` path. |

### 3.3 First implementation wave — out (named, not forgotten)

| Path | Freeze |
|---|---|
| Max standing **gift** | **Defer** unless a serial PR lands it. If landed later: Sworn is live `RANK_LADDER` min **50**, tier 3. Gift is **one hangar row**, `hullKind: 'living'`, `faction: 'beautiful'`, classKey `light` unless owner overrides. Does not remount. Refuse if hangar full (`HANGAR_CAP` 8). Once: reserved id `hull_seed_gift` already in `hulls` → skip. No new `WORLD_FIELDS` key. **Price 0.** Do not invent a new rank above Sworn. |
| Rare pirate seed | **Defer.** Do not invent a drop percent. Later: applying a seed at a Beautiful dock **adds a hangar row** (same shape as buy). Not a nested loadout. Not `livingRock`. |
| Seed **commodity** | **Defer.** Do not add a `COMMODITIES` row in a feature PR (`state.js` READ-ONLY). Do not overload `livingRock` (that is food, base 600). Expensive obtain in v1 **is** the Beautiful yard hull (light list **8000** UU live). |

A “seed” in later PRs is an **unmounted living hangar row** (or a one-shot dock verb that creates one). It is not a `loadout` object and not a mystery clue.

---

## 4. BIO-02 — growth vs SHP remount

### 4.1 Live growth (keep)

`bio.growth = min(1, bond * 0.7 + fedCount * 0.05)` (`bio.js` 156–161). Visual `flesh.scale` up to +15%. Origin beats already fire on 0.4 / 0.75 / 1.0. Station feed stays 60 UU biomass / 1 living rock.

### 4.2 Class evolution (later, not first impl)

When a later PR evolves a living hull into another `SHIP_CLASSES` key:

1. Mutate the **same hangar row** `classKey`.
2. Call **`applyFlightEnvelope(ctx, classKey)`** then living remount. Do **not** re-author the envelope map. Live write (`hangar.js` 477): `afterburner.multiplier = cls.cruise > 0 ? cls.burn / cls.cruise : 2`. Peak burn speed is `maxSpeed * multiplier` (= `cls.burn`). Assigning `multiplier = cls.burn` would make light 240×, not 2×.
3. Keep `hullKind: 'living'`. HUD stays `bio`.
4. Keep cargo on that row. Do not dump.
5. Gear follows existing heal: `healLauncher` / `healTurret` already drop seats the new class cannot take (`hangar.js` 53–61). That is the invalidation rule. Do not invent a parallel stripper.
6. Do **not** require a visit to a growth-center to keep the starter cannon **before** any evolution.
7. Do not add a `SHIP_CLASSES` row in a BIO feature PR.

### 4.3 Growth-center dock service

**Out of first impl.** Do not append a new `DOCK_KEY_SERVICES` key. Digit 0 stays Shipyard. If a later wave needs a Beautiful training desk, it is a **pane or confirm** under the existing Shipyard / Repair surface, not a mid-list insert.

Career branches (combat / mining / trade / exploration / stealth / support) are **later**. First impl does not invent six living class keys.

---

## 5. BIO-03 — Beautiful NPC fleet

- **This wave:** markdown only. No GLB, no shader, no `public/assets` edit.
- **Later serial visual PRs:** rebuild Beautiful NPC visual + motion **language** around the player living hull (organic alien skin; speed-responsive swim; class identity by shape/size; marine *vibes*, not literal Earth animals).
- NPC path stays GLB + GPU (or a later equivalent). Do **not** run player CPU per-vertex `makeLivingHull` on every NPC (perf).
- Do not replace the **player** living path with the NPC GPU swim.
- `isBeautiful` stays `faction === 'beautiful'`. Do not key player HUD on it alone.

---

## 6. BIO-04 — psionic weapons (non-goal)

**Out of the first implementation wave.**

Do not:

- add a `WEAPONS` family named psionic / psi / mind
- invent a G/S/E or Plant/Flight/Heat triad
- restrict cannon to grown hulls
- reopen SHP-03 missile / turret / HUD-02

Living and Abomination hulls keep conventional guns per SHP-03. A later named weapons owner may design psionics. This contract only names the hole.

---

## 7. BIO-05 — Abominations

### 7.1 Definition

```
Abomination ⇔ hangar row (or mounted player) has
  hullKind === 'built'
  AND grafted === true
```

Living hull + conventional components is **not** an Abomination (SHP-03 already allows that). Conventional hull + living grafts **is**.

### 7.2 Persist

| Field | Who writes | Sanitize |
|---|---|---|
| `hullKind` | SHP paths in §2 | `'living' \| 'built'` else delete |
| `grafted` | BIO graft purchase / strip (later) | `own(raw, 'grafted') === true` → `true`; else omit. Never `'yes'`, `1`, `'grafted'` |
| Unknowables | existing force | delete `grafted`; `hullKind = 'living'` |
| Living + grafted | — | if `hullKind === 'living'`, **drop** `grafted` |

No nested `grafts: []` in the first impl. One boolean. No `WORLD_FIELDS` sibling key: `grafted` rides the hangar row already on `hangar`.

Park/load copies `grafted` like `hullKind` (allowlist in `packLiveHull` / `sanitizeHangarRecord` / `loadMountedRow`). HUD does not copy it.

### 7.3 Who sells

**Gilded** docks only (`dockFactionOf === 'gilded'`). Fail closed on any other banner, including Beautiful.

Graft applies to the **mounted** built hull, or a chosen built hangar row (implementation pick: mounted-only is enough for first impl). Refuse if:

- not docked / combat / jump / paused / destroyed (same as `switchTo` refuse)
- `hullKind !== 'built'`
- already `grafted`
- hangar missing after sanitize
- `rep.gilded < 0` (live yard hostile rule)

### 7.4 Warning (mandatory)

Two-step confirm, same family as yard **Confirm papers** and Gilded **Confirm transfer**:

1. Arm pending.
2. Show a `textContent` warning that Beautiful Ones become **immediate enemies** (patrol hunt at standing ≤ −10).
3. Confirm debit + write `grafted: true` + hostility.
4. Esc cancels. No debit.

No silent graft. No one-click from a hotkey without the armed pending pane.

### 7.5 Hostility

Wishlist: **owning or flying** an Abomination produces immediate Beautiful enemy standing. That is an **invariant**, not only a purchase side effect.

While **any** hangar row has `grafted === true` after sanitize:

```
ctx.world.reputation.beautiful = Math.min(currentOrZero, HOSTILE_STANDING)
```

Apply on: successful graft confirm; `sanitizeHangar` / restore after hangar heal; `loadMountedRow` / `switchTo` if the mounted or any stored row is grafted. First impl may scan `hangar.hulls` once per those verbs (not per frame).

`HOSTILE_STANDING` is live **−10** (`npc.js` 87). If standing is already worse, keep worse. Create the `beautiful` key if missing (default bag lacks it — `ctx.js` 128). Write only that key via direct assign after `sanitizeFaction`-class checks (`beautiful` is a `FACTIONS` key). Do not `for…in` the reputation object from save input. Do not assign if the key would be a `RESERVED_IDS` token.

Beautiful yard `rep < 0` is already **no sale**. Patrols hunt at ≤ −10. That is the “immediate enemy standing” freeze. Do **not** invent Marked (−25) or −1000 unless the owner overrides.

Removing the last grafted row (if a later strip exists) does **not** auto-heal Beautiful standing. The player remains at ≤ −10 until normal grind or a later destroy-Abomination friend bump.

Save tamper that sets `grafted: true` without a purchase still caps standing on restore. That is required so hostility cannot be skipped.

**Destroying an Abomination** (wishlist friend standing): **defer NPC Abominations**. First impl is player-side grafts only. If a later PR adds NPC `grafted` records, Beautiful standing bump is **proposed, needs owner** (do not invent +10 / Known). Pin the hook; do not ship a number in Wave 70.

### 7.6 Mesh

First impl **may** land persist + warning + hostility with **no** new tissue mesh (plated remount stays `buildPlayerPlatedMesh`). A later visual PR may parent graft meshes onto the plated wrap.

Must not:

- remount an Abomination through `makeLivingHull` (that hides the crime and weakens the living benchmark)
- set `hullKind: 'living'`
- run player CPU vertex swim on the plated hull (live `ship.js` already skips it)

HUD stays `mech` (`hullKind: 'built'`).

### 7.7 Price

Graft list price is **proposed, needs owner**. Do not invent UU in this wave. Implementation must not read `bookValue` or a save-authored price (SHP yard law). Until the owner sets a number, the graft desk **does not debit** in design — **or** a named data PR adds an authored constant next to `YARD_LIST_UU`. Feature workers must not silently pick 900 (`HIDDEN_MOUNTS.cost`) or 8000.

---

## 8. Living frigate SKU

| Ask | Freeze |
|---|---|
| Add Beautiful / Unknowables `frigate` to yard stock in first BIO impl? | **No. Keep omit.** `LIVING_STOCK` stays `light, cutter, heavy`. Unknowables stays `light`. |
| Persist `classKey: 'frigate'` on a living row? | Already admitted by hangar sanitize (`classKeyOf` uses `SHIP_CLASSES`). |
| NPC Beautiful frigate GLB? | Already on disk. BIO-03 may rebuild it later. Not a buy SKU. |
| Who may add a living frigate buy? | A later **BIO** catalog PR with owner sign-off. Not a plated leftover.

---

## 9. HUD-02

Unchanged:

- `hudFamily`: built → mech; living → bio; else bio.
- HUD never writes `hullKind`.
- Do not key family on origin, `ctx.bio`, `grafted`, or `isBeautiful` alone.
- Abomination (`built` + `grafted`) → **mech**.
- No new settings key. Session `rw-hud-family` stays debug.

---

## 10. World strings and events

- Desk copy, warnings, gift lines, comm: `textContent` / existing `commLine`.
- Prefer existing `'commLine'`, `'originBeat'`, `'originPayoff'`, `'milestone'`.
- **Do not** add `'grafted'`, `'hullKindChanged'`, `'bioSeed'`, or `'abomination'` to the `ctx.js` frozen list in the first impl. Hangar remount already relies on HUD 5 Hz reread.

---

## 11. `state.js`

READ-ONLY for BIO feature workers.

Allowed later **only** with a named serial data owner:

- authored graft price constant (prefer `shipyard.js` next to `YARD_LIST_UU`, not `state.js`)
- a `COMMODITIES` seed row (discouraged; hangar row is the seed)

Forbidden in BIO PRs: new `SHIP_CLASSES`, `WEAPONS` psionic family, `MOUNT_TABLE` rewrite, `RANK_LADDER` extra rung.

---

## 12. Serial PR plan (later implementation wave — not Wave 70)

| PR | Lands | Does not land |
|---|---|---|
| **PR1 persist + pins** | Allowlist `grafted` on hangar row. Living starter remount pins. Unknowables drop `grafted`. HUD family unchanged | Meshes, prices, hostility |
| **PR2 obtain (yards already live)** | Pins: Beautiful buy → living row, no remount, starter still living. Optional gift **only** if owner approved §3.3 | Pirate drop %, new commodity, frigate SKU |
| **PR3 Abomination desk** | Gilded two-step warning. `grafted: true`. Hostility `min(current, -10)` on confirm **and** on sanitize/restore while any row is grafted. textContent | Psionics, NPC Abominations, living remount of grafts |
| **PR4 growth (optional)** | Keep visual growth. If class evolution lands: same-row `classKey` + envelope + living remount; launcher heal | New dock service, new class keys, growth-center requirement for cannon |
| **PR5 boot pins** | Harness: starter swim fields; graft warning before debit; Beautiful standing; HUD never writes kind | Wishlist / PROGRESS edits by feature workers |

BIO-03 NPC fleet rebuild is a **separate visual serial**, after or beside PR5, never bundled into persist.

---

## 13. Non-goals (locked)

- No `src/` in Wave 70.
- No missiles / power ledger / HUD-02 reopen (SHP-03 and HUD-02 stay closed).
- No psionic triad.
- No living frigate buy SKU in first BIO impl.
- No nested hangar loadout.
- No factory-reset of `ctx.bio`.
- No `innerHTML` world strings.
- No new autosave key.
- Do not edit the wishlist or `PROGRESS.md` in this wave.

---

## 14. Open owner questions

Defaults above stand unless the owner overrides.

1. Graft list price (authored UU). Until then, no silent debit.
2. Destroy-Abomination Beautiful standing delta (NPC grafts later).
3. Whether Sworn gift lands in the first impl wave or stays deferred.
4. Pirate seed signal / rate (must not be accidental cargo).
5. Whether a later living frigate SKU exists at all.

---

## 15. Verifier pin list (contract rules)

A later verifier must pin:

1. Wave 70 tree: markdown under `docs/BioLivingShipsDesign.md` and `out/w70/bio/**` only; `src/` untouched.
2. Living starter: `makeLivingHull` + four motion fields remain the player living path.
3. `hullKind` writers vs HUD read-only.
4. `grafted` boolean allowlist; living/Unknowables drop it.
5. Abomination warning before debit; hostility uses live −10; owning any `grafted` row caps Beautiful standing on sanitize/restore (not only on purchase).
6. Beautiful/Unknowables frigate **omit** from yard stock.
7. BIO-04 named as out; no invented `WEAPONS` row in this design.
8. BIO-03 does not claim shipped meshes.
9. Growth-center not required for starter cannon.
10. No nested loadout; hangar rows only.
11. Envelope: later PRs **call** `applyFlightEnvelope`. Live `afterburner.multiplier = burn / cruise` (cruise 0 → 2). Do not assign `multiplier = burn`.
