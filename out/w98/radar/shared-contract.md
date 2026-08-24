# TGT-03 remaining radar shared contract

**Wave:** 98. Design only. No TGT-03 radar feature ships in this wave.  
**Status:** MERGE LAW for `docs/Tgt03RadarDesign.md`. If that brief and this file ever disagree, **this file wins**.  
**Not this wave:** any edit under `src/`, `scripts/`, `public/`, `index.html`, `package.json`. Do not edit `docs/PLAYER-EXPERIENCE-WISHLIST.md`, `PROGRESS.md`, `docs/Tgt03AwarenessDesign.md`, `docs/Tgt05*.md`, `docs/Nav*.md`, `docs/NpcMissilesDesign.md`, `docs/NpcTurretsDesign.md`, `docs/Hud02IdentitiesDesign.md`, `docs/HudUtilityChangeProposal.md`, `docs/Shp*.md`, `docs/Bio*.md`, `docs/OwnerDecisions*.md`.  
**Locked sources:** wishlist TGT-03 remaining (`docs/PLAYER-EXPERIENCE-WISHLIST.md` ~379–401); live inventory `out/w98/radar/current-tgt03-radar-inventory.md` (code wins); `src/systems/hud.js`; `src/ui/hud.css`; `src/systems/controls.js`; `src/game/reticle-aim.js`; `src/game/save.js`; `src/game/hangar.js`; `src/game/state.js` (READ-ONLY); `src/core/ctx.js`; `src/game/contacts.js`; `src/game/npc-fire-toast.js` (sibling; do not rewrite); `src/systems/station.js`; `src/systems/settings.js`.

Integrator rule: a **later** implementation wave obeys this file. Inventory cites live code. Code wins over stale wishlist “radar” as if a PPI / new gauge were absent. Radar **is** the scanner-gated picture.

---

## 0. Orchestrator merge law (do not weaken)

1. Wave 98 radar worker is **markdown only**. Later impl is **serial**. Do **not** schedule or land these PRs in `src/` in this worker.
2. `src/game/state.js` is READ-ONLY this wave. Later impl **defaults to no `state.js` write**. No new radar SKU. No Mk III. Reuse `ctx.world.scanner` 0/1/2 and `.rw-contacts`.
3. Persist: **no** new `WORLD_FIELDS` key. **No** new `localStorage` key. Autosave stays `rimward-save-v1`. Settings stay `rimward-settings-v1`. Scanner already persists. Do **not** write HUD pips into `ctx.world.contacts` (that array is station NPCs; the key is already taken).
4. `innerHTML` forbidden. `textContent` / `h()` / `el()` only. SVG nodes stay `createElementNS` + attributes; do not `innerHTML` the stroke.
5. Digit 0 stays **shipyard** at dock level-1 (`station.js` 186, 5920–5922). Digit 8/9 stay Launch/Standing at dock root and player launcher/turret papers in outfitting. Outfitting Digit 2/4 stay Wolfeye Mk I/II. Do not steal Digit 0–9. Do not invent a radar Digit.
6. HUD **never** writes `hullKind`.
7. Do **not** reopen TGT-01 lead, TGT-02 MATCH, TGT-05 cone/`lockKind` pick math, NAV-02 gate cue law, HUD-01 empty 80 px hub, HUD-02 identities, NPC-missile Q1/Q2, power ledger, aim-glass gauge, BIO-05, NPC turrets, live `.rw-edge-arrow` park/aria, live `Incoming fire.` copy.
8. Do **not** invent UU or standing deltas. Wolfeye prices stay `SCANNER_COST` / `SCANNER2_COST` as live.
9. Prototype-safe persist: `SAFE_ID`, `RESERVED_IDS`, `hasOwn` / `hasOwnProperty`. No `for-in` merge of a raw blob. Scanner heal stays `[0, 1, 2]` else 0.
10. Do not edit sibling Tgt/Nav/Shp/Bio/Hud/Npc docs, the wishlist, `PROGRESS.md`, or `docs/OwnerDecisions*.md`. Do not edit `docs/Tgt03AwarenessDesign.md` or `out/w97/tgt03/**` or `out/w98/tgt03/**` or `out/w98/turrets/**`.
11. Do not “fix” WAVE4 fence, WAVE26 ferry/haul, or WAVE35 haul boot FAILs.
12. KeyT stays cycle (ships; rocks in group 3). KeyV stays reticle lock. Do not steal those keys.
13. `LOCK_CONE_PX = 12` stays. This serial does **not** rewrite pick math. The lock pip on the arc is a mark, not a control.
14. Subsystem targeting **out**. Missile warning **gauge** **out**. Lead/MATCH **out**. NPC darts stay `Incoming dart.` Cannon-vs-player toast `Incoming fire.` is **LIVE** (`src/game/npc-fire-toast.js`, sibling Wave 98 awareness). Do not redesign those toasts here.

