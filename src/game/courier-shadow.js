/**
 * Courier shadowing — issues #236 / #237.
 *
 * Pure contract module: geometry, save-shape validation and the frame
 * integrator for the `courier-shadow` espionage subtype. No THREE, no DOM,
 * no ctx writes, no randomness. Tuning lives in game/state.js
 * (`COURIER_SHADOW`); every caller shares THIS evaluator so the Jobs card,
 * the HUD status line and the read-only API projection cannot disagree.
 *
 * The three things this file owns:
 *
 * 1. ONE deterministic candidate route per destination system — the
 *    perpendicular off-lane segment S+900T … S+1500T — plus its clearance
 *    certificate. This is a certificate, not a route search: a destination
 *    that fails it simply has no offer.
 * 2. ONE bounded geometric predicate for line of sight (active asteroid
 *    spheres and the station's solid collision cylinder, nothing else).
 * 3. ONE integrator for observation seconds, mission-local suspicion and
 *    warning grace, clamped to the persisted bounds before it returns.
 */

import { COURIER_SHADOW, JUMP, SYSTEMS, U } from './state.js';
import { PHY } from './physics.js';
import { scaleFor } from './ship-scale.js';
import { sphereChordHit } from './ap-path.js';

/** Max persisted id/name lengths. Must match save.js ID_MAX / NAME_MAX. */
export const SHADOW_ID_MAX = 64;
export const SHADOW_NAME_MAX = 40;

/**
 * Planet orbit slots. Planets orbit the system origin in the y = 0 plane.
 * Values must match solarsystem.js SLOTS (radius / orbitRadius), the same
 * "must match" discipline physics.js uses for the gate bore and the player
 * hit radius; a boot test pins this table against the live bodies the
 * renderer actually publishes.
 */
export const PLANET_ORBITS = Object.freeze([
  Object.freeze({ radius: 9, orbitRadius: 250 }),
  Object.freeze({ radius: 14, orbitRadius: 420 }),
  Object.freeze({ radius: 16, orbitRadius: 640 }),
  Object.freeze({ radius: 12, orbitRadius: 920 }),
  Object.freeze({ radius: 30, orbitRadius: 1400 }),
]);

/**
 * The planet phase a system is BUILT with is knowable without loading it:
 * solarsystem.js seeds each slot from `worldSeed * (slot + 1)` and takes the
 * first draw of mulberry32(seed * 7919) as the start angle. Reproduced here
 * verbatim so a REMOTE destination can be certified against real planet solid
 * bounds instead of a whole-orbit approximation.
 *
 * Must match solarsystem.js makeRng + the planet build loop.
 */
