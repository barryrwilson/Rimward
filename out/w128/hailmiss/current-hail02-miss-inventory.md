# Hail02 player-initiated miss-feedback inventory

**Wave:** 128 leftover census. Markdown only. No `src/` writes.  
**Code wins.** Cites are live file:line at census time (2026-08-26).  
**Leftover:** **REAL.** Named serial **PR1**. Not CONSUME. Named serial is **not** none.  
**Name:** player-initiated contextual miss-feedback (subject + eligibility + outcome).  
**Not this leftover:** Hail01 incoming pirate demand lifecycle (Wave 127 live). HUD-07 layout. HUD-06 home marker. NAV-09 chart zoom. Agent API PR2–PR6. CTL-03 PR2. CTL-04 PR2 `fireHeld`. AI-05 pirate interest.

Inbox source (`docs/PLAYER-EXPERIENCE-WISHLIST.md` **93–98** — cite, do not edit): KeyH on a selected friendly did not open a visible hail or explain why, while encounter state and Fear changed. Hail, dock, jump, salvage, and similar actions must never appear to affect an unseen or unselected contact.

Hail01 Honor (`docs/Hail01DemandLifecycleDesign.md` **12**, **37**, **126**, **293**) reserved player-initiated miss-feedback as **Hail02**. Do not reopen Hail01 timer / dock/jump/expire/void / HEAVE-TO suppress / Illyx duel.

---

## 1. Player KeyH path (primary hole)

| Surface | Today | Cite |
|---|---|---|
| KeyH pulse | `pendingHail = true`; published as `input.hailPressed` one frame | `controls.js` **327–328**, **425** |
| Player hail consumer | only `hail.js` `update` when `hailPressed && !open` | `hail.js` **652–667** |
| Gate: title / models / typing | `playSurfaceBlocked` → `allow = false` | `hail.js` **654–656**; `overlay-policy.js` **83–91** |
| Gate: overlay mutex | `canOpenPlayCard(ctx, 'hail') === false` → `allow = false` (chart/berth) | `hail.js` **657–659**; `overlay-policy.js` **118–127** |
| Gate: calm | current target + `hailCalmOk === false` → `allow = false` | `hail.js` **660–663**; `overlay-policy.js` **94–101** |
| Success path | `tryOpenDisabledHail` then `openCard` | `hail.js` **664–666** |
| **Miss when `allow` is false** | **silent `continue`** — no event, no toast, no card | `hail.js` **652–667** |
| **Miss when `allow` is true and `tryOpenDisabledHail` returns null** | **silent** — no event, no toast | `hail.js` **664–667** + **159–161** |

`tryOpenDisabledHail` (`hail.js` **159–169**) emits `hailOpened` **only** when `canHailDisabled` is true. It does **not** open the DOM card. `canHailDisabled` (`hail.js` **147–156**) requires: live ship, no `lockKind`, `state.disabled`, not destroyed, still in `ctx.ships`, player mesh, distance `<= U.TARGET_RANGE` (**600** u, `state.js` **32**).

Player KeyH **never** opens a live-ship combat hail. Combat / bargain hail is NPC-emitted (`npc.js` **1508–1511**). Pirate demand hail is NPC-emitted (`npc.js` **2121–2130**, Hail01 Wave 127). Callow vouch is `world.js` (`callowVouchOffer` **1220–1245**).

**Hole:** KeyH on a selected friendly (or any live hull, asteroid, empty lock, out-of-range hulk, calm target, chart/berth) does not name subject, eligibility, or outcome unless a salvage card actually opens.

---

## 2. Callow (second KeyH reader; not Hail01)

| Surface | Today | Cite |
|---|---|---|
| Second consumer | `callowVouchOffer` if `hailPressed` | `world.js` **1220–1221** |
| Range | `CALLOW.hailRange` **800** u | `state.js` **963**; `world.js` **1228** |
| Out of range / no live / disabled / not verge / not met / poor credits | **silent return** | `world.js` **1221–1244** |
| Vouched | `commLine` refuse (named `from`, HUD still drops `from`) | `world.js` **1232–1242**; `hud.js` **565–573** |
| Offer | `hailOpened` vouch intents | `world.js` **1245** |

