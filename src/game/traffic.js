import * as THREE from 'three';
import { U, ESCAPE } from './state.js';
import { recordPosition } from './world.js';
import { escapeActive, readEscape } from './npc-escape.js';
import { spawnLiveShip, removeLiveShip, findHunterOf } from '../systems/npc.js';
import { isShipAssetReady, primeShipAsset } from '../systems/ship-assets.js';
import { spawnBlocked, pirateLiveCap, visualClassFor, closeSpawn } from './traffic-feel.js';

/**
 * Traffic — the instantiation bubble (doc §8.6).
 *
 * Persistent records (world.js) become live ships when their abstract route
 * position enters U.INSTANTIATE_RANGE of the player, and fold back into the
 * record beyond U.DEINSTANTIATE_RANGE (hysteresis). Off-screen ships never
 * run physics (§8.2); while live, npc.js drives them and the record keeps
 * advancing abstractly as their intended route — despawned enroute records
 * simply resume that route next time they materialize. Dead/captured records
 * never respawn. Cap ~10 live ships.
 *
 * During a pirateBlockade world event, pirate records are weighted toward
 * instantiation near the lane/station (longer range, priority bonus) and
 * world.js hurries their abstract routes toward the lane.
 *
 * spawnLiveShip only CONSTRUCTS the live ship; this module owns ctx.ships.
 *
 * ESCAPE OWNERSHIP (issue #68): a record carrying an active escape plan is
 * NOT an ordinary enroute hull folding back onto its lane. Nothing in this
 * pass needed to change — the two shared contracts already carry it:
 *   • removeLiveShip (npc.js) captures the runner's real position, velocity
 *     and condition into the record before the mesh goes, so the despawn
 *     below cannot lose the encounter;
 *   • recordPosition (world.js) returns the plan's tracked position, so the
 *     re-instantiation below puts the SAME hull back on its escape route
 *     rather than teleporting it onto a stale lane waypoint.
 * The one behavioral addition: a runner the player still has SELECTED holds
 * its instantiation past the hysteresis range (see the despawn pass) so an
 * active chase is not ended by an invisible line. Range culling is still a
 * rendering optimization, never an escape, and MAX_LIVE and the pirate mix
 * cap are untouched.
 *
 * Multi-system: ctx.world.records is always the CURRENT system's bank
 * (world.js swaps on 'systemLoaded'). The spawn pass is system-tagged as a
 * belt-and-suspenders guard for the jump frame itself, when jump.js has
 * already flipped ctx.world.currentSystem but world.js swaps banks a frame
 * later. jump.js empties ctx.ships at the midpoint; the despawn pass then
 * no-ops gracefully, and stale `live` flags on the old bank are healed once
 * via lastEvents. Records arriving from inter-system migration sit exactly
 * on the destination gate waypoint, so they materialize at the gate.
 */

const MAX_LIVE = 10;
const BLOCKADE_PIRATE_RANGE_MULT = 1.3;
const BLOCKADE_PIRATE_PRIORITY = 0.5; // score multiplier: pirates spawn sooner

const _pos = new THREE.Vector3();
const _skipped = [];
const _remaining = [];

/**
 * Completed station yields get spare capacity after unfinished encounters.
 * They can fold to their existing record when a new encounter needs a slot;
 * they are never permanently excluded from the finite population. Named Guns
 * and offered/accepted job quarry remain ordinary-priority candidates.
 */
function shelteredYield(ctx, rec, state = readEscape(rec)?.cond?.flags) {
  const plan = readEscape(rec);
  if (!plan || plan.phase !== 'done' || plan.reason !== 'sheltered'
    || !state || state.surrendered !== true || state.disabled || state.destroyed) return false;
  if (rec.role === 'ace' || rec.classKey === 'ace') return false;
  for (const job of ctx.world.jobs ?? []) {
    if (job.state !== 'offered' && job.state !== 'accepted') continue;
    if (job.recordId === rec.id) return false;
    if (job.kind === 'bounty' && job.target === rec.name && job.system === rec.system) return false;
  }
  return true;
}

