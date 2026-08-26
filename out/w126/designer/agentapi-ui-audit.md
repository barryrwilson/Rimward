# UI Audit: Wave 126 Agent API later watch badge + copy

**Auditor:** `[designer]` (independent of `out/w126/agentapi/ui-audit.md`)
**Scope:** Leftover markdown only. Later PR5 `?agent=1` badge, frozen player copy, HUD-01 empty 80 px hub, no watch claim before PR3 hypot latch. No product chrome ships this wave.
**Review file:** `out/w126/designer/agentapi-ui-audit.md`
**Method:** `C:\Users\barry\.grok\skills\orchestrator\assets\designer-persona.md` + `C:\Users\barry\.grok\skills\orchestrator\references\ui-audit.md`. Pack: `docs/AgentApiDesign.md`, merge law `out/w126/agentapi/shared-contract.md` (wins on conflict). Worker self-audit `out/w126/agentapi/ui-audit.md` read, not copied. Honor cite only: `src/ui/hud.css`. Did not edit `docs/AgentApiDesign.md`, `out/w126/agentapi/**`, `src/`, or `hud.css`. No Playwright. No Vite. No Chrome. Did not spawn children.
**Date:** 2026-08-25
**Product source:** review only

Merge law: `out/w126/agentapi/shared-contract.md` wins if the brief forks. Wave 126 does not ship `src/`. Findings bind **later PR5** (chrome) and **PR1–PR2 copy** (no watch claim). Serial is named only.

## UI Audit: Agent API PR5 badge / HUD-01 / watch-claim freeze

### Summary

No player chrome lands in this wave. The freeze puts later badge copy on contract §0.1.2 literals, `textContent` only, a sibling of `#app` (not the 80 px hub), `aria-live="polite"` on the status line, and no pulse under `reducedMotion`. PR1–PR2 copy does not call the canvas a working watch surface. Prior jargon `AGENT DRIVE` is forbidden in later copy.

**Counts:** 🔴 Blocker **0**. 🟠 Major **0** open (**2** addressed in freeze: jargon, watch-before-latch). 🟡 Minor **4**. 💡 Suggestion **2**.

### Verdict

**CLEAN.** No open Blocker or Major. HUD-01 empty hub, `innerHTML` ban, frozen literals, and PR3-before-watch-claim hold in the freeze. Minors are later-PR5 layout/token work, not freeze defects.

---

### Honor / Blocker gate

Flag **Blocker** or **Major** if later copy would parent chrome into the 80 px hub, add a new Digit or aim-glass pip, use `innerHTML`, ship jargon `AGENT DRIVE`, or call the canvas a working watch surface in PR1–PR2.

| Honor | Brief / contract | Live | Result |
|---|---|---|---|
| HUD-01 empty 80 px hub | Design Honor; design 176, 411; contract law 2, §0.1.2, §0.3 `hud.js` none | `.rw-reticle` 80×80, `pointer-events: none` (`hud.css` 184–193); clamp `hud.js` **1293** | **Pass.** Badge is sibling of `#app` / `document.body`, not a `#hud` hub child. |
| Aim-glass gauges stay off | Design Honor; design 176 | Hub ring only (`hud.css` 183–199) | **Pass.** No agent pip on `.rw-reticle`. |
| Digit 0/8/9 station; Digit 1–5 WPN | Design Honor; contract law 2 | Controls / station map (cite only) | **Pass.** Badge is not a Digit. |
| `innerHTML` forbidden; toasts `textContent` | Design 233, 412, 583; contract law 2, §0.1.2 | HUD toasts already `textContent` (honor) | **Pass.** Last line forbids dest/id interpolation into HTML. |
| Frozen copy | Contract §0.1.2; design 411; notes 34 | n/a (not shipped) | **Pass.** `Agent play` / `on` / `off` / `Enable agent play` / `Stop agent play`. |
| No `AGENT DRIVE` | Design 411 | n/a | **Pass.** Jargon named only as forbidden. |
| No watch claim before PR3 latch | Contract law 8, §0.1 Watch chrome, PR5 must-not; design 406–407, 718, 732 | Mouse hypot cancels AP (`autopilot.js` **176–177**); axes `controls.js` **461–478** (cite) | **Pass.** PR1–PR2 descriptions do not call the canvas the watch surface. PR3 is first watch-usable PR. PR5 depends on PR3. |
| Color not the only cue | Contract §0.1.2; `hud.css` **4** | Color always paired with text/shape/glyph | **Pass.** State words `on` / `off`. |
| `aria-live` on status line | Contract §0.1.2 line 98; design 412 | Chart live region is a sibling precedent | **Pass.** Live region is title + on/off + last + error. Buttons stay out. |
| `reducedMotion`: no pulse | Contract §0.1 `reducedMotion`; §0.1.2 line 98; design 415 | `body.rw-reduced-motion #hud *` kills HUD motion (`hud.css` 1184–1188). Badge is **not** under `#hud`. | **Pass in freeze.** Law forbids pulse/blink; default is no animation. Later CSS must not reuse `rw-blink` (`hud.css` 130–133). |
| z-index below pause / berth; do not cover hub | Contract §0.1.2 line 98; design 414 | Pause `z-index:50` (`main.js` **164**); berth `z-index:60` (`save.js` **1356**); `#hud` `z-index:10` (`style.css` **24–28**) | **Pass as constraint.** Numeric band vs hail/title is a Minor, not a hub steal. |
| `textContent` only | Contract §0.1.2; PR5 must-not `innerHTML` | n/a | **Pass.** |

