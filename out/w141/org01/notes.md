# Wave 141 Org01 origin consequence preview notes

**Verdict:** leftover **REAL**. Name: **origin consequence preview before confirm**. Named serial: **PR1**. Not CONSUME. Named serial is **not** none. Name is **not** “no remaining Org01 leftover.”

## Method

- Did **not** call `graph_propose` / `graph_approve`. Local markdown only under `docs/Org01OriginPreviewDesign.md` and `out/w141/org01/**` except `verify/**`.
- Applied security / code / UI reviews **self** on the freeze (parent: do not spawn `[designer]`; do not start Vite/Chrome).
- Census live `src/game/origins.js` overlay, Digit1–5, click, `applyEffects`, `originsApi`.
- Census `ORIGINS` in `src/game/state.js` (read only) and `ORIGIN_ARCS` (cite only).
- Census defaults in `src/core/ctx.js`, `SHIP_CLASSES.light`, `MINING_LASERS[0]`, `RANK_LADDER`, `SYSTEMS` names.
- Census `world.js` ledger creditor tick (cite only; already shipped).
- Census `npc.js` `STARTER_GRACE_SECONDS` (cite only; AI-05 not this pack).
- Census `onboarding.js` / `main.js` order (Onb01 neighbour).
- Census `controls.js` Digit1–5 skip while `paused`.
- Census wishlist **126–130** (cite, do not edit).
- Re-dispatch: folded parent designer Major from `out/w141/designer/org01-ui-audit.md` (compact first; overflow backup). Did **not** reopen leftover REAL. Did **not** edit `out/w141/org01/verify/**`.
- Domain is **data**. Did **not** start Vite or Chrome. Did **not** claim ports. Did **not** write `src/`. Did **not** edit the wishlist or `PROGRESS.md`. Did **not** write sibling Onb01 / Ctl05 paths.

## Why REAL (not CONSUME)

CONSUME needed the overlay to already preview **all** of: starting hull and equipment, money/debt, faction standings, immediate danger, and recommended experience **before** confirm.

Live overlay is flavor only:

- `` `[${i + 1}] ${name} — ${line}` `` (`origins.js` **141**).
- Footer permanence (**150**).
- Effects apply **after** `choose` (**52–85**, **127**).

Hull/equipment/money/standings/danger/experience rows **are not** live. Permanence words are **not** mechanical preview. Do **not** CONSUME on flavor-well.

## Deputize (not parked)

| Knob | Freeze |
|---|---|
| Confirm | one Digit / click; preview already on the row |
| Rows | hull/equipment, money/debt, standings, danger, experience |
| Numbers | derive from `ORIGINS.effects` + defaults; no invented UU |
| Digit map | 1 greenhand … 5 drifter (authored list in `origins.js`) |
| `state.js` | read-only |
| Persist | none new |
| Fail-closed | skip unknown; omit missing effect; never throw; no Digit reindex |
| Layout | compact ≈10 px sublines first; overflow-y **backup** on dedicated origin list |
| Do not | steal `.screen-panel` / pause `.screen-btn`; overflow as the only fit |

## Later write-set (do not edit now)

- `src/game/origins.js` overlay paint + skip.
- Optional `src/ui/screens.css` dedicated `.rw-origin-*` compact sublines + backup list overflow (not `.screen-panel`).
- Do **not** claim `state.js`, `world.js`, `npc.js`, `onboarding.js`, pause chrome, `hud.js`, `controls.js`, `agent-api.js`.

## Coupling (do not steal)

- **Onb01** first-minute flight lesson (sibling Wave 141). Both are first-minute. Live order is origins **then** onboarding (`main.js` **138–139**). Org01 later write-set is **`origins.js`** (+ optional `screens.css`). Onb01 is expected to own **`onboarding.js`**, not the origin overlay. **If later both packs need `origins.js`, parent must sequence the impl wave.** Org01 must not delay the overlay for a lesson. Onb01 must not steal Digit1–5 while the overlay is open.
- **Ctl05** pause menu (sibling Wave 141). Origin overlay already pauses. Do not restyle KeyP chrome as origin preview.
- Origin-arc creditor calls: shipped in `world.js`. Preview names live debt. Does not retune Dresk.
- AI-05 grace: cite only.
- Wave optional PR2s (Hail01 / HUD-06 / Hail02 / HUD-07 / NAV-09 / NAV-10 governor / TGT-07 stills / MSN-04 other families / CTL-03 / AI-05 / CTL-04).
- Agent pad 2B. In-repo LLM. NAV-11 serial none.

## Reviews

Security HIGH (XSS names/lines, prototype origin ids, persist mute, uncaught throw on overlay paint, Digit steal after pick) **resolved in freeze**. Code Blocker/Major **resolved in freeze** after REAL/PR1, derive-not-table, one-press, Digit map kept, compact-first layout. UI: live flavor-only stays later mint (accepted REAL). Designer Major (overflow / no keyboard read path) **folded**: compact sublines primary; overflow backup; no `.screen-panel` steal.

## Re-review

After parent designer pass: leftover REAL **not** reopened. Compact-first layout law named in Honor + contract §0.21. Greenhand `fear 0` omitted (omit wins). Digit skip does not reindex. No new HIGH/CRITICAL. Did not start Vite/Chrome. Did not write `out/w141/org01/verify/**`. Did not edit sibling Onb01 / Ctl05.

## Graph

Owner write-set is local files. Did not bind Drive publish. Did not `graph_propose` / `graph_approve`.
