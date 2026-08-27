# CTL-05 pause menu inventory

**Wave:** 141 leftover census. Markdown only. No `src/` writes.  
**Code wins.** Cites are live file:line at census time (2026-08-27).  
**Leftover:** **REAL.** Named serial **PR1**. Not CONSUME. Named serial is **not** none.  
**Name:** in-run pause is a **menu**: access to existing Settings, existing Berth Records (save), existing title, and resume. Banner copy-only is not that menu.  
**Not this leftover:** Settings expansion (mouse sensitivity, invert-X/Y, rebinding, split volume). Onb01 flight lesson. Org01 origin preview. CTL-03 berthHold merge. CTL-04 `fireHeld`. Pad 2B. HUD-01 hub. NAV-11.

Inbox source (`docs/PLAYER-EXPERIENCE-WISHLIST.md` Playtest capture 2026-08-25 second pass — **217–220** — cite, do not edit): Add a real pause menu. P shows only "PAUSED — P to resume"; there is no path to Settings, save, or the title screen from inside a run — Settings exist only on the title menu. The captured Settings item covers new options, not in-game access.

Separate inbox (**131–135**, cite, do not edit, **do not steal**): Expand Settings with mouse sensitivity, invert-X/invert-Y, complete key rebinding with conflict detection, and separate music/effects/voice/UI volume.

---

## 1. Pause banner and KeyP (primary hole)

| Surface | Today | Cite |
|---|---|---|
| Full-loop skip | `if (!ctx.flags.paused)` then `world.time += dt` and `system.update` | `main.js` **156–161** |
| Berth hold vs loop | comment: KeyP is the **only** full-loop skip; `berthHold` is not pause | **156–157** |
| `pauseEl` | `createElement('div')`; `display:none` until toggle | **169–173** |
| Style | `position:fixed;inset:0;…;z-index:50;` teal monospace; letter-spacing `.3em` | **170–171** |
| Copy | `pauseEl.textContent = 'PAUSED — P to resume'` | **172** |
| Buttons / menu | **absent** | **169–187** |
| `innerHTML` | **none** in `main.js` | grep empty |
| Listener | window `keydown` **after** systems init (works while loop frozen) | **167–168**, **174–187** |
| Key | `decodeKeyCode(e) !== 'KeyP'` return | **175–176** |
| Typing guard | INPUT / TEXTAREA / SELECT / `isContentEditable` → return | **177–184** |
| Models guard | `ctx.models?.isOpen?.()` → return | **184** |
| Title guard | `document.getElementById('rw-title')` → return | **184** |
| Toggle | `ctx.flags.paused = !ctx.flags.paused`; `pauseEl.style.display` flex/none | **185–186** |
| Boot desync | title sets `paused = true` **before** `pauseEl`; banner stays `display:none` | `title.js` **67**; `main.js` **169–173** |

**Pause is copy-only.** There is no Settings control, no save control, and no title control on `pauseEl`.

CONSUME would require pause **already** to offer Settings, save, **and** title from inside a run. Hidden KeyO is **not** a pause menu. KeyL **refuses open** while paused. Title `#rw-title` is **removed** on CONTINUE. Leftover is **real**.

---

## 2. Overlay-policy (CTL-02) — never writes pause

| Surface | Today | Cite |
|---|---|---|
| Header law | Never writes `ctx.flags.paused`. Never throws. | `overlay-policy.js` **4** |
| Mutex | hail / chart / berth exclusive | **7**, **118–128** |
| Digit skip under pause | `hailDigitsAllowed`: `flags.paused` → **false** | **175–177** |
| Also skip | title / models / typing; settings owns screen; chart; berth | **175–184** |
| WAVE118 pin | `digitSkipUnderPause` | `scripts/boot-test.mjs` **23866–23868**, **23967** |
| `berthHeld` | reads `flags.berthHold === true`; missing/throw → false | **187–193** |
| `setBerthHold` | writes `berthHold` only; catch never falls back to paused | **196–203** |
| `playSurfaceBlocked` | title / models / typing — **not** pause | **83–91** |
| `settingsOwnsScreen` | visible body child, inner `aria-label === 'Settings'` | **48–69** |

