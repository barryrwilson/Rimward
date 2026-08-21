import { SYSTEMS, FACTIONS, rankFor } from './state.js';
import { standingRead } from './data-trade.js';

/** UNIQUE_FOUR_HEADROOM + CHAIN_STEPS. Add only this room to the live sanitize cap. */
export const CHAIN_ROOM = 7;
export const CHAIN_STEPS = 3;
export const CHAIN_NEED = 1;

const EMPLOYER_KEYS = Object.freeze(['freehold', 'redledger', 'veridian', 'hollow']);

/** Authored home dock. Employer flag is SYSTEMS[origin].faction, never job.faction. */
export const CHAIN_ORIGIN = Object.freeze({
  freehold: 'freehold',
  redledger: 'redmarch',
  veridian: 'veridian',
  hollow: 'hollowreach',
});

/** Step-2 named dest. Must be a real station system ≠ origin. */
export const CHAIN_DEST2 = Object.freeze({
  freehold: 'veridian',
  redledger: 'veridian',
  veridian: 'freehold',
  hollow: 'redmarch',
});

/** Last-step SKU. dart/auto only when canSeat; Veridian/Hollow none. */
export const CHAIN_GRANT = Object.freeze({
  freehold: Object.freeze({ id: 'dart', seat: 'missile', slot: 'launcher' }),
  redledger: Object.freeze({ id: 'auto', seat: 'turret', slot: 'turret' }),
  veridian: null,
  hollow: null,
});

const CHAIN_ID_SET = new Set();
for (let i = 0; i < EMPLOYER_KEYS.length; i++) {
  const emp = EMPLOYER_KEYS[i];
  for (let step = 1; step <= CHAIN_STEPS; step++) {
    CHAIN_ID_SET.add(`chain-${emp}-${step}`);
  }
}
export const CHAIN_IDS = CHAIN_ID_SET;

export function isChainId(id) {
  return typeof id === 'string' && CHAIN_IDS.has(id);
}

export function parseChainId(id) {
  if (!isChainId(id)) return null;
  const parts = id.split('-');
  if (parts.length !== 3 || parts[0] !== 'chain') return null;
  const employerKey = parts[1];
  const step = +parts[2];
  if (!Object.hasOwn(CHAIN_ORIGIN, employerKey)) return null;
  if (step !== 1 && step !== 2 && step !== 3) return null;
  return { employerKey, step };
}

export function chainOriginSystem(employerKey) {
  if (typeof employerKey !== 'string' || !Object.hasOwn(CHAIN_ORIGIN, employerKey)) return null;
  const origin = CHAIN_ORIGIN[employerKey];
  return Object.hasOwn(SYSTEMS, origin) ? origin : null;
}

export function chainDestSystem(employerKey, step) {
  if (step !== 2) return null;
  if (typeof employerKey !== 'string' || !Object.hasOwn(CHAIN_DEST2, employerKey)) return null;
  const dest = CHAIN_DEST2[employerKey];
  return dest && Object.hasOwn(SYSTEMS, dest) ? dest : null;
}

export function chainEmployerFaction(originSystem) {
  if (typeof originSystem !== 'string' || !Object.hasOwn(SYSTEMS, originSystem)) return null;
  const faction = SYSTEMS[originSystem].faction;
  if (typeof faction !== 'string' || !Object.hasOwn(FACTIONS, faction)) return null;
  return faction;
}

export function chainGrantSpec(employerKey) {
  if (typeof employerKey !== 'string' || !Object.hasOwn(CHAIN_GRANT, employerKey)) return null;
  return CHAIN_GRANT[employerKey];
}

export function chainStandingGate(reputation, employerFaction) {
  return rankFor(standingRead(reputation, employerFaction)).tier >= 1;
}

function stationDisplayName(sysId, fallback) {
  const label = fallback ?? 'the dock';
  if (!Object.hasOwn(SYSTEMS, sysId)) return label;
  const raw = SYSTEMS[sysId].station?.name ?? SYSTEMS[sysId].name;
  if (typeof raw !== 'string' || !raw) return label;
  return raw;
}

function factionDisplayName(key) {
  if (typeof key !== 'string' || !Object.hasOwn(FACTIONS, key)) return '';
  const name = FACTIONS[key].name;
  return typeof name === 'string' && name ? name : '';
}

export function chainCardCopy(employerKey, step) {
  const origin = chainOriginSystem(employerKey);
  const dest = chainDestSystem(employerKey, 2);
  const homeName = stationDisplayName(origin, 'the home dock');
  const destName = stationDisplayName(dest, 'the far dock');
  const facName = factionDisplayName(employerKey) || 'the dock flag';
  if (step === 1) {
    return {
      title: `File the ${facName} brief`,
      detail: `Dock at ${homeName} and file the first paper for ${facName}.`,
    };
  }
  if (step === 2) {
    return {
      title: `Carry word to ${destName}`,
      detail: `Dock at ${destName} with the brief. Paid when you file.`,
    };
  }
  return {
    title: `Seal the ${facName} chain`,
    detail: `Return to ${homeName} and file the last paper for ${facName}.`,
  };
}

export function makeChainJob(employerKey, step) {
  const parsedOk = step === 1 || step === 2 || step === 3;
  if (!parsedOk || !Object.hasOwn(CHAIN_ORIGIN, employerKey)) return null;
  const id = `chain-${employerKey}-${step}`;
  if (!CHAIN_IDS.has(id)) return null;
  const origin = chainOriginSystem(employerKey);
  if (!origin) return null;
  if (step === 2) {
    const dest = chainDestSystem(employerKey, 2);
    if (!dest || dest === origin) return null;
  }
  const copy = chainCardCopy(employerKey, step);
  const job = {
    id,
    kind: 'chain',
    originSystem: origin,
    title: copy.title,
    detail: copy.detail,
    reward: 0,
    need: CHAIN_NEED,
    progress: 0,
    state: 'offered',
  };
  if (step === 2) job.destSystem = chainDestSystem(employerKey, 2);
  return job;
}

export function liveChainForEmployer(jobs, employerKey) {
  if (!Array.isArray(jobs) || !Object.hasOwn(CHAIN_ORIGIN, employerKey)) return null;
  for (let i = 0; i < jobs.length; i++) {
    const j = jobs[i];
    if (!j || j.kind !== 'chain') continue;
    const parsed = parseChainId(j.id);
    if (!parsed || parsed.employerKey !== employerKey) continue;
    if (j.state === 'offered' || j.state === 'accepted' || j.state === 'done') return j;
  }
  return null;
}

export function chainEmployerKeys() {
  return EMPLOYER_KEYS;
}