If a later worker parents the badge under `#hud` / `.rw-reticle`, adds a Digit or aim-glass agent pip, uses `innerHTML`, ships `AGENT DRIVE`, pulses the badge under `reducedMotion`, or documents PR1–PR2 as a working watch surface, that **violates this freeze**.

---

### Product-focus checks

| Focus | Result | Cite |
|---|---|---|
| Player-facing title | **Pass.** `Agent play` | contract §0.1.2; design 411 |
| State words | **Pass.** `on` / `off` (not a color pip alone) | contract 88–89 |
| Enable / Stop | **Pass.** Real `<button type="button">`. Visible labels match freeze. Enable = trusted click. Stop does not cancel Autopilot (hint). | contract 94–98; design 413 |
| Last / error | **Pass.** `Last: none` or `Last: ` + authored `name`. Error empty or `Error: ` + live English. No dest/id in HTML. | contract 90–93 |
| Hit target ≥ 44 px | **Pass in freeze.** Stricter than live AP Cancel min-height 24 px. | contract 98 |
| Visible focus ring | **Pass as requirement.** Later PR5 should match HUD `outline: 2px solid` + offset (`hud.css` 478–482). | contract 98; `hud.css` 478–482 |
| Pointer events | **Pass.** Badge `pointer-events: auto`. `#hud` is `pointer-events: none` except AP/AM (`hud.css` 5–7; `style.css` 27). | contract 98 |
| Watch vs latch | **Pass.** Design 406: do not call the canvas a working watch surface until PR3. Rollout PR3 then PR5 (design 616–619). | design 406, 616–619, 718, 732 |
| Same-tab vs slideshow | **Pass.** Watch is live WebGL after latch, not JPEG tiles. Second window rejected. | design 74, 199, 418 |
| Overlay HTML in PR2 | **Pass.** PR2 attach helpers only. No overlay CSS/HTML rewrite. | contract §3 PR2; design 370 |

---

### What's done well

- HUD-01 stays empty. The 80 px hub remains aim glass (`hud.css` 184–193). Badge is forbidden from `#hud` (`hud.js` **1293** clamp cited; `hud.js` write-set none in PR1–PR6 except cite).
- Frozen literals are short English. They name on/off. They do not ship `AGENT DRIVE`.
- `innerHTML` is forbidden later. Last intent concatenates an authored `name` only. Dest and id stay out of HTML.
- `aria-live="polite"` is on the status line, not the buttons. Enable/Stop stay real buttons.
- `reducedMotion`: no pulse, no blink. Default: no animation. Do not reuse `rw-blink`.
- Color is not the only cue (`hud.css` **4**). Tokens named: `--rw-accent` `#6ff2e0`, `--panel`, `--white`.
- Same-tab watch is gated on PR3 hypot latch. PR5 chrome does not claim watch without that latch.
- Worker self-audit (`out/w126/agentapi/ui-audit.md`) already closed jargon and watch-before-latch as resolved. This pass **agrees**. It does not reopen them as OPEN.

---

### Findings

#### 🟠 Major (resolved in freeze): `AGENT DRIVE` jargon

**Location:** `docs/AgentApiDesign.md:411` (forbidden); `out/w126/agentapi/shared-contract.md:87–95`; prior draft §8
**Issue:** `AGENT DRIVE` is not a player state. It does not name on/off. A color pip alone would violate `hud.css:4`. A hub child would steal HUD-01 (`hud.css:184–193`).
**Suggestion:** Keep frozen literals: `Agent play`, `on`/`off`, `Enable agent play`, `Stop agent play`.
**Status:** resolved in freeze.

#### 🟠 Major (resolved in freeze): Watch claimed before hypot latch

**Location:** `out/w126/agentapi/shared-contract.md:22` (law 8); `docs/AgentApiDesign.md:406–407`, `:718`, `:732`; `src/game/autopilot.js:176–177` (cite)
**Issue:** Same-tab mouse hypot cancels AP/AM today. Badge-without-latch is a cancelled-AP slideshow. Law 8 forbids calling the canvas the watch surface in PR1–PR2 copy.
**Suggestion:** Keep PR3 as first watch-usable PR. PR5 depends on PR3. Do not weaken law 8.
**Status:** resolved in freeze. Product-level “live watch surface” lines (`docs/AgentApiDesign.md:27`, `:54`, `:160`) are leftover identity, not PR1–PR2 player copy.

#### 🟡 Minor: Badge tokens live under `#hud`

