# Current hail-demand inventory (Wave 126 leftover census)

**Code wins.** Line numbers are live `src/` on 2026-08-25. This file is census, not a wish.

**Leftover:** **REAL.** Named serial **PR1**. Not CONSUME. Not Hail02.

**This leftover:** incoming pirate demand lifecycle (source, timer, compliance path, dock/jump-safe visible outcome).  
**Not this leftover:** player-initiated Hail02 miss-feedback. HUD-06 home marker. Agent API. CTL-02 overlay pause. CTL-03 berthHold. CTL-04 menu digits. AI-05 pirate interest tables. HUD-04 toast-flood rewrite.

---

## 0. Inbox vs live copy

Wishlist Idea inbox — Playtest capture 2026-08-25 second pass (`docs/PLAYER-EXPERIENCE-WISHLIST.md` **142–149**, **cite, do not edit**):

> Give pirate demands a full lifecycle. The "HEAVE TO. CARGO OR HULL." toast names no ship, range, deadline, or way to comply; it persisted while docked, reappeared after a gate jump, and expired silently. One demand (Ninth Tooth) opened a proper pay-or-fight card; the Carver Illyx demands never did, and a gate jump closed an open card mid-choice with no resolution.

| Playtest string | Live code | Cite |
|---|---|---|
| `HEAVE TO. CARGO OR HULL.` | **Not** in `src/` as a hail card line. Pirate **telegraph** `commLine` is `'Heave to. Cargo or hull.'` | `npc.js` **1686–1688** |
| Ace/Illyx telegraph | `'Run if you like.'` (plus recognition lines) | `npc.js` **2151–2186** |
| Demand hail card line | `'Your cargo or your hull.'` on `hailOpened` | `npc.js` **2036** |
| HUD toast for `hailOpened` | **none** (`toastForEvent` `default: null`) | `hud.js` **677–678** |
| HUD toast for that telegraph | `commLine` → chip text = `e.text` only (**no** `from` / ship name) | `hud.js` **560–568** |

The orphan HEAVE-TO surface is the **hunt telegraph `commLine`**, toasted nameless, not the Wave 30 demand card.

---

## 1. Two incoming channels (do not collapse by accident)

| Channel | Who | Event | Player surface | Compliance | Timer |
|---|---|---|---|---|---|
| Hunt telegraph | pirate (not ace) once `ai.phase === 'telegraph'` and `!ai.demanding` | `say` → `commLine` | HUD toast 4 s, linger 8 s, **no ship name** | none | telegraph 3 s then **attack**, not a demand clock |
| Wave 30 demand hail | `ai.role === 'pirate'` + hunt close inside `U.TARGET_RANGE` | `hailOpened` `{ ship, intents, line, demand }` | hail **card** (`HAIL — {speaker}`) | `payTribute` / `showTeeth` / `refuseFight` | **none** (holds until resolve, void-on-hit, disable, or silent despawn) |
| Ace duel telegraph | `role === 'ace'` (`updateDuel`) | `commLine` | nameless toast unless recognition line is unique | fight or flee — **no** pay-or-fight card | telegraph 3 s then attack |
| Bargain hail | resolve band `bargaining` | `hailOpened` intentsFor | card “They are breaking.” | ransom / tribute-in / letGo — **not** pirate demand | none |

Demand emit then `engageTarget` **same frame** (`npc.js` **2036** then **2039**). While `ai.demanding`, telegraph **returns before** `commSent` (`npc.js` **1681–1685**). HEAVE-TO therefore fires when the pirate is in the encounter bubble **but not yet** in demand range, or when demand never emits (ace, cooldown, docked, grace).

---

## 2. Range and emit gates

| Knob | Live | Cite |
|---|---|---|
| Encounter bubble (acquire / telegraph) | 800 u | `state.js` **27**; `npc.js` **1970**, **1927** |
| Demand range | `U.TARGET_RANGE` **600** | `state.js` **32**; `npc.js` **2015**, **2025** |
| Telegraph length | 3 s | `npc.js` **93**, **1691** |
| Demand cooldown per record | 300 s (`record.demandedAt`) | `npc.js` **107**, **2024** |
| One demand per instance | `ai.demandSent` reset **never** | `npc.js` **249**, **2027** |
| Docked | hunt `breakOff` — **no new** demand (no `targetPos`) | `npc.js` **1913–1915**, **2013–2014** |
| Law zone | breakOff, no demand | `npc.js` **1923–1926** |
| Hop grace | `hopGraceUntilNow` | `npc.js` **1715–1716**, **2022** |
| Wave 125 starter grace | `starterGraceBlocksAcquire` on demand | `npc.js` **1755–1777**, **2023** |
| Demand amount | `max(demandMin 50, round(tributeRate 0.02 × cargoValueSafe(ctx.cargo) × 10))` | `npc.js` **2032–2035**; `state.js` **324**, **343** |
| Intents | `payTribute`; `showTeeth` iff `concealedMounts === true`; `refuseFight` | `npc.js` **1477–1482** |

`cargoValueSafe` returns 0 for non-arrays (`data-trade.js` **114–122**). `cargoValue` still multiplies raw `c.units` (`state.js` **1134–1136**). Non-finite units → **NaN demand**. `Math.max(50, NaN)` is **NaN**.

---

## 3. Card open / steal / defer

