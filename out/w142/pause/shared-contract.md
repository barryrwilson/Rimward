# CTL-05 pause menu shared contract

**Wave:** 142. This worker **implements PR1**.  
**Status:** MERGE LAW for `docs/Ctl05PauseMenuDesign.md`. If that document and this file ever disagree, **this file wins**.  
**Leftover:** **REAL.** Not CONSUME. Serial is **not** none. Named serial: **PR1** (pause menu access: Settings / berth / title / resume).  
**Name:** in-run KeyP shows a **menu** with named access to existing Settings, existing Berth Records (save), existing title, and resume. Copy-only `PAUSED — P to resume` is **not** that menu.  
**Not this wave:** `scripts/`, `public/`, `index.html`, `package.json`. Do not edit `docs/PLAYER-EXPERIENCE-WISHLIST.md`, `PROGRESS.md`, `docs/Ctl02OverlayDesign.md`, `docs/Ctl03BerthFreezeDesign.md`, `docs/Ctl04MenuInputDesign.md`, `docs/Onb01FlightLessonDesign.md`, `docs/Org01OriginPreviewDesign.md`, `docs/OwnerDecisions*.md`. Do not steal sibling packs (`docs/Onb01FlightLessonDesign.md`, `out/w141/onb01/**`, `docs/Org01OriginPreviewDesign.md`, `out/w141/org01/**`). Do not steal Hail01 / HUD-06 / Hail02 / HUD-07 / NAV-09 / NAV-10 governor / TGT-07 stills / MSN-04 other families / CTL-03 / AI-05 / CTL-04 / pad 2B / in-repo LLM. NAV-11 serial none. Do not write `out/w142/pause/verify/**`. Do not write `src/ui/screens.css`. Do not write `origins.js` / `onboarding.js` / `hud.js` / `hud.css`.

**Locked sources:** wishlist INBOX (P2, CONTROLS/SETTINGS) pause menu lines **217–220** (cite, do not edit); Settings **expansion** inbox **131–135** (cite, do not steal); live inventory `out/w141/pause/current-ctl05-pause-menu-inventory.md` (code wins); Wave 118 CTL-02 mutex + **never write `flags.paused`** from overlay-policy; Wave 28 LOAD-while-paused gate; Wave 40 z ladder (title 70 / settings 80 / pause 50).

Integrator rule: this implementation wave obeys this file. Inventory cites live code. Code wins over playtest “Settings exist only on the title menu”: KeyO **does** open Settings in a run; that is **not** a pause menu.

**This leftover is pause-menu ACCESS.** It is **not** Settings expansion. It is **not** Onb01. It is **not** Org01. It is **not** CTL-03 `berthHold`. It is **not** CTL-04 `fireHeld`. It is **not** pad 2B.

**Live hole (Wave 141 census):** `pauseEl.textContent = 'PAUSED — P to resume'` (`main.js` **172**). No buttons. KeyL cannot open berth while paused (`save.js` **1625**). Title `closeTitle` removes `#rw-title`. **Leftover is real. Not CONSUME. Serial is not none.** Wave 142 PR1 fills that hole.

---

## 0. Orchestrator merge law (do not weaken)

1. This worker **implements PR1** in `src/main.js`, `src/systems/title.js`, `src/game/save.js` (and `settings.js` only if `setOpen` export is required). PR1 lands **together**. Do **not** land PR3 Settings expansion.
2. HUD-01 empty **80 px hub**. Aim-glass gauges stay off. Kit mutate omit. **Do not** steal Digit 0/8/9. **No new Digit.**
3. KeyP stays pause. KeyH stays hail. KeyJ stays dock/jump. KeyL stays berth. KeyM stays chart. KeyD stays strafe. Digit 0/8/9 stay station. **Do not remap those keys.**
4. `innerHTML` forbidden. Pause labels, hints, and buttons: `textContent` only. **No** `insertAdjacentHTML` / `document.write`.
5. `src/game/state.js` is READ-ONLY. Persist: **none** new. Do **not** invent UU. Do **not** invent SKU. Do **not** invent Digit. Do **not** add WORLD_FIELDS. Do **not** persist `flags.paused` or `berthHold`. Settings stay on `rimward-settings-v1` with **live FIELDS only**.
6. Overlay mutex stays CTL-02: hail / chart / berth exclusive. Hail / chart / berth / overlay-policy **never** write `ctx.flags.paused`. Pause already writes `flags.paused` in `main.js`. Keep **one in-run display owner** for that flag (`main.js` helper: flag + `pauseEl.display`). CTL-03 `berthHold` is session hold, **not** pause — **do not merge**.
7. LOAD while paused stays gated (`save.js` **1502**, Wave 28 `systemLoaded` hazard). SAVE while paused still writes (frozen state is coherent). Autosave `update` stays loop-gated.
8. Title z **70**, settings z **80**, pause z **50** (wave 40 ladder). Opening Settings from pause must **not** break title-first capture-phase keys (`title.js` KeyO/Escape pass-through).
9. Settings expansion inbox (**131–135**) is **not** this pack. Do **not** add mouse sensitivity, invert-X/invert-Y, key rebinding, conflict detection, or split music/effects/voice/UI volume.
10. This is **not** Onb01 flight lesson. This is **not** Org01 origin preview. This is **not** CTL-04 `fireHeld`. This is **not** pad 2B. NAV-11 serial **none**.
11. Fail closed:
    - Never throw from pause paint / action dispatch.
    - Unknown action → **skip**; do not unpause; do not write pause from overlay-policy.
    - Do **not** unpause into a title-filter KeyP. Existing typing / models / `#rw-title` guards stay.
    - Title return must **not** set `rimward-title-skip` (that marker is NEW GAME reload only).
    - Title return must **not** `location.reload` as required PR1 (world wipe).
    - LOAD from pause-opened berth: keep the paused refuse. Disable LOAD in UI with **text**, not color-only.
    - Prototype / reserved action ids: skip unless authored literals.
    - Never `for-in` hostile objects onto `ctx.flags`.
