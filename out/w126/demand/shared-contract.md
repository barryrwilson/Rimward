# Hail01 pirate demand lifecycle shared contract

**Wave:** 126. Design only. No hail-demand ships in this wave.  
**Status:** MERGE LAW for `docs/Hail01DemandLifecycleDesign.md`. If that document and this file ever disagree, **this file wins**.  
**Leftover:** **REAL.** Not CONSUME. Serial is **not** none. Named later serial: **PR1** (incoming pirate demand lifecycle).  
**Name:** pirate demand source + timer + compliance + dock/jump-safe visible outcome.  
**Not this wave:** any edit under `src/`, `scripts/`, `public/`, `index.html`, `package.json`. Do not edit `docs/PLAYER-EXPERIENCE-WISHLIST.md`, `PROGRESS.md`, `docs/AgentApiDesign.md`, `docs/Hud06HomeMarkerDesign.md`, `docs/Ctl*.md`, `docs/Nav*.md`, `docs/Hud04ToastFloodDesign.md`, `docs/Ctl02OverlayDesign.md`, `docs/OwnerDecisions*.md`. Do not write Hail02. Do not steal `out/w126/agentapi/**`, `out/w126/homemarker/**`. Do not write `out/w126/demand/verify/**`.

**Locked sources:** wishlist INBOX (P1, HAIL/ENCOUNTERS) pirate demand lifecycle (**cite, do not edit**); sibling INBOX (P1, HAIL/CONTEXT) player-initiated hail-feedback (**Hail02, not this pack**); live inventory `out/w126/demand/current-hail-demand-inventory.md` (code wins); Wave 118 CTL-02 mutex + **never write `flags.paused`**; Wave 120 HUD-04 8 s identical-key linger; Wave 30 `payTribute` / `showTeeth` / `refuseFight`; Wave 125 `berthHold` / starter grace / menu digits.

Integrator rule: a **later** implementation wave obeys this file. Inventory cites live code. Code wins over playtest all-caps HEAVE-TO (live telegraph is `'Heave to. Cargo or hull.'`).

**This leftover is the incoming pirate demand lifecycle.** It is **not** player-H-on-friendly feedback. It is **not** CTL-02 pause. It is **not** HUD-06 station pip. It is **not** Agent API. It is **not** HUD-04 toast-flood rewrite. It is **not** AI-05 interest retune.

**Live hole:** nameless telegraph toast; demand has no timer; jump `closeCard` with no `hailClosed`; dock does not resolve an open demand; Illyx never emits pirate demand. **Leftover is real. Not CONSUME. Serial is not none.**

---

## 0. Orchestrator merge law (do not weaken)

