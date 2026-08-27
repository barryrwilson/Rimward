# Agent play badge layout + a11y tokens shared contract

**Wave:** 139. Design only. No badge-layout ships in this wave.  
**Status:** MERGE LAW for `docs/AgentBadgeLayoutDesign.md`. If that document and this file ever disagree, **this file wins**.  
**Leftover:** **REAL.** Not CONSUME. Serial is **not** none. Named later serial: **PR1** (offset body-child badge below Manifest / toasts + mirror colorblind / contrast tokens).  
**Name:** a player with `?agent=1` can still read Manifest (UU / FEAR / CARGO) and toasts, and colorblind / high-contrast settings retint the Agent play badge, without moving the node under `#hud`.  
**Not this wave:** any edit under `src/`, `scripts/`, `public/`, `index.html`, `package.json`. Do not edit `docs/PLAYER-EXPERIENCE-WISHLIST.md`, `PROGRESS.md`, `docs/AgentApiDesign.md`, `docs/Hud0*.md`, `docs/Ctl*.md`, `docs/OwnerDecisions*.md`. Do not steal Agent market fill, Market desk layout, Agent API PR5 badge mount, pad 2B, in-repo LLM, Hail01 / HUD-06 / Hail02 / HUD-07 / NAV-09 / NAV-10 governor / TGT-07 stills / MSN-04 other families / CTL-03 / AI-05 / CTL-04. Do not write `out/w139/badge/verify/**`. Do not write sibling `out/w139/**` packs.

**Locked sources:** wishlist INBOX (P2, HUD/AGENT) lines **313–317** and INBOX (P3, HUD/AGENT) lines **324–327** (cite, do not edit); live inventory `out/w139/badge/current-agent-badge-layout-inventory.md` (code wins); playtest `out/orch-fable/t2/ui-audit.md` (evidence, not live truth); Wave 118 CTL-02 mutex + **never write `flags.paused`** (cite only).

Integrator rule: a **later** implementation wave obeys this file. Inventory cites live code. Code wins over playtest “covers Manifest”: those are `top: 16px` + `z-index: 40` over `#hud` `z-index: 10` and `.rw-resources` `top: 14px; right: 14px`.

**This leftover is Agent play badge layout + a11y tokens.** It is **not** a HUD-01 hub child. It is **not** Agent API PR5 remount. It is **not** market fill. It is **not** a z-index drop below the station scrim.

**Live hole:** Badge pin is `top: 16px; right: 16px; z-index: 40; max-width: min(280px, …)` (`style.css` **38–48**). Manifest is `top: 14px; right: 14px` (`hud.css` **1172–1176**). Toasts are `top: 14px; right: 168px` (`hud.css` **710–713**). `#hud` is z-index **10** (`style.css` **28**). No `body.rw-colorblind .rw-agent-badge` / `body.rw-contrast .rw-agent-badge` rules. **Leftover is real. Not CONSUME. Serial is not none.**

---

## 0. Orchestrator merge law (do not weaken)

1. This worker is **markdown only**. No `src/`. Later impl is **serial**. Serial PR plan is **named only**. Do **not** land these PRs in `src/` in this worker.
2. HUD-01 empty **80 px hub**. Aim-glass gauges stay off. Kit mutate omit. **Do not** steal Digit 0/8/9. **No new Digit.**
3. KeyH stays hail. KeyJ stays dock/jump. KeyL stays berth. KeyM stays chart. KeyP stays pause. KeyD stays strafe. **Do not remap those keys.**
4. `innerHTML` forbidden later. Badge paint stays `createElement` + `textContent` (`agent-api.js` **511–515**, **535**, **551–559**, **571–581**). **No** `insertAdjacentHTML` / `document.write`.
5. Persist: **none** new for badge geometry. Do **not** store top/right/width/z-index in `localStorage`, `save.js`, or `WORLD_FIELDS`. Settings key `rimward-settings-v1` stays settings.js. Agent `ctx.agent` stays session.
6. Overlay mutex stays CTL-02: hail / chart / berth exclusive. Hail / chart / berth **never** write `ctx.flags.paused`. This pack **cites** overlay-policy only. Do **not** claim `overlay-policy.js`. CTL-03/04 not this pack.
7. Body child stays. Do **not** move `.rw-agent-badge` under `#hud`. Do **not** reopen Agent API PR5 mount. Do **not** edit `docs/AgentApiDesign.md`.
8. `z-index` stays **40** (hail/gate labels band). Above HUD **10** and station scrim **20**. Below pause **50**. Do **not** lower below scrim 20. Do **not** raise to pause 50.
9. Do **not** cover PWR (`.rw-bottom` / `.rw-power-panel`) or the station range marker again (hub `.rw-reticle-range` **and** do not restore a bottom-right pin over HUD-06 `.rw-home-mark`). Do **not** steal HUD-06. Do **not** restore `bottom`/`left` as the pin.
10. Do **not** steal sibling Wave 139 packs (Agent market fill, Market desk layout). Do **not** steal optional PR2s listed in Wave 136 OPEN (Hail01 / HUD-06 / Hail02 / HUD-07 / NAV-09 / NAV-10 governor / TGT-07 stills / MSN-04 other families / CTL-03 / AI-05 / CTL-04) or Agent pad 2B or in-repo LLM.
11. Fail closed:
    - Missing Manifest (`.rw-resources` absent) is **not** a crash. Badge still mounts on `document.body`.
    - Missing `document` / `body` already returns in `mountAgentBadge`. Do **not** throw from CSS.
    - `?agent=1` still required to **auto-enable** play (`queryOptIn`). Default `optIn` **off**. Do **not** change that gate in this pack.
    - Unknown / absent HUD nodes → badge CSS still applies to `.rw-agent-badge`.
    - Never throw into the flight loop (live `refreshBadge` / `update` already catch).
