# Org01 origin consequence preview shared contract

**Wave:** 142. This worker **implements PR1** (consequence rows on the origin overlay before Digit/click confirm).  
**Status:** MERGE LAW for `docs/Org01OriginPreviewDesign.md`. If that document and this file ever disagree, **this file wins**.  
**Leftover:** **REAL.** Not CONSUME. Serial is **not** none. Named serial: **PR1** (consequence rows on the origin overlay before Digit/click confirm).  
**Name:** each permanent origin shows starting hull and equipment, money/debt, faction standings, immediate danger, and recommended experience **before** confirmation.  
**This wave write-set:** `src/game/origins.js`, `src/ui/screens.css` (dedicated `.rw-origin-*` only), `docs/Org01OriginPreviewDesign.md` (status / impl note only), `out/w142/org01/**` except `verify/**`. Do not edit `docs/PLAYER-EXPERIENCE-WISHLIST.md`, `PROGRESS.md`, `docs/Onb01FlightLessonDesign.md`, `docs/Ctl05PauseMenuDesign.md`, `docs/Ai05StarterGraceDesign.md`, `docs/Ctl*.md`, `docs/Hud0*.md`, `docs/OwnerDecisions*.md`. Do not steal Onb01 / Ctl05. Do not steal Hail01 / HUD-06 / Hail02 / HUD-07 / NAV-09 / NAV-10 governor / TGT-07 stills / MSN-04 other families / CTL-03 / AI-05 / CTL-04 / pad 2B / in-repo LLM. NAV-11 serial none. Do not write `out/w142/org01/verify/**`. `src/game/state.js` is READ-ONLY.

**Locked sources:** wishlist INBOX (P2, ORIGINS) Playtest capture 2026-08-25 lines **126–130** (cite, do not edit); live inventory `out/w141/org01/current-org01-origin-preview-inventory.md` (code wins). Wave-6 origin overlay first. Origin-arc creditor calls already shipped (`world.js` / `ORIGIN_ARCS`) — **cite only**.

Integrator rule: a **later** implementation wave obeys this file. Inventory cites live code. Code wins.

**This leftover is origin consequence preview.** It is **not** the first-minute flight lesson (Onb01). It is **not** the pause menu (Ctl05). It is **not** origin-arc creditor calls. It is **not** AI-05 starter grace.

**Live hole:** overlay paints `[n] ${name} — ${line}` only (`origins.js` **141**). Footer is permanence (`origins.js` **150**). `applyEffects` mutates credits / fear / reputation / bio / cargo / clues / startSystem **after** pick (**52–85**). No hull, equipment, money, standings, danger, or experience rows exist **before** confirm. Flavor is live. Mechanical preview is **not**. **Leftover is real. Not CONSUME. Serial is not none.**

---

## 0. Orchestrator merge law (do not weaken)

