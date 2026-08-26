# CTL-03 remaining Berth Records sim freeze — live inventory

**Wave:** 124. Markdown only. Code wins over wishlist copy.  
**Census date:** 2026-08-25. Playtest leftover on `67fb1a0`.  
**Scope:** leftover **Berth Records (KeyL) keeps the sim live** so a routed ship can charge a gate, jump, take sun/combat, and arrive in another system **behind** the modal.  
**Not this leftover:** CTL-02 hail/chart mutex (Wave 118 **landed**). Hail defer/calm. Chart zoom / close-on-AP. NAV-05 `showApLive`. CTL-01 KeyJ. CTL-04 menu digits (`controls.js`). AI-05 npc interest/spawn. HUD-01 hub. Starter grace. Menu input. Settings rebind. Agent API.

Line numbers are 1-based from live `src/` at census. If a later serial moved a symbol, **re-census**; do not trust this file over `src/`.

---

## 0. Frozen records / inbox (status only; code still wins)

| Claim | Source | Live verdict |
|---|---|---|
| Opening Berth Records during a routed flight lets the ship enter a gate and arrive in another system behind the modal | wishlist INBOX (P0, RECORDS/OVERLAYS) playtest 2026-08-25 `67fb1a0` — **cite, do not edit** | **LIVE.** Berth does not hold flight / AP / gate / hazards. Leftover **REAL** |
| Suspend flight, AP, hazards, and gate while save/load UI is open | same inbox | **ABSENT.** No `berthHold`. `flags.paused` is KeyP only |
| On close, explicit resume if a transition or AP leg was interrupted | same inbox | **ABSENT.** Close is L / Escape only. No resume control |
| Save/load screen is a safe place to stop and understand state | same inbox | **ABSENT.** Hint says the opposite: records hold **while you fly** |
| Hail/chart/berth mutex | CTL-02 Wave 118 | **LIVE.** `overlay-policy.js`. **Collision:** those three **never** write `flags.paused` |
| Hail/chart pause the sim | — | **FORBIDDEN** by CTL-02. This leftover is **berth only** |
| LOAD while `flags.paused` | Wave 28 `loadFromSlot` | **REFUSED.** `systemLoaded` while frozen is a hazard |
| `gate.js` sole `jumpRequested` writer in `src/` | NAV-05 | **LIVE.** `gate.js` **677–678**. Do not invent a second jump path |
| Restore never resumes flying Autopilot | NAV-03 `sanitizeNav` / `writeNav` | **LIVE.** `autopilot: false` always |
| `berthHold` session flag | — | **ABSENT** (grep `berthHold` in `src/`: none) |
| Digit 0/8/9 | HUD-01 / station | **LIVE.** Stay. No new Digit |
| KeyL / KeyM / KeyH / KeyJ / KeyP | berth / chart / hail / dock / pause | **LIVE.** Stay. Do not remap |
| `controls.js` | CTL-04 sibling later | **Cite.** This leftover does **not** claim it |
| npc interest/spawn | AI-05 sibling later | **Cite.** Do **not** retune pirates here |

Inbox is **INBOX**, not shipped. Census does **not** CONSUME.

**Leftover = REAL. Named later serial = PR1. Do not freeze CONSUME.**

---

## 1. Berth panel (`src/game/save.js`) — leftover home

Header **38–50**: Berth Records is KeyL, **SPACE ONLY**. Opens while flying (`!docked`, `!paused`, not dead). Escape closes. **“the game keeps running underneath.”** Manual slots `rimward-save-v1-slot-1..3`. Boot/death still read **only** autosave `rimward-save-v1`.

`WORLD_FIELDS` **77–102**: time, credits, fear, reputation, currentSystem, markets, records, nav, hangar, … **No** `berthOpen`. **No** `berthHold`. **No** overlay flags.

Panel **1345–1518**.

| Surface | Today | Cite |
|---|---|---|
| Root id | `#rw-berth-records` | **1350** |
| Z-index | **60** (above pause 50) | **1353** |
| Pointer | root `pointer-events:none`; panel `auto` | **1353–1358** |
| Dialog | `role='dialog'` `aria-label='Berth Records'` | **1362–1363** |
| Title | `textContent = 'BERTH RECORDS'` | **1369–1370** |
| Hint | `'L or ESC to close — records hold while you fly'` | **1376–1377** |
| Local open | `let berthOpen = false` | **1383** |
| Session flag | `ctx.flags.berthOpen = next` | **1393** |
| Mutex on open | `canOpenPlayCard(ctx, 'berth')` | **1388** |
| Writes `flags.paused`? | **No** | `setBerthOpen` **1385–1406** |
| Writes `berthHold`? | **No** — flag does not exist | grep |
| `innerHTML` | **none** in `save.js` | grep `innerHTML` **0** |
| SAVE slot | `trySave`; mid-jump toast refuse | **1408–1412**, **1534–1537** |
| LOAD slot | refuse if `flags.paused`; refuse mid-jump; restore; close panel | **1415–1436** |
| KeyL | toggle; open if `!docked && !paused && !dead` and `!playSurfaceBlocked` | **1503–1514** |
| Escape | close if open | **1515–1516** |
| Auto-close | docked or dead | **1565** |
| Resume control | **ABSENT** | — |

