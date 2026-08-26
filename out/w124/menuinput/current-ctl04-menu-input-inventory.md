# CTL-04 remaining station-menu input scoping — live inventory

**Wave:** 124. Markdown only. Code wins over wishlist copy.  
**Census date:** 2026-08-25.  
**Scope:** leftover **Digit1–5 weapon-group write** while station (and other play) menus own those digits.  
**Not this leftover:** CTL-01 KeyJ (landed Wave 117). CTL-02 hail Digit **resolution** / overlay mutex (landed Wave 118). CTL-03 berth hold (`save.js` + optional overlay-policy hold). AI-05 npc interest. Hail-demand lifecycle. Settings rebind. In-game pause-menu chrome. HUD-01 hub.

Line numbers are 1-based from live `src/` / `scripts/boot-test.mjs` at census. If a later serial moved a symbol, **re-census**; do not trust this file over `src/`.

---

## 0. Frozen records / inbox (status only; code still wins)

| Claim | Source | Live verdict |
|---|---|---|
| Digit keys in landing menus also fire weapon groups | wishlist INBOX (P1, CONTROLS) **cite, do not edit** (`docs/PLAYER-EXPERIENCE-WISHLIST.md` **148–153**) | **LIVE.** Digit1–5 write `input.weaponGroup` with **no** docked skip |
| Wave 117 fixed only D/J | same inbox | **LIVE.** KeyJ `pendingDock`; KeyD strafe only (`controls.js` **302–304**, **468**) |
| Wave 118 Digit skip | CTL-02 / `hailDigitsAllowed` | **LIVE for hail resolve only.** Does **not** skip `weaponGroup` |
| Digit 0 shipyard; Digit 8/9 station services | HUD-01 / station | **LIVE** `DOCK_KEY_SERVICES` `station.js` **188**, **6169–6177**, **6248–6250** |
| Digit 1–5 weapon groups in flight | controls / HUD WPN | **LIVE** `controls.js` **329–344**; `ctx.js` **85** |

Inbox is **INBOX**, not shipped. Census does **not** CONSUME.

**Leftover is REAL. Named later serial: PR1. Do not freeze CONSUME.**

---

## 1. Weapon-group digits (`src/systems/controls.js`) — leftover

Header **25**: `1 / 2 / 3 / 4 / 5 → weapon group (cannon / disruptor / mining / missiles / psionic)`.

`TRACKED` **41–48**: includes `'Digit1', 'Digit2', 'Digit3', 'Digit4', 'Digit5'`. **No Digit6–9. No Digit0.** Those codes `return` at **288** (`!TRACKED.has(e.code)`).

`shouldSkipDockPulse` **68–82**: title overlay attached / `ctx.models.isOpen()` / typing focus. Used **only** by `case 'KeyJ'` **303**. **Not** used by Digit cases.

Keydown bubble **287–345** (no capture, no `stopPropagation`):

```
if (e.repeat || !TRACKED.has(e.code)) return;
pressed.add(e.code);
switch (e.code) {
  case 'Digit1': input.weaponGroup = 1; break;
  case 'Digit2': input.weaponGroup = 2; break;
  case 'Digit3': input.weaponGroup = 3; break;
  case 'Digit4': input.weaponGroup = 4; break;
  case 'Digit5': input.weaponGroup = 5; break;
}
```

**329–344:** assignment is **unconditional**. No `ctx.flags.docked`. No `playSurfaceBlocked`. No `hailDigitsAllowed`. No `flags.hailOpen` / `chartOpen` / `berthOpen` / `paused`. No settings / title / models / typing test on this path.

Write is **in the listener**, not in `update()`. Pause (`main.js` **149–152**) skips `system.update` and **does not** skip this write.

Help **378**: `'1/2/3/4/5 — weapon group: cannon / disruptor / mining / missiles / psionic'`.

**This is the leftover.** Station menus use the same Digit1–5 as services. Both listeners run.

---

## 2. Station digit map (`src/systems/station.js`)

`DOCK_KEY_SERVICES` **188**:

`['market', 'jobs', 'bar', 'feed', 'repair', 'outfitting', 'people', 'launch', 'epics', 'shipyard']`

Level-1 labels **6034**:

`Market`, `Jobs board`, `Bar`, `Feed & tend`, `Repair`, `Outfitting`, `People`, `Launch`, `Standing`, `Shipyard`

Hot keys **6036**: index `i` → digit `i + 1`, last row **0** (shipyard).

| Digit | Level-1 service | Matches inbox |
|---|---|---|
| 1 | Market | |
| 2 | Jobs board | |
| 3 | Bar | |
| **4** | **Feed & tend** | pressing 4 for Feed & tend |
| **5** | **Repair** | pressing 5 for Repair |
| 6 | Outfitting | |
| 7 | People | |
| **8** | Launch | stay station |
| **9** | Standing (epics) | stay station |
| **0** | Shipyard | stay station |

