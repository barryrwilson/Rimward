import { SYSTEMS, FACTIONS, rankFor } from './state.js';
import { sanitizeSystemId } from './nav.js';
import { stripControlChars } from './save.js';
import { standingRead } from './data-trade.js';

/**
 * Galaxy-chart hover model. Pure read of SYSTEMS + standingRead/rankFor.
 * No DOM. No persist. Does not write world.nav or emit.
 */

const RESERVED_IDS = new Set([
  '__proto__', 'prototype', 'constructor', 'toString', 'valueOf',
  'hasOwnProperty', '__defineGetter__', '__defineSetter__',
  '__lookupGetter__', '__lookupSetter__',
]);

function reservedKey(value) {
  if (typeof value !== 'string' || !value) return true;
  return RESERVED_IDS.has(value) || RESERVED_IDS.has(value.toLowerCase()) || value === '__proto__';
}

function factionDisplayName(key) {
  const rec = FACTIONS[key];
  const n = rec && typeof rec.name === 'string' ? rec.name : '';
  return n || key;
}

export function hoverModel(ctx, id) {
  const sid = sanitizeSystemId(id);
  if (!sid) return null;
  if (!Object.hasOwn(SYSTEMS, sid)) return null;

  const def = SYSTEMS[sid];
  const rawName = def && typeof def.name === 'string' && def.name ? def.name : sid;
  const cleaned = stripControlChars(rawName);
  const name = cleaned || sid;

  const key = def ? def.faction : undefined;
  if (typeof key !== 'string' || reservedKey(key) || !Object.hasOwn(FACTIONS, key)) {
    return {
      id: sid,
      name,
      political: 'unknown',
      factionKey: '',
      factionName: '',
      showStanding: false,
      rep: 0,
      rankName: '',
    };
  }

  const factionName = factionDisplayName(key);
  const political = key === 'independent' ? 'independent' : 'controlled';
  const bag = ctx && ctx.world ? ctx.world.reputation : undefined;
  const rep = standingRead(bag, key);
  const rank = rankFor(rep);
  return {
    id: sid,
    name,
    political,
    factionKey: key,
    factionName,
    showStanding: true,
    rep,
    rankName: rank && typeof rank.name === 'string' ? rank.name : '',
  };
}
