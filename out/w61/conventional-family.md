# HUD-02 — Conventional (mechanical) HUD family brief

**Status:** DESIGN ONLY. This file is a later-wave implementer spec.  
**Wave:** 61 / HUD-02 conventional worker.  
**Does not ship.** Do not edit `src/`, `scripts/`, `public/`, `index.html`, `package.json`, or `docs/` from this brief.

**Wishlist:** `docs/PLAYER-EXPERIENCE-WISHLIST.md` HUD-02.  
**Visual rules:** `docs/HudUtilityChangeProposal.md` §6.  
**Live law:** `src/systems/hud.js` header; `src/ui/hud.css` reticle / rails / contacts.  
**Research:** `docs/space-sim-hud-styles-research-2026-08-17.md` executive conclusion.

---

## 1. Intent

Conventional ships use one mechanical HUD family.

The family is a **skin of the HUD-01 instrument set**. It is not a second combat HUD.

Both families (this file + the living-family brief) must:

- show the same essential data;
- keep the same glance path and glance time;
- give neither family a competitive readability edge.

Take FreeSpace **rules**, not 1998 CRT green chrome (`space-sim-hud-styles-research-2026-08-17.md`). Combat default stays `#hud` beacon cyan (`--rw-accent`).

---

## 2. Locked contracts (do not reopen)

| Lock | Source | This family |
|---|---|---|
| Self rail left of reticle, target rail right | HUD-01; `.rw-combat-self` / `.rw-combat-target` | Same nodes, same place |
| Rails at `top: 57%`, 78 px offset | `hud.css` 769–787 | Do not move |
| Empty 80 px aim glass | HUD-01; Wave A hub | No fill, no contacts ring, no second reticle |
| Living iris today = pupil + 3 cilia | `hud.js` 418–420; `hud.css` 317–357 | **Replace** that accent. Do not add a second hub |
| Contacts = thin bottom bearing arc | Wave F; `.rw-contacts` | Restyle pips only. Stay at bottom |
| MATCH never writes `ctx.input.throttle` | `ctx.js` 28; `ship.js` 443 | Family does not touch MATCH math |
| Lead + RANGE + MATCH = core ship | Wave D / TGT-01 | Stay on every hull |
| Scanner buys awareness only | Wave F; `hud.js` 929–933 | Arc visibility only |
| One overlay, three cameras | `hud.js` 14–15; `#hud.first-person` | Family does not swap with camera |
| Color is never the only signal | `hud.js` header; `hud.css` 1–5 | Shape + text stay |
| `#hud` tokens | `--rw-accent` cyan, `--rw-warn`, `--rw-bad`, `--rw-good` | No CRT green combat default. `--vein` is living-only |
| HUD-03 already exists | `settings.js` / `body.rw-*` | No new setting, no HUD-skin control |
| Out of scope systems | Proposal §8 | No G/S/E, no four-face shields, no missiles, no wingmen, no comm video |
| Organic tendrils | Living-family worker | Out of this brief |
| Game source | Wave 61 write-set | Do not change it from this design pass |

---

## 3. Instrument inventory (existing only)

Every named instrument already exists. This family **restyles**. It does not add a glance-table row.

