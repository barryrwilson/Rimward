# Onb01 flight-lesson shared contract

**Wave:** 141. Design only. No flight-lesson ships in this wave.  
**Status:** MERGE LAW for `docs/Onb01FlightLessonDesign.md`. If that document and this file ever disagree, **this file wins**.  
**Leftover:** **REAL.** Not CONSUME. Serial is **not** none. Named later serial: **PR1** (sequential first-minute flight lesson + encyclopedia on demand).  
**Name:** immediately after the permanent origin pick, teach look/turn, throttle, target, hail, dock, and chart **one at a time**, then leave the full control reference **on demand**.  
**Not this wave:** any edit under `src/`, `scripts/`, `public/`, `index.html`, `package.json`. Do not edit `docs/PLAYER-EXPERIENCE-WISHLIST.md`, `PROGRESS.md`, `docs/Org01OriginPreviewDesign.md`, `docs/Ctl05PauseMenuDesign.md`, `docs/Ctl*.md`, `docs/Hud0*.md`, `docs/Ai05StarterGraceDesign.md`, `docs/OwnerDecisions*.md`. Do not steal sibling Wave 141 packs (Org01 origin preview, Ctl05 pause menu). Do not steal Hail01 / HUD-06 / Hail02 / HUD-07 / NAV-09 / NAV-10 governor / TGT-07 stills / MSN-04 other families / CTL-03 / AI-05 / CTL-04 / pad 2B / in-repo LLM. NAV-11 serial none. Do not write `out/w141/onb01/verify/**`.

**Locked sources:** wishlist INBOX (P2, ONBOARDING) lines **96–101** (cite, do not edit); live inventory `out/w141/onb01/current-onb01-flight-lesson-inventory.md` (code wins); Wave 118 CTL-02 mutex + **never write `flags.paused`** (`overlay-policy.js` **4** — cite only).

Integrator rule: a **later** implementation wave obeys this file. Inventory cites live code. Code wins over the wishlist and over old playtest memory.

**This leftover is a first-minute flight lesson + on-demand encyclopedia.** It is **not** origin mechanical preview. It is **not** the pause menu. It is **not** AI-05 grace. It is **not** CTL-04 menu digits.

**Live hole:** CONTROLS encyclopedia starts **expanded** (`hud.js` **1290**). `originChosen` toast fires the origin line (`hud.js` **662–663**). HINTS first row waits `world.time > 20` and dumps four binds (`onboarding.js` **37–39**). No hail-only / chart / look-only step. Park ~73 u so `dock` does not fire at pick (`origins.js` **46**; `U.DOCK_RANGE` **45**). **Leftover is real. Not CONSUME. Serial is not none.**

---

## 0. Orchestrator merge law (do not weaken)

