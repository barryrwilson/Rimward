# TGT-03 remaining awareness shared contract

**Wave:** 97. Design only. No TGT-03 feature ships in this wave.  
**Status:** MERGE LAW for `docs/Tgt03AwarenessDesign.md`. If that brief and this file ever disagree, **this file wins**.  
**Not this wave:** any edit under `src/`, `scripts/`, `public/`, `index.html`, `package.json`. Do not edit `docs/PLAYER-EXPERIENCE-WISHLIST.md`, `PROGRESS.md`, `docs/Tgt05*.md`, `docs/Nav*.md`, `docs/NpcMissilesDesign.md`, `docs/Hud02IdentitiesDesign.md`, `docs/Shp*.md`, `docs/Bio*.md`, `docs/OwnerDecisions*.md`.  
**Locked sources:** wishlist TGT-03 remaining (`docs/PLAYER-EXPERIENCE-WISHLIST.md` 367–387); live inventory `out/w97/tgt03/current-tgt03-inventory.md` (code wins); `src/systems/hud.js`; `src/ui/hud.css`; `src/systems/combat.js`; `src/systems/npc.js`; `src/systems/controls.js`; `src/game/reticle-aim.js`; `src/game/save.js`; `src/game/state.js` (READ-ONLY); `src/core/ctx.js`; `src/systems/station.js`; `src/systems/settings.js`; `src/systems/song.js`; `src/game/psionic.js`.

Integrator rule: a **later** implementation wave obeys this file. Inventory cites live code. Code wins over stale wishlist “off-screen target arrows” as if they were absent.

---

## 0. Orchestrator merge law (do not weaken)

1. Wave 97 is **markdown only**. Later impl is **serial**. Do **not** schedule or land these PRs in `src/` in this worker.
2. `src/game/state.js` is READ-ONLY this wave. Later impl **defaults to no `state.js` write**. No new TGT-03 SKU. Reuse existing lock + toast.
3. Persist: **no** new `WORLD_FIELDS` key. **No** new `localStorage` key. Autosave stays `rimward-save-v1`. Settings stay `rimward-settings-v1`.
4. `innerHTML` forbidden. `textContent` / `h()` / `el()` only.
5. Digit 0 stays **shipyard** at dock level-1 (`station.js` 186, 5920–5922). Digit 8/9 stay Launch/Standing at dock root and player launcher/turret papers in outfitting. Do not steal Digit 0–9.
6. HUD **never** writes `hullKind`.
7. Do **not** reopen TGT-01 lead, TGT-02 MATCH, TGT-05 cone/`lockKind` pick math, NAV-02 gate cue law, HUD-01 empty 80 px hub, HUD-02 identities, NPC-missile Q1/Q2, power ledger, aim-glass gauge, BIO-05, NPC turrets.
8. Do **not** invent UU or standing deltas.
9. Prototype-safe persist: `SAFE_ID`, `RESERVED_IDS`, `hasOwn` / `hasOwnProperty`. No `for-in` merge of a raw blob.
10. Do not edit sibling Tgt/Nav/Shp/Bio/Hud/NpcMissiles docs, the wishlist, `PROGRESS.md`, or `docs/OwnerDecisions*.md`.
11. Do not “fix” WAVE4 fence, WAVE26 ferry/haul, or WAVE35 haul boot FAILs.
12. KeyT stays cycle (ships; rocks in group 3). KeyV stays reticle lock. Do not steal those keys.
13. `LOCK_CONE_PX = 12` stays. This serial **reads** `ctx.targets.current`. It does **not** rewrite pick math.
14. NPC missiles stay pirate+ace, toast `Incoming dart.` + song, pool 4, `vsPlayer`. Do not reopen Q1/Q2.

---

## 1. DONE — lock off-screen cue (reuse; do not duplicate)

Inventory §3. The later serial **must not** add a second lock arrow.

### 1.1 Class

| Cue | Class | Owner |
|---|---|---|
| Current lock off-glass | `.rw-edge-arrow` | TGT / HUD |
| Routed next-gate off-glass | `.rw-nav-gate-cue` | NAV-02 |

Do **not** reuse `.rw-nav-gate-cue` for lock. Do **not** reuse `.rw-edge-arrow` for the gate. Do **not** invent a third lock class unless the owner opens a rename (default: **keep** `.rw-edge-arrow`).

