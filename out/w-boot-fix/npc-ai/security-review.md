## Security Review: npc.js `live.ai` skip

### Risk Level: Low

### Summary
The change is a client-side sim update-loop skip for list entries without `ai`. No network, auth, crypto, or DOM write.

### Findings

None.

### Passed Checks
- [x] No secrets in code
- [x] No innerHTML / HTML injection
- [x] No new user input path
- [x] Destroyed wrecks still run `handleDestroyed` when `ai` exists
- [x] Skip does not invent standing, cargo, or hail state
- [x] No new logs of player data

### Recommendations
1. Leave the WAVE74 dummy out of `ctx.ships` in a later harness pass if pins allow. The npc skip is the production-safe backstop.