1. This worker is **markdown only**. No `src/`. Later impl is **serial**. Serial PR plan is **named only**. Do **not** land these PRs in `src/` in this worker.
2. HUD-01 empty **80 px hub**. Aim-glass gauges stay off. Kit mutate omit. No demand pip on the aim glass. **Do not** steal Digit 0/8/9. **No new Digit.** Hail digits **1..n** on an **OPEN** demand card stay hail resolution (CTL-04 / `hailDigitsAllowed` — **cite, do not reopen**).
3. KeyH stays hail. KeyJ stays dock/jump. KeyL stays berth. KeyM stays chart. KeyP stays pause. **Do not remap those keys.**
4. `innerHTML` forbidden later. Card / toast / comm use `textContent` / `createTextNode` / `el()` only. Live hail already uses `textContent` (`hail.js` **369–375**, **412**). Toasts stay `textContent` (`hud.js` **1210**). **No** `insertAdjacentHTML` / `document.write`.
5. `src/game/state.js` is READ-ONLY later unless census **proves** a persist key is required. Default: **none**. Do **not** invent UU. Do **not** invent SKU. Do **not** invent Digit. Demand clocks stay **session** (`ai.demandPeaceAt` / later deadline on the live hull).
6. Persist: **no** new `WORLD_FIELDS` key. **No** new `localStorage` key. Do **not** persist `demanding` / deadline / berth-open demand. Hostile save must not grant god-mode mute or infinite parley. Existing `record.demandedAt` stays the 300 s cooldown stamp — do not grow it into a persist hold.
7. Overlay mutex stays CTL-02: hail / chart / berth exclusive. Hail / chart / berth **never** write `ctx.flags.paused`. Demand close is **not** pause. Do **not** reopen hail defer/calm as a new mutex. Do **not** pause the sim for a demand card.
8. HUD-04: 8 s identical-key linger **stays**. Do **not** reopen toast flood as a new channel. Demand copy **may** use the existing toast API (`pushToast` / `toastForEvent`) with a **stable key** (not a new stack, not extra slots, not z-index raise).
9. AI-05 starter grace is **who-when**. Demand emit already reads `starterGraceBlocksAcquire` (`npc.js` **2023**). Do **not** retune pirate interest tables, spawn mix, or `playerInterestChance`.
10. Agent API must **not** become a cheat pay-tribute. Do **not** claim `agent-api.js`. Do **not** add `act({ name: 'payTribute' })` that debits credits off-card. Later human-equivalent `hailResolve` on an **open** demand card (sibling Agent design) must use the **live rolled demand**, `hailDigitsAllowed`, and the same clamp as the button. Observe must not grow `hailOpened.ship`.
11. Hail02 (player-initiated miss-feedback) is a **SIBLING**. Do **not** write Hail02. Do **not** teach KeyH-on-friendly. This pack is **incoming pirate demand** only.
12. Do **not** steal HUD-06 home marker. Do **not** claim `hud.js` **layout**. If a toast must change, name **`hud.js` listeners only** for the demand event.
13. Do **not** claim `controls.js` (CTL-04). Digit overlap comment `hail.js` **431–432** is a **cite**.
14. Fail closed:
    - Never throw out of demand emit / close / toast.
    - Demand amount: if `!Number.isFinite(n)` or `n < demandMin`, use `HIDDEN_MOUNTS.demandMin` (50). Never debit NaN credits. `payTribute` writes `credits = max(0, finiteCredits - finiteDemand)` only if both are finite; else skip debit, fail closed, still resolve the card (do not leave NaN wallet).
    - Missing overlay helper → skip mutex (live hail catch) **and do not** fall back to `flags.paused`.
    - Jump/despawn without a live ship pointer → still emit a **named** outcome toast (stable key) and clear local card; do not leave `hailOpen` true.
    - Demand emit that cannot open **or** defer a card this frame must not leave `ai.demanding === true` with no player surface. Skip emit or fail closed to a named outcome.
    - Unknown overlay / proto ids → ignore. Authored event types only.
15. `reducedMotion`: do **not** invent demand animation. Timer is text on the card / toast.
16. Accessibility: source ship **named in text**. Deadline **named in text**. Compliance verbs **named in text**. Color is not the only cue. **No new Digit.**
17. CPU: **no** per-frame DOM alloc beyond live hail rebuild-on-open. Timer text may refresh on the existing line node via `textContent` (no innerHTML). No extra toast slots.
18. Prototype-safe: authored flag / outcome strings only (`paid` / `bluffed` / `failed` / `refused` / later `expired` / `docked` / `jumped` / `voided`). Never `for-in` a hail payload into `ai`.
19. Do not “fix” known unrelated boot FAILs.
20. Do not steal sibling Wave 126 packs (Agent API, HUD-06). Do not steal CTL-03 PR2, CTL-04 PR2, AI-05 PR2, HUD-04 rewrite, CTL-02 pause.
21. Do not edit sibling honor docs, the wishlist, or `PROGRESS.md`. Deputize defaults live in **this** contract.

---

## 0.1 Wave 126 deputize (owner may override after playtest)

Pick a playable **incoming pirate demand lifecycle**. Inventory proves the hole is **live**. Do not park. Do not invent UU / SKU / Digit / persist key.

### Live knobs (do not retune as the “fix” except copy + close)

