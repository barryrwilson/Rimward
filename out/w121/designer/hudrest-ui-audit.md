# UI Audit: HUD remaining-feedback leftover (Wave 121 CONSUME)

**Auditor:** `[designer]` (independent of `out/w121/hudrest/ui-audit.md`)
**Scope:** Wave 121 leftover census. Markdown only. Worker did **not** change live UI. Freeze leftover **CONSUME**: remaining HUD-04-class feedback leftover is **gone**. Toast linger / AUTOSAVE HELD stay Wave 120. Banner, `commLine`, and onboarding are **not** a second flood channel. Named serial: **none**. Specified later UI: **none**.
**Review file:** `out/w121/designer/hudrest-ui-audit.md`
**Method:** `C:\Users\barry\.grok\skills\orchestrator\assets\designer-persona.md` + `C:\Users\barry\.grok\skills\orchestrator\references\ui-audit.md`. Pack: `docs/Hud05RemainingFeedbackDesign.md`, inventory `out/w121/hudrest/current-hud-feedback-inventory.md`, worker self-audit `out/w121/hudrest/ui-audit.md` (read, not copied), merge law `out/w121/hudrest/shared-contract.md`. Live cites in `src/systems/hud.js`, `src/ui/hud.css`, `src/systems/onboarding.js`, `src/game/save.js`, `src/game/npc-fire-toast.js` only as needed. No Playwright. No Vite. No Chrome. Did not spawn children (owner task). [NO BROWSER COVERAGE].
**Date:** 2026-08-25
**Product source:** review only (no `src/` / `scripts/` / integrator-doc edits)

Merge law: `out/w121/hudrest/shared-contract.md` wins if the brief forks. This wave does not ship HUD chrome. Findings bind **later workers**: do not invent a sixth chip, a hint live region, a hub pip, or a linger retune while HUD-04 already ships.

## UI Audit: remaining HUD player-facing feedback (CONSUME)

### Summary

No product UI ships this wave. The pack freezes leftover as **CONSUME**: five-chip linger, expire `aria-hidden`, AUTOSAVE HELD vs SAVE BLOCKED, one arrival banner, one persist-once hint, `commLine` on the **same** `pushToast`. Census against live code holds. CONSUME does **not** hide a second unnamed toast stack. No 🔴 Blocker. No 🟠 Major.

### Verdict

**CLEAN.** 0 blockers, 0 majors, 2 minors (accepted; not leftover holes), 2 suggestions. CONSUME freeze holds.

### What's done well

- Five `.rw-toast` chips stay top-right, off the 80 px aim column (`hud.css` 635–646 vs 184–193). `pointer-events: none` is correct: chips are output, not controls.
- Only one `pushToast` allocator (`hud.js` 1186–1213). `commLine` maps through `toastForEvent` (`560–568`) into that same stack. Same-frame `frameLines` still skip duplicate clue/Echo lines (`1225`, `560–568`).
- Linger is a five-row `{ key, lastShown }` ring, not chip-tied (`hud.js` 531–555, 849–854). Identical visible refresh extends `until` and does **not** rewrite `textContent` (`1190–1195`). Expire removes `show`, sets `aria-hidden=true`, keeps text and `slot.key` (`1238–1244`). CSS hide agrees: `.rw-toast:not(.show) { visibility: hidden }` (`hud.css` 734).
- Color is not the only cue. Glyph prefixes stay (`▲` / `✧` / `■` and siblings). Autosave vs berth is **text**: `▲ AUTOSAVE HELD — hostiles near` vs `▲ SAVE BLOCKED — ` + reason (`hud.js` 596–600). Emits still send `source: 'autosave'` / `'berth'` (`src/game/save.js` 1040, 1422, 1428, 1535, 1540).
- Stack a11y: `role=status` `aria-live=polite` (`hud.js` 844–847). Boot chips `aria-hidden=true` (`851–852`). Real show unhides **then** writes `textContent` (`1209–1211`). No `aria-live=assertive` under `src/`.
- Arrival is one `.rw-banner` card, 4 s, `textContent`, `pointer-events: none`, overwrite in place (`hud.js` 858–863, 694–715, 1247–1265). Jump names are not a five-row flood ring.
- Onboarding is one `.rw-onboard-hint`, eight authored ids, persist `seen`, KeyO `hints` off, 8 s or key dismiss (`onboarding.js` 29, 36–68, 81–105, 107–139; `settings.js` 46). Teaching queue, not a toast ring.
- Overlay cards stay above `#hud` z 10 (`style.css` 24–29). Freeze forbids a toast z raise. Digit 0 stays shipyard; Digit 8/9 stay launch / epics (`station.js` 188, 6032–6038, 6169–6176). Empty hub stays empty. RANGE stays hidden (`hud.css` 207–208).
- Reduced motion already kills banner/toast transition (`hud.css` 1184–1189). Contrast restyle already includes `.rw-toast` and `.rw-banner` (`1168–1176`). Do not invent motion.
- Worker self-audit agrees: flood leftover is gone; banner/commLine/onboarding are not a second flood UI; later chrome is **none**.

