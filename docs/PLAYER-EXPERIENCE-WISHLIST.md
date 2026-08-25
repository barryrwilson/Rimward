# RIMWARD Player-Experience Wishlist

> Living backlog for improvements noticed through hands-on play.
> This is an idea and product-intent source for future Orchestrator waves, not
> an implementation plan and not a promise that every item ships unchanged.

## How to use this document

### Adding a quick idea

Put an unrefined thought in **Idea inbox**. A future grooming pass can move it
into a themed initiative without requiring the author to supply technical
details.

```md
- [ ] IDEA: What I noticed, what I wish happened instead, and why it matters.
```

### Mining work for an Orchestrator wave

1. Choose a related cluster that creates one coherent improvement to play.
2. Confirm the current code and behavior before treating "likely areas" as a
   write set. They are navigation hints only.
3. Turn the selected wishlist items into bounded tasks with disjoint write
   sets, explicit dependencies, acceptance criteria, and verification targets.
4. Call out possible regressions or weakened existing behavior before work
   starts. The owner specifically wants tradeoffs surfaced rather than hidden.
5. Prefer balanced groups of related improvements over only large projects or
   only quick wins.
6. Verify player-facing changes in the running game. A green harness alone is
   not sufficient for HUD, combat feel, graphics, motion, or traffic behavior.

### Status labels

- **INBOX** — raw thought that has not been discussed.
- **CAPTURED** — desired player outcome is understood; design details may remain.
- **READY TO DESIGN** — suitable for turning into a focused design brief.
- **PLANNED** — assigned to a proposed wave with scope and dependencies.
- **DONE** — implemented and verified through play.
- **PARKED** — deliberately deferred, with the reason recorded.

## Idea inbox

- [x] DONE (P0, NAV): Autopilot can reach the plotted gate's activation zone
  and then cancel with "next gate is missing" instead of jumping; make the
  gate handoff reliable, retain enough reason detail to diagnose lookup/path/
  hub failures separately, and verify a live plotted route through
  `systemLoaded` rather than only checking steering commands.
  Wave 117 PR1 `docs/Nav05HandoffDesign.md`.
- [x] DONE (P0, CONTROLS): `D` currently means both lateral strafe-right and
  dock/jump, so using the displayed gate or dock prompt can move the ship out
  of interaction range; give dock/jump a dedicated non-movement interaction
  binding so movement and contextual actions cannot fire from the same key.
  Wave 117 PR1 `docs/Ctl01DockBindDesign.md`. KeyJ dock/jump. KeyD strafe.
- [x] DONE (P1, OVERLAYS): Hail, Galaxy Chart, and Berth Records can stack while
  the simulation continues, and a resolved "Let them go" hail can return;
  establish one overlay-priority/pause policy, defer incompatible cards, and
  ensure a resolved hail cannot reopen during its calm period.
  Wave 118 PR1 `docs/Ctl02OverlayDesign.md`. Mutex hail/chart/berth.
- [x] DONE (P1, FEEDBACK): Repeated autosave refusals and encounter lines can
  flood the notification stack and obscure new information; deduplicate or
  update identical messages within a short window and distinguish manual-save
  failures from background autosave retries.
  Wave 120 PR1 `docs/Hud04ToastFloodDesign.md`.
- [x] PLANNED (P2, NAV/A11Y): Galaxy-chart labels are not clickable and route
  plotting depends on small invisible mouse-only SVG hit discs; make labels
  activate their systems, enlarge the effective targets, add accessible names
  and keyboard focus, and provide keyboard navigation or a searchable
  destination list.
  Wave 120 brief `docs/Nav07ChartLabelDesign.md`. Impl later (PR1).
- [x] DONE (P2, NAV): Starting Autopilot from the Galaxy Chart begins moving the
  ship behind the still-open full-screen map; close the chart automatically on
  successful engagement, or present an explicit state that requires closing
  the chart before flight resumes.
  Wave 120 PR1 `docs/Nav06ChartCloseDesign.md`.

---

## Priority and product direction

### Current first priority

**Combat HUD and targeting (HUD-01 / TGT-01 / TGT-02 / TGT-03 arc) landed
2026-08-17.** **FLT turn law and combat envelope landed 2026-08-17.**
**PHY-01 / PHY-02 / PHY-03 first pass landed 2026-08-17 (Wave 53).**
**FX-01 / FX-02 / FX-03 first pass landed 2026-08-17 (Wave 54).**
**AI-01 / AI-02 / AI-03 / AI-04 first pass landed 2026-08-17 (Wave 56).**
**Wave 57 leftovers landed 2026-08-18:** ship-vs-ship bolts, dest-bank
ticks, miners. **Wave 58 PHY leftovers landed 2026-08-18:** gate
torus collision, station hold routes, live station/gate avoid.
**Wave 59 FX leftovers landed 2026-08-18:** visible fire recoil,
pooled hull scorches, pad-home route heal. **Wave 60 POD first
pass landed 2026-08-18:** scoop survivors, spawn on surrender/
destroy, matching-faction rescue, save provenance. Market sale
did not ship in Wave 60. **Wave 61 HUD-02 design
brief landed 2026-08-18:** `docs/Hud02IdentitiesDesign.md`.
**Wave 62 HUD-02 skins landed 2026-08-18:** hook + mech + bio.
Family audio landed Wave 65. **Wave 63 SHP design brief landed
2026-08-18:** `docs/ShpDesign.md`. **Wave 64 SHP first slice
landed 2026-08-18:** hangar persist, remount, Digit 0 shipyard
desk, buy-adds-row, outfitter mirrors. Mech HUD now follows a
mounted `hullKind: 'built'` hull. **Wave 65 leftovers landed
2026-08-19:** HUD-02 family audio; plated cutter+ace catalogs
(frigate still omitted); POD-02 trafficking brief
(`docs/Pod02TraffickingDesign.md`). **Wave 66 POD-02 impl
landed 2026-08-19:** Gilded People Digit 7, Confirm transfer,
160/240 UU, warn toast. Missiles and turrets did not ship.
Frigate buy did not ship. **Wave 67 leftovers + briefs
landed 2026-08-19:** plated frigate buy (80000 UU, Trusted 25);
SHP-03 weapons brief (`docs/Shp03WeaponsDesign.md`); AST
orbits brief (`docs/AstOrbitsDesign.md`). **Wave 68 SHP-03
first impl landed 2026-08-19:** dart rack, auto turret,
Outfitting 8/9 Confirm papers, group 4, HUD WPN ammo.
**Wave 69 AST first impl landed 2026-08-19:** closed-form belts,
work sector, sparse `fieldOre`, group-3 mine cue. Beautiful /
Unknowables still omit frigate. **Wave 70 leftovers + briefs
landed 2026-08-20:** MATCH on a locked rock (rest-frame hold);
BIO brief (`docs/BioLivingShipsDesign.md`); MSN brief
(`docs/MsnMissionsDesign.md`). Beautiful / Unknowables still
omit frigate. **Wave 71 MATCH lamp leftover + MSN first impl
landed 2026-08-20:** HUD MATCH lights on a rock lock; mining
Jobs cards (two slots, accept, deliver, 600 s expire,
one-in-one-out). BIO first impl later. Beautiful /
Unknowables still omit frigate. **Wave 72 BIO first impl
landed 2026-08-20:** hangar `grafted` allowlist; Gilded
two-step graft; Beautiful standing `min(current, -10)` while
any grafted row exists; no debit until an owner UU. Gift,
pirate seed, living frigate, BIO-03 fleet art, and BIO-04
psionics stay later. **Wave 73 design briefs landed
2026-08-20:** TGT-05 reticle-lock (`docs/Tgt05ReticleLockDesign.md`);
REP standing (`docs/RepStandingDesign.md`); EXP data trade
(`docs/ExpDataTradeDesign.md`). No `src/` that wave.
**Wave 74 first impl landed 2026-08-20:** KeyV reticle-lock
(ships + rocks, direct-hit); Digit 9 Standing explain;
data cargo persist + Assembly Archive desk (no UU).
**Wave 75 design briefs landed 2026-08-20:** MSN-02
renewable trade (`docs/Msn02TradeDesign.md`); BIO-03
Beautiful NPC fleet (`docs/Bio03FleetDesign.md`); NPC
missiles + incoming warning (`docs/NpcMissilesDesign.md`).
No `src/` that wave. NPC missiles stay off until owner
Q1/Q2. No aim-glass gauge.
**Wave 76 first impl landed 2026-08-20:** MSN-02
renewable trade (two slots, dest `otherSystemId`, origin
quote, 600 s expire, cap 420); BIO-03 per-instance GPU
swim from NPC speed. Player CPU swim stays unique. NPC
missiles still off until owner Q1/Q2. No aim-glass gauge.
**Wave 77 design briefs landed 2026-08-20:** MSN-02 hunt
(`docs/Msn02HuntDesign.md`); passenger
(`docs/Msn02PassengerDesign.md`); explore
(`docs/Msn02ExploreDesign.md`). No `src/` that wave.
NPC missiles still off until owner Q1/Q2. No aim-glass
gauge. Espionage and faction-war still wait on REP-04.
**Wave 78 first impl landed 2026-08-21:** MSN-02 hunt,
passenger, and explore (two slots each, one-in-one-out,
600 s fail-closed). Cap `4+10*N+16`. Unique four stay.
NPC missiles still off until owner Q1/Q2. No aim-glass
gauge. Espionage and faction-war still wait on REP-04.
**Wave 79 design briefs landed 2026-08-21:** REP-04 kill
attribution (`docs/Rep04AttributionDesign.md`); MSN-02
espionage (`docs/Msn02EspionageDesign.md`); faction-war
(`docs/Msn02FactionWarDesign.md`). No `src/` that wave.
Kill delta, spy expose, and war target-rep stay
fail-closed until owner numbers. NPC missiles still off
until owner Q1/Q2. No aim-glass gauge.
**Wave 80 first impl landed 2026-08-21:** REP-04 kill
attribution helper (`docs/Rep04AttributionDesign.md`).
Victim-faction only; `KILL_STANDING_DELTA` still null
(no bag write). Digit 9 does not claim kills move
standing. MSN-02 renewable espionage first impl
(`docs/Msn02EspionageDesign.md`): two slots, rival dest,
secret success employer +2 / target 0. MSN-02 renewable
faction-war first impl (`docs/Msn02FactionWarDesign.md`):
two slots, rival-gate dest, dest-faction patrol quarry,
space-side witness, employer +2 / target 0. NPC missiles
still off until owner Q1/Q2. No aim-glass gauge.
**Wave 81 design briefs landed 2026-08-21:** TGT-05
remaining lock categories
(`docs/Tgt05LockCatsDesign.md`); MSN-03 authored
chains (`docs/Msn03ChainsDesign.md`); BIO-03
per-class look and bake
(`docs/Bio03ClassLookDesign.md`). No `src/` that wave.
Cone pixel cap, unique-equipment SKUs, and NPC missiles
Q1/Q2 stay owner-open. No aim-glass gauge.
**Wave 82 owner calls + first impl landed 2026-08-21:**
`docs/OwnerDecisionsWave82.md`. Cone **12 px**. Kill
delta **−5**. Graft **4000 UU**. EXP drop **0.20**, own
**400**, rival **900**, launder **250**. TGT-05 station /
gate / pod / landmark KeyV locks. NPC missiles Q1/Q2
closed (pirate+ace, toast+song) but darts not shipped.
MSN-03 SKUs named; chains not shipped. Spy expose −2 and
war target −2 named; writes not shipped. Restitution
**1200** named; desk not shipped. No aim-glass gauge.
**Wave 83 impl landed 2026-08-21:** NPC missiles vs player
(pirate+ace, toast `Incoming dart.` + song, pool 4). Spy
expose dest −2 on accepted lapse. War success dest −2.
Restitution desk 1200 UU on Digit 9. MSN-03 chains with
owner SKUs. Police leave still deferred. No aim-glass gauge.
**Wave 84 design briefs landed 2026-08-21:** NAV-01 plot
(`docs/Nav01RouteDesign.md`); NAV-02 guidance
(`docs/Nav02GuidanceDesign.md`); NAV-03 autopilot
(`docs/Nav03AutopilotDesign.md`). No `src/` that wave.
One persist key `nav`. Next hop `path[1]`. Restore does
not resume flying Autopilot. No aim-glass gauge.
**Wave 85 first impl landed 2026-08-21:** NAV-01 plot
persist + chart click; NAV-02 next-gate readout / cue /
ring; NAV-03 Autopilot (MATCH refuse, cancel keeps dest,
restore never resumes flying). Police leave still
deferred. No aim-glass gauge.
**Wave 86 design briefs landed 2026-08-21:** BIO-01
remaining obtain (`docs/Bio01ObtainDesign.md`); BIO-02
training (`docs/Bio02EvolutionDesign.md`); BIO-04
psionics (`docs/Bio04PsionicsDesign.md`). No `src/`
that wave. Gift id `hull_seed_gift`, Sworn ≥ 50, living
`light`, cap 8 fail-closed. Train living `light`/`cutter`
→ `heavy` at Beautiful Hangar papers. Digit 5 `psionic`,
living + grafted only, Unknowables miss. Police leave
still deferred. No aim-glass gauge.
**Wave 92 first impl landed 2026-08-22:** BIO-01 gift
`hull_seed_gift` + pirate rate 0.05; BIO-02 Hangar train
to `heavy` (`yardPrice('heavy')`); BIO-04 Digit 5
Psionic bolt. Unknowables dock brief
(`docs/UnknowablesDockDesign.md`): hush presence, no
station. Police leave still deferred. No aim-glass
gauge.

