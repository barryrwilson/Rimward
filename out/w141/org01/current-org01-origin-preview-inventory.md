# Org01 origin consequence preview inventory

**Wave:** 141 leftover census. Markdown only. No `src/` writes.  
**Code wins.** Cites are live file:line at census time (2026-08-27).  
**Leftover:** **REAL.** Named serial **PR1**. Not CONSUME. Named serial is **not** none.  
**Name:** preview gameplay consequences of each permanent origin **before** confirmation (hull/equipment, money/debt, faction standings, immediate danger, recommended experience).  
**Not this leftover:** Onb01 first-minute flight lesson. Ctl05 pause menu. Origin-arc creditor calls (shipped). AI-05 starter grace. Pad 2B. In-repo LLM. Digit remap. HUD-01 hub. NAV-11.

Inbox source (`docs/PLAYER-EXPERIENCE-WISHLIST.md` Playtest capture 2026-08-25 — **126–130** — cite, do not edit): Preview the gameplay consequences of each permanent origin before confirmation: starting hull and equipment, money/debt, faction standings, immediate danger, and recommended experience. The current prose establishes flavor well but does not support an informed permanent choice.

---

## 1. Overlay paint (what the player sees before confirm)

| Surface | Today | Cite |
|---|---|---|
| Fresh-boot gate | overlay only if `!saveRestored && !ctx.world.origin` | `origins.js` **94–98** |
| Pause | `ctx.flags.paused = true` until pick | **100**, **132** |
| Root | fixed fullscreen, z-index 60, inline CSS | **104–108** |
| Title | `RIMWARD — who are you?` via `textContent` | **119–122** |
| Row identity | `ORIGIN_IDS = Object.keys(ORIGINS)` | **29**, **136** |
| Row copy | `` `[${i + 1}] ${ORIGINS[id].name} — ${ORIGINS[id].line}` `` | **141** |
| Hover | background alpha only | **142–143** |
| Confirm | click → `choose(id)` | **144** |
| Footer | `press 1-5 or click — this choice is permanent` | **148–150** |
| Digit | `Digit1`–`Digit5` from `e.code`; `n = charCodeAt(5) - 49` | **153–157** |
| Digit 0 / 8 / 9 | ignored (`n` out of range) | **156** |
| Listener | `window` keydown; **removed** on choose | **126**, **159** |
| Paint channel | `textContent` only; **no** `innerHTML` | **121**, **141**, **150** |
| Card size | `width:620px;max-width:92vw;padding:16px 20px`; **no** `max-height`; **no** `overflow` | **114–116** |
| Agent | `originsApi.choose` requires `Object.hasOwn(ORIGINS, id)` | **164–168** |
| Digit `choose` | uses `ORIGIN_IDS[n]` with **no** extra `hasOwn` | **157** |

**Overlay does not paint hull, equipment, credits, debt, reputation, fear, start system, cargo, clues, or experience.** Flavor `name` + `line` only.

CONSUME would require those five consequence kinds **before** confirm. They are **not** live.

---

## 2. `ORIGINS` table vs live `applyEffects`

Source: `state.js` **742–768**. Vocabulary comment **733–740**. Apply: `origins.js` **52–85**.

| Id | Digit | `name` | `line` (flavor) | `effects` keys | `applyEffects` today |
|---|---|---|---|---|---|
| `greenhand` | 1 | Freehold Greenhand | A berth, a living ship, and no story yet. | `{}` | no-op |
| `ledgerDebt` | 2 | Ledger Debt | The Red Ledger owns your hull papers. Fly it off. | `addCredits: -1500`, `reputation: { redledger: -10, freehold: 10 }` | credits += −1500; rep merge |
| `marked` | 3 | Marked | Veridian space has your face on a board. … | `setFear: 15`, `reputation: { veridian: -15, redledger: 10 }` | fear = 15; rep merge |
| `beautiful` | 4 | Beautiful Ones Initiate | You were raised among grown ships. Yours chose you back. | `setBond: 0.35`, `setHunger: 0.4`, `addCargo: [{ commodity: 'livingRock', units: 2 }]` | bio + cargo push |
| `drifter` | 5 | Rim Drifter | You came in from the Redmarch with more questions than money. | `setCredits: 600`, `setFear: 5`, `startSystem: 'redmarch'`, `cluesFound: ['rm_c_tally']` | credits = 600; fear = 5; rebind system; clue push |

**`applyEffects` vocabulary actually applied:**

| Field | Applied? | Cite |
|---|---|---|
| `setCredits` | yes, absolute | **54** |
| `addCredits` | yes, delta | **55** |
| `setFear` | yes | **56** |
| `reputation` | yes, `Object.keys` merge add | **57–61** |
| `setBond` | yes | **63** |
| `setHunger` | yes | **64** |
| `addCargo` | yes, push `{ commodity, units }` | **65–67** |
| `cluesFound` | yes, mystery.found | **68–73** |
| `startSystem` | yes if `SYSTEMS[fx.startSystem]` | **74–84** |
| hull / `setHull` | **no** | census |
| equipment / miningLaser / scanner / launcher / turret | **no** | census |
| dedicated `debt` / `creditor` | **no** (debt = negative credits) | census |
| recommended experience | **no** | census |

