# HUD-03 remaining optional audio-alerts shared contract

**Wave:** 102. Design only. No HUD-03 audio-alerts feature ships in this wave.  
**Status:** MERGE LAW for `docs/Hud03AlertsDesign.md`. If that brief and this file ever disagree, **this file wins**.  
**Not this wave:** any edit under `src/`, `scripts/`, `public/`, `index.html`, `package.json`. Do not edit `docs/PLAYER-EXPERIENCE-WISHLIST.md`, `PROGRESS.md`, `docs/Tgt03*.md`, `docs/Tgt05*.md`, `docs/Nav*.md`, `docs/NpcMissilesDesign.md`, `docs/NpcTurretsDesign.md`, `docs/Hud02IdentitiesDesign.md`, `docs/HudUtilityChangeProposal.md`, `docs/Shp*.md`, `docs/Bio*.md`, `docs/OwnerDecisions*.md`, `docs/Bio02CareerDesign.md`. Do not write sibling `out/w102` packs owned by TGT-03 CLOS or BIO-02 career workers. Do not edit `src/systems/hud.js` or `src/systems/shipyard-desk.js`.  
**Locked sources:** wishlist HUD-03 leftover (`docs/PLAYER-EXPERIENCE-WISHLIST.md` 352–364); live inventory `out/w102/hud03/current-hud03-inventory.md` (code wins); `src/systems/settings.js`; `src/systems/song.js`; `src/core/ctx.js`; `src/systems/hud.js` (read); `src/game/npc-fire-toast.js`; `src/systems/controls.js`; `src/game/save.js`; `src/systems/station.js`; `src/game/state.js` (READ-ONLY).

Integrator rule: a **later** implementation wave obeys this file. Inventory cites live code. Code wins over stale wishlist HUD-03 as if scale/contrast/color-blind/reduced-motion were missing. **Those four already ship.** The remaining aid is an **optional HUD-alert checkbox** on the existing KeyO panel that **reuses** live `CUES` rows and **fail-closes** when muted.

---

## 0. Orchestrator merge law (do not weaken)

1. Wave 102 HUD-03 worker is **markdown only**. Later impl is **serial**. Do **not** schedule or land these PRs in `src/` in this worker. Serial PR plan is **named only**.
2. HUD-01 empty **80 px hub**. No alert gauge, pip, tape, or klaxon widget on the aim glass. No lock box. **Do not** put alerts inside `.rw-reticle` or next to RANGE.
3. HUD-02 identities closed. HUD **never** writes `hullKind`. HUD may **read** `player.hullKind` as today (`hud.js` 80–87). Family ticks stay family-gated by live `FAMILY_CUES` + `#hud[data-family]` (`song.js` 124–130, 425–427).
4. `src/game/state.js` is READ-ONLY this wave. Later impl **defaults to no `state.js` write**. Inventory does **not** prove a new table. Do **not** invent an alerts SKU. Do **not** invent UU.
5. Persist: **no** new `WORLD_FIELDS` key. **No** new `localStorage` key. Autosave stays `rimward-save-v1`. Settings stay **`rimward-settings-v1`**. A new bool **may** join the live settings record (`FIELDS` + `ctx.settings` + `CHECKBOXES`). Do **not** persist last cue time into the world. Do **not** write HUD into `ctx.world.contacts` (station NPCs).
6. Digit 0 stays **shipyard** at dock (`station.js` 185, 6023–6025). Digit 8 dock root stays **launch**. Digit 9 dock root stays **epics**. Outfitting Digit 8/9 stay player **launcher / turret** papers (`station.js` 6100–6102). Do not steal Digit 0–9. Do not invent an alerts Digit.
7. KeyT stays cycle. KeyV stays reticle lock. KeyX stays MATCH. KeyK stays engine-select. KeyO stays **settings**. Do not steal those keys. Do not add a `TRACKED` key for alerts.
8. `innerHTML` forbidden. `textContent` / `createTextNode` / `h()` / `el()` only. Settings panel stays `createElement`. Cue keys are authored identifiers in `CUES`, not blob names.
9. Do **not** reopen HUD-01 empty hub, HUD-02 skins, TGT-01 lead / RANGE, TGT-02 MATCH, TGT-03 radar / awareness toast **copy** / subsystem / (sibling) rail CLOS, TGT-05 cone/`lockKind`, NAV-02, NPC-missile Q1/Q2, NPC turret vsNPC, power ledger, BIO-05, BIO-02 career (sibling).
10. Prototype-safe persist: settings load walks `Object.keys(FIELDS)` (`settings.js` 55–56). No `for-in` merge of a raw blob. Do not index `WEAPONS` / `SYSTEMS` / `CUES` with a record id or user string. Reserved ids: `__proto__`, `constructor`, `prototype` stay invalid as cue keys.
11. Do not edit sibling Tgt/Nav/Shp/Bio/Hud-02/Npc docs, the wishlist, `PROGRESS.md`, or `docs/OwnerDecisions*.md`. Do not impersonate the owner. Do not write `docs/OwnerDecisionsWave102.md`.
12. Do not “fix” WAVE4 fence, WAVE26 ferry/haul, or WAVE35 haul boot FAILs.
13. Fail-closed: `ctx.settings.muted === true` **or** `masterVolume === 0` **or** AudioContext failed → **no** HUD-alert sound. The new toggle **cannot** bypass mute.
14. Do **not** rewrite WAVE98 `Incoming fire.` / `Incoming dart.` (`npc-fire-toast.js` 8–9; `hud.js` 571–576). Later audio may **cue** those events. Do **not** add a second toast string. Do **not** mint a second `CUES` row that double-barks `npcFire` / `npcFireMissile` (`song.js` 68–69, 423).
15. TGT-03 CLOS sibling owns `hud.js` this wave. HUD-03 later serial **prefers `settings.js` + `song.js` (+ `ctx.js` default)** so it does not fight CLOS. BIO-02 sibling owns `shipyard-desk.js`. Do not edit those files in this pack.