1. This worker is **markdown only**. No `src/`. Later impl is **serial**. Serial PR plan is **named only**. Do **not** land these PRs in `src/` in this worker.
2. HUD-01 empty **80 px hub**. Aim-glass gauges stay off. Kit mutate omit. **Do not** steal Digit 0/8/9. Origin Digit1–5 stay origin **until pick**. **No new Digit.** Do not steal a new Digit.
3. KeyH stays hail. KeyJ stays dock/jump. KeyL stays berth. KeyM stays chart. KeyP stays pause. KeyD stays strafe. **Do not remap those keys.** Lesson **names** H / J / M / T / mouse / R/F. Lesson does **not** bind new keys.
4. `innerHTML` forbidden later. Hint paint stays `textContent` (`onboarding.js` **102**). Encyclopedia `<li>` stays `el()` `textContent` (`hud.js` **319–324**, **1288**). **No** `insertAdjacentHTML` / `document.write`.
5. `src/game/state.js` is READ-ONLY. Persist: **reuse** `ctx.world.onboarding.seen`. Do **not** add WORLD_FIELDS. Do **not** invent UU. Do **not** invent SKU. Do **not** invent Digit. Do **not** retune `ORIGINS` effects, `JUMP.graceSeconds`, or `U.DOCK_RANGE`.
6. Overlay mutex stays CTL-02: hail / chart / berth exclusive. Hail / chart / berth **never** write `ctx.flags.paused`. Onb01 **cites** overlay-policy only. Do **not** claim `overlay-policy.js`. Do **not** write `flags.paused`. Origins overlay already pauses/unpauses (`origins.js` **100**, **132**) — that write stays **origins.js / Org01**. Flight lesson must **not** pause.
7. Do **not** steal sibling Wave 141 Org01 (origin overlay preview) or Ctl05 (pause menu). If later both Onb01 and Org01 need `origins.js`, **parent sequences** the impl wave. This pack’s later write-set prefers **`onboarding.js` + `hud.js` collapse + `hud.css` hint tokens** and does **not** claim `origins.js`.
8. Do **not** steal AI-05 (`jumpGraceUntil` / npc hunt). Do **not** steal CTL-04 `fireHeld` / dock Digit skip. Do **not** steal Hail01 / Hail02 hail card copy. Do **not** steal HUD-06 home pip. Do **not** steal HUD-07 deconfliction. Do **not** steal NAV-09 / NAV-10. Do **not** steal TGT-07 stills. Do **not** steal MSN-04. Do **not** steal CTL-03. NAV-11 serial **none**.
9. Do **not** steal optional PR2s listed as Hail01 / HUD-06 / Hail02 / HUD-07 / NAV-09 / NAV-10 governor / TGT-07 stills / MSN-04 other families / CTL-03 / AI-05 / CTL-04, or Agent pad 2B, or in-repo LLM.
10. Fail closed:
    - Never throw from hint paint (`show` / `update` / `when`).
    - Unknown hint id in `seen` or table → **skip**; do **not** crash.
    - `seen` not an array after restore → treat as empty array in memory; do **not** throw; do **not** invent a WORLD_FIELD.
    - `when(ctx)` throw → skip that row; continue the table.
    - Prototype / reserved keys: skip unless `typeof id === 'string'` and the id is an **authored** HINTS id.
    - Never `for-in` a save blob onto `world`.
    - Sanitize / persist caps **unchanged** in `save.js` (do not claim `save.js` unless census later proves a cap is required; default is **onboarding.js** skip).
11. `reducedMotion`: **no** new animation that ignores it. Later mint **must** cover the hint rail the same way `#hud` is covered (`hud.css` **1271–1277**), not only freeze “no new animation” while the chip stays off-token. Color is not the only cue (hint is **text**; encyclopedia is **text**; collapse uses `CONTROLS ▸` / `▾` **words** plus `display:none`). Do **not** teach binds by color-only.
12. Accessibility:
    - CONTROLS stays a real `<button>`.
    - Set `aria-expanded` from the collapse flag on **init**, **click**, and **combat collapse** (`hud.js` **1290–1294**, **2246–2249**). Do not set it only in the click handler.
    - Hint remains `pointer-events:none` (not a second modal).
    - **One** existing `.rw-onboard-hint` node. On that same node set `role="status"`, `aria-live="polite"`, `aria-atomic="true"`. Do **not** add a second live region. Pattern: nav readout `hud.js` **1236–1240**.
    - Later `hud.css` tokens for `.rw-onboard-hint` (text scale, contrast panel, reduced-motion). Live chip is `document.body` + hardcoded `font-size:11px;color:#6ff2e0` (`onboarding.js` **81–88**) and misses `--rw-text-scale` / `body.rw-contrast #hud` / `body.rw-reduced-motion #hud *`. That hole is **in scope**.
    - Do **not** put the hint in the 80 px reticle. Do **not** add a second list.
    - Focus-visible: do **not** claim a ring already exists. Optional PR1: `:focus-visible` on `.rw-controls-toggle` like `.rw-autopilot` (`hud.css` **782–789** vs **1186–1199**). Keep the real `<button>`.
13. CPU: keep one hint node. Do **not** add a per-frame extra DOM list. Encyclopedia still built once at HUD init. Onboarding init runs **before** HUD (`main.js` **98–99**): create the node in `onboarding.js`; HUD init may **reparent** that same node onto `#hud` (not the reticle) so `--rw-text-scale` inherits. If `#hud` is missing, stay on `body`; `hud.css` body selectors still cover contrast/motion; copy `ctx.settings.textScale` onto the node as `--rw-text-scale` (fail closed, never throw).
14. Prototype-safe: authored HINTS ids only for identity.
15. Do not “fix” known REDMARCH `castMatches` flake.
16. Deputize defaults live in **this** contract. Owner may override after playtest. Do not park.
17. Do **not** pause. Do **not** teleport. Do **not** remap keys. Do **not** auto-open hail, chart, berth, or pause to “teach” them.
18. Encyclopedia law is **one**: start **collapsed** (on demand via the live toggle). Do **not** dump 19 lines at overlay-up. Do **not** move the list into the pause menu (Ctl05).
19. Lesson law is **one**: after `ctx.world.origin` is set, the HINTS queue teaches look/turn, throttle, target, hail, dock, chart **one at a time**. Do **not** keep `world.time > 20` as the first-minute gate. Do **not** dump four binds in the first line.
20. Existing contextual hints `gate` / `combat` / `mine` / `feed` / `repair` / `saved` **stay** after the lesson (or keep their live `when`). Reuse the 8 s dismiss, key dismiss, docked/jumping suppression, and `settings.hints`.

