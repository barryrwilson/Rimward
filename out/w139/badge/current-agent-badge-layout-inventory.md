# Agent play badge layout + a11y tokens inventory

**Wave:** 139 leftover census. Markdown only. No `src/` writes.  
**Code wins.** Cites are live file:line at census time (2026-08-27).  
**Leftover:** **REAL.** Named serial **PR1**. Not CONSUME. Named serial is **not** none.  
**Name:** offset the body-child Agent play badge so it does not cover Manifest (UU / FEAR / CARGO) or toasts, and mirror colorblind / high-contrast HUD tokens onto `.rw-agent-badge` without moving the node under `#hud`.  
**Not this leftover:** Agent API PR5 badge mount (body child stays). Agent market fill. Market desk layout. Pad 2B. In-repo LLM. Hail01 / HUD-06 / Hail02 / HUD-07 / NAV-09 / NAV-10 governor / TGT-07 stills / MSN-04 other families / CTL-03 / AI-05 / CTL-04.

Inbox sources (`docs/PLAYER-EXPERIENCE-WISHLIST.md` Playtest capture 2026-08-27 Claude Fable — **cite, do not edit**):

- INBOX (P2, HUD/AGENT) **313–317**: After the badge move, `?agent=1` still covers Manifest (UU / FEAR / CARGO) and some toasts at top-right (`z-index` 40 over HUD 10). Offset the badge below Manifest, or narrow it. Do not cover PWR or the range marker again. Do not lower badge `z-index` below the station scrim (20). Cite `out/orch-fable/t2/ui-audit.md`.
- INBOX (P3, HUD/AGENT) **324–327**: Colorblind and high-contrast body classes do not retint the Agent play badge tokens. Mirror HUD token overrides on `.rw-agent-badge` without moving it under `#hud`. Cite `out/orch-fable/t2/ui-audit.md`.

Playtest evidence (`out/orch-fable/t2/ui-audit.md`) is **cite only**, not live truth. Code wins.

---

## 1. Badge CSS pin (primary hole — overlap)

| Surface | Today | Cite |
|---|---|---|
| Selector | `.rw-agent-badge` in page CSS, **not** under `#hud` | `src/style.css` **32–59** |
| Tokens (local copies) | `--rw-accent: #6ff2e0`; `--panel: rgba(9, 16, 30, 0.78)`; `--white: #dce8f4`; `--panel-edge: rgba(96, 150, 196, 0.28)`; `--void: #02060d` | **33–37** (comment: match `hud.css` **12–21**) |
| Pin | `position: fixed; top: 16px; right: 16px; bottom: auto; left: auto` | **38–42** |
| Stack | `z-index: 40` | **43** |
| Pointer | `pointer-events: auto` on root and buttons; status `none` | **44**, **73**, **106** |
| Size | `max-width: min(280px, calc(100vw - 32px))`; `max-height: calc(100vh - 32px)`; `overflow-y: auto` | **48–50** |
| ON / OFF | `.is-on` solid 4px left `--rw-accent`; `.is-off` dashed 4px `--panel-edge` | **61–67** |
| Buttons | `min-width` / `min-height: 44px`; hover + focus ring | **105–126** |
| Reduced motion | `body.rw-reduced-motion .rw-agent-badge` kills animation/transition | **128–132** |
| Colorblind / contrast on badge | **none** | census: no `body.rw-colorblind .rw-agent-badge` / `body.rw-contrast .rw-agent-badge` in `src/**/*.css` |

Old bottom-right pin is cleared (`bottom: auto; left: auto`). PWR and the hub range word are **not** under this pin. Top-right Manifest and the toast column **are**.

---

## 2. Badge mount (cite only — do not reopen PR5)