---

## 1. DONE — nearby traffic is `.rw-contacts` (reuse; do not duplicate)

Inventory §3. The later serial **must not** add a second traffic widget.

### 1.1 Class

| Cue | Class | Owner |
|---|---|---|
| Nearby traffic (scanner-gated) | `.rw-contacts` | TGT-03 / HUD Wave F |
| Current lock off-glass | `.rw-edge-arrow` | TGT / HUD (Wave 97 awareness polish) |
| Routed next-gate off-glass | `.rw-nav-gate-cue` | NAV-02 |

Do **not** invent `.rw-radar`, a PPI disc, or a hub pip. Do **not** reuse `.rw-edge-arrow` or `.rw-nav-gate-cue` for traffic. Default: **keep** `.rw-contacts`. Exception to a new class is **not** proven — live reuse is not a lie.

### 1.2 Who appears

Only live `ctx.ships` entries with an object, not self, not destroyed, inside the scanner range. Inventory §3.

Fail-closed extras (do **not** add):

- rocks / ore;
- stations / gates / pods / landmarks (chart marks, lock, or NAV-02 already cover those jobs);
- missiles / darts (toast channel; gauge closed);
- station NPC roster rows from `ctx.world.contacts`.

### 1.3 Scanner gate (do not ungate)

| `ctx.world.scanner` | Picture |
|---|---|
| 0 / missing / garbage (heals to 0) | **No arc.** Hide `.rw-contacts`. |
| ≥ 1 (Mk I) | Arc on. Range `U.ENCOUNTER_BUBBLE`. Cap 16. |
| ≥ 2 (Mk II) | Arc on. Range `2 × U.ENCOUNTER_BUBBLE`. Cap 24. Lock closure `«` / `»` only. |

Core ships keep DIST, edge arrow, lead, RANGE, MATCH. They do **not** get a fake radar.

Hide while `ctx.flags.docked` (already). Later polish: also hide while `ctx.gate.jumping` (match NAV-02 park). Do not clear `ctx.world.scanner` from HUD.

### 1.4 Geometry / layout

Keep the thin **bottom** bearing arc. Keep `CONTACT_ARC` math (forward at ends, aft in the bowl). Keep pip pool created once.

**Not** on the 80 px aim glass. **Not** a 22–28% reticle ring. **Not** a filled disc / CRT grid.

Prompt stays above the slot (`.rw-prompt` `bottom: 20%`; arc `bottom: 5.5%`).

### 1.5 Friend / foe / lock

Shape remains the non-color cue:

| Kind | Shape | Class |
|---|---|---|
| Civilian | tick | `is-civ` |
| Hostile (`ai.intent`) | chevron | `is-hostile` |
| Current lock | hollow diamond | `is-lock` |

Color uses existing CSS vars (`--dim` / `--amber` / `--cyan`). `body.rw-colorblind` / `body.rw-contrast` already remap. Do **not** add a green-friend / red-foe triad. Do **not** print names on pips. Mk II closure glyphs stay `«` / `»` via `textContent`.

Lock pip does **not** replace `.rw-edge-arrow` when the lock is off-glass.

### 1.6 Motion / a11y

- Contacts wrap is already `aria-hidden="true"` (decorative). Keep it. Do not make the arc a live region (toasts already are).
- **No new** `@keyframes` on contacts. Live `rw-contact-enter` stays; do not add a sweep/pulse/radar-spin.
- `body.rw-reduced-motion` already sets `#hud * { animation: none !important }`. Live enter keyframes also have an explicit reduced-motion kill. Later must not add a motion path that bypasses that.
- Transform-only pip motion (translate on the arc) is allowed.

### 1.7 What “later radar” may still do

If the live arc already matches this section, ship **jump park** only (hide while jumping). Do not restyle into a disc. Do not raise caps. Do not change bubble math. Do not add pip DIST numbers (lock rail already has DIST).

---

## 2. DONE — lock off-screen stays `.rw-edge-arrow`

Do not merge with traffic. Do not scanner-gate the lock arrow (core). Sibling awareness already shipped `aria-hidden` and dock/jump park (`hud.js` 736, 1303–1306). This radar serial **does not** restyle or rename that class.

---

## 3. DONE — route stays `.rw-nav-gate-cue`

Do not merge with traffic or lock. Do not put next-gate pips on `.rw-contacts`.

