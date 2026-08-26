# TGT-07 combat cycle inventory

**Wave:** 130 leftover census. Markdown only. No `src/` writes.  
**Code wins.** Cites are live file:line at census time (2026-08-26).  
**Leftover:** **REAL.** Named serial **PR1**. Not CONSUME. Named serial is **not** none.  
**Name:** KeyT cycle hostiles-first then range while a hostile is in the target envelope.  
**Law:** **one** — (a) combat-hostiles-first then range. **Not** (b) a new attacker-lock key. Do not ship both in PR1.  
**Not this leftover:** TGT-03 incoming-fire toast / radar / edge-arrow. TGT-05 KeyV + station/gate/pod/landmark. TGT-06 remaining-TGT CONSUME (Wave 122). HUD-07 layout. HUD-06 home marker. NAV-10 dock approach. MSN-04 job dedup. Agent API `act({name:'target'})`.

Inbox source (`docs/PLAYER-EXPERIENCE-WISHLIST.md` Playtest capture 2026-08-25 second pass, lines **180–183** — cite, do not edit):

> INBOX (P2, TGT): Sort the T target cycle hostiles-first during combat, or add a "target my attacker" key. While an ace fired from 59 u, T selected a friendly hauler, then a neutral freighter, and reached the attacker on the third press. TGT-03 lists attacker warnings but not selection priority.

TGT-06 (`docs/Tgt06RemainingTgtDesign.md`) froze remaining-after-named-slices **CONSUME**. This inbox item is a **new hole after that census**. Do not reopen TGT-06 as PPI / incoming gauge / leftover instruments.

---

## 1. KeyT / `cycleTarget` (primary hole)

| Surface | Today | Cite |
|---|---|---|
| Comment on `cycleTarget` | “in-range candidates, **nearest first**” | `controls.js` **113** |
| Header comment | `T (tap) → cycle target (nearest first; asteroids too in group 3)` | `controls.js` **31** |
| `ctx.input.targetPressed` comment | “edge: T (**cycle nearest hostiles**)” | `ctx.js` **88** |
| Envelope | `U.TARGET_RANGE` **600** u (`range2 = 600²`) | `state.js` **32**; `controls.js` **121** |
| Ship candidates | `ctx.ships` with `object`, not `state.destroyed`, `d2 <= range2` | `controls.js` **123–127** |
| Rock candidates | **only** if `input.weaponGroup === 3` and `ctx.asteroids.list` | `controls.js` **128–134** |
| Sort | `cands.sort((a, b) => a.d2 - b.d2)` — **distance only** | `controls.js` **139** |
| Hostile bucket | **none** | `cycleTarget` body **114–142** |
| Combat gate | **none** (`flags.combat` unread) | `controls.js` **114–142** |
| Wrap | `findIndex` current; `(idx + 1) % length`; `idx === -1` → first | `controls.js` **140–141** |
| Empty | `targets.current = null` | `controls.js` **116–118**, **135–138** |
| KeyT pulse | `pendingTarget` → `input.targetPressed` one frame | `controls.js` **324–325**, **424**, **433** |
| Consumer | `if (input.targetPressed) cycleTarget(ctx)` | `controls.js` **457** |
| Help | `'T — cycle target'` | `controls.js` **406** |
| TRACKED | KeyT present; **no** extra attacker-lock code | `controls.js` **46–53** |

**Hole:** With an ace at 59 u and nearer friendlies/neutrals, the first T lock is the nearest **any** ship. Playtest (hauler → freighter → ace) matches **d2-only** wrap. `ctx.js` **88** says “nearest hostiles”; **code does not**.

`cycleTarget` is a closure inside `initControls`. Not exported. Agent cannot call it except by forging `input.targetPressed` (Agent `act` does **not** write `ctx.input` — `agent-api.js` header **3**).

---

## 2. Dedicated attacker-lock key (absent)

| Surface | Today | Cite |
|---|---|---|
| KeyT | cycle only | `controls.js` **324–325**, **457** |
| KeyV | reticle lock (`tryReticleLock`) | `controls.js` **339–340**, **258–274** |
| KeyX | MATCH | `controls.js` **336–337**, **410** |
| KeyK | engine-select | `controls.js` **345–346**, **411** |
| KeyN | automine | `controls.js` **342–343**, **408** |
| Help lines | no “target my attacker” | `controls.js` **396–415** |
| `playerHit` shooter | **omitted** (damage / family / fromAft / shielded only) | `combat.js` **1797–1799** |
| NPC `lastAttacker` | stamped on **victim NPC**, not the player | `combat.js` **1735**; `npc.js` **262**, **1220–1228** |
| Incoming toast | `Incoming fire.` / `Incoming dart.` — **no ship id, no lock** | `npc-fire-toast.js` **8–64** |

