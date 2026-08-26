# Wave 126 — RIMWARD agent API shared contract

**Wave:** 126 leftover freeze. Design only. Bindings do not change in this wave.  
**Status:** MERGE LAW for `docs/AgentApiDesign.md`. If that document and this file ever disagree, **this file wins**. Leftover **REAL**. Named serial **PR1** (observe handle). Not CONSUME. Not serial none.  
**Inbox:** P2 AGENT API in `docs/PLAYER-EXPERIENCE-WISHLIST.md` (**cite, do not edit**).  
**Inventory (code wins):** [`current-agent-api-inventory.md`](./current-agent-api-inventory.md). Census: no `window.rimward` in `src/`; `__ctx` is debug (`main.js` **79**); empty `e.code` never reaches `TRACKED` (`controls.js` **315–316**). Wave 125 `berthHold` is live and is **not** this leftover.  
**Not this wave:** any edit under `src/`, `scripts/boot-test.mjs`, `public/`, `index.html`, `package.json`, `PROGRESS.md`, `docs/PLAYER-EXPERIENCE-WISHLIST.md`. Do not write `docs/OwnerDecisionsWave126.md`. Do not steal NAV / HUD / CTL / PHY / BIO / SHP / REP leftovers. Do not steal Hail01 demand lifecycle or Hud06 home-marker.

Integrator rule: a **later** implementation wave obeys this file. **Revision 4** (Wave 126 leftover freeze after Wave 125 census). Owner Open Questions stay locked: opt-in A, pad 2A, bridge 3A, never in-repo LLM 4C, grok-4.5 external-only 5, pause A. No Wave 126 PR7/PR8.

---

## 0. Orchestrator merge law (do not weaken)

