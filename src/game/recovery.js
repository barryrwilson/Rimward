import * as THREE from 'three';
import { U } from './state.js';
import { spawnPod } from './pods.js';
import { localDir, vec3 } from './agent-schema.js';

// Only the contract persists. Its bounded marker is rebuilt from real aftermath.
const markers = new WeakMap();
const zero = new THREE.Vector3();
export const RECOVERY_COLD = 'Cannot recover: wreck or marker expired. Check Jobs for another posting.';

export function recoveryWreck(ctx, job) {
  return (ctx.world.aftermath || []).find(a => a.id === job.wreckId
    && a.kind === 'wreck' && a.system === job.originSystem
    && a.expiresAt > ctx.world.time && vec3(a.position));
}

export function recoveryPod(ctx, job) {
  return markers.get(ctx)?.get(job.id) || null;
}

export function tickRecovery(ctx) {
  let changed = false;
  let live = markers.get(ctx);
  if (!live) markers.set(ctx, live = new Map());
  const jobs = ctx.world.jobs || [];
  for (const [id, pod] of live) {
    const job = jobs.find(j => j.id === id && j.kind === 'recovery');
    if (job === pod.recoveryJob && job?.state === 'accepted' && !job.collected && job.deadline === pod.recoveryDeadline
      && ctx.world.time >= pod.bornAt) {
      if ((ctx.lastEvents || []).some(ev => ev.type === 'podCollected' && ev.pod === pod
        && ev.t < job.deadline && ev.t >= pod.bornAt)) {
        job.collected = true;
        changed = true;
        ctx.emit('commLine', { text: 'Recovery pod aboard. Return to the issuing dock for payment.' });
      } else if (ctx.world.currentSystem === job.originSystem && ctx.world.time < job.deadline
        && ctx.pods.includes(pod) && recoveryWreck(ctx, job)) continue;
    }
    ctx.scene.remove(pod.mesh);
    const i = ctx.pods.indexOf(pod);
    if (i >= 0) ctx.pods.splice(i, 1);
    live.delete(id);
  }
  for (const job of jobs) {
    if (job.kind !== 'recovery' || job.state !== 'accepted' || job.collected) continue;
    const wreck = recoveryWreck(ctx, job);
    if (!wreck || !Number.isFinite(job.deadline) || ctx.world.time >= job.deadline) {
      job.state = 'failed';
      changed = true;
      ctx.emit('commLine', { text: RECOVERY_COLD });
      continue;
    }
    if (job.originSystem !== ctx.world.currentSystem || live.has(job.id)) continue;
    const pod = spawnPod(ctx, [{ commodity: 'refinedMetals', units: 2 }], new THREE.Vector3().fromArray(vec3(wreck.position)), zero);
    pod.ttl = job.deadline - pod.bornAt;
    pod.recoveryDeadline = job.deadline;
    pod.recoveryJob = job; // restore replaces jobs: discard that timeline's pod/events
    live.set(job.id, pod);
  }
  return changed;
}

/** Same position drives the flight mark and public ship-local bearing. */
export function recoveryObjective(ctx, job) {
  const out = { kind: 'pod', id: job.id, name: 'Recovery pod', system: job.originSystem,
    status: 'unavailable', reason: RECOVERY_COLD, range: null, bearing: null, arrivalRange: U.SCOOP_RANGE };
  if (job.state !== 'accepted') return out;
  if (job.collected) {
    out.status = 'collected'; out.reason = 'Return to the issuing dock for payment. Sell recovered metals at Market.';
  } else if (!Number.isFinite(job.deadline) || ctx.world.time >= job.deadline || !recoveryWreck(ctx, job)) {
    return out;
  } else if (ctx.world.currentSystem !== job.originSystem) {
    out.status = 'different-system'; out.reason = 'Return to the named system before the marker expires.';
  } else if (ctx.flags.docked) {
    out.status = 'docked'; out.reason = 'Launch and follow the Recovery pod flight marker. Keep 2 hold units free.';
  } else {
    const pod = recoveryPod(ctx, job), origin = ctx.ship?.object;
    if (!pod || !origin) return out;
    const p = pod.mesh.position, q = origin.position;
    out.range = p.distanceTo(q);
    out.bearing = localDir(origin.quaternion, p.x - q.x, p.y - q.y, p.z - q.z);
    out.status = 'available'; out.reason = 'Follow the Recovery pod marker; slow down to scoop within 10u. Keep 2 hold units free.';
  }
  return out;
}
