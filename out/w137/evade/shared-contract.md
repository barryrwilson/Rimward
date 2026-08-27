# Agent evade / flee shared contract

**Wave:** 137. Design only. No evade ships in this wave.  
**Status:** MERGE LAW for `docs/AgentApiEvadeDesign.md`. If that document and this file ever disagree, **this file wins**.  
**Leftover:** **REAL.** Not CONSUME. Serial is **not** none. Named later serial: **PR1** (named `act({ name: 'afterburner' })` Space-equivalent pulse).  
**Name:** outer-loop afterburner evade.  
**One law:** (a) one named afterburner pulse that reuses live Space / `ship.js` burn. **Not** (b) pad-seeker / third helm / Fear retune / cheat warp. Do **not** ship both in PR1.  
**Not this wave:** any edit under `src/`, `scripts/`, `public/`, `index.html`, `package.json`. Do not edit `docs/PLAYER-EXPERIENCE-WISHLIST.md`, `PROGRESS.md`, `docs/AgentApiDesign.md`, `docs/Ai05StarterGraceDesign.md`, `docs/Nav*.md`, `docs/Ctl*.md`, `docs/Hail0*.md`, `docs/Hud0*.md`, `docs/Tgt*.md`, `docs/Msn*.md`, `docs/OwnerDecisions*.md`. Do not steal sibling Wave 137 packs (`out/w137/routepersist/**`, `out/w137/oreguide/**`). Do not steal optional PR2s (Hail01 / HUD-06 / Hail02 / HUD-07 / NAV-09 / NAV-10 governor / TGT-07 stills / MSN-04 other families / CTL-03 / AI-05 / CTL-04). Do not write `out/w137/evade/verify/**`.

**Locked sources:** wishlist INBOX (P1, AGENT API/AI) Playtest capture 2026-08-27 Claude Fable lines **292–297** (cite, do not edit); live inventory `out/w137/evade/current-agent-evade-inventory.md` (code wins); `docs/AgentApiDesign.md` header/laws as **honor** (do not edit); AI-05 hop/death calm live (`docs/Ai05StarterGraceDesign.md`); owner pick **2A** pad non-goal.

Integrator rule: a **later** implementation wave obeys this file. Inventory cites live code. Code wins over Wave 126 v1 “no afterburner pulse” **for this leftover only**.

**This leftover is evade/flee for the outer loop.** It is **not** NAV-10 human SLOW cue. It is **not** NAV-03 AP. It is **not** pad 2B. It is **not** AI-05 PR2 home-berth bubble.

**Live hole:** no evade/flee/afterburner intent; AP is gate-to-gate; dock is in-zone KeyJ; Fear pacing is AI-05 only. **Leftover is real. Not CONSUME. Serial is not none.**

---

## 0. Orchestrator merge law (do not weaken)

