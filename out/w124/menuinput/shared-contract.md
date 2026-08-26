# CTL-04 remaining station-menu input scoping shared contract

**Wave:** 124. Design only. Bindings do not change in this wave.  
**Status:** MERGE LAW for `docs/Ctl04MenuInputDesign.md`. If that document and this file ever disagree, **this file wins**.  
**Leftover:** **REAL.** Not CONSUME. Serial is **not** none. Named later serial: **PR1 station-menu Digit skip** (named only).  
**Not this wave:** any edit under `src/`, `scripts/`, `public/`, `index.html`, `package.json`. Do not edit `docs/PLAYER-EXPERIENCE-WISHLIST.md`, `PROGRESS.md`, `docs/Ctl01DockBindDesign.md`, `docs/Ctl02OverlayDesign.md`, `docs/OwnerDecisions*.md`. Do not write `docs/OwnerDecisionsWave124.md`. Do not write sibling Wave 124 paths. Do not steal `out/w123/**`, `out/w118/overlay/**`, `out/w117/**`, `out/w116/**`.  
**Locked sources:** wishlist INBOX (P1, CONTROLS) station-menu Digit vs WPN (**cite, do not edit**); live inventory `out/w124/menuinput/current-ctl04-menu-input-inventory.md` (code wins); Wave 117 KeyJ; Wave 118 `hailDigitsAllowed` / `playSurfaceBlocked`.

Integrator rule: a **later** implementation wave obeys this file. Inventory cites live code. Code wins over stale copy.

**This leftover is a skip of Digit1–5 → `input.weaponGroup` while a dock menu or other play surface owns those digits.** It is **not** a bind remap. It is **not** a new Digit. It is **not** hail-card design. It is **not** overlay mutex reopen. It is **not** CTL-03 berth hold. It is **not** Settings rebind.

**Live leak:** docked Digit4/Digit5 (and Digit1–3) write `weaponGroup` **and** station services. **Leftover is real. Not CONSUME. Serial is not none.**

---

## 0. Orchestrator merge law (do not weaken)

1. This worker is **markdown only**. No `src/`. Later impl is **serial**. Serial PR plan is **named only**. Do **not** land these PRs in `src/` in this worker.
2. HUD-01 empty **80 px hub**. Aim-glass gauges stay off. Kit mutate omit. **No** WPN pip on the reticle. **Do not** steal Digit 0/8/9. **No new Digit.** Digit 0 stays shipyard. Digit 8 dock root stays launch. Digit 9 dock root stays epics. Digit **1–5 stay weapon groups in open-space flight**.
3. CTL-01 **KeyJ** dock/jump; **KeyD** strafe only. **Do not remap.** KeyT / KeyV / KeyK / KeyX stay. KeyH / KeyM / KeyL stay.
4. CTL-02: hail Digit skip under pause/settings/title/models and when chart/berth open (`hailDigitsAllowed`). That is hail **resolution**, not weapon-group write. **Do not reopen overlay mutex.** Do not edit `overlay-policy.js` later unless a later census proves a new export is the only safe share — **default: controls.js reads existing helpers; does not write the policy file.**
5. Wave 118 did **not** teach `controls.js` to skip Digit1–5 when docked. `hail.js` **431–432** already comments Digit1–3 overlap with weapon groups — cite. Sibling hail-demand lifecycle is **out of scope**.
6. Sibling CTL-03 berth hold owns `save.js` + optional `overlay-policy.js` hold flag. **This pack must not claim those files.** Sibling AI-05 owns npc interest. **Do not claim `npc.js`.**
7. Later write-set **this pack owns: `src/systems/controls.js` only** (plus later boot-test pins that dispatch Digit while docked — **named only**). You may **read** `ctx.flags.docked`, `overlay-policy.playSurfaceBlocked`, `hailDigitsAllowed`, title/settings/models. Prefer skip in the existing keydown switch. Do **not** add `stopImmediatePropagation` wars unless inventory proves station listener order is the only fix — **default: controls.js does not write `weaponGroup` when a play surface / dock menu owns digits.**
8. `src/game/state.js` is READ-ONLY later. **No** persist key. **No** new Digit. **No** bind-remap settings schema (that is a different P2 Settings inbox item). Autosave stays `rimward-save-v1`. Settings stay `rimward-settings-v1`.
9. `innerHTML` forbidden later. Help strings stay authored literals via `textContent` / `el()`. **No** `insertAdjacentHTML` / `document.write`.
10. `ctx.js` law **15**: `input` written ONLY by `controls.js`. Keep that. Do **not** move the skip into `station.js` / `hail.js` / `hud.js`. HUD automine fallback `hud.js` **807** is an existing exception — **do not claim `hud.js`.**
11. Do **not** skip Digit6–9 / Digit0 in `controls.js` if `controls.js` does not already handle them (census: Digit1–5 only). Station Digit 0/8/9 remain `station.js`.
12. Fail closed:
    - Missing `ctx.flags` / missing `docked` → treat as **not-docked** (`=== true` tests only). Never throw. Never freeze the sim.
    - Overlay helper missing or throw → still skip when `flags.docked === true`. Also skip when live `hailOpen` / `chartOpen` / `berthOpen` / `paused` are `=== true` if those flags exist. Also skip when `settingsOwnsScreen()` is `true` if that helper exists. Else keep flight digits. **Never stop.**
    - Title overlay attached, models open, or typing focus → skip weapon-group digits (mirror `shouldSkipDockPulse` / `playSurfaceBlocked`). A create-on-miss `getElementById` stub is not title open.
    - Unknown overlay → do not invent flags. Skip only on live flags / existing helpers.
