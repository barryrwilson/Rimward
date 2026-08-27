# Security Review: Agent play badge layout + a11y tokens leftover integrator

### Risk Level: Low (this markdown wave) / Medium (later PR1 CSS if z-index or PWR rules are ignored)

### Summary

Wave 139 lands markdown only. Trust boundary is later `src/style.css` rules on a body-child play card that already uses `createElement` / `textContent`. HIGH/CRITICAL items are frozen in merge law: no `innerHTML`, z-index stays **40** (not below station scrim 20), PWR/RANGE stay uncovered (`max-height` retuned with `top`), no persist of badge geometry, never write `flags.paused`. No HIGH/CRITICAL remain open in this pack.

### Findings

#### 🔴 CRITICAL

None after freeze.

#### 🟠 HIGH: XSS via badge status / intent / error strings — **resolved in freeze**

**Location:** live `agent-api.js` **535**, **551–559**, **571–581** `textContent`; `makeBadgeNode` **511–515** `createElement`; later `style.css` only  
**Issue:** `lastIntent.name` / `lastIntent.error` can be strings. A later rewrite that used `innerHTML` / `insertAdjacentHTML` for `Last: ${name}` or `Error: ${error}` would execute a tampered intent.  
**Impact:** script in a `z-index: 40` body-child card above the HUD.  
**Fix (frozen):** contract §0.4: `innerHTML` forbidden; keep `textContent` / `createElement`. This pack does **not** claim `agent-api.js`. CSS cannot inject HTML.

#### 🟠 HIGH: Click-jack Enable/Stop under the station scrim — **resolved in freeze**

**Location:** live badge `z-index: 40` `style.css` **43**; scrim `z-index: 20` `screens.css` **16**; badge `pointer-events: auto` `style.css` **44**, **106**  
**Issue:** A later “fix overlap” that set `z-index: 15` (or any value below 20) would hide Enable/Stop under `.screen-overlay`. Inbox forbids lowering below scrim 20.  
**Impact:** player cannot stop agent play while docked; untrusted clicks hit the scrim, not the buttons.  
**Fix (frozen):** contract §0.8: z-index stays **40** (hail/gate band). Above HUD 10 and scrim 20. Below pause 50. Do not drop. Do not raise to pause.

#### 🟠 HIGH: Cover PWR / RANGE as a flight-safety hide — **resolved in freeze**

**Location:** live PWR `hud.js` **1223**; `.rw-bottom` `hud.css` **1021–1025**; RANGE `hud.css` **207–220**; badge `max-height: calc(100vh - 32px)` `style.css` **49**  
**Issue:** Restoring bottom-right, or raising `top` while keeping `max-height: calc(100vh - 32px)`, lets the card cover PWR (power) or the hub RANGE word. Hiding PWR is a safety issue. Inbox: do not cover PWR or the range marker again.  
**Impact:** pilot cannot read power while the opt-in overlay is up.  
**Fix (frozen):** keep `bottom: auto; left: auto`. Deputize `top: 140px` and `max-height: calc(100vh - 156px)` so the card cannot grow into the bottom strip. Do not claim `hud.js`.

#### 🟠 HIGH: Persist badge geometry / god-mode overlay flag — **resolved in freeze**

**Location:** settings persist `settings.js` **24**, **76–81**; agent session `agent-api.js` **1–3**; `save.js` WORLD_FIELDS (cite only)  
**Issue:** A new persist key for `badgeTop` / `badgeHidden` would let a hostile store hush the stop control or freeze a covering pin across sessions.  
**Impact:** owner-looking overlay that survives reload.  
**Fix (frozen):** persist **none** new for geometry. Authored CSS constants only. Do not claim `save.js` or `settings.js`.

#### 🟠 HIGH: Overlay pause as “layout lock” — **resolved in freeze**

**Location:** overlay-policy never writes `flags.paused` (cite only)  
**Issue:** A later JS measure that paused the sim while “placing” the badge would freeze flight (CTL-02).  
**Impact:** pause desync.  
**Fix (frozen):** no JS. Never write `paused`. Do not claim `overlay-policy.js`.

### Passed Checks

- [x] No secrets in this pack (markdown only)
- [x] No new persist / localStorage
- [x] No `innerHTML` freeze
- [x] z-index 40 kept (not below scrim 20)
- [x] PWR / RANGE cover forbidden; max-height retuned
- [x] Body child stays; no HUD parent theft
- [x] Fail-closed missing Manifest ≠ crash
- [x] Enable stays trusted-click (`agent-api.js` **667–671**, cite only)
- [x] `state.js` not claimed

### 🟡 MEDIUM: Badge stays clickable on docked station chrome

**Location:** `style.css` **43–44** vs `screens.css` **16–21**  
**Issue:** z-index 40 above scrim 20 means the card can eat pointer events on a ~40 px strip of a 1280-wide station panel (orch-fable t2 suggestion).  
**Justification:** Inbox requires z-index above scrim so Enable/Stop stay usable. Do not drop z. Documented; not expanded.

### 🟡 MEDIUM: Untrusted `enable` already refused

**Location:** `agent-api.js` **664–671**  
**Issue:** CSS layout does not change the trusted-click gate. A later JS that called `enable()` without `isTrusted` would still fail closed.  
**Justification:** Live gate. This pack must not claim `agent-api.js` to “fix” it.

### 🟢 LOW: Local CSS tokens are not secrets

**Location:** `style.css` **33–37**  
**Issue:** Hex palette copies HUD defaults.  
**Justification:** Public UI tokens. Mirror Okabe-Ito from `hud.css` **1234–1238**.

### Recommendations

1. Later PR1: CSS offset + width + PWR-safe max-height + palette mirrors; z-index 40; no JS.
2. Do not add WORLD_FIELDS or settings keys for geometry.
3. Do not parent under `#hud`.
4. Do not `innerHTML` intent strings.

### Re-review (after freeze)

Re-read inventory, contract §0, deputize table, and live cites. HUD-06 `.rw-home-mark` named as cite-only so a bottom-right regression cannot return under “range marker.” No new CRITICAL/HIGH. MEDIUM dock-credits overlap and trusted-`enable` stay documented. This wave did not start Vite/Chrome and did not write `src/`.
