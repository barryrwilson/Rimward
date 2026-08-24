# Designer audit: Wave 98 TGT-03 remaining radar (freeze)

| Field | Value |
|---|---|
| **Reviewer** | UI/UX auditor (review only; product source not edited) |
| **Date** | 2026-08-23 |
| **Persona** | `orchestrator/assets/designer-persona.md` |
| **Checklist** | `orchestrator/references/ui-audit.md` |
| **Scope** | `docs/Tgt03RadarDesign.md`, `out/w98/radar/shared-contract.md`, prior `out/w98/radar/ui-audit.md`, live occupancy in `src/systems/hud.js` contacts arc and `src/ui/hud.css` `.rw-contacts` / `.rw-edge-arrow` / `.rw-nav-gate-cue` |
| **Not in scope** | Product `src/` edits, Vite, sibling awareness / turrets trees, wishlist, `PROGRESS.md` |
| **Wave** | Markdown-only. Wave 98 does not ship HUD bindings. Findings are freeze vs live occupancy. |
| **Verdict** | **CLEAN** — no Blocker, no Major |

Merge law: if the brief and the contract disagree, the contract wins (`out/w98/radar/shared-contract.md` header).

---

## UI Audit: scanner-gated nearby-traffic picture (frozen HUD)

### Summary

The freeze names radar as the live bottom bearing arc (`.rw-contacts`). It does not add a PPI disc, a hub pip, or a second traffic class. Three jobs stay three classes. Scanner tier 0 still hides the arc. Friend/foe stays **shape**. No new `@keyframes`. Subsystem targeting and missile gauges stay **out**. Wave 98 ships no chrome.

### Freeze checklist

| Check | Result | Evidence |
|---|---|---|
| Radar reuses `.rw-contacts`; no hub PPI disc | **Pass** | Live wrap `hud.js:791–808`; CSS bottom arc `hud.css:787–795`. No `.rw-radar` in `hud.css`. Contract §1 / §1.1; brief goals 2, 4. |
| Three classes stay three | **Pass** | Traffic `.rw-contacts` `hud.js:792`; lock `.rw-edge-arrow` `hud.js:735–736`; gate `.rw-nav-gate-cue` `hud.js:737–741`. CSS `hud.css:576–594`, `787–849`, `1003–1037`. Contract §1.1 / §2 / §3. All three may show. |
| Empty 80 px hub stays empty | **Pass** | Reticle `80px` `hud.css:184–191`; clamp `hud.js:1194`. No lock box, radar pip, or missile gauge on the hub. Contract §6; HUD-01. |
| Scanner still gates; tier 0 has no arc | **Pass** | `showArc = scanner >= 1 && !docked && !!shipObj` `hud.js:1382–1386`. Mk I bubble / cap 16; Mk II 2× / cap 24 `hud.js:1400–1401`. Contract §1.3. |
| Shape stays friend/foe; color is not the only cue | **Pass** | `contactKind` tick / chevron / hollow diamond `hud.js:354–357`; CSS `hud.css:825–849`. Colors use `--dim` / `--amber` / `--cyan` (`--amber` → `--rw-warn`, `--cyan` → `--rw-accent` `hud.css:21–23`). Contract §1.5. |
| No new `@keyframes`; reducedMotion kills HUD anim | **Pass** | Freeze forbids new contacts keyframes (contract §1.6 / §9). Live `rw-contact-enter` `hud.css:863–874` and mech `rw-mech-contact-enter` `hud.css:1302–1308` stay. Global kill `hud.css:1171–1177`. |
| Subsystem targeting and missile gauges stay out | **Pass** | Contract §0.14 / §4 / §9. Toasts `Incoming dart.` / `Incoming fire.` `hud.js:62, 568–572`. No incoming widget on the hub. Brief non-goals. |

### What's done well

- Live code already **is** the nearby-traffic picture. Radar is reuse of Wave F, not a new SKU or disc.
- Occupancy is already stacked: arc `bottom: 5.5%` (`hud.css:790`); prompt `bottom: 20%` (`hud.css:743`); combat rails `top: 57%` (`hud.css:886`). The 80 px reticle stays the hub.
- Three glyphs stay distinct: dim tick (civ), amber chevron (hostile), cyan hollow diamond (lock). Lock off-glass is the amber triangle. Route is cyan ticks + notch. Color is never the only cue (`hud.css:1–4`).
- Scanner gate is fail-closed. Starter hulls keep DIST, edge arrow, lead, MATCH. They do not get a fake radar.
- Ships only on the arc (`hud.js:1406–1412`). Rocks, gates, missiles, and `world.contacts` people rows stay off the pips.
- Mk II closure is `«` / `»` via `textContent` (`hud.js:1490–1491`). No pip names. No `innerHTML` in `hud.js`.
- Contacts wrap is `aria-hidden="true"` (`hud.js:793`). Toasts remain the live region (`hud.js:763–766`). Pointer-events none (`hud.css:794`).
- Colorblind remaps `--rw-warn` / `--rw-accent` on `#hud` (`hud.css:1134–1138`). Contrast thickens `.rw-contacts-stroke` (`hud.css:876–878`). Bio/mech skins retune the same three shapes, not a new class (`hud.css:1274–1296`, `1526–1547`).
- Digit 0/8/9, KeyT/KeyV, cone 12 px, and `state.js` stay out of this serial.

---

### Findings

No 🔴 Blocker. No 🟠 Major.

PPI and class-steal Majors stay **closed** in the freeze (same as `out/w98/radar/ui-audit.md` pass 2). Do not reopen them as open defects. Wave 98 must not edit `src/`.

