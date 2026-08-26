# Wave 128 HUD-07 leftover census — live central HUD (code wins)

**Date:** 2026-08-26  
**Worker:** Wave 128 HUD-07 leftover integrator  
**Verdict:** leftover **REAL**. Named later serial: **PR1**. Name: **dynamic deconfliction + quieter exploration layout**.  
**Not CONSUME.** Named serial is **not** none.  
**Not HUD-05 remaining-feedback CONSUME.** **Not HUD-06 home marker.** **Not HUD-01 empty hub.** **Not HUD-03 alerts.** **Not HUD-04 toast flood.**

Code wins over inbox wording. Domain is **data**. Did **not** start Vite or Chrome.

Inbox source (`docs/PLAYER-EXPERIENCE-WISHLIST.md` **100–105** — cite, do not edit):

> INBOX (P1, HUD): Add dynamic deconfliction and a quieter exploration layout for the central HUD. In live targeting, player and target cards, duplicated target labels, range/lead cues, bright suns, stations/gates, and narrative banners can stack across the same central sight picture. Protect the reticle, ship silhouette, selected target, and projectile path; collapse or relocate lower-priority data when those regions collide.

---

## 0. Method

- Read `src/systems/hud.js` create-once tree + per-frame update.
- Read `src/ui/hud.css` z-order, insets, hub size, `.in-combat` collapse.
- Cite HUD-01 empty hub, HUD-04 linger, HUD-05 CONSUME, HUD-06 POS HOME / pip / chevron **108**. Do **not** edit those docs.
- Grep `deconflict`, `overlap`, `agezHairOff`, `in-combat`, `rw-fade`, `innerHTML`.
- Experience refs: `out/hud-research/fs1-*.jpg|png` and `docs/HudUtilityChangeProposal.md` (read only).
- Graph resolve: `proceed_unmodeled` (`r-mt9mdtp0-428cf757`). Local markdown only.

---

## 1. Live HUD node tree (create-once)

All nodes in `initHud` (`hud.js`). Performance contract: **no** per-frame DOM alloc (`hud.js` **31–35**). Hide-not-delete via `.is-hidden` (`hud.css` **36**).