**Wave 93 owner calls landed 2026-08-23:**
`docs/OwnerDecisionsWave93.md`. Markdown only. Police
leave named (hostile band `< 0` and `> −10`; impl later).
Power ledger / aim-glass **out**. Living frigate buy
**omit**. Seed commodity **omit**. Owned living `heavy`
→ `frigate` train named (`yardPrice('frigate')`).
Unknowables presence unblocked (`th_veil`). Dock **Wait**.
BIO-03 bake serial open (GLB + GPU). No aim-glass gauge.

**Wave 94 first impl landed 2026-08-23:**
`docs/OwnerDecisionsWave94.md`. Living yards sell six
classes. Hangar trains to any other living class.
Beautiful Market seed **40000 UU**. POWER pool 100 with
side-column PWR. Unknowables dock `veil` / The Quiet
(Archive 400/900). Aim-glass gauges stay off. Police
leave still later. BIO-03 bake still later.

**Wave 95 first impl + NAV-04 brief landed 2026-08-23:**
police leave (`Leave this space.` once per visit in the
hostile band `< 0` and `> −10`, 300 u law zone). BIO-03
look/bake: six Beautiful NPC GLBs rebaked (keep GLB +
GPU). NAV-04 hover brief (`docs/Nav04HoverDesign.md`);
impl later. Aim-glass gauges stay off.

**Wave 96 first impl + BIO-05 brief landed 2026-08-23:**
NAV-04 hover (`docs/Nav04HoverDesign.md`): reserved strip
under the KeyM SVG; Digit 9 standing; click still plots.
Boot harness treats authored `veil` (101 systems). BIO-05
remaining brief (`docs/Bio05AbominationsDesign.md`):
player graft loop frozen DONE; NPC/visual later. Aim-glass
gauges stay off.

**Wave 97 design briefs + BIO-05 owner close landed
2026-08-23:** TGT-03 remaining awareness
(`docs/Tgt03AwarenessDesign.md`): lock off-screen reuses
`.rw-edge-arrow`; later `Incoming fire.` toast. NPC
turrets brief (`docs/NpcTurretsDesign.md`): later serial,
default-off who. BIO-05 remaining closed
(`docs/OwnerDecisionsWave97.md`): NPC grafts off, plated
overlay omit, badge omit, ungraft forbidden. Aim-glass
gauges stay off.

**Wave 98 first impl + owner + radar brief landed
2026-08-23:** TGT-03 `Incoming fire.` toast + lock
park/aria (`docs/Tgt03AwarenessDesign.md`). NPC
turret Q1/Q2 closed (`docs/OwnerDecisionsWave98.md`):
heavy/ace/frigate + already-hostile, vsPlayer only;
impl later. Radar brief (`docs/Tgt03RadarDesign.md`):
reuse `.rw-contacts`; no hub PPI. Aim-glass gauges
stay off.

**Wave 99 first impl + subsystem brief landed
2026-08-23:** NPC turret vsPlayer
(`docs/NpcTurretsDesign.md`): heavy/ace/frigate +
already-hostile; missing target drops; NPC cap 4;
`Incoming fire.` reuse. Radar jump-park
(`docs/Tgt03RadarDesign.md`): hide `.rw-contacts`
while jumping. Subsystem targeting brief
(`docs/Tgt03SubsystemDesign.md`); impl later.
Aim-glass gauges stay off.

**Wave 100 owner deputize + engine-select landed
2026-08-23:** `docs/OwnerDecisionsWave100.md`.
Standing rule: pick, note, keep going. KeyK engine
on a ship lock after shields; ENGINE bar on the tgt
rail; no SKU; no extra Digit; no hub gauge.

**Wave 101 leftover + briefs landed 2026-08-23:**
NPC turret vs already-hostile NPC
(`docs/OwnerDecisionsWave101.md`). TGT-03 remaining
CLOS brief (`docs/Tgt03ClosureDesign.md`); impl
later. BIO-02 remaining career brief
(`docs/Bio02CareerDesign.md`); no new class keys.
Aim-glass gauges stay off.

**Wave 102 first impl + HUD-03 brief landed
2026-08-23:** TGT-03 CLOS (`+N`/`-N`/`0 u/s` next
to DIST). BIO-02 Hangar Offer career words.
HUD-03 remaining brief (`docs/Hud03AlertsDesign.md`).
Kit mutate omit. Aim-glass gauges stay off.

**Wave 103 leftover + briefs landed 2026-08-23:**
HUD-03 KeyO `hudAlerts` default off
(`docs/Hud03AlertsDesign.md`). Mute fail-closed.
Family ticks reuse. Incoming copy stays.
REP-05 remaining brief
(`docs/Rep05ConsequencesDesign.md`): covering +
inbound jump refuse; police leave stays live.
MSN-03 unique DONE brief
(`docs/Msn03UniqueDoneDesign.md`): hide on Digit 2;
persist keep. Kit mutate omit. Aim-glass gauges
stay off.

**Wave 104 leftover + brief landed 2026-08-24:**
REP-05 covering + inbound jump
(`docs/Rep05ConsequencesDesign.md`): Known+ patrol
cover; Marked dest refuse `No passage.`; dock open.
MSN-03 unique DONE hide on Digit 2; persist keep.
BIO-06 remaining brief (`docs/Bio06CadenceDesign.md`).
Digit 9 covering copy later. Kit mutate omit.
Aim-glass gauges stay off.

**Wave 105 BIO-07 freeze + light/heavy slices
landed 2026-08-24:** NPC Beautiful must read as
sea creatures, not creature+machine fusions
(`docs/Bio07BodiesDesign.md`). Light and heavy
NPC GLBs rebaked. Player CPU hull stays the bar.
Ace / cutter / frigate / freighter later. Kit
mutate omit. Aim-glass gauges stay off.

**Wave 106 BIO-07 remaining four classes landed
2026-08-24:** Ace squid, cutter shark, frigate
octopus travel pose, freighter gardenback. Shared
foundation rewrite. Six GLBs rebaked. Player CPU
hull stays the bar. Kit mutate omit. Aim-glass
gauges stay off.

**Wave 107 leftover + brief landed 2026-08-24:**
BIO-06 cadence (`docs/Bio06CadenceDesign.md`):
per-class Hz/sweep; light 0.5→2.3 honor; NPC
class-cruise + `uSwimSweep`. REP-05 Digit 9 copy
of leave / covering / jump refuse. BIO-08 gait
brief (`docs/Bio08LocomotionDesign.md`); impl
later. Kit mutate omit. Aim-glass gauges stay off.

