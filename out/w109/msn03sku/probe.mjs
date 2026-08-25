/**
 * Wave 109 MSN-03 remaining unique SKU probe.
 * Standalone: node out/w109/msn03sku/probe.mjs
 */
import { register } from 'node:module';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '../../..');
register(pathToFileURL(join(root, 'scripts/css-hook.mjs')).href, import.meta.url);

const {
  CHAIN_GRANT,
  chainGrantSpec,
  parseChainId,
  CHAIN_IDS,
  chainEmployerKeys,
} = await import(pathToFileURL(join(root, 'src/game/jobs-chains.js')).href);
const {
  canSeat,
  isLauncherId,
  isTurretId,
  LAUNCHER_IDS,
  TURRET_IDS,
} = await import(pathToFileURL(join(root, 'src/game/weapon-fit.js')).href);
const { writeMountedGear } = await import(pathToFileURL(join(root, 'src/game/hangar.js')).href);
const { WORLD_FIELDS } = await import(pathToFileURL(join(root, 'src/game/save.js')).href);
const { MOUNT_TABLE } = await import(pathToFileURL(join(root, 'src/game/state.js')).href);

const station = readFileSync(join(root, 'src/systems/station.js'), 'utf8');
const chains = readFileSync(join(root, 'src/game/jobs-chains.js'), 'utf8');
const stateSrc = readFileSync(join(root, 'src/game/state.js'), 'utf8');
const saveSrc = readFileSync(join(root, 'src/game/save.js'), 'utf8');