---

## 3. Live defaults the overlay does not show (derive later; do not invent UU)

| Knob | Live default | After each origin | Cite |
|---|---|---|---|
| Credits | `350` | greenhand 350; ledgerDebt **−1150**; marked 350; beautiful 350; drifter **600** | `ctx.js` **174**; effects **748–766** |
| Fear | `0` | 0 / 0 / **15** / 0 / **5** | `ctx.js` **175** |
| Reputation | freehold/redledger/veridian/hollow `0` | ledgerDebt redledger −10 freehold +10; marked veridian −15 redledger +10; others even | `ctx.js` **176**; `state.js` **751**, **756** |
| Rank at those deltas | `rankFor` | −10 Stranger; +10 Known; −15 Suspect | `state.js` **714–721** |
| Current system | `freehold` (`Freehold Drift`) | drifter → `redmarch` (`The Redmarch`) | `ctx.js` **177**; `authored-systems.js` **31–33**, **93–95**; effects **766** |
| Player class / hull | `createShipState('light')` hull **100**, hold **20** | **same for all five** | `ship.js` **631**; `state.js` **38** |
| Mining head | Mk I, `miningLaser: 0` | unchanged | `state.js` **83–88**; `ctx.js` **190** |
| Launcher / turret | `''` / `''` | unchanged | `ctx.js` **193–195** |
| Bio | bond `0.1`, hunger `0.15` | beautiful bond **0.35** hunger **0.4** | `ctx.js` **161–163**; effects **761** |
| Cargo | `[]` | beautiful Living rock ×2 | `ctx.js` **155**; `COMMODITIES.livingRock` **355** |
| Clue | none | drifter `rm_c_tally` | `authored-systems.js` **122** |
| Origin persist | `ctx.world.origin = id` | same | `origins.js` **128**; `save.js` **91** |
| Hop grace stamp | `jumpGraceUntil = time + JUMP.graceSeconds` (**60**) | same all origins | `origins.js` **129**; `state.js` **588** |

Hull and equipment are **shared**. Inbox still asks to **preview** them. Showing the shared starter is the informed fact. Effects do not kit-mutate.

---

## 4. Digit / pause / neighbours (cite; do not steal)

| Surface | Today | Cite |
|---|---|---|
| Init order | title → … → save → **origins** → **onboarding** → chart → … | `main.js` **109–143** |
| Title vs origin pause | NEW GAME (no autosave) leaves pause for origins | `title.js` **13–14**, **95–97** |
| Weapon Digit1–5 skip | `flags.paused` true → skip WPN | `controls.js` **117**, **548–562** |
| After pick | listener gone; pause false; Digit1–5 WPN | `origins.js` **126–132** |
| Agent observe mode | `'origin'` while overlay open | `agent-observe.js` **396–401** |
| Agent choose | `actChooseOrigin`; reserved id `'unknown'` | `agent-api.js` **291–314** |
| Toast on pick | `✦ ` + line | `hud.js` **662–663** |
| Song | `originChosen` swell | `song.js` **107** |
| Onboarding hints | after pick; first hint at `time > 20` | `onboarding.js` **37–39**; **not** overlay preview |
| Ledger creditor | while `origin === 'ledgerDebt'` and credits &lt; 0 | `world.js` **1008–1026** |
| `ORIGIN_ARCS.ledgerDebt` | interval 240, maxCalls 3, collector Dresk | `state.js` **1068–1084** |
| AI-05 extra grace | greenhand/beautiful 180; others 0 | `npc.js` **169–175** — **not this pack** |
| `WORLD_FIELDS` | includes `origin`, `originArc` | `save.js` **84–94** |

---

## 5. Overlay vs inbox checklist

| Inbox ask | Live before confirm? | Notes |
|---|---|---|
| Starting hull and equipment | **No** | Shared light / Mk I exists in sim; overlay silent |
| Money / debt | **No** | Applied after pick only |
| Faction standings | **No** | Applied after pick only |
| Immediate danger | **No** | Fear / startSystem / debt applied after pick; creditor arc is later time |
| Recommended experience | **No** | No field, no copy |
| Flavor prose | **Yes** | `name` + `line` |
| Permanence warning | **Yes** | footer **150** |

---

## 6. Fail-closed gaps (later PR1 must freeze, not crash)

| Gap | Live | Risk |
|---|---|---|
| Digit `choose(ORIGIN_IDS[n])` | no `hasOwn` | polluted `Object.keys` could call `applyEffects` on a bad id and throw at `ORIGINS[id].effects` (**53**) or `.line` (**133**) |
| Row paint `ORIGINS[id].name` | no try/catch | throw blanks later paint if a key is bad |
| `applyEffects` `Object.keys(fx.reputation)` | no `hasOwn` | prototype key if `reputation` is a weird object |
| `SYSTEMS[fx.startSystem]` | truthy check, not `hasOwn` | **74** |
| Overlay `innerHTML` | none today | later XSS if rewritten |

---

## 7. Verdict

Flavor overlay **is** live. Mechanical preview **is not**. Hull/equipment/money/standings/danger/experience are **not** shown before confirm.

Leftover **REAL**. Named serial **PR1**. Not CONSUME. Name is **not** “no remaining Org01 leftover.”