Init order: `initWorld` before `initHail` (`main.js` **121–132**). A Callow `hailOpened` this frame can open the card before the salvage branch (`hail.js` **652** `!open`). Out-of-range Callow still falls through to the silent salvage miss.

Hail02 does **not** rewrite Callow vouch economics. Named miss on the selected hull may still fire from the hail.js salvage miss if no card opened.

---

## 3. Fear / encounter (playtest claim)

| Surface | Today | Cite |
|---|---|---|
| KeyH → fear? | **No.** Player hail branch does not call `bumpFear` | `hail.js` **652–667** vs **172–175** |
| Hail fear writes | only `resolveIntent` (cargo / ransom / teeth) | `hail.js` **315**, **329**, **422** |
| NPC fear writes | capitulation / kill / ace | `npc.js` **413**, **1634**, **2564–2565** |
| `npc.js` reads `hailPressed`? | **No** | grep `hailPressed` in `npc.js` = **zero** |
| HUD `fearChanged` | toast `'▲ They learn to fear you.'` / `'› The lanes forget.'` | `hud.js` **613–618** |
| Bargain hail | NPC `hailOpened` when resolve band `bargaining` in `TARGET_RANGE` | `npc.js` **1508–1511** |
| Hail01 HEAVE-TO | pirate vs player telegraph **suppressed** (Wave 127 live) | `npc.js` **1746–1748** |

**Census vs playtest:** KeyH on a friendly does **not** mutate `world.fear`. Parallel NPC hunt / kill / demand can still change encounter and Fear in the same press window. That is the inbox confusion. Hail02 must **not** use Fear as miss feedback.

---

## 4. HUD surfaces (prompt vs toast)

| Surface | Today | Cite |
|---|---|---|
| Context prompt disabled in range | `H` / `'Hail — dead in space'` | `hud.js` **2390–2393** |
| Context prompt live bargain/capitulate | `H` / `'Hail'` **even though player KeyH cannot open that card** | `hud.js` **2394–2396** |
| Context prompt dock | `J` / `'Dock'` only if `station.inZone` | `hud.js` **2378–2379** |
| Context prompt jump | `J` / `'Jump to {dest}'` only if `gate.inZone` | `hud.js` **2380–2388** |
| `hailOpened` toast | **demand only**; salvage / bargain / Callow → `null` | `hud.js` **682–686** |
| `commLine` toast | `e.text` only; **drops `from`** | `hud.js` **565–573** |
| `pushToast` | `textContent`; 4 s life; 8 s identical-key linger | `hud.js` **1293–1317**, **68–70**, **536–546** |
| Demand announce key | `warn\|demand\|{name}` | `hud.js` **719** |
| `demandToastName` | speaker / name / `record.pilot` / `state.name` / `'Pirate'` | `hud.js` **744–755** |
| HUD-01 hub | empty 80 px; aim-glass gauges off | honor; do not claim layout |

The live-bargain `H — Hail` prompt **teaches** a player hail that the KeyH salvage path **cannot** fulfill. Miss toast is the additive fix. Do **not** steal HUD-07 prompt layout in PR1 unless the owner later overrides.

---

## 5. Dock / jump KeyJ (silent miss — include)

| Surface | Today | Cite |
|---|---|---|
| KeyJ pulse | `pendingDock` unless `shouldSkipDockPulse` (title / models / typing) | `controls.js` **330–331**, **73–87**, **426** |
| Dock consume | if station mesh + `dockPressed`: snap if `DOCK_RANGE < dist <= 2×`; dock if `dist <= DOCK_RANGE` | `station.js` **6321–6330**; `U.DOCK_RANGE` **45** (`state.js` **30**) |
| Dock miss | `dist > 2× DOCK_RANGE` (or no station): **no toast, no named subject** | `station.js` **6321–6330** |
| Jump consume | in zone, not docked, not jumping, not `berthHeld`, `dockPressed` or AP | `gate.js` **678–679** |
| Jump miss (not in zone) | **silent** — no `jumpRequested` | `gate.js` **652–679** |
| Jump standing refuse | **named** `'No passage.'` (dest not named) | `jump.js` **7–8**, **105–112** |
| `berthHeld` jump | skip emit; **silent** | `gate.js` **678**; `overlay-policy.js` **187–193** |

