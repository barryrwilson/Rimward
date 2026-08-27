# Onb01 first-minute flight-lesson inventory

**Wave:** 141 leftover census. Markdown only. No `src/` writes.  
**Code wins.** Cites are live file:line at census time (2026-08-27).  
**Leftover:** **REAL.** Named serial **PR1**. Not CONSUME. Named serial is **not** none.  
**Name:** after the permanent origin pick, teach look/turn, throttle, target, hail, dock, and chart **one at a time**, and leave the full control reference **on demand** (not dumped).  
**Not this leftover:** origin mechanical preview (sibling Org01). Pause menu (sibling Ctl05). AI-05 starter grace. CTL-04 menu digits. HUD-07 stills. Hail02 miss copy. NAV-11. Pad 2B. In-repo LLM.

Inbox source (`docs/PLAYER-EXPERIENCE-WISHLIST.md` Playtest capture 2026-08-25 — **96–101** — cite, do not edit): Replace the first-minute information dump with a short contextual flight lesson. Immediately after the permanent origin pick, the expanded controls encyclopedia and several simultaneous narrative lines compete with the ship, station, targets, and reticle. Teach look/turn, throttle, target, hail, dock, and chart one at a time, then leave the full control reference available on demand.

---

## 1. Verdict (CONSUME test)

CONSUME needs **both**:

1. A sequential one-at-a-time lesson **after origin pick** for look/turn, throttle, target, hail, dock, and chart.
2. Full control reference already **on demand** (not dumped at first minute).

Live code fails both.

| Test | Live | Result |
|---|---|---|
| Sequential lesson after origin pick | No. First hint waits `world.time > 20`. First line dumps four binds. No hail-only, chart, or look/turn step. | **fail** |
| Encyclopedia on demand at first minute | No. HUD builds CONTROLS **expanded** (`controlsCollapsed = false`). Combat later collapses. | **fail** |

**Leftover is REAL. Serial is PR1. Name is not “no remaining Onb01 leftover.”**

---

## 2. Onboarding hints (`src/systems/onboarding.js`)

| Surface | Today | Cite |
|---|---|---|
| Table | 8 authored `HINTS` | **36–68** |
| One at a time | yes, after dismiss | **137–153** |
| Auto-dismiss | 8 s (`HINT_DURATION`) | **29**, **138** |
| Key dismiss | any `keydown` hides | **107–108** |
| Persist | `ctx.world.onboarding.seen` push **on SHOW** | **104**, **72–75** |
| WORLD_FIELDS | `'onboarding'` already | `save.js` **90–91** |
| Mute | `ctx.settings.hints === false` hides now | **113**; `ctx.js` **248**; `settings.js` **35**, **46** |
| Docked | hide; arm repair/saved | **131–134** |
| Jumping | hide | **114** |
| Paint | `el.textContent = hint.text` | **102** |
| DOM | `.rw-onboard-hint` on **`document.body`**, inline `font-size:11px;color:#6ff2e0` | **81–88** |
| `#hud` child? | **no** — onboarding init is **before** HUD (`main.js` **98–99**) | **88** |
| Live region | **none** — plain `div`, no `role` / `aria-live` | **81–108** |
| Nav pattern (cite) | `role="status"` `aria-live="polite"` | `hud.js` **1236–1240** — **not** on the hint |
| Scale / contrast / motion | `--rw-text-scale` and `body.rw-contrast` / `rw-reduced-motion` target **`#hud`** | `hud.css` **9–31**, **1243–1264**, **1271–1277** |
| `innerHTML` | **none** | census |
| Fail-closed `when()` | **none** (throw in `when` can skip the loop) | **146–154** |
| Unknown id skip | **none** (`seen` is a raw array) | **147–148** |

### 2.1 Live HINTS (table order)

| id | `when` | text | After origin pick? |
|---|---|---|---|
| `move` | `ctx.world.time > 20` | `R/F — throttle · mouse — steer · Shift — drift · Space — burn` | **No.** Waits 20 s of **unpaused** time. Four binds in one line. |
| `dock` | station dist² ≤ `U.DOCK_RANGE²` (45 u) | `J — dock` | **No.** Park is ~73 u. |
| `gate` | `ctx.gate.inZone === true` | `J — jump the gate` | No. |
| `combat` | `ctx.flags.combat === true` | `T — target · H — hail · a surrendered rival pays better than a dead one` | No. Combines T and H. |
| `mine` | `ctx.input.weaponGroup === 3` | `hold LMB near an asteroid to mine` | No. |
| `feed` | `ctx.bio.hunger > 0.5` | `she is hungry — dock and feed her` | Beautiful may hit this later, not the inbox six. |
| `repair` | `repairReady` after low-hull dock + undock | yard copy | No. |
| `saved` | `savedReady` after first `docked` | saves on dock and jump | No. |

