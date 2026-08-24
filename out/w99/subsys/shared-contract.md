# TGT-03 remaining subsystem targeting shared contract

**Wave:** 99. Design only. No TGT-03 subsystem-targeting feature ships in this wave.  
**Status:** MERGE LAW for `docs/Tgt03SubsystemDesign.md`. If that brief and this file ever disagree, **this file wins**.  
**Not this wave:** any edit under `src/`, `scripts/`, `public/`, `index.html`, `package.json`. Do not edit `docs/PLAYER-EXPERIENCE-WISHLIST.md`, `PROGRESS.md`, `docs/Tgt03RadarDesign.md`, `docs/Tgt03AwarenessDesign.md`, `docs/Tgt05*.md`, `docs/Nav*.md`, `docs/NpcMissilesDesign.md`, `docs/NpcTurretsDesign.md`, `docs/Hud*.md`, `docs/HudUtilityChangeProposal.md`, `docs/Shp*.md`, `docs/Bio*.md`, `docs/OwnerDecisions*.md`. Do not write `out/w99/radar/**` or `out/w99/turrets/**`.  
**Locked sources:** wishlist TGT-03 leftover (`docs/PLAYER-EXPERIENCE-WISHLIST.md` TGT-03 still names subsystem targeting); live inventory `out/w99/subsys/current-tgt03-subsystem-inventory.md` (code wins); `src/game/state.js` (READ-ONLY); `src/systems/combat.js`; `src/systems/hud.js`; `src/ui/hud.css`; `src/systems/controls.js`; `src/game/reticle-aim.js`; `src/core/ctx.js`; `src/game/save.js`; `src/game/hangar.js`; `src/systems/station.js`; `src/game/npc-fire-toast.js` (do not rewrite).

Integrator rule: a **later** implementation wave obeys this file. Inventory cites live code. Code wins over stale wishlist “subsystem targeting” as if a lock box or hub gauge were the missing aid. The live aid is **peel + aft engine + rails**.

---

## 0. Orchestrator merge law (do not weaken)

1. Wave 99 subsystem worker is **markdown only**. Later impl is **serial**. Do **not** schedule or land these PRs in `src/` in this worker. Serial PR plan is **named only**.
2. HUD-01 empty **80 px hub**. No subsystem box, pip, or gauge on the aim glass. No lock box. No incoming gauge.
3. HUD-02 identities closed. HUD **never** writes `hullKind`. HUD may **read** `player.hullKind` as today (`hud.js` 76–85).
4. `src/game/state.js` is READ-ONLY this wave. Later impl **defaults to no `state.js` write**. Inventory does **not** prove a new table. Live `DEFENSE` (`state.js` 150–161) already holds `screenFraction`, `engineOutAt`, `aftEngineMult`. If a later PR needs those numbers, **name `DEFENSE`**. Do **not** invent numbers. Do **not** add a fifth channel.
5. Persist: **no** new `WORLD_FIELDS` key. **No** new `localStorage` key. Autosave stays `rimward-save-v1`. Settings stay `rimward-settings-v1`. Do **not** persist a part cursor. Do **not** write HUD into `ctx.world.contacts` (station NPCs).
6. Digit 0 stays **shipyard** at dock level-1 (`station.js` 186, 5920–5922). Digit 8 dock root stays **launch**. Digit 9 dock root stays **epics** (live array; do not “fix” the Standing comment). Outfitting Digit 8/9 stay player **launcher / turret** papers (`station.js` 1622–1702, 5983–5986). Do not steal Digit 0–9. Do not invent a subsystem Digit.
7. KeyT stays cycle (ships; rocks in group 3). KeyV stays reticle lock. Do not steal those keys. `LOCK_CONE_PX = 12` stays. This serial does **not** rewrite pick math.
8. `innerHTML` forbidden. `textContent` / `h()` / `el()` only. SVG nodes stay `createElementNS` + attributes.
9. Do **not** reopen TGT-01 lead, TGT-02 MATCH, TGT-03 radar class (`.rw-contacts` reuse / jump-park sibling), TGT-05 cone/`lockKind` allowlist, NAV-02 gate cue, HUD-01 empty hub, HUD-02 identities, NPC-missile Q1/Q2, NPC turret Q1/Q2, power ledger, aim-glass incoming gauge, BIO-05.
10. Do **not** invent UU or standing deltas. Wolfeye prices, repair rates, and disruptor multipliers stay as live. A new targeting-computer SKU is **not** authorized.
11. Prototype-safe persist: `SAFE_ID`, `RESERVED_IDS`, `hasOwn` / `hasOwnProperty`. No `for-in` merge of a raw blob. Do not index `WEAPONS` / `SYSTEMS` / `DEFENSE` with a player-typed part id from a blob.
12. Do not edit sibling Tgt/Nav/Shp/Bio/Hud/Npc docs, the wishlist, `PROGRESS.md`, or `docs/OwnerDecisions*.md`. Wave 99 turret Q1/Q2 are already closed; this brief does **not** impersonate the owner. Do not write `docs/OwnerDecisionsWave99.md`.
13. Do not “fix” WAVE4 fence, WAVE26 ferry/haul, or WAVE35 haul boot FAILs.
14. Fail-closed: if owner numbers are missing (selectable parts, extra Digit, SKU cost, new TRACKED key, peel skip), later impl does **not** ship **damage retarget**. Geometry peel stays.

