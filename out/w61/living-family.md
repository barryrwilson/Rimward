# HUD-02 living (organic) HUD family brief

Status: READY TO IMPLEMENT (design only). This file does not change game source.

Scope: organic skin for the shipped HUD-01 / Wave F instruments. Conventional chrome is out of scope. `src/systems/ship.js`, bio meshes, and `src/systems/organic.js` stay as the living-ship quality benchmark.

## 1. Goal and non-goals

### Goal

A living player hull uses one organic HUD family. The family has:

- short tendrils on allowed hosts;
- quiet biological pulses;
- organic facing silhouettes;
- organic contact pips that still encode friend/foe by **shape**;
- vein as a **secondary** accent;
- creature-like cue voicing through `song.js`.

Both families show the **same** HUD-01 glance set. Neither family may be harder to read in a duel.

### Non-goals

- Do not add G / S / E, four-face shields, missiles, lock boxes, comm video, or a second radar.
- Do not add bio stats. Bind only to fields already on `ctx.bio` and to shipped HUD values.
- Do not write throttle. MATCH stays a lamp. `ship.js` still owns match-speed.
- Do not swap overlay by camera. Chase, third, and first-person share one HUD.
- Do not grow tendrils across the aim glass, lead pip, shot path, or chase/third hull.
- Do not enlarge the iris into a cage or spin that hides the lead.
- Do not prioritize music. Whalesong stays the warm long voice.

## 2. Locked contracts (do not reopen)

| Contract | Keep |
|---|---|
| Glance path | Self rail left: Screen, Shell, hull petals + LOW/CRIT, SPD + MATCH, WPN, FORE/AFT. Target rail right: name, FORE/AFT, Screen, Shell, hull, SPD, DIST. Hub + RANGE. Lead + LEAD. Edge arrow. Contacts arc scanner-gated. |
| Empty aim glass | Thin strokes. No card fill over lock, lead, bolts, or player hull. |
| Iris | `.rw-reticle-pupil` + three `.rw-reticle-cilia` + dashed `::after`. Small accent only. |
| Color | `#hud` tokens. Color never the only signal. `--vein` already Bio + iris. |
| Motion | `body.rw-reduced-motion` already kills `rw-iris-spin`, breathe, facing flash, contact enter. New pulses yield the same way. One-shot flashes only. |
| Write budget | Nodes created once in `initHud`. Text/bars ~5 Hz write-on-change. No per-frame allocs. No `innerHTML`. |
| Scanner | Buys awareness only. Tier 0 has no arc. |
| MATCH | Never writes `ctx.input.throttle`. |

## 3. Hard aim-glass geometry (AGEZ)

All family paint is forbidden inside the Aim Glass Exclusion Zone. Verify this with pixels, not taste.

### 3.1 Coordinate frame

Use **overlay space** on `#hud`, not raw viewport center.

- Hub origin `H` = current transform origin of `.rw-reticle` (chase/third: screen center + clamped `reticleScreen`; first-person: screen center). See `hud.js` reticle block (`rx`/`ry` clamp `cx-44`, `cy-44` so the 80 px hub stays on glass).
- Lead origin `L` = current transform origin of `.rw-lead` when that node is visible.
- Rails stay CSS-anchored at `left: 50%; top: 57%` and do **not** follow the reticle. Do not assume the hub sits between the rails.

### 3.2 Forbidden regions (union)

| Zone | Geometry | Why |
|---|---|---|
| Hub disk | Circle, center `H`, radius **56 px** (40 px hub + 16 px buffer) | Tendrils must not enter the 80 px hub or the ring around it. |
| Hub interior exception | Only the shipped iris: 5 px pupil at `H`, 16×16 crosshair, three 1×7 px cilia on the **ring** (existing `translateY(-40px)`), dashed `::after` with `inset: 28px`. | Accent may stay. It may not grow into a cage. |
| Shot corridor | Capsule: 24 px radius around the segment `H`→`L`. If lead is hidden, drop the capsule. The hub disk still applies. | Bolts and the pip stay clear. |
| Lead keep-out | Circle, center `L`, radius **20 px** (28 px lead box + 6 px). Ignore when lead is hidden. | Organic skin must not dress the pip. |
| Hull keep-out | Do not attach family strokes to the reticle, lead, bracket, jump card, or any full-screen overlay. Do not grow hairlines into the 78 px CSS-center gap between the rails. That gap is **not** AGEZ. AGEZ follows `H` / `L`. | Hull and bolts live in the gap; the hub can leave it. |