If a routed gate, a lock, and nearby ships are all relevant, **all three surfaces may show** (arc if scanner ≥ 1 and not docked; lock arrow if lock off-glass; gate cue if hop off-glass). They must not share class.

---

## 4. Closed — toasts, FORE/AFT, missile gauge

| Moment | Channel | Radar serial |
|---|---|---|
| NPC dart vs player | toast `Incoming dart.` | **Do not change** |
| Cannon vs player | live toast `Incoming fire.` (`npc-fire-toast.js`) | **Do not change** |
| Hull hit | FORE/AFT on `playerHit` | **Do not change** |
| Incoming missile widget | closed | **Out** |

No radar toast. No hub incoming pip.

---

## 5. Security / emit / persist

- Picture is live simulation (`ctx.ships` + `scanner`). Do not snapshot pips into save.
- Do **not** assign `ctx.world.contacts =` from HUD. That field is people (`contacts.js`).
- No new world field. No `for-in` merge. Scanner restore already allowlists 0/1/2.
- Do not put ship `record` blobs, names, or faction strings on pip nodes as text or data-attributes.
- Pip `shipId` stays internal JS slot state. If missing, use the existing `'i' + i` fallback — do not index `WEAPONS` or `SYSTEMS` with it.
- Existing emits `hudMechContact` / `hostileEnter` stay. Do **not** add a new `ctx.emit` type for radar.
- Do not assign `innerHTML` on pips, SVG, or toasts.
- Reserved ids: do not use raw record ids as object keys in a prototype-unsafe merge.

---

## 6. Closed HUD / keys / digits / SKU

- 80 px hub stays empty. No lock box. No incoming gauge. No radar pip. No power pip.
- Do not set `ctx.targets.current` from the radar serial.
- Digit 0 shipyard. Digits 1–9 station services stay. Weapon groups 1–5 stay.
- Outfitting 2/4 remain Wolfeye. Do not add a third scanner buy.
- Do not steal KeyT / KeyV / KeyM / Digit 8/9.
- `state.js` stays unread-for-write. Do not add a `radar` gear field.

---

## 7. Ownership (later impl)

| Piece | Owner |
|---|---|
| Contacts show/hide, range, cap, kinds | `hud.js` (already) |
| Jump park hide | `hud.js` (later polish) |
| CSS class stay `.rw-contacts` | `hud.css` |
| Scanner ladder 0/1/2 | `station.js` / `hangar.js` / `save.js` — **untouched** unless a bug in jump park requires none of them |
| Pick math | **untouched** (`reticle-aim.js` / `controls.js`) |
| `state.js` | **untouched** |
| `world.contacts` roster | **untouched** (`contacts.js`) |
| Edge arrow / `Incoming fire.` | **not this serial** (awareness sibling; **already live**) |

Prefer extracting a tiny `contactsGate(scanner, docked, jumping)` helper so pins do not need jsdom. HUD still owns DOM.

---

## 8. Serial PR plan (later wave — named only)

Do **not** land these in Wave 98.

1. **PR1** — pins: scanner 0 → hide; Mk I bubble + cap 16; Mk II 2× + cap 24 + lock closure; civ/hostile/lock kinds; ships-only; unknown scanner heals to hide. No DOM.
2. **PR2** — jump park: hide `.rw-contacts` while `ctx.gate.jumping` (keep docked hide). **No** new class. **No** PPI. **No** extra entity kinds.
3. **PR3** — confirm three classes still distinct; lock arrow and gate cue unchanged; no pip names; no `world.contacts` write.
4. **PR4** — boot / reduced-motion / contrast: no new `@keyframes`; enter pulse still dies under `rw-reduced-motion`; hub still empty.

If PR1 pins already match live `hud.js`, PR2 is the only behavior change. Do not restyle the arc into a disc in PR3.

---

## 9. Defaults for owner questions

Inventory froze these. Do not treat them as open.

| Q | Default |
|---|---|
| New CSS class / `.rw-radar`? | **No.** Reuse `.rw-contacts`. |
| Hub PPI / reticle ring? | **No.** |
| New SKU / Mk III / `state.js`? | **No.** |
| Persist radar snapshot? | **No.** Scanner already persists. |
| Write pips into `world.contacts`? | **No.** That is the people roster. |
| Rocks / gates / missiles on the arc? | **No.** |
| Names on pips? | **No.** |
| Scanner-ungate the arc? | **No.** Tier 0 = no arc. |
| Hide while jumping? | **Yes** (park, do not clear scanner). |
| New `@keyframes`? | **No.** |
| Merge lock / gate / traffic? | **No.** Three classes stay. |
| Subsystem targeting / missile gauge / lead? | **Out.** |
