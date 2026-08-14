import * as THREE from 'three';
import { WEAPONS, HEAT, DEFENSE, U, applyHit, tickShipState, MINING_LASERS, miningLaserFor, ORE_TYPES } from '../game/state.js';
import { scaleFor } from '../game/ship-scale.js';

/**
 * Combat system — player weapons + ALL projectile simulation (player & NPC).
 * Doc §6: projectile-based, dodgeable, readable family identity, no hitscan
 * (the mining beam is an industrial tool, not a weapon).
 *
 * Generosity flows toward the player (§6.1): player projectiles get
 * DEFENSE.playerHitPadding (1.25×) hit volumes vs NPCs; NPC projectiles use
 * the player's true visual bounds (PLAYER_HIT_RADIUS, no padding).
 *
 * Consumes same-frame ctx.events 'npcFire' { ship, weapon } from npc.js
 * (NPCs never spawn projectiles themselves). Emits mineHit { asteroidId,
 * point } for asteroids.js (read next frame via ctx.lastEvents). Translates
 * applyHit() descriptors into the frozen ctx event vocabulary.
 *
 * Zero per-frame allocation: projectiles/flashes/sparks are pooled, all
 * scratch vectors are module-scope, the mining beam mutates its buffer in
 * place. Wave-6 polish: every pooled projectile carries an additive glow
 * sprite (attached at init, family-tinted, visible iff the bolt is live —
 * it rides as a child of the bolt mesh), and every ship impact spawns a
 * small spark burst from a pooled set of THREE.Points (per-burst material
 * created at init, positions/velocities preallocated). Sparks animate, so
 * they are suppressed under ctx.settings.reducedMotion.
 *
 * Wave-51 mining pass (§6.3 + ORE_TYPES/MINING_LASERS in state.js):
 * - HEAD LADDER: the beam resolves the INSTALLED cutting head via
 *   miningLaserFor(ctx.world.miningLaser) EVERY call (save restores swap
 *   world fields wholesale, so the entry is never cached). Range, heat,
 *   beam colour/width all come from that entry; a mid-flight purchase
 *   retints/reshapes the live beam the next frame.
 * - HARDNESS GATE: a rock whose ORE_TYPES hardness exceeds the head's tier
 *   scatters the beam and yields nothing. The world tells first (§13.1):
 *   'mineBlocked' { asteroidId, oreKey, hardness, needs, line } fires at
 *   most once per second per asteroid id (a pair of scalars — mining
 *   touches one rock at a time — reset on 'systemLoaded'), while amber
 *   sparks kick BACK along the beam and no dust comes off the rock.
 * - BEAM LOOK: a tapered additive quad strip (4 verts, rebuilt in place
 *   around the camera-facing right vector; muzzle width ×0.5 → contact
 *   width ×1.4, a focusing cone) layered over the crisp 2-vertex core
 *   line, both breathing at working frequency. Contact feedback is an
 *   ore-tinted glow sprite, a pooled THREE.Points ring of ore-tinted
 *   chips thrown back off the surface, and a slower, dimmer dust ring
 *   for the rock-powder read. Pools keep integrating after the beam
 *   turns off so bursts finish naturally; under reducedMotion nothing
 *   emits, live particles still expire, and pulse opacities pin to
 *   their midpoints.
 */

// ---- module-scope scratch (reused every frame) ----
const _fwd = new THREE.Vector3();
const _nose = new THREE.Vector3();
const _dir = new THREE.Vector3();
const _tmp = new THREE.Vector3();
const _lead = new THREE.Vector3();
const _oc = new THREE.Vector3();
const _targetFwd = new THREE.Vector3();
// NPC ships use capsule proxies (radius + half-length along local Z). A 900 u/s
// bolt steps ~15 u per 60 fps frame — larger than a proxy sphere — so hits
// are tested segment-vs-capsule (previous position → new position), never point tests.
const _prev = new THREE.Vector3();
const _seg = new THREE.Vector3();
const _f = new THREE.Vector3();
const _closest = new THREE.Vector3();
// Capsule-proxy scratch: axis, segment midpoint, closest point on axis,
// projection scalar, plus ship-local right (_right) and up (_up) vectors
// for projecting the offset onto the ellipse cross-section axes.
// NPC hulls are flat by charter (SHIP_PROPORTION caps spanY/spanZ at 0.60;
// sculpts run 0.19-0.47). A circular cross-section sized to reach the flanks
// must stand equally far above the deck — the veridian cutter's circular
// hitbox was 2.3× the hull's height and scored hits on bolts passing visibly
// over it. The proxy cross-section is therefore an ELLIPSE: rx (half-beam,
// local X) and ry (half-height, local Y) are sized independently so the
// hitbox stays close to the actual hull silhouette.
// These alias with sweptHit scratch — capsule resolution runs first, then
// sweptHit clobbers _seg/_f/_closest. Zero per-frame allocation.
const _axis = new THREE.Vector3();
const _right = new THREE.Vector3();   // ship local X in world space
const _up = new THREE.Vector3();      // ship local Y in world space
const _mid = new THREE.Vector3();
const _cap = new THREE.Vector3();
let _proj = 0;
// mineHit point payloads rotate through this ring: emitted events are read
// NEXT frame via ctx.lastEvents, so a single scratch vector would be mutated
// under the consumer. A ring of 3 outlasts the one-frame rotation.
const _minePoints = [new THREE.Vector3(), new THREE.Vector3(), new THREE.Vector3()];
let _minePointIdx = 0;
// Wave 51 mining scratch: beam endpoint, camera forward, the camera-facing
// ribbon right vector, the -beamDir launch axis for chips/scatter, a dust
// drift direction, per-particle velocity assembly, and a hex→rgb staging
// colour for the particle color buffers. Zero per-frame allocation.
const _beamEnd = new THREE.Vector3();
const _camFwd = new THREE.Vector3();
const _beamRight = new THREE.Vector3();
const _away = new THREE.Vector3();
const _dustDir = new THREE.Vector3();
const _pvel = new THREE.Vector3();
const _pcol = new THREE.Color();
// mineBlocked throttle: mining touches one rock at a time, so a pair of
// scalars (not a Map) caps the refusal at one emit/second per asteroid id.
// Reset on 'systemLoaded' — a fresh field reuses ids.
let _lastBlockedId = -1;
let _lastBlockedAt = -1e9;