1. This worker is **markdown only**. No `src/`. Later impl is **serial**. Serial PR plan is **named only**. Do **not** land these PRs in `src/` in this worker.
2. HUD-01 empty **80 px hub**. Aim-glass gauges stay off. Kit mutate omit.
3. Digit 0/8/9 stay. **No new Digit.** KeyH/J/L/M/P stay. KeyD strafe. Space stays human afterburner. Do **not** remap keys.
4. `innerHTML` forbidden later. Prototype-safe. Never `for-in` act payload. Use `Object.hasOwn`. Badge / copy uses `textContent` / `createTextNode` / `el()` only.
5. `src/game/state.js` is READ-ONLY later. No new WORLD_FIELDS for evade. No persist of `optIn`. Do **not** invent UU. Do **not** invent SKU. Do **not** invent Digit.
6. Owner pick **2A** still stands: pad “approach and dock” is a v1 **non-goal**. Do **not** land pad-seeker / third helm / warp-to-pad. A later owner pick of **2B** is a **different** wave (`docs/AgentApiDesign.md` far-pad). This pack is **not** 2B. Tests may still place hull in **45** u for dock.
7. **No in-repo LLM. Ever.** No `XAI_API_KEY` in the bundle. No page WebSocket.
8. Do not teleport. Do not cheat dock. Do not invent god-mode. Do not grant hull, credits, cargo, or infinite burn.
9. AI-05 starter grace is live. Do **not** rewrite hop/death calm as this leftover. Do **not** steal AI-05 PR2 home-berth bubble. Prefer an **outer command** over retuning Fear.
10. One named `act`: **`afterburner`**. Do **not** add a parallel `evade` / `flee` / `warp` name in PR1. Do **not** grow `pulse` public edges unless the named act **internally** calls `agentPulse('afterburner')`. Public outer verb is `afterburner`.
11. Pulse **must** honor hypot steal: mouse hypot stays latched while `optIn`. Afterburner / strafe / roll / throttleHeld / drift / fullStop still steal AP/AM as live (`autopilot.js` **172–177**). Do **not** keep AP engaged through an agent burn.
12. No third helm. Helm merge stays AP > AM > input (`ship.js`). Agent afterburner is the **same** `input.afterburnerPressed` edge as Space.
13. CTL-02 never writes `flags.paused`. CTL-03 berthHold: `act` while held still `token: 'held'`.
14. Agent badge stays Wave 134/Fable pin (top-right). Do not cover PWR/range marker. Badge overlap Manifest is a **sibling inbox**, not this pack. Do **not** change badge chrome, copy, or z-index in PR1. `Last: afterburner` uses live `lastPrefix`.
15. Fail closed:
    - Never throw from `act`. Catch → `refuse`.
    - Bad / non-live name → `unknown`. Not a warp.
    - Forbidden names (`teleport`, `warp`, `god`, credit/hull/cargo writers) stay `forbidden`.
    - Non-finite pose → no warp (do not write `ship.object.position`).
    - Missing ctx / missing input → `refuse` or `no-service`. Never throw.
    - Docked → `docked` (do not pulse burn).
    - `flags.paused` → `paused`.
    - `flags.berthHold` → `held`.
    - `optIn !== true` → `opt-in`.
    - Cooldown / low power / already burning: **do not** cheat ready. Pulse may still queue; `ship.js` no-ops. Optional observe `burnerReadyAt` so the outer loop waits. Do **not** skip cooldown in the act.
16. `reducedMotion`: **no** new animation. No badge pulse.
17. Accessibility: Space remains the human afterburner key. Agent name is text on the badge last-intent line. Color is not the only cue.
18. CPU: one pending bool. No second all-ships scan. No per-frame DOM alloc.
19. Prototype-safe: do **not** `for-in` `command.args`. Do not merge raw pose blobs.
20. Do not “fix” known REDMARCH `castMatches` flake.
21. Do not steal sibling Wave 137 packs (NAV-11, MSN-05, routepersist, oreguide). Do not steal optional PR2s listed in the header. Do not steal Agent API optional leftovers. Do not reopen PR1–PR6 as a rewrite of the handle.
22. Do not pause. Do not teleport. Do not remap keys.
23. Do not steal NAV-10 SLOW. Do not steal NAV-03 dests. Do not fly the pad.

---

## 0.1 Wave 137 deputize (owner may override after playtest)

Pick playable **named afterburner pulse**. Inventory proves the hole is **live**. Do not park. Do not invent a third helm unless the owner **replaces** this leftover with pad **2B** in a different wave.

### Live knobs (do not retune as the “fix”)

