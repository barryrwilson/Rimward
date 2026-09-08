import { resolveBand } from './state.js';

// One resolve sample's damage receipts, scoped to the live incarnation.
// Never attach these to a saved record or reuse them after a sample.
const damageReceipts = new WeakMap();

export function scareDamageTotal(state) {
  return state.screen + state.shell + state.hull + state.engine;
}

export function recordScareDamage(live, fromPlayer, before, now) {
  if (!(scareDamageTotal(live.state) < before)) return; // immune/no-effect hit
  let receipt = damageReceipts.get(live);
  if (!receipt) {
    receipt = { at: now, player: false, contested: false };
    damageReceipts.set(live, receipt);
  }
  receipt.at = now;
  receipt.player = fromPlayer === true;
  // Mixed attackers in one sample are ambiguous, even if the player hits last.
  receipt.contested ||= fromPlayer !== true;
}

export function takeScareDamage(live) {
  const receipt = damageReceipts.get(live);
  damageReceipts.delete(live);
  return receipt;
}

export function awardFirstScare(ctx, live, previousResolve, receipt, now, maxAge) {
  if (!receipt?.player || receipt.contested || now < receipt.at || now - receipt.at >= maxAge) return false;
  const st = live.state;
  if (st.destroyed || st.disabled || !(st.resolve < previousResolve)) return false;
  const before = resolveBand(previousResolve);
  const after = resolveBand(st.resolve);
  if (before === 'bargaining' || before === 'capitulate') return false;
  if (after !== 'bargaining' && after !== 'capitulate') return false;
  if (ctx.world.milestones.includes('firstScare')) return false;
  ctx.world.milestones.push('firstScare');
  const rec = live.record;
  // Same visible-name rule as the HUD/agent target: the Mk II eye pierces
  // an unrevealed cover; the authored record name otherwise precedes state.
  const scanner = Number.isFinite(ctx.world.scanner) ? ctx.world.scanner : 0;
  const masked = rec?.qship && !rec.revealed && scanner < 2;
  const cover = masked && typeof rec.coverName === 'string' && rec.coverName;
  const named = (typeof rec?.name === 'string' && rec.name)
    || (typeof st.name === 'string' && st.name) || 'CONTACT';
  ctx.emit('milestone', {
    id: 'firstScare',
    line: 'They are breaking. First scare.',
    cause: 'player-damage',
    targetId: live.id,
    targetName: cover || named,
  });
  return true;
}