---

## 1. DONE — taxonomy is screen / shell / engine / hull

Inventory §2. Do **not** add rooms, weapons banks, or life support as combat parts.

| Channel | Live owner |
|---|---|
| screen / shell | `applyHit` peel; HUD bars; shieldDown toast |
| engine | Aft facet after shields; `engineOut`; player Plant row |
| hull | Peel last; disable / destroy; hull petals |

Repair Digit 1 restores **all four** (`station.js` 4353–4371). That is a yard bill, not a targeting aid.

---

## 1.1 Current lock stays a whole object

`ctx.targets.current` stays a live ship, rock, or TGT-05 kind. Do **not** add `lockKind` values for damage channels. Do **not** add `ctx.targets.part` unless the owner names that field **and** forbids persist. Default: **no new ctx field**.

Combat continues to ignore `lockKind` objects for guns/seekers (`combat.js` 1123–1216).

---

## 1.2 Damage path (do not retarget without owner numbers)

Keep `applyHit` order: screen → shell → (aft engine pressure) → hull (`state.js` 209–231).

Keep facet from **shooter geometry** (`combat.js` 1619–1625, 1679–1684).

Fail-closed extras (do **not** add until owner names them):

- skip screen/shell because a “part” is selected;
- a player-selected engine hit from the nose;
- a fifth HP pool;
- persist of last part.

Disruptor `shieldMult` / `engineMult` / `hullMult` stay weapon-family math (`state.js` 119). Do not retune in this serial.

---

## 2. Picture — reuse rails; not the hub

| Job | Surface | This serial |
|---|---|---|
| Lock vitals | `.rw-combat-target` SCREEN / SHELL / hull / DIST | Reuse. Do not duplicate on the hub. |
| Hemisphere | FORE/AFT on both rails | Reuse. Hit-flash stays `playerHit` 0.4 s. |
| Player engine | Plant ENGINE OK/DAMAGED/OUT | Do not move onto the hub. |
| Lock engine bar | **Absent** | Default: **do not add**. Owner question. |
| Nearby ships | `.rw-contacts` | **Not this serial** (radar sibling). |
| Off-glass lock | `.rw-edge-arrow` | Untouched. |
| Next gate | `.rw-nav-gate-cue` | Untouched. |

**Not** on the 80 px aim glass. **Not** a lock box. **Not** a subsystem pip inside `.rw-reticle`. **Not** a second contacts class.

If later polish emphasizes which live channel is peeling, toggle classes on the **existing** tgt-rail bars only. No new `#hud` child. No new `@keyframes` required. `body.rw-reduced-motion` already kills HUD animation.

Do **not** print record names onto a new part list. Name on the rail already uses `textContent` (`hud.js` 2020–2022).

---

## 3. Controls / digits / cone

- KeyT cycle stays. KeyV reticle lock stays.
- `LOCK_CONE_PX = 12` stays. Do not rewrite `pickReticleLock`.
- `allowedLockKind` stays station/gate/pod/landmark.
- Digit 0 shipyard. Digit 8/9 dock + papers stay. Weapon groups 1–5 stay.
- Default: **no** new `TRACKED` key. A picker without an owner-named key does not ship.
- Do not bind part cycle to Digit 0/8/9 or to KeyT/KeyV.

---

## 4. Closed — toasts, FORE/AFT, missile gauge, radar, lead, MATCH

| Moment | Channel | This serial |
|---|---|---|
| NPC dart vs player | toast `Incoming dart.` | **Do not change** |
| Cannon vs player | toast `Incoming fire.` | **Do not change** |
| Screen/shell down | existing danger toasts | **Do not change** |
| Engine out | existing engine toasts | **Do not change** |
| Hull hit hemisphere | FORE/AFT on `playerHit` | **Do not change** (not a toast) |
| Incoming missile widget | closed | **Out** |
| Radar / `.rw-contacts` | sibling | **Out** |
| Lead / MATCH | TGT-01 / TGT-02 DONE | **Out** |

