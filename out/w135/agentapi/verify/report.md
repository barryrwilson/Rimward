## Status
CLEAN

## What I tested
- I ran `node scripts/agent-bridge.mjs --self-test` from C:\Projects\WebSim. Exit code 0. All pins true.
- I ran `node scripts/agent-bridge.mjs --help`. The process printed usage and exited with code 0.
- I read `scripts/agent-bridge.mjs`, `package.json`, and `src/systems/agent-api.js`.
- I confirmed `scripts/agent-demo.mjs` is absent.
- I did not start Vite or Chrome. Self-test covers HTTP 401 without a token.

## Bugs found

## Environmental issues

## Evidence
- Logs: out/w135/agentapi/verify/self-test.txt
- Logs: out/w135/agentapi/verify/help.txt
- Logs: out/w135/agentapi/verify/help-status.txt
- Notes: out/w135/agentapi/verify/contract-check.txt
