# Wave 141 Org01 origin consequence preview — verify report (freeze recheck)

**Status:** CLEAN  
**Domain:** data (no Vite, no Chrome, no Playwright, no CDP, no `npm run test:boot`)  
**Graph:** `graph-engineering__graph_resolve` → `proceed_unmodeled` (`r-mtbpx83i-e20e1c5a`). Owner brief forbids Vite / Chrome. Browser workflow was not run. No `graph_approve` / `graph_propose`.  
**Processes started:** none.

## What I tested

1. Leftover REAL vs CONSUME vs named serial **PR1** after the designer-Major fold (must not reopen leftover).
2. Compact-first layout law in `docs/Org01OriginPreviewDesign.md` and `out/w141/org01/shared-contract.md` vs designer Major in `out/w141/designer/org01-ui-audit.md`.
3. Live `src/game/origins.js` still flavor-only before confirm (`textContent` row, footer, Digit/click, `applyEffects` after pick).
4. Honor: Digit1–5 map, `textContent`, no sibling steal, no `.screen-panel` / pause class claim.
5. Later write-set: `origins.js` + optional dedicated origin CSS only.
6. Worker pack vs `git status` / `git diff` (no Org01 `src/` land).

## Leftover / serial freeze

| Surface | Worker | Live code | OK? |
|---|---|---|---|
| Leftover | **REAL** | Overlay is flavor only before confirm | yes |
| CONSUME | **No** | Five inbox kinds missing before confirm | yes |
| Named serial | **PR1** | Not implemented in `src/` | yes |
| Serial none | **No** | Mechanical preview is absent | yes |
| Name | origin consequence preview before confirm | Matches inbox 126–130 | yes |
| Leftover reopened | **No** | Fold only names compact-first layout | yes |

CONSUME would need hull/equipment, money/debt, standings, danger, and experience on the overlay **before** Digit/click. Live rows are `` `[${i + 1}] ${name} — ${line}` `` only (`origins.js` **141**). Footer is permanence (**150**). `applyEffects` runs inside `choose` (**127**, **52–85**).

## Compact-first law (designer Major fold)

Designer Major (`out/w141/designer/org01-ui-audit.md`) is still marked open **in that review-only file**. The worker fold is in merge law, not in the designer file.

| Law | Design doc | Contract | OK? |
|---|---|---|---|
| Compact sublines first (≈10 px, dimmer, wrap) | Honor; §3; deputize; player outcome; acceptance | §0.21; §0.1 Layout (primary) | yes |
| Five Digit rows + preview in view at 620 px / 92vw | Honor; acceptance **1** | §0.21 | yes |
| `overflow-y` backup only | Honor; non-goals; PR1 table | §0.21; §0.1 Layout (backup) | yes |
| Dedicated origin list region | Honor; ownership | §0.21; write-set `.rw-origin-*` | yes |
| Do not steal `.screen-panel` / pause classes | Honor; non-goals; alternatives | §0.21; Layout (do not); PR1 does-not-land | yes |
| Do not shrink Digit labels | Honor (Digit stay) | §0.21 | yes |
| Overflow-only without compact fails PR1 | alternatives; partial merge | §2 | yes |
| Old “may overflow” as primary | **gone** (cite-only as prior) | **gone** as law | yes |

Greenhand `fear 0` is omitted in the deputized danger row (omit wins). Digit skip does not reindex. Those designer Minors are folded. They do not reopen leftover REAL.

## Cite spot-check (live code)