Init order: station + gate **before** hail (`main.js` **114–132**). A later hail.js KeyJ miss can read leftover `dockPressed` when neither pad nor gate consumed a success. **Do not** rewrite the 2× snap. **Do not** remap KeyJ (CTL-01).

Inbox lists dock/jump. Census shows silent KeyJ. Hail02 **includes** dock/jump miss copy. Keep the later write-set in `hail.js` + HUD listeners. Do not claim `station.js` / `gate.js` / `controls.js`.

Standing refuse `'No passage.'` is already a result. Hail02 **omits** dest-standing copy (NAV / REP sibling).

---

## 6. Overlay / digits / pause

| Surface | Today | Cite |
|---|---|---|
| Overlay ids | hail / chart / berth exclusive | `overlay-policy.js` **7**, **16–26**, **118–127** |
| Never `flags.paused` | header + berth writers | `overlay-policy.js` **4**, **196–203** |
| Incoming hail defer | chart/berth → `'defer'` | `overlay-policy.js` **107–115** |
| `hailDigitsAllowed` | false if paused / surface / settings / chart / berth | `overlay-policy.js` **175–185** |
| Player KeyH vs incoming defer | player path **refuses** (`allow = false`); does **not** defer a player salvage | `hail.js` **657–659** |
| Digit 1..n on open card | hail resolution | `hail.js` **590–607** |
| Digit 0/8/9 | station (not hail miss) | honor |

Unknown overlay → skip (`canOpenPlayCard` catch already skips mutex). Hail02 miss must fail closed the same way: never throw; never fall back to `flags.paused`.

---

## 7. Agent API (cheat hail)

| Surface | Today | Cite |
|---|---|---|
| Schema name `'hail'` | authored; **not** live in dispatch | `agent-schema.js` **33**, **40** (`PR1_LIVE` = ping/disable) |
| Live `act` | ping / disable / pause / held / **unknown** | `agent-api.js` **129–150** |
| `hailResolve` | design-only; `ctx.hailApi` **not** assigned in live `hail.js` | `docs/AgentApiDesign.md`; `agent-observe.js` **239** |
| Observe `hailOpened` | never keeps `ship` | `agent-schema.js` **84**, **239** |

Hail02 must **not** add `act({ name: 'hail' })` that bypasses range / calm / overlay. Agent pulse is sibling PR3.

---

## 8. Persist / state

| Surface | Today | Cite |
|---|---|---|
| Miss mute persist | **none** | grep; `state.js` WORLD_FIELDS untouched |
| Fear persist | existing `world.fear` | not a miss channel |
| `state.js` | READ-ONLY for this leftover | honor |

---

## 9. Verdict table

| Question | Answer | Why |
|---|---|---|
| Does player KeyH name subject on miss? | **No** | `hail.js` **652–667** silent |
| Does player KeyH name eligibility? | **No** | same |
| Does player KeyH name outcome when no card? | **No** | same |
| Salvage success names speaker? | **Yes** (card `HAIL — {speaker}`) | `hail.js` **525** |
| Live friendly KeyH opens a card? | **No** | only disabled salvage + Callow |
| KeyH writes Fear? | **No** | bumpFear not on press |
| Overlay-blocked KeyH toast? | **No** | `allow = false` silent |
| Out of range salvage toast? | **No** | `canHailDisabled` false → null |
| KeyJ dock miss named? | **No** | `station.js` **6321–6330** |
| KeyJ jump miss named? | **No** (unless standing refuse) | `gate.js` **678** vs `jump.js` **107–110** |
| CONSUME? | **No** | hole live |
| Named serial | **PR1** | leftover REAL |

**Freeze leftover REAL.** Name: **no Hail02 leftover** is **false**. Name later serial **PR1**.