| Instrument | DOM / class | Data today | Mech treatment |
|---|---|---|---|
| Hub ring | `.rw-reticle` 80×80, `margin: -40px` | Viewport center | Keep size. Square the stroke language. Keep empty middle |
| Range-in | `.rw-reticle.in-range` + `.rw-reticle-range` word `RANGE` | Selected weapon envelope (`hud.js` 894–904) | Same class + word. Solid ticks, not a filled disk |
| Living iris accent | `.rw-reticle::after`, `.rw-reticle-pupil`, `.rw-reticle-cilia` × 3 | Decorative | **Suppress.** Replace with hub ticks (see §5) |
| Center crosshair | `.rw-crosshair`, `.rw-crosshair-dot` | Fixed | Keep 1 px + 2 px dot. First-person opacity 0.2 stays |
| Lead pip | `.rw-lead`, `.rw-lead-ring`, `.rw-lead-label` `LEAD` | Relative TOF, core ship | Sharper ring (see §4). Label stays |
| Target bracket | `.rw-target`, `.rw-corner` (tl/tr/bl/br), resolve band | Lock + `data-band` | Keep L-corners. Square them. Keep band **shape** (solid / dashed / size) + word |
| Bracket card | `.rw-target-name`, `.rw-target-meta`, `.rw-target-resolve` | Name, meta, DEFIANT / SHAKEN / BARGAINING / CAPITULATE | Type only. Keep `textContent` |
| Off-screen arrow | `.rw-edge-arrow` | Core ship | Keep. Thin chevron, no new language |
| Self rail | `section.rw-combat-rail.rw-combat-self` | Facing, SCREEN, SHELL, HULL, SPD+MATCH, WPN | Stroke tracks. Square petals → ticks |
| Target rail | `section.rw-combat-rail.rw-combat-target` | Name, facing, SCREEN, SHELL, HULL, SPD, DIST | Mirror of self. Hide rules unchanged |
| Facing | `.rw-facing`, `.rw-facing-sil` (nose+body), FORE / AFT | Wave C table | Hard plate silhouette. Words stay |
| Hull | `.rw-petals` / `.rw-petal` × 10, `.rw-hull-flag` LOW / CRIT | `player.hull / hullMax` | Rectangular ticks, not scale-petals |
| Screen / Shell | `.rw-screen` thin 3 px, `.rw-shell` thick 9 px | Existing bars | 1 px edge tracks. Thin vs thick **stays** |
| Speed + MATCH | `.rw-speed`, `.rw-match-lamp` | `ship.speed`, `flags.matchSpeed` | Lamp stays a filled SPD tick + the word MATCH |
| Weapon / distance | `.rw-combat-wpn`, `.rw-combat-dist` | Weapon group; `N u` | Type only |
| Contacts arc | `.rw-contacts` bottom 5.5%, SVG stroke, 24 pips | `ctx.world.scanner >= 1` | Sharper pips. Arc stays bottom. No hub ring |
| Contact kinds | `.is-civ` tick, `.is-hostile` chevron, `.is-lock` hollow diamond | Shape = friend/foe (`hud.js` 207–211) | Keep three shapes. Make them plated |
| Closure glyph | `.rw-contact-close` `«` / `»` | Mk II | Keep glyphs |
| Aux Plant / Flight / Heat | `.rw-aux` | Strain, engine, THR, BURN, DRIFT, Heat | Career/flight only. Dim in combat. No new rows |
| Bio / POS / Manifest / Controls | `.rw-fade` | Career | Not combat glance. Type/stroke only if cheap |
| Toasts / banner / prompt / jump | existing | Events | Off aim column. No family chrome |
| Chart marks | `.rw-chartmark` | Wave 15 | Unchanged |

Do **not** add: radar disc, G/S/E stacks, four-face shield, missile timer, comm video, second name plate, extra hub numerals, contacts on the reticle.

---

## 4. Visual language

Reference picture for the hub: `out/hud-research/fs1-training-reticle.jpg` — large thin ring, empty middle. Reject that still’s aspect-lock diamond and missile timer.

### 4.1 Strokes

- 1 px edges on glass. No card fill, no blur, no box-shadow on rails (already Wave A).
- Hub ring: 1 px dashed out of range (keep today’s rule); 2 px solid in range (keep `.in-range`).
- Bar tracks: 1 px `border`, `background: transparent` or near-void, `border-radius: 0`.
- Screen stays the **thin** track. Shell stays the **thick** track. That pair is the shield cue, not color alone.
- No glow bloom on mech fills. Drop `box-shadow` on `.rw-petal.on` and `.rw-lead-ring` under the mech hook.
- Contrast mode (`body.rw-contrast`) already brightens borders. Family rules must not fight those overrides.

### 4.2 Corners