**Wave 108 leftover + briefs landed 2026-08-24:**
BIO-08 gait first impl (`docs/Bio08LocomotionDesign.md`):
per-class axis mix; light CPU honor; one GPU
shader. MSN-03 remaining unique SKU brief
(`docs/Msn03UniqueSkuDesign.md`): Veridian `auto`,
Hollow `dart`. PHY-04 remaining NPC avoid brief
(`docs/Phy04AvoidDesign.md`); impl later. Kit
mutate omit. Aim-glass gauges stay off.

**Wave 109 leftover + brief landed 2026-08-24:**
MSN-03 unique SKU first impl
(`docs/Msn03UniqueSkuDesign.md`): Veridian `auto`,
Hollow empty `dart`, light +2 UU. PHY-04
two-sample avoid (`docs/Phy04AvoidDesign.md`):
20 u mid probe + frame hold; no navmesh.
PHY-05 remaining pad-home brief
(`docs/Phy05PadHomeDesign.md`); impl later.
Kit mutate omit. Aim-glass gauges stay off.

**Wave 110 leftover + briefs landed 2026-08-24:**
PHY-05 pad-home first impl
(`docs/Phy05PadHomeDesign.md`): patrol
heavy hold outside D5; persist heal on
existing `record.route`. REP-03 remaining
remedial brief (`docs/Rep03RemedialDesign.md`):
Digit 9 copy of live +2 climb after
restitution-to-0; impl later. FX-01
remaining punch brief
(`docs/Fx01RemainingDesign.md`): hull-local
shield ripple; recoil/marks consume;
impl later. Kit mutate omit. Aim-glass
gauges stay off.

**Wave 111 leftover + brief landed 2026-08-24:**
REP-03 Digit 9 climb copy first impl
(`docs/Rep03RemedialDesign.md`): live +2
families after restitution-to-0. FX-01
hull-local shield ripple first impl
(`docs/Fx01RemainingDesign.md`): ring
parents to host; FP world-space; recoil
/ marks consume. HUD-02 remaining
class-silhouette brief
(`docs/Hud02RemainingSilhouettesDesign.md`);
impl later. Kit mutate omit. Aim-glass
gauges stay off.

**Wave 112 owner deputize landed 2026-08-24:**
`docs/OwnerDecisionsWave112.md`. Live knobs
consume. HUD-02 class silhouettes later.

**Wave 113 leftover + briefs landed 2026-08-24:**
HUD-02 living class tokens first impl
(`docs/Hud02RemainingSilhouettesDesign.md`):
`data-class-key` on bio facing chrome.
HUD-02 remaining plated silhouette brief
(`docs/Hud02RemainingMechSilhouettesDesign.md`);
impl later. FX remaining scrape punch brief
(`docs/Fx01RemainingScrapeDesign.md`);
impl later. Kit mutate omit. Aim-glass
gauges stay off.

**Wave 114 leftover + briefs landed 2026-08-24:**
HUD-02 plated class tokens first impl
(`docs/Hud02RemainingMechSilhouettesDesign.md`):
`data-class-key` on mech facing chrome.
FX scrape punch first impl
(`docs/Fx01RemainingScrapeDesign.md`):
`spawnHitFx` on damaging ram. FX muzzle
leftover CONSUME
(`docs/Fx01RemainingMuzzleDesign.md`).
Kit mutate omit. Aim-glass gauges stay
off.

**Wave 115 leftover census landed 2026-08-24:**
HUD-02 remaining TARGET class tokens
brief (`docs/Hud02RemainingTargetSilhouettesDesign.md`);
impl later. HUD-03 visual leftover
CONSUME (`docs/Hud03RemainingVisualDesign.md`).
SHP remaining catalog leftover CONSUME
(`docs/ShpRemainingCatalogDesign.md`).
No `src/`. Kit mutate omit. Aim-glass
gauges stay off.

**Wave 116 leftover + inbox briefs landed
2026-08-24:** HUD-02 TARGET class tokens
first impl (`docs/Hud02RemainingTargetSilhouettesDesign.md`):
lock class on `.rw-combat-target`;
player CSS scoped to `.rw-combat-self`.
NAV-05 AP handoff brief
(`docs/Nav05HandoffDesign.md`); impl later.
CTL-01 dock/jump KeyJ brief
(`docs/Ctl01DockBindDesign.md`); impl later.
Kit mutate omit. Aim-glass gauges stay
off.

**Wave 117 leftover + inbox census landed
2026-08-24:** NAV-05 AP handoff first impl
(`docs/Nav05HandoffDesign.md`): ring hop
keeps flying; split cancel English; live
`systemLoaded` pin; chart-open
`showApLive`. CTL-01 KeyJ first impl
(`docs/Ctl01DockBindDesign.md`): dock/jump
J; D strafe only. Overlay leftover brief
(`docs/Ctl02OverlayDesign.md`); impl later.
Toast flood, chart-label a11y, and
close-chart-on-AP stay inbox. Kit mutate
omit. Aim-glass gauges stay off.

**Wave 118 leftover + inbox census landed
2026-08-25:** CTL-02 overlay-priority
first impl (`docs/Ctl02OverlayDesign.md`):
mutex hail/chart/berth; defer hail;
salvage calm; Digit skip under pause.
Toast leftover brief
(`docs/Hud04ToastFloodDesign.md`); impl
later. Chart-close leftover brief
(`docs/Nav06ChartCloseDesign.md`); impl
later. Chart-label a11y stays inbox.
Kit mutate omit. Aim-glass gauges stay
off.

**Wave 119 boot-fail closeout landed
2026-08-25:** WAVE26 unique ferry/haul
keep; NPC UPDATE ERR fail-closed;
WAVE83 dart toast capture. `npm run
test:boot` PASS. Toast PR1 and
chart-close PR1 stayed OPEN.

**Wave 120 leftover + inbox census landed
2026-08-25:** HUD-04 toast-flood first
impl (`docs/Hud04ToastFloodDesign.md`):
8 s linger; AUTOSAVE HELD vs SAVE
BLOCKED. NAV-06 chart-close-on-AP first
impl (`docs/Nav06ChartCloseDesign.md`):
Autopilot button success closes the
chart. Chart-label leftover brief
(`docs/Nav07ChartLabelDesign.md`); impl
later. Kit mutate omit. Aim-glass
gauges stay off.

### Experience references

Use these as experiential references rather than cloning their interfaces:

- *FreeSpace* (original): combat feel and HUD clarity; `out/hud-research/fs1-asteroids.jpg` is the strongest layout reference. Training stills `out/hud-research/fs1-energy.jpg`, `out/hud-research/fs1-shields.png`, and `out/hud-research/fs1-training-reticle.jpg` are evidence only (see the HUD research stills addendum).
- *Galaxy on Fire*: combat feel, clarity, and atmosphere.
- *Elite / Frontier*: atmosphere and the feeling of inhabiting a space career.
- *Star Commander*: combat feel, clarity, and atmosphere.

### Careers the game should support

The player should have viable choices rather than being forced into one loop:

- mining;
- trading;
- mercenary work;
- faction-targeted piracy;
- espionage;
- exploration;
- and future careers that fit the sandbox.

Progression should come primarily through money used to buy ships and equipment.
Exceptional equipment can instead be earned through authored, faction-specific
mission chains.

---

## Initiative HUD — Action-centered combat HUD

**Status:** HUD-01 DONE (implemented + play-verified 2026-08-17). HUD-02
skins DONE (Wave 62, 2026-08-18; brief Wave 61). Family audio DONE
(Wave 65 PR4). HUD-03 visual leftover CONSUME (Wave 115;
`docs/Hud03RemainingVisualDesign.md`). Optional audio
alerts DONE (Wave 103; brief Wave 102). Wave 113 living
class-token first impl
(`docs/Hud02RemainingSilhouettesDesign.md`).
Wave 114 plated class-token first impl
(`docs/Hud02RemainingMechSilhouettesDesign.md`).
Wave 115 remaining TARGET class-token brief
(`docs/Hud02RemainingTargetSilhouettesDesign.md`).
Wave 116 TARGET class-token first impl.  
**Player problem:** The current HUD pulls the player's eyes to screen corners,
away from the target and projectile path. Essential combat state is difficult
to read quickly.  
**Primary reference:** Original *FreeSpace* HUD.  
**Likely areas:** `src/systems/hud.js`, `src/ui/hud.css`, combat/target state,
settings and accessibility surfaces.

### HUD-01 — Mirrored central combat status

**Status:** DONE (HUD utility waves A–C / E, 2026-08-17). Thin rails, empty
80 px hub, combat-collapse Controls, toasts/banner off the aim column, Bio/POS
`.rw-fade`, Hail lower-left, hints top-left, FORE/AFT, three cameras one overlay.

Keep the action visible while placing essential status near the center:

- player's status grouped on the left of center;
- selected target's status mirrored on the right;
- target name;
- graphical shield and hull bars and/or ship silhouettes, not a primarily
  numeric presentation;
- player shield, hull, and speed;
- target shield, hull, and speed;
- current weapon;
- target distance as a standard core readout.

The core readouts are standard equipment on every ship. They must not depend on
a targeting-computer upgrade.

**Acceptance direction**

- During a duel, the player can monitor both ships and the selected weapon
  without looking into a screen corner.
- The HUD does not obscure the ship, target, lead point, or projectile path.
- Shield and hull states remain distinguishable without relying on color alone.
- Target identity and lost/destroyed-target transitions are unambiguous.

### HUD-02 — Conventional and living HUD identities

**Status:** DONE for hook + mech + first-wave bio (Wave 62) and
family audio (Wave 65 PR4). Brief: `docs/Hud02IdentitiesDesign.md`.
Mech follows a mounted `hullKind: 'built'` hull after Wave 64 SHP.
Wave 113 living class tokens first impl
(`docs/Hud02RemainingSilhouettesDesign.md`):
allowlisted `data-class-key` on bio facing
chrome. Wave 114 plated class tokens
first impl
(`docs/Hud02RemainingMechSilhouettesDesign.md`):
allowlisted `data-class-key` under mech
only; light keeps generic plate.
Wave 115 remaining TARGET class tokens
brief (`docs/Hud02RemainingTargetSilhouettesDesign.md`):
player-only `classKeyToken` still restyles
both rails. Wave 116 PR1 scopes player CSS
to `.rw-combat-self` and writes lock class
on `.rw-combat-target`.