1. This worker **implements PR1** in `src/game/origins.js` (+ optional dedicated `.rw-origin-*` in `src/ui/screens.css`). Honor / fail-closed / deputize below still bind. Do **not** land PR2 stills or PR3 two-step confirm.
2. HUD-01 empty **80 px hub**. Aim-glass gauges stay off. Kit mutate omit. Digit **0 / 8 / 9** stay station **after** pick. Digit **1–5** stay origin **until** pick (wave-6 contract: origin overlay first). **No new Digit.** Do **not** change which Digit picks which origin.
3. KeyH stays hail. KeyJ stays dock/jump. KeyL stays berth. KeyM stays chart. KeyP stays pause. KeyD stays strafe. **Do not remap those keys.**
4. `innerHTML` forbidden later. Overlay paint stays `textContent`. **No** `insertAdjacentHTML` / `document.write`. Name, line, preview rows: `textContent` only.
5. `src/game/state.js` is READ-ONLY this wave **and later** unless census proves a tiny authored preview table is required. Prefer **derive** from existing `ORIGINS` effects + live defaults. Default persist **none** new. Do **not** invent UU. Do **not** invent SKU. Do **not** invent Digit. Do **not** add WORLD_FIELDS. Choice still writes `ctx.world.origin` as today.
6. Overlay mutex: origin overlay already sets `ctx.flags.paused = true` at fresh boot (`origins.js` **100**) and clears it on pick (**132**). Later PR1 **keeps** that live pause. Hail / chart / berth **never** write `paused` (CTL-02). Org01 does **not** steal KeyP pause chrome (Ctl05). CTL-03/04 not this pack. CTL-04 menu digits **cite only** — do **not** steal PR2 `fireHeld`.
7. Digit mapping stays: **greenhand, ledgerDebt, marked, beautiful, drifter** → Digit1–5 (live `Object.keys(ORIGINS)` **29**, **136–157**; `state.js` **742–768**). After pick the keydown listener **removes itself** (**126**). Digit1–5 then stay weapon groups (`controls.js` **548–562**). **Do not steal Digit after pick.** Later PR1 iterates an authored id list **in `origins.js`** with that **same** order (fail-closed vs `Object.keys` proto pollution). Do **not** reorder. Do **not** put that list in `state.js`.
8. Do **not** steal Onb01 flight lesson. Origin overlay still opens **before** onboarding (`main.js` **138–139**). Do **not** delay the overlay for a lesson.
9. Do **not** steal origin-arc creditor calls. `ORIGIN_ARCS.ledgerDebt` and `originArcTick` stay `world.js`. Preview may **name** live debt (negative credits). It must **not** retune call interval, collector, or rep-per-call.
10. Do **not** steal AI-05. `STARTER_GRACE_SECONDS` and `JUMP.graceSeconds` stay. Preview must **not** retune grace. `jumpGraceUntil` stamp on pick stays (`origins.js` **129**).
11. Do **not** steal sibling Wave 141 packs (Onb01, Ctl05). Do **not** steal optional PR2s listed as Hail01 / HUD-06 / Hail02 / HUD-07 / NAV-09 / NAV-10 governor / TGT-07 stills / MSN-04 other families / CTL-03 / AI-05 / CTL-04, or Agent pad 2B, or in-repo LLM. NAV-11 serial none.
12. Fail closed:
    - Unknown origin id → **skip** that row; do **not** crash; do **not** throw. Skipped id does **not** reindex remaining Digit labels (Digit1 stays Greenhand even if a hole is skipped).
    - Never throw from overlay paint.
    - Missing effect field → **omit that preview row**, not crash.
    - `choose` / Digit / click: `typeof id === 'string'` and `Object.hasOwn(ORIGINS, id)` and the record is a non-null object with `name` / `line` / `effects` object (effects may be `{}`). Else skip / return `'unknown'`.
    - Prototype / reserved keys (`__proto__`, `constructor`, `prototype`): skip.
    - Never `for-in` an origin blob onto `world`.
    - `applyEffects` missing `ORIGINS[id]`: do not throw; do not write `ctx.world.origin`.
    - Sanitize / persist caps **unchanged**.
13. `reducedMotion`: **no** new animation that ignores it. Color is not the only cue (Digit index + name + labeled preview **words**). Do **not** make danger color-only.
14. Accessibility: origin rows stay keyboard Digit1–5 **and** click. Focus / hover must not be color-only. Footer keeps permanence words. Preview must stay readable with **keyboard Digit1–5** and **without** mouse-only scroll as the primary path.
15. CPU: overlay is init + click/keydown only. **No** per-frame DOM. Do **not** add a resize observer / animation frame for preview.
16. Prototype-safe: authored `ORIGINS` keys only for row identity.
17. Do not “fix” known REDMARCH `castMatches` flake.
18. Do not edit the wishlist or `PROGRESS.md`. Deputize defaults live in **this** contract.
19. Do **not** teleport beyond live `startSystem` (Drifter → `redmarch` already). Do **not** remap keys. Do **not** change which Digit picks which origin.
20. Preview law is **derive**. Do **not** add a `preview` table to `state.js` in PR1. Do **not** invent UU. Do **not** change `applyEffects` vocabulary. Do **not** mutate hull / kit per origin (kit mutate omit).
21. Layout law is **compact first**. Authored preview **sublines** (smaller/dimmer than the `[n] name — line` title, wrap allowed, ≈10 px) must keep the five Digit rows plus preview **in view** at the live overlay size (`width:620px;max-width:92vw`, `origins.js` **114–116**). `overflow-y: auto` is a **fail-closed backup** on a **dedicated origin list region** when content still clips (short viewport or text scale). It is **not** the primary law. Do **not** steal station `.screen-panel` or pause-menu classes. Do **not** bind a new scroll key. Do **not** shrink Digit labels. Prefer title + footer visible if the list region scrolls. Do **not** make overflow a mouse-only informed-choice path.