- Everything combat-near is **square**. `border-radius: 0` on rails, bars, FORE/AFT chips, hull ticks, lock diamond may stay 45° (it is already a square).
- Target bracket: keep 12 px L-corners; mech sets `border-radius: 0` (already). Bargaining / capitulate still change **size and dash** (`hud.css` 422–426). Do not replace that with color-only.
- Do not round the hub into an organic blob. The ring may stay circular (it is a sight). Accents on that ring are radial ticks, not cilia.

### 4.3 Type

- Keep `#hud` stack: `'Cascadia Mono', Consolas, 'Courier New', monospace`.
- Keep `--rw-text-scale` from `settings.js` (HUD-03). Family does not invent a type size.
- Labels stay small uppercase with letter-spacing (`.rw-label` 0.18 em). Mech may tighten label tracking to `0.14em` and values to `0.04em`. Do not change words.
- Words that must remain: SCREEN, SHELL, HULL, LOW, CRIT, SPD, MATCH, WPN, DIST, RANGE, LEAD, FORE, AFT, and resolve-band labels.
- Color-blind / contrast tokens stay on `body.rw-*`. Family does not fork palettes.

### 4.4 Hub ticks (mechanical accent)

Replace the living iris. Sit **on the 80 px ring**. Do not occupy the inner glass.

**Budget**

- Outer ring = existing `::before` (keep).
- Accent = 8 short ticks at 45° (N, NE, E, SE, S, SW, W, NW), each 1×5 px, seated on the stroke (outer ~2 px of the 80 px box).
- Optional 4 longer cardinals (N/E/S/W) at 7 px if 8 equal ticks under-read. Never more than 12 ticks.
- Inner keep-out: **56 px diameter** (12 px inset from the 80 px box). No fill, no numeral, no second circle, no pip ring.
- In-range: cardinals go 2 px / solid (pair with existing 2 px ring + `RANGE` word).

**Prefer zero new nodes:** restyle `.rw-reticle::after` from the dashed vein blob (`hud.css` 317–324) into a masked tick ring (`repeating-conic-gradient` + radial mask). Hide pupil and cilia with `display: none`.

If CSS ticks fail in a browser the project supports, add at most 8 `span.rw-reticle-tick` children of `.rw-reticle`, transformed onto the ring (`translateY(-40px)` pattern already used by cilia). Never place marks inside the 56 px keep-out.

### 4.5 Facing silhouette

Existing markup (do not fork):

```
.rw-facing > .rw-facing-sil > .rw-facing-nose + .rw-facing-body
.rw-facing-ends > .rw-facing-fore | .rw-facing-aft
```

Mech restyle:

- Nose: hard right-triangle / plate chevron (already a CSS triangle). Square the body: `border-radius: 0`, 1 px edge, no organic taper.
- FORE lit = filled chip + word. AFT lit = filled chip + word. Dim = hollow + faded word (already).
- Hit flash: keep `.is-flash` + word. Mech may use a 1 px square outline instead of a soft wash.
- Color-blind inset ring on `.is-lit` stays (`hud.css` 307–315).

Do not draw a four-face FreeSpace shield ship.

### 4.6 Contact pips

Keep Wave F classes and the three-kind law:

| Kind | Class | Shape today | Mech shape |
|---|---|---|---|
| Civilian | `.is-civ` | 2×8 tick | 2×8 **square** tick (already) |
| Hostile | `.is-hostile` | amber chevron | Same chevron, sharper 90° isosceles, 1 px plate edge if fill is kept |
| Lock | `.is-lock` | hollow 45° diamond | Same diamond, 1 px cyan edge, no fill |

- `.is-far` opacity 0.28 stays.
- `.is-enter` is a one-shot (see §7).
- Mk II closure `«` / `»` stays next to the pip, not on the hub.
- Arc stroke stays 1.25 px, no fill, no CRT grid (`hud.css` 671).

### 4.7 Rail tracks

- `.rw-combat-rail`: keep `top: 57%`, self `translate(calc(-100% - 78px))`, target `translate(78px)`. Transparent, no border.
- `.rw-bar` under rails: 1 px edge, `border-radius: 0`, no inner glow.
- Fill is a hard rectangle. Width still comes from `makeBar` (`fill.style.width`).
- Hull: 10 rectangular ticks, 6×12 px, 2 px gap, `border-radius: 0`, `transform: none` (drop `skewX(-6deg)` and the scale cap).
- On = filled. Off = hollow. Warn / crit still set `.h-warn` / `.h-crit` + LOW / CRIT text.

