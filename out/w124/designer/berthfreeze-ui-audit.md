# UI Audit: CTL-03 Berth Records hold / resume (Wave 124 designer re-review)

**Auditor:** `[designer]` (independent of `out/w124/berthfreeze/ui-audit.md`)  
**Pass:** Re-review after Major fix (resume-only remainder vs SAVE/LOAD).  
**Scope:** Frontend-facing markdown only. No `src/` this wave. Live `save.js` berth hint is **current-state evidence**, not a ship target.  
**Review file:** `out/w124/designer/berthfreeze-ui-audit.md`  
**Method:** `C:\Users\barry\.grok\skills\orchestrator\assets\designer-persona.md` + `C:\Users\barry\.grok\skills\orchestrator\references\ui-audit.md`.  
**Sources:** `docs/Ctl03BerthFreezeDesign.md`; merge law `out/w124/berthfreeze/shared-contract.md` (wins on conflict); worker self-audit `out/w124/berthfreeze/ui-audit.md` (read, not copied); prior designer audit (same path, overwritten). Live cites: `save.js` ~1377 hint, dialog, LOAD, KeyL/Escape; `main.js` pause banner.  
**Browser:** Did not start Vite or Chrome. `[NO BROWSER COVERAGE]`.  
**Product source:** review only. Did **not** edit integrator docs, worker pack files, or `src/`.  
**Date:** 2026-08-25

Merge law: if the design doc and the contract disagree, **the contract wins**. This wave does not ship berth chrome. Findings bind **later PR1**.

Focus checked this pass:

- Prior Major: resume-only remainder could hide SAVE/LOAD
- Worker claims: panel stays; SAVE/LOAD stay; RESUME below slots; remainder hint does not dump to flight
- Remaining **shrink** language: allow vs forbid
- Resume vs Pause naming (hold is not KeyP)
- Close keys L/ESC stay; no new Digit; Enter is not the only resume
- Accessibility: text names the state; color is not the only cue

---

## UI Audit: Berth Records hold / resume copy

### Summary

The freeze now keeps the **full records desk** on interrupt. SAVE/LOAD stay visible and clickable. Named **RESUME** sits below the slots. Remainder hint names hold + RESUME and does **not** claim L/ESC dump to live flight. Prior Major is **closed**. No remaining Blocker or Major in the markdown freeze.

### Verdict

**CLEAN.** 0 🔴 Blocker. 0 🟠 Major. Live hint/resume holes stay **leftover for PR1**; they are not closed in `src/`.

### What's done well

- **Hold is not Pause in copy and law.** Never write `flags.paused`; KeyP stays pause; both hint literals name `This is not Pause (P).` (`docs/Ctl03BerthFreezeDesign.md` 204; `shared-contract.md` 95, 159). Pause banner stays `PAUSED — P to resume` (`main.js` 163).
- **Close keys stay.** Named close remains **L or ESC**. No new Digit. Window-level Enter is forbidden (death recover `save.js` 1341; title CONTINUE). Resume is a **text button**, not a Digit (`shared-contract.md` 17, 96–97; design 305).
- **Interrupt keeps the desk.** Contract §0.1 When keep: **Panel stays.** Title + SAVE/LOAD rows stay **visible and clickable**. Reason + `RESUME` **below** the slots (`shared-contract.md` 84, 97, 109; design 47, 197, 239–240, 251, 282–284).
- **Remainder hint does not dump to flight.** Interrupt literal: `Ship holds. RESUME continues the interrupted leg. This is not Pause (P).` Must **not** say “L or ESC to close” as if that dumps to live flight (`shared-contract.md` 95; design 204, 248, 284). L/ESC still exist; they keep the desk (`shared-contract.md` 84, 201).
- **State is named in text.** Reason literals name Autopilot vs gate vs both. Color is not the only cue (`shared-contract.md` 16–17, 97). `textContent` / `el()` only; `innerHTML` forbidden (`shared-contract.md` 4).
- **LOAD vs pause is frozen in behavior copy.** Wave 28 refuse stays pause-only (`save.js` 1420). Hold must not add that refuse (`shared-contract.md` 8, 93, 195). LOAD clears hold the same click; LOAD does **not** offer Autopilot RESUME (`shared-contract.md` 93; design 249–250, 284).
- **Live desk is a real dialog with named close.** `role='dialog'` `aria-label='Berth Records'` (`save.js` 1362–1363). Title `BERTH RECORDS` via `textContent` (1370). Hint already names **L or ESC** (1377). SAVE/LOAD are `<button type="button">` with `textContent` and class `screen-btn` (1466–1481). Empty slots disable LOAD (1497–1498).
- **Pointer and z.** Root `pointer-events:none` except the panel (`save.js` 1353–1358). Berth z 60 sits above pause z 50 (`save.js` 1353; `main.js` 162).
- **Focus ring already exists for `screen-btn`.** `.screen-btn:focus-visible` outline is global in `screens.css` 95–100. A later RESUME that reuses `screen-btn` inherits hover/focus without a new token.
- **Honor.** No hub pip. Aim-glass gauges stay off. Digit 0/8/9 stay. KeyL/M/H/J/P stay. `reducedMotion`: no hold animation (`shared-contract.md` 16; design 257).
- **Worker did not skip UI.** `out/w124/berthfreeze/ui-audit.md` treats resume copy as player-facing. This pass does not copy that file as done.

