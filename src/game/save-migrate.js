/**
 * Issue #340 — save envelope v2: the one-shot v1->v2 position migration for the
 * P5a uniform x2 playable extent (x/z axes; authored y unchanged).
 *
 * WHY A SEPARATE MODULE: the live browser probe builds its v1 fixture from a
 * real v2 snapshot with scaleSnapshotPositions(snapshot, 0.5) and reloads it,
 * so the fixture and the game's upgrade must share ONE walk. This module is
 * pure — no CSS, DOM, three.js or localStorage import — so a Node probe or a
 * focused test can import it directly.
 *
 * WHAT IS PERSISTED (audited against WORLD_FIELDS and the record/incident
 * schemas for issue #340):
 *   - snapshot.ship.position — the player hull's absolute position.
 *   - world.records / world.recordBanks[*] record absolute positions:
 *       rec.route[*].{x,y,z}, rec.anchor.{x,y,z}, rec.wakeSite.position[3],
 *       rec.derelict.pos[3], rec.escape.pos[3], rec.escape.dest[3],
 *       rec.escape.threatAt[3].
 *   - world.incidents[].position.{x,y,z} and world.aftermath[].position.{x,y,z}
 *       (incident/wreck coordinates re-meshed inside the restored system).
 *   NOT position-bearing (documented so a later reader does not "fix" them):
 *       world.nav (galaxy system ids only), jobs (ids/slots/deadlines),
 *       claimedHulls, prize, fieldOre/fieldRespawn (asteroid index keys),
 *       mystery, hangar, contacts, markets, activeEvent, epics, originArc,
 *       aceRivalry, field respawn.
 *
 * TRANSFORM DECISION: x and z are multiplied by 2 exactly once; y is NOT
 * scaled because the x2 extent is x/z only and y stays authored. Velocities
 * are motion vectors, not absolute positions, so derelict.vel, escape.vel and
 * escape.speed/charge are left as authored. legLens is derived from the route
 * and is recomputed after the route is scaled, so lane progress
 * (leg/legT/dir) stays valid for the new layout.
 *
 * ENVELOPE: the version stamp is the ONLY persisted field the migration adds
 * (v:1 -> v:2). A v2 snapshot is never transformed again, so a load->re-save->
 * load cycle cannot double-scale. Berth and manual-slot blobs share this
 * envelope and migrate on the same loadSnapshot path; their localStorage key
 * names stay historical ('rimward-save-v1', 'rimward-save-v1-berth',
 * 'rimward-save-v1-slot-1..3') — the envelope version, not the key name, is
 * the migration signal.
 *
 * FAIL SAFE: malformed/missing positions are left untouched and no NaN is
 * produced; the public entry points never throw, so a corrupt v1 blob degrades
 * to a fresh start instead of crashing boot.
 */

export const SAVE_VERSION = 2;
export const V1_POSITION_SCALE = 2;

const isFin = (value) => typeof value === 'number' && Number.isFinite(value);
const isObj = (value) => value !== null && typeof value === 'object' && !Array.isArray(value);

/** Multiply a finite coordinate; non-finite input is returned untouched. */
function scaled(value, factor) {
  if (!isFin(value)) return value;
  const next = value * factor;
  return Number.isFinite(next) ? next : value;
}

/** Scale one absolute point held as {x,y,z}; y is authored and untouched. */
function scalePointObject(point, factor) {
  if (!isObj(point)) return;
  point.x = scaled(point.x, factor);
  point.z = scaled(point.z, factor);
}

/** Scale one absolute point held as [x,y,z]; y is authored and untouched. */
function scalePointArray(point, factor) {
  if (!Array.isArray(point) || point.length < 3) return;
  point[0] = scaled(point[0], factor);
  point[2] = scaled(point[2], factor);
}

/** Either persisted point shape; anything else is left untouched. */
function scalePoint(point, factor) {
  if (Array.isArray(point)) scalePointArray(point, factor);
  else scalePointObject(point, factor);
}

/**
 * Plain-route leg lengths, mirroring world.js computeLegLens. Null when the
 * route is not fully numeric — then the stored legLens is left as it was.
 */
function routeLegLens(route) {
  if (!Array.isArray(route) || route.length < 2) return null;
  const lens = [];
  for (let i = 0; i < route.length - 1; i++) {
    const a = route[i];
    const b = route[i + 1];
    if (!isObj(a) || !isObj(b)) return null;
    if (!isFin(a.x) || !isFin(a.y) || !isFin(a.z)) return null;
    if (!isFin(b.x) || !isFin(b.y) || !isFin(b.z)) return null;
    const d = Math.hypot(b.x - a.x, b.y - a.y, b.z - a.z);
    if (!Number.isFinite(d)) return null;
    lens.push(d);
  }
  return lens;
}