### 4.8 Lead pip

- Keep 28 px box. Mech: 1 px square **or** 1 px circle. Prefer a thin circle so it does not look like a second lock diamond.
- Keep the `LEAD` word under the pip.
- Drop the 8 px glow (`hud.css` 492).
- Do not park extra chrome between lead and hub.

---

## 5. How the living iris is suppressed

Today (`hud.js` 417–421; `hud.css` 317–357):

- `.rw-reticle::after` — dashed vein ring, `rw-iris-spin` 14 s loop.
- `.rw-reticle-pupil` — 5 px `--vein` disc.
- three `.rw-reticle-cilia` at 30° / 150° / 270°, 1×7 px, `translateY(-40px)`.

**On conventional hulls** (`#hud[data-family="mech"]`):

1. `.rw-reticle-pupil { display: none; }`
2. `.rw-reticle-cilia { display: none; }`
3. `.rw-reticle::after` — cancel `rw-iris-spin`, cancel organic radii, retarget as tick mask (or `content: none` if ticks are extra spans).
4. Do **not** leave `--vein` marks on the hub.
5. Do **not** keep cilia and also draw ticks (that is a second accent).

**On living hulls:** this family does nothing. The living-family worker owns tendrils / iris growth. That worker must also stay outside the 80 px empty glass.

**Swap is CSS + one attribute.** Do not destroy and rebuild the reticle node. `initHud` already creates pupil + cilia once (performance contract, `hud.js` 17–19). Hide them. Do not recreate per frame.

---

## 6. Switch rule (proposal only)

The shared-contract worker owns the final rule. This section proposes. It does not add a HUD-03 control.

**Recommended input:** player **hull identity**, not a skin setting.

| Hull | Family attribute |
|---|---|
| Living companion / Beautiful Ones grown hull (current player mesh in `ship.js`) | `data-family="live"` (or omit; today’s CSS is the live default) |
| Built / plated / conventional hull | `data-family="mech"` |

**Why hull-derived, not a setting**

- Wishlist HUD-02 is ship identity, not a player preference.
- HUD-03 already owns scale, contrast, color-blind, reduced motion, mute, volume (`settings.js` `FIELDS`). A “HUD skin” key would be a new settings wave. Locked out.
- Camera is not identity. Chase / third / first only toggle `#hud.first-person` (`hud.js` 784). Family must not follow `flags.camera`.

**Identity source (honest gap)**

- `isBeautiful(faction)` in `organic.js` 67–69 is **NPC / station / gate** faction `=== 'beautiful'`. It is not the player-hull flag.
- `ctx.player` is `createShipState('light')` (`ship.js` 398) with default `faction: 'independent'` (`state.js` 124). There is **no** `player.hudFamily` field today.
- The player **look** is the living companion hull, not a Freehold plate.

**Implementer hook (later, not this wave):**

```
// Shared-contract worker names the exact reader.
// Sketch only — do not invent a settings key.
root.dataset.family = hullIsConventional(ctx) ? 'mech' : 'live';
```

`hullIsConventional` is owned by the shared-contract brief. Until a conventional **player** hull exists, `data-family="mech"` will not appear in play. This spec must still be complete so the CSS can land in the same wave as the switch.

**Do not**

- add `FIELDS.hudSkin` in `settings.js`;
- key the family off the **target** faction (that would swap chrome mid-duel and break glance);
- key the family off `flags.combat` or scanner tier;
- use `body.rw-hud-mech` as a player toggle. `body.rw-*` is the HUD-03 accessibility namespace.

`body.rw-hud-mech` as a **mirror** of `#hud[data-family=mech]` is acceptable if some career overlay outside `#hud` must match. Prefer the dataset on `#hud` as the single writer.

---

## 7. Motion