const POOL_SIZE = 64;
const FLASH_POOL = 16;
const PROJ_RADIUS = 0.4;
const PLAYER_HIT_RADIUS = 2.4; // true visual bounds of the living hull (§6.1)
const NOSE_OFFSET = 3.0; // projectile spawns just past the nose
const AIM_ERROR = Math.tan((2 * Math.PI) / 180); // ±2° NPC aim error
const CONVERGE_DOT = 0.85; // aim-assist convergence only in the frontal cone

const GROUP_WEAPON = { 1: 'cannon', 2: 'disruptor', 3: 'mining' };
// §6.3 family identity: cannon = cyan bolt, disruptor = violet, mining = salvage green.
const FAMILY_COLORS = { energy: 0x53f2ff, disruptor: 0xc86bff, mining: 0x51ff9e };

// Impact sparks (wave-6): pooled bursts riding the flash discipline.
const SPARKS_PER_BURST = 6;
const SPARK_TTL = 0.35; // s
const SPARK_SPEED = 16; // u/s outward drift

// Mining particles (wave 51): two THREE.Points rings — ore-tinted chips and
// slower rock-powder dust — plus the held-contact emission cadence.
const MINE_SPARKS = 48;
const MINE_DUST = 32;
const MINE_SPARK_INTERVAL = 0.07; // s between chip bursts on a held contact
const MINE_DUST_INTERVAL = 0.16;  // s between dust puffs
const MINE_SPARK_TTL = 0.45;      // chip lifetime
const MINE_DUST_TTL = 1.2;        // rock-powder lifetime
const BLOCKED_TINT = 0xff9a3a;    // hostile amber: too-hard rock scatters the beam