#### 🔴 Blocker: None

#### 🟠 Major: Second traffic widget / hub PPI

**Location:** HUD-01 hub `hud.js:1194`; `.rw-contacts` `hud.css:787–795`  
**Issue:** A PPI disc, reticle ring, or `.rw-radar` class would double-paint Wave F and occupy the empty 80 px glass.  
**Fix:** Reuse `.rw-contacts` only. Hub stays empty.  
**Status:** addressed in freeze (contract §1.1 / §6)

#### 🟠 Major: Merge lock / gate / traffic

**Location:** `hud.css:576–594` vs `787–849` vs `1003–1037`  
**Issue:** One glyph for three jobs would mix crowd, lock, and route.  
**Fix:** Keep three classes. All may show.  
**Status:** addressed in freeze (contract §1.1 / §2 / §3)

#### 🟡 Minor: Arc does not park while jumping

**Severity:** Minor  
**Location:** `hud.js:1382–1383` vs lock park `hud.js:1303–1306` vs `navPark` `hud.js:1577`  
**Issue:** Docked already hides the arc. Jumping still shows contacts. NAV-02 and the lock arrow already park on jump.  
**Suggestion:** Later PR2 only: hide `.rw-contacts` while `ctx.gate.jumping`. Do not clear `ctx.world.scanner`. Do not add jump chrome.  
**Status:** accepted — contract §1.3 / §8 / §9 default **Yes**

#### 🟡 Minor: `is-aft` has no CSS

**Severity:** Minor  
**Location:** `hud.js:1458–1468`; `hud.css` grep 0 for `is-aft`  
**Issue:** Aft is already the bowl of the arc (`contactYawToU` `hud.js:175–178`). A word or extra icon as “radar aft” would clutter.  
**Suggestion:** Do not invent aft chrome. Yaw mapping is the aft cue.  
**Status:** accepted

#### 🟡 Minor: Enter pulse already animates

**Severity:** Minor  
**Location:** `hud.css:863–874`; mech override `hud.css:1302–1308`  
**Issue:** Freeze says no **new** `@keyframes`. Live `rw-contact-enter` / `rw-mech-contact-enter` stay.  
**Suggestion:** Do not add a sweep or radar-spin. Reduced-motion already sets `animation: none` on the enter mark and on `#hud *`.  
**Status:** accepted — removing the live pulse is out of scope

#### 🟡 Minor: `.is-far` opacity 0.28

**Severity:** Minor  
**Location:** `hud.js:1459`; `hud.css:861`  
**Issue:** Combat civilians beyond 45% of range fade. Shape still exists. Contrast mode does not raise this opacity.  
**Suggestion:** Later PR4 may bump far opacity under `body.rw-contrast` if a pin shows the tick vanish. Do not replace fade with a color-only cue. Do not raise caps.  
**Status:** accepted — live occupancy; freeze does not restyle the arc

#### 💡 Suggestion: Park the arc while jumping

Already default-yes in contract §1.3 / §9. Matches NAV-02 and the live lock-arrow park. If PR1 pins already match live `hud.js`, PR2 is the only later behavior change.

#### 💡 Suggestion: Contacts stroke uses a fixed rgba

**Location:** `hud.css:805–808` (`stroke: rgba(111, 242, 224, 0.38)`)  
**Issue:** Pip marks use CSS vars. The thin arc stroke is a literal cyan. Contrast already overrides the stroke (`hud.css:876–878`). Colorblind does not remap this rgba.  
**Suggestion:** Later PR4 may point the stroke at `color-mix` on `var(--rw-accent)` if a colorblind pin looks off. Do not add a filled disc to “fix” contrast.

---

### Frozen copy / chrome (do not paraphrase later)

| Moment | Literal / glyph | Surface |
|---|---|---|
| Mk II lock inbound | `«` | pip `textContent` |
| Mk II lock outbound | `»` | pip `textContent` |
| Cannon vs player | `Incoming fire.` | toast (sibling; do not change) |
| Dart vs player | `Incoming dart.` | toast (do not change) |
| Pip names | **none** | — |

Do not add RADAR / PPI captions on the hub. Do not add a LOCK word on the traffic diamond (that mark is the lock **on the arc**, not the edge arrow).

### Contrast / motion / layout (freeze law)

- `body.rw-colorblind` remaps `--rw-warn` / `--rw-accent` (Okabe-Ito). Chevrons stay chevrons. Diamonds stay diamonds. Ticks stay ticks.
- `body.rw-contrast` strengthens `.rw-contacts-stroke`.
- `body.rw-reduced-motion`: no new sweep; enter keyframes already `animation: none`; global `#hud *` kill remains.
- Transform-only pip motion on the arc is allowed. A radar-spin is not.
- Toast stack stays top-right off the aim column. Radar stays the bottom arc.
- Digit 0/8/9 chrome untouched. Outfitting 2/4 stay Wolfeye labels.

### Agreement with prior `ui-audit.md`

Pass 2 closed PPI and class-steal Majors in the freeze. Jump-park is polish, not a new gauge. This designer pass agrees. `is-aft`, live enter pulse, and far fade stay accepted, not reopeners.

### Pass verdict

Wave 98 markdown freeze is **CLEAN** for UI/UX. Later impl must reuse `.rw-contacts`, keep `.rw-edge-arrow` and `.rw-nav-gate-cue` for lock and route, allow all three, keep the 80 px hub empty, hide the arc at scanner 0, keep friend/foe as shape, add no contacts `@keyframes`, leave Digit 0/8/9, and keep subsystem targeting and missile gauges **out**. If live `hud.js` already matches the picture, ship jump park only.