### CONSUME steal check (Blocker if the brief scheduled these)

| Forbidden later work | Brief / freeze | Live honor | Result |
|---|---|---|---|
| Sixth toast slot | Serial **none**; contract §0.12 | `TOAST_SLOTS` 5 (`hud.js` 65, 850–855) | **Pass.** Not scheduled. |
| Linger retune / AUTOSAVE HELD rewrite | HUD-04 cite-only | `TOAST_DEDUP_WINDOW` 8 (`hud.js` 66); copy `597–598` | **Pass.** Wave 120 stays. |
| Second unnamed `.rw-toast` allocator | Inventory §0.1 / §6 | Only `pushToast` in `hud.js` | **Pass.** |
| Hint `aria-live` / extra live region / assertive | Contract §0.11 | Hint has none; banner already polite `860`; toast polite | **Pass.** Do not add. |
| Fold banner into toast ring | Honor arrival chrome | One `.rw-banner` (`858–863`) | **Pass.** |
| Hub pip / aim-glass gauge | HUD-01 80 px | `.rw-reticle` 80×80 (`hud.css` 184–193) | **Pass.** |
| Digit 0/8/9 theft / new Digit | Honor | shipyard / launch / epics (`station.js` 188, 6171–6176) | **Pass.** |
| Raise toast z / hail toast | Overlay sibling | `#hud` z 10; no hail toast added | **Pass.** |
| Chart-label a11y write | NAV-07 sibling | Cite only; do not write `galaxychart.js` | **Pass.** |
| Persist linger keys | Session only | Linger is RAM; onboarding `seen` already `WORLD_FIELDS` (`save.js` 83–84) | **Pass.** |
| `innerHTML` event copy | Forbidden | `el()` `textContent` (`hud.js` 283–288); none in `hud.js` / `onboarding.js` | **Pass.** |
| Pause sim on flood | Fail-closed | Pause is KeyP overlay (`main.js` 160–176) | **Pass.** |

If a later worker adds a sixth chip, a hint live region, a hub pip, linger retune, or `innerHTML` toast copy, that **violates this freeze** and is a Blocker then. This pack does not schedule that work.

### Does CONSUME hide a real flood leftover?

**No.** Player-facing HUD-04-class flood is the five-chip toast stack. Live linger already covers identical `cls|text` for 8 s, including `commLine` and `saveBlocked`. Distinct rotating refuse lines are new information, not identical-copy flood. Banner is one 4 s system-name card. Onboarding is one persist-once teaching line. Pause and station-notice are overlay siblings, not a HUD toast ring. Chart / nav `aria-live` regions are instruments or NAV-07/NAV-05 siblings.

Wishlist FEEDBACK “identical encounter / autosave flood” is **stale vs code**. Treating that row as missing chrome would invent work. Code wins.

`npcFire` 2.5 s gaps stay in `src/game/npc-fire-toast.js` (`DART_TOAST_GAP` / `FIRE_TOAST_GAP` 10–11, 49, 62). Linger still applies if copy matches. Keep. Not leftover.

### Freeze confirmation (later serial)

| Surface | Live | Spec freeze | Later serial |
|---|---|---|---|
| Five `.rw-toast` chips | linger 8 s, expire `aria-hidden` | HUD-04 landed | **Must not** retune 8 s / 5 slots / AUTOSAVE HELD |
| `commLine` | `toastForEvent` → `pushToast` | Same channel | **Must not** add a parallel comm paint |
| `saveBlocked` | autosave vs berth **text** | Wave 120 | **Must not** merge copy |
| Arrival `.rw-banner` | one node, 4 s | Not flood | **Must not** fold into chips; **must not** name `aria-hidden` serial |
| Onboarding hint | one line, persist `seen`, KeyO | Not flood | **Must not** add `aria-live` as leftover |
| Context `.rw-prompt` | one verb | Not stack | **Must not** toast-ify |
| Jump `.rw-jump` | charge bar | Instrument | **Must not** toast-ify |
| AP/AM chips | status | NAV/automine | **Must not** steal |
| Pause overlay | `PAUSED — P to resume` | Overlay | **Must not** treat as HUD toast |
| Station notice | dock `aria-live` polite | Overlay | **Must not** steal |
| Chart / dest | sibling | NAV-07 | **Must not** write `galaxychart.js` |
| Empty hub | 80 px | HUD-01 | **Must not** add a feedback pip |
| `#hud` z | 10 | Overlay mutex | **Must not** raise |

### Accessibility / theming / states (live HUD, static)