- Conventional ships use one consistent mechanical HUD family.
- Living ships use an organic HUD family with animated tendrils, pulsing
  biological signs, organic ship silhouettes, responsive color, and creature-
  like audio cues.
- Both variants communicate the same essential information and neither receives
  a competitive readability disadvantage.
- Owner 2026-08-18: ship skins before SHP (mech is debug-only until `hullKind: 'built'`); Unknowables purchased hulls are living (`hullKind: 'living'`); no HUD-03 free skin override.

### HUD-03 — Accessibility and customization

**Status:** Existing settings remain (scale, contrast, color-blind, reduced
motion in `settings.js` / `body.rw-*`). Wave 102 remaining
brief (`docs/Hud03AlertsDesign.md`). Wave 103 first impl:
KeyO `hudAlerts` default off; reuse family ticks; mute
fail-closed; Incoming copy stays. Wave 115 visual leftover
CONSUME (`docs/Hud03RemainingVisualDesign.md`): named
serial none.

Both HUD families should support:

- scalable HUD elements;
- high-contrast presentation;
- color-blind-safe state cues;
- reduced motion;
- optional audio alerts.

**Regression risks to call out:** obscuring the center view; reduced readability
on bright backgrounds; living HUD animation becoming distracting; breaking
existing reduced-motion behavior; moving information without removing obsolete
duplicates.

---

## Initiative TGT — Targeting, aiming, and awareness

**Status:** TGT-01 and TGT-02 DONE (core ship). TGT-03 DONE for the
scanner-gated bearing arc; remaining awareness first impl
Wave 98 (`docs/Tgt03AwarenessDesign.md`). Radar jump-park
Wave 99 (`docs/Tgt03RadarDesign.md`). Engine-select Wave 100
(`docs/OwnerDecisionsWave100.md`). TGT-03 remaining CLOS
brief Wave 101 (`docs/Tgt03ClosureDesign.md`); first impl
Wave 102 (`+N`/`-N`/`0 u/s` next to DIST).
TGT-04 player `auto` DONE (Wave 68); NPC turret vsPlayer
Wave 99; vsNPC Wave 101 (`docs/OwnerDecisionsWave101.md`;
brief Wave 97).  
**Player problem:** Hitting a moving target is too difficult, range state is not
clear, and the player lacks enough nearby situational information.  
**Likely areas:** combat targeting/projectile logic, controls, HUD, ship
equipment/state, save migration.

### TGT-01 — Lead indicator and weapon-range feedback

**Status:** DONE (core ship, Wave D, 2026-08-17). Relative lead + RANGE pop
on the hub. The proposal overrode the earlier “upgrade gates the pip” clause;
scanner does not gate lead or RANGE.

- Show where the player should aim to hit the selected moving target with the
  currently selected weapon.
- Compute the lead from actual weapon projectile behavior and relative motion,
  not a decorative offset.
- Change or "pop" the lead/reticle state when the target is within the selected
  weapon's effective range.
- Handle weapons with materially different projectile speeds and ranges.

The base HUD readouts in HUD-01 remain standard.

### TGT-02 — Match target speed

**Status:** DONE (core ship, Wave D, 2026-08-17). MATCH lamp + `X`. `ship.js`
does not write `ctx.input.throttle`. Wave 70: X on a locked rock
holds in the rock rest frame (sampled world velocity). Ship MATCH
still uses scalar speed along the nose. Wave 71: the MATCH lamp
lights on a rock lock as well as a live ship.

Add a control that continuously matches the selected target's speed until
cancelled, invalidated, or the target is lost. The interface must clearly show
when matching is active.

### TGT-03 — Upgradeable situational awareness

**Status:** DONE for the scanner-gated thin bottom bearing arc only (Wave F,
2026-08-17). Tier 0: no arc. Mk I: ENCOUNTER_BUBBLE. Mk II: 2× bubble + lock
closure glyph. Shape = friend/foe. Not a reticle ring. Wave 97 remaining
awareness brief (`docs/Tgt03AwarenessDesign.md`). Wave 98 first impl:
toast `Incoming fire.` for cannon-vs-player; keep `Incoming dart.`;
lock `.rw-edge-arrow` parks docked/jumping. Radar jump-park
Wave 99 (`docs/Tgt03RadarDesign.md`): reuse `.rw-contacts`;
hide while jumping. Subsystem targeting Wave 100 (`docs/OwnerDecisionsWave100.md`;
brief `docs/Tgt03SubsystemDesign.md`): KeyK engine after
shields; ENGINE tgt-rail bar. Remaining CLOS brief Wave 101
(`docs/Tgt03ClosureDesign.md`): core rail next to DIST;
`+N`/`-N`/`0 u/s`; first impl Wave 102.

Candidate sensor/targeting-computer capabilities include:

- radar;
- off-screen target arrows;
- attacker warnings;
- target distance and closure rate;
- missile warnings;
- subsystem targeting;
- improved target lead and weapon-range assistance.

The design pass should define tiers and decide which aids belong to sensors,
targeting computers, or specialized equipment. Core target distance remains a
standard readout even if richer radar information is upgraded.

### TGT-04 — Automated weapons

**Status:** first impl DONE (Wave 68). Forward auto-turret
SKU `auto`. No incoming gauge. NPC missiles shipped Wave 83
(pirate+ace; toast `Incoming dart.` + song). NPC turrets
brief Wave 97 (`docs/NpcTurretsDesign.md`). Wave 98 owner
Q1/Q2 (`docs/OwnerDecisionsWave98.md`): heavy/ace/frigate
+ already-hostile, vsPlayer only. Wave 99 first impl
vsPlayer. Wave 101 vsNPC (`docs/OwnerDecisionsWave101.md`).
No aim glass.

Turrets and automatic guns should be equipment upgrades with appropriate hull,
mount, power, and balance restrictions.

### TGT-05 — Target under reticle

**Status:** first impl DONE (Wave 74; brief Wave 73:
`docs/Tgt05ReticleLockDesign.md`). Wave 82 remaining
categories: station / gate / pod / landmark `lockKind`
(`docs/Tgt05LockCatsDesign.md`). Cone **12 px**. KeyT
cycle stays ships (rocks in group 3).

Add a targeting control that locks the targetable object currently under, or
closest to, the center reticle. This is needed because a populated system can
contain too many ships and objects for repeated next/previous-target cycling to
remain practical.

- Support every appropriate target category: ships, asteroids, stations, gates,
  salvage, cargo, escape pods, landmarks, anomalies, and other interactable
  world objects.
- Prefer the visible object whose on-screen target area actually contains the
  reticle; use a small, forgiving selection cone only when there is no direct
  intersection.
- When multiple objects overlap, prefer the visually nearest unobscured object
  rather than selecting something hidden behind it.
- Preserve existing target filters and eligibility rules; decorative geometry
  must not steal the lock from its owning targetable object.
- Give immediate visual and audio confirmation of the new lock, and clear
  feedback when nothing targetable is under the reticle.
- Keep the function useful with both mouse/gamepad aiming and keyboard flight
  controls.

**Acceptance direction**

- Pointing the reticle at a visible ship or asteroid and pressing the command
  consistently selects that object in a dense representative system.
- A station, gate, salvage item, cargo pod, escape pod, landmark, or anomaly can
  be selected the same way when it is targetable through other controls.
- Foreground targets win over objects hidden behind them.
- Near misses receive modest aim forgiveness without causing surprising locks
  on distant or unrelated objects.
- The selected object feeds the existing target card, range, bearing, MATCH,
  scanning, mining, and interaction systems according to its capabilities.

**Regression risks to call out:** selection through occluding geometry;
small/distant objects becoming impossible to acquire; large station or gate
proxies stealing nearby ship locks; disagreement between the visible reticle
and the camera ray; input conflicts with firing or existing target commands.

**Acceptance direction**

- A new player can land deliberate hits on a maneuvering target with the core
  lead + RANGE + MATCH instruments (TGT-01 / TGT-02 shipped without an upgrade
  gate).
- The range cue always reflects the currently selected weapon.
- Match-speed behavior remains stable as the target accelerates and turns.
- Alerts name or clearly point toward the threat that caused them.

**Regression risks to call out:** aim assist becoming auto-aim; inaccurate lead
for inherited shooter velocity; information overload; keyboard conflicts;
making combat trivial instead of legible.

### Recommended first wave sequence

These pieces are related but likely overlap in HUD and targeting files, so they
should not be assumed parallel-safe:

1. **HUD foundation:** HUD-01 plus essential accessibility behavior. **DONE**
   (waves A–C / E, 2026-08-17).
2. **Aiming foundation:** TGT-01 and TGT-02 using the new central HUD anchors.
   **DONE** (Wave D, core ship).
3. **Equipment progression:** targeting/sensor tiers from TGT-03. **DONE** for
   the scanner-gated awareness arc only (Wave F).
4. **Presentation pass:** HUD-02 brief landed Wave 61
   (`docs/Hud02IdentitiesDesign.md`). Skins landed Wave 62 (hook,
   mech, bio). Broader HUD-03 options and family audio stay later.

Each wave should be useful on its own rather than withholding all value until
the entire sequence is complete.

---

## Initiative FLT — Readable dogfight maneuvering

**Status:** DONE (FLT-01 + FLT-02 implemented + play-verified 2026-08-17).  
**Player problem:** Ships can fly extremely short arcs around one another and
the player. A target that slows to remain in view then whips past at close
range, making sustained pursuit and recognizable dogfighting unnecessarily
difficult.  
**Likely areas:** player and NPC steering, turn-rate/acceleration tuning, combat
AI pursuit geometry, match-speed behavior, ship-class flight characteristics.

