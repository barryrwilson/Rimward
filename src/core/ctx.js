import * as THREE from 'three';

/**
 * RIMWARD web — shared context, THE cross-system contract. v2.
 *
 * Every system receives this object. Systems are src/systems/*.js (presentation
 * + input) and src/game/*.js (pure simulation state). Each exports
 * init<Name>(ctx) → { update(dt, ctx) } unless documented otherwise.
 *
 * Units: abstract world units. Player cruise = 120 u/s (design-doc light
 * fighter 80 m/s × 1.5). All ranges/speeds in src/game/state.js constants.
 *
 * Ownership rules (violating these breaks parallel-safety):
 * - scene/camera/renderer: created in main.js. camera positioned by ship.js.
 * - input: written ONLY by controls.js; read-only for everyone else.
 * - ship (flight transform): written ONLY by ship.js.
 * - player (ship state record): created by ship.js via createShipState;
 *   mutated by combat.js (damage) and state.js helpers only.
 * - bio: written ONLY by bio.js; ship.js/song.js/hud.js read it.
 * - world/market: written by world.js + market.js; station.js reads/trades.
 * - ships (live NPC list): written by traffic.js (spawn/despawn) and npc.js
 *   (AI state); combat.js may damage their state records.
 * - targets: written by controls.js (selection) + npc.js (availability).
 * - flags.docked: written by station.js only. flags.combat: written by npc.js.
 * - flags.camera / flags.firstPerson: written by controls.js only.
 * - flags.matchSpeed: written by ship.js only (toggle). npc.js does not write it.
 * - input.matchSpeedPressed / input.throttleHeld: controls.js only.
 * - ship.js must not write ctx.input.throttle.
 * - events: any system may ctx.emit(); main.js clears the queue AFTER the
 *   last consumer (hud.js) each frame. Event types are frozen — see EVENTS.
 * - ship.js may emit bodyHit; combat.js applies impact/sun damage via applyHit.
 * - combat.js emits playerFire { weapon } when a player cannon/disruptor bolt actually spawns.
 */