| Node / class | Role | Seat | Cite |
|---|---|---|---|
| `#hud` root | overlay | full viewport | `hud.css` **9–34** |
| `.rw-reticle` | 80 px aim hub | translate to aim; clamp “keep the 80 px hub on glass” | `hud.js` **857–861**, **1400–1406**; `hud.css` **183–193** |
| `.rw-reticle-pupil` / `.rw-reticle-cilia` | iris accent | inside hub | `hud.js` **859–860**; `hud.css` **336–360** |
| `.rw-reticle-range` | word `RANGE` | under hub (`bottom: -16px`) when `.in-range` | `hud.js` **861**, **1564–1576**; `hud.css` **207–220** |
| `.rw-crosshair` | fixed center tick | viewport 50/50 | `hud.js` **862–863**; `hud.css` **362–392** |
| `.rw-target` + `.rw-target-box` | selected-target bracket | projected lock | `hud.js` **865–871**, **1484–1491** |
| `.rw-target-info` / `.rw-target-name` / `.rw-target-meta` / `.rw-target-resolve` | lock card under bracket | 36 px below box | `hud.js` **872–875**; `hud.css` **439–450**, **495–513** |
| `.rw-lead` + `.rw-lead-label` (`LEAD`) | lead pip + word | projected TOF | `hud.js` **893–895**, **1494–1520**; `hud.css` **520–573** |
| `.rw-edge-arrow` | TGT off-screen amber triangle | inset **84** | `hud.js` **74**, **896**, **1521–1541**; `hud.css` **575–594** |
| `.rw-nav-gate-cue` | NAV-02 next-gate ticks | **off-glass only**, inset **84** | `hud.js` **898–902**, **1836–1859**; `hud.css` **1070–1106** |
| `.rw-home-mark.rw-home-pip` | HUD-06 on-glass square pip + dist | projected pad | `hud.js` **75**, **903–906**, **1920–1935** |
| `.rw-home-mark.rw-home-chevron` | HUD-06 off-glass chevron | inset **108** | `hud.js` **75**, **907–909**, **1936–1958**; `hud.css` **634–688** |
| `.rw-chartmark` pool | mystery landmark diamond + label | project + edge-clamp **84** | `hud.js` **911–927**, **1755–1795** |
| `.rw-toasts` / `.rw-toast` | HUD-04 channel | **top-right**, off aim column | `hud.js` **68–70**, **931–941**; `hud.css` **690–701** |
| `.rw-banner` | arrival name | **top-right** (`top: 96px; right: 14px`) | `hud.js` **769–773**, **946–949**, **1354–1371** |
| `.rw-jump` | jump progress | **viewport center** (jump only) | `hud.js` **804–808**, **953–956** |
| `.rw-prompt` | one verb (`J Dock` / Jump / Hail) | bottom **20%**, center | `hud.js` **959–961**, **2375–2379**; `hud.css` **797–802** |
| `.rw-contacts` | TGT-03 scanner arc | bottom **5.5%**, empty middle | `hud.js` **963–980**; `hud.css` **843–852** |
| `.rw-combat-self` | player card (FORE/AFT, SCREEN, SHELL, HULL, SPD, WPN) | `top: 57%`, `translate(-100% - 78px)` | `hud.js` **1003–1014**; `hud.css` **937–956** |
| `.rw-combat-target` | target card (name, FORE/AFT, bars, DIST, CLOS) | `top: 57%`, `translate(78px)` | `hud.js` **1016–1029**; `hud.css` **958–960** |
| `.rw-bottom` / `.rw-aux` | Plant / Flight / Heat | bottom strip | `hud.js` **1051–1079**; `hud.css` **997–1006** |
| `.rw-nav-readout` | NAV-02 GATE / NEXT / DEST | side col, cap 180 px | `hud.js` **1095–1113**; `hud.css` **1026–1030** |
| `.rw-pos` / `.rw-pos-home` | POS XYZ + HOME | side col | `hud.js` **1115–1121**, **2166–2196** |
| `.rw-bio` / `.rw-resources` / `.rw-controls` | career chrome | bio/pos fade; resources top-right; controls top-left | `hud.js` **1084**, **1124**, **1139**; `hud.css` **1152–1164** |
| `.rw-chip-stack` | AP + automine chips | **top-center** | `hud.js` **1157–1173**; `hud.css` **704–715** |

`innerHTML` in `hud.js`: **none** (grep 0). Copy uses `el()` `textContent` (`288–293`) and `stripHudText` (`426–435`) on **some** names.

---

## 2. Four protected regions — live vs missing

| Region | Live HUD identity | Protected from lower-priority overlap? |
|---|---|---|
| **Reticle** | `.rw-reticle` 80×80, empty of gauges; RANGE word is a child | **Partial.** Clamp keeps hub on glass (`1400`). AGEZ hides **bio rail hair** only (`1545–1561`, `agezHairOff` **209–221**). No hide of cards / labels / chartmarks / home pip vs hub. |
| **Player silhouette** | 3D hull (chase/third). Not a HUD node. Rails are stroke-only (`hud.css` **937–949**) | **Partial.** Transparent rails help. Rail **text** still sits on the hull column at 57% vh. No AABB vs hull. |
| **Selected target** | `.rw-target` bracket + info card | **No** collision vs other HUD. Bracket info is a boxed scrim (`hud.css` **439–450**) that can sit on the lock. |
| **Projectile path** | 3D bolts + lead pip; AGEZ uses reticle→lead **segment** vs rail hair boxes (`209–221`, `segmentHitsBox` **199–206**) | **Partial.** Bio hair hides. Rail cards, RANGE word, LEAD word, chartmarks, home pip, prompt do **not** yield. |

