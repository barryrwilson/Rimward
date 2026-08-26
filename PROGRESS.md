# RIMWARD Web — Cross-Session Progress Tracker

Source of truth for what is built vs. planned. Update at the end of every wave.
Goal doc: `rimward-game-elements-omp.md` (NOTE: file on disk is TRUNCATED — only
§25–29 survived; §26 priority ladder and §29 product test are the steering inputs).

## Priority ladder (goal doc §26) — status

| # | Harness | Status |
|---|---------|--------|
| 1 | Flight toy (steer/throttle/strafe/drag/chase cam/afterburner/drift) | DONE (wave 1) |
| 2 | Readable duel (projectiles, lead, screen/shell, disable, one hostile) | DONE (wave 1) |
| 3 | Fear encounter (resolve, telegraphs, surrender, jettison, scoop, restraint econ) | DONE (wave 1: hail.js, npc.js resolve bands, ransom/tribute) |
| 4 | Small living system (traffic identities/routes, market, incidents, persistence, aftermath) | DONE (wave 1: world.js, save.js, witness rule) |
| 5 | Sandbox in miniature (trade, mine, pirate, hunt, serve, dock, buy/sell, rep/fear) | DONE (wave 1: mining, bounty/patrol/haul jobs, restricted locker) |
| 6 | Neighborhood (one authored system worth learning) | DONE (wave 2: freehold + veridian, jump gates, migration) |
| 7 | Broader world (more systems, factions, contacts, jobs, event variety) | DONE (waves 3-4: 3 systems, gate network, contacts/ranks, 5 job kinds, 6 event kinds) |
| 8 | Rimward journey (distance bands, sparse travel, mystery clues, landmarks, silence) | DONE (wave 5: bands 0-2, Hollow Reach, clues/landmarks, band pacing) |
| 9 | Living companion (visual/emotional/parity targets) | DONE (wave 5: mood bioluminescence, breathing, scars, growth, death tenderness) |
| 10 | Content and polish (faction epics, origins, audio, visuals, accessibility, onboarding) | DONE (wave 6: 4 faction epics + Standing service, 5 origins, 15-cue audio pass + adaptive beds, a11y settings, onboarding hints; plus mystery convergence + ace arc) |

## Wave 3 scope (historical)

- Gate network: `SYSTEMS[id].gates = [{position, to}]` replaces single `.gate`.
- Third system: `redmarch` ("The Redmarch"), home of the Red Ledger faction,
  connected veridian ↔ redmarch. Open restricted-component trade, pirate-heavy cast.
- Job variety: bounty on named pirates (reuses witness-rule incident claim).
- World-event variety: 2 new event kinds with market pressure.
- Boot test: third-system jump chain + new content checks.

## Architecture contracts (do not break)

- `src/core/ctx.js` header = ownership rules + frozen event vocabulary.
- `src/game/state.js` = all tuning/data; positions plain `[x,y,z]` (JSON-safe).
- world records/incidents/aftermath/markets must stay JSON-plain (save.js).
- Per-system content rebuilds on `'systemLoaded'` (solarsystem, asteroids, station, gate).
- Verify with `npm run test:boot` (headless harness, must end BOOT TEST PASS).
- Systems init order in main.js is load-bearing (comment explains).
- `ctx.asteroids.list` entries carry `{ id, position, radius, ore, commodity,
  oreKey, hardness }` with `id === array index` — combat.js and hud.js both
  dereference it, and 'mineHit'/'mineBlocked' asteroidId semantics ride on it
  (wave 51).
- Asteroid look is DATA: `ORE_TYPES[key].rock` owns shape, craters,
  axisJitter and the `surface` recipe; asteroids.js holds no per-ore
  constants and rock-surface.js reads the recipe only (wave 52).

## Wave history

- Wave 1 (commit f472903): full baseline — flight, combat, resolve/fear, traffic,
  market, jobs, bio companion, save, HUD. Boot test passing.
- Wave 2 (in f472903): second system, gate/jump, migration, per-system rebuilds.
- Wave 3 (commit 4d9c3af): gate network (SYSTEMS.gates[]), third system The Redmarch
  (Red Ledger home, open restricted trade), bounty-pirate jobs, pirate record
  bounties, convoySurge + oreRush events, migration over random gate. Boot test
  extended to 3-system jump chain. PASS.
- Wave 4 (commit e8b7342): contacts (src/game/contacts.js — 6 named station NPCs,
  trust/favors/witness-rule rumors/recognition lines, persisted via WORLD_FIELDS),
  RANK_LADDER + rankFor, station 'people' service, fence favor opens freehold
  restricted locker per-session, fixer markup on restricted sales, ferry job
  (350, fronted consignment) + recovery job (300, wreck salvage pod).
  Boot test wave-4 section drives real dock/UI/DOM paths. PASS.
- Wave 5: ladder #8 + #9. state.js: band 0-2 per system + BANDS pacing table
  (event/chatter/song gap multipliers), 4th system Hollow Reach (band 2, sparse
  cast, gate redmarch↔hollowreach, FACTIONS.hollow), authored landmarks[]/clues[]
  on all systems. src/game/mystery.js: proximity discovery (clue 35u, landmark
  100u), permanent per id, ctx.world.mystery {found,visited} persisted via
  WORLD_FIELDS, 'clueFound'/'landmarkFound' events, echoes-3 milestone.
  src/systems/landmarks.js: per-system POI meshes (wreck/beacon/monument/anomaly
  + clue motes), rebuild+dispose on systemLoaded, dim-when-discovered.
  Designed silence: world event gap, song phrase gap, and band-aware arrival
  commLine all scale by BANDS (npc.js had no ambient chatter to scale).
  Bio parity: bio.js growth (bond+feedings→0..1) + fedCount; ship.js mood
  bioluminescence (lerped emissive tints), breathing scale pulse, 5 wound
  scars, +15% growth scale. save.js: 'mystery' persisted; death now wounds the
  bio (freshStart keeps+pains her; reload leaves her anxious) instead of
  resetting. HUD: ECHOES tally. Boot test wave-5 section: 4-system jump chain,
  band pacing, clue/landmark discovery + permanence, mystery save roundtrip,
  death tenderness, feral/scar/growth visuals. PASS.
- Hotfix: itemized repair pricing (REPAIR_RATES hull 0.9 / screen 0.3 /
  shell 0.5 / engine 0.6 UU per point, per-part ceil, breakdown in the yard
  UI) replaces flat REPAIR_RATE. NaN hardening: repairCost treats non-finite
  channels as corrupt (unbillable) and repairAll re-trues them against the
  class baseline instead of copying NaN back; save.js sanitizeRestored heals
  non-finite/null numerics (player record, credits/fear, bio, ship transform)
  at the restore boundary — corrupt live saves self-heal on next load.
  Boot test: deterministic repair-cost check, corrupt refit check, boundary
  heal check; harness pinned unkillable after wave-1 combat assertions
  (random soak deaths were flaking the wave-4 favor section via death-restore
  roster swap). PASS.

- Wave 6: ladder #10 + the two queued candidates. state.js: ORIGINS (5,
  situations-not-personalities), EPICS (4 factions × 3 stages, requirements
  rankTier|cluesFound, effects sell/buy/repair/jobPay/restrictedSellMult +
  pirateResolveMod), ACES.hunter (Sister Vane, fear-25 injected Red Ledger
  Named Gun), CONVERGENCE (clues-3 hint → Hollow Reach anomaly site →
  milestone + songShift), DEFENSE.shellRechargeTime 20 (latent wave-1 NaN —
  tickShipState divided by an undefined constant, NaN'd shell + resolve).
  ctx.js: ctx.settings (settings.js ONLY writes; everyone reads live),
  flags.saveRestored, 4 new frozen events ('epicStage','originChosen',
  'convergence','songShift'). save.js WORLD_FIELDS += epics/origin/
  onboarding/aceRivalry. src/game/epics.js: one-stage-per-frame advance +
  pure epicEffects(); station.js: 9th service 'Standing' (APPENDED after
  launch — hotkey digits map to array order) + all transaction multipliers.
  origins.js: fresh-boot origin overlay (pauses, Digit1-5/click, restore-
  style startSystem rebind for drifter). onboarding.js: 8 one-time hints,
  seen persisted, hints setting live. Mystery: convergeHinted/converged on
  the mystery record, landmarks.js renders the anomaly post-hint and dims on
  converged. Ace arc: aceRivalry {defeats,lastOutcome,hunterSpawned}, Illyx
  rematch (+15 resolve, 'Again.'), recognition lines at fear 15/25, 'respect'
  hail intent (peaceful stand-down, no econ), contacts crown-line ack.
  song.js: 15 new cues, live masterVolume/muted, combat bed, dock ambience,
  songShift answer-voice (the §29 last line). Visuals: burner trail, bolt
  glow + impact sparks, gate charge swirl, starfield parallax + band
  sparseness — all reducedMotion-aware. A11y: settings.js KeyO panel
  (colorblind/contrast/reduced-motion/text-scale/volume/mute/hints,
  localStorage 'rimward-settings-v1'), Okabe-Ito + contrast palettes via CSS
  vars, aria-live toasts/banner, hull LOW/CRIT text flag, clue/landmark
  toasts with Echo-commLine dedupe. Boot test: wave-6 section (origin pick
  FIRST — its digit listener would eat wave-4 station keys — then
  onboarding/epics/ace/convergence/audio/settings/WORLD_FIELDS roundtrip).
  Fix folded in: epics.js/onboarding.js re-resolve their world records per
  frame (save.js swaps fields wholesale on restore; init-time captures
  orphaned — same discipline as mystery.js). PASS. Browser-verified: origin
  overlay, settings panel live-apply + persistence, Standing service.
- Wave 7: depth queue (all five candidates). state.js: SYSTEMS.hush ("The
  Hush", band 3, hollow faction, station Threshold, gate hollowreach↔hush,
  landmarks th_lanes_end + th_first_garden, clues th_c_keeper/th_c_song),
  BANDS[3] (near-total silence), DEEPENING (post-convergence rung: converged
  + 5 clues → hint → site 'The Answer' in hush → milestone + 'deepening'
  event + second songShift {reason:'deepening'}; flags mystery.deepHinted/
  deepened), ACES.hunter.lineage (maxGenerations 3, respawnDelay 90, +12
  resolve/gen, bounty ×1.5^gen), EPICS 4th capstone stages (requires gained
  landmarkVisited/converged/deepened/credits/fear; effects still Object.assign
  — capstone values are totals), ORIGIN_ARCS (creditor: 240 s calls ×3, −3
  redledger rep each, 3rd injects Collector Dresk into current bank, clear at
  credits ≥ 0 → milestone 'debtCleared' +10 rep; one-time payoffs for
  marked/beautiful/drifter/greenhand). ctx.js froze 'deepening',
  'lineagePassed', 'creditorCall', 'originPayoff'; save.js WORLD_FIELDS +=
  'originArc'. world.js: spawnHunterSuccessor + aceRivalry hunterGeneration/
  hunterDownAt (defeat → successor same-name new-pilot after delay; last
  bearer's defeat → milestone 'namedGunBroken'), originArcTick (creditor +
  payoffs, per-frame re-resolved). npc.js: Illyx rematch ladder
  (record.rematchCount 0..2, +15 each, cap 95; 'Again. Again.'), Vane
  recognition lines by generation. epics.js: stageHolds extension + watched
  cache (visited count, converged/deepened, fear, credit bucket ÷500).
  song.js: deep voice a fifth below the phrase root joins after the deepening
  shift. landmarks.js: The Answer anomaly post-hint, dims on deepened.
  hud.js: toasts for the four new events. jump.js band-3 arrival line;
  starfield BAND_OPACITY[3]. Boot test wave-7 section: 5-system jump chain,
  deepening chain, lineage to namedGunBroken, Illyx ladder, all four
  creditor arc + collector, payoff no-refire, save roundtrip.
  PASS first run.
- Wave 8: band 4 + the two lineage/origin candidates. state.js:
  SYSTEMS.verge ("The Verge", band 4, hollow faction, station The Vigil,
  gate hush↔verge, landmarks vg_choir_stones monument + vg_unfinished
  anomaly, clues: [] mandatory-empty — authored clue count stays 6),
  BANDS[4] (eventGapMult 5.0, chatterMult 0.05, songGapMult 6.0 — the
  quietest band), ACES.illyx.lineage (maxGenerations 2, respawnDelay 120,
  +10 resolve/gen, bounty ×1.4^gen), ORIGIN_ARCS.ledgerDebt.round2
  (reenteredDebt gate: 180 s calls ×2, −5 redledger rep each, creditorCall
  stages 4–5, last call re-sends a fresh Collector Dresk into the current
  bank + Whisper commLine, clear at credits ≥ 0 → milestone
  'debtClearedAgain' +5 rep), ORIGIN_ARCS.beats (beautiful at growth 0.4/
  0.75; marked at fear ≥ 25 with veridian rep < 0, then rep ≥ −5; each
  fires once before the existing payoff). ctx.js froze 'originBeat' {id,
  line} + vocabulary; aceRivalry gains illyxGeneration/illyxDownAt
  (defaults 0/null with ??= guards at all four literal sites), originArc
  gains calls2/lastCallAt2/collectorSent2/reenteredDebt/debtClearedAgain +
  beautiful1/beautiful2/marked1/marked2 with a normalization ??= block for
  old saves. world.js:
  spawnIllyxSuccessor (gen-0 defeat stamps illyxDownAt; after 120 world-s a
  new 'Carver Illyx' joins the freehold bank — resolve 65, bounty 3500,
  rematchCount 0, cargo restrictedComponents ×4 — emitting 'lineagePassed'
  {generation:1}); the successor's defeat fires milestone 'illyxLineBroken';
  no third Illyx spawns. originArcTick: round-2 creditor branch + beat
  checks. npc.js: illyxGeneration ≥ 1 switches his recognition to the kin
  line, priority over the 'Again.' rematch lines; Vane path unchanged.
  hud.js: ✧ sting toast for 'originBeat'. jump.js: 5th arrival line;
  starfield BAND_OPACITY[4] 0.22. Boot test wave-8 section: verge jump leg
  (band 4 + silent arrival line), verge content (clues stay 6, both
  landmarks discovered), Illyx lineage to illyxLineBroken (no third
  spawn), repeat-debtor round 2 (stages 4–5, second Dresk, no third
  round), beautiful/marked beats no-refire on fresh harnesses, originArc/
  aceRivalry round-2 + lineage save roundtrip. PASS.
- Wave 9: all three queued candidates (origin beats ×2, no-Named-Guns
  reaction, hermit economy). state.js: ORIGIN_ARCS.beats gains drifter
  (drifter1 at the first EARNED clue — mystery.found ≥ 2, the origin
  grants rm_c_tally at pick; drifter2 at mystery.convergeHinted) and
  greenhand (greenhand1 at any faction |rep| ≥ 10 or fear ≥ 10; greenhand2
  at any faction rep ≥ 25) — both payoffs unchanged; NAMED_GUNS
  { brokenResolveMod −5, fearBonus 5 } after ACES; HERMIT { buyMult 1.25,
  sellMult 1.25, walkMult 0.25, line } after BANDS; SYSTEMS.verge.hermit.
  world.js: originArcTick fires the four new 'originBeat's once each
  (arc flags drifter1/2 + greenhand1/2 in the ??= literal, the initWorld
  literal, and the old-save normalization block); per-frame, once
  milestones hold BOTH 'namedGunBroken' and 'illyxLineBroken',
  fireMilestone('rimWithoutGuns', …) fires once and only that first fire
  adds NAMED_GUNS.fearBonus to world.fear. npc.js: updateResolve adds
  brokenResolveMod to pirate personality while 'rimWithoutGuns' stands
  (non-pirates untouched). market.js: tickPrices scales ONLY the random-
  walk step × HERMIT.walkMult for hermit systems (event-pressure pull
  unchanged). station.js: hermit stations charge round(price × buyMult ×
  1.25) on buy, sell chain gains × 1.25 after the tier multiplier, the
  market PRICE cell shows the hermit buy price, and the first successful
  trade pushes 'hermitMarket' into world.milestones + emits 'milestone'
  (guard-push-emit, world.js fireMilestone semantics). No new event
  types, no new WORLD_FIELDS (originArc + milestones already persist).
  Boot test wave-9 section: rimWithoutGuns fire-once + exact fear bump +
  pirate resolve delta (39→44, RESOLVE_INTERVAL-throttled — the harness
  forces ai.resolveAt), greenhand + drifter beats on fresh harnesses
  (drifter = Digit5), hermit data/pricing/milestone via real market-UI
  clicks, pinned-RNG walk-rate ratio (verge drift 3 vs hush 8-9), and a
  wave-9 save roundtrip (greenhand1 + both milestones). PASS ×5 runs.
- Wave 10: all three queued candidates (successor aspirant, hermit
  pirate, deep-rim contacts). state.js: NAMED_GUNS.aspirants
  { fearThreshold 50 (= ECON.fear.lawfulClosesAt — the top of the fear
  economy), respawnDelay 150, resolve 75, bounty 4000, names ['Harrow
  Quist','Saint Ruvic','Ash Bell'], lines ×3 } — new NAMES, not mantles:
  each rises once, in order, then the rim stays quiet. world.js:
  aceRivalry gains aspirantRisen/aspirantDownAt/aspirantFlying at all
  four literal sites + ??= normalization (wave-8 discipline);
  spawnAspirant (mirrors the successor spawns — makeRecord into the
  CURRENT system's bank, jittered gate↔planet ace route, role 'ace',
  faction 'independent', rec.aspirant = true, emits 'gunRisen'
  {name,line}); the update tick rises the next name once
  'rimWithoutGuns' stands and fear ≥ 50, one at a time (aspirantFlying),
  gated by respawnDelay after a fall; BOTH ace-defeat branches mark the
  fall (flying=false, downAt) and fireMilestone('aspirantBroken', …)
  once ever, generic ace bookkeeping untouched. PIRATE_NAMES.verge =
  ['Old Callow']; hermitPirateBeat — once ever ('hermitPirateMet'
  guard-push on world.milestones), verge-only, within 350u of his
  RECORD position (recordPosition into module _v1, no instantiation
  needed, zero allocation), emits 'commLine' from him: a remembers-
  the-lane line, or the cold variant ('You broke the Guns…') when
  rimWithoutGuns stands; dead record never voices. contacts.js: roster
  7 → 9 — Keeper Ond (contact-hush-dockmaster) + Keeper Leth
  (contact-verge-dockmaster), six dockmasters; recognitionLine gains
  deep-rim tiers for hollowreach/hush/verge only (priority trust ≥ 60
  > deepened > converged > aceAck): mystery.deepened fires once per
  keeper (sets deepAck1 AND deepAck2 — the deeper covers the shallower),
  mystery.converged fires once (deepAck1); undefined flags falsy on old
  saves, contacts ride WORLD_FIELDS 'contacts'. ctx.js froze 'gunRisen'
  {name,line}; hud.js ✦ sting toast; npc.js recognition: aspirant branch
  first ('No mantle. No lineage. I take my name from yours.'). No new
  WORLD_FIELDS. Boot test wave-10 section: full aspirant cycle on the
  continuing run (three rises with exact names/lines/record specs, one
  'aspirantBroken' ever, no fourth rise), Old Callow beat (silent from
  far, cold-variant hail once near, no refire), keeper acknowledgments
  (deepened on the continuing run incl. shallow-rim control, converged
  on a fresh harness), wave-10 save roundtrip (aspirant fields, both
  milestones, deepAck flags, no post-restore rise); wave-4 roster counts
  updated 7→9 / 4→6. PASS ×4 runs.
- Wave 11: all three queued candidates (aspirant aftermath, Callow
  returns + vouch, keeper value). state.js: CALLOW { hailRange 800,
  vouchCost 600, vouchTrust 15, offer/vouch/milestone lines,
  returnLines ×3 } after NAMED_GUNS. world.js: BOTH rec.aspirant defeat
  branches fire milestone 'rimAnswered' once the last name is spent
  (aspirantRisen >= names.length) and, on that first fire only, emit
  'songShift' { reason: 'aftermath' } — the rim's final word, not an
  ending (§25). Callow return beats: module callowVisitArmed arms ONLY
  on a 'systemLoaded' to verge that actually changes the system (a
  same-system restore re-emit is no return), disarms when the
  first-meet fires (returns voice on LATER visits only), and
  callowReturnBeat no-ops while docked; one rotating line per visit
  (rec.callowReturns ??= 0 on the verge pirate record, zero-alloc
  recordPosition into _v1). callowVouchOffer: hailPressed in the verge
  (met, !rec.vouched, credits >= 600, record within 800u, live ship
  carrying the record) emits 'hailOpened' { intents: ['callowVouch',
  'keepFiring'], line: CALLOW.offerLine }. hail.js: INTENT_ORDER gains
  'callowVouch' BEFORE 'keepFiring' (card buttons follow INTENT_ORDER —
  the purchase must be intent [1]; combat hails never include it, so
  their order is unchanged); the resolve deducts 600, sets
  live.record.vouched, bumpTrust +15 + addFavor on the hush/verge
  dockmasters, guard-push-emits milestone 'callowVouched', and answers
  with CALLOW.vouchLine — no fear, no surrender, no ai mutation (he was
  never bargaining). song.js: 'aftermath' sets answered → a barely-
  there octave voice (p.base × 2, gain × 0.2) joins — three-stage
  evolution, the chain ends there. contacts.js: KEEPER_LEDGER_TRUST 30
  + keeperLedgerLine — keepers read the two-column ledger: a rotating
  undiscovered-landmark reading derived from mystery.visited (witness-
  rule safe), closing line when the column balances. station.js:
  keeper trust >= 60 at a hermit station waives the ×1.25 buy markup
  (charge and PRICE cell agree; sell premium untouched); keeper
  'Call in a favor' comps the dock (repairs 0, 'Comped by the keepers',
  session-scoped exactly like fenceUnlocked); 'Ask around' reads the
  ledger before incidents. save.js: restore re-unifies
  recordBanks[currentSystem] = records — JSON duplicated the shared
  live-bank array into two copies, and a same-system restore (no
  systemLoaded, no swapToSystem) never re-adopted; latent since wave 3,
  first bitten by wave-11's record-identity consumers. Boot test
  wave-11 section: aftermath fire-once + persistence, Callow returns
  (whole-leg collection — his lane can cross the gate, and the meet can
  fire as early as the wave-8 arrival, so assertions are
  callowReturns-BASELINE-relative), the vouch through the real hail
  card (poll for the button before Digit1), ledger rotation +
  threshold + closing line, hermit markup waive via real market UI,
  keeper comp via real repair UI, save roundtrip (vouched +
  callowReturns). Gate hygiene (pre-existing flake, not wave-11 code):
  the wave-9 hermit-walk check read driftV === 0 whenever the verge dev
  history started above the hermit walk/mean-revert equilibrium (the
  rounded price sits constant there, ~1-in-4 runs); measureDrift9 now
  drags dev below equilibrium with a pinned-down random phase before
  measuring BOTH legs — deterministic driftV 4 / driftH 13.
  PASS ×7 runs.
- Wave 12: all three queued candidates (Callow's books on the player,
  the keeper clue tier, restore live-record hardening). state.js:
  CALLOW gains vouchedReturnLines ×3 (he knows the name sits in the
  second column; he never asks how it was spent, §25) and refuseLines
  ×2 ('I sell it once' — the column doesn't take seconds). world.js:
  callowReturnBeat draws from vouchedReturnLines once rec.vouched
  stands (SAME rec.callowReturns cursor, different page);
  callowVouchOffer's post-vouch branch (same hail gating: hailPressed,
  verge, met, live non-dead record within 800u, live ship carrying it)
  voices ONE rotating refusal commLine per verge visit — module
  callowRefusalArmed, armed beside callowVisitArmed on a real verge
  arrival (changed systemLoaded), disarmed on fire, rotated via
  rec.callowRefusals ??= 0 (rides recordBanks free); no hail card, no
  credits, no milestone — he was never bargaining. contacts.js:
  keeperLedgerLine becomes three tiers on the one ledgerIdx cursor —
  landmarks awaiting → the wave-11 reading verbatim; landmark column
  balanced + unfound clues → rotates the SYSTEMS holding an unfound
  clue (clue id not in mystery.found), naming the system display name
  ONLY (§25: never the clue's text or id; §8.7: recorded state only);
  everything witnessed and found → 'Both columns balance at last —
  nothing waits, and nothing stays unread.' save.js: restore() now
  calls healLiveRecords after the recordBanks re-unification — live
  ships instantiated pre-restore (death recovery keeps NPCs running)
  held ORPHANED record refs whose mutations never reached the bank,
  and a snapshot serialized with live ships could strand a restored
  record behind a stale live: true (traffic heals flags only on
  'systemLoaded', which a same-system restore never emits). The heal
  re-points ship.record to the bank record sharing its id, then
  rebuilds live flags: cleared on every record in every bank, set on
  exactly the records referenced by live ships in the current bank.
  Boot test wave-12 section: post-vouch return lines through the real
  sim (verge hops, baseline-relative cursors — the wave-11 second-hail
  watch deterministically consumes refusal #1, asserted as
  refusalsBaselineFromWave11), the refusal throttle (one per visit,
  re-arm on re-arrival, never a hail card), the keeper clue tier
  (single-unfound names exactly The Hush; emptied found rotates
  Veridian Reach → The Redmarch; no clue text/id leaks; new exact
  closing line), and the restore heal (live Callow ship parked outside
  the encounter bubble, dock autosave, playerDestroyed same-system
  restore → record re-pointed by identity, live flags rebuilt, no
  orphaned live flags in any bank). Wave-11 adaptations: the ledger
  section fills mystery.found with all six clue ids before its
  closing-line assertion (tier 3) with the new exact copy.
  PASS ×7 runs.
- Wave 13: both queued candidates (the keepers acknowledge the vouch,
  the comp-tier page names its landmark). contacts.js:
  recognitionLine's trust >= 60 branch opens with a once-per-keeper
  vouch tier — hush/verge dockmasters (the two keepers hail.js's
  'callowVouch' resolve actually writes to; Hollowreach's keeper never
  got the letter, system gate) with milestone 'callowVouched' standing
  and !contact.vouchAck set the flag and answer 'Callow's word arrived
  ahead of you — your name sits in our second column. The yard is
  yours.'; later docks fall through to the ship line (vouchAck rides
  the persisted contact record, undefined reads falsy on old saves,
  deepAck discipline). keeperLedgerLine tier 2 now collects
  { systemName, lmName } open pages — lmName the landmark nearest
  (squared distance over the authored position arrays) the system's
  first unfound clue, null-guard for a landmark-less system — and at
  the comp tier (60, station.js KEEPER_COMP_TRUST) narrows the reading
  to 'the page near The Tithe Stone waits to be read' (§25: still
  never the clue's text or id; the landmark name is authored,
  already-spoken tier-1 state). Below 60 the system-only line is
  byte-identical; tiers 1 and 3 untouched; same single ledgerIdx
  cursor. Boot test wave-13 section: pure calls (wave-12 b discipline,
  every mutation restored in place) — the vouch line byte-for-byte,
  fire-once per keeper (independent flags), ship-line fall-through
  computed from the live shipName, Hollowreach's system gate, the
  below-comp gate, and the milestone as witness (spliced out → no
  vouch line); the narrowed tier (nearest landmark computed from
  SYSTEMS in-test, never hardcoded — The Hush pairs The First Garden),
  the old shape at KEEPER_LEDGER_TRUST, no clue id/text leak, trust-60
  rotation naming different systems with each landmark nearest in its
  named system, and the unchanged closing line. PASS ×7 runs.
- Wave 14: both queued candidates (the vouch word carries the arrival
  comms, the narrowed page becomes a chart mark). contacts.js:
  keeperVouchArrival — exactly recognitionLine's vouch-tier gates
  (hush/verge dockmaster, 'callowVouched' standing, literal 60,
  !vouchAck) — sets the SAME contact.vouchAck flag and returns the
  shared VOUCH_ACK_LINE const (extracted module-level; recognitionLine
  returns it too), once per keeper across both surfaces. initContacts
  update() consumes 'systemLoaded' under a changed-system cursor
  (module lastSystemId; a same-system restore re-emit is no arrival —
  the wave-11 callowVisitArmed discipline; initContacts precedes
  initSave, so a cross-system load reads as an arrival) and voices the
  line as a commLine from the keeper's name — a fly-through hears
  Callow's word without ever docking. keeperChartMark — a comp-tier
  (literal 60) ledger keeper (all three, Hollowreach included) with
  tier 2 open (every landmark witnessed, unfound clues remain) marks
  the first uncharted open page's paired landmark: mystery.charted
  ??= [] (plain id list riding the persisted mystery record, undefined
  reads empty on old saves) gains the id, and a docked keeper emits the
  mark as a commLine on 'docked' — 'A mark on your charts — The First
  Garden, in The Hush. The page near it is yours to read.' Recorded
  state only: nothing rendered or revealed; §25 holds (authored
  landmark + system names, never the clue). The awaiting/openPages
  computation is now the shared ledgerColumns() helper (openPages
  entries gain lmId for the mark) — keeperLedgerLine's three tiers
  byte-identical. Boot test wave-14 section: pure gates (Hollowreach
  never, below-60 never, milestone spliced never, second call silent;
  the mark gated on tier 2 open and the comp tier, §25 no-leak,
  Hollowreach CAN mark, freehold never), a real verge→hush jump voicing
  Keeper Ond exactly once (the people card then falls through to the
  ship line; the verge keeper's flag untouched, its card still holds
  the word), the same-system re-emit staying silent, and the docked
  event path marking th_first_garden exactly once across two dock
  cycles — every mutation restored in place (wave-12 b discipline).
  PASS ×7 runs.
- Wave 15: the queued candidate (mystery.charted gains its readers —
  the mark did nothing but persist). contacts.js: keeperLedgerLine's
  tier 2 acknowledges a charted open page — the rotated entry's lmId
  in mystery.charted (?? [] for old saves, lmId null falls through
  uncharted) swaps the narrowing for the acknowledgment at and below
  the comp gate: 'the mark near The First Garden is yours now; the
  page waits to be read.' (trust >= 60, landmark named) / 'the mark
  on your charts is yours now; the page waits to be read.' (below 60,
  system only). Uncharted pages stay byte-identical to waves 13/14;
  tiers 1/3, keeperChartMark, and the ledgerIdx cursor untouched;
  §25 holds (landmark + system names, never the clue). hud.js +
  hud.css: the mark surfaces as a flight instrument — one pooled
  .rw-chartmark (diamond glyph + name/distance label, pointer-inert,
  aria-hidden — the mark was already announced by commLine) per
  charted-but-unvisited landmark of the current system, pool sized at
  init to the largest authored landmarks table (every node created
  once — the HUD performance contract), projected per frame through
  an init-scope scratch Vector3 with the target bracket's behind-
  camera flip and EDGE_MARGIN edge-clamp, transforms written on
  rounded-pixel change, labels (name + ' · Nu'/'k') on the ~5 Hz
  throttled cadence keyed on landmark id + distance bucket. All
  markers hide while docked (station screen up) and dim under
  .in-combat (§13.2); mystery is read FRESH each frame (save.js
  record-swap discipline) with shared EMPTY_LIST ?? guards — zero
  per-frame allocation. A witnessed landmark sheds its mark (visited
  filter); other systems' charted ids render nothing. Boot test
  wave-15 section: pure ledger gates (exact computed ack lines at and
  below the comp gate, byte-identical uncharted lines, §25 no-leak,
  delete-charted old-save guard, every mutation restored in place)
  and real-DOM HUD markers (docked all hidden, exactly one visible
  flying with the computed name + distance label, witnessing hides
  it, a cross-system charted id adds nothing, run left re-docked at
  Threshold). PASS ×7 runs.
- Wave 16: the queued station-screen surface, taken as a chart note
  on the keeper's People card — not a new service. contacts.js:
  exported chartedMarkNotes(ctx) — a pure UI-time reader over
  mystery.charted ?? [] and mystery.visited ?? [] (?? guards keep
  old saves empty), iterating SYSTEMS key order then each system's
  authored landmark-table order, returning { lmName, systemName }
  for charted-but-unvisited landmarks across systems, stale ids
  ignored, §25 names only. station.js imports it; renderPeople
  computes notes once and hangs them on keeper cards only (the
  existing isKeeper gate), regardless of local trust, rendered after
  the recognition/comp note and before the actions: container
  .people-chart, title exactly 'CHART MARKS — pages still waiting',
  each line .people-chart-line exactly '◇ lmName — systemName'.
  screens.css adds the people-chart/title/line styles and includes
  .people-chart-line in the high-contrast dim-text selector. Boot
  test wave-16 section: pure helper gates (hush-only exact note,
  SYSTEMS + same-system landmark-table order asserted with reverse
  charted push order, visited exclusion, stale-id tolerance, old-save
  missing charted key, every mutation restored in place) and real
  DOM gates (docked at Threshold, People opened by Digit7, exact
  title/lines asserted on Keeper Ond's card, §25 no clue id/text
  leak, a synthetic non-keeper hush fixer gets no chart while the
  keeper keeps the only chart, a visited-only chart hides the note,
  roster/mystery restored in place, run left docked at Threshold in
  hush). Final independent review approved the diff. npm run
  test:boot PASS ×7 runs; npm run build clean (only the pre-existing
  >500 kB chunk warning). Uncommitted.
- Wave 17: the standing polish/gate debt (the pre-existing wave-4
  recovery-board flake), reproduced before the fix in a seven-run
  baseline — one run found no offered card for the test-seeded aft-test
  wreck. Root cause was harness setup, not wreck expiry: random soak
  combat can stage a real unexpired veridian wreck before the test
  pushes aft-test, and station.js syncRecoveryJob posts one recovery
  card for the first in-system live wreck in aftermath order, so the
  soak wreck can occupy the board slot and starve the test card.
  scripts/boot-test.mjs now expires current-veridian soak wrecks
  through the real lifecycle before setup, then seeds a deterministic
  stale aft-collision wreck + offered recovery card and lets the real
  expiry/board-sync path clear both before pushing aft-test. The
  wave-4 accept gate gains recoveryCollisionCleared /
  recoveryCollisionPulled guards; the original offered/accept/pod/
  delivery assertions stay intact. Production code untouched. npm run
  test:boot PASS ×7 runs; npm run build clean (only the pre-existing
  >500 kB chunk warning). Uncommitted.
- Wave 18: the queued zero-behavior cleanup — the trust-60 comp tier
  was a literal repeated across contacts.js (recognitionLine, the
  vouch acknowledgment on both surfaces, the narrowed ledger page,
  the chart mark) and duplicated as a station.js-side const for the
  waived hermit markup / comp note. contacts.js now exports
  KEEPER_COMP_TRUST = 60 beside KEEPER_LEDGER_TRUST; every gate reads
  the shared constant and station.js imports it instead of keeping
  its own. No numeric rebalance; every 60-gate still also carries its
  independent system/milestone/ledger gate, and the boot-test
  harness keeps its own literal 60 pins (it asserts the number
  independently). Comments referencing the old 'literal 60' /
  'station.js KEEPER_COMP_TRUST' convention updated. During
  verification a pre-existing, unrelated boot-test flake surfaced:
  one run in the first batch failed JUMP TEST on veridianSpread
  (provisions not > provBefore × 1.1 after the freehold→veridian
  hop). Reproduced on the untouched wave-17 tree in a scratch
  worktree (1 failure in 20 runs there vs 1 in 52 with the change) —
  the wave-18 diff does not touch pricing; suspected cause is the
  soak-event price band occasionally compressing the spread the
  check assumes. Tracked as a wave-19 candidate below. npm run
  test:boot PASS ×51 of 52 runs (the one fail being the pre-existing
  jump-check flake); npm run build clean (only the pre-existing
  >500 kB chunk warning).
- Wave 19: the wave-18-surfaced boot-test flake. Root cause: a soak
  world event's market pressure (laborStrike pulls provisions toward
  +34% of baseline; the fractional deviation outlives the event —
  PRESSURE_PULL 0.06/s) leaves freehold's provisions price inflated
  when the jump checks sample provBefore, compressing veridianSpread
  (135 > provBefore × 1.1). Reproduced on the untouched tree twice
  (event=laborStrike at soak end, veridianSpread:false; base rate
  2/80 runs). Fix is harness-only, scripts/boot-test.mjs: a
  settlePrices(label) helper ends any active/due event through the
  real endEvent path (endsAt = time - 1, a 1-tick pre-check forces a
  due event to start so it can be cleared — the wave-9 walk
  pattern), then decays the residual deviation with 300 price-only
  tickPrices(ctx, 0.5) calls — NO world ticks, so traffic, migration,
  and cast counts are untouched (an earlier whole-world-tick settle
  broke castMatches via migration churn and was reverted). Applied
  before the freehold provBefore sample and after the redmarch soak
  (same latent exposure: a mid-window commodityGlut on provisions can
  drag 130 below the 100 floor). The veridian hop needs no settle —
  first-visit table is built at baseline and the 4 s window bounds
  any mid-window pull. Deterministic proof: an injection variant
  forcing laborStrike pressure + fully pulled deviation (provisions
  135, the exact flake condition) recovers to 100 through
  settlePrices and passes every gate. Rates over 150 runs: jump
  flake 2/80 base → 0/70 fixed; the two remaining pre-existing
  flakes (wave-9 hermit walk driftH vs driftV ratio, redmarch
  castMatches migration arrival) held at base rates (2/80 → 3/70 and
  0/80 → 1/70 — same within noise). Production code untouched.
  npm run test:boot PASS ×7 final runs; npm run build clean (only
  the pre-existing >500 kB chunk warning).
- Wave 20: the two remaining pre-existing boot-test flakes, both
  harness-only in scripts/boot-test.mjs. (1) wave-9 hermit walk
  (hermitWalkSlower, base 2/80, fixed-tree 3/70 in wave-19
  measurement): endEvent zeroes the pressure target but not the
  fractional deviation already built up, and PRESSURE_PULL decays it
  ~0.1%/world-tick, so dev inherited from soak history survived the
  600-tick preDrag (~55% remains) and shifted the p0 sample —
  observed driftV=4 vs driftH=5 and negative driftH. measureDrift9
  now settles the residual deviation with 300 price-only
  tickPrices(ctx, 0.5) calls after the event-clear pre-check and
  before preDrag, with Math.random pinned to 0.5 during the settle
  (under the ambient 0.9 pin the walk's positive expectation would
  equilibrate dev at ~+0.107 × walkMult, not ~0) and restored to 0.9
  for the measurement. Assertions unchanged (vergeWalkedUp,
  hushWalkedUp, hermitWalkSlower with the 2.5× slop). (2) wave-3
  redmarch castMatches (base 0/80, fixed-tree 1/70): inter-system
  migration (world.js §8.2) marks an enroute veridian trader
  inTransit with a 60–120 s eta; a pick made during the wave-2
  veridian visit lands mid-soak and pushes records to 14. The bank
  is now snapshotted by reference right after the jump tick
  (pick → snapshot is ~40–45 s < 60 s min eta, so the Set IS the
  seeded cast) and castMatches asserts the seeded 13 records survive
  exact (5 trader / 7 pirate / 1 patrol / 0 ace, membership in both
  records and the snapshot) while tolerating only extra records that
  are traders — pickMigrant guarantees arrivals are traders;
  anything else is cast drift. No >= / <= weakening. Production code
  untouched. npm run test:boot PASS ×70 runs, 0 failures (base flake
  rates 2/80 and 1/70); npm run build clean (only the pre-existing
  >500 kB chunk warning).
- Wave 20 follow-up: post-commit verification at scale found the
  hermit-walk flake NOT closed — 12/540 runs failed with an identical
  signature (driftV=4, driftH=9; the committed entry's residual-dev
  theory was wrong). Trajectory instrumentation (per-60-tick price
  sampling in a scratch harness copy) showed hush's provisions dev
  pinned at the −PRICE_BAND clamp from the settle onward (afterSettle
  114 = round(190×0.6), drag flat, window crawling off the floor to
  +9). Root cause was production, not harness: a cross-system
  event-pressure LEAK — a commodityGlut firing while docked in hush
  (provisions pressure −1) whose endEvent ran after the player jumped
  away, so applyEventPressure('clear') deleted the CURRENT system's
  entry and left hush pressured at the −40% floor for the rest of the
  session. The settle then pinned dev to the pressured target and the
  clamp broke the measurement's differential invariance (any constant
  pressure otherwise cancels — drift is target-invariant ≈ 13.3 off
  the clamp). Fix at the source: startEvent stamps activeEvent.system
  and endEvent clears THAT system's pressure (applyEventPressure gains
  an optional systemId, used only by 'clear'; unstamped events fall
  back to current-system behavior). Harness keeps the wave-20 settle
  and gains a retry-on-mid-drag-event (the old post-clear fall-through
  would have sampled pressure-polluted p0). Deterministic proof
  (scratch script, removed after use): glut-in-hush → depart → clear →
  revisit recovers to the walk equilibrium under the fix, stays
  clamped at 60 under the old path. npm run test:boot PASS ×300 runs,
  0 failures (measured flake rate 12/540 → 0/300); npm run build
  clean (only the pre-existing >500 kB chunk warning).
- Wave 21: the 100-system rim becomes playable. state.js merges the six
  authored systems with `src/game/galaxy.generated.js` (94 generated,
  deterministic SEED 20260808 from `scripts/generate-galaxy.mjs`); authored
  key order stays first for contacts.js ledger iteration and generator
  validation rejects authored-id collisions. Generated systems carry chart
  coords, station/field/cast/worldSeed/planetCount/priceBase, bands 1–4,
  physical gates plus the hub-route exception (hub H reaches X through
  `hub.routes`; X keeps a physical back-gate X→H), and the Ten Banners
  factions. `scripts/galaxy-map.mjs` renders the network to `galaxy-map.svg`
  (data-fitted transform, gate/hub-route layers, accessible title/desc,
  escaped labels, readable dim bands). world.js replaces the per-frame
  all-bank migrant scan with an in-transit registry rebuilt on systemLoaded
  and on recordBanks reference swaps, so same-system save restores cannot
  strand restored migrants; contacts.js roster names gain a defensive
  fallback for generated systems. gate.js renders Lamplighter junctions at
 `hub.position`; G cycles `hub.routes` in authored order, D jumps the
 selected route, and HUD publishes `G route i/n · D — Jump to NAME` through
 the new ctx.gate nearHub/nearRouteIndex/nearRouteCount fields. jump.js
 arrives at `hub.position` when returning from a routed system; physical
 gate arrival rules are unchanged. `src/systems/galaxychart.js` adds the
 runtime M-key galaxy chart: 100 runtime-generated nodes, 133 physical
 edges, 25 hub routes, current-system highlight, keyboard/Escape/close
 controls, station-screen ownership while docked, and §25-safe route data
 only. Boot test wave-21 section drives the real KeyG/D hub flight to
 fh_hearth and back, the real KeyM chart DOM, the same-system migrant
 restore regression, degree<=3, pinned named-special bands, and all
 existing wave gates. Independent integration review found no
 HIGH/CRITICAL issues; the two LOW review items (chart open over docked
 station UI, G while paused) were fixed. Browser-verified: chart open/
 close/current-system updates, hub prompt and G cycling, D jump to
 fx_bastion, and junction arrival back at freehold. npm run test:boot
 PASS; npm run build clean (only the pre-existing >500 kB chunk warning).
- Wave 22: three of the queued candidates (junction silhouette, generator
  shared-data module, hub-route migration decision). state.js: the six
  authored-system records move verbatim into NEW src/game/authored-systems.js
  (zero imports, plain data, doc comment included); state.js imports it
  beside GENERATED_SYSTEMS, the wave-19 merge `SYSTEMS = { ...AUTHORED_SYSTEMS,
  ...GENERATED_SYSTEMS }` and its key-order comment are untouched.
  scripts/generate-galaxy.mjs: the hand-duplicated AUTHORED stub literal is
  replaced by a derivation from the shared module (Object.fromEntries over
  AUTHORED_SYSTEMS — faction/band/chart.slice()/gates.map(g=>g.to)/
  hub?.routes?.slice() ?? [], insertion order preserved, zero RNG consumed);
  all six ids diffed field-by-field against the old literal before deletion
  (MATCH ×6, hush/verge routes [] from absent hub keys); regeneration is
  BYTE-IDENTICAL vs HEAD (git diff --exit-code clean). Post-review the
  generated-file header template and the galaxychart.js comment stopped
  saying authored systems live in state.js (regenerated diff header-only,
  4 lines). gate.js: hub junctions gain the Lamplighter "lantern"
  silhouette — the standard ring/chevrons/glow/beacon/swirl stay (a
  junction is still a transit ring; charge intensification untouched) plus
  a counter-rotating hexagonal frame (6 brass bars, shared geometry,
  per-assembly material, circumradius RING_RADIUS×1.35, frozen under
  reducedMotion) and one slender brass arm PER ROUTE tipped with an amber
  lamp sprite ('junction-arm-lamp'); the selected route's lamp lerps
  scale 6→9.5 / opacity 0.45→1.0 from the live a.routeIndex (the same
  field the KeyG listener mutates — no copy to desync), giving route
  cycling visual feedback. Testability hooks without touching the ctx.gate
  ownership list: group.name 'lamplighter-junction'/'lamplighter-gate',
  userData.routeCount at build, userData.routeIndex mirrored per frame.
  rebuild() disposes hexMat + lamp materials per assembly; shared
  hexBarGeo/armGeo survive like ringGeo. Boot test wave-22 section
  integrates INTO the existing wave-21 hub flight (no second leg):
  w22hubChecks singleJunction/routeCountHook/armLamps parked pre-KeyG,
  routeIndexTracks/routeIndexWraps inside the existing KeyG loop,
  goneInHearth after the D jump, rebuiltOnReturn after the home leg;
  helpers w22junctionsAt/w22lampsIn traverse ctx.scene by name.
  world.js: the hub-route migration asymmetry is DECIDED lore, recorded
  as a comment on pickMigrant — physical gates only; Lamplighter
  junctions are player/Guild infrastructure; routed systems keep their
  sparse casts and the deep rim keeps its designed silence (BANDS).
  No code change; boot-test already documented the asymmetry by design.
  Independent review APPROVE (0 CRITICAL/HIGH/MEDIUM; the two stale-
  comment LOWs fixed inline above; the reducedMotion lamp-lerp LOW is
  compliant by design — selection feedback, not decoration). npm run
  test:boot PASS ×7 runs + 1 post-comment-fix confirmation run; npm run
  build clean (only the pre-existing >500 kB chunk warning).
  Browser-verified: junction hex/arms silhouette vs the plain ring,
  real KeyG cycling (ROUTE 1/4→3/4, prompt HEARTH→HAVEN→MERIDIAN), and
  the selected-route lamp emphasis (selected arm scale 9.5/opacity 1.0,
  others 6/0.45, emphasis advancing lamp-for-lamp with routeIndex).
- Wave 23: generated-system depth, part 1 (landmarks across the
  generated rim, generated-hub dockmasters, authored-lane ledger gate).
  scripts/generate-galaxy.mjs: every one of the 94 generated systems
  gains exactly one landmark { id '<sysId>_lm', name, kind, position,
  line } (kind wreck 31 / beacon 11 / monument 15 / anomaly 37,
  band-weighted — anomalies rise with band). Draws ride a SECOND
  mulberry32(SEED + 1) stream (lmRng/lmRint/lmRf beside rng/rint/rf)
  consumed ONLY in a new loop after the out{} flavor loop completes,
  iterating GENERATED_IDS in order — the main stream is untouched and
  the galaxy.generated.js diff is purely additive (1222 insertions, 0
  deletions; md5 identical across consecutive runs). Positions draw
  direction + 500–900u (y in [-120,160]), redrawn from the landmark
  stream (bounded 40, then fail()) until ≥400u station, ≥300u every
  gate, ≥ field.radius+200 from field.center, ≥300u hub.position when
  present, |pos| ≤ 1000. Flavor: LM_TONE pools for all 10 generated
  factions with per-kind noun/name-mod pools and line templates plus a
  band≥3 'deep' pool; names unique across the 94 (bounded 60 redraws).
  validate() enforces exactly-one-landmark (clues still forbidden on
  generated systems — the authored total holds at 6 for the
  convergence/deepening math), the id scheme, kind validity, id
  uniqueness across all 100 systems (authored landmark ids collected
  from AUTHORED_SYSTEMS), name uniqueness, and every separation
  invariant. contacts.js: roster 9 → 12 — Warden Korrh
  (contact-fx_bastion-dockmaster, ferrous), Auctioneer Mavra
  (contact-gc_auction-dockmaster), Driftcaller Oss
  (contact-blackstation-dockmaster); no new recognitionLine tiers (the
  three fall through the existing gates — not deep-rim keepers, aceAck
  stays freehold/redmarch). CRITICAL gate: ledgerColumns +
  chartedMarkNotes now iterate Object.keys(AUTHORED_SYSTEMS) (import
  from authored-systems.js) — the keeper ledger is the authored mystery
  lane (§25), so 94 generated landmarks never flood the tier-1
  rotation and waves 11–16 ledger behavior stays byte-identical.
  Boot test wave-23 section (before the final tally): data shape +
  separations across all 94 + authored tables byte-unchanged, real
  100u proximity discovery of fh_hearth_lm ('The Hearth Cart', wreck)
  with the landmarkFound event carrying name+line, ledger authored-lane
  gate (authored six visited, fh_hearth_lm held out — the keeper line
  never names Hearth, identical to the full-list control), hub
  dockmaster shape (one each, role/derived ids), and a dock-autosave +
  death-restore roundtrip (the mark and the 12-contact roster survive).
  Wave-4/wave-10 roster counts updated 9→12 / 6→9. Independent review
  APPROVE (0 CRITICAL/HIGH/MEDIUM; the stale 'SYSTEMS order'
  keeperChartMark doc-line LOW fixed inline). npm run test:boot PASS
  ×7 runs + 1 post-comment-fix confirmation run; npm run build clean
  (only the pre-existing >500 kB chunk warning). Browser-verified:
  fh_hearth systemLoaded rebuilds the 'landmarks' group with the wreck
  POI (debris meshes at the site coords, POS readout HEARTH).
- Wave 24: generated-system depth, part 2 (procedural dockmaster
  contacts across the 91 non-hub generated stations + faction-specific
  station services). scripts/generate-galaxy.mjs: the contact pass
  mirrors the wave-23 landmark pass — ctRng = mulberry32(SEED + 2) with
  ctRint ONLY (no ctRf: an uncalled float helper in a determinism-
  critical section is a silent stream-shift hazard — review LOW, fixed
  by deletion), consumed ONLY in a new loop after the landmark loop
  iterating GENERATED_IDS in order, so the regenerated diff is purely
  additive (+546/-0; md5 6f8c811d… identical across 3 runs).
  CT_TONE per-faction name pools (title/surname/epithets faction-true
  to each LM_TONE voice) plus band≥3 deep pools; ctNamePick bounded-60
  redraws, taken-set pre-seeded with the 12 authored/hub names. The
  three generated hubs (fx_bastion/gc_auction/blackstation) keep their
  wave-23 authored dockmasters and carry no contacts key. validate()
  enforces exactly-one-per-non-hub, zero-on-hubs, role/name shape,
  91-way uniqueness, no authored-name collision. contacts.js:
  buildRoster appends one plain dockmaster per generated system from
  SYSTEMS[id].contacts (skips CONTACT_NAMES ids), exact existing record
  shape/defaults, Object.keys(SYSTEMS) order, wave-21-style defensive
  skips — fresh-run roster 12 → 103. Every authored-id gate (keeper
  ledger/vouch/chart-mark, deep-rim + ace recognitionLine tiers) is
  unreachable for generated ids; the trust-only comp-tier ship line is
  shared with the wave-23 hub three. No migration: restored saves keep
  their persisted roster (waves 10/23 pattern). state.js:
  FACTION_SERVICES — 10 entries, one modifier each in the 0.85–1.25
  band plus a §25-safe line (freehold repair 0.9, veridian jobPay 1.15,
  redledger buy 1.15, ferrous repair 0.85, gilded sell 1.15, beautiful
  sell 0.85, congregation jobPay 1.2, assembly repair 1.1, independent
  jobPay 1.1, lamplighter buy 0.85). Ruling (spec conflict): generated
  clusters fly authored flags, so entries cover the 10 factions flown
  by generated systems and station.js guards on AUTHORED_SYSTEMS id
  membership — the authored six are byte-identical; generated stations
  flying freehold/veridian/redledger flags DO get their modifier.
  station.js applies each modifier in its own transaction path (buy
  charge == PRICE cell chain, sell after epic/before hermit, repairCost
  single source for render+charge, jobPay shared payout/render),
  composed multiplicatively AFTER the wave-6 epic multiplier, faction
  'screen-note' lines in market/jobs/repair; hermit ×1.25 and keeper
  comp dominate exactly as before on authored systems; no per-frame
  allocations (currentService resolved once per station). Boot test
  wave-24 section: data shape (91/hub-exclusion/uniqueness/no-clues),
  fresh-harness roster 103 + keeper-gate null checks at trust 100,
  People card at fh_hearth ('Yardkeeper Stovers'), authored freehold
  negative control (epic-only ×0.9, cost 112, no note) vs fx_liron
  ferrous repair ×0.85 (cost 106, note, charge==label), lastbeacon
  lamplighter buy ×0.85 (PRICE cell 169 UU == charge), cg_vigil
  congregation jobPay ×1.2 full recovery cycle (quoted/paid exactly
  360), dock-autosave + death-restore roundtrip (roster 103 + banked
  dockmaster trust survive). Wave-4/10/23 roster counts updated to
  103 (each site's save semantics checked — no old-fixture restore
  sites). Independent review APPROVE (0 CRITICAL/HIGH/MEDIUM; LOWs:
  dead ctRf removed, gate-comment overclaim reworded; the ferry/haul
  origin-estimate vs destination-payout note mirrors pre-existing
  wave-6 epic behavior — no fix). npm run test:boot PASS ×7
  consecutive; npm run build clean (pre-existing chunk warning only);
  regeneration byte-identical ×3.
- Wave 25: generated-system depth, part 3 (the one standing contact
  slice — generated dockmasters gain per-faction voice). state.js:
  FACTION_RECOGNITION + FACTION_RUMOR after FACTION_SERVICES — one
  recognition greeting + one witness-safe rumor preface per faction,
  exactly the 10 generated-flown keys in FACTION_SERVICES order,
  'hollow' absent (authored-only), voices true to generate-galaxy.mjs's
  CT_TONE tones; the greeting carries no ship name (the trust-60 comp
  line owns ship recognition), each preface reads before a space + any
  of rumorFor's three bodies. contacts.js: GENERATED_KNOWN_TRUST = 30
  (below KEEPER_COMP_TRUST, so the comp ship line still dominates at
  >= 60); recognitionLine's new final tier (after the ace gate, before
  return null) answers FACTION_RECOGNITION[faction] for a dockmaster
  whose system is not in AUTHORED_SYSTEMS at trust >= 30 — pure read,
  no flags, faction via the wave-23 live-def fallback; rumorFor computes
  the body byte-identically and prefixes FACTION_RUMOR[faction] + ' '
  behind the same role + AUTHORED_SYSTEMS guard (empty log still null
  first, rumorIdx rotation untouched). Authored six byte-identical by
  construction — every new gate is by-id; hub dockmasters covered by the
  same generated-only gate as wave-24's services. No generator change
  (lines are runtime templates; galaxy.generated.js untouched), no
  persisted fields (repeatable greeting, not a one-shot ack), no
  save.js/station.js changes. Boot test wave-25 section: data (key sets
  == the live 94-system faction set, 'hollow' absent, all non-empty),
  fresh-harness trust walk 0→30→29→59→60 through the real bumpTrust
  (30 faction line, 29 null, 59 faction line — the tier spans the whole
  mid band, 60 comp line dominates), authored negative control (Mother
  Tarn at 30 → null), rumor (generated = preface + ' ' + witnessed
  body, authored = bare body, empty log null both), and a real Digit7
  People-card drive at fh_hearth rendering the freehold greeting.
  Independent review APPROVE (0 CRITICAL/HIGH/MEDIUM; LOWs fixed
  inline: wave-misattributed comment reworded, dockmaster role gate
  added to the rumor preface, mid-tier 59 probe added; the
  alternate-bodies-under-preface pin consciously not added — bodies are
  byte-unchanged and the preface applies uniformly after the branch).
  npm run test:boot PASS ×7 consecutive ×2 (pre- and post-review-fix);
  npm run build clean (only the pre-existing >500 kB chunk warning).
- Wave 26: generated-system depth, part 4 (the two standing threads —
  the generated-dockmaster per-contact economy the wave-25 candidates
  called "a new system, not a voice pass", and the ferry/haul quote/pay
  agreement). state.js: FACTION_COMP after FACTION_RUMOR — one dual-use
  comp line per faction, exactly the 10 generated-flown keys in
  FACTION_SERVICES order, 'hollow' absent (authored-only), faction-true
  to the FACTION_RECOGNITION voice, §25-safe; spoken in the spend notice
  AND shown verbatim as the repair screen's note. station.js: (1) favor
  economy — completeJob's contact loop gains, after the dockmaster
  bumpTrust, addFavor for a dockmaster whose system is not in
  AUTHORED_SYSTEMS at post-bump trust >= GENERATED_KNOWN_TRUST (30:
  strangers hold no markers; authored six byte-identical — Mother Tarn
  stays favor-less, keepers keep vouch-only favors); renderPeople gains
  a 'Call in a favor' branch for generated dockmasters (!isKeeper &&
  role dockmaster && !AUTHORED_SYSTEMS[currentId]) spending to comp the
  yard session-scoped through the EXISTING keeperComp flags (undock
  reset untouched), with new session-only ui.compNote carrying the note
  text — 'Comped by the keepers' on the keeper path (byte-identical
  output), FACTION_COMP[faction] on the generated path; the repair
  screen renders ui.compNote ?? 'Comped by the keepers'. (2) Ferry/haul
  agreement — jobPayFor(ctx, sysId, base) extracted chain-identical
  from jobPay (epic then faction-service, single Math.round); acceptJob
  stamps job.payQuoted (JSON-plain, rides WORLD_FIELDS 'jobs', no
  save.js change) with the DESTINATION chain (ferry: destSystem; haul:
  otherSystemId(originSystem) over the stamped originPrice); payouts and
  accepted-card renders read job.payQuoted ?? the old expression
  (old-save fallback preserves wave-6 behavior byte-for-byte); offered
  quotes now price the destination chain so quote == pay by
  construction; bounty/patrol/salvage/recovery untouched. contacts.js:
  header doc only (no logic — the economy rides existing
  addFavor/spendFavor/GENERATED_KNOWN_TRUST). No generator change
  (lines are runtime templates; galaxy.generated.js untouched), no new
  ctx events, DOCK_KEY_SERVICES untouched. Boot test wave-26 section:
  FACTION_COMP data (key set/order == FACTION_SERVICES, 'hollow' absent,
  jobPayMult table pins), the earn gate through REAL full recovery
  cycles (fh_hearth pinned 24 → post-bump 29 no favor, pinned 29 → 34
  banks 1; Mother Tarn at 100 authored control banks 0), the spend as a
  real DOM drive (no-marker notice exact, comp flags, spoken notice,
  repair screen-note == FACTION_COMP line with the keeper line absent,
  repairAll deducts 0, undock reset, redock real bill), the keeper pin
  ('Comped by the keepers' verbatim), ferry+haul quote==pay on a
  live-scanned discriminating lane (as_census→blackstation, svc 1 vs
  1.1: card quote == in-test destination-chain replica == payQuoted
  stamp == payout, haul paid 140% of stamped originPrice under the dest
  chain, credits delta == both quotes), the old-save fallback (snapshot
  deleted → pays the live destination chain), and the dock-autosave +
  death-restore roundtrip (payQuoted + banked favors + roster 103).
  Independent review APPROVE (0 CRITICAL/HIGH; MEDIUM consciously not
  fixed — the pre-existing wave-6 haul delivery gate never enforced the
  named destination, so the stamped chain now travels to any non-origin
  dock; recorded as standing below; LOW intended — offered quotes at
  authored stations now price the destination's epic standing, quote ==
  pay by design, payouts unchanged). First gate run found 5 harness-side
  defects, all fixed in scripts/boot-test.mjs (implementation
  untouched): live-overlay staleness (note assertions evaluated after
  the overlay re-rendered — captured eagerly right after the repair
  screen opens), the lane-leg hold carrying recovery-cycle residue
  (real market sell-down setup; the buy loop counts successful buys),
  and the fallback paid-parse NaN (delivery fired inside the dock
  settle, before the commLine window — paid read as the observed
  credits delta with job-done pinning). npm run test:boot PASS ×7
  consecutive; npm run build clean (only the pre-existing >500 kB chunk
  warning).
- Wave 27: Beautiful Ones organic technology — the 'beautiful'
  faction's technology is grown, not built (user-directed; the first
  real modeling beyond the player's living ship). NEW
  src/systems/organic.js: the shared beautech toolkit — ORGANIC
  palette (nacre/mint/gilt/opal), deterministic seeded canvas textures
  (nacre iridescence, generalized vein, radial glow),
  sculptGrownHull (ship.js makeLivingHull generalized with a tunable
  profile; defaults verified byte-equivalent), hand-built parametric
  makePetalGeometry (cupped/curled membrane sail, no three/examples),
  makeTendrilGeometry (S-curve tapered tube), cached
  organicMaterials({tarnished}) (flesh/membrane/gilt/veinGlow;
  userData.shared-marked, never disposed), and the zero-alloc
  tagSway/tagBreath/tagPulse + collectOrganic/animateOrganic
  animation convention (complete no-op under reducedMotion). npc.js:
  buildShipMesh gains a role param (spawnLiveShip passes the record
  role); isBeautiful(faction) delegates to buildBeautifulShip — five
  grown silhouettes (freighter salon barge with pearl blister pods,
  cutter predator ray, heavy/frigate swan-manta with dorsal sail
  crest, ace duelist ray with gilt tendril crown, dart-ray default),
  module-scope per-class geometry caches, mint beautifulGlowMat engine
  glow (userData.glow contract preserved), tarnished materials for
  pirate role, group.name 'beautiful-ship' + userData.organic
  {classKey, role, tarnished}; animateOrganic driven in the update
  loop BEFORE the disabled branch (a surrendered/engine-out living
  hull still breathes — review P3 fixed inline). station.js:
  buildBeautifulStation 'The Bloom' (5 nacre lobes breathing at
  0.25 Hz, 7-petal orchid crown as the rotating ringGroup, gilt vein
  seams, tendril docking arm with gilt cradle + mint lane lamps,
  chandelier bulb clusters, pearl beacon lantern, mint halo, drifting
  spore motes) returning the exact record shape update() consumes;
  teardownMesh skips userData.shared materials/maps. gate.js: the
  Lamplighter ring stays Guild brass but is GROWN OVER in beautiful
  systems — arc-bent tendrils hugging the torus (centerline pinned
  R=30.000), membrane petals cocooning alternating chevrons
  (parented INTO a.chevrons so they co-rotate — review P3 fixed
  inline), 4 tagPulse'd mint bud-lanterns per assembly (disposed in
  rebuild), gilt vine rings, mint swirl/beacon/glow; group names and
  route userData untouched. landmarks.js: four glaze builders (sunken
  salon barge ribs, blown-glass lantern, mirror-petal obelisk, the
  bloom) gated by isBeautiful(def.faction), deterministic
  FNV-1a-seeded scatter, registerDimmable/addPulse contracts
  preserved, CONVERGENCE/DEEPENING sites never glazed (§25); PLUS a
  real production fix the wave-27 identity pin exposed: update()'s
  mystery-record watch was over-broad — a same-system death-restore
  swaps ctx.world.mystery for a semantically identical new object and
  the old code rebuilt the whole POI scene; now hint flips rebuild
  (structural) and record swaps re-apply dimming in place.
  Post-review browser catch: veinGlow was NormalBlending — the
  black-background vein texture cloaked hulls in 90% black (invisible
  ships); now AdditiveBlending + depthWrite false (the ship.js
  emissiveMap pattern). Boot test wave-27 section: toolkit shapes
  (formula-exact sway/breath/pulse at solved peak/trough times,
  reducedMotion freeze), real spawnLiveShip drives (beautiful
  freighter, tarnished pirate cutter, veridian negative control),
  freehold negative controls, real 3-leg travel
  freehold→veridian→gc_auction→bt_cradle (station at the data
  position, one overgrowth + 4 buds per gate, glaze root userData),
  a real dock/undock at The Cradle, the station animation drive, and
  the death-restore identity pin (station same object, glaze root
  survives) + same-system re-emit rebuild proof. Independent review
  APPROVE (0 CRITICAL/HIGH/MEDIUM; both P3s fixed inline above).
  npm run test:boot PASS ×7 consecutive ×3 rounds (post-implementation,
  post-review-fix, post-veinGlow); npm run build clean (only the
  pre-existing >500 kB chunk warning). Browser-verified (real Chrome,
  WebGL): the 3-leg gate/hub-route flight, the Bloom approach + hero
  shots (lobes/crown/lantern/spore motes), the overgrown gate (mint
  bore, buds, cocooning petals), the patrol heavy's additive vein
  tracery, and the Mirror Monument glaze with its real proximity
  discovery toast.
- Wave 28: Berth Records — a save/load interface from space plus manual
  save slots (user-directed). save.js: SLOT_KEYS
  ('rimward-save-v1-slot-1..3') beside the autosave KEY — boot load and
  death recovery still read ONLY the autosave key; loadSnapshot(key)/
  trySave(key) generalized with default params (every prior call site
  unchanged; a manual save emits the 'Mid-jump — berth record refused.'
  saveBlocked where the autosave stays silent); the berth-records panel
  (settings.js inline-DOM pattern, stub-safe makeEl surface only): root
  #rw-berth-records, four .rw-berth-row entries (data-slot auto/1/2/3)
  with .rw-berth-meta ('<toLocaleString> · <SYSTEMS[id].name> · <credits>
  UU' occupied, '— empty berth —' empty/corrupt), .rw-berth-save on the
  manual rows only, .rw-berth-load everywhere (disabled when empty);
  KeyL toggles (galaxychart gating: open only !docked && !paused &&
  !dead, close always, ESC closes), auto-close on docked/dead in
  update(), frozen-vocabulary feedback only (commLine 'Berth record
  sealed — slot N.' / 'Berth record restored.', saveBlocked reuse),
  refresh-on-open and after every write. loadFromSlot reuses restore()
  as-is (systemLoaded emit, healLiveRecords, sanitizeRestored) gated
  like a save (mid-jump, encounter bubble) PLUS paused (review P2: a
  cross-system restore while the loop is frozen drops 'systemLoaded'
  unseen — station/gates/environment desync until the next jump).
  controls.js: HUD hint 'L — berth records (save/load)'. Boot test
  wave-28 section (24 checks): the real KeyL/click drive — four rows in
  order, a save → sentinel-drift → load roundtrip (credits, 1e-6
  position, both toasts, auto-close), the paused-load refusal
  (flags.paused poked directly — main.js owns KeyP, the harness runs
  its own loop), occupied autosave/manual berth meta shape, empty-berth
  text + disabled LOADs, docked open-refusal, ESC/toggle close, no save
  button on the autosave row. Harness lessons: npc.js sets flags.combat
  from ai.intent && distance < ENCOUNTER_BUBBLE — lawful patrols turn
  intent-hostile after the run's earlier piracy, so role-based parking
  misses exactly the ships holding the bubble, and parking fights a
  despawn/re-instantiate treadmill (records re-spawn at 900u and close
  in); w28calm instead teleports the PLAYER beyond every record route
  with full-stop and ticks until the flag clears, clicking
  synchronously after. The drift sentinel moved AFTER the pre-load calm
  so the calm teleport can never erase it (review P2 — positionRestored
  was vacuous), and the post-load position is captured by value, not
  the live Vector3 the dock/undock legs mutate. Security review APPROVE
  (0 findings; three optional LOW hardening notes pre-date the wave in
  the autosave path). Code review CHANGES-REQUESTED — both P2s fixed
  inline above and defended by new checks. npm run test:boot PASS ×7
  consecutive ×2 rounds (post-implementation, post-review-fix); npm run
  build clean (only the pre-existing >500 kB chunk warning).
- Wave 29: Bloom redesign (user-directed — the wave-27 station read as
  solid stacked blobs; brief: flower × starfish, translucent, veined,
  slowly pulsing). organic.js gains two sculpt primitives following the
  toolkit conventions (indexed, normals+uvs): makeStarfishArmGeometry
  (tapered drooping arm, mid bulge, lateral curl) and makeWebGeometry
  (ruffled membrane sector fan). station.js buildBeautifulStation
  REPLACES the nacre lobe stack + gilt seams with a living body:
  translucent skinMat bell (per-build, opacity-pulsed at 0.06 Hz) over
  a mint emissive heart (0.11 Hz heartbeat), five starfish arms each
  cloaked in a per-build additive vein overlay (opacity pulse phased
  i*1.3 so the pulse travels around the body), five webMat membrane
  fans breathing between arms, chandeliers under the arm roots. The
  7-petal orchid crown stays (user liked the petals), nested INTO the
  upper bell (ringGroup y 16 → 7 after visual review — the raised
  crown read as two disjoint tiers). tagPulse auto-selects
  emissiveIntensity on MeshStandardMaterial; skin/web flip
  userData.pulse.prop to 'opacity' so the fluctuation rides
  transparency. Docking arm/cradle/lamp positions byte-identical;
  return-record keys, envelope (~30u radius, −16…+38), and the
  shared-material disposal contract all preserved (per-build materials
  reference the shared cached maps, which teardownMesh skips).
  Verified: npm run test:boot PASS (all wave-27 station checks green
  unchanged) plus a live browser visual pass (system Chrome headless,
  SwiftShader WebGL — the shared headless Chromium has no GL) framing
  The Cradle from multiple angles.
  Review pass (user screenshot): the tendril docking arm + gilt cradle
  ("branch out of nowhere") and the y-38 beacon ball + 34u glow
  ("weird ball") are REMOVED — dock logic is position-only
  (ctx.station.position), so no silhouette was load-bearing; the beacon
  is now a small pearl blinking at the flower's throat (glow 12u).
  Crown re-rooted y 7 → 4 (the arm-ring center, inside the bell) so
  the flower grows out of the starfish disc; chandeliers tucked to
  radius 4.5 under the bell; arm sway amp 0.02 → 0.07 rad at 0.07 Hz
  (was imperceptible — ±0.4u tip travel; now ±1.4u over a ~14 s
  period, motion-verified live: all five holders swept ±0.05–0.10 rad
  in a 4 s sample); web breath depth 0.015 → 0.03. makeTendrilGeometry
  import dropped (station no longer uses it). Boot test re-PASS.
  Motion fix (user: "arms moved a couple seconds then stopped"): the
  single-axis sinusoid DWELLS near each extremum for seconds — reads as
  stopped. Each arm now has a nested flex group with a second sway axis
  at an incommensurate frequency (holder x 0.09 rad @ 0.09 Hz + flex z
  0.06 rad @ 0.13 Hz, per-arm staggered phases) — a slow Lissajous
  sweep that never stalls. Live-verified: page-side sampler, 10 × 2 s
  intervals × 5 arms, zero stalls (≥1 axis moved > 0.004 rad every
  interval). NOTE: animateOrganic is a deliberate no-op under
  ctx.settings.reducedMotion (persisted 'rimward-settings-v1') — if the
  station ever reads fully frozen, that toggle is the first suspect.
  Vein fix (user: "veins look like wireframes — compare my ship"): the
  per-arm additive vein OVERLAY meshes deleted; veins now ride
  emissiveMap on skinMat/webMat themselves (ship.js living-hull recipe:
  emissive 0xffffff × shared vein texture so the texture colors carry),
  tagPulse back on emissiveIntensity (skin 0.9±0.25 @ 0.07 Hz, web
  0.5±0.15 @ 0.075 Hz phase-offset); skinMat opacity 0.5 → 0.8 for
  flesh presence. Spore motes switched mats.veinGlow → lightMat (vein
  texture on a sphere read as a wireframe ball). Live-verified:
  wireframe cage gone, veins glow inside translucent flesh.
  Flesh fix (user: "too translucent — match my ship's skin; add red
  veins"): skinMat is now OPAQUE deep flesh (ORGANIC.deepFlesh, no
  color/transparency — the ship hull recipe); the heart mesh went with
  the translucency (invisible inside opaque flesh — the vein pulse is
  the heartbeat). New module-cached bloomVeinTexture() (mint family +
  crimson every 6th, count 16 not 42 — station surfaces fill the
  screen, so toolkit-default density read as a lattice), shared-marked,
  never disposed. Key lighting finding: far from the sun, opaque flesh
  renders BLACK and only emissive veins show (glowing-lattice look) —
  the bloom carries a soft mint PointLight fill (600/140/decay 2) at
  the body center, the same reason the ship carries underLight. webMat
  stays the one translucent note (opacity 0.5).
  Skin fix (user: "no reflection, looks fake — should be skin with
  veins showing through"): the near-black deepFlesh base vanished
  against space → veins-over-void lattice. skinMat is now a
  MeshPhysicalMaterial (the living hull's class) with a PALE green-
  nacre epidermis (0xa8bfae), clearcoat 0.55 wet sheen (glossy
  highlights from fill light + sun = the "reflection"), and the vein
  emissiveMap softened (0.6±0.18) so veins read THROUGH the surface.
  fleshLight 600 → 300 (pale base overexposed). Chandeliers tucked to
  radius 3 / y −1.5… — at 4.5 under an opaque bell they read as
  floating balls again. Tone pass (user: "too light; the throat ball
  is too big"): epidermis 0xa8bfae → 0x55755f (mid-dark green);
  beacon pearl r 1.5 → 0.9, glow sprite 12 → 7.
  Resize correction (user clarified: the "ball" was the CENTER BELL,
  not the throat pearls): body bell scale (9,6,9) → (4.5,3,4.5) — half
  size; beacon (1.5/12) and crownHeart (2.5) restored, their shrink
  was the misread. Bell again 50% smaller on user repeat:
  (4.5,3,4.5) → (2.2,1.5,2.2) — a quarter of the original pod.
  Crown rework (user: "more organic, more active"): the single flat
  7-petal whorl is now TWO whorls — 7 large outer petals + 7 smaller
  steeper inner sepals offset a half-step — with deterministic
  per-petal jitter (sin-hash walk, no RNG) in angle/openness/size.
  Petals moved off shared mats.membrane onto per-build petalMat
  (MeshPhysicalMaterial, opal-pale, clearcoat, bloom-vein emissiveMap
  pulsing 0.35±0.12) so the flower shares the body's living veins.
  Activity: per-petal open/close flex on individual incommensurate
  frequencies (amp 0.06–0.13, hz 0.13–0.27 walks), whole-crown breath
  (0.03 @ 0.09 Hz) and a slow nod (ringGroup sway x 0.05 @ 0.05 Hz —
  rotation.y RING_SPIN is +=, unaffected). Petal dynamics pass (user:
  "curl more, a little slower"): geometry curl 5→8 / 6.5→10, cup
  2.5→3.2 / 3.5→4.5 (petals hood and cup visibly); flex amps ~×1.4
  (outer 0.11–0.17, inner 0.09–0.14) at ~⅔ the frequency (hz walks
  0.09–0.18 / 0.11–0.18); crown breath 0.04@0.07, nod 0.06@0.04.
- Wave 30: the two remaining §29 product-test gaps ("bluffed the other with
  hidden mounts", "followed its wake after it ran"). state.js: HIDDEN_MOUNTS
  {cost 900, bluffBase 0.35, bluffPerFear 0.01, failResolveBump 20,
  calmSeconds 90, demandMin 50} after ECON. ctx.world.concealedMounts (bool;
  save.js WORLD_FIELDS += 'concealedMounts'; sanitizeRestored coerces
  !== true → false). station.js outfitting row 3 'Concealed mounts' (n===3
  hotkey, one-time, owned note in the yard's voice). npc.js: a hunt-mode
  pirate targeting the player opens ONE demand hail per record
  (ai.demandSent, record.demandedAt, DEMAND_COOLDOWN 300) inside
  U.TARGET_RANGE past jump grace, then holds weapons-cold (cap*0.15) while
  ai.demanding; demand = max(demandMin, round(tributeRate × cargoValue(player
  cargo) × 10)) rolled once. hail.js intents (INTENT_ORDER appended, combat
  numbering unchanged): payTribute (credits = max(0, credits − demand),
  flee + calm 60), showTeeth (only when concealedMounts === true; success
  p = bluffBase + fear × bluffPerFear → flee + calm 90 + fear+1; failure →
  +20 resolve via ai.resolveBoost — survives the 1 s updateResolve recompute,
  instance-scoped, cleared on stand-down/calm/disabled — and the pirate
  presses), refuseFight (card closes, pirate attacks). A player hit after
  ai.demandPeaceAt voids the parley (demanding cleared + hailClosed emitted).
  stampWakeSite(live) (npc.js export, role-guarded pirate/ace): EVERY flee
  entry (capitulate + all seven hail resolutions) stamps record.wakeSite
  {position: [x,y,z] (flee heading × 1400 = U.DEINSTANTIATE_RANGE), found:
  false} — JSON-plain, rides record persistence. src/systems/wakes.js (new;
  main.js after pods, before hud): pooled 600-point wake trails (45 s life,
  wake blue #4a9fd8, 10 Hz per fleeing ship, world-space so the trail
  survives the runner's despawn; reducedMotion mutes + hides; 'systemLoaded'
  zeroes the ring buffer same-frame; fade uploads whenever any point lives)
  + 4 Hz site discovery: player within 120 u of an unfound wakeSite → found,
  2–3 refinedMetals pods, Echo commLine, one-time milestone firstWakeSite.
  Boot test wave-30 section (8 groups, real paths): purchase/restore-heal/
  rebuy, demand hail intents ± mounts/hold/once-per-record, payTribute exact
  debit + 1400 u site, showTeeth both branches, refuseFight → npcFire,
  void-on-hit, wake emission + reducedMotion mute, discovery + milestone
  exactly once, law-zone guard. PASS ×3 consecutive full runs.
  Reviews: security SHIP (2 LOW, standing below); code SHIP — 3 MEDIUM fixed
  same-wave (wake fade never re-uploaded post-emission; failResolveBump was
  a dead write under updateResolve → resolveBoost; demandCargo/demandRansom
  flee entries unstamped), 2 LOW standing below.
- Wave 31: the Q-ship counterplay ruling (the wave-30 candidate, user-decided:
  the Wolfeye's top rung reads concealed mounts — mounts now exist on BOTH
  sides). world.js: QSHIP_COVERS pool (freehold ×2, veridian ×1, 'Hauler'
  fallback) beside PIRATE_NAMES; createRecords flags every odd-index pirate
  rec.qship with coverClass 'freighter' / coverName / coverFaction =
  def.faction — index 0 (the redledger leader; Verge's Old Callow) and even
  indices stay classic. JSON-plain, rides record persistence; NO
  state.js/save.js/ctx.js changes (records persist wholesale; commLine +
  milestone events already frozen). Banks generated before wave 31 stay
  Q-ship-free — no retrofit (the PIRATE_NAMES.verge precedent: lazily
  generated content only reaches unvisited systems). npc.js: spawnLiveShip
  builds the disguised mesh in cover identity (coverClass ?? 'freighter',
  coverFaction ?? faction, role 'trader') while createShipState keeps REAL
  cutter stats and live.role stays 'pirate' (other pirates never hunt it;
  the overpowered engines under the freighter skin are the in-fiction
  tell). revealQship() (beside stampWakeSite) sets rec.revealed = true
  (persisted, once per record), swaps live.object to the real-identity
  mesh in place (position + quaternion copied; shared geo/mats never
  disposed; every userData.glow consumer re-reads per call), says 'The
  manifest lied.' from the real name, and guard-push-emits milestone
  'qshipUnmasked' once EVER. updateHunt triggers: a top-of-function
  scratch check (hull < hullMax || screen < screenMax — applyHit damages
  screen first, so any hit is caught next frame) and both setTarget
  acquisitions (player AND NPC trader) — the acquire reveal runs before
  the wave-30 demand block the same frame, so the hail already shows
  true colors (a 'freighter' closes, flips, 'Your cargo or your hull.').
  hud.js: a masked target's bracket shows coverName/coverFaction; scanner
  >= 2 pierces — real identity + ' · CONCEALED MOUNTS' meta suffix;
  resolve band/numeric reads unchanged either way. station.js:
  SCANNER2_COST 900, act.buyScanner2 (installed → Mk I prerequisite →
  credits guard chain), outfitting row4 (three states), Digit4 hotkey.
  Boot test wave-31 section (7 legs, real paths): Mk II guards + exact
  400/900 debits through Digit2/Digit4, record-data invariants
  (name-keyed authored pirates — migrants/injected aces append after the
  original cast), bracket cover/pierce with exact strings + distance
  sanity, reveal on acquire (mesh-identity swap, swap-in-place <5u,
  real-name comm line, once-ever milestone), reveal on scratch (no
  second milestone), scanner + revealed save roundtrip through the
  death-restore, byte-exact plain-pirate bracket regression. Harness
  accommodation (documented in-section): bootFreshHarness re-runs
  initHud on the SAME memoized #hud stub root, so duplicate bracket
  chains exist — w31bracketText reads only the SHOWN .rw-target chain
  (frozen fresh-boot chains read ''); pristineQships=0/2 in the log is
  EXPECTED (the harness's own soak-era combat legitimately unmasks
  freehold's Q-ships before the section runs — leg b asserts the sound
  invariants instead of blanket revealed-absence, leg d re-arms the
  once-ever milestone guard via the splice idiom). PASS ×3 consecutive
  full runs.
  Reviews: security SHIP (2 LOW + 1 informational, standing below);
  code SHIP (overall correct — every attack path reveals before any
  telegraph/fire/demand, the mesh swap is reference-safe across
  hud/combat/controls/traffic/wakes, no false-pass holes in the boot
  section; 1 P3 cosmetic, standing below).
- Wave 32: pirate player-interest (user-reported: pirates instantly
  attacked on every system entry — combat-averse players had no peace
  outside dock). npc.js: INTEREST const { base 0.25, temperSpan 0.35,
  cargoSpan 0.3, cargoNormUU 800, fearRepel 0.004, min 0.05, max 0.9 };
  exported playerInterestChance(ctx, record) — 1 for alwaysHuntsPlayer,
  else a lazy record.temper ??= (persisted per-record greed; old saves
  roll it on first sight) and the clamped formula (manifest richness
  draws, fear repels). playerInterestedIn rolls ONCE per instantiation
  (ai.playerRolled/playerInterested). updateHunt player acquisition is
  now gated on jumpGraceUntil (JUMP.graceSeconds 5 — 'no hostile intent
  on arrival' finally covers TARGETING, not just the wave-30 demand)
  AND the roll; losers of the roll hunt the nearest live trader or
  loiter (the pre-existing prey loop — they go after other ships and
  ignore you). Retaliation (review P1, both reviewers converged):
  damage overrides the roll for the rest of the instantiation — a
  pirate's only damage source IS the player (patrols loiter, NPC fire
  hits only its target) — latching playerInterested + setTarget with a
  freshly armed telegraph (§6.1 warning still precedes fire). Law-zone
  pacifism holds (a zone-side pirate only routs); fleeing/disabled/
  demanding ships never reach the latch. Apathy is no longer a death
  sentence — the free-bounty/fear-spiral exploit is closed. world.js:
  injectCollector stamps alwaysHuntsPlayer: true (the Ledger's
  collector never rolls — he has your vector); npc.js spawnLiveShip
  name-heals pre-wave-32 Dresk records via
  ORIGIN_ARCS.ledgerDebt.collector.name. Boot test: every
  engagement-dependent synthetic pirate flagged alwaysHuntsPlayer
  (w30spawnPirate, w30lawRec, w31spawnQship — their passing IS the
  interested-path regression; w31wren uses set-then-DELETE so the flag
  never leaks into its save roundtrip), plus the wave-32 section:
  chance exactness (0.425 / 0.9 max-clamp (one IEEE ulp under —
  epsilon-asserted) / 0.05 min-clamp / 1 bypass, lazy temper sticky),
  grace gate (null target + no hail during grace, demand after),
  disinterest → trader preference (one-tick HIGH pin; never the
  player), masked-by-apathy (a disinterested disguised Q-ship stays
  covered, bracket shows the cover), collector bypass (self-heal +
  chance 1 beats a HIGH pin), positive control (LOW pin — the dice can
  say YES; closes the false-pass gap the code review flagged), temper
  save roundtrip (Ninth Tooth, byte-exact), retaliation ×3 (apathetic
  until scratched → latch + telegraph re-arm; NO latch inside the law
  zone; masked Q-ship — facade and apathy die to the same bullet, the
  qshipUnmasked milestone still fires exactly once). All seven RNG-pin
  windows are save/try/finally/restore. PASS ×3 consecutive full runs.
  Reviews: security FIX-FIRST → the retaliation override; code
  FIX-FIRST → same P1 + the positive-control P3. Both closed same-wave;
  remaining LOWs standing below.
- Wave 33: Bloom station v2 (user-directed — BeautifulOnes_Station_Example.png
  committed as the target: glassy teal × warm amber, pads on the arms).
  organic.js: ORGANIC palette extended additively (lagoon 0x2e8f86,
  lagoonHot 0x6fe0d0, amber 0xffc978); no existing export touched.
  station.js buildBeautifulStation rewritten: skinMat is now a
  TRANSLUCENT lagoon-teal MeshPhysicalMaterial (opacity 0.58,
  depthWrite false, clearcoat kept, emissiveMap = the shared
  bloomVeinTexture retinted teal/amber same-seed, tagPulse on
  emissiveIntensity) shared by the body bell + 5 arms; per-arm
  'beautiful-hearth' amber MeshBasicMaterial glow cores (pulse rides
  opacity — MeshBasicMaterial has no emissiveIntensity) nested in the
  flex groups; 5 'beautiful-pad' GROUPS (userData.pad 0..4, dark disc +
  2 gilt torus rings on shared mats.gilt + 6 lightMat rim lamps +
  amber center disc) riding the arm sway; 5 'beautiful-node' lagoonHot
  root orbs with additive glow sprites, per-node phased opacity pulse;
  crown gains a third innermost whorl of 5 steep bud petals (19 total,
  same jitter/flex conventions). Kept byte-contract: return record
  keys, group.name/userData.organic/data position, dual-axis Lissajous
  arm sway, webs/chandeliers/beacon/halo/motes/fleshLight (retinted),
  shared-material disposal contract (verified: teardownMesh only ever
  disposes mat.map, never emissiveMap — the shared vein cache is
  unreachable from teardown). Boot test wave-33 section: real travel
  to bt_cradle — 5 pads with exact userData.pad set, 5 hearths, 5
  nodes, pads' ancestry carries the axis-z flex sway, crown found with
  exactly 19 petals (indexed + transparent + DoubleSide discriminator),
  one transparent emissiveMap FrontSide material shared by ≥6 meshes
  (the skin), hearths warm (r>g>b); home leg back to freehold. PASS
  ×3 consecutive + npm run build clean. Reviews: security 1 MEDIUM
  (the skin-sharing predicate passed vacuously via the 19-mesh
  DoubleSide petalMat) → fixed same-wave by discriminating
  side !== DoubleSide; code APPROVE with 2 P3s (standing below);
  designer visual pass SHIP — all 7 checkpoints (glassy skin with
  in-surface veins, amber through the arms, pads read as pads, layered
  bud crown, root orbs, no black-on-black, 44 tagged parts drifting,
  nothing stalled) verified live in headless system Chrome on
  SwiftShader WebGL2.

- Wave 34: standing review debt (user-decided: close it — the wave-34
  candidates were all standing notes, and the save-tamper precedent was
  explicitly broken for the two heals). save.js sanitizeRestored: scanner
  ladder heal beside the concealedMounts coercion — `if
  (![0,1,2].includes(ctx.world.scanner)) scanner = 0` closes the wave-31
  security LOW (a hand-edited scanner 99/'2' restored with the free Mk II
  pierce + station 'installed' note); restore() is the sole snapshot-apply
  path (boot load, death recovery, wave-28 berth load all funnel through
  it, sanitize at its tail) so every entry point heals; 'systemLoaded'
  re-emit precedes sanitize but events consume next frame, no pre-heal
  read window. npc.js playerInterestChance: `??=` → Number.isFinite guard
  closes the wave-32 security LOW (tampered non-numeric temper NaN-ing
  the chance); finite tempers never re-roll (zero Math.random consumed —
  the wave-32 p=0.425 RNG-pin exactness legs unaffected); -0 and numeric
  extremes stay but are railed by the [0.05,0.9] clamp (residual LOW
  standing below). station.js hearth core scale.z 6.3→5.4: wave-34
  re-derivation (independent 20k-sample sweeps by BOTH reviewers, same
  analytic model as boot leg c) shows 6.3 was CONTAINED all along
  (+0.434u worst margin at s≈5.91/t≈0.705 — the wave-33 review's 0.41u
  breach figure was the margin, sign-flipped, confidence 0.6); 5.4 taken
  anyway — worst margin rises to +0.782u (s≈4.82/t≈0.652) and the
  envelope is now pinned by test; comments in station.js + the boot-test
  header corrected same-wave (code-review P3). Boot test wave-34 section
  (additive +171/−0): leg a scanner heal through the REAL dock autosave →
  death-restore ×6 cases (99/'2'/null heal to exactly 0; 0/1/2 roundtrip
  unchanged; per-case sentinel credits 61231+7ci ride the poke and gate
  both the save-poll and the post-restore assert — scanner 0/1/2 all
  appear in earlier autosaves, so value alone can't prove THIS dock's
  save won; a timed-out poll fails closed), leg b temper guard (pinned
  counted Math.random in one save/try/finally/restore window: exactly
  one roll for temper 'rich', re-roll finite + sticky, chance clamped
  [0.05,0.9], finite temper byte-sticky with ZERO random calls — a
  healthy-path roll would trip finiteTemperZeroRandomCalls), leg c hearth
  containment (real travel to bt_cradle, reads the LIVE hearth mesh
  scale/position/rotation.x — never copied constants — 2001-sample sweep
  dist(H,C)+r ≤ R−0.5, structural pin scale.z ≤ 5.4, home leg to
  freehold; leg-a death-restores return class maxes so leg c re-pins the
  1e9 hull, documented in-section). PASS ×3 consecutive + npm run build
  clean (only the pre-existing >500 kB chunk warning). Reviews: security
  SHIP (all six scanner consumers + both temper read/write sites
  enumerated; 3 LOW/informational standing below); code APPROVE (overall
  correct, confidence 0.9; the comment P3 fixed same-wave); designer
  visual SHIP — all 6 checkpoints live in headless system Chrome on
  SwiftShader WebGL2 (dist via vite preview; 5 hearths scale.z=5.4
  world-decomposed, no visible poke-through from 5 close tip angles on 2
  arms, chamber never reads severed, pads/crown/orbs/webs unchanged,
  sway/breath/pulse deltas measured live over 2.04s; 12 stills in
  .chrome-shot/w34/, untracked scratch).

- Wave 35: remaining actionable review debt (user-decided scope — the
  wave-26 haul MEDIUM and the wave-30 hailClosed LOW were the last two
  standing items with a prescribed fix). station.js tickDeliveryJobs
  haul branch: the origin-exclusion (`currentSystem === origin →
  continue`, paid at ANY other dock) replaced with named-destination
  binding — `const dest = otherSystemId(ctx, origin); if
  (currentSystem !== dest || dest === origin) continue;`. The dest ===
  origin half keeps the gates-less fallback undeliverable (otherSystemId
  returns the origin id when gates[0] is missing — never pays at
  origin). Delivery now always matches what the board UI promised at
  offer/accept/in-flight (all three resolve otherSystemId identically)
  and what payQuoted priced — the ferry precedent. Multi-gate ruling
  (gameplay decision, recorded): gates[0] names the destination; side-
  gate arrivals no longer pay. Old saves need no migration
  (originSystem + payQuoted already stamped; the payQuoted-less
  fallback jobPay(current) now prices the same system the quote would
  have — strictly narrower than the old any-dock fallback). hailClosed
  ship-scoping: hail.js resolveIntent emits {ship: live} (open.ship at
  resolution time), npc.js void-on-hit emits {ship: live}; hail.js's
  card listener closes only on !ev.ship || ev.ship === open.ship;
  npc.js's hold-release scan keeps its outcome-gate and adds !e.ship ||
  s === e.ship; ctx.js vocabulary updated to 'hailClosed' {ship?}.
  Unscoped emits remain a deliberate legacy backstop (the wave-9
  audio-cue harness leg emits payload-less; song.js keys cues on type
  alone). Card-steal window closed: ship B's void no longer kills A's
  card or releases A's hold. Boot test wave-35a section (real paths):
  runtime triple pick off ctx.systems (origin→dest→third, the live
  wave-26g leftover ferry's destSystem excluded from ALL THREE legs —
  code-review P3: ferryDest === origin would eat 4 of the 5 bought
  provisions in the settle window; fixed same-wave), real board accept
  with payQuoted/quote-names-dest asserts, overshoot negative control
  (dock at the third system: job stays accepted, no delivery commLine,
  credits/cargo untouched — discriminates: old code pays there), named-
  destination delivery (credit delta === payQuoted exactly, HAUL_UNITS
  removed, job done). wave-35b section: cross-scope close ignored
  (card + hold stand), own-scope closes, payload-less backstop closes,
  hold release scoped (B's hold releases, A's stands). Harness note:
  leg-d's parked pirate B must sit INSIDE U.DEINSTANTIATE_RANGE (1400)
  — the 9000-corner w30parkHostiles idiom despawns it before npc.js's
  ctx.ships release scan runs (traffic.js:71-73 splice; correct product
  behavior, a despawned ship's ai dies with it). PASS ×3 consecutive +
  npm run build clean (only the pre-existing >500 kB chunk warning).
  Reviews: security SHIP (full consumer census of the tamperable job
  fields — originSystem/payQuoted/originPrice readers+writers — and a
  complete hailClosed emitter/listener census; no finding survives);
  code APPROVE (overall correct, confidence 0.85; the triple-picker P3
  fixed same-wave; per-leg false-pass audit found every discriminating
  leg flips under the old code). No residual findings — nothing new
  standing this wave.

- Wave 36: bt_cradle lighting rebalance (user-decided scope — the two
  wave-33 review P3s were the only candidates naming a possible pass;
  the rest of the ledger stands). station.js buildBeautifulStation,
  station-local only (the solarsystem.js decay-0 sun lights the planets
  and stays untouched): fleshLight 300 → 60 — at 300/decay-2 it
  delivered ~1.2-13x the flat sun's 2.5 at 3-10u skin distances,
  swamping all sunward/anti-sun shading; 60 is parity (~2.4 at 5u);
  skinMat opacity 0.58 → 0.72 and vein pulse base 0.6 → 0.42 / amp
  0.18 → 0.10 (emissive is distance-independent, the lit fill is not —
  past ~150u only the lattice read); roughness 0.3 → 0.55 broadens the
  diffuse lobe so the sun's directional term shows on the fill. The
  wave-33/34 pins all survive unchanged (5 pads/hearths/nodes, 19
  petals, the shared transparent/emissiveMap/FrontSide skin instance on
  6 meshes, hearth warmth r>g>b, hearth scale.z 5.4 containment). Boot
  test wave-36 section (additive): leg a lighting contract (real travel
  to bt_cradle, LIVE pins — skin opacity 0.72, roughness 0.55,
  userData.pulse prop/base/amp/hz field-wise, exactly-one shared
  instance on ≥6 meshes, exactly-one station PointLight with intensity
  60 / distance 140 / decay 2 / position (0,6,0)); leg b sun envelope
  (the decay-0 sun read LIVE — the only scene PointLight with
  distance === 0 && decay === 0; the discriminator fails LOUDLY on zero
  matches if solarsystem.js ever moves the sun off the flat contract,
  no silent stale denominator — code-review/security informational,
  fixed same-wave; fleshRatio ≤ 4.0 at the five spine distances and
  ≤ 1.2 at the 5u parity zone; pre-wave-36 ratios 10.38/4.8 exceed both
  bounds, so both legs discriminate). PASS ×3 consecutive + npm run
  build clean. Reviews: security SHIP (attack surface unchanged — no
  new save/event/DOM surface; consumer census: the skin instance rides
  exactly the bell + 5 arms, fleshLight has no code consumers); code
  APPROVE (overall correct, confidence 0.9; 3 P3s fixed same-wave —
  the inflated '~12-50x' swamping figure corrected to ~1.2-13x in
  station.js, the leg-b comment's pre-wave ratios corrected to
  10.38/4.80, and the hardcoded 2.5 sun denominator replaced with the
  live decay-0 lookup); designer visual SHIP — all 6 checkpoints live
  in headless system Chrome on SwiftShader WebGL2 (sunward vs anti-sun
  bell luminance 111.4 vs 22.4 at 40u — ratio 4.97x with a monotonic
  sun-side ramp, 86.6 vs 56.4 at 80u; fill reads against the lattice at
  160/180u; hearths read through the 0.72 skin — 1429/1615 amber px at
  25u arm profile, mean (165,138,86); sea-glass + clearcoat glint up
  close; pads/crown/orbs/webs standing, no black-on-black; motion
  deltas over 2s — breath 1.018→0.980, arm tips 0.24/0.45u, pulse
  inside the 0.42/0.10 envelope; 11 stills in .chrome-shot/w36/,
  untracked scratch). Both wave-33 P3s CLOSED.

- Wave 37 (commit 7368f92): faction visual alignment phase 1 (user-decided scope — "hard-core
  option", vertex colors on merged geometry; plan doc
  Docs/FactionVisualUpdatePlan.md, reference art Docs/FactionExamples/).
  New module src/game/faction-style.js: FACTION_STYLE — per-faction
  hull/hullDark/trim/accent/glow/beacon/patch[]/metalness/roughness +
  planetMood/planetTint, colors sampled from the 30 reference PNGs.
  Decisions recorded same-module and in the plan: D1 veridian §18.2
  white/cyan → graphite/emerald 0x58c49a (approved); D2 beautiful stays
  mint 0x7fe0a8 (approved — indigo/violet reads via planetTint only);
  D3 unknowables deferred (no generated system flies it); D4 the
  vertex-color ruling (approved). SHIPS (npc.js): materialsFor/
  placeholder switch DELETED — vcGeoFor(faction×classKey) merges
  per-part specs into ONE vertex-colored geometry (module-cached,
  shared, never disposed) rendered with ONE shared MeshStandardMaterial
  (vertexColors: true) — one draw call per built ship; patch roles
  cycle style.patch (freehold red/cream/blue pods, lamplighter
  yellow/cobalt…); engine glow is a per-faction cached material in
  style.glow (scale/visible-only animation contract unchanged; the
  beautiful grown path and qship cover path untouched). STATIONS
  (station.js): SCHEMES/schemeFor replaced by per-FACTION schemes
  derived from FACTION_STYLE (def.station.palette no longer consulted);
  habitat modules cycle per-build patch materials, an accent collar
  ring + alternating glow/accent drum bands carry the identity color;
  disposal unchanged (per-build mats, teardownMesh). GATES (gate.js):
  structure stays Lamplighter brass (lore), but chevron emissive, bore
  glow, beacon, and charge tunnel tint per system faction via
  lazy-cached shared textures/materials (tintFor — the ringGeo/glowMap
  never-disposed pattern; rebuild disposes only per-assembly materials
  as before); beautiful overgrowth path byte-identical. PLANETS
  (solarsystem.js): warm/cold chosen by style.planetMood, bands
  multiplied by style.planetTint (null tint = byte-identical pre-wave
  colors; veridian-cold/freehold-warm reproduced). DATA: FACTIONS
  veridian 0x6fd0e0 → 0x58c49a, assembly 0xaac4d8 → 0x7fb8b8;
  authored-systems veridian palette synced; generate-galaxy.mjs
  FACTION_COLOR synced and galaxy.generated.js regenerated (generator
  validation OK; diff = 19 recolored systems' palette+sunColor only).
  Verification: boot test PASS (all waves green, beautiful controls
  byte-identical); live headless Chrome/SwiftShader walkthrough —
  freehold station (brown hull, barn-red collar, cream/red patch
  modules, amber glow), veridian station (graphite, emerald lamps,
  pale-alloy modules), gc_auction (black ceramic, ivory/gold patch,
  turquoise glow), fx_bastion (iron gray, crimson collar); scene audit
  at fx_bastion: gate chevrons emissive #d86a4a on brass #5a4422 cones,
  station material set {#42454b,#252d35,#ffe0b0,#8a3a34,#b08a4a}; NPC
  ships verified vertexColors:true with 2 materials (shared vc material
  + faction glow). Save-hack travel (localStorage currentSystem patch)
  used for the fx_bastion leg only — restore boundary healed clean.
- Wave 38: faction visual alignment phases 2–4 (orchestrated — three
  parallel workers, one file each; parallel browser verifiers
  contended over the shared browser and two died, so final visual
  verification ran solo — lesson: one browser driver at a time).
  SHIPS (npc.js +604/-9): FACTION_VC_PARTS sculpts all 6 classKeys
  for the 8 kit factions from their concept-art languages (freehold
  patch slabs/greenhouse dome/towed pod, veridian hex spine/assay
  fins, ferrous wedge prow/citadel tower/barrel housings, redledger
  grappling claws/ram spike/tally stripes, gilded ceramic wedge/
  scale domes/turquoise gallery, congregation observation dome/rib
  rings/folded violet sails, assembly repeated modules/antenna
  forest/daughter pods, lamplighter tug block/repair crane/cable
  reel/relay mast); colorPart gains 'glow'/'beacon' additive roles;
  vcGeoFor(classKey, faction, pirate) — pirate role bakes a dulled
  ':pirate' variant (desaturate 50% to luminance, dim ×0.72,
  glow/beacon stay lit), still exactly 2 materials; glowZFor()
  per-sculpt stern placement; VC_PARTS fallback byte-identical for
  independent/hollow/unknown (no ':pirate' variant); qship cover +
  revealQship routing preserved; kit lookups Object.hasOwn-guarded.
  STATIONS (station.js +406/-0): STATION_BUILDERS dispatch on
  def.faction — freehold farm rings/greenhouse domes/donated plates,
  veridian hex extraction complex/assay towers/docking spokes,
  ferrous fortress-bastion/battery ring/command tower, redledger
  captured refinery core/tribute vault, gilded auction pavilion/
  observation rotunda, congregation nave/sect bays/sail shrines,
  assembly foundry cells/antenna forest/ancient core, lamplighter
  depot (spare ring segments, parts yard, cranes); the pre-wave
  placeholder extracted verbatim (fallback byte-identical, group
  unnamed); faction groups named '<faction>-station'; return-record
  shape, update(), dock paths, and teardown contract unchanged —
  station builders carry NO shared assets (all per-build; rebuild
  disposes 38/38 tracked resources). GATES (gate.js +307/-0):
  '<faction>-overlay' subgroup per assembly for the 8 factions
  (veridian hex cladding/claim beacons, ferrous cardinal bastions/
  blast shutters, freehold replaced segments/scaffolds/window pods,
  redledger toll platforms/boarding dock/beacon lanes, gilded oval
  scale cladding/turquoise aperture, congregation shrine pods/
  Wakeglass lamps, assembly spinning daughter sub-rings/recursive
  scaffolds, lamplighter gantries/relay crown/maintenance rail);
  the junction lantern stays neutral brass and COEXISTS with the
  overlay at freehold/fx_bastion/gc_auction hubs; overlay anims
  preallocated at build, mutated in place (zero-alloc), frozen
  under reducedMotion; per-assembly overlayMats join rebuild()
  disposal; independent/hollow stay plain brass byte-identical;
  beautiful overgrowth untouched. Harness (boot-test.mjs +609/-2):
  the redmarch planet pin gained a '-station' ancestor exclusion —
  the redledger tribute-vault sphere counted as a 5th planet (the
  wave-5 poiType-exclusion precedent); the wave-38 section pins the
  new surfaces with zero added travel (checks hung on existing
  legs): 150 real spawnLiveShip builds (2 meshes/2 materials,
  shared vcMaterial identity, stern glow, pirate bake position-
  identical + strictly dimmer, fallback byte-identity, qship cover
  cache-key identity), 8 station discriminators + unnamed-
  placeholder and beautiful controls + a real fh_meridian→vd_survey
  rebuild disposal audit, gate overlay part censuses + junction
  coexistence + reducedMotion freeze, and hollow/independent
  negative controls. Reviews: integrated security SHIP (zero
  findings; full consumer census — scene traversals, disposers,
  name lookups, save-controlled keys) + code APPROVE (correct,
  0.87; one P3 latent standing below). Browser-verified (solo
  headless Chrome/SwiftShader): all 8 ship kits live in-system +
  pirate dull variant (baked luminance 0.079 vs trader 0.114) +
  qship cover→reveal captured via a scene.add interceptor +
  stations (7 factions positive reads; lastbeacon dock/undock flow;
  placeholder controls; Bloom control) + gates CLEAN across 14
  system loads incl. a real charge/jump and KeyG route cycling;
  console clean throughout; stills in .chrome-shot/w38/ (untracked
  scratch). npm run test:boot PASS ×7 consecutive; npm run build
  clean (only the pre-existing >500 kB chunk warning).
- Wave 39: faction visual alignment phase 5 — verification, exposure
  rebalance, reducedMotion sweep (orchestrated; phases 1–4 landed in
  waves 37–38, so this closes the plan). THE FINDING: a 33-still matrix
  (10 factions × station/ship/gate, .chrome-shot/w39/, untracked
  scratch) diffed against Docs/FactionExamples/ showed the kits are all
  correctly built and correctly coloured IN THE DATA, but the authored
  hull colour was invisible on every face the sun did not strike —
  ferrous 0x42454b and lamplighter 0x24211c rendered as black
  silhouettes, and at as_census the ancient-core SPHERE read its
  off-white 0xb8b4a8 while the foundry-cell BOXES beside it, same
  palette, read black. Flat faces were the tell. Cause: total fill was
  a flat AmbientLight(0xffffff, 0.15) (starfield.js) plus
  AmbientLight(0x334455, 0.25) per system, while every faction carried
  metalness 0.45–0.7 with NO environment map anywhere in the project —
  MeshStandardMaterial scales diffuse by (1 - metalness) and puts the
  rest in a specular term that needs an IBL that does not exist. Gilded
  was the control that proved it: black ceramic 0x14161a read correctly
  because its target IS black. THE FIX, two levers, both measured not
  guessed: (1) FACTION_STYLE metalness capped at 0.35 for all 12
  factions with relative ordering preserved (ferrous highest 0.35,
  assembly/beautiful lowest 0.15) and roughness nudged up to match; the
  module header records the cap and why, so nobody raises it without an
  envMap. npc.js vcMaterial (ONE shared vertex-colour material for every
  built ship) 0.45/0.55 → 0.28/0.60. (2) starfield.js flat ambient →
  HemisphereLight(0x9fb4c8, 0x2a2418, 2.0) — graded cool-sky/warm-ground
  fill so unlit faces get a value gradient instead of a uniform crush.
  Intensity chosen by masked pixel measurement in headless Chrome
  (render the scene, render again with only the '<faction>-station'
  opaque meshes visible, sample the full-scene buffer through that
  mask): ferrous station median luminance 10.9 → 24.5, assembly 28 →
  46.1, freehold 35.2 → 46.9, while gilded HELD at 7.0 (control intact,
  black ceramic stays black) and the Bloom station did not move at all
  at ANY intensity 0–4 (emissive-driven — zero risk to the wave-36
  pins, and the sun-envelope ratios came back byte-identical at
  [2.076, 0.96, 0.49, 0.24, 0.06]). Rendered value ordering now tracks
  the authored palette ordering. The per-system AmbientLight(0x334455,
  0.25) was deliberately left alone — the cool night-side tint is the
  established look. REDUCEDMOTION SWEEP (the plan's other phase-5 leg):
  an audit found every animation ADDED in waves 37–38 already frozen,
  but three PRE-EXISTING blocks ungated, now closed — station.js
  update() ring spin / lightMat pulse / beacon blink / glow breathe
  (frozen to lightColor, visible true, opacity 0.3 / 0.85; the ring
  keeps its accumulated angle rather than snapping to 0), npc.js engine
  glow across every AI mode (wavers and the telegraph flash freeze at
  scale 1; the disabled flicker freezes at the DIM end, visible false,
  so a dead hull still reads dead; capitulate's engine-cut visible
  false is semantic state and was left alone), and gate.js idle ring /
  chevron / beacon / bore. Also closed: gate.js allocated a string every
  frame during a jump via overlay.style.opacity = opacity.toFixed(3) —
  now quantised to 1/32 steps and written only on change (max deviation
  1/64, endpoints unchanged). The audit gave per-frame allocation,
  shared-asset disposal and cache-key collision a clean bill of health
  for all wave-37/38 code. HARNESS (boot-test.mjs +390): four wave39
  sections — ten-jump leak (a real fh_hearth→…→bt_cradle chain,
  743/743 per-build assets disposed, sharedDisposed=0, live count
  199→186 across ten loads), zero-alloc update (120 frames over three
  stations, three gates and a ship; includes the fade-quantisation
  pin), station reducedMotion (4 factions × animate/freeze/base/resume,
  the wave-38 gate pattern), ship glow reducedMotion (3 factions plus a
  pirate telegraph and the disabled flicker). That work also surfaced a
  latent hygiene gap: gate.js held several shared-by-design caches
  (factionTintCache glowMap/beaconMap/chevronMat, the initGate default
  triple, hexBarGeo/armGeo, the junction lamp texture) that were never
  disposed but were never MARKED userData.shared either, so no
  automated classifier could tell them from a leak — all marked at
  creation (5 marks -> 15) and gate.js now has one convention.
  Verification: npm run test:boot PASS with every wave39 boolean true
  and all wave-36/37/38 sections unchanged; generator re-run zero-diff;
  npx vite build clean (only the pre-existing >500 kB chunk warning);
  browser-verified solo (wave-38 lesson — one browser driver at a
  time) with before/after stills in .chrome-shot/w39/ and
  .chrome-shot/w39/after/, ferrous/lamplighter/assembly/gilded/
  freehold/beautiful stations plus spawned ferrous/lamplighter/assembly
  ships (2 meshes / 2 materials confirmed live). Docs/FactionExamples/
  README.md gained the implementation-status note the plan asked for
  (the references stay non-canonical).
  Orchestration lesson worth keeping: subagents were reliable for code
  audit, harness authoring and mechanical edits, and UNRELIABLE for
  perceptual judgement — one reported the ferrous and lamplighter kits
  as "wholesale placeholders" (they are fully built and boot-pinned)
  and invented filenames that do not exist; another scored almost every
  cell 5/5 by restating the source table instead of looking. The
  diagnosis in this entry came from the orchestrator reading the stills
  directly and then measuring pixels. Delegate the measuring, not the
  seeing.
- Wave 40: title screen — the game finally has a front door (orchestrated;
  four parallel slices, one contract). Before this wave main.js booted
  straight into the sim: save.js restored under you, origins.js threw the
  "who are you" picker up at init, and there was no way to start over
  short of clearing localStorage by hand. The key art
  (public/assets/rimward-title-screen.png, 1672×941 — the wordmark, the
  whale, the lit station and a gate) was already in the tree, unused.
  NEW MODULE src/systems/title.js (initTitle, ~220 lines, update() empty):
  a full-screen overlay id 'rw-title', class 'screen-overlay
  title-overlay', role dialog, holding .title-tagline 'A LIVING FRONTIER',
  one <button class="screen-btn"> per visible entry (id 'rw-title-<action>'
  + data-title-action, label '[N] LABEL' where N indexes the VISIBLE
  entries) and .title-legend 'PRESS 1-n OR CLICK'. CONTINUE only exists
  when save.js hasAutosave() is true, so a save-less boot reads
  [1] NEW GAME / [2] SETTINGS and a restored boot reads [1] CONTINUE /
  [2] NEW GAME / [3] SETTINGS. THE THREE ACTIONS: CONTINUE closes the door
  and sets ctx.flags.paused = false (save.js already restored the world
  underneath at its normal init slot — CONTINUE only reveals it). NEW GAME
  with no autosave closes the door and DELIBERATELY does not touch
  ctx.flags.paused, because origins.js paused at its own init and owns the
  unpause when the player picks — the origin card is sitting at z-index 60
  under the title at 70 the whole time. NEW GAME over an autosave arms a
  confirm first (label becomes '[2] NEW GAME — CONFIRM (ERASES AUTOSAVE)',
  class screen-btn-warm); the second press calls save.js clearAutosave(),
  sets sessionStorage 'rimward-title-skip' = '1' and reloads the page. The
  reload is the design decision worth keeping: resetting a live world in
  place would have to unwind world.js record banks, contacts, mystery,
  epics and the market tables, and every one of those is a place to leave
  a stale reference — a reload is the only cheap guarantee. On the boot
  that follows, title.js consumes the skip marker and returns inert, so
  the player lands straight on the origin picker instead of pressing NEW
  GAME twice. Manual berth slots 1-3 survive a NEW GAME by contract
  (clearAutosave touches only 'rimward-save-v1') — that is the safety
  valve. SETTINGS dispatches a synthetic KeyO so settings.js opens its own
  panel; settings.js was raised z-index 60 → 80 so it is now the topmost
  interactive surface (title 70, pause 50, the 60-level panels, #fatal 99
  above all). INPUT: one capture-phase window keydown listener registered
  FIRST (initTitle is element 0 of the main.js systems array, ahead of
  controls.js and origins.js) — Digit1-9 pick an entry, Enter takes the
  first, KeyO and Escape pass through to the settings panel, and every
  other key is swallowed with preventDefault + stopImmediatePropagation so
  nothing flies, docks, or picks an origin behind a shut door. The
  listener dies with the overlay. No animation anywhere in the screen, so
  the reducedMotion contract needs no branch. CSS (screens.css): the
  .screen-overlay scrim is replaced by a bottom-only gradient over the art
  (a full scrim would waste the picture) and pointer-events flips to auto
  so a click on the backdrop can never reach the canvas and fire the guns;
  body.rw-contrast gets its own .title-overlay rule because the existing
  body.rw-contrast .screen-overlay selector outranks it and would flatten
  the art to a solid field. HARNESS (boot-test.mjs +150): sessionStorage
  is stubbed beside localStorage; 'title' leads the inits array; the boot
  door is dismissed by CLICKING the NEW GAME button before the wave-6
  origin pick — NOT by dispatchKey, because the harness's synthetic event
  carries no stopImmediatePropagation and a dispatched Digit1 would reach
  the title menu AND the origin picker and steal the wave-6 pick (it did,
  on the first attempt; wave6 went red and that is how the leak was
  found). Six wave40 sub-sections pin the menu shape and exact labels, the
  no-autosave pause hand-off, CONTINUE, confirm arming (autosave survives
  the first press, only the autosave dies on the second, berth slots live,
  marker set), skip-marker consumption, and the settings entry leaving the
  door open. Verification: npm run test:boot PASS with every wave40
  boolean true and all wave-6/36/37/38/39 sections unchanged; npm run
  build clean (only the pre-existing >500 kB chunk warning) with the PNG
  copied to dist/assets/; browser-verified solo end to end at 1600×900 —
  fresh title → SETTINGS opens at z 80 over it → Escape closes → NEW GAME
  → origin picker → play → autosave written → reload shows CONTINUE →
  CONTINUE unpauses into the live sim → NEW GAME arms → confirm clears the
  autosave, keeps slot 2, reloads, skips the title and lands on the origin
  picker; console clean throughout; stills in .chrome-shot/w40/
  (untracked scratch — .chrome-shot is now gitignored).
  Orchestration lesson, matching wave 39's: the parallel slices were clean
  for CSS and the small API additions, and the two that needed judgement
  came back wrong in ways only a read caught — the title module wired its
  click handlers through document.getElementById (fine in a browser, dead
  under the harness stub, so no button would ever have fired in a test),
  and the harness slice deleted an unrelated import and asserted a
  contract nobody specified. Read the diff, run the gate.
- Wave 41: faces — the faction character studies reach the screen
  (orchestrated; four parallel slices on one pre-written contract, plus
  the asset bake run by the orchestrator alongside them). Waves 37-39
  matched the reference art for ships, stations, gates and planets; the
  twenty male/female studies in docs/FactionExamples/ had never been
  used, and every person in the game — dockmasters, fences, fixers, the
  pirate demanding tribute — was a name over a paragraph.
  NEW MODULE src/game/portraits.js: PORTRAIT_DIR '/assets/portraits/',
  PORTRAIT_SOURCES (faction id -> reference basename, exactly the TEN
  arted Banners), PORTRAIT_VARIANTS {a:'male',b:'female'},
  portraitVariant(faction, variant) and portraitFor(faction, seed) ->
  {src, variant, alt} | null. The variant is an FNV-1a hash of a stable
  person identity (contact.id at a dock, record.pilot ?? state.name in a
  hail), so a face never moves between sessions and NOTHING about the
  choice is persisted — no save field, no migration. 'hollow' and
  'independent' have no study and resolve to null by design: both
  surfaces then render exactly their pre-wave-41 text-only shape (the
  FACTION_STYLE discipline — never invent a look the sheets do not
  have). The game side carries no gender semantics; 'a'/'b' are neutral
  keys and the README records why.
  ASSETS: public/assets/portraits/<faction>-<a|b>.webp, 20 files,
  384x384, quality 0.82, 485 kB total (source PNGs are ~2 MB each and
  stay reference-only). Baked once through a headless-Chrome canvas
  pass — the project has no image dependency and gained none. The
  per-image crop rectangles are recorded in the README so the bake is
  reproducible; sides differ deliberately (560-620 px head-and-shoulders
  for the human studies, 700-941 px for the full-figure Beautiful Ones,
  Unknowables and Assembly compositions, which read as noise cropped
  tight). Three frames were re-cut after the orchestrator viewed the
  contact sheet: both congregation studies (first estimates were a row
  off and cut the face) and unknowables-b (widened to full height so the
  field silhouette survives).
  STATION (station.js renderPeople): '.people-card > .people-head >
  [img.people-portrait?] + .people-headtext > .people-name +
  .people-meta'. Everything below the meta line keeps its old parent, so
  recognition, hermit note, chart marks and buttons are byte-identical.
  64x64, loading lazy, decoding async, alt '<name>, <role>' — the
  screen reader hears the person, not the banner. FACE SPREAD: two
  studies per faction against up to three contacts per dock, so a plain
  hash showed Mother Tarn and Quiet Hollis the same face (caught in the
  browser, not the harness). renderPeople now claims variants in roster
  order — first claim keeps it, a collider takes the free study — which
  is deterministic because buildRoster order is stable.
  HAIL (hail.js openCard): the card's first child is a flex row holding
  img.rw-hail-portrait (72x72, inline-styled in this file's cssText
  idiom, alt '<speaker> — <faction>') and a text column with the
  existing header/sub/line. Intent buttons still append to the card
  below the row: count, order, '[N] LABEL' text and the Digit1-9
  shortcuts are untouched.
  CSS (screens.css): .people-head / .people-headtext / .people-portrait
  and a body.rw-contrast .people-portrait border lift. Nothing animated
  anywhere in this wave — there is no transition or transform for
  reducedMotion to disable, which is why the wave adds no reducedMotion
  pin.
  HARNESS (boot-test.mjs, wave41a-f): the API contract (determinism,
  both variants reachable, null for hollow/independent/undefined/
  unknown), PORTRAIT_SOURCES shape and src pattern for all ten keys, the
  PEOPLE card at redmarch (structure, src, alt starting with the
  contact's name, lazy/async, 64x64, and the face-spread rule: every
  card carries a face and the first two differ), the PEOPLE card at
  hollowreach (head present, zero imgs), and both hail cases via the
  wave-30 pirate helpers (redledger card carries exactly one
  rw-hail-portrait; independent carries none and keeps its buttons).
  Verification: npm run test:boot PASS with every wave41 boolean true
  and every earlier section unchanged; npm run build clean (only the
  pre-existing >500 kB chunk warning) with all 20 crops copied to
  dist/assets/portraits/; browser-verified solo at 1600x900 — a live
  Red Ledger tribute hail rendered redledger-b at 72 px with the right
  alt and both intent buttons, and Freehold Landing rendered Mother Tarn
  (freehold-b) and Quiet Hollis (freehold-a) at 64 px, naturalWidth 384,
  contrast mode lifting the border to #c3d4e6; console clean throughout.
  Orchestration lesson, the third in a row: the slices that were pure
  mechanical wiring landed clean, and the two that needed judgement did
  not. The station slice REPLACED the contacts.js import line with its
  own import — ten symbols deleted, the whole dock dead — and the
  harness slice invented plumbing wholesale (contactsForSystem called
  with one argument, throwaway contexts instead of travelTo/
  dockAtCurrentStation, and assertions hunting a 'hail-card' class that
  hail.js has never set, so two of its four DOM sections were vacuous).
  Read the diff, run the gate — and look at the screen: the duplicate
  face was invisible to every assertion that passed.
- Wave 42: the Unknowables — Decision D3, the last open item in
  docs/FactionVisualUpdatePlan.md (orchestrated; three parallel slices,
  two corrective rounds, and a visual pass the orchestrator drove in the
  browser). Waves 37-39 gave every FLOWN faction a ship kit, a station
  and a gate overlay; the Unknowables were skipped on purpose, because
  their reference sheets show NO HULL and no generated system flies
  them. This wave builds the no-hull path anyway, so the faction is
  ready the moment anything spawns it.
  SHIPS (npc.js): buildShipMesh gains one branch beside the wave-27
  isBeautiful branch — faction 'unknowables' returns
  buildUnknowablesField(classKey), which NEVER touches vcGeoFor, so no
  'unknowables:*' key is ever written into the vcGeos cache. The group
  is named 'unknowables-field' and holds exactly 12 additive meshes:
  3 'unknowables-loop' (nested magnetic rings on MUTUALLY
  PERPENDICULAR planes — the first cut used three near-coplanar hoops
  with small offsets and collapsed into one ring at flight distance),
  2 'unknowables-arc' (lensing sweeps outside the loop cage),
  6 'unknowables-cell' (small sparks, alternating sizes), and 1
  'unknowables-core'. Geometry is cached per classKey with a size scale
  (frigate 3.2 → light 0.8) and every geometry and material is
  MeshBasicMaterial/AdditiveBlending, userData.shared, never disposed.
  role plays no part: there is no hull to dull, so a 'pirate' spawn
  reuses the identical cached objects — no ':pirate' bake for this
  faction.
  THE CORE RULING (the one real design decision): the core mesh is BOTH
  the visual heart of the field AND userData.glow, the handle every AI
  path writes (updateRoute/engageTarget/updateDuel/updateDisabled all
  call glow.scale.setScalar / glow.visible). An energy field has no
  stern to hang an engine glow off, so the core takes that job — and
  therefore animateField must never write it, or the AI would overwrite
  it in the same frame. userData.fieldParts holds 11 animation records
  for 12 meshes. The first cut animated the core too; the boot section
  caught it as "motion never resumes", because the AI pinned the scale
  back to 1 every frame.
  animateField(parts, elapsed, reducedMotion) sits beside animateOrganic
  in the npc update loop and runs for every live ship regardless of AI
  mode: loops and arcs take absolute rotation from elapsed, cells drift
  on a sine of elapsed plus a deterministic per-index phase. Zero
  allocation; under reducedMotion it returns immediately WITHOUT
  resetting, so parts freeze at their accumulated values (the wave-39
  ruling).
  GATES (gate.js): 'unknowables' joins OVERLAY_FACTIONS (9 now). The
  branch builds nothing solid — the Lamplighter brass ring stays the
  structural base everywhere, per lore. It adds 4 'unknowables-lens'
  sweeps centred on the bore axis, spaced by rotation about Z and
  tilted out of the ring plane, on a new HAIRLINE shared geometry
  (TorusGeometry(1, 0.02, 6, 48, π·0.55) in ensureOverlayShared): the
  unit torus is scaled to ring size, so a normal 0.1 tube became a
  3-unit-thick painted crescent — caught in the browser, not the
  harness. Plus one 'unknowables-plasma' group of 8
  'unknowables-plasma-cell', hidden at build and driven in update() by
  a.unknowablesPlasma.visible = charging (the assembly reference is
  stored at build time; the first cut resolved it with two .find
  closures per gate per frame, and gated it on !reducedMotion — which
  would have HIDDEN the feature for accessibility users instead of
  freezing it).
  HARNESS (boot-test.mjs, wave42a-d): the 12-child census with names,
  core-is-glow-at-origin, additive/shared/not-vertexColors on every
  material, cache identity across two spawns of one classKey AND across
  trader vs pirate; fieldParts length 11 with the core absent, real
  motion unfrozen, frozen-across-frames under reducedMotion and motion
  resuming after; the gate overlay built through the REAL initGate on a
  scoped context (gate.js rebuild() reads the MODULE-LEVEL SYSTEMS
  import, so the faction override goes on SYSTEMS['fh_hearth'] and the
  ORIGINAL value is restored afterwards) with the plasma hidden idle,
  visible during a real ctx.gate.jumping transit, still visible under
  reducedMotion, hidden again after; and negatives — an independent
  ship keeps the wave-37 two-mesh vertex-colored shape, a veridian gate
  keeps its own overlay and gains no unknowables one.
  Verification: npm run test:boot PASS with every wave42 boolean true
  and every earlier section unchanged; npm run build clean (only the
  pre-existing >500 kB chunk warning); browser-verified solo at
  1600x900 — three field ships beside a freehold freighter for scale
  (the field reads as a violet gyroscope cage with a white-gold core,
  not a hull, and stays legible at 40u), and a gate dressed as
  unknowables showing the brass ring crossed by four slim lens sweeps
  under an "UNKNOWABLES SPACE" label, with the plasma group reporting
  visible=true / 8 cells during a live transit.
  Orchestration lesson, the fourth in a row, and sharper: the parallel
  slices produced work that PASSED review-by-summary and failed
  review-by-reading. One slice deleted the wave-38 header paragraph it
  was told to preserve; a corrective slice reported "fixes_applied:
  [header]" and left the file syntactically broken (a variable
  shadowing itself, a builder that never returned its group); another
  reintroduced the exact dead template a previous pass had removed.
  The harness slice ran the gate it was told to skip, then reported two
  failures with confident, wrong diagnoses — the real cause was that
  spawnLiveShip does not push into ctx.ships (traffic.js owns that
  list), so nothing it ticked was ever updated. Read the diff, run the
  gate, look at the screen — and when a subagent's summary and the file
  disagree, the file wins.
- Wave 43: station detail — Freehold Landing rebuilt as a merged-vertex-colour
  sculpt (orchestrated; parallel slices on a fixed contract, then a solo art
  pass). The user rejected the wave-38 station detail level across all eight
  built factions: the per-faction sculpts carried only ~25-30 primitives each
  and read as toy assemblies. This wave rebuilds ONE station — the Freehold
  Compact ("Freehold Landing") — as a genuinely detailed sculpt for review,
  reusing the wave-37 D4 vertex-colour ruling so the detail costs no GPU
  resources. Once approved, the other seven factions follow the same pattern.
  NEW MODULE src/systems/station-detail.js: a deterministic greeble toolkit
  seeded by a 32-bit LCG (no Math.random anywhere). Exports detailBuilder
  (frame stack + named colour channels; build() merges each channel to ONE
  BufferGeometry via mergeGeometries), 6 shape primitives (box, cyl, sphere,
  hemi, torus, cone), and 12 composite greebles (ribBands, windowRow,
  portholeRing, truss, railing, panelPatches, pipeRun, antenna, ladder,
  radiatorPanel, lampString, crate). Every part colour arrives as a hex from
  the caller — the module knows nothing about FACTION_STYLE. Geometry
  ownership transfers to the builder on add()/_addMatrix(): it converts to
  non-indexed, applies opts then the frame-stack matrix, bakes the colour into
  a vertex `color` attribute, and disposes the part at build().
  WHY MERGING WAS MANDATORY (not a stylistic choice): the wave-39 ten-jump
  leak test pins scene-wide resource counts with
  Math.abs(liveAfter10 - liveAfter1) <= 60, where liveAfter1 counts distinct
  geometries + materials + textures reachable from the scene while parked at
  fh_hearth (a Freehold system) and liveAfter10 the same at bt_cradle. The
  pre-wave-43 reading was 195 vs 194 — 1 of 60 margin used. Per-part
  materials or geometries could not scale. MEASURED AFTER: the station carries
  ~600 primitives in 8 geometries + 6 materials + 2 textures (175,775 merged
  vertices, 14,160 of them in the glow chunk), and the scene reading DROPPED
  to liveAfter1=173 — the detailed station is cheaper than the placeholder it
  replaced.
  BUILD CONTRACT (station.js buildFreeholdStation): six merged chunks. hull
  (MeshStandardMaterial, vertexColors) + glow and glaze (MeshBasicMaterial,
  vertexColors) mount directly on the station group; ringHull, ringGlow and
  ringGlaze mount inside the single spinning ringGroup (offset to y = -15 so
  the agri carousel hangs under the raft). lightMat carries glow/ringGlow and
  update() pulses its colour, which MULTIPLIES the vertex colours — so glow
  vertices must stay near-neutral (0xffffff / 0xfff2e2 / 0xe8dcc8; the rule is
  every sRGB channel >= 0.6). Anything needing a different hue lives in
  glaze/ringGlaze, whose material is white and never animated: that is where
  the greenhouse grow-light green 0x35603a sits (a light colour, not a faction
  colour). Reference: docs/FactionExamples/03-freehold-compact-station.png —
  six ribbed pressure drums lying along X on a keel truss, a barn-red ribbed
  centre dome with cupola and lit portholes, a 14-pane glazed barrel-vault
  greenhouse, three domed habitats, a spherical tank farm, a lighthouse mast,
  spine catwalks, radiator wings, mooring gantries with slung cargo drums, a
  railed crate yard, an antenna thicket, pipe runs, 34 surface greebles, and a
  24-lamp agri carousel with 12 glazed growing pods. Palette from
  FACTION_STYLE.freehold: hull 0x6b4f36 warm brown (mass), hullDark 0x3a2c1e
  (truss/seams/ribs), trim 0xd8c9a8 weathered cream (panelling), patch[0]
  0x9a4436 barn red (roofs), patch[2] 0x5b7a94 faded blue (one donated module
  plus radiator fins), scheme.light 0xffb454 warm amber windows.
  INVARIANTS (all survive the rebuild): group.name === 'freehold-station';
  exactly ONE direct Group child (the spinning ringGroup); no PointLight
  anywhere; return via stationRecord(ctx, { scheme, group, lightMat,
  beaconMat }, ringGroup, 31); zero new resources and zero new userData keys
  per frame; everything reaches teardownMesh (nothing userData.shared);
  U.DOCK_RANGE is 45, so the mesh bounding box stays inside |x|,|z| <= 32 and
  y in [-26, 33] (measured x[-29.0,29.1] y[-16.6,32.4] z[-25.5,25.5]; the
  beacon owns the top).
  FOUR BRING-UP BUGS, all in the new code, all found by measurement rather
  than by reading summaries — worth knowing before the next faction:
  (1) detailBuilder.push() composed its frame with ONE module scratch Matrix4
  for both the translation and the rotation, so makeRotationFromEuler
  clobbered the translation before multiply() read it (frame became R*R with
  no offset); fixed with Matrix4.compose from the quaternion form.
  (2) add() pushed into channels[channel] without the lazy-create guard, so
  the first part of any channel threw. (3) _addMatrix() was missing
  _color.setHex(hex), so every oriented member (truss, railing, pipeRun,
  portholeRing, panelPatches) silently inherited the PREVIOUS part's colour —
  which is how near-white window tints leaked into the hull chunk. (4) the
  sculpt's tank-farm block left a b.push() unclosed, offsetting every later
  assembly (gantries, pipes, crates, greebles) by (18, 4, 14) and throwing
  parts to x = 222. Two guards now make (1) and (4) loud instead of silent:
  build() throws on any unclosed push() frame, and _member documents that it
  clobbers the module scratch so callers must hold their own vectors.
  HARNESS (boot-test.mjs): the two wave-38 freehold primitive-parameter pins
  (freeholdDomes: 6 SphereGeometry r=2.6 hemispheres; freeholdSecondRing: 1
  TorusGeometry r=17) can no longer match anything — the parts are merged into
  anonymous BufferGeometry — and are replaced by six pins derived from the
  live scene graph: freeholdMergedChunks (exactly 3 merged meshes on the group
  and 3 in the ringGroup), freeholdVertexColoured (all 6 wear
  vertexColors === true and carry a color attribute of itemSize 3 whose count
  equals the position count), freeholdMergeDiscipline (<= 8 distinct
  geometries and <= 8 distinct materials reachable from the group — the budget
  that lets the detail exist), freeholdDetailDensity (>= 20000 merged
  vertices), freeholdWindowDensity (the glow chunk alone >= 2000 vertices),
  and freeholdEnvelope (a Box3 over MESH geometry only — the stationRecord
  halo Sprites are 150- and 30-unit billboards and would swamp
  setFromObject — inside the DOCK_RANGE envelope). A new wave-43 section adds
  determinism (two independent scoped builds produce byte-identical hull
  position AND color arrays, proving the seeded RNG), paletteFromStyle (every
  distinct hull-chunk colour is a FACTION_STYLE.freehold value within 1/255
  per channel), glowNearWhite (every distinct glow colour converted back to
  sRGB has all channels >= 0.6 — comparing linear values against an sRGB
  threshold reads ~20% too dark and was itself a false failure during
  bring-up), and teardownDisposesAll (the REAL rebuild path: ctx.lastEvents =
  [{ type: 'systemLoaded', to: 'vd_survey' }] then update(1/60), asserting the
  old group left the scene, the new one is the veridian sculpt, and all 16
  first-build resources disposed with none userData.shared).
  VERIFIED: boot test PASS; browser-verified solo at fh_hearth (three camera
  angles) with the model re-tuned twice off the screenshots — the drums were
  laid along Z instead of X (a cylinder's +Y axis needs rz, not rx), the
  greenhouse read as one saturated green tube until it was split into 14 panes
  behind dark mullions and the green dulled to 0x35603a, and the mid-raft was
  blue-dominant until blue was pulled back to one donated module.
  FOLLOW-UP (standing work, NOT a completion): seven built factions still
  carry their wave-38 low-detail sculpts — veridian (18 systems), ferrous
  (17), redledger (12), gilded (8), congregation (3), assembly (2),
  lamplighter (1). Once the user approves Freehold, each gets the same
  toolkit treatment. The eighth built faction is unknowables, who by D3 build
  no station at all. The independent/hollow placeholder stays untouched.
- Wave 44: station detail, round 2 — Freehold rebuilt as packed, skinned,
  connected station. User verdict on wave 43: "still too simple and components
  of the station aren't connected and looks nothing like the associated
  example." Wave 43 delivered the merged-vertex-colour machinery (~600 parts
  in 8 geometries) but the sculpt failed the visual reference: modules floated
  apart with air between them, almost no connective tissue, bare smooth
  cylinder skins where the reference is tiled with panel plates, too few and
  too small windows, a radius-24 agri hoop enclosing a void that the reference
  does not have at all, and too few vertical tiers. Density is affordable: a
  small box is 36 vertices, so thousands of extra parts stay inside the SAME
  8 merged geometries (the wave-39 resource pin that constrains GPU load).
  This wave goes from ~600 to 2,000-3,000 parts.
  NEW TOOLKIT EXPORTS (src/systems/station-detail.js, four additions):
  panelSkin — dense plate grid on a cylinder surface, the plating IS the
  perceived detail. Tiles rows x cols rectangular plates with visible seams,
  mottled colours from a caller-supplied hex array, deterministic per-seed
  jitter, plate size clamped so seams remain on all four sides.
  windowGrid — rows x cols lit window fields, a grid of small boxes at
  caller-specified pitch, centred on a position, oriented along an axis.
  airlock — short fat connector tube with collar rings, the connective
  tissue that makes two modules read as one station: a cylinder spanning two
  points with rings at each end (two rings for the standard call, four total).
  bridge — catwalk deck plus two railings between modules: a deck box
  spanning two points with posts and top rail on each side.
  WEATHERING LADDER (the palette rule): wave 43's paletteFromStyle pin
  required every hull vertex colour to be EXACTLY one of the five
  FACTION_STYLE.freehold colours, which was too tight for weathered reference
  art. The rule widens to a fixed, recomputable product set, not a tolerance
  band: SHADES = [1.0, 0.86, 0.72, 0.6], applied as Math.round(channel8bit *
  SHADES[i]) on each sRGB channel of the deduplicated FACTION_STYLE.freehold
  palette. The allowed hull set is therefore exactly the 5 palette colours
  crossed with the 4 shades (20 values). The sculpt uses only weather(paletteHex,
  i) values; the harness pin recomputes the same product set and requires
  exact membership after converting each vertex colour back to sRGB. Both
  sides MUST use identical arithmetic (Math.round(c * f) on 8-bit channels).
  Glow rule unchanged: every distinct glow vertex colour, converted back to
  sRGB, has all three channels >= 0.6.
  HARNESS CHANGES (boot-test.mjs): freeholdDetailDensity floor raised from
  >= 20000 to >= 120000 merged vertices; freeholdWindowDensity floor raised
  from >= 2000 to >= 30000 glow vertices; freeholdMergeDiscipline unchanged
  (<= 8 geometries and <= 8 materials — proves density stayed free);
  paletteFromStyle reimplemented against the shade ladder (build exact product
  set, convert each distinct hull vertex colour back to sRGB, require exact
  membership, report first stray hex); new connectedness pin that buckets hull
  vertices into 4-unit cubes and fails when more than 2% of occupied cells are
  isolated (a packed pile passes; six drums with air between them does not).
  MEASURED OUTCOME: 368,687 merged vertices across the same 8 geometries and 6
  materials, 33,252 of them in the glow chunk (wave 43 was 175,775 / 14,160 —
  so 2.1x the geometry for zero extra resources). Bounding box
  x[-28.5, 27.6] y[-18.7, 32.4] z[-28.7, 28.7], inside the DOCK_RANGE
  envelope. The connectedness pin reports 0 isolated cells of 738 occupied —
  the mass is fully contiguous, which is the measurement that answers the
  user's "components aren't connected".
  THE SUBAGENT TAX, again: the toolkit slice reported "no existing export
  changed" and had in fact DELETED the `antenna` export, which failed the boot
  import immediately; and the harness slice implemented the shade ladder by
  scaling LINEAR channels instead of the sRGB 8-bit channels, so a correct
  sculpt failed `paletteFromStyle` with a stray that was itself exactly on the
  ladder. Both were found by running the gate and reading the diff, not by
  reading the reports. The wave-42 lesson stands: when a subagent's summary
  and the file disagree, the file wins.
  FOLLOW-UP (standing work, NOT a completion): seven built factions still
  carry their wave-38 low-detail sculpts and await the same toolkit treatment
  once Freehold is approved. The batch order, by flown-system count: veridian
  (18 systems), ferrous (17), redledger (12), gilded (8), congregation (3),
  assembly (2), lamplighter (1). The eighth built faction is unknowables, who
  by D3 build no station at all. The independent/hollow placeholder stays
  untouched.
- Wave 45: station detail, round 3 — the remaining SEVEN factions rebuilt, one
  module per sculpt, harness pins generalised. Phase 6 of
  docs/FactionVisualUpdatePlan.md is now CLOSED: all eight built factions carry
  merged-vertex-colour detail stations.
  MODULE SPLIT: station.js was 2,760 lines of dock UI, job board, market and
  economy; eight sculpts of 400-700 lines each would have doubled it. Every
  sculpt now lives in src/systems/stations/<faction>.js and exports
  `{ ringY, build(b, ringB, st) }` — it imports ONLY station-detail.js, creates
  no THREE object, no material, no Group, and knows nothing of FACTION_STYLE
  beyond the record handed to build(). station.js owns buildDetailStation plus
  the DETAIL_STATIONS dispatch table (replaces STATION_BUILDERS), so every
  shared invariant is asserted ONCE: '<faction>-station' group name, the single
  spinning ringGroup child at spec.ringY, the six merged chunks wearing three
  materials, the beacon at DETAIL_BEACON_Y = 31. A sculpt that forgets a channel
  now throws with the faction and channel named instead of failing inside the
  renderer. The weathering ladder moved to station-detail.js as the exported
  SHADES + weather(hex, i); freehold's fhWeather/FH_SHADES are gone. The seven
  wave-38 low-detail builders, factionKit and put are deleted (clean cutover).
  MEASURED (boot-test census, every faction: 3+3 chunks, 8 geometries,
  6 materials): freehold 368,687 verts / 33,252 glow · veridian 221,495 /
  38,544 · ferrous 387,779 / 32,880 · redledger 165,371 / 30,828 · gilded
  373,067 / 54,672 · congregation 291,497 / 31,356 · assembly 183,371 /
  30,024 · lamplighter 245,339 / 38,004. Ten-jump leak: 498/498 disposed,
  sharedDisposed 0, liveAfter1 172 → liveAfter10 188. Boot test runtime roughly
  doubled (32s → ~60s): eight sculpts are built three times each by the
  generalised loops, which is the price of pinning all eight.
  HARNESS GENERALISED: every wave-38 per-primitive station pin
  (veridianHexTori, ferrousTurrets, gildedScalePlates …) is GONE — merged
  geometry cannot answer a TorusGeometry.radialSegments census. The wave-38
  section now loops the eight factions for the shared contract (mergedChunks
  3+3, vertexColoured, mergeDiscipline <= 8 geos / <= 8 mats, detailDensity
  >= 120,000 verts, windowDensity >= 30,000 glow verts, envelope), and the
  wave-43 section became wave45 detail: determinism, paletteFromStyle against
  each faction's OWN ladder, glowNearWhite, connectedness, seatedDetail, and
  teardownDisposesAll — each sculpt rebuilt into ANOTHER faction's system so its
  own per-build assets are the ones audited (16/16 for all eight).
  NEW PIN — seatedDetail, and the lesson behind it: every numeric pin passed on
  the first round and five of the seven sculpts still looked WRONG in the
  browser. windowGrid is a FLAT field, so a tall grid wrapped onto a round or
  faceted drum grazes the hull at its centre and hangs off at its edges.
  Ferrous sprayed 10.3% of its 50,160 glow vertices into open space (orange
  confetti around a dark fortress); veridian grew blades of windows standing
  clear of the hull; redledger parked a detached 14-unit slab of amber windows
  beside the refinery; gilded hung window blocks off the rotunda. The pin
  buckets the hull chunk into 2-unit cells and requires every glow/glaze vertex
  to find hull material in its own cell or any of the 26 around it, at most 1%
  orphans — measured per chunk for the group AND the ring in its own local
  space. Final readings: freehold 0.54% (the approved bar), redledger 0.38%,
  lamplighter 0.09%, the other five 0.00%.
  The arithmetic every future sculpt needs: a faceted cylinder's flats sit at
  r * cos(PI / seg), NOT at r (an 8-segment drum of radius 18 has its faces at
  16.6), and a field of half-extent H must be SUNK to sqrt(rFlat^2 - H^2), not
  placed at rFlat * 0.96. On spheres and domes use portholeRing, which is built
  from an explicit radial basis and cannot float. Prefer many small per-facet
  fields over one wide wrapped grid.
  TWO STRUCTURAL DEFECTS ONLY THE BROWSER FOUND: lamplighter called
  panelSkin(r: 17.5, axis: 'x') and ribBands(r: 17.8, axis: 'x') on a FLAT yard
  deck — with axis 'x' both wrap a cylinder in the YZ plane, so at radius 18
  they built a 36-unit plated cage around the entire station (and pinned the
  bbox floor at exactly -26.0, 0.02 units of margin). Every numeric pin passed;
  the station rendered as a black checkered pod with the depot invisible inside.
  Assembly's daughter-print ring hung below the mass with open air between them
  — the wave-43 rejection reproduced — and was packed against the belly
  (ringY -12.5 → -9, radius 13.5 → 9, plated stem plus four truss cradle arms).
  METHOD NOTE for the next visual pass: the harness cannot see a silhouette.
  Drive the real game — vite dev, Chrome spawned with
  --use-angle=swiftshader --enable-unsafe-swiftshader (headless Chromium has no
  WebGL and main.js's fatal screen catches it), window.__ctx to set
  world.currentSystem and emit 'systemLoaded', ctx.flags.paused = true to freeze
  the camera, then place ctx.camera by hand and screenshot. Two framings per
  faction (46/26/46 and 26/10/26) found every defect above. To locate an
  offending call, wrap the builder and record each add()'s world bounding box,
  then sort by diagonal — that is how the lamplighter cage was identified in
  one pass.
  THE SUBAGENT TAX, again: seven sculpt agents all reported "all pins pass" and
  all seven were telling the truth about the NUMBERS. The numbers were not the
  contract the user cares about. Two more rounds of fix-up agents (7 then 2)
  were needed, each driven by screenshots and by a metric added AFTER the defect
  was seen. When a report and the render disagree, the render wins.
- Wave 46: the placeholder loses its live sites — independent and hollow get
  detail sculpts, plus a per-SYSTEM seed. User verdict on the placeholder, seen
  in-game during the wave-45 tour: "this one is BS". It was the pre-wave-43
  sculpt (21 meshes, 2,407 verts, 9 geometries, 7 materials, no vertex colours)
  and it served FIFTEEN live systems: 12 independent + 3 hollow.
  WHAT SHIPPED: src/systems/stations/independent.js — "the Anchorage", a dead
  freighter's keel with mismatched hulls lashed along it at spacing smaller than
  their diameter, accretion stacks, tethered salvage, and a crane cradle holding
  a half-stripped derelict; and src/systems/stations/hollow.js — "the Vigil", a
  stepped watch-post tower whose crown collars and catwalk rings are traced in
  lantern strings, three dishes standing clear of the mass, a mast reaching y 24
  to meet its own beacon at 31, and a sealed shrouded ring beneath. Neither
  faction has reference art (faction-style.js says so); both designs come from
  the lore. DETAIL_STATIONS now carries 10 keys and the placeholder has NO live
  site — it survives as the fallback for an unknown faction key, pinned through a
  synthetic faction override instead of a real system.
  MEASURED — independent, all 13 systems: 188,975-243,792 verts, 33,864-79,368
  glow, singleMass 100.0%, 13 distinct hull geometries. hollow, all 3: 154,986
  -159,402 verts, 36,684-37,008 glow, singleMass 100.0%, bbox y[-23.0, 25.0],
  3 distinct geometries.
  NEW IN THE CONTRACT — build(b, ringB, st, seed). station.js seedForSystem() is
  FNV-1a over the system id; a sculpt authored for a whole faction would
  otherwise repeat itself 12 times across independent space. The seed varies
  DRESSING only — optional spurs, crate and pod layout, which drums are lit, plate
  shade mixes, dish aim, lantern and plaque counts — never the tiers or any pinned
  number. Same id always yields the same seed, so the determinism pin holds. The
  eight reference-art factions ignore the argument.
  NEW PIN — singleMass. connectedness only counts hull cells with no 6-axis
  neighbour, which a detached CLUSTER passes trivially because its members touch
  each other. The hollow bring-up hung its mooring spurs at y -16..-24 with
  nothing reaching them — a 12-cell island, visible on screen as loose boxes under
  the station — and connectedness waved it through. singleMass flood-fills the
  4-unit grid and requires the largest component to hold >= 97% of cells.
  Calibrated on the approved sculpts: freehold/veridian/redledger/gilded/
  congregation/independent 100%, ferrous 99.7%, assembly 99.6%, lamplighter 99.5%.
  NEW PIN — the per-system sweep (wave46 section). A per-faction representative
  stops being enough coverage the moment a sculpt varies by seed: the first
  independent build scaled its lamp populations with the seed and the ONE system
  that drew the low end — blackstation, a generated hub with live traffic — landed
  at 25,692 glow vertices against a 32,000 floor while all twelve others passed.
  The sweep now runs EVERY live system of both seeded factions through the real
  initStation path for density, glow, envelope, seating, packing and single mass,
  and proves the variation is real (one distinct hull signature per system).
  THE SUBAGENT TAX, worse this wave, and worth recording precisely. Six agent
  passes over two files produced: an envelope breach of -32.2 against a -26 floor
  reported as "envelope PASS"; a ring authored in WORLD coordinates and then
  offset again by ringY, so ringGlaze sat at world y -30; a sweep run against
  station DISPLAY NAMES instead of system ids, which is why blackstation was never
  measured; a fix that silently dropped the sculpt's height from y 20.6 to 10.2;
  and finally a file that DID NOT PARSE (duplicate `plaqueCount`, duplicate
  `mx2`) submitted as "ALL ACCEPTANCE CRITERIA PASS", with b.push()/b.pop() frames
  wrapping ringB emissions so every ring part landed at the hub, and dead code
  above y 12 (measured: 0 hull vertices above y=12 while the report claimed a mast
  top at 28). After the third failed pass hollow.js was rewritten by hand, which
  took less time than the three delegated attempts. THE RULE: measure the FILE,
  never the report — every one of those defects was found by running a
  measurement, none by reading a summary.
  METHOD NOTE: the browser-verification loop from wave 45 caught the visual
  failures again (independent's untethered junk cloud, hollow's muddy silhouette).
  One trap worth remembering: a Chrome window that is OCCLUDED reports
  document.visibilityState 'hidden', which stops requestAnimationFrame, which
  freezes the sim — and main.js still runs its end-of-frame ctx.events sweep, so a
  queued jumpRequested is silently discarded. Launch with
  --disable-features=CalculateNativeWinOcclusion --disable-backgrounding-occluded-windows
  --disable-background-timer-throttling --disable-renderer-backgrounding, and
  confirm ctx.elapsed advances before queueing an event.
  Screenshots: .chrome-shot/w46, w46r2, w46r3.
- Wave 47: the faction ship detail pass — ten fleets, and the wave that proved a
  numeric pin can be unanimously green on the wrong shape. User brief: "the
  station Phase 6 treatment, applied to ships", the goal being the concept art in
  docs/FactionExamples. The player ship is out of scope by instruction.
  WHAT SHIPPED: ten modules under src/systems/ships/ (one per faction, all six
  classKeys each — 60 sculpts), npc.js FACTION_VC_PARTS deleted in favour of the
  DETAIL_SHIPS dispatch, a `lights` chunk on the faction glow material beside the
  `hull` chunk, the wave-38 ship pins rewritten for three children, a wave47
  harness section measuring all 60, and two new dev instruments
  (scripts/measure-ships.mjs, scripts/probe-ship.mjs). MEASURED, every class of
  every faction: hull 3,036-48,408 verts, lights 216-4,644 (all <= 25% of hull),
  singleMass 97.2-100%, orphan lights 0.0-1.9%, palette strays none.
  THE LESSON OF THE WAVE, and it is a new one. Round 1 landed 60 sculpts that
  passed density, envelope, packing, seating, palette and determinism — and
  rendered as ten fleets of PLATED DRUMS. Barrels standing on end: height equal to
  beam, length barely exceeding either, a flat disc for a face. The pins were all
  true and the ships were all wrong, because no pin described PROPORTION. Worse,
  the envelope table I had published could not even express the reference art: at
  18.0 x by 26.0 z the widest legal frigate is 1.44 times longer than it is wide,
  while every ship on overview-ships.jpg is 4-6 times longer than its beam. So the
  envelope was rewritten (frigate 9.0/6.0/26.0, light 1.3/0.9/3.4) and two pins
  added — spanZ >= 2.4 * spanX, spanY <= 0.75 * spanX — and all ten factions were
  reshaped in a second round. WRITE THE PIN THAT DESCRIBES THE THING YOU ACTUALLY
  WANT; a contract that cannot express the target will be satisfied by something
  else.
  THE SUBAGENT TAX, third wave running, and the shape of it is now predictable.
  Round 1's ten agents reported success and produced: NaN vertex positions from
  `r: 0` on a cylinder-wrapping helper; Math.random inside a build; a third
  channel named `glow`; an entire faction authored along the X axis; two modules
  that threw before emitting a vertex (29 unclosed push frames, a missing import);
  near-whites baked into the hull channel; radii from 0.32x to 1.74x of target;
  lit strips floating up to 42% clear of the hull. Nine of the ten reported "all
  constraints satisfied" for those files. Every defect was found by RUNNING A
  MEASUREMENT, none by reading a report. freehold burned two more agents (one 90
  minutes, one 45) without changing a byte and was then written by hand in one
  pass — the wave-46 hollow precedent, repeated exactly. The fix that changed the
  economics was giving agents an instrument they could run themselves
  (measure-ships.mjs, 3 seconds, names the failing class) and making ALL PASS the
  acceptance criterion instead of a prose description.
  REVIEWS found three CRITICALs, all one bug class and all pre-existing: raw
  bracket reads on save-controlled strings. record.faction/classKey come from save
  data, so `VC_PARTS[classKey]`, `styleFor()`, `vcGlowMats[faction]`,
  `unknowablesGeos[classKey]` and `dulledStyles[faction]` each resolved
  '__proto__' / 'constructor' / 'toString' through Object.prototype to a truthy
  non-spec value — a crafted or corrupted save could crash the update loop, or
  smuggle Object.prototype into a live Mesh as its material. All now own-key
  guarded, styleFor included. The ship geometry cache key became JSON (a faction
  literally named 'a:b' collided with classKey 'b:c' under concatenation) and every
  unknown faction now collapses to ONE canonical cache entry per class, because
  they all render the same bake anyway — the never-disposed caches are bounded by
  the faction table again instead of by whatever a save contains.
  VERIFIED: measure-ships ALL PASS (60/60); boot test PASS; browser-verified solo
  at fh_hearth, two framings per faction, which is what caught the drums. Note
  wave30 payTribute is a pre-existing FLAKY pin (a random roll) — it failed once
  across a dozen runs and passes on re-run; unrelated to this wave.
  Screenshots: .chrome-shot/w47 (r2-* are the reshaped fleet).
- Wave 5 of the faction rebuild (commit b06a25f): the Freehold Compact fleet,
  re-authored from the reference corpus, and the wave that put the GLB asset
  pipeline on the record. The procedural src/systems/ships/ path is RETIRED and
  deleted; NPC hulls are Blender-baked Meshopt GLB LODs.
  METHOD IS DOCUMENTED: docs/ShipAssetPipeline.md is the repeatable process —
  file layout, the four commands (blender bake, compress-ship-assets,
  measure-ships/probe-ship-islands/validate-ship-assets/test:boot, silhouette and
  render sheets), every gate with its threshold, the eight corpus authoring rules
  from docs/SpaceShipIdeas/synthesis, the orchestration recipe for one agent per
  class, and a failure-mode table. Read it before touching a ship.
  docs/FactionShipRebuildPlan.md stays HISTORICAL — it documents the retired
  procedural path, not current work.
  WHAT SHIPPED: scripts/ship_builders/freehold became a package (surface.py holds
  the shared hull-surface queries and the absolute human module; one file per
  class holds one body plan). The cutter moved unchanged and re-measured
  identically; light, ace, heavy, frigate and freighter are new. Each ship carries
  three zones with real seams, one detail band on calm hull, an empty open truss
  gap as the faction thumbnail signature, a countable nozzle group, flat empty
  radiators, and windows repeated at one fixed pitch instead of scaled. The
  frigate berths a docked craft in its rescue hangar; the freighter nests a family
  craft and a container in open bays.
  MEASURED: light 6000v/7.2, ace 4720v/7.1, cutter 10988v/10.3, heavy 14340v/17.0,
  frigate 18236v/29.7, freighter 78868v/76.6 — ladder monotone, every class inside
  its SHIP_SCALE hull band, proxy cover 100 % on all six.
  VERIFIED: measure-ships freehold ALL PASS; probe-ship-islands ONE CONNECTED BODY
  for all six classes; validate-ship-assets PASS (72 sources, 228 Meshopt LODs,
  228 GLB content checks); test:boot PASS with freeholdSpan/Proportion/Pivot/
  ProxyCover/ClassOrdering true. Sheets: out/silhouettes/freehold-{shape,scale,
  render}.png.
  WHAT THE GATES CAUGHT, and the lesson: the first authoring round was green on
  span, ratios, pivot and proxy while heavy had 5 floating part groups, frigate 21
  and freighter 9 — fittings placed at typed coordinates instead of seated on the
  loft, plus a freighter lod2 at 8576 triangles against an 8000 cap. Proportion
  pins cannot see a floating window row. probe-ship-islands is the authoring gate;
  run it per class, immediately after each bake.
- Wave 6 of the faction rebuild: the RED LEDGER fleet, six hand-authored classes on
  the Blender GLB pipeline, and the wave that put the REFERENCE ART on the record as
  a required input.
  WHAT SHIPPED: scripts/ship_builders/redledger/ as a package — surface.py (hull
  queries + the absolute human module), hardware.py (15 equipment constructs: weld
  beads, capture collars, tally bands, grapple arms, clamp pads, breach tube,
  shutter wells, ransom vaults, counting houses, transfer locks, captured drives,
  reverse blocks, ram prow, lamp runs, radiators), salvage.py (the faction's own
  surface language: plate_quilt, stripe_block, stripe_group, salvage_boom) and
  donors.py (CAPTURED PARTS OF OTHER FACTIONS: a Combine instrument head, a
  Hegemony rib belt, a Compact habitation drum, a Chain scale panel, plus weld_strap
  and cut_edge), then one file per class. redledger added to PILOTS in
  build-ship-assets.py; ship_skins/redledger.py panel retoned #7B5C3A -> #5E4630
  (weathered salvage, not bright copper) with panel_density 0.50 -> 0.34.
  MEASURED: light 19,072v/7.1, ace 13,764v/7.4, cutter 24,522v/11.9, heavy
  30,682v/17.1, frigate 58,336v/33.4, freighter 110,560v/79.3 — ladder monotone,
  every class inside its SHIP_SCALE hull band, proxy cover 99.2-100 %, len/beam
  2.37-4.29 (the faction is a WEDGE family, so the small classes run 3.3-4.3).
  VERIFIED: measure-ships redledger ALL PASS; probe-ship-islands ONE CONNECTED BODY
  for all six; validate-ship-assets PASS (72 sources, 228 Meshopt LODs, 228 GLB
  content checks) with freighter lod0 56,052 tris against the 60,000 cap; test:boot
  BOOT TEST PASS with redledgerSpan/Proportion/Pivot/ProxyCover/ClassOrdering true;
  sheets at out/silhouettes/redledger-{shape,scale,render}.png; browser-verified in
  the Models Browser (real Chrome, --use-angle=swiftshader) at entries 24-34.
  THE LESSON OF THE WAVE, and it is the important one: the first pass was authored
  from the bible §4.4 PROSE ALONE. It passed every numeric gate and was rejected on
  sight as six smooth lozenges wearing copper boxes. Nobody had opened
  docs/FactionExamples/04-red-ledger-ship.png (a long low faceted plated wedge at
  ~5:1, whole-flank plate quilt, dried-red VERTICAL panels, copper only as patina,
  tiny amber slits, a skeletal boom slung under the bow) or
  docs/SpaceShipIdeas/synthesis/21 §G6 (Red Ledger = exposed-frame SALVAGE, with
  CAPTURED PARTS OF OTHER FACTIONS bolted on) and §G2 (its outline-breaker is the
  salvage boom, >= 15 % of hull length). The re-authoring round added all of it.
  docs/ShipAssetPipeline.md §4 now makes reading the render and the synthesis files
  a required step in every class brief.
  THE SECOND LESSON: the kit is NOT uniform about size — kit.box/plate_grid/
  panel_lines/greeble_field take HALF extents, kit.chamfer_block/taper_block/wedge
  take FULL extents, kit.plate_course mixes the two. No gate can see the error, so
  it cost a corrective round in EACH direction (seam beads twice the hull beam;
  then a ram detached from its own hull). The table is now in the pipeline doc.
  NEW INSTRUMENTS: scripts/probe-ledger-parts.py builds every shared construct at
  all four detail levels and reports NaN, degenerate parts, illegal roles and
  bounding boxes (~3 s, and it must call view_layer.update() before reading
  matrix_world); scripts/probe-ship-extremes.py names the parts that SET each span
  and, with --at, names the part at a float's post-centring coordinates. The second
  one found in one run what two rounds of station-narrowing had missed: a single
  drive's 6-nozzle group was laid in ONE row 15 units wide by kit.engine_bank, so
  hw.captured_drive now lays a grid bounded by the housing face.
  ALSO FIXED CENTRALLY: sv.plate_quilt and sv.stripe_group take a `surf` callback
  and re-sample the surface per plate (one figure per run floated 135 groups on the
  frigate and 47 on the freighter); capture_collar ribs moved off the chamfered
  corners onto the four flat faces.
  SUBAGENT NOTE: one agent ran two hours reconstructing voxel coordinates by hand
  and edited nothing; it was cancelled and its work redone in 30 minutes with an
  explicit ban on running instruments. Diagnose centrally with the probes, hand the
  agent the named part, and forbid the archaeology.
  NEXT FACTION: gilded (the Gilded Chain, bible §4.5) per FACTION_REBUILD_ORDER in
  src/game/ship-scale.js. Its brief is written up in docs/ShipAssetPipeline.md §8
  — read §0 (the reading order) and §8 (what the Gilded render actually shows, what
  to reuse, what NOT to carry across from the Ledger) before authoring. ferrous is
  a separate small wave: it predates the pilot pipeline and still has only three
  hand-authored classes.
- Wave 7 of the faction rebuild: the GILDED CHAIN fleet, six hand-authored classes
  on the Blender GLB pipeline, and the wave that proved the FOUNDATION-FIRST order
  and corrected the pipeline doc's own size-convention table.
  WHAT SHIPPED: scripts/ship_builders/gilded/ as a package — surface.py (12 loft
  queries, the Chain human module, and four surf_* CALLBACK FACTORIES so a class
  author never hand-writes a lambda: surf_flank/surf_top/surf_bottom/surf_flat all
  return 0.0 off the section so every run self-trims), shell.py (the faction's own
  surface language: scale_course, scale_field, ivory_margin, gold_line,
  collar_band, gallery_slot, aperture_seam, edge_keel) and hardware.py (11
  equipment constructs: tractor_lens, capture_collar, transfer_chamber,
  observation_rotunda, ventral_pylon, drive_face, radiator_vane, mast_cluster,
  marker_run, vault_body, docked_leaf), then one file per class. gilded added to
  PILOTS in build-ship-assets.py; scripts/probe-gilded-parts.py smoke-probes every
  shared construct at all four detail levels in ~4 s. ship_skins/gilded.py retoned:
  base #191B1D -> #23272A, trim_mult 0.94, accent_density 0.16 -> 1.0, and the
  legacy secondary_parts/accent_parts substring pools DELETED because every part
  now carries an explicit skin_role.
  MEASURED: light 10,756v/7.2, ace 12,288v/7.3, cutter 17,776v/10.0, heavy
  22,056v/16.3, frigate 42,624v/29.6, freighter 98,912v/76.6 — ladder monotone,
  every class inside its SHIP_SCALE hull band, proxy cover 100 % on all six,
  len/beam 3.42-4.33 (the faction is a CRESCENT family, so it runs longer and
  lower than the Ledger's wedge: ht/len 0.13-0.25). lod0 triangles 5,584 / 6,572 /
  9,320 / 11,656 / 21,768 / 50,348 against the 60,000 cap.
  VERIFIED: measure-ships gilded ALL PASS; probe-ship-islands ONE CONNECTED BODY
  for all six at lod0; validate-ship-assets PASS (72 sources, 228 Meshopt LODs, 24
  KTX2 atlas sets, 96 PNG and 228 GLB content checks); test:boot BOOT TEST PASS
  with gildedSpan/Proportion/Pivot/ProxyCover/ClassOrdering true; sheets at
  out/silhouettes/gilded-{shape,scale,render}.png; opened in the Models Browser
  under real Chrome (--use-angle=swiftshader) at two framings per class.
  THE PIPELINE DOC WAS WRONG, and it cost the first foundation pass: wave 6's
  size-convention table said kit.box/plate_grid/panel_lines/greeble_field take HALF
  extents and plate_course mixes conventions. The kit source says otherwise —
  kit.box does obj.scale = size/2 on Blender's default 2-unit cube, so EVERY kit
  size argument is FULL extents and only cyl/torus/strut take a radius. The table
  was quoted verbatim into the foundation brief, hardware.py halved every absolute
  human constant, and every window, hatch and lamp came out half human size. §6 of
  docs/ShipAssetPipeline.md now carries the verified table with the reason the old
  one was inverted, and two failure-mode rows were rewritten.
  FOUR DEFECTS THE GATES CANNOT SEE, all found by render or probe, none by a pin:
  (1) kit.hull_loft is CENTRELINE-LOCKED — its station tuples carry no x term and
  it builds at the origin — so ventral_pylon's port and starboard blades stacked on
  the centreline while their gold edges and tip glows sat correctly outboard; the
  island probe caught only the orphaned tip glows. docked_leaf had the same bug,
  which would have emptied the frigate's berth and the freighter's bay. Both now
  set obj.location.x after the loft. (2) gallery_slot built its well OUTBOARD of
  the skin: a 0.22-proud box with the panes flush at the surface — a light box
  applied to the flank, and on the light it was what set measured spanX. `depth` is
  now the INBOARD well depth and the construct can protrude at most 0.07. (3) An
  open aperture_seam emitted its glow line INSIDE the recess strip's solid volume,
  so the one lit aperture per class showed nothing; strip, lips and glow now sit on
  three distinct planes. (4) The freighter's whole nested bay — leaf plus eight
  crates — floated as one 12,145-cell island because it sat in the bay wall box's
  INTERIOR. Two nested shells share no voxel: an overlap only connects when two
  SURFACES intersect. The cradle pad now pierces the wall face.
  THE ART ROUND THAT MATTERED: the first bake passed every gate and rendered six
  smooth black hulls. Two causes, both invisible to the harness. Every scale in a
  course sat at the SAME outboard offset, so the fore-aft laps and the lateral
  course joints were coplanar and the lamellar shell did not exist — shell.py now
  steps each scale outboard on a 3-scale cycle (_SCALE_STEP 0.022), which costs no
  geometry. And the ivory two-tone measured 3 % of hull vertices: the charter's
  loudest feature was a one-plate ribbon on every class. Six agents rebuilt it as a
  per-row REGION covering most of the forward flank's height (15-25 % of broadside
  flank area), each row seated with its own sf.surf_flank so it follows the chamfer.
  A raked pylon that reads as a whisker was the third correction: ventral_pylon
  interpolates its LE/TE lines to a 40 % tip chord, so a tip placed far aft tapers
  to a needle — the cutter's blade ran 6.58 units, 60 % of the hull, 1.7 past the
  transom. Tips now sit ~0.35 chord aft of the root, and the ace's transom was
  stretched to l*0.520 so the LOFT sets its span and the ladder stays monotone.
  NEXT FACTION: beautiful (The Beautiful Ones, bible §4.6) per FACTION_REBUILD_ORDER
  in src/game/ship-scale.js. Its brief is in docs/ShipAssetPipeline.md §8. Note it
  is the first faction whose construction logic is GROWN BODY (§21 G6: no panel
  lines, flow-line detail, lights on the flow lines) and the first with proportion
  relief in FACTION_PROPORTION_RELIEF (manta plan, minLengthOverBeam 0.55), so the
  scale-course and plate-quilt idioms of waves 5-7 are all wrong for it. ferrous is
  still a separate small wave: it predates the pilot pipeline and has three
  hand-authored classes.

## Next round candidates (wave 48)
- Wave 47 contract notes for future work: Phase 7 of
 docs/FactionVisualUpdatePlan.md is the ship detail pass, and it is CLOSED — all
 TEN faction ship kits are merged-vertex-colour detail sculpts. npc.js
 FACTION_VC_PARTS is DELETED; the dispatch is DETAIL_SHIPS (10 keys: the 8 with
 ship reference art plus independent and hollow from the lore), which now carries
 the SAME key set as station.js DETAIL_STATIONS, while gate.js OVERLAY_FACTIONS
 stays at 9 by design. Adding or reworking a ship means ONE file:
 src/systems/ships/<faction>.js, exporting
 `{ <classKey>: { glowZ, build(b, st) } }` for all six classKeys. That module
 imports ONLY station-detail.js — no THREE, no material, no Group, no
 FACTION_STYLE lookup — and npc.js's shipGeosFor/buildShipMesh own every shared
 invariant.
 NO SEED, unlike stations: a ship geometry is cached per faction:classKey and
 shared by every spawn of that key, so per-ship variety would mean per-ship
 geometry. One bake per key, forever, from fixed literal seeds.
 TWO CHANNELS, THREE MESHES, TWO MATERIALS. `hull` wears the shared vcMaterial;
 `lights` wears the per-faction additive glow material, whose colour is
 style.glow and MULTIPLIES the chunk's vertex colours — so lit parts are authored
 NEAR-WHITE (every sRGB channel >= 0.6) and the material supplies the hue, the
 station lightMat model. Child order is fixed: [0] hull, [1] lights, [2] the
 engine-glow sphere, ALWAYS last and always userData.glow. A fallback
 (unknown-faction) ship keeps two children and no lights chunk. The glow sphere's
 shared geometry now carries an all-white colour attribute, because the material
 it rides has vertexColors and would otherwise render it black — glowGeoShared()
 bakes it once for whichever path asks first, organic or built.
 THE PIRATE BAKE IS EXACT NOW: the same build with dullStyleFor, so hull
 positions are byte-identical and hull colours never brighter, and the lights
 chunk is identical in BOTH positions and colours, because that channel carries
 no st value at all.
- Wave 47 measured-pin notes: the wave47 harness section measures all 60 sculpts
 (10 factions x 6 classKeys, no representatives) on the real spawnLiveShip path
 plus a direct double build for determinism. Two pins are new in kind and both
 exist because ROUND 1 PASSED EVERYTHING ELSE AND RENDERED TEN FLEETS OF PLATED
 DRUMS: `proportion` — spanZ >= 2.4 * spanX and spanY <= 0.75 * spanX — is the
 measurable form of "reads as a ship", taken from overview-ships.jpg, where every
 ship is 4-6x longer than its beam with its height well under its beam. And the
 singleMass grid is EDGE-SAMPLED at ship scale: bucket every triangle edge at
 half-cell steps, never the raw vertices, because a 4-unit box carries vertices
 only at its 8 corners and a vertex-only grid reads a solid spine as a chain of
 islands. The orphan-lights cell is ABSOLUTE (1.0 unit) at every class size, so a
 lamp offset that looks snug on a light ship floats free on a frigate.
 TWO INSTRUMENTS SHIPPED WITH THE WAVE, and they are the reason it converged:
 `node scripts/measure-ships.mjs [faction]` builds all 60 sculpts in 3 seconds
 and names the failing class; `node scripts/probe-ship.mjs <faction> <class>`
 wraps the builder and names the LINE that emitted each defect, plus the widest
 primitives by bbox diagonal (the wave-45 cage-finder). boot-test remains the
 authority; these make the bring-up loop possible.
 THE TOOLKIT IS SHARED NOW: station-detail.js serves stations AND ships. Its hex
 ARITY is per helper and cost this wave real time — panelSkin/panelPatches take
 an ARRAY, airlock/bridge/antenna/radiatorPanel take two, everything else one. A
 wrong-arity hex bakes Color.setHex(undefined), which is NaN, which reads back as
 #000000 and fails only the palette pin. `r: 0` on a cylinder-wrapping helper
 normalises a zero-length radial vector and sprays NaN through the whole part,
 which reads out as radius 0.0 beside a non-zero bbox.
 ONE PIN WAS RETIRED at closeout and the reason generalises: sizeRatio compared
 the sculpt radius against [0.85, 1.45] x the VC_PARTS fallback radius, using
 hand-computed fallback literals. When the harness measured the real bake instead,
 the hand arithmetic proved 15% out for `heavy` (7.0 estimated, 6.10 actual) and
 the DERIVED band came out tighter than the AUTHORED absolute band, failing three
 heavies the contract accepts. Authored world-unit numbers win over a derived
 proxy; the fallback radii are still measured and printed for whoever next edits
 the table.
- Wave 48: the Models Browser — a 3D gallery for every model the game builds,
  reachable from the title screen so the art can be inspected without a pirate
  on the tail. `[2] MODELS` sits between NEW GAME and SETTINGS; the title stays
  open behind it (the SETTINGS precedent).
  WHAT SHIPPED: src/game/model-catalog.js — 220 lazy entries in six categories
  (Ships 144 = 12 factions x 6 classes x trader/pirate, Stations 12, Gates 13,
  Landmarks 10, Celestial 36, Props 5), each `{ id, label, category, faction?,
  build() }` where `build()` returns `{ object, update? }` and allocates nothing
  until it is called. src/systems/modelsbrowser.js — the overlay: its OWN
  WebGLRenderer, scene, camera and rAF loop, because main.js renders
  (scene, camera) unconditionally every frame and a shared renderer would fight
  it. OrbitControls, a local 1,500-point star shell, solarsystem.js's live light
  values so hulls read as they do in flight, a filter box, category tabs,
  arrow-key navigation, R to re-frame, Escape to close, and a per-model
  turntable that stops on the first drag. src/ui/models.css. Registered in
  main.js between initGalaxyChart and initHud; title.js reaches it lazily
  through `ctx.models` at CLICK time, which is why it may init after the title.
  THE MODEL SIDE IS PURELY ADDITIVE: npc.js exports buildShipMesh +
  animateShipMesh; station.js buildStationModel; gate.js buildGateModel;
  landmarks.js buildLandmarkModel; solarsystem.js buildStarModel /
  buildPlanetModel / PLANET_SLOT_COUNT; asteroids.js buildAsteroidModel;
  pods.js buildPodModel. Each returns an unparented, origin-centred Object3D
  plus the same per-frame visual math the live system runs.
  ONE REAL REFACTOR: gate.js's assembly builders lived inside initGate's
  closure and read mutable per-rebuild state, so the first pass at
  buildGateModel hand-copied 540 lines of sculpt. That was rejected. The
  builders are now module scope — gateShared() (one lazy singleton holding the
  resources initGate used to own), buildAssembly(gateDef, faction, beautiful),
  buildOvergrowth, buildOverlay, buildJunctionExtras, animateAssembly — and
  initGate and buildGateModel call the SAME code. gate.js went 1,107 -> 1,058
  lines with the duplicate gone.
  FOUR DEFECTS THE HARNESS ALONE WOULD NOT HAVE CAUGHT, all in the hoist or the
  overlay: (1) rebuild() lost `root.add(a.group)`, so gates built fine and never
  entered the scene; (2) animateAssembly collapsed `charging` (the departing
  gate's own flag) and `ctx.gate.progress` into one number — a transit opens at
  progress 0, so the wave-42 plasma cells and the charge swirl never appeared;
  (3) `ovShared` was created but not exposed on the shared singleton;
  (4) main.js came back with a DUPLICATE `initGalaxyChart` import (a hard
  SyntaxError — the app did not load at all) and a deleted `window.__ctx`.
  TWO MORE only the render showed: the sidebar's flex column shrank all 144 Ships
  rows to 14px and clipped the text (`flex: 0 0 auto` on the row), and framing on
  `Box3.setFromObject` measured the additive glow SPRITES — a station read radius
  108 for a 35-unit hull, a star 261 for a 60-unit sphere — so measureModel()
  now unions Mesh/Points children only and skips billboards.
  ONE ORDERING TRAP worth remembering: capture-phase listeners on the same
  target fire in REGISTRATION order, not z-order. title.js registers its
  swallow-everything keydown first (by design, wave 40), so it ate the browser's
  arrows and R. title.js now early-outs while `ctx.models.isOpen()`.
  INSTRUMENT SHIPPED: `node --import ./scripts/with-css-stub.mjs
  scripts/probe-models.mjs [idSubstring]` builds all 220 entries headlessly,
  ticks each update() three times (including a reducedMotion pass), and reports
  mesh/triangle/radius per category plus the heaviest models. It catches a
  sculpt that throws for one faction+class pair, which the browser would
  otherwise only surface when a player happened to click it.
- Wave 51: the ore ladder — nine ores, four cutting heads, and a hardness
  gate that turns the asteroid bracket into an outfitter's shop window
  (orchestrated; parallel slices on one fixed contract, harness section
  alongside). Since wave 1 mining was one undifferentiated rawOre roll
  with a ~5% livingRock kicker; the whole depth stack now lives in data.
  THE DATA: ORE_TYPES in src/game/state.js — nine entries keyed by
  commodity. The two pre-wave-51 ores stay hardness 1 (rawOre,
  livingRock); the seven new ones step the ladder — slagIron/brineIce h2,
  chromeSalt/gildvein/emberglass h3, voidPlatinum/wakeglass h4. Each
  entry carries hardness, extractResist (divisor on the head's rate, so
  hard rock is slow even with the right head — the ladder buys speed as
  well as access), unitsMult (valuable ore in small pockets: wakeglass
  0.35 against a 4..12 base roll), sparkColor/dustColor/podTint, a
  blockedLine refusal, and a full `rock` recipe (shape/detail/wobble/
  scaleMult/hue/sat/light/roughness/metalness/emissive) — asteroids.js
  holds no per-ore constants of its own.
  THE LADDER: MINING_LASERS, four heads, array index IS
  ctx.world.miningLaser (0..3 — the ctx.world.scanner discipline). Mk I
  stock (cost 0), Bore laser Mk II 1400, Ferrous cutting head Mk III
  4200, Deepcore lance Mk IV 11000; extractPerSec 1.2/2.0/3.1/4.4, range
  90/115/140/165, per-head beam colour/width and a spoken purchase line.
  WEAPONS.mining is now DERIVED from MINING_LASERS[0] — value-identical
  to pre-wave-51, so applyHit's damage family never moved and the ladder
  is the single source of truth. station.js sells indices 1..3 in order
  on outfitter digits 5/6/7: buyMiningLaser guards already-fitted, then
  the prerequisite (a head seats only on the previous head's mount), then
  credits; success deducts, sets the index, speaks the head's line.
  save.js puts 'miningLaser' in WORLD_FIELDS and sanitizeRestored heals
  anything outside [0,1,2,3] to 0 — a tampered 99 would otherwise
  restore Deepcore reach, damage and h4 access for free (the wave-31
  scanner-heal reasoning); station init also `??= 0` for legacy saves.
  THE GATE: combat.js resolves miningLaserFor(ctx.world.miningLaser)
  EVERY call — save restores swap world fields wholesale, so nothing
  caches. laser.range is the reach cap; heat is heatPerShot x
  WEAPONS.mining.rof x dt. A rock whose hardness beats the installed
  tier scatters the beam and yields nothing, firing the new frozen
  'mineBlocked' { asteroidId, oreKey, hardness, needs, line } — at most
  once per second per asteroid id off two module scalars (mining touches
  one rock at a time), reset on 'systemLoaded' because a fresh field
  reuses ids. `needs` is the cheapest head whose tier clears the rock;
  `line` is the ore's own blockedLine. Blocked contacts still accrue
  heat — the energy goes into rock that will not yield. Productive
  contacts fire 'mineHit' { asteroidId, point, laserTier, extractPerSec }
  and asteroids.js banks extractPerSec / extractResist per second.
  THE FIELD: composition is drawn by BAND, not per-system data — one
  pickOreType(def.band ?? 0, rng()) per rock off ORE_BAND_WEIGHTS (bands
  0..4, relative weights, unknown band falls back to 0). All 100 systems
  got a coherent mix with ZERO data churn: not one of the 94 generated
  systems or the authored six's field blocks changed, and the seeded
  draw order keeps the mix deterministic per worldSeed. Band 0's
  livingRock weight (5 of 100) reproduces the pre-wave-51 ~5% roll
  exactly; band 4 is where void platinum and wakeglass actually live
  (18 and 17 of 100). One InstancedMesh per ore key that drew >= 1 rock
  — empty meshes are never allocated — named 'asteroid-field-<oreKey>'
  with userData.oreKey (boot contract), geometry from five
  makeRockGeometry shapes (lumpy/blocky/crystal/shard/bloom). rebuild()
  removes AND disposes every per-ore mesh's geometry and material off a
  module teardown list — a leaked mesh across a jump is a hard failure.
  ctx.asteroids.list is still REPLACED wholesale and stays flat with
  id === index; entries grew to { id, position, radius, ore, commodity,
  oreKey, hardness }, so every pre-wave-51 consumer's contract held.
  THE PASS: the beam is a tapered additive quad ('mine-beam', 4 verts,
  width beamWidth x 0.5 at the muzzle opening to x 1.4 at the contact)
  around a 'mine-beam-core' Line, with a pulsing 'mine-glow' sprite at
  the contact; outer and core breathe at different rates (0.35..0.8 /
  0.7..1.0) and reducedMotion pins both to their midpoints. Pooled
  Points — 'mine-sparks' 48 fast chips, 'mine-dust' 32 slow powder —
  wear the ore's sparkColor/dustColor. A blocked cut is legible with no
  UI at all: amber chips kick BACK along the beam and no dust comes off
  the rock. A rock being cut warms (heat += dt x 2.5, cools dt x 1.2)
  as its instance colour lerps toward the spark tint, tracked in a
  reused active-index array capped at 24; reducedMotion swaps the lerp
  for a static bright tint. Depletion darkens x 0.35 immediately, then
  collapses over ~0.4 s with a quadratic ease-out to baseScale x 0.3 —
  reducedMotion snaps. Pods spawn through spawnPod's new optional 5th
  `tint` (the ore's podTint), served by a tint-keyed material cache
  whose null key IS the pre-wave-51 salvage-green instance — npc.js and
  world.js 4-arg callers are unchanged, and the cache is process-
  lifetime on purpose (one default plus at most nine ore tints).
  THE BUG WORTH THE WAVE: hud.js's asteroid bracket had always keyed
  COMMODITIES[target.ore] — the commodity table by the numeric
  REMAINING-UNIT count — so the lookup missed every time and the
  bracket printed the literal 'Ore' since the day mining shipped. It
  now keys COMMODITIES[target.commodity] and reads '<Ore> · H<n> ·
  <units>u left · <dist>u', or past the gate '<Ore> · H<n> · NEEDS
  <head name> · <dist>u' with an .ore-blocked amber class on the meta
  (text still carries the state; colour is redundant). Weapon group 3
  labels itself with the installed head's name, resolved fresh each
  frame; 'mineBlocked' routes through the pooled toast channel as a
  warn line — no new overlay, no HUD-side dedupe.
  THE ECONOMY GUARDS: COMMODITIES gained a `bulk` flag on exactly the
  four pre-wave-51 legal staples, and world.js LEGAL_KEYS now filters
  legal && bulk — NPC trader manifests stay byte-identical and no
  Freehold grain hauler spawns void platinum; exotic ore reaches a
  market only by being mined and sold. The authored six carry priceBase
  entries for all seven new ores, spread so the deep bands sell cheap
  and the core buys dear (the band-4 authored system prices the h4 pair
  at 0.70/0.70; freehold pays 1.35/1.40) — hauling hard ore coreward is
  the paying direction. Generated systems fall through to x1.0 via
  baselineFor's `?? 1`. strikeRush now floods the two h2 ores a stock
  head can reach (slagIron -0.5, brineIce -0.4) but never h3/h4 — a
  lucky strike does not put void platinum on the board; oreRush crashes
  h2/h3 with the valuable ones less (slagIron -0.45, brineIce -0.4,
  chromeSalt -0.35, emberglass -0.32, gildvein -0.3) and LIFTS the h4
  pair +0.15 — scarcer, not cheaper, while every miner chases easy ore.
  THE BROWSER: model-catalog.js Props trades the four seed-varied rawOre
  rocks for one prop per ORE_KEYS entry — 'prop:asteroid:<oreKey>',
  buildAsteroidModel(1 + index, oreKey), deterministic seed — because
  the nine ores have genuinely different geometry and this browser is
  how they get reviewed.
  THE HARNESS: scripts/boot-test.mjs gained a wave-51 section pinning
  the ladder, the gate, the per-ore meshes and the readout; the boot
  run ends BOOT TEST PASS.
- Wave 52: rock that reads as rock — nine ores, nine surfaces
  (orchestrated; parallel slices per shape and per style, reviewed in the
  models browser between rounds). Since wave 51 the field was tinted
  glass: ONE geometry per ore drawn at a UNIFORM scale, ~240-400 verts of
  radial wobble, and a white MeshStandardMaterial with flatShading over
  huge facets. Every rock of an ore was the same silhouette at the same
  size, and the only variation was one per-instance HSL tint.
  THE DATA: every `ORE_TYPES[key].rock` gained `craters` (stony and
  metal bodies only), `axisJitter`, and a `surface` recipe (style, noise
  scale, contrast, bump, roughVar, dark/light pair, plus style extras
  rustColor / veinColor+veinWidth / crackColor+crackWidth+crackGlow /
  glowColor+glowWidth, and `flat` which now decides flatShading).
  Light bands dropped and emissiveIntensity fell across the board: a
  whole-surface emissive lift is what made every ore read pale.
  THE SHAPES: five builders, each with ALL rng draws in one up-front
  fixed-count block (the vertex loop draws nothing, so a seed's draw
  count can never depend on the values drawn) and a float32-safe clamp
  into the mining-raycast radius contract — makeLumpyRock (lobes +
  4-octave fBm + crater bowls with narrow raised rims at several
  scales; rawOre, gildvein), makeBlockyRock (spherify blend, six armour
  plates, craters, then 3-5 cleavage planes applied LAST so fracture
  faces stay dead flat; slagIron, voidPlatinum), makeShardRock
  (orthonormal splinter frame, ten sphere-uniform cuts, terrace steps,
  chips; brineIce, emberglass), makeCrystalRock (rocky core plus 12-20
  capped prisms in two tiers, merged to ONE geometry — the ore's mesh
  takes one geometry and one material; chromeSalt), makeBloomRock (4-6
  spaced growth lobes with fusion-seam creases, welded smooth normals;
  livingRock, wakeglass). polyDetail gained an opt-in `budget` argument
  so only the rebuilt shapes leave the wave-51 ~400-vert cap.
  THE CLONES: build() draws per-rock axis ratios (largest component
  EXACTLY 1, so no axis exceeds rock.radius and the raycast sphere still
  holds) plus a static tilt folded into the tumble quaternion; every
  transform site composes _scale.copy(rock.scaleVec) instead of
  setScalar. A profile without axisJitter gets (1,1,1) and an identity
  tilt, so the call sites stay branch-free.
  THE SURFACE: new src/systems/rock-surface.js — applyRockSurface
  patches the shared material through onBeforeCompile (six anchors
  verified against three 0.170's meshphysical chunks; inject() THROWS on
  a missing anchor rather than silently no-oping). Object-space fBm
  albedo seeded per instance from instanceMatrix[3].xyz, grain-driven
  roughness, a frequency-derived and tangent-clamped normal
  perturbation, cavity darkening, and eight styles: regolith, metal
  (coherent oxidation patches that also drop metalnessFactor), ice
  (pale frost, blue only in cavity troughs, bimodal polish), facet
  (Worley salt grains), vein (connected gold bands at metalness 1.0),
  ember (thin emissive cracks on dark glass), bloom (organic mottle
  with rim lift), wake (luminous filaments). No textures, no new
  dependencies, no DOM at import time (the harness imports it without
  WebGL); recipe values are baked as GLSL literals and
  customProgramCacheKey carries the style, so two ores sharing a style
  never share a program.
  THE LESSON WORTH THE WAVE: procedural detail is invisible at the
  wrong FREQUENCY. Round one shipped a correct shader at scale 3.1 —
  three noise cells across a unit body — and rendered a smooth white
  blob. Round two calmed the albedo span (0.30..1.5, sd 0.33 was
  confetti; the eight non-regolith styles now sit inside ~0.70..1.35 at
  sd <= 0.15) and moved the energy into the fine octaves. Every round
  was judged from a screenshot, never from the numbers alone.
  THE FINS: clipping a non-indexed octahedron leaves vertices still
  outside a second, nearly parallel plane after ONE argmax projection,
  and needle triangles where a cut edge crosses a face. Both render as
  thin bright wedges apparently sticking out of the ends (reviewed and
  rejected twice). The projection now repeats until nothing protrudes,
  and any triangle whose quality 4*sqrt(3)*A/(a^2+b^2+c^2) falls below
  0.05 collapses to its own centroid — zero area, nothing rasterised,
  and no neighbour moves because every vertex is private to its face.
  The same review killed the loaf silhouette: 1.80x elongation on a
  scaled sphere with cuts drawn within ~45 degrees of the long axis only
  shaved the tips, so the stretch dropped to 1.32-1.54x and each cut now
  sits at 74-92% of the body's OWN support along its normal — an
  absolute offset never reaches a thin axis whose support is ~0.45,
  which is why those faces stayed round.
  THE HARNESS: no new section — wave 51's per-ore mesh, composition and
  determinism pins already cover the rebuild, and they pass unchanged
  (BOOT TEST PASS). Geometry review happens in the models browser: nine
  'prop:asteroid:<oreKey>' entries, which is why that browser exists.
- HUD utility waves A–F (2026-08-17): combat glance, aiming, cameras, and
  scanner-gated awareness from docs/HudUtilityChangeProposal.md. HUD-02
  skins did not ship. HUD-03 did not add a new settings wave — scale /
  contrast / color-blind / reduced-motion already lived in settings.js.
  TGT-01 lead+range and TGT-02 MATCH shipped on the core ship (the
  proposal overrode the wishlist “upgrade gates the pip” clause). TGT-03
  shipped as Wave F awareness only. TGT-04 turrets did not ship.
  WAVE A: thin stroke rails (`.rw-combat-rail` at top 57%, 78 px off
  center), 80 px empty hub, Controls collapse on the rising edge of
  combat, toasts (`top: 14px; right: 168px`) and `.rw-banner` (`top:
  96px; right: 14px`) off the aim column, Bio / POS / resources /
  Controls on `.rw-fade` (combat opacity 0.14).
  WAVE B: Hail card lower-left `left: 14px; bottom: 22%; width: 360px`.
  Onboarding hints top-left `left: 14px; top: 48px`. Context prompt stays
  above the later contacts slot (`bottom: 20%`).
  WAVE C: FORE / AFT glance (fill vs hollow plus the word) on both rails.
  No lock: both self ends dim.
  WAVE D: lead from selected-weapon TOF and relative velocity
  (`targetVel − playerVel`); RANGE pop on the hub; MATCH on X. `ship.js`
  holds lock world speed via `fwdSpeed` and does not write
  `ctx.input.throttle`. Mining hides the pip.
  WAVE E: `C` cycles chase → third → first → chase. One overlay. Chase
  stays `_camOffset (0, 4, 12)`. Third is 18 up / 10 back, visual hull
  scale 0.55. First-person `_noseOffset` / `FIRST_PERSON_NOSE` is
  `(0, 0.45, -2.8)`, past the hull tip. Chase and third keep the hull
  visible.
  WAVE F: scanner-gated thin bottom bearing arc (`.rw-contacts`, not a
  reticle ring). Tier 0: no arc. Mk I: `U.ENCOUNTER_BUBBLE`. Mk II: 2×
  bubble + lock closure glyph (`«` / `»`). Shape is friend/foe (tick /
  chevron / hollow diamond). Hidden while docked. Core ships keep DIST,
  edge arrow, lead, RANGE, MATCH.
  FILES: `src/systems/hud.js`, `src/ui/hud.css`, `src/systems/ship.js`,
  `src/systems/hail.js`, `src/systems/onboarding.js`,
  `src/systems/controls.js`, `src/core/ctx.js` (MATCH / camera flags;
  “ship.js must not write ctx.input.throttle”).
  VERIFY: Playwright 1600×900 stills in `out/hud-research/wave-f-*.png`.
  `scripts/boot-test.mjs` pins HUD-01 rails and HUD waves B–F. This
  closeout did not re-run the whole harness and does not claim BOOT
  TEST PASS for the file. Last captured excerpt
  (`out/hud-01-verify/boot-hud01.txt`) recorded a pre-existing `WAVE49`
  `unknowablesClassOrdering` fail while the HUD-01 pins passed.
  CONTRACTS: empty aim glass; no contacts ring around the reticle;
  MATCH never writes throttle; scanner buys awareness only; HUD-02 and
  TGT-04 remain later.
- FLT (2026-08-17): readable dogfight turns. Player and NPC share
  `src/game/flight-feel.js` `turnRateFor(classKey, speed)` =
  `min(TURN_MAX, max(speed, 8) / TURN_MIN_RADIUS)`. Light creep radius
  is 90 u (was ~21). Ace stays the most agile class. `ship.js` dropped
  the old `MIN_AUTHORITY * rotationSpeed` curve. MATCH still holds lock
  speed and does not write `input.throttle`.
  NPC defiant / ace combat uses `applyCombatEnvelope`: approach offset
  80 u, never aim at the hull inside 160 u, extend on dist < 140 or
  high closure inside 220 u. Ace helix radius 220. Attack gun-pass
  points the nose at the target when a shot is due (80–500 u). Telegraph
  holds ~200 u and faces the target (does not ram). Demand hail, law
  zone, and resolve bands stayed. `npm run test:boot` ends BOOT TEST
  PASS (wave30 demand hail / showTeeth fire again; WAVE49 charter green;
  HUD B–F and FLT pins green).
  Wave F pip kind-change now writes `is-aft` / `is-far` in the same
  class string so a kind swap does not drop them.
  FILES: `src/game/flight-feel.js`, `src/systems/ship.js`,
  `src/systems/npc.js`, `src/core/ctx.js` (`rotationSpeed` 0.85 fallback
  comment), `src/systems/hud.js` (kind class string).
  VERIFY: node table in `out/flt-verify/`; live pursuit stills
  `out/flt-verify/flt-chase-*.png` and `flt-match.png` (14 s, 180 →
  extend, MATCH lamp, throttle unchanged). `scripts/boot-test.mjs` pins
  the turn-law samples.
- Wave 53 (2026-08-17): PHY first pass — solid spheres/cylinders, NPC
  avoid, star heat (orchestrated). New `src/game/physics.js` (`PHY`
  table) and THREE-free `src/game/collision.js` (`sphereOverlap`,
  `cylinderOverlap`, `resolveVelocity`, `sunZone`, `collectBodies`,
  `resolveMover`). Station body is the D5 cylinder (r 32, y −26…33).
  Player bounce in `ship.js` after integrate; `bodyHit` emit, no
  `applyHit` there. NPC lookahead avoid + bounce in `npc.js` (envelope
  80/140/160 kept). `combat.js` applies impact (`speed × 0.35`, min 8)
  and sun heat (2.4× radius) / lethal (1.12×). Heat reads
  `ctx.config.world.sunRadius` written by `solarsystem.js` (0 until a
  live star exists — scoped mining harnesses stay at the origin). HUD
  toasts: hull strike, STAR HEAT, star took the ship.
  Frozen events: `bodyHit`, `sunHeat`, `sunKill`.
  VERIFY: `out/phy-verify/` kernel pins CLEAN; Playwright station ram
  (min radial 34.4), asteroid ram, dock at 40 u, MATCH throttle
  untouched; NPC traffic 0 inside-cylinder samples. Boot WAVE53 math
  pins green. Cruise heading now +X so the 10 s flight check does not
  enter the star. OPEN: `npm run test:boot` still ends with 8 errors
  (WAVE4 fence favor, WAVE26 ferry/haul quote cluster, WAVE35 haul
  gate). PHY-02 is avoid+bounce, not full route planning. Gates have
  no collision volume (the bore stays a lane).
  FILES: `src/game/physics.js`, `src/game/collision.js`, `src/core/ctx.js`,
  `src/systems/ship.js`, `src/systems/npc.js`, `src/systems/combat.js`,
  `src/systems/hud.js`, `src/systems/solarsystem.js`,
  `scripts/boot-test.mjs`.
- Wave 54 (2026-08-17): FX first pass — impactful combat feedback
  (orchestrated; four disjoint slices). FX-01 visuals in `combat.js`:
  pooled muzzle pops, larger family-tinted bolt glow/streak (hit radius
  still `PROJ_RADIUS = 0.4`), shield ripple when screen/shell > 0,
  stronger hull sparks (11 chips). New frozen event `playerFire`
  `{ weapon }` on a real cannon/disruptor spawn only. FX-01 camera
  shake in `ship.js`: lastEvents-only, camera-local, chase cap 0.35 u /
  first-person 0.12 u, zero under reducedMotion / dock / jump. MATCH
  still does not write throttle. FX-02 audio in `song.js`: louder
  playerHit / shieldDown / engineOut; new cues playerFire, npcFire,
  npcHit, npcDestroyed, bodyHit, quiet sunHeat; volley cap ~8 on
  npcFire/npcHit. FX-03 death burst in `npc.js`: 3-slot pool
  (24 chips + 3 flashes), no per-kill material; world.js aftermath /
  pods unchanged. VERIFY: `out/fx-verify/` (audio CLEAN, shake CLEAN
  chase 0.207 / first 0.064 / reduced 0, MATCH throttle 0; visuals
  probe saw muzzle + violet disruptor + ripple + playerFire; burst
  live kill screenshot did not catch chips — pool is static-clean).
  Boot WAVE54 source pins added. Recoil and persistent hull decals
  did not ship. Next play-feel cluster: AI.
  FILES: `src/systems/combat.js`, `src/core/ctx.js`, `src/systems/song.js`,
  `src/systems/ship.js`, `src/systems/npc.js`, `scripts/boot-test.mjs`.
- Wave 55 (2026-08-17): mining lance look only. The held beam is a thin
  industrial cutting lance (Mk I a pencil of light; higher heads a touch
  wider). Contact glow uses the shared radial `glowTex` so the hit is a
  soft circular flare, never a white square. Ribbon edges fade via a 1D
  canvas map. Gameplay numbers (extract, range, heat, damage, hardness)
  are unchanged. Scene names stay `mine-beam` / `mine-beam-core` /
  `mine-glow` / `mine-sparks` / `mine-dust`.
  FILES: `src/systems/combat.js`, `src/game/state.js` (`beamWidth` only),
  `scripts/boot-test.mjs`, `out/fx-verify/mining-capture.mjs`.
- Wave 56 (2026-08-17): AI first pass — scaled spawn, gate transit,
  civilian jobs/hostility (orchestrated; three disjoint slices).
  AI-01: `src/game/traffic-feel.js` hull radii from SHIP_SCALE
  (`target/2`, pad 10). Spawn skips a stacked hull. Unrevealed
  q-ships use the cover class (freighter 88 u, not cutter 21 u).
  Ordinary live mix caps pirates at ~40% unless blockade.
  Close spawn (d ≤ 80 u) skips both guards so authored encounters
  (Callow, Named Guns) still instantiate on top of the player.
  AI-02: trader routes are station↔one physical `gates[n].to`.
  Gate arrival dwells 30–50 s (`gateLinger`). Only `pickMigrant`
  starts transit (one per ~90 s). Unpicked traders reverse so a
  stay cannot empty the local haul fleet (the first pass dumped
  Freehold in 22 s). Dest banks still do not tick (old contract).
  Pirates/aces never migrate. Hub routes stay closed (wave 22).
  AI-03/04: traders never hunt the player. A trader flees a hunter
  or a 10 s / shields-down panic, then returns to route. Patrols
  hunt the player only after a scratch or standing ≤ −10. Friendly
  patrols intercept a pirate/ace that is working a trader or the
  player. INTEREST table is unchanged. `npcFire` still emits only
  at the player — `combat.js` aims every bolt at the player, so
  ship-vs-ship shots did not ship. Miners did not ship.
  VERIFY: `out/w56/` probes CLEAN after one fix pass (q-ship cover,
  drain rate, scratch-flee latch). Boot WAVE56 source pins added.
  FILES: `src/game/traffic-feel.js`, `src/game/traffic.js`,
  `src/game/world.js`, `src/systems/npc.js`, `scripts/boot-test.mjs`,
  `out/w56/`.
- Wave 57 (2026-08-18): AI leftovers from wave 56 (orchestrated).
  BOLTS: `spawnNpcShot` aims at `aimObj`. Player-target bolts use
  `testPlayerHit` only. Ship-target bolts use `testNpcHits`, skip the
  shooter, skip Unknowables, and never hit the player. `npcFire` carries
  `target`. `ai.lastAttacker` stamps who shot; pirate/ace/patrol
  player-hunt on scratch only if that stamp is `'player'`.
  DEST TICKS: `tickBank` advances every existing `recordBanks` key.
  `pickMigrant` still starts at most one transit per interval, now from
  any existing bank. Tick path does not `ensureBank` or `beginTransit`.
  Blockade hurry stays in the event's system.
  MINERS: `minerCountForCast` = min(2, traders/4). Freehold 2, hush and
  verge 0. Role `miner`, station↔field, cargo cap 8. Off-screen +1
  rawOre / 5 s. Live mode `mine` cuts hardness ≤ 1, emits `mineHit`,
  reused beam line, flees hunters. Miners never migrate and never hunt
  the player.
  VERIFY: `out/w57/` probes CLEAN. Boot WAVE57 source pins added.
  FILES: `src/systems/combat.js`, `src/systems/npc.js`,
  `src/game/world.js`, `scripts/boot-test.mjs`, `out/w57/`.
- Wave 58 (2026-08-18): PHY leftovers from wave 53 / 56 (orchestrated).
  GATE: `torusOverlap` + `kind:'gate'` bodies. Slot `r=BORE 30`,
  `y0=TUBE 2.2`. Axis is gate → origin. Player r=2.4 threads the
  hole. Freighter r=40 cannot. Hub lantern is a second gate body.
  ROUTES: `writeStationHold` / `stationHoldPoint` in traffic-feel.js
  (pad 12). Trader waypoint[0] is a freighter hold outside the D5
  cylinder. Gate end stays authored. Miner station legs use light/
  cutter holds. Patrol still uses the pad center.
  AVOID: live `gateProbeHits` is a torus; lateral push uses the
  nearest ring point. Station keep-out uses hull radius + path
  test; inside-cylinder bias is XZ out. `steerMinerHome` and
  no-threat flee dock at the hold (dist < 28), not the pad.
  OPEN: old saved trader `route[0]` can stay at the pad until the
  bank rebuilds (`normalizeTraderRecord` does not rewrite it).
  PHY-02 is still lookahead bias, not full path planning.
  VERIFY: `out/w58/gate|routes|avoid` probes + verifier extras
  CLEAN. Boot WAVE58 pins green. `npm run test:boot` still ends
  with the same 8 pre-existing errors (WAVE4 fence favor,
  WAVE26 ferry/haul cluster, WAVE35 haul gate). kernel-pins
  phyKeySet gains GATE_BORE / GATE_TUBE.
  FILES: `src/game/collision.js`, `src/game/physics.js`,
  `src/game/traffic-feel.js`, `src/game/world.js`,
  `src/systems/npc.js`, `scripts/boot-test.mjs`,
  `out/phy-verify/kernel-pins.mjs`, `out/w58/`.
- Wave 59 (2026-08-18): FX leftovers from wave 54 plus the wave-58
  pad-home heal (orchestrated).
  RECOIL: `playerFire` {cannon|disruptor} kicks the flesh child
  (+Z/+Y) and a small camera punch on the existing shake path.
  Caps stay 0.35 / 0.12. Zero under reducedMotion / dock / jump.
  Does not write throttle, MATCH, or velocity.
  DECALS: `src/game/hull-marks.js` (pool 12, THREE-free local
  offset). Unshielded hull scores stamp a dark scorch sprite on the
  host. Shared mark texture/material/root. Recycle + park on
  npcDestroyed / playerDestroyed / systemLoaded / orphan host.
  Shielded hits still ripple only. A kill shot parks the mark.
  ROUTES: `healPadHome` rewrites trader/miner `route[0]` when it
  sits on the station pad. Traders use freighter hold, miners use
  light/cutter. Idempotent. NaN/missing system no-ops.
  VERIFY: `out/w59/{recoil,decals,routes}` probes CLEAN. Live
  `out/w59/browser-verify.mjs` recoilOk + decalsOk (flesh 0.19,
  cam 0.05, reduced cam 0, throttle unchanged; 0→1 scorch on
  unshielded hits, shielded adds none, destroy parks). Boot WAVE59
  pins added.
  FILES: `src/systems/ship.js`, `src/systems/combat.js`,
  `src/game/hull-marks.js`, `src/game/world.js`,
  `scripts/boot-test.mjs`, `out/w59/`.
- Wave 60 (2026-08-18): POD first pass (orchestrated; four
  disjoint slices). Survivors are cargo rows, not market goods.
  SCOOP: `pods.js` `isSurvivorCargo` / `survivorKey` /
  `spawnSurvivorPod`. Scoop merges two survivors only when
  faction+source match. Empty `[]` pods stay flavor. Mesh name
  `survivor-pod`. Reserved keys (`__proto__` etc.) do not spawn.
  SPAWN: `npc.js` one survivor on `crewPods` and on destroy
  (`spawnShipSurvivor`, `ai.survivorsSpawned` blocks a second
  dump). `lastAttacker === 'player'` → `playerKill`, else
  `other`. Unknowables and no-faction wrecks skip. Cargo spill
  still cargo only. `world.js` aftermath unchanged.
  RESCUE: `RESCUE` { otherRep 4, playerKillRep 1 }. Matching-
  faction Return on dock home and People (no new digit). Market
  cannot list or sell survivors. `priceOf('survivor')` is 0.
  Event `survivorRescued` { faction, source, count, repDelta }.
  HUD toast. Trafficking / Gilded sale did not ship.
  SAVE: `sanitizeCargoRow` keeps survivor faction/source/name
  (name cap 40). Ordinary rows stay `{commodity, units}`.
  VERIFY: `out/w60/{scoop,spawn,save,rescue}` probes CLEAN.
  Live dock: Return on People, digits 1–9 unchanged, market
  lists no survivor, Freehold other +4/person, wrong-faction
  row stays. Designer pass skipped.
  FILES: `src/game/pods.js`, `src/systems/npc.js`,
  `src/game/save.js`, `src/game/state.js`, `src/core/ctx.js`,
  `src/systems/station.js`, `src/systems/hud.js`, `out/w60/`.
- Wave 61 (2026-08-18): HUD-02 identities brief (orchestrated;
  design only). Two families on the same HUD-01 glance set.
  SWITCH: `hudFamily(ctx) -> 'mech' | 'bio'`. Hull identity, not
  origin, not `isBeautiful(faction)` alone. Live default `bio`
  until SHP writes `hullKind: 'built'`. HUD must not write
  `hullKind`. Restore already keeps extra player keys.
  DOM: one `#hud` tree, `#hud[data-family]`. No second HUD.
  BIO: AGEZ 56 / 24 / 20. Rails use `rw-hair-off` fail-closed.
  First bio wave: 2 rail hairlines, no extra Bio corners,
  contacts `stroke-linecap: round` only. Facing is clip-path.
  MECH: iris accent becomes hub ticks in the same 80 px box.
  PARITY: same glance data and positions. Reduced-motion hides
  family hairlines on both families. Mood period ≥ 1.2 s.
  NON-GOALS: no skins this wave, no GSE, no four-face shields,
  no missiles, no tendrils on the aim glass, no new HUD-03 keys.
  OWNER: ship skins before SHP; Unknowables purchased hulls stay
  `bio` (`hullKind: 'living'`); no HUD-03 free skin override.
  VERIFY: `out/w61/{inventory,conventional,living,shared}` notes
  + verifiers CLEAN after fix passes. Design review 0 open issues
  after 3 rounds.
  FILES: `docs/Hud02IdentitiesDesign.md`,
  `docs/PLAYER-EXPERIENCE-WISHLIST.md`, `PROGRESS.md`, `out/w61/`.
  No `src/` edits.
- Wave 62 (2026-08-18): HUD-02 skins (orchestrated; serial
  PR1 → PR2 → PR3). One `#hud` tree. Live default stays `bio`.
  HOOK: export `hudFamily(ctx)` (session `rw-hud-family`, then
  `hullKind` built/living, then Beautiful, then `bio`).
  `#hud.dataset.family` in `initHud` and on the 5 Hz
  write-on-change path. HUD never writes `hullKind`. Both rails
  start with `rw-hair-off`.
  MECH: CSS-only under `[data-family="mech"]`. Iris hidden.
  Hub `::after` is a masked tick ring, 56 px keep-out, no
  `--vein`. Square 6×12 petals. Rails stay at 57% / ±78 px.
  BIO: two rail hairlines (18/10 px, 52 px outer inset). AGEZ
  hide on the reticle/lead path against a cached rail box.
  `--rw-bio-period` 4.0 / 2.2 / 1.2 s (never faster). Contacts
  `stroke-linecap: round` only. No extra Bio corners. Reduced
  motion hides hairlines. Helpers `hairBoxForRail` /
  `agezHairOff`. Pin H=(600,513) at 1600×900 hides self hair.
  OPEN: family audio (PR4) did not ship. SHP still owns
  `hullKind: 'built'` so mech stays debug/screenshot until
  then. `npm run test:boot` still ends with the known
  pre-existing FAILs (WAVE4 fence, WAVE26 ferry/haul cluster,
  WAVE30 payTribute flake, WAVE35 haul gate). WAVE62 pins
  were all-true.
  VERIFY: `out/w62/{hook,mech,bio}` probes + verifiers CLEAN.
  Live stills in those folders.
  FILES: `src/systems/hud.js`, `src/ui/hud.css`,
  `scripts/boot-test.mjs`, `docs/Hud02IdentitiesDesign.md`,
  `docs/PLAYER-EXPERIENCE-WISHLIST.md`, `PROGRESS.md`,
  `out/w62/`.
- Wave 63 (2026-08-18): SHP design brief (orchestrated; design
  only). Same pattern as Wave 61 HUD-02. No `src/` edits.
  DESK: append `'shipyard'` after `epics`. Digits 1–9 unchanged.
  Digit 0 opens shipyard (`Number('0')-1 === -1` special-case).
  SHP-01 `'yard'` rejected. One desk, two panes (Hangar every
  dock + gated Yard buy). Buy ADDS a hangar row; it does not
  remount or trade away the mounted hull.
  PERSIST: `ctx.world.hangar` = `{ mountedId, hulls }` on
  `WORLD_FIELDS`. Live hull is a row. Cap 8. Cargo travels with
  the hull. `hullKind` `'living'|'built'` — SHP writes, HUD
  reads. Unknowables force `'living'` on every path. Unset = bio.
  REMOUNT: copy `SHIP_CLASSES[classKey]` onto `ctx.config.ship`.
  Turn already follows `classKey`; cruise does not today. Bio is
  not a hull and survives swaps. Do not weaken `makeLivingHull`.
  SHP-03 first: flat `scanner` / `miningLaser` / `concealedMounts`
  on the hull row (no nested `loadout`). World keys stay mirrors.
  No missiles, no turrets, no mass/power. First-slice buy lists
  may omit frigate/ace/cutter; persist still admits `SHIP_CLASSES`
  keys. New Game: `clearAutosave` only. Berths 1–3 keep hangar.
  Death + no save: one living starter; delete leftover `hullKind`.
  World strings: `textContent` only. Serial later PRs: save.js →
  ship.js → station.js → catalog/buy → equipment migrate.
  MERGE: `out/w63/shared-contract.md` wins sibling conflicts.
  VERIFY: `out/w63/current-shp-inventory.md` +
  `verify-inventory.txt` CLEAN; `shp-01-shipyards.md` +
  `verify-shp-01.txt` MEDIUM merge nits (contract wins);
  `shp-02-hangar.md` + `verify-shp-02-recheck.txt` CLEAN;
  `shp-03-loadouts.md` + `verify-shp-03.txt` MEDIUM persist
  shape (flatten to contract); `shared-contract.md` +
  `verify-shared-recheck.txt` CLEAN.
  FILES: `docs/ShpDesign.md`,
  `docs/PLAYER-EXPERIENCE-WISHLIST.md`, `PROGRESS.md`, `out/w63/`.
  No `src/` edits.
- Wave 64 (2026-08-18): SHP first slice (orchestrated; serial PR1–PR5).
  PR1 persist: new `src/game/hangar.js`. `WORLD_FIELDS` += `hangar`
  `{ mountedId, hulls }`. Cap 8. Snapshot parks JSON before copy.
  Missing hangar → one living starter. `freshStart` rebuilds one
  living starter and deletes leftover `'built'`. `hullKind`
  `'living'|'built'` or delete. Unknowables force `'living'`.
  PR2 remount: `switchTo(ctx, id)` + `applyFlightEnvelope` copies
  authored `SHIP_CLASSES` onto `ctx.config.ship`. Living remount
  keeps `makeLivingHull` swim/breath/heartbeat. Built remount uses
  `buildPlayerPlatedMesh`. Restore/`freshStart` run the envelope.
  PR3 desk: append `'shipyard'` after `epics`. Digit 0 opens it.
  Digits 1–9 unchanged. Two panes (1 Hangar, 2 Yard).
  PR4 buy: new `src/game/shipyard.js`. Authored `YARD_LIST_UU`.
  Buy adds a hangar row. No remount-on-buy. Hostile rep `< 0` is
  no sale. Confirm papers before debit. First-slice lists omit
  ace/cutter/frigate. Independent/hollow catalogs stay empty.
  PR5: outfitter writes the mounted row, then world mirrors.
  Swap isolation: Deepcore does not follow every stored hull.
  OPEN: missiles/turrets/mass-power later. Family audio still
  HUD leftover. `npm run test:boot` still ends with the known
  8 FAILs (WAVE4 fence, WAVE26 ferry/haul cluster, WAVE35 haul
  gate). WAVE62 + WAVE64 pins all true.
  VERIFY: `out/w64/verify-persist.txt` CLEAN; remount recheck
  CLEAN; desk recheck + live Digit 0 CLEAN; `verify-buy.txt` +
  live Confirm papers CLEAN; `verify-equipment.txt` CLEAN.
  FILES: `src/game/hangar.js`, `src/game/shipyard.js`,
  `src/systems/shipyard-desk.js`, `src/game/save.js`,
  `src/systems/ship.js`, `src/systems/station.js`,
  `src/systems/npc.js`, `src/core/ctx.js`, `src/ui/screens.css`,
  `scripts/boot-test.mjs`, `docs/ShpDesign.md`,
  `docs/PLAYER-EXPERIENCE-WISHLIST.md`, `PROGRESS.md`, `out/w64/`.
- Wave 65 (2026-08-19): leftovers + POD-02 brief (orchestrated;
  three parallel tasks). AUDIO: HUD-02 PR4 quiet family ticks.
  Rising-edge `ctx.emit` from `hud.js`. New `CUES` only in
  `song.js`. Types `hudMechRange` / `hudMechMatch` /
  `hudMechContact` / `hostileEnter` / `hullBand`. Gain ≤ 0.08,
  duration ≤ 0.35 s. `reducedMotion` gates emit. Mute and
  masterVolume stay on the song master path. FX-02 fire/hit
  rows unchanged. No `playCue`. No HUD-03 audio checkbox.
  CATALOG: plated yards sell light, cutter, heavy, freighter,
  ace. Beautiful sells light, cutter, heavy. Unknowables stay
  light. Independent / hollow stay empty. Frigate stays off
  every buy list. Ace needs Known (10). Cutter stays open at
  Stranger. Buy still adds a hangar row. No remount-on-buy.
  POD-02: design only. `docs/Pod02TraffickingDesign.md`.
  Gilded People Digit 7, level 2 only
  (`ui.level === 2 && ui.service === 'people'`). Confirm
  before credit. Market `priceOf('survivor')` stays 0. Return
  stays. Unknowables: no sale. Impl does not ship this wave.
  OPEN: missiles / turrets / mass-power later. Frigate buy
  later. Trafficking impl later. `npm run test:boot` still
  ends with the known 8 FAILs (WAVE4 fence, WAVE26 ferry/haul
  cluster, WAVE35 haul gate). WAVE65 pins added. WAVE64
  `freeholdNoFrigate` now means no frigate only.
  VERIFY: `out/w65/catalog` probe + live Digit 4 papers CLEAN;
  `out/w65/audio` probe + live MATCH/RANGE CLEAN;
  `out/w65/pod/verify-recheck.txt` CLEAN after home-gate fix.
  FILES: `src/systems/hud.js`, `src/systems/song.js`,
  `src/core/ctx.js`, `src/game/shipyard.js`,
  `scripts/boot-test.mjs`, `docs/Hud02IdentitiesDesign.md`,
  `docs/Pod02TraffickingDesign.md`,
  `docs/PLAYER-EXPERIENCE-WISHLIST.md`, `PROGRESS.md`,
  `out/w65/`.
- Wave 66 (2026-08-19): POD-02 Gilded sale first slice
  (orchestrated; serial PR1–PR5). Persist keep-list on
  survivor cargo (`faction` / `source` / optional `name`).
  Reserved ids (`__proto__` / `constructor` / `prototype`)
  fail closed. No `world.peopleTrafficked` field.
  Mutator `src/game/trafficking.js`: list UU 160 / 240,
  Confirm-before-credit, Unknowables refuse, oversize
  stacks skip like rescue. People Digit 7 at Gilded only
  (`ui.level === 2 && ui.service === 'people'`). Offer →
  Confirm transfer. Market still cannot list or sell
  people. `priceOf('survivor')` stays 0 even if a save
  stuffs `world.prices.survivor`. Return survivors stays
  on matching-faction home / People, Gilded and Freehold.
  HUD toasts `survivorSold` as a warn Chain line.
  Milestone id `peopleTrafficked` once; not a WORLD_FIELD.
  OPEN: missiles / turrets / mass-power later. Frigate buy
  later. `npm run test:boot` still ends with the known
  FAILs (WAVE4 fence, WAVE26 ferry/haul cluster, WAVE30
  payTribute, WAVE35 haul gate). WAVE66 save pins and
  WAVE66 desk pins all true.
  VERIFY: `out/w66/pr1` persist probe CLEAN; `out/w66/pr2`
  mutator probe CLEAN; `out/w66/pr3` desk probe + live
  Gilded People CLEAN; `out/w66/pr4` survivorSold toast
  CLEAN; `out/w66/pr5` boot `wave66 save pins` +
  `wave66 desk` all-true.
  FILES: `src/game/save.js`, `src/game/trafficking.js`,
  `src/systems/station.js`, `src/systems/hud.js`,
  `src/core/ctx.js`, `scripts/boot-test.mjs`,
  `docs/Pod02TraffickingDesign.md`,
  `docs/PLAYER-EXPERIENCE-WISHLIST.md`, `PROGRESS.md`,
  `out/w66/`.
- Wave 67 (2026-08-19): leftovers + two design briefs
  (orchestrated; three parallel tasks). FRIGATE: plated
  CORE_STOCK appends `frigate`. List 80000 UU. Min-rep
  Trusted 25. Beautiful stays light/cutter/heavy.
  Unknowables stay light. Independent / hollow stay empty.
  Buy still adds a hangar row after Confirm. Digit 8 at
  shipyard level 2 is offer index 5. WAVE64 pin renamed
  `freeholdHasFrigate`. WAVE65 pin renamed
  `platedHasFrigate`. WAVE67 catalog pins added.
  SHP-03: design only. `docs/Shp03WeaponsDesign.md`.
  Flat hangar keys `launcher` / `missileAmmo` / `turret`.
  Outfitting Digit 8/9 + Confirm papers. Group-4 player
  missiles. Forward auto-turrets. Seat-count mass. Power
  ledger out. HUD-02 closed. No incoming gauge. No `src/`
  weapons. AST: design only. `docs/AstOrbitsDesign.md`.
  Keep `id === index`. Closed-form pose from seed +
  `world.time`. Sparse `fieldOre` persist. Work-sector
  mining aid. PHY keep-out. No `src/` motion.
  OPEN: missiles / turrets impl later. AST belts later.
  Beautiful / Unknowables frigate later. `npm run test:boot`
  still ends with the known FAILs (WAVE4 fence, WAVE26
  ferry/haul cluster, WAVE30 payTribute, WAVE35 haul gate).
  WAVE67 catalog pins all true.
  VERIFY: `out/w67/frigate` probe + live Freehold Yard
  CLEAN; `out/w67/shp03/verify-recheck.txt` CLEAN;
  `out/w67/ast/verify.txt` CLEAN.
  FILES: `src/game/shipyard.js`, `scripts/boot-test.mjs`,
  `docs/Shp03WeaponsDesign.md`, `docs/AstOrbitsDesign.md`,
  `docs/PLAYER-EXPERIENCE-WISHLIST.md`, `PROGRESS.md`,
  `out/w67/`.
- Wave 68 (2026-08-19): SHP-03 first impl (orchestrated;
  serial PR0–PR5). Catalog `WEAPONS.missile` / `WEAPONS.turret`
  + frozen `MOUNT_TABLE` + `src/game/weapon-fit.js` (`dart` /
  `auto`). Flat hangar keys `launcher` / `missileAmmo` /
  `turret` on WORLD_FIELDS. Restore overwrites world from
  the mounted row. `writeMountedGear` + `spendMissileAmmo`.
  Stock rows seed empty racks. Outfitting level 2 Digit 8/9
  Confirm papers (6500 / 4200 UU). Light has no hardpoint.
  Group 4 Digit4: dart pool 8, seeker, spend-on-spawn. Empty
  rack does not fire cannon. Player turret forward cone,
  cap 2 bolts. HUD `4 · Dart rack · N` / empty `4 · —`.
  HUD-02 closed. No incoming gauge. No NPC missiles. Power
  ledger out. WAVE64 heal pin now expects empty launcher
  key. WAVE68 weapons pins all true. Known boot FAILs
  unchanged (WAVE4 fence, WAVE26 ferry/haul, WAVE35 haul).
  OPEN: AST belts later. Beautiful / Unknowables frigate
  later. NPC missiles / incoming gauge later.
  VERIFY: `out/w68/pr0`–`pr5` probes CLEAN; live Chrome
  `out/w68/live` PASS (light refuse, heavy dart+turret
  papers, WPN `4 · —` then `4 · Dart rack · 8`).
  FILES: `src/game/state.js`, `src/game/weapon-fit.js`,
  `src/game/hangar.js`, `src/game/save.js`,
  `src/game/shipyard.js`, `src/core/ctx.js`,
  `src/systems/station.js`, `src/systems/combat.js`,
  `src/systems/controls.js`, `src/systems/hud.js`,
  `scripts/boot-test.mjs`,
  `docs/PLAYER-EXPERIENCE-WISHLIST.md`, `PROGRESS.md`,
  `out/w68/`.
- Wave 69 (2026-08-19): AST first impl (orchestrated;
  serial PR1–PR2, then PR3+PR4 parallel, then PR5).
  Closed-form Kepler-lite pose from seed + `world.time`.
  Five placement draws only. `id === i`. In-place Vector3.
  Band default kind. Work sector ≥60%. Keep-out vs sun /
  station / gates / planet slots. Sparse `world.fieldOre`
  on WORLD_FIELDS. Omit-key restore deletes the live bag.
  Same-system overlay without mesh dispose. Tumble LOD
  1200 u; orbit all rocks. Stale rock lock dropped on
  `systemLoaded`. Arrival `Belt lies <n> u…` plus group-3
  `Mine · belt <n>u` (textContent). WAVE51 G/I re-aim each
  fire frame so extract math still pins on a moving rock.
  WAVE69 ast pins all true. Known boot FAILs unchanged
  (WAVE4 fence, WAVE26 ferry/haul, WAVE35 haul).
  OPEN: Beautiful / Unknowables frigate later. NPC missiles
  / incoming gauge later. Power ledger out. Player must
  track a rock to cut it; NPC miners already hold relative.
  VERIFY: `out/w69/pr1`–`pr5` CLEAN; live Chrome
  `out/w69/live` PASS (meanR 581, sector 0.68, rocks slide,
  cue `3 MINE · BELT 1836U`).
  FILES: `src/systems/asteroids.js`, `src/game/save.js`,
  `src/core/ctx.js`, `src/systems/controls.js`,
  `src/game/jump.js`, `src/systems/hud.js`,
  `scripts/boot-test.mjs`,
  `docs/AstOrbitsDesign.md`,
  `docs/PLAYER-EXPERIENCE-WISHLIST.md`, `PROGRESS.md`,
  `out/w69/`.
- Wave 70 (2026-08-20): leftovers + two design briefs
  (orchestrated; three parallel tasks). MATCH: X on a
  locked rock samples world velocity and holds in the
  rock rest frame. Ship MATCH still uses scalar speed
  along the nose. Dock, jump, lost lock, NaN pose, or
  throttleHeld cancel. No auto-steer. HUD MATCH lamp
  still needs a ship `state`, so the lamp stays off on
  a rock lock. WAVE70 minehold pins all true.
  BIO: design only. `docs/BioLivingShipsDesign.md`.
  Living starter stays the benchmark. First impl uses
  live Beautiful / Unknowables yards. Abomination is
  `hullKind === 'built'` plus `grafted: true`. Gilded
  graft after a two-step warning. Beautiful standing
  caps at HOSTILE_STANDING (−10) while any hangar row
  is grafted. Living frigate buy stays omitted.
  Psionic weapons stay out. No `src/` BIO.
  MSN: design only. `docs/MsnMissionsDesign.md`. First
  family is mining (two slots per system, one-in-one-out,
  600 s deadline, expire fails closed). Extend
  `world.jobs`. No asteroid UUID. Job ids are hyphen
  tokens (live unique ids keep; `mine-<system>-<n>`;
  RESERVED_IDS on each token). Cap
  `4 + 2 * N_SYSTEMS + 16`. No `src/` MSN.
  OPEN: Beautiful / Unknowables frigate later (BIO).
  NPC missiles / incoming gauge later. Power ledger
  out. Rock MATCH lamp later (HUD needs ship state).
  `npm run test:boot` still ends with the known FAILs
  (WAVE4 fence, WAVE26 ferry/haul, WAVE35 haul).
  VERIFY: `out/w70/minehold` probe + live Chrome CLEAN;
  `out/w70/bio/verify-recheck.txt` CLEAN;
  `out/w70/msn/verify-recheck.txt` CLEAN.
  FILES: `src/systems/ship.js`, `scripts/boot-test.mjs`,
  `docs/BioLivingShipsDesign.md`,
  `docs/MsnMissionsDesign.md`,
  `docs/PLAYER-EXPERIENCE-WISHLIST.md`, `PROGRESS.md`,
  `out/w70/`.
- Wave 71 (2026-08-20): MATCH lamp leftover + MSN first impl
  (orchestrated; MATCH parallel with MSN PR1, then MSN PR2–PR5
  serial). MATCH: HUD lamp lights when `flags.matchSpeed` is
  true on a rock lock or a live ship. Combat rail stays
  ship-only. hud.js still only reads the flag.
  MSN: `sanitizeJobs` on restore (hyphen tokens, omit-key
  `[]`, cap `4+2*N_SYSTEMS+16`). Two mining slots per system
  (`rawOre` / `livingRock`, need 4). Accept stamps origin
  `payQuoted`. Home delivery pays stamp, +2 employer faction,
  splice+replace. 600 s expire fails closed. Jobs cards show
  remaining time and have/need. Unique four stay. No
  asteroidId. WAVE71 msn pins all true.
  OPEN: Beautiful / Unknowables frigate later (BIO). BIO
  first impl later. NPC missiles / incoming gauge later.
  Power ledger out. Other MSN families later.
  `npm run test:boot` still ends with the known FAILs
  (WAVE4 fence, WAVE26 ferry/haul, WAVE35 haul).
  VERIFY: `out/w71/match-lamp` live Chrome CLEAN;
  `out/w71/pr1`–`pr4` probes CLEAN; WAVE71 boot pins all true.
  FILES: `src/systems/hud.js`, `src/game/save.js`,
  `src/systems/station.js`, `scripts/boot-test.mjs`,
  `docs/MsnMissionsDesign.md`,
  `docs/PLAYER-EXPERIENCE-WISHLIST.md`, `PROGRESS.md`,
  `out/w71/`.
- Wave 72 (2026-08-20): BIO first impl (orchestrated; PR1
  persist parallel with PR2 obtain pins, then PR3 desk,
  then PR5 boot; PR4 class evolution skipped). Hangar rows
  keep `grafted` only when the own-key is boolean `true`.
  Living and Unknowables drop it. Pack/load/sync/heal copy
  the same rule. Gilded Hangar pane: Offer graft → warning
  → Confirm graft. Mounted built hull only. `hullKind`
  stays `built`. Credits do not change (graft UU still
  owner-open). Beautiful standing
  `Math.min(currentOrZero, -10)` while any sanitized row
  is grafted (confirm, sanitizeHangar, switch/load,
  applyMountedFlight). Esc cancels with no write. HUD
  family stays mech. Living starter swim fields stay.
  Beautiful / Unknowables still omit frigate. WAVE72 bio
  pins all true.
  OPEN: graft list price (owner UU). Gift / pirate seed /
  commodity later. Class evolution later. BIO-03 Beautiful
  NPC fleet later. BIO-04 psionics out. NPC Abominations
  later. Living frigate buy still omit. NPC missiles /
  incoming gauge later. Power ledger out. Other MSN
  families later.
  `npm run test:boot` still ends with the known FAILs
  (WAVE4 fence, WAVE26 ferry/haul, WAVE35 haul).
  VERIFY: `out/w72/pr1`–`pr3` probes CLEAN; WAVE72 boot
  pins all true; live Chrome graft desk CLEAN
  (`out/w72/pr5/live`).
  FILES: `src/game/hangar.js`,
  `src/systems/shipyard-desk.js`, `src/systems/station.js`,
  `scripts/boot-test.mjs`,
  `docs/BioLivingShipsDesign.md`,
  `docs/PLAYER-EXPERIENCE-WISHLIST.md`, `PROGRESS.md`,
  `out/w72/`.
- Wave 73 (2026-08-20): three design briefs (orchestrated;
  TGT-05 + REP + EXP parallel, markdown only). No `src/`.
  TGT-05: `docs/Tgt05ReticleLockDesign.md`. KeyT cycle
  stays. Reticle-lock is a new command (default KeyV,
  owner sign-off). First impl locks ships and asteroids.
  Stations, gates, pods, landmarks deferred. Non-ship
  MATCH/combat rails fail closed. Group-3 mining stays.
  REP: `docs/RepStandingDesign.md`. Digit 9 Standing
  explain-only. No universal crime score. `RANK_LADDER`
  unchanged. Patrol still writes `freehold`. BIO −10 and
  POD rescue/sale numbers stay. Police leave / restitution
  UU / kill attribution deferred. Espionage rule frozen
  for a later MSN family.
  EXP: `docs/ExpDataTradeDesign.md`. Crystals/cubes are
  hangar cargo rows with legal/captured/stolen provenance.
  Archive desk at live Assembly docks only. Unknowables
  have no station (Wave 42 content decision). Drop rates
  and launder UU need owner. `priceOf` for data keys is 0.
  OPEN: TGT-05 binding key; TGT-05 station/gate lock;
  REP restitution UU; EXP drop rate / launder UU /
  Unknowables dock; graft list price (owner UU); gift /
  pirate seed; BIO-03 fleet; BIO-04 out; living frigate
  omit; NPC missiles / incoming gauge; power ledger;
  other MSN families.
  VERIFY: `out/w73/tgt05/verify.txt` CLEAN;
  `out/w73/rep/verify.txt` CLEAN;
  `out/w73/exp/verify.txt` CLEAN.
  FILES: `docs/Tgt05ReticleLockDesign.md`,
  `docs/RepStandingDesign.md`,
  `docs/ExpDataTradeDesign.md`,
  `docs/PLAYER-EXPERIENCE-WISHLIST.md`, `PROGRESS.md`,
  `out/w73/`.
  No `src/` edits.
- Wave 74 (2026-08-20): TGT-05 + REP + EXP first impl
  (orchestrated; TGT-05 parallel with persist, then
  station UI, then boot pins).
  TGT-05: KeyV `reticleLockPressed`. KeyT cycle stays.
  Direct-hit pick on the visible-reticle ray. Ships and
  asteroid list rows (`id === index`); rocks lock in any
  weapon group. Stations/gates/pods/landmarks out. Miss
  `commLine` plus `reticleLock { hit }`. No cone. Combat.js
  untouched (seeker still ship-only). Rock MATCH stays.
  REP: `sanitizeReputation` on restore (fresh bag, proto /
  unknown / NaN drop). Digit 9 Standing shows ladder,
  current rank, how-it-moves, and live hunt/yard/locker/
  graft facts. Patrol/mining/rescue `commLine` reasons.
  No crimeScore. `RANK_LADDER` unchanged. Digit 0 shipyard.
  EXP: dataCrystal/dataCube hangar rows with
  legal|captured|stolen + originFaction. Missing source
  drops the row. `priceOf` / tribute treat data as 0.
  Archive desk on live Assembly Market only; UU unset so
  confirm does not debit or flip. Spawn skip (no drop %).
  Unknowables dock still absent.
  WAVE74 pins all true. WAVE72 BIO pins stay all true.
  OPEN: TGT-05 station/gate lock; cone pixel cap; REP
  restitution UU / police leave / kill delta; EXP drop
  rate / desk UU / launder UU / Unknowables dock; graft
  list price (owner UU); gift / pirate seed; BIO-03 fleet;
  BIO-04 out; living frigate omit; NPC missiles / incoming
  gauge; power ledger; other MSN families.
  `npm run test:boot` still ends with the known FAILs
  (WAVE4 fence, WAVE26 ferry/haul, WAVE35 haul).
  VERIFY: `out/w74/tgt05/verify.txt` CLEAN (live Chrome);
  `out/w74/persist/verify.txt` CLEAN (49 pins);
  `out/w74/station/verify.txt` CLEAN (51 pins);
  `out/w74/station/live/verify.txt` CLEAN;
  `out/w74/boot/verify-recheck.txt` CLEAN (33 pins).
  FILES: `src/systems/controls.js`, `src/game/reticle-aim.js`,
  `src/core/ctx.js`, `src/systems/hud.js`, `src/systems/song.js`,
  `src/game/data-trade.js`, `src/game/save.js`,
  `src/game/pods.js`, `src/systems/npc.js`,
  `src/systems/hail.js`, `src/systems/station.js`,
  `scripts/boot-test.mjs`,
  `docs/Tgt05ReticleLockDesign.md`,
  `docs/RepStandingDesign.md`,
  `docs/ExpDataTradeDesign.md`,
  `docs/PLAYER-EXPERIENCE-WISHLIST.md`, `PROGRESS.md`,
  `out/w74/`.
- Wave 75 (2026-08-20): three design briefs (orchestrated;
  MSN-02 trade + BIO-03 fleet + NPC missiles parallel,
  markdown only). No `src/`.
  MSN-02: `docs/Msn02TradeDesign.md`. Renewable `kind:
  'trade'`, two slots per system, dest `otherSystemId`,
  origin `jobPayFor` + `HAUL_MARGIN` 1.4. Unique four stay.
  Sanitize cap later `4+4*N_SYSTEMS+16` (420). No survivor
  / data / livingRock seed cargo.
  BIO-03: `docs/Bio03FleetDesign.md`. Beautiful NPC look
  and motion around the player `makeLivingHull` benchmark.
  Player CPU swim stays unique. NPC stay GLB + GPU. Fail
  closed keeps that path. Living frigate NPC visual may
  exist; yard buy stays omitted.
  NPC missiles: `docs/NpcMissilesDesign.md`. Reuse dart
  seeker math, smaller NPC pool. No aim-glass gauge. Default
  **off** until owner Q1 (who fires) and Q2 (toast + song).
  Unknowables stay beam-only. Missing missile `target`
  drops. Hit tests follow live `combat.js` 1716–1718.
  OPEN: TGT-05 station/gate lock; cone pixel cap; REP
  restitution UU / police leave / kill delta; EXP drop
  rate / desk UU / launder UU / Unknowables dock; graft
  list price (owner UU); gift / pirate seed; BIO-03 visual
  serial; BIO-04 out; living frigate omit; NPC missiles
  impl (needs Q1/Q2); power ledger; MSN-02 trade impl;
  other MSN families.
  `npm run test:boot` was not re-run (no `src/`). Known
  FAILs still WAVE4 fence, WAVE26 ferry/haul, WAVE35 haul.
  VERIFY: `out/w75/msn02/verify.txt` CLEAN;
  `out/w75/bio03/verify.txt` CLEAN;
  `out/w75/npc-missiles/verify.txt` CLEAN.
  FILES: `docs/Msn02TradeDesign.md`,
  `docs/Bio03FleetDesign.md`,
  `docs/NpcMissilesDesign.md`,
  `docs/PLAYER-EXPERIENCE-WISHLIST.md`, `PROGRESS.md`,
  `out/w75/`.
  No `src/` edits.
- Wave 76 (2026-08-20): MSN-02 trade first impl + BIO-03
  GPU swim (orchestrated; two parallel workers). NPC
  missiles stay off (owner Q1/Q2 still open).
  MSN-02: `kind: 'trade'`, two slots per system, dest
  `otherSystemId`, origin `payQuoted` + `HAUL_MARGIN` 1.4,
  need 5, 600 s fail-closed, splice+replace. Sanitize cap
  `4+4*N_SYSTEMS+16` (420). Unique four stay. Mining need
  4 stays. No survivor / data / livingRock seed. Digit 2
  cards. WAVE76 msn pins all true.
  BIO-03: per-instance GPU `uSwimHz` / `uSwimAmp` from NPC
  speed (idle 0.5 → cruise 2.3). Player CPU `makeLivingHull`
  unchanged. GLB path kept. No new meshes. `reducedMotion`
  amp 0. Class look / bake later.
  OPEN: TGT-05 station/gate lock; cone pixel cap; REP
  restitution UU / police leave / kill delta; EXP drop
  rate / desk UU / launder UU / Unknowables dock; graft
  list price (owner UU); gift / pirate seed; BIO-03 class
  look / bake; BIO-04 out; living frigate omit; NPC
  missiles impl (needs Q1/Q2); power ledger; other MSN
  families.
  `npm run test:boot` still ends with the known FAILs
  (WAVE4 fence, WAVE26 ferry/haul, WAVE35 haul). WAVE76
  msn pins all true. WAVE71/72/74 pins stay all true.
  VERIFY: `out/w76/msn02/verify.txt` CLEAN (probe + boot
  + live Chrome); `out/w76/bio03/verify.txt` CLEAN (live
  Chrome Hz probe).
  FILES: `src/game/save.js`, `src/systems/station.js`,
  `scripts/boot-test.mjs`, `src/systems/ship-assets.js`,
  `src/systems/npc.js`, `src/systems/organic.js`,
  `docs/Msn02TradeDesign.md`, `docs/Bio03FleetDesign.md`,
  `docs/PLAYER-EXPERIENCE-WISHLIST.md`, `PROGRESS.md`,
  `out/w76/`.
- Wave 77 (2026-08-20): three design briefs (orchestrated;
  hunt + passenger + explore parallel, markdown only).
  No `src/`.
  Hunt: `docs/Msn02HuntDesign.md`. Renewable
  `kind: 'hunt'`, two slots per system, quarry
  `recordId` `rec-<n>`, overlay pirate cap 2 stays,
  unique `bounty-ace` stays. Cap at impl =
  live cap + hunt room only (620 at 100).
  Passenger: `docs/Msn02PassengerDesign.md`. Renewable
  `kind: 'passenger'`, dest `otherSystemId` rebound,
  no cargo token, origin `jobPayFor(FERRY_REWARD)` 350.
  Unique `ferry-consignment` stays `done`. No `survivor`
  on jobs. POD-02 UU closed.
  Explore: `docs/Msn02ExploreDesign.md`. Renewable
  `kind: 'explore'`, landmark display names +
  `mystery.visited`, no clue id/text in UI. No
  `dataCrystal` grant. Drop % / Archive UU stay unset.
  Each family freezes **its** room only. A later impl
  sums rooms. Espionage and faction-war still wait on
  REP-04.
  OPEN: TGT-05 station/gate lock; cone pixel cap; REP
  restitution UU / police leave / kill delta; EXP drop
  rate / desk UU / launder UU / Unknowables dock; graft
  list price (owner UU); gift / pirate seed; BIO-03 class
  look / bake; BIO-04 out; living frigate omit; NPC
  missiles impl (needs Q1/Q2); power ledger; MSN-02
  hunt / passenger / explore impl; MSN-03 chains;
  espionage / faction-war (REP-04).
  `npm run test:boot` was not re-run (no `src/`). Known
  FAILs still WAVE4 fence, WAVE26 ferry/haul, WAVE35 haul.
  VERIFY: `out/w77/hunt/verify.txt` CLEAN;
  `out/w77/passenger/verify.txt` CLEAN;
  `out/w77/explore/verify.txt` CLEAN.
  FILES: `docs/Msn02HuntDesign.md`,
  `docs/Msn02PassengerDesign.md`,
  `docs/Msn02ExploreDesign.md`,
  `docs/PLAYER-EXPERIENCE-WISHLIST.md`, `PROGRESS.md`,
  `out/w77/`.
  No `src/` edits.
- Wave 78 (2026-08-21): MSN-02 hunt + passenger + explore
  first impl (orchestrated; serial hunt → passenger →
  explore because save.js + station.js overlap).
  Hunt: `kind: 'hunt'`, two slots, `recordId` bind,
  origin `payQuoted` from live bounty, overlay skip
  before credits, cap +HUNT_ROOM. Unique ace stays.
  Passenger: `kind: 'passenger'`, dest `otherSystemId`,
  no cargo, origin `jobPayFor(FERRY_REWARD)` 350.
  Unique `ferry-consignment` still `done`.
  Explore: `kind: 'explore'`, `resolveExploreSite`,
  `mystery.visited` + origin dock, landmark display
  names only, no data grant. Sanitize cap sums rooms:
  `4 + 10*N_SYSTEMS + 16` (1020 at 100). WAVE78 hunt /
  passenger / explore pins all true after harness freeze
  of sibling accepted jobs on completePay. Known boot
  FAILs still WAVE4 fence, WAVE26 ferry/haul, WAVE35 haul.
  Digit 2 live pane: [NO BROWSER COVERAGE] (Playwright
  Chrome profile locked). Designer audits: no Blocker /
  Major.
  OPEN: TGT-05 station/gate lock; cone pixel cap; REP
  restitution UU / police leave / kill delta; EXP drop
  rate / desk UU / launder UU / Unknowables dock; graft
  list price (owner UU); gift / pirate seed; BIO-03 class
  look / bake; BIO-04 out; living frigate omit; NPC
  missiles impl (needs Q1/Q2); power ledger; MSN-03
  chains; espionage / faction-war (REP-04).
  VERIFY: `out/w78/hunt/verify.txt` CLEAN;
  `out/w78/passenger/verify.txt` CLEAN;
  `out/w78/explore/verify-recheck.txt` CLEAN.
  FILES: `src/game/save.js`, `src/systems/station.js`,
  `scripts/boot-test.mjs`,
  `docs/Msn02HuntDesign.md`,
  `docs/Msn02PassengerDesign.md`,
  `docs/Msn02ExploreDesign.md`,
  `docs/PLAYER-EXPERIENCE-WISHLIST.md`, `PROGRESS.md`,
  `out/w78/`.
- Wave 79 (2026-08-21): three design briefs (orchestrated;
  REP-04 kill attribution + MSN-02 espionage +
  faction-war parallel, markdown only). No `src/`.
  REP-04: `docs/Rep04AttributionDesign.md`. Victim
  faction only. Skip independent / missing / reserved.
  Skip pirate and ace. Witness
  `lastAttackerOf === 'player'`. Incident `causer` is
  not enough. Kill delta **proposed, needs owner**;
  helper writes nothing until authored. No `crimeScore`.
  Police leave and restitution stay out. Digit 9 stays.
  Espionage: `docs/Msn02EspionageDesign.md`. Renewable
  `kind: 'espionage'`, two slots, ids `spy-<sys>-<n>`,
  dest gate rival, origin `explorePayBase`. Secret
  success: employer +2, target 0. Expose fail-closed.
  No data cargo. Cap at impl =
  live cap + espionage room only (1220 at 100).
  Faction-war: `docs/Msn02FactionWarDesign.md`. Renewable
  `kind: 'war'`, two slots, ids `war-<sys>-<n>`.
  Employer +2 (`MINING_REP`). Target delta fail-closed.
  Unique ace and Named Guns stay unique. Hunt stays
  local pirates. Cap at impl = live + war room only
  (1220 at 100). Each family freezes **its** room only.
  A later impl sums rooms. Unique four stay.
  OPEN: TGT-05 station/gate lock; cone pixel cap; REP
  restitution UU / police leave / kill delta (owner);
  EXP drop rate / desk UU / launder UU / Unknowables
  dock; graft list price (owner UU); gift / pirate seed;
  BIO-03 class look / bake; BIO-04 out; living frigate
  omit; NPC missiles impl (needs Q1/Q2); power ledger;
  MSN-02 espionage / war impl; MSN-03 chains.
  `npm run test:boot` was not re-run (no `src/`). Known
  FAILs still WAVE4 fence, WAVE26 ferry/haul, WAVE35 haul.
  VERIFY: `out/w79/rep04/verify.txt` CLEAN;
  `out/w79/espionage/verify.txt` CLEAN;
  `out/w79/faction-war/verify.txt` CLEAN.
  FILES: `docs/Rep04AttributionDesign.md`,
  `docs/Msn02EspionageDesign.md`,
  `docs/Msn02FactionWarDesign.md`,
  `docs/PLAYER-EXPERIENCE-WISHLIST.md`, `PROGRESS.md`,
  `out/w79/`.
  No `src/` edits.
- Wave 80 (2026-08-21): first impl of Wave 79 briefs
  (orchestrated; serial REP-04 → espionage → war
  because save.js + station.js + boot-test overlap).
  REP-04: `src/game/kill-standing.js` helper
  `applyPlayerKillStanding`; one bind in
  `handleDestroyed`. Witness own
  `lastAttacker === 'player'`. Skip pirate / ace /
  independent / reserved. `KILL_STANDING_DELTA = null`
  → no bag write, no Digit 9 kill line, no `commLine`.
  No `crimeScore`.
  Espionage: `kind: 'espionage'`, two slots,
  ids `spy-<sys>-<n>`, rival dest (gate first), dest-dock
  gather, origin file, origin `explorePayBase` quote,
  600 s fail-closed. Secret success employer +2,
  target 0. Expose fail-closed. No data cargo.
  Accepted cards name the home dock (not “file here”).
  War: `kind: 'war'`, two slots, ids `war-<sys>-<n>`,
  rival-gate dest, dest-faction patrol quarry, origin
  `PATROL_REWARD` 300, space-side hunt witness, employer
  +2, target 0. Unique ace and Named Guns stay unique.
  Hunt stays local pirates. Overlay cap 2 stays.
  Unique four stay.
  Sanitize cap sums rooms: `4+14*N+16` (1420 at 100).
  WAVE80 REP-04 / espionage / war pins all true after
  harness freeze of sibling negative-string pins.
  Known boot FAILs still WAVE4 fence, WAVE26 ferry/haul,
  WAVE35 haul.
  Digit 2 live pane: [NO BROWSER COVERAGE] (Playwright
  Chrome profile locked). Designer: spy Major (file here)
  closed on recheck; war audit clean; REP-04 no UI.
  OPEN: TGT-05 station/gate lock; cone pixel cap; REP
  restitution UU / police leave / kill delta (owner);
  EXP drop rate / desk UU / launder UU / Unknowables
  dock; graft list price (owner UU); gift / pirate seed;
  BIO-03 class look / bake; BIO-04 out; living frigate
  omit; NPC missiles impl (needs Q1/Q2); power ledger;
  MSN-03 chains; spy expose / war target-rep (owner).
  VERIFY: `out/w80/rep04/verify.txt` CLEAN;
  `out/w80/espionage/verify-recheck.txt` CLEAN;
  `out/w80/espionage/designer-audit-recheck.md` clean;
  `out/w80/faction-war/verify-recheck.txt` CLEAN;
  `out/w80/faction-war/designer-audit.md` clean.
  FILES: `src/game/kill-standing.js`, `src/systems/npc.js`,
  `src/game/save.js`, `src/systems/station.js`,
  `scripts/boot-test.mjs`,
  `docs/Rep04AttributionDesign.md`,
  `docs/Msn02EspionageDesign.md`,
  `docs/Msn02FactionWarDesign.md`,
  `docs/PLAYER-EXPERIENCE-WISHLIST.md`, `PROGRESS.md`,
  `out/w80/`.
- Wave 81 (2026-08-21): three design briefs (orchestrated;
  TGT-05 lock cats + MSN-03 chains + BIO-03 class look
  parallel, markdown only). No `src/`.
  TGT-05 cats: `docs/Tgt05LockCatsDesign.md`. KeyV stays.
  KeyT stays. Station / gate / pod / landmark via
  `lockKind` wrappers. MATCH / mining / hail / combat
  refuse those kinds. Pick direct-hit body sphere.
  Cone cap still owner. Digit 0 stays shipyard.
  MSN-03: `docs/Msn03ChainsDesign.md`. `kind: 'chain'`
  on `world.jobs`. Four three-step authored chains
  (EPICS factions only). No 600 s deadline. Origin
  `PATROL_REWARD` quote. Employer +2, target 0.
  Cap at impl = live + `CHAIN_ROOM` 7 (1427 at 100).
  Unique equipment grant fail-closed until owner SKUs.
  Unique four stay. EPICS stay Digit 9.
  BIO-03 look: `docs/Bio03ClassLookDesign.md`. NPC stay
  GLB + Wave 76 GPU swim. Six live class keys. Yard
  omit ace / freighter / frigate buy. No bake this
  wave. Player `makeLivingHull` stays unique.
  OPEN: TGT-05 lock-cats impl; cone pixel cap; REP
  restitution UU / police leave / kill delta (owner);
  EXP drop rate / desk UU / launder UU / Unknowables
  dock; graft list price (owner UU); gift / pirate seed;
  BIO-03 look/bake impl; BIO-04 out; living frigate
  omit; NPC missiles impl (needs Q1/Q2); power ledger;
  MSN-03 chains impl; spy expose / war target-rep
  (owner).
  `npm run test:boot` was not re-run (no `src/`). Known
  FAILs still WAVE4 fence, WAVE26 ferry/haul, WAVE35 haul.
  VERIFY: `out/w81/tgt05/verify.txt` CLEAN;
  `out/w81/msn03/verify.txt` CLEAN;
  `out/w81/bio03/verify.txt` CLEAN.
  FILES: `docs/Tgt05LockCatsDesign.md`,
  `docs/Msn03ChainsDesign.md`,
  `docs/Bio03ClassLookDesign.md`,
  `docs/PLAYER-EXPERIENCE-WISHLIST.md`, `PROGRESS.md`,
  `out/w81/`.
  No `src/` edits.
- Wave 82 (2026-08-21): owner judgement calls
  (`docs/OwnerDecisionsWave82.md`) plus three parallel
  impls. Cone **12 px**. Kill **−5**. Graft **4000 UU**.
  EXP drop **0.20**, own **400**, rival **900**, launder
  **250**. TGT-05 KeyV locks station / gate / pod /
  landmark with `lockKind`; MATCH / hail / mining refuse
  those kinds. Kill helper writes and recaps Beautiful
  at −10 while the player still wears a graft. Archive
  files with debit/credit. Fixer launder 250. Named later:
  NPC darts (Q1 pirate+ace, Q2 toast+song), MSN-03 SKUs,
  spy expose −2, war target −2, restitution 1200, police
  leave defer, BIO-03 bake keep GLB, living frigate omit.
  VERIFY: `out/w82/tgt05/verifier-log.txt` CLEAN;
  `out/w82/exp/verifier-log.txt` CLEAN;
  `out/w82/stand/verifier-recheck.txt` CLEAN.
  Designer: `out/w82/tgt05/designer-audit.md` CLEAN;
  `out/w82/exp/designer-audit.md` CLEAN;
  `out/w82/stand/designer-audit.md` CLEAN.
  FILES: `docs/OwnerDecisionsWave82.md`, TGT/EXP/BIO/REP
  briefs, `src/game/reticle-aim.js`, `src/systems/controls.js`,
  `src/systems/hud.js`, `src/systems/combat.js`,
  `src/systems/hail.js`, `src/systems/ship.js`,
  `src/game/data-trade.js`, `src/systems/station.js`,
  `src/game/kill-standing.js`, `src/game/hangar.js`,
  `src/game/shipyard.js`, `src/systems/shipyard-desk.js`,
  `scripts/boot-test.mjs`, wishlist, `PROGRESS.md`,
  `out/w82/`.
  `npm run test:boot` still FAIL. WAVE82 owner pins all true.
  WAVE72 graft debit pin true. Known FAILs still WAVE4 fence,
  WAVE26 ferry/haul, WAVE35 haul. WAVE78 passenger/explore
  `completePay` still false (pay quote vs epic mult).
- Wave 83 (2026-08-21): previously blocked serials after Wave 82
  numbers. NPC missiles: pirate+ace one dart after hunt
  telegraph, then cannon; pool 4; toast `Incoming dart.` +
  song sting; Unknowables never fire. Spy expose: accepted
  lapse dest −2, employer 0, no pay. War success dest −2
  plus live employer +2. Restitution desk Digit 9, 1200 UU,
  two-step confirm, key to 0, graft recap. MSN-03 four
  authored chains; last-step dart/auto when `canSeat`.
  WAVE80 pins updated to dest −2. Police leave, gift,
  pirate seed, BIO-03 bake, Unknowables dock still out.
  VERIFY: `out/w83/missiles/verifier-log.txt` CLEAN;
  `out/w83/station/verifier-log.txt` then pin recheck CLEAN.
  Designer: `out/w83/missiles/designer-audit.md` CLEAN;
  `out/w83/station/designer-audit.md` CLEAN.
  FILES: `src/systems/combat.js`, `npc.js`, `hud.js`,
  `song.js`, `ctx.js`, `station.js`, `src/game/save.js`,
  `jobs-chains.js`, `restitution.js`, `scripts/boot-test.mjs`,
  design status lines, wishlist, `PROGRESS.md`, `out/w83/`.
  Full `npm run test:boot` WAVE83 STATION all true. First
  missiles run `pirateOneDart` false (late-boot fear
  bargaining); harness spawn freeze then cadence recheck
  CLEAN. Known FAILs still WAVE4 fence, WAVE26 ferry/haul,
  WAVE35 haul. WAVE80 REP-04 `digit9NoKillClaim` still
  false (pre-existing).
- Wave 84 (2026-08-21): three design briefs (orchestrated;
  NAV-01 route plot + NAV-02 in-flight guidance + NAV-03
  autopilot parallel, markdown only). No `src/`.
  Persist: one `WORLD_FIELDS` key `nav` =
  `{ dest, path, remaining, status }` with
  `plotted|blocked|arrived`. Next hop is `path[1]`.
  Recalc is an event, not a stored status. `hopIndex`
  is forbidden. Chart click plots; KeyM stays. No lock
  steal. No `innerHTML`. No teleport. Hit disc ≥ 24 CSS
  px; hub rings `pointer-events: none`.
  Guidance: side-col readout above POS; `.rw-nav-gate-cue`
  (not scanner arc); decorative gate ring, empty raycast.
  PR1 chrome `max-width: 180px` + hide docked/jumping.
  Autopilot: `autopilot.js` commands, `ship.js` mesh;
  `gate.js` sole `jumpRequested`; MATCH refuse; restore
  forces `autopilot: false`. Chart-header refuse above
  z-index 30; steer-break off while chart open.
  OPEN: NAV-01/02/03 impl (serial after persist);
  police leave; gift; pirate seed; BIO-03 bake;
  Unknowables dock; BIO-04; power ledger.
  `npm run test:boot` was not re-run (no `src/`). Known
  FAILs still WAVE4 fence, WAVE26 ferry/haul, WAVE35 haul.
  VERIFY: `out/w84/nav01/verify-recheck.txt` CLEAN;
  `out/w84/nav02/verify-recheck.txt` CLEAN;
  `out/w84/nav03/verify-recheck.txt` CLEAN.
  Designer: `out/w84/nav01/designer-audit-recheck.md` CLEAN;
  `out/w84/nav02/designer-audit-recheck.md` CLEAN;
  `out/w84/nav03/designer-audit-recheck.md` CLEAN.
  FILES: `docs/Nav01RouteDesign.md`,
  `docs/Nav02GuidanceDesign.md`,
  `docs/Nav03AutopilotDesign.md`,
  `docs/PLAYER-EXPERIENCE-WISHLIST.md`, `PROGRESS.md`,
  `out/w84/`.
  No `src/` edits.
- Wave 85 (2026-08-21): first impl of Wave 84 NAV briefs
  (orchestrated; persist then chart serial, then NAV-02
  parallel with NAV-03 stub, then NAV-03 flight).
  One `WORLD_FIELDS` key `nav`. Sanitize drops proto /
  hopIndex / `active`. Restore slices mid-route. Off-path
  current → `blocked` keep dest. `autopilot` stuffed true
  → false. BFS walks `gates[].to` and one-way `hub.routes`.
  Chart click plots; hit disc ≥ 24 CSS px; hub rings
  `pointer-events: none`; plot class `.rw-galaxy-plot`.
  KeyM stays. LMB does not fire while `flags.chartOpen`.
  Recalc on `systemLoaded`. Guidance: readout above POS
  (180 px, hide docked/jumping); `.rw-nav-gate-cue`; 3D
  ring empty raycast. Autopilot: `autopilot.js` commands,
  `ship.js` mesh; `gate.js` sole `jumpRequested`; MATCH
  refuse on chart live region; Cancel / WASD keep dest.
  OPEN: police leave; gift; pirate seed; BIO-03 bake;
  Unknowables dock; BIO-04; power ledger.
  `npm run test:boot` still FAIL. WAVE85 persist / chart /
  guidance / AP probes CLEAN. Known FAILs still WAVE4 fence,
  WAVE26 ferry/haul, WAVE35 haul.
  VERIFY: `out/w85/persist/verify.txt` CLEAN;
  `out/w85/chart/verify.txt` CLEAN (live Chrome);
  `out/w85/guide/verify-live.txt` CLEAN;
  `out/w85/ap-stub/verify.txt` CLEAN;
  `out/w85/ap/verify-live.txt` CLEAN.
  Designer: `out/w85/chart/designer-audit.md` CLEAN;
  `out/w85/guide/designer-audit-recheck.md` CLEAN;
  `out/w85/ap/designer-audit.md` CLEAN.
  FILES: `src/game/nav.js`, `src/game/save.js`,
  `src/game/autopilot.js`, `src/core/ctx.js`,
  `src/main.js`, `src/systems/galaxychart.js`,
  `src/systems/controls.js`, `src/systems/hud.js`,
  `src/systems/nav-guidance.js`, `src/systems/ship.js`,
  `src/systems/gate.js`, `src/systems/npc.js`,
  `src/systems/title.js`, `src/systems/modelsbrowser.js`,
  `src/game/origins.js`, `src/ui/hud.css`,
  `scripts/boot-test.mjs`, design status lines, wishlist,
  `PROGRESS.md`, `out/w85/`.
- Wave 86 (2026-08-21): three design briefs (orchestrated;
  BIO-01 remaining obtain + BIO-02 class training +
  BIO-04 psionics parallel, markdown only). No `src/`.
  BIO-01: gift id `hull_seed_gift`, Sworn ≥ 50, living
  `light`, price 0, People Confirm papers, hangar cap 8
  fail-closed, no remount. Pirate seed same persist
  shape; drop % owner-open (Wave 82). Commodity deferred
  (no live SKU).
  BIO-02: `bio.growth` stays scale. Train living
  `light`/`cutter` → `heavy` at Beautiful Hangar papers.
  No new class keys. No new Digit. Digit 0 stays
  Shipyard. Hostile paints `No sale.`; short credits
  keep Offer. `trainPending` dies on graft chrome paths.
  Frigate evolution fail-closed. UU owner-open.
  BIO-04: flight Digit 5 `WEAPONS.psionic`; dock Digit 5
  stays repair. Living + grafted only. Built non-grafted
  `5 · —`. Heat only. No power ledger. No aim glass.
  Unknowables miss. Catalog numbers owner-open.
  OPEN: police leave; BIO-03 bake; Unknowables dock;
  power ledger; BIO-01/02/04 impl.
  `npm run test:boot` was not re-run (no `src/`). Known
  FAILs still WAVE4 fence, WAVE26 ferry/haul, WAVE35 haul.
  VERIFY: `out/w86/bio01/verify.txt` CLEAN;
  `out/w86/bio02/verify.txt` CLEAN then
  `out/w86/bio02/verify-recheck.txt` CLEAN;
  `out/w86/bio04/verify.txt` CLEAN.
  Designer: `out/w86/bio01/designer-audit.md` CLEAN;
  `out/w86/bio02/designer-audit.md` 2 majors, then
  `out/w86/bio02/designer-audit-recheck.md` CLEAN;
  `out/w86/bio04/designer-audit.md` CLEAN.
  FILES: `docs/Bio01ObtainDesign.md`,
  `docs/Bio02EvolutionDesign.md`,
  `docs/Bio04PsionicsDesign.md`,
  `docs/PLAYER-EXPERIENCE-WISHLIST.md`, `PROGRESS.md`,
  `out/w86/`.
  No `src/` edits.
- Waves 87–91 (2026-08-22, working tree; not a separate
  git commit): NAV leftovers after Wave 85 — AP path
  (`src/game/ap-path.js`), automine (`src/game/automine.js`),
  AP gate hold, yard GLB preview (`src/systems/yard-preview.js`),
  living class remount silhouette. Evidence `out/w87/`–
  `out/w91/`. OPEN items below still stood after those
  leftovers.
- Wave 92 (2026-08-22): first impl of Wave 86 BIO briefs
  plus Unknowables dock design (orchestrated; BIO-01 and
  BIO-04 parallel, BIO-02 after hangar/station free).
  BIO-01: Sworn gift `hull_seed_gift` living light, price 0,
  People Confirm papers, cap 8 refuse, no remount.
  Pirate `PIRATE_SEED_DROP_RATE` 0.05, hangar row not cargo.
  BIO-02: Hangar papers train living light/cutter → heavy;
  debit `yardPrice('heavy')`; cargo keep; envelope
  burn/cruise; no switchTo. Hostile `No sale.`
  BIO-04: Digit 5 `WEAPONS.psionic` (12/3/520/420/8,
  family hex `0xff6ad5`); living or unset hullKind or
  own-key grafted; built dry `5 · —`; Unknowables miss;
  unknown group not cannon. Unknowables dock brief:
  first live site is hush presence `th_veil`, not a
  generated SYSTEM with a station. Dock stays Wait.
  OPEN: police leave; BIO-03 bake; Unknowables presence
  impl; power ledger; living-frigate buy; seed commodity.
  `npm run test:boot` not used as the gate. Known FAILs
  still WAVE4 fence, WAVE26 ferry/haul, WAVE35 haul.
  VERIFY: `out/w92/bio01/probe.mjs` PASS then
  `out/w92/bio01/verify/pin-recheck.txt` CLEAN;
  `out/w92/bio02/probe.mjs` PASS then
  `out/w92/bio02/verify` CDP CLEAN;
  `out/w92/bio04/boot-pins.mjs` PASS then
  `out/w92/bio04/verify-recheck/` CLEAN;
  `out/w92/unk/verify.txt` CLEAN.
  Designer: `out/w92/bio01/designer-audit.md` CLEAN;
  `out/w92/bio02/designer-audit.md` CLEAN;
  `out/w92/bio04/designer-audit.md` CLEAN.
  FILES: `src/game/bio-seed.js`, `hangar.js`, `psionic.js`,
  `shipyard.js`, `state.js`, `src/systems/station.js`,
  `npc.js`, `shipyard-desk.js`, `combat.js`, `controls.js`,
  `hud.js`, `src/core/ctx.js`, `scripts/boot-test.mjs`,
  `docs/UnknowablesDockDesign.md`,
  `docs/OwnerDecisionsWave92.md`, Bio01/02/04 status,
  wishlist, `PROGRESS.md`, `out/w92/`.
- Wave 93 (2026-08-23): owner judgement calls
  (`docs/OwnerDecisionsWave93.md`). Markdown only. No `src/`.
  Police leave: patrol toast+`commLine` `Leave this space.`
  when local standing `< 0` and `> −10`, once per visit,
  300 u; hunt ≤ −10 unchanged. Power ledger / aim-glass
  **out**. Living frigate buy **omit**. Seed commodity
  **omit**. Owned living `heavy` → `frigate` train **yes**
  (`yardPrice('frigate')`, Trusted 25); ace/freighter **no**.
  Unknowables presence unblocked (`th_veil` / The Veil /
  `hush` / `anomaly`; visitor hulls off; epic omit; clue
  count 6). Unknowables dock **Wait**. BIO-03 bake serial
  open (GLB + GPU).
  OPEN: police leave impl; BIO-03 bake impl; Unknowables
  presence impl; BIO-02 frigate-train impl.
  `npm run test:boot` was not re-run (no `src/`). Known
  FAILs still WAVE4 fence, WAVE26 ferry/haul, WAVE35 haul.
  FILES: `docs/OwnerDecisionsWave93.md`, Bio01/02,
  Unknowables, REP briefs, wishlist, `PROGRESS.md`.
  No `src/` edits.
- Wave 94 (2026-08-23): owner rejected Wave 93 parks
  (`docs/OwnerDecisionsWave94.md`) and first impl.
  Living Beautiful/Unknowables yards sell six classes.
  Hangar train dest = any other living class
  (`yardPrice(dest)`). Beautiful Market seed 40000 UU
  hangar row (`seed_market`), not cargo. POWER pool 100;
  PWR bar in side column; afterburner + psionic drain;
  aim glass empty. Unknowables origin `veil` / The Quiet;
  dedicated station builder; Archive 400/900; chart id
  `veil`; epic omit; clue count on hush stays 2.
  OPEN: police leave impl; BIO-03 bake impl.
  VERIFY: `out/w94/power/probe.mjs` PASS + live HUD CLEAN;
  `out/w94/bio/probe.mjs` PASS; `out/w94/unk/probe.mjs` PASS.
  Designer: `out/w94/power/designer-audit.md` CLEAN;
  `out/w94/bio/designer-audit.md` CLEAN;
  `out/w94/unk/designer-audit.md` CLEAN.
  FILES: `src/game/state.js`, `shipyard.js`, `hangar.js`,
  `bio-seed.js`, `authored-systems.js`, `contacts.js`,
  `model-catalog.js`, `src/systems/ship.js`, `combat.js`,
  `hud.js`, `station.js`, `shipyard-desk.js`,
  `galaxychart.js`, `stations/unknowables.js`,
  `src/ui/hud.css`, `scripts/boot-test.mjs`,
  `docs/OwnerDecisionsWave94.md`, `out/w94/`.
- Wave 95 (2026-08-23): police leave first impl, BIO-03
  Beautiful look+bake, NAV-04 hover brief.
  Police: local-system-faction patrols emit one `commLine`
  `Leave this space.` when standing `< 0` and `> −10`,
  player inside 300 u of the station, once per
  `systemLoaded`. Hunt `≤ −10` unchanged. No persist key.
  BIO-03: six Beautiful NPC classes rebaked (GLB + GPU).
  Player `makeLivingHull` stays unique. Measure ALL PASS
  (light 8.0, ace 7.7 inside 15% slack, cutter 10.7,
  heavy 15.3, frigate 29.0, freighter 83.2).
  NAV-04: markdown only (`docs/Nav04HoverDesign.md`);
  reserved strip; no `src/`; no new persist.
  OPEN: NAV-04 impl (later serial). Boot pins still
  expect 100 systems (Wave 94 `veil` makes 101) and
  crash at `lmSeparationOk23` — not a Wave 95 write.
  VERIFY: `out/w95/police/probe.mjs` PASS; NAV-04 verifier
  CLEAN; `npm run ships:measure` / `ships:validate` PASS.
  Designer: police CLEAN; BIO-03 glance sheets pass;
  Models Browser GLB overlay hang is headless ENV (not a
  mesh hole). Police live toast was probe-only
  `[NO BROWSER COVERAGE]`.
  FILES: `src/game/police-leave.js`, `src/systems/npc.js`,
  `scripts/ship_builders/beautiful/*.py`,
  `public/assets/ships/beautiful/**`,
  `docs/Nav04HoverDesign.md`, `out/w95/`.
- Wave 96 (2026-08-23): NAV-04 first impl, boot `veil`/101
  harness heal, BIO-05 remaining brief.
  NAV-04: `hoverModel` in `src/game/chart-hover.js`; KeyM
  hit-disc hover; reserved `.rw-galaxy-hover` strip under
  the SVG; Digit 9 standing; Independent / Unknown /
  Unknowables / Hollow Reach explicit; click still plots;
  no `world.nav` write; no persist key; `state.js` unread
  as write. Boot: `AUTHORED_IDS23` includes `veil`; hush
  landmark pin includes `th_veil`; galaxy count 101;
  roster 104 / dockmasters 101; generated stays 94.
  BIO-05: markdown only (`docs/Bio05AbominationsDesign.md`).
  Player graft loop frozen DONE (Wave 72 / 82). Remaining
  NPC grafted traffic and plated tissue overlay wait on
  an owner line.
  OPEN: BIO-05 NPC/visual (owner). Known boot FAILs still
  WAVE4 fence, WAVE26 ferry/haul, WAVE35 haul.
  VERIFY: `out/w96/nav04/probe.mjs` PASS (82 pins) + live
  KeyM hover CLEAN; `out/w96/boot/probe.mjs` PASS; WAVE23
  `lmSeparationOk23` no crash (`countOk` 101).
  Designer: NAV-04 CLEAN; BIO-05 CLEAN.
  FILES: `src/game/chart-hover.js`,
  `src/systems/galaxychart.js`, `src/ui/hud.css`,
  `scripts/boot-test.mjs`, `docs/Nav04HoverDesign.md`,
  `docs/Bio05AbominationsDesign.md`, `out/w96/`.
- Wave 97 (2026-08-23): three design-only leftovers.
  TGT-03 awareness: lock off-screen already uses
  `.rw-edge-arrow` (distinct from NAV-02
  `.rw-nav-gate-cue`). Later serial adds toast
  `Incoming fire.` for cannon-vs-player; keep
  `Incoming dart.`; no aim-glass gauge.
  NPC turrets: supersedes NpcMissiles “no NPC auto
  turret” for a later serial only. Player `auto`
  stays. Default-off who (proposed heavy/ace/frigate
  + already-hostile). No fire percent. No `src/`.
  BIO-05 remaining: owner close
  (`docs/OwnerDecisionsWave97.md`) — NPC grafted
  **off**, plated overlay **omit**, hangar badge
  **omit**, ungraft **forbidden**. Player graft loop
  stays closed (4000 / −10 / −5 / +5).
  OPEN: TGT-03 `Incoming fire.` impl; NPC turret
  impl (owner Q1/Q2). Known boot FAILs still WAVE4
  fence, WAVE26 ferry/haul, WAVE35 haul.
  CLOSED by Wave 98: Incoming fire. impl + Q1/Q2 owner.
  VERIFY: `out/w97/tgt03/verify/notes.md` CLEAN;
  `out/w97/turrets/verify/notes.md` CLEAN;
  `out/w97/bio05/verify/notes.md` CLEAN.
  Designer: TGT-03 CLEAN; turrets CLEAN; BIO-05 CLEAN.
  FILES: `docs/Tgt03AwarenessDesign.md`,
  `docs/NpcTurretsDesign.md`,
  `docs/OwnerDecisionsWave97.md`,
  `docs/Bio05AbominationsDesign.md`, `out/w97/`.
  No `src/` edits.
- Wave 98 (2026-08-23): TGT-03 first impl + turret
  owner Q1/Q2 + radar brief.
  Incoming fire.: helper `npcFireToast` in
  `src/game/npc-fire-toast.js`; HUD binds
  `Incoming fire.` for cannon-vs-player (ace omit
  included) on a 2.5 s clock separate from dart;
  `Incoming dart.` unchanged; unknown weapon
  fail-closed; dock/jump suppress. Lock
  `.rw-edge-arrow` parks docked/jumping and sets
  `aria-hidden="true"`. No second arrow. No hub
  gauge. `state.js` / `npc.js` / `combat.js`
  untouched.
  NPC turrets: owner close
  (`docs/OwnerDecisionsWave98.md`) — Q1 class-gated
  `heavy` / `ace` / `frigate` + already-hostile;
  Q2 vsPlayer only, missing target drops. No fire
  percent. No turret toast. No `src/` fire.
  Radar: markdown only (`docs/Tgt03RadarDesign.md`)
  — reuse `.rw-contacts`; no hub PPI; scanner still
  gates; later serial named only.
  OPEN: NPC turret impl (Q1/Q2 closed); radar
  jump-park polish serial; subsystem targeting
  still later. Known boot FAILs still WAVE4 fence,
  WAVE26 ferry/haul, WAVE35 haul.
  CLOSED by Wave 99: turret first impl + radar
  jump-park; subsystem brief.
  VERIFY: `out/w98/tgt03/probe.mjs` PASS;
  WAVE98 boot pins all true (`npm run test:boot`
  still FAIL on pre-existing WAVE4 fence, WAVE80
  REP-04, WAVE85 nav guidance, WAVE92 BIO-01/02);
  `out/w98/tgt03/verify/notes.md` CLEAN (browser
  idle + docked park); `out/w98/turrets/verify/notes.md`
  CLEAN; `out/w98/radar/verify/notes-recheck.md` CLEAN.
  Designer: TGT-03 CLEAN; turrets CLEAN; radar CLEAN.
  FILES: `src/game/npc-fire-toast.js`,
  `src/systems/hud.js`, `scripts/boot-test.mjs`,
  `docs/Tgt03AwarenessDesign.md`,
  `docs/Tgt03RadarDesign.md`,
  `docs/NpcTurretsDesign.md`,
  `docs/OwnerDecisionsWave98.md`, `out/w98/`.
- Wave 99 (2026-08-23): NPC turret first impl +
  radar jump-park + subsystem targeting brief.
  Turrets: hostile `heavy` / `ace` / `frigate` emit
  `npcFire` `weapon: 'turret'` `target: 'player'`
  after telegraph; independent clock 0.5× player
  turret ROF; missing turret target drops; cannon
  omit still hits the player; NPC live cap 4
  separate from player cap 2; Unknowable miss;
  seat-0 / trader / miner / cutter-pirate never
  emit. Toast reuses `Incoming fire.` (same 2.5 s
  clock). No turret-specific string. No HUD child.
  Radar: `contactsGate` in `src/game/contacts-gate.js`;
  `.rw-contacts` hides while docked or jumping;
  scanner not cleared; no PPI; no new class.
  Subsystem targeting: markdown only
  (`docs/Tgt03SubsystemDesign.md`); empty hub freeze;
  later serial fail-closed without owner numbers.
  CLOSED by Wave 100: engine-select owner + impl.
  OPEN: turret vsNPC later. Known boot FAILs still WAVE4 fence,
  WAVE26 ferry/haul, WAVE35 haul, WAVE80 REP-04,
  WAVE85 nav, WAVE92 BIO.
  VERIFY: `out/w99/turrets/probe.mjs` PASS;
  WAVE99 boot pins all true; turret live-fire
  browser `[NO BROWSER COVERAGE]`;
  `out/w99/radar/probe.mjs` PASS + live dock/jump
  park CLEAN; `out/w99/subsys/verify/notes-recheck.md`
  CLEAN.
  Designer: turrets CLEAN; radar CLEAN; subsys CLEAN.
  FILES: `src/systems/npc.js`, `combat.js`,
  `src/core/ctx.js`, `src/game/npc-fire-toast.js`,
  `src/game/contacts-gate.js`, `src/systems/hud.js`,
  `scripts/boot-test.mjs`, `docs/NpcTurretsDesign.md`,
  `docs/Tgt03RadarDesign.md`,
  `docs/Tgt03SubsystemDesign.md`, `out/w99/`.
- Wave 100 (2026-08-23): owner deputize on TGT-03
  subsystem (`docs/OwnerDecisionsWave100.md`) + first
  impl. Standing rule: pick, note, keep going.
  KeyK toggles live `ctx.targets.part` `'engine'|null`
  on a ship lock. No persist. No SKU. No extra Digit.
  ENGINE bar on `.rw-combat-target`. After screen and
  shell are 0, player shots with engine-select hit
  engine and skip hull until `engineOut`. Peel still
  screens first. NPC shots ignore the part.
  OPEN: turret vsNPC later. Owner may override
  engine-select after playtest. Known boot FAILs still
  WAVE4 fence, WAVE26 ferry/haul, WAVE35 haul, WAVE80
  REP-04, WAVE85 nav, WAVE92 BIO.
  CLOSED by Wave 101: turret vsNPC leftover.
  VERIFY: `out/w100/subsys/probe.mjs` PASS; WAVE100
  boot pins all true; live HUD `[NO BROWSER COVERAGE]`.
  FILES: `src/game/subsys-aim.js`, `src/game/state.js`,
  `src/core/ctx.js`, `src/systems/controls.js`,
  `src/systems/combat.js`, `src/systems/hud.js`,
  `src/ui/hud.css`, `scripts/boot-test.mjs`,
  `docs/OwnerDecisionsWave100.md`,
  `docs/Tgt03SubsystemDesign.md`, `out/w100/`.
- Wave 101 (2026-08-23): NPC turret vs already-hostile
  NPC leftover (`docs/OwnerDecisionsWave101.md`) + two
  design briefs. Turrets: same class gate as vsPlayer;
  emit on live `ai.target` in attack; `bolt.vsPlayer =
  false`; never `testPlayerHit` on vsNPC; toast still
  vsPlayer only; cap 4 shared; `mayHuntPlayer` not
  widened. TGT-03 remaining CLOS brief
  (`docs/Tgt03ClosureDesign.md`): core rail next to
  DIST; `+N`/`-N`/`0 u/s`; exclusive Mk II sibling;
  no hub; no SKU; no persist. BIO-02 remaining career
  (`docs/Bio02CareerDesign.md`): no new class keys;
  careers = loadout + live six `LIVING_STOCK`; Digit 0
  stays Shipyard; kit mutate omit. Live yards already
  sell six living keys including frigate (Wave 86 omit
  is stale).
  OPEN: CLOS impl (later serial). Career labels later
  (no kit mutate). Owner may override vsNPC after
  playtest.
  CLOSED by Wave 102: CLOS first impl + career labels
  + HUD-03 audio-alerts brief.
  VERIFY: `out/w101/turrets/probe.mjs` PASS; WAVE101
  and WAVE99 turret pins all true; player-hit guard
  PASS; turret live `[NO BROWSER COVERAGE]`. Closure
  verifier CLEAN after freeze recheck; designer CLEAN.
  Career verifier CLEAN; designer CLEAN.
  FILES: `src/systems/npc.js`, `combat.js`,
  `src/core/ctx.js`, `scripts/boot-test.mjs`,
  `docs/OwnerDecisionsWave101.md`,
  `docs/NpcTurretsDesign.md`,
  `docs/Tgt03ClosureDesign.md`,
  `docs/Bio02CareerDesign.md`, `out/w101/`.
- Wave 102 (2026-08-23): TGT-03 CLOS first impl +
  BIO-02 career labels + HUD-03 remaining brief.
  CLOS: helper `losCloseRate` in `src/game/los-close.js`;
  `.rw-combat-clos` next to DIST on a live ship lock;
  `+N u/s` / `-N u/s` / `0 u/s`; scanner does not gate;
  no hub child; no persist; no SKU; KeyK stays engine.
  Career: Hangar Offer **name** appends static words
  (heavy combat, ace hunter, freighter trade, light
  explore, cutter cutter, frigate capital). Offer
  **button** stays `Offer {class}` so WAVE92 `Offer
  heavy` still clicks. Confirm hop stays `{from} →
  {dest}` keys. Kit mutate omit. Digit 0 shipyard.
  HUD-03: markdown only (`docs/Hud03AlertsDesign.md`).
  Later KeyO `hudAlerts` default off; reuse family
  ticks; mute fail-closed; Incoming copy stays.
  OPEN: HUD-03 audio impl (later serial). Kit mutate
  still omit. Owner may override CLOS format / vsNPC
  / `hudAlerts` default after playtest.
  CLOSED by Wave 103: HUD-03 audio-alerts serial.
  VERIFY: WAVE102 CLOS pins all true
  (`out/w102/clos/verify/`); career probe PASS
  (`out/w102/career/probe.mjs`); WAVE92 BIO-02 true
  after button restore; HUD-03 verifier CLEAN.
  Designer: CLOS CLEAN; career CLEAN; HUD-03 spec
  CLEAN. CLOS live HUD `[NO BROWSER COVERAGE]`.
  FILES: `src/game/los-close.js`, `src/systems/hud.js`,
  `src/ui/hud.css`, `src/systems/shipyard-desk.js`,
  `scripts/boot-test.mjs`,
  `docs/Tgt03ClosureDesign.md`,
  `docs/Bio02CareerDesign.md`,
  `docs/Hud03AlertsDesign.md`, `out/w102/`.
- Wave 103 (2026-08-23): HUD-03 audio-alerts first
  impl + REP-05 remaining brief + MSN-03 unique
  DONE brief. HUD-03: KeyO checkbox `hudAlerts`
  default false; copy **HUD audio alerts** after
  Reduced motion, before Mute all audio; `song.js`
  `HUD_ALERT_TYPES` gate; mute/volume still win;
  Incoming copy stays; no `hud.js` edit; no hub
  child; no new Digit; no WORLD_FIELDS; persist
  `rimward-settings-v1`. REP-05 markdown
  (`docs/Rep05ConsequencesDesign.md`): covering
  patrol Known+; inbound Marked jump refuse;
  police leave stays live; dock stays open.
  MSN-03 markdown (`docs/Msn03UniqueDoneDesign.md`):
  hide unique four `done` on Digit 2; persist keep;
  no memorial pane. Kit mutate still omit.
  OPEN: REP-05 covering + jump refuse (later
  serial). MSN-03 unique DONE hide (later serial).
  Owner may override `hudAlerts` default / CLOS
  format / vsNPC after playtest.
  CLOSED by Wave 104: covering + inbound jump +
  unique DONE hide.
  VERIFY: `out/w103/hud03/probe.mjs` PASS (23/23);
  WAVE103 pins in `scripts/boot-test.mjs`; HUD-03
  verifier CLEAN with browser stills
  (`out/w103/hud03/verify/`); designer CLEAN.
  REP-05 verifier CLEAN; designer CLEAN.
  MSN-03 verifier CLEAN; designer CLEAN.
  FILES: `src/core/ctx.js`, `src/systems/settings.js`,
  `src/systems/song.js`, `scripts/boot-test.mjs`,
  `docs/Hud03AlertsDesign.md`,
  `docs/Rep05ConsequencesDesign.md`,
  `docs/Msn03UniqueDoneDesign.md`, `out/w103/`.
- Wave 104 (2026-08-24): REP-05 covering + inbound
  jump first impl + MSN-03 unique DONE hide + BIO-06
  remaining brief. Covering: Known ≥ 10 local patrol
  hunts the pirate/ace the player fights; additive
  to ungated pirate-work hunt; `Patrol covering.`
  once/visit; vsPlayer never; law zone 300; skip
  beautiful/unknowables/hollow/independent.
  Jump: `beginJump` refuses dest standing < −25;
  skip unknowables/hollow/independent; `No passage.`
  once/dest/visit; dock stays open; outbound stays
  open. Digit 9 copy waits PR3. Unique DONE: hide
  exact four ids on Digit 2 `boardJobs`; persist
  keep; uniqueRetry source stays; no memorial.
  BIO-06 markdown (`docs/Bio06CadenceDesign.md`):
  per-class hzScale light 1.00 … freighter 0.30;
  player CPU `makeLivingHull` preserve; NPC `/120`
  named later. Kit mutate still omit.
  OPEN: REP-05 Digit 9 copy (PR3). BIO-06 cadence
  serial (later). Owner may override covering
  Known 10 / jump −25 / cadence table / `hudAlerts`
  / CLOS / vsNPC after playtest.
  CLOSED by Wave 105: BIO-07 freeze + light/heavy
  organic NPC slices.
  VERIFY: `out/w104/rep05/probe.mjs` PASS; WAVE104
  covering-jump pins all true; WAVE103 still true;
  covering toast `[NO BROWSER COVERAGE]`; designer
  CLEAN. MSN-03 probe PASS; live Digit 2 hide CLEAN
  (`out/w104/msn03/verify/`); designer CLEAN.
  BIO-06 verifier CLEAN; designer CLEAN.
  FILES: `src/game/police-cover.js`,
  `src/systems/npc.js`, `src/game/jump.js`,
  `src/systems/station.js`, `scripts/boot-test.mjs`,
  `docs/Rep05ConsequencesDesign.md`,
  `docs/Msn03UniqueDoneDesign.md`,
  `docs/Bio06CadenceDesign.md`, `out/w104/`.
- Wave 105 (2026-08-24): BIO-07 species-bodies freeze
  + Beautiful NPC light and heavy organic slices.
  Owner: player CPU hull stays the bar; NPC fleet
  must read as sea creatures, not creature+machine
  fusions. Brief (`docs/Bio07BodiesDesign.md`):
  kill rigid panels / box wells / plate mantles;
  shared organs stay serial; fail-closed keep Wave
  95 GLB; remaining ace/cutter/frigate/freighter
  later. Light: young wayfinder; nacre pads not
  helmet; span 7.8. Heavy: shieldback; grown mantle
  lofts; Wave 95 turret gone; span 15.3. Player
  `makeLivingHull` untouched. Kit mutate still omit.
  OPEN: BIO-07 remaining four classes. BIO-06
  cadence serial. REP-05 Digit 9 copy. Shared
  `organs.py` box wells still live (serial PR7).
  CLOSED by Wave 106: remaining four BIO-07
  classes + foundation rewrite + bake.
  CLOSED by Wave 107: BIO-06 cadence + REP-05
  Digit 9 copy.
  VERIFY: BIO-07 verifier CLEAN; designer freeze
  CLEAN for markdown (stills scores belong to
  class workers). Light measure/islands/meshopt
  CLEAN (`out/w105/light/verify/`); designer CLEAN;
  `[NO BROWSER COVERAGE]`. Heavy measure/islands
  CLEAN (`out/w105/heavy/verify/`); designer CLEAN;
  `[NO BROWSER COVERAGE]`.
  FILES: `docs/Bio07BodiesDesign.md`,
  `scripts/ship_builders/beautiful/light.py`,
  `scripts/ship_builders/beautiful/heavy.py`,
  `assets-source/ships/beautiful/light.blend*`,
  `assets-source/ships/beautiful/heavy.blend*`,
  `public/assets/ships/beautiful/light/**`,
  `public/assets/ships/beautiful/heavy/**`,
  `out/w105/`.
- Wave 106 (2026-08-24): BIO-07 remaining four
  Beautiful NPC class bodies + shared foundation
  rewrite + bake. Foundation (`surface.py` /
  `anatomy.py` / `organs.py`): four body plans
  (shark / squid / octopus / whale), grown lofts,
  no restored flipper API. Ace hunting squid;
  cutter shark (not a scaled light); frigate
  octopus travel pose; freighter blue-whale
  gardenback. Light/heavy rebaked against the
  new primitives. Player `makeLivingHull`
  untouched. `state.js` READ-ONLY. No new SKU.
  OPEN: BIO-06 cadence serial. REP-05 Digit 9
  copy. Anatomy-native gait later.
  CLOSED by Wave 107: cadence + Digit 9 copy +
  BIO-08 gait brief.
  VERIFY: bake3 measure ALL PASS; islands ONE
  CONNECTED BODY on all six; `py_compile` exit 0;
  silhouettes six distinct animals
  (`out/w106/bake3/verify/report.md` CLEAN).
  FILES: `scripts/ship_builders/beautiful/**`,
  `assets-source/ships/beautiful/**`,
  `public/assets/ships/beautiful/**`,
  `out/silhouettes/beautiful-*.png`, `out/w106/`.
- Wave 107 (2026-08-24): BIO-06 cadence first
  impl + REP-05 Digit 9 copy + BIO-08 gait brief.
  Cadence: THREE-free `src/game/living-cadence.js`
  table (light 1.00/1.00 … freighter 0.30/2.00);
  player light idle 0.5 / cruise 2.3 bit-identical;
  larger living remounts scale Hz + flap sweep;
  Beautiful NPC `uSwimSweep` + class-cruise
  speed-norm; mixer `timeScale` untouched; no
  persist key; Digit 0 shipyard. Digit 9 LIVE
  CONSEQUENCES copies `Leave this space.` /
  `Patrol covering.` / `No passage.` from live
  LINE constants. BIO-08 markdown
  (`docs/Bio08LocomotionDesign.md`): anatomy-native
  gait later; fail-closed live spine+flap; do not
  retune `LIVING_CADENCE`. Kit mutate still omit.
  OPEN: BIO-08 gait serial (later). Owner may
  override cadence floats / Digit 9 wrap after
  playtest.
  CLOSED by Wave 108: BIO-08 gait first impl.
  VERIFY: `out/w107/bio06/probe.mjs` PASS;
  WAVE107 BIO-06 pins all true (`npm run test:boot`
  still FAIL on pre-existing WAVE26); live hub
  CLEAN, heavier-class flap Hz
  `[NO BROWSER COVERAGE]`; designer CLEAN.
  Digit 9 live stills CLEAN
  (`out/w107/rep05/verify/`); designer CLEAN.
  BIO-08 verifier CLEAN; designer CLEAN.
  FILES: `src/game/living-cadence.js`,
  `src/systems/ship.js`, `src/systems/ship-assets.js`,
  `src/systems/station.js`, `scripts/boot-test.mjs`,
  `docs/Bio06CadenceDesign.md`,
  `docs/Rep05ConsequencesDesign.md`,
  `docs/Bio08LocomotionDesign.md`, `out/w107/`.
- Wave 108 (2026-08-24): BIO-08 gait first
  impl + MSN-03 remaining unique SKU brief +
  PHY-04 remaining NPC avoid brief.
  Gait: THREE-free `src/game/living-gait.js`;
  player light CPU unweighted (idle 0.5 /
  cruise 2.3 honor); other living remounts
  axis mix; Beautiful NPC four gait uniforms
  on one shader (`rimward-beautiful-swim-gait`);
  do not retune `LIVING_CADENCE`; no persist
  key; Digit 0 shipyard. MSN-03 markdown
  (`docs/Msn03UniqueSkuDesign.md`): Veridian
  `auto`, Hollow `dart`, `canSeat` fail-closed
  +2 UU. PHY-04 markdown
  (`docs/Phy04AvoidDesign.md`): fail-closed
  live 40 u bias; later two-sample steer;
  no navmesh. Kit mutate still omit.
  OPEN: MSN-03 unique SKU serial (later).
  PHY-04 avoid serial (later). Owner may
  override gait floats / Veridian `auto` /
  Hollow `dart` / mid-sample after playtest.
  CLOSED by Wave 109: MSN-03 unique SKU
  first impl + PHY-04 two-sample avoid.
  VERIFY: `out/w108/bio08/probe.mjs` PASS;
  WAVE108 BIO-08 pins all true (`npm run
  test:boot` still FAIL on pre-existing
  WAVE26); live hub + Digit 0 shipyard
  CLEAN; heavier-class flap axis
  `[NO BROWSER COVERAGE]`; designer CLEAN.
  MSN-03 verifier CLEAN; designer CLEAN.
  PHY-04 verifier CLEAN after mermaid
  recheck; designer CLEAN.
  FILES: `src/game/living-gait.js`,
  `src/systems/ship.js`, `src/systems/ship-assets.js`,
  `scripts/boot-test.mjs`,
  `docs/Bio08LocomotionDesign.md`,
  `docs/Msn03UniqueSkuDesign.md`,
  `docs/Phy04AvoidDesign.md`, `out/w108/`.
- Wave 109 (2026-08-24): MSN-03 unique SKU
  first impl + PHY-04 two-sample avoid +
  PHY-05 patrol pad-home brief.
  SKU: Veridian last-step seats `auto`;
  Hollow seats empty `dart`; `canSeat`
  false → credits +2 UU; Digit 2 catalog
  name hint; no shop 6500/4200; no third
  SKU id; no persist key; Digit 0 shipyard.
  WAVE83 last-step pins retuned
  (`lastVeridianAuto` / `lastHollowDart`).
  Avoid: mid-chord probe at 20 u for
  non-station kinds; live 40 / 1.4 honor;
  frame hold retarget when dest punches
  D5; no `record.route` write; no navmesh;
  PR3 80 u skipped. PHY-05 markdown
  (`docs/Phy05PadHomeDesign.md`): persist
  heal of pad-center patrol homes later.
  Kit mutate still omit.
  OPEN: PHY-05 pad-home serial (later).
  Owner may override Veridian `auto` /
  Hollow `dart` / mid-sample after playtest.
  CLOSED by Wave 110: PHY-05 pad-home
  first impl.
  VERIFY: `out/w109/msn03sku/probe.mjs`
  PASS; WAVE83 STATION + WAVE109 MSN pins
  all true (`npm run test:boot` still FAIL
  on pre-existing WAVE26); live Digit 2 /
  Digit 0 / empty hub CLEAN; designer
  CLEAN. PHY-04 probe + kernel-pins CLEAN;
  live traffic `[NO BROWSER COVERAGE]`.
  PHY-05 verifier CLEAN; designer CLEAN.
  FILES: `src/game/jobs-chains.js`,
  `src/systems/station.js`,
  `src/systems/npc.js`,
  `scripts/boot-test.mjs`,
  `out/phy-verify/kernel-pins.mjs`,
  `docs/Msn03UniqueSkuDesign.md`,
  `docs/Phy04AvoidDesign.md`,
  `docs/Phy05PadHomeDesign.md`, `out/w109/`.
- Wave 110 (2026-08-24): PHY-05 pad-home
  first impl + REP-03 remaining remedial
  brief + FX-01 remaining punch brief.
  Pad-home: patrol `route[0]` is a heavy
  hold outside D5; `healPadHome` roles
  trader/miner/patrol; `holdClassFor`
  patrol known class else `heavy`;
  rebuild/tick heal; no new persist key;
  no navmesh; PHY-04 `applyAvoidBias`
  untouched. `out/w58` / `out/w59`
  leftover pins inverted to hold-off-pad.
  REP-03 markdown
  (`docs/Rep03RemedialDesign.md`): Digit 9
  copy of live +2 job climb after
  restitution-to-0; no new kind; no
  wanted meter. FX-01 markdown
  (`docs/Fx01RemainingDesign.md`): hull-
  local shield ripple later; recoil/marks
  LIVE consume. Kit mutate still omit.
  OPEN: REP-03 Digit 9 copy serial
  (later). FX-01 hull-local ripple serial
  (later). Owner may override pad-home
  hold class / climb copy / ripple parent
  after playtest.
  CLOSED by Wave 111: REP-03 Digit 9
  climb copy + FX-01 hull-local ripple.
  VERIFY: `out/w110/padhome/probe.mjs`
  PASS; WAVE110 pins all true (`npm run
  test:boot` still FAIL on pre-existing
  WAVE26); live Digit 0 / empty hub CLEAN;
  patrol spawn after save/load
  `[NO BROWSER COVERAGE]`; designer CLEAN.
  REP-03 verifier CLEAN; designer CLEAN.
  FX-01 verifier CLEAN; designer CLEAN.
  FILES: `src/game/world.js`,
  `scripts/boot-test.mjs`,
  `out/w58/routes/probe.mjs`,
  `out/w58/routes/verifier.mjs`,
  `out/w59/routes/verifier.mjs`,
  `docs/Phy05PadHomeDesign.md`,
  `docs/Rep03RemedialDesign.md`,
  `docs/Fx01RemainingDesign.md`, `out/w110/`.
- Wave 111 (2026-08-24): REP-03 Digit 9
  climb copy first impl + FX-01 hull-local
  shield ripple first impl + HUD-02
  remaining class-silhouette brief.
  Digit 9: `standingRemedialNotes` under
  HOW STANDING MOVES names live +2
  families after restitution-to-0; climb
  stays at standing ≥ 0; fail-closed keep
  Pay restitution + move/live notes; no
  new kind; no wanted meter; no Digit
  steal; no `state.js` write. Ripple:
  parent `RIPPLE_POOL` ring to finite
  host via `worldHitToLocal`; FP player
  host stays world-space; park on
  destroy/load/orphan; unshielded
  sparks+marks stay; recoil/marks/shake
  consume; pool 16 / mark pool 12 honor.
  HUD-02 markdown
  (`docs/Hud02RemainingSilhouettesDesign.md`):
  later `data-class-key` on existing
  facing chrome; fail-closed generic bio;
  leftover real (hud.js never reads
  `classKey`). Kit mutate still omit.
  OPEN: HUD-02 class-silhouette serial
  (later). Owner may override climb copy
  / ripple parent / class tokens after
  playtest.
  VERIFY: `out/w111/rep03/probe.mjs`
  PASS; WAVE111 REP-03 pins all true
  (`npm run test:boot` still FAIL on
  pre-existing WAVE26); live Digit 9
  below 0 / at 0 / Digit 0 / Digit 2 /
  empty hub CLEAN; designer CLEAN.
  FX-01 probe PASS; live fire
  `[NO BROWSER COVERAGE]`; designer
  CLEAN. HUD-02 verifier CLEAN;
  designer CLEAN.
  FILES: `src/systems/station.js`,
  `src/systems/combat.js`,
  `scripts/boot-test.mjs`,
  `docs/Rep03RemedialDesign.md`,
  `docs/Fx01RemainingDesign.md`,
  `docs/Hud02RemainingSilhouettesDesign.md`,
  `out/w111/`.
- Wave 112 (2026-08-24): owner deputize of the
  eleven wishlist grooming questions. Markdown
  only (`docs/OwnerDecisionsWave112.md`). Live
  knobs consume: no new `WEAPONS` id; no mount
  power ledger; scanner gates the contacts arc
  only; six class catalogs; keep yard UU / 600 s
  / impact 0.35; mining first-slice DONE; seeds
  are hangar hulls; ungraft forbidden; Gilded
  Digit 7 trafficking only. No `src/`.
  OPEN: HUD-02 class-silhouette serial (later).
  Owner may override after playtest.
  CLOSED by Wave 113: HUD-02 living
  class tokens first impl.
  FILES: `docs/OwnerDecisionsWave112.md`,
  `docs/PLAYER-EXPERIENCE-WISHLIST.md`.
- Wave 113 (2026-08-24): HUD-02 living
  class-token first impl + HUD-02 remaining
  plated silhouette brief + FX remaining
  scrape punch brief.
  Living: allowlisted `#hud[data-class-key]`
  on bio family from mounted `classKey`;
  authored 22×10 clips; light keeps live
  organism; unknown / mech omit; no hub
  child; no `state.js` write; no persist
  key; Digit 0 shipyard. WAVE113 pins
  read `dataset` like WAVE62.
  HUD-02 markdown
  (`docs/Hud02RemainingMechSilhouettesDesign.md`):
  later plated tokens inside 22×10;
  heavy 16×8 ≠ freighter 18×8; fail-closed
  live family facing. FX scrape markdown
  (`docs/Fx01RemainingScrapeDesign.md`):
  later `spawnHitFx` on damaging `bodyHit`;
  IMPACT 8 / 0.35 consume; flash map / 80 u
  stay skippable. Kit mutate still omit.
  OPEN: HUD-02 plated class-silhouette
  serial (later). FX scrape punch serial
  (later). Owner may override clip px /
  plate budgets / scrape host after
  playtest.
  CLOSED by Wave 114: plated class
  tokens first impl + scrape punch
  first impl.
  VERIFY: `out/w113/hud02/probe.mjs` PASS;
  WAVE113 HUD-02 pins all true (`npm run
  test:boot` still FAIL on pre-existing
  WAVE26); live light / heavy / built /
  Digit 0 / empty hub CLEAN; designer
  CLEAN. HUD-02 mech verifier CLEAN;
  designer CLEAN. FX scrape verifier
  CLEAN; designer CLEAN.
  FILES: `src/systems/hud.js`,
  `src/ui/hud.css`,
  `scripts/boot-test.mjs`,
  `docs/Hud02RemainingSilhouettesDesign.md`,
  `docs/Hud02RemainingMechSilhouettesDesign.md`,
  `docs/Fx01RemainingScrapeDesign.md`,
  `out/w113/`.
- Wave 114 (2026-08-24): HUD-02 plated
  class-token first impl + FX scrape
  punch first impl + FX muzzle leftover
  CONSUME.
  Plated: extend live `classKeyToken`
  for mech and bio (one writer);
  authored `#hud[data-family="mech"]`
  `[data-class-key]` plates in 22×10;
  light keeps generic plate; heavy
  16×8 ≠ freighter 18×8; unknown omit;
  no hub child; no `state.js` write;
  no persist key; Digit 0 shipyard.
  WAVE114 pins read `dataset` like
  WAVE62. WAVE113 leftover census keys
  `mechOmit` / `noMechClass` retuned to
  `mechTok` / `hasMechClass`.
  Scrape: damaging `bodyHit` applyHit
  calls live `spawnHitFx`; shielded
  sample before applyHit; try/catch
  skips world FX only; park on destroy;
  IMPACT 8 / 0.35 consume; bounce
  consume; WAVE111 parent call-only.
  Muzzle markdown
  (`docs/Fx01RemainingMuzzleDesign.md`):
  leftover CONSUME — live `spawnMuzzle`,
  bolt glow, mining lance already punch;
  no fire-side PR1. Kit mutate still
  omit. Flash map / 80 u stay skippable.
  OPEN: none named. Owner may override
  plate px / scrape host after playtest.
  CLOSED by Wave 115: leftover census
  (HUD-02 target facing leftover +
  HUD-03 visual CONSUME + SHP catalog
  CONSUME).
  VERIFY: `out/w114/hud02mech/probe.mjs`
  PASS; WAVE114 HUD-02 pins all true
  (`npm run test:boot` still FAIL on
  pre-existing WAVE26); live plated
  light / heavy / freighter / bio /
  Digit 0 / empty hub CLEAN; designer
  CLEAN. FX scrape probe PASS; live ram
  `[NO BROWSER COVERAGE]`; designer
  CLEAN. FX muzzle verifier CLEAN;
  designer CLEAN.
  FILES: `src/systems/hud.js`,
  `src/ui/hud.css`,
  `src/systems/combat.js`,
  `scripts/boot-test.mjs`,
  `docs/Hud02RemainingMechSilhouettesDesign.md`,
  `docs/Fx01RemainingScrapeDesign.md`,
  `docs/Fx01RemainingMuzzleDesign.md`,
  `out/w114/`.
- Wave 115 (2026-08-24): leftover census
  after Wave 114 OPEN none. Markdown
  only. No `src/`.
  HUD-02 remaining TARGET class
  tokens (`docs/Hud02RemainingTargetSilhouettesDesign.md`):
  leftover REAL. `classKeyToken` is
  player-only; unscoped `#hud[data-class-key]`
  restyles both rails; `tgtFacing`
  already exists. Later PR1 scopes
  player CSS to `.rw-combat-self` and
  writes allowlisted `data-class-key`
  on `.rw-combat-target` from visible
  lock class. Fail-closed omit.
  Q-ship uses cover class. Do not put
  lock class on `#hud`.
  HUD-03 remaining visual
  (`docs/Hud03RemainingVisualDesign.md`):
  leftover CONSUME. KeyO already has
  scale / contrast / color-blind /
  reduced-motion. Both families inherit
  `body.rw-*`. Wave 103 `hudAlerts`
  consume. Named serial none.
  SHP remaining catalog
  (`docs/ShpRemainingCatalogDesign.md`):
  leftover CONSUME. Live `CORE_STOCK`
  and `LIVING_STOCK` both include
  `frigate`. Wishlist SHP-01 omit is
  stale vs Wave 94. No seventh class.
  Named serial none. Digit 0 shipyard.
  Kit mutate still omit. Flash map /
  80 u stay skippable. Aim-glass gauges
  stay off.
  OPEN: HUD-02 target-facing class
  token serial (later). Owner may
  override rail writer / cover class
  after playtest.
  VERIFY: HUD-02 target verifier CLEAN
  (`out/w115/hud02tgt/verify/`); designer
  CLEAN. HUD-03 visual verifier CLEAN
  (`out/w115/hud03vis/verify/`); designer
  CLEAN. SHP catalog verifier CLEAN
  (`out/w115/shp/verify/`); designer
  CLEAN.
  FILES: `docs/Hud02RemainingTargetSilhouettesDesign.md`,
  `docs/Hud03RemainingVisualDesign.md`,
  `docs/ShpRemainingCatalogDesign.md`,
  `out/w115/`.
- Wave 116 (2026-08-24): leftover HUD-02 target
  class tokens first impl + two inbox P0
  briefs. HUD-02 PR1
  (`docs/Hud02RemainingTargetSilhouettesDesign.md`):
  player CSS scoped to `.rw-combat-self`;
  allowlisted `data-class-key` on
  `.rw-combat-target` from visible lock
  class; Q-ship cover class; fail-closed
  omit. WAVE113/114 pin hygiene.
  NAV-05 remaining AP handoff brief
  (`docs/Nav05HandoffDesign.md`): leftover
  REAL. Collapsed `missingGate` English;
  hub-zone cancel; no live multi-hop
  `systemLoaded` pin. Later PR1
  `autopilot.js` + `gate.js` +
  `galaxychart.js` `showApLive` on fly
  cancel while the chart is open. Chart
  does not close on engage. No teleport.
  CTL-01 remaining dock/jump bind brief
  (`docs/Ctl01DockBindDesign.md`): leftover
  REAL. `KeyD` dual-bind live. Later PR1
  deputize **KeyJ**; keep `dockPressed`;
  AP `wantJump` independent. Kit mutate
  still omit. Aim-glass gauges stay off.
  OPEN: NAV-05 PR1; CTL-01 PR1. Overlay
  stack / toast flood / chart labels /
  chart-close-on-AP stay inbox.
  CLOSED by Wave 117: NAV-05 PR1 +
  CTL-01 PR1 + overlay leftover census.
  VERIFY: HUD-02 live Playwright CLEAN
  (`out/w116/hud02tgt/verify/`); designer
  CLEAN. NAV-05 verifier CLEAN
  (`out/w116/nav05/verify/`); designer
  Major closed in freeze. CTL-01
  verifier CLEAN (`out/w116/ctl01/verify/`);
  designer CLEAN. `npm run test:boot`
  still FAIL on pre-existing WAVE26.
  FILES: `src/systems/hud.js`,
  `src/ui/hud.css`,
  `scripts/boot-test.mjs`,
  `docs/Hud02RemainingTargetSilhouettesDesign.md`,
  `docs/Nav05HandoffDesign.md`,
  `docs/Ctl01DockBindDesign.md`,
  `out/w116/`.
- Wave 117 (2026-08-24): leftover NAV-05
  AP handoff first impl + CTL-01 KeyJ
  first impl + P1 overlay leftover
  census. NAV-05 PR1
  (`docs/Nav05HandoffDesign.md`): nearer
  hub does not cancel a physical ring;
  hub cycle/wrap hub-only; split
  `AP_LINES`; `gate.js` sole emit;
  `#rw-galaxy-ap-live` on fly cancel
  while the chart is open. Chart does
  not close on engage. No teleport.
  CTL-01 PR1
  (`docs/Ctl01DockBindDesign.md`): KeyJ
  sets `pendingDock`; KeyD strafe only;
  keep `dockPressed`; AP `wantJump`
  independent; WAVE21 jump pins KeyJ;
  WAVE6 `'J — dock'`. Overlay leftover
  brief (`docs/Ctl02OverlayDesign.md`):
  leftover REAL. Hail / chart / berth
  still stack. `openCard` ignores calm.
  Later PR1 overlay-priority. Kit mutate
  still omit. Aim-glass gauges stay off.
  OPEN: overlay PR1. Toast flood /
  chart labels / chart-close-on-AP stay
  inbox.
  CLOSED by Wave 118: overlay PR1 +
  toast leftover census + chart-close
  leftover census.
  VERIFY: NAV-05 probe PASS; live
  Playwright CLEAN
  (`out/w117/nav05/verify/`); designer
  CLEAN (Minor: live region has no
  `aria-label`). CTL-01 probe PASS; live
  Playwright CLEAN
  (`out/w117/ctl01/verify/`); designer
  CLEAN. Overlay verifier CLEAN
  (`out/w117/overlay/verify/`); designer
  CLEAN. `npm run test:boot` still FAIL
  on pre-existing WAVE26.
  FILES: `src/game/autopilot.js`,
  `src/systems/gate.js`,
  `src/systems/galaxychart.js`,
  `src/systems/controls.js`,
  `src/core/ctx.js`,
  `src/systems/hud.js`,
  `src/game/onboarding.js`,
  `scripts/boot-test.mjs`,
  `docs/Nav05HandoffDesign.md`,
  `docs/Ctl01DockBindDesign.md`,
  `docs/Ctl02OverlayDesign.md`,
  `out/w117/`.
- Wave 118 (2026-08-25): leftover CTL-02
  overlay-priority first impl + P1
  toast-flood leftover census + P2
  chart-close-on-AP leftover census.
  Overlay PR1
  (`docs/Ctl02OverlayDesign.md`): mutex
  hail/chart/berth; defer incoming hail
  (skip `openCard` only); salvage
  `letGo` +30 s calm; `openCard`/KeyH
  calm gate; helper
  `overlay-policy.js`; session
  `hailOpen`/`berthOpen`; chart open-gate
  only; hail Digit skip under pause /
  settings / title / models; never pause
  those three. `showApLive` unchanged.
  Chart stays open on AP engage.
  Toast leftover brief
  (`docs/Hud04ToastFloodDesign.md`):
  leftover REAL. Later PR1 toast-flood:
  five-row key linger 8 s; AUTOSAVE HELD
  vs SAVE BLOCKED; expire `aria-hidden`.
  Chart-close leftover brief
  (`docs/Nav06ChartCloseDesign.md`):
  leftover REAL. Later PR1
  chart-close-on-AP: Autopilot **button**
  success `setOpen(false)` + blur /
  HUD Cancel focus. Kit mutate still
  omit. Aim-glass gauges stay off.
  OPEN: toast PR1; chart-close PR1.
  Chart-label a11y stays inbox.
  VERIFY: overlay WAVE118 pins all true
  including `digitSkipUnderPause`; live
  Playwright CLEAN
  (`out/w118/overlay/verify/`); designer
  CLEAN. Toast verifier CLEAN
  (`out/w118/toast/verify/`); designer
  CLEAN. Chart-close verifier CLEAN
  (`out/w118/chartclose/verify/`);
  designer CLEAN. `npm run test:boot`
  still FAIL on pre-existing WAVE26.
  FILES: `src/systems/overlay-policy.js`,
  `src/systems/hail.js`,
  `src/game/save.js`,
  `src/systems/galaxychart.js`,
  `src/core/ctx.js`,
  `scripts/boot-test.mjs`,
  `docs/Ctl02OverlayDesign.md`,
  `docs/Hud04ToastFloodDesign.md`,
  `docs/Nav06ChartCloseDesign.md`,
  `out/w118/`.
- Wave 119 (2026-08-25): orchestrator
  boot-fail closeout. Owner asked to
  fix boot failures (not as a side
  effect of another serial). WAVE26
  unique ferry: offered/accepted unique
  four stay on Digit 2; unique DONE
  still hides (persist keep, no splice);
  `keepUniqueJobRows` keeps unique-four
  identity across sanitize/prune;
  WAVE26 re-finds live ferry and haul
  after dest payout. NPC UPDATE ERR:
  `shipClassOf` / `classCruise` /
  `classBurn` fail-closed; unknown
  `classKey` does not throw on
  `speedCap` / `updateDuel` /
  `updateFlee`; `ctx.ships` walks skip
  null holes. WAVE83 missiles:
  harness snapshots `Incoming dart.`
  at capture (`dartToastText`); HUD
  expire/recycle unchanged. Digit 2/0/8/9
  stay. HUD-01 empty hub. No
  `innerHTML`. No new `WORLD_FIELDS`.
  `state.js` READ-ONLY. Kit mutate
  still omit. Aim-glass gauges stay
  off. OPEN: toast PR1; chart-close
  PR1 (Wave 118 leftover). Chart-label
  a11y stays inbox.
  CLOSED by Wave 120: toast PR1 +
  chart-close PR1 + chart-label leftover
  census.
  VERIFY: designer CLEAN
  (`out/w-boot-fix2/wave26/designer-audit.md`).
  NPC probes CLEAN
  (`out/w-boot-fix2/update-err/verify/report-4.md`).
  `npm run test:boot` BOOT TEST PASS
  (`out/w-boot-fix2/wave83/verify/boot-test.log`).
  FILES: `src/systems/station.js`,
  `src/systems/npc.js`,
  `scripts/boot-test.mjs`,
  `out/w-boot-fix2/`.
- Wave 120 (2026-08-25): leftover HUD-04
  toast-flood first impl + leftover
  NAV-06 chart-close-on-AP first impl +
  P2 chart-label leftover census.
  Toast PR1
  (`docs/Hud04ToastFloodDesign.md`):
  8 s identical-key window; five-row
  linger ring independent of chips;
  expire `aria-hidden`; real-show unhide
  then `textContent`; AUTOSAVE HELD vs
  SAVE BLOCKED; `save.js` emit `source`
  tag only. Overlay mutex / hail /
  `showApLive` / KeyJ untouched.
  Chart-close PR1
  (`docs/Nav06ChartCloseDesign.md`):
  Autopilot **button** success real
  `setOpen(false)` + blur / prefer HUD
  Cancel; refuse and cancel stay open;
  direct `tryEngage` still does not
  close; WAVE117 `chartEngageStay`
  retuned to the button path;
  `chartStayOpen` still true on direct
  engage. Overlay hail flush still
  runs. No pause. No jump emit.
  Chart-label leftover brief
  (`docs/Nav07ChartLabelDesign.md`):
  leftover REAL. Later PR1 chart-label:
  labels share plot path; label box
  enlarges target; named dest
  `<select>` under desc; existing KeyM
  close skips `isTypingFocus()` (not a
  remap). Kit mutate still omit.
  Aim-glass gauges stay off.
  OPEN: chart-label PR1.
  CLOSED by Wave 121: chart-label PR1
  + EXP dock leftover CONSUME + HUD
  remaining feedback leftover CONSUME.
  VERIFY: toast probe PASS
  (`out/w120/toast/verify/`); designer
  CLEAN. Chart-close live Playwright
  CLEAN (`out/w120/chartclose/verify/`);
  designer CLEAN. Chart-label verifier
  CLEAN (`out/w120/chartlabel/verify/`);
  designer CLEAN after KeyM freeze.
  `npm run test:boot` BOOT TEST PASS.
  FILES: `src/systems/hud.js`,
  `src/game/save.js`, `src/ui/hud.css`,
  `src/systems/galaxychart.js`,
  `scripts/boot-test.mjs`,
  `docs/Hud04ToastFloodDesign.md`,
  `docs/Nav06ChartCloseDesign.md`,
  `docs/Nav07ChartLabelDesign.md`,
  `out/w120/`.
- Wave 121 (2026-08-25): leftover NAV-07
  chart-label first impl + EXP remaining
  Unknowables dock leftover census + HUD
  remaining feedback leftover census.
  Chart-label PR1
  (`docs/Nav07ChartLabelDesign.md`):
  labels share `activateSystem` with
  discs; dest `<select id="rw-galaxy-dest">`
  under desc; existing KeyM close skips
  `isTypingFocus()`; hover inspects only;
  `showApLive` and Autopilot success close
  untouched. EXP leftover
  (`docs/Exp04RemainingDockDesign.md`):
  CONSUME. Named serial none. Live `veil`
  / The Quiet / Archive 400/900. HUD leftover
  (`docs/Hud05RemainingFeedbackDesign.md`):
  CONSUME. Named serial none. Toast linger
  is the flood channel. Kit mutate still
  omit. Aim-glass gauges stay off.
  OPEN: none named.
  CLOSED by Wave 122: leftover census
  (remaining NAV CONSUME + remaining
  TGT CONSUME + remaining REP CONSUME).
  VERIFY: chart-label probe PASS
  (`out/w121/chartlabel/verify/`); live
  Playwright CLEAN on Vite 5175; designer
  CLEAN. EXP verifier CLEAN
  (`out/w121/expdock/verify/`); designer
  CLEAN. HUD leftover verifier CLEAN
  (`out/w121/hudrest/verify/`); designer
  CLEAN. `npm run test:boot` FAIL 1 error:
  REDMARCH `castMatches` false (traffic
  cast). Chart-label write-set does not
  include traffic/npc. WAVE118 overlay
  pins all true. wave21 `keyMCloses`
  still true.
  FILES: `src/systems/galaxychart.js`,
  `src/ui/hud.css`,
  `docs/Nav07ChartLabelDesign.md`,
  `docs/Exp04RemainingDockDesign.md`,
  `docs/Hud05RemainingFeedbackDesign.md`,
  `out/w121/`.
- Wave 122 (2026-08-25): leftover census
  after Wave 121 OPEN none. Markdown
  only. No `src/`.
  Remaining NAV
  (`docs/Nav08RemainingNavDesign.md`):
  leftover CONSUME. Named serial none.
  NAV-01..07 live. Wishlist NAV-03
  handoff “impl later” is stale vs
  Wave 117.
  Remaining TGT
  (`docs/Tgt06RemainingTgtDesign.md`):
  leftover CONSUME. Named serial none.
  TGT-01..05 live. PPI / aim-glass /
  incoming gauge stay omit.
  Remaining REP
  (`docs/Rep06RemainingRepDesign.md`):
  leftover CONSUME. Named serial none.
  Digit 9 / kill −5 / restitution 1200 /
  leave / covering / inbound refuse /
  spy-war −2 live. Patrol spawn is not
  Freehold-only. Compact job +5 is
  unique-four honesty, not PR1.
  Kit mutate still omit. Aim-glass
  gauges stay off.
  OPEN: none named.
  CLOSED by Wave 123: leftover census
  (remaining PHY CONSUME + remaining
  AST CONSUME + remaining FX CONSUME).
  VERIFY: NAV leftover verifier CLEAN
  (`out/w122/navrest/verify/`); designer
  CLEAN. TGT leftover verifier CLEAN
  (`out/w122/tgtrest/verify/`); designer
  CLEAN. REP leftover verifier CLEAN
  (`out/w122/represt/verify/`); designer
  CLEAN. No `src/` this wave. Known
  REDMARCH `castMatches` flake is not
  this write-set.
  FILES: `docs/Nav08RemainingNavDesign.md`,
  `docs/Tgt06RemainingTgtDesign.md`,
  `docs/Rep06RemainingRepDesign.md`,
  `out/w122/`.
- Wave 123 (2026-08-25): leftover census
  after Wave 122 OPEN none. Markdown
  only. No `src/`.
  Remaining PHY
  (`docs/Phy06RemainingPhyDesign.md`):
  leftover CONSUME. Named serial none.
  PHY-01 bounce/slide live. PHY-02
  keep-out + two-sample 20 u mid +
  frame hold live. PHY-03 sun heat/kill
  live. PHY-05 patrol heavy pad-home
  heal live. PHY-04 80 u skippable.
  Remaining AST
  (`docs/Ast03RemainingAstDesign.md`):
  leftover CONSUME. Named serial none.
  Kepler-lite belts / work sector /
  `fieldOre` / group-3 cue live. Rock
  MATCH rest-frame + MATCH lamp live.
  `id === index` stays.
  Remaining FX
  (`docs/Fx02RemainingFxDesign.md`):
  leftover CONSUME. Named serial none.
  Wave 54 first pass live. Recoil +
  marks live. Hull-local ripple live.
  Scrape `spawnHitFx` live. Muzzle
  leftover stays CONSUME.
  Kit mutate still omit. Aim-glass
  gauges stay off.
  OPEN: none named.
  CLOSED by Wave 124: playtest inbox
  briefs (CTL-03 berth hold + AI-05
  starter grace + CTL-04 menu digits).
  VERIFY: PHY leftover verifier CLEAN
  (`out/w123/phyrest/verify/`); designer
  CLEAN. AST leftover verifier CLEAN
  (`out/w123/astrest/verify/`); designer
  CLEAN. FX leftover verifier CLEAN
  (`out/w123/fxrest/verify/`); designer
  CLEAN. No `src/` this wave. Known
  REDMARCH `castMatches` flake is not
  this write-set.
  FILES: `docs/Phy06RemainingPhyDesign.md`,
  `docs/Ast03RemainingAstDesign.md`,
  `docs/Fx02RemainingFxDesign.md`,
  `out/w123/`.
- Wave 124 (2026-08-25): playtest inbox
  briefs after Wave 123 OPEN none.
  Markdown only. No `src/`.
  CTL-03 Berth freeze
  (`docs/Ctl03BerthFreezeDesign.md`):
  leftover REAL. Named serial PR1.
  Session `berthHold` is not KeyP.
  LOAD stays possible. Interrupt desk
  stays; SAVE/LOAD stay; RESUME below
  slots. Hail/chart still do not pause.
  AI-05 starter grace
  (`docs/Ai05StarterGraceDesign.md`):
  leftover REAL. Named serial PR1.
  Hop 60 s stays. Greenhand/Beautiful
  extra 180 s in start system. Marked /
  ledgerDebt / drifter 0 extra. Death
  calm 90 s + re-roll cold. Dresk not
  cancelled. Home-berth bubble PR2.
  CTL-04 menu digits
  (`docs/Ctl04MenuInputDesign.md`):
  leftover REAL. Named serial PR1.
  Later write-set `controls.js` only.
  Digit1–5 skip while docked / overlay
  owns digits. Digit 0/8/9 stay station.
  In-flight 1–5 stay WPN. `fireHeld`
  docked skip is PR2.
  Kit mutate still omit. Aim-glass
  gauges stay off.
  OPEN: CTL-03 PR1; AI-05 PR1;
  CTL-04 PR1.
  CLOSED by Wave 125: CTL-03 PR1
  + AI-05 PR1 + CTL-04 PR1.
  VERIFY: berth freeze verifier CLEAN
  (`out/w124/berthfreeze/verify/`);
  designer CLEAN after remainder lock.
  Starter grace verifier CLEAN
  (`out/w124/startergrace/verify/`);
  designer CLEAN. Menu input verifier
  CLEAN (`out/w124/menuinput/verify/`);
  designer CLEAN. No `src/` this wave.
  Known REDMARCH `castMatches` flake
  is not this write-set.
  FILES: `docs/Ctl03BerthFreezeDesign.md`,
  `docs/Ai05StarterGraceDesign.md`,
  `docs/Ctl04MenuInputDesign.md`,
  `out/w124/`.
- Wave 125 (2026-08-25): first impl of Wave 124
  OPEN serials. Src + named boot pins.
  CTL-03 PR1 berth hold
  (`docs/Ctl03BerthFreezeDesign.md`):
  session `ctx.flags.berthHold` is not KeyP.
  Readers freeze player flight, AP steer
  (helm skip like chart), gate emit, jump
  charge, sun/NPC DPS vs player. Distant
  traffic keeps. Interrupt keeps SAVE/LOAD
  + named RESUME below slots. LOAD clears
  hold same click. Hint names hold, not Pause.
  AI-05 PR1 starter grace
  (`docs/Ai05StarterGraceDesign.md`):
  Greenhand/Beautiful extra 180 s in start
  system. Marked / ledgerDebt / drifter 0
  extra. Hop 60 s stays. Death remaining
  90 s of dt (not absolute world.time).
  Huge hop fail-closes. Dresk extra bypass;
  hop + death honor. Scratch still acquires
  that hull. Named boot pin
  `expireSessionDeathCalm` + `world.time`
  180 TEST SETUP on demand/ace legs.
  CTL-04 PR1 menu digits
  (`docs/Ctl04MenuInputDesign.md`):
  Digit1–5 skip `weaponGroup` while docked /
  hail / overlay owns digits. Open space
  1–5 stay WPN. Digit 0/8/9 stay station.
  `fireHeld` docked skip still PR2.
  Kit mutate still omit. Aim-glass
  gauges stay off.
  OPEN: CTL-03 PR2 stills optional;
  AI-05 PR2 home-berth bubble optional;
  CTL-04 PR2 fireHeld optional.
  CLOSED by Wave 126: playtest inbox
  briefs (Agent API + Hail01 demand +
  HUD-06 home marker).
  VERIFY: berth hold live Playwright CLEAN
  (`out/w125/berthfreeze/verify/`); designer
  CLEAN. Starter-grace node probe CLEAN
  (`out/w125/startergrace/verify/`); no chrome.
  Menu-digit live Playwright CLEAN
  (`out/w125/menuinput/verify/`); designer
  CLEAN. `npm run test:boot` BOOT TEST PASS
  (`out/w125/boot-test-pass.log`).
  FILES: `src/core/ctx.js`,
  `src/game/save.js`,
  `src/systems/overlay-policy.js`,
  `src/systems/ship.js`,
  `src/systems/combat.js`,
  `src/systems/gate.js`,
  `src/game/jump.js`,
  `src/game/autopilot.js`,
  `src/main.js`,
  `src/systems/npc.js`,
  `src/systems/controls.js`,
  `scripts/boot-test.mjs`,
  `docs/Ctl03BerthFreezeDesign.md`,
  `docs/Ai05StarterGraceDesign.md`,
  `docs/Ctl04MenuInputDesign.md`,
  `out/w125/`.
- Wave 126 (2026-08-26): playtest inbox
  briefs after Wave 125 OPEN optional
  PR2s (not stolen). Markdown only.
  No `src/`.
  Agent API
  (`docs/AgentApiDesign.md`):
  leftover REAL. Named serial PR1
  (observe handle). `window.rimward`
  absent. `__ctx` stays debug. Empty
  `e.code` drops. No teleport. No
  in-repo LLM. No HTTP in PR1. No
  third helm. PR2–PR6 named later.
  Hail01 demand lifecycle
  (`docs/Hail01DemandLifecycleDesign.md`):
  leftover REAL. Named serial PR1.
  HEAVE-TO is hunt telegraph with no
  ship name. Wave 30 card in 600 u.
  Illyx is ace duel, not demand. Jump
  hides card with no `hailClosed`.
  Later write-set hail.js + npc.js.
  HUD-06 home-station marker
  (`docs/Hud06HomeMarkerDesign.md`):
  leftover REAL. Named serial PR1.
  TGT edge arrow live. Station mark
  absent. POS is XYZ only. Later
  write-set hud.js + hud.css only.
  Kit mutate still omit. Aim-glass
  gauges stay off.
  OPEN: Agent API PR1; Hail01 PR1;
  HUD-06 PR1. CTL-03 / AI-05 / CTL-04
  PR2 still optional.
  CLOSED by Wave 127: Agent API PR1
  + Hail01 PR1 + HUD-06 PR1.
  VERIFY: Agent API verifier CLEAN
  (`out/w126/agentapi/verify/`);
  designer CLEAN
  (`out/w126/designer/agentapi-ui-audit.md`).
  Hail01 verifier CLEAN
  (`out/w126/demand/verify/`);
  designer OPEN tracks live leftover
  until later PR1 (freeze CLEAN).
  HUD-06 verifier CLEAN
  (`out/w126/homemarker/verify/`);
  designer CLEAN. No `src/` this wave.
  Known REDMARCH `castMatches` flake
  is not this write-set.
  FILES: `docs/AgentApiDesign.md`,
  `docs/Hail01DemandLifecycleDesign.md`,
  `docs/Hud06HomeMarkerDesign.md`,
  `out/w126/`.
- Wave 127 (2026-08-26): first impl of Wave 126
  OPEN serials. Src + named boot pins.
  Agent API PR1 observe handle
  (`docs/AgentApiDesign.md`):
  `window.rimward` v1 `{ observe, act,
  enable, disable }`. Session `ctx.agent`.
  `?agent=1` sets optIn (no badge).
  Forbidden first. No HTTP. No third helm.
  No persist. `__ctx` stays debug.
  Hail01 PR1 demand lifecycle
  (`docs/Hail01DemandLifecycleDesign.md`):
  named source; 20 s `demandExpiresAt`;
  Wave 30 card; dock/jump/expire/void
  outcomes; pirate-vs-player HEAVE-TO
  suppressed in acquire bubble; Illyx
  stays duel; finite pay debit.
  HUD-06 PR1 home-station marker
  (`docs/Hud06HomeMarkerDesign.md`):
  square pip + chevron inset 108; POS
  HOME distance; hide dock/jump/hail/
  chart/berth; station lock hides glass
  only. `hud.js` + `hud.css` only.
  Kit mutate still omit. Aim-glass
  gauges stay off.
  OPEN: Agent API PR2 intents; Hail01
  PR2 stills optional; HUD-06 PR2
  stills optional. CTL-03 / AI-05 /
  CTL-04 PR2 still optional.
  CLOSED by Wave 128: Hail02 PR1
  + HUD-07 PR1 + NAV-09 PR1 briefs.
  VERIFY: Agent API first verify
  BUGS_FOUND (nested `bootFreshHarness`
  stale handle); re-dispatch first-install
  + live `__ctx`. Verifier2 CLEAN
  (`out/w127/agentapi/verify2/`); no
  designer (PR1 has no UI). HUD-06
  live verifier CLEAN
  (`out/w127/homemarker/verify/`);
  designer CLEAN
  (`out/w127/designer/homemarker-ui-audit.md`).
  Hail01 live verifier CLEAN
  (`out/w127/demand/verify/`); designer
  CLEAN (`out/w127/designer/demand-ui-audit.md`
  + r2). Boot pin re-dispatch: OPEN
  toast + HEAVE suppress; verifier2
  CLEAN (`out/w127/demand/verify2/`
  and `out/w127/demand/verify-r2/`).
  `npm run test:boot` BOOT TEST PASS
  (`out/w127/boot-test-pass.log`).
  FILES: `src/game/agent-schema.js`,
  `src/game/agent-observe.js`,
  `src/systems/agent-api.js`,
  `src/core/ctx.js`,
  `src/main.js`,
  `src/systems/hail.js`,
  `src/systems/npc.js`,
  `src/systems/hud.js`,
  `src/ui/hud.css`,
  `scripts/boot-test.mjs`,
  `docs/AgentApiDesign.md`,
  `docs/Hail01DemandLifecycleDesign.md`,
  `docs/Hud06HomeMarkerDesign.md`,
  `out/w127/`.
- Wave 128 (2026-08-26): playtest inbox
  briefs after Wave 127 OPEN optional
  PR2s (not stolen). Markdown only.
  No `src/`.
  Hail02 miss-feedback
  (`docs/Hail02MissFeedbackDesign.md`):
  leftover REAL. Named serial PR1.
  Silent KeyH and silent KeyJ. Named
  HUD-04 toast `{name} — verb reason`.
  Later write-set hail.js + HUD
  `toastForEvent` listeners only. No
  fake card. No Fear-as-feedback.
  HUD-07 deconfliction
  (`docs/Hud07DeconflictionDesign.md`):
  leftover REAL. Named serial PR1.
  Four protected regions. Duplicate
  lock names + RANGE/LEAD on aim
  column. Later write-set hud.js +
  hud.css only. 80 px hub stays empty.
  HUD-06 inset 108 stays.
  NAV-09 chart readability
  (`docs/Nav09ChartReadabilityDesign.md`):
  leftover REAL. Named serial PR1.
  101 systems one viewBox. Dest
  `<select id="rw-galaxy-dest">` stays.
  Later write-set galaxychart.js.
  Zoom/pan session. Filter. Itinerary.
  Kit mutate still omit. Aim-glass
  gauges stay off.
  OPEN: Hail02 PR1; HUD-07 PR1;
  NAV-09 PR1. Agent API PR2 intents;
  Hail01 / HUD-06 / CTL-03 / AI-05 /
  CTL-04 PR2 still optional.
  CLOSED by Wave 129: Hail02 PR1
  + HUD-07 PR1 + NAV-09 PR1.
  VERIFY: Hail02 verifier CLEAN
  (`out/w128/hailmiss/verify/`);
  designer CLEAN
  (`out/w128/designer/hailmiss-ui-audit.md`).
  HUD-07 verifier CLEAN
  (`out/w128/deconflict/verify/`);
  designer CLEAN
  (`out/w128/designer/deconflict-ui-audit.md`).
  NAV-09 verifier CLEAN
  (`out/w128/chartread/verify/`);
  designer CLEAN
  (`out/w128/designer/chartread-ui-audit.md`).
  No `src/` this wave. Known REDMARCH
  `castMatches` flake is not this
  write-set.
  FILES: `docs/Hail02MissFeedbackDesign.md`,
  `docs/Hud07DeconflictionDesign.md`,
  `docs/Nav09ChartReadabilityDesign.md`,
  `out/w128/`.
- Wave 129 (2026-08-26): first impl of Wave 128
  OPEN serials. Src + named boot pins.
  Hail02 PR1 miss-feedback
  (`docs/Hail02MissFeedbackDesign.md`):
  named KeyH/KeyJ miss; `'hailMiss'`
  primitives; HUD-04 toast; no fake
  card; no Fear; no pause.
  HUD-07 PR1 deconflict
  (`docs/Hud07DeconflictionDesign.md`):
  yield duplicate name / RANGE+LEAD
  words / overlapping labels; cruise
  quiet those words; hide-not-delete;
  hub empty; HOME 108 stays.
  NAV-09 PR1 chart readability
  (`docs/Nav09ChartReadabilityDesign.md`):
  session zoom/pan + filters + zoom
  labels; dest select kept; itinerary
  as leg rows (last hop is not
  `unknown` on a live gate).
  OPEN: Agent API PR2 intents;
  Hail01 / HUD-06 / Hail02 / HUD-07 /
  NAV-09 / CTL-03 / AI-05 / CTL-04
  PR2 still optional.
  CLOSED by Wave 130: playtest inbox
  briefs (NAV-10 dock approach +
  TGT-07 combat cycle + MSN-04 job
  identity).
  VERIFY: Hail02 verifier CLEAN
  (`out/w129/hailmiss/verify/`);
  designer CLEAN
  (`out/w129/designer/hailmiss-ui-audit.md`).
  HUD-07 verifier CLEAN
  (`out/w129/deconflict/verify/`);
  designer CLEAN
  (`out/w129/designer/deconflict-ui-audit.md`).
  NAV-09 verifier2 CLEAN
  (`out/w129/chartread/verify2/`);
  designer CLEAN
  (`out/w129/designer/chartread-ui-audit.md`
  + r2). First NAV-09 verify
  BUGS_FOUND (last hop `unknown`);
  re-dispatch leg rows. Known
  REDMARCH `castMatches` flake is
  not this write-set.
  FILES: `src/systems/hail.js`,
  `src/systems/hud.js`,
  `src/core/ctx.js`,
  `src/systems/galaxychart.js`,
  `src/ui/hud.css`,
  `scripts/boot-test.mjs`,
  `docs/Hail02MissFeedbackDesign.md`,
  `docs/Hud07DeconflictionDesign.md`,
  `docs/Nav09ChartReadabilityDesign.md`,
  `out/w129/`.
- Wave 130 (2026-08-26): playtest inbox
  briefs after Wave 129 OPEN optional
  PR2s (not stolen). Markdown only.
  No `src/`.
  NAV-10 dock approach
  (`docs/Nav10DockApproachDesign.md`):
  leftover REAL. Named serial PR1.
  `J — Dock` in zone 45. No SLOW cue.
  No speed gate. 2× snap zeros speed.
  PHY-01 bounce stays. Deputize HUD
  cue + self-only `.rw-slow-lamp`.
  Do not reuse MATCH. Do not put
  SLOW on `tgtSpeed`. KeyJ stays tap.
  Later write-set `hud.js` + `hud.css`.
  TGT-07 combat cycle
  (`docs/Tgt07CombatCycleDesign.md`):
  leftover REAL. Named serial PR1.
  `cycleTarget` sorts `d2` only. No
  attacker-lock key. One law:
  hostiles-first then range on KeyT
  when an in-envelope candidate has
  `ai.intent === true`. Later
  write-set `controls.js` `cycleTarget`.
  MSN-04 job identity
  (`docs/Msn04JobDedupDesign.md`):
  leftover REAL. Named serial PR1.
  Two mining slots can paint the same
  `Mine Raw ore` + UU. Distinct ids
  do not close it. PR1 mining-only
  exclude/omit/heal. Digit 2 stays
  Jobs. Ore-scanner guidance stays
  inbox. Unique-four stay.
  Kit mutate still omit. Aim-glass
  gauges stay off.
  OPEN: NAV-10 PR1; TGT-07 PR1;
  MSN-04 PR1. Agent API PR2 intents;
  Hail01 / HUD-06 / Hail02 / HUD-07 /
  NAV-09 / CTL-03 / AI-05 / CTL-04
  PR2 still optional.
  VERIFY: NAV-10 verifier2 CLEAN
  (`out/w130/dockapproach/verify/`);
  designer CLEAN after MATCH freeze
  (`out/w130/designer/dockapproach-ui-audit.md`).
  TGT-07 verifier CLEAN
  (`out/w130/tgtcycle/verify/`);
  designer CLEAN
  (`out/w130/designer/tgtcycle-ui-audit.md`).
  MSN-04 verifier CLEAN
  (`out/w130/jobdedup/verify/`);
  designer CLEAN
  (`out/w130/designer/jobdedup-ui-audit.md`).
  No `src/` this wave. Known REDMARCH
  `castMatches` flake is not this
  write-set.
  FILES: `docs/Nav10DockApproachDesign.md`,
  `docs/Tgt07CombatCycleDesign.md`,
  `docs/Msn04JobDedupDesign.md`,
  `out/w130/`.
- Wave 45 contract notes for future work: Phase 6 of
 docs/FactionVisualUpdatePlan.md is CLOSED — all eight built factions carry
 merged-vertex-colour detail stations. The dispatch table is now
 station.js DETAIL_STATIONS (8 keys, was STATION_BUILDERS), and it stays in
 lockstep with npc.js FACTION_VC_PARTS and gate.js OVERLAY_FACTIONS.
 Adding or reworking a station means ONE file: src/systems/stations/<faction>.js,
 exporting `{ ringY, build(b, ringB, st) }`. That module imports ONLY
 station-detail.js — no THREE, no material, no Group, no FACTION_STYLE lookup —
 and station.js's buildDetailStation owns every shared invariant (group name
 '<faction>-station', the single spinning ringGroup child at spec.ringY, six
 merged chunks on three materials, no PointLight, userData.shared-free
 teardown, beacon at DETAIL_BEACON_Y 31, U.DOCK_RANGE 45 envelope |x|,|z| <= 32
 and y in [-26, 33]). The boot harness pins the whole set generically: keep
 hull colours on the exported SHADES/weather ladder (base FACTION_STYLE colours
 only — never weather an already-weathered value), keep glow tints near-neutral
 (every sRGB channel >= 0.6, because lightMat's pulsed colour multiplies them),
 put saturated hues in glaze behind dark mullions, and hold >= 120,000 merged
 vertices with >= 30,000 in the glow chunk.
 FOUR traps the waves 43-45 bring-ups paid for, in the order they cost time:
 (1) a windowGrid is a FLAT field — on a faceted cylinder the flats sit at
 r * cos(PI / seg), not r, and a field of half-extent H must be sunk to
 sqrt(rFlat^2 - H^2), or its edges hang in open space (the seatedDetail pin);
 (2) panelSkin and ribBands WRAP A CYLINDER around the named axis, so calling
 them with a large radius on a flat deck builds a cage around the whole station
 (lamplighter, wave 45 — every numeric pin passed);
 (3) a CylinderGeometry's axis is +Y, so `rz: Math.PI/2` lays it along X and
 `rx: Math.PI/2` along Z, while a TorusGeometry lies in XY, so `rx: Math.PI/2`
 puts the ring in the XZ plane and `ry: Math.PI/2` rings the X axis;
 (4) every b.push() must be popped — build() throws on an unclosed frame, but
 only after the whole assembly has been authored in the wrong space.
 And the standing rule: the harness cannot see a silhouette. Any station work
 ends in the real game (vite dev + Chrome with --use-angle=swiftshader,
 window.__ctx to swap systems, ctx.flags.paused to freeze the camera) with two
 framings per faction. Screenshots from wave 45 are in .chrome-shot/w45,
 w45r2 and w45r3.
- Wave 42 contract notes for future work: docs/FactionVisualUpdatePlan.md
 carries Phase 6 (waves 43-45), the merged-vertex-colour station detail pass,
 as Decision D5 — CLOSED in wave 45, so the whole plan is done again.
 Everything from the original phases 0-5 remains done: D1-D4
 are implemented, all ten factions have ships and gate overlays, and the
 unknowables no-hull path is built. The unknowables path has NO live site
 by design: no generated system flies the faction, so the field ship and
 the gate overlay only appear if something spawns one (the wave-27
 wreck/beacon/anomaly precedent). Giving them one is a CONTENT decision,
 not a rendering one — an unknowables system would also own a station, a
 market, contacts and an epic, none of which exist. The three dispatch
 tables to keep in lockstep are now npc.js buildShipMesh (isBeautiful /
 'unknowables' / VC kit / fallback), gate.js OVERLAY_FACTIONS (9 keys),
 and station.js DETAIL_STATIONS (8 — unknowables build no stations, by
 their sheets). The core-is-glow ruling is the one thing a future pass must
 not break: userData.glow must stay a real mesh with a scale, because
 every AI path dereferences it without a guard.
- Wave 41 contract notes for future work: PORTRAIT_SOURCES is the single
  list of factions that HAVE a character study — keep it in lockstep
  with what actually sits in public/assets/portraits/, because
  portraitFor's null branch is what keeps hollow/independent cards
  text-only. The variant key is neutral by ruling ('a'/'b', not
  male/female) and the pick is never persisted, so re-hashing or adding
  a third study per faction is a free change with no save migration.
  The face-spread rule lives in station.js renderPeople, not in
  portraits.js: a surface that shows several people at once owns the
  de-duplication, and it stays deterministic only while buildRoster
  order is stable. Two surfaces carry faces today (people card, hail
  card); a third — the bar, contacts in the chart, the origin picker —
  would reuse portraitFor unchanged.
- Wave 40 contract notes for future work: initTitle MUST stay element 0
  of the main.js systems array — its capture-phase keydown listener only
  outranks controls.js and origins.js because it registers first, and the
  whole "nothing happens behind a shut door" guarantee rests on that.
  The z-index ladder is now #hud 10, .screen-overlay 20, banners 30,
  onboarding 35, hail/gate labels 40, pause 50, origins/berth 60, title
  70, settings 80, #fatal 99; settings is deliberately topmost so it can
  open over any surface including the title. save.js clearAutosave()
  touches ONLY 'rimward-save-v1' — a New Game must never reach the three
  manual berth slots. sessionStorage 'rimward-title-skip' is consumed on
  read, so it survives exactly one boot. The boot-test harness dismisses
  the title by CLICKING the data-title-action="new" button; never convert
  that to dispatchKey — the synthetic event has no
  stopImmediatePropagation and the digit would also land on the origin
  picker.
- Wave 39 contract notes for future work: FACTION_STYLE metalness is
  CAPPED AT 0.35 — the project has no environment map, so higher
  metalness kills the diffuse term and the authored hull color renders
  black on unlit faces. Raise the cap only together with an envMap, and
  re-measure the four calibration systems (fx_bastion, as_census,
  lastbeacon, gc_auction — gilded is the black-ceramic control that
  must NOT lift) if the scene fill changes. The scene fill is one
  HemisphereLight(0x9fb4c8, 0x2a2418, 2.0) added once in starfield.js;
  the per-system AmbientLight(0x334455, 0.25) in solarsystem.js is a
  separate, deliberate cool night-side tint. The Bloom station is
  emissive-driven and does not respond to fill at all — a fill change
  cannot move the wave-36 sun-envelope pins.
- Wave 39 harness notes: the wave39 sections pin the ten-jump
  disposal contract (743/743, sharedDisposed=0), zero-alloc update
  across stations/gates/ships including the gate fade quantisation,
  and reducedMotion freeze for stations and ship glow. The station
  ring and the gate ring/chevron freeze at their ACCUMULATED angle —
  assert "unchanged across frames", never "equals 0". Everything in
  gate.js that is intentionally never disposed is now marked
  userData.shared (15 marks); keep that invariant or the leak check
  will flag the asset as a leak when its last user departs.
- Wave 38 contract notes for future work: DETAIL_STATIONS (renamed from
  STATION_BUILDERS in wave 45) / FACTION_VC_PARTS / OVERLAY_FACTIONS cover the
  same 8 factions —
  keep the three dispatch tables in lockstep when adding one;
  '<faction>-station' / '<faction>-overlay' group names are
  boot-pinned; station builders carry NO shared assets (all
  per-build — teardownMesh disposes everything under the group);
  ship ':pirate' cache entries are the dulled-bake contract
  (positions byte-identical to the clean bake, colors strictly
  dimmer, glow/beacon stay lit); scene-wide SphereGeometry censuses
  are fragile — scope traversals by group name (the wave-38 redmarch
  planet-pin fix; gilded gate overlays contain spheres, no live pin
  counts them).
- Wave 37 contract notes for future work: vcGeos/vcGlowMats/vcMaterial
  are module-cached shared and NEVER disposed; ships have exactly 2
  materials (shared vertex-color + faction glow); gate tintFor caches
  are shared like ringGeo/glowMap; FACTIONS.color must stay mirrored
  to FACTION_STYLE.accent and generate-galaxy.mjs FACTION_COLOR (the
  generator's palette-mismatch validation enforces the data side).
- Wave 33 standing: both review P3s are CLOSED (wave 36 — fleshLight
  300 → 60 restores the sun gradient, opacity 0.72 + pulse 0.42/0.10
  rebalance the fill vs the lattice at range; designer-measured:
  sunward/anti-sun 4.97x at 40u, fill reads at 160/180u).
- Wave 33 contract note for future station work: the boot test pins
  the v2 structural surface — 5 'beautiful-pad' (userData.pad 0..4),
  5 'beautiful-hearth', 5 'beautiful-node', 19 crown petals, and a
  shared transparent/emissiveMap/FrontSide skin instance on ≥6 meshes.
  Wave 36 adds a lighting surface to that pin: skin opacity 0.72,
  roughness 0.55, pulse base 0.42 / amp 0.10 / hz 0.07, fleshLight
  60/140/2 at (0,6,0), and the live sun-envelope ratios (≤4.0, parity
  ≤1.2 at 5u). Any v3 pass must update those sections deliberately.
- Wave 28 (Berth Records) is in: KeyL opens a save/load panel in space
  (never docked/paused/dead), three manual slots beside the autosave,
  docking still autosaves. Standing notes:
  - Manual berths never participate in boot load or death recovery (by
    design — recovering into slot N is an explicit in-space load).
  - Slots are overwrite-only: no rename, no note, no delete. A slot
    label/annotation pass is a UI decision, not a patch.
  - SAVE while paused still writes (frozen state is coherent); LOAD is
    the only paused-gated action (the 'systemLoaded'-while-frozen
    hazard). The pre-existing death-overlay Enter-while-paused path
    shares that engine hazard and was left as-is (reviewer-noted, far
    less reachable).
  - berth meta uses toLocaleString — fine for display, never parse it.
- Wave 27 standing notes that still bind: beautiful ships fly only as
  traders i%3==0 / patrol 0 in beautiful systems (pirates always
  redledger/independent — the tarnished variant stays synthetic-only,
  a gameplay decision); organicMaterials/geometry caches are
  userData.shared, never disposed, never tagPulse'd/Material.clone'd;
  veinGlow is AdditiveBlending by contract; the wreck/beacon/anomaly
  glazes are boot-tested via synthetic defs but have no live site.
- The wave-6 haul delivery gate is CLOSED (wave 35 — delivery binds the
  named destination otherSystemId(originSystem), the ferry precedent;
  the multi-gate ruling is recorded on the wave-35 history entry).
- NPC hub-route migration asymmetry: DECIDED lore in wave 22 (junctions
  are player/Guild infrastructure; physical gates only — recorded on
  pickMigrant in world.js). No action standing; revisit only if routed
  systems ever need living traffic.
- Counters (callowReturns, callowRefusals, ledgerIdx) still never
  reset; vouchAck is a bool; mystery.charted grows by landmark id and
  stays bounded by the AUTHORED landmark tables (wave 23 gate) —
  self-limiting (waves 17/18 assessments stand).
- Wave-30 standing (code review LOW): the global-hailClosed card-steal
  LOW is CLOSED (wave 35 — hailClosed carries {ship}; both listeners
  discriminate with an unscoped legacy backstop). Still standing: the
  parley voids on ANY damage source (lastHitAt is shared), not just
  player hits — plays true (a parley under fire breaks).
- Wave-30 standing (security LOWs, save-tamper only): a hand-edited
  save with a non-finite record.wakeSite.position fails open in
  wakes.js discovery (NaN pods, TTL-self-healing); tampered cargo
  units NaN the demand → payTribute credits chain. Both need edited
  localStorage; the restore boundary heals on next load. Negative-
  demand credit grants are NOT possible (demandMin floor).
- Wave-31 standing (security LOWs, save-tamper only): the scanner-heal
  LOW is CLOSED (wave 34 — sanitizeRestored heals any non-0/1/2 scanner
  to 0 at every restore entry point); the qship flag is strict
  (=== true) at spawn but truthy at reveal/HUD — legit saves always
  carry literal true, so only an edited save splits them, and even then
  the failure is cosmetic (cover text over a real mesh, a self-granted
  milestone). Informational: coverName/coverFaction reach the bracket
  only via textContent — no injection sink, local-only threat model.
- Wave-31 content note: Q-ships exist only in record banks generated
  under wave-31+ code — old saves' already-visited systems stay
  classic (no retrofit, the standing lazy-generation precedent).
- Wave-32 standing (security LOWs, save-tamper only): the temper-NaN LOW
  is CLOSED (wave 34 — a Number.isFinite guard re-rolls any non-finite
  temper). Residual, documented standing: a finite-but-huge tampered
  temper survives the guard and rails that record's interest chance at
  the [0.05, 0.9] clamps — bounded (one record permanently min/maxed),
  no NaN into fear/credits, localStorage-edit-only reach. Rename-tamper
  can grant or strip alwaysHuntsPlayer through
  the name-keyed Dresk heal — self-harm or trivially achievable
  directions only; no procedural name pool collides with 'Collector
  Dresk'.
- Wave-32 design notes: the interest ROLL is per-instantiation (temper
  persists, interest re-rolls each meeting) and retaliation is
  instance-scoped (ai fields die on despawn) — a pirate you shot and
  outran may roll cold next time; plays true, recorded as a decision.
  Disinterested pirates under attack still degrade resolve → bargain/
  capitulate/flee (bounty kills credit; they just shoot back now).
- Polish debt: none standing. Boot test remains the gate — with ONE known
  intermittent: roughly 1 run in 10 fails `WAVE30 DEMAND HAIL` +
  `WAVE30 PAYTRIBUTE` together (2 errors). Wave 45 reproduced it on a clean
  HEAD worktree at commit 2d47e0d (4 runs: 3 pass, 1 fail with exactly that
  pair), so it PREDATES the station work and is not a station regression. Both
  sections ride the live run's random combat and world events (the documented
  wave-2 "gate hygiene" flake family). Re-run to confirm green; fixing it means
  pinning the demand/tribute setup against soak-era fear and cargo drift, which
  is a harness job, not a gameplay one.