/** Soft radial dot sprite shared by projectile glows and spark points. */
function makeGlowDot() {
  const size = 64;
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = size;
  const g = canvas.getContext('2d');
  const grad = g.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  grad.addColorStop(0, 'rgba(255,255,255,1)');
  grad.addColorStop(0.35, 'rgba(255,255,255,0.5)');
  grad.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = grad;
  g.fillRect(0, 0, size, size);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

export function initCombat(ctx) {
  const { scene } = ctx;

  // --- Projectile pool: shared geometry, two shared family materials ---
  const projGeo = new THREE.SphereGeometry(PROJ_RADIUS, 8, 6);
  const projMats = {
    energy: new THREE.MeshBasicMaterial({
      color: FAMILY_COLORS.energy,
      blending: THREE.AdditiveBlending,
      transparent: true,
      depthWrite: false,
    }),
    disruptor: new THREE.MeshBasicMaterial({
      color: FAMILY_COLORS.disruptor,
      blending: THREE.AdditiveBlending,
      transparent: true,
      depthWrite: false,
    }),
  };
  // Additive glow sprites: two shared family materials, one sprite child per
  // pooled bolt (built at init; visible iff the bolt is live via the parent).
  const glowTex = makeGlowDot();
  const glowMats = {
    energy: new THREE.SpriteMaterial({
      map: glowTex,
      color: FAMILY_COLORS.energy,
      blending: THREE.AdditiveBlending,
      transparent: true,
      opacity: 0.9,
      depthWrite: false,
    }),
    disruptor: new THREE.SpriteMaterial({
      map: glowTex,
      color: FAMILY_COLORS.disruptor,
      blending: THREE.AdditiveBlending,
      transparent: true,
      opacity: 0.9,
      depthWrite: false,
    }),
  };
  const pool = [];
  for (let i = 0; i < POOL_SIZE; i++) {
    const mesh = new THREE.Mesh(projGeo, projMats.energy);
    mesh.visible = false;
    const glow = new THREE.Sprite(glowMats.energy);
    glow.scale.set(2.4, 2.4, 1);
    mesh.add(glow); // child: hides/shows with the bolt, zero extra bookkeeping
    scene.add(mesh);
    pool.push({
      mesh,
      glow,
      active: false,
      vel: new THREE.Vector3(),
      shooterPos: new THREE.Vector3(), // for aft/fore facet at hit time
      fromPlayer: true,
      wkey: 'cannon', // WEAPONS key (applyHit family lookup)
      family: 'energy', // §6.3 identity string (events/flash color)
      damage: 0,
      speed: 0,
      range: 0,
      traveled: 0,
    });
  }

  // --- Impact flash pool: per-sprite materials (opacity animated per sprite) ---
  const flashes = [];
  for (let i = 0; i < FLASH_POOL; i++) {
    const mat = new THREE.SpriteMaterial({
      color: FAMILY_COLORS.energy,
      blending: THREE.AdditiveBlending,
      transparent: true,
      depthWrite: false,
    });
    const sprite = new THREE.Sprite(mat);
    sprite.visible = false;
    scene.add(sprite);
    flashes.push({ sprite, t: 0, ttl: 0.18 });
  }

  // --- Impact spark pool (wave-6): one burst per flash, each a THREE.Points
  // with preallocated position/velocity buffers and a per-burst material
  // (opacity animated per burst). Built once; reused ring-style.
  const sparks = [];
  for (let i = 0; i < FLASH_POOL; i++) {
    const geo = new THREE.BufferGeometry();
    const arr = new Float32Array(SPARKS_PER_BURST * 3);
    geo.setAttribute('position', new THREE.BufferAttribute(arr, 3));
    const mat = new THREE.PointsMaterial({
      color: FAMILY_COLORS.energy,
      size: 0.6,
      map: glowTex,
      blending: THREE.AdditiveBlending,
      transparent: true,
      depthWrite: false,
    });
    const pts = new THREE.Points(geo, mat);
    pts.visible = false;
    pts.frustumCulled = false; // burst can sit anywhere; skip stale culling
    scene.add(pts);
    sparks.push({ pts, arr, vel: new Float32Array(SPARKS_PER_BURST * 3), t: 0, active: false });
  }

  // --- Wave 51 mining beam: layered, tapered, pulsing (module header) ---
  // Inner core: the crisp 2-vertex centre line, buffer mutated in place.
  const beamCoreGeo = new THREE.BufferGeometry();
  const beamArr = new Float32Array(6);
  beamCoreGeo.setAttribute('position', new THREE.BufferAttribute(beamArr, 3));
  const beamCore = new THREE.Line(
    beamCoreGeo,
    new THREE.LineBasicMaterial({
      color: MINING_LASERS[0].coreColor,
      blending: THREE.AdditiveBlending,
      transparent: true,
      opacity: 0.85,
    }),
  );
  beamCore.name = 'mine-beam-core';
  beamCore.visible = false;
  beamCore.frustumCulled = false; // endpoints move every frame; skip stale culling
  scene.add(beamCore);

  // Outer beam: a tapered quad strip (4 verts / 2 indexed tris, DoubleSide
  // additive), rebuilt in place each frame around the camera-facing right
  // vector — muzzle half-width ×0.25 tapering to ×0.7 at the contact, so it
  // reads as a focusing cone from any viewpoint.
  const beamQuadGeo = new THREE.BufferGeometry();
  const beamQuadArr = new Float32Array(12);
  beamQuadGeo.setAttribute('position', new THREE.BufferAttribute(beamQuadArr, 3));
  beamQuadGeo.setIndex([0, 2, 1, 1, 2, 3]);
  const beamMesh = new THREE.Mesh(
    beamQuadGeo,
    new THREE.MeshBasicMaterial({
      color: MINING_LASERS[0].beamColor,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
      transparent: true,
      opacity: 0.6,
      depthWrite: false,
    }),
  );
  beamMesh.name = 'mine-beam';
  beamMesh.visible = false;
  beamMesh.frustumCulled = false;
  scene.add(beamMesh);

  // Contact glow: endpoint sprite, tinted per contact (ore sparkColor while
  // cutting, hostile amber while blocked), scale breathing with beamWidth.
  const beamGlow = new THREE.Sprite(
    new THREE.SpriteMaterial({
      color: MINING_LASERS[0].beamColor,
      blending: THREE.AdditiveBlending,
      transparent: true,
      opacity: 0.8,
      depthWrite: false,
    }),
  );
  beamGlow.name = 'mine-glow';
  beamGlow.scale.set(2.5, 2.5, 1);
  beamGlow.visible = false;
  scene.add(beamGlow);

  // Mining particle pools: single THREE.Points rings with position + color
  // attributes (per-particle fade multiplies toward black — under additive
  // blending black is gone). All buffers preallocated; a ring cursor hands
  // out slots. `drag` is the per-second velocity decay; `live` gates the
  // tick and the visible flag.
  function makeMinePoints(count, size, drag) {
    const geo = new THREE.BufferGeometry();
    const pos = new Float32Array(count * 3);
    const col = new Float32Array(count * 3);
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
    const pts = new THREE.Points(
      geo,
      new THREE.PointsMaterial({
        size,
        map: glowTex,
        vertexColors: true,
        blending: THREE.AdditiveBlending,
        transparent: true,
        depthWrite: false,
        sizeAttenuation: true,
      }),
    );
    pts.visible = false;
    pts.frustumCulled = false; // particles can sit anywhere; skip stale culling
    scene.add(pts);
    return {
      pts,
      pos,
      col,
      vel: new Float32Array(count * 3),
      base: new Float32Array(count * 3), // pre-fade particle colour
      life: new Float32Array(count),
      ttl: new Float32Array(count),
      live: 0,
      cursor: 0,
      drag,
    };
  }
  const mineSparks = makeMinePoints(MINE_SPARKS, 0.9, 2.8); // fast chips
  mineSparks.pts.name = 'mine-sparks';
  const mineDust = makeMinePoints(MINE_DUST, 2.4, 0.6); // big slow powder
  mineDust.pts.name = 'mine-dust';
  // Emission clocks ride the contact; primed to the interval so the first
  // contact frame bursts immediately. Reset by hideMiningFx().
  let mineSparkClock = MINE_SPARK_INTERVAL;
  let mineDustClock = MINE_DUST_INTERVAL;

  /** Ring-emit `count` particles from `point` along `dir` (jittered cone). */
  function emitMineParticles(pool, point, dir, count, colorHex, speed, spread, ttl) {
    _pcol.setHex(colorHex);
    const n = pool.ttl.length;
    for (let k = 0; k < count; k++) {
      const i = pool.cursor;
      pool.cursor = (pool.cursor + 1) % n;
      if (pool.life[i] <= 0) pool.live++;
      const i3 = i * 3;
      pool.pos[i3] = point.x;
      pool.pos[i3 + 1] = point.y;
      pool.pos[i3 + 2] = point.z;
      _pvel.copy(dir).multiplyScalar(speed * (0.7 + 0.6 * Math.random()));
      _pvel.x += (Math.random() * 2 - 1) * spread;
      _pvel.y += (Math.random() * 2 - 1) * spread;
      _pvel.z += (Math.random() * 2 - 1) * spread;
      pool.vel[i3] = _pvel.x;
      pool.vel[i3 + 1] = _pvel.y;
      pool.vel[i3 + 2] = _pvel.z;
      pool.base[i3] = _pcol.r;
      pool.base[i3 + 1] = _pcol.g;
      pool.base[i3 + 2] = _pcol.b;
      pool.col[i3] = _pcol.r;
      pool.col[i3 + 1] = _pcol.g;
      pool.col[i3 + 2] = _pcol.b;
      pool.life[i] = ttl;
      pool.ttl[i] = ttl;
    }
    pool.pts.visible = true;
    pool.pts.geometry.attributes.position.needsUpdate = true;
    pool.pts.geometry.attributes.color.needsUpdate = true;
  }

  /** Integrate + fade a ring. Under `hide` (reducedMotion) particles stay
   * hidden and frozen but still expire — bursts never strand mid-air. */
  function tickMinePool(pool, dt, hide) {
    if (pool.live <= 0) {
      pool.pts.visible = false;
      return;
    }
    let live = 0;
    for (let i = 0; i < pool.life.length; i++) {
      if (pool.life[i] <= 0) continue;
      pool.life[i] -= dt;
      const i3 = i * 3;
      if (pool.life[i] <= 0) {
        pool.col[i3] = pool.col[i3 + 1] = pool.col[i3 + 2] = 0; // additive black = gone
        continue;
      }
      live++;
      if (hide) continue; // no particle motion under reducedMotion
      const dragK = Math.max(0, 1 - pool.drag * dt);
      pool.pos[i3] += pool.vel[i3] * dt;
      pool.pos[i3 + 1] += pool.vel[i3 + 1] * dt;
      pool.pos[i3 + 2] += pool.vel[i3 + 2] * dt;
      pool.vel[i3] *= dragK;
      pool.vel[i3 + 1] *= dragK;
      pool.vel[i3 + 2] *= dragK;
      const f = pool.life[i] / pool.ttl[i];
      pool.col[i3] = pool.base[i3] * f;
      pool.col[i3 + 1] = pool.base[i3 + 1] * f;
      pool.col[i3 + 2] = pool.base[i3 + 2] * f;
    }
    pool.live = live;
    pool.pts.visible = !hide && live > 0;
    pool.pts.geometry.attributes.position.needsUpdate = true;
    pool.pts.geometry.attributes.color.needsUpdate = true;
  }

  /** Beam off: hide every beam-layer visual and re-prime the emission
   * clocks. Particle pools are NOT touched — live bursts finish naturally. */
  function hideMiningFx() {
    beamMesh.visible = false;
    beamCore.visible = false;
    beamGlow.visible = false;
    mineSparkClock = MINE_SPARK_INTERVAL;
    mineDustClock = MINE_DUST_INTERVAL;
  }

  // Per-weapon fire cooldowns (rof), in world time.
  const nextFireAt = { cannon: 0, disruptor: 0 };

  // ---------- helpers ----------

  function addHeat(amount) {
    const p = ctx.player;
    if (!p) return;
    p.heat += amount;
    if (p.heat >= HEAT.max) {
      p.heat = HEAT.max;
      p.overheated = true; // lockout until HEAT.overheatUnlockAt (§6.3); tickShipState cools/clears
    }
  }

  function spawnProjectile(fromPlayer, wkey, w, origin, dir, shooterPos) {
    for (let i = 0; i < pool.length; i++) {
      const p = pool[i];
      if (p.active) continue;
      p.active = true;
      p.fromPlayer = fromPlayer;
      p.wkey = wkey;
      p.family = w.family;
      p.damage = w.damage;
      p.speed = w.speed;
      p.range = w.range;
      p.traveled = 0;
      p.vel.copy(dir).multiplyScalar(w.speed);
      p.shooterPos.copy(shooterPos);
      p.mesh.material = projMats[w.family] ?? projMats.energy;
      p.glow.material = glowMats[w.family] ?? glowMats.energy;
      p.mesh.position.copy(origin);
      p.mesh.visible = true;
      return p;
    }
    return null; // pool exhausted: shot dropped, no allocation
  }

  function deactivate(p) {
    p.active = false;
    p.mesh.visible = false;
  }

  /** Spark burst at a hit point: random outward velocities, no allocation. */
  function spawnSparks(pos, family) {
    if (ctx.settings?.reducedMotion) return; // animated burst — hidden under reduced motion
    for (let i = 0; i < sparks.length; i++) {
      const s = sparks[i];
      if (s.active) continue;
      s.active = true;
      s.t = 0;
      s.pts.material.color.set(FAMILY_COLORS[family] ?? FAMILY_COLORS.energy);
      s.pts.material.opacity = 1;
      for (let j = 0; j < SPARKS_PER_BURST; j++) {
        const j3 = j * 3;
        s.arr[j3] = pos.x;
        s.arr[j3 + 1] = pos.y;
        s.arr[j3 + 2] = pos.z;
        // Random direction on the sphere, written straight into the buffer.
        const a = Math.random() * Math.PI * 2;
        const b = Math.acos(2 * Math.random() - 1);
        const sp = SPARK_SPEED * (0.5 + Math.random());
        const sb = Math.sin(b);
        s.vel[j3] = sb * Math.cos(a) * sp;
        s.vel[j3 + 1] = Math.cos(b) * sp;
        s.vel[j3 + 2] = sb * Math.sin(a) * sp;
      }
      s.pts.geometry.attributes.position.needsUpdate = true;
      s.pts.visible = true;
      return;
    }
  }

  function spawnFlash(pos, family) {
    spawnSparks(pos, family); // independent pool — fires on every ship impact
    for (let i = 0; i < flashes.length; i++) {
      const f = flashes[i];
      if (f.sprite.visible) continue;
      f.t = 0;
      f.sprite.material.color.set(FAMILY_COLORS[family] ?? FAMILY_COLORS.energy);
      f.sprite.material.opacity = 1; // reset — the fade mutates this per-sprite material
      f.sprite.scale.set(1.5, 1.5, 1);
      f.sprite.position.copy(pos);
      f.sprite.visible = true;
      return;
    }
  }

  function firePlayerGun(wkey, w, playerObj) {
    _fwd.set(0, 0, -1).applyQuaternion(playerObj.quaternion); // nose = local -Z
    _nose.copy(playerObj.position).addScaledVector(_fwd, NOSE_OFFSET);
    _dir.copy(_fwd);
    // Slight convergence toward the target's lead point (§6.2), frontal cone only.
    const t = ctx.targets.current;
    if (t?.object && t.state && !t.state.destroyed) {
      _tmp.subVectors(t.object.position, _nose);
      const dist = _tmp.length();
      if (dist > 1 && dist < U.TARGET_RANGE) {
        _tmp.divideScalar(dist);
        if (_tmp.dot(_fwd) > CONVERGE_DOT) {
          const tv = t.ai?.velocity; // npc.js may publish a velocity; lead only if present
          _lead.copy(t.object.position);
          if (tv) _lead.addScaledVector(tv, dist / w.speed);
          _dir.subVectors(_lead, _nose).normalize();
        }
      }
    }
    spawnProjectile(true, wkey, w, _nose, _dir, playerObj.position);
    addHeat(w.heatPerShot);
  }

  function spawnNpcShot(ship, weapon, playerObj) {
    const wkey = WEAPONS[weapon] ? weapon : 'cannon';
    const w = WEAPONS[wkey];
    _fwd.set(0, 0, -1).applyQuaternion(ship.object.quaternion);
    _nose.copy(ship.object.position).addScaledVector(_fwd, NOSE_OFFSET);
    _dir.subVectors(playerObj.position, _nose);
    const dist = _dir.length();
    if (dist < 1) return;
    _dir.divideScalar(dist);
    // Aim error ±2° (§assignment): random angular jitter, then renormalize.
    _dir.x += (Math.random() * 2 - 1) * AIM_ERROR;
    _dir.y += (Math.random() * 2 - 1) * AIM_ERROR;
    _dir.z += (Math.random() * 2 - 1) * AIM_ERROR;
    _dir.normalize();
    spawnProjectile(false, wkey, w, _nose, _dir, ship.object.position);
  }

  /** Ray-sphere vs asteroid list; returns true while the beam is on. */
  function updateMining(dt, playerObj) {
    // The INSTALLED cutting head, resolved every call: save restores swap
    // world fields wholesale, so caching this entry across frames goes stale.
    const laser = miningLaserFor(ctx.world.miningLaser);
    _fwd.set(0, 0, -1).applyQuaternion(playerObj.quaternion);
    _nose.copy(playerObj.position).addScaledVector(_fwd, NOSE_OFFSET * 0.8);
    _dir.copy(_fwd);
    // A targeted asteroid (refs are { id, position, radius, ... } — no .object) pulls the beam.
    const t = ctx.targets.current;
    if (t && t.position && !t.object) {
      _dir.subVectors(t.position, _nose);
      const d = _dir.length();
      if (d < 1e-3) _dir.copy(_fwd);
      else _dir.divideScalar(d);
    }
    // Closest sphere intersection along the beam, capped at the head's reach.
    const list = ctx.asteroids?.list;
    let bestT = laser.range;
    let bestEntry = null;
    if (list) {
      for (let i = 0; i < list.length; i++) {
        const a = list[i];
        _oc.subVectors(_nose, a.position);
        const b = _oc.dot(_dir);
        const c = _oc.lengthSq() - a.radius * a.radius;
        const disc = b * b - c;
        if (disc < 0) continue;
        const sq = Math.sqrt(disc);
        let th = -b - sq;
        if (th < 0) th = -b + sq; // origin inside the sphere
        if (th < 0 || th > bestT) continue;
        bestT = th;
        bestEntry = a;
      }
    }
    _beamEnd.copy(_nose).addScaledVector(_dir, bestT); // contact point / reach cap

    // Per-frame head re-application: a mid-flight outfitter purchase (or a
    // save restore) retints/reshapes the live beam immediately. setHex on the
    // existing material colours — never a new THREE.Color per frame.
    beamMesh.material.color.setHex(laser.beamColor);
    beamCore.material.color.setHex(laser.coreColor);

    // Core line endpoints (the original 2-vertex buffer, mutated in place).
    beamArr[0] = _nose.x;
    beamArr[1] = _nose.y;
    beamArr[2] = _nose.z;
    beamArr[3] = _beamEnd.x;
    beamArr[4] = _beamEnd.y;
    beamArr[5] = _beamEnd.z;
    beamCoreGeo.attributes.position.needsUpdate = true;

    // Tapered ribbon: right = normalise(cross(beamDir, cameraForward)). The
    // degenerate beam-straight-at-camera case falls back to the camera's
    // world X so the strip never collapses to a sliver of NaNs.
    ctx.camera.getWorldDirection(_camFwd);
    _beamRight.crossVectors(_dir, _camFwd);
    if (_beamRight.lengthSq() < 1e-6) _beamRight.set(1, 0, 0).applyQuaternion(ctx.camera.quaternion);
    else _beamRight.normalize();
    const w0 = laser.beamWidth * 0.5 * 0.5; // muzzle half-width
    const w1 = laser.beamWidth * 1.4 * 0.5; // contact half-width (focusing cone)
    beamQuadArr[0] = _nose.x + _beamRight.x * w0;
    beamQuadArr[1] = _nose.y + _beamRight.y * w0;
    beamQuadArr[2] = _nose.z + _beamRight.z * w0;
    beamQuadArr[3] = _nose.x - _beamRight.x * w0;
    beamQuadArr[4] = _nose.y - _beamRight.y * w0;
    beamQuadArr[5] = _nose.z - _beamRight.z * w0;
    beamQuadArr[6] = _beamEnd.x + _beamRight.x * w1;
    beamQuadArr[7] = _beamEnd.y + _beamRight.y * w1;
    beamQuadArr[8] = _beamEnd.z + _beamRight.z * w1;
    beamQuadArr[9] = _beamEnd.x - _beamRight.x * w1;
    beamQuadArr[10] = _beamEnd.y - _beamRight.y * w1;
    beamQuadArr[11] = _beamEnd.z - _beamRight.z * w1;
    beamQuadGeo.attributes.position.needsUpdate = true;

    // Working-frequency breathing: outer 0.35..0.8, core 0.7..1.0 at a
    // different rate. reducedMotion pins both to their midpoints (no flicker).
    const reduced = ctx.settings?.reducedMotion === true;
    if (reduced) {
      beamMesh.material.opacity = 0.575;
      beamCore.material.opacity = 0.85;
    } else {
      beamMesh.material.opacity = 0.575 + 0.225 * Math.sin(ctx.elapsed * 26);
      beamCore.material.opacity = 0.85 + 0.15 * Math.sin(ctx.elapsed * 31);
    }
    beamMesh.visible = true;
    beamCore.visible = true;

    if (bestEntry) {
      const oreKey = bestEntry.oreKey ?? 'rawOre';
      const hardness = bestEntry.hardness ?? 1;
      const oreDef = ORE_TYPES[oreKey];
      const blocked = hardness > laser.tier; // wave-51 hardness gate
      beamGlow.position.copy(_beamEnd);
      const gs = (reduced ? 2.0 : 2.0 + 0.6 * Math.sin(ctx.elapsed * 18)) * laser.beamWidth;
      beamGlow.scale.set(gs, gs, 1);
      beamGlow.material.color.setHex(blocked ? BLOCKED_TINT : oreDef.sparkColor);
      beamGlow.visible = true;
      addHeat(laser.heatPerShot * WEAPONS.mining.rof * dt); // tiny continuous heat while on rock

      if (blocked) {
        // The rock scatters the beam and yields nothing. The world tells
        // first (§13.1): one mineBlocked per second per asteroid id.
        const now = ctx.world.time;
        if (bestEntry.id !== _lastBlockedId || now - _lastBlockedAt >= 1) {
          _lastBlockedId = bestEntry.id;
          _lastBlockedAt = now;
          let needs = MINING_LASERS[MINING_LASERS.length - 1];
          for (let i = 0; i < MINING_LASERS.length; i++) {
            if (MINING_LASERS[i].tier >= hardness) { needs = MINING_LASERS[i]; break; }
          }
          ctx.emit('mineBlocked', { asteroidId: bestEntry.id, oreKey, hardness, needs, line: oreDef.blockedLine });
        }
        // Legible without a word of UI: amber chips kick BACK along the
        // beam, faster and shorter-lived — and NO dust (nothing comes off).
        if (!reduced) {
          mineSparkClock += dt;
          if (mineSparkClock >= MINE_SPARK_INTERVAL) {
            mineSparkClock -= MINE_SPARK_INTERVAL;
            _away.copy(_dir).negate();
            emitMineParticles(mineSparks, _beamEnd, _away, 4 + ((Math.random() * 3) | 0), BLOCKED_TINT, 30, 4, MINE_SPARK_TTL * 0.6);
          }
        }
        mineDustClock = MINE_DUST_INTERVAL;
      } else {
        // Productive contact: asteroids.js extracts at extractPerSec ÷
        // ORE_TYPES.extractResist (its side of the contract).
        const pt = _minePoints[_minePointIdx];
        _minePointIdx = (_minePointIdx + 1) % _minePoints.length;
        pt.copy(_beamEnd);
        ctx.emit('mineHit', { asteroidId: bestEntry.id, point: pt, laserTier: laser.tier, extractPerSec: laser.extractPerSec });
        if (!reduced) {
          mineSparkClock += dt;
          if (mineSparkClock >= MINE_SPARK_INTERVAL) {
            mineSparkClock -= MINE_SPARK_INTERVAL;
            // Chips thrown back off the surface, ore-tinted.
            _away.copy(_dir).negate();
            emitMineParticles(mineSparks, _beamEnd, _away, 5 + ((Math.random() * 3) | 0), oreDef.sparkColor, 14, 7, MINE_SPARK_TTL);
          }
          mineDustClock += dt;
          if (mineDustClock >= MINE_DUST_INTERVAL) {
            mineDustClock -= MINE_DUST_INTERVAL;
            // Rock powder drifting perpendicular to the beam, dust-tinted.
            _dustDir.copy(_beamRight).multiplyScalar(Math.random() < 0.5 ? -1 : 1);
            emitMineParticles(mineDust, _beamEnd, _dustDir, 2 + ((Math.random() * 2) | 0), oreDef.dustColor, 2.5, 1.6, MINE_DUST_TTL);
          }
        }
      }
    } else {
      beamGlow.visible = false;
      mineSparkClock = MINE_SPARK_INTERVAL; // primed: first contact frame bursts
      mineDustClock = MINE_DUST_INTERVAL;
    }
    return true;
  }

  /** Swept hit: closest point on this frame's travel segment to center ≤ radius? */
  function sweptHit(p, center, radius) {
    _seg.subVectors(p.mesh.position, _prev);
    const len2 = _seg.lengthSq();
    _f.subVectors(_prev, center);
    const t = len2 > 0 ? Math.max(0, Math.min(1, -_f.dot(_seg) / len2)) : 0;
    _closest.copy(_prev).addScaledVector(_seg, t);
    if (_closest.distanceToSquared(center) > radius * radius) return false;
    p.mesh.position.copy(_closest); // snap to true impact point
    return true;
  }

  function testNpcHits(p, now) {
    for (let i = 0; i < ctx.ships.length; i++) {
      const s = ctx.ships[i];
      if (!s?.object || !s.state || s.state.destroyed) continue;

      // Cache per live ship: elliptical proxy (rx, ry, halfLen) × object scale.
      // rx = half-beam (local X), ry = half-height (local Y). Both scale uniformly.
      //
      // Source: s.object.userData.proxy, set by buildShipMesh from deriveProxy().
      // This is read from the MESH rather than from scaleFor(state.classKey).proxy,
      // which fixes a genuine bug: a disguised Q-ship is built with its COVER class
      // and COVER faction (see spawnLiveShip), so the mesh's actual geometry — and
      // the proxy derived from it — belong to the cover hull, not to state.classKey.
      // scaleFor(state.classKey) would have used the hidden cutter proxy while the
      // ship was visually a freighter; reading userData gets this right automatically.
      //
      // Proxy cache is invalidated by revealQship (npc.js) on every mesh swap: it
      // resets _proxyRx to undefined so this branch re-reads on the next hit test.
      //
      // Fallback to SHIP_SCALE[classKey].proxy when userData.proxy is absent or null —
      // the Unknowables energy field has no hull channel and never calls deriveProxy;
      // a hull with degenerate geometry returns null from deriveProxy for the same path.
      let rx = s._proxyRx;
      let ry = s._proxyRy;
      let halfLen = s._proxyHalf;
      if (rx === undefined) {
        const scale = s.object.scale?.x || 1;
        // userData.proxy is null for degenerate hulls (deriveProxy returns null) and
        // absent (undefined) for hull-less ships; ?? falls back in both cases.
        const proxy = s.object.userData.proxy ?? scaleFor(s.state.classKey).proxy;
        rx = s._proxyRx = proxy.rx * scale;
        ry = s._proxyRy = proxy.ry * scale;
        halfLen = s._proxyHalf = proxy.halfLen * scale;
      }

      // Resolve elliptical capsule to closest axis point, then derive an
      // effective isotropic radius in the offset's local-XY direction for sweptHit.
      // Ship's local Z is the capsule axis (stern-ward, symmetric).
      //
      // Per-frame axis cache: NPC movement completes before this loop, so all three
      // applyQuaternion calls yield identical results for every projectile against the
      // same ship in the same frame. Cache the 9 axis-component floats on the live
      // ship object keyed by now (= ctx.world.time, fixed for the whole update call).
      // No per-frame allocation: components are plain numbers written onto an existing
      // object; the module-scope scratch vectors _axis/_right/_up are reused as before.
      // The cache cannot go stale within a frame because now is monotonically increasing
      // across frames and is never mutated during the projectile loop.
      if (s._axisFt !== now) {
        _axis.set(0, 0, 1).applyQuaternion(s.object.quaternion);
        _right.set(1, 0, 0).applyQuaternion(s.object.quaternion);
        _up.set(0, 1, 0).applyQuaternion(s.object.quaternion);
        s._axisAx = _axis.x; s._axisAy = _axis.y; s._axisAz = _axis.z;
        s._axisRx = _right.x; s._axisRy = _right.y; s._axisRz = _right.z;
        s._axisUx = _up.x;   s._axisUy = _up.y;   s._axisUz = _up.z;
        s._axisFt = now;
      } else {
        _axis.set(s._axisAx, s._axisAy, s._axisAz);
        _right.set(s._axisRx, s._axisRy, s._axisRz);
        _up.set(s._axisUx, s._axisUy, s._axisUz);
      }
      _mid.addVectors(_prev, p.mesh.position).multiplyScalar(0.5); // projectile segment midpoint
      _tmp.subVectors(_mid, s.object.position); // midpoint → ship centre
      _proj = _tmp.dot(_axis); // scalar projection onto axis
      _proj = Math.max(-halfLen, Math.min(halfLen, _proj)); // clamp to capsule segment
      _cap.copy(s.object.position).addScaledVector(_axis, _proj); // closest point on axis
      _tmp.subVectors(_mid, _cap); // offset from closest axis point to projectile midpoint
      const dx = _tmp.dot(_right); // local-X component of offset
      const dy = _tmp.dot(_up);   // local-Y component of offset

      // Effective ellipse radius along the offset direction in the local XY plane.
      // Exact for an ellipse: rEff = 1 / sqrt((cx/rx)^2 + (cy/ry)^2) where (cx,cy)
      // is the normalised direction. Guard the degenerate case (offset on the axis,
      // dx≈dy≈0) by falling back to the minor semi-axis.
      const d2 = dx * dx + dy * dy;
      let rEff;
      if (d2 < 1e-8) {
        rEff = Math.min(rx, ry); // on-axis: use minor radius
      } else {
        const invD = 1 / Math.sqrt(d2);
        const cx = dx * invD, cy = dy * invD;   // normalised local-XY direction
        rEff = 1 / Math.sqrt((cx / rx) * (cx / rx) + (cy / ry) * (cy / ry));
      }

      const rr = rEff * DEFENSE.playerHitPadding + PROJ_RADIUS; // padded vs NPCs (§6.1)
      if (!sweptHit(p, _cap, rr)) continue;

      // Facet: attacker aft when the shooter sits behind the target's forward.
      _targetFwd.set(0, 0, -1).applyQuaternion(s.object.quaternion);
      _tmp.subVectors(p.shooterPos, s.object.position);
      const facet = _targetFwd.dot(_tmp) < 0 ? 'aft' : 'fore';

      const events = applyHit(s.state, { damage: p.damage, family: p.wkey, facet, now });
      ctx.emit('npcHit', { ship: s, damage: p.damage });
      for (const ev of events) {
        if (ev.type === 'shieldDown') ctx.emit('shieldDown', { layer: ev.layer, ship: s });
        else if (ev.type === 'engineOut') ctx.emit('engineOut', { ship: s });
        else if (ev.type === 'disabled') ctx.emit('npcDisabled', { ship: s });
        else if (ev.type === 'destroyed') ctx.emit('npcDestroyed', { ship: s });
      }
      spawnFlash(p.mesh.position, p.family);
      return true;
    }
    return false;
  }

  function testPlayerHit(p, now, player, playerObj) {
    if (!player || player.destroyed || !playerObj) return false;
    const rr = PLAYER_HIT_RADIUS + PROJ_RADIUS; // TRUE bounds, no padding (§6.1)
    if (!sweptHit(p, playerObj.position, rr)) return false;

    _targetFwd.set(0, 0, -1).applyQuaternion(playerObj.quaternion);
    _tmp.subVectors(p.shooterPos, playerObj.position);
    const fromAft = _targetFwd.dot(_tmp) < 0;
    const shielded = player.screen > 0 || player.shell > 0;

    const events = applyHit(player, { damage: p.damage, family: p.wkey, facet: fromAft ? 'aft' : 'fore', now });
    // HUD owns all pixels (incl. subtle screen-edge flash on shield hits) — emit only.
    ctx.emit('playerHit', { damage: p.damage, family: p.family, fromAft, shielded });
    for (const ev of events) {
      if (ev.type === 'shieldDown') ctx.emit('shieldDown', { layer: ev.layer, player: true });
      else if (ev.type === 'engineOut') ctx.emit('engineOut', { player: true });
      else if (ev.type === 'destroyed') ctx.emit('playerDestroyed', {}); // save.js owns the reload flow
    }
    spawnFlash(p.mesh.position, p.family);
    return true;
  }

  // ---------- per-frame ----------

  return {
    update(dt) {
      const now = ctx.world.time;
      // Wave 51: a fresh field reuses asteroid ids — reset the mineBlocked
      // throttle so the first refusal in the new system fires immediately.
      for (let i = 0; i < ctx.lastEvents.length; i++) {
        if (ctx.lastEvents[i].type === 'systemLoaded') {
          _lastBlockedId = -1;
          _lastBlockedAt = -1e9;
          break;
        }
      }
      if (ctx.flags.docked) {
        // Station owns the screen while docked: weapons cold, sim frozen.
        hideMiningFx();
        return;
      }
      const player = ctx.player;
      const playerObj = ctx.ship.object;

      // 1. Shared ship-state ticking: shield recharge, heat cooling, engine recovery.
      if (player) tickShipState(player, now, dt);
      for (let i = 0; i < ctx.ships.length; i++) {
        const st = ctx.ships[i]?.state;
        if (st) tickShipState(st, now, dt);
      }

      // 2. NPC fire requests (same-frame events from npc.js, which runs earlier).
      if (playerObj) {
        for (let i = 0; i < ctx.events.length; i++) {
          const e = ctx.events[i];
          if (e.type !== 'npcFire') continue;
          const ship = e.ship;
          if (!ship?.object || !ship.state || ship.state.destroyed || ship.state.disabled) continue;
          spawnNpcShot(ship, e.weapon, playerObj);
        }
      }

      // 3. Player weapons (fire while held, rof-gated, heat-locked §6.3).
      let beamOn = false;
      if (ctx.input.fireHeld && player && !player.destroyed && !player.overheated && playerObj) {
        const wkey = GROUP_WEAPON[ctx.input.weaponGroup] ?? 'cannon';
        if (wkey === 'mining') {
          beamOn = updateMining(dt, playerObj);
        } else if (now >= nextFireAt[wkey]) {
          const w = WEAPONS[wkey];
          nextFireAt[wkey] = now + 1 / w.rof;
          firePlayerGun(wkey, w, playerObj);
        }
      }
      if (!beamOn) hideMiningFx(); // covers destroyed/overheated too (gate above)

      // 4. Projectiles: integrate, then sphere-vs-sphere hit tests.
      for (let i = 0; i < pool.length; i++) {
        const p = pool[i];
        if (!p.active) continue;
        _prev.copy(p.mesh.position); // swept segment start (no tunneling)
        p.mesh.position.addScaledVector(p.vel, dt);
        p.traveled += p.speed * dt;
        if (p.traveled >= p.range) {
          deactivate(p);
          continue;
        }
        const hit = p.fromPlayer ? testNpcHits(p, now) : testPlayerHit(p, now, player, playerObj);
        if (hit) deactivate(p);
      }

      // 5. Impact flashes: grow + fade (per-sprite material, mutated in place).
      for (let i = 0; i < flashes.length; i++) {
        const f = flashes[i];
        if (!f.sprite.visible) continue;
        f.t += dt;
        const k = f.t / f.ttl;
        if (k >= 1) {
          f.sprite.visible = false;
          continue;
        }
        const s = 1.5 + 3 * k;
        f.sprite.scale.set(s, s, 1);
        f.sprite.material.opacity = 1 - k;
      }

      // 6. Impact sparks: ballistic drift + fade, in-place buffer writes.
      // Suppressed under reducedMotion (they animate, so hide them).
      const hideSparks = ctx.settings?.reducedMotion === true;
      for (let i = 0; i < sparks.length; i++) {
        const s = sparks[i];
        if (!s.active) continue;
        s.t += dt;
        const k = s.t / SPARK_TTL;
        if (k >= 1) {
          s.active = false;
          s.pts.visible = false;
          continue;
        }
        if (hideSparks) {
          s.pts.visible = false;
          continue;
        }
        s.pts.visible = true;
        for (let j = 0; j < s.arr.length; j++) s.arr[j] += s.vel[j] * dt;
        s.pts.geometry.attributes.position.needsUpdate = true;
        s.pts.material.opacity = 1 - k;
      }

      // 7. Mining chips + dust (wave 51): the pools keep integrating after
      // the beam turns off so bursts finish naturally rather than vanishing.
      // Under reducedMotion nothing new emits (updateMining gates it) and
      // live particles expire hidden instead of moving.
      const hideMineFx = ctx.settings?.reducedMotion === true;
      tickMinePool(mineSparks, dt, hideMineFx);
      tickMinePool(mineDust, dt, hideMineFx);
    },
  };
}
