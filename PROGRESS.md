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
## Next round candidates (wave 13)

- Wave 12 closed the queue again: the hermit keeps books on the
  player, the keepers read their open pages, and a restore can no
  longer strand a record.
- Callow refuses a second word for himself — but the keepers now hold
  a name in their column that the player never wrote there. A keeper
  who comps a trusted pilot's dock could acknowledge the vouch
  directly (recognitionLine tier, or a favor-tier line), closing the
  loop Callow opened.
- The clue tier names a SYSTEM only. A keeper at higher trust (the
  comp tier, 60) could narrow further — never the text, but a bearing
  or a landmark pairing ('the page near The Tithe Stone') — one more
  rung of curiosity before explanation (§25).
- callowRefusals now persists on the record unbounded; the counters
  (callowReturns, callowRefusals, ledgerIdx) never reset. Harmless
  (modulo rotation), but a save from a long enough campaign carries
  ever-growing ints — no action needed, noting the pattern.
- Polish debt: none known; boot test is the gate.