### Prior Major — closed

#### 🟠 Major: Resume-only remainder can hide LOAD while hold is on — **CLOSED**

**Prior location:** `shared-contract.md` “Panel stays **(or shrinks to a resume dialog)**”; design Picture / Acceptance that allowed shrink; worker audit “or a resume-only remainder”.

**Check this pass:** Allow-shrink clause is **gone**. Phrase `or shrinks to a resume dialog` is **absent** from contract and design. Remaining “shrink” / “resume-only” words are **forbid** language only:

| Cite | Freeze now |
|---|---|
| `shared-contract.md` **84** | **Panel stays.** Do **not** shrink to a resume-only remainder. Do **not** replace the desk with a resume-only card. SAVE/LOAD stay visible and clickable. RESUME below slots. |
| `shared-contract.md` **43**, **109**, **166** | Interrupt remainder keeps named SAVE/LOAD. Non-pick: resume-only remainder / hide SAVE/LOAD **Forbidden**. |
| `shared-contract.md` **95**, **201** | Remainder hint does not dump via L/ESC. L/ESC keep the desk. |
| `shared-contract.md` **216** | PR1 lands interrupt panel keeps SAVE/LOAD; does **not** land resume-only remainder. |
| `docs/Ctl03BerthFreezeDesign.md` **47**, **197**, **205**, **232**, **240**, **282–284**, **310**, **319** | Desk stays; SAVE/LOAD stay; do **not** shrink to a resume-only card; hide LOAD **Forbidden**. |

Worker claims match merge law. Prior designer close rule is met: contract dropped the allow-shrink clause **and** explicitly keeps SAVE/LOAD on the remainder.

**Status:** **closed** in the markdown freeze. Live chrome still has no RESUME (`save.js` 1503–1517) — expected until PR1.

### Current-state leftover (live `src/`, expected until PR1)

These are **not** markdown-freeze closures. Census still wins. PR1 must land copy **with** hold (`shared-contract.md` 207).

| Surface | Live | Cite |
|---|---|---|
| Hint | `L or ESC to close — records hold while you fly` | `save.js` **1377** |
| Header comment | “the game keeps running underneath” | `save.js` **38–42** |
| Close | KeyL / Escape always `setBerthOpen(false)` | `save.js` **1503–1517** |
| Resume control | **absent** | — |
| `berthHold` | **absent** | contract §0.1 |
| LOAD vs pause | refuse only `flags.paused` | `save.js` **1420** |

Inbox: a save/load screen must be a safe place to stop. Live hint tells the player the world keeps flying. That lie is the leftover the freeze names. It is **not** a remaining freeze Blocker.

### Findings

No 🔴 Blocker. No 🟠 Major.

#### 🟡 Minor: Later RESUME hierarchy and contrast are unspecified beyond “below slots”

**Location:** Resume control `shared-contract.md:97`, **18** (create-once); design **204**; live SAVE/LOAD `save.js:1466–1479` (`padding:4px 12px`); hint `save.js:1378` `#5f7185` / `font-size:11px` on `#0a101b`.

**Issue:** Freeze now names placement (**below** SAVE/LOAD, more prominent than slot SAVE) and the reason line. Slot SAVE/LOAD are compact `screen-btn`s. A same-size RESUME can still look like another slot action unless PR1 gives it full-row weight. Hint `#5f7185` on the dark panel is ~3.8:1 at 11px (below WCAG AA for small text). The longer PR1 remainder sentence still uses that pair. `body.rw-contrast` restyles `.screen-overlay` (`screens.css` 569–582); berth chrome is inline on `#rw-berth-records`, so contrast class does not lift the hint.