13. `reducedMotion` **n/a**. Do not invent a new settings checkbox. Do not add menu animation.
14. Accessibility: station legend already names `1-9, 0`. Flight help already names `1/2/3/4/5` WPN. After PR1 the WPN meter **must not silently change** while those menus own digits. Color on the WPN rail is **not** the only cue — the digit prefix in `weaponHudLabel` stays. Do **not** add “not available” copy.
15. CPU freeze: **no** per-frame DOM alloc for this leftover. Skip is boolean reads on keydown. Do not walk the station DOM.
16. Do not edit sibling Bio/Nav/Msn/Rep/Shp/Tgt/Hud leftover docs, wishlist, `PROGRESS.md`, `docs/Ctl01DockBindDesign.md`, `docs/Ctl02OverlayDesign.md`. Do not write `docs/OwnerDecisionsWave124.md`. Deputize defaults live in **this** contract.
17. Do not steal in-game pause menu (P2 inbox), Settings rebind, onboarding lesson, HUD-01 hub, hail cards.
18. Prototype-safe later skip: authored `e.code` literals `Digit1`–`Digit5` only. Never `for-in` a save blob into bindings. Never parse untrusted HTML.
19. Do not “fix” known boot FAILs. Later PR1 may **add** docked Digit vs `weaponGroup` pins **on purpose**. Existing `dispatchKey('Digit5')` repair legs stay valid (station still consumes). Direct `ctx.input.weaponGroup = n` combat pins may stay.

---

## 0.1 Wave 124 deputize (owner may override after playtest)

Pick a playable **menu-owns-digits** skip. Inventory proves **Digit1–5 write `weaponGroup` while docked**. Do not park. Do not invent UU / SKU / Digit / persist / bind UI.

### Live knobs (do not retune as the fix)

| Knob | Live | Cite |
|---|---|---|
| Digit1–5 → group | unconditional | `controls.js` **329–344** |
| TRACKED digits | 1–5 only | **45** |
| Docked skip on WPN | **none** | Digit cases |
| KeyJ skip | title / models / typing | **68–82**, **303** |
| Station services | Digit 0–9 while `ui.open` | `station.js` **6156–6177** |
| Digit4 / Digit5 dock root | Feed & tend / Repair | **188**, **6034** |
| Digit 0 / 8 / 9 | shipyard / launch / epics | **188**, **6169–6177** |
| Hail overlap comment | Digit1–3 also switch groups | `hail.js` **431–432** |
| `hailDigitsAllowed` | hail **resolve** gate | `overlay-policy.js` **175–185** |
| `playSurfaceBlocked` | title / models / typing | **83–91** |
| WPN copy | `g · name` or `4 · —` / `5 · —` | `hud.js` **255–273** |
| `fireHeld` | skips `chartOpen` only | `controls.js` **476** |
| Combat while docked | early return, weapons cold | `combat.js` **1825–1828** |
| Input writer | `controls.js` only | `ctx.js` **15** |
| `flags.docked` writer | `station.js` only | `ctx.js` **31** |

