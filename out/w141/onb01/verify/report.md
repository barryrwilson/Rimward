## Status
CLEAN

## What I tested
- Recheck after freeze fold of two designer Majors. Domain: data. Did not start Vite, Chrome, Playwright, or CDP. Did not run formatters or the full suite. Did not write `src/`.
- Pack files: `docs/Onb01FlightLessonDesign.md`, `out/w141/onb01/current-onb01-flight-lesson-inventory.md`, `shared-contract.md`, `security-review.md`, `code-review.md`, `ui-audit.md`, `notes.md`. Designer evidence: `out/w141/designer/onb01-ui-audit.md` (cite only).
- Live census: `src/systems/onboarding.js` HINTS, `src/systems/hud.js` CONTROLS default, `src/ui/hud.css` tokens, `src/game/origins.js` overlay / `originChosen`. Code wins.

Mint laws (designer fold) **are** in both merge-law files:
- One `.rw-onboard-hint` with later `hud.css` tokens (scale, contrast, reduced-motion). Not inline-only. Not in the 80 px reticle. No second list.
- Same node: `role="status"` `aria-live="polite"` `aria-atomic="true"`. Not a modal. `pointer-events: none`.
- CONTROLS `aria-expanded` from the collapse flag on **init, click, and combat collapse**.
- Cites: design Honor + deputize + neighbours + PR1 (`docs/Onb01FlightLessonDesign.md`); contract §0.11–0.13, §0.1, §1 write-set, §2 partial merge, §3 PR1 (`shared-contract.md`). Contract wins.

Worker write-set is markdown only. `src/systems/onboarding.js` is clean vs HEAD. Dirty `src/` (`hud.js` dock-slow / mining-ore, `hud.css` `.rw-slow-lamp`, `origins.js`, `controls.js`, `save.js`, `main.js`, `boot-test.mjs`, …) is sibling / other Wave work. This pack did not land JS or CSS.

Leftover vs live (CONSUME needs **both** a sequential post-pick lesson **and** on-demand encyclopedia):
- HINTS: 8 rows (`onboarding.js` 36–68). One at a time after dismiss (137–153). First row `move` waits `ctx.world.time > 20` and dumps four binds (37–39). No `look` / `throttle` / `target` / `hail` / `chart` ids. `dock` is range-gated (40–50), not origin-gated.
- Hint DOM: one `.rw-onboard-hint` on `document.body` with inline `font-size:11px;color:#6ff2e0` (81–88). No `role` / `aria-live` / `aria-atomic`. Paint `el.textContent` (102). No `innerHTML`.
- `world.time` does not tick while `ctx.flags.paused` (`main.js` 158–160). Overlay pauses (`origins.js` 100) and unpauses on choose (132).
- CONTROLS: `controlsCollapsed = false` (`hud.js` 1290). Toggle label `CONTROLS ▾` (1280). **No** `aria-expanded` in live `hud.js`. 19 authored lines (`controls.js` 590–608). CSS hide only with class `collapsed` (`src/ui/hud.css` 1214). Combat later collapses class + label only (2246–2249).
- Tokens: `--rw-text-scale` / contrast / reduced-motion still target `#hud` (`hud.css` 9–31, 1243–1264, 1271–1277). No `.rw-onboard-hint` rule in live CSS.
- Persist: `seen` push on SHOW (104); `WORLD_FIELDS` includes `'onboarding'` (`save.js` 90–91). Mute `ctx.settings.hints` (`src/core/ctx.js` 248; `settings.js` 35, 46).
- Origin: Digit1–5 until pick (`origins.js` 153–159). `originChosen` toast `✦ ` + line (`hud.js` 662–663). Park `(+40,+10,+60)` ≈ 72.8 u (`origins.js` 46) vs `U.DOCK_RANGE` 45 (`state.js` 30; `src/systems/station.js` 6494–6495). Not in zone at park. `originChosen` is not a flight lesson.
- WAVE6 still keys id `move` / fragment `throttle` (`scripts/boot-test.mjs` 1719–1750). Pack names later retarget; this wave does not edit the harness.