export function createCtx({ scene, camera, renderer }) {
  const ctx = {
    // --- three.js core ---
    scene,
    camera,
    renderer,

    // --- tuning / static data (see src/game/state.js for gameplay data) ---
    config: {
      ship: {
        // Flight (design doc §5, scaled ×1.5). Light-fighter baseline.
        maxSpeed: 120, // cruise u/s
        creep: 30, // minimum forward drift when throttle ~ 0 but moving
        acceleration: 90,
        damping: 0.5,
        rotationSpeed: 0.85, // light TURN_MAX; live rate is turnRateFor() in flight-feel.js
        afterburner: { multiplier: 2, burnTime: 6, cooldown: 8 }, // §5.2
        drift: { duration: 4, cooldown: 6, realign: 0.8 }, // vector-hold §5.2
        strafeSpeed: 45, // lateral/vertical strafe u/s §5.1
        fovKick: 12, // afterburner FOV degrees §5.4
      },
      world: {
        sunPosition: new THREE.Vector3(0, 0, 0),
        sunRadius: 0, // solarsystem.js writes the live star; 0 = no heat
        shipSpawn: new THREE.Vector3(0, 30, 800),
        stationPosition: new THREE.Vector3(120, 20, 620), // near spawn
        asteroidField: { center: new THREE.Vector3(-450, -30, -250), radius: 160, count: 130 },
      },
      controls: [], // filled by controls.js, read by hud.js
    },

    // --- live input (controls.js only). Axes -1..1, buttons bool, _pressed = edge ---
    input: {
      steerX: 0, // reticle offset from center, >0 = right
      steerY: 0, // >0 = up (ship pitches toward reticle)
      strafeX: 0, // >0 = strafe right (D)
      strafeY: 0, // >0 = strafe up (W)
      roll: 0, // >0 = roll right (E), <0 = roll left (Q)
      throttle: 0, // persistent setpoint 0..1 (R/F); double-tap F = 0
      fullStop: false, // double-tap F sets, R (throttle up) or afterburner clears.
      // While true the ship holds station at 0 speed, overriding creep (§5.1).
      afterburnerPressed: false, // edge: Space tapped (burn if ready)
      driftHeld: false, // Shift held = vector-hold
      fireHeld: false, // LMB
      weaponGroup: 1, // 1=cannon 2=disruptor 3=mining (keys 1/2/3)
      targetPressed: false, // edge: T (cycle nearest hostiles)
      hailPressed: false, // edge: H
      dockPressed: false, // edge: D
      cameraPressed: false, // edge: C (chase / third / first)
      matchSpeedPressed: false, // edge: X (ship.js toggles flags.matchSpeed)
      throttleHeld: false, // R or F held — ship.js cancels MATCH
      pausePressed: false, // edge: P
    },

    // --- flight transform channel (ship.js only) ---
    ship: {
      object: null,
      velocity: new THREE.Vector3(),
      speed: 0,
      driftActive: false, // vector-hold currently decoupling facing/velocity
      burnerActive: false,
      burnerReadyAt: 0, // ctx.world.time when afterburner next ready
      driftReadyAt: 0,
    },

    // --- player ship state record (game/state.js shape; ship.js creates) ---
    player: null,

    // --- player cargo manifest: [{ commodity, units }] (pods.js/station.js) ---
    cargo: [],
    cargoCapacity: 20,

    // --- bio companion state (bio.js only writes; defaults = serene/healthy) ---
    bio: {
      mood: 'serene', // serene|keen|anxious|pained|feral  (doc §14.6)
      hunger: 0.15, // 0..1, fed at station
      wounds: 0, // 0..1, from hull damage, heals out of combat
      bond: 0.1, // 0..1 grows with care/time
      growth: 0, // 0..1 visible growth from bond + feedings (bio.js, wave 5)
      fedCount: 0, // lifetime real feedings (bio.js, wave 5)
      speedFactor: 1, // mood-driven multipliers ship.js applies
      turnFactor: 1,
      songEvent: null, // set by bio.js on mood change, consumed by song.js
    },

    // --- persistent world (world.js/market.js write; see game/state.js) ---
    world: {
      time: 0, // seconds of world time
      credits: 350, // UU
      fear: 0, // fear rating §7.7
      reputation: { freehold: 0, redledger: 0, veridian: 0, hollow: 0 }, // §11.1
      currentSystem: 'freehold', // key into SYSTEMS (state.js); jump.js swaps
      shipName: null, // player-set later; hails use it when present §12.5
      records: [], // persistent NPC identities §8.2 (current system's cast)
      incidents: [], // recorded things-that-happened (Witness Rule §8.7)
      aftermath: [], // staged evidence derived from incidents
      prices: {}, // commodity → current UU, CURRENT system (market.js maintains)
      markets: {}, // systemId → price table (persisted across jumps)
      activeEvent: null, // current dynamic world event §8.5
      milestones: [], // first-time beats already fired §8.8
      contacts: [], // named station NPCs §12.9 (contacts.js maintains)
      // Wave 51: installed mining head, an index into MINING_LASERS (0..3).
      // station.js's outfitter is the only writer; combat.js/hud.js read it.
      // Same ladder discipline as `scanner` — persisted, sanitized on restore.
      miningLaser: 0,
    },

    // --- star system data + gate/jump surface ---
    systems: null, // set to SYSTEMS at boot (main.js); read-only thereafter
    gate: {
      inZone: false, // gate.js owns: player within JUMP.zone of any current-system gate
      nearTo: null, // gate.js owns: system id of the in-range gate, else null
      nearHub: false, // gate.js owns: in-range destination is a hub junction route
      nearRouteIndex: -1, // gate.js owns: selected hub route (0-based), else -1
      nearRouteCount: 0, // gate.js owns: hub route count at the in-range junction
      jumping: false, // jump.js owns: sequence running (blocks save/combat/AI)
      progress: 0, // 0..1 charge progress for HUD
      destination: null, // system id while jumping
    },

    // --- live NPC ships: { id, record, object, state, role, ai } ---
    // traffic.js adds/removes; npc.js drives; combat.js damages state.
    ships: [],

    // --- targeting (controls.js writes selection; combat/hud read) ---
    targets: {
      current: null, // live ship object from ctx.ships, or asteroid ref
      reticleScreen: { x: 0, y: 0 }, // reticle position in pixels (controls.js)
    },

    // --- global flags ---
    flags: {
      docked: false, // station.js owns
      combat: false, // npc.js owns (hostile intent within bubble)
      paused: false,
      firstPerson: false, // derived: camera === 'first' (HUD reticle center)
      camera: 'chase', // 'chase' | 'third' | 'first' — C cycles; ship.js reads
      matchSpeed: false, // ship.js: hold lock speed; HUD shows MATCH
      saveRestored: false, // save.js sets true when a snapshot is restored
    },

    // --- client settings (settings.js ONLY writes; song/hud/gate/ship read) ---
    // Persisted by settings.js under its own localStorage key — client-level,
    // NOT world state, so it never rides save.js WORLD_FIELDS.
    settings: {
      colorblind: false, // colorblind-safe HUD palette (body.rw-colorblind)
      highContrast: false, // high-contrast HUD (body.rw-contrast)
      reducedMotion: false, // no shakes/pulses/trails (ship/gate/hud read)
      textScale: 1, // 0.85|1|1.2|1.5 → --rw-text-scale on #hud
      masterVolume: 1, // 0..1 multiplier song.js applies to every cue
      muted: false, // song.js runs silent when true
      hints: true, // onboarding.js one-time hint overlays on/off
    },

    // --- event queue. Frozen event types (payload documented at emit sites):
    // 'playerHit' {damage,family,fromAft}        'npcHit' {ship,damage}
    // 'npcDisabled' {ship}   'npcDestroyed' {ship}   'npcSurrendered' {ship,outcome}
    // 'shieldDown' {layer:'screen'|'shell'}      'engineOut' {ship|player}
    // 'podSpawned' {pod}     'podCollected' {pod}
    // 'hailOpened' {ship,intents[]}              'hailClosed' {ship?}
    // 'docked' {}            'undocked' {}       'saveBlocked' {reason}
    // 'worldEvent' {kind}    'milestone' {id, line}  'marketShift' {}
    // 'moodChanged' {mood}   'fearChanged' {fear}     'commLine' {text, from}
    // 'atrocity' {}          'jumpRequested' {to}     'systemLoaded' {to}
    // 'clueFound' {id,line}  'landmarkFound' {id,name,line}   (mystery.js, wave 5)
    // 'epicStage' {id,faction,stage,line}      'originChosen' {id,line}  (wave 6)
    // 'convergence' {id,line} (mystery.js)     'songShift' {reason} (mystery→song)
    // 'deepening' {id,line} (mystery.js, wave 7)   'lineagePassed' {name,generation,line}
    // 'gunRisen' {name,line} (world.js, wave 10 — aspirant cycle)
    // 'creditorCall' {stage,line}  'originPayoff' {id,line}  'originBeat' {id,line}  (world.js origin arcs)
    // 'mineBlocked' {asteroidId, oreKey, hardness, needs, line} (combat.js, wave 51 —
    //   the beam scattered off rock harder than the installed head's tier)
    // 'bodyHit' { kind, speed, damage }   // ship.js bounce; combat.js may fill damage
    // 'sunHeat' { t, dps }                // combat.js, throttled
    // 'sunKill' { reason: 'sun' }         // combat.js lethal core
    // 'playerFire' { weapon }             // combat.js: real cannon/disruptor spawn only
    // 'survivorRescued' { faction, source, count, repDelta }  (station.js, wave 60)
    events: [],
    lastEvents: [], // previous frame's queue (main.js rotates at frame end)
    emit(type, data = {}) {
      ctx.events.push({ type, t: ctx.world.time, ...data });
    },

    elapsed: 0, // real seconds since boot (visual animation only)
  };
  return ctx;
}
