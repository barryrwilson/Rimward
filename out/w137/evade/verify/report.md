# Wave 137 evade leftover — verifier report

**Domain:** data  
**Date:** 2026-08-26  
**Status:** CLEAN  
**Worker leftover verdict:** REAL / named serial PR1 — **confirmed**

Did not start Vite, Chrome, Playwright, or CDP. Did not claim ports. Did not edit `src/`, `docs/` (except this verify tree), wishlist, `PROGRESS.md`, or `docs/AgentApiDesign.md`. Did not run `npm run test:boot`.

## 1. Required artifacts

All exist and are non-empty:

| Path | Bytes |
|---|---|
| `docs/AgentApiEvadeDesign.md` | 15005 |
| `out/w137/evade/current-agent-evade-inventory.md` | 13685 |
| `out/w137/evade/shared-contract.md` | 13755 |
| `out/w137/evade/security-review.md` | 7203 |
| `out/w137/evade/code-review.md` | 4615 |
| `out/w137/evade/ui-audit.md` | 4772 |
| `out/w137/evade/notes.md` | 4992 |

Worker did not write `out/w137/evade/verify/**` (folder absent until this pass).

## 2. No src / scripts / public / index.html / package.json writes from this pack

Pack write-set is untracked markdown only:

- `?? docs/AgentApiEvadeDesign.md`
- `?? out/w137/evade/`

Working tree also has dirty `src/`, `scripts/`, `package.json` from **other** waves. `git diff` on `agent-schema.js`, `agent-api.js`, `agent-observe.js`, `controls.js` has **no** `afterburner` / `evade` / `flee` / `pendingAfterburner` lift. This pack did not ship PR1.

## 3. `docs/AgentApiDesign.md` is not this leftover’s PR plan

- New leftover doc is `docs/AgentApiEvadeDesign.md` (untracked; Wave 137 evade freeze).
- `docs/AgentApiDesign.md` remains Wave 126 Agent API. Header is Wave 135 PR6 serial-complete, not evade PR1.
- Working-tree diff is 22 lines: PR6 status, observe `fullStop` / market / session.phase / death events. **No** `afterburner` / `evade` / `flee` / `pendingAfterburner`.
- Git history already has `1fe035f` and `4043397`. This worker is not the only editor.

Wishlist INBOX 292–297 is cited, not rewritten by the evade pack write-set. Wishlist/PROGRESS dirty tree is other workers.

## 4. Live `act` names — leftover REAL is correct

`src/game/agent-schema.js` `COMMAND_NAMES` **17–40**:

ping, disable, plotRoute, clearRoute, engageAutopilot, cancelAutopilot, engageAutomine, cancelAutomine, hailResolve, openService, acceptJob, trade, repairAll, feed, undock, dock, hail, selectTarget, pulse, setWeaponGroup, startGame, chooseOrigin.

**No** `afterburner`, `evade`, or `flee`.

`src/systems/agent-api.js`:

- `PULSE_EDGES` **30**: `dock` \| `hail` \| `target` \| `reticleLock`
- `dispatchLive` default **432**: `unknown`
- `dock` **399–404**: in-zone KeyJ pulse; else `range`
- `berthHold` **622**: `held`
- `act` catch **645–654**: `refuse`

`src/systems/controls.js`:

- `PULSE_EDGES` **64**: four names
- `agentPulse` **252–276**: does not set afterburner
- `pendingAfterburner` **458**: still `initControls`-local
- Space **490–492** still the human sink

Grep of `agent-schema.js` + `agent-api.js` for `afterburner|evade|flee`: **0**. REAL is correct. REAL would be WRONG only if those acts already existed.

Spot-check of inventory cites vs live (schema 17–40, pulse 30, dock 399–404, dispatch 432, held 622, latch 458, steal `autopilot.js` 175, burn `ship.js` 758–766, fear 5 `state.js` 766, hop 60 / death 90, observe `burnerActive` 432 without `burnerReadyAt`, badge `lastPrefix` 462, handle 689–696): **match**.

## 5. HARD LOCKS in contract

`out/w137/evade/shared-contract.md`:

| Lock | Present |
|---|---|
| Pad **2B** non-goal (owner **2A**; tests place 45 u) | §0.6, playable Pad **out** |
| No teleport / no pose write | §0.8, §0.15, §0.22 |
| No third helm | §0.12; helm merge AP > AM > input |
| No in-repo LLM / no `XAI_API_KEY` / no page WebSocket | §0.7 |
| `berthHold` still `held` | §0.13, §0.15 |
| Hypot steal stays (`optIn` latch; afterburner still `inputBreak`) | §0.11; live `autopilot.js` **153–157**, **175** |

`act({ name: 'evade' })` stays unknown in PR1 (§0.10, §3).

## 6. Freeze is one named afterburner pulse

Contract one law: **(a)** named `act({ name: 'afterburner' })` Space-equivalent pulse. **Not** (b) pad-seeker / third helm / Fear retune / cheat warp. Do not ship both in PR1.

- Not pad approach (2A out; write-set omits `station.js`)
- Not Fear mute (do not claim `npc.js`; AI-05 hop/death stay)
- Public verb `afterburner`; `evade` / `flee` / `warp` out
- Later write-set: `agent-schema.js`, `agent-api.js` dispatch, `controls.js` module-scope `pendingAfterburner`; optional observe `burnerReadyAt`

Matches owner freeze.

## 7. Coupling note (not a markdown bug)

MSN-05 (`out/w137/oreguide/shared-contract.md` §1) later-owns `src/systems/controls.js` (`collectCycleCands` group-3 rock filter).

This pack later-owns the **same file** to lift `pendingAfterburner` and extend `agentPulse`.

Regions differ (cycle filter vs afterburner latch). This pack does **not** edit `controls.js` now. Flag as **coupling** for the later impl wave. Not a leftover-markdown bug.

Evade notes already list MSN-05 / oreguide as sibling do-not-steal.

## 8. Ports / processes

This verifier started no Vite/Chrome/Playwright/CDP. No pack-claimed ports.

Host already listens `127.0.0.1:9222` (PID 20800). Pre-existing. Not claimed or stopped by this pass.

## Verdict

Leftover **REAL**, named serial **PR1**, is correct vs live acts. HARD LOCKS and one-pulse freeze hold. No src writes from this pack. `AgentApiEvadeDesign.md` is the new doc.

**CLEAN.**
