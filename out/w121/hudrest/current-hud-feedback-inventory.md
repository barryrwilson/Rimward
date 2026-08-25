# HUD remaining player-facing feedback — live inventory (Wave 121)

**Wave:** 121. Markdown only. Code wins over wishlist copy and over Wave 118 toast line numbers.  
**Census date:** 2026-08-25.  
**Scope:** leftover **HUD player-facing feedback after HUD-04**. Toast linger / autosave vs berth copy is **landed Wave 120 PR1** — **cite, do not reopen**. Chart labels / dest `<select>` is **NAV-07 sibling**. Overlay mutex is **CTL-02 landed**. HUD-02 class tokens landed. HUD-03 visual leftover is **CONSUME**. Aim-glass gauges stay off. Kit mutate omit.  
**Not this leftover:** retune `TOAST_DEDUP_WINDOW` 8 s; retune AUTOSAVE HELD copy; invent a sixth toast slot; invent a second live region; invent a Digit; invent a hub child.

Line numbers are 1-based from live `src/` at this census. If a later serial moved a symbol, **re-census**. Do **not** treat Wave 118 `out/w118/toast/current-toast-inventory.md` line numbers as live.

**Verdict:** leftover is **CONSUME**. Named serial: **none**. Name: **no remaining HUD feedback leftover.**

---

## 0. Frozen records / inbox (status only; code still wins)

| Claim | Source | Live verdict |
|---|---|---|
| Repeated autosave refusals and identical encounter lines flood the toast stack | wishlist Idea inbox P1 FEEDBACK **cite, do not edit** (`docs/PLAYER-EXPERIENCE-WISHLIST.md` 60–64) | **GONE.** Wave 120 PR1 landed 8 s identical-key window, five-row linger, expire `aria-hidden`, AUTOSAVE HELD vs SAVE BLOCKED. Inbox item is **DONE**. Do **not** reopen HUD-04. |
| HUD-03 visual settings remain | wishlist HUD-03 / Wave 115 | **CONSUME** (`docs/Hud03RemainingVisualDesign.md`). Cite only. |
| Chart labels not clickable | wishlist P2 NAV/A11Y (`PLAYER-EXPERIENCE-WISHLIST.md` 65–70) | **NAV-07 sibling**. Do not solve. |
| Overlay hail/chart/berth stack | CTL-02 | **Landed.** Cite only. Do not raise toast z. |
| HUD-01 empty 80 px hub | `hud.css` 184–193 | **LIVE.** Do not put feedback chrome on the aim glass. |
| Digit 0 / 8 / 9 | `station.js` 188, 6035–6036 | Digit 0 = shipyard. Digit 8 dock root = launch. Digit 9 dock root = epics. Do not steal. |
| KeyO settings | `settings.js` CHECKBOXES includes `hints` | **LIVE.** Do not remap. |

Inbox remaining HUD-04-class FEEDBACK item is **empty**. The only remaining idea-inbox row is NAV-07 chart-label (other worker).

---

## 0.1 Verdict table (code wins)

| Surface | Channel | Flood leftover? | Why |
|---|---|---|---|
| Five `.rw-toast` chips | **the** HUD notification stack | **No** (HUD-04 landed) | 8 s linger + 5-row key ring + expire `aria-hidden` + distinct save copy |
| `commLine` | **same** toast stack via `toastForEvent` | **No** | No second comm paint. Same-frame `frameLines` + 8 s linger |
| `saveBlocked` | **same** toast stack | **No** | Autosave vs berth copy distinct. Emit `source` live |
| Arrival `.rw-banner` | **one** system-name card on `systemLoaded` | **No** | Single node, 4 s, overwrite in place. Not a stack. Not identical-retry flood |
| Onboarding `.rw-onboard-hint` | **one** teaching line, persist `seen` | **No** | One at a time. 8 s or key dismiss. KeyO `hints` off. Not a toast ring |
| Context `.rw-prompt` | one verb | **No** | Not a notification stack |
| Jump `.rw-jump` | charge bar | **No** | Instrument, not a flood channel |
| AP/AM `.rw-chip-stack` | status + cancel | **No** | Not toast flood. NAV/automine |
| Pause overlay | one `PAUSED — P to resume` | **No** | Full-screen pause. Not a stack |
| Station `station-notice` | dock panel | **No** | Overlay, one notice. Not HUD toast |
| Chart `aria-live` | Galaxy Chart | **NAV-07 / NAV-05 sibling** | Do not steal |
| Nav readout live | `#hud` DEST/NEXT | **NAV-05 related** | Persistent instrument. Not toast flood |
| Second unnamed toast channel | — | **None found** | Only `pushToast` in `hud.js` allocates `.rw-toast` |

