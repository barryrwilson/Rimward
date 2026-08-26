## UI Audit: Hail01 r2 — boot-pin re-dispatch (announce skip + Heave-to suppress)

**Persona:** designer (parent delta pass). Review only. Did not edit `src/`. Did not start Vite or Chrome.
**Method:** `C:\Users\barry\.grok\skills\orchestrator\references\ui-audit.md` + `C:\Users\barry\.grok\skills\orchestrator\assets\designer-persona.md`.
**Parent r1:** `out/w127/designer/demand-ui-audit.md` — Pass, 0 Blocker / 0 Major. This file is delta-only.
**Scope:** `src/systems/hud.js` demand `hailOpened` look-ahead; `src/systems/npc.js` pirate Heave-to suppress in the player bubble. HUD-06 home mark / POS HOME / `HOME_EDGE_INSET` 108 are cite-only: confirm this delta did not restyle them. Toast copy must stay authored mixed-case `textContent`. No extra toast slots, no `innerHTML`, no hub child, no Pause copy.

### Summary

The r2 delta narrows announce skip to a same-hull demand close and silences nameless pirate Heave-to while the player is in the acquire bubble or a demand is pending. Authored announce copy is unchanged. HUD-04 slot count, HUD-01 hub, HUD-06 home mark, and overlay-not-Pause policy are unchanged. No Blocker. No Major. The delta does not reopen r1.

### What's done well

- Announce skip is now same-ship + `demandHail === true` + `demandOutcome` (`hud.js` **687–704**). Unscoped Wave 35 `hailClosed` cannot eat a Wave 30 open toast. Fail-closed void on **this** hull still suppresses dual-stack open + close.
- Announce freeze is still exact mixed-case `textContent`: `{name} — heave to. Pay {n} UU or fight. ${t}s.` (`hud.js` **716**). Chip write is `slot.el.textContent = text` (`hud.js` **1317**). CSS `.rw-toast { text-transform: uppercase }` (`hud.css` **773–776**) is paint-only; it does not rewrite the node string. Boot pin walks `textContent`.
- Outcome literals and keys are unchanged (`hud.js` **721–737**). Announce key stays `warn|demand|{name}` (`hud.js` **719**).
- Nameless `'Heave to. Cargo or hull.'` is not a demand substitute vs the player. Telegraph: pirate vs player is empty (`npc.js` **1745–1746**). `suppressPirateHeaveTo` also holds when `demanding` / `demandSent`, pirate target is player, or the hull is inside `U.ENCOUNTER_BUBBLE` (`npc.js` **363–376**, **1747–1751**). Ace `'Run if you like.'` stays (`npc.js` **1743–1744**). Pirate vs NPC **outside** the player bubble may still Heave-to (`npc.js` **1749–1750**).
- Card is still the compliance path. Demand emit still carries named speaker, finite UU, `demandHail: true`, and `t: DEMAND_SECONDS` (`npc.js` **2121–2129**). Close still stamps `demandHail: true` (`npc.js` **401–407**).
- No extra toast slots: `TOAST_SLOTS = 5` (`hud.js` **69**), loop creates five chips (`hud.js` **937–942**). Linger 8 s (`hud.js` **70**). Lifetime 4 s (`hud.js` **68**).
- No `innerHTML` in `hud.js` or `npc.js` (grep 0). Toast path is `textContent` / `el()` only.
- No hub child. Reticle hub clamp is still `cx - 44` / `cy - 44` (80 px) (`hud.js` **1400**). Reticle children are pupil / cilia / RANGE (`hud.js` **858–861**). Demand pack does not append to the aim glass.
- HUD-06 intact: `.rw-home-mark` on pip + chevron (`hud.js` **903–907**), POS `HOME` (`hud.js` **1119–1120**), `HOME_EDGE_INSET = 108` (`hud.js` **75**, **1948–1949**). Open hail still hides home glass via `flags.hailOpen !== true` (`hud.js` **1890–1894**).
- No Pause copy. `hud.js` / `npc.js` have no `Pause` / `paused` string. Hail overlay still never writes `ctx.flags.paused` (`hail.js` **18–19**, cite only). Overlay policy still never writes pause (`overlay-policy.js` **4**, cite only).

### Must-check (delta)

