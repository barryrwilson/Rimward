// Extra BIO-01 hunt pins. Evidence only. Does not edit src/.
import { register } from 'node:module';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

register(new URL('../css-register.mjs', import.meta.url));

const here = dirname(fileURLToPath(import.meta.url));
mkdirSync(here, { recursive: true });

const { createShipState } = await import('../../../../src/game/state.js');
const { grantLivingSeedRow, HANGAR_CAP, sanitizeHangarRecord } = await import('../../../../src/game/hangar.js');
const {
  grantSwornGift,
  maybeGrantPirateSeed,
  giftNoticeFor,
  PIRATE_SEED_DROP_RATE,
  GIFT_HULL_ID,
  GIFT_OK_LINE,
  GIFT_FULL_LINE,
  GIFT_ALREADY_LINE,
  GIFT_NO_LINE,
} = await import('../../../../src/game/bio-seed.js');
const { WORLD_FIELDS } = await import('../../../../src/game/save.js');
const { DOCK_KEY_SERVICES } = await import('../../../../src/systems/station.js');
const { DATA_DROP_RATE } = await import('../../../../src/game/data-trade.js');
const { COMMODITIES } = await import('../../../../src/game/state.js');

const src = (rel) => readFileSync(join(here, '../../../..', rel), 'utf8');
const hangarSrc = src('src/game/hangar.js');
const bioSrc = src('src/game/bio-seed.js');
const stationSrc = src('src/systems/station.js');
const npcSrc = src('src/systems/npc.js');
const hudSrc = src('src/systems/hud.js');
const stateSrc = src('src/game/state.js');

function ctxOf(faction, extra = {}) {
  const player = extra.player ?? createShipState('light', { name: 'Hunt' });
  if (extra.hullKind) player.hullKind = extra.hullKind;
  else if (!player.hullKind) player.hullKind = 'living';
  const hulls = extra.hulls ?? [{
    id: 'hull_starter', hullKind: player.hullKind, classKey: 'light', faction: 'independent', name: 'She',
  }];
  const lines = [];
  return {
    flags: { docked: extra.docked !== false },
    world: {
      currentSystem: 'hunt',
      credits: extra.credits ?? 9000,
      reputation: { [faction]: extra.rep ?? 50 },
      hangar: { mountedId: extra.mountedId ?? hulls[0].id, hulls },
    },
    systems: { hunt: { faction } },
    cargo: extra.cargo ?? [],
    cargoCapacity: 20,
    player,
    ship: { object: { position: { toArray: () => [0, 0, 0] }, quaternion: { toArray: () => [0, 0, 0, 1] } } },
    emit(type, payload) { if (type === 'commLine') lines.push(payload); },
    lines,
  };
}

function fill(n) {
  return Array.from({ length: n }, (_, i) => ({
    id: i === 0 ? 'hull_starter' : `hull_fill_${i}`,
    hullKind: 'living', classKey: 'light', faction: 'independent', name: 'Fill',
  }));
}

const pirateLive = (extra = {}) => ({
  record: { faction: extra.recFac ?? 'beautiful' },
  state: { faction: extra.stFac ?? 'beautiful' },
  ai: { lastAttacker: extra.last ?? 'player', pirateSeedRolled: extra.rolled },
  role: extra.role ?? 'trader',
  kind: extra.kind,
});

const fails = [];
const log = [];
function ok(name, cond) {
  if (!cond) fails.push(name);
  const line = `${cond ? 'ok' : 'FAIL'} ${name}`;
  log.push(line);
  console.log(line);
}

// Double confirm / gift twice
const g = ctxOf('beautiful', { hullKind: 'built' });
const mounted = g.world.hangar.mountedId;
const kind = g.player.hullKind;
grantSwornGift(g);
const twice = grantSwornGift(g);
ok('gift.twice.already', twice.reason === 'already' && giftNoticeFor(twice) === GIFT_ALREADY_LINE);
ok('gift.twice.oneRow', g.world.hangar.hulls.filter((h) => h.id === GIFT_HULL_ID).length === 1);
ok('gift.built.noremount', g.world.hangar.mountedId === mounted && g.player.hullKind === 'built' && kind === 'built');
const giftRow = g.world.hangar.hulls.find((h) => h.id === GIFT_HULL_ID);
ok('gift.living.row', giftRow?.hullKind === 'living' && !Object.prototype.hasOwnProperty.call(giftRow, 'grafted'));

// Confirm while already + full prefers already
const both = ctxOf('beautiful', { hulls: fill(HANGAR_CAP) });
both.world.hangar.hulls[1].id = GIFT_HULL_ID;
const bothRes = grantSwornGift(both);
ok('gift.already.beats.full', bothRes.reason === 'already' && both.world.hangar.hulls.length === HANGAR_CAP);

