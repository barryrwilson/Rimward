# Hail02 miss-feedback shared contract

**Wave:** 128. Design only. No hail-miss ships in this wave.  
**Status:** MERGE LAW for `docs/Hail02MissFeedbackDesign.md`. If that document and this file ever disagree, **this file wins**.  
**Leftover:** **REAL.** Not CONSUME. Serial is **not** none. Named later serial: **PR1** (player-initiated named miss-feedback).  
**Name:** contextual action miss names subject + eligibility + outcome.  
**Not this wave:** any edit under `src/`, `scripts/`, `public/`, `index.html`, `package.json`. Do not edit `docs/PLAYER-EXPERIENCE-WISHLIST.md`, `PROGRESS.md`, `docs/Hail01DemandLifecycleDesign.md`, `docs/AgentApiDesign.md`, `docs/Hud06HomeMarkerDesign.md`, `docs/Hud07DeconflictionDesign.md`, `docs/Nav09ChartReadabilityDesign.md`, `docs/Ctl*.md`, `docs/Nav*.md`, `docs/Hud0*.md`, `docs/OwnerDecisions*.md`. Do not steal Hail01 PR2 stills, Agent API PR2–PR6, HUD-06 PR2, HUD-07, NAV-09, CTL-03 PR2, AI-05 PR2, CTL-04 PR2 `fireHeld`. Do not write `out/w128/hailmiss/verify/**`. Do not write `out/w128/deconflict/**`, `out/w128/chartread/**`, `out/w127/**`, `out/w126/**`.

**Locked sources:** wishlist INBOX (P1, HAIL/CONTEXT) lines **93–98** (cite, do not edit); Hail01 Honor reservation of Hail02 (`docs/Hail01DemandLifecycleDesign.md`); live inventory `out/w128/hailmiss/current-hail02-miss-inventory.md` (code wins); Wave 118 CTL-02 mutex + **never write `flags.paused`**; Wave 120 HUD-04 8 s identical-key linger; Wave 127 Hail01 demand lifecycle **live**; Wave 125 `berthHold` / starter grace / menu digits.

Integrator rule: a **later** implementation wave obeys this file. Inventory cites live code. Code wins over playtest “Fear changed because of H”: KeyH does **not** write `world.fear`.

**This leftover is player-initiated miss-feedback.** It is **not** incoming pirate demand (Hail01). It is **not** CTL-02 pause. It is **not** HUD-06 / HUD-07. It is **not** NAV-09. It is **not** Agent cheat hail.

**Live hole:** KeyH miss is silent (`hail.js` **652–667**). KeyJ dock/jump miss is silent except standing `'No passage.'`. HUD may show `H — Hail` on a live bargain lock (`hud.js` **2394–2396**) that player KeyH cannot open. **Leftover is real. Not CONSUME. Serial is not none.**

---

## 0. Orchestrator merge law (do not weaken)