Law from proposal §6: breathe / iris-spin already yield to `body.rw-reduced-motion`. New flashes are **one-shot**, not loops.

| Motion | Today | Mech family | `body.rw-reduced-motion` |
|---|---|---|---|
| `rw-iris-spin` 14 s | Loop on `::after` | **Off** (accent replaced) | Already `animation: none !important` (`hud.css` 974–978) |
| `rw-breathe` | Defined; iris does not use it on the hub ring | Do not attach | Frozen |
| Bar width | `transition: width 0.18s` | Keep or 0.12 s linear | Snaps (global kill) |
| RANGE enter | Class toggle only | Optional 0.2 s one-shot on **rising** `.in-range` (tick brightness). No loop | Solid ring + RANGE word, no flash |
| FORE / AFT flash | `rw-facing-flash` 0.4 s | Keep one-shot. Square wash | Existing: `animation: none` + 1 px red outline (`hud.css` 302–305) |
| Hostile enter | `rw-contact-enter` 0.45 s scale | Prefer 0.2 s opacity flash (scale fights the lock diamond rotate) | Existing: `animation: none` (`hud.css` 757–759) |
| Hull CRIT | `rw-blink` loop on petals | Keep **or** freeze ticks and rely on CRIT text (text already exists). Prefer keep blink for parity with live family | Frozen; CRIT word stays |
| Strain OVERHEAT | `rw-blink` on `.rw-strain-flag` | Unchanged (aux) | Frozen |
| MATCH lamp | Instant class | Instant. No pulse | Instant |
| Lead / rails / type / ticks | Static | Static | Static |

**Rules**

- No idle spin, no breathe, no vein pulse on the mech hub.
- No per-frame class chatter. Rising-edge only, same style as `last.inRange` (`hud.js` 901–904).
- `body.rw-reduced-motion #hud, body.rw-reduced-motion #hud *` already kills animation and transition. New mech keyframes must be listed there only if a future rule opts out of the `*` catch. Prefer relying on the catch.

---

## 8. Audio (later; optional)

**Decision:** HUD-family mechanical clicks / ticks are **later**. Do not implement them in the first HUD-02 CSS wave. Do not invent a `song.js` API that does not exist.

### 8.1 What exists (`src/systems/song.js`)

- Cue table `CUES` (lines 45–113). Each value is an array of tone specs: `[type, f0, f1, duration, gain, lowpassHz, delay]`.
- Consumption: `update()` walks `ctx.lastEvents` and plays `CUES[typ]` (`song.js` 400–420). No `playCue()` export.
- Master path: `MASTER_GAIN * (ctx.settings.muted ? 0 : ctx.settings.masterVolume)` (`song.js` 429–431).
- Unlock on first key / pointer. Failure-safe. Never throws.
- `song.js` does **not** read `ctx.settings.reducedMotion` today.
- Combat / world cues already in table (do not retune for family): `playerHit`, `playerFire`, `npcHit`, `npcDestroyed`, `shieldDown`, `hailOpened`, `marketShift` (a short tick), etc.

Do **not** reuse whalesong, `convergence`, `combat` bed, or `docked` hum as HUD-family chrome. Those are ship / world voice.

### 8.2 Existing cues that are **not** HUD-family

`npcHit` is a metallic tick, `marketShift` is a UI tick, `hailOpened` is a comms blip. They have other meanings. Do not overload them for RANGE / MATCH / contact-enter.

### 8.3 NEW cue table (later wave only)

Add rows to the existing `CUES` object. Emit **new** `ctx.emit({ type })` names from the HUD rising-edge path. `song.js` will play them because it already indexes `CUES[typ]`.

`ctx.emit` types are **frozen** in the `ctx.js` header comment (lines 188–210). A later audio wave that adds these three types **must** add matching lines to that comment in the same change. Do not emit undeclared types. Do not add `playCue()`, `song.play()`, or any new `song.js` export.