**No HUD-04-class hole remains** that toast PR1 did not cover. Banner / commLine / onboarding are **not** a flood leftover. Do **not** invent a sixth slot, a new Digit, a hub child, or a second live region.

---

## 1. Toast channel (`src/systems/hud.js`) — HUD-04 landed; cite, do not reopen

| Knob | Live | Cite |
|---|---|---|
| `TOAST_LIFETIME` | 4 s | `hud.js` 64 |
| `TOAST_SLOTS` | 5 | `hud.js` 65, 850–855 |
| `TOAST_DEDUP_WINDOW` | 8 s | `hud.js` 66 |
| Linger helpers | 5-row ring, **not** chip-tied | `hud.js` 530–555 |
| Boot chips | `aria-hidden=true` | `hud.js` 851–852 |
| Root | `role=status` `aria-live=polite` | `hud.js` 844–847 |
| `pushToast` | visible same-key extends `until`; linger hide; real show unhide **then** `textContent` | `hud.js` 1186–1213 |
| Expire | `until=0`, remove `show`, `aria-hidden=true`, **keep** `textContent` and `slot.key` | `hud.js` 1238–1244 |
| Place | top 14px, right 168px (off aim column) | `hud.css` 635–646 |
| Hide CSS | `.rw-toast:not(.show) { visibility: hidden }` | `hud.css` 734 |
| `#hud` z | 10 | `style.css` 24–29 |
| `el()` | `createElement` + `textContent` | `hud.js` 283–288 |
| `innerHTML` | **none** in `hud.js` / `onboarding.js` | grep |

`toastLingerHides` (`hud.js` 531–542): clears a linger row only when `now > lastShown + WINDOW`. Never because a chip was reused. Match on `row.key === key` inside the window → **suppress**.

`toastLingerRecord` (`hud.js` 544–555): bump same key or overwrite oldest of five `{ key, lastShown }`.

`pushToast` (`hud.js` 1186–1213):

1. Empty text → return.
2. `key = cls + '|' + text`.
3. Visible slot (`until > now`) same key → extend `until`, record linger, **do not** rewrite `textContent`.
4. Linger hide → return (no new chip).
5. Else allocate expired chip or overwrite soonest.
6. Real show: `aria-hidden=false` **then** `textContent` **then** `className = 'rw-toast show ' + cls`. Record linger.

`saveBlocked` copy (`hud.js` 596–600):

- `e.source === 'autosave'` → `'▲ AUTOSAVE HELD — hostiles near'` (no berth reason concat).
- else (berth / missing / unknown) → `'▲ SAVE BLOCKED — ' + (e.reason ?? 'hostiles near')`.

`commLine` (`hud.js` 560–568): skip if `mem.frameLines` already holds the text **this frame**. Else `{ text: e.text ?? e.line ?? '', cls: 'comm' }` → **same** `pushToast`. **No** parallel comm paint.

`mem.frameLines` cleared each HUD update (`hud.js` 1225). Same-frame clue/landmark/`commLine` skip **stays**. It is **not** a remaining hole.

`npcFire` still 2.5 s in `npc-fire-toast.js` (`DART_TOAST_GAP` / `FIRE_TOAST_GAP` 10–11, 49, 62). Linger still applies if copy matches. **Keep.** Not leftover.

No second `pushToast`. No sixth slot.

---

## 2. `save.js` emit — HUD-04 landed; cite, do not reopen