1. This worker is **markdown only**. No `src/`. Later impl is **serial**. Serial PR plan is **named only**. Do **not** land these PRs in `src/` in this worker.
2. HUD-01 empty **80 px hub**. Aim-glass gauges stay off. Kit mutate omit. No miss pip on the aim glass. **Do not** steal Digit 0/8/9. **No new Digit.** Hail digits **1..n** on an **OPEN** hail/demand card stay hail resolution (CTL-04 / `hailDigitsAllowed` — **cite, do not reopen**).
3. KeyH stays hail. KeyJ stays dock/jump. KeyL stays berth. KeyM stays chart. KeyP stays pause. **Do not remap those keys.**
4. `innerHTML` forbidden later. Card / toast / comm use `textContent` / `createTextNode` / `el()` only. Toasts stay `textContent` (`hud.js` **1317**). **No** `insertAdjacentHTML` / `document.write`. Never interpolate a ship name into HTML.
5. `src/game/state.js` is READ-ONLY. Persist: **none**. Do **not** invent UU. Do **not** invent SKU. Do **not** invent Digit. Do **not** add WORLD_FIELDS. Do **not** persist a miss-mute / god-mode hush.
6. Overlay mutex stays CTL-02: hail / chart / berth exclusive. Hail / chart / berth **never** write `ctx.flags.paused`. Miss toast is **not** pause. Do **not** reopen hail defer/calm as a new mutex.
7. HUD-04: 8 s identical-key linger **stays**. Do **not** reopen toast flood as a new channel. Miss copy **must** use the existing toast API (`pushToast` / `toastForEvent`) with a **stable key**. Do **not** invent a second toast stack. Do **not** raise slot count. Do **not** put distance in the linger **key** (distance may change every press).
8. Hail01 demand lifecycle is **live** (Wave 127). Cite; do **not** retune 20 s timer, outcomes, HEAVE-TO suppress, Illyx duel.
9. AI-05 starter grace is **who-when**. Do **not** retune pirate interest.
10. Agent API must **not** become a cheat hail. Do **not** claim `agent-api.js`. Do **not** add `act({ name: 'hail' })` that bypasses range / calm / overlay. Later `hailResolve` stays open-card only (sibling). Observe must not grow `hailOpened.ship`.
11. Hail01 (incoming pirate demand) is a **SIBLING**. Do **not** write Hail01. Do **not** teach demand timer here.
12. Do **not** steal HUD-07 layout, HUD-06 home marker, NAV-09 chart zoom. Do **not** claim `hud.js` **layout** / context-prompt block / hub / gauges. If a toast must change, name **`hud.js` listeners only**.
13. Dock/jump bind stays CTL-01 KeyJ. Hail02 **includes** dock/jump **miss copy** because census shows silent KeyJ. Later writers stay `hail.js` + HUD listeners. Do **not** claim `controls.js`, `station.js` snap, or `gate.js` `jumpRequested`.
14. Fail closed:
    - Never throw from miss toast / miss emit.
    - Never `innerHTML` a ship name.
    - Unknown overlay / proto ids → skip. Do not fall back to `flags.paused`.
    - Non-finite distance → omit the `(n u)` clause; still name subject + reason.
    - Missing overlay helper → skip mutex (live hail catch) **and do not** pause.
    - Title / typing / models (`playSurfaceBlocked`) / settings panel → **skip** miss toast (do not fight the owner surface).
    - Open hail card this frame → **skip** miss (the card **is** the outcome).
    - Successful dock / jump this frame → **skip** miss.
    - Jump standing refuse already toasted (`JUMP_REFUSE_LINE`) → **skip** Hail02 copy.
    - Linger `{keyName}`: strip `|` and C0 controls; cap length. Never use the raw save string as HTML.
15. `reducedMotion`: **no** new animation. Color is not the only cue (text names ship + reason).
16. Accessibility: subject **named in text**. Verb **named in text**. Reason **named in text**. Distance **named in text** when range is the reason and distance is finite. **No new Digit.**
17. CPU: **no** per-frame DOM alloc for miss. One emit per edge press. HUD-04 linger coalesces repeats.
18. Prototype-safe: authored reason tokens only. Never `for-in` a miss payload into `ai` or `world`.
19. Do not “fix” known REDMARCH `castMatches` flake.
20. Do not steal sibling Wave 128 packs (HUD-07, NAV-09). Do not steal Hail01 PR2 stills.
21. Do not edit sibling honor docs, the wishlist, or `PROGRESS.md`. Deputize defaults live in **this** contract.
22. Do **not** open a fake hail card as “feedback”. Do **not** write Fear as the miss channel. Do **not** hail an unseen / unselected contact.

---

## 0.1 Wave 128 deputize (owner may override after playtest)

Pick a playable **named miss toast**. Inventory proves the hole is **live**. Do not park. Do not invent UU / SKU / Digit / persist key.

### Live knobs (do not retune as the “fix”)