| Surface | Today | Cite |
|---|---|---|
| Node factory | `document.createElement`; className; **no** `innerHTML` | `agent-api.js` `makeBadgeNode` **511–515** |
| Mount parent | `doc.body.appendChild(root)` | **523–566** |
| Always mount | `initAgentApi` calls `mountAgentBadge(ctx)` with **no** `queryOptIn` gate | **706** |
| Query | `URLSearchParams` `agent === '1'` → `agent.optIn = true` | `queryOptIn` **48–71**; **640** |
| Default opt-in | `ensureAgent` forces `optIn` false unless already `true` | **74–80** |
| Enable | trusted click only (`ev.isTrusted === true`) | **664–680** |
| Disable | `optIn = false`; does not cancel Autopilot | **683–693**; hint copy **474** |
| Paint | `textContent` + `classList.toggle('is-on'/'is-off')` | **568–581** |
| Buttons | real `button`; `type = 'button'` twice | **548–556** |
| Live region | `aria-live="polite"` `aria-atomic="true"` on status | **530–532** |
| Fail-closed mount | missing `document` / `body` → return; catch → `badgePaint = null` | **522–526**, **604–606** |
| Fail-closed paint | `refreshBadge` try/catch; `update` try/catch | **502–508**, **709–716** |

`?agent=1` auto-enables **play**. The **card** is a body child whenever `initAgentApi` can append. This pack does **not** hide/unmount the card. Do **not** claim `agent-api.js` unless a later owner asks a class/mount change. Prefer CSS offset.

---

## 3. Manifest / toasts / PWR / range (why the overlap exists)

| Surface | Today | Overlap with badge `top:16px; right:16px; max-width:280px; z-index:40`? | Cite |
|---|---|---|---|
| `#hud` | `position: fixed; inset: 0; pointer-events: none; z-index: 10` | Badge stacks **above** HUD | `src/style.css` **24–29** |
| Manifest | `section.rw-panel.rw-resources`; title `Manifest`; meters UU / FEAR / CARGO | **Yes.** Same corner. HUD 10 under badge 40 | `hud.js` **1263–1274**; `hud.css` **1171–1176** (`top: 14px; right: 14px; min-width: 132px`) |
| Panel chrome | `.rw-panel` padding `8px 10px`; title + three `.rw-meter` rows | Height ~86 px at textScale 1; ~111 px at 1.5 (XL) before `top: 14px` | `hud.css` **39–48**, **51–59**, **80–86**; `settings.js` `TEXT_SCALES` **25** |
| Toasts | `.rw-toasts` `top: 14px; right: 168px`; `pointer-events: none`; `role="status"` | **Yes** horizontally: 280 px card from `right: 16px` crosses `right: 168px` | `hud.css` **709–721**; `hud.js` **1063–1075** |
| PWR | bottom strip `.rw-bottom` `bottom: 12px`; `makeBar(..., 'PWR')` in `.rw-side-col` | **No** at current top-right pin | `hud.css` **1020–1028**; `hud.js` **1191**, **1221–1223** |
| Range word | `.rw-reticle-range` under hub; `display:none` until `.in-range` | **No** at current top-right pin (center glass) | `hud.css` **207–220**; `hud.js` **994** |
| HUD-06 station mark | `.rw-home-mark` world-projected pip / chevron + distance text | **Cite only.** Bottom-right pin used to cover it. Keep top-right. Do **not** steal HUD-06 | `hud.css` **644–698**; `hud.js` **1040–1042** |
| Controls | top-left `left: 14px` | **No** | `hud.css` **1178–1184** |

Manifest and toasts are **read** surfaces (`#hud` pointer-events none except named controls). Overlap hides UU / FEAR / CARGO and toast chips. It does not steal Manifest clicks.

Authored Manifest box (scale 1.5, conservative): padding 16 + title ~26 + three meters ~69 ≈ **111 px**, plus Manifest `top: 14px` ≈ **125 px**. An 8 px gap wants badge `top` **≥ 133 px**. Deputize **140 px**.

Toast clear by width: toast `right: 168px`; badge `right: 16px` → width **≤ 152 px** stays in the Manifest column. Deputize `max-width: min(148px, calc(100vw - 32px))` (panel `min-width` **148 px**, `hud.css` **45**).

---

## 4. z-index stack (keep 40)

| Layer | z-index | Cite |
|---|---|---|
| `#hud` | 10 | `style.css` **28** |
| Station / death scrim `.screen-overlay` | 20 | `screens.css` **16** |
| Galaxy chart | 30 | `hud.css` **1996** |
| Onboarding | 35 | `onboarding.js` **84** |
| Agent badge | **40** | `style.css` **43** |
| Hail overlay | 40 | `hail.js` **385** |
| Pause banner | 50 | `main.js` **171** |
| Berth / origins | 60 | `save.js` **1372**; `origins.js` **106** |
| Title overlay | 70 | `screens.css` **511** |
| Models / settings | 80 | `models.css` **13**; `settings.js` **13**, **93** |