function scaleRecordRoute(rec, factor) {
  const route = rec.route;
  if (!Array.isArray(route) || route.length === 0) return;
  for (let i = 0; i < route.length; i++) scalePoint(route[i], factor);
  const lens = routeLegLens(route);
  if (lens) rec.legLens = lens;
}

function scaleRecord(rec, factor, seenRecords) {
  if (!isObj(rec) || seenRecords.has(rec)) return;
  seenRecords.add(rec);
  scaleRecordRoute(rec, factor);
  scalePoint(rec.anchor, factor);
  if (isObj(rec.wakeSite)) scalePointArray(rec.wakeSite.position, factor);
  if (isObj(rec.derelict)) scalePointArray(rec.derelict.pos, factor);
  if (isObj(rec.escape)) {
    scalePointArray(rec.escape.pos, factor);
    scalePointArray(rec.escape.dest, factor);
    scalePointArray(rec.escape.threatAt, factor);
  }
}

function scaleRecordList(list, factor, seenArrays, seenRecords) {
  if (!Array.isArray(list) || seenArrays.has(list)) return;
  seenArrays.add(list);
  for (let i = 0; i < list.length; i++) scaleRecord(list[i], factor, seenRecords);
}

function scaleEntryList(list, factor, seenArrays) {
  if (!Array.isArray(list) || seenArrays.has(list)) return;
  seenArrays.add(list);
  for (let i = 0; i < list.length; i++) {
    const entry = list[i];
    if (isObj(entry)) scalePoint(entry.position, factor);
  }
}

/**
 * Walk every persisted position-bearing field of a snapshot and multiply its
 * x/z by the factor. y, velocities, quaternions, times and cargo are untouched.
 * Pure and fail-safe: a non-object snapshot, a bad factor, or a malformed
 * position leaves that field exactly as it was; never throws; never invents a
 * NaN. Returns the same snapshot for chaining (the caller owns the version
 * stamp — see migrateSnapshotV1ToV2/demoteSnapshotV2ToV1).
 */
export function scaleSnapshotPositions(snapshot, factor) {
  try {
    if (!isObj(snapshot) || !isFin(factor) || factor <= 0) return snapshot;
    const seenArrays = new WeakSet();
    const seenRecords = new WeakSet();
    if (isObj(snapshot.ship)) scalePointArray(snapshot.ship.position, factor);
    const world = snapshot.world;
    if (isObj(world)) {
      scaleRecordList(world.records, factor, seenArrays, seenRecords);
      const banks = world.recordBanks;
      if (isObj(banks)) {
        for (const key in banks) {
          if (!Object.hasOwn(banks, key)) continue;
          scaleRecordList(banks[key], factor, seenArrays, seenRecords);
        }
      }
      scaleEntryList(world.incidents, factor, seenArrays);
      scaleEntryList(world.aftermath, factor, seenArrays);
    }
  } catch {
    /* fail safe: a malformed blob must never break a load */
  }
  return snapshot;
}

/**
 * The one-shot v1->v2 upgrade used by save.js loadSnapshot() before any
 * sanitize/restore/heal. Only an envelope with v:1 is transformed; a v:2 blob
 * (including one produced by a previous load's re-save) is returned untouched,
 * so the scale can never be applied twice. Unknown/absent versions are left
 * for the caller to reject. Never throws.
 */
export function migrateSnapshotV1ToV2(snapshot) {
  try {
    if (!isObj(snapshot)) return snapshot;
    if (snapshot.v === SAVE_VERSION) return snapshot;
    if (snapshot.v !== 1) return snapshot;
    scaleSnapshotPositions(snapshot, V1_POSITION_SCALE);
    snapshot.v = SAVE_VERSION;
  } catch {
    /* fail safe: caller accepts the untouched blob rather than losing it */
  }
  return snapshot;
}

/**
 * Convenience for probes/tests that need a v1 fixture from a real v2 snapshot:
 * scales x/z by 1/2 and stamps v:1. Exact inverse of migrateSnapshotV1ToV2 for
 * finite coordinates (multiplication by 0.5/2 is lossless in this range).
 */
export function demoteSnapshotV2ToV1(snapshot) {
  try {
    if (!isObj(snapshot) || snapshot.v !== SAVE_VERSION) return snapshot;
    scaleSnapshotPositions(snapshot, 1 / V1_POSITION_SCALE);
    snapshot.v = 1;
  } catch {
    /* fail safe: return the untouched blob */
  }
  return snapshot;
}
