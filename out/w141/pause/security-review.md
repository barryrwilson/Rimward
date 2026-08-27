# Security Review: CTL-05 pause menu leftover integrator

### Risk Level: Medium (later PR1) / Low (this markdown wave)

### Summary

Wave 141 lands markdown only. Trust boundary is later pause paint plus access into live Settings / berth / title. HIGH/CRITICAL items are frozen in merge law: no `innerHTML`, KeyP typing/models/title guards stay, no `rimward-title-skip` on TITLE, LOAD-while-paused stays gated, overlay-policy never writes `flags.paused`, persist none. No HIGH/CRITICAL remain open in this pack.

### Findings

#### 🔴 CRITICAL

None after freeze.

#### 🟠 HIGH: XSS via pause / berth / title strings — **resolved in freeze**

**Location:** later `pauseEl` actions; live `main.js` **172** `textContent`; berth meta `save.js` **1608–1612**; title labels `title.js` **170**  
**Issue:** A later rewrite that used `innerHTML` / `insertAdjacentHTML` for `PAUSED`, slot dates, system names, or `credits + ' UU'` would execute a tampered name if a snapshot overlay wrote display strings.  
**Impact:** script in the pause/berth overlay.  
**Fix (frozen):** contract §0.4: `innerHTML` forbidden; `textContent` only. Do not interpolate untrusted strings into HTML.

#### 🟠 HIGH: KeyP while typing / models filter unpause — **resolved in freeze**

**Location:** `main.js` **177–184**; `modelsbrowser.js` **703–719**, **745–749**  
**Issue:** Typing "Lamp" in the models filter used to unpause the title sim and spawn unprimed traffic. A pause-menu PR that dropped the typing / `models.isOpen` / `#rw-title` guards would restore that.  
**Impact:** sim runs under a text field; hostile traffic under title.  
**Fix (frozen):** contract §0.11 / §0.20: existing guards stay. Do not unpause into a title-filter KeyP. Fail-closed: unknown action skip.

#### 🟠 HIGH: Title-skip / sessionStorage door — **resolved in freeze**

**Location:** `title.js` **59–63**, **107–111**  
**Issue:** `sessionStorage` `rimward-title-skip` === `'1'` skips the title for one boot after confirmed NEW GAME. A TITLE-from-pause path that set the marker, or that `location.reload`’d, would either skip title or wipe the run. Hostile script that set the marker already skips one boot (live). This pack must not grow a second writer.  
**Impact:** title capture skipped; or world wipe.  
**Fix (frozen):** TITLE remounts without reload and without setting skip. NEW GAME keeps its live confirm/reload. Persist **none** new.

#### 🟠 HIGH: LOAD while paused (Wave 28) — **resolved in freeze**

**Location:** `save.js` **1497–1502**; `main.js` **158–161**  
**Issue:** Cross-system restore emits `systemLoaded` into `ctx.events`. While paused the systems loop does not run, so the event rotates out unseen. Station/gates would stay desynced. Unpausing to “make LOAD work” from the pause menu races combat and the same queue.  
**Impact:** world/UI desync after LOAD.  
**Fix (frozen):** LOAD refuse while `flags.paused` **stays**. Open berth from pause **without** clearing pause. Named-disable LOAD in UI. SAVE still writes.

#### 🟠 HIGH: Overlay mutex steal / overlay-policy pause write — **resolved in freeze**

**Location:** `overlay-policy.js` **4**, **118–128**, **196–203**  
**Issue:** A pause-menu helper that wrote `flags.paused` from overlay-policy would steal CTL-02. Opening berth from pause while hail/chart is open without `canOpenPlayCard` would stack play cards. Merging `berthHold` into pause would steal CTL-03 and break LOAD (hold must not impersonate pause).  
**Impact:** pause desync; LOAD refuse on berth-only hold; stacked cards.  
**Fix (frozen):** overlay-policy **never** writes `paused`. Berth-from-pause still mutex. `berthHold` stays distinct. One in-run display owner: `main.js` `setPaused`.

#### 🟠 HIGH: Persist mute / pause forever — **resolved in freeze**

**Location:** `ctx.js` flags **223–234**; settings `rimward-settings-v1` `settings.js` **24–38**  
**Issue:** A new persist key for “menu paused” or stuffing `paused` into WORLD_FIELDS would let a hostile save freeze the sim after load. Expanding Settings FIELDS here would steal inbox **131–135** and persist new input knobs without that pack’s validators.  
**Impact:** forever pause; unauthorized settings schema.  
**Fix (frozen):** persist **none** new. `state.js` READ-ONLY. Settings FIELDS unchanged. Do not persist `paused` or `berthHold`.

#### 🟠 HIGH: Settings/berth dim-ring click-through to RESUME — **resolved in freeze**

**Location:** settings root `pointer-events:none` (`settings.js` **91–93**); berth root (`save.js` **1371–1372**); pauseEl default auto (`main.js` **170–171**)  
**Issue:** After PR1, a click on the dim ring around Settings or Berth falls through z 80/60 to pause z 50 and can fire RESUME, unpausing under an open desk (LOAD then works — Wave 28 bypass by click-through).  
**Impact:** unpause under Settings/berth; LOAD while the player still sees a records desk.  
**Fix (frozen):** contract §0.13 / §0.1: `pauseEl` `pointer-events: none` (or ignore actions) while settings, berth, or title cover. Do not raise pause z.

#### 🟠 HIGH: Uncaught throw from pause paint — **resolved in freeze**

**Location:** later `pauseEl` action dispatch; live banner has no try/catch (`main.js` **185–186**)  
**Issue:** One bad action id or a missing `titleApi` on remount could throw on click and leave `pauseEl` half-painted.  
**Impact:** overlay fail open; possible unpause.  
**Fix (frozen):** contract §0.11: never throw from pause paint; unknown action skip; do not unpause on skip.

### Passed Checks

- [x] No secrets in this pack (markdown only)
- [x] No new persist / localStorage keys
- [x] No `innerHTML` freeze
- [x] KeyP typing / models / title guards frozen
- [x] Title-skip not claimed for TITLE-from-pause
- [x] LOAD-while-paused gate kept
- [x] Overlay-policy never writes `paused`
- [x] `berthHold` not merged
- [x] Settings expansion not stolen
- [x] `state.js` not claimed
- [x] No teleport / credit grant
- [x] REDMARCH flake not “fixed”

### 🟡 MEDIUM: Live KeyO has no pause/title guard

**Location:** `settings.js` **228–234**  
**Issue:** KeyO toggles Settings even under title (intentional pass-through) and while paused (z 80 over 50). A later export of `setOpen` must not add a second toggle that fights capture.  
**Justification:** Title SETTINGS already dispatches synthetic KeyO (`title.js` **132–134**). PR1 may reuse that. Do not rewrite capture.

### 🟡 MEDIUM: LOAD buttons stay enabled while paused (live)

**Location:** `save.js` **1602–1614** vs refuse **1502**  
**Issue:** Click on LOAD while paused is a silent no-op. Pause-opened berth would look broken.  
**Justification:** PR1 named-disable with text, not color-only. Live hole until PR1 (expected).

### Recommendations

1. Later PR1: `setPaused` in `main.js` so flag and `pauseEl.display` cannot desync after title CONTINUE.
2. Later PR1: TITLE must not touch `rimward-title-skip`.
3. Keep overlay-policy out of the pause write path.
