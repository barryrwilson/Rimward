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

## Next round candidates (wave 40)
- Docs/FactionVisualUpdatePlan.md is COMPLETE — phases 0–5 all landed
  (waves 37–39). The only piece left in that plan is the optional
  unknowables no-hull render path (D3 — deferred; no generated system
  flies it; colors recorded in FACTION_STYLE.unknowables; it needs a
  new additive field-loop/cell render path, not the mesh kit).
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
- Wave 38 contract notes for future work: STATION_BUILDERS /
  FACTION_VC_PARTS / OVERLAY_FACTIONS cover the same 8 factions —
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
- Polish debt: none standing. Boot test remains the gate.