### FLT-01 — Wider, class-sensitive turning loops

- Widen ship turning loops so close engagements produce readable pursuit arcs
  rather than near-pivots around the player or target.
- Tune turn radius by ship class, speed, and maneuverability; large ships should
  not rotate through fighter-like arcs.
- Preserve genuinely agile ships as a meaningful strength without allowing
  instantaneous direction changes.
- Keep NPC and player flight rules compatible enough that dogfights feel fair.

### FLT-02 — Combat AI that maintains a fightable envelope

- Pursuing ships should plan approaches, overshoots, extensions, and re-entry
  turns rather than repeatedly crossing through point-blank range.
- AI should avoid slowing so aggressively in front of the player that its next
  maneuver immediately carries it past the camera.
- The desired result is sustained visual contact and opportunities to maneuver
  for position, not targets that passively remain inside the reticle.

**Acceptance direction**

- Representative fighter-versus-fighter engagements produce recognizable
  attack runs and pursuit turns lasting long enough for the player to react.
- Targets no longer alternate rapidly across opposite sides of the screen due
  to implausibly small turn radii.
- Large ships visibly need more room and time to reverse course than small,
  agile ships.
- Widened loops do not cause routine collisions with stations, gates, asteroids,
  suns, or other traffic.
- Changes are playtested together with TGT-02 match-speed behavior.

**Regression risks to call out:** combat becoming slow or easy; agile hulls
losing their identity; AI leaving weapon range too often; wider turns causing
environmental collisions; player and NPC turn rules drifting apart.

---

## Initiative SHP — Ship ownership, shipyards, and loadouts

**Status:** first slice DONE (Wave 64, 2026-08-18; brief Wave 63:
`docs/ShpDesign.md`). Wave 65 added cutter + ace to authored
buy lists. Wave 67 added plated frigate buy. Missiles /
turrets first impl DONE (Wave 68;
`docs/Shp03WeaponsDesign.md`). Power ledger **out**
(Wave 93 close). Wave 115 remaining catalog leftover
CONSUME (`docs/ShpRemainingCatalogDesign.md`): named
serial none. Living and plated catalogs already include
`frigate`.  
**Player problem:** The player cannot build a collection of ships or meaningfully
configure a hull for a chosen career.  
**Likely areas:** station/shipyard UI, player state and saves, ship definitions,
equipment and combat systems.

### SHP-01 — Faction shipyards and purchasable ships

**Status:** first slice DONE (Wave 64). Authored faction catalogs,
reputation + price gate, Digit 0 desk. Cutter + ace buy lists
DONE (Wave 65). Plated frigate buy DONE (Wave 67; 80000 UU,
Trusted 25). Wave 94 living yards sell six keys including
frigate. Wave 115 CONSUME: SHP-01 omit-frigate copy is
stale. Independent and Hollow yards stay empty.

- Give each faction at least one shipyard where its ships can be purchased.
- Gate faction hulls by sufficient reputation as well as price.
- Make faction and class differences meaningful to careers and loadouts.

### SHP-02 — Magical multi-ship storage

**Status:** first slice DONE (Wave 64). Magical hangar cap 8.
Buy adds a row. Hangar pane mounts from any dock.

- The player can own and store multiple ships rather than trading away the
  current hull.
- Stored ships can be switched from any station or shipyard regardless of where
  they were last used.
- Convenience is intentional; the fiction does not need to simulate physical
  delivery or remote transfer.

### SHP-03 — Broad but bounded customization

**Status:** first slice DONE (Wave 64) = existing equipment on flat
hangar fields; world keys stay mirrors. Missiles / turrets /
seat-count mass first impl DONE (Wave 68,
`docs/Shp03WeaponsDesign.md`). Wave 75 NPC-missile brief:
`docs/NpcMissilesDesign.md`. Power ledger stays out.

- Allow weapons and other reasonable ship systems to be upgraded or swapped.
- Mount availability depends on hull size and role.
- A starter/small ship might have only one or two general weapon mounts plus a
  mining-laser provision.
- A large combat hull can support every conventional weapon family, subject to
  mount counts and other balance restrictions.
- Add missiles as a weapon class with missile-launcher hardpoints.
- Turrets and automatic guns require compatible mounts/upgrades.
- Living ships can accept conventional components in addition to biological
  growth.

**Open design needs:** first-slice persist and desk law stay frozen in
`docs/ShpDesign.md`. Missile / turret / mass law for a later wave is frozen in
`docs/Shp03WeaponsDesign.md` (merge law `out/w67/shp03/shared-contract.md`).

---

## Initiative REP — Faction reputation and law

**Status:** first impl DONE (Wave 74; brief Wave 73:
`docs/RepStandingDesign.md`). Wave 82 kill delta **−5**
(`docs/Rep04AttributionDesign.md`). Restitution **1200**
stay. Police leave Wave 95 (`Leave this space.`).
Wave 103 remaining brief
(`docs/Rep05ConsequencesDesign.md`). Wave 104 first
impl: covering Known+; inbound Marked refuse.
Wave 107 Digit 9 copy of leave / covering /
jump refuse. Wave 110 remaining remedial
brief (`docs/Rep03RemedialDesign.md`).
Wave 111 first impl: Digit 9 climb copy
after restitution-to-0; live +2 families;
no new kind. War target −2 and
spy expose −2 shipped Wave 83. `RANK_LADDER` stays.  
**Player problem:** The game does not adequately explain how to improve faction
standing or show what the rating changes.  
**Likely areas:** reputation/epic state, station UI, mission outcomes, HUD
notices, contacts, policing/traffic behavior, saves.

### REP-01 — Explain reputation everywhere it matters

Use a combination of:

- a dedicated reputation screen;
- mission-board guidance;
- NPC dialogue;
- HUD notifications and clear change reasons.

### REP-02 — Reputation has broad consequences

Standing should affect:

- mission access;
- prices;
- restricted-system or station access;
- equipment and ship availability;
- allies and assistance;
- local police behavior.

### REP-03 — Escalating law response and redemption

- In hostile faction space, police can order the player to stop or leave before
  opening fire when circumstances permit.
- A deeply hostile player can still attempt a risky run to a station.
- Paying restitution can restore the player to neutral.
- Remedial missions can then rebuild genuine standing.
- Returning that faction's escape-pod survivors also improves standing.

### REP-04 — Faction-local consequences

- Piracy performed in controlled faction space is automatically attributed.
- The reputation penalty belongs to the victim's faction and does not become a
  universal crime rating.
- Overt faction-against-faction work raises standing with the employer and
  lowers it with the target.
- Successful espionage is secret and causes no target-faction reputation loss.
  Failure exposes the player and may cause the normal loss.

---

## Initiative MSN — Renewable missions and player careers

**Status:** first impl DONE (Wave 71; brief Wave 70:
`docs/MsnMissionsDesign.md`). Mining family: two slots per
system, sanitize on restore, accept, home delivery, 600 s
fail-closed expire, one-in-one-out. Wave 76 MSN-02 trade
first impl: `docs/Msn02TradeDesign.md` (two slots, dest
named other system, origin quote). Wave 78 MSN-02 hunt /
passenger / explore first impl: `docs/Msn02HuntDesign.md`,
`docs/Msn02PassengerDesign.md`, `docs/Msn02ExploreDesign.md`
(two slots each; cap `4+10*N+16`). Wave 79 briefs:
espionage `docs/Msn02EspionageDesign.md` and faction-war
`docs/Msn02FactionWarDesign.md`. Wave 80 MSN-02
espionage first impl (two slots; cap live+ESPIONAGE_ROOM;
secret success). Wave 80 MSN-02 faction-war first impl
(two slots; cap live+WAR_ROOM; dest-faction patrols;
employer +2 / target 0). Wave 81 MSN-03 brief:
`docs/Msn03ChainsDesign.md`. Wave 82 names last-step SKUs
(Freehold `dart`, Red Ledger `auto`). Wave 83 chains
shipped. Wave 103 unique DONE brief
(`docs/Msn03UniqueDoneDesign.md`). Wave 104 first
impl: hide unique four `done` on Digit 2; persist
keep. Wave 108 remaining unique SKU brief
(`docs/Msn03UniqueSkuDesign.md`): Veridian `auto`,
Hollow `dart`; `canSeat` fail-closed +2 UU.
Wave 109 first impl: remaining employers
seat dart/auto; light +2 UU.  
**Player problem:** Too few missions are available, completed missions do not
reliably disappear and get replaced, and the selection does not support enough
play styles.  
**Likely areas:** station mission generation and UI, world state, economy,
traffic, faction reputation, contacts, saves.

### MSN-01 — Procedural mission board

- Ordinary missions are procedurally generated from faction, station, economy,
  traffic, and conflict context.
- A completed mission is removed and replaced immediately.
- Missions have deadlines, but ordinary deadlines are deliberately generous.
- Mission state and outcomes are clear.

### MSN-02 — Broad mission families

Support at least:

- mining contracts;
- commodity trading and delivery;
- espionage;
- passenger ferrying across systems;
- hunting a local pirate;
- hunting a faction-level pirate threat;
- faction-against-faction operations;
- exploration and information recovery.

### MSN-03 — Authored faction reward chains

Rare or unique equipment comes from authored, faction-specific mission chains
rather than the ordinary procedural pool.

**Acceptance direction**

- Completing a board mission immediately produces a valid replacement.
- A player can repeatedly pursue one preferred career without exhausting its
  mission type.
- Generated missions have reachable origins/destinations and resolvable targets.
- Rewards, risks, time limits, and reputation effects are visible before
  acceptance.

---

## Initiative AI — A living, non-player-centered world

**Status:** AI-01 / AI-02 / AI-03 / AI-04 first pass DONE (Wave 56).
Wave 57 closed ship-vs-ship bolts, dest-bank ticks, and miners.  
**Player problem:** Traffic intersects at the new ship scales, ships repeat
local paths through gates, and almost every ship attacks the player instead of
having believable work.  
**Likely areas:** `src/game/traffic.js`, `src/game/world.js`, NPC behavior,
station/gate routes, mining, economy records and persistence.