---

## 1. DONE — visual HUD-03 and mute-all

Inventory §2–§4. Do **not** add a second scale/contrast/color-blind/reduced-motion control. Do **not** add a second mute.

| Control | Live owner |
|---|---|
| Color-blind | `colorblind` → `body.rw-colorblind` |
| High contrast | `highContrast` → `body.rw-contrast` |
| Reduced motion | `reducedMotion` → `body.rw-reduced-motion` + family-emit skip |
| Text scale | `textScale` → `--rw-text-scale` |
| Mute all | `muted` → `song.js` master gain 0 |
| Master volume | `masterVolume` 0..1 |

---

## 1.1 Remaining — optional HUD-alert checkbox on KeyO

**Picture (Wave 102 deputize; owner may override after playtest):** reuse the existing settings overlay (`settings.js` 86–137). One new checkbox in `CHECKBOXES`.

- Field **`hudAlerts`**: boolean on `ctx.settings`.
- Default **`false`** (optional). Owner may override to `true` after playtest to copy live Wave 65 family-audio-on.
- Panel copy (authored): **`HUD audio alerts`**. Place after `Reduced motion`, before `Mute all audio`, so HUD-03 a11y stays one cluster.
- Validator: `typeof v === 'boolean'` like `muted` (`settings.js` 32).
- Persist: same `rimward-settings-v1` blob. **Must** join `FIELDS` or load will drop it (`settings.js` 55–56).
- Apply: **no** new `body` class. Song reads the bool live, same as mute (`song.js` 451–453).
- `innerHTML`: still 0. Label via `createTextNode` like other rows (`settings.js` 135).

**Not** a Digit. **Not** a hub widget. **Not** a new `localStorage` key. **Not** `WORLD_FIELDS`.

---

## 1.2 Cue reuse (do not mint when a row exists)

HUD-alert **subset** (gated by `hudAlerts` **and** mute/volume):

| Event type | Live `CUES` | Notes |
|---|---|---|
| `hudMechRange` | `song.js` 115 | `FAMILY_CUES` mech |
| `hudMechMatch` | `song.js` 116 | `FAMILY_CUES` mech |
| `hudMechContact` | `song.js` 117 | `FAMILY_CUES` mech |
| `hostileEnter` | `song.js` 118 | `FAMILY_CUES` bio |
| `hullBand` | `song.js` 119 | `FAMILY_CUES` bio |
| `reticleLock` | `song.js` 120 | both families |

**Not** in the HUD-alert subset (mute/volume only, as today): `playerHit`, `npcHit`, `npcFire`, `npcFireMissile`, `playerFire`, `shieldDown`, `engineOut`, `bodyHit`, whalesong, combat bed, docked hum, world/UI stings (`docked`, `milestone`, …).

Incoming vs player: **reuse** `npcFire` / `npcFireMissile`. Those stay on the combat path (mute/volume). HUD-03 does **not** add `incomingFire` / `incomingDart` keys. HUD-03 does **not** emit a new event type. Toast copy stays.