| Knob | Live | Cite |
|---|---|---|
| `act` afterburner | **not live** | `agent-schema.js` **17–40** |
| Pulse edges | dock / hail / target / reticleLock | `agent-api.js` **30** |
| Space | `pendingAfterburner` in `initControls` | `controls.js` **458**, **490–492** |
| Burn | ×2 / 6 s / 8 s cd / power min 15 | `ctx.js` **60**; `state.js` **147**; `ship.js` **758–766** |
| AP dests | systems | `nav.js` **279–300** |
| Dock | in-zone 45 u | `agent-api.js` **399–404** |
| Drifter fear | **5** | `state.js` **766** |
| Drifter extra grace | **0** | `npc.js` **174** |
| Hop / death | 60 / 90 | `state.js` **588**; `npc.js` **184** |
| Hypot latch | `optIn` | `autopilot.js` **153–157** |
| Afterburner steal | **yes** | `autopilot.js` **175** |

Do **not** “fix” the hole with Fear mute, pad warp, or `__ctx` mouse synthesis.

### Playable policy (smallest additive)

**Name:** while opted in, `act({ v: 1, name: 'afterburner' })` sets the same pending afterburner flag as Space. Next `controls.update` publishes `input.afterburnerPressed` one frame. `ship.js` starts the live burn if ready.

| Piece | Freeze |
|---|---|
| **Who** | Opted-in Agent `act` only. Human Space stays. |
| **Name** | `afterburner`. Not `evade`. Not `flee`. Not `warp`. |
| **Sink** | Lift `pendingAfterburner` to module scope (same pattern as `pendingDock`). `agentPulse` may accept `'afterburner'` **internally**. `agent-api.js` does **not** write `ctx.input`. |
| **Public pulse table** | Keep authored `pulse` edges as live four **unless** PR1 documents `pulse.edge === 'afterburner'` as an alias. Deputize: **named act only** for the outer loop. Alias is optional and must fail-closed on unknown edges. |
| **Queued** | success `ok: true`, `status: 'queued'` (same as dock/hail pulse). |
| **Inner gate** | live `ship.js` (not active, readyAt, power ≥ 15, not docked, not berthHeld). Silent no-op if not ready. **Not** a cheat ready. |
| **AP/AM** | burn **steals** (live `inputBreak`). Outer loop may re-`engageAutopilot` after the edge frame. |
| **Hypot** | stays latched on `optIn`. |
| **Docked** | refuse `docked` before pulse. |
| **Held / paused / opt-in** | live dispatchAct tokens. |
| **Pad** | **out**. Tests place 45 u. |
| **Fear** | **out**. Observe already has `world.fear`. |
| **Observe** | optional PR1: `ship.burnerReadyAt` finite number (HUD-visible cooldown clock). Default: **include**. Do not add `npc.ai`. |
| **Badge** | no chrome change. Last line shows `afterburner` via live lastIntent. |
| **Persist** | **none**. |
| **Fail-closed** | never throw; never pause; never innerHTML; never teleport; never new Digit. |

### Later copy (authored `textContent` literals)

**None required.** Badge `Last: afterburner` uses `BADGE_COPY.lastPrefix` (`agent-api.js` **462**). Do **not** ship jargon `AGENT EVADE`. Do **not** toast on each burn.

Help line `'Space — afterburner'` stays. Do not add an Agent help Digit.

---

## 1. Later write-set (document now; do not edit those files this wave)

**This pack owns later:**

- `src/game/agent-schema.js` — add `'afterburner'` to `COMMAND_NAMES` and the live set (PR3-live or a named evade-live set). Do **not** add teleport. Do **not** remove forbidden names.
- `src/systems/agent-api.js` — `dispatchLive` branch `afterburner`: docked → `docked`; else `afterControls(..., agentPulse(ctx, 'afterburner'), true)`. Never write pose / credits / `flags.paused`.
- `src/systems/controls.js` — lift `pendingAfterburner` to module scope; `agentPulse` accepts `'afterburner'`; Space keydown still sets the same flag.
- Optional same PR1: `src/game/agent-observe.js` `ship.burnerReadyAt` as finite-or-omit number. Do not dump `npc.ai`.

**Do not claim:**