**CTL-02 does not own KeyP.** Overlay-policy **reads** pause for hail Digit skip. It **never** writes `flags.paused`.

---

## 3. Title (z 70, capture)

| Surface | Today | Cite |
|---|---|---|
| Boot pause | `ctx.flags.paused = true` when skip marker absent | `title.js` **59–67** |
| Skip marker | `sessionStorage` `rimward-title-skip` === `'1'` → skip title, **remove** marker | **59–63** |
| CONTINUE | `closeTitle()` then `paused = false` | **84–87** |
| NEW GAME no autosave | close title; **do not** touch pause (origins owns) | **13–14**, **95–98** |
| NEW GAME with autosave | confirm, `clearAutosave`, set skip `'1'`, **reload** | **107–111** |
| SETTINGS | synthetic `KeyboardEvent` `{ code: 'KeyO' }` | **129–135** |
| Capture | `addEventListener('keydown', onKey, true)` | **246** |
| Pass-through | KeyO and Escape **only** | **7–8**, **212–214** |
| Digit / Enter | title entries; `stopImmediatePropagation` | **217–230** |
| Other keys | swallowed (includes KeyP) | **233–235** |
| Models early-out | if models open, title does not swallow | **200–204** |
| Close | `root.remove()`; remove capture listener | **251–256** |
| Reopen API | **absent** — `closeTitle` is one-way | **251–256** |
| `titleApi` | `isOpen` / `start` (CONTINUE or NEW) | **258–278** |
| CSS z | `.title-overlay { z-index: 70 }` | `screens.css` **511–512** |
| Root id | `rw-title` | `title.js` **145** |

After CONTINUE, **no path back to title** without reload. Reload without skip shows title **and** reboots the world. Pause menu title access is **not** live.

---

## 4. Settings (KeyO, z 80)

| Surface | Today | Cite |
|---|---|---|
| Storage | `localStorage` `rimward-settings-v1` — **not** WORLD_FIELDS | `settings.js` **7–8**, **24** |
| FIELDS | colorblind, highContrast, reducedMotion, muted, hudAlerts, hints, textScale, masterVolume | **29–38** |
| Mouse sensitivity | **absent** | FIELDS |
| Invert X/Y | **absent** | FIELDS |
| Rebind | **absent** | FIELDS |
| Split volume | **absent** (one `masterVolume`) | **37**, **180–210** |
| z | `z-index:80` | **13–15**, **93** |
| Open | `setOpen` local; **not exported** | **215–226** |
| KeyO | window bubble toggle; **no** pause/title/docked guard | **228–234** |
| Escape | closes if open | **232–233** |
| Copy | `textContent` for title/hint/labels | **109–118** |
| Scrim hits | root `pointer-events:none`; panel auto | **91–93**, **99** |
| Checkboxes | `createElement('input')` + `document.createTextNode(label)` | **123–139** |

KeyO **does** open Settings in a run (and while paused, z 80 over pause 50). The pause **banner** still has **no** Settings path. Playtest “Settings exist only on the title menu” is **discoverability**, not a missing KeyO listener. The **expansion** inbox (**131–135**) is a **later pack**. This leftover must **not** add those knobs.

---

## 5. Berth / SAVE / LOAD (KeyL, z 60, CTL-03)

| Surface | Today | Cite |
|---|---|---|
| Panel z | `z-index:60` | `save.js` **1372** |
| Open flag | `flags.berthOpen` | **1450–1452** |
| Hold | `setBerthHold` / `flags.berthHold` — **not** `paused` | **1433–1440**, **1453–1458** |
| Hint | “This is not Pause (P).” | **1395–1396** |
| KeyL open | only if `!docked && !paused && !dead` and not `playSurfaceBlocked` | **1620–1628** |
| KeyL close | `requestBerthClose` even if paused | **1624** |
| LOAD | `if (ctx.flags.paused) return;` (Wave 28 `systemLoaded` hazard) | **1497–1502** |
| SAVE `trySave` | **no** paused check (frozen state is coherent) | **1643–1648** |
| Autosave `update` | skipped while paused (full-loop skip) | `main.js` **158–161** |
| LOAD button disable | empty/corrupt only — **not** paused | `save.js` **1602–1614** |
| Scrim hits | root `pointer-events:none`; panel auto | **1371–1372**, **1376** |

