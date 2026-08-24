# Designer audit: Wave 99 TGT-03 radar jump-park

| Field | Value |
|---|---|
| **Reviewer** | UI/UX auditor (review only; product source not edited) |
| **Date** | 2026-08-23 |
| **Persona** | `orchestrator/assets/designer-persona.md` |
| **Checklist** | `orchestrator/references/ui-audit.md` |
| **Scope** | `src/game/contacts-gate.js`; `src/systems/hud.js` contacts arc gate / `.rw-contacts`; `src/ui/hud.css` contacts / hub / reduced-motion; `docs/Tgt03RadarDesign.md` status; `out/w98/radar/shared-contract.md`; worker `out/w99/radar/ui-audit.md` |
| **Not in scope** | Product `src/` edits, Vite, sibling awareness / turrets trees, wishlist, `PROGRESS.md` |
| **Wave** | 99 — jump park only. Reuse `.rw-contacts`. No PPI. No `.rw-radar`. |
| **Verdict** | **CLEAN** — no Blocker, no Major |

Merge law: if the brief and the contract disagree, the contract wins (`out/w98/radar/shared-contract.md`). HUD-01 empty 80 px hub stays empty.

---

## UI Audit: contacts jump-park (`.rw-contacts`)

### Summary

Wave 99 parks the live bottom bearing arc while jumping. Hide uses existing `#hud .is-hidden`. The empty 80 px hub stays empty. No PPI, no `.rw-radar`, no new `@keyframes`. Scanner 0 still means no arc. Three classes stay three.

### Law checklist

| Check | Result | Evidence |
|---|---|---|
| HUD-01 empty 80 px hub stays empty; no radar pip on glass | **Pass** | Reticle 80×80 `hud.css:184–191`; clamp `hud.js:1196`. Contacts sit `bottom: 5.5%` `hud.css:787–795`. No pip under `.rw-reticle`. |
| Reuse `.rw-contacts`. No `.rw-radar`. No PPI disc | **Pass** | Wrap `hud.js:794–805`. CSS thin stroke, no fill `hud.css:786–809`. Grep `.rw-radar` in `*.js` / `*.css`: 0. |
| Distinct from `.rw-edge-arrow` and `.rw-nav-gate-cue` | **Pass** | Separate nodes `hud.js:737–743` vs `794`. CSS `hud.css:576–594`, `787–849`, `1003–1037`. Three jobs stay three glyphs. |
| Hide while docked **and** while `ctx.gate.jumping` | **Pass** | `contactsGate` `contacts-gate.js:18–19`. HUD `hud.js:1171`, `1384–1388`. `#hud .is-hidden` `hud.css:36`. |
| No new `@keyframes`. reducedMotion kill stays | **Pass** | Live `rw-contact-enter` `hud.css:863–874`; mech `rw-mech-contact-enter` `hud.css:1302–1308`. Extra kill `hud.css:872–874`. Global `#hud *` kill `hud.css:1173–1177`. Wave 99 adds none. |
| No pip names | **Pass** | Marks are empty spans + CSS shape `hud.js:808–810`; `hud.css:825–849`. Mk II `«` / `»` `textContent` `hud.js:1493`. `el()` uses `textContent` `hud.js:242–246`. `innerHTML` in `hud.js`: 0. |
| Scanner 0 = no arc | **Pass** | `contactsScanner` heals to 0 `contacts-gate.js:8–9`. Gate requires `>= 1` `contacts-gate.js:19`. HUD `hud.js:1384–1388`. |

### What's done well

- Jump park matches NAV-02 (`navPark` `hud.js:1579`) and lock-arrow park (`hud.js:1305–1307`). One jump flag at `hud.js:1171` also drives the jump bar.
- Hide is a class toggle, not a sweep. Instant `display: none` is the right park. Do not add motion.
- Helper is pure. It does not write DOM or scanner (`contacts-gate.js:1–4`, `18–19`). HUD still owns the wrap.
- Contacts wrap stays `aria-hidden="true"` (`hud.js:795`). `pointer-events: none` (`hud.css:794`). Toasts stay the live region (`hud.js:765–768`).
- Friend/foe stays shape: tick / chevron / hollow diamond (`hud.js:356–359`; `hud.css:825–849`). Colorblind / contrast vars stay. Bio/mech still retune the same three marks (`hud.css:1274–1296`, `1526–1547`).
- Occupancy stack is unchanged: prompt `bottom: 20%` (`hud.css:741–745`); arc `bottom: 5.5%`; hub 80 px at reticle. Jump chrome is the existing `.rw-jump` bar, not a hub pip.
- Worker self-audit (`out/w99/radar/ui-audit.md`) matches live occupancy. No Blocker/Major there. This pass agrees.

