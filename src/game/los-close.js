/**
 * Signed LOS close rate. Pure: no DOM, no WEAPONS index, no persist.
 * along = relVel · los / |los| when |los| > ε, else 0.
 * Negative = approach (d(dist)/dt). Do not use speed magnitude.
 */

const LOS_EPS_SQ = 1e-4;

function num3(v) {
  return !!v && typeof v === 'object'
    && Number.isFinite(v.x) && Number.isFinite(v.y) && Number.isFinite(v.z);
}

/**
 * @param {{x:number,y:number,z:number}} fromPos
 * @param {{x:number,y:number,z:number}} targetPos
 * @param {{x:number,y:number,z:number}} relVel targetVel − ship.velocity
 * @returns {number}
 */
export function losCloseRate(fromPos, targetPos, relVel) {
  if (!num3(fromPos) || !num3(targetPos) || !num3(relVel)) return 0;
  const lx = targetPos.x - fromPos.x;
  const ly = targetPos.y - fromPos.y;
  const lz = targetPos.z - fromPos.z;
  const losSq = lx * lx + ly * ly + lz * lz;
  if (!(losSq > LOS_EPS_SQ)) return 0;
  return (relVel.x * lx + relVel.y * ly + relVel.z * lz) / Math.sqrt(losSq);
}