---

## 0.1 Wave 141 deputize (owner may override after playtest)

Pick a playable **consequence preview**. Inventory proves flavor is live and mechanical preview is **missing**. Do not park. Do not invent UU / SKU / Digit / persist key / WORLD_FIELDS.

### Live knobs (do not retune as the “fix”)

| Knob | Live | Cite |
|---|---|---|
| Overlay title | `'RIMWARD — who are you?'` | `origins.js` **121** |
| Row copy | `` `[${i + 1}] ${name} — ${line}` `` | **141** |
| Footer | `'press 1-5 or click — this choice is permanent'` | **150** |
| Digit map | keys order Digit1–5 (greenhand … drifter) | **29**, **153–157** |
| Confirm | Digit or click → `choose` immediately | **125–134**, **144** |
| Effects apply | **after** confirm | **52–85**, **127** |
| Persist origin | `ctx.world.origin = id` | **128**; `WORLD_FIELDS` includes `'origin'` |
| Default credits | `350` | `ctx.js` **174** |
| Default fear | `0` | `ctx.js` **175** |
| Default reputation | all `0` | `ctx.js` **176** |
| Starter hull | `light` hull **100**, hold **20** | `state.js` **38**; `ship.js` **631** |
| Starter head | Mining laser Mk I (index `0`) | `state.js` **83–88**; `ctx.js` **190** |
| Creditor arc | already shipped | `world.js` **1008–1026**; `ORIGIN_ARCS` **1068–1098** |
| Extra starter grace | AI-05; **not** this pack | `npc.js` **169–175** |

Do **not** “fix” the hole by changing Digit map, by two-step confirm, by writing `state.js` preview tables, by retuning credits/fear/rep, by kit mutate, by delaying overlay for Onb01, or by `innerHTML` lines.

### Playable policy (smallest additive)

**Name:** keep one-click / one-Digit confirm. Paint derived consequence rows **on each origin row before** that confirm.

| Piece | Freeze |
|---|---|
| **Who** | `origins.js` overlay card. Not pause menu. Not onboarding hints. Not `ORIGIN_ARCS` writer. Not AI-05. |
| **Id order** | Authored list in `origins.js`: `greenhand`, `ledgerDebt`, `marked`, `beautiful`, `drifter`. Same Digit map as today. Skip id unless `Object.hasOwn(ORIGINS, id)`. |
| **Confirm law** | Digit1–5 or click still calls `choose(id)` once. Digit path uses the **same** `hasOwn` guard as Agent. **No** second confirm screen. Preview is visible on the list **before** that press. |
| **Paint law** | Each authored origin: title line (keep `[n] name — line`) plus labeled `textContent` rows derived from `effects` + live defaults. |
| **Hull / equipment** | Shared starter for **all five** (effects do not set hull): `Hull light 100 · Mining laser Mk I · hold 20 · no launcher · no turret`. Beautiful extra cargo is a **cargo** row, not a kit mutate. |
| **Money / debt** | Derive credits: default `350`; `setCredits` replaces; `addCredits` adds. Negative → debt words. Ledger Debt: `Money −1150 UU (debt)`. |
| **Standings** | Default even → `Standings even`. Else faction **name** + signed delta + `rankFor` name. Use `FACTIONS[k].name` when `Object.hasOwn(FACTIONS, k)`. |
| **Immediate danger** | Derive start system (`startSystem` or default Freehold Drift), fear if `setFear`, debt words if credits &lt; 0, cargo/bond/hunger if those effects exist, clue if `cluesFound`. **Omit** a danger sub-part when the effect field is missing. Do **not** paste `ORIGIN_ARCS.callLines`. Do **not** name AI-05 extra seconds. |
| **Recommended experience** | Derive **words**, no new UU: empty effects → `New player`; living-ship-only (bond/hunger/cargo, no debt/fear/startSystem/neg-rep) → `New player — living-ship care`; else (debt, fear, negative standing, or `startSystem`) → `Experienced`. |
| **Fail-closed** | skip unknown id; omit missing effect part; never throw; never innerHTML. Skip does **not** compact Digit numbers. |
| **Color** | extra, not the only cue. Digit + labels stay. |
| **Layout (primary)** | **Compact sublines.** Title stays `[n] name — line` at live ~12 px. Preview kinds are **sublines** under that title: ≈10 px, dimmer, wrap, `textContent`. Goal: all five Digit origins + preview stay in view on the live 620 px / 92vw card without mouse scroll. Digit labels stay full size. |
| **Layout (backup)** | If compact still clips: `max-height: min(92vh, …)` and `overflow-y: auto` on a **dedicated origin list region** (new origin-only class or inline). Title + footer stay outside that scroller when possible. Wheel/trackpad is enough. **No** new scroll key. **No** `tabindex` trap. **No** animation. |
| **Layout (do not)** | Do **not** steal `.screen-panel`, `.screen-overlay`, `.screen-btn`, or pause-menu classes. Do **not** use overflow as the only fit. Do **not** restyle HUD. Dedicated `.rw-origin-*` in `screens.css` is allowed. |
| **Persist** | **none** new. `ctx.world.origin` write **unchanged**. |
| **`reducedMotion`** | no new animation. Hover background stay as live or CSS; not the only selection cue. |
| **`state.js`** | READ-ONLY. No `preview:` blob. |