### AI-01 — Correct scaled traffic

**Status:** first pass DONE (Wave 56). Spawn clearance + pirate mix cap.
Wave 58: freighter/miner station holds + live cylinder keep-out.
PHY-02 still owns live avoid (lookahead, not full path planning).

- Separation distances and routes account for actual current ship dimensions.
- Ships do not touch or intersect each other during ordinary traffic.
- Freighters use routes and station approaches appropriate to their size.
  Wave 58: station-end trader/miner waypoints sit outside the D5
  cylinder (freighter hold on shared trader routes).
- Ships do not fly through stations. Wave 58: live avoid keeps hulls
  out of the cylinder; miners/traders home to a hold, not the pad
  center. Collision remains the safety net.

### AI-02 — Real inter-system movement

**Status:** first pass DONE (Wave 56). Dest-bank ticks + any-bank pick
landed Wave 57. One migrate per interval still holds.

- A ship entering a gate actually leaves the current system.
- It can persist or reappear as traffic in the destination system.
- Gate traffic does not merely pass through, turn around, and repeat the same
  local path.

### AI-03 — NPCs have jobs

**Status:** first pass DONE (Wave 56 jobs + Wave 57 miners and bolts).
Miners cut hardness-1 rock, cap 8 cargo, emit `mineHit`. NPC-NPC bolts
aim at the target and do not hit the player.

- Miners travel to rocks, visibly mine, acquire ore, and deliver it to a local
  station or another system.
- Traders perform multi-system trade routes.
- Ships can fight one another for systemic reasons independent of the player.
- Outcomes can create real wrecks, cargo, and escape pods.

### AI-04 — Sensible hostility

**Status:** first pass DONE (Wave 56). Traders never hunt the player. Patrols
need a scratch or standing ≤ −10. Pirates keep the wave-32 interest roll.

- Most lawful and civilian ships mind their own business.
- They respond when hailed or attacked rather than opening fire on sight.
- Pirates remain the primary source of unsolicited aggression.
- Faction law, mission context, and reputation can create justified exceptions.

**Regression risks to call out:** CPU cost from persistent simulation; traffic
deadlocks; new avoidance breaking authored encounters; off-screen simulation
creating impossible economic quantities; neutral AI failing to defend itself.

---

## Initiative NAV — Galaxy route plotting and autopilot

**Status:** NAV-01 / NAV-02 / NAV-03 DONE (Wave 85 first impl; Wave 84 briefs
`docs/Nav01RouteDesign.md`, `docs/Nav02GuidanceDesign.md`,
`docs/Nav03AutopilotDesign.md`). NAV-04 DONE (Wave 96
first impl; brief Wave 95 `docs/Nav04HoverDesign.md`).
NAV-05 remaining AP handoff brief Wave 116
(`docs/Nav05HandoffDesign.md`); impl later.
**Player problem:** Selecting a destination on the galaxy map does not currently
turn that choice into useful in-flight navigation. The player must work out the
gate sequence manually, and there is no option to delegate routine travel.
**Desired experience:** Select a system once, see the route both on the galaxy
map and while flying, then either follow the indicated gates manually or click
Autopilot and let the ship fly the complete route.
**Likely areas:** galaxy chart, system/gate graph and jump state, HUD markers,
ship controls and steering, collision/hazard avoidance, save state.

### NAV-01 — Plot a multi-system route

**Status:** DONE (Wave 85).

- Selecting a reachable system on the galaxy map can create a route from the
  current system to that destination.
- The map visually highlights the selected destination, every connection in the
  planned path, the ordered systems/gates, and the number of remaining jumps.
- Route selection distinguishes unreachable destinations from destinations that
  are merely distant.
- The plotted route persists while the player closes the map, flies, docks, and
  passes through intermediate systems.
- The player can replace or clear the route at any time.
- If the player deviates through a different gate, the game recalculates from
  the new system when a valid route still exists and clearly reports when it
  does not.

### NAV-02 — In-flight next-gate guidance

**Status:** DONE (Wave 85).

- While a route is active, the HUD clearly identifies the gate for the next hop.
- Use an in-world marker and an off-screen directional indicator so the next
  gate remains findable regardless of camera direction.
- Show the next system name, final destination, distance to the next gate, and
  remaining jump count without requiring the galaxy map to stay open.
- The route indicator advances only after the corresponding jump completes.
- Guidance must distinguish the routed gate from the currently selected combat
  or interaction target; plotting a route must not unexpectedly replace a
  target lock.

### NAV-03 — Full-route autopilot

**Status:** DONE (Wave 85). Restore does not resume flying.
Remaining zone handoff leftover: Wave 116 brief
(`docs/Nav05HandoffDesign.md`); impl later.

- After selecting a destination system, the player can click **Autopilot** to
  have the ship fly there rather than manually steering through each gate.
- Autopilot steers to the routed gate, approaches and enters it correctly,
  completes the jump, reacquires the next routed gate, and repeats until the
  destination system is reached.
- Autopilot uses the same solid-object, station/gate approach, traffic, and sun
  avoidance rules expected of believable NPC navigation.
- Clearly display the active destination, current leg, and a prominent cancel
  control throughout the trip.
- Player cancellation or deliberate manual flight input returns control
  immediately and predictably without clearing the plotted route.
- Define and communicate safe interruption behavior for danger, damage, combat,
  a blocked approach, a missing gate, or another condition autopilot cannot
  resolve. It must never silently continue into a lethal hazard.
- Arrival means entering the selected destination system; autopilot should stop
  and return control there unless a later feature explicitly adds an in-system
  destination.

### NAV-04 — Galaxy-map system hover information

**Status:** DONE (Wave 96 first impl; brief Wave 95
`docs/Nav04HoverDesign.md`). Reserved strip under the SVG.
No persist key. Click still plots.

Hovering the mouse over a system on the galaxy map should display a compact
information panel containing:

- the system's name;
- its controlling faction or political status;
- the player's current standing with that faction;
- system-specific or local standing as well, if the game tracks it separately.

The hover panel should use both a readable standing label and its useful value
or rank, making clear whether the player is friendly, neutral, unwelcome, or
hostile. Neutral, independent, contested, unclaimed, and unknown systems need
explicit states rather than misleading faction information. The panel should
respect exploration knowledge: information the player has not discovered is
shown as unknown instead of being silently revealed.

**Acceptance direction**

- Moving the pointer across systems updates the panel immediately and reliably.
- The hovered system is visually highlighted so the panel's subject is clear.
- The panel remains readable without obscuring the hovered system, nearby route
  connections, or other important map controls.
- Standing matches the same canonical value and rank used by reputation screens,
  stations, law enforcement, missions, and shipyard access.
- Systems without a conventional controlling faction display an accurate local,
  contested, independent, unclaimed, or unknown state.
- Keyboard or gamepad focus can expose the same information if galaxy-map
  non-mouse navigation is supported.

**Regression risks to call out:** tooltips flickering near overlapping systems;
panels extending off-screen; stale standing after reputation changes; revealing
undiscovered faction ownership; hover interactions interfering with selecting
or plotting a route.

**Acceptance direction**

- From a galaxy-map selection several jumps away, the highlighted path and HUD
  indicators lead the player through the correct ordered gates.
- Manual route guidance remains accurate after every jump and recalculates after
  an intentional deviation.
- One Autopilot command can fly a representative multi-jump route to completion
  without player steering or collisions.
- The player can cancel during approach, gate transit, or an intermediate system
  and regain stable manual control.
- Autopilot never bypasses ordinary travel by teleporting, and it does not grant
  immunity from the living world's events or hazards.
- Save/load restores a plotted manual route safely; whether an actively flying
  autopilot resumes or returns paused/manual is decided explicitly during the
  design pass.

**Regression risks to call out:** pathfinding choosing nonexistent or unusable
connections; route markers competing with target HUD elements; control handoff
causing sudden acceleration or rotation; autopilot colliding with moving ships
or enlarged stations/gates; combat interruption becoming frustrating; saving
mid-route restoring unsafe steering state.

---

## Initiative PHY — Collisions and environmental danger

**Status:** PHY-01 / PHY-02 / PHY-03 first pass DONE (Wave 53, 2026-08-17).
Wave 58 closed gate torus collision, station hold waypoints, and
stronger station/gate avoid. PHY-04 remaining avoid brief Wave 108
(`docs/Phy04AvoidDesign.md`): live 40 u lookahead stays fail-closed;
two-sample steer first impl Wave 109 (mid 20 u +
frame hold; no navmesh). PHY-05 pad-home persist
brief Wave 109 (`docs/Phy05PadHomeDesign.md`);
first impl Wave 110 (patrol heavy hold +
heal; no new persist key).  
**Player problem:** The player and NPCs can fly through suns, stations,
asteroids, and ships, removing risk and breaking visual credibility.  
**Likely areas:** player ship movement, NPC steering, solar-system bodies,
stations, asteroids, collision proxies and combat damage.

### PHY-01 — Solid bodies and collision response

- Ships, stations, and asteroids have appropriate collision volumes.
- Colliding objects physically bounce or slide apart.
- Low-speed impacts begin with minor shield damage.
- Higher-speed damage can be tuned after the basic behavior feels fair.

### PHY-02 — Active NPC avoidance

NPC pilots steer around ships, stations, asteroids, and suns. Collision response
is a safety net, not the normal way traffic navigates.

### PHY-03 — Suns are lethal

- Approaching a sun enters an escalating heat zone that damages shields.
- Flying into the lethal inner region destroys the ship.
- Danger is telegraphed clearly enough to permit escape before the lethal core.

**Acceptance direction**

- The player cannot pass through major objects.
- Low-speed contact is survivable and physically legible.
- NPC traffic completes representative routes without routine collisions.
- Sun damage escalates predictably and the lethal boundary cannot be crossed
  without destruction.

---

## Initiative AST — Asteroid orbits and system-scale fields