CONSUME would be wrong: encyclopedia dump is live; sequential look → throttle → target → hail → dock → chart after pick is not live. Leftover **REAL**. Named serial **PR1**. Serial is **not** none.

Honor freeze matches live and the contract:
- HUD-01 80 px hub kept empty (`hud.js` 1555). Kit mutate omit. `state.js` READ-ONLY (not in this pack; not dirty).
- KeyH hail / KeyJ dock (`controls.js` 518–522, 602); KeyD strafe (27, 592); KeyM chart (`galaxychart.js` 1321); KeyP pause (`main.js` 174–186, encyclopedia 608); KeyL berth (`save.js` 1620, encyclopedia 607).
- Digit 0/8/9 not in `controls.js`. Digit1–5 origin until pick then weapon groups (548–563).
- Persist reuse `seen`. No optional-PR2 steal. No pad 2B. No in-repo LLM.
- No sibling Org01/Ctl05 steal from this pack (`origins.js` not in later write-set; encyclopedia stays HUD toggle). Siblings `out/w141/org01/**` and `out/w141/pause/**` exist as other workers.
- Wishlist lines 96–101 still INBOX; this pack did not edit `docs/PLAYER-EXPERIENCE-WISHLIST.md` or `PROGRESS.md` (those trees are dirty from sibling work; diffs do not name Onb01).
- Overlay mutex: `overlay-policy.js` 4 never writes `flags.paused`. Onboarding never writes `paused`.

Later write-set named only: `onboarding.js` HINTS + skip + live-region attrs, `hud.js` default collapse + `aria-expanded` + reparent, **`src/ui/hud.css` hint tokens**, WAVE6 retarget with PR1. Does **not** claim `origins.js`. Partial merge requires collapse + lesson + tokens + live region + `aria-expanded` together.

Worker did not write `out/w141/onb01/verify/**` (this pass overwrites it).

Non-blocking cite nits (do not invert leftover REAL):
- Inventory says `ctx.js` **248** and `hud.css` **1214**. Live paths are `src/core/ctx.js` and `src/ui/hud.css`. Line numbers match.
- Inventory dock-zone cite `station.js` **6494–6495** is `src/systems/station.js`.
- `code-review.md` summary still says write-set “`onboarding.js` + HUD collapse + WAVE6” in one sentence. Pass 3 and the contract include `hud.css`. Contract wins.
- `origins.js` cites include uncommitted sibling Org01 `originsApi` (`closedOriginsApi` 87–92). Census of the live working tree, not an Onb01 `src/` write.
- Dirty `hud.js` / `hud.css` is dock-slow lamp + mining-ore (sibling). Not the Onb01 lesson.

## Bugs found
None. Leftover is REAL. Named serial is PR1. Designer mint laws are in the design doc and the contract. CONSUME would be wrong while the encyclopedia starts expanded and the six-step post-pick lesson is missing.

## Environmental issues
None. No worker process. No Vite. No Chrome.
`graph_resolve` returned `proceed_unmodeled` (no active workflow met the threshold). Parent assignment is this data census. No automation and no browser were used.

## Evidence
- `C:\Projects\WebSim\out\w141\onb01\verify\report.md`
- `C:\Projects\WebSim\out\w141\onb01\verify\write-set.txt`
- Live: `onboarding.js` 29, 36–68, 81–88, 102–108, 113–154; `hud.js` 319–324, 662–663, 1236–1240, 1276–1295, 1485–1497, 1555, 2246–2249, 2600–2609; `controls.js` 27, 38, 518–522, 548–563, 590–608; `origins.js` 42–49, 94–133, 153–159; `state.js` 30, 742–767, 1068–1069; `save.js` 90–91, 1620; `main.js` 98–99, 137–144, 158–160, 174–186; `src/ui/hud.css` 9–31, 782–789, 1179–1214, 1243–1277; `src/systems/station.js` 6494–6495; `overlay-policy.js` 4; wishlist 96–101; `boot-test.mjs` 1719–1750.
