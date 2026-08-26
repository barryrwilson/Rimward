## Security Review: Hail02 miss-feedback leftover integrator

### Risk Level: Medium (later PR1) / Low (this markdown wave)

### Summary

Wave 128 lands markdown only. Trust boundary is later toast copy of save-backed ship names plus Agent hail. HIGH/CRITICAL items are frozen in merge law: `textContent` only, no `ship` on the event, no Agent `act hail`, no persist mute, no pause, no Fear write. No HIGH/CRITICAL remain open in this pack.

### Findings

#### 🔴 CRITICAL

None after freeze.

#### 🟠 HIGH: XSS via ship / station names — **resolved in freeze**

**Location:** later `hud.js` `toastForEvent`; live `hud.js` **1317** `textContent`; inventory `demandToastName` **744–755**  
**Issue:** `record.pilot` / `state.name` are world strings. A later miss toast that used `innerHTML` / `insertAdjacentHTML` would execute a tampered save name.  
**Impact:** script in the HUD toast stack.  
**Fix (frozen):** contract §0.4 / §0.14: `innerHTML` forbidden; primitives `{ name, verb, reason, dist }` only; **no `ship` object** on `'hailMiss'`; toast `textContent`. Linger `{keyName}` strips `|` / C0 and caps length.

#### 🟠 HIGH: Agent cheat hail — **resolved in freeze**

**Location:** `agent-schema.js` **33** name `'hail'`; live `agent-api.js` **150** unknown; `docs/AgentApiDesign.md` pulse PR3  
**Issue:** A Hail02 PR that implemented `act({ name: 'hail' })` without range/calm/overlay gates would let an Agent open salvage or impersonate a hail.  
**Impact:** off-keyboard hail; range cheat; possible Hail01 adjacency.  
**Fix (frozen):** contract §0.10: do not claim `agent-api.js`; do not add `act hail`. Observe must not grow `hailOpened.ship`. Primitive miss events stay Agent-safe.

#### 🟠 HIGH: Persist god-mode mute — **resolved in freeze**

**Location:** `state.js` WORLD_FIELDS (read-only honor)  
**Issue:** Persisting “do not toast hail miss” would let a hostile save hush contextual feedback forever.  
**Impact:** owner-looking mute.  
**Fix (frozen):** persist **none**. No new WORLD_FIELDS. No localStorage key.

#### 🟠 HIGH: Overlay pause / unknown overlay — **resolved in freeze**

**Location:** `overlay-policy.js` **4**; `hail.js` catch skips  
**Issue:** Miss handling that wrote `flags.paused` would freeze the sim (CTL-02). Unknown overlay fallback to pause is the same hole.  
**Impact:** pause desync; berthHold confusion.  
**Fix (frozen):** never write `paused`; unknown overlay skip; title/settings skip toast.

#### 🟠 HIGH: Fear as miss feedback — **resolved in freeze**

**Location:** `hail.js` **172–175** vs **652–667**; `hud.js` **613–618**  
**Issue:** Using `bumpFear` / `fearChanged` as “you pressed H” would replay the playtest bug and write world state.  
**Impact:** standing/fear economy cheat or false causality.  
**Fix (frozen):** miss must not call `bumpFear` or emit `fearChanged`.

### Passed Checks

- [x] No secrets in this pack (markdown only)
- [x] No new persist / localStorage
- [x] No `innerHTML` freeze
- [x] No Agent hail pulse
- [x] No credit / position writers claimed
- [x] Prototype-safe authored reason tokens
- [x] Fail-closed never-throw
- [x] Unseen contact cannot be the subject
- [x] Hail01 demand timer / payTribute not reopened
- [x] REDMARCH flake not “fixed”

### 🟡 MEDIUM: Linger key collision on `|` in names

**Location:** contract linger key  
**Issue:** A name containing `|` could shift key fields.  
**Fix applied:** `{keyName}` strip `|` / C0; cap 48. Display stays `textContent`.

### 🟡 MEDIUM: Distance in copy vs key

**Location:** HUD-04 linger `hud.js` **70**, **1293–1317**  
**Issue:** Putting `{n}` in the key would mint a new toast every meter.  
**Fix applied:** distance in **text** only.

### 🟢 LOW: `commLine.from` still dropped

**Location:** `hud.js` **565–573**  
**Issue:** A naive miss via `commLine` would drop the speaker.  
**Justification:** Hail02 uses a dedicated `'hailMiss'` (or equal) `toastForEvent` branch, not all-commLine rewrite (HUD-04).

### 🟢 LOW: Callow silent vouch (credits / range)

**Location:** `world.js` **1228–1244**  
**Issue:** Callow-specific silent returns remain.  
**Justification:** smallest additive is hail.js miss on the selected hull if no card opened. Do not retune vouch. Not a new persist/credit path.

### Recommendations

1. PR1: emit primitives; HUD `textContent`; never `ship` on the event.
2. PR1: grep `innerHTML` / `act({ name: 'hail'` in the hail-miss write-set before merge.
3. Do not persist miss preference.
