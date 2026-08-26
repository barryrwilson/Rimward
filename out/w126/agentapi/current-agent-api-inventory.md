# Wave 126 — current agent-play surface inventory

**Wave:** 126 leftover freeze. Design only. Code wins.  
**Census date:** 2026-08-25 (Wave 125 src: berthHold, starter grace, menu digits).  
**Purpose:** freeze what an external agent can actually see and drive **today**, before a public `window.rimward` exists.  
**Not this file:** implementation. Do not treat this as the public contract. Merge law is [`shared-contract.md`](./shared-contract.md).  
**Revision 3:** Wave 125 census. `berthHold` is **live**. `overlay-policy.js` owns `berthHeld` / `setBerthHold`. Autopilot hypot latches chart **or** berth hold. Automine hypot latches **chart only**. `gate.js` emit skips hold. No `window.rimward` in `src/` / scripts / HTML.

---

## 0. Verdict

There is **no** versioned public agent API.

Grep `window.rimward` under `src/`, `scripts/*.mjs`, and `index.html`: **zero hits**. `ctx.agent`, `stationDesk`, `hailApi`, `initAgentApi`: **absent**.

Agents and harnesses drive the sim through:

1. `window.__ctx` (full debug object).
2. Direct writes to `ctx.input.*` (boot-test and capture scripts; this **violates** the public ownership comment if copied as a product API).
3. Synthetic `keydown` objects that must carry `e.code` (empty `code` never reaches `TRACKED`).
4. Screen-scraping / screenshots (wishlist playtest).

Autopilot and automine already supply an **inner-loop** command computer (frame-rate yaw/pitch/throttle). That is the pattern to reuse. Do **not** dump `__ctx`. Do **not** teleport. Do **not** grant credits, hull, or cargo.

Leftover / inbox item is **REAL**. Named serial is **PR1** (observe handle). Serial is **not** none. CONSUME is **not** proven.

Wave 125 landed `ctx.flags.berthHold`. That is **not** an agent API. Do not steal CTL-03 PR2 stills.

---

## 1. Debug / harness handles

| Surface | Today | Cite |
|---|---|---|
| Public agent handle | **none** (`window.rimward` not in `src/`, scripts, `index.html`) | repo grep |
| Debug ctx | `window.__ctx = ctx` | `src/main.js` **79** |
| Comment | "debug/test handle (read-only inspection + harness drives)" | **79** |
| Boot harness | Node stub DOM + `createCtx` + same init graph | `scripts/boot-test.mjs` |
| Synthetic key | `dispatchKey(code)` fires `{ code, repeat: false }` with **no** `key` | boot-test **258–263** |
| Harness input writes | `ctx.input.throttle`, `fireHeld`, `dockPressed`, `weaponGroup` assigned directly | boot-test **573**, **1137**, **6736** |
| Capture scripts | Playwright `page.evaluate` waits on `window.__ctx` | `out/flt-verify/capture-flt.mjs` **52** |
| WebGL watch | live `renderer.setAnimationLoop` + canvas in `#app` | `src/main.js` **65**, **146–158** |
| `index.html` | `#app` canvas host, `#hud`, `#fatal`; no agent chrome | `index.html` **11–13**, **26** |
| npm scripts | `dev` Vite; `test:boot` Node harness; **no** agent server | `package.json` **6–10** |

`window.__ctx` stays debug/harness. A product agent must not require it.

---

## 2. Ownership (do not break)

From `src/core/ctx.js` header **13–39** and the live object:

| Channel | Writer | Cite |
|---|---|---|
| `ctx.input` | **only** `controls.js` | `ctx.js` **15**, **72–94** |
| `ctx.autopilot` | **only** `autopilot.js` | **16**, **96–105** |
| `ctx.automine` | **only** `automine.js` | **17**, **107–115** |
| `ctx.ship` transform | **only** `ship.js` | **18**, **117–126** |
| `ctx.player` | `ship.js` creates; combat/state mutate | **19–20**, **128–129** |
| `flags.docked` | `station.js` only | **31**, **201** |
| `flags.combat` | `npc.js` only | **31**, **202** |
| `flags.camera` / `firstPerson` | `controls.js` only | **32**, **204–205** |
| `flags.matchSpeed` | `ship.js` only | **33**, **206** |
| `flags.chartOpen` | `galaxychart.js` | **208**, **264** |
| `flags.hailOpen` | `hail.js` | **209**, **265** |
| `flags.berthOpen` | `save.js` | **210**, **266** |
| `flags.berthHold` | `save.js` writer; optional overlay-policy helper | **211**, **267**; `overlay-policy.js` **187–204**; `save.js` **1422** |
| `targets.current` | `controls.js` + `npc.js` availability | **29**, **193–197** |
| `targets.part` | `controls.js` only | **30** |
| `world.nav` | `nav.js` | `src/game/nav.js` header |
| `jumpRequested` emit | `gate.js` only (AP may set `wantJump`) | `gate.js` **678–679**; `autopilot.js` **2–3** |
| `ctx.agent` | **absent** | grep `src/` 0 |

A public `act()` must call those writers. It must not assign `ctx.input` from `agent-api.js`. It must not move the mesh. It must not write `flags.berthHold`.

---

## 3. Inner loop (already ~60 Hz)

| Surface | Today | Cite |
|---|---|---|
| Frame loop | `renderer.setAnimationLoop`; dt cap 0.1 s | `main.js` **146–158** |
| Pause | KeyP full-loop skip; berth hold is **not** pause | **149–150**, **167–178** |
| Pause code gate | `e.code !== 'KeyP'` (empty `code` never pauses) | **168** |
| Init order | station **109**, controls **112**, hail **129**, save **131**, chart **134**, HUD **136** | **104–136** |
| Cruise | 120 u/s | `ctx.js` **10–11**, **52** |
| Helm merge | AP if `world.nav.autopilot`; else AM if engaged; else `input.steer*` / throttle | `ship.js` **738–830** |
| Player integrate vs hold | skip when `berthHeld` | `ship.js` **21**, **754** |
| AP interrupt hypot | `AP_STEER_BREAK = 0.65` | `autopilot.js` **16** |
| AP latch | `chartOpen` **or** `berthHeld` unlatches reticle | `autopilot.js` **153–177** |
| AP flyTick hold/pause | `zeroCmd` + return; keep flying flag | **395–398** |
| AM interrupt hypot | `STEER_BREAK = 0.65` | `automine.js` **9**, **166–185** |
| AM latch | **`chartOpen` only** — not berthHold | `automine.js` **169–171**, **241** |
| Jump zone | `JUMP.zone` **60** u | `state.js` **584–585** |
| Dock zone | `U.DOCK_RANGE` **45** u | `state.js` **30** |
| Target range | `U.TARGET_RANGE` **600** u | `state.js` **32** |
| Encounter bubble | `U.ENCOUNTER_BUBBLE` **800** u | `state.js` **27** |

Autopilot already flies plotted multi-jump routes (NAV-03). Automine already faces a locked rock. Station UI and combat already tick in this loop. The outer agent must **not** write axes every LLM round-trip.

Quantify: at 120 u/s, a 2 s LLM wait is **240 u** of travel (four dock radii, four jump zones). A screenshot loop cannot hold a gate.

Wave 125: agent PR3 must latch **`optIn`** on AP and AM hypot. Do **not** add `berthHold` to automine (CTL-03 leftover / PR2 stills). AP already latches hold.

---

## 4. Keyboard reality (why screenshots + stock agent keys fail)