**Path to save from pause is not live:** KeyL cannot **open** berth while paused. LOAD while paused stays **gated**. SAVE while paused **still writes** if the berth panel is already open.

Do **not** merge `berthHold` into `flags.paused`.

---

## 6. Models KeyP swallow (typing)

| Surface | Today | Cite |
|---|---|---|
| Open pause | save `wasPausedBeforeOpen`; set `paused = true` | `modelsbrowser.js` **638–640** |
| Close | restore `wasPausedBeforeOpen` | **689–690** |
| z | 80 | `models.css` **3**, **13** |
| Filter INPUT | letters pass to INPUT; pause bubble must ignore typing | `modelsbrowser.js` **703–719** |
| Default keys | capture `preventDefault` + `stopImmediatePropagation` (blocks KeyP unpause under overlay) | **745–749** |

`main.js` typing + `models.isOpen` guards **stay**. Do not unpause into a title-filter KeyP.

---

## 7. Other `flags.paused` writers (cite; keep one later owner)

| Writer | When | Cite |
|---|---|---|
| `main.js` KeyP | in-run toggle + `pauseEl` display | **185–186** |
| `title.js` | boot true; CONTINUE false | **67**, **87** |
| `origins.js` | overlay true; choose false | **100**, **132** |
| `modelsbrowser.js` | open true; close restore | **639–640**, **690** |
| `overlay-policy.js` | **never** | **4**, **196–203** |
| hail / chart / berth openers | **never** | hail header **23**; overlay **4** |

Later PR1: keep **one** display owner for in-run pause (`main.js` `pauseEl` + flag). Overlay-policy still **never** writes the flag. Do not add a fifth ad-hoc writer.

---

## 8. Wave 40 z-index ladder (pause sits at 50)

| Layer | z | Cite |
|---|---|---|
| Station overlay | 20 | `screens.css` **16** |
| Galaxy chart | 30 | `hud.css` **1996**; `screens.css` **466** |
| Onboarding hint | 35 | `onboarding.js` **13**, **84** |
| Hail / gate fade | 40 | `hail.js` **385**; `gate.js` **594** |
| **Pause banner** | **50** | `main.js` **171** |
| Berth / origins | 60 | `save.js` **1372**; `origins.js` **106** |
| Title | 70 | `screens.css` **512** |
| Settings / models | 80 | `settings.js` **93**; `models.css` **13** |
| `#fatal` | 99 | `index.html` **13** |

Pause menu **stays z 50**. Settings access **opens** the live z 80 panel. Title access **opens** the live z 70 overlay. Berth access **opens** the live z 60 desk. Do **not** raise pause over title/settings.

---

## 9. Bindings Honor (must stay)

| Key | Role | Must not |
|---|---|---|
| KeyP | pause toggle | remap; ignore typing/models/title |
| KeyO | settings toggle | steal expansion knobs |
| KeyL | berth | merge with pause; open-from-pause is **access**, not a remap |
| KeyH | hail | remap |
| KeyJ | dock/jump | remap |
| KeyM | chart | remap |
| KeyD | strafe | remap |
| Digit 0/8/9 | station | new Digit |
| Digit hail 1–9 | skip under pause | WAVE118 |

---

## 10. Verdict

| Test | Result |
|---|---|
| Pause offers Settings from the banner? | **No** (`textContent` only, `main.js` **172**) |
| Pause offers save from the banner? | **No**; KeyL open refused while paused (`save.js` **1625**) |
| Pause offers title from inside a run? | **No**; `closeTitle` removes `#rw-title` (`title.js` **251–256**) |
| KeyO in-run? | **Yes**, but not a pause menu |
| Settings expansion knobs? | **No** — other inbox; do not steal |
| Overlay-policy writes `paused`? | **No** |
| Digit skip under pause? | **Yes** (`hailDigitsAllowed` **177**) |
| Leftover | **REAL** |
| Named serial | **PR1** |
| CONSUME / serial none | **rejected** |