function mulberry32(seed) {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * The planet bodies a fresh load of `def` starts with: world-space centres
 * (the system origin is the sun position, 0,0,0) and radii. Deterministic —
 * the same list the renderer publishes on that system's first build.
 */
export function shadowSeededPlanets(def) {
  const out = [];
  if (!def || typeof def !== 'object') return out;
  const seedBase = def.worldSeed;
  if (!fin(seedBase)) return out;
  const count = fin(def.planetCount) ? Math.min(def.planetCount | 0, PLANET_ORBITS.length) : 0;
  for (let i = 0; i < count; i++) {
    const slot = PLANET_ORBITS[i];
    const rng = mulberry32((seedBase * (i + 1)) * 7919);
    const angle = rng() * Math.PI * 2;
    out.push({
      x: Math.cos(angle) * slot.orbitRadius,
      y: 0,
      z: Math.sin(angle) * slot.orbitRadius,
      radius: slot.radius,
    });
  }
  return out;
}

/** Outer solid radius of one gate ring (bore + tube), as collectBodies fills it. */
export const GATE_OUTER_RADIUS = PHY.GATE_BORE + PHY.GATE_TUBE;

/** corridor + observation envelope + safety margin — the certified half-width. */
export function shadowClearance() {
  return COURIER_SHADOW.corridorRadius
    + COURIER_SHADOW.observationEnvelope
    + COURIER_SHADOW.safetyMargin;
}

/** Required distance from the route segment to ANY gate centre. */
export function shadowGateClearance() {
  const zone = Number.isFinite(JUMP.zone) ? JUMP.zone : 0;
  return Math.max(zone, GATE_OUTER_RADIUS) + shadowClearance();
}

// ---------------------------------------------------------------------------
// Small pure geometry. Callers pass plain numbers; nothing allocates a vector
// class, so save.js and the test harness can use these without a renderer.
// ---------------------------------------------------------------------------

function fin(n) {
  return typeof n === 'number' && Number.isFinite(n);
}

function fin3(a, b, c) {
  return fin(a) && fin(b) && fin(c);
}

/** Distance from point P to the segment A→B. */
export function segmentPointDistance(ax, ay, az, bx, by, bz, px, py, pz) {
  if (!fin3(ax, ay, az) || !fin3(bx, by, bz) || !fin3(px, py, pz)) return NaN;
  const ux = bx - ax;
  const uy = by - ay;
  const uz = bz - az;
  const uu = ux * ux + uy * uy + uz * uz;
  let t = 0;
  if (uu > 1e-12) {
    t = ((px - ax) * ux + (py - ay) * uy + (pz - az) * uz) / uu;
    if (t < 0) t = 0;
    else if (t > 1) t = 1;
  }
  return Math.hypot(px - (ax + ux * t), py - (ay + uy * t), pz - (az + uz * t));
}

/**
 * Distance from the segment A→B to a planet's orbit torus: the ring circle of
 * radius `orbitRadius` in the y = 0 plane about the origin, minus the planet's
 * own radius. The segment is authored flat (both ends share the station's y),
 * so the achievable horizontal radii form one interval and the vertical gap is
 * constant — an exact minimum, not a sample.
 */
export function segmentOrbitDistance(ax, ay, az, bx, by, bz, orbitRadius, planetRadius) {
  if (!fin3(ax, ay, az) || !fin3(bx, by, bz)) return NaN;
  if (!fin(orbitRadius) || !fin(planetRadius)) return NaN;
  if (ay !== by) return NaN; // only the authored flat segment is certifiable here
  const dx = bx - ax;
  const dz = bz - az;
  const d2 = dx * dx + dz * dz;
  let rMin;
  let rMax;
  const rA = Math.hypot(ax, az);
  const rB = Math.hypot(bx, bz);
  rMax = Math.max(rA, rB);
  if (d2 <= 1e-12) {
    rMin = rA;
  } else {
    let t = -(ax * dx + az * dz) / d2;
    if (t < 0) t = 0;
    else if (t > 1) t = 1;
    rMin = Math.hypot(ax + dx * t, az + dz * t);
  }
  let radial;
  if (orbitRadius >= rMin && orbitRadius <= rMax) radial = 0;
  else if (orbitRadius < rMin) radial = rMin - orbitRadius;
  else radial = orbitRadius - rMax;
  return Math.hypot(radial, ay) - planetRadius;
}

/**
 * Does the segment A→B pierce a finite, Y-axis cylinder? Same shape
 * collision.js fills for the station body: centre (cx,cy,cz), radius r, and
 * the slab cy+y0 … cy+y1. Used for line of sight only.
 */
export function segmentHitsCylinder(ax, ay, az, bx, by, bz, cx, cy, cz, r, y0, y1) {
  if (!fin3(ax, ay, az) || !fin3(bx, by, bz) || !fin3(cx, cy, cz)) return false;
  if (!fin(r) || !(r > 0) || !fin(y0) || !fin(y1)) return false;
  const ymin = cy + Math.min(y0, y1);
  const ymax = cy + Math.max(y0, y1);
  let t0 = 0;
  let t1 = 1;
  const dy = by - ay;
  if (Math.abs(dy) < 1e-9) {
    if (ay < ymin || ay > ymax) return false;
  } else {
    let lo = (ymin - ay) / dy;
    let hi = (ymax - ay) / dy;
    if (lo > hi) { const s = lo; lo = hi; hi = s; }
    if (lo > t0) t0 = lo;
    if (hi < t1) t1 = hi;
    if (t0 > t1) return false;
  }
  // Closest approach in XZ over the surviving parameter window.
  const ux = bx - ax;
  const uz = bz - az;
  const uu = ux * ux + uz * uz;
  let t = t0;
  if (uu > 1e-12) {
    t = ((cx - ax) * ux + (cz - az) * uz) / uu;
    if (t < t0) t = t0;
    else if (t > t1) t = t1;
  }
  const px = ax + ux * t;
  const pz = az + uz * t;
  return Math.hypot(px - cx, pz - cz) < r;
}

// ---------------------------------------------------------------------------
// The one deterministic route and its clearance certificate.
// ---------------------------------------------------------------------------

function readXyz(list) {
  if (!Array.isArray(list) || list.length < 3) return null;
  const x = list[0];
  const y = list[1];
  const z = list[2];
  return fin3(x, y, z) ? { x, y, z } : null;
}

/**
 * The single candidate route for a destination system definition.
 *
 * Project the station→first-authored-gate direction onto XZ, normalize to D,
 * take T = (-D.z, 0, D.x), and place the two waypoints at S+900T and S+1500T,
 * both at the station's y. No jitter, no alternate gate, no regeneration on
 * reload — the human briefing and the API projection read the same numbers.
 */
export function shadowRoute(def) {
  if (!def || typeof def !== 'object') return { ok: false, reason: 'no-system' };
  const station = def.station && readXyz(def.station.position);
  if (!station) return { ok: false, reason: 'no-station' };
  const gates = Array.isArray(def.gates) ? def.gates : null;
  const gate0 = gates && gates.length > 0 ? gates[0] : null;
  const gatePos = gate0 && readXyz(gate0.position);
  if (!gatePos) return { ok: false, reason: 'no-gate' };
  const gateTo = typeof gate0.to === 'string' ? gate0.to : null;
  let dx = gatePos.x - station.x;
  let dz = gatePos.z - station.z;
  const len = Math.hypot(dx, dz);
  if (!(len > 1e-6)) return { ok: false, reason: 'zero-direction' };
  dx /= len;
  dz /= len;
  const tx = -dz;
  const tz = dx;
  const near = COURIER_SHADOW.rendezvousRange;
  const far = COURIER_SHADOW.farRange;
  const round = (n) => Math.round(n);
  const offset = { x: round(tx * near), y: 0, z: round(tz * near) };
  const a = { x: round(station.x + tx * near), y: round(station.y), z: round(station.z + tz * near) };
  const b = { x: round(station.x + tx * far), y: round(station.y), z: round(station.z + tz * far) };
  return {
    ok: true,
    reason: '',
    station,
    gateTo,
    dir: { x: dx, z: dz },
    perp: { x: tx, z: tz },
    offset,
    near: a,
    far: b,
    waypoints: [a, b],
  };
}

/**
 * The courier hull's collision extent — the same ladder collision.js
 * radiusForClass walks: the loaded asset's own extent, then the class
 * collision proxy, then the authored span. ONE definition, so the offer
 * certificate, the materialization recertificate and the runtime corridor
 * test can never disagree about how wide the hull is.
 */
export function shadowHullExtent() {
  const scale = scaleFor(COURIER_SHADOW.classKey);
  if (!scale) return 0;
  if (Number.isFinite(scale.maxRadius) && scale.maxRadius > 0) return scale.maxRadius;
  const p = scale.proxy;
  if (p) {
    const r = Math.hypot(p.rx || 0, p.ry || 0, p.halfLen || 0);
    if (r > 0) return r;
  }
  if (Array.isArray(scale.span) && Number.isFinite(scale.span[1])) return scale.span[1] * 0.5;
  return 0;
}

/**
 * Which side of the station-to-first-gate lane the rendezvous sits on, in
 * words a pilot can fly without reading coordinates.
 *
 * The engine's convention is forward = -Z, up = +Y, right = +X, so for an
 * observer standing at the station and facing the first gate with world up,
 * the right-hand vector is exactly D × up = (-D.z, 0, D.x) — the same T the
 * route is built from. A focused pin checks that identity numerically rather
 * than trusting this comment.
 */
export function shadowRendezvousSide() {
  return 'right';
}

/**
 * Is the exact bound courier detectable the ordinary way — instantiated,
 * undestroyed, and inside the same targeting range every other contact uses
 * (inclusive)? A retained selection on a hull that has drifted past that range
 * does NOT make it detectable.
 */
export function shadowDetectable(courierPresent, distance) {
  return courierPresent === true
    && typeof distance === 'number'
    && Number.isFinite(distance)
    && distance <= U.TARGET_RANGE;
}

/**
 * Certify the route for `def`: every gate (authored rings AND the hub body,
 * at its actual bounds), the station cylinder, every planet orbit torus and
 * the authored asteroid field must stay outside the 500-unit swept capsule
 * (gates use the larger of JUMP.zone and their own outer radius first).
 *
 * The courier hull must also fit the 50-unit motion corridor.
 */
export function certifyShadowRoute(def, opts) {
  const route = shadowRoute(def);
  if (!route.ok) return route;
  const hullRadius = opts && fin(opts.hullRadius) ? opts.hullRadius : 0;
  if (hullRadius > COURIER_SHADOW.corridorRadius) {
    return { ok: false, reason: 'hull-corridor', route };
  }
  const clear = shadowClearance();
  const a = route.near;
  const b = route.far;
  const dist = (p) => segmentPointDistance(a.x, a.y, a.z, b.x, b.y, b.z, p.x, p.y, p.z);

  const gateNeed = shadowGateClearance();
  const gates = Array.isArray(def.gates) ? def.gates : [];
  for (let i = 0; i < gates.length; i++) {
    const p = gates[i] && readXyz(gates[i].position);
    if (!p) continue;
    const d = dist(p);
    if (!fin(d) || d < gateNeed) return { ok: false, reason: 'gate-clearance', route };
  }
  // Review clarification 3: a hub junction is a gate body too.
  const hub = def.hub;
  if (hub && Array.isArray(hub.routes) && hub.routes.length > 0) {
    const p = readXyz(hub.position);
    if (p) {
      const d = dist(p);
      if (!fin(d) || d < gateNeed) return { ok: false, reason: 'hub-clearance', route };
    }
  }
  // Station: the swept capsule must clear its solid cylinder envelope.
  const s = route.station;
  const stationD = dist(s) - PHY.STATION_CYL_RADIUS;
  if (!fin(stationD) || stationD < clear) return { ok: false, reason: 'station-clearance', route };
  // Planets are SOLID BOUNDS that move. A remote destination is certified
  // against its REAL seeded build phase — the exact bodies a fresh load of
  // that system starts with — not against an approximated whole orbit and
  // never by omitting them. Once the destination is materialized, the live
  // predicate below takes over at materialization and on every mission frame,
  // which is the contract's own "the clearance certificate still holds" clause.
  const seeded = opts && Array.isArray(opts.planets) ? opts.planets : shadowSeededPlanets(def);
  if (!shadowPlanetsClear({ ok: true, near: a, far: b }, seeded)) {
    return { ok: false, reason: 'planet-clearance', route };
  }
  // Asteroids: the authored field sphere bounds every rock the system can hold.
  const field = def.field;
  if (field) {
    const p = readXyz(field.center);
    const r = fin(field.radius) ? field.radius : 0;
    if (p) {
      const d = dist(p) - r;
      if (!fin(d) || d < clear) return { ok: false, reason: 'asteroid-clearance', route };
    }
  }
  return { ok: true, reason: '', route };
}

/**
 * Live planet clearance: the actual solid bounds, at the positions the loaded
 * system is rendering. `planets` is `[{ position:{x,y,z}, radius }]`.
 * Returns true when every planet stays outside the swept capsule.
 */
export function shadowPlanetsClear(route, planets) {
  if (!route || !route.ok) return false;
  if (!Array.isArray(planets) || planets.length === 0) return true;
  const a = route.near;
  const b = route.far;
  const clear = shadowClearance();
  for (let i = 0; i < planets.length; i++) {
    const p = planets[i];
    if (!p) continue;
    const pos = p.position ?? p;
    if (!pos || !fin3(pos.x, pos.y, pos.z)) continue;
    const r = fin(p.radius) ? p.radius : 0;
    const d = segmentPointDistance(a.x, a.y, a.z, b.x, b.y, b.z, pos.x, pos.y, pos.z) - r;
    if (!fin(d) || d < clear) return false;
  }
  return true;
}

/**
 * Informational only: clearance from every planet's whole orbit torus. NOT a
 * posting gate — the gate uses the real seeded bodies above. Kept because the
 * omission report records how much of each orbit the envelope ever touches,
 * which is what a later balance pass needs.
 */
export function shadowOrbitClearance(def) {
  const route = shadowRoute(def);
  if (!route.ok) return { ok: false, reason: route.reason, worst: NaN };
  const a = route.near;
  const b = route.far;
  const count = fin(def.planetCount) ? Math.min(def.planetCount | 0, PLANET_ORBITS.length) : 0;
  let worst = Infinity;
  for (let i = 0; i < count; i++) {
    const slot = PLANET_ORBITS[i];
    const d = segmentOrbitDistance(a.x, a.y, a.z, b.x, b.y, b.z, slot.orbitRadius, slot.radius);
    if (fin(d) && d < worst) worst = d;
  }
  if (!fin(worst)) return { ok: true, reason: '', worst: Infinity };
  return { ok: worst >= shadowClearance(), reason: worst >= shadowClearance() ? '' : 'orbit-clearance', worst };
}

/** Certify by system id. Returns the same shape; unknown ids are unsafe. */
export function certifyShadowSystem(sysId, opts) {
  if (typeof sysId !== 'string' || !Object.hasOwn(SYSTEMS, sysId)) {
    return { ok: false, reason: 'no-system' };
  }
  return certifyShadowRoute(SYSTEMS[sysId], opts);
}

/**
 * Is this point inside the certified motion corridor? The HULL must fit, not
 * just the centre — a courier whose skin has left the corridor pauses every
 * mission timer before any line-of-sight claim is made.
 */
export function pointInCorridor(route, px, py, pz, hullRadius) {
  if (!route || !route.ok) return false;
  const a = route.near;
  const b = route.far;
  const d = segmentPointDistance(a.x, a.y, a.z, b.x, b.y, b.z, px, py, pz);
  if (!fin(d)) return false;
  const skin = fin(hullRadius) && hullRadius > 0 ? hullRadius : 0;
  return d + skin <= COURIER_SHADOW.corridorRadius;
}

// ---------------------------------------------------------------------------
// Line of sight: ONE bounded predicate, shared by progress and suspicion.
// ---------------------------------------------------------------------------

/**
 * Clear sight between A and B for this slice: blocked only by an active
 * asteroid sphere or the station's solid collision cylinder. Planet, sun,
 * gate artwork, ships and pods are deliberately NOT tested — the route
 * certificate keeps them outside every qualifying ray.
 *
 * `bodies` is `{ station: {x,y,z} | null, asteroids: [{x,y,z,radius}] }`.
 */
export function shadowSightClear(ax, ay, az, bx, by, bz, bodies) {
  if (!fin3(ax, ay, az) || !fin3(bx, by, bz)) return false;
  const station = bodies && bodies.station;
  if (station && fin3(station.x, station.y, station.z)) {
    if (segmentHitsCylinder(
      ax, ay, az, bx, by, bz,
      station.x, station.y, station.z,
      PHY.STATION_CYL_RADIUS, PHY.STATION_CYL_Y0, PHY.STATION_CYL_Y1,
    )) return false;
  }
  const rocks = bodies && Array.isArray(bodies.asteroids) ? bodies.asteroids : null;
  if (rocks) {
    for (let i = 0; i < rocks.length; i++) {
      const rock = rocks[i];
      if (!rock) continue;
      const r = rock.radius;
      if (!fin(r) || !(r > 0)) continue; // a removed slot is no body
      const p = rock.position ?? rock;
      if (!p || !fin3(p.x, p.y, p.z)) continue;
      if (sphereChordHit(ax, ay, az, bx, by, bz, p.x, p.y, p.z, r).hit) return false;
    }
  }
  return true;
}

// ---------------------------------------------------------------------------
// Identity: the bound record id and the courier's public name.
// ---------------------------------------------------------------------------

const SAFE_TOKEN = /^[a-zA-Z0-9]+$/;

/** `courier-<full job id>`; null when it would exceed the persisted bound. */
export function shadowRecordId(jobId) {
  if (typeof jobId !== 'string' || !jobId) return null;
  const id = `courier-${jobId}`;
  return id.length > SHADOW_ID_MAX ? null : id;
}

/** Does `recordId` belong to this exact job? No broader namespace is opened. */
export function isShadowRecordIdFor(recordId, jobId) {
  const want = shadowRecordId(jobId);
  return want !== null && recordId === want;
}

/** Shape check for the courier namespace, independent of any one job. */
export function isShadowRecordId(value) {
  if (typeof value !== 'string' || !value || value.length > SHADOW_ID_MAX) return false;
  if (!value.startsWith('courier-')) return false;
  const rest = value.slice('courier-'.length);
  if (!rest || rest.startsWith('-') || rest.endsWith('-') || rest.includes('--')) return false;
  const tokens = rest.split('-');
  for (let i = 0; i < tokens.length; i++) {
    if (!tokens[i] || !SAFE_TOKEN.test(tokens[i])) return false;
  }
  return true;
}

/** Ordinary-looking freighter names; the job suffix makes each one unique. */
const COURIER_NAMES = Object.freeze([
  'Slow Tithe', 'Grey Meridian', 'Quiet Ledger', 'Long Errand', 'Second Tide',
  'Patient Hand', 'Low Lantern', 'Salt Courier', 'Even Measure', 'Late Bell',
]);

function jobHash(jobId) {
  let h = 0;
  for (let i = 0; i < jobId.length; i++) h = (h * 31 + jobId.charCodeAt(i)) >>> 0;
  return h;
}

/**
 * The courier's public name: an ordinary hull name plus a short unique job
 * suffix, so two employers' couriers never share an identity. Normalized
 * text, bounded to NAME_MAX; callers render it with text-safe DOM APIs.
 */
export function shadowCourierName(jobId) {
  if (typeof jobId !== 'string' || !jobId) return null;
  const tokens = jobId.split('-');
  const tail = tokens[tokens.length - 1];
  const suffix = SAFE_TOKEN.test(tail ?? '') ? tail : String(jobHash(jobId) % 1000);
  const base = COURIER_NAMES[jobHash(jobId) % COURIER_NAMES.length];
  const name = `${base} ${suffix}`;
  return name.length > SHADOW_NAME_MAX ? null : name;
}

// ---------------------------------------------------------------------------
// Persisted shape. The save reader REJECTS; it never repairs into a payable
// job. Bounds come straight from the approved field table.
// ---------------------------------------------------------------------------

const SHADOW_FIELDS = Object.freeze([
  'v', 'courierCreated', 'observedSeconds', 'suspicion', 'warned', 'warningSeconds',
]);

function boundedNumber(value, lo, hi) {
  if (typeof value !== 'number' || !Number.isFinite(value)) return null;
  if (value < lo || value > hi) return null;
  return value;
}

/**
 * Validate one persisted `shadow` object against the approved table, together
 * with the job fields it must agree with. Returns a fresh plain object, or
 * null to reject the WHOLE job.
 *
 * `job` supplies `{ state, progress }`. Nothing here heals an out-of-range
 * value into a payable assignment.
 */
function sanitizeShadowV1(raw, job) {
  if (raw == null || typeof raw !== 'object' || Array.isArray(raw)) return null;
  if (SHADOW_FIELDS.some((k) => !Object.hasOwn(raw, k))) return null;
  const keys = Object.keys(raw);
  for (let i = 0; i < keys.length; i++) {
    if (!SHADOW_FIELDS.includes(keys[i])) return null; // unknown nested field
  }
  if (raw.v !== 1) return null;
  if (typeof raw.courierCreated !== 'boolean') return null;
  if (typeof raw.warned !== 'boolean') return null;
  const observed = boundedNumber(raw.observedSeconds, 0, COURIER_SHADOW.requiredSeconds);
  if (observed === null) return null;
  const suspicion = boundedNumber(raw.suspicion, 0, COURIER_SHADOW.suspicionMax);
  if (suspicion === null) return null;
  const grace = boundedNumber(raw.warningSeconds, 0, COURIER_SHADOW.graceSeconds);
  if (grace === null) return null;
  const warned = raw.warned;
  const created = raw.courierCreated;
  // Warning history must explain any grace or any warning-level suspicion.
  if (!warned && (grace > 0 || suspicion >= COURIER_SHADOW.warnAt)) return null;
  const state = job && job.state;
  const progress = job && job.progress;
  const acquired = progress === 1;
  if (acquired && observed !== COURIER_SHADOW.requiredSeconds) return null;
  if (progress === 0 && observed === COURIER_SHADOW.requiredSeconds) return null;
  // No mission history can predate the one permitted creation.
  if (!created && (observed > 0 || suspicion > 0 || grace > 0 || warned || acquired)) return null;
  // An offered row has not been worked yet, by construction.
  if (state === 'offered' && (created || observed > 0 || suspicion > 0 || grace > 0 || warned || acquired)) {
    return null;
  }
  return {
    v: 1,
    courierCreated: created,
    observedSeconds: observed,
    suspicion,
    warned,
    warningSeconds: grace,
  };
}

/** The zero state an offered row carries. */
export function freshShadowState(deepPay = 0) {
  return {
    v: deepPay > 0 ? 2 : 1,
    courierCreated: false,
    observedSeconds: 0,
    suspicion: 0,
    warned: false,
    warningSeconds: 0,
    ...(deepPay > 0 ? { deep: { state: 'available', observedSeconds: 0, payQuoted: deepPay, closedReason: '' } } : {}),
  };
}

const DEEP_FIELDS = ['state', 'observedSeconds', 'payQuoted', 'closedReason'];
const DEEP_STATES = ['available', 'pursuing', 'ready', 'closed', 'legacy'];
const legacyDeep = () => ({ state: 'legacy', observedSeconds: 0, payQuoted: 0, closedReason: '' });
const validPay = (n) => Number.isInteger(n) && n > 0 && n <= 20000;

/** Validate the original format first; never invent premium terms on migration. */
export function sanitizeShadowState(raw, job) {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null;
  if (raw.v === 1) {
    const old = sanitizeShadowV1(raw, job);
    if (!old) return null;
    return job?.state === 'accepted' ? { ...old, v: 2, deep: legacyDeep() } : old;
  }
  if (raw.v !== 2 || Object.keys(raw).some((k) => !SHADOW_FIELDS.includes(k) && k !== 'deep')) return null;
  const { deep, ...basic } = raw;
  const base = sanitizeShadowV1({ ...basic, v: 1 }, job);
  if (!base || !deep || typeof deep !== 'object' || Array.isArray(deep)
    || ![Object.prototype, null].includes(Object.getPrototypeOf(deep))
    || Object.keys(deep).length !== DEEP_FIELDS.length
    || Object.keys(deep).some((k) => !DEEP_FIELDS.includes(k))
    || !DEEP_STATES.includes(deep.state)) return null;
  const seconds = boundedNumber(deep.observedSeconds, 0, COURIER_SHADOW.deepSeconds);
  if (seconds === null) return null;
  if (!['', 'exposed', 'withdrawn', 'target-lost'].includes(deep.closedReason)
    || (deep.state === 'closed') !== (deep.closedReason !== '')) return null;
  if (deep.state === 'ready' ? seconds !== COURIER_SHADOW.deepSeconds
    : deep.state === 'pursuing' ? seconds >= COURIER_SHADOW.deepSeconds : seconds !== 0) return null;
  if (deep.state === 'legacy') {
    if (deep.payQuoted !== 0 || job?.state === 'offered') return null;
  } else {
    const basicPay = job?.state === 'offered' ? job.reward : job?.payQuoted;
    if (!validPay(basicPay) || !validPay(deep.payQuoted) || deep.payQuoted <= basicPay) return null;
    if (job?.state === 'offered' && deep.state !== 'available') return null;
  }
  if (['pursuing', 'ready', 'closed'].includes(deep.state)
    && (job?.progress !== 1 || !base.courierCreated || base.observedSeconds !== COURIER_SHADOW.requiredSeconds)) return null;
  return { ...base, v: 2, deep: { ...deep } };
}

export function shadowEarnedPay(job) {
  const clean = sanitizeShadowState(job?.shadow, job);
  if (!clean) return 0;
  return clean?.deep?.state === 'ready' ? clean.deep.payQuoted : (validPay(job?.payQuoted) ? job.payQuoted : 0);
}

export function closeShadowDossier(shadow, reason) {
  return { ...shadow, deep: { ...shadow.deep, state: 'closed', observedSeconds: 0, closedReason: reason } };
}

/** A tuned rate as the player reads it: `4`, `3.5`, `10`. */
function rateText(n) {
  return Number.isInteger(n) ? String(n) : String(Number(n.toFixed(2)));
}

/**
 * Issue #239: the effective dossier-pursuit suspicion rate for ONE mounted
 * scanner tier — the single rate the integrator, the projection and all copy
 * share. It changes nothing else: not the band, the 10/s close rate, timing,
 * grace, selection, basic observation or detection eligibility.
 *
 * Only an in-range INTEGER tier selects a tuned rate, so a corrupt save or an
 * unknown future tier reads as stock rather than minting a cheaper pursuit.
 * Pure: the tier arrives on the frame input; this never reads a live mount.
 */
export function deepSuspicionGainFor(scannerTier) {
  const stock = COURIER_SHADOW.deepSuspicionGain;
  const table = COURIER_SHADOW.deepSuspicionByScanner;
  if (!Array.isArray(table) || table.length === 0) return stock;
  if (typeof scannerTier !== 'number' || !Number.isInteger(scannerTier)) return stock;
  if (scannerTier < 0 || scannerTier >= table.length) return stock;
  const gain = table[scannerTier];
  return Number.isFinite(gain) && gain > 0 ? gain : stock;
}

/** The rate sentence every tier shares, derived from the frozen tuning. */
export function deepSuspicionRateLine(scannerTier) {
  const gain = deepSuspicionGainFor(scannerTier);
  const stock = COURIER_SHADOW.deepSuspicionGain;
  const versus = gain === stock ? '' : ` instead of the stock ${rateText(stock)}/s`;
  return `Dossier pursuit at ${COURIER_SHADOW.minRange}–${COURIER_SHADOW.maxRange} units draws `
    + `${rateText(gain)}/s of courier attention${versus}. `
    + `Crowding inside ${COURIER_SHADOW.minRange} units still draws ${rateText(COURIER_SHADOW.suspicionGain)}/s.`;
}

/**
 * The honest limit of a reduced rate, or '' when there is none to state.
 * Derived, never asserted: a tier earns this only when its own rate cannot
 * reach the exposure cap across a whole attempt. The margin is small even
 * then, so it refuses to promise completion.
 */
export function deepSuspicionCaveat(scannerTier) {
  const gain = deepSuspicionGainFor(scannerTier);
  if (gain >= COURIER_SHADOW.deepSuspicionGain) return '';
  if (gain * COURIER_SHADOW.deepSeconds >= COURIER_SHADOW.suspicionMax) return '';
  return `From clean risk it can just finish one uninterrupted ${COURIER_SHADOW.deepSeconds}-second attempt; `
    + 'carried suspicion or any crowding can still force a cooling break.';
}

/** Rate plus caveat — the shared explanation Jobs, Chart, HUD and API read. */
export function deepSuspicionExplanation(scannerTier) {
  const caveat = deepSuspicionCaveat(scannerTier);
  return caveat ? `${deepSuspicionRateLine(scannerTier)} ${caveat}` : deepSuspicionRateLine(scannerTier);
}

/** One text contract for the chart, Jobs, HUD and API. No world writes. */
export function shadowDossierTerms(shadow, inp) {
  const deep = shadow?.deep;
  if (!deep || deep.state === 'legacy') return 'Basic-only contract; no optional dossier was offered.';
  const b = inp.payQuoted, d = deep.payQuoted;
  const grace = Math.max(0, COURIER_SHADOW.graceSeconds - shadow.warningSeconds);
  const home = inp.employerStation || 'the employer dock';
  const deadline = `before the deadline (${Math.max(0, Math.ceil(inp.secondsLeft || 0))} s left)`;
  const forfeit = 'The original deadline still applies; whole-job abandonment forfeits all payment.';
  if (deep.state === 'ready') return `Complete dossier banked. File at ${home} for ${d} UU total (+${d - b}) ${deadline}. No further observation or risk is required. ${forfeit}`;
  if (deep.state === 'closed') {
    const reason = deep.closedReason === 'exposed' ? 'Tail identified; dossier opportunity lost.'
      : deep.closedReason === 'withdrawn' ? 'Dossier attempt ended by choice.' : 'Courier lost; dossier opportunity ended.';
    return `${reason} Basic report still files for ${b} UU ${deadline} at ${home}. This attempt cannot be retried. ${forfeit}`;
  }
  const choice = deep.state === 'pursuing'
    ? `Complete dossier attempt in progress: ${deep.observedSeconds.toFixed(1)}/${COURIER_SHADOW.deepSeconds} s gathered. Complete dossier: ${d} UU total (+${d - b}). `
      + `Open Galaxy Chart (${inp.chartBinding || 'M'}) → Shadow assignment to end the attempt and keep basic. `
    : `Optional: open Galaxy Chart (${inp.chartBinding || 'M'}) → Shadow assignment. Complete dossier: ${d} UU total (+${d - b}). `;
  return `Basic report files at ${home} for ${b} UU ${deadline}. ` + choice
    + 'Basic records identity and the observed local route; the dossier corroborates that courier’s route and traffic pattern. '
    + `${COURIER_SHADOW.deepSeconds} additional selected seconds at 150–400 units with clear sight are required. `
    // Issue #239: the mounted eye's own rate, read from the SAME frame input
    // the integrator uses, so the agreement can never quote a rate the mission
    // is not actually charging.
    + `${deepSuspicionExplanation(inp.scannerTier)} `
    + 'While pursuing, staying within 400 units attracts attention even without selection. Open beyond 400 or break sight to cool off; evidence is retained. '
    + (inp.accepted ? `Warning history: ${shadow.warned ? 'already warned' : 'not warned'}; ${grace.toFixed(1)} s of warned danger grace remain. Starting never resets risk or grace. ` : '')
    + 'Exposure or ending the attempt permanently loses incomplete dossier evidence; the basic report survives. '
    + forfeit;
}

/** Preserve native Space activation without the window flight-key handler
 * cancelling its default. Escape, Enter and the chart binding still bubble. */
export function guardShadowDossierSpace(e) {
  if (e?.code === 'Space') e.stopPropagation();
}

export function shadowDossierBlocked(shadow, inp) {
  if (!shadow?.deep || shadow.deep.state === 'legacy') return 'basic-only-contract';
  if (shadow.deep.state !== 'available') return 'attempt-unavailable';
  if (!inp.accepted || inp.expired) return 'expired-or-inactive';
  if (!inp.acquired) return 'basic-report-required';
  if (inp.playerAlive === false) return 'dead';
  if (inp.paused) return 'paused';
  if (inp.jumping) return 'jumping';
  if (inp.docked || inp.berthHold) return 'docked-or-held';
  if (!inp.sameSystem) return 'wrong-system';
  if (!inp.courierAlive || !inp.courierPresent || !shadowDetectable(true, inp.distance)) return 'contact-unavailable';
  if (!inp.certified || !inp.inCorridor) return 'outside-certified-area';
  if (!inp.selected) return 'select-courier';
  if (inp.distance < COURIER_SHADOW.minRange || inp.distance > COURIER_SHADOW.maxRange) return 'hold-150-400-units';
  if (!inp.sightClear) return 'sight-blocked';
  return '';
}

/** Is this job the exact approved subtype? Never inferred from display text. */
export function isShadowJob(job) {
  return !!job
    && job.kind === 'espionage'
    && job.mission === COURIER_SHADOW.mission
    && job.slot === COURIER_SHADOW.slot;
}

/**
 * The ACCEPTED shadow assignment that owns `recordId`, or null.
 *
 * This is the single ownership test every mission guard uses. It reads the
 * live job list, so a dropped, paid, abandoned or expired job releases its
 * hull to ordinary traffic on the very next call — no flag is written on the
 * record, and no other trader can ever match.
 */
export function shadowJobForRecordId(jobs, recordId) {
  if (!Array.isArray(jobs) || typeof recordId !== 'string' || !recordId) return null;
  for (let i = 0; i < jobs.length; i++) {
    const job = jobs[i];
    if (!isShadowJob(job) || job.state !== 'accepted') continue;
    if (job.recordId !== recordId) continue;
    return job;
  }
  return null;
}

// ---------------------------------------------------------------------------
// Copy. Every warning carries the courier's public name in the text itself,
// so a HUD comm line that ignores a sender field still names the speaker.
// ---------------------------------------------------------------------------

/** The one approved warning sentence, used verbatim wherever it is spoken. */
const WARNING_SENTENCE = "You're too close. Give me room. Open to 150 units or break sight.";

/** ' 4.2 s of patience left.' — the human form of the API's graceRemaining. */
function graceClause(graceRemaining) {
  const left = typeof graceRemaining === 'number' && Number.isFinite(graceRemaining) && graceRemaining > 0
    ? graceRemaining
    : 0;
  return left > 0
    ? ` ${left.toFixed(1)} s of patience left.`
    : ' No patience left — break off now.';
}

export const SHADOW_COPY = Object.freeze({
  deepWarning: (name) => `${name}: Tail attracting attention. Open beyond 400 or break sight.`,
  warning: (name) => `${name}: ${WARNING_SENTENCE}`,
  /**
   * The persistent status line. It carries the same approved sentence plus the
   * two things the public API already publishes and the pilot could not
   * otherwise see: whether this is the final warning, and how much warned
   * danger time is actually left. Text only — no new gauge, key or event.
   */
  warningStatus: (name, graceRemaining, finalWarning) => (
    `${name}: ${finalWarning === true ? 'Final warning. ' : ''}${WARNING_SENTENCE}`
    + graceClause(graceRemaining)
  ),
  withdrawing: 'Withdrawing — attention falling.',
  /** Withdrawing, once warned: say how much patience the retreat preserved. */
  withdrawingStatus: (graceRemaining) => `Withdrawing — attention falling.${graceClause(graceRemaining)}`,
  /** Beyond ordinary targeting range the contact cannot be selected at all. */
  closeIn: (name, range) => `Close to within ${range} units of ${name} to pick it up on targeting.`,
  outsideArea: 'Contact outside observation area; wait for return.',
  exposed: 'Courier identified the tail. Assignment lost; withdraw.',
  expired: 'Shadow assignment expired',
  lost: 'Shadow contact lost; assignment ended',
  postingWithdrawn: 'Shadow posting withdrawn',
  acquired: (station, pay) => `Basic report acquired. Return to ${station} for ${pay} UU.`,
});

// ---------------------------------------------------------------------------
// The frame integrator. One pure step; the caller owns all world reads and
// every write. Timers are clamped to the persisted bounds before return.
// ---------------------------------------------------------------------------

/**
 * Cap one frame's mission time. Never more than the visible-frame budget, the
 * elapsed simulation time, or the elapsed presentation time — a delayed frame
 * DROPS its backlog rather than replaying it as substeps.
 */
export function shadowFrameSeconds(simDt, presentedDt, visible) {
  if (visible === false) return 0;
  let dt = fin(simDt) && simDt > 0 ? simDt : 0;
  if (fin(presentedDt) && presentedDt >= 0 && presentedDt < dt) dt = presentedDt;
  const cap = COURIER_SHADOW.frameSeconds;
  return dt > cap ? cap : dt;
}

function riskWord(suspicion, warned, grace) {
  if (suspicion >= COURIER_SHADOW.suspicionMax && grace < COURIER_SHADOW.graceSeconds) return 'final-warning';
  if (suspicion >= COURIER_SHADOW.warnAt) return 'warned';
  return warned ? 'cooling' : 'clear';
}

/**
 * Advance one shadow assignment by `dt` already-capped seconds.
 *
 * `shadow` is the persisted state; `input` describes this frame:
 *   accepted, expired, playerAlive, docked, berthHold, sameSystem,
 *   courierAlive, courierPresent, inCorridor, certified, selected,
 *   distance (number|null), sightClear (bool), acquired (progress === 1),
 *   warningPresented (session latch), courierName, destName,
 *   employerStation, payQuoted.
 *
 * Returns a NEW state plus the projection every consumer shares. Nothing here
 * mutates its arguments.
 */
export function stepShadow(shadow, input, dt) {
  const base = shadow && typeof shadow === 'object' ? shadow : freshShadowState();
  const next = {
    v: base.v === 2 ? 2 : 1,
    courierCreated: base.courierCreated === true,
    observedSeconds: fin(base.observedSeconds) ? base.observedSeconds : 0,
    suspicion: fin(base.suspicion) ? base.suspicion : 0,
    warned: base.warned === true,
    warningSeconds: fin(base.warningSeconds) ? base.warningSeconds : 0,
    ...(base.deep ? { deep: { ...base.deep } } : {}),
  };
  const inp = input && typeof input === 'object' ? input : {};
  const name = typeof inp.courierName === 'string' && inp.courierName ? inp.courierName : 'the courier';
  const step = fin(dt) && dt > 0 ? dt : 0;

  const acquired = inp.acquired === true;
  const pursuing = acquired && next.deep?.state === 'pursuing';
  // Issue #239: read the mounted eye ONCE per frame from this input. Changing
  // gear, hull or reloading only moves the next frame's rate — it never
  // touches accumulated evidence, suspicion, the latched warning or grace.
  const deepGain = deepSuspicionGainFor(inp.scannerTier);
  const ended = inp.accepted !== true || inp.expired === true;
  // The ONE detection rule the public id, the card and the HUD all share.
  const detectable = shadowDetectable(inp.courierPresent === true, inp.distance);

  // Contact reason, in the order the player can act on it.
  let reason;
  if (ended) reason = 'target-unavailable';
  else if (inp.playerAlive === false) reason = 'target-unavailable';
  else if (inp.docked === true || inp.berthHold === true) reason = 'docked';
  else if (inp.sameSystem !== true) reason = 'wrong-system';
  else if (inp.courierAlive !== true || inp.courierPresent !== true) reason = 'target-unavailable';
  else if (inp.certified !== true || inp.inCorridor !== true) reason = 'target-unavailable';
  // A contact beyond ordinary targeting range cannot be picked up at all, so
  // the card must never tell the pilot to select it. Retaining an old
  // selection on a hull that has drifted out of range does not change that.
  else if (inp.selected !== true) reason = detectable ? 'not-selected' : 'out-of-range';
  else if (!fin(inp.distance)) reason = 'target-unavailable';
  else if (inp.distance < COURIER_SHADOW.minRange || inp.distance > COURIER_SHADOW.maxRange) reason = 'out-of-range';
  else if (inp.sightClear !== true) reason = 'occluded';
  else reason = 'observing';

  // The mission may integrate at all only while the whole certificate holds.
  const active = !ended
    && inp.paused !== true && inp.jumping !== true
    && inp.playerAlive !== false
    && inp.docked !== true
    && inp.berthHold !== true
    && inp.sameSystem === true
    && inp.courierAlive === true
    && inp.courierPresent === true
    && inp.certified === true
    && inp.inCorridor === true;

  const dangerous = active
    && fin(inp.distance)
    && (pursuing ? inp.distance <= COURIER_SHADOW.maxRange : inp.distance < COURIER_SHADOW.minRange)
    && inp.sightClear === true;
  const observing = reason === 'observing' && (!acquired || pursuing);

  let warnEmitted = false;
  let exposed = false;
  let completed = false;
  let deepCompleted = false;
  let deepClosed = false;

  if (active && (!acquired || pursuing) && step > 0) {
    // 1. Suspicion first: it owns the warning crossing.
    const before = next.suspicion;
    const delta = dangerous
      ? (pursuing && inp.distance >= COURIER_SHADOW.minRange ? deepGain : COURIER_SHADOW.suspicionGain) * step
      : -COURIER_SHADOW.suspicionDecay * step;
    let s = before + delta;
    if (s < 0) s = 0;
    if (s > COURIER_SHADOW.suspicionMax) s = COURIER_SHADOW.suspicionMax;
    next.suspicion = s;

    const crossing = !next.warned && s >= COURIER_SHADOW.warnAt;
    if (crossing) {
      next.warned = true;
      warnEmitted = true;
    }

    // 2. On the warning-crossing frame nothing else integrates: the player
    //    must SEE the warning before it costs them anything.
    if (!crossing) {
      // 3. Grace, only after the latched warning has actually been presented.
      if (next.warned && inp.warningPresented === true && dangerous) {
        let g = next.warningSeconds + step;
        if (g > COURIER_SHADOW.graceSeconds) g = COURIER_SHADOW.graceSeconds;
        if (g < 0) g = 0;
        next.warningSeconds = g;
      }
      // 4. Exposure is evaluated BEFORE completion in the same interval.
      exposed = next.suspicion >= COURIER_SHADOW.suspicionMax
        && next.warningSeconds >= COURIER_SHADOW.graceSeconds;
      if (exposed && pursuing) {
        next.deep = closeShadowDossier(next, 'exposed').deep;
        deepClosed = true;
        exposed = false;
      }
      if (!exposed && !deepClosed && observing && pursuing) {
        next.deep.observedSeconds = Math.min(COURIER_SHADOW.deepSeconds, next.deep.observedSeconds + step);
        if (next.deep.observedSeconds >= COURIER_SHADOW.deepSeconds) {
          next.deep.state = 'ready';
          deepCompleted = true;
        }
      } else if (!exposed && observing && !pursuing) {
        let o = next.observedSeconds + step;
        if (o >= COURIER_SHADOW.requiredSeconds) {
          o = COURIER_SHADOW.requiredSeconds;
          completed = true;
        }
        if (o < 0) o = 0;
        next.observedSeconds = o;
      }
    }
  }

  const risk = riskWord(next.suspicion, next.warned, next.warningSeconds);
  const graceLeft = Math.max(0, COURIER_SHADOW.graceSeconds - next.warningSeconds);
  const done = acquired || completed;

  let phase;
  if (ended) phase = 'ended';
  else if (done) phase = next.deep?.state === 'ready' ? 'deep-ready' : next.deep?.state === 'pursuing' ? 'pursuing-deep' : 'basic-ready';
  else if (observing) phase = 'observing';
  else if (next.observedSeconds > 0) phase = 'paused';
  else phase = 'seeking';

  let instruction;
  if (ended) {
    instruction = '';
  } else if (done && next.deep?.state !== 'pursuing') {
    const station = typeof inp.employerStation === 'string' && inp.employerStation
      ? inp.employerStation : 'the employer dock';
    const pay = fin(inp.payQuoted) ? Math.round(inp.payQuoted) : 0;
    instruction = next.deep?.state === 'ready'
      ? `Complete dossier ready. Return to ${station} for ${next.deep.payQuoted} UU total before the deadline.`
      : next.deep && next.deep.state !== 'legacy'
        ? `Basic report ready. ${shadowDossierTerms(next, inp)}`
        : SHADOW_COPY.acquired(station, pay);
  } else if (next.warned && dangerous) {
    // Finding 4: the human line must carry the same two facts the API does —
    // whether this is the final warning, and the warned danger time actually
    // left. Repeated and restored close approaches render it again from state.
    instruction = pursuing ? SHADOW_COPY.deepWarning(name) + graceClause(graceLeft)
      : SHADOW_COPY.warningStatus(name, graceLeft, risk === 'final-warning');
  } else if (next.warned && active && next.suspicion > 0) {
    instruction = SHADOW_COPY.withdrawingStatus(graceLeft);
  } else if (reason === 'target-unavailable') {
    instruction = SHADOW_COPY.outsideArea;
  } else if (reason === 'docked') {
    instruction = `Undock and follow ${name} to gather the report.`;
  } else if (reason === 'wrong-system') {
    const where = typeof inp.destName === 'string' && inp.destName ? inp.destName : 'the destination system';
    instruction = `Travel to ${where} and find ${name} at the rendezvous.`;
  } else if (reason === 'not-selected') {
    instruction = `Select ${name} to gather the report.`;
  } else if (reason === 'out-of-range') {
    instruction = detectable
      ? `Hold ${COURIER_SHADOW.minRange}–${COURIER_SHADOW.maxRange} units from ${name}.`
      : SHADOW_COPY.closeIn(name, U.TARGET_RANGE);
  } else if (reason === 'occluded') {
    instruction = `Line of sight to ${name} is blocked.`;
  } else {
    const left = pursuing ? COURIER_SHADOW.deepSeconds - next.deep.observedSeconds : COURIER_SHADOW.requiredSeconds - next.observedSeconds;
    instruction = `Observing ${name}${pursuing ? ' for complete dossier' : ''} — ${Math.ceil(Math.max(0, left))} s to go.`;
  }

  return {
    shadow: next,
    phase,
    risk,
    contactReason: reason,
    instruction,
    warnEmitted,
    exposed,
    completed,
    deepCompleted,
    deepClosed,
    suspicionGain: pursuing && inp.distance >= COURIER_SHADOW.minRange ? deepGain : COURIER_SHADOW.suspicionGain,
    // Issue #239: what the mounted eye is worth, published for Jobs, the
    // Chart, the HUD queue and the API rather than recomputed by each.
    deepSuspicionGain: deepGain,
    deepSuspicionNote: deepSuspicionExplanation(inp.scannerTier),
    dangerous,
    detectable,
    graceRemaining: graceLeft,
  };
}
