import * as THREE from 'three';
import { spawnPod } from '../game/pods.js';

/**
 * Flee wakes + wreck-field discovery (wave 30; §29 product-test line:
 * "followed its wake after it ran. The trail led to a wreck field").
 *
 * WAKE TRAILS: when a live ship's ai.mode flips to 'flee' (npc.js — a
 * pirate/ace breaking off), it sheds a lingering wake so the player can
 * chase the runner's path after it despawns. Pooled world-space
 * THREE.Points ring buffer (positions/colors/life preallocated at init,
 * aged and faded in place via the color buffer — additive blending, so
 * black = gone), mirroring the player afterburner trail in ship.js but
 * long-lived: WAKE_LIFE 45 s vs the trail's 0.9 s, followable across a
 * system. World-space, NOT parented to the ship — the trail outlives the
 * despawn. Emission is throttled to WAKE_EMIT_HZ per fleeing ship via a
 * module-scope WeakMap of per-ship timers (entries die with the ship;
 * set only on first sight = spawn-event time, never per frame).
 * frustumCulled = false — points roam. reducedMotion
 * (ctx.settings.reducedMotion) → no emission and the points stay hidden,
 * the same contract as the ship.js trail.
 *
 * SITE DISCOVERY: npc.js (parallel worker) stamps rec.wakeSite =
 * { position: [x, y, z], found: false } — JSON-plain, save.js-safe — on a
 * record when its pirate/ace ENTERS flee mode. This module NEVER stamps
 * it; it only consumes. Throttled to WAKE_SCAN_HZ, ctx.world.records (the
 * current system's bank — a site's coordinates are only meaningful in its
 * own system) is scanned for unfound sites; when the player ship comes
 * within WAKE_SITE_DISCOVERY units, the site is marked found (JSON-plain
 * mutation only), 2–3 salvage pods are spawned at the site a few units
 * apart (spawnPod, same call shape as the hail.js jettison), Echo voices
 * the discovery, and the one-time 'firstWakeSite' milestone fires under
 * the ctx.world.milestones.includes guard (hail.js/station.js pattern).
 * Found sites never retrigger — the flag persists through save.
 *
 * Ownership: adds one Points object + discovery pods to ctx.scene,
 * mutates only rec.wakeSite.found on world records, writes nothing else
 * shared. update() performs ZERO per-frame allocation — scratch vectors
 * and buffers are module-scope; allocation happens only at init and at
 * discovery (pod spawn is event time).
 */

// Wake trail: pooled ring buffer, wake-blue #4a9fd8 (hud.css palette
// role), faded via the color buffer (additive: black = gone).
const WAKE_COUNT = 600; // ring-buffer capacity (shared across all runners)
const WAKE_LIFE = 45; // s per point — followable, vs the player trail's 0.9
const WAKE_EMIT_HZ = 10; // emission throttle per fleeing ship
const WAKE_TAIL = 3.0; // units behind ship center (nose = -Z, npc.js fwd)
const WAKE_SPREAD = 0.8; // emission jitter
const WAKE_R = 0x4a / 255; // #4a9fd8 wake-blue
const WAKE_G = 0x9f / 255;
const WAKE_B = 0xd8 / 255;

// Site discovery (§29 "the trail led to a wreck field").
const WAKE_SITE_DISCOVERY = 120; // u — player proximity that finds a site
const WAKE_SCAN_HZ = 4; // records-scan throttle
const SITE_POD_SPREAD = 6; // u — salvage pods scattered around the site

// Module-scope scratch — zero per-frame allocation (ship.js convention).
const _fwd = new THREE.Vector3();
const _tail = new THREE.Vector3();
const _podPos = new THREE.Vector3();
const NEG_Z = new THREE.Vector3(0, 0, -1); // npc.js nose convention