---

### Findings

No 🔴 Blocker. No 🟠 Major.

#### 🔴 Blocker: None

#### 🟠 Major: None

#### 🟡 Minor: Contract §3 parenthetical omits jump park

**Severity:** Minor  
**Location:** `out/w98/radar/shared-contract.md:113` vs §1.3 (`shared-contract.md:66`) and live `hud.js:1384–1388`  
**Issue:** §3 still says the arc may show when scanner ≥ 1 and not docked. Live Wave 99 also parks while jumping. §1.3 already named that polish. The brief table is current (`docs/Tgt03RadarDesign.md:166–169`).  
**Suggestion:** Later docs pass: add “not jumping” in §3 so it matches §1.3. Do not change HUD chrome.  
**Status:** accepted — contract §1.3 / §9 default **Yes**; live code is correct

#### 💡 Suggestion: Jump hide is class toggle, not a new motion

**Severity:** Suggestion  
**Location:** `src/systems/hud.js:1386–1388` (`classList.toggle('is-hidden', !showArc)`)  
**Issue:** Instant hide. Correct for park. A sweep would fight reduced-motion law.  
**Suggestion:** Keep the toggle. Do not add a hide animation.  
**Status:** accepted (same as worker `out/w99/radar/ui-audit.md`)

---

### Closed from Wave 98 designer pass

| Prior finding | Status now |
|---|---|
| 🟡 Arc does not park while jumping (`out/w98/radar/designer-audit.md`) | **Addressed** — `contactsGate(..., jumping)` + HUD hide |
| 💡 Park the arc while jumping | **Done** in Wave 99 |
| 🟠 Second traffic widget / hub PPI | **Closed** — reuse only; hub empty |
| 🟠 Merge lock / gate / traffic | **Closed** — three classes stay |
| 🟡 `is-aft` has no CSS | **Accepted** — not this wave; do not invent aft chrome |
| 🟡 Enter pulse already animates | **Accepted** — live pulse stays; no new keyframes |
| 🟡 `.is-far` opacity 0.28 | **Accepted** — PR4 contrast, not jump park |
| 💡 Contacts stroke fixed rgba | **Accepted** — PR4 colorblind stroke, not jump park |

Do not reopen those as Wave 99 defects.

### Frozen copy / chrome (do not paraphrase)

| Moment | Literal / glyph | Surface |
|---|---|---|
| Mk II lock inbound | `«` | pip `textContent` |
| Mk II lock outbound | `»` | pip `textContent` |
| Cannon vs player | `Incoming fire.` | toast (sibling; do not change) |
| Dart vs player | `Incoming dart.` | toast (do not change) |
| Pip names | **none** | — |
| Jump park | hide `.rw-contacts` | `#hud .is-hidden` |

Do not add RADAR / PPI captions on the hub. Do not put a radar pip on the 80 px glass.

### Contrast / motion / layout

- `body.rw-colorblind` remaps `--rw-warn` / `--rw-accent`. Shapes stay shapes.
- `body.rw-contrast` strengthens `.rw-contacts-stroke` (`hud.css:876–878`).
- `body.rw-reduced-motion`: global `#hud *` kill (`hud.css:1173–1177`); enter mark kill (`hud.css:872–874`). Hostile enter emit already skips reduced motion (`hud.js:1504`).
- Transform-only pip motion on the arc stays allowed. A radar-spin is not.
- Digit 0/8/9 chrome untouched. FORE/AFT, Incoming dart/fire copy, lock arrow, NAV-02 cue untouched.

### Agreement with worker `ui-audit.md`

Worker pass 1: no Blocker/Major; no new widget; empty hub; three classes distinct; no new `@keyframes`; reduced-motion kill remains. This designer pass agrees. The only extra note is stale contract §3 wording (Minor, docs later).

### Pass verdict

Wave 99 jump-park is **CLEAN** for UI/UX. Live HUD reuses `.rw-contacts`, parks docked and jumping, keeps scanner 0 = no arc, keeps the 80 px hub empty, and does not add a PPI, `.rw-radar`, pip names, or new contacts `@keyframes`.