### Deputized preview rows (authored literals from live data; do not invent UU)

Owner may override after playtest. Numbers come from `ORIGINS.effects` + `ctx.js` defaults + `SHIP_CLASSES.light` + `MINING_LASERS[0]`. Rank names from `rankFor`. System names from `SYSTEMS`. Commodity name from `COMMODITIES.livingRock.name`.

| Digit | Id | Flavor (live, keep) | Hull / equipment | Money / debt | Faction standings | Immediate danger | Experience |
|---|---|---|---|---|---|---|---|
| 1 | `greenhand` | Freehold Greenhand — A berth, a living ship, and no story yet. | Hull light 100 · Mining laser Mk I · hold 20 · no launcher · no turret | Money 350 UU | Standings even | Start Freehold Drift | New player |
| 2 | `ledgerDebt` | Ledger Debt — The Red Ledger owns your hull papers. Fly it off. | (same shared hull) | Money −1150 UU (debt) | Red Ledger −10 (Stranger) · Freehold Compact +10 (Known) | Start Freehold Drift · in debt | Experienced |
| 3 | `marked` | Marked — Veridian space has your face on a board. Someone downstream taught them to be careful. | (same shared hull) | Money 350 UU | Veridian Combine −15 (Suspect) · Red Ledger +10 (Known) | Start Freehold Drift · fear 15 | Experienced |
| 4 | `beautiful` | Beautiful Ones Initiate — You were raised among grown ships. Yours chose you back. | (same shared hull) · Cargo Living rock ×2 | Money 350 UU | Standings even | Start Freehold Drift · bond 0.35 · hunger 0.4 | New player — living-ship care |
| 5 | `drifter` | Rim Drifter — You came in from the Redmarch with more questions than money. | (same shared hull) | Money 600 UU | Standings even | Start The Redmarch · fear 5 · clue tally-board | Experienced |

Beautiful cargo uses `addCargo` `{ commodity: 'livingRock', units: 2 }` (`state.js` **761**). Drifter clue uses `cluesFound: ['rm_c_tally']` (**766**); player words from authored clue line (`authored-systems.js` **122**), via `textContent`, not the raw id as the only cue.

If a later `ORIGINS` effect field is absent, **omit that labeled row**. Do not invent a number. Greenhand has no `setFear` → **omit** fear (do **not** print `fear 0`).

Compact paint (same facts, shorter glyphs; still five kinds; wrap allowed):

