/**
 * Fronted-consignment accounting (issue #177).
 *
 * A ferry contract fronts its units FREE on accept (station.js acceptJob), so
 * the hold can carry goods the player does not own. Nothing new is persisted:
 * the fronted quantity is DERIVED from the live contract list, so an accept,
 * a delivery, a short landing, a save and a reload all move the split with no
 * migration and no new save field.
 *
 * Ownership rule: fronted units are counted first, so the units the player can
 * sell are whatever is left over. A hold that is already short of the
 * consignment reports every remaining unit as consigned and none as owned —
 * the contract still wants them back.
 */

// The ferry is the only contract that fronts goods, and it fronts Provisions.
const FERRY_COMMODITY = 'provisions';
// Matches station.js FERRY_UNITS; used only when an old job row lacks `need`.
const FERRY_FALLBACK_UNITS = 4;

/** Units of `commodity` aboard, ignoring nothing — same sum as holdUnits(). */
export function heldUnitsOf(cargo, commodity) {
  if (!Array.isArray(cargo)) return 0;
  let n = 0;
  for (let i = 0; i < cargo.length; i++) {
    const row = cargo[i];
    if (!row || typeof row !== 'object') continue;
    if (row.commodity !== commodity) continue;
    const units = Number(row.units);
    if (Number.isFinite(units) && units > 0) n += units;
  }
  return n;
}

/** Units still fronted by accepted contracts, before any hold clamp. */
function frontedDemand(ctx, commodity) {
  if (commodity !== FERRY_COMMODITY) return 0;
  const jobs = ctx?.world?.jobs;
  if (!Array.isArray(jobs)) return 0;
  let n = 0;
  const seen = new Set();
  for (let i = 0; i < jobs.length; i++) {
    const job = jobs[i];
    if (!job || typeof job !== 'object') continue;
    if (job.kind !== 'ferry' || job.state !== 'accepted') continue;
    // The board keeps duplicate handles of a unique posting; count it once.
    const id = typeof job.id === 'string' && job.id ? job.id : null;
    if (id) {
      if (seen.has(id)) continue;
      seen.add(id);
    }
    const need = Number(job.need);
    n += Number.isFinite(need) && need >= 1 ? Math.floor(need) : FERRY_FALLBACK_UNITS;
  }
  return n;
}

/**
 * The hold split for one commodity: what is aboard, what a contract fronted,
 * and what the player actually owns. `held` may be passed in when the caller
 * already summed the hold.
 */
export function cargoSplit(ctx, commodity, held) {
  const aboard = Number.isFinite(held) && held > 0 ? Math.floor(held) : heldUnitsOf(ctx?.cargo, commodity);
  const consigned = Math.min(aboard, frontedDemand(ctx, commodity));
  return { held: aboard, consigned, owned: aboard - consigned };
}

/** Units of `commodity` the player owns outright and may sell. */
export function ownedUnits(ctx, commodity, held) {
  return cargoSplit(ctx, commodity, held).owned;
}

/** Units of `commodity` aboard on consignment. */
export function consignedUnits(ctx, commodity, held) {
  return cargoSplit(ctx, commodity, held).consigned;
}

/** Every fronted unit aboard, across commodities. */
export function consignedHoldUnits(ctx) {
  const cargo = ctx?.cargo;
  if (!Array.isArray(cargo)) return 0;
  const seen = new Set();
  let n = 0;
  for (let i = 0; i < cargo.length; i++) {
    const key = cargo[i]?.commodity;
    if (typeof key !== 'string' || !key || seen.has(key)) continue;
    seen.add(key); // one split per commodity, never once per row
    n += cargoSplit(ctx, key).consigned;
  }
  return n;
}

/** Player-facing split, e.g. `3 yours · 4 consigned`. Empty when none is fronted. */
export function splitLabel(split) {
  if (!split || !(split.consigned > 0)) return '';
  return `${split.owned} yours · ${split.consigned} consigned`;
}