| Event type (NEW) | When to emit | Spec (draft) | Notes |
|---|---|---|---|
| `hudMechRange` | Rising edge of `.in-range` | `[['square', 1400, 1400, 0.03, 0.03, 2800, 0]]` | One click. Not a loop |
| `hudMechMatch` | Rising edge of MATCH lamp | `[['square', 900, 900, 0.04, 0.03, 2000, 0]]` | Lamp on only |
| `hudMechContact` | Hostile pip `.is-enter` (already a 0.45 s one-shot) | `[['square', 1600, 1600, 0.025, 0.02, 3000, 0]]` | Throttle with existing `seenHostiles` |

**Do not add** music, stingers, or a family bed.

### 8.4 Yield policy (when audio lands)

1. `ctx.settings.muted === true` → silent (existing master).
2. `ctx.settings.masterVolume` → existing master.
3. `ctx.settings.reducedMotion === true` → **do not emit** the three NEW types. Gate at the emit site in `hud.js`. Do not add a HUD-03 “audio alerts” checkbox (proposal §8 already rejects new HUD-03 audio settings).
4. Family is mech → these three types may emit. Family is live → these three types stay silent (living-family worker owns creature cues, separately, later).
5. Never emit from the 5 Hz text path on unchanged values. Never emit per frame.

---

## 9. Readability parity

Same glance as HUD-01 / proposal §4:

1. Eye on target / lead / shot path (empty glass).
2. Self vitals = short glance left (`-78 px`, `top: 57%`).
3. Target vitals = short glance right (`+78 px`).
4. RANGE on the hub word + ring style. MATCH on the SPD row. DIST on the target rail.
5. Contacts only if scanner ≥ Mk I, and only on the bottom arc.

**Parity tests (later implement wave)**

- Same labels, same order, same hide rules (no lock → target rail hidden; asteroid → bracket ore, no rail).
- Same 5 Hz text throttle. No extra DOM writes.
- Mech ticks must not cover lead, bolts, or the locked hull.
- A color-blind + high-contrast + reduced-motion player on a mech hull must still read LOW / CRIT, FORE / AFT, RANGE, MATCH, and the three contact shapes.
- Do not give live hulls extra combat data. Do not give mech hulls extra combat data.
- Do not park extra chrome on the shot path (hub keep-out, no toast recentering, no second name).

---

## 10. CSS / DOM sketch

### 10.1 Hook

**Recommend:** `#hud[data-family="mech"]` as the only family writer.

```
#hud[data-family="mech"] { /* token tweaks allowed: no new state colors */ }
```

Do not introduce `--rw-fs-green`. `--vein` must not appear under `[data-family="mech"]` combat chrome.

Optional alias (only if a non-`#hud` surface must match):

```
body.rw-hud-mech { } /* writer = same hull reader, not settings.js */
```

Prefer not to use the body alias.

### 10.2 Restyle existing nodes (preferred)

```
#hud[data-family="mech"] .rw-reticle-pupil,
#hud[data-family="mech"] .rw-reticle-cilia { display: none; }

#hud[data-family="mech"] .rw-reticle::after {
  animation: none;
  border: none;
  border-radius: 0;
  inset: 0;
  /* tick ring via masked conic gradient; inner 56px fully transparent */
}

#hud[data-family="mech"] .rw-petal {
  border-radius: 0;
  transform: none;
  width: 6px;
  height: 12px;
}

#hud[data-family="mech"] .rw-petal.on { box-shadow: none; }

#hud[data-family="mech"] .rw-combat-rail .rw-bar,
#hud[data-family="mech"] .rw-facing-end,
#hud[data-family="mech"] .rw-facing-body {
  border-radius: 0;
}

#hud[data-family="mech"] .rw-lead-ring { box-shadow: none; border-width: 1px; }

#hud[data-family="mech"] .rw-contact-pip.is-hostile .rw-contact-mark {
  /* keep chevron geometry; no extra node */
}
```

### 10.3 New nodes

**Default: none.**

Allowed later only if the tick mask fails:

- `span.rw-reticle-tick` × 8, children of `.rw-reticle`.
- Created **once** in `initHud`, next to the existing cilia loop.
- Hidden unless `data-family="mech"`.
- Must sit on the ring. Must not enter the 56 px keep-out.

