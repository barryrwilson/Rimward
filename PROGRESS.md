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
## Next round candidates (wave 23)
- Generated-system depth: the 94 new systems are mechanically reachable
  (trade/mine/fight/traffic) but intentionally sparse — no contacts,
  landmarks, clues, jobs, or faction-specific station behavior yet. The
  standing big candidate; likely multi-wave if taken whole.
- NPC hub-route migration asymmetry: DECIDED lore in wave 22 (junctions
  are player/Guild infrastructure; physical gates only — recorded on
  pickMigrant in world.js). No action standing; revisit only if routed
  systems ever need living traffic.
- The trust-60 tier now rides one exported constant
  (KEEPER_COMP_TRUST); a future numeric rebalance is a one-line
  change, but every 60-gate still has an independent
  system/milestone/ledger gate to re-check if the number moves.
- Counters (callowReturns, callowRefusals, ledgerIdx) still never
  reset; vouchAck is a bool; mystery.charted grows by landmark id but
  is bounded by the authored landmark tables — self-limiting. The
  wave-17/18 assessments found no action worth taking: ledgerIdx is
  modulo-bounded, charted is deduped by authored ids, vouchAck is one
  bit per keeper, and the Callow cursors grow only +1 per real Verge
  visit with exact arithmetic pinned by existing gates.
- Polish debt: none standing; both pre-existing boot-test flakes
  were closed in wave 20, and the wave-20 follow-up fixed the
  cross-system event-pressure leak behind the residual hermit-walk
  flake (0/300 post-fix). Boot test remains the gate.
- Counters (callowReturns, callowRefusals, ledgerIdx) still never
  reset; vouchAck is a bool; mystery.charted grows by landmark id but
  is bounded by the authored landmark tables — self-limiting. The
  wave-17/18 assessments found no action worth taking: ledgerIdx is
  modulo-bounded, charted is deduped by authored ids, vouchAck is one
  bit per keeper, and the Callow cursors grow only +1 per real Verge
  visit with exact arithmetic pinned by existing gates.
- Polish debt: none standing; both pre-existing boot-test flakes
  were closed in wave 20, and the wave-20 follow-up fixed the
  cross-system event-pressure leak behind the residual hermit-walk
  flake (0/300 post-fix). Boot test remains the gate.