| Knob | Live | Cite |
|---|---|---|
| Telegraph copy | `'Heave to. Cargo or hull.'` (pirate); ace `'Run if you like.'` | `npc.js` **1688**, **2158** |
| Demand card line | `'Your cargo or your hull.'` | `npc.js` **2036** |
| Demand range | 600 u | `state.js` **32** |
| Acquire bubble | 800 u | `state.js` **27** |
| Telegraph | 3 s | `npc.js` **93** |
| Record cooldown | 300 s | `npc.js` **107** |
| `demandMin` | 50 UU | `state.js` **343** |
| Overlay pause | **never** | `overlay-policy.js` **4** |
| HUD linger | 8 s | `hud.js` **66** |
| Toast lifetime | 4 s | `hud.js` **64** |
| Illyx role | `ace` / duel | `world.js` **408–414** |

Do **not** “fix” the hole by pausing the sim, by paying tribute from Agent without a card, or by deleting Illyx.

### Playable policy (smallest additive)

**Name:** one incoming **pirate** demand object: named source, session timer, card-or-equal compliance, dock/jump/timeout/void close with a visible outcome. Telegraph HEAVE-TO is **not** a second unpaid channel.

| Piece | Freeze |
|---|---|
| **Who is a demand** | `ai.role === 'pirate'` hunt `hailOpened` with `demandIntentsFor` (Wave 30). **Not** bargain hail. **Not** salvage. **Not** Callow. |
| **Illyx vs generic pirate** | **Illyx / ace stays duel.** Do **not** bolt `payTribute` onto `updateDuel`. Playtest “Illyx demands never opened a card” is **census-true** (no demand emit). PR1 does **not** invent an Illyx tribute card. Ace telegraph is **not** a pirate demand. Do not reuse pirate HEAVE-TO copy on ace. |
| **Timer length** | **20 s** session from emit (`demandPeaceAt` already stamped). Visible on card. At 0 → outcome `expired` = same as refuse (weapons hot, named toast). Owner may override after playtest (10–30 s). Do not persist the clock. |
| **Dock behavior** | `flags.docked === true` **closes** an open/deferred demand: `demandOutcome = 'docked'`, `demanding = false`, `hailClosed` `{ ship }` if the hull still exists, named toast. **Do not** keep the card at the pad. **Do not** keep HEAVE-TO lingering as a live demand. New emit already blocked while docked — keep that. |
| **Jump mid-card** | Midpoint / `systemLoaded` / `ctx.ships` empty: resolve `jumped` **before** silent `closeCard`. Named toast. Drop deferred hail (`dropDeferredHail`). Do not reopen the old demand in the next system. Hop grace already blocks a fresh demand — keep. |
| **Orphan HEAVE-TO** | Pirate telegraph **must not** toast nameless `Heave to. Cargo or hull.` as a demand substitute. If the pirate **will** demand (hunt vs player, in bubble, demand not yet sent): **suppress** that telegraph `commLine` **or** replace with a **named** demand-pending line that is not a second compliance channel. Once `hailOpened` demand emits, the **card** is the compliance path. One keyed toast may **announce** the card (stable key `warn\|demand|{shipName}` or equal) — HUD-04 linger applies. |
| **Named source** | Toast and card always include `record.pilot ?? state.name`. HUD `commLine` path today **drops** `from` (`hud.js` **568**) — do **not** rewrite all commLine toasts (HUD-04). Prefer a **demand-specific** event or demand-only `toastForEvent` branch. |
| **Compliance** | Keep Wave 30 intents and numbering: `[1] payTribute` `[2] showTeeth` (mounts) `[3] refuseFight`. `hailDigitsAllowed` stays. No new Digit. |
| **Credits** | Fail-closed finite clamp. `demandMin` floor. Never NaN wallet. Never Agent off-card debit. |
| **Overlay** | Chart/berth still **defer** the card (CTL-02). Timer **keeps running** while deferred. If hail already open on another ship, **defer** the demand (do not `continue`-drop). If `canShowHail` is **false** (calm), **do not** leave `demanding` with no card and no toast: fail closed to a named `expired`/`voided` outcome, or skip the emit. Do not write `paused`. |
| **Void-on-hit** | Keep (`npc.js` **2528–2530**). Add named toast `voided`. |
| **Persist** | **none** new. |
| **Fail-closed** | never throw; never pause; never NaN credits. |