Forbidden new nodes:

- a second `.rw-reticle`;
- a contacts ring under the hub;
- a four-face shield glyph;
- tendrils (living worker);
- a duplicate rail tree.

### 10.4 Text / names

Keep the existing helper (`hud.js` 93–98): `textContent` only. Target name, rail name, toasts, banner, weapon label, DIST stay `textContent` (`hud.js` 1315, 1342, 695, 738, 1220, 1347). Family CSS must not switch those writes to `innerHTML`.

### 10.5 Cameras

`root.classList.toggle('first-person', fp)` stays the only camera class (`hud.js` 784). Family attribute is independent. Overlay does not swap.

---

## 11. Alternatives

### A — Full second HUD DOM tree

Build a parallel mech tree (`#hud-mech`) and toggle `display`.

- **Pros:** Zero CSS specificity fights; living and mech can diverge hard.
- **Cons:** Breaks the “every DOM node is created once” contract (`hud.js` 17–19) unless both trees are built at init (double nodes, double 5 Hz writes). Two writers for RANGE / MATCH / rails will drift. Glance positions will fork. Contacts / lead / bracket would be copied or shared awkwardly. High regression risk vs HUD-01.

**Reject** for HUD-02.

### B — Token / class skin on the same tree (recommend)

One tree. One writer. `#hud[data-family="mech"]` restyles.

- **Pros:** Same glance, same data, same hide rules, same HUD-03 body classes, same performance contract. Matches proposal §6 “same instruments, two skins.”
- **Cons:** CSS must hide iris cleanly; tick accent is the only delicate bit.
- **Mitigation:** hide three known nodes + retarget `::after`; keep-out radius is a testable number (56 px).

### C — (rejected) Player “HUD skin” setting

A checkbox in `settings.js`. Violates HUD-03 lock and the wishlist’s hull-identity framing. Only reopen if the shared-contract worker proves the player can fly both hulls in one session **and** must override identity. Even then, prefer a hull picker, not a HUD picker.

---

## 12. Later implementer write-set (not this wave)

When an implementation wave is opened (not Wave 61):

| File | Change |
|---|---|
| `src/ui/hud.css` | `[data-family="mech"]` restyles listed in §10. No rail move. No hub grow. |
| `src/systems/hud.js` | Set `root.dataset.family` from the **shared-contract** reader. Do not write `input.throttle`. Keep `textContent`. Optional: create 8 tick spans once. |
| `src/systems/song.js` | **Only** if the audio follow-up is scheduled: add the three NEW `CUES` rows. No new export. |
| `src/core/ctx.js` | **Only** with that same audio follow-up: document `hudMechRange` / `hudMechMatch` / `hudMechContact` in the frozen event-type comment (lines 188–210). |
| `src/systems/settings.js` | **No change.** |
| Tests | Prefer a focused harness: mech attribute hides pupil/cilia; hub children stay outside 56 px; rails still 57% / 78 px; `body.rw-reduced-motion` freezes new flashes. |

---

## 13. Acceptance picture

A conventional hull on any camera shows:

- empty 80 px glass with a thin ring, 8 hub ticks on that ring, 1 px crosshair;
- no pupil, no cilia, no vein color, no tendrils;
- self rail left, target rail right, same data as a living hull;
- RANGE word + solid ring when the selected weapon reaches;
- MATCH word on SPD when `flags.matchSpeed` is on;
- contacts only as the bottom arc, and only with a scanner;
- cyan / warn / bad / good tokens, never CRT green as the combat default;
- HUD-03 scale / contrast / color-blind / reduced-motion still apply.

---

## 14. Out of scope (repeat)

- Organic tendrils, iris growth, creature audio (living-family worker).
- G/S/E, four-quadrant shields, missiles, wingmen, comm video.
- New HUD-03 settings, including audio-alert toggles.
- MATCH writing `ctx.input.throttle`.
- Scanner-gated lead / RANGE / MATCH.
- A first-person-only overlay.
- Edits to game source in this design wave.