| Surface | Today | Cite |
|---|---|---|
| Tracked codes | `KeyW/A/S/D/R/F/Q/E/T/H/C/X/V/N/K/J`, `Digit1–5`, Shift, Space | `controls.js` **45–53** |
| Keydown gate | `if (e.repeat \|\| !TRACKED.has(e.code)) return` | **315–316** |
| Digit1–5 | skip `weaponGroup` while docked / hail / overlay (Wave 125 CTL-04 PR1) | **90–111**, **357–372** |
| KeyJ dock pulse | skip title / models / typing | **73–88**, **330–332** |
| Reticle | `mousemove` → `steerX/Y` every update | **380–383**, **461–478** |
| Fire | LMB `fireDown` | **385–391** |
| Overlay mutex | hail / chart / berth; `hailDigitsAllowed`; `playSurfaceBlocked` | `overlay-policy.js` **7**, **83–91**, **118–128**, **175–185** |
| Berth hold helpers | `berthHeld` / `setBerthHold`; never `flags.paused` | **187–204** |
| Station menu | bubble `keydown` on `e.code` Digit/KeyB/Escape | `station.js` **6156–6177** |
| Hail digits | `/^Digit([1-9])$/` on `e.code` | `hail.js` **431–448** |
| Chart | `e.code === 'KeyM'` | `galaxychart.js` **766** |
| Title | Digit1–9 + `stopImmediatePropagation` | `title.js` **190–227** |

**Empty `e.code`:** stock agent `KeyboardEvent`s that set `key: 'j'` and leave `code: ''` never enter `TRACKED`. Pause **168**, station **6159**, hail **435**, chart **766** also key off `e.code`. That matches the wishlist playtest.

Boot-test works because `dispatchKey('KeyJ')` supplies `code`.

---

## 5. High-level verbs that already exist (reuse, do not clone)

| Verb | Live function / path | Public today? | Cite |
|---|---|---|---|
| Plot route | `plotRoute(ctx, dest)` | module export | `nav.js` **279–300** |
| Clear route | `clearRoute(ctx)` | module export | `nav.js` **271–276** |
| Engage AP | `tryEngage(ctx)` → refuse token or `''` | module export | `autopilot.js` **216–229** |
| Cancel AP | `disengage(ctx, reason)` | module export | **198–214** |
| AP refuse copy | `AP_LINES` / `apLine` | module export | **22–39**, **237–241** |
| Chart Autopilot click | `tryEngage` from chart | UI only | `galaxychart.js` **699** |
| Engage AM | `tryEngageAutomine(ctx)` | module export | `automine.js` **232–245**; `controls.js` **486** |
| Cancel AM | `disengageAutomine(ctx, reason)` | module export | `controls.js` **484** |
| Cycle target | `cycleTarget(ctx)` nearest-first | **not exported** (closure in `initControls`) | `controls.js` **114–142** |
| Reticle lock | `pickReticleLock` / `tryReticleLock` | game helper + controls | `reticle-aim.js`; controls **480** |
| Hail open (disabled) | `tryOpenDisabledHail(ctx)` | module export | `hail.js` **96–107** |
| Hail resolve | `resolveIntent` inside `initHail` | **not exported** | `hail.js` **144–156** |
| Hail intents | `demandCargo`, `demandRansom`, `acceptTribute`, `letGo`, `respect`, `callowVouch`, `keepFiring`, `payTribute`, `showTeeth`, `refuseFight` | switch | `hail.js` **157–294** |
| Dock | `input.dockPressed` + range; snap if `dist <= 2 * DOCK_RANGE` | not a named export | `station.js` **6321–6330** |
| Undock | `undock()` closure; Escape/KeyB | not exported | **6129–6154**, **6161–6166** |
| Select service | `selectService(key)` closure | not exported | **6079** |
| Services | `DOCK_KEY_SERVICES` Digit 1–9, 0 = shipyard | const export | **188**, **6169–6177** |
| Accept job | `acceptJob(job)` closure; Digit on jobs desk | **not exported** | **4788–4820**, **6230–6232** |
| Trade | `tryTrade(key, qty, buying)` closure; Q/W/A/S | **not exported** | **4616–4645**, **6208–6211** |
| Jump | `inZone && !berthHeld && (dockPressed \|\| apJump)` → `{ to: near.to }` | gate only | `gate.js` **678–679** |