let fails = 0;
function pin(name, ok) {
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}`);
  if (!ok) fails++;
  return ok;
}

const grantSrc = (() => {
  const start = station.indexOf('function grantChainSku(ctx, employerKey)');
  const finish = station.indexOf('function finishChainStep(ctx, job, parsed)');
  return start >= 0 && finish > start ? station.slice(start, finish) : '';
})();
const finishSrc = (() => {
  const start = station.indexOf('function finishChainStep(ctx, job, parsed)');
  const next = station.indexOf('function warPayComplete(ctx, job, rec)');
  return start >= 0 && next > start ? station.slice(start, next) : '';
})();
const chainTick = (() => {
  const start = station.indexOf("if (job.kind === 'chain')");
  const next = station.indexOf("if (job.state !== 'accepted') continue;", start);
  return start >= 0 && next > start ? station.slice(start, next) : '';
})();
const jobsRender = (() => {
  const start = station.indexOf('function renderJobs(panel)');
  const next = station.indexOf('function renderBar(panel)');
  return start >= 0 && next > start ? station.slice(start, next) : '';
})();
const worldFields = saveSrc.slice(
  saveSrc.indexOf('export const WORLD_FIELDS'),
  saveSrc.indexOf('const SURVIVOR'),
);

function hullCtx(classKey) {
  return {
    world: {
      credits: 100,
      launcher: '',
      missileAmmo: 0,
      turret: '',
      hangar: {
        mountedId: 'w109',
        hulls: [{
          id: 'w109',
          classKey,
          hullKind: 'built',
          faction: 'independent',
          name: 'W109',
          scanner: 0,
          miningLaser: 0,
          concealedMounts: false,
          cargoCapacity: 20,
          cargo: [],
          launcher: '',
          turret: '',
          missileAmmo: 0,
        }],
      },
    },
    player: { classKey },
  };
}

function grantLike(ctx, employerKey) {
  if (typeof employerKey !== 'string') return false;
  const spec = chainGrantSpec(employerKey);
  if (!spec || typeof spec !== 'object' || Array.isArray(spec)) return false;
  if (!Object.isFrozen(spec)) return false;
  if (!Object.hasOwn(spec, 'id') || !Object.hasOwn(spec, 'seat') || !Object.hasOwn(spec, 'slot')) {
    return false;
  }
  const idOk = (spec.id === 'dart' && isLauncherId(spec.id))
    || (spec.id === 'auto' && isTurretId(spec.id));
  if (!idOk) return false;
  if (!canSeat(ctx?.player?.classKey, spec.seat)) return false;
  let row = null;
  if (spec.slot === 'launcher') {
    row = writeMountedGear(ctx, { launcher: spec.id });
    if (!row || row.launcher !== spec.id) return false;
  } else if (spec.slot === 'turret') {
    row = writeMountedGear(ctx, { turret: spec.id });
    if (!row || row.turret !== spec.id) return false;
  } else {
    return false;
  }
  return true;
}

pin('CHAIN_GRANT freehold dart', CHAIN_GRANT.freehold?.id === 'dart'
  && CHAIN_GRANT.freehold?.seat === 'missile'
  && CHAIN_GRANT.freehold?.slot === 'launcher'
  && Object.isFrozen(CHAIN_GRANT.freehold));
pin('CHAIN_GRANT redledger auto', CHAIN_GRANT.redledger?.id === 'auto'
  && CHAIN_GRANT.redledger?.seat === 'turret'
  && CHAIN_GRANT.redledger?.slot === 'turret'
  && Object.isFrozen(CHAIN_GRANT.redledger));
pin('CHAIN_GRANT veridian auto', CHAIN_GRANT.veridian?.id === 'auto'
  && CHAIN_GRANT.veridian?.seat === 'turret'
  && CHAIN_GRANT.veridian?.slot === 'turret'
  && Object.isFrozen(CHAIN_GRANT.veridian)
  && chainGrantSpec('veridian') === CHAIN_GRANT.veridian);
pin('CHAIN_GRANT hollow dart', CHAIN_GRANT.hollow?.id === 'dart'
  && CHAIN_GRANT.hollow?.seat === 'missile'
  && CHAIN_GRANT.hollow?.slot === 'launcher'
  && Object.isFrozen(CHAIN_GRANT.hollow)
  && chainGrantSpec('hollow') === CHAIN_GRANT.hollow);
pin('no gilded key', !Object.hasOwn(CHAIN_GRANT, 'gilded')
  && chainGrantSpec('gilded') === null
  && !chainEmployerKeys().includes('gilded')
  && parseChainId('chain-gilded-1') === null
  && !CHAIN_IDS.has('chain-gilded-1'));
pin('chainGrantSpec Object.hasOwn + unknown null',
  chains.includes('Object.hasOwn(CHAIN_GRANT, employerKey)')
  && chainGrantSpec('__proto__') === null
  && chainGrantSpec('constructor') === null
  && chainGrantSpec(12) === null);

const light = hullCtx('light');
const lightOk = grantLike(light, 'veridian');
pin('light canSeat false +2 fail-closed', !canSeat('light', 'missile')
  && !canSeat('light', 'turret')
  && MOUNT_TABLE.light.missile === 0
  && MOUNT_TABLE.light.turret === 0
  && lightOk === false
  && light.world.launcher === ''
  && light.world.turret === ''
  && (Number.isFinite(light.world.credits) ? light.world.credits + 2 : light.world.credits) === 102
  && finishSrc.includes('ctx.world.credits += 2')
  && !grantSrc.includes('credits'));

const heavyV = hullCtx('heavy');
const aceH = hullCtx('ace');
const frigF = hullCtx('frigate');
const aceR = hullCtx('ace');
pin('heavy veridian seats auto', grantLike(heavyV, 'veridian') && heavyV.world.turret === 'auto');
pin('ace hollow seats empty dart', grantLike(aceH, 'hollow')
  && aceH.world.launcher === 'dart'
  && aceH.world.missileAmmo === 0);
pin('frigate freehold seats empty dart', grantLike(frigF, 'freehold')
  && frigF.world.launcher === 'dart'
  && frigF.world.missileAmmo === 0);
pin('ace redledger seats auto', grantLike(aceR, 'redledger') && aceR.world.turret === 'auto');
pin('grant patch launcher/turret only + verify', grantSrc.includes('{ launcher: spec.id }')
  && grantSrc.includes('{ turret: spec.id }')
  && !grantSrc.includes('missileAmmo')
  && grantSrc.includes('row.launcher !== spec.id')
  && grantSrc.includes('row.turret !== spec.id')
  && grantSrc.includes("typeof employerKey !== 'string'"));

pin('proto chain drop still no pay / no +2', parseChainId('chain-__proto__-1') === null
  && !CHAIN_IDS.has('chain-__proto__-1')
  && chainTick.includes('jobs.splice(idx, 1)')
  && !/\+=\s*2/.test(chainTick)
  && !/grantChainSku/.test(chainTick)
  && !/credits/.test(chainTick));

const grantCalls = (station.match(/grantChainSku\(/g) || []).length;
pin('unique four still does not call grantChainSku', grantCalls === 2
  && finishSrc.includes('grantChainSku(ctx, parsed.employerKey)')
  && !/bounty-ace[\s\S]{0,400}grantChainSku\(/.test(station)
  && !/patrol-lane[\s\S]{0,400}grantChainSku\(/.test(station)
  && !/haul-provisions[\s\S]{0,400}grantChainSku\(/.test(station)
  && !/ferry-consignment[\s\S]{0,400}grantChainSku\(/.test(station));

pin('Digit 0 shipyard', station.includes('i === DOCK_KEY_SERVICES.length - 1 ? 0')
  && station.includes("'shipyard'")
  && station.includes('selectService(DOCK_KEY_SERVICES[DOCK_KEY_SERVICES.length - 1])'));
pin('Digit 2 Jobs', station.includes("export const DOCK_KEY_SERVICES = Object.freeze(['market', 'jobs', 'bar', 'feed', 'repair', 'outfitting', 'people', 'launch', 'epics', 'shipyard'])")
  && jobsRender.includes('JOBS BOARD'));
pin('Digit 8/9 unchanged', station.includes("'launch', 'epics'")
  && station.includes('Digit 8 on the dock root is Launch; Digit 9 is Standing.'));
pin('no new WORLD_FIELDS / no state.js write', !/chainSku/.test(worldFields)
  && WORLD_FIELDS.includes('hangar')
  && WORLD_FIELDS.includes('launcher')
  && !/CHAIN_GRANT/.test(stateSrc)
  && !/grantChainSku/.test(stateSrc));
pin('no innerHTML in station.js', !/innerHTML/.test(station)
  && station.includes("overlay.textContent = ''"));
pin('Digit 2 chain copy catalog names not shop costs',
  jobsRender.includes('Last paper may seat a ${skuName} if this hull has a hardpoint.')
  && jobsRender.includes('Last paper pays ${est} UU at the home dock')
  && !jobsRender.includes('6500')
  && !jobsRender.includes('4200')
  && LAUNCHER_IDS.dart.name === 'Dart rack'
  && TURRET_IDS.auto.name === 'Auto turret'
  && LAUNCHER_IDS.dart.cost === 6500
  && TURRET_IDS.auto.cost === 4200
  && finishSrc.includes("' Gear seated.'")
  && finishSrc.includes("' Compact thanks +2 UU.'"));
pin('grant never writes credits; fail UU last-step only',
  !grantSrc.includes('credits')
  && finishSrc.includes('if (!granted && Number.isFinite(ctx.world.credits)) ctx.world.credits += 2')
  && finishSrc.includes('parsed.step < 3'));

if (fails === 0) {
  console.log('PROBE PASS');
  process.exit(0);
}
console.log(`PROBE FAIL — ${fails} pins`);
process.exit(1);
