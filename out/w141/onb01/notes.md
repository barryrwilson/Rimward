# Wave 141 Onb01 first-minute flight-lesson notes

**Verdict:** leftover **REAL**. Name: **first-minute flight lesson + on-demand encyclopedia**. Named serial: **PR1**. Not CONSUME. Named serial is **not** none.

## Method

- Did **not** call `graph_propose` / `graph_approve`. Local markdown only under `docs/Onb01FlightLessonDesign.md` and `out/w141/onb01/**` except `verify/**`.
- Census live `src/systems/onboarding.js` HINTS, 8 s dismiss, docked/jumping/`settings.hints`, `textContent`.
- Census HUD CONTROLS encyclopedia in `hud.js` / `hud.css` and `ctx.config.controls` in `controls.js`.
- Census `origins.js` overlay, Digit1–5 until pick, `originChosen`, park vs `U.DOCK_RANGE`.
- Census `originChosen` toast in `hud.js`, pause in `main.js` / origins (cite only).
- Census `save.js` WORLD_FIELDS `'onboarding'`. No new field required.
- Census WAVE6 boot-test onboarding section (`scripts/boot-test.mjs` **1719–1750**).
- Domain is **data**. Did **not** start Vite or Chrome. Did **not** claim ports. Did **not** write `src/`. Did **not** edit the wishlist or `PROGRESS.md`. Did **not** write sibling `out/w141/org01/**` or `out/w141/pause/**`.

## Why REAL (not CONSUME)

CONSUME needed **both**: sequential one-at-a-time lesson **after origin pick** **and** full control reference already on-demand (not dumped).

On-demand encyclopedia **is not** live:

- `controlsCollapsed = false` (`hud.js` **1290**).
- 19 lines painted at HUD init (`controls.js` **590–608**).

Sequential post-pick lesson **is not** live:

- First hint `move` waits `world.time > 20` and dumps four binds (`onboarding.js` **37–39**).
- No look-only, hail-only, or chart step.
- `dock` waits 45 u; park is ~73 u.

One-at-a-time rail **does** exist. CONTROLS toggle **does** exist. Those are **not** the leftover. Do **not** CONSUME on “hints exist”.

## Deputize (not parked)

| Knob | Freeze |
|---|---|
| Encyclopedia | collapsed at HUD init |
| Lesson gate | authored `world.origin` set |
| Order | look → throttle → target → hail → dock → chart |
| `move` | retired |
| Persist | `seen` reuse |
| `state.js` | read-only |
| `origins.js` | not claimed (Org01) |
| Pause | never from this pack |
| Auto-open hail/chart | no |

## Later write-set (do not edit now)

- `src/systems/onboarding.js` HINTS sequence + fail-closed skip + live-region attrs + drop inline color/size.
- `src/systems/hud.js` CONTROLS default collapse + `aria-expanded` on init/click/combat + reparent existing `.rw-onboard-hint` onto `#hud` (not the reticle).
- `src/ui/hud.css` `.rw-onboard-hint` tokens (scale, contrast, reduced-motion). Optional toggle `:focus-visible`.
- `scripts/boot-test.mjs` WAVE6 onboarding retarget (with PR1).
- Do **not** claim `origins.js`, `state.js`, `save.js`, `overlay-policy.js`, `main.js` pause, `hail.js`, `npc.js`.

## Coupling (do not steal)

- **Org01 origin preview** (Wave 141 sibling): both first-minute. Org01 likely writes `origins.js` overlay. Onb01 **must not** claim `origins.js`. If later both need `origins.js`, **parent sequences** the impl wave (Org01 overlay first, then Onb01 post-pick lesson). `world.origin` is enough for the lesson gate.
- **Ctl05 pause menu** (Wave 141 sibling): KeyP chrome. Encyclopedia stays the HUD toggle.
- AI-05 hop grace already stamped on choose (`origins.js` **129**) — cite only.
- CTL-04 dock Digit skip — cite only.
- Wave OPEN optional PR2s (Hail01 / HUD-06 / Hail02 / HUD-07 / NAV-09 / NAV-10 governor / TGT-07 stills / MSN-04 other families / CTL-03 / AI-05 / CTL-04).
- Agent pad 2B. In-repo LLM. NAV-11 serial none.

## Reviews

Security HIGH (XSS paint, prototype `seen`, persist mute field, overlay pause, uncaught throw) **resolved in freeze**. Code Blocker/Major **resolved in freeze** after collapse + six-step lesson + no `origins.js` + WAVE6 named + hint tokens/live region. UI live-dump Blocker stays leftover **REAL** until PR1. Designer Majors (off-`#hud` chip; no live region) **folded into freeze**.

## Re-review (pass 3)

After designer fold: no new HIGH/CRITICAL. Two later-mint Majors closed in contract (`hud.css` tokens; same-node polite live region; `aria-expanded` on init/click/combat). Live dump still REAL. Did not start Vite/Chrome. Did not write `out/w141/onb01/verify/**`. Did not steal Org01 / Ctl05.

## Graph

Owner write-set is local files. Did not bind Drive publish. Did not `graph_propose` / `graph_approve`.