| Step | Live | Cite |
|---|---|---|
| Card open | `hail.js` `openCard` on `hailOpened` | **341–429**, **454–470** |
| Speaker | `HAIL — ${record.pilot ?? state.name}`; subline faction · hull name | **365–375** |
| Buttons | `[n] Pay tribute — ${h.demand} UU` / Show teeth / Refuse | **330–335**, **406–421** |
| Digit 1..n | hail resolve if `hailDigitsAllowed !== false` | **431–447**; `overlay-policy.js` **175–185** |
| Calm refuse | `canShowHail` false → **no** `openCard`, **no** defer | `overlay-policy.js` **107–116**; `hail.js` **460–470** |
| Chart/berth | `'defer'` → `deferIncomingHail`; skip card only | `overlay-policy.js` **111**, **130–146**; `hail.js` **466–468** |
| Hail already open (other ship) | `if (open) continue` — demand **dropped**, no defer | `hail.js` **459** |
| Same ship reopen | `openCard` again | `hail.js` **455–457** |
| Overlay pause write | **never** | `overlay-policy.js` **4**; `hail.js` **18–20** |
| Mutex | hail/chart/berth exclusive | `overlay-policy.js` **7**, **118–127** |
| Wave 125 `berthHold` | session; **not** pause; not demand close | `overlay-policy.js` **187–204**; `ctx.js` **211** |

Illyx **never** hits the demand block: spawn `role: 'ace'` → `ai.mode = 'duel'` (`world.js` **408–414**; `npc.js` **230–232**). `updateDuel` has **no** `hailOpened` demand (`npc.js` **2042–2189**). Ninth Tooth is a Freehold **pirate** name (`world.js` **227**) and **can** emit demand. Census matches playtest: Ninth Tooth card possible; Illyx tribute card **absent by role**.

---

## 4. Close paths (outcome vs silent)

| Close | Emits `hailClosed`? | Stamps `demandOutcome`? | Player-visible outcome? | Cite |
|---|---|---|---|---|
| `payTribute` / `showTeeth` / `refuseFight` | yes `{ ship }` | paid / bluffed / failed / refused | `commLine` from pirate | `hail.js` **248–310** |
| Player hit after `demandPeaceAt` | yes `{ ship }` | **no** | card vanishes; fight on | `npc.js` **2525–2530** |
| Hull disabled while demanding | clears `demanding`; hail may convert to salvage | no | salvage card if hail still open | `npc.js` **2526–2527**; `hail.js` **501–509** |
| Destroyed / not in `ctx.ships` | **no** | no | `closeCard()` only | `hail.js` **497–500** |
| Gate jump midpoint | empties `ctx.ships` then hail `update` silent-closes | no | **none** | `jump.js` **121–166**; `main.js` **122–129** (jump → npc → hail); `hail.js` **497–500** |
| Dock with card open | hunt `breakOff`; **does not** clear `demanding`; hail **does not** close on `flags.docked` | no | card can **stay**; toast may still linger 4 s | `npc.js` **1619–1623**, **1913–1915**; hail.js no dock listener |
| Overlay `hailClosed` listener | close if unscoped or matching ship | n/a | card hide | `hail.js` **471–473** |
| npc hold release | only if `demanding && demandOutcome` (or other-ship `hailOpened` clears demanding) | uses stamp | no extra toast | `npc.js` **2586–2608** |

Jump-mid-card: playtest **confirmed**. `hail.js` has **zero** `systemLoaded` listeners.

Dock persist: new demand blocked; **open** demand card is **not** dock-safe. Telegraph toast uses HUD lifetime only (`hud.js` **64–66**, **1237–1244**) — expires **silently**.

---

## 5. Credits / hold / HUD / Agent

| Surface | Live | Cite |
|---|---|---|
| Pay debit | `credits = max(0, credits - (h.demand ?? 0))` | `hail.js` **253** |
| NaN demand | NaN credits (no `Number.isFinite`) | **253**; emit **2032–2035** |
| Partial pay | short credits still count as `'paid'` | `hail.js` **249–259** |
| Toast API | `textContent`; key = `cls + '|' + text`; 8 s identical-key linger | `hud.js` **66**, **1186–1212** |
| `hailOpened` toast | **not** toasted | `hud.js` **557–678** |
| Agent observe (design, sibling) | `hailOpened` `{ intents, salvage }` — **never** `ship` | `docs/AgentApiDesign.md` **323** |
| Agent `hailResolve` (design) | live card only; `hailDigitsAllowed` | `docs/AgentApiDesign.md` **344** |
| `state.js` demand persist | **none** (`demandSent` instance; `demandedAt` on record already) | `npc.js` **249–252**, **2031** |

---

## 6. Verdict vs CONSUME test

CONSUME required **all** of: named source, timer, card-or-equal compliance, dock/jump-safe close with visible outcome, no orphan HEAVE-TO toast.

| Test | Live? |
|---|---|
| Named source on HEAVE-TO toast | **No** (`commLine` text only) |
| Demand timer / deadline | **No** |
| Card-or-equal for every pirate demand emit | **Partial** — emit exists; open can defer, drop, or never apply to ace |
| Illyx tribute card | **No** (ace duel, not pirate demand) |
| Dock-safe close + visible outcome | **No** (card may persist; toast expires silent) |
| Jump-safe close + visible outcome | **No** (`closeCard` without `hailClosed`) |
| Orphan HEAVE-TO gone | **No** (telegraph 800–600 u gap) |

**Leftover REAL. Serial PR1. Named serial is not none.**