12. `reducedMotion`: **no** new animation that ignores it. Color is not the only cue (button **words** + KeyP legend).
13. Accessibility: pause actions are real `<button type="button">`. Named labels. `role="dialog"` + accessible name **Paused**. Focus-visible ring. Hit target ≥ 44 px where the existing `.screen-btn` pattern allows. While settings, berth, or title cover pause, `pauseEl` uses `pointer-events: none` (or ignores actions). Settings/berth roots stay `pointer-events: none` on the scrim; do **not** resume by clicking the dim ring.
14. CPU: pause paint is event-driven. **No** per-frame DOM rebuild while paused.
15. Prototype-safe: authored action ids only (`resume`, `settings`, `berth`, `title`).
16. Do not “fix” known REDMARCH `castMatches` flake.
17. Do not steal sibling Wave 141 packs. Do not edit the wishlist or `PROGRESS.md`. Deputize defaults live in **this** contract.
18. Do **not** teleport. Do **not** grant credits, hull, or cargo. Do **not** remap keys.
19. Do **not** call `graph_propose` / `graph_approve` from this pack.
20. KeyP while settings (opened from pause) is still pause. Settings does **not** swallow KeyP. Title capture **does** swallow KeyP while `#rw-title` is a body child.

---

## 0.1 Deputize (owner may override after playtest)

Pick a playable **pause menu**. Inventory proves the banner was copy-only. Do not park. Do not invent UU / SKU / Digit / persist key / Settings knobs.

### Live knobs (do not retune as the “fix”)

| Knob | Live | Cite |
|---|---|---|
| Banner copy (pre-PR1) | `'PAUSED — P to resume'` | Wave 141 inventory |
| Pause z | 50 | `main.js` |
| Title z | 70 | `screens.css` **512** |
| Settings z | 80 | `settings.js` **93** |
| Berth z | 60 | `save.js` **1372** |
| KeyP guards | typing / models / `#rw-title` | `main.js` |
| KeyO | global toggle; no pause guard | `settings.js` **228–234** |
| KeyL open | refuses `flags.paused` | `save.js` KeyL handler |
| LOAD paused | refuse | `loadFromSlot` |
| SAVE paused | writes | `trySave` |
| `berthHold` | not pause | `overlay-policy.js` **196–203** |
| Overlay paused write | never | **4** |
| Digit skip | `hailDigitsAllowed` false when paused | **177** |

Do **not** “fix” the hole by remapping P, by writing `paused` from overlay-policy, by opening berth via unpause, by reload-to-title, or by stuffing expansion knobs into Settings.

### Playable policy (smallest additive)

**Name:** pause menu is **ACCESS** to existing Settings / existing berth / existing title / resume.