| Site | Payload | Cite |
|---|---|---|
| `requestAutosave` hostile | `{ reason, source: 'autosave' }` | `save.js` 1039–1041 |
| Berth load mid-jump | `{ reason: 'Mid-jump — berth record refused.', source: 'berth' }` | `save.js` 1422 |
| Berth load hostile | `{ reason, source: 'berth' }` | `save.js` 1428 |
| `trySave` mid-jump (non-autosave key) | mid-jump + `source: 'berth'` | `save.js` 1535 |
| `trySave` hostile (non-autosave key) | `{ reason, source: 'berth' }` | `save.js` 1540 |
| Hostile reason string (shared **reason**, distinct HUD copy) | `'Hostiles within the encounter bubble — berth record refused.'` | `save.js` 1028 |
| Idle retry | `BLOCK_RETRY = 5` | `save.js` 70, 1596–1598 |
| Jump-pending retry | 0.5 s while combat-blocked | `save.js` 1579–1589 |
| Storage catch | **silent** (no toast) | `save.js` 1546–1548 |

Success berth copy is `commLine` `'Berth record sealed — slot ' + n + '.'` / `'Berth record restored.'` (`save.js` 1410, 1435) → toast channel. Distinct from SAVE BLOCKED. Not a flood leftover.

No `saveBlocked` paint on the berth **panel**. Overlay sibling owns KeyL / `setBerthOpen`. Cite only.

---

## 3. Arrival banner (`src/systems/hud.js`) — not a flood leftover

One `.rw-banner` node (`hud.js` 858–863). `aria-live=polite` on the banner itself (`hud.js` 860). **No** `role=status`. **No** `aria-hidden` on fade.

Motion (`hud.js` 1247–1265):

1. Reads `ctx.lastEvents` (previous frame).
2. Each `systemLoaded` writes `bannerName` / `bannerSub` via **`textContent`**, sets `bannerUntil = nowReal + TOAST_LIFETIME` (4 s), adds `.show`.
3. When `nowReal > bannerUntil`, remove `.show`. Does **not** clear text. Does **not** set `aria-hidden`.

CSS injected once (`hud.js` 694–715): top 96px, right 14px, off aim column, `pointer-events: none`, opacity 0 until `.show`.

**Why not leftover:**

- **One** card, not a five-row stack. A second jump **overwrites** the same node.
- Jump cadence is gated. This is not a 5 s retry blink.
- Copy is the system name + faction, not SAVE BLOCKED / encounter spam.
- HUD-04 forbade **adding** a second live region as a toast fix. The banner **already exists** as an arrival instrument. Do **not** invent a third region. Do **not** fold the banner into toast chips (would steal arrival chrome). Do **not** name a banner-`aria-hidden` serial as HUD-05 leftover — AT polish on a 4 s one-shot is **not** toast-flood.

High contrast restyle: `body.rw-contrast #hud .rw-banner` (`hud.css` 1171). Reduced motion kills banner transition (`hud.css` 1184 comment). HUD-03 consume.

---

## 4. Onboarding hints (`src/systems/onboarding.js`) — not a flood leftover

| Knob | Live | Cite |
|---|---|---|
| Duration | 8 s or any `keydown` | `onboarding.js` 29, 107–108, 137–139 |
| Count | 8 authored ids, **one** visible | `onboarding.js` 36–68, 139 |
| Persist | `ctx.world.onboarding.seen` in `WORLD_FIELDS` | `onboarding.js` 7–8, 72–75; `save.js` 83–84 |
| Off switch | `ctx.settings.hints === false` hides immediately | `onboarding.js` 16–17, 113; `settings.js` 46 |
| Dock / jump | suppressed | `onboarding.js` 114, 131–134 |
| DOM | one `.rw-onboard-hint`, `textContent` | `onboarding.js` 81–105 |
| `aria-live` | **none** | live file |
| Place | top-left `left:14px; top:48px; z-index:35` | `onboarding.js` 83–84 |

**Why not leftover:** teaching queue, not a notification stack. Seen ids never re-fire. KeyO already toggles hints. Adding `aria-live` here would **invent a live region** HUD-04 told toast leftover not to add. Do **not** deputize that as HUD-05 PR1.

---

## 5. Other player-facing lines (not unnamed toast channels)

