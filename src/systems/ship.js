import * as THREE from 'three';
import { createShipState } from '../game/state.js';

/**
 * Ship system — a LIVING ship: grown, not built. Swims through space like a
 * manta/whale/amoeba hybrid. The hull is a sculpted sphere deformed per-frame
 * by four layered motion fields, all of which run forever — the ship is never
 * still, even at zero throttle:
 *
 *   1. Swim wave  — whale-like traveling wave along the spine, growing toward
 *                   the tail; frequency/amplitude scale with speed but have a
 *                   nonzero idle floor.
 *   2. Wing flap  — manta-like flap of the wing membranes, tips lagging root.
 *   3. Breathing  — slow (~4 s) radial expansion/contraction; the emissive
 *                   veins brighten on the exhale.
 *   4. Heartbeat  — subtle ~1.1 Hz thump layered on the breath + vein glow.
 *   No propulsion organs: thrust reads as a bioluminescent surge through the
 *   vein network and a faster, deeper swim stroke. No nozzle, no glow pods.
 *   Plus a low-amplitude amoeba shimmer on the skin and an idle hover bob
 *   (fades out with speed) applied to the flesh child so the flight transform
 *   and chase cam are unaffected. Mood (ctx.bio.mood, §14.6) modulates the
 *   swim/flap rate, vein emissive tint/intensity, and idle jitter.
 *
 * FLIGHT (doc §5): fun-first, non-Newtonian. The ship steers toward the
 * mouse reticle (steerX/steerY), auto-banking into turns (visual roll on the
 * flesh child — there is no player roll axis). Steering authority falls with
 * speed. Velocity eases toward forward × (creep + throttle × (maxSpeed −
 * creep)) with an acceleration clamp plus artificial drag so she settles in
 * ~stopTime at zero throttle. Signature verbs: afterburner (§5.2, ×2 for 6 s,
 * 8 s cooldown, FOV kick §5.4) and vector-hold drift (§5.2, 4 s max, 6 s
 * cooldown, velocity re-aligns to facing over 0.8 s on release). Lateral/
 * vertical strafe rides along the ship's right/up axes.
 *
 * Owns ctx.ship (object/velocity/speed/burner/drift state) and ctx.player
 * (state record via createShipState); positions ctx.camera every frame.
 * Ship nose points along local -Z; the chase cam sits behind at local
 * (0, 4, 12). All scratch objects are module/init-scope — update() performs
 * zero allocations (vertex data is mutated in place).
 */

// Module-scope scratch (reused every frame; no per-frame allocation).
const _forward = new THREE.Vector3();
const _right = new THREE.Vector3();
const _up = new THREE.Vector3();
const _targetVelocity = new THREE.Vector3();
const _delta = new THREE.Vector3();
const _realignFrom = new THREE.Vector3();
const _camAnchor = new THREE.Vector3();
const _camOffset = new THREE.Vector3(0, 4, 12); // ship-local: behind + above
const _noseOffset = new THREE.Vector3(0, 0.35, -1.7); // first-person eye point
const _lookTarget = new THREE.Vector3();

const CAMERA_LERP_RATE = 6; // 1/s — frame-rate independent smoothing
const LOOK_AHEAD = 25; // units in front of the ship the camera aims at
const FOV_LERP_RATE = 5; // 1/s — afterburner FOV kick easing (§5.4)

// Flight feel (§5.1/§5.3 light row).
const MIN_AUTHORITY = 0.15; // steering never fully dies, even at burn speed
const AUTOBANK_MAX = 0.55; // rad of visual roll at full deflection (§5.1)
const AUTOBANK_LERP_RATE = 7; // 1/s
const ENGINE_OUT_THRUST = 0.3; // §6.5: engine-out caps thrust at 30%

// Living-motion tuning.
const IDLE_SWIM_HZ = 0.5; // flap frequency at rest — the ship never stops
const CRUISE_SWIM_HZ = 2.3; // flap frequency at max speed
const BREATH_HZ = 0.25; // ~4 s breath cycle
const HEART_HZ = 1.1; // resting heartbeat

