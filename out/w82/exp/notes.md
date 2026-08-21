# Wave 82 EXP economy notes

## Probe
`node --import ./scripts/with-css-stub.mjs out/w82/exp/probe.mjs`

49 pins PASS. Covers drop 0.20, spawn fail-closed and matching tokens, Archive 400/900 debit/credit, hostile no sale, hold full, captured cube refuse, launder 250 captured → legal, no fixer, Esc.

## Browser
Did not start a second Vite. Optional Assembly Market Archive at http://localhost:5173 was not required after the node probe.

## Stale pins elsewhere
Wave 74 `scripts/boot-test.mjs` `spawnSkip` still expects drop unset. Out of write-set.

## Owner numbers used
- DATA_DROP_RATE 0.20
- ARCHIVE_OWN_UU 400
- ARCHIVE_RIVAL_UU 900
- LAUNDER_UU 250