1. This worker is **markdown only**. Later impl is **serial**. Named PRs only. Do **not** land `src/` in Wave 126.
2. HUD-01 empty **80 px hub**. Aim-glass gauges stay off. Kit mutate omit. **No new Digit.** Digit 0/8/9 stay station. Digit 1–5 stay flight WPN. `innerHTML` forbidden later. Toasts stay `textContent`.
3. `window.__ctx` stays debug/harness (`main.js` **79**). It is **not** the public contract. The public surface is versioned and **smaller than dumping ctx**.
4. Ownership stays: `input` only `controls.js`; `autopilot` only `autopilot.js`; `automine` only `automine.js`; ship transform only `ship.js`. Agent code must **call** those writers (or new wrappers they own). Agent code must **not** assign `ctx.input` / `ctx.ship.object.position` / `ctx.world.credits`.
5. Do **not** teleport. Do **not** grant credits, hull, cargo, or ammo. The agent plays the same systems a human uses (dock zone, jump zone, station services, hail). Existing human dock snap (`2 × DOCK_RANGE`) may be reused only by pulsing the same dock path. **v1 does not implement in-system pad approach.** Owner pick **2A**: tests that need `dock` **place the hull in `U.DOCK_RANGE` (harness privilege)** then pulse KeyJ. After AP the ship is at a gate, not at the pad. Do **not** land `agentHelm` in Wave 126.
6. `src/game/state.js` is READ-ONLY later unless a later census **proves** a persist key is required. Default: **no** new `WORLD_FIELDS`. Agent session lives on a live channel (like `ctx.autopilot`), not save. Restore must not set `optIn`.
7. Split loops: **inner** = existing ~60 Hz flight / AP / AM / combat / station. **outer** = compact JSON observe + high-level intents. Do not send pixels. Do not send raw axes every frame. Signature: `act({ v, name, args })` only. Not `act(name, args)`.
8. Watch surface = the **live WebGL canvas** on the same page. Not a screenshot slideshow. Optional `?agent=1` chrome (badge) is **PR5**, not the 80 px hub. Same-tab watch is **broken** until the PR3 reticle latch: mouse hypot must not cancel AP/AM while `optIn` (mirror `helmSteerLatched` / chartOpen). Do not call the canvas the watch surface in PR1–PR2 copy.
9. Network: **local / explicit opt-in only**. Never bind `0.0.0.0` or `::`. First impl PRs need **no** HTTP server. Optional PR6 (owner **3A**) binds `127.0.0.1` (optional `::1`) and talks the **same** schema. **Node holds the page via CDP / Playwright `evaluate`**. **No page WebSocket.** Token compare: convert both sides to `Buffer`; if lengths differ, run `timingSafeEqual` on a dummy equal-length pair and **return false**; if lengths match, `crypto.timingSafeEqual` on the full buffers. Do **not** throw on length mismatch. Do **not** compare a prefix. Token never in the Vite bundle, never in a query the page script reads from env. Never `XAI_API_KEY` on this socket.
10. This is not a cheat console. No god-mode command. Observe may include HUD-visible numbers (credits, hull). Observe is **origin-public** whenever the sim boots (same class as `__ctx`); opt-in does **not** gate observe. Observe must **not** include hidden AI rolls, unspawned banks, renderer internals, or functions. Never log snapshots.
11. **Never** ship an in-repo LLM runner (`scripts/agent-demo.mjs` or equal). External agents only (owner **4C**). If someone later writes an **external** client, document model **grok-4.5**, env `XAI_API_KEY`, base `https://api.x.ai/v1`. **Never** put the key in the browser bundle. Confirming docs.x.ai is **not** a Wave 126 task (owner **5**).
12. Accessibility fallback (`key` set, `code` empty): named **PR4**. Shared helper `src/systems/key-code.js`. Callers: `controls.js`, pause listener in `main.js`, `station.js`, `hail.js`, `galaxychart.js`. **`overlay-policy.js` stays read-only.** `title.js` capture-phase stays **out of PR4**. Keep `e.code` as the primary token; fill from an authored map when `code` is empty. Letters via `toLowerCase()`. Do not remap Digit 0/8/9.
13. Fail closed. Never throw out of `observe` / `act`. Unknown command → `{ ok: false, error: 'unknown', token: 'unknown' }`. Missing ctx → observe `{ ok: false, error: 'no-ctx' }` empty body. Missing flags → refuse the intent, do not freeze the sim. Prototype-safe: authored command names / `Object.hasOwn`. Never `for-in` a blob into ctx. Never assign position/credits from `agent-api.js`.
14. Do not steal leftover serials: CTL-03 PR2 stills, CTL-04 PR2 `fireHeld`, AI-05 PR2 home bubble, NAV hover/handoff leftovers, HUD skins.
15. Later `npm run test:boot` must still pass. Named pins may **add** observe/act assertions. Do not "fix" known unrelated FAILs. This design wave does **not** run boot or Playwright.
16. Do not edit the wishlist, `PROGRESS.md`, `docs/Ctl*.md`, `docs/Nav*.md`, `docs/Hud*.md`, `docs/OwnerDecisions*.md`.
17. Event log for observe is **not** `ctx.lastEvents` (one frame, `main.js` **155–156**). PR1 owns a session ring on `ctx.agent.events` (cap 16, primitives, authored types only).
18. Desk/hail attach like `ctx.models` (`modelsbrowser.js` **16–17**, **832–836**): **`ctx.stationDesk`** and **`ctx.hailApi`**. Do **not** hang functions on the HUD pose `ctx.station` (`station.js` **4404–4411**). PR2 write-set: **attach helpers only**. No overlay CSS/HTML rewrite.
19. Pulse then **one systems `update`** before asserting dock/jump/edges. Do not assert `flags.docked` in the same tick as `act({ name:'dock' })` (boot-test **1137–1139** pattern).
20. Wave 125 `flags.berthHold` (`ctx.js` **211**): agent-api **must not** write it. Observe may copy the boolean. While `berthHold === true`, `act` except `ping` / `disable` returns `{ ok:false, error:'held', token:'held' }`. Do **not** map hold onto `paused` (LOAD + CTL-02). Do **not** add `berthHold` to automine hypot (AP already latches hold; AM is chart-only today — `automine.js` **169–171**). PR3 latches **`optIn` only** on AP and AM hypot.
21. Observe builder copies **authored fields only** into a fresh object (contract §0.2.1). Never `JSON.stringify(ctx)`. Never return functions, THREE, buffers, `stationDesk`, `hailApi`, `__ctx`, save slots, or `npc.ai`. `hailOpened` never includes `ship`. Missing ctx → `{ v:1, t:0, ok:false, error:'no-ctx', agentOptIn:false, events:[] }`.