Do **not** “fix” this leftover by remapping station digits or flight WPN digits. Inbox is **scope**, not a new map.

### Smallest additive skip

**Name:** `controls.js` Digit1–5 **do not assign** `input.weaponGroup` when a dock menu or play surface owns those digits. Flight with **no** overlay still sets 1–5.

| Piece | Freeze |
|---|---|
| Home | `src/systems/controls.js` keydown `case 'Digit1'` … `'Digit5'` |
| Docked | `ctx.flags.docked === true` → skip write |
| Hail card | `ctx.flags.hailOpen === true` → skip write (hail still **resolves** via `hail.js` + `hailDigitsAllowed`) |
| Other play surfaces | skip when `hailDigitsAllowed(ctx) === false` (pause, `playSurfaceBlocked`, settings, chart, berth). **Read** the helper; do not change hail cards |
| Title / models / typing | skip even if helper missing: reuse `shouldSkipDockPulse` / `playSurfaceBlocked` |
| Open space | **do not skip** |
| Digit6–9 / 0 | **do not add** to controls |
| Listener wars | **forbidden** as default. No station `stopImmediatePropagation` |
| Persist | **none** |
| `state.js` | **none** |
| Overlay mutex | **do not reopen** |
| KeyJ / KeyD | **do not remap** |
| Fail-closed | `=== true` only; never throw |

Owner freeze (do not invert):

- Menu input must not reach weapon-group handlers.
- Player **cannot** change WPN while docked. That is the point. Outfitting still uses Digit 8/9 papers, not weapon-group 1–5.
- Hail Digit1–3 would still change WPN **today** even if hail resolves a demand — scoping hail+controls together is **good**; do **not** design hail cards.
- If skip fires, station services, hail resolve, and flight WPN in open space still work. **Never stop.**

### Formulas (later impl)

```
// LIVE — keep Digit1–5 as flight WPN; STOP writing while a surface owns digits
function shouldSkipWeaponGroupDigits(ctx) {
  try {
    const f = ctx && ctx.flags;
    if (f && f.docked === true) return true;
    if (f && f.hailOpen === true) return true;
    try {
      if (typeof hailDigitsAllowed === 'function' && hailDigitsAllowed(ctx) === false) return true;
    } catch { /* helper miss */ }
    try {
      if (typeof playSurfaceBlocked === 'function' && playSurfaceBlocked(ctx) === true) return true;
    } catch { /* */ }
    try {
      if (typeof settingsOwnsScreen === 'function' && settingsOwnsScreen() === true) return true;
    } catch { /* */ }
    if (f && (f.paused === true || f.chartOpen === true || f.berthOpen === true)) return true;
    if (shouldSkipDockPulse(ctx)) return true; // title / models / typing already live
    return false;
  } catch {
    return !!(ctx && ctx.flags && ctx.flags.docked === true);
  }
}

// in existing switch — do not change TRACKED
case 'Digit1':
  if (!shouldSkipWeaponGroupDigits(ctx)) input.weaponGroup = 1;
  break;
// Digit2–5 same
```

Do **not** persist the skip. Do **not** write `weaponGroup` from `station.js`. Do **not** call `stopImmediatePropagation` from station digits.

### FireHeld (PR2, not PR1)

Live: `input.fireHeld = fireDown && ctx.flags.chartOpen !== true` (`controls.js` **476**). Combat **1825–1828** already returns while docked (weapons cold). Residual: LMB held through undock can fire.

**PR2** (named, optional): `input.fireHeld = fireDown && ctx.flags.chartOpen !== true && ctx.flags.docked !== true`. One line in `update()`, **not** the Digit switch. **Do not freeze into PR1.**

### Explicit non-picks