| Knob | Live | Cite |
|---|---|---|
| Player KeyH open | salvage disabled hull in `TARGET_RANGE` only | `hail.js` **147–169**, **652–667** |
| Hail range | 600 u | `state.js` **32** |
| Dock range | 45 u | `state.js` **30** |
| Dock snap band | `<= 2 × DOCK_RANGE` (success, not miss) | `station.js` **6323–6329** |
| Overlay pause | **never** | `overlay-policy.js` **4** |
| HUD linger | 8 s | `hud.js` **70** |
| Toast lifetime | 4 s | `hud.js` **68** |
| Demand timer | 20 s (Hail01 live) | `hail.js` `DEMAND_SECONDS` |
| Agent `hail` act | **not live** | `agent-api.js` **150** |

Do **not** “fix” the hole by pausing the sim, by opening a fake card, by changing Fear, or by Agent hail.

### Playable policy (smallest additive)

**Name:** on player KeyH (and KeyJ when no dock/jump success), if no card/dock/jump opened, emit **one** authored miss event. HUD `toastForEvent` shows subject — verb — reason — distance if range.

| Piece | Freeze |
|---|---|
| **Who** | Player-initiated KeyH / KeyJ miss only. Not NPC `hailOpened`. Not Hail01 demand close. |
| **Subject** | Selected lock: `record.pilot ?? state.name`. Asteroid / kind lock: `'Rock'` (or live kind label if already authored). No lock: `'No lock'`. Dock: station display name if authored, else `'Station'`. Jump: dest `SYSTEMS[nearTo].name` if known, else `'Gate'`. **Never** a non-selected contact. |
| **Verb** | Disabled hull → `salvage`. Live / empty / kind → `hail`. Pad miss → `dock`. Gate miss → `jump`. |
| **Reasons (authored tokens)** | `none` (no lock); `range`; `overlay-chart`; `overlay-berth`; `calm`; `no-hail` (live / friendly / no player intents / not a ship); `dock-range`; `jump-zone`. |
| **Skip (no toast)** | `playSurfaceBlocked`; `settingsOwnsScreen`; hail card already `open`; successful salvage/`hailOpened` this press; `flags.docked` / dock success this press; `gate.jumping` / `jumpRequested` this frame; standing `'No passage.'` already emitted. Unknown overlay skip. |
| **Calm** | Name the selected ship + `hail calm`. Do **not** clear `calmUntil`. |
| **Overlay chart/berth** | Named miss (`hail blocked (chart)` / `berth`). Do **not** steal the overlay. Do **not** pause. |
| **Live friendly / bargain lock** | Named `{name} — no hail`. Do **not** emit NPC bargain `hailOpened`. Do **not** invent player combat hail intents. |
| **Salvage vs hail** | Disabled + out of range → salvage range copy. Live → hail `no-hail` or hail range if we later add live hail (we do **not** add live hail in PR1). |
| **Distance** | Integer `u` from player mesh to subject. Non-finite → omit. **Not** in linger key. |
| **Card** | Do **not** open a fake card. |
| **Fear** | Do **not** call `bumpFear`. Do **not** emit `fearChanged` for miss. |
| **Dock snap** | Leave `station.js` 2× snap. If snap docks, that is success — no miss toast. |
| **berthHeld jump** | Optional reason `held` **or** skip (CTL-03 sibling). Default: skip toast (do not steal berthHold). |
| **Callow** | Do not retune vouch cost / range. If no card opened, hail.js miss may still name the selected hull. |
| **HUD prompt** | Do **not** rewrite `hud.js` **2375–2397** in PR1 (HUD-07 / layout). Miss toast is the additive. Owner may later align the bargain `H — Hail` prompt. |
| **Overlay** | Never `paused`. |
| **Persist** | **none** new. |
| **Fail-closed** | never throw; never pause; never innerHTML; never unseen subject. |

### Later copy (authored `textContent` literals)

`{name}` = subject string already copied to a primitive. `{n}` = finite integer u.