Inbox: do **not** lower badge `z-index` below station scrim **20**. Honor: keep **40** (hail/gate band — above HUD 10 and scrim 20, below pause 50). Enable/Stop must remain usable on the dock scrim.

---

## 5. Colorblind / contrast (primary hole — tokens)

| Surface | Today | Badge inherits? | Cite |
|---|---|---|---|
| Body classes | `rw-colorblind` / `rw-contrast` / `rw-reduced-motion` | Reduced-motion **yes**; palette **no** | `settings.js` **69–73** |
| Colorblind HUD | `body.rw-colorblind #hud` Okabe-Ito `--rw-accent #56B4E9`; warn `#E69F00`; bad `#D55E00`; good `#009E73` | **No.** Badge is not a `#hud` descendant | `hud.css` **1233–1238** |
| Contrast HUD | `body.rw-contrast #hud` `--white #ffffff`; `--dim #aec3d8`; `--panel rgba(4, 8, 17, 0.94)`; `--panel-edge rgba(160, 205, 245, 0.6)` | **No** | `hud.css` **1241–1248** |
| Screen overlay | `body.rw-colorblind .screen-overlay` / `body.rw-contrast .screen-overlay` | **No** | `screens.css` **564–576** |
| Text scale | `--rw-text-scale` **inline on `#hud` only** | **No.** Not this leftover (inbox is palette) | `settings.js` **73**; `hud.css` **29–31** |
| Badge reduced-motion | already kills animation/transition | keep | `style.css` **128–132** |

Local custom properties on `.rw-agent-badge` **freeze** default HUD values. `#hud` overrides never apply. ON/OFF still has **text** plus **solid vs dashed** border (`style.css` **61–67**, `agent-api.js` **571–574**). The gap is settings **parity**, not a color-only state.

---

## 6. Honor surfaces (cite only — do not steal)

| Surface | Today | This leftover |
|---|---|---|
| HUD-01 hub | 80 px empty aim glass | **Do not** put the badge in the hub | honor |
| Aim-glass gauges | off | stay off | honor |
| Digit 0/8/9 | station | stay | honor |
| KeyH/J/L/M/P | hail / dock-jump / berth / chart / pause | stay | honor |
| KeyD | strafe | stay | honor |
| CTL-02 pause | overlay never writes `flags.paused` | **cite only** | overlay-policy |
| Persist | settings key `rimward-settings-v1`; agent session not persist | **no** badge geometry persist | `settings.js` **7–8**; `agent-api.js` header **1–3** |
| Kit mutate | omit | omit | honor |

---

## 7. What would have been CONSUME

CONSUME + serial **none** only if **both** were live:

1. The badge already **clears** Manifest (UU / FEAR / CARGO) **and** toasts, **and**
2. `body.rw-colorblind` / `body.rw-contrast` **retint** `.rw-agent-badge` tokens **without** moving the node under `#hud`.

Census: (1) **is not live** (`top: 16px` over Manifest `top: 14px`; 280 px width crosses toast `right: 168px`; z-index 40 over HUD 10). (2) **is not live** (no badge palette overrides).

Do **not** CONSUME because PWR and the range word are already clear. That was the **previous** pin fix (wishlist DONE **283–285**). Do **not** CONSUME because reduced-motion already exists. Do **not** CONSUME because ON/OFF is not color-only.

Name if CONSUME had won: **no remaining Agent badge-layout leftover.** Census did not.

---

## 8. Leftover verdict

**REAL.** Named later serial **PR1** (CSS offset below Manifest + Manifest-column width so toasts stay clear + Okabe-Ito / contrast token mirrors on `.rw-agent-badge`). Not CONSUME. Serial is **not** none.

Deputize the **smaller** freeze: `src/style.css` only. Do **not** claim `hud.js`, `agent-api.js`, or `src/ui/hud.css`. Body child stays. `z-index` stays **40**.