**Census:** no attacker-select binding. Inbox alternative (b) is **not** live. TGT-07 PR1 must **not** invent it (one law).

---

## 3. Live “hostile” (AI-04 / resolve) — reuse, do not invent a faction table

| Surface | Today | Cite |
|---|---|---|
| Intent flag | `ai.intent` — hostile intent **toward the player** | `npc.js` **247** |
| Combat flag | `flags.combat = true` if `ai.intent` and dist `< U.ENCOUNTER_BUBBLE` **800** | `npc.js` **2680–2684**; `state.js` **27**; `ctx.js` **211** |
| Resolve “hostile” | `(ai.mode === 'hunt' \|\| ai.mode === 'duel') && ai.intent` | `npc.js` **1460** |
| Hunt intent latch | `ai.intent = ai.target === 'player'` | `npc.js` **1696** |
| Hunt start | `ai.intent = true` | `npc.js` **2203** |
| Demand / hail stand-down | several `ai.intent = false` | `hail.js` **516–621**; `npc.js` **1390**, **1430**, **1608**, **1677**, **1684** |
| HUD contacts hostile | `row.hostile = !!(live.ai && live.ai.intent)` | `hud.js` **1734** |
| HUD contacts **sort** | lock first, then **hostile**, then dist | `hud.js` **1738–1751** |
| `mayHuntPlayer` | eligibility (pirate/ace; patrol standing ≤ −10 or player scratch) — **not** current fire | `npc.js` **100**, **1256–1264** |
| Save berth block | `role` pirate/ace **or** `ai.hostile === true` | `save.js` **1025–1028** |

**Deputize freeze:** cycle “hostile” = live ship with `ai.intent === true`. Same bit the HUD contacts arc already uses. **Do not** use `save.js` `ai.hostile` (not written by `makeAi`). **Do not** use role pirate/ace without intent (a fleeing pirate is not a cycle hostile). **Do not** use standing table. **Do not** invent a faction hostile list.

Envelope for the sort gate = **in-range cycle candidates** (`TARGET_RANGE` 600), not `ENCOUNTER_BUBBLE` 800. An ace at 59 u is in both. A hostile at 700 u can light `flags.combat` but is **not** a KeyT candidate.

---

## 4. TGT-03 awareness / incoming (cite, do not steal)

| Surface | Today | Cite |
|---|---|---|
| Design | attacker **warnings** on existing toast channel | `docs/Tgt03AwarenessDesign.md` **10**, **34** |
| Cannon vs player | `Incoming fire.` 2.5 s gap | `npc-fire-toast.js` **9**, **11**, **54–64** |
| Dart vs player | `Incoming dart.` | `npc-fire-toast.js` **8**, **47–51** |
| Selection priority | **not** in TGT-03 | inbox **183**; TGT-03 overview owns lock arrow + fire line |
| Contacts arc | scanner-gated `.rw-contacts` | `docs/Tgt03AwarenessDesign.md` **50**; `hud.js` contacts loop |
| Lock edge-arrow | `.rw-edge-arrow` current lock | TGT-03 live |
| Incoming **gauge** | **omit** | TGT-03 / TGT-06 honor |
| Hub PPI | **omit** | HUD-01 80 px |

TGT-03 **lists** attacker warnings. It does **not** retune KeyT order. TGT-07 must **not** add a second Incoming line, a shooter-named toast, or a hub pip as the “select attacker” substitute.

---

## 5. TGT-05 KeyV / kinds (cite, do not steal)

| Surface | Today | Cite |
|---|---|---|
| KeyV | `tryReticleLock` / `pickReticleLock` cone **12** px | `controls.js` **258–274**; `reticle-aim.js` **15** |
| Kind allowlist | `station` / `gate` / `pod` / `landmark` | `controls.js` **148–151** |
| Kind stale drop | `dropStaleKindLock` | `controls.js` **178–238** |
| Rock lock | group-3 KeyT **or** KeyV rock | `controls.js` **128–134**, **155–160** |
| Cycle kinds | **not** in `cycleTarget` | `controls.js` **123–134** |

