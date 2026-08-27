# W136 agent-bridge smoke verify

Verdict: CLEAN
Command: `npm run agent:bridge:smoke` from C:\Projects\WebSim
Exit: 0
When: 2026-08-26T22:23:13Z start, teardownPortsFree logged 2026-08-26T22:24:00Z

## Pins (stdout JSON; no AGENT_TOKEN present)

```
healthReady: true
liveFwd: true
httpPing: true
wsPing: true
forbiddenTeleport: true
originChosen: true
loopAlive: true
systemTransition: true
teardownPortsFree: true
vitePort: 5188
bridgePort: 8877
wsProtoPing: true
t0: 0.1149
t1: 16.1689
last.currentSystem: veridian
last.nav.status: arrived
last.events include originChosen, jumpRequested, systemLoaded
```

World time advanced (t0 -> t1). Jump completed to veridian.

## Token

Stdout JSON has no `AGENT_TOKEN` string.
`out/w136/smoke/bridge.log` shows `AGENT_TOKEN=<redacted>` only.

## Teardown (after command exit)

- Vite 5188: not LISTENING (TIME_WAIT only)
- Bridge 8877: not LISTENING (TIME_WAIT only)
- Chrome CommandLine match `rw-agent-bridge-`: none
- PID 20800 on 9222 left running (msedgewebview2; predates this work)

No leftover Vite/bridge/Chrome trees from this run.