**Location:** `src/ui/hud.css:9–21` (`--rw-accent` scoped to `#hud`); `out/w126/agentapi/shared-contract.md:83` (copy onto `style.css`); `docs/AgentApiDesign.md:414` (cites `hud.css` **12–21**)
**Issue:** A `#app` / `body` sibling cannot see `#hud` custom properties. Galaxy chart already re-declares the palette because it is not under `#hud` (`hud.css:1891–1916`).
**Suggestion:** Later PR5: declare `--rw-accent`, `--panel`, `--white` (and STATE colors) on the badge class in `src/style.css` or a non-hub wrapper, same pattern as `.rw-galaxy-chart`. Do not parent the badge under `#hud`.
**Status:** OPEN for later PR5. Not a Wave 126 src defect.

#### 🟡 Minor: Contrast / colorblind / text-scale selectors miss a body sibling

**Location:** `src/ui/hud.css:1147–1161` (`body.rw-colorblind #hud`, `body.rw-contrast #hud`); `hud.css:29–31` (`--rw-text-scale` inline on `#hud`); worker self-audit also named this
**Issue:** Settings classes retarget `#hud` and `.rw-galaxy-chart`, not a new body child. High-contrast and colorblind players would keep default badge colors. HUD text scale would not apply.
**Suggestion:** Later PR5: add `body.rw-contrast` / `body.rw-colorblind` / `body.rw-reduced-motion` rules for the badge class. Multiply type by `--rw-text-scale` on the badge (set a fallback `1`).
**Status:** OPEN for later PR5.

#### 🟡 Minor: z-index band omits hail / title / models

**Location:** `out/w126/agentapi/shared-contract.md:98`; `docs/AgentApiDesign.md:414`; live pause `main.js:164` (50); berth `save.js:1356` (60); hail `hail.js:118` (40); title `screens.css:507` (70); models `models.css:13` (80); onboarding `onboarding.js:84` (35); `#hud` `style.css:28` (10)
**Issue:** Freeze only says below pause 50 and berth 60. A badge at 45 would sit on hail (40). A badge at 25 would sit under HUD panels (10 is `#hud` root; chart overlay is 30).
**Suggestion:** Later PR5: pick a corner badge `z-index` in **36–39** (above onboarding 35, below hail 40). Keep below pause 50 and berth 60. Do not cover the center 80 px hub.
**Status:** OPEN for later PR5.

#### 🟡 Minor: Enable / Stop disabled pairing not frozen

**Location:** `out/w126/agentapi/shared-contract.md:94–98`; opt-in matrix `shared-contract.md:67–78`; `docs/AgentApiDesign.md:413`
**Issue:** When `optIn` is true (`?agent=1` boot or trusted Enable), Enable is a no-op. When `optIn` is false, Stop has nothing to clear. Freeze names both labels but not hidden/disabled/aria-disabled states. Hover/focus on a no-op primary control is unclear.
**Suggestion:** Later PR5: when `optIn`, disable (or hide) Enable; when off, disable (or hide) Stop. Keep both labels in the freeze. Visible focus ring still required on the remaining button. Hit target ≥ 44 px.
**Status:** OPEN for later PR5.

#### 💡 Suggestion: Freeze a corner so the hub stays empty in layout, not only in parent tree

**Location:** `out/w126/agentapi/shared-contract.md:98` (“do not cover the 80 px reticle hub”); `src/ui/hud.css:184–193`; `src/systems/hud.js:1293`
**Issue:** Parent-not-`#hud` does not by itself keep a large fixed badge off the center reticle.
**Suggestion:** Later PR5: top-right or bottom-right, max-width so it does not cross screen center. Toasts already use top-right (`hud.css` toast block). Prefer a corner that does not sit on AP/AM chips.
**Status:** optional.

#### 💡 Suggestion: Player-outcome sentence order lists PR5 before PR3

**Location:** `docs/AgentApiDesign.md:651`
**Issue:** “After PR5 a badge names opt-in. After PR3, moving the mouse…” can be read as chrome before latch. Rollout table order is correct (PR3 then PR5, design 616–619). This is not a PR1–PR2 watch claim.
**Suggestion:** If the brief is edited later, swap the clauses: latch first, then badge. Do not treat as a freeze break. This designer pass does **not** edit the brief.
**Status:** optional. Not OPEN Major.

---

### Player-facing copy (frozen)

| Role | Literal |
|---|---|
| Title | `Agent play` |
| State | `on` / `off` |
| Last none | `Last: none` |
| Last intent | `Last: ` + authored `name` |
| Error none | empty string |
| Error | `Error: ` + last act `error` |
| Enable | `Enable agent play` |
| Disable | `Stop agent play` |
| Hint | `Stop does not cancel Autopilot.` |

Hit target ≥ 44 px. Visible focus ring. `textContent` only. Color is not the only cue. `aria-live="polite"` on the status line. `reducedMotion`: no pulse.

---

### Re-review

After contract §0.1.2 freeze + law 8: no remaining Blocker/Major. Worker self-audit verdict CLEAN is **confirmed**. This pass adds Minors for later PR5 token/contrast/z-index/control-state work. Verdict **CLEAN** for this markdown wave.