There is **no** hint id for look/turn alone, hail alone, target alone, or chart.

`world.time` does **not** tick while `ctx.flags.paused` (`main.js` **158–160**). Origin overlay pauses (`origins.js` **100**). The 20 s `move` gate starts **after** pick, not during the overlay.

WAVE6 boot-test still keys on id `move` and visible text `throttle` (`scripts/boot-test.mjs` **1719–1750**). Later PR1 must retarget that section. This wave does **not** edit the harness.

---

## 3. Controls encyclopedia / HUD help

| Surface | Today | Cite |
|---|---|---|
| Bindings source | `ctx.config.controls.push(…)` **19 lines** | `controls.js` **588–609** |
| HUD build | `section.rw-controls` + toggle + `<ul><li>` | `hud.js` **1276–1295** |
| Default | `controlsCollapsed = false`; label `CONTROLS ▾` | **1280**, **1290** |
| Toggle | click flips class `collapsed` | **1291–1295** |
| Combat | first combat **collapses** | **2241–2250** |
| CSS hide | `.rw-controls.collapsed .rw-controls-body { display: none }` | `hud.css` **1214** |
| Panel | `top: 14px; left: 14px; max-width: 280px` | **1179–1184** |
| Paint | `el()` → `textContent` | `hud.js` **319–324**, **1288** |
| `innerHTML` | **none** in `hud.js` | census |
| `aria-expanded` | **missing** on the toggle (init, click, and combat collapse) | **1280**, **1291–1294**, **2246–2249** |
| Toggle `:focus-visible` | hover color only; AP/AM buttons have `outline: 2px solid` | `hud.css` **1186–1199** vs **782–789** |
| On-demand at boot | **no** — body is visible | **1290** vs **1214** |

### 3.1 Live encyclopedia lines (`controls.js` **590–608**)

1. Mouse — steer toward reticle  
2. W/S — vertical strafe (W = up)  
3. A/D — lateral strafe (D = right)  
4. Q/E — roll left / right (set your up)  
5. R/F (hold) — throttle up / down · double-tap F — full stop  
6. Space — afterburner  
7. Shift (hold) — vector-hold drift  
8. LMB (hold) — fire  
9. 1/2/3/4/5 — weapon group: cannon / disruptor / mining / missiles / psionic  
10. T — cycle target (hostiles first in combat)  
11. V — lock under reticle  
12. N — automine locked asteroid  
13. H — hail · J — dock · C — camera (chase / third / first-person)  
14. X — match lock speed  
15. K — engine on lock (after shields)  
16. G — cycle hub route at a Lamplighter junction  
17. M — galaxy chart  
18. L — berth records (save/load)  
19. P — pause  

This is the **expanded controls encyclopedia**. It is **not** the pause menu (sibling Ctl05). It is **not** Settings (KeyO).

---

## 4. Origin pick and first-minute narrative

| Surface | Today | Cite |
|---|---|---|
| Fresh boot overlay | pause; Digit1–5 / click; z-index 60 | `origins.js` **8–12**, **94–133**, **153–160** |
| Restore | overlay inert | **95–97** |
| Choose | apply effects; `world.origin`; `jumpGraceUntil`; unpause; `originChosen` | **125–133** |
| Toast | `✦ ` + origin `line` class `sting` | `hud.js` **662–663** |
| Overlay rows | already show the same `line` | `origins.js` **141** |
| Authored lines | `ORIGINS.*.line` | `state.js` **742–767** — **cite only, READ-ONLY** |
| Park | station + `(40, 10, 60)` ≈ **72.8 u** | `origins.js` **42–49** |
| Dock zone | `U.DOCK_RANGE` **45** | `state.js` **30**; `station.js` **6494–6495** |
| In zone at park? | **no** (72.8 > 45) | math vs **45** |
| AI-05 hop grace | `jumpGraceUntil = time + JUMP.graceSeconds` | `origins.js` **129** — **cite only, not this pack** |
| Digit1–5 | origin until pick; listener **removed** on choose | `origins.js` **24–26**, **126**, **153–159** |

`originChosen` is one narrative sting. It repeats the overlay sentence. It is **not** a flight lesson.

Drifter `startSystem` emits `systemLoaded` inside `applyEffects` (`origins.js` **74–83**). HUD arrival banner reads **`lastEvents`** (`hud.js` **1509–1518**). Choose runs on keydown **between** frames. Banner timing is **not** a teaching lesson. Do not steal jump banners.

Origin-arc beats / creditor calls are **not** first-minute (`ORIGIN_ARCS.ledgerDebt.callInterval` **240** s, `state.js` **1069**). Cite only.

---

## 5. Teaching surfaces that fire together after `originChosen`