Implication: PR1 can observe without new writers. Command PR must **export or wrap** hail/station/target closures. Do not ask the LLM to click DOM. Do not hang functions on HUD `ctx.station` (**4404–4411**).

---

## 6. What a human already sees (observation budget)

HUD-visible / dock-visible. An observation snapshot should be this set, JSON-plain, **no THREE objects**, **no** `npc.ai` guts.

| Block | Live source | Cite |
|---|---|---|
| Time / system / credits / fear / rep | `ctx.world` | `ctx.js` **148–163** |
| Hull channels | `ctx.player` | created by `ship.js` |
| Cargo | `ctx.cargo`, `ctx.cargoCapacity` | `ctx.js` **131–133** |
| Speed / burner / drift | `ctx.ship` | **117–126** |
| Docked / combat / paused / camera / MATCH / berthHold | `ctx.flags` | **199–212** |
| Dock zone / name | `ctx.station` pose | `station.js` **99**, **4404–4411** |
| Jump zone / dest / charge | `ctx.gate` | `ctx.js` **177–186** |
| Nav / AP flag | `world.nav` `{ dest, path, remaining, status, autopilot }` | `nav.js` **49+**, **191** |
| AP channel reason | `ctx.autopilot.reason`, `engaged` | `autopilot.js` **18–20** |
| AM channel | `ctx.automine` | `automine.js` **14–16** |
| Target | `ctx.targets.current` (id/name/range only in snapshot) | `ctx.js` **193–197** |
| Nearby ships | `ctx.ships` (cap N; name/role/range/hostile flag — not full AI) | `ctx.js` **188–190** |
| Jobs board | `boardJobs` filter of `world.jobs` when docked | `station.js` **3659+** |
| Hail card | `flags.hailOpen` + open intents (need a read helper) | `hail.js` **132**, **406–428** |
| Last events | `ctx.lastEvents` = **previous animation frame only** (`main.js` **155–156**). HUD toasts live **4 s** (`hud.js` `TOAST_LIFETIME` **64**). A 1–2 Hz `observe` that copies `lastEvents` almost always sees `[]`. `ctx.emit` spreads payloads (`ctx.js` **270–271**). `hailOpened` includes a live ship object. **Product log cannot be lastEvents.** |
| Bio mood (HUD) | `ctx.bio.mood` etc. | `ctx.js` **136–146** |
| Player hull | `createShipState`: hull/screen/shell/engine/power/heat | `state.js` **167–181** |
| Jumping | `ctx.gate.jumping` — **not** `flags.jumping` | `ctx.js` **183**, **199–212** |
| Models attach pattern | `ctx.models = { open, close, isOpen }` at init | `modelsbrowser.js` **16–17**, **832–836** |

Do **not** publish: `playerInterestChance`, unspawned banks, `WORLD_FIELDS` blob, renderer, scene graph, save slots, API keys, `ctx.stationDesk` functions, raw `ctx.station` object (copy pose fields only).

---

## 7. Persist / HUD / Digit law (census)

| Surface | Today | Cite |
|---|---|---|
| `WORLD_FIELDS` | time, credits, jobs, hangar, fieldOre, **nav**, … **no** agent key | `save.js` **80–105** |
| Nav persist | `world.nav` rides save; `writeNav` always `autopilot: false`; `sanitizeNav` comment | `nav.js` **54**, **191–192** |
| Settings key | `rimward-settings-v1` | `settings.js` **7**, **24** |
| HUD 80 px hub | reticle clamp 44 px | `hud.js` **1293** |
| HUD tokens | `--rw-accent` `#6ff2e0`; color always paired with text/shape | `hud.css` **1–7**, **12** |
| Digit 0 / 8 / 9 | station shipyard / launch / epics | `station.js` **188**, **6169–6177** |
| Digit 1–5 flight | weapon groups; skipped on dock/overlay (Wave 125) | `controls.js` **357–372** |
| `innerHTML` | forbidden in later HUD copy (wave law) | recent briefs |
| Latest landed wave | **125** (CTL-03 / AI-05 / CTL-04 PR1) | `PROGRESS.md` **5030–5070** |

