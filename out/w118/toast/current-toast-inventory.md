# HUD-04 leftover toast-flood — live inventory

**Wave:** 118. Markdown only. Code wins over wishlist copy.  
**Census date:** 2026-08-25.  
**Scope:** leftover **repeated autosave refusals** and **identical encounter / comm toasts** that fill the 5-slot stack, plus **autosave vs berth/manual** copy that shares one `SAVE BLOCKED` string.  
**Not this leftover:** CTL-02 hail/chart/berth mutex (Wave 118 overlay sibling). P2 chart-label a11y. P2 close-chart-on-AP. CTL-01 KeyJ dock bind. NAV-05 `showApLive`. HUD-02 combat rails. HUD-01 hub. HUD-03 `hudAlerts`.

Line numbers are 1-based from live `src/` at census. If a later serial or sibling moved a symbol, **re-census**; do not trust this file over `src/`. Overlay sibling may retouch `save.js` **berth panel**. This leftover may later tag `saveBlocked` **emit payloads only**. **Do not** treat overlay mutex as this leftover.

---

## 0. Frozen records / inbox (status only; code still wins)

| Claim | Source | Live verdict |
|---|---|---|
| Repeated autosave refusals flood the stack | wishlist IDEA (P1, FEEDBACK) **cite, do not edit** | **LIVE.** Idle `BLOCK_RETRY` 5 s > `TOAST_LIFETIME` 4 s. After expire, `pushToast` allocates again. Leftover **real** |
| Identical encounter / comm lines flood | same inbox | **LIVE hole** across frames. `frameLines` is **same-frame only**. Visible same-key refresh exists; post-expire repeats restack |
| Distinguish manual-save failures from background autosave retries | same inbox | **LIVE mix.** One copy `'▲ SAVE BLOCKED — ' + reason`. Autosave hostile reason still says **berth record refused** |
| Same-frame commLine vs clue/landmark | wave 6 `frameLines` | **LIVE.** Not a time window. **Keep.** Not the leftover fix |
| Overlay hail/chart/berth mutex | Wave 117/118 CTL-02 | **Sibling LIVE in tree** (`overlay-policy.js`; imports in hail/chart/save). Do not raise toast z. Do not add hail toasts. Do not revert mutex |
| Digit 0/8/9 | HUD-01 / station | **LIVE** — do not steal |
| KeyJ | CTL-01 sibling | **LIVE dock** — cite, do not remap |
| NAV-05 `showApLive` | `galaxychart.js` | **LIVE** — do not steal |
| Close chart on AP | P2 inbox | Do not steal |
| Chart-label a11y | P2 inbox | Do not solve |

Inbox is **INBOX**, not shipped. Census does **not** CONSUME.

---

## 1. Toast channel (`src/systems/hud.js`) — leftover

`TOAST_LIFETIME = 4` (**64**). `TOAST_SLOTS = 5` (**65**).

Root `.rw-toasts` (**813–816**): `role='status'` `aria-live='polite'`. Comment: screen readers announce; no focus move.

Five `.rw-toast` nodes created once (**818–819**). Each slot `{ el, until: 0, key: '' }`. Cursor **821**.

`toastForEvent` (**530–648**): maps `ctx.events` to `{ text, cls }` or `null`.

| Event | Toast | Dedupe | Cite |
|---|---|---|---|
| `commLine` | `e.text ?? e.line`; cls `comm` | skip if `mem.frameLines` **this frame** | 532–540 |
| `clueFound` / `landmarkFound` | `✧` + line; **push** `frameLines` | same-frame partner `commLine` skip | 541–546 |
| `saveBlocked` | `'▲ SAVE BLOCKED — ' + (e.reason ?? 'hostiles near')`; cls `warn` | **none** (no source, no window) | 568–569 |
| `npcFire` | `Incoming dart.` / `Incoming fire.` | **2.5 s** in `npc-fire-toast.js` | 618–623; helper 10–11, 49, 62 |
| `sunHeat` | `▲ STAR HEAT — turn away.` | emit throttle 2.5 s in combat.js | 625–626; `combat.js` 164, 1886 |
| `mineBlocked` | `▲ ` + line | combat.js 1/s per rock; HUD none | 572–576 |
| `bodyHit` | `▲ Hull strike.` | no HUD window (combat impact gap 0.2 s) | 629–631 |
| `survivorRescued` / `Sold` | home / Chain lines; push `frameLines` | same-frame `commLine` | 632–645 |
| `songShift` | **no toast** | — | 565 |

`pushToast(text, cls)` (**1151–1171**):