**Status:** first impl DONE (Wave 69, 2026-08-19; brief Wave 67:
`docs/AstOrbitsDesign.md`). Closed-form Kepler-lite belts,
work sector, `fieldOre` persist, arrival line + group-3 cue.
Wave 70 leftover: MATCH on a locked rock holds in the rock
rest frame. Wave 71: MATCH lamp lights on that rock lock.
NPC miners already held relative.
**Player problem:** Asteroids currently appear as a single local cluster in each
solar system. The cluster feels placed rather than like a natural part of the
system.
**Desired experience:** Give asteroids their own individual orbits around the
system's star, distributed through a broad belt or Oort-cloud-like region rather
than gathered into one stationary clump.
**Likely areas:** asteroid generation and updates, solar-system layout, authored
system data, mining targets, world persistence, collision/avoidance, map and
scanner presentation.

### AST-01 — Individual stellar orbits

- Each asteroid occupies a stable orbital path around the system's star.
- Asteroids are distributed across a broad orbital region instead of one local
  cluster.
- Orbital radius, inclination, phase, and speed vary enough to create a natural
  three-dimensional field while keeping the result readable and deterministic.
- More distant objects generally move around the star more slowly than nearer
  objects, even if the simulation uses simplified rather than physically exact
  orbital mechanics.
- Different systems may eventually use belts, sparse clouds, multiple bands, or
  other faction/system-specific distributions rather than sharing one pattern.

### AST-02 — Preserve mining as a practical career

- Players can locate asteroid-rich orbital regions through the chart, scanner,
  landmarks, or another clear navigation aid.
- Useful mining targets are not spread so thinly that travel overwhelms mining.
- Mission generation and NPC miners can select reachable asteroids on these
  orbits.
- Mined/depleted asteroid state remains attached to the correct asteroid as it
  moves and after save/load or leaving and revisiting the system.

**Acceptance direction**

- On entering a representative system, asteroids visibly occupy a large orbital
  region instead of one compact clump.
- Individual asteroids advance along stable paths around the star without
  teleporting, visibly drifting off-orbit, or changing identity.
- The same system seed produces the same asteroid population and starting
  orbital state.
- Save/load and system revisits preserve depletion and other persistent state.
- Asteroid motion does not cause routine collisions with stations, gates,
  planets, traffic lanes, NPC miners, or one another.
- The new distribution remains performant at the intended asteroid count and
  visual range.

**Regression risks to call out:** turning mining into excessive travel; orbital
updates increasing frame cost; moving targets breaking mining AI, collision
lookahead, save identity, or mission destinations; fields intersecting authored
stations/gates; an Oort-scale region becoming too distant to be useful in play.

---

## Initiative FX — Combat graphics and feedback

**Status:** FX-01 / FX-02 / FX-03 first pass DONE (Wave 54, 2026-08-17).
Recoil and pooled hull scorches landed Wave 59. Lasting wrecks / cargo /
pods already lived in `world.js`. Wave 110 remaining punch brief
(`docs/Fx01RemainingDesign.md`). Wave 111
first impl: hull-local shield ripple;
recoil/marks consume. Wave 114 scrape punch first impl
(`docs/Fx01RemainingScrapeDesign.md`).
Wave 114 muzzle leftover CONSUME
(`docs/Fx01RemainingMuzzleDesign.md`).
**Player problem:** Weapon effects look weak and hits do not feel impactful.  
**Likely areas:** combat rendering, projectile and beam effects, shields, ship
damage, camera feedback, audio, teardown/performance tests.

### FX-01 — Impactful weapons

**Status:** First pass DONE (Wave 54). Recoil + pooled scorch marks
landed Wave 59. Marks park on a kill shot so wrecks stay clean.
Remaining hull-local shield ripple brief Wave 110
(`docs/Fx01RemainingDesign.md`); first impl
Wave 111. Remaining scrape punch first impl
Wave 114 (`docs/Fx01RemainingScrapeDesign.md`).
Muzzle leftover CONSUME Wave 114
(`docs/Fx01RemainingMuzzleDesign.md`).

Use the full feedback stack where appropriate:

- stronger muzzle flashes;
- readable projectiles and beams;
- shield ripples;
- hull sparks and debris;
- restrained camera shake;
- strong weapon and impact sounds;
- visible recoil where the weapon/hull supports it;
- persistent damage marks where technically and visually practical.

### FX-02 — Prioritized audio

**Status:** First pass DONE (Wave 54).

Prioritize weapon, impact, engine, and warning audio. Do **not** prioritize
music, radio chatter, or station ambience based on current play feedback.

### FX-03 — Destruction aftermath

**Status:** Visual burst DONE (Wave 54). Lasting salvage / cargo / pods
were already staged by `world.js`.

Destroyed ships can leave:

- salvageable debris;
- cargo;
- escape pods.

The aftermath should remain grounded in the ship that was actually destroyed.

**Regression risks to call out:** obscuring aim with particles; excessive camera
shake; frame-time spikes; lingering effects leaking resources; sound fatigue;
damage decals undermining faction materials or living-ship skin.

---

## Initiative POD — Survivors, provenance, rescue, and trafficking

**Status:** POD-01 first pass DONE (Wave 60). POD-02 provenance
fields + no-sale first pass DONE. Trafficking / Gilded sale brief
landed Wave 65 (`docs/Pod02TraffickingDesign.md`). Trafficking
Gilded sale first slice DONE (Wave 66 POD-02).  
**Player opportunity:** Escape pods connect combat aftermath to reputation,
rescue, piracy, and Gilded Chain trade.  
**Likely areas:** pods/cargo records, combat aftermath, station services,
reputation, legality, save data.

### POD-01 — Rescue

**Status:** first pass DONE (Wave 60). Scoop + matching-faction
Return on dock home / People. `other` +4 standing, `playerKill` +1.

- Scoop escape-pod survivors.
- Return them to a station belonging to their faction to gain reputation.

### POD-02 — Provenance-aware sale

**Status:** DONE (Wave 66). Provenance fields persist. Gilded
People Digit 7 sells eligible lots after Confirm transfer
(160 UU recovered / 240 UU playerKill). Market cannot sell
people. `priceOf('survivor')` stays 0. Return stays. Tone
frozen in `docs/Pod02TraffickingDesign.md` (Wave 65).

- Pods remember the survivors' faction and whether the player destroyed their
  ship or merely recovered them from an incident caused by someone else.
- Selling survivors from a ship the player destroyed harms standing with their
  faction.
- Selling survivors merely recovered from a pirate or other battle causes no
  victim-faction penalty.
- Recovered survivors can be sold through a black market or directly to the
  Gilded Chain as slaves.

This content needs clear tone and consequence design during grooming; the
wishlist records the requested systemic possibility without yet defining its
narrative presentation.

---

## Initiative EXP — Exploration, information, and data trade

**Status:** first impl DONE (Wave 74; brief Wave 73:
`docs/ExpDataTradeDesign.md`). Wave 82: drop **0.20**,
Archive own **400** / rival **900**, fixer launder **250**.
Unknowables dock still waits.  
**Player goal:** Exploration should reveal valuable knowledge, not only places
or ordinary commodities.  
**Likely areas:** mystery, landmarks/anomalies, scanning, contacts, faction
markets, cargo provenance and legality.

### EXP-01 — Discoverable knowledge

Explorers can uncover:

- galactic lore and mysteries;
- faction-specific intelligence valuable to rivals;
- anomalies and derelicts;
- landmarks;
- information from conversations;
- intercepted signals;
- discoveries in distant systems.

The Unknowables and Assembly are especially hungry for information about the
galaxy and one another.

### EXP-02 — Data crystals and data cubes

- Unknowable ships can drop data crystals when destroyed or when jettisoning
  cargo.
- Assembly ships can similarly drop data cubes.
- Both factions sell their own data items legally at their stations.
- Each faction pays highly for the other faction's data, creating a profitable
  two-way trade route.

### EXP-03 — Provenance and laundering

- Legitimately purchased data is legal.
- Data captured from a destroyed ship or stolen is illegal in its faction of
  origin.
- Illegal data can be laundered through suitable contacts or stations for a
  price and become legitimate cargo.

---

## Initiative BIO — Living ships, growth, and Abominations

**Status:** first impl DONE (Wave 72; brief Wave 70:
`docs/BioLivingShipsDesign.md`). Wave 82 graft list
**4000 UU**. Destroy-Abomination Beautiful **+5** (recap
−10 while the player still wears tissue). Wave 86 briefs:
BIO-01 obtain (`docs/Bio01ObtainDesign.md`), BIO-02
training (`docs/Bio02EvolutionDesign.md`), BIO-04
psionics (`docs/Bio04PsionicsDesign.md`). Wave 92 impl:
gift + pirate, Hangar train to heavy, Digit 5 psionic.
BIO-03 motion slice Wave 76; look/bake brief Wave 81;
look/bake impl Wave 95 (keep GLB + GPU). Living yards
sell six classes (Wave 94). Wave 93 names owned-hull
`heavy` → `frigate` train. Seed commodity omitted.
Wave 96 BIO-05 remaining brief
(`docs/Bio05AbominationsDesign.md`). Wave 97 owner close
(`docs/OwnerDecisionsWave97.md`): NPC grafted traffic
**off**; plated overlay **omit**; hangar badge **omit**;
ungraft **forbidden**. Player graft loop stays closed.
Wave 101 BIO-02 remaining career brief
(`docs/Bio02CareerDesign.md`). Wave 104 BIO-06 remaining
brief (`docs/Bio06CadenceDesign.md`); Wave 107 first
impl. Wave 105 BIO-07 brief
(`docs/Bio07BodiesDesign.md`); light + heavy NPC
slices. Wave 106 remaining four classes + bake.
Wave 107 BIO-08 gait brief
(`docs/Bio08LocomotionDesign.md`); first impl
Wave 108.
**Preserve:** The current living player ship is the quality benchmark. Its
organic form, alien skin, and swimming motion that intensifies with speed are
exactly the desired living-ship experience. Future work must not weaken it.  
**Likely areas:** bio progression, origins, ship acquisition and equipment,
Beautiful Ones content, Gilded Chain services, models/animation, reputation.

### BIO-01 — Ways to obtain a living ship

