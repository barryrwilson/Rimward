# RIMWARD Hail03 player-demanded terms

| Field | Value |
|---|---|
| **Title** | RIMWARD Hail03 player-demanded terms |
| **Date** | 2026-09-11 |
| **Issue** | [#122](https://github.com/barryrwilson/Rimward/issues/122) — a feared pirate cannot demand terms from a willing hull; the bargaining card only opens on a player-caused band transition |
| **Status** | Focused design pass (the issue's `orca:needs-design` gate) followed by the implementation on `claude/next-issue-a80ed6`. |
| **Honor** | Issue #99 attribution (a break the player did not cause pays nobody). Issue #67 classifier (one truth for the bracket, the H toast and `observe()`). Issue #100 berth refusal. Issue #66 conversation identity. Hail01 demand lifecycle. No new key, gauge, SKU, persistent field or API version. Not an on-ramp or tutorial ([#104](https://github.com/barryrwilson/Rimward/issues/104)). |

## Problem (code wins)

`hailEncounterState` already names an intact hull at the `bargaining` or
`capitulate` band `willing`, and the bracket prints BARGAINING / WILLING TO
YIELD. But the only opener of the surrender card is the band **transition** in
`updateResolve` (`src/systems/npc.js`), gated on `surrenderCauserOf(live) ===
'player'`. A hull that is already willing when the player meets it never
transitions, and a hull the NPC pirates broke has a `world` trail, so KeyH
answers `no-answer` ("no terms offered") forever. The verbs `demandCargo`,
`demandRansom`, `acceptTribute`, `letGo`, `respect` and `keepFiring` exist
and are unreachable.

## Design

### Entry point

A deliberate player hail on a willing hull opens the ordinary surrender card.

- Trigger: the existing KeyH press and the public `act({ name: 'hail' })`
  pulse, through the existing KeyH branch in `hail.js`. No new key.
- Subject: the locked target when it is a live ship in `ctx.ships`, not
  destroyed, not disabled, not `state.surrendered`, not already `surrenderDone`,
  not holding a pirate demand (`ai.demanding`), with a resolve band of
  `bargaining` or `capitulate`, inside `U.TARGET_RANGE` — the same range the
  NPC-initiated card uses.
- Precedence is the existing KeyH order: an open card swallows the press; the
  play surface, chart and berth refuse first; a disabled hull still opens the
  salvage card; then this terms hail; then the miss toast.
- Range and session calm now gate a willing hull exactly as they gate a
  wreck, because the key can now open something for it: `range` and `calm`
  become truthful blockers for `willing`, and the toast prints the existing
  "hail out of range (n u)" / "hail calm" copy.
- The card is the same surrender card: `intentsFor` decides the verbs
  (`demandCargo` only with a nonempty hold, `acceptTribute` only with cargo
  value, `respect` for a Named Gun at fear ≥ 15), `openCard` rolls the ransom
  and tribute once, the buttons keep their digits, `observe().hail` publishes
  it as kind `surrender`, and `hailResolve` resolves it with the same tokens.
  The `hailOpened` event carries `terms: true` so a controller can tell a
  demanded card from an offered one; the schema copies that primitive.
- The hull answers "Heard. Name your terms." on the comm line; the card line
  reads "Name your terms." A bargaining hull is stamped `ai.hailed` and
  `ai.band = 'bargaining'` exactly as the NPC-initiated opener does, so it
  heaves to while the card is up and the transition path cannot draw a second
  card. A capitulate-band hull keeps its unsampled `ai.band` so the ordinary
  NPC loop can still yield it if the fight goes on.

### Attribution (issue #99 stays)

The demand is authorship. `surrenderCauserOf` gains one more way to read
`player`: an open player-demanded card. `ai.termsAt` (instance only, never
saved) is stamped with the simulation time the terms card opened and cleared
to `-1` when that hull's card closes (`hailClosed`). While it stands:

- a `player` damage trail still reads `player` first, as before;
- a hull with no effective attacker, or one an NPC wounded **before** the
  demand, reads `player` — the player took the terms;
- an NPC that lands a hit **after** the demand opened takes the fight over:
  the claim lapses, the open card refuses with `stale` and closes on the next
  update, and the ordinary NPC loop yields the hull to the `world` — the same
  lapse issue #99 already defines.

Outside an open terms card nothing changes: proximity is still not
authorship, an NPC-caused break still opens no card and pays nobody, and the
receipt / incident / patrol contract still read the causer the card sold.

Fear is untouched: a ransom still pays +3, a cargo demand +2, tribute none.

### Shared classifier (issue #67)

`hail-offer.js` keeps its six states and seven blockers. `willing` becomes an
available action (`available: true`, `reason: ''`, `next: 'Hail to demand
terms.'`) when no blocker stands; the salvage-only steps (geometry, range,
calm) now also apply to it. `no-answer` stays in the miss vocabulary for the
one case the key cannot open a card for a willing hull (a pirate mid-demand).
The bracket prompt reads `H — Hail — demand terms` for a willing lock; the
resolve line is unchanged.

## Exclusions

- No change to `computeResolve`, the fear weights, `capitulate()` outcomes or
  the pirate demand hail.
- No prize contest between the player and NPC pirates ([#123](https://github.com/barryrwilson/Rimward/issues/123)).
- No fence marker from a ransom ([#124](https://github.com/barryrwilson/Rimward/issues/124)).
- No persistent field: `ai.termsAt` dies with the live instance.

## Acceptance

1. A willing hull the player never shot opens the surrender card on H /
   `hail`, publishes kind `surrender`, and a ransom pays credits, fear +3, a
   `npcSurrendered { causer: 'player' }` receipt and the yield.
2. A capitulate-band hull that has not yielded opens the card too; a yielded,
   steady or disabled hull keeps its issue #67 answer.
3. Out of range or under calm the press refuses with `range` / `calm`, and
   `hailOffer` says the same.
4. The claim lives only while the card is up: after `keepFiring` an NPC-caused
   break pays nothing; an NPC hit during the parley closes the card `stale`.
5. Issue #99 and #67 suites keep passing with the willing rows updated to the
   new contract; build and unchanged boot pass; a live browser check opens the
   card on a willing hull with a clean console.