1. `key = cls + '|' + text`.
2. If a slot has `until > now` **and** same key → set `until = now + TOAST_LIFETIME` and **return**. Does **not** rewrite `textContent`.
3. Else first expired slot in cursor order.
4. Else overwrite soonest-expiring slot (all five busy).
5. Writes `slot.el.textContent = text` and `className = 'rw-toast show ' + cls`.

Expire (**1197–1201**): `until = 0`, **`key = ''`**, remove `show`. **Does not** set `aria-hidden`. **Does not** clear `textContent`. Stale copy stays inside the polite live region until overwritten. After expire, the next identical line is a **new** push (re-announce, may steal a slot). **No** linger ring of keys exists — live `key` lives on the chip and dies when expire or reuse.

Later PR1 must **not** tie linger to chip index: a pirate-bubble AUTOSAVE HELD plus four other lines would reuse all chips and drop a slot-tied window. Contract linger is last five **keys**.

`mem.frameLines` (**1108–1113**, **1183**): cleared **every frame** before the event loop. **Not** a time window.

`el()` (**282–287**): `createElement` + `textContent`. No `innerHTML` on this path.

HUD update consumes `ctx.events` (**1181–1193**). `main.js` clears the queue after HUD.

---

## 2. CSS / z (`src/ui/hud.css`, `src/style.css`)

`.rw-toasts` (**hud.css 635–646**): `position:absolute; top:14px; right:168px;` column, `pointer-events:none`. Off the aim column (Wave A–F already moved them off top-center; `docs/HudUtilityChangeProposal.md` still describes the old top-center — **stale**; code wins).

`.rw-toast` (**717–738**): 0.35s opacity/transform. Classes `comm` / `sting` / `warn` / `danger` / `good`. Color is paired with glyph in copy.

High contrast restyle (**1167–1175**).

`#hud` z-index **10** (`src/style.css` **24–29**). Toasts inherit that stacking context. Hail **40**, chart **30**, berth **60**, pause **50**, settings **80** sit **above** toasts. Overlay sibling must **not** raise toast z to “fix” covered toasts.

No toast `z-index` of its own.

---

## 3. Save block emits (`src/game/save.js`) — leftover mix + flood

Header **21–24**: combat + encounter bubble → `saveBlocked` and retry in **5 s**.

`BLOCK_RETRY = 5` (**70**). `IDLE_INTERVAL = 60` (**69**).

`hostileEncounterBlock` (**1014–1031**): if `flags.combat` and a pirate/ace/hostile live ship within `U.ENCOUNTER_BUBBLE`, return **`'Hostiles within the encounter bubble — berth record refused.'`** (**1028**). **Same string for autosave and berth.**

`requestAutosave` (**1035–1048**): mid-jump **silent** (no emit). Hostile → `ctx.emit?.('saveBlocked', { reason })` **no `source`** (**1039–1041**). Storage throw silent.

Idle loop (**1585–1590**): in space, not dead, not docked: `nextDue = trySave() ? IDLE_INTERVAL : BLOCK_RETRY`. Failed combat autosave retries every **5 s** and **re-emits** `saveBlocked`.

Jump-complete pending (**1570–1583**): after jump, while `jumpSavePending`, retry `trySave()` every **0.5 s** if still blocked. **Audio:** `song.js` **91** plays `saveBlocked` on each emit. HUD visible-refresh hides the 0.5 s visual blink **while the 4 s toast is up**; idle **5 s** does **not**. Residual: song can still tick on 0.5 s jump-pending emits. This leftover does **not** retune song or retry cadence.

`trySave` (**1520–1540**): autosave key → `requestAutosave`. Manual slot: mid-jump emit `'Mid-jump — berth record refused.'` (**1526–1528**); hostile emit `{ reason }` (**1530–1533**). **No `source`.**

Berth load (**1412–1421**): same mid-jump / hostile emits (**1414**, **1420**). **No `source`.** Comment **1523–1525**: autosave mid-jump silent; manual berth toast. **True for jump; false for hostile mix.**

`saveToSlot` (**1400–1404**): `trySave(slotKey)` then success `commLine` `'Berth record sealed — slot n.'`. Failure is the `saveBlocked` toast only.

`WORLD_FIELDS` (**77–102**): **no** toast mem key.

Berth panel KeyL / `setBerthOpen`: **overlay sibling already imports** `overlay-policy.js` (`save.js` **14**) and gates open with `canOpenPlayCard` (~**1388**). This leftover must **not** claim those symbols. Toast PR1 may still tag **emit payloads** at **1040 / 1414 / 1420 / 1527 / 1532** without reverting mutex.