There is **no** general collision loop. `agezHairOff` is **family === 'bio'** only (`1545`). Mech has no hair; mech rails never yield.

---

## 3. Inbox stackers — live state

### 3.1 Player and target cards

Self rail is **always** in the tree and **never** `.is-hidden`. Target rail hides when there is no live ship lock (`1423–1428`). Both sit at **57% vh ± 78 px** (`RAIL_GAP` **144**; `hud.css` **941–960**). Comment claims “center glass stays open” (`1004`) but the cards are the FreeSpace glance **beside** the hub, not off the sight picture.

`.in-combat` does **not** dim `.rw-combat-rail`. Combat **lights** them. Exploration leaves them at full opacity.

### 3.2 Duplicated target labels

Ship lock writes the **same name twice**:

| Surface | Writer | Strip? |
|---|---|---|
| `.rw-target-name` | `tName.textContent = name` | yes `stripHudText` (`2265–2271`, **2322**) |
| `.rw-combat-name` | `tgtNameEl.textContent = railName` | **no** (`2345–2349`) |

Distance also triples: bracket meta `· N u` (`2272`), rail `DIST` (`2352–2355`), and `RANGE` word on the hub when envelope-close (`1564–1576`).

### 3.3 Range / lead cues

| Cue | When | On aim column? |
|---|---|---|
| Hub ring `.in-range` | ship lock inside weapon envelope | yes (hub) |
| Word `RANGE` | same | yes, glued under hub |
| Lead ring | TOF pip on-glass | yes (path) |
| Word `LEAD` | whenever lead ring shows | yes |
| Rail `DIST` / `CLOS` | ship lock | glance, 57% |
| MATCH lamp | match-speed | on self SPD |

No collapse when RANGE + DIST + bracket meta share one lock.

### 3.4 Bright suns

**No** HUD sun pip / label. `sunHeat` / `sunKill` are **toasts** (`hud.js` **661–664**), already in the HUD-04 stack (top-right). Bright suns in the sight picture are **3D**, not HUD nodes. Do **not** invent a sun HUD callout.

### 3.5 Stations / gates

| Cue | On-glass | Off-glass | Combat |
|---|---|---|---|
| HUD-06 `.rw-home-pip` + label | projected pad | hide pip | opacity **0.14** (`hud.css` **688**) |
| HUD-06 chevron | hide | inset **108** | same fade |
| POS `HOME` | text, side col | — | `.rw-fade` **0.14** (`89`) |
| Station **lock** | TGT bracket name + dist | amber arrow 84 | — |
| Home on-glass when lock is station | **hidden** (`1907–1908`) | — | — |
| NAV-02 `.rw-nav-gate-cue` | **hidden** (`1836–1840`) | inset **84** | no extra fade |
| NAV-02 GATE row | side col | — | `.rw-aux` **0.38** (`999`) |
| Gate **lock** | TGT bracket | arrow 84 | — |
| Chartmarks | diamond + name/dist; edge 84 | clamped | opacity **0.14** (`632`) |

Home pip **label** can sit on the pad in the aim column. Chartmarks **do not** hide vs reticle / bracket / lead. Gate cue already leaves the glass when the gate is on-screen.

### 3.6 Narrative banners

Arrival banner is **not** center. Injected CSS: `top: 96px; right: 14px` (`769–773`). Toasts: `top: 14px; right: 168px` (`hud.css` **691–695**). HUD-04 / HUD-05 already moved comm off the aim column. **Do not** reopen toast flood. Banner still has its **own** `aria-live=polite` (`947`) beside toasts (`933–934`). PR1 must **not** add a third live region.

Jump card **does** occupy center (`804–808`) while `ctx.gate.jumping`. That is a jump overlay, not exploration HUD.