// Mood visuals (§14.6): swim/flap rate multiplier, vein emissive tint +
// intensity multiplier, idle jitter amplitude. Serene is the baseline look.
const MOOD_VISUALS = {
  serene: { rate: 1.0, tint: 0xffffff, glow: 1.0, jitter: 0 },
  keen: { rate: 1.25, tint: 0xffffff, glow: 1.25, jitter: 0 }, // brighter, quicker
  anxious: { rate: 1.0, tint: 0xffb35c, glow: 1.0, jitter: 1 }, // amber + jitters
  pained: { rate: 0.6, tint: 0xffffff, glow: 0.6, jitter: 0 }, // slow, dim
  feral: { rate: 1.5, tint: 0xff5533, glow: 1.1, jitter: 0 }, // ember-red, frantic
};
const ANXIOUS_JITTER_AMP = 0.05; // world units of idle flesh tremor

/** Bioluminescent vein texture: branching random-walk lines on dark flesh. */
function makeVeinTexture() {
  const w = 512;
  const h = 256;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const g = canvas.getContext('2d');
  g.fillStyle = '#000';
  g.fillRect(0, 0, w, h);
  g.lineCap = 'round';
  g.shadowBlur = 6;

  let seed = 1337;
  const rand = () => {
    seed = (seed * 16807) % 2147483647; // deterministic
    return seed / 2147483647;
  };

  for (let vein = 0; vein < 42; vein++) {
    const magenta = vein % 6 === 0;
    const color = magenta ? '#c86bff' : '#46ffe0';
    g.strokeStyle = color;
    g.shadowColor = color;
    g.lineWidth = 1 + rand() * 1.6;
    g.globalAlpha = 0.35 + rand() * 0.5;

    let x = rand() * w;
    let y = rand() * h;
    let angle = rand() * Math.PI * 2;
    g.beginPath();
    g.moveTo(x, y);
    const segments = 24 + (rand() * 40) | 0;
    for (let s = 0; s < segments; s++) {
      angle += (rand() - 0.5) * 0.9;
      x += Math.cos(angle) * 7;
      y += Math.sin(angle) * 7;
      // wrap so veins flow across UV seams
      if (x < 0) x += w;
      if (x >= w) x -= w;
      if (y < 0) y += h;
      if (y >= h) y -= h;
      g.lineTo(x, y);
    }
    g.stroke();
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  return tex;
}

/**
 * Sculpt a sphere into a manta/whale hull (nose -Z, tail +Z) and return the
 * geometry plus per-vertex animation metadata (base positions, normalized
 * spine coordinate, wingness factor). Animation then mutates positions
 * relative to the base every frame.
 */
function makeLivingHull() {
  const geo = new THREE.SphereGeometry(1, 64, 40);
  const pos = geo.attributes.position;
  const count = pos.count;
  const base = new Float32Array(pos.array); // pristine copy
  const zNorm = new Float32Array(count); // 0 at nose → 1 at tail
  const wingness = new Float32Array(count); // 0 on spine → 1 at wingtips

  let zMin = Infinity;
  let zMax = -Infinity;

  for (let i = 0; i < count; i++) {
    const i3 = i * 3;
    let x = base[i3];
    let y = base[i3 + 1];
    let z = base[i3 + 2];

    // Elongate into a spine.
    z *= 2.1;
    // Manta disc: widen mid-body, keep nose and tail narrow.
    const mid = Math.exp(-(z * z) * 0.35);
    x *= 1 + 2.3 * mid;
    // Whip tail: compress width hard past z=1.2.
    if (z > 1.2) x *= Math.exp(-(z - 1.2) * 1.6);
    // Flatten vertically; slight dorsal camber so the back is rounded.
    y *= 0.3;
    y += 0.16 * Math.exp(-(x * x * 0.4 + z * z * 0.3)) * (y > 0 ? 1 : 0.4);
    // Head bulge near the nose.
    if (z < -1.2) y += 0.08 * Math.exp(-((z + 1.6) * (z + 1.6)) * 2);

    base[i3] = x;
    base[i3 + 1] = y;
    base[i3 + 2] = z;
    if (z < zMin) zMin = z;
    if (z > zMax) zMax = z;
  }

  const zSpan = zMax - zMin;
  for (let i = 0; i < count; i++) {
    const i3 = i * 3;
    zNorm[i] = (base[i3 + 2] - zMin) / zSpan;
    const w = (Math.abs(base[i3]) - 0.7) / 2.3;
    wingness[i] = Math.pow(Math.min(Math.max(w, 0), 1), 1.5);
  }

  pos.array.set(base);
  pos.needsUpdate = true;
  geo.computeVertexNormals();
  return { geo, base, zNorm, wingness, count };
}

export function initShip(ctx) {
  const { scene, camera, config, input, ship } = ctx;
  const shipCfg = config.ship;

  // --- Living hull (nose toward local -Z) ---
  const root = new THREE.Object3D();
  const flesh = new THREE.Object3D(); // child: idle bob/sway + auto-bank live here, not on root
  root.add(flesh);

  const { geo, base, zNorm, wingness, count } = makeLivingHull();
  const veinTex = makeVeinTexture();
  const fleshMat = new THREE.MeshPhysicalMaterial({
    color: 0x2b2145, // deep violet flesh
    roughness: 0.5,
    metalness: 0.05,
    clearcoat: 0.7, // wet, organic sheen
    clearcoatRoughness: 0.35,
    emissive: 0xffffff,
    emissiveMap: veinTex, // bioluminescent veins
    emissiveIntensity: 0.8,
  });
  const hull = new THREE.Mesh(geo, fleshMat);
  flesh.add(hull);

  // Sensory organs: two glow eyes near the nose.
  const eyeMat = new THREE.MeshBasicMaterial({ color: 0x9ffff0 });
  const eyeGeo = new THREE.SphereGeometry(0.09, 10, 8);
  for (const side of [-1, 1]) {
    const eye = new THREE.Mesh(eyeGeo, eyeMat);
    eye.position.set(side * 0.42, 0.14, -1.45);
    flesh.add(eye);
  }

  // No propulsion organs at all — thrust reads as a whole-body
  // bioluminescent surge through the veins. A soft under-body glow keeps the
  // flesh lit far from the sun — deliberately NOT a nozzle/engine flare.
  const underLight = new THREE.PointLight(0x40ffd8, 20, 28);
  underLight.position.set(0, -0.9, 0.4);
  flesh.add(underLight);

  root.position.copy(config.world.shipSpawn);
  scene.add(root);

  ship.object = root;
  ship.velocity.set(0, 0, 0);
  ship.speed = 0;

  // Player ship state record (§5.3 light row; combat.js/state.js mutate it).
  ctx.player = createShipState('light');

  const baseFov = camera.fov;
  let cameraSnapped = false; // snap (not lerp) on the first frame
  let swimPhase = 0; // accumulated (frequency varies with speed + mood)
  let bankAngle = 0; // smoothed auto-bank visual roll
  let burnerEndsAt = 0; // ctx.world.time when the current burn cuts out
  let driftEndsAt = 0; // ctx.world.time when vector-hold force-releases
  let realigning = false; // drift release: swinging velocity back to facing
  let realignT = 0; // seconds into the re-align window
  let appliedMood = null; // last mood pushed into the material

  const posAttr = geo.attributes.position;
  const arr = posAttr.array;

  return {
    update(dt) {
      // Player destroyed: save.js owns the death/reload flow — emit nothing,
      // move nothing (combat.js emits 'playerDestroyed').
      if (ctx.player?.destroyed) return;

      const time = ctx.world.time;
      const docked = ctx.flags.docked;
      const mood = MOOD_VISUALS[ctx.bio.mood] ?? MOOD_VISUALS.serene;

      // Engine-out (§6.5): thrust capped at 30% while the engine is down.
      const engineOut = ctx.player?.engineOut === true;
      const thrustCap = engineOut ? ENGINE_OUT_THRUST : 1;

      // ======================= FLIGHT =======================
      if (!docked) {
        // --- Afterburner state machine (§5.2): tap Space → ×2 for burnTime,
        // then cooldown before the next burn is allowed.
        if (
          input.afterburnerPressed &&
          !ship.burnerActive &&
          time >= ship.burnerReadyAt
        ) {
          ship.burnerActive = true;
          input.fullStop = false; // burn is a thrust command — cancels full stop
          burnerEndsAt = time + shipCfg.afterburner.burnTime;
        }
        if (ship.burnerActive && time >= burnerEndsAt) {
          ship.burnerActive = false;
          ship.burnerReadyAt = time + shipCfg.afterburner.cooldown;
        }
        const burnMult = ship.burnerActive ? shipCfg.afterburner.multiplier : 1;

        // --- Vector-hold drift (§5.2): while held (and off cooldown) the
        // velocity vector is frozen while facing turns freely. On release
        // (or the 4 s cap) velocity re-aligns to facing over `realign` s.
        if (
          !ship.driftActive &&
          !realigning &&
          input.driftHeld &&
          time >= ship.driftReadyAt
        ) {
          ship.driftActive = true;
          driftEndsAt = time + shipCfg.drift.duration;
        }
        if (ship.driftActive && (!input.driftHeld || time >= driftEndsAt)) {
          ship.driftActive = false;
          ship.driftReadyAt = time + shipCfg.drift.cooldown;
          realigning = true;
          realignT = 0;
          _realignFrom.copy(ship.velocity);
        }

        // --- Steering: yaw/pitch toward the reticle, authority falling with
        // speed (§5.1). steerX>0 = right → rotateY negative; steerY>0 = up
        // → rotateX positive (pitch>0 = nose up). No roll axis.
        const authority =
          Math.max(
            MIN_AUTHORITY,
            1 - (0.5 * ship.speed) / shipCfg.maxSpeed,
          ) * ctx.bio.turnFactor;
        const rs = shipCfg.rotationSpeed * authority * dt;
        if (input.steerY) root.rotateX(input.steerY * rs);
        if (input.steerX) root.rotateY(-input.steerX * rs);

        // --- Velocity.
        _forward.set(0, 0, -1).applyQuaternion(root.quaternion);
        if (ship.driftActive) {
          // Vector-hold: velocity keeps its vector; facing is free.
        } else if (realigning) {
          // Swing the held vector back onto the nose over `realign` seconds,
          // preserving magnitude.
          realignT += dt;
          const k = Math.min(realignT / shipCfg.drift.realign, 1);
          const ease = k * k * (3 - 2 * k); // smoothstep
          _targetVelocity.copy(_forward).multiplyScalar(_realignFrom.length());
          ship.velocity.copy(_realignFrom).lerp(_targetVelocity, ease);
          if (k >= 1) realigning = false;
        } else {
          // Ease toward forward × (creep + throttle × (maxSpeed − creep)),
          // plus strafe along the ship's right/up axes (§5.1). Full stop
          // (double-tap F) overrides the creep floor — she holds station.
          const throttleEff = input.throttle * thrustCap;
          const fwdSpeed = input.fullStop
            ? 0
            : (shipCfg.creep + throttleEff * (shipCfg.maxSpeed - shipCfg.creep)) *
              ctx.bio.speedFactor *
              burnMult;
          _right.set(1, 0, 0).applyQuaternion(root.quaternion);
          _up.set(0, 1, 0).applyQuaternion(root.quaternion);
          _targetVelocity
            .copy(_forward)
            .multiplyScalar(fwdSpeed)
            .addScaledVector(_right, input.strafeX * shipCfg.strafeSpeed)
            .addScaledVector(_up, input.strafeY * shipCfg.strafeSpeed);

          _delta.subVectors(_targetVelocity, ship.velocity);
          const deltaLen = _delta.length();
          const maxStep = shipCfg.acceleration * dt;
          if (deltaLen > maxStep) _delta.multiplyScalar(maxStep / deltaLen);
          ship.velocity.add(_delta);

          // Artificial drag at (near) zero throttle: settle in ~stopTime
          // instead of drifting forever (§5.1, §5.3 light row).
          if (input.throttle < 0.02) {
            ship.velocity.multiplyScalar(Math.exp(-shipCfg.damping * dt));
          }
        }

        // --- Integrate position; publish speed for the HUD.
        root.position.addScaledVector(ship.velocity, dt);
        ship.speed = ship.velocity.length();

        // --- Auto-bank (§5.1): visual roll on the flesh child, proportional
        // to yaw deflection. Not a player axis — pure presentation.
        const bankTarget = -input.steerX * AUTOBANK_MAX * Math.min(authority, 1);
        bankAngle += (bankTarget - bankAngle) * (1 - Math.exp(-AUTOBANK_LERP_RATE * dt));
      } else {
        // Docked: park — no thrust, drift, or steering; hold position.
        ship.velocity.set(0, 0, 0);
        ship.speed = 0;
        ship.driftActive = false;
        ship.burnerActive = false;
        realigning = false;
        bankAngle += (0 - bankAngle) * (1 - Math.exp(-AUTOBANK_LERP_RATE * dt));
        _forward.set(0, 0, -1).applyQuaternion(root.quaternion);
      }

      // ================= LIVING MOTION =================
      const t = ctx.elapsed;
      const speedNorm = Math.min(ship.speed / shipCfg.maxSpeed, 1.5);

      // Swim wave: frequency/amplitude scale with speed, never reach zero.
      // Mood paces the stroke (§14.6): keen/feral faster, pained slower.
      const swimHz =
        (IDLE_SWIM_HZ + (CRUISE_SWIM_HZ - IDLE_SWIM_HZ) * Math.min(speedNorm, 1)) *
        mood.rate;
      swimPhase += dt * Math.PI * 2 * swimHz;
      const bodyAmp = 0.1 + 0.22 * speedNorm;
      const flapAmp = 0.16 + 0.5 * speedNorm;

      // Breath + heartbeat (always on).
      const breathPhase = t * Math.PI * 2 * BREATH_HZ;
      const breath = Math.sin(breathPhase);
      const heart = Math.pow(Math.max(Math.sin(t * Math.PI * 2 * HEART_HZ), 0), 6);
      const radialScale = 1 + 0.035 * breath + 0.02 * heart;

      // Deform vertices in place: breath/heart scale → spine wave → wing flap
      // → amoeba shimmer.
      for (let i = 0; i < count; i++) {
        const i3 = i * 3;
        const bx = base[i3];
        const by = base[i3 + 1];
        const bz = base[i3 + 2];

        let x = bx * radialScale;
        let y = by * radialScale;
        const z = bz * radialScale;

        const zn = zNorm[i];
        x += bodyAmp * zn * zn * Math.sin(6.9 * zn - swimPhase);

        const w = wingness[i];
        if (w > 0) y += flapAmp * w * Math.sin(swimPhase - 1.4 * Math.abs(bx));

        y += 0.03 * Math.sin(1.7 * bx + t * 0.9) * Math.sin(2.3 * bz - t * 1.3);

        arr[i3] = x;
        arr[i3 + 1] = y;
        arr[i3 + 2] = z;
      }
      posAttr.needsUpdate = true;
      geo.computeVertexNormals();

      // Vein tint follows mood (§14.6) — set only on change.
      if (appliedMood !== ctx.bio.mood) {
        appliedMood = ctx.bio.mood;
        fleshMat.emissive.setHex(mood.tint);
      }

      // Veins brighten on the exhale, thump with the heartbeat (mood-scaled).
      fleshMat.emissiveIntensity = (0.65 + 0.25 * breath + 0.35 * heart) * mood.glow;

      // Idle hover: gentle bob + sway while (nearly) stationary, fading out
      // with speed. Anxious adds a tremor (§14.6). Applied to the flesh child
      // so flight + camera are clean.
      const idleWeight = 1 - Math.min(ship.speed / 3, 1);
      flesh.position.y = Math.sin(t * 0.8) * 0.12 * idleWeight;
      const jitter = ANXIOUS_JITTER_AMP * mood.jitter * idleWeight;
      flesh.position.x = jitter * Math.sin(t * 37.3) * Math.sin(t * 21.7);
      flesh.position.z = jitter * Math.sin(t * 29.1 + 1.3);
      flesh.rotation.z =
        bankAngle + Math.sin(t * 0.5) * 0.03 * idleWeight; // auto-bank + idle sway

      // Thrust feedback: the whole vein network surges brighter — propulsion
      // as metabolism, not machinery.
      const thrust =
        input.throttle *
        thrustCap *
        (ship.burnerActive ? shipCfg.afterburner.multiplier : 1);
      fleshMat.emissiveIntensity += 0.6 * Math.min(thrust, 1);
      underLight.intensity = 5 + thrust * 22 + heart * 5;
      // ================================================

      // --- Afterburner FOV kick (§5.4): +12° while burning, ease back after.
      const fovTarget = baseFov + (ship.burnerActive ? shipCfg.fovKick : 0);
      if (Math.abs(camera.fov - fovTarget) > 0.01) {
        camera.fov += (fovTarget - camera.fov) * (1 - Math.exp(-FOV_LERP_RATE * dt));
        camera.updateProjectionMatrix();
      }

      // --- Camera: first-person (cockpitless, §5.4) hides the flesh and sits
      // at the nose with no lag; chase cam lerps toward a ship-local anchor
      // and looks ahead.
      if (ctx.flags.firstPerson) {
        flesh.visible = false;
        _camAnchor.copy(_noseOffset).applyQuaternion(root.quaternion).add(root.position);
        camera.position.copy(_camAnchor);
        camera.quaternion.copy(root.quaternion);
      } else {
        flesh.visible = true;
        _camAnchor.copy(_camOffset).applyQuaternion(root.quaternion).add(root.position);
        if (!cameraSnapped) {
          camera.position.copy(_camAnchor);
          cameraSnapped = true;
        } else {
          camera.position.lerp(_camAnchor, 1 - Math.exp(-CAMERA_LERP_RATE * dt));
        }
        _lookTarget.copy(_forward).multiplyScalar(LOOK_AHEAD).add(root.position);
        camera.lookAt(_lookTarget);
      }
    },
  };
}