### 1.2 Who it points at

Only `ctx.targets.current` when live `lockOk` as today (`hud.js` 1198–1203):

- live ship (`!lockKind` and `state` or `object`);
- rock (`isRockLock` / asteroid list);
- `lockKind` in `station` | `gate` | `pod` | `landmark`.

Fail-closed: no lock, destroyed, missing position → hide (already `hud.js` 1222–1226).

### 1.3 Geometry

Reuse live NDC project + behind-camera flip (`proj.z > 1`) + `EDGE_MARGIN = 84`. On-glass → bracket, hide arrow. Off-glass or behind → arrow, hide bracket/lead.

Not on the 80 px aim glass. Not a radar of nearby ships (that is `.rw-contacts`, scanner-gated).

### 1.4 Coexistence with NAV-02

If a routed gate **and** a lock are both off-screen, **both** cues may show. They must not share class or copy. Same `EDGE_MARGIN` is allowed; glyphs stay distinct (amber triangle vs ticks+notch).

### 1.5 Motion / a11y (later polish only)

- **No** `@keyframes` on the lock cue. Transform only. `body.rw-reduced-motion` already kills HUD animations.
- Color via `var(--amber)` / `--rw-warn` so colorblind/contrast remaps apply. Shape (triangle + rotation) is the non-color cue. **No** new word on the glyph (default).
- Later: set `aria-hidden="true"` like the gate cue. Lock identity stays on the existing bracket/rail when on-glass.
- Later: **park** the arrow while `ctx.flags.docked` or `ctx.gate.jumping` (match NAV-02 `navPark`). Do not clear `targets.current` from HUD.

### 1.6 Scanner

The lock arrow is **core**. Do not gate it on `ctx.world.scanner`.

---

## 2. DONE — incoming dart toast (do not rewrite)

| Moment | Copy | Channel |
|---|---|---|
| NPC missile vs player | `Incoming dart.` | toast `warn` |

Keep the literal. Keep `DART_TOAST_GAP` 2.5 s. Keep `e.weapon === 'missile' && e.target === 'player'` (missing missile target must **not** toast — combat drops that shot).

Song `npcFireMissile` stays. No `commLine` for the dart (Wave 82 Q2). No glass gauge.

---

## 3. OPEN — attacker-is-firing (cannon vs player)

### 3.1 Channel

Existing `.rw-toasts` / `pushToast` / `toastForEvent` `'npcFire'`. **Not** a new overlay. **Not** FORE/AFT (that is `playerHit`). **Not** contacts-arc chevron (that is `ai.intent`, scanner-gated). **Not** a hub pip.

### 3.2 When

Consume live `npcFire`. Toast **cannon vs the player** only:

| Emit | Toast? |
|---|---|
| `weapon === 'missile'` + `target === 'player'` | **No extra** — keep `Incoming dart.` only |
| `weapon === 'cannon'` + `target === 'player'` | **Yes** — attacker line |
| `weapon === 'cannon'` + `target == null` (ace omit) | **Yes** — match `combat.js` 1788 |
| `weapon === 'cannon'` + live ship target | **No** — NPC-vs-NPC |
| unknown `weapon` (including `__proto__`, empty, or missing) | **No** — fail-closed. HUD **must not** copy `spawnNpcShot`’s “unknown → cannon” default (`combat.js` 1300) |
| `weapon === 'psionic'` | **Do not emit** in this serial. If a **later** sibling emits vs player, reuse the same attacker line (do not invent a third string) |

HUD compares with `=== 'cannon'` / `=== 'missile'` only. Do not index `WEAPONS[e.weapon]` from the toast helper.

Do **not** toast telegraph `commLine` (`Heave to.`) as firing. Telegraph stays voice. Firing toast starts on the first qualifying `npcFire`.

### 3.3 Copy (static literals)

| Moment | Copy | Class |
|---|---|---|
| Cannon (or later psionic) vs player | `Incoming fire.` | `warn` |
| Dart vs player | `Incoming dart.` | `warn` |

Do **not** interpolate ship name, faction, or `e.ship`. Do not use `innerHTML`. `pushToast` stays `textContent`.

### 3.4 Throttle