---

## 0.1 Deputize (owner may override after playtest)

| Knob | Freeze |
|---|---|
| Architecture | **Handle first** (`window.rimward` v1). Optional **127.0.0.1** CDP bridge later, same schema. Not HTTP-first. Not MCP-first. Not a third helm in Wave 126. Not HTTP in PR1. **Never** in-repo LLM. |
| `act` signature | `act({ v, name, args })` → `{ v, ok, error, name, token }` |
| Opt-in matrix | See §0.1.1. Query `agent=1` sets `optIn` at boot. Playwright uses the query, **not** `enable()`. |
| Schema version | integer `1` on every observe/act envelope |
| Observe | Always allowed. Origin-public HUD-visible JSON. Not gated by opt-in. |
| Observe rate | agent-chosen; recommended 1–2 Hz. Pull `observe()`, not a 60 Hz dump. |
| Events | `ctx.agent.events` ring cap 16. Harvest `ctx.events` in `agent-api` `update`. Never product-walk `lastEvents`. |
| Inner helm | existing AP / AM / `input`. **No third helm in Wave 126.** Owner **2A**. |
| Watch-mode latch | While `ctx.agent.optIn === true`, AP/AM **must not** treat mouse hypot as `input` interrupt (`autopilot.js` **153–177**, `automine.js` **166–185**). Still steal on strafe, roll, `throttleHeld`, afterburner, drift, `fullStop`, Disable. **PR3.** Latch **`optIn` only**. Do not steal CTL-03 by adding `berthHold` to automine. |
| Pulse edges | authored only: `dock` \| `hail` \| `target` \| `reticleLock`. Weapon group is `setWeaponGroup`, not pulse. **No** `camera` / `afterburner` pulse. **No** raw axes. |
| Fire held | **not** a v1 command (do not steal CTL-04 PR2). |
| Station desk | `ctx.stationDesk` assigned at `initStation`. Hail: `ctx.hailApi` at `initHail`. |
| Desk play v1 | `openService` + `acceptJob` + `trade` + `repairAll` + `feed` + `undock`. Jobs/trade/repair/feed require `flags.docked` **and** matching `ui.service`. Bar / outfitting / people / epics / shipyard: `openService` ok, further acts `token: 'v1-observe-only'`. |
| Chart | `plotRoute` export is enough. **No** `openChart` in v1. |
| Pad approach | **v1 non-goal (owner 2A).** `dock` = KeyJ in zone. Tests place hull in 45 u. Not a Wave 126 PR. |
| Watch chrome | PR5 badge. `textContent`. Not HUD hub. Not a new Digit. Not a watch claim before PR3 latch. Frozen copy §0.1.2. |
| Berth hold | Observe copies `flags.berthHold`. `act` except ping/disable → `token:'held'`. Never write hold. Never impersonate pause. |
| Loopback PR6 | Owner **3A**. Node + CDP/evaluate. Bind `127.0.0.1` (optional `::1`). Refuse `0.0.0.0` / `::`. Equal-length full-buffer `timingSafeEqual` (law 9). **No page WebSocket.** |
| LLM runner | **Never in-repo** (owner **4C**). External grok-4.5 client only. |
| Persist | none new. `writeNav` always `autopilot: false` (`nav.js` **54**, comment **191–192**). |
| `reducedMotion` | n/a for API; badge must not pulse if reducedMotion |
| Qty clamp | `trade` qty integer `1..min(99, cargoCapacity)`; commodity `Object.hasOwn(COMMODITIES)` and market-legal as live `tryTrade` |