Legend **6047**: `'1-9, 0 select service · Esc/B launch'`.

Comment **6156**: `UI-level keyboard (menu chrome — never writes ctx.input).` Station **does not** write `weaponGroup`. Controls still does.

Listener **6157–6262**: `window.addEventListener('keydown', …)` bubble. **No** `preventDefault`. **No** `stopPropagation`. **No** `stopImmediatePropagation`. Guard `if (!ui.open) return` **6158**.

Level 1 **6169–6177**: `code.startsWith('Digit')` → `d === 0` shipyard, else `DOCK_KEY_SERVICES[d - 1]`. Digit1–5 **open services**. Digit6–9/0 also.

Level 2 Feed **6235–6238**: Digit1 biomass, Digit2 rock, Digit3 tend.  
Level 2 Repair **6239–6240**: Digit1 repair-all.  
Level 2 Outfitting **6248–6250**: Digit **8 / 9** arm papers (not weapon groups).  
Market seed **6200**: Digit1. Market still maps Digit **2–9/0** to dock services **6214–6224**.

Dock sets `ctx.flags.docked = true` and `ui.open = true` **6100–6101**. Overlay class `screen-overlay station-overlay` **4430**. Station overlay z-index **20** (`screens.css` **8–16**).

---

## 3. Overlay policy (`src/systems/overlay-policy.js`) — hail resolution, not WPN write

| Helper | Live | Cite |
|---|---|---|
| `playSurfaceBlocked` | title body-child **or** `models.isOpen()` **or** typing | **83–91** |
| `titleOwnsScreen` | `#rw-title` among `document.body.children` | **35–46** |
| `settingsOwnsScreen` | visible body child, inner `aria-label="Settings"` | **49–70** |
| `isTypingFocus` | INPUT / TEXTAREA / SELECT / contentEditable | **72–81** |
| `overlayIsOpen` | `flags.hailOpen` / `chartOpen` / `berthOpen` `=== true` | **16–27** |
| `hailDigitsAllowed` | false if `flags.paused`, `playSurfaceBlocked`, `settingsOwnsScreen`, chart or berth open; else true. Catch → **false** | **175–185** |

**`hailDigitsAllowed` is not a weapon-group gate.** `controls.js` does **not** import this file.

Wave 118 taught **hail.js** to skip Digit **resolve** when `hailDigitsAllowed !== false`. Wave 118 did **not** teach `controls.js` to skip Digit1–5.

---

## 4. Hail Digit overlap (`src/systems/hail.js`)

**431–432** (live comment, cite):

```
// Number-key shortcuts while the card is open. NOTE: Digit1–3 also switch
// player weapon groups (controls.js) — known overlap, flagged to orchestrator.
```

Listener **433–448**: bubble `keydown`. Digit1–9. Reads `hailDigitsAllowed`; **catch sets `digitsOk = true` (fail open)**. `preventDefault` only when an intent index matches **446**. **No** `stopPropagation`.

`flags.hailOpen = true` on `openCard` **425**. Sibling hail-demand lifecycle is **out of scope**.

---

## 5. WPN meter (`src/systems/hud.js`)

`hudWeaponKey` **243–251**: group 4 empty → `null` (no cannon fallthrough). Group 5 psionic or null.

`weaponHudLabel` **255–273**:

- group 4 no launcher → **`'4 · —'`** (inbox empty group)
- group 5 cannot fire → **`'5 · —'`** (inbox also names `'5 · Psionic bolt'` when catalog ok)
- else `g + ' · ' + wName`

Self rail **926–927**: label `WPN` + `weaponName` value. HUD **reads** `ctx.input.weaponGroup`. Automine click fallback **807** writes group 3 (existing writer exception; **not** this leftover; do not claim `hud.js`).

Aim-glass gauges stay off. HUD-01 empty hub. Kit mutate omit.

---

## 6. Listener order (both window `keydown`, station digits do not stop)

Init order `main.js` **104–136**:

1. `initTitle` **105** — capture-phase **true** (`title.js` **239**). Digit1–9 for entries + `stopImmediatePropagation` **209–214**. Other keys swallowed **225–227**. Title **does** keep Digit1–5 off controls **while attached**.
2. `initStation` **109** — bubble **6157**. Digits while `ui.open`. **No stop.**
3. `initControls` **112** — bubble **287**. Digit1–5 → `weaponGroup`. **No docked skip.**
4. `initSettings` **115** — bubble KeyO / Escape only **228–234**. Digits pass.
5. `initHail` **129** — bubble after controls. Hail Digit resolve **and** WPN already written.
6. `initSave` **131** — KeyL / Escape. Comment **1506–1508**: never intercept / no stop.
7. `initOrigins` **132** — bubble Digit1–5 pick **143–149**. Sets `flags.paused = true` **92**. No stop. Listener removes on choose **117**.
8. `initGalaxyChart` **134** — KeyM / Escape **764–788**. No Digit.
9. `initModelsBrowser` **135** — capture when open **647**. Default `stopImmediatePropagation` **745–749**. Filter INPUT: digits **return without stop** **704–719**.