---

## 0.1 Wave 141 deputize (owner may override after playtest)

Pick a playable **first-minute lesson**. Inventory proves the dump is **live**. Do not park. Do not invent UU / SKU / Digit / new WORLD_FIELDS / pause.

### Live knobs (do not retune as the “fix”)

| Knob | Live | Cite |
|---|---|---|
| HINTS count | 8 | `onboarding.js` **36–68** |
| First hint | `move` at `world.time > 20` | **37–39** |
| Duration | 8 s | **29** |
| Encyclopedia default | expanded | `hud.js` **1290** |
| Encyclopedia lines | 19 | `controls.js` **590–608** |
| Origin toast | `✦ ` + line | `hud.js` **662–663** |
| Park vs dock | ~73 u vs 45 u | `origins.js` **46**; `state.js` **30** |
| Persist | `world.onboarding.seen` | `save.js` **90–91** |
| Hints setting | `ctx.settings.hints` default true | `ctx.js` **248** |
| Pause | KeyP / origins overlay | **not this pack** |

Do **not** “fix” the dump by pausing the sim, by auto-opening the chart, by teleporting to the pad, by remapping Digit, or by stuffing the 19 lines into Ctl05.

### Playable policy (smallest additive)

**Name:** collapse CONTROLS at HUD init; sequence six authored lesson steps on the existing one-at-a-time hint rail after origin is set.

| Piece | Freeze |
|---|---|
| **Who** | `onboarding.js` HINTS table + `hud.js` CONTROLS default collapse. Not pause. Not origins overlay preview. Not npc grace. |
| **Encyclopedia** | `controlsCollapsed = true` at init; class `collapsed`; toggle `CONTROLS ▸`; `aria-expanded` from that flag on **init, click, and combat collapse**. Click still expands. Combat collapse **stays**. |
| **Lesson gate** | `ctx.world.origin` is a non-empty authored ORIGINS id (string + `Object.hasOwn(ORIGINS, id)`). Restore with origin set still gets unseen lesson ids **once**. |
| **Lesson order** | 1 look/turn · 2 throttle · 3 target · 4 hail · 5 dock · 6 chart |
| **Queue** | Keep “first unseen whose `when` holds”. Give all six `when`: origin set (and not already seen). Docked / jumping / hints-off still suppress. |
| **Copy (authored)** | look: `Mouse — look and turn toward the reticle`; throttle: `R/F — throttle · double-tap F — stop`; target: `T — cycle target`; hail: `H — hail the lock`; dock: `J — dock when the station is in range`; chart: `M — galaxy chart` |
| **Ids** | New authored ids `look`, `throttle`, `target`, `hail`, `chart`. Reuse `dock` as the lesson dock step so range-gated `J — dock` does not fire twice. **Retire** id `move` (replaced by look + throttle). |
| **WAVE6 harness** | Later retarget `scripts/boot-test.mjs` **1719–1750** off id `move` / fragment `throttle` as the **first** card. First visible lesson card is **look**. This wave does **not** edit the harness. |
| **Kept hints** | `gate`, `combat`, `mine`, `feed`, `repair`, `saved` with live `when`. `combat` may still mention T/H + surrender; that is contextual, not the first-minute dump. |
| **Dismiss** | 8 s or any keydown — **keep**. |
| **Mute** | `settings.hints === false` — **keep**. |
| **Paint** | `textContent`; never throw; unknown id skip. |
| **Hint node** | **one** `.rw-onboard-hint`. Not the 80 px reticle. No second list. No second live region. |
| **Hint tokens** | `hud.css` class: scale via `--rw-text-scale`; contrast via `body.rw-contrast`; reduced-motion via `body.rw-reduced-motion` (include `.rw-onboard-hint`, not only `#hud *`). Drop inline `font-size` / `#6ff2e0`. |
| **Live region** | same node: `role="status"`, `aria-live="polite"`, `aria-atomic="true"`. Not a modal. `pointer-events: none` stays. |
| **Do not auto-open** | hail / chart / berth / pause / settings. |
| **Persist** | `seen.push(id)` on SHOW, same as live. No new WORLD_FIELDS. |
| **`reducedMotion`** | no new animation. Collapse is `display:none`. Token CSS must **see** the hint node. |
| **`origins.js`** | **not claimed**. `world.origin` is enough. Org01 owns overlay preview. |