| Check | Result |
|---|---|
| Contrast / tokens | Toast classes use `--cyan` / `--amber` / `--red` / `--green`. Contrast override live (`hud.css` 1168–1176). No new leftover chrome color. |
| Keyboard | Toasts are not controls (`pointer-events: none`). Hint dismiss is any `keydown` (`onboarding.js` 107–108). KeyO still settings. |
| Names | Visible English + glyph on toast copy. AUTOSAVE HELD vs SAVE BLOCKED is readable without color. |
| Focus | Toasts/banner/hint are not focus targets. Correct. |
| Semantic HTML | Toast root `role=status`. Banner is a polite region without `role=status` (existing arrival instrument). Hint is a visual `div`. |
| Empty | Hidden chips `aria-hidden` + `visibility: hidden`. Prompt `is-hidden` when no verb (`hud.js` 2221–2231). |
| Error | Warn/danger class + glyph + words. Storage full stays silent (`save.js` 1546–1548) — fail-closed, not a flood hole. |
| Disabled | N/A (output). |
| Loading | No spinner. Do not add one. |
| Hover | Not required. |
| Reduced motion | Existing HUD kill (`hud.css` 1184–1189). Do not invent fade. |
| Responsive | Five chips wrap as a column `align-items: flex-end`. Banner `white-space: nowrap` is existing arrival chrome — do not retune as leftover. |
| Hub | 80 px stays empty of feedback chrome. |

### Findings

No 🔴 Blocker or 🟠 Major.

#### 🟡 Minor: Onboarding hint has no accessible name / live region

**Location:** `src/systems/onboarding.js:81-105`

**Issue:** `.rw-onboard-hint` is visual `textContent` only. Screen readers may miss the teaching line.

**Why it is not leftover:** HUD-04 forbade **adding** a live region as toast leftover. Contract §0.11 forbids a second region as HUD-05. One persist-once hint is not toast-flood.

**Fix:** Do **not** name HUD-05 PR1. Owner may file a later a11y idea in the inbox (other worker).

**Status:** accepted — not leftover; CONSUME stands.

#### 🟡 Minor: Banner polite region keeps faded text

**Location:** `src/systems/hud.js:860`, `1262-1264`

**Issue:** Fade is opacity (remove `.show`). No `aria-hidden`. Stale system name can remain in the polite region after 4 s.

**Why it is not leftover:** One-shot arrival, not a five-row flood. Toast PR1 already covered the **stack** expire hole.

**Fix:** Do not invent a banner-`aria-hidden` serial. Do not fold the banner into toast chips.

**Status:** accepted — not leftover; CONSUME stands.

#### 💡 Suggestion: Pause overlay and station notice are not HUD toast UI

**Location:** `src/main.js:160-176`; `src/systems/station.js:6066-6068`

**Issue:** Other polite/visible status strings exist. They are pause and dock overlay.

**Fix:** Keep them out of HUD-05. Overlay mutex / dock UI are siblings.

**Status:** inventory already excludes them.

#### 💡 Suggestion: Sibling Galaxy Chart `aria-live` line cites in the inventory are stale

**Location:** inventory cites `galaxychart.js` 142, 317, 331; live `aria-live=polite` is `161`, `377`, `391`

**Issue:** Census told later workers to re-census if a serial moved a symbol. Chart AP/hover/status is **NAV-07 / NAV-05**, not this leftover. Stale sibling lines must not become a “fix remaining HUD feedback” PR.

**Fix:** Do not write `galaxychart.js` from this pack. If a later NAV census needs live lines, re-grep there.

**Status:** documentation nit — not a flood hole; CONSUME stands.

### Census cite check (code wins; shorthand paths)

| Claim | Live | Notes |
|---|---|---|
| `TOAST_LIFETIME` / `SLOTS` / `DEDUP` 4 / 5 / 8 | `hud.js` 64–66 | Match |
| Linger helpers | `hud.js` 530–555 | Match |
| `pushToast` / expire | `hud.js` 1186–1213, 1238–1244 | Match |
| Place / hide CSS | `hud.css` 635–646, 734 | Match |
| `saveBlocked` copy | `hud.js` 596–600 | Match |
| Autosave / berth emit | `src/game/save.js` (inventory `save.js`) 1040, 1422+ | Module is `src/game/save.js`, not `src/systems/save.js`. Lines hold. |
| `npcFire` 2.5 s | `src/game/npc-fire-toast.js` 10–11, 49, 62 | Inventory omits `src/game/`. Lines hold. |
| Digit 0 map | `station.js` 188, **6171–6172** | `6035–6036` is menu paint; handler is `6169–6176`. Honor still holds. |

None of the path shorthand issues reopen leftover. Do not treat them as HUD-05 work.

### Visual hierarchy

Toast stack vs one banner vs one hint vs one prompt are **four jobs**. CONSUME keeps that split. A sixth slot would flatten hierarchy and double-paint HUD-04.

### Worker self-audit

`out/w121/hudrest/ui-audit.md` is accurate on CONSUME, flood leftover gone, and “do not add a sixth chip / hint live region / hub pip.” Independent live read agrees. Do not copy that file as the designer record; this file is the parent `[designer]` pass.

### Verdict close

**CONSUME freeze is the UI-correct outcome.** HUD-04-class leftover is gone. Toast linger and AUTOSAVE HELD stay Wave 120. Banner / `commLine` / onboarding are not a second flood channel. Do not add chrome.
