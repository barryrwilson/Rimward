import { SYSTEMS, U } from '../../src/game/state.js';

const st = SYSTEMS.as_census?.station?.position;
const ship = st ? [st[0] + 36, st[1], st[2]] : null;
const dist = st && ship
  ? Math.hypot(ship[0] - st[0], ship[1] - st[1], ship[2] - st[2])
  : null;
console.log(JSON.stringify({
  hasCensus: !!SYSTEMS.as_census,
  faction: SYSTEMS.as_census?.faction,
  station: st,
  dockRange: U.DOCK_RANGE,
  parkDist: dist,
  inZone: dist != null && dist <= U.DOCK_RANGE,
}, null, 2));