**Fix:** Full-row `RESUME` under the reason line, `screen-btn` (inherit `:focus-visible`). Optional `screen-btn-warm` only if playtest shows it as a threat-amber continue — default keep cold `screen-btn` so it does not look like launch. Do not invent a settings checkbox. Optional slightly brighter hint (`#9fb2c6` already used on slot labels `save.js` 1457) in skippable PR2.

**Status:** nice to have for PR1 chrome; not a freeze hole. Not a live hole until the button exists.

#### 🟡 Minor: Bare `RESUME` shares a verb with the pause banner

**Location:** Button literal `shared-contract.md:97`; pause `main.js:163` `PAUSED — P to resume`; remainder hint `shared-contract.md:95`.

**Issue:** Hold must not be KeyP. Remainder hint says `This is not Pause (P).` The control is still the same English verb as pause-to-resume. If the player also taps P, berth z 60 covers the pause banner; LOAD then fails silent (`save.js` 1420) with no extra berth copy.

**Fix:** Keep the Pause sentence on the remainder (already frozen). Prefer reason-line verbs already frozen (`RESUME continues that leg` / `that jump`). Optional label `RESUME LEG` / `RESUME JUMP` if a single button must serve both — still no Digit, no KeyP, no window Enter. Do not reuse title `CONTINUE`.

**Status:** open — naming, not a missing control. Hint already splits Pause vs hold. Not a Major.

#### 💡 Suggestion: Move focus to RESUME when the remainder appears

**Location:** later RESUME button (not live); live close blur `save.js:1398–1404`.

**Issue:** Keyboard reach is a native button in tab order. Tab from SAVE/LOAD can find it. Nothing says to focus RESUME when interrupt close keeps the dialog. Enter-as-only-resume is already forbidden.

**Fix:** `resumeBtn.focus()` once on remainder paint. No focus trap. Keep close blur on true close / LOAD.

**Status:** optional PR1 polish.

#### 💡 Suggestion: Do not add a second mute on SAVE/LOAD for hold

**Location:** live mid-jump refuse toast `save.js:1421–1423`, **1534–1537**; empty LOAD `disabled` **1497–1498**.

**Issue:** Buttons stay enabled, then toast. Hold must not add a second disabled style that looks like Pause-gated LOAD.

**Fix:** Keep live toast + empty `disabled`. Hold is not a disable reason. Do not hide the buttons on interrupt.

**Status:** out of scope except as a negative (do not).

### Accessibility checklist (later PR1)

- [x] Open (no interrupt) names L / ESC to close
- [x] Interrupt remainder does **not** claim L/ESC dumps to live flight
- [x] SAVE/LOAD stay named buttons on interrupt (Major closed)
- [x] Resume named in text (not color-only), below slots
- [x] No new Digit
- [x] No window-level Enter bind (native focused button Enter is ok, not only path)
- [x] `textContent` / `el()` only
- [x] Dialog `aria-label` stays Berth Records
- [x] Hail/chart not paused; they keep their own close names
- [x] Aim-glass gauges stay off; no hub pip
- [x] `reducedMotion`: no new hold motion

### Worker self-audit vs this pass

| Worker claim (`out/w124/berthfreeze/ui-audit.md`) | This pass |
|---|---|
| Hint lie 🔴 resolved in contract literal | Agree the **literal is frozen**. Live string at `save.js:1377` stays until PR1. Not a remaining freeze Blocker. |
| Missing resume 🟠 resolved | Agree a named `RESUME` + reason lines are frozen. L/ESC keep the desk. |
| Resume-only remainder 🟠 resolved | **Agree — Major closed.** Panel stays; SAVE/LOAD stay; RESUME below slots. Shrink language is forbid-only. |
| Remainder hint 🟡 resolved | Agree the interrupt literal is frozen and does not dump to flight. |
| LOAD vs Pause copy 🟠 resolved | Agree remainder hint names not-Pause. Bare `RESUME` vs `P to resume` stays a **Minor**. |
| Keyboard reach 🟡 accepted | Agree. Optional focus-on-paint stays a Suggestion. |
| Hint contrast 🟡 accepted | Agree; still applies to the longer PR1 remainder sentence. |
| “No remaining Blocker/Major in the markdown freeze” | **Agree** this re-review. |

### Re-review close

Designer Major (resume-only remainder hides LOAD) is **closed**. Do not claim live hint/resume are gone from `src/`. PR1 still must land the hint rewrite with hold, keep SAVE/LOAD on interrupt, and put RESUME below slots.