12. `reducedMotion`: **keep** live `body.rw-reduced-motion .rw-agent-badge` rules (`style.css` **128–132**). **No** new animation that ignores it.
13. Color is **not** the only on/off cue. Keep solid vs dashed left border **and** ON/OFF text.
14. Buttons stay `type="button"` min **44 px**. Do **not** shrink hit targets when the card narrows.
15. CPU: no per-frame layout measure of Manifest. Authored CSS constants only. No new Digit. No new MutationObserver.
16. Prototype-safe: no persist blob for geometry. Never `for-in` a save object onto badge style.
17. Do **not** claim `src/ui/hud.css` (HUD system owns it). Do **not** claim `hud.js` or `agent-api.js` unless census proves a class/mount change is required. Census does **not**. Prefer CSS offset.
18. Later write-set is **`src/style.css` only**.
19. Do not pause. Do not teleport. Do not remap keys.
20. Combine both inbox items in **one** PR. Partial merge forbidden (contract §2).

---

## 0.1 Wave 139 deputize (owner may override after playtest)

Pick a playable **badge layout + a11y token mirror**. Inventory proves both holes are **live**. Do not park. Do not invent UU / SKU / Digit / persist key / HUD child / z-index drop.

### Live knobs (do not retune as the “fix”)

| Knob | Live | Cite |
|---|---|---|
| Badge pin | `top: 16px; right: 16px` | `style.css` **39–40** |
| Badge z-index | **40** | **43** |
| Badge max-width | `min(280px, calc(100vw - 32px))` | **48** |
| Badge max-height | `calc(100vh - 32px)` | **49** |
| Manifest | `top: 14px; right: 14px; min-width: 132px` | `hud.css` **1172–1176** |
| Panel min-width | **148 px** | `hud.css` **45** |
| Toasts | `top: 14px; right: 168px` | `hud.css` **710–713** |
| PWR | `.rw-bottom` `bottom: 12px` | `hud.css` **1021–1025**; `hud.js` **1223** |
| Range word | hub `.rw-reticle-range` | `hud.css` **207–220** |
| Colorblind HUD | Okabe-Ito on `#hud` only | `hud.css` **1234–1238** |
| Contrast HUD | panel/edge/white on `#hud` only | `hud.css` **1243–1248** |
| Reduced motion | already on badge | `style.css` **128–132** |
| Hit target | 44 px | `style.css` **107–108** |
| Mount | `body.appendChild` | `agent-api.js` **566**, **706** |

Do **not** “fix” the hole by parenting the badge under `#hud`, by dropping z-index below 20, by pinning bottom-right again, or by persisting geometry.

### Playable policy (smallest additive)

**Name:** CSS-only offset + Manifest-column width so Manifest and toasts stay readable; CSS-only token mirrors for `body.rw-colorblind` / `body.rw-contrast`.