/** Small soft radial dot sprite for the wake points (ship.js copy). */
function makeSoftDotTexture() {
  const size = 32;
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = size;
  const g = canvas.getContext('2d');
  const grad = g.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  grad.addColorStop(0, 'rgba(255,255,255,1)');
  grad.addColorStop(0.4, 'rgba(255,255,255,0.55)');
  grad.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = grad;
  g.fillRect(0, 0, size, size);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

export function initWakes(ctx) {
  // --- Pooled wake Points ring buffer, built once. Positions/colors/life
  // preallocated; per-frame work is in-place buffer writes + needsUpdate.
  const wakeGeo = new THREE.BufferGeometry();
  const wakePos = new Float32Array(WAKE_COUNT * 3);
  const wakeCol = new Float32Array(WAKE_COUNT * 3); // starts black = gone
  wakeGeo.setAttribute('position', new THREE.BufferAttribute(wakePos, 3));
  wakeGeo.setAttribute('color', new THREE.BufferAttribute(wakeCol, 3));
  const wakeLife = new Float32Array(WAKE_COUNT); // >0 = live
  const wakePoints = new THREE.Points(
    wakeGeo,
    new THREE.PointsMaterial({
      size: 1.1,
      map: makeSoftDotTexture(),
      vertexColors: true,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    }),
  );
  wakePoints.frustumCulled = false; // points roam; skip stale culling
  wakePoints.visible = false;
  ctx.scene.add(wakePoints);
  let wakeHead = 0; // ring-buffer write cursor

  // Per-ship emission timers, keyed by the live ship object. WeakMap so
  // entries die with traffic.js despawns; .set runs only on first sight
  // of a fleeing ship (spawn-event time), never per frame.
  const emitTimers = new WeakMap();

  let scanT = 0; // site-discovery throttle accumulator

  return {
    update(dt) {
      const reducedMotion = ctx.settings?.reducedMotion === true;

      // --- Wake emission: fleeing ships shed points at the tail. ---
      let wakeTouched = false;
      if (!reducedMotion) {
        const step = 1 / WAKE_EMIT_HZ;
        for (let i = 0; i < ctx.ships.length; i++) {
          const live = ctx.ships[i];
          if (live?.ai?.mode !== 'flee' || live.state?.destroyed || !live.object) continue;
          let t = emitTimers.get(live) ?? 0;
          t -= dt;
          if (t <= 0) {
            t = step;
            _fwd.copy(NEG_Z).applyQuaternion(live.object.quaternion);
            _tail.copy(live.object.position).addScaledVector(_fwd, -WAKE_TAIL);
            const n = wakeHead;
            wakeHead = (wakeHead + 1) % WAKE_COUNT;
            const n3 = n * 3;
            wakePos[n3] = _tail.x + (Math.random() - 0.5) * WAKE_SPREAD;
            wakePos[n3 + 1] = _tail.y + (Math.random() - 0.5) * WAKE_SPREAD;
            wakePos[n3 + 2] = _tail.z + (Math.random() - 0.5) * WAKE_SPREAD;
            wakeLife[n] = WAKE_LIFE;
            wakeTouched = true;
          }
          emitTimers.set(live, t);
        }
      }

      // --- Age + fade in place (additive: black = gone). ---
      let wakeLive = 0;
      for (let i = 0; i < WAKE_COUNT; i++) {
        if (wakeLife[i] <= 0) continue;
        wakeLife[i] -= dt;
        const i3 = i * 3;
        if (wakeLife[i] <= 0) {
          wakeCol[i3] = 0;
          wakeCol[i3 + 1] = 0;
          wakeCol[i3 + 2] = 0;
          wakeTouched = true;
          continue;
        }
        const f = wakeLife[i] / WAKE_LIFE;
        wakeCol[i3] = WAKE_R * f;
        wakeCol[i3 + 1] = WAKE_G * f;
        wakeCol[i3 + 2] = WAKE_B * f;
        wakeLive++;
      }
      wakePoints.visible = wakeLive > 0 && !reducedMotion;
      if (wakeTouched) {
        wakeGeo.attributes.position.needsUpdate = true;
        wakeGeo.attributes.color.needsUpdate = true;
      }

      // --- Site discovery: throttled scan for unfound wakeSites (stamped
      // by npc.js on flee entry; this module never stamps). ---
      scanT -= dt;
      if (scanT > 0) return;
      scanT = 1 / WAKE_SCAN_HZ;
      if (ctx.flags.docked || ctx.gate?.jumping) return;
      const pObj = ctx.ship?.object;
      if (!pObj) return;
      const px = pObj.position.x;
      const py = pObj.position.y;
      const pz = pObj.position.z;
      const records = ctx.world.records;
      for (let i = 0; i < records.length; i++) {
        const site = records[i].wakeSite;
        if (!site || site.found) continue;
        const sp = site.position;
        if (Math.hypot(px - sp[0], py - sp[1], pz - sp[2]) > WAKE_SITE_DISCOVERY) continue;

        // Found: JSON-plain mutation only (save.js serializes records).
        site.found = true;

        // 2–3 salvage pods a few units apart (hail.js jettison call shape;
        // spawnPod copies the position, so the scratch vector is safe).
        const pods = 2 + (Math.random() < 0.5 ? 1 : 0);
        for (let p = 0; p < pods; p++) {
          _podPos.set(
            sp[0] + (Math.random() - 0.5) * SITE_POD_SPREAD,
            sp[1] + (Math.random() - 0.5) * SITE_POD_SPREAD,
            sp[2] + (Math.random() - 0.5) * SITE_POD_SPREAD,
          );
          spawnPod(ctx, [{ commodity: 'refinedMetals', units: 2 }], _podPos);
        }

        ctx.emit('commLine', { text: 'The trail ends in a wreck field.', from: 'Echo' });
        // First time ever: hail.js/station.js milestones-guard pattern.
        if (!ctx.world.milestones.includes('firstWakeSite')) {
          ctx.world.milestones.push('firstWakeSite');
          ctx.emit('milestone', { id: 'firstWakeSite', line: 'You followed a runner home.' });
        }
      }
    },
  };
}