`loadFromSlot` **1416–1420** (Wave 28, keep):

> Paused: system updates are frozen (`main.js` skips the loop), so a cross-system restore's `systemLoaded` would rotate out of the event queue unseen — station/gates/environment would stay desynced from the restored world until the next jump. Refuse like the docked gate.

If a later PR used `flags.paused` for berth hold, **LOAD would refuse.** Deputize a hold that is **not** KeyP pause.

`restore` **1233–1240**: may emit `systemLoaded`; then `sanitizeNav(ctx)`. `writeNav` always sets `autopilot: false` (`nav.js` **48–55**). NAV-03 restore **never** resumes flying Autopilot. Keep that.

Autosave key stays `rimward-save-v1` (**67**). Slot keys **68**.

---

## 2. Overlay policy (`src/systems/overlay-policy.js`) — CTL-02 collision

Header **1–5**: hail / chart / berth mutex. Authored ids only. **Never writes `ctx.flags.paused`. Never throws.**

| Surface | Today | Cite |
|---|---|---|
| Ids | `hail`, `chart`, `berth` | **7** |
| `overlayIsOpen` berth | `flags.berthOpen === true` | **16–23** |
| Incoming hail vs berth | `canShowHail` returns `'defer'` | **107–116** |
| Mutex | `canOpenPlayCard` at most one play card | **118–128** |
| Hail digits vs berth | refused if berth open | **175–185** |
| Hail digits vs pause | refused if `flags.paused` | **177** |
| Writes `paused` | **never** | **4**; grep assign **0** |
| `berthHold` helper | **ABSENT** | — |

**Collision (cite, do not reopen):** Wave 118 mutex is live. Hail and chart **stay live-sim**. This leftover must **not** pause hail or chart. This leftover must **not** write `flags.paused` from berth. Do not reopen hail defer/calm.

---

## 3. Pause loop (`src/main.js`)

| Surface | Today | Cite |
|---|---|---|
| Skip `system.update` | **only** `if (!ctx.flags.paused)` | **149–152** |
| `world.time` | advances only when not paused | **150** |
| Event rotate | **always** (`lastEvents` / `events`) even when paused | **153–155** |
| Pause banner | `PAUSED — P to resume`; z-index **50** | **161–163** |
| KeyP | toggles `flags.paused`; skip typing / models / `#rw-title` | **165–176** |
| Reads `berthOpen` / `berthHold` | **No** | — |

While berth is open, `paused` is false (unless the player also taps P). **Every** system still `update`s. Ship flies. Gate charges. Jump swaps. Combat and sun tick.

---

## 4. Gate / jump (`src/systems/gate.js`, `src/game/jump.js`)

| Surface | Today | Cite |
|---|---|---|
| Jump fade overlay | z-index **40** | `gate.js` **591–593** |
| Human / AP emit | `inZone && !docked && !jumping && (dockPressed \|\| apJump)` | **670–678** |
| `apJump` | `nav.autopilot === true && wantJump && near.to === nextHop` | **672–676** |
| `jumpRequested` writers in `src/` | **`gate.js` only** | grep `src/`: **678** |
| Reads `paused` on emit | **No** (docked / jumping only) | **677** |
| Reads `berthOpen` / `berthHold` | **No** | — |
| Consume + charge | `jump.js` `beginJump` / `timer += dt` / midpoint swap | `jump.js` **101–118**, **200–227** |
| Charge owner | **`jump.js`**, not `gate.js` | **64–84**, **221–227** |

Playtest hole: AP `wantJump` + live ship in `JUMP.zone` while Berth is open → `gate.js` emits → `jump.js` charges and swaps **behind** z-60 modal.

---

## 5. Autopilot (`src/game/autopilot.js`)

Header **1–3**: owns the live channel. **Does not emit `jumpRequested`.**

