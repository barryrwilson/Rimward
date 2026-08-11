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
