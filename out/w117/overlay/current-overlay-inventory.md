# CTL-02 remaining overlay-priority — live inventory

**Wave:** 117. Markdown only. Code wins over wishlist copy.  
**Census date:** 2026-08-24.  
**Scope:** leftover **Hail / Galaxy Chart / Berth Records stacking** while the sim continues, plus a resolved **"Let them go"** hail that can return during (or without) calm.  
**Not this leftover:** P1 toast-flood (FEEDBACK inbox). P2 chart-label a11y. P2 close-chart-on-AP. CTL-01 KeyJ dock bind. NAV-05 `showApLive`. HUD-02 combat rails. HUD-01 hub.

Line numbers are 1-based from live `src/` at census. If a later serial or sibling moved a symbol, **re-census**; do not trust this file over `src/`. NAV-05 may retouch `galaxychart.js` `showApLive`. CTL-01 may retouch `controls.js` KeyJ. HUD-02 may shift `hud.js` combat rails. **Do not** treat those siblings as this leftover.

---

## 0. Frozen records / inbox (status only; code still wins)

| Claim | Source | Live verdict |
|---|---|---|
| Hail + Chart + Berth can stack; sim continues | wishlist IDEA (P1, OVERLAYS) **cite, do not edit** | **LIVE.** No mutex. Leftover **real** |
| Resolved "Let them go" can return | same inbox | **LIVE hole.** `openCard` does not read `calmUntil`. Salvage `letGo` sets **no** calm. Respawn AI starts `calmUntil: 0` |
| Title first in `systems[]` | Wave 40 `PROGRESS.md` 4726–4733 | **LIVE.** `main.js` 105–106 `initTitle` is `systems[0]` |
| Z-index ladder | Wave 40 notes | **Mostly LIVE** with drift: chart is now **30** (`hud.css` 1908); death overlay also **30** (`screens.css` 460–461); models **80** (`models.css` 3, 13) |
| `flags.chartOpen` | `ctx.js` | **LIVE** session; galaxychart only writer |
| `flags.hailOpen` / `flags.berthOpen` | — | **ABSENT.** Berth open is a `save.js` local. Hail open is a `hail.js` local |
| Overlay-policy helper | — | **ABSENT** (grep `overlay-policy` / `overlayPriority`: none) |
| Digit 0/8/9 | HUD-01 / station | **LIVE** `DOCK_KEY_SERVICES` `station.js` 188, 6098–6106 |
| KeyH / KeyM / KeyL | hail / chart / berth | **LIVE.** Stay. Do not remap |
| KeyJ | CTL-01 sibling | **LIVE dock** `TRACKED` + `pendingDock` (`controls.js` 44, 291–292). Cite. Do **not** remap here |
| NAV-05 `showApLive` | `galaxychart.js` 572–576, 623, 709–718 | **LIVE** (sibling may already paint cancel/disengage). Do not steal |
| Close chart on AP engage | P2 inbox | Chart stays open on `tryEngage` (`galaxychart.js` 627–636). Do not steal |

Inbox is **INBOX**, not shipped. Census does **not** CONSUME.

---

## 1. Hail (`src/systems/hail.js`) — leftover

Header **8–10**: world stays live; **nothing** touches `ctx.flags.paused`. Root is `pointer-events:none` except the card.

Root z-index **40** (**108**). Card `pointer-events:auto` (**115**). Clicks stop at the card (**117–118**).

Open state is **module-local** `open` (**122**). No `ctx.flags.hailOpen`.

`closeCard` **124–127**: clears `open`, `display:none`. Does **not** write a calm clock.

`letGo` **184–196**:

- Salvage / disabled: comm line only. **No** `ai.calmUntil`. Label **308**: `'Leave the hulk'`.
- Live: `ai.mode = 'flee'`, `ai.calmUntil = ctx2.world.time + 30` (**192**). Label **308**: `'Let them go'`.

Other calm writes (session AI, not persist):

| Intent | `calmUntil` | Cite |
|---|---|---|
| `acceptTribute` | `time + 30` | 177 |
| `letGo` live | `time + 30` | 192 |
| `respect` | `time + 60` | 205 |
| `payTribute` | `time + 60` | 243 |
| `showTeeth` success | `time + HIDDEN_MOUNTS.calmSeconds` | 258 |
| `letGo` salvage | **none** | 185–186 |
| `keepFiring` / `refuseFight` | none | 231–232, 279–283 |

Every resolve emits `hailClosed` then `closeCard` (**294–295**).

`openCard` **326–403**: no check for `chartOpen`, berth, pause, title, or `ai.calmUntil`. Rebuilds via `card.textContent = ''` (**343**) then `createElement` / `textContent`. Portrait `img.alt` is speaker + faction (**364**). Buttons `[n] label` (**391**).

Digit shortcuts **405–416**: while `open`, `Digit1–9` `preventDefault` and resolve. **Does not** test other overlays. Comment **405–406**: Digit1–3 also switch weapon groups (`controls.js`) — known overlap. **Does not** use Digit 0.

`update` **419–446**:

- `hailOpened` → `openCard` always (**421**).
- `hailClosed` closes if same ship or unscoped (**422**).
- KeyH via `ctx.input.hailPressed` opens salvage if `!open` (**426–428**).
- Destroyed / despawned closes (**432–435**).
- Live hail on newly disabled hull **re-emits** `hailOpened` and `openCard` (**436–444**).

**No Escape.** Close is an intent, ship death, or `hailClosed`.

Player salvage emit: `tryOpenDisabledHail` **86–97** / `canHailDisabled` **75–83**. No calm gate.

---

## 2. NPC hail emit + calm (`src/systems/npc.js`)

AI defaults (`makeAi` census **227**, **249**): `hailed: false`, `calmUntil: 0`. **Instance only.** Despawn + `spawnLiveShip` resets both.

`updateResolve` **1375–1417**:

- `now < ai.calmUntil` → return (**1377**). Bargaining hail **does not** emit during that window **from this function**.
- Bargaining hail **1414–1417**: band change to `'bargaining'` AND `!ai.hailed` AND `!ai.demanding` AND in `U.TARGET_RANGE`. Sets `ai.hailed = true` (never cleared on this instance; grep `hailed` writers: **227**, **1415** only).

Demand hail **1869–1886**: hunting pirate, `!ai.demandSent`, jump-grace, record cooldown, range. **Does not** read `calmUntil`.

`hailClosed` / `hailOpened` weapon-cold **2430–2443**: ship-scoped; not overlay mutex.

**Reopen paths that skip the resolve calm gate:**

1. `hail.js` `openCard` ignores `calmUntil`.
2. Salvage `letGo` never sets `calmUntil`; KeyH can reopen the same hulk immediately.
3. New live instance of the same record: `hailed === false`, `calmUntil === 0`.
4. Demand hail does not consult `calmUntil`.
5. `world.js` Callow `hailOpened` **1245** has no overlay / calm check.

---

## 3. Galaxy chart (`src/systems/galaxychart.js`) — leftover

Header **24–27**: KeyM toggle; **does not pause**; **does not intercept key** events (Escape/KeyM excepted). Flight keys keep working. `aria-modal='false'` (**113**) — gameplay continues.

`setOpen` **420–427**: writes `ctx.flags.chartOpen` (**422**). Only writer (`ctx.js` 208, 261).

KeyM **667–677**: if open → close; else open unless `docked` or `paused`. **Does not** test hail or berth. Escape closes if open.

`update` **688–689**: close if `docked`.

AP engage **619–636**: `tryEngage` then `showApLive(line)` (**630**). Chart **stays open**. Chart Cancel already calls `showApLive(apLine('cancel'))` while `chartOpen` (**623**). Fly `autopilotDisengaged` paints `showApLive` while `chartOpen` (**709–718**). P2 close-chart-on-AP is **not** this leftover. NAV-05 owns `showApLive` (**572–576**, `#rw-galaxy-ap-live`).

Hit discs `pointer-events: all` (**276**). Root `.rw-galaxy-chart` (`hud.css` **1899–1916**) is full-screen **without** `pointer-events: none` — the chart **does** eat clicks. Header comment “does not intercept pointer events” is **stale vs CSS**.

Z-index **30** (`hud.css` 1908): above station **20**, below pause **50**, **below hail 40**, **below berth 60**.

---

## 4. Berth records (`src/game/save.js`) — leftover

Panel **1344–1497**. Hint **1376**: `'L or ESC to close — records hold while you fly'`. Sim stays live.

Root z-index **60**, `pointer-events: none` except panel auto (**1350–1360**). `role='dialog'` `aria-label='Berth Records'` (**1361–1362**).

`berthOpen` is **local** (**1382–1388**). **Not** `ctx.flags`.

KeyL **1486–1496**: toggle; open blocked if `docked` / `paused` / `dead`. **Does not** test hail or `chartOpen`. Escape closes.

`update` **1544**: close if docked or dead. **Does not** close for hail or chart.

Load while paused refused (**1399–1403**). Mid-jump refused (**1404–1406**, **1513–1515**).

---

## 5. Pause / title / settings / origins / models (ladder; honor)

| Surface | Pause? | Z | Cite |
|---|---|---|---|
| `#hud` | no | 10 | `style.css` 24–28 |
| `.screen-overlay` (station) | docked world | 20 | `screens.css` 8–16 |
| Galaxy chart | **no** | 30 | `hud.css` 1908; `galaxychart.js` 25–26 |
| `.death-overlay` | dead | 30 | `screens.css` 460–461 |
| Onboarding hint | no | 35 | `onboarding.js` 13, 84 |
| Hail card | **no** | 40 | `hail.js` 8–9, 108 |
| Gate jump fade | jumping | 40 | `gate.js` 564 |
| Pause banner | **yes** `flags.paused` | 50 | `main.js` 161–176 |
| Origins | **yes** | 60 | `origins.js` 92, 98 |
| Berth records | **no** | 60 | `save.js` 1352, 1376 |
| Title | **yes** at boot | 70 | `screens.css` 506–507; `title.js` 5, 59 |
| Settings KeyO | **no** | 80 | `settings.js` 13–15, 93; KeyO **228–234** |
| Models browser | **yes** (save/restore pause) | 80 | `models.css` 3, 13; `modelsbrowser.js` 8, 639–640, 690 |
| `#fatal` | crash | 99 | `index.html` 13 |

