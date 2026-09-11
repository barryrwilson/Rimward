# Issue #122 — a feared pirate can demand terms from a willing hull

[Issue #122](https://github.com/barryrwilson/Rimward/issues/122).
Design pass: [Hail03PlayerTermsDesign.md](Hail03PlayerTermsDesign.md).

**Status: implementation and local verification COMPLETE, AWAITING PR REVIEW
AND MERGE.** The runtime change is implemented on `claude/next-issue-a80ed6`
from master `4c8a8527`. Build, unchanged boot, the new focused suite, the
release-focused regressions (18/18, including the new suite), the updated
issue #67 suite, the issue #99 / #98 / #100 / #66 / agent suites and the live
browser check on 2026-09-11 pass with no console errors. No independent QA,
merge, release or deployment is claimed.

## Outcome

The issue asked for a player-initiated demand on a hull whose band is
`bargaining` (and `capitulate` before it has yielded): pressing H / `hail`
within range opens the same surrender card with the player as causer, with
fear and the issue #99 attribution rules unchanged. That is delivered.

- `npc.js` exports `canDemandTerms` and `tryOpenTermsHail`: the current lock
  must be a live, intact, unyielded ship not mid-demand, at the `bargaining`
  or `capitulate` band, inside `U.TARGET_RANGE`. The opener emits the same
  surrender-card `hailOpened` the band transition emits (plus `terms: true`),
  says "Heard. Name your terms." on the comm line, stamps `ai.termsAt`,
  `ai.hailed`, and for a bargaining hull `ai.band = 'bargaining'` so it heaves
  to and the transition cannot draw a second card.
- `hail.js` tries the terms hail from the existing KeyH branch after the
  salvage card and before the miss toast; the same branch serves the public
  `act({ name: 'hail' })` pulse. Every card close drops the claim.
- `surrenderCauserOf` reads `player` while the player's own terms card is
  open, whoever wounded the hull before the demand. An NPC hit landed after
  the demand opened lapses the claim: the card closes `stale` on the next
  update, and the ordinary loop yields to the `world`. Outside an open terms
  card nothing changes.
- `hail-offer.js`: `willing` is an available action (`reason: ''`, `next:
  'Hail to demand terms.'`); range and calm now gate it as they gate a wreck.
  `no-answer` stays in the miss vocabulary for a press the key still cannot
  answer. The bracket prompt reads `H — Hail — demand terms`.
- `agent-schema.js` copies `terms` on `hailOpened` receipts and documents the
  entry point on the `hail` role. Not a version bump: the field is additive.

Not done, on purpose: no change to `computeResolve`, fear weights,
`capitulate()` outcomes or the pirate demand hail; no prize contest with NPC
pirates (#123); no fence marker from a ransom (#124); no persistent field.

## Files

| Path | Change |
|---|---|
| `src/systems/npc.js` | `ai.termsAt`; `surrenderCauserOf` terms claim; `canDemandTerms`, `tryOpenTermsHail`, `dropTermsClaim`; hailClosed scan drops the claim. |
| `src/systems/hail.js` | KeyH branch tries the terms hail; `closeCard` drops the claim. |
| `src/game/hail-offer.js` | `willing` available; range/calm gate it; copy. |
| `src/systems/hud.js` | Prompt verb for a willing lock. |
| `src/game/agent-schema.js` | `hailOpened.terms`; `hail` role text. |
| `scripts/issue-122-player-terms-test.mjs` | New focused suite (`npm run test:player-terms`), also in `release-focused.mjs`. |
| `scripts/issue-67-capitulation-feedback-test.mjs` | Willing rows updated to the new contract (card opens, range/calm gate it, no reward on open). |

## Verification

| Check | Result |
|---|---|
| `npm run build` | PASS (1815.58 KiB minified / 544.71 KiB gzip, under the caps). |
| `npm run test:boot` | PASS, unchanged. |
| `npm run test:player-terms` | PASS, 8 groups: willing trader opens the card and a ransom pays credits, fear +3, the yield and a player receipt; capitulate band opens; keepFiring drops the claim and a second H reopens; letGo's calm refuses; yielded / steady / wreck keep their answers; range refuses; the claim does not outlive the card; an NPC wound before the demand does not block it and an NPC hit during the parley closes it stale; `act hail` / `observe` / `hailResolve`; HUD prompt source. |
| `npm run test:capitulation-feedback` | PASS with the willing rows updated. |
| `test:surrender-attribution`, `test:surrender-cargo`, `test:docked-hails`, `test:hail-identity`, `test:agent-hardening`, `test:agent-schema`, `test:nearby-rows` | PASS, unchanged. |
| `npm run test:release-focused` | PASS 18/18, including the new `playerTerms` entry. |
| `npm run test:refusal-tokens` | FAILS on master too: the #118 test still expects `unknown argument burner`, which the merged #120 change replaced with `burner is accepted only with intent 'break-off'|'retreat'`. Not touched here; parked as a separate follow-up. |

### Live browser check (2026-09-11, Vite dev server, `?agent=1`, Greenhand start)

1. Spawned an intact independent freighter (`Cartwheel Ann`, resolve 25,
   6 provisions) 320 u ahead, locked it with `selectTarget`. `observe()` read
   `hail { state: 'willing', available: true, next: 'Hail to demand terms.' }`.
2. A real KeyH keydown opened the card: header `HAIL — ANN CARTWRIGHT`, line
   "Name your terms.", buttons `[1] Demand cargo`, `[2] Demand ransom — 338
   UU`, `[3] Accept tribute — 12 UU`, `[4] Let them go`, `[5] Keep firing`;
   the comm line read "Heard. Name your terms."; `observe().hail` published
   kind `surrender`; the `hailOpened` receipt carried `terms: true`.
3. A real Digit2 keydown paid the ransom: credits 350 → 688, fear 0 → 3, the
   hull yielded and ran, the card closed, `ai.termsAt` read -1, and the lock
   then answered `yielded`.
4. A second willing hull (`Kestrel Mercy`, resolve 12, capitulate band)
   showed the bracket prompt `H — Hail — demand terms` under WILLING TO YIELD.
5. Console: no errors.

## Risks

- A bargaining hull the player hails but never resolves stays hailed
  (`ai.hailed`), exactly as after the NPC-initiated card; H reopens it.
- The claim lapses on any NPC hit after the demand, including a harmless one
  by the NPC that already owned the wound. Chosen deliberately: an NPC still
  shooting the hull is still fighting it.