**Hard clip rule:** a family stroke is illegal if any pixel of its ink intersects the hub disk, the shot corridor, or the lead keep-out.

**Parenting is not a clip.** Rails stay at `left: 50%; top: 57%` (`hud.css`). `H` is `cx+rx, cy+ry` with clamp `cx-44, cy-44` (`hud.js`). At 1600×900 the self rail is about x=502–722; `H` at (600, 513) is legal and sits **on** that rail. The 78 px CSS-center gap does not keep ink out of the 56 px disk about `H`. Alt A must use the fail-closed hide in §3.4.

### 3.3 Allowed attach sites

Tendrils may exist **only** as decorations of these hosts.

Do **not** set `overflow: hidden` on `.rw-combat-rail`. That clip would hide MATCH / LOW / labels, or it would force ink into the label column (labels sit on the outer side of each rail).

Rail hairlines attach to the **top and bottom edges** of the rail box and grow along that edge (horizontal), or at most 10/18 px **outward** from the top/bottom. They must not enter the 78 px CSS-center gap. They must inset **52 px** from the outer edge (self: left / label side; target: right / label side). Ban a full-width `::before` / `::after` on the rail box.

`.rw-bio` and `.rw-contacts` may use `overflow: hidden` on any later extra decoration. Their screen position does **not** keep them out of AGEZ.

| Host | Attach | Combat max length | Career max length | Count |
|---|---|---|---|---|
| `.rw-combat-self` | Top/bottom edges; grow up/down, not toward the hub gap | 10 px | 18 px | ≤ 4 hairlines |
| `.rw-combat-target` | Top/bottom edges; grow up/down, not toward the hub gap | 10 px | 18 px | ≤ 4 hairlines |
| `.rw-facing-sil` | `clip-path` restyle of the existing 22×10 box only. No extra tendril stroke | 0 | 0 | 0 |
| `.rw-bio` | Existing panel + vein tokens only. **No extra corner strokes.** Combat `.rw-fade` 0.14 does not make extra pixels legal | 0 | 0 | 0 |
| `.rw-contacts` | Existing Wave F stroke only. Identity = `stroke-linecap: round` (~1 px). **No extra 8–12 px tangent at `u = ±1`** | 0 | 0 | 0 |
| Hub | **No new tendrils.** Iris only. Career may add +1 px cilia width and a vein glow. Combat adds nothing to cilia length | 0 | 0 (width +1 px only) | 3 existing cilia |

Banned hosts: `.rw-reticle` (except the iris accent), `.rw-lead`, `.rw-target`, `.rw-crosshair`, `.rw-jump`, `.rw-prompt`, `.rw-toasts`, `.rw-banner`, `.rw-edge-arrow`, `#hud` root, `document.body`.

### 3.4 Fail-closed AGEZ hide (required on Alt A)

Static CSS on the rails cannot track `H`. Implement a hide. Do not ship Alt B.

**Hairline box** (overlay px, per rail):

1. Take the rail border box.
2. Expand top and bottom by the current max length (10 px combat, 18 px career).
3. Inset the **outer** edge by 52 px (self `left += 52`; target `right -= 52`).
4. Do not expand toward the 78 px CSS-center gap.

**Hit test** (true → hide):

- `dist(H, hairBox) < 56` (point-to-AABB; 0 if `H` is inside the box), or
- lead visible and `dist(L, hairBox) < 20`, or
- lead visible and the 24 px capsule `H`→`L` intersects `hairBox`, or
- `H` is missing (fail closed).

**Action:** toggle class `rw-hair-off` on that rail only. CSS:

```css
#hud[data-family='bio'] .rw-combat-rail.rw-hair-off::before,
#hud[data-family='bio'] .rw-combat-rail.rw-hair-off::after {
  content: none;
  visibility: hidden;
}
```

Fail closed: no hairline. Do not clip the rail itself (`overflow` / `clip-path` on `.rw-combat-rail` would hide SCREEN / MATCH / LOW).