| Claim | Live | OK? |
|---|---|---|
| Overlay row flavor only **141** | `row.textContent = \`[${i + 1}] ${ORIGINS[id].name} — ${ORIGINS[id].line}\`` | yes |
| Footer permanence **150** | `'press 1-5 or click — this choice is permanent'` | yes |
| Title **121** | `'RIMWARD — who are you?'` | yes |
| Card 620 / 92vw; no max-height; no overflow **114–116** | yes | yes |
| `ORIGIN_IDS = Object.keys(ORIGINS)` **29** | line **29** | yes |
| Digit1–5 `e.code` **153–157** | `charCodeAt(5) - 49`; out-of-range return | yes |
| Click → `choose(id)` **144** | yes | yes |
| Listener remove on choose **126** | `window.removeEventListener('keydown', onKey)` | yes |
| Pause true at boot **100**, false on pick **132** | yes | yes |
| `applyEffects` **52–85** | credits, fear, reputation, bond, hunger, cargo, clues, `startSystem` | yes |
| No hull / kit in `applyEffects` | no `setHull` / miningLaser / launcher / turret writes | yes |
| `ORIGINS` **742–768** | greenhand `{}`; ledgerDebt `addCredits -1500` + rep; marked fear 15 + rep; beautiful bond/hunger/cargo; drifter credits 600 / fear 5 / `redmarch` / `rm_c_tally` | yes |
| Digit order | insertion order Digit1 greenhand … Digit5 drifter | yes |
| Credits default 350 `ctx.js` **174** | yes | yes |
| Ledger money 350 + (−1500) = **−1150** | yes | yes |
| Drifter `setCredits` **600** (replace, not add) | yes | yes |
| Hull light 100 / hold 20 `state.js` **38**; `systems/ship.js` **631** | `SHIP_CLASSES.light`; `createShipState('light')` | yes |
| Mk I index 0 `state.js` **83–88**; `ctx.js` **190** | `'Mining laser Mk I'`; `miningLaser: 0` | yes |
| Ranks: −10 Stranger, +10 Known, −15 Suspect | `RANK_LADDER` **714–721**; `rankFor` **722–725** | yes |
| Faction names | Freehold Compact / Red Ledger / Veridian Combine | yes |
| Systems | `freehold` → Freehold Drift **31–33**; `redmarch` → The Redmarch **93–95** | yes |
| Living rock ×2 | `COMMODITIES.livingRock.name` **355**; effects **761** | yes |
| Clue line **122** | `'A drifter\'s tally-board, …'` | yes |
| Persist `origin` `save.js` **91** | `'epics', 'origin', 'onboarding', 'aceRivalry'` | yes |
| Creditor tick `world.js` **1008–1026** | ledgerDebt calls / collector | yes |
| `ORIGIN_ARCS.ledgerDebt` | **1068–1098** | yes |
| `JUMP.graceSeconds` **588** | 60 | yes |
| AI-05 `npc.js` **169–175** | greenhand/beautiful 180; others 0 | yes |
| Init order `main.js` **138–139** | `initOrigins` then `initOnboarding` | yes |
| Title NEW GAME leaves origin pause **13–14**, **95–97** | yes | yes |
| Onboarding first hint `time > 20` **37–39** | yes | yes |
| WPN Digit skip while paused `controls.js` **117**, **548–562** | `shouldSkipWeaponGroupDigits` paused at **117**; Digit1–5 **548–562** | yes |
| Agent observe `'origin'` `src/game/agent-observe.js` **396–401** | `isOpen() === true` → `'origin'` | yes |
| `actChooseOrigin` **291–314**; closed **302** `no-service` | yes | yes |
| Toast `originChosen` `hud.js` **662–663** | yes | yes |
| Song swell `song.js` **107** | yes | yes |
| `innerHTML` in `origins.js` | grep 0 | yes |
| Digit1 greenhand / Digit5 drifter tests | `boot-test.mjs` **415** Digit1 greenhand; **2752** Digit5 drifter | yes |
| Station `.screen-panel` overflow `screens.css` **29–31** | cite only; write-set forbids reuse | yes |
| Wishlist INBOX **126–130** | still `[ ]`; not edited by this pack | yes |

## Derive vs new table

Contract §0.1 / §0.20 and the design freeze **derive** from live `ORIGINS.effects` + defaults. No `preview:` blob in `state.js`. `git status` does not list `src/game/state.js`. Deputized literals match live math (350 / −1150 / 600; shared light 100; Mk I). Experience words have no new UU.

Digit1–5 map is **not** remapped. Later PR1 is named as an authored id list in `origins.js` in the **same** order.

## Honor / write-set

| Rule | Result |
|---|---|
| Markdown only; no `src/` from this worker | **pass** — worker files are `docs/Org01OriginPreviewDesign.md` + `out/w141/org01/*.md` except `verify/` |
| Later write-set | **`origins.js`** + optional dedicated `.rw-origin-*` in `screens.css` |
| Not station / pause classes | **pass** — forbids `.screen-panel` / `.screen-overlay` / `.screen-btn` |
| Digit1–5 stay until pick | **pass** — freeze keep; live map unchanged |
| Overlay paint `textContent` | **pass** — live + later law |
| Wishlist / `PROGRESS.md` | **pass** — ORIGINS inbox still open; `PROGRESS.md` has no Org01 string |
| Onb01 / Ctl05 steal | **pass** — pack does not claim `onboarding.js` / pause chrome |
| Optional PR2 / pad 2B / in-repo LLM / NAV-11 | **pass** — named as out of pack |
| Kit mutate / new Digit / new persist / WORLD_FIELDS | **pass** — forbidden in freeze |
| KeyH hail, KeyJ dock/jump, KeyL berth, KeyM chart, KeyP pause, KeyD strafe | **pass** — freeze keep |
| HUD-01 empty hub / aim-glass off | **pass** — freeze keep |

Workspace `src/` is dirty from **other** Wave 141 work (`originsApi` on `origins.js`, title, HUD CSS, `screens.css`). `git diff -- src/game/origins.js` is `originsApi` only (closed API + `isOpen`/`choose`). No origin-preview rows. No `ORIGINS.preview` table. No `.rw-origin-*` in `src/`. This Org01 worker did not land `src/`.

## Notes (not bugs)

- Designer `org01-ui-audit.md` still labels the overflow Major **open**. That file is review-only. The fold lives in contract §0.21 and the design Honor. Do not treat the designer file as unfixed merge law.
- Beautiful cargo sits on the hull/equipment line in the deputize table; the general danger rule also names cargo. Design Q3 records the default (equipment/cargo line).
- `applyEffects` also writes `setBond` / `setHunger`. Inventory lists them. Overlay still does not preview them today.
- Inventory `ship.js` **631** is `src/systems/ship.js` (`createShipState('light')`). `createShipState` itself is `state.js` **167**. Hull numbers still come from `SHIP_CLASSES.light` **38**.

## Bugs found

None.

## Environmental issues

None. Browser workflow skipped on owner order (data leftover; no Vite / Chrome).