AP / automine chips sit **top-center** (`704–715`) and can hang over the upper aim column when engaged.

Prompt sits **bottom-center 20%** (`798–802`) — dock `J` / jump / hail. Brief: **do not hide dock J** when it is the only nav.

---

## 4. Combat vs exploration (one HUD)

| Class / rule | Combat (`ctx.flags.combat` → `#hud.in-combat`) | Exploration (not combat) |
|---|---|---|
| `.rw-fade` (resources, controls, bio, pos) | opacity **0.14** (`hud.css` **89**) | full |
| `.rw-aux` (Plant/Flight/Heat, GATE readout) | **0.38** (`999`) | full |
| `.rw-chartmark` | **0.14** (`632`) | full |
| `.rw-home-mark` | **0.14** (`688`) | full |
| Combat rails | full | **full** (same) |
| RANGE / LEAD words | full when lock | **full** when lock |
| Controls list | force-collapsed (`hud.js` **2032–2036**) | player toggle |
| AGEZ hair | bio only | bio only |

Wishlist wants **exploration quieter than combat**. Live code does the **inverse** for career chrome (fade in combat) and leaves combat-only chips (RANGE/LEAD words, FORE/AFT, MATCH, full self rail) **loud in cruise**. That is the quieter-layout hole. Existing `.in-combat` collapse is real — **cite, do not blindly duplicate**.

---

## 5. Neighbour honor (cite, do not steal)

| Neighbor | Live freeze | Cite |
|---|---|---|
| HUD-01 empty hub | 80×80 `.rw-reticle`; no gauge/compass/PPI/deconflict widget in hub | `hud.css` **183–193**; `hud.js` **1400** |
| HUD-04 linger | 4 s life, 5 slots, **8 s** identical-key | `hud.js` **68–70** |
| HUD-05 remaining-feedback | leftover **CONSUME** / serial **none** | `docs/Hud05RemainingFeedbackDesign.md` |
| HUD-06 | POS HOME + square pip + chevron **108** | `hud.js` **75**, **903–909**, **2181–2196** |
| TGT-01/02/03 | bracket + amber edge arrow inset **84** | `hud.js` **74**, **865**, **896** |
| NAV-02 | gate cue inset **84**; hide on-glass | `hud.js` **74**, **1836–1859** |
| Digit 0/8/9 | stay | station papers (cite only) |
| KeyH/J/L/M/P | stay | controls (cite only) |
| `state.js` | READ-ONLY this pack | import only |
| `reducedMotion` | kill HUD animations | `hud.css` **1252–1258** |
| Color not only cue | text + shape | `hud.js` **48–49** |

---

## 6. Hole statement (why REAL)

Live HUD has **static seats** plus **combat fade** plus **bio hair AGEZ**. It does **not**:

1. Detect overlap of lower-priority HUD with the four protected regions.
2. Collapse or relocate duplicate lock names, RANGE/LEAD words, chartmark labels, or home pip labels on collision.
3. Give exploration a quieter pass than combat for combat-only chips while keeping HOME / NAV-02 / dock J / POS.

Therefore the wishlist INBOX is **not** already live. Freeze leftover **REAL**. Named serial **PR1**. Name: **no HUD-07 leftover** is **forbidden**.

---

## 7. What is already done (do not redo)

- Banner and toasts **off** the aim column.
- Jump-only center card.
- NAV-02 cue **off-glass**.
- Home pip hide when station is the lock.
- `.in-combat` fade of career chrome / chartmarks / home.
- Bio AGEZ vs reticle + lead segment (hair only).
- Create-once pools; hide-not-delete.
- HUD-01 hub empty of extras.
- HUD-04 8 s linger; HUD-05 CONSUME.

---

## 8. Later write-set (if REAL — confirmed)

**`src/systems/hud.js` + `src/ui/hud.css` only.** Do not claim `hail.js`, `galaxychart.js`, `controls.js`, `npc.js`.