**When to test:** same path as the reticle / lead transform writes. Toggle the class only when the boolean flips (write-on-change). A 5 Hz-only test is not enough: `H` can cross a host between text ticks. Do not write style geometry every frame.

**Which hosts need the hide**

Legal `H` is any point in the clamped box (1600×900: about 44–1556, 44–856). Screen corner / bottom placement is **not** a keep-out.

| Host | First wave | Why |
|---|---|---|
| Rails | Extra hairlines **plus** `rw-hair-off` | `H` can sit on a rail (example (600, 513) on self). |
| Facing | No extra strokes (`clip-path` only) | Same 22×10 pixels as today. Safe. No hide. |
| Bio | **No extra corner / edge strokes** | Bio sits in `.rw-bottom` right column (`bottom: 12px`, min-width 148 px). Sample legal `H` (1556, 856) is **on** that panel. Career 16 px corners would lie in the 56 px disk. Fade 0.14 does not legalize them. |
| Contacts | **No extra end length.** `stroke-linecap: round` only | Arc ends ≈ (710, 785) and (890, 785) at 1600×900 sit inside the legal `H` box. An 8–12 px tangent at an end sits on the hub origin if the player aims there. Center / first-person `H` is far; chase / third aim at the bottom arc is real. |

If a later change adds extra px on Bio or contacts, that host **must** use the same hit test (`dist(H, hostBox) < 56`, or capsule / lead hit, or `H` missing) and fail closed (`rw-hair-off` or equivalent: extra stroke `content: none` / hidden). Do not ship extra length without that hide. Do not hide the shipped Wave F arc or the Bio glance (mood / HUNGER / WOUNDS) — hide only family extras.

### 3.5 Intensity

| Mode | Tendril opacity | Motion | Pulse amplitude |
|---|---|---|---|
| Career (`#hud` not `.in-combat`) | 0.45 | Optional 12–18 s dash crawl on rail outer hairlines only | Iris pupil opacity ±0.12 |
| Combat (`#hud.in-combat`) | 0.32 | **Static** strokes. No crawl. No scale. | Iris pupil opacity ±0.06 |
| Reduced motion | 0.32 (combat) / 0.40 (career) | **Static stroke, no crawl, no pulse** | 0 |

`body.rw-reduced-motion #hud, body.rw-reduced-motion #hud *` already sets `animation: none; transition: none`. New keyframes must live under `#hud` so that rule kills them. Do not add loops on `body` or on Hail.

One-shot only: facing flash, contact enter, RANGE pop, LOW/CRIT blink (already shipped). Do not add a second loop that fights a duel.

## 4. Pulse / biological signs

Bind only to shipped state. Do **not** invent trauma, pulse-rate, or oxygen stats.

### 4.1 Existing sources

From `src/core/ctx.js` / `src/game/bio.js` / Bio panel in `hud.js`:

| Field | Range | Already on HUD |
|---|---|---|
| `ctx.bio.mood` | `serene` `keen` `anxious` `pained` `feral` | Icon shape + uppercase label |
| `ctx.bio.hunger` | 0..1 | HUNGER bar |
| `ctx.bio.wounds` | 0..1 | WOUNDS bar; `.hurt` when > 0.35 |
| `ctx.bio.bond` | 0..1 | Not a combat glance. Do not add a rail |
| `ctx.bio.growth` | 0..1 | Ship scale in `ship.js`. Do not add a HUD meter |
| `ctx.bio.fedCount` | int | Not on HUD. Leave it |
| `ctx.bio.speedFactor` / `turnFactor` | flight | Not a HUD signal |
| `ctx.bio.songEvent` | one-frame | Song / toast path. Do not grow DOM |

Shipped combat values stay the glance: Screen, Shell, hull petals + LOW/CRIT, SPD + MATCH, WPN, DIST, RANGE, FORE/AFT.

### 4.2 What may pulse

