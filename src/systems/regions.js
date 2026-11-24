import * as THREE from 'three';
import { SYSTEMS } from '../game/state.js';
import { styleFor } from '../game/faction-style.js';
import { withoutGlobalRandom } from '../game/random-scope.js';
import { regionsOf, lanesOf, lanePoints, CORRIDOR_RADIUS } from '../game/regions.js';

/**
 * In-system sub-regions + transit-lane presentation — issue #355 (P5b).
 *
 * Deepfield-family scenery for the optional regions/lanes records on a system
 * def. Built from EXISTING builders only (Points far-scenery fields, beacon
 * lights, a LineSegments lane chain); no new mesh vocabulary, no collision,
 * no AI, no save data, no persistent field, no ctx field, no new event.
 *
 * Rebuilds from SYSTEMS[to] on 'systemLoaded' and disposes every
 * geometry/material it owns first — nothing survives a jump. Deterministic:
 * a mulberry32 stream seeded from def.worldSeed; no Math.random, no
 * wall-clock input. update() allocates nothing.
 *
 * Budget: <= 5 draw calls and 0 triangles (Points/lines only). The build
 * publishes the measured counts on root.userData.regions for tests.
 */

const RNG_SALT = 0x5b350000;
// Corridor beacons ride slightly above the lane segment so a plane-level
// camera reads them as a chain, never edge-on (deepfield lane lesson).
const BEACON_LIFT = 60;