### Later copy (authored `textContent` literals)

`{name}` = speaker. `{n}` = finite integer UU. `{t}` = remaining whole seconds.

**Card line (demand open):** `{name} heaves to — {n} UU or hull. {t}s.`  
**Buttons:** keep live verbs: `Pay tribute — {n} UU` / `Show teeth — reveal the hidden mounts` / `Refuse — and fight`.

**Keyed toasts (existing API, `cls: 'warn'` unless noted):**

| Outcome | Literal |
|---|---|
| Open / announce | `{name} — heave to. Pay {n} UU or fight. {t}s.` |
| `paid` | `{name} — tribute taken. They run.` (`good`) |
| `bluffed` | `{name} — they break off.` (`good`) |
| `failed` | `{name} — bluff failed. They fire.` |
| `refused` | `{name} — demand refused. They fire.` |
| `expired` | `{name} — demand expired. They fire.` |
| `docked` | `{name} — demand broken. You docked.` |
| `jumped` | `{name} — demand dropped. You jumped.` |
| `voided` | `{name} — parley void. They fire.` |

Do **not** interpolate ship ids or faction keys into HTML. `textContent` only. Do **not** say the player is invincible. Do **not** say Pause.

Live pirate `commLine` pay/bluff/refuse lines (`hail.js` **261**, **277**, **290**) may stay as **card flavour**; the keyed toast is the **outcome** the inbox asked for. Do not dual-stack identical sentences in one frame (HUD-04 `frameLines` / same key).

---

## 1. Later write-set (document now; do not edit those files this wave)

**This pack owns later:**

- **Writers:** `src/systems/hail.js` (open/close/timer text/outcome emit; defer demand when a card is already open; dock/jump/despawn close with `hailClosed`).
- **Writers:** `src/systems/npc.js` (demand emit clamp; suppress orphan HEAVE-TO; timer expiry = refuse; dock/jump clear `demanding`; keep Wave 30 intents).

**Listeners only (not layout):**

- `src/systems/hud.js` — `toastForEvent` branch for a **demand outcome / demand announce** event (or demand-tagged `commLine`). **Do not** claim HUD rails, hub, gauges, or toast slot count.

**Do not claim:**

- `src/systems/controls.js` (CTL-04)
- `src/systems/agent-api.js` / Agent observe ring
- `src/systems/overlay-policy.js` pause / mutex rewrite (read `canShowHail` / `deferIncomingHail` / `hailDigitsAllowed` / `berthHeld` as they are)
- `src/game/state.js`
- AI-05 interest / spawn
- HUD-06 home marker

Optional tiny helper on overlay-policy **only** if census in the impl wave proves the one defer slot cannot hold a demand while hail is busy — default: hail.js calls existing `deferIncomingHail`. Do **not** reopen CTL-02.

---

## 2. Partial merge forbidden

PR1 must land **together**: named source, timer, card-or-equal, dock close, jump close, orphan HEAVE-TO suppression, finite demand clamp, `textContent` copy. Shipping a timer without jump outcome (or jump close without copy) leaves the inbox hole.

---

## 3. Serial PR plan (named only)

| PR | Lands | Does not land |
|---|---|---|
| **PR1** demand lifecycle | named source; 20 s timer; Wave 30 card stays compliance; dock/jump/expire/void outcomes; HEAVE-TO no longer nameless unpaid toast; NaN clamp | Illyx tribute; Hail02; Agent payTribute; HUD layout; overlay pause; interest retune; persist; Digit; `innerHTML`; `controls.js` |
| **PR2 stills (optional)** | playtest stills of named toast + card + jump outcome | required with PR1 |
| **PR3 census (optional skip)** | re-grep no nameless Heave to as demand; hail.js `systemLoaded` or ships-empty close emits outcome | new world field |

First remaining serial is **PR1**.