| Signal | Bind | Organic expression | Never |
|---|---|---|---|
| Mood | `ctx.bio.mood` | Iris pupil opacity period; Bio icon already changes shape. Period: serene 4.0 s, keen 1.1 s (ship heartbeat), anxious 0.8 s, pained 2.2 s, feral 0.7 s | Recolor rails. Do not add a sixth mood |
| Hunger | `ctx.bio.hunger` | Bio HUNGER track only (already vein fill) | Combat rails |
| Wounds | `ctx.bio.wounds` | Existing HUD `.hurt` + ember fill when `wounds > 0.35` (`hud.js`). Family may add a one-shot 0.4 s ember outline on **self hull petals** on the `.hurt` rising edge only. `bio.js` uses other bands: healthy if `wounds < 0.3` (and hunger < 0.7); `pained` if `wounds >= 0.6`. Those drive mood, not this outline. Do not invent a third band | New wound number on the rail |
| Screen / Shell | existing bar `%` | Optional 1 px vein hairline **inside** the existing bar track, width = same `%`. Shape of the bar still carries the value | Pulse the whole rail |
| Hull | existing petals + LOW/CRIT | Petal tips may be slightly more teardrop (still 8×13, filled vs hollow) | Extra petal count |
| Bond / growth | — | No extra Bio edge ink (a 1 px nacre stroke on the panel is family paint and can sit in AGEZ). Bond stays off the glance | New “BOND” / “GROWTH” glance |

Do not read private bio.js locals (`trauma`, `feralUntil`). They are not on `ctx`.

## 5. Organic facing silhouettes

Keep the 22×10 `.rw-facing-sil` box and the words FORE / AFT.

| Now | Living family |
|---|---|
| Nose chevron + hollow body box | Manta / teardrop outline: bulbous nose (FORE), taper tail (AFT). Same 22×10. Zero new nodes if CSS `clip-path` on `.rw-facing-nose` / `.rw-facing-body` is enough |
| `is-lit` fill vs `is-dim` hollow + word | Same. Lit = filled nacre/vein wash. Dim = 1 px outline only |
| `is-flash` 0.4 s | Keep. Reduced-motion already swaps to a 1 px red outline |

Color-blind: keep fill vs hollow + the word. `body.rw-colorblind` already forces a white inset on `is-lit`.

Do not rotate a 3D mesh. Do not add four faces.

## 6. Organic contact pips

Keep Wave F kinds from `contactKind()`: `civ` | `hostile` | `lock`. Shape remains the friend/foe cue.

| Kind | Today | Living family | Must keep |
|---|---|---|---|
| civ | 2×8 tick | Vein tick, slightly bowed (still a vertical tick, 2×8) | Tick, not a chevron |
| hostile | 8 px amber triangle | Organic chevron: same triangle metrics (`border-left/right: 4px`, `border-bottom: 8px`) with 1 px concave sides via `clip-path` if needed | Pointed 3-side mark |
| lock | 8×8 hollow diamond | Same diamond. Corners may round by **1 px** only | Rotated square, hollow |

Keep `is-aft`, `is-far`, `is-enter` (0.45 s one-shot). Closure glyphs `«` / `»` stay text. Scanner gates the arc. Do not put pips on the hub.

## 7. Responsive color

### May tint

- Iris pupil / cilia / dashed `::after` (already `--vein`).
- Bio title, hunger fill, mood label (already vein).
- Family hairlines on **rail top/bottom edges** (when not `rw-hair-off`), facing `clip-path` outline, contacts `stroke-linecap` only: `--vein` at ≤ 0.45 alpha.
- Mood may shift **iris glow only** along a short vein→ember mix for `pained` / `feral`. Text and shape still carry mood.

### Must not tint

- Screen / Shell / SPD / WPN / DIST tokens (keep cyan / wake blue).
- Lead ring, RANGE word, MATCH lamp, edge arrow.
- Hostile pip fill stays `--rw-warn` (amber). Civ stays `--dim`. Lock stroke stays `--rw-accent`.
- Do not introduce a rainbow or FreeSpace green as a combat default.

### Accessibility