- `src/systems/npc.js` starter grace / death calm / interest (AI-05).
- `src/game/autopilot.js` dests / pad path / hypot law rewrite (except if a one-line comment is required; default **do not** edit).
- `src/systems/ship.js` burn machine retune (duration / cooldown / min power stay).
- `src/systems/station.js` dock / pad approach.
- `src/systems/hud.js` layout / SLOW lamp (NAV-10) / Manifest.
- `src/style.css` badge pin (Wave 134/Fable).
- `src/game/state.js` / WORLD_FIELDS / `ORIGINS.drifter` fear.
- `src/game/origins.js`.
- Sibling NAV-11 / MSN-05.

---

## 2. Partial merge forbidden

PR1 must land **together**: schema name + dispatch + lifted pending latch + `agentPulse('afterburner')` + never-throw. Shipping observe `burnerReadyAt` without the act is forbidden as the “fix”. Shipping a pad helm **and** afterburner is forbidden. Shipping Fear mute **and** afterburner is forbidden.

Observe `burnerReadyAt` **may** land in the same PR1. Default: include.

---

## 3. Serial PR plan (named only)

| PR | Lands | Does not land |
|---|---|---|
| **PR1** afterburner evade | named `afterburner` act; module-scope pending; Space-equivalent pulse; optional observe `burnerReadyAt`; fail-closed tokens | pad 2B; third helm; Fear retune; teleport; god-mode; persist optIn; badge move; NAV-10; AI-05 rewrite; `evade` alias; `innerHTML`; Digit; key remap |
| **PR2 stills (optional)** | playtest still: opted-in Fear 5 drifter `act afterburner` → `burnerActive` true without `__ctx` keys; AP stolen; hub empty; badge Last: afterburner | required with PR1 |
| **PR3 census (optional skip)** | re-grep `COMMAND_NAMES` includes `afterburner`; `act({name:'evade'})` still unknown | new world field |

First remaining serial is **PR1**.

---

## 4. Formulas (later impl; named only — do not implement this wave)

```
agentPulse(ctx, edge):
  if edge not in { dock, hail, target, reticleLock, afterburner }: return 'unknown'
  if edge === 'afterburner':
    pendingAfterburner = true   // module scope, same flag Space uses
    return ''
  // live dock/hail/target/reticleLock unchanged

dispatchLive afterburner:
  if flags.docked: fail 'docked'
  return afterControls(name, agentPulse(ctx, 'afterburner'), queued=true)

ship.js (unchanged):
  if afterburnerPressed and !burnerActive and time >= burnerReadyAt and power >= 15
    and !docked and !berthHeld:
      start burn
  never warp pose

act:
  never throw
  unknown name → unknown
  forbidden → forbidden
  berthHold → held
  non-finite pose → do not write position
```

Playtest (Fear 5 drifter, pirate in bubble, opted in): outer loop `act afterburner` without synthetic Space. Hull burns at ×2 if ready. No teleport. No pad seeker.

---

## 5. Later tests (named only — do not add this wave)

If a later wave adds tests, defend:

1. Opted-in `act({ name: 'afterburner' })` → `ok: true`, `status: 'queued'`; after one `update`, `input.afterburnerPressed` was seen and `ship.burnerActive` true when ready/power ok.
2. `act({ name: 'evade' })` and `act({ name: 'flee' })` → `unknown`.
3. `act({ name: 'teleport' })` / `warp` / `god` still `forbidden`.
4. Not opted in → `opt-in`. Held → `held`. Paused → `paused`. Docked → `docked`.
5. Cooldown: pulse may queue; `burnerActive` stays false; pose unchanged.
6. Afterburner still disengages AP (`inputBreak` `'input'`).
7. Mouse hypot while `optIn` still does **not** steal AP.
8. `ship.object.position` unchanged except by live physics (no warp).
9. `act` never throws on proto args / missing input.
10. `COMMAND_NAMES` does not include pad-seeker / `approachAndDock`.

Do **not** add tests that “fix” REDMARCH `castMatches`.