Station / gate / pod / landmark stay KeyV. PR1 **must not** put kinds into the T cycle. Rocks stay group-3 only. KeyV/KeyX/KeyK **stay**.

---

## 6. Q-ship cover (HUD-02 — do not unmask)

| Surface | Today | Cite |
|---|---|---|
| Cover class | unrevealed `qship` uses `coverClass ?? 'freighter'` | `hud.js` **127–129** |
| Masked name | `rec.qship && !rec.revealed` | `hud.js` **2417**, **2498** |
| Mesh | cover identity (Wave 56 live) | PROGRESS / `npc.js` cover path |

Cycle hostility is **intent**, not `classKey`. An unrevealed Q-ship that hunts the player (`ai.intent === true`) **is** a cycle hostile. Cover class / cover name stay HUD-02. PR1 **must not** reveal `state.classKey` or pierce the name to pick the hull.

---

## 7. Agent API (cheat cycle)

| Surface | Today | Cite |
|---|---|---|
| `act` live names | ping / disable / pause / held / **unknown** | `agent-api.js` **129–150** |
| `act({name:'target'})` | **not live** | grep 0 |
| Observe lock | `ctx.targets.current` read | `agent-observe.js` **306** |
| Observe combat | `flags.combat === true` | `agent-observe.js` **339** |
| Input write | Agent **does not** write `ctx.input` | `agent-api.js` **3** |

TGT-07 must **not** add `act({name:'target'})` that sets `targets.current` to an arbitrary hull, skips envelope, or picks by hidden Q-ship class. Later Agent target (sibling) must reuse live `cycleTarget` rules if it ever cycles.

---

## 8. Persist / HUD-01 / keys honor

| Surface | Today | Cite |
|---|---|---|
| Cycle persist | **none** | `save.js` WORLD_FIELDS; lock is session |
| `state.js` | READ-ONLY for this leftover | honor |
| Empty hub | 80 px | `hud.css` (HUD-01) |
| Digit 0 / 8 / 9 | shipyard / launch / epics | station honor |
| KeyH/J/L/M/P | hail / dock / berth / chart / pause | stay |
| `innerHTML` `hud.js` | **none** | grep 0 |
| Kit mutate | omit | honor |

---

## 9. TGT-06 / siblings (do not steal)

| Sibling | Status | This leftover |
|---|---|---|
| TGT-06 remaining TGT | leftover **CONSUME**, serial **none** (`docs/Tgt06RemainingTgtDesign.md`) | **new** inbox hole after that census |
| TGT-03 | live Incoming fire. / dart. / contacts / edge-arrow | cite; no second warning |
| TGT-05 | live KeyV + kinds | cite; no KeyV remap |
| HUD-07 | deconfliction | no HUD layout |
| HUD-06 | home marker | no station pip |
| NAV-10 | dock approach (Wave 130 sibling) | no `station.js` |
| MSN-04 | job dedup (Wave 130 sibling) | no board |
| Optional PR2s | Agent API, Hail01, Hail02, HUD-06/07, NAV-09, CTL-03, AI-05, CTL-04 | do not steal |

---

## 10. Verdict table

| Question | Answer | Why |
|---|---|---|
| Does KeyT sort hostiles-first while a hostile is in envelope? | **No** | `controls.js` **139** `d2` only |
| Does KeyT read `ai.intent` or `flags.combat`? | **No** | `cycleTarget` **114–142** |
| Does a dedicated attacker-lock key exist? | **No** | TRACKED + help; no binding |
| Does TGT-03 select the shooter? | **No** | toast copy only; `playerHit` has no shooter |
| Do HUD contacts already rank hostiles? | **Yes** | `hud.js` **1734–1751** — **display only** |
| Does `ctx.js` comment match code? | **No** | “nearest hostiles” vs d2-only |
| Q-ship cover in cycle? | Cover class unused by cycle | HUD-02; intent still works |
| Agent `act target`? | **No** | `agent-api.js` **150** unknown |
| CONSUME? | **No** | hole live |
| Named serial | **PR1** | leftover REAL |
| PR1 law | **(a)** hostiles-first then range on KeyT | not (b) new key |

**Freeze leftover REAL.** Name: **TGT-07 combat cycle**. Name later serial **PR1**.