**Station vs controls:** same bubble phase. Station registers **first**. Station handles the service. Controls **still** writes `weaponGroup`. Inbox repro: docked level-1 **Digit5** Repair **and** WPN `"5 · Psionic bolt"`; **Digit4** Feed **and** WPN `"4 · —"`.

`stopImmediatePropagation` on station is **not** required. Controls can skip the write. Default later fix: skip in the Digit switch.

---

## 7. Path inventory — Digit1–5 → `weaponGroup` today

| Surface | Owns Digit1–5? | Controls writes WPN? | Skip helper already? |
|---|---|---|---|
| Open space, no overlay | flight WPN 1–5 | **YES (keep)** | none — **must not skip** |
| Docked station menu (`flags.docked`, `ui.open`) | station services 1–5 (and 6–9/0) | **YES — leftover** | **none** |
| Title `#rw-title` attached | title entries 1–9 capture-stop | **No** (stopped) | Digit path **unaware**; KeyJ skip only |
| Models open, not filter | capture swallow | **No** | Digit path unaware |
| Models filter focused | letters pass; digits may bubble | **YES** | KeyJ skip typing; Digit **no** |
| Settings open | no Digit bind | **YES** | `settingsOwnsScreen` unused by controls |
| Typing INPUT/TEXTAREA/SELECT/contentEditable | field | **YES** if TRACKED | Digit **no** |
| Hail card open (`flags.hailOpen`) | hail intents 1–n | **YES — known overlap** | hail `hailDigitsAllowed` is resolve-only |
| Chart open (`flags.chartOpen`) | none | **YES** | `fireHeld` already skips chart **476**; Digit **no** |
| Berth open (`flags.berthOpen`) | none | **YES** | unused by controls |
| Pause banner (`flags.paused`) | none | **YES** (keydown still runs) | hailDigitsAllowed false; controls **no** |
| Origins overlay | Digit1–5 pick | **YES** | paused ⇒ hailDigitsAllowed false; controls **no** |
| Digit6–9 / Digit0 | station (docked) / unused in flight | controls **does not handle** | n/a — **do not add** |

Fail closed: missing `ctx.flags` → `docked === true` is false. Live treats missing as **not docked**. Never throw.

---

## 8. LMB `fireHeld` while docked (PR2 census, not PR1)

`controls.js` **476**: `input.fireHeld = fireDown && ctx.flags.chartOpen !== true`. **No docked conjunct.**

`combat.js` **1825–1828**: if `ctx.flags.docked`, hide mining FX and **return**. Weapons **cold** while docked. Fire is **not** player-facing during the menu.

Residual: hold LMB through undock; first combat tick after undock can fire (`fireDown` still true). Chart already documents this class of leak **474–476**.

**Not the same keydown switch.** Do **not** stuff into PR1. Name **PR2** skip `fireHeld` while `flags.docked === true` (one update line, optional).

---

## 9. Context / persist / Digit map

`ctx.js` **15**: `input` written **ONLY** by `controls.js`. **31**: `flags.docked` written by `station.js` only. **85**: `weaponGroup: 1` keys 1/2/3/4/5.

`state.js`: **no** `weaponGroup` key. READ-ONLY this leftover. No persist. No new Digit.

`WORLD_FIELDS` / settings bind schema: **out of scope** (P2 Settings inbox).

---

## 10. Boot / harness (named later pins only)

Live docked Digit dispatches **do not** pin `weaponGroup` unchanged:

- `scripts/boot-test.mjs` **1639** `dispatchKey('Digit5')` // repair
- **1664** `dispatchKey('Digit1')` // repair all
- **1216** `dispatchKey('Digit2')` // jobs
- **1363** `dispatchKey('Digit1')` // market

Later PR1 may add pins: docked Digit1–5 leave `weaponGroup` unchanged; open-space Digit1–5 still set it. Do **not** change Digit0/8/9 station pins. This wave writes **no** `scripts/`.

---

## 11. What Wave 117 / 118 already did (do not reopen)

| Wave | Landed | Not landed |
|---|---|---|
| 117 CTL-01 | KeyJ dock/jump; KeyD strafe | Digit menu vs WPN |
| 118 CTL-02 | overlay-policy mutex; `hailDigitsAllowed` for **hail resolve** under pause/settings/title/models/chart/berth | `controls.js` Digit1–5 skip |

Do **not** reopen overlay mutex. Do **not** remap KeyJ. Do **not** steal Digit 0/8/9.

---

## 12. Verdict

Digit1–5 **do not** skip `input.weaponGroup` while docked menus are open. Inventory **proves** leftover **REAL**. First remaining serial is **PR1**. Serial is **not** none. **Not CONSUME.**