| Surface | Live | Flood leftover? | Cite |
|---|---|---|---|
| Context prompt | one key + verb; `textContent`; hide when empty | No | `hud.js` 872–874, 2221–2231 |
| Jump charge | one bar + label | No | `hud.js` 865–869, 1267–1285 |
| Chart marks | decorative `aria-hidden`; voiced via `commLine` | No | `hud.js` 827–828, 837 |
| Contacts arc | `aria-hidden` | No | `hud.js` 878–882 |
| AP/AM chips | `.rw-chip-stack` status | No | `hud.css` 648–681 |
| Pause | `pauseEl.textContent = 'PAUSED — P to resume'` | No | `main.js` 160–176 |
| Station notice | one `aria-live=polite` while `ui.notice` | Dock overlay, not HUD toast | `station.js` 6066–6068 |
| Nav readout | panel `aria-live=off`; inner `navLive` `role=status` `aria-live=polite` | Instrument; not toast flood | `hud.js` 1008–1013 |
| Chart AP/hover/status | `aria-live=polite` | **NAV-07 / NAV-05 sibling** | `galaxychart.js` 142, 317, 331 |

`aria-live=assertive`: **none** under `src/` (grep). Keep it that way.

---

## 6. Duplicate encounter / save copy **outside** the linger ring

Census asked: does identical encounter or save copy still flood **outside** the five toast chips?

| Path | Outside toast? | Flood? |
|---|---|---|
| `ctx.emit('commLine', …)` from world/npc/hail/station/jump/… | No. HUD maps to `pushToast` | Linger covers identical `cls\|text` |
| Same-frame clue + Echo `commLine` | Toast once (`frameLines`) | Not leftover |
| Distinct rotating refuse lines | Distinct keys; may use slots | Inbox asked **identical** copy. Distinct sentences are **new information** |
| `saveBlocked` | Toast only | Linger + AUTOSAVE HELD |
| Berth panel reason text | Overlay sibling; not a HUD stack | Do not steal |
| Banner | System name only | Not save/encounter copy |
| Onboarding | Authored teaching | Not encounter spam |

**No** second unnamed toast channel. **No** outside-ring flood leftover.

---

## 7. Honor freeze (live proof)

| Honor | Live |
|---|---|
| HUD-01 empty 80 px hub | `hud.css` 184–193 `.rw-reticle` 80×80. No toast pip. |
| Digit 0 shipyard | `station.js` 188 last `DOCK_KEY_SERVICES` entry; Digit 0 maps last index (`6035–6036`, `6172`) |
| Digit 8/9 dock root | launch / epics (`station.js` 188 index 7/8) |
| KeyO settings | `settings.js` 46 hints checkbox. Not TRACKED. |
| `state.js` | HUD reads catalogs. Do not write later. |
| Persist | No toast key. Onboarding already on `WORLD_FIELDS`. Settings `rimward-settings-v1`. Save `rimward-save-v1`. |
| `innerHTML` | Forbidden later. Live toast/banner/hint/prompt: `textContent`. |
| Kit mutate omit | No kit write in this leftover. |
| Aim-glass gauges | Stay off. Empty hub is `.rw-reticle` 80×80 (`hud.css` 184–193). RANGE label stays hidden (`hud.css` 207–208). Do not add a feedback pip. |
| Overlay mutex | Cite only. Toast z stays `#hud` 10. |
| HUD-04 | Cite only. Do not retune 8 s or AUTOSAVE HELD. |
| HUD-03 visual | CONSUME. Cite `docs/Hud03RemainingVisualDesign.md`. |
| HUD-03 audio | Cite `docs/Hud03AlertsDesign.md`. No second Incoming string. |
| NAV-07 | Sibling `docs/Nav07ChartLabelDesign.md`. Do not steal `galaxychart.js`. |

---

## 8. What a naive later PR would get wrong (do not do)

- Add a sixth toast slot “for remaining feedback.”
- Add `aria-live` on `.rw-onboard-hint` or switch banner/toasts to `assertive`.
- Fold banner into the toast ring (steals arrival + second polite region already there).
- Retune linger 8 s or AUTOSAVE HELD copy (HUD-04 closed).
- Persist linger keys (hostile save mutes warns forever).
- Pause the sim on flood (forbidden).
- Raise toast z over hail/chart/berth.
- Put a feedback pip on the 80 px hub.
- Steal Digit 0/8/9 or KeyO.
- Steal chart labels (NAV-07).
- `innerHTML` rich toasts.

---

## 9. Census close

HUD-04-class leftover is **gone**. Toasts linger. Banner / commLine / onboarding are **not** a flood leftover. There is **no** second unnamed toast channel.

Freeze leftover **CONSUME**. Named serial **none**. Name: **no remaining HUD feedback leftover.**
