# Issue #98 — A surrendering hull can be told to dump its holds

[Issue #98](https://github.com/barryrwilson/Rimward/issues/98).

**Status: implemented and locally verified, awaiting independent QA and PR
review.** The runtime change is implemented, 57 focused checks pass, the root
`npm run test:boot` passes, and the live browser probe passes **6/6 pins on
2026-09-10** with a clean console. No independent QA, merge, release or
deployment is claimed.

## Outcome

A player-owned surrender card now offers `demandCargo` whenever the hull still
holds at least one unit — the SAME nonempty-hold gate the salvage card has
always used. An empty hold omits the verb, so no button promises loot that is
not there. The verb is published on the public `observe().hail` block (intents,
options and labels) exactly like every other listed verb.

Resolution is the existing non-salvage `demandCargo` branch in `hail.js`; no new
mechanic was added. Demanding an ordinary manifest (for example
`rawOre:5, refinedMetals:3`) spills it as scoopable cargo pods unit for unit,
clears the hull manifest, pays fear **+2** (`ECON.fear.capitulation`), pays **no
credits** (a ransom is a different verb), marks the yield, starts the shared
escape flee, and emits one `npcSurrendered` receipt with `causer: 'player'`.

Preserved without change:

- **#99 attribution.** A break the player did not cause opens no card, so
  another pilot's prize cannot be claimed; a card whose claim lapses refuses the
  cargo demand with `stale` and moves nothing.
- **#100 berth.** A docked player's cargo demand answers the stable `docked`
  token and moves nothing.
- **Salvage.** A disabled hull's card still reads "Salvage cargo", dumps the
  manifest, pays no fear and emits no yield receipt.
- **Wave-30 demand hails.** A loaded pirate's tribute demand still offers only
  `payTribute` / `showTeeth` / `refuseFight`.

Out of scope and deliberately unchanged: `spillShipCargo`'s special handling of
data commodities (they are excluded from the spill and roll separately). That
behaviour is not redesigned here, so the spill and the offer gate are not
claimed to agree on every cargo row — only on whether the hold is nonempty.

## Change and boundaries

| File | Change |
|---|---|
| `src/systems/npc.js` | `intentsFor` offers `demandCargo` when `shipHasCargo(state)`. The predicate itself now lives here beside `spillShipCargo`; `hail.js` already imports `npc.js`, so the reverse import would be circular. |
| `src/systems/hail.js` | Imports the predicate and re-exports `shipHasCargo` unchanged, so the existing export stays compatible. Module docstring notes the new offer. |
| `package.json` | Adds `test:surrender-cargo` and `test:surrender-cargo-live`. |
| `scripts/issue-98-surrender-cargo-test.mjs` | New focused suite (real boot). |
| `scripts/issue-98-live-probe.mjs` | New live browser probe. |

No new schema, API version, event type, key, persistent field, equipment SKU or
gauge. The public API stays at `VERSION` 2; `hailResolve` needed no schema
change because it never enumerated intents.

## Verification — automated, local

- `npm run test:surrender-cargo`: **PASS, 57 checks.** Real boot over the real
  npc/combat/hail/pods/world/station systems. Covers the public offer and its
  live-hull label, the bound public `hailResolve` payout (pods unit for unit,
  cleared manifest, fear +2, no credits, yield, flee, one player-attributed
  receipt, patrol progress, card closed), a refused duplicate, the empty hold
  omitting the verb with the card left open, an NPC-caused break offering no
  card, a `stale` refusal, the `docked` refusal, unchanged salvage on a disabled
  hull (no fear, no receipt), and an unchanged pirate tribute demand.
- `npm run build`: PASS.
- `npm run test:boot`: PASS, not edited or weakened (root log:
  `out/issue-98/root-boot.log`).
- Regressions, all PASS: `test:surrender-attribution` (#99),
  `test:docked-hails` (#100), `test:hail-identity` (#66), `test:agent-schema`,
  `test:agent-gameplay`.

Every focused offer is read through the public `observe().hail` and every
resolution runs through the public `hailResolve`, except the stale-claim pin,
which calls `ctx.hailApi.resolve` directly to read the card API's own `stale`
token at that boundary.

## Verification — live browser, PASS

`npm run test:surrender-cargo-live` (`scripts/issue-98-live-probe.mjs`):
**PASS on 2026-09-10, 6/6 pins, 0 console errors, 0 uncaught exceptions.**
Headless Chrome over CDP, platform GPU (ANGLE / Intel UHD, D3D11).

| Pin | Result | Read from the live page |
|---|---|---|
| L1 loaded hull offers | PASS | The rendered card shows `[1] Demand cargo`; `observe().hail.intents` lists `demandCargo`. |
| L2 bound public payout | PASS | `rawOre:5` and `refinedMetals:3` pods appear, manifest empty, fear +2, credits unmoved, yielded and fleeing, one player-attributed incident, card gone. A duplicate bound resolve is refused and moves nothing. |
| L3 empty hold | PASS | No cargo intent, no cargo button; a bound cargo demand is refused and nothing moves; the card stays open. |
| L4 NPC-caused break | PASS | Bargaining band, no card at all, cargo demand refused, the other pilot's manifest untouched. |
| L5 staged takeover at the click boundary | PASS | The real "Demand cargo" button is clicked after a staged `lastAttacker = 'npc'`; no pod, no fear, manifest intact, card closes. |
| L6 the rendered button pays | PASS | The positive counterpart: the same real button, clicked with no API call, spills the manifest, pays fear +2 and no credits, yields the hull to the player and closes the card. |

Screenshots and ledger: `out/issue-98/live/` (`01-l1-loaded-surrender-card.png`
shows `[1] Demand cargo` on the rendered card; `08-l6-button-payout.png` shows
the payout), `result.json`, `console.txt`, `run.log`. The berth boundary is not
re-verified live here — issue #100's own live probe and the focused suite cover
it.

Two limitations belong on the record:

- **Dev-server workaround.** The probe starts Vite through `createServer` with
  `server: { watch: null }` and `optimizeDeps: { noDiscovery: true, include: [] }`,
  the same harness-only override issues #99 and #100 record for this workspace.
  `vite.config.js`, the production build and the bundle budget are unchanged.
- **Rare-fixture staging (`privilegedFixture`, disclosed in `result.json`).** A
  loaded hull at the bargaining band cannot be waited for, so each fixture is
  spawned with an initial combat history and an initial manifest: resolve 50, an
  initial `ai.band` of `shaken` as a *starting point*, zeroed defenses, a full
  hull, the stated ordinary cargo rows, a fresh `lastCombatAt`, cleared resolve
  and calm clocks, `demandSent` true, and `lastAttacker` `'player'` or `'npc'`
  as each pin discloses. The hull is then walked down from full in 4% steps and
  the walk stops the instant the live NPC update reports `bargaining` (each run
  records the reached band, resolve and hull fraction — 22 at 0.96 hull for the
  loaded fixtures in the final run). No outcome is ever written: no synthetic
  `hailOpened` or `npcSurrendered`, no pod, no fear, no credit, no
  `state.surrendered`, no card kind and no intent list.

### Earlier live runs, preserved

- `out/issue-98/live-initial-failure/` — the first live run failed L1/L2/L4. The
  cause was the FIXTURE, not the runtime: cargo aboard lowers resolve
  (`computeResolve` reads `cargoAtStake`), so a fixed 0.8 hull fraction that
  left an empty hull bargaining dropped a loaded one to resolve 19 and straight
  into automatic capitulation, past the card. The fixture was corrected to walk
  the band down and stop at `bargaining`. No runtime change was made for it.
- `out/issue-98/live-dock-fixture-failure/` — a second run in which only the
  since-removed dock pin failed: the fixtures sit ~6 km from the berth and the
  approach never reached the dock zone within the probe's budget. That was an
  unrelated dock-approach fixture problem, out of this issue's scope and not
  repaired here; the pin was replaced by L6 above, and #100's live probe and the
  focused suite keep covering the berth refusal.

## Remaining before done

Implementation, focused tests, build, boot, regressions and live acceptance pass
locally. Independent QA, PR review and merge are outstanding. Nothing is merged,
released or deployed.

Engine identity: Claude Code 2.1.251, model `claude-opus-5`.
