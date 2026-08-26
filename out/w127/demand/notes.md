# Wave 127 Hail01 PR1 notes (boot pin re-dispatch)

**Status:** `npm run test:boot` → `BOOT TEST PASS`. No `WAVE127 HAIL01 OPEN FAIL`. No `WAVE127 HAIL01 HEAVE FAIL`. Agent-observe all true.

## Root cause — WAVE127 HAIL01 OPEN FAIL (`toastNamed: false`)

Other open fields passed. The announce toast did not match the pin walk.

1. **Look-ahead was too wide.** `toastForEvent` skipped `hailOpened` when any same-frame `hailClosed` had `demandOutcome` and `(!ship || ship === e.ship)`. An unscoped `hailClosed` (Wave 35 backstop shape) ate a normal Wave 30 open. Live verifier named this. Fix: skip announce only when `hailClosed.demandHail === true` **and** `o.ship === e.ship`.
2. **Pin walked `document.body` only.** HUD chips live under `#hud` (`getElementById`). The stub parents `#hud` onto body in `initHud`, but Wave 98 toast pins walk `#hud` itself. The Hail01 pin now walks body **and** `#hud`. `toastNamed` stays required.

CSS uppercase does not change `textContent`. Authored mixed-case ` — heave to.` stays.

## Root cause — WAVE127 HAIL01 HEAVE FAIL (`heaveSuppressed: false`)

`noDemandYet` was true (700 u is outside 600 u demand). Nameless `'Heave to. Cargo or hull.'` still landed.

1. **Gate was `ai.target === 'player'` only, and it ran after telegraph arm.** Hunt can start telegraph in the 800 u bubble before demand. If `target` is still unset, or the pirate first locks a trader, Heave-to fires.
2. **The pin scanned every `commLine` in those 20 ticks.** A traffic pirate vs an NPC could fail the pin even when `pHeave` was silent.

Fix: `suppressPirateHeaveTo` — pirate + (`demandSent` / `demanding` / `ai.role === 'pirate' && ai.target === 'player'` / player inside `U.ENCOUNTER_BUBBLE`). Ace `'Run if you like.'` stays. Pirate vs NPC outside the player bubble may still Heave-to.

Pin still requires `heaveSuppressed`. Query now matches **this hull** (`e.from === pHeave.state.name`).

## Not weakened

Expire / dock / jump / nan pins unchanged. Agent API WAVE127 block unchanged.

## Graph

`proceed_unmodeled` (`r-mt9lnqui-24a4cb60`). Did not write the graph.