// Proto / reserved ids
for (const bad of ['__proto__', 'prototype', 'constructor', 'toString', 'valueOf',
  '__defineGetter__', '__defineSetter__', '__lookupGetter__', '__lookupSetter__', 'hasOwnProperty']) {
  ok(`proto.${bad}`, grantLivingSeedRow(ctxOf('beautiful'), { id: bad }).ok === false);
}
ok('proto.object', grantLivingSeedRow(ctxOf('beautiful'), { id: Object.prototype }).ok === false);

// Pirate dump-then-destroy latch
const latchCtx = ctxOf('beautiful');
const live = pirateLive();
const first = maybeGrantPirateSeed(latchCtx, live, { rng: () => 0 });
const second = maybeGrantPirateSeed(latchCtx, live, { rng: () => 0 });
ok('pirate.dump.then.destroy.once', first.ok === true && second.reason === 'silent'
  && latchCtx.world.hangar.hulls.filter((h) => String(h.id).startsWith('hull_seed_pirate_')).length === 1);
ok('pirate.latch.flag', live.ai.pirateSeedRolled === true);

const missLatch = ctxOf('beautiful');
const missLive = pirateLive();
maybeGrantPirateSeed(missLatch, missLive, { rng: () => 1 });
const retry = maybeGrantPirateSeed(missLatch, missLive, { rng: () => 0 });
ok('pirate.miss.latched', retry.reason === 'silent' && missLatch.world.hangar.hulls.length === 1);

ok('pirate.station.silent', maybeGrantPirateSeed(ctxOf('beautiful'), pirateLive({ role: 'station' }), { rng: () => 0 }).reason === 'silent');
ok('pirate.unknowables.silent', maybeGrantPirateSeed(ctxOf('beautiful'), pirateLive({ stFac: 'unknowables' }), { rng: () => 0 }).reason === 'silent');

// Full hangar: no eviction, no cargo SKU
const pf = ctxOf('beautiful', { hulls: fill(HANGAR_CAP), cargo: [{ commodity: 'ore', units: 2 }] });
const pfIds = pf.world.hangar.hulls.map((h) => h.id).join(',');
const pfRes = maybeGrantPirateSeed(pf, pirateLive(), { rng: () => 0 });
ok('pirate.full.noevict', pfRes.reason === 'full' && pf.world.hangar.hulls.map((h) => h.id).join(',') === pfIds);
ok('pirate.full.nocargo', JSON.stringify(pf.cargo) === JSON.stringify([{ commodity: 'ore', units: 2 }]));

ok('rate.not.data', PIRATE_SEED_DROP_RATE === 0.05 && DATA_DROP_RATE === 0.20 && !bioSrc.includes('DATA_DROP_RATE'));
ok('no.commodities.seed', !Object.keys(COMMODITIES).some((k) => /seed/i.test(k)));
ok('no.state.sku', !/COMMODITIES[\s\S]{0,400}seed/.test(stateSrc));
ok('digit0.shipyard', DOCK_KEY_SERVICES[DOCK_KEY_SERVICES.length - 1] === 'shipyard' && DOCK_KEY_SERVICES[6] === 'people');
ok('people.digit7', DOCK_KEY_SERVICES.indexOf('people') === 6);
ok('no.innerHTML.bio', !/innerHTML/.test(bioSrc) && !/innerHTML/.test(hangarSrc));
ok('no.innerHTML.station.npc', !/innerHTML/.test(stationSrc) && !/innerHTML/.test(npcSrc));
ok('hud.no.write.kind', !/player\.hullKind\s*=/.test(hudSrc));
ok('bio.no.write.kind', !/player\.hullKind\s*=/.test(bioSrc));
ok('hangar.fields', WORLD_FIELDS.includes('hangar') && !WORLD_FIELDS.includes('seed') && !WORLD_FIELDS.includes('gift'));
ok('npc.two.hooks', (npcSrc.match(/maybeGrantPirateSeed/g) || []).length === 3);
ok('gift.arm.digit1.not.pending', stationSrc.includes("n === 1 && isSwornGiftVisible(ctx) && !ui.giftPending"));
ok('esc.cancel.gift', stationSrc.includes('cancelGiftPending()'));
ok('rank.no', giftNoticeFor(grantSwornGift(ctxOf('beautiful', { rep: 49 }))) === GIFT_NO_LINE);
ok('ok.line', GIFT_OK_LINE === 'A living seed rests in the hangar.');
ok('full.line', GIFT_FULL_LINE === 'The hangar is full.');

const healed = sanitizeHangarRecord({
  id: GIFT_HULL_ID, hullKind: 'living', grafted: true, classKey: 'light', faction: 'beautiful',
});
ok('graft.drop.living', healed?.hullKind === 'living' && !Object.prototype.hasOwnProperty.call(healed, 'grafted'));

const result = {
  pass: fails.length === 0,
  fails,
  log,
};
writeFileSync(join(here, 'hunt.json'), JSON.stringify(result, null, 2));
if (fails.length) {
  console.log('HUNT FAIL', fails.join(','));
  process.exit(1);
}
console.log('HUNT PASS');