No subsystem toast. No hub incoming pip. No FORE/AFT-on-fire (hit-only).

---

## 5. Security / emit / persist

- Peel is live simulation. Do not snapshot a part cursor into save.
- No new world field. No `for-in` merge. Scanner heal stays `[0, 1, 2]` else 0 (untouched).
- Do not put ship `record` blobs or faction strings on a new part widget.
- Existing emits `playerHit` / `npcHit` / `shieldDown` / `engineOut` stay. Do **not** add a new `ctx.emit` type for subsystem pick.
- Do not assign `innerHTML` on rails, hub, SVG, or toasts.
- Reserved ids: do not use raw record ids as object keys in a prototype-unsafe merge.
- Do not index `WEAPONS` with a part name.

---

## 6. Closed HUD / keys / digits / SKU

- 80 px hub stays empty. No lock box. No incoming gauge. No subsystem pip. No power pip.
- Do not set `ctx.targets.current` except via existing KeyT/KeyV (and live jump/npc clears).
- Digit 0 shipyard. Digits 1–9 station services stay. Weapon groups 1–5 stay.
- Do not steal KeyT / KeyV / KeyM / Digit 8/9.
- `state.js` stays unread-for-write. Do not add a `subsys` or `targetingComputer` gear field.
- No new SKU. Inventory did not prove Wolfeye reuse is a lie **for radar**; for a **picker**, reuse of any live SKU is a lie — **fail-closed**, do not invent a replacement SKU.

---

## 7. Ownership (later impl)

| Piece | Owner |
|---|---|
| `applyHit` peel / facet | `state.js` / `combat.js` — **untouched** unless owner names retarget |
| Target rail bars / FORE/AFT | `hud.js` (already) |
| Optional bar emphasis | `hud.js` later polish only; no new child |
| Pick math | **untouched** (`reticle-aim.js` / `controls.js`) |
| `state.js` numbers | **untouched** (read `DEFENSE` if needed) |
| Persist | **untouched** (`save.js` / `hangar.js`) |
| Digit 0/8/9 | **untouched** (`station.js`) |
| Radar arc / jump park | **not this serial** (sibling `.rw-contacts`) |
| `Incoming fire.` / dart | **not this serial** (already live) |
| NPC turrets | **not this serial** (Q1/Q2 closed elsewhere) |

Prefer a tiny pure helper `hitFacet(targetFwd, shooterPos, targetPos)` so PR1 pins do not need jsdom — **only if** later retarget is owner-approved. Until then, ship **no** combat change.

---

## 8. Serial PR plan (later wave — named only)

Do **not** land these in Wave 99. Name of later serial: **TGT-03 remaining subsystem targeting serial**.

1. **PR1** — pins (no UI, no `state.js` write): peel order screen→shell→hull; aft + remaining + not engineOut → engine damage × live `aftEngineMult`; `lockKind` objects still ignored by guns; unknown family falls back 1:1; no part field on `ctx.targets`.
2. **PR2** — HUD polish **only if** PR1 already matches live code: optional class on **existing** tgt-rail SCREEN/SHELL/hull while that layer is the one peeling. **No** new hub child. **No** lock box. **No** ENGINE bar unless owner named it. **No** new `@keyframes`.
3. **PR3** — damage retarget / picker. **Fail-closed.** Skip this PR until the owner names selectable parts **and** a control that is not KeyT/KeyV/Digit 0/8/9/1–5. Do not invent UU.
4. **PR4** — boot / reduced-motion / contrast: hub still empty; `innerHTML` still absent; Digit 0/8/9 unchanged; FORE/AFT still hit-only.

If PR1 pins already match live `applyHit`, and owner numbers stay missing, the serial may stop after **no src change** or after PR2 emphasis only. Do not “complete TGT-03” by shipping a fake picker.

---

## 9. Owner questions (closed Wave 100)

Do not treat Digit theft, hub gauge, `innerHTML`, new persist key, `lockKind` smash, or UU invention as open.

Binding picks: [`docs/OwnerDecisionsWave100.md`](../../docs/OwnerDecisionsWave100.md). Owner may override after playtest.

1. **Which parts selectable?** **engine only.**
2. **New TRACKED key?** **KeyK.**
3. **Extra Digit?** **no.**
4. **New SKU / UU?** **no.**
5. **Lock ENGINE bar on tgt rail?** **yes.** Not on the hub.
6. **May peel skip shields when a part is selected?** **no.** After shields, engine takes remaining until `engineOut`.