NPC cannon interval is ~0.33 s (`npc.js` 89). Do **not** toast every shot.

Later: a fire gap **2.5 s**, same magnitude as `DART_TOAST_GAP`, **separate** memo from the dart clock so a dart then a cannon can still show **two** distinct lines. Dedupe still uses `cls|text` while a slot is live.

Docked / jumping: do not toast attacker fire (player is not in the fight). Fail-closed if `ctx.flags.docked` or `ctx.gate.jumping`.

Not scanner-gated.

### 3.5 Song / events

Do **not** add a new `ctx.emit` type. Do **not** add a new song cue. Live `npcFire` bark stays. Do **not** emit `playerHit` on muzzle.

### 3.6 FORE/AFT

Keep flash **only** on `playerHit`. Attacker toast must not set `selfHitFlashUntil`.

---

## 4. NPC psionic / turrets (out of this serial)

- Live NPCs never fire psionic (`combat.js` 1302; `npc.js` grep 0). This serial **does not** add NPC Digit 5.
- NPC turrets are a **sibling** Wave 97 worker. If that serial later emits `npcFire` cannon vs player, **this** toast law applies automatically. Do not design turret SKUs here.

---

## 5. Security / emit / persist

- Copy is authored literals. Strip is already on lock **names** (`stripHudText`). Attacker toast has no name field.
- Do not put NPC `record` blobs on the toast node as data-attributes.
- No new world field. No `for-in` merge.
- `npcFire` payload stays `{ ship, weapon, target }` as live. Toast reads `weapon` + `target` only (identity, not HTML).
- Reserved ids: do not index `WEAPONS` with raw `e.weapon` in HUD. Allowlist `=== 'cannon'` / `=== 'missile'` only. Unknown must not toast (combat may still spawn a cannon bolt; the **warning** stays fail-closed).
- Do not assign `slot.el.innerHTML`. Do not put `e.ship` / record names on the node.

---

## 6. Closed HUD / keys / digits

- 80 px hub stays empty. No lock box. No incoming gauge. No power pip.
- Do not set `ctx.targets.current` from the awareness serial except by existing KeyT/KeyV.
- Digit 0 shipyard. Digits 1–9 station services. Weapon groups 1–5 stay.
- Do not steal KeyT / KeyV / KeyM / Digit 8/9.

---

## 7. Ownership (later impl)

| Piece | Owner |
|---|---|
| `toastForEvent` npcFire branches | `hud.js` |
| Edge arrow park / aria | `hud.js` |
| CSS class stay `.rw-edge-arrow` | `hud.css` |
| `npcFire` emit | `npc.js` (no change required for cannon toast) |
| `npcFire` spawn | `combat.js` (no change required for toast) |
| Pick math | **untouched** (`reticle-aim.js` / `controls.js`) |
| `state.js` / `save.js` | **untouched** |

Prefer extracting a tiny `npcFireToast(e, ctx, mem)` helper so pins do not need jsdom. HUD still owns DOM.

---

## 8. Serial PR plan (later wave — named only)

Do **not** land these in Wave 97.

1. **PR1** — pins: `npcFire` vs-player matrix (missile+player / cannon+player / cannon+omit / cannon+ship / unknown) → expected copy or null. No DOM.
2. **PR2** — `toastForEvent` cannon-vs-player `Incoming fire.` + 2.5 s fire gap + dock/jump suppress. Dart path unchanged.
3. **PR3** — lock cue polish only: `aria-hidden`; park docked/jumping; confirm both cues can show; no class steal. **No** second arrow.
4. **PR4** — boot / reduced-motion / contrast: toast still `textContent`; no `@keyframes` on `.rw-edge-arrow`; FORE/AFT still hit-only.

If PR3 finds the live arrow already correct, ship **aria + park** only. Do not restyle into NAV-02 ticks.

---

## 9. Defaults for owner questions

| Q | Default |
|---|---|
| New lock CSS class? | **No.** Keep `.rw-edge-arrow`. |
| Word on the arrow? | **No.** |
| Scanner-gate the firing toast? | **No.** |
| New SKU / `state.js`? | **No.** |
| `commLine` instead of toast? | **No.** Toast, matching dart Q2. |
| NPC psionic emit? | **No** this serial. |
| Hide lock arrow docked? | **Yes** (park, do not clear lock). |