Do **not** mint louder klaxons. Live family cap: gain ≤ 0.08, duration ≤ 0.35 s (`song.js` 114). Do not exceed that on new HUD-only rows (none required).

Prefer the **song.js playback gate** so later HUD-03 need not edit `hud.js` (CLOS sibling). Pseudocode (later, not this wave):

```
needAlert = HUD_ALERT_TYPES.has(typ)   // the subset table
if (needAlert && ctx.settings?.hudAlerts !== true) skip
// muted / volume already zero master
```

`FAMILY_CUES` family check stays. `reducedMotion` emit skip in `hud.js` stays (read-only this wave).

---

## 1.3 Visibility / fail-closed

| Condition | HUD-alert subset |
|---|---|
| `hudAlerts === false` (default) | **Silent** (combat `npcFire` still plays if unmuted) |
| `hudAlerts === true`, not muted, volume > 0 | Play live `CUES` row if family/dataset ok |
| `muted === true` | **Silent** even if `hudAlerts` true |
| `masterVolume === 0` | **Silent** (live master math) |
| AudioContext failed / not unlocked | **Silent** (live) |
| `reducedMotion` | Live emit skip for family ticks (`hud.js` 1074, 1508) stays |
| Wrong `#hud[data-family]` | Live `FAMILY_CUES` skip stays |
| Incoming toast | Unchanged strings; combat `npcFire` tone unchanged |

Default-off **opts in** Wave 65 family ticks. That is deputize. Owner may flip default to `true` after playtest. Do **not** park the serial.

---

## 2. Picture — surfaces stay distinct

| Job | Owner | This serial |
|---|---|---|
| KeyO panel | `settings.js` | **Add `hudAlerts` checkbox** |
| Master silence | `song.js` 451–453 | **Untouched math; AND hudAlerts for subset** |
| Family ticks synth | `CUES` / `FAMILY_CUES` | **Reuse; do not rewrite tables unless a key is missing (none are)** |
| Incoming toast copy | `npc-fire-toast.js` | **Untouched** |
| Incoming combat tone | `npcFire` / `npcFireMissile` | **Reuse; no second row** |
| Tgt rail CLOS | sibling | **Out** |
| 80 px hub | HUD-01 | **Untouched** |
| Shipyard Digit 0 | `station.js` | **Untouched** |

Do not merge mute-all with HUD alerts. Mute-all silences whalesong. HUD alerts do not.

---

## 3. Controls / digits / cone / SKU

- KeyT / KeyV / KeyX / KeyK / KeyN / KeyO stay.
- `LOCK_CONE_PX = 12` stays. Do not rewrite pick math.
- Digit 0 shipyard. Digit 8/9 dock + papers stay. Weapon groups 1–5 stay.
- **No** new `TRACKED` key. Alerts are a **setting**, not a flight mode.
- **No** extra Digit.
- **No** SKU. Inventory proves mute + family `CUES` already exist.
- Do not bind alerts to Digit 0/8/9 or to KeyT/KeyV/KeyK/KeyX.

---

## 4. Closed — toasts, FORE/AFT, MATCH, lead, radar, CLOS

| Moment | Channel | This serial |
|---|---|---|
| NPC dart vs player | toast `Incoming dart.` + `npcFireMissile` | **Do not change copy**; do not double-cue |
| Cannon/turret vs player | toast `Incoming fire.` + `npcFire` | **Do not change copy**; do not double-cue |
| Hull hit hemisphere | FORE/AFT on `playerHit` | **Do not change** |
| MATCH / RANGE / lead | TGT-02 / TGT-01 | **Out** (mech ticks already exist; only gate them) |
| Incoming missile **gauge** | closed | **Out** |
| Tgt-rail CLOS | sibling Wave 102 | **Out** |
| ENGINE part / KeyK | Wave 100 | **Out** |
| Career / shipyard desk | sibling | **Out** |

No new toast. No hub incoming pip.

---

## 5. Security / emit / persist

- Settings blob is client a11y, not world. Keep `rimward-settings-v1`.
- New bool joins `FIELDS`. Load still walks `Object.keys(FIELDS)`, never `for-in` on JSON.
- Do not put ship `record` blobs, faction strings, or cue names from user input on the checkbox.
- Do **not** add a new `ctx.emit` type. Family ticks and `reticleLock` already exist (`ctx.js` 249–254).
- Do not assign `innerHTML` on the settings panel, rails, hub, SVG, or toasts.
- Do not index `CUES[ev.type]` with a sanitized-but-open string from a save blob. Event `type` is emitted by live systems, not by JSON.parse of settings.
- Do not log credits. Do not log ship names beside cues.