| Piece | Freeze |
|---|---|
| **Who** | `.rw-agent-badge` (and children via inherited custom properties) in `src/style.css`. Not `#hud`. Not `hud.css`. |
| **Offset** | `top: 140px` (clears Manifest title + UU / FEAR / CARGO at HUD textScale **1.5**, plus Manifest `top: 14px` and an 8 px gap). Keep `right: 16px`. Keep `bottom: auto; left: auto`. |
| **Width** | `max-width: min(148px, calc(100vw - 32px))` so the card stays in the Manifest column and does **not** cross toast `right: 168px`. Two 44 px buttons still wrap (`flex-wrap` already live). |
| **Max-height** | `calc(100vh - 156px)` (140 px top + 16 px bottom inset) so a tall card cannot grow into PWR. Keep `overflow-y: auto`. |
| **z-index** | **40** unchanged. |
| **Colorblind** | `body.rw-colorblind .rw-agent-badge { --rw-accent: #56B4E9; --rw-warn: #E69F00; --rw-bad: #D55E00; --rw-good: #009E73; }` — same values as `hud.css` **1234–1238**. |
| **Contrast** | `body.rw-contrast .rw-agent-badge { --white: #ffffff; --dim: #aec3d8; --panel: rgba(4, 8, 17, 0.94); --panel-edge: rgba(160, 205, 245, 0.6); }` — same values as `hud.css` **1243–1248**. |
| **Reduced motion** | Unchanged live rules. |
| **ON/OFF** | Unchanged solid vs dashed + text. Color is extra. |
| **Buttons** | Unchanged `type="button"` min 44 px. Focus ring stays. |
| **Mount** | Unchanged body child. No JS. |
| **Text scale** | **Not** this leftover. `--rw-text-scale` stays on `#hud`. Do not claim `settings.js`. |
| **Fail-closed** | never throw; never innerHTML; missing Manifest is not a crash. |
| **Persist** | **none** new. |

### Later helper (named only)

None. Do **not** add a JS measure of `.rw-resources`. Do **not** put a class on Manifest. Authored CSS constants only.

Do **not** interpolate save strings into HTML. Live badge copy stays `textContent`.

Do **not** dual-stack a HUD-07 deconflict rewrite as “badge layout”.

---

## 1. Later write-set (document now; do not edit those files this wave)

**This pack owns later:**

- **Writer:** `src/style.css` (`.rw-agent-badge` pin, max-width, max-height, `body.rw-colorblind .rw-agent-badge`, `body.rw-contrast .rw-agent-badge`). Keep reduced-motion, 44 px buttons, z-index 40, solid/dashed ON/OFF.

**Do not claim:**

- `src/ui/hud.css` (HUD system owns it)
- `src/systems/hud.js`
- `src/systems/agent-api.js` (PR5 body child stays)
- `src/systems/settings.js`
- `src/game/state.js` / `src/game/save.js`
- `src/systems/overlay-policy.js`
- Sibling Wave 139 Agent market fill / Market desk layout paths
- `docs/AgentApiDesign.md`

---

## 2. Partial merge forbidden

PR1 must land **together**: `top` offset below Manifest + max-width in the Manifest column (toasts clear) + max-height that cannot cover PWR + colorblind token mirror + contrast token mirror + z-index **40** + reduced-motion kept + solid/dashed kept. Shipping offset without palette leaves P3. Shipping palette without offset leaves P2. Shipping a narrower card that stays at `top: 16px` still covers Manifest. Shipping offset that keeps `max-width: 280px` still covers toasts. Shipping `max-height: calc(100vh - 32px)` after raising `top` can grow into PWR.

Do **not** ship a HUD child. Do **not** ship z-index below 20. Do **not** ship bottom-right again.

---

## 3. Serial PR plan (named only)

| PR | Lands | Does not land |
|---|---|---|
| **PR1** badge layout + a11y tokens | `src/style.css`: `top: 140px`; `max-width: min(148px, calc(100vw - 32px))`; `max-height: calc(100vh - 156px)`; `z-index: 40`; `body.rw-colorblind .rw-agent-badge` Okabe-Ito; `body.rw-contrast .rw-agent-badge` contrast panel/edge/white; keep reduced-motion, 44 px, solid/dashed | HUD child; `hud.css` / `hud.js` / `agent-api.js`; persist geometry; z-index drop; bottom-right pin; `--rw-text-scale` on badge; innerHTML; new Digit; Key remap; market fill; pad 2B |
| **PR2 stills (optional skip)** | playtest still: `?agent=1` flight, Manifest UU/FEAR/CARGO readable, toast chips readable, PWR and RANGE word clear, colorblind accent `#56B4E9` on title, contrast panel more opaque, z-index 40, buttons 44 px | required with PR1 |

First remaining serial is **PR1**.