| Mode | Rule |
|---|---|
| `body.rw-colorblind` | Existing Okabe–Ito token overrides on `#hud` stay. Vein may map to `--rw-good` (#009E73) when color-blind is on so it does not collide with amber/red. Shape still required. |
| `body.rw-contrast` | Hairline alpha ≥ 0.7. No blur. Panel edges stay stronger (existing rules). |
| `--rw-text-scale` | All family text uses existing `calc(... * var(--rw-text-scale, 1))`. Tendril px lengths do **not** scale with text (fixed geometry vs AGEZ). |
| `body.rw-reduced-motion` | Static strokes. No crawl. No pupil pulse. Flashes become outlines. |

Color is never the only signal. Every family state reuses the shipped shape+text pair from HudUtilityChangeProposal §6.

## 8. Creature-like audio

Read `src/systems/song.js` first. All sound goes through the existing `AudioContext`, `master` gain, and this line:

`MASTER_GAIN * (ctx.settings?.muted ? 0 : (ctx.settings?.masterVolume ?? 1))`

Do not create a second context. Do not play if `failed` or not `unlocked`. Do not raise whalesong. Music / radio / station bed stay as they are (wishlist: not a priority).

### 8.1 Existing cue hooks (re-voice only)

When `#hud[data-family=bio]`, `tone()` may pick an **organic variant** of the same event key. Same duration cap. Same volley cap (`VOLLEY_GAP` / `VOLLEY_MAX`) for `npcFire` / `npcHit`.

| Event key (already in `CUES`) | Mechanical today | Organic variant intent |
|---|---|---|
| `playerHit` | square + triangle thud | Lower sine + triangle flesh thud. No longer bark |
| `shieldDown` | triangle/sine hollow break | Wet sine drop, same 0.26 s cap |
| `playerFire` | square/saw gun bark | Short sine spit + triangle body. Still < 0.10 s |
| `npcHit` | metallic tick | Softer sine tick |
| `npcDestroyed` | saw crump | Triangle crump, same length |
| `bodyHit` | scrape | Keep short; slightly lower |
| `engineOut` | saw/square sputter | Triangle sputter |
| `hailOpened` / `hailClosed` | square blip | Soft sine blip |
| `docked` / `undocked` | warm confirm / thunk | Keep warm; organic may add one extra sine a fifth below at 0.5× gain |
| `podCollected` | chime | Keep |

Mood already drives `MOOD_SONG` (serene / keen / anxious / pained / feral) plus pad. **Do not** add a second mood sting. `moodChanged` / `bio.songEvent` stay on the whalesong path.

Combat bed (55 Hz drone) stays. Do not replace it with a heartbeat loop that fights the duel. A living family may retarget bed frequency from 55 Hz to 52–58 Hz; gain stays `COMBAT_BED_GAIN` (0.05).

### 8.2 NEW cue table (optional, not required for identity)

Mark these NEW. Ship them only if HUD-03 audio-alert work is accepted. Each is one-shot, gain ≤ 0.08, duration ≤ 0.35 s, routed through `tone()` + mute/masterVolume.

| NEW key | Fire when | Cap | Notes |
|---|---|---|---|
| `hostileEnter` | First time a hostile id enters the contacts arc (`is-enter` rising edge) | Max 1 / 0.5 s (do not stack 24 pips) | Awareness only. No fire if scanner < 1 |
| `hullBand` | Self hull band steps to `warn` or `crit` (LOW / CRIT already written) | Max 1 / 2 s | Does not replace LOW/CRIT text |

Reject: `bioMoodSting`, `tendrilWhoosh`, `heartbeatLoop`, anything that plays every frame or every mood tick.

## 9. Duel readability (parity with mechanical family)

Acceptance (same glance time, same data, no extra obstruction):

1. At 1600×900 chase lock, a still shows Screen / Shell / hull / SPD / WPN / DIST readable without a corner look. Organic hairlines do not cover those glyphs.
2. Hub middle stays empty. Pupil is 5 px. Cilia stay on the ring. Lead and RANGE remain the aiming pair.
3. No family stroke intersects AGEZ (section 3). At 1600×900: `H` over the self rail (600, 513) → `rw-hair-off` on that rail; `H` on a contacts end (710, 785) or on Bio (1556, 856) → **no extra** Bio/contacts family ink in the 56 px disk. Overlay a debug outline in a test build if needed; do not ship the outline.
4. Combat family motion is static except shipped one-shots. Reduced-motion stills match mechanical stills for instrument positions.
5. Color-blind still: fill vs hollow facing, tick/chevron/diamond contacts, LOW/CRIT text, RANGE word, MATCH word.
6. First-person: same overlay. Iris recenters. Family does not add cockpit flesh on the glass.
7. Write budget unchanged. Mood / hull-band classes stay 5 Hz. `rw-hair-off` toggles write-on-change on the reticle/lead path, not a per-frame style write.

## 10. CSS / DOM sketch

Prefer restyle of existing nodes. Zero new nodes for the recommended path.

### 10.1 Switch surface

```
#hud[data-family="bio"]     /* single source of truth — CSS and song.js */
#hud[data-family="mech"]    /* conventional family — other worker */
```

Do **not** add `body.rw-hud-bio`. A body class can leak organic rules onto Hail, the galaxy chart, and title. `song.js` reads `document.getElementById('hud')?.dataset.family === 'bio'` when it picks a cue variant.

Every visual rule is prefixed `#hud[data-family=bio]`.

### 10.2 Suggested selectors (no new markup)

```css
#hud[data-family='bio'] .rw-reticle::after { /* richer dashed iris, still inset 28px */ }
#hud[data-family='bio'] .rw-reticle-pupil { animation: rw-bio-pupil  /* mood period via style var */ }
/* Ban full-width top/bottom hairlines. Inset 52px from the OUTER (label) edge. */
#hud[data-family='bio'] .rw-combat-self::before {
  left: 52px; right: 0; top: -10px; height: 10px; width: auto;
}
#hud[data-family='bio'] .rw-combat-target::after {
  left: 0; right: 52px; top: -10px; height: 10px; width: auto;
}
#hud[data-family='bio'] .rw-combat-rail.rw-hair-off::before,
#hud[data-family='bio'] .rw-combat-rail.rw-hair-off::after {
  content: none;
  visibility: hidden;
}
#hud[data-family='bio'] .rw-facing-nose { clip-path: /* bulb */ }
#hud[data-family='bio'] .rw-facing-body { clip-path: /* taper; fill vs hollow via is-lit */ }
#hud[data-family='bio'] .rw-contact-pip.is-civ .rw-contact-mark { /* bowed tick */ }
#hud[data-family='bio'] .rw-contact-pip.is-hostile .rw-contact-mark { /* organic chevron, same 8px */ }
#hud[data-family='bio'] .rw-contacts-stroke { stroke-linecap: round; /* ~1px caps; no extra tangent */ }
/* .rw-bio: no extra corner/edge ::before. Existing panel only. */
#hud[data-family='bio'].in-combat .rw-combat-self::before,
#hud[data-family='bio'].in-combat .rw-combat-target::after {
  animation: none;
  opacity: 0.32;
}
body.rw-colorblind #hud[data-family='bio'] { --vein: var(--rw-good); }
body.rw-reduced-motion #hud[data-family='bio'] .rw-reticle-pupil { animation: none; }
```

§3.3 / §3.4 win if this sketch drifts. No `width: 100%` hairline on the rail.

Mood period: set `--rw-bio-period` on `#hud` from the 5 Hz HUD writer (`last.mood` already exists). Do not write it every frame.

Do **not** use `innerHTML` to inject SVG. If an implementer needs a path, use `createElementNS` once in `initHud` (same pattern as `contactsSvg`).

### 10.3 Switch input (proposal only)

Shared-contract worker owns the final rule. This family proposes:

1. `data-family=bio` when the **player hull is living**.
2. Today every origin flies the living player ship (`ORIGINS` all board a living hull; `ship.js` is the living benchmark). So the living family is the current default until a conventional player hull exists.
3. Do **not** key the family on `ctx.world.origin === 'beautiful'`. Beautiful Ones origin only changes bond / hunger / cargo.
4. Do **not** key the family on `isBeautiful(faction)` from `organic.js`. That helper is `faction === 'beautiful'` for NPC / station art.
5. Abomination (BIO-05) is later. Until that wave, grafted conventional hulls stay `mech` if they ever exist.
6. Camera toggle does not change `data-family`.

## 11. Alternatives

### Alt A — CSS-only skin (recommended)

Restyle existing nodes with `::before` / `::after`, `clip-path`, stroke-linecap, and token tweaks. Overflow hidden on Bio / contacts only — **not** on rails.

Parenting does **not** enforce AGEZ. Host screen position does **not** enforce AGEZ. `H` can sit on a rail, on Bio, or on a contacts end. Alt A is legal only if every **extra** family stroke either (a) uses the §3.4 hide or (b) is not shipped. First wave: rail hairlines + hide; Bio corners = 0 extra; contacts ends = round cap only.

Pros: zero new DOM, no SVG layer, reduced-motion is free, hide is a class toggle.

Cons: tendril shapes are simple hairlines; rail hairlines go away while `H` overlaps that rail.

### Alt B — Extra SVG tendril layer

A sibling `svg.rw-hud-tendrils` under `#hud` with ≤ 6 paths created once. Paths morph with CSS or attribute updates at 5 Hz.

Pros: prettier vines.

Cons: paths can wander into AGEZ unless a clipPath copies section 3 every frame. Clip failure covers the shot. More GPU and more review surface. `innerHTML` risk if paths are string-built from world data.

### Recommendation

**Alt A + §3.4 hide on any extra stroke.** Rail hairlines hide when their box meets AGEZ. Bio and contacts ship **no extra length** in the first wave (round cap only on the arc). Do not claim the 78 px CSS-center gap, parenting, or “bottom of the screen” makes a host safe.

Do not ship Alt B in the first living-family wave. A static viewport clip does **not** track `H` (the hub drifts in chase/third). A clip that tracks `H` needs a per-frame `clipPath` write and can fail open over the shot. If a later wave still wants vines, it must subtract a **56 px circle about `H`** plus the shot corridor about `H`→`L`, created with `createElementNS` once, attributes only, no `innerHTML`. Failure mode is “no tendril layer,” not “unclipped layer.”

## 12. Implementer security constraints

This wave writes markdown only. The next implementation wave must keep these limits.

| Risk | Rule |
|---|---|
| HTML injection | `el()` + `textContent` / `createTextNode` only. No `innerHTML`, no `insertAdjacentHTML`, no `document.write`. |
| SVG injection | `createElementNS` + `setAttribute` with numeric path data from local geometry (same as `contactsArcPath`). Never interpolate ship names, hail text, or system ids into `d` or markup. |
| DOM growth | Alt A: **0** new nodes. Do not pool extra tendril elements per contact (24 slots already exist). |
| Animation cost | No per-frame path morph. No `filter: blur`. No `will-change` beyond the shipped reticle/lead. Combat hairlines are static. `rw-hair-off` is a write-on-change class, not a per-frame clipPath. |
| Audio | Reuse `song.js` master gain. Honor `ctx.settings.muted` and `masterVolume`. No second `AudioContext`. No cue from a rAF loop. `hostileEnter` (if ever shipped) ≤ 1 / 0.5 s. |
| Privacy | Do not log `ctx.bio`, settings, or cue names with player identifiers. |

## 13. Implementation notes for a later wave (not this wave)

- Edit `src/ui/hud.css` and small class toggles in `src/systems/hud.js` only. Do not edit `ship.js` or bio meshes.
- Song variants: extra rows in `CUES` or a `CUES_BIO` map keyed by the same event names. Read `data-family` once per cue, not per oscillator.
- Tests: 1600×900 chase / third / first-person stills; color-blind; reduced-motion; AGEZ overlay in a probe. Confirm `H` over the self rail (600, 513) sets `rw-hair-off`. Confirm `H` on a contacts end (710, 785) or Bio (1556, 856) shows **no extra** family ink in the 56 px disk. Confirm no `innerHTML`. Confirm node count == current + 0 (Alt A).

## 14. Verification checklist (data domain)

- [ ] Tendrils banned from aim glass by AGEZ px rules **and** an implementable control on every extra host: rails use `rw-hair-off`; Bio extra length = 0; contacts extra length = 0 (`stroke-linecap` only). No host is “safe” by screen position.
- [ ] No new bio stats or game systems.
- [ ] Same instruments as HUD-01 / Wave F.
- [ ] Iris remains pupil + 3 cilia + dashed `::after`.
- [ ] Friend/foe still tick / chevron / diamond.
- [ ] Mute and `masterVolume` gate every cue.
- [ ] `body.rw-reduced-motion` yields all new motion.
- [ ] No `src/` or `docs/` edits in this design wave.