- Hull: `Hull light 100 · Mk I · hold 20`
- Money: `Money 350 UU` / `Money −1150 UU (debt)` / `Money 600 UU`
- Standings: `Standings even` or `Red Ledger −10 (Stranger) · Freehold +10 (Known)`
- Danger: start + present effect parts only
- Experience: `New player` / `New player — living-ship care` / `Experienced`

### Later helper (named only)

No new module. Derive helpers **inside** `origins.js` (credits after effects, rank labels, danger parts). Optional **dedicated** origin CSS class for compact sublines + backup list overflow. Do **not** put preview in `state.js`. Do **not** import a new Digit. Do **not** put layout in `agent-api.js`. Do **not** reuse station `.screen-panel` or pause classes.

Do **not** interpolate save strings into HTML. Names stay `textContent`.

Do **not** dual-stack Onb01 flight copy as “origin preview”.

---

## 1. Wave 142 write-set (PR1)

**This pack owns:**

- **Writer:** `src/game/origins.js` (overlay paint: derived preview rows + fail-closed skip; keep Digit1–5 map; keep `applyEffects` vocabulary; keep `ctx.world.origin` write; keep listener remove on pick).
- **Writer (optional):** `src/ui/screens.css` **dedicated** `.rw-origin-*` only: compact subline type + backup list `max-height` / `overflow-y`. Do **not** restyle HUD. Do **not** reuse or restyle pause / station `.screen-panel` / `.screen-overlay` / `.screen-btn`.

**Do not claim:**

- `src/game/state.js` (`ORIGINS` / `ORIGIN_ARCS` / `JUMP` / `SHIP_CLASSES` — **read only**)
- `src/game/save.js` / `WORLD_FIELDS`
- `src/game/world.js` origin-arc tick
- `src/systems/npc.js` starter grace
- `src/systems/onboarding.js` (Onb01)
- `src/systems/title.js` / pause chrome (Ctl05)
- `src/systems/overlay-policy.js` (cite only)
- `src/systems/hud.js` / HUD CSS (toast `originChosen` stays)
- `src/systems/controls.js` Digit1–5 weapon map (skip-while-paused stays)
- `src/systems/agent-api.js` / `agent-observe.js` (cite only; `chooseOrigin` already fail-closes)
- Sibling Wave 141 Onb01 / Ctl05 paths

---

## 2. Partial merge forbidden

PR1 must land **together**: derived hull/equipment row + money/debt row + standings row + danger parts + experience words + **compact sublines** + `textContent` kept + Digit map kept + unknown skip + never-throw paint. Shipping flavor-only (today) is the hole. Shipping money without standings still fails the inbox. Shipping overflow-only without compact still fails keyboard informed choice.

Do **not** ship a `state.js` `preview:` table **and** a derive helper as competing required laws. Derive is the law. Compact is the layout law. Overflow is backup only. Do **not** ship kit mutate. Do **not** ship color-only danger. Do **not** ship `.screen-panel` steal.

---

## 3. Serial PR plan (named only)

| PR | Lands | Does not land |
|---|---|---|
| **PR1** origin preview | Derived labeled rows on each origin before Digit/click; compact sublines as primary fit; backup list overflow only if still clipped; dedicated origin class optional; authored id order list in `origins.js` (same Digit map); Digit/click `hasOwn` guard; `textContent`; unknown id skip (no Digit reindex); missing effect omit; never throw; listener still removes on pick; `ctx.world.origin` write unchanged | `state.js` write; new WORLD_FIELDS; two-step confirm; Digit remap; kit mutate; credit/fear/rep retune; creditor-call rewrite; AI-05 grace retune; Onb01 lesson; pause menu; station `.screen-panel` / `.screen-btn` steal; overflow as the only fit; new scroll key; `innerHTML`; animation that ignores `reducedMotion`; HUD-01 pip; teleport beyond live `startSystem`; Agent observe rewrite |
| **PR2 stills (optional skip)** | playtest still: fresh boot overlay shows all five consequence kinds before a Digit; Digit1 still Greenhand; after pick Digit1 is WPN | required with PR1 |
| **PR3 two-step confirm (optional skip)** | owner-asked only | required with PR1 |

First remaining serial is **PR1**. Wave 142 lands PR1.