| Temptation | Verdict |
|---|---|
| CONSUME / serial **none** | **Forbidden** — Digit1–5 still write WPN while docked |
| Remap Digit1–5 off weapons | **Forbidden** — flight WPN stay |
| Steal Digit 0/8/9 | **Forbidden** §0.2 |
| Add Digit6–9/0 to controls | **Forbidden** §0.11 |
| `stopImmediatePropagation` on station as default | **Forbidden** §0.7 |
| Reopen hail/chart/berth mutex | **Forbidden** §0.4 |
| Edit `overlay-policy.js` / `save.js` / `hail.js` / `station.js` / `npc.js` / `hud.js` | **Forbidden** later write-set §0.6–0.7 |
| Bind-remap settings schema | **Forbidden** §0.8 |
| `state.js` / new persist | **Forbidden** §0.8 |
| `innerHTML` | **Forbidden** §0.9 |
| New WPN chrome / “not available” | **Forbidden** §0.14 |
| KeyJ / KeyD remap | **Forbidden** §0.3 |
| Hail-demand lifecycle / hail cards | **Forbidden** §0.5 |
| Pause-menu P2 / onboarding lesson | **Forbidden** §0.17 |
| Stuff `fireHeld` into PR1 Digit switch | **Forbidden** unless it were one line **in that switch** (it is not) |
| Aim-glass gauges / hub pip | **Forbidden** §0.2 |

---

## 1. Ownership later

| Object | Writer (later serial) | Reader |
|---|---|---|
| `input.weaponGroup` from Digit1–5 | PR1 `controls.js` skip | combat / HUD WPN |
| Digit 0/8/9 station | **none** — stay `station.js` | dock UI |
| `hailDigitsAllowed` / `playSurfaceBlocked` | **none** — **read** | PR1 skip |
| `flags.docked` | **none** (`station.js` live) | PR1 skip |
| `flags.hailOpen` / `chartOpen` / `berthOpen` / `paused` | **none** (live owners) | PR1 skip |
| `input.fireHeld` docked conjunct | **PR2 optional** `controls.js` `update` | combat |
| `state.js` | **none** | — |
| `overlay-policy.js` | **none** | read |
| `save.js` / `npc.js` / `hail.js` | **none** | cite |
| Boot docked Digit vs group pins | PR1 `boot-test.mjs` **named only** | harness |
| KeyJ / KeyD | **none** | consume |

---

## 2. Fail closed (normative)

| Condition | Result |
|---|---|
| `flags.docked === true` | no Digit1–5 `weaponGroup` write; station services still run |
| `flags.hailOpen === true` | no WPN write; hail Digit resolve still uses `hailDigitsAllowed` |
| `hailDigitsAllowed(ctx) === false` | no WPN write (pause / title / models / typing / settings / chart / berth) |
| Open space, no overlay, helper true / missing | Digit1–5 **set** WPN (flight) |
| Missing `flags` / `docked` not `true` | treat **not-docked** |
| Helper throw | skip only on live `=== true` flags; never throw |
| Digit0 / Digit8 / Digit9 | controls ignores (not TRACKED); station keeps |
| Title capture already swallowed Digit | skip is belt-and-suspenders; no throw |
| `reducedMotion` | n/a |
| Partial merge (skip docked, forget hail) | docked leak closed; hail overlap remains — PR1 must include hailOpen + hailDigitsAllowed false |
| TRACKED missing Digit1–5 | live ignore; do **not** drop them (flight WPN) |

---

## 3. Serial PR plan (named only)

| PR | Lands | Does not land |
|---|---|---|
| **PR1 station-menu Digit skip** | `controls.js` Digit1–5 skip while docked / hailOpen / `hailDigitsAllowed === false` / playSurface / typing / title / models; import **read** of existing overlay helpers; boot pins that dispatch Digit while docked and assert group unchanged (named) | `state.js`; Digit remap; persist; overlay-policy write; `save.js`; `hail.js` cards; `station.js`; `npc.js`; `innerHTML`; KeyJ; Digit 0/8/9; `fireHeld`; stopImmediatePropagation |
| **PR2 fireHeld while docked (optional)** | `update()` conjunct `docked !== true` on `fireHeld` | Digit switch; combat rewrite (already cold) |
| **PR3 census (optional skip)** | Re-grep Digit1–5 assign only behind skip; Digit0/8/9 still station-only | New world field |

First remaining serial is **PR1 station-menu Digit skip**. It must not steal Digit 0/8/9. It must not write `state.js`. **Named only. Do not implement in Wave 124.**

Serial is **not** none.

---

## 4. Persist / proto

No bind in save. No settings schema. Authored `e.code === 'Digit1'` … `'Digit5'` only. No `for-in` on records. No `WORLD_FIELDS` growth. No `settings.js` write. No new `localStorage` key.