| Piece | Freeze |
|---|---|
| **Who** | `main.js` `pauseEl` chrome + in-run `setPaused` helper. Title reopen in `title.js`. Berth open-from-pause in `save.js` (KeyL `!paused` gate exception **only** from the menu). Settings: **existing** KeyO / `setOpen` — **no new FIELDS**. Overlay-policy: **cite** digit skip; **never** write `paused`. |
| **RESUME** | same as KeyP resume: `paused = false`; hide `pauseEl`. Authored label `RESUME`. KeyP stays the key. |
| **SETTINGS** | open live settings overlay (synthetic KeyO **or** a later exported `setOpen(true)`). Keep `flags.paused` **true**. Do **not** add expansion knobs. Title capture KeyO/Escape pass-through **unchanged**. |
| **BERTH RECORDS** | open live berth while **still paused**. Bypass KeyL’s `!paused` **open** gate from this menu only. KeyL binding stays L. LOAD remains paused-gated. SAVE still writes. `berthHold` may set as today on open; **do not** equate it with pause. Mutex hail/chart/berth still applies (`canOpenPlayCard`); refuse → skip. |
| **TITLE** | remount live title overlay **without** reload and **without** `rimward-title-skip`. Keep `flags.paused` true. Hide `pauseEl` while title owns the screen (boot desync pattern). CONTINUE uses the helper so `paused` false **and** `pauseEl` none. Capture listener returns. Do not steal NEW GAME reload. Do not steal Org01 preview. Close berth first if open (mutex + z). |
| **Menu sit** | pause stays **z 50**. Settings 80 / title 70 / berth 60 cover it when opened. Do not raise pause over title. |
| **Fail-closed** | never throw; unknown action skip; never overlay-policy pause write; never unpause into typing/models/title KeyP. |
| **Click-through** | Settings/berth scrims are `pointer-events: none` on the root (`settings.js` **91–93**; `save.js` **1371–1372**). After PR1, dim-ring clicks must **not** hit pause RESUME. Freeze: `pauseEl` `pointer-events: none` while settings, berth, or title cover. Do **not** raise pause z. |
| **Copy** | `textContent`. Legend names P to resume. LOAD while paused: named disabled (`LOAD — resume first` or equal), not color-only. |
| **Persist** | **none** new. |
| **`reducedMotion`** | no new animation. |

### Helper

`setPaused(next)` in `main.js`: writes `ctx.flags.paused` and `pauseEl.style.display` together for **in-run** pause. Boot title / origins / models restore **cite** the helper or keep their live writers; do **not** add overlay-policy as a writer.

Pause menu actions: authored ids only. Click + optional Digit **not** required (no new Digit). Enter on focused button is native.

Do **not** interpolate save strings into HTML.

Do **not** dual-stack Settings expansion as “pause access”.

---

## 1. Write-set (this wave)

**This pack owns:**

- **Writer:** `src/main.js` — `pauseEl` menu chrome (`textContent` buttons), KeyP guard **kept**, `setPaused` helper (flag + display).
- **Writer:** `src/systems/title.js` — reopen-from-pause (no skip marker, no reload); CONTINUE/close must not leave `pauseEl` visible. Capture KeyO/Escape **unchanged**.
- **Writer:** `src/game/save.js` — berth **open from pause menu** despite `flags.paused`; LOAD refuse **kept**; SAVE **kept**; `berthHold` **not** merged into pause; LOAD button named-disabled while paused.
- **Optional writer:** `src/systems/settings.js` — export `setOpen` **only** if synthetic KeyO is not enough. **No new FIELDS.**

**Do not claim:**

- `src/game/state.js`
- `src/systems/overlay-policy.js` as a `paused` writer (cite digit skip / `berthHeld` only)
- `src/systems/controls.js` (CTL-04 / `fireHeld`)
- Settings expansion knobs
- `src/systems/onboarding.js` (Onb01)
- `src/game/origins.js` preview (Org01)
- Hail01 / HUD-06 / Hail02 / HUD-07 / NAV-09 / NAV-10 / TGT-07 / MSN-04 / AI-05 / pad 2B
- Sibling `out/w141/onb01/**`, `out/w141/org01/**`

---

## 2. Partial merge forbidden

PR1 must land **together**: pause `pauseEl` actions (RESUME / SETTINGS / BERTH RECORDS / TITLE) + `textContent` + KeyP guards kept + LOAD paused-gate kept + overlay-policy still never writes `paused` + Settings FIELDS unchanged + title remount without skip/reload + `setPaused` so CONTINUE cannot leave the banner up + `pauseEl` pointer-events none while settings/berth/title cover.

Shipping banner buttons that only say Settings without opening live Settings is a lie. Shipping berth-from-pause that **unpauses** first is a Wave 28 / combat hazard. Shipping title-from-pause via reload wipes the run. Shipping new Settings knobs steals **131–135**.

---

## 3. Serial PR plan

| PR | Lands | Does not land |
|---|---|---|
| **PR1** pause menu access | `pauseEl` menu; RESUME; open live Settings; open live berth while paused; remount title without reload/skip; `setPaused`; `textContent`; KeyP guards; LOAD gated; SAVE writes; z 50/70/80; overlay-policy still never writes `paused`; `pauseEl` pointer-events none while covered | Settings expansion knobs; remap KeyP; `berthHold` merge; overlay-policy pause write; `innerHTML`; new Digit; persist pause; teleport; credits; Onb01; Org01; CTL-04 `fireHeld`; pad 2B; reload-as-title |
| **PR2 stills (optional skip)** | playtest still: in-run P shows four named actions; Settings opens at z 80; berth SAVE works, LOAD named-disabled; TITLE remounts; CONTINUE hides banner; typing KeyP still ignored | required with PR1 |
| **PR3 Settings expansion (forbidden here)** | **other inbox 131–135** | this pack |

This wave lands **PR1**.