---

## 8. Security census

| Risk | Today |
|---|---|
| Full ctx on `window` | `__ctx` always assigned in `main.js` **79**. Any XSS already has god-access. Public API must be **smaller** and must not add teleport/credit writers. |
| Network control | **none**. Vite is the only server. |
| Input spoof | boot-test and Playwright already spoof keys **locally**. |
| Cheat | dock snap at `2 × DOCK_RANGE` already exists for humans (`station.js` **6323–6328**). Agent must use that same path, not a new warp. |
| Hold vs pause | `berthHold` is a session boolean (`ctx.js` **211**). Overlay helper never writes `flags.paused` (`overlay-policy.js` **1–4**, **196–203**). Agent must not impersonate pause. |

---

## 9. What is **not** this leftover

- NAV-03 flying AP (landed).
- Automine (landed).
- CTL-04 Digit skip (Wave 125 PR1 landed). CTL-04 **PR2** `fireHeld` docked skip is optional leftover — **do not steal**.
- CTL-03 berth hold (Wave 125 PR1 landed). PR2 stills optional — **do not steal**. Do not add `berthHold` to automine hypot.
- AI-05 starter grace (landed). PR2 home bubble optional — **do not steal**.
- HUD-01 empty hub. Digit 0/8/9. New Digit.
- Wishlist encyclopedia, hail-card redesign, Settings rebind.
- Sibling Wave 126 hail-demand / home-marker packs — cite only.

---

## 10. Same-tab watch vs AP/AM hypot (census)

| Surface | Today | Cite |
|---|---|---|
| Mouse | `window` `mousemove` always feeds reticle | `controls.js` **380–383**, **461–478** |
| AP hypot cancel | `steerArmed && hypot(steerX,steerY) ≥ 0.65` | `autopilot.js` **16**, **176–177** |
| AP latch | `chartOpen` or `berthHeld` unlatches reticle | `autopilot.js` **153–167** |
| AM hypot | same 0.65 | `automine.js` **9**, **166–185** |
| AM latch | `chartOpen` unlatches — **not** hold | `automine.js` **169–171** |

A human who watches the same canvas and moves the mouse to a badge or DevTools **cancels AP/AM**. Agent watch is not the chart, so `chartOpen` does not save it. Contract: PR3 treats `ctx.agent.optIn` like that latch for hypot only. Strafe / roll / throttle / burner / drift / fullStop still steal.

---

## 11. Gaps the public API must close

1. No versioned observe snapshot (JSON-plain, HUD-visible).
2. No versioned `act({ v, name, args })` that reuses plot / AP / AM / dock / hail / desk.
3. Station/hail/target verbs trapped in closures (`acceptJob` **4788**, `tryTrade` **4616**, `undock` **6129**, `selectService` **6079**, `resolveIntent` **144**). Attach `ctx.stationDesk` / `ctx.hailApi`, not functions on `ctx.station`.
4. Empty `e.code` ignored (`controls.js` **316**; `main.js` **168**; station **6159**; hail **435**; chart **766**).
5. No watch chrome (`?agent=1`). Same-tab mouse hypot will cancel AP/AM until a latch exists.
6. `lastEvents` cannot be the outer-loop event log.
7. No 127.0.0.1 forwarder (and none should bind `0.0.0.0`). Page WS cannot read `process.env`.
8. No in-repo LLM runner (not required for first impl PRs).
9. In-system pad approach is not a live verb: AP dests are systems; dock is 45 u (snap 90 u).
10. `act` has no freeze vs live `berthHold` (Wave 125). Contract deputizes `token: 'held'`.