### 0.1.1 Opt-in matrix (owner **1A** — frozen)

| Situation | `observe` | `act` `ping` | other `act` | `enable()` |
|---|---|---|---|---|
| No query, `optIn` false | allowed | `{ ok:false, error:'opt-in', token:'opt-in' }` | same | Trusted click (`isTrusted === true`) sets `optIn`. Playwright `evaluate` is **not** a user gesture. |
| `?agent=1` at boot | allowed | ok (PR1+) | ok once PR2+ implements the name | no-op (already in) |
| `enable()` without `isTrusted` | — | — | — | `{ ok:false, token:'opt-in' }` |
| `flags.paused === true` | allowed | ok | `{ ok:false, token:'paused' }` except `disable` | — |
| `flags.berthHold === true` | allowed | ok | `{ ok:false, token:'held' }` except `disable` | — |
| Unknown `name` | — | — | `{ ok:false, token:'unknown' }` | — |

`disable()` clears `optIn` and **does not** cancel AP/AM (leave helm as found).

PR1 implements `observe` + `ping` only. Other names → `unknown` until PR2/PR3. PR1 **does** read `?agent=1` into `optIn` (no badge required). Pause and hold still apply to later names; `ping` stays ok.

### 0.1.2 PR5 badge copy (frozen `textContent` literals)

Player-facing. Not a Digit. Not `#hud` 80 px hub. Sibling of `#app` (or `document.body` child). `textContent` only. Color is not the only cue (`hud.css` **4**). Reuse HUD tokens (`--rw-accent` `#6ff2e0`, `--panel`, `--white`) via a class in `style.css`, not a hub child.

| Role | Literal |
|---|---|
| Title | `Agent play` |
| State on | `on` |
| State off | `off` |
| Last none | `Last: none` |
| Last intent | `Last: ` + authored `name` (no interpolation of dest/id into HTML) |
| Error none | empty string |
| Error | `Error: ` + `error` string from last act (English already live) |
| Enable | `Enable agent play` |
| Disable | `Stop agent play` |
| Hint | `Stop does not cancel Autopilot.` |

`aria-live="polite"` on the **status line** (title + on/off + last + error), not on the buttons. Enable/Stop are `<button type="button">`. Visible focus ring. Hit target ≥ 44 px. `z-index` below pause (50) and berth (60); do not cover the 80 px reticle hub. `pointer-events: auto` on the badge only. `reducedMotion`: no pulse, no blink. Default: no animation.

---

## 0.2 Public envelope (named freeze; not implemented)

`act` input:

```js
{ v: 1, name: 'plotRoute', args: { dest: 'veridian' } }
```

`act` result:

```js
{ v: 1, ok: true, error: '', name: 'plotRoute', token: '' }
```

`token` is an authored enum (`opt-in`, `paused`, `held`, `unknown`, `forbidden`, `noDest`, `docked`, live `AP_LINES` / `AM_LINES` keys, desk `v1-observe-only`, `no-service`, `bad-qty`, `bad-commodity`, …). `error` may copy live English (`AP_LINES`, `ui.notice`). Empty `token` means success. `held` is berth hold, **not** KeyP.

Forbidden names (must `ok: false`, `token: 'forbidden'`): `teleport`, `setCredits`, `setHull`, `setCargo`, `god`, `win`. Also refuse if `name` would assign position or credits.

Authored `name` values:

| Name | PR | Notes |
|---|---|---|
| `ping` | PR1 | health |
| `plotRoute` | PR2 | `args.dest` system id |
| `clearRoute` | PR2 | |
| `engageAutopilot` | PR2 | watch-usable after PR3 latch |
| `cancelAutopilot` | PR2 | |
| `engageAutomine` | PR2 | |
| `cancelAutomine` | PR2 | |
| `hailResolve` | PR2 | needs open card; `hail` pulse is PR3 |
| `openService` | PR2 | authored `DOCK_KEY_SERVICES` id |
| `acceptJob` | PR2 | needs `service === 'jobs'` |
| `trade` | PR2 | needs `service === 'market'` |
| `repairAll` | PR2 | needs `service === 'repair'` |
| `feed` | PR2 | needs `service === 'feed'`; `args.kind` |
| `undock` | PR2 | docked |
| `dock` | PR3 | pulse `pendingDock`; in-zone only |
| `hail` | PR3 | pulse `pendingHail` |
| `selectTarget` | PR3 | cycle or `args.id` |
| `pulse` | PR3 | `args.edge` in `dock`\|`hail`\|`target`\|`reticleLock` |
| `setWeaponGroup` | PR3 | `args.n` 1–5; `shouldSkipWeaponGroupDigits` |
| `disable` | PR1 | clears optIn |

### 0.2.1 Frozen observe snapshot (every key)

Missing ctx → `{ v:1, t:0, ok:false, error:'no-ctx', agentOptIn:false, events:[] }` and omit the rest.

Success shape (types and null rules). Numbers finite or `null`. Strings or `''`. No THREE, no functions, no `stationDesk`.

```js
{
  v: 1,                    // number, always 1
  t: 0,                    // number, ctx.world.time or 0
  ok: true,                // boolean
  error: '',               // string
  agentOptIn: false,       // boolean, ctx.agent.optIn === true
  ship: {
    pos: [0, 0, 0],        // number[3] or null if no object
    fwd: [0, 0, -1],       // number[3] or null
    speed: 0,              // number
    throttle: 0,           // number, input.throttle (HUD setpoint)
    weaponGroup: 1,        // 1..5
    hull: 0, hullMax: 0,   // from ctx.player; missing → null
    screen: 0, screenMax: 0,
    shell: 0, shellMax: 0,
    engine: 0, engineMax: 0,
    power: 0,              // number or null
    heat: 0,
    overheated: false,
    engineOut: false,
    burnerActive: false,
    driftActive: false
  },
  flags: {
    docked: false,
    combat: false,
    paused: false,
    chartOpen: false,
    hailOpen: false,
    berthOpen: false,
    berthHold: false,
    matchSpeed: false,
    camera: 'chase'        // 'chase'|'third'|'first'
    // jumping is NOT here — live flag is ctx.gate.jumping
  },
  world: {
    currentSystem: '',     // string
    credits: 0,
    fear: 0,
    cargoCapacity: 0,
    cargo: []              // [{ commodity: string, units: number }]
  },
  bio: {                   // HUD-true; omit internals
    mood: 'serene',
    hunger: 0,
    wounds: 0,
    bond: 0
  },
  nav: null,               // or { dest, path, remaining, status, autopilot }
  gate: {
    inZone: false,
    nearTo: null,          // string or null
    jumping: false,        // ctx.gate.jumping
    progress: 0,
    destination: null
  },
  station: {               // pose copy only — never ctx.stationDesk
    inZone: false,
    name: '',
    systemName: '',
    service: null,         // current desk id or null
    services: []           // DOCK_KEY_SERVICES when docked, else []
  },
  jobs: [],                // docked only: [{ id, kind, state, reward }]
  targets: {
    current: null,         // see target row
    nearby: []             // cap 12; ships + rocks if group 3 or rock lock
  },
  hail: {
    open: false,
    intents: []            // string[] when open; else []
  },
  autopilot: { engaged: false, reason: '' },
  automine: { engaged: false, reason: '' },
  lastIntent: { name: '', ok: true, error: '', token: '', t: 0 },
  events: []               // ring, cap 16, { type, t, ...primitives }
}
```

**Target row:** `{ kind: 'ship'|'rock'|'station'|'gate'|'pod'|'landmark', id: string|number|null, name: string, range: number }` or `null`. Rock `id` is asteroid list index. Nearby includes locked/current even if outside sort.

