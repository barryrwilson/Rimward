import { SYSTEMS } from './state.js';
import { LANDMARK_RADIUS } from './mystery.js';
import { localDir, vec3 } from './agent-schema.js';

// Station cards, HUD marks and API guidance share the ordinary landmark
// resolver. Clues/gated mystery sites never enter it; no save state is written.
export function exploreLandmarkOk(lm) {
  return !!(lm && typeof lm === 'object' && !Array.isArray(lm)
    && typeof lm.id === 'string' && lm.id
    && typeof lm.name === 'string' && lm.name.trim());
}

function pickLandmark(system, slot) {
  const lms = SYSTEMS[system]?.landmarks;
  if (!Array.isArray(lms) || !lms.length) return null;
  const lm = lms[slot % lms.length];
  return exploreLandmarkOk(lm) ? lm : null;
}

export function resolveExploreSite(ctx, origin, slot, out = {}) {
  if (!Object.hasOwn(SYSTEMS, origin)) return null;
  const n = slot === 1 ? 1 : 0;
  let system = origin;
  let landmark = pickLandmark(system, n);
  if (!landmark) {
    system = ctx.systems?.[origin]?.gates?.[0]?.to;
    if (!system || system === origin || !Object.hasOwn(SYSTEMS, system)) return null;
    landmark = pickLandmark(system, n);
  }
  if (!landmark) return null;
  out.siteSystem = system;
  out.landmark = landmark;
  return out;
}

function acceptedSite(ctx, job, out) {
  if (!job || job.kind !== 'explore' || job.state !== 'accepted' || job.need !== 1
    || (job.slot !== 0 && job.slot !== 1)
    || (Number.isFinite(job.deadline) && ctx.world?.time >= job.deadline)) return null;
  return resolveExploreSite(ctx, job.originSystem, job.slot, out);
}

const markerSite = {};
/** Allocation-free membership check for the HUD's existing landmark pool. */
export function hasSurveyMarker(ctx, landmark) {
  const jobs = ctx.world?.jobs;
  if (!Array.isArray(jobs)) return false;
  for (let i = 0; i < jobs.length; i++) {
    const site = acceptedSite(ctx, jobs[i], markerSite);
    if (site && site.siteSystem === ctx.world.currentSystem
      && site.landmark === landmark) return true;
  }
  return false;
}

/** Fresh JSON-only guidance for the accepted contract's player-visible mark. */
export function surveyObjective(ctx, job) {
  const out = {
    kind: 'landmark', status: 'unavailable',
    reason: 'Survey site unavailable or contract expired. Return to the issuing dock and check the Jobs board.',
    range: null, bearing: null, arrivalRange: LANDMARK_RADIUS, discovered: false,
  };
  const site = acceptedSite(ctx, job);
  if (!site) return out;
  const lm = site.landmark;
  out.id = lm.id;
  out.name = lm.name.trim();
  out.system = site.siteSystem;
  out.discovered = ctx.world?.mystery?.visited?.includes(lm.id) === true;
  if (out.discovered) {
    out.status = 'discovered';
    out.reason = 'Survey witnessed. Return to the issuing dock to file for the quoted payment.';
    return out;
  }
  if (ctx.world?.currentSystem !== site.siteSystem) {
    out.status = 'different-system';
    out.reason = 'Use plotRoute with objective.system, then engageAutopilot. Local guidance appears in that system.';
    return out;
  }
  if (ctx.flags?.docked) {
    out.status = 'docked';
    out.reason = 'Undock to follow the survey marker. No scanner upgrade is required.';
    return out;
  }
  const position = vec3(lm.position);
  const origin = vec3(ctx.ship?.object?.position);
  if (!position || !origin) return out;
  const dx = position[0] - origin[0], dy = position[1] - origin[1], dz = position[2] - origin[2];
  const bearing = localDir(ctx.ship?.object?.quaternion, dx, dy, dz);
  if (!bearing) return out;
  out.status = 'available';
  out.reason = 'Follow the survey marker with setControl. Fly within arrivalRange to witness it; no scanner is required.';
  out.range = Math.hypot(dx, dy, dz);
  out.bearing = bearing;
  return out;
}