---

## 4. Encounter / comm emitters (flood surface; do not rewrite emitters)

Many systems `emit('commLine')`. HUD toasts **every** `commLine` unless `frameLines` hit. Across frames, identical text only collapses **while still visible**.

Examples (not exhaustive; code wins):

| Emitter | Typical copy | Repeat risk |
|---|---|---|
| `hail.js` 148–275 | `Cargo loose.` / `Running.` / `Tribute paid.` | Same intent twice after toast expired restacks |
| `npc.js` `say` 332–333 | ship-name `from` | combat bark |
| `world.js` Callow / refuse | rotating refuse lines | same line later |
| `station.js` job complete | pay lines | one-shot typical |
| `save.js` 1402, 1427 | berth sealed / restored | player-paced |
| `jump.js` / police / restitution | authored lines | mixed |

`npcFire` and `sunHeat` already have **time** gaps. Inbox flood is **autosave retries** + **unthrottled identical `commLine` / `saveBlocked`**.

---

## 5. What already exists (do not undo)

| Mechanism | Window | Leftover? |
|---|---|---|
| `pushToast` visible same-key refresh | remaining lifetime only | **Partial.** Idle 5 s > 4 s still blinks |
| `mem.frameLines` | **one frame** | **No** — keep for clue/`commLine` pair |
| `npcFireToast` gaps | 2.5 s | **No** — WAVE98 Incoming copy; keep |
| `SUN_HEAT_TOAST_GAP` | 2.5 s | **No** |
| mineBlocked per-rock | 1 s | **No** |
| Overlay hail mutex | n/a | **Other inbox** |

There is **no** `TOAST_DEDUP_WINDOW`. There is **no** `saveBlocked.source`.

---

## 6. Overlay / sibling collision (do not solve here)

| Sibling / inbox | Live | This leftover |
|---|---|---|
| HUD-01 empty 80 px hub | `hud.css` 184–193 | Do not put toast chrome on `.rw-reticle` |
| Digit 0/8/9 | station Digit map | No Digit |
| CTL-01 KeyJ | `controls.js` TRACKED + `pendingDock` | Cite. Do not remap |
| NAV-05 `showApLive` | `galaxychart.js` | Do not claim |
| P2 close-chart-on-AP | chart stays open on engage | Do not steal |
| P2 chart-label a11y | labels not hit targets | Do not solve |
| CTL-02 overlay mutex | hail 40 / chart 30 / berth 60; sibling **already** added `src/systems/overlay-policy.js` and imports in `hail.js` / `galaxychart.js` / `save.js` | **Do not raise toast z.** **Do not add hail toasts.** `save.js` emit **tag** must not steal `setBerthOpen` / KeyL / `canOpenPlayCard` |
| HUD-02 combat rails | `hud.js` rails | Toast functions only |
| HUD-03 `hudAlerts` | settings + `song.js` | Do not retune song |

---

## 7. Flood proof (code wins — leftover REAL)

| Sequence | Live result |
|---|---|
| Combat in bubble; idle autosave due | `requestAutosave` emits `saveBlocked` every **5 s** with berth wording |
| Toast lifetime 4 s | Slot expires at t=4, `key` cleared; t=5 pushes a **new** warn toast (blink + polite re-announce) |
| Jump-pending combat block | emit every **0.5 s**; visible refresh holds **one** slot while up; song may still fire |
| Player KeyL SAVE in same fight | same `'▲ SAVE BLOCKED — Hostiles… berth record refused.'` as autosave — **cannot tell retry from manual** |
| Two identical `commLine`s 0.5 s apart | one slot, extended |
| Two identical `commLine`s 5 s apart | second is a **new** slot/announce |
| Five distinct comms + autosave | autosave **overwrites** soonest slot — new info lost (inbox: obscure new information) |
| AUTOSAVE HELD then four other lines then 5 s retry | live: retry restacks (no key linger). Slot-tied linger would also lose the window. Frozen linger ring must still **suppress** |

Stacking identical lines after expire is **not** a feature. Treating it as CONSUME would keep the 5 s autosave blink and the berth/autosave mix.

---

## 8. Verdict

**Leftover is real. Not CONSUME. Serial is not none.**

Named later serial: **PR1 toast-flood**.

If a later census finds (a) identical toast text does not restack inside an 8 s elapsed window **even after chips were reused**, (b) expired chips are `aria-hidden`, **and** (c) autosave refusal copy is distinct from berth/manual `saveBlocked` copy, re-open this leftover as CONSUME. Census today does **not**.