| Check | Result | Cite |
|---|---|---|
| Demand announce skip only on same-ship `hailClosed` with `demandHail === true` | Pass | `hud.js` **694–701** (`o.ship && o.ship === e.ship`) |
| Unscoped `hailClosed` must not eat Wave 30 open toast | Pass | comment + gates `hud.js` **692–697** |
| Toast copy authored mixed-case `{name} — heave to. Pay {n} UU or fight. {t}s.` | Pass | `hud.js` **716**; write **1317** |
| Pirate Heave-to suppress in player bubble / demand pending | Pass | `npc.js` **363–376**, **1745–1751** |
| HUD-06 `.rw-home-mark` / POS HOME / inset 108 still present, not restyled | Pass | `hud.js` **75**, **903–907**, **1119–1120**, **1948–1949** |
| No extra toast slots | Pass | `hud.js` **69**, **937–942** |
| No `innerHTML` | Pass | grep `hud.js` / `npc.js` 0 |
| No hub child | Pass | `hud.js` **858–861**, **1400** |
| No Pause copy | Pass | grep `hud.js` / `npc.js` 0; hail cite **18–19** |

### Findings

No 🔴 Blocker or 🟠 Major. Delta did not introduce either.

#### 🟡 Minor: Announce toast seconds are a snapshot (r1, still accepted)

**Location:** `src/systems/hud.js:709–719` (`hailOpened` demand)
**Issue:** The 4 s chip freezes emit-time `{t}s`. The card still counts down on `lineEl`. A ticking toast would fight HUD-04 identical-key linger (`warn|demand|{name}` ignores `{t}`).
**Fix:** Leave it. Card is the live clock. Toast is the one-shot announce.
**Status:** accepted (r1)

#### 🟡 Minor: Toast paint is uppercase; `textContent` stays mixed case (r1, still accepted)

**Location:** `src/ui/hud.css:773–776` `.rw-toast`; `src/systems/hud.js:716`, **1317**
**Issue:** Players see `HEAVE TO.` on the chip. Authored node string is `{name} — heave to. Pay {n} UU or fight. {t}s.` Boot pin and contract key off `textContent`, not computed style. This delta did not restyle `.rw-toast`.
**Fix:** Do not strip HUD-04 uppercase in this pack. Do not mutate the template to all-caps.
**Status:** accepted (r1)

#### 🟡 Minor: Pay / bluff / fail still dual-stack flavour + named outcome (r1, still accepted)

**Location:** `src/systems/hud.js:721–737` `hailClosed`; flavour still via `commLine` (`hud.js` **565–573**)
**Issue:** Same frame can still show nameless flavour and the named freeze toast. Two of five slots. Named outcome still carries speaker + verb. This delta did not add a slot or a third demand channel.
**Fix:** Optional later. Not required for r2.

#### 💡 Suggestion: Telegraph vs player is silent until the card

**Location:** `src/systems/npc.js:1745–1751` + `suppressPirateHeaveTo` **363–376**
**Issue:** Approach in the 800 u bubble can show no nameless Heave-to chip before the 600 u demand card. That is the orphan-HEAVE-TO rule, not a missing demand announce. Demand announce still fires on `hailOpened`.
**Fix:** Keep silence. Do not invent a second named pending line.

#### 💡 Suggestion: Pirate vs NPC Heave-to still exists outside the bubble

**Location:** `src/systems/npc.js:1749–1750`
**Issue:** Traffic can still toast `'Heave to. Cargo or hull.'` when the player is far. HUD `commLine` still drops `from` (`hud.js` **573**). Merge law allows that. Player-bubble suppress covers the demand-confused case.
**Fix:** None in this pack.

### A11y

- Named source, UU, and seconds stay in the announce string (`hud.js` **716**). Color (`warn`) is extra, not the only cue.
- Same-frame unscoped close no longer hides that named announce from `aria-live=polite` (`hud.js` **933–934**, **1316–1317**).
- Nameless Heave-to is not a second compliance channel in the player bubble. Screen readers do not hear a verb-less substitute before the card.
- Toasts still do not steal focus. Chips expire `aria-hidden` (`hud.js` **939**, **1347–1350**).
- HUD-06 home pip/chevron stay `aria-hidden` (`hud.js` **904**, **908**). This delta did not add a demand pip.

### HUD-06 / hub / pause (cite only)

- `.rw-home-mark` still on pip + chevron (`hud.js` **903–907**).
- POS HOME: `el('div', 'rw-label', homeRow, 'HOME')` (`hud.js` **1120**).
- `HOME_EDGE_INSET = 108` (`hud.js` **75**, **1948–1949**).
- This delta did not edit `hud.css` home-mark layout.
- Reticle hub clamp is still `cx - 44` / `cy - 44` (80 px) (`hud.js` **1400**).
- Hail never writes `ctx.flags.paused`. Overlay policy still says never write pause (`overlay-policy.js` **4**, cite only).

### Verdict

**Pass.** The boot-pin re-dispatch did not add Blocker or Major UI. Announce skip is same-ship demand close only. Toast `textContent` stays the authored mixed-case freeze. Nameless Heave-to is suppressed in the player bubble while demand is the path. HUD-06 home mark, POS HOME, inset 108, five toast slots, no `innerHTML`, no hub child, no Pause copy. r1 findings stay accepted, not reopened.