**Keyed toasts** (existing API, `cls: 'warn'`):

| Token | Literal |
|---|---|
| `none` | `No lock — hail` |
| `range` + hail | `{name} — hail out of range ({n} u)` |
| `range` + salvage | `{name} — salvage out of range ({n} u)` |
| `overlay-chart` | `{name} — hail blocked (chart)` |
| `overlay-berth` | `{name} — hail blocked (berth)` |
| `calm` | `{name} — hail calm` |
| `no-hail` | `{name} — no hail` |
| `dock-range` | `{name} — dock out of range ({n} u)` |
| `jump-zone` | `{name} — jump not in zone` |

Inbox example `Cinder Halvard — hail out of range (732 u)` is the **range** shape. Keep em dash ` — `.

**Linger key (stable, no distance):** `warn|hailmiss|{verb}|{reason}|{keyName}`  
`{keyName}` is the display name with `|` and C0 controls stripped, length capped (deputize 48). Display toast still uses the full primitive via `textContent`. Same press-reason within 8 s does not flood. Changing `{n}` must **not** mint a new key.

Do **not** interpolate ship ids, faction keys, or record objects into HTML. `textContent` only. Do **not** say the player is invincible. Do **not** say Pause.

Do **not** dual-stack a miss toast with an open hail card in the same frame (HUD-04 `frameLines` / skip if card opened).

---

## 1. Later write-set (document now; do not edit those files this wave)

**This pack owns later:**

- **Writer:** `src/systems/hail.js` (player KeyH miss emit after existing gates; KeyJ miss emit when `dockPressed` remains and neither dock nor jump succeeded this frame). Prefer one helper `emitHailMiss` that never throws.

**Listeners only (not layout):**

- `src/systems/hud.js` — `toastForEvent` branch for authored miss event (name freeze: `'hailMiss'` or equal). **Do not** claim HUD rails, hub, gauges, context prompt, or toast slot count.

**Do not claim:**

- `src/systems/controls.js` (CTL-04 / CTL-01 remap)
- `src/systems/agent-api.js` / Agent observe ring / `act({name:'hail'})`
- `src/systems/overlay-policy.js` pause / mutex rewrite (read helpers as they are)
- `src/systems/npc.js` (interest / demand / HEAVE-TO)
- `src/systems/station.js` / `src/systems/gate.js` / `src/game/jump.js`
- `src/game/state.js` / `src/game/world.js` Callow vouch rewrite
- HUD-06 / HUD-07 / NAV-09

Optional: reuse `demandToastName`-style primitive name helper **in hail.js** so HUD never receives a ship object. Prefer event fields `{ name, verb, reason, dist }` as primitives only (Agent-observe safe; no `ship` on the event).

---

## 2. Partial merge forbidden

PR1 must land **together**: KeyH miss reasons (`none`, `range`, `overlay-*`, `calm`, `no-hail`) + salvage vs hail verb + HUD listener + `textContent` + stable key. Shipping overlay miss without range (or range without `no-hail` for friendlies) leaves the inbox hole.

Dock/jump miss copy **may** land in the same PR1 (census includes them) **or** as the last slice of PR1 in the same hail.js helper. Do **not** ship KeyH miss while leaving KeyJ silent **if** PR1 already touches KeyJ. Default: **include KeyJ miss in PR1** (smallest additive; one helper).

---

## 3. Serial PR plan (named only)

| PR | Lands | Does not land |
|---|---|---|
| **PR1** miss-feedback | named KeyH miss toasts; salvage vs hail verb; KeyJ dock/jump miss; HUD listener; stable key; fail-closed | fake card; Fear write; overlay pause; Agent hail; Hail01 retune; HUD layout; Digit; `innerHTML`; `controls.js`; persist; interest |
| **PR2 stills (optional)** | playtest stills of named miss | required with PR1 |
| **PR3 census (optional skip)** | re-grep silent `allow = false` gone | new world field |

First remaining serial is **PR1**.