**Event types (authored, PR1 ring):**  
`commLine`, `docked`, `undocked`, `hailOpened`, `hailClosed`, `navRoute`, `autopilotEngaged`, `autopilotDisengaged`, `automineEngaged`, `automineDisengaged`, `jumpRequested`, `systemLoaded`, `playerHit`, `shieldDown`, `milestone`, `originChosen`, `saveBlocked`, `playerFire`, `reticleLock`.  
`hailOpened` payload: `{ type, t, intents, salvage }` only — **never** `ship`. Unknown types dropped. Non-primitives stripped.

---

## 0.3 Neighbour write-set (later, named)

| Module | This leftover may | Must not |
|---|---|---|
| `src/game/agent-schema.js` (new) | version, names, errors, snapshot keys | persist; THREE |
| `src/game/agent-observe.js` (new) | JSON snapshot builder | write ctx; dump scene; walk lastEvents as product log |
| `src/systems/agent-api.js` (new) | `window.rimward`; `act`; `ctx.agent`; event ring harvest | write `input` / ship / credits / position |
| `src/main.js` | init after hail/save/chart, before or with HUD; pause `key` fallback (PR4) | replace `__ctx`; new Digit |
| `src/core/ctx.js` | header + `ctx.agent` session | WORLD_FIELDS; helm steal in PR1–PR3 |
| `src/systems/controls.js` | pulse sink; empty-`code` helper use | remap KeyJ/D; Digit 0/8/9; assign from agent-api |
| `src/game/autopilot.js` / `automine.js` | PR3: treat `optIn` like chart latch for hypot | new jump emit; teleport |
| `src/game/nav.js` | **call** `plotRoute` / `clearRoute` | change `writeNav` AP-false |
| `src/systems/station.js` | assign `ctx.stationDesk` helpers only | hang fns on `ctx.station`; CSS/HTML rewrite; new services |
| `src/systems/hail.js` | assign `ctx.hailApi` | hail-card redesign |
| `src/systems/key-code.js` (new, PR4) | decode empty `code` | overlay-policy write; title.js |
| `src/systems/hud.js` | **none** in PR1–PR6 except cite | hub child; new Digit |
| `src/game/state.js` / `save.js` | **none** | persist; UU; SKU |
| `src/systems/overlay-policy.js` | **read** | write |
| `src/systems/title.js` | **none** in PR4 | capture rewrite |
| `scripts/boot-test.mjs` | named pins: JSON-plain, no THREE, ring survives 30 frames, forbidden names, no-ctx | rewrite harness as public API |
| later `scripts/agent-bridge.mjs` | 127.0.0.1 + CDP | 0.0.0.0; page WebSocket |
| `scripts/agent-demo.mjs` | **do not add** | in-repo LLM |

---

## 3. Serial names (named only; not implemented here)

| PR | Name | Must land | Must not |
|---|---|---|---|
| PR1 | Agent observe handle | schema, observe, event ring, `?agent=1`→`optIn`, `ping`, snapshot fixture | HTTP; LLM; helm; badge required; lastEvents-as-log |
| PR2 | Agent command intents | stationDesk/hailApi attach **only**; plot/AP/AM/desk/hailResolve | overlay HTML; third helm; pulse; pad warp; CSS |
| PR3 | Controls pulse sink + watch latch | pulse edges; dock/hail/target; hypot skip while optIn | HTTP; LLM; third helm; fireHeld steal |
| PR4 | Empty `code` fallback | key-code helper + listed listeners | title.js; overlay-policy write |
| PR5 | `?agent=1` watch badge | textContent badge | hub child; innerHTML; claim watch without PR3 |
| PR6 | Loopback CDP bridge (optional) | 127.0.0.1; evaluate; equal-length `timingSafeEqual` | 0.0.0.0; HTTP in PR1; **page WebSocket**; prefix compare |

Wave 126 serial **ends at PR6**. No PR7 runner. No PR8 helm. Same-tab watch is a **PR3** property, chrome is **PR5**. First impl PRs land **without** an LLM. **Never** in-repo LLM.