function makeRng(seed) {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Remove the subtree from the scene and dispose every owned resource once. */
function disposeObject(root) {
  if (!root) return;
  const geometries = new Set();
  const materials = new Set();
  root.traverse((obj) => {
    if (obj.geometry) geometries.add(obj.geometry);
    const mats = Array.isArray(obj.material) ? obj.material : obj.material ? [obj.material] : [];
    for (const mat of mats) if (mat) materials.add(mat);
  });
  for (const geo of geometries) geo.dispose();
  for (const mat of materials) mat.dispose();
  root.parent?.remove(root);
}

/** Per-kind scenery tint so a region reads as its kind at distance. */
const KIND_TINT = {
  outpost: 0xffd27a,
  field: 0x9aa7b8,
  wreck: 0xa03434,
  anomaly: 0x7fe0a8,
};

export function initRegions(ctx) {
  let root = null;

  function build(def) {
    // Scene construction consumes global Math.random via THREE UUIDs; keep the
    // harness's seeded content stream byte-identical.
    withoutGlobalRandom(() => {
    const regions = regionsOf(def);
    if (!regions.length) return;
    root = new THREE.Group();
    root.name = 'regions';
    root.position.copy(ctx.config.world.sunPosition);
    ctx.scene.add(root);

    const rng = makeRng(RNG_SALT + ((def.worldSeed | 0) >>> 0));
    const style = styleFor(def.faction);
    const accent = style?.accent ?? 0x9aa7b8;
    const beacon = style?.beacon ?? 0xffdca0;
    const counts = {
      system: def.id,
      worldSeed: def.worldSeed,
      regions: regions.length,
      lanes: 0,
      sceneryPoints: 0,
      beaconNodes: 0,
      drawCalls: 0,
      triangles: 0,
    };

    // --- per-region far-scenery Points field (one draw call each) ---------
    for (let i = 0; i < regions.length; i++) {
      const region = regions[i];
      if (!region || !Array.isArray(region.center)) continue;
      const pointCount = 40 + Math.floor(rng() * 50);
      const positions = new Float32Array(pointCount * 3);
      const colors = new Float32Array(pointCount * 3);
      const color = new THREE.Color();
      const tint = new THREE.Color(KIND_TINT[region.kind] ?? accent);
      const [cx, cy, cz] = region.center;
      for (let k = 0; k < pointCount; k++) {
        const a = rng() * Math.PI * 2;
        const r = Math.sqrt(rng()) * (region.radius ?? 300);
        positions[k * 3 + 0] = cx + Math.cos(a) * r;
        positions[k * 3 + 1] = cy + (rng() - 0.5) * (region.radius ?? 300) * 0.3;
        positions[k * 3 + 2] = cz + Math.sin(a) * r;
        color.copy(tint).multiplyScalar(0.6 + rng() * 0.4);
        colors[k * 3 + 0] = color.r;
        colors[k * 3 + 1] = color.g;
        colors[k * 3 + 2] = color.b;
      }
      const geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
      geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
      const points = new THREE.Points(geo, new THREE.PointsMaterial({
        size: 2.6,
        sizeAttenuation: true,
        vertexColors: true,
        transparent: true,
        opacity: 0.85,
        depthWrite: false,
      }));
      points.name = 'region-scenery-' + i;
      points.userData = { regionId: region.id ?? '', kind: region.kind ?? '', count: pointCount };
      points.frustumCulled = true;
      root.add(points);
      counts.sceneryPoints += pointCount;
      counts.drawCalls += 1;
    }

    // --- lane chain: one LineSegments + beacon Points for ALL lanes --------
    const lanes = lanesOf(def);
    const segments = [];
    const beaconPos = [];
    const beaconCol = [];
    const bColor = new THREE.Color();
    for (const lane of lanes) {
      const pts = lanePoints(def, lane);
      if (!pts) continue;
      const [a, b] = [pts.a, pts.b];
      segments.push(a[0], a[1], a[2], b[0], b[1], b[2]);
      counts.lanes += 1;
      // Corridor-width beacon nodes strung along the lane: the volume's
      // affordance at distance (CORRIDOR_RADIUS hints the capsule scale).
      const nodeCount = 6;
      for (let k = 0; k < nodeCount; k++) {
        const t = (k + 0.5) / nodeCount;
        const jitter = (rng() - 0.5) * CORRIDOR_RADIUS * 0.4;
        beaconPos.push(
          a[0] + (b[0] - a[0]) * t,
          a[1] + (b[1] - a[1]) * t + BEACON_LIFT,
          a[2] + (b[2] - a[2]) * t + jitter,
        );
        bColor.set(k % 3 === 0 ? beacon : accent).multiplyScalar(0.7 + rng() * 0.3);
        beaconCol.push(bColor.r, bColor.g, bColor.b);
        counts.beaconNodes += 1;
      }
    }
    if (segments.length) {
      const laneGeo = new THREE.BufferGeometry();
      laneGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(segments), 3));
      const laneLine = new THREE.LineSegments(laneGeo, new THREE.LineBasicMaterial({
        color: 0x6ff2e0,
        transparent: true,
        opacity: 0.22,
        depthWrite: false,
      }));
      laneLine.name = 'region-lanes';
      laneLine.frustumCulled = true;
      root.add(laneLine);
      counts.drawCalls += 1;

      const beaconGeo = new THREE.BufferGeometry();
      beaconGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(beaconPos), 3));
      beaconGeo.setAttribute('color', new THREE.BufferAttribute(new Float32Array(beaconCol), 3));
      const beacons = new THREE.Points(beaconGeo, new THREE.PointsMaterial({
        size: 14,
        sizeAttenuation: true,
        vertexColors: true,
        transparent: true,
        opacity: 0.9,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      }));
      beacons.name = 'region-lane-beacons';
      beacons.frustumCulled = true;
      root.add(beacons);
      counts.drawCalls += 1;
    }

    root.userData.regions = counts;
    });
  }

  function rebuild(to) {
    disposeObject(root);
    root = null;
    const def = SYSTEMS[to];
    if (!def) return;
    build(def);
  }

  function update(dt) {
    for (let i = 0; i < ctx.lastEvents.length; i++) {
      if (ctx.lastEvents[i].type === 'systemLoaded') {
        rebuild(ctx.lastEvents[i].to);
        break; // one rebuild per frame is enough
      }
    }
    if (!root) return;
    if (ctx.settings?.reducedMotion === true) return; // static under reduced motion
    root.rotation.y += 0.0008 * dt; // barely-there drift; no per-frame allocation
  }

  const initial = SYSTEMS[ctx.world.currentSystem];
  if (initial) build(initial);
  return { update };
}
