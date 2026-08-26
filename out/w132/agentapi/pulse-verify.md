# Pulse/act scoped verify

Status: CLEAN

Probes:
- `node out/w132/agentapi/pulse-probe.mjs` → pass
- `node --import ./scripts/with-css-stub.mjs out/w132/agentapi/pulse-verify-probe.mjs` → 113 pass, 0 fail

No Vite/Chrome. Ports 5173/4173/3000/5174 not in use from this run.