Count the **live** surfaces that speak or dump after the overlay lifts. HUD already exists under the overlay (`main.js` **98–99**, **144**). Overlay `z-index` 60 covers it (`origins.js` **106**). Remove overlay → HUD is already painted.

| # | Surface | When | Teaching? | Cite |
|---|---|---|---|---|
| 1 | Expanded CONTROLS encyclopedia (19 lines) | immediately | **dump** | `hud.js` **1276–1295** |
| 2 | `originChosen` toast (origin line) | same event queue HUD can consume | **narrative** | `hud.js` **662–663**, **1485–1497** |
| 3 | HUD chrome: reticle, self/tgt rails, Manifest, POS, bio | immediately | compete with ship / station / reticle | HUD init |
| 4 | HUD-06 home pip / chevron / POS HOME | if in range / off-screen | **cite only — do not steal HUD-06** | `hud.js` **1036–1042**, **1259–1261** |
| 5 | Context prompt J Dock | only if `station.inZone` | **not** at park (~73 u) | `hud.js` **2600–2609** |
| 6 | Onboarding `move` | `world.time > 20` | **late dump** of four binds | `onboarding.js` **37–39** |
| 7 | Onboarding `dock` | dist ≤ 45 u | later, one bind | **40–50** |
| 8 | Contacts arc | scanner-gated | Wave F / HUD-07 — **cite only** | `hud.js` **1096–1108** |

**Simultaneous at overlay-up:** encyclopedia dump **+** origin toast **+** full HUD chrome (ship, station, reticle, possible targets). That is **three** competing teaching/narrative surfaces, then a fourth (`move`) at t > 20 s.

There is **no** post-pick sequence: look/turn → throttle → target → hail → dock → chart.

---

## 6. Persist / settings / pause

| Surface | Today | Onb01 claim |
|---|---|---|
| `WORLD_FIELDS` `'onboarding'` | `{ seen: [] }` | **reuse**; no new field | `save.js` **90–91** |
| Sanitize `seen` | **none** dedicated | later fail-closed in `onboarding.js`, not a new field | census |
| Settings `hints` | client `rimward-settings-v1` | **keep** mute | `settings.js` **24**, **35**, **46** |
| KeyP pause | `main.js` **167–187**; z 50 | **not ours**; Ctl05 sibling | cite |
| Overlay mutex | hail/chart/berth **never** write `flags.paused` | **cite only** | `overlay-policy.js` **4** |
| Origins pause | writes `flags.paused` true then false on choose | **Org01 / origins.js**; Onb01 must **not** write pause | `origins.js` **100**, **132** |

---

## 7. Honor keys (must stay)

| Key | Live | Cite |
|---|---|---|
| KeyH hail | stay | `controls.js` **38**, **602** |
| KeyJ dock/jump | stay | **38**, **602** |
| KeyL berth | stay | **607** |
| KeyM chart | stay | **606** |
| KeyP pause | stay | **608**; `main.js` **174–186** |
| KeyD strafe | stay | **27**, **592** |
| Digit 0/8/9 | stay station | dock map — not this pack |
| Digit 1–5 | origin **until pick**; then weapon groups in flight | `origins.js` **153–159**; `controls.js` **548–563** |

Do **not** remap. Do **not** steal a new Digit.

---

## 8. Neighbours (cite only — do not steal)

| Pack | Why not this leftover |
|---|---|
| Org01 origin preview | Overlay **before** pick. Digit1–5 stay origin until pick. |
| Ctl05 pause menu | KeyP chrome. Encyclopedia must stay the HUD toggle, not move into pause. |
| AI-05 grace | `jumpGraceUntil` already stamped on choose (`origins.js` **129**). |
| CTL-04 menu digits | Dock Digit1–5 vs weapon groups. |
| Hail01 / Hail02 | Demand lifecycle / miss copy. Lesson may **name** KeyH; do not rewrite hail. |
| HUD-06 / HUD-07 | Home pip / deconfliction stills. |
| NAV-09 / NAV-10 | Chart readability / dock approach governor. |
| TGT-07 stills | Hostiles-first cycle stays. Lesson may **name** KeyT. |
| MSN-04 other families | Jobs. |
| CTL-03 | Berth freeze. |
| NAV-11 | Serial **none**. |
| Pad 2B / in-repo LLM | forbidden |

---

## 9. Hole (code wins)

After a permanent origin pick the player sees:

- 19-line CONTROLS encyclopedia already open.
- Origin sting toast with the same line the overlay just showed.
- Full HUD (reticle, rails, Manifest, POS, bio) over ship, station, and possible targets.
- No look/turn-only, throttle-only, target-only, hail-only, or chart lesson.
- Twenty seconds later, one onboarding line that still dumps throttle + mouse + drift + burn.

That **is** the wishlist dump. Sequential lesson + on-demand encyclopedia are **not** live.

**Leftover REAL. Named later serial: PR1.**