### Later helper (named only)

Keep `initOnboarding`. Do **not** add a second hint module. Do **not** put lesson DOM in the `#hud` **aim glass** (80 px hub). A `#hud` child that is **not** the reticle is allowed so tokens inherit. Do **not** import a new Digit. Do **not** write pause.

Do **not** interpolate save strings into HTML. Hint text stays authored literals.

Do **not** dual-stack Ctl05 pause help as “on demand encyclopedia”.

---

## 1. Later write-set (document now; do not edit those files this wave)

**This pack owns later:**

- **Writer:** `src/systems/onboarding.js` (HINTS sequence + fail-closed skip / try; live-region attrs on the existing node; drop inline color/size).
- **Writer:** `src/systems/hud.js` (CONTROLS default collapsed; `aria-expanded` on init/click/combat; reparent existing `.rw-onboard-hint` onto `#hud` if still on `body` — not the reticle).
- **Writer:** `src/ui/hud.css` (`.rw-onboard-hint` tokens: scale, contrast, reduced-motion). Class `collapsed` already live. Optional `:focus-visible` on `.rw-controls-toggle`.
- **Writer (harness only, with PR1):** `scripts/boot-test.mjs` WAVE6 onboarding checks retarget.

**Do not claim:**

- `src/game/state.js` (`ORIGINS` / `U` / `JUMP`)
- `src/game/origins.js` (Org01 sibling)
- `src/game/save.js` (default; skip in onboarding.js)
- `src/systems/overlay-policy.js`
- `src/main.js` KeyP pause (Ctl05 / orchestrator)
- `src/systems/hail.js` / `src/systems/galaxychart.js` / berth in `save.js`
- `src/systems/npc.js` (AI-05)
- `src/systems/controls.js` bind table (lines stay; HUD still reads them when expanded)
- Sibling `docs/Org01OriginPreviewDesign.md`, `docs/Ctl05PauseMenuDesign.md`, `out/w141/org01/**`, `out/w141/pause/**`

---

## 2. Partial merge forbidden

PR1 must land **together**: CONTROLS default collapsed + six-step origin-gated lesson (look → throttle → target → hail → dock → chart) + `move` retired + fail-closed skip + `textContent` kept + keys kept + WAVE6 harness retarget + `hud.css` hint tokens + polite live region on the **same** node + `aria-expanded` on init/click/combat. Shipping collapse without the lesson leaves no teaching. Shipping the lesson without collapse leaves the 19-line dump beside the lesson. Shipping the lesson without tokens leaves an unscaled, unthemed chip. Shipping the lesson without a live region leaves the rail silent for AT. Shipping either without skip can throw from hint paint.

Do **not** ship pause-from-lesson. Do **not** ship encyclopedia-into-pause. Do **not** ship auto-open chart/hail. Do **not** ship a second hint node or a second live region.

---

## 3. Serial PR plan (named only)

| PR | Lands | Does not land |
|---|---|---|
| **PR1** flight lesson | default-collapse CONTROLS; six-step HINTS after origin; retire `move`; keep 8 s / key / hints setting / docked / jumping; `textContent`; unknown id skip; never throw; `aria-expanded` on init/click/combat; `hud.css` `.rw-onboard-hint` tokens; same-node `role="status"` polite live region; WAVE6 retarget | `origins.js` preview; pause menu encyclopedia; `flags.paused`; new WORLD_FIELDS; `state.js`; auto-open hail/chart; remap KeyH/J/L/M/P/D; new Digit; HUD-01 pip; second hint node; second live region; innerHTML; AI-05 grace; CTL-04 digits; animation that ignores `reducedMotion`; hardcoded `#6ff2e0` / `11px` left on the rail |
| **PR2 stills (optional skip)** | playtest still: fresh origin pick → encyclopedia collapsed; first hint look/turn only; after dismiss throttle; encyclopedia expands on CONTROLS click; KeyH/J/M still those verbs; hub empty; no pause from lesson | required with PR1 |
| **PR3 pause-menu help (forbidden here)** | Ctl05 only if owner asks that sibling | **not** Onb01 |

First remaining serial is **PR1**.