---

## 6. Closed HUD / keys / digits / SKU

- 80 px hub stays empty of new children. RANGE stays TGT-01.
- Do not set `ctx.targets.current` except via existing KeyT/KeyV.
- Digit 0 shipyard. Digits 1–9 station services stay. Weapon groups 1–5 stay.
- Do not steal KeyT / KeyV / KeyX / KeyK / KeyN / KeyO / Digit 8/9.
- `state.js` stays unread-for-write. Do not add an `alerts` gear field.
- No new SKU. Reuse of Wolfeye / a klaxon buy as a **gate** is a lie — this is a client checkbox.

---

## 7. Ownership (later impl)

| Piece | Owner |
|---|---|
| `hudAlerts` default + `FIELDS` + checkbox | `ctx.js` + `settings.js` |
| Playback gate for HUD-alert subset | `song.js` (prefer; avoids `hud.js`) |
| Family tick emit sites | `hud.js` — **untouched unless CLOS sibling is done and a later owner asks** |
| `reticleLock` emit | `controls.js` — **untouched** |
| Incoming toast copy | `npc-fire-toast.js` — **untouched** |
| Mute / volume math | `song.js` 451–453 — keep; AND alerts subset |
| `state.js` numbers | **untouched** |
| Persist world | **untouched** (`save.js` / `hangar.js`) |
| Digit 0/8/9 | **untouched** (`station.js`) |
| Tgt-rail CLOS | **not this serial** (sibling) |
| Career desk | **not this serial** (sibling) |

`reducedMotion`: live family-emit skip stays. Do **not** add a pulsing HUD-alert animation or new `@keyframes`. `body.rw-reduced-motion` already kills HUD animation (`hud.css` 1181–1185).

---

## 8. Serial PR plan (later wave — named only)

Do **not** land these in Wave 102. Name of later serial: **HUD-03 remaining optional audio-alerts serial**.

1. **PR1** — settings only (no `state.js` write, no `hud.js`): `hudAlerts` on `ctx.settings` default `false`; `FIELDS` boolean; `CHECKBOXES` row `HUD audio alerts`; persist `rimward-settings-v1`; corrupt JSON still fail-closed; `innerHTML` still 0. Pins: unknown blob keys ignored; proto keys ignored; mute checkbox still present.
2. **PR2** — `song.js` gate: HUD-alert subset silent unless `hudAlerts === true`; mute still zeros master; `FAMILY_CUES` still family-gated; combat `npcFire` / `playerHit` / whalesong **not** gated by `hudAlerts`.
3. **PR3** — incoming freeze: grep toast strings still `Incoming fire.` / `Incoming dart.`; no new `CUES` incoming key; no second toast; no new `ctx.emit` type.
4. **PR4** — boot: hub 80 px empty; Digit 0/8/9 unchanged; KeyO still settings; muted + `hudAlerts` true → still silent; scale/contrast/color-blind/reduced-motion unchanged.

If PR1 lands a dead checkbox, still ship PR2 — the **gate** is the missing picture.

---

## 9. Owner questions (Wave 102 deputize — fail-closed)

Do not treat Digit theft, hub gauge, `innerHTML`, new persist-world key, SKU/UU, KeyT/KeyV steal, or Incoming copy rewrite as open.

Owner may override after playtest. **Do not park the later serial** for missing owner numbers. Copied live numbers below.

1. **New settings bool?** **Yes, `hudAlerts`.** Same blob. No extra `localStorage` key.
2. **Default?** **`false`** (optional). Owner may set `true` later to copy live Wave 65 on.
3. **Mute?** **Fail-closed.** `hudAlerts` cannot bypass `muted` / volume 0.
4. **Cues?** **Reuse** `FAMILY_CUES` + `reticleLock`. Do not mint incoming HUD keys. Combat `npcFire` stays combat.
5. **Panel copy?** **`HUD audio alerts`.** After reduced motion, before mute.
6. **Picture?** **KeyO checkbox.** Not hub. Not Digit. Not SKU.
7. **`hud.js` this serial?** **Prefer no.** Gate in `song.js`.
8. **Rewrite Incoming fire./Incoming dart.?** **No.**
9. **New ctx emit?** **No.**
10. **Write `hullKind`?** **No.**