Wave 40 contract (`PROGRESS.md` 4726–4733): `initTitle` **must** stay `systems[0]`; capture-phase keydown outranks controls/origins because it registers first. Settings is topmost **interactive** product surface so it can open over the title. Models later joined **80** (same band as settings).

Pause loop (`main.js` **149–156**): if `paused`, **no** `system.update`. Event queue still rotates (`lastEvents` / `events` clear). A `hailOpened` emitted on a paused frame is **dropped** without `openCard`. Do **not** “fix” overlay policy by pausing hail/chart/berth (would drop hails and freeze the sim).

Pause KeyP (`main.js` **165–176**): skip if typing / models open / `#rw-title`. **Does not** skip hail/chart/berth/settings.

Title capture (`title.js` **190–227**): swallows all but KeyO / Escape. Enter = first entry (**217–222**).

Settings: KeyO toggles even over title. Does not pause.

---

## 6. `ctx.flags` / persist

`ctx.flags` (`ctx.js` **200–208**): `docked`, `combat`, `paused`, `firstPerson`, `camera`, `matchSpeed`, `saveRestored`, `chartOpen`.

`chartOpen`: session only, not `WORLD_FIELDS` (`ctx.js` 208, 261).

`WORLD_FIELDS` (`save.js` **76–101**): **no** hail calm, **no** overlay flags. `ai.calmUntil` dies with the live ship.

`input.hailPressed` (`ctx.js` 87; `controls.js` 288–289, 386): KeyH edge. `TRACKED` includes KeyH **and KeyJ** (**44**). KeyJ is CTL-01 `pendingDock` (**291–292**). **No** KeyM / KeyL / KeyP / KeyO in `TRACKED`. Help **370**: `'H — hail · J — dock · C — camera'`. Help **374–375**: M chart, L berth.

`controls.js` **465**: `fireHeld` suppressed while `chartOpen`. Not a mutex.

---

## 7. Stacking proof (code wins — leftover REAL)

There is **no** shared gate. Three independent openers:

| Open A | Open B | Result today |
|---|---|---|
| Hail (40) + Chart (30) | both | Hail card paints **over** the chart; chart still full-screen clickable around the card; sim + AP continue (`aria-modal false`) |
| Hail (40) + Berth (60) | both | Berth **covers** the hail card; hail `open` stays true; **Digit1–9 still resolve hail** (`hail.js` 407–415) |
| Chart (30) + Berth (60) | both | Berth covers chart; chart `chartOpen` stays; KeyM/Escape still close chart |
| All three | yes | Berth on top, hail digits still live, chart Open flag still true, world time still advances |
| Pause (50) + Berth (60) | yes | Pause banner **under** berth; load already refused while paused (`save.js` 1403) |
| Settings (80) + any | yes | Settings covers; hail digits still live if hail `open` |

`hail.js` **421** will `openCard` while the chart or berth is already up. Chart KeyM **674** and berth KeyL **1493** will open while hail is up.

Sim continues: hail header; chart header; berth hint.

---

## 8. Honor / sibling collision (do not solve here)

| Sibling / inbox | Live | This leftover |
|---|---|---|
| HUD-01 empty 80 px hub | `hud.css` 184–193 | Do not put overlay chrome on `.rw-reticle` |
| Digit 0 shipyard; Digit 8 launch; Digit 9 epics | `station.js` 188, 6098–6106 | Hail may keep Digit **1–n** only while hail is the exclusive top card. **No Digit 0** |
| KeyH hail, KeyM chart, KeyL berth | `controls.js` 271, 353–358; chart 669; save 1488 | **Stay.** Do not remap |
| CTL-01 KeyJ | **LIVE** `pendingDock` (`controls.js` 44, 291–292, 370) | **Cite. Do not remap.** |
| NAV-05 `showApLive` / chart-open fly | `galaxychart.js` 572–636, 709–718; `autopilot.js` 155–156, 220 | Do **not** claim `showApLive`. Chart-open **cancels AP steer**, does not close chart |
| P2 close-chart-on-AP | chart stays open on engage 627–634 | **Do not steal** |
| P1 toast-flood | `.rw-toasts` under `#hud` z 10 (`hud.css` 635; `hud.js` 813–819) | **Different inbox.** Do not raise toast z-index. Do not dedupe here |
| P2 chart-label a11y | labels not hit targets; hits are discs 271–278 | **Do not solve** |
| HUD-02 combat rails | `hud.js` | Do not claim |

---

## 9. Verdict

**Leftover is real. Not CONSUME. Serial is not none.**

Named later serial: **PR1 overlay-priority**.

If a later census finds mutex among hail/chart/berth **and** `openCard` / KeyH refuse `now < ai.calmUntil` **and** salvage `letGo` cannot immediately reopen, re-open this leftover as CONSUME. Census today does **not**.