export function initTraffic(ctx) {
  ctx.ships = ctx.ships ?? [];

  return {
    update(dt) {
      const playerObj = ctx.ship.object;
      if (!playerObj) return;
      const pp = playerObj.position;
      const blockade = ctx.world.activeEvent?.kind === 'pirateBlockade';

      // Jump handoff: ctx.ships was emptied by jump.js, so any record still
      // flagged live (in ANY bank) is stale — clear flags once, next frame.
      for (const ev of ctx.lastEvents) {
        if (ev.type !== 'systemLoaded') continue;
        const banks = ctx.world.recordBanks;
        if (!banks) break;
        for (const sysId in banks) {
          const bank = banks[sysId];
          for (let i = 0; i < bank.length; i++) bank[i].live = false;
        }
      }

      // Despawn pass: beyond hysteresis range, or the record ended while live
      // (captured towed away; destroyed ships are removed by npc.js itself).
      for (let i = ctx.ships.length - 1; i >= 0; i--) {
        const live = ctx.ships[i];
        const rec = live.record;
        const d = live.object.position.distanceTo(pp);
        // Beyond hysteresis range, or the record ended while live. npc.js
        // marks death exactly once and leaves the splice to us (agreed).
        // inTransit is defensive: migration only picks off-screen records,
        // but a ship mid-jump bookkeeping must never linger.
        const ended = rec.state === 'captured' || rec.state === 'dead' || rec.state === 'inTransit';
        // Issue #68: the ONE case the fold must not swallow is the chase the
        // player is actively flying. A hull the player still has SELECTED and
        // that is running for a real refuge stays instantiated past the
        // hysteresis range, so the pursuit reads as a pursuit instead of the
        // target evaporating at an invisible line. It counts against the same
        // MAX_LIVE as everything else, and the moment the player drops the
        // lock (or the escape resolves) it culls like any other ship.
        const chased = !ended && ctx.targets && ctx.targets.current === live && escapeActive(rec);
        if ((d > U.DEINSTANTIATE_RANGE && !chased) || ended) {
          removeLiveShip(ctx, live);
          if (ctx.ships[i] === live) ctx.ships.splice(i, 1);
          rec.live = false;
        }
      }

      // Spawn pass: at most one instantiation per frame, best candidate wins.
      let retire = null;
      if (ctx.ships.length >= MAX_LIVE) {
        if (ctx.ships.length > MAX_LIVE) return;
        for (let i = ctx.ships.length - 1; i >= 0; i--) {
          const live = ctx.ships[i];
          const recentHit = Number.isFinite(live.state?.lastHitAt)
            && ctx.world.time - live.state.lastHitAt <= ESCAPE.pressureRecent;
          if (ctx.targets?.current !== live && shelteredYield(ctx, live.record, live.state)
            && !recentHit && !live.ai?.target && !live.ai?.intent && !findHunterOf(ctx, live)) {
            retire = live;
            break;
          }
        }
        if (!retire) return;
      }
      // Clearance and mix are measured against the proposed post-fold bubble.
      // Do not actually remove anything until a ready replacement is found.
      _remaining.length = 0;
      for (let i = 0; i < ctx.ships.length; i++) {
        if (ctx.ships[i] !== retire) _remaining.push(ctx.ships[i]);
      }
      const curSys = ctx.world.currentSystem;
      let pirateLive = 0;
      for (let i = 0; i < _remaining.length; i++) {
        if (_remaining[i].role === 'pirate') pirateLive++;
      }
      const pirateCap = pirateLiveCap(_remaining.length + 1, blockade);

      const records = ctx.world.records;
      const recCount = records.length;
      _skipped.length = 0;
      let best = null;
      for (let attempt = 0; attempt < recCount; attempt++) {
        best = null;
        let bestScore = Infinity;
        let bestFinished = true;
        for (let i = 0; i < recCount; i++) {
          const rec = records[i];
          if (rec.live || rec.assetPending || rec.state !== 'enroute') continue;
          const finished = shelteredYield(ctx, rec);
          // Never exchange one finished encounter for another at the cap.
          if (retire && finished) continue;
          // Stale-bank guard: on the jump frame records still point at the old
          // system's bank while currentSystem has already flipped. Untagged
          // legacy records (wave-1 saves) pass through.
          if (rec.system && rec.system !== curSys) continue;
          if (_skipped.includes(rec)) continue;
          recordPosition(rec, _pos);
          const d = _pos.distanceTo(pp);
          let range = U.INSTANTIATE_RANGE;
          if (blockade && rec.role === 'pirate') range *= BLOCKADE_PIRATE_RANGE_MULT;
          if (d > range) continue;
          const score = blockade && rec.role === 'pirate' ? d * BLOCKADE_PIRATE_PRIORITY : d;
          if (!best || (bestFinished && !finished) || (bestFinished === finished && score < bestScore)) {
            bestScore = score;
            bestFinished = finished;
            best = rec;
          }
        }
        if (!best) break;
        recordPosition(best, _pos);
        const close = closeSpawn(_pos.distanceTo(pp));
        // Sit-on authored pirates (Callow, Named Guns) must instantiate.
        if (!close && !blockade && best.role === 'pirate' && pirateLive + 1 > pirateCap) {
          _skipped.push(best);
          best = null;
          continue;
        }
        if (!close && spawnBlocked(_pos, visualClassFor(best), _remaining)) {
          _skipped.push(best);
          best = null;
          continue;
        }
        break;
      }
      if (best) {
        const cover = best.qship === true && !best.revealed
          ? { classKey: best.coverClass ?? 'freighter', faction: best.coverFaction ?? best.faction, role: 'trader' }
          : null;
        const real = { classKey: best.classKey, faction: best.faction, role: best.role };
        const primed = isShipAssetReady(real.faction, real.classKey, real.role)
          && (!cover || isShipAssetReady(cover.faction, cover.classKey, cover.role));
        // Never trust a persisted assetReady flag from a save. Templates live
        // only in this page's memory; a stale true here used to call
        // spawnLiveShip and throw "NPC asset not primed".
        best.assetReady = primed;
        if (!best.assetReady) {
          if (!best.assetPending) {
            best.assetPending = true;
            const required = cover ? [primeShipAsset(cover.faction, cover.classKey, cover.role), primeShipAsset(real.faction, real.classKey, real.role)] : [primeShipAsset(real.faction, real.classKey, real.role)];
            Promise.all(required).then(() => {
              if (ctx.world.currentSystem === curSys && ctx.world.records.includes(best) && best.state === 'enroute' && !best.live) best.assetReady = true;
            }).catch((error) => console.error(`NPC asset prime failed for ${best.id ?? best.name ?? 'record'}`, error)).finally(() => {
              best.assetPending = false;
            });
          }
          return;
        }
        recordPosition(best, _pos);
        const live = spawnLiveShip(ctx, best, _pos);
        if (live) {
          if (retire) {
            removeLiveShip(ctx, retire);
            ctx.ships.splice(ctx.ships.indexOf(retire), 1);
            retire.record.live = false;
          }
          if (!ctx.ships.includes(live)) ctx.ships.push(live);
          best.live = true;
        }
      }
    },
  };
}
