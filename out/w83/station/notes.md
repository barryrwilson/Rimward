# Wave 83 station notes

Constants: `SPY_EXPOSE_DELTA = -2`, `WAR_TARGET_DELTA = -2`, `RESTITUTION_UU = 1200`, `CHAIN_ROOM = 7`.

Authored chains live in `src/game/jobs-chains.js`. Restitution desk helpers live in `src/game/restitution.js`. `save.js` duplicates the 12-id allowlist and origin table so sanitize does not import station.

WAVE80 pins now match Wave 83 dest law:
- War success: `destMinus2` (live dest faction −2, stuffed dest ignored). Expire still `expireNoTarget`.
- Spy accepted lapse: `expireDestMinus2` (dest −2, employer 0, no pay). Offered withdraw: `offeredWithdrawQuiet`. Success still `targetZero`.
