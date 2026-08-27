## Security Review: NAV-11 chart-close dest keep leftover integrator

### Risk Level: Low (this markdown wave) / Low (CONSUME — no later dest-keep PR1)

### Summary

Wave 137 lands markdown only. Leftover is **CONSUME**. Trust boundary is live dest ids in `world.nav` plus any later invert that `innerHTML`s names, persist-resumes flying AP, or teleports on close. HIGH/CRITICAL items are frozen in merge law: `textContent` only, no new WORLD_FIELD, restore AP false, no Agent claim, no pause, no teleport. No HIGH/CRITICAL remain open in this pack.

Applied `C:\Users\barry\.grok\bundled\skills\shared\personas\security-auditor.md` and `C:\Users\barry\.grok\skills\orchestrator\references\security-review.md`. Did **not** spawn `[security-auditor]`. Scope is the Wave 137 markdown pack plus live chart/nav/save/AP surfaces it cites. Review mode: quick scan of later-impl XSS / proto / persist / pause / teleport.

## Security Audit: `docs/Nav11RoutePersistDesign.md` + `out/w137/routepersist/**`

### Summary

Overall risk: **low / clean**. Leftover is CONSUME so there is no later dest-keep PR1 to attack. Freezes still bind if an owner re-opens after a true dest-drop census (UI re-sync only).

### Findings

#### 🔴 CRITICAL

None after freeze.

#### 🟠 HIGH

None after freeze.

#### 🟠 HIGH: XSS via dest HTML — **resolved in freeze**

**Location:** live dest labels `galaxychart.js` `destLabel` **109–114**; status `setStatusText` **990–993**; dest options **300–303** `textContent`; grep `innerHTML` in `galaxychart.js` = **0**  
**Issue:** A later dest-keep PR that used `innerHTML` / `insertAdjacentHTML` (especially if a system name were interpolated) would execute a tampered save name.  
**Impact:** script in the Galaxy Chart.  
**Fix (frozen):** contract §0.4 / §0.10: `innerHTML` forbidden; `sanitizeSystemId` + `textContent`. CONSUME ships no new copy. Later REAL UI re-sync must not HTML dest.

#### 🟠 HIGH: Persist-resume flying AP / extra dest key — **resolved in freeze**

**Location:** `save.js` **107–108**, **1205–1206**; `nav.js` **48–55**, **191–192**  
**Issue:** A second WORLD_FIELD or restore that kept `autopilot: true` would grab the stick after load. A hostile save dest already faces `sanitizeNav`.  
**Impact:** helm grab; duplicate dest bags.  
**Fix (frozen):** persist **no new key**. `nav` already exists. Restore omit → idle. Keep still `autopilot: false`. CONSUME forbids dest-keep `src/`.

#### 🟠 HIGH: Overlay pause / teleport on close — **resolved in freeze**

**Location:** `overlay-policy.js` **4**; `galaxychart.js` `setOpen` **935–962**  
**Issue:** Close handling that wrote `flags.paused` would freeze the sim (CTL-02). Close that wrote `currentSystem` would teleport.  
**Impact:** pause desync; skip zone/charge.  
**Fix (frozen):** never write `paused`; never teleport; close is hide + view + hover. Missing bag idle.

#### 🟠 HIGH: Agent dest cheat — **resolved in freeze**

**Location:** live `agent-api.js` **206–223**, **317–326**  
**Issue:** A NAV-11 PR that claimed Agent and bypassed `sanitizeSystemId` / uncharted fail-closed would plot proto ids or warp.  
**Impact:** off-keyboard dest; proto keys.  
**Fix (frozen):** contract: cite only; do not claim `agent-api.js`; no pad 2B. Human `plotRoute` already sanitizes.

### Passed Checks

- [x] No secrets in this pack (markdown only)
- [x] No new persist / localStorage
- [x] No `innerHTML` freeze
- [x] No Agent write-set
- [x] No credit / position writers claimed
- [x] Authored literals; prototype-safe (no `for-in` into world)
- [x] Fail-closed never-throw from close/open
- [x] NAV-03/06 not claimed as rewrite
- [x] REDMARCH flake not “fixed”
- [x] Browser workflow not executed (owner: no Vite / Chrome / CDP)

### 🟡 MEDIUM: Stale playtest vs live bag

**Location:** wishlist **207–210** vs `galaxychart.js` **935–962**, **1129–1134**  
**Issue:** A later author might treat INBOX as REAL and add a second dest store.  
**Fix applied:** CONSUME named; code wins; wishlist edit is other worker.

### 🟢 LOW: AP button does not print dest name

**Location:** `galaxychart.js` **1127–1137**  
**Issue:** Visible AP label is `Autopilot` / `Cancel autopilot`. Dest name is status / select / HUD. Not XSS.  
**Justification:** Frozen as a **UI nit**, not a hole. Plot-first is the no-route name only.

### Recommendations

1. Keep CONSUME / serial **none**. Do not implement dest-keep `src/`.
2. If owner re-opens after a true dest-drop census: `textContent`; no new WORLD_FIELD; never throw; missing bag idle.
3. Grep `setOpen` for `clearRoute` before any later REAL merge.