| Surface | Today | Cite |
|---|---|---|
| `apRefuseToken` paused | returns `'paused'` | **183** |
| `flyTick` paused / docked | `zeroCmd`; **return** (does **not** disengage) | **388–390** |
| `inputBreak` | helm; chart freeze-steer; **not** berth | **152–172** |
| `berthOpen` / `berthHold` | **No read** | — |
| Restore reason | `disengage(..., 'restore')` silent | **202–206** |

AP already returns on KeyP pause **without** dropping `nav.autopilot`. Berth does **not** get that return. Flying Autopilot **keeps steering** under the modal and can latch `wantJump`.

NAV-03: restore / `sanitizeNav` forces `autopilot: false` (`nav.js` **54**). Keep that. Do not persist-resume AP.

---

## 6. Session flags (`src/core/ctx.js`)

| Flag | Persist? | Writer | Cite |
|---|---|---|---|
| `paused` | session | KeyP `main.js`; origins; models save/restore | **203** |
| `chartOpen` | session | galaxychart | **208** |
| `hailOpen` | session | hail | **209** |
| `berthOpen` | session | `save.js` `setBerthOpen` only | **210**, **265** |
| `berthHold` | — | **ABSENT** | — |

`state.js` is not a writer of these flags. Do not add a `WORLD_FIELDS` persist key for hold.

---

## 7. Player-facing hazards (still tick under berth)

| Surface | Today under berth | Cite |
|---|---|---|
| Player flight integrate | **runs** (`ship.js` flight when `!docked`) | `ship.js` **753+**; gated only by `main.js` pause |
| Sun heat / kill | **runs** if undocked and not jumping | `combat.js` **1873–1898** |
| NPC fire vs player | **runs** (`npcFire` → combat) | `npc.js` **1227**, **1681**, **2065**; `combat.js` **1902+** |
| Hail **card** | **deferred** while `berthOpen` | `overlay-policy.js` **111**; `hail.js` **454–468** |
| Hail **event** | `hailOpened` still emits | `npc.js` **1906** (demand) |
| Distant traffic | **runs** | `npc.js` / `traffic.js` via `system.update` |

Mutex already hides the hail **card**. A pirate can still **shoot** the parked player. Inbox: a pirate demand must **not** land as a new attack behind the modal.

---

## 8. Z-index ladder (Wave 40 + live drift)

| Surface | Z | Pause sim? | Cite |
|---|---|---|---|
| Station overlay | 20 | docked world | `screens.css` |
| Galaxy chart | **30** | **no** (CTL-02) | `hud.css` **1909** |
| Death overlay | 30 | dead | `screens.css` **461** |
| Hail card | **40** | **no** (CTL-02) | `hail.js` **118** |
| Gate jump fade | **40** | jumping | `gate.js` **593** |
| Pause banner | **50** | **yes** `flags.paused` | `main.js` **162** |
| Berth Records | **60** | **no** (hole) | `save.js` **1353** |
| Origins | 60 | yes | `origins.js` **98** |
| Title | 70 | yes | Wave 40 |
| Settings | **80** | no | `settings.js` **13**, **93** |
| `#fatal` | 99 | — | `index.html` |

Berth sits **above** pause. Player can KeyP under an open berth. LOAD then still refuses (`flags.paused`). Hold must stay distinct so LOAD works when **not** KeyP-paused.

---

## 9. Bindings / Digit / persist (honor)

| Knob | Live | This leftover |
|---|---|---|
| KeyL | berth | **stay** |
| KeyM | chart | **stay**; do not pause chart |
| KeyH | hail | **stay**; do not pause hail |
| KeyJ | dock/jump (`pendingDock`) | **stay** (CTL-01) |
| KeyP | pause | **stay**; not berth hold |
| Digit 0/8/9 | shipyard / launch / epics | **stay**; no new Digit |
| `controls.js` | input writer | **sibling CTL-04 later only** |
| `innerHTML` | none in berth | keep forbidden |
| Autosave key | `rimward-save-v1` | stay |

---

## 10. Verdict

| Question | Answer |
|---|---|
| Does berth freeze player flight? | **No** |
| Does berth freeze AP steering? | **No** (`flyTick` ignores `berthOpen`) |
| Does berth refuse gate emit / charge? | **No** |
| Does berth freeze sun / combat vs player? | **No** |
| Resume-on-close? | **No** |
| Hint honest? | **No** — “records hold while you fly” |
| Would CONSUME be honest? | **No** |
| Named serial | **PR1** (berth-open hold + resume) |

**Leftover REAL.** Not CONSUME. Serial is **not** none.