**Status:** yards + origin DONE (Wave 72). Remaining
obtain DONE (Wave 92; brief Wave 86
`docs/Bio01ObtainDesign.md`). Gift `hull_seed_gift` at
Sworn ≥ 50. Pirate seed rate **0.05**. Commodity **omit**
(Wave 93).

A player can obtain a living ship or seed by:

- choosing a Beautiful Ones origin;
- reaching maximum Beautiful Ones standing and receiving a ship seed as a gift;
- rarely pirating a seed from a Beautiful Ones ship;
- purchasing a seed as an extremely expensive commodity.

### BIO-02 — Growth and specialized evolution

**Status:** `bio.growth` scale already ships. Class
training DONE (Wave 92; brief Wave 86
`docs/Bio02EvolutionDesign.md`). Living `light`/`cutter`
→ `heavy` at Beautiful Hangar papers. Debit
`yardPrice('heavy')`. Wave 93 names living `heavy` →
`frigate` (`yardPrice('frigate')`, Trusted 25). Live
Wave 94 yards sell six living keys including frigate
(Wave 86 buy-omit is stale). No new class keys. No new
Digit. Ace / freighter train is the live dest ladder.
Career remaining brief Wave 101
(`docs/Bio02CareerDesign.md`): careers = loadout +
existing keys; kit mutate omit. Wave 102 PR1 labels
on Hangar Offers; Confirm hop stays class keys.

- Living ships can use conventional components.
- Beautiful Ones growth-and-training centers evolve a living ship into larger
  classes for a price.
- Evolution branches into specialized forms rather than following only one
  linear sequence.
- Supported forms should cover combat, mining, trade, exploration, stealth,
  support, and other viable careers.

### BIO-03 — Redesign the Beautiful Ones fleet

**Status:** motion Wave 76. Look/bake Wave 95 (GLB + GPU). Wave 105
light + heavy organic NPC slices. Wave 106 remaining four
classes (ace squid, cutter shark, frigate octopus, freighter
gardenback). Player CPU `makeLivingHull` stays the quality
bar. Anatomy-native gait first impl Wave 108.

The present Beautiful Ones NPC ships are more organic than conventional ships
but do not capture the magic of the living player ship. Rebuild their visual and
motion language around the player ship benchmark:

- truly organic, alien-looking skins;
- swimming motion responsive to speed;
- class identity through shape and size;
- marine-life *vibes* such as squid, octopus, whale, shark, dolphin, and manta;
- inspiration rather than literal copies of Earth animals.

### BIO-06 — Class-scaled living fin cadence

**Status:** remaining brief Wave 104
(`docs/Bio06CadenceDesign.md`); first impl Wave 107
(`src/game/living-cadence.js`). Light idle 0.5 /
cruise 2.3 honor. Larger living remounts and
Beautiful NPC use class `hzScale` / `sweepScale`.
NPC speed-norm is class cruise. Mixer `timeScale`
untouched.

The larger Beautiful Ones ships currently flap their fins too quickly at high
speed. The result looks frantic and lightweight rather than like a massive
living creature moving with strength.

- Scale fin-stroke cadence progressively by ship class and physical size.
- Small living ships can use quicker, more agile strokes.
- Each larger class should move its fins more slowly and powerfully than the
  class below it, producing a clear gradient across the fleet.
- Large ships should communicate force through deliberate sweeps, stronger
  follow-through, and the movement of their greater mass rather than rapid
  flapping.
- Preserve speed responsiveness within every class: acceleration and high speed
  can intensify the animation, but a large ship's maximum cadence must still
  remain visibly slower than a small ship's.
- Avoid one universal animation-speed multiplier; cadence, sweep strength, and
  body response should be tuned together so the motion remains organic.

**Acceptance direction**

- A side-by-side review of all Beautiful Ones classes at idle, cruise, and high
  speed shows a smooth, monotonic cadence gradient from smallest to largest.
- The largest ships never display the current frantic high-speed flapping.
- Large-ship strokes feel heavier and more powerful without looking sluggish,
  frozen, or disconnected from propulsion.
- Small ships retain their agility and faster living motion.
- The player living ship remains the quality benchmark and is not weakened by
  fleet-wide tuning.
- Reduced-motion behavior and animation performance remain intact.

**Regression risks to call out:** large fins appearing frozen; lowering cadence
without adding enough sweep authority or follow-through; class transitions that
are abrupt instead of graduated; breaking the link between travel speed and
living motion; unintentionally changing the player ship's established feel.

### BIO-07 — Distinct species-inspired living ship bodies

**Status:** remaining brief Wave 105
(`docs/Bio07BodiesDesign.md`). First slices: light +
heavy NPC organic rebake. Wave 106 remaining four
classes + shared foundation + bake. Gait leftover
is BIO-08.

The current three Beautiful Ones ship sizes reuse the same basic model shape.
They should instead represent different ocean-life inspirations while remaining
recognizably part of the same Beautiful Ones lineage.

- Do not create the size range by scaling one shared body up and down.
- Give each class or major size tier a distinct primary silhouette, anatomy, and
  locomotion character inspired by different marine life.
- Draw from squid, octopus, whale, shark, dolphin, manta, and other ocean forms
  without producing literal replicas of Earth animals.
- Match motion to anatomy: fins can sweep, mantle-like bodies can pulse,
  tentacular forms can trail and contract, and massive bodies can undulate with
  slower whole-body force.
- Maintain a coherent shared style through alien skin, biological construction,
  color and bioluminescence language, surface detail, and the established player
  living ship quality bar.
- Shape and motion should communicate both class role and scale before the HUD
  identifies the ship.

**Acceptance direction**

- The three current size tiers are immediately distinguishable from black
  silhouettes alone and are not recognizable as resized copies of one mesh.
- A side-by-side fleet view shows several marine-life inspirations within one
  coherent alien species/culture rather than an unrelated collection of animals.
- Each body's animation feels native to its anatomy and follows BIO-06's size-
  based cadence gradient.
- Surface treatment and animation retain the magic of the current living player
  ship instead of merely adding organic textures to conventional hull shapes.
- Revised bodies preserve their intended class roles, readable scale, targeting
  bounds, collision behavior, LOD quality, and performance budgets.

**Regression risks to call out:** creating a visually incoherent "aquarium";
making Earth species references too literal; changing only appendages while
leaving the same underlying silhouette; losing class readability; mismatched
collision/targeting proxies; weakening the current living player ship to make
the NPC fleet uniform.

### BIO-08 — Anatomy-native living gait

**Status:** remaining brief Wave 107
(`docs/Bio08LocomotionDesign.md`); first impl
Wave 108 (`src/game/living-gait.js`). Light CPU
honor. Beautiful NPC one shader + gait floats.

BIO-06 scales Hz and sweep by class. BIO-07 bodies use four
plans. Live GPU swim is still one spine-and-flap shader.
Gait biases axes per class without retuning the cadence
table and without a universal mixer scale.

### BIO-04 — Psionic weapons

**Status:** DONE (Wave 92; brief Wave 86
`docs/Bio04PsionicsDesign.md`). Digit 5 `WEAPONS.psionic`.
Living, unset `hullKind`, and `grafted: true` only.
Conventional guns stay. Heat only. Unknowables miss.

Living and psionic weapon families remain to be designed. Psionic weapons are
restricted to living ships and Abominations.

### BIO-05 — Abominations

**Status:** player loop DONE (Wave 72 graft; Wave 82
4000 UU and destroy +5). Remaining brief Wave 96
(`docs/Bio05AbominationsDesign.md`). Wave 97 owner close
(`docs/OwnerDecisionsWave97.md`): NPC grafted traffic
**off**; plated overlay **omit**; hangar badge **omit**;
ungraft **forbidden**.

- Gilded Chain stations or shipyards sell grafted living parts.
- Grafts can transform any conventional hull into an Abomination.
- An Abomination is a conventional ship bearing living-ship tissue or parts.
- Owning/flying an Abomination produces immediate enemy standing with the
  Beautiful Ones.
- Destroying an Abomination grants immediate friend standing with the Beautiful
  Ones.

**Regression risks to call out:** weakening the current player-ship animation;
making marine inspiration too literal; conventional components visually
clashing with living tissue; irreversible faction hostility without warning;
growth invalidating installed equipment or cargo.

---

## Explicitly deferred or not currently requested

- General technical debt, architecture, tooling, and developer workflow are not
  wishlist priorities unless they directly block a selected player-experienced
  improvement.
- Music, radio chatter, and station ambience are not current audio priorities.
- Additional onboarding needs are unknown until the owner has more play time.

Necessary implementation support—tests, migrations, performance protection,
security review, and verification—still belongs inside a wave's definition of
done even though it is not itself mined as a player-facing wishlist item.

---

## Open questions for future grooming

**Closed Wave 112** (`docs/OwnerDecisionsWave112.md`).
Live knobs consume. No new family, Digit, SKU, or
persist key. Owner may override after playtest.

- Extra weapon families: **none** (live `WEAPONS` is the set).
- Mount / ammo / power / heat / mass: **four live laws**; no mount power ledger.
- Scanner tiers: **arc only**; core HUD stays ungated; no Mk III.
- Yard inventories: **six live classes**; no seventh class.
- Prices / ranks: **keep** `YARD_LIST_UU` / `MIN_REP` / `RANK_LADDER`.
- Collision curve: **keep** `IMPACT_MIN_SPEED` 8 and `0.35` / u/s.
- Ordinary deadlines: **600 s** for every renewable family.
- First mission family: **mining** (Wave 71 DONE).
- Seeds: hangar hulls (gift / pirate 0.05 / market 40000); not cargo.
- Abomination cleanse: **no**; ungraft forbidden; Confirm is the warning.
- Trafficking: Gilded Digit 7 only; 160 / 240 UU; Market never sells people.

## Interview provenance

This wishlist was initialized from a one-question-at-a-time owner interview on
2026-08-16 and 2026-08-17. It records desired outcomes expressed during that
conversation. When implementation evidence conflicts with an assumption in
this document, preserve the desired outcome and update the assumed mechanism.
