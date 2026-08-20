// Wave 68 PR3a — Outfitting Digit 8/9 papers. Helpers + source pins.
// Keydown lives in initStation and needs DOM. This probe does not boot WebGL.
// Run: node --import ./scripts/with-css-stub.mjs out/w68/pr3-desk/probe.mjs
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { register } from 'node:module';
register(new URL('../../../scripts/css-hook.mjs', import.meta.url));

const {
  DOCK_KEY_SERVICES,
  outfitLauncherState,
  outfitTurretState,
  armOutfitPapers,
  cancelOutfitPending,
  confirmOutfitPapers,
} = await import('../../../src/systems/station.js');
const { sanitizeHangar, writeMountedGear } = await import('../../../src/game/hangar.js');
const { createShipState } = await import('../../../src/game/state.js');
const { LAUNCHER_IDS, TURRET_IDS, canSeat } = await import('../../../src/game/weapon-fit.js');

const here = dirname(fileURLToPath(import.meta.url));
const stationSrc = readFileSync(join(here, '../../../src/systems/station.js'), 'utf8');

const fails = [];
function pin(name, cond, extra = '') {
  if (!cond) fails.push(extra ? `${name}: ${extra}` : name);
}

function makeCtx(classKey, extra = {}) {
  const hullKind = extra.hullKind ?? 'built';
  const launcher = extra.launcher ?? '';
  const missileAmmo = extra.missileAmmo ?? 0;
  const turret = extra.turret ?? '';
  const ctx = {
    flags: { docked: true },
    world: {
      credits: extra.credits ?? 20000,
      launcher,
      missileAmmo,
      turret,
      scanner: 0,
      miningLaser: 0,
      concealedMounts: false,
      hangar: {
        mountedId: 'h1',
        hulls: [{
          id: 'h1',
          classKey,
          hullKind,
          faction: 'independent',
          name: classKey,
          scanner: 0,
          miningLaser: 0,
          concealedMounts: false,
          cargoCapacity: 20,
          cargo: [],
          launcher,
          missileAmmo,
          turret,
        }],
      },
    },
    player: extra.player ?? createShipState(classKey, { name: 'PR3a', hullKind }),
    cargo: [],
    cargoCapacity: 20,
    emit() {},
  };
  sanitizeHangar(ctx);
  return ctx;
}

function uiOf(extra = {}) {
  return {
    level: extra.level ?? 2,
    service: extra.service ?? 'outfitting',
    outfitPending: extra.outfitPending ?? null,
    notice: extra.notice ?? '',
  };
}

// --- state helpers ---
{
  const light = outfitLauncherState('light', '', 0);
  pin('launch.light.noseat', light.kind === 'noseat' && light.cost === 0 && light.id === '');
  const offer = outfitLauncherState('heavy', '', 0);
  pin('launch.heavy.offer', offer.kind === 'offer' && offer.id === 'dart' && offer.cost === 6500);
  const restock = outfitLauncherState('heavy', 'dart', 4);
  pin('launch.heavy.restock', restock.kind === 'restock' && restock.id === 'dart' && restock.cost === 400);
  const living = outfitLauncherState('heavy', '', 0);
  pin('launch.living.heavy.offer', living.kind === 'offer' && living.cost === 6500);
  const proto = outfitLauncherState('heavy', '__proto__', 0);
  pin('launch.proto.offer', proto.kind === 'offer' && proto.id === 'dart');
  const god = outfitLauncherState('heavy', 'god', 99);
  pin('launch.god.offer', god.kind === 'offer' && god.cost === 6500);
}

{
  const light = outfitTurretState('light', '');
  pin('turret.light.noseat', light.kind === 'noseat' && light.cost === 0 && light.id === '');
  const offer = outfitTurretState('heavy', '');
  pin('turret.heavy.offer', offer.kind === 'offer' && offer.id === 'auto' && offer.cost === 4200);
  const seated = outfitTurretState('ace', 'auto');
  pin('turret.ace.seated', seated.kind === 'seated' && seated.id === 'auto' && seated.cost === 0);
  const proto = outfitTurretState('frigate', 'constructor');
  pin('turret.constructor.offer', proto.kind === 'offer' && proto.id === 'auto');
}

pin('catalog.dart.cost', LAUNCHER_IDS.dart.cost === 6500);
pin('catalog.dart.restock', LAUNCHER_IDS.dart.restockCost === 400 && LAUNCHER_IDS.dart.restockUnit === 2);
pin('catalog.auto.cost', TURRET_IDS.auto.cost === 4200);
pin('canSeat.heavy.missile', canSeat('heavy', 'missile') === true);
pin('canSeat.light.missile', canSeat('light', 'missile') === false);

// --- Digit 8 must not steal level-1 Launch ---
pin('dock.keys.10', DOCK_KEY_SERVICES.length === 10);
pin('dock.digit8.launch', DOCK_KEY_SERVICES[7] === 'launch');
pin('dock.digit9.epics', DOCK_KEY_SERVICES[8] === 'epics');
pin('dock.digit0.shipyard', DOCK_KEY_SERVICES[9] === 'shipyard');
pin('dock.digit6.outfitting', DOCK_KEY_SERVICES[5] === 'outfitting');
pin('dock.noEleventh', !DOCK_KEY_SERVICES.includes('weapons')
  && !DOCK_KEY_SERVICES.includes('missiles'));

const level1Block = stationSrc.slice(
  stationSrc.indexOf('if (ui.level === 1) {'),
  stationSrc.indexOf('// level 2'),
);
pin('src.level1.indexesDock', level1Block.includes('selectService(DOCK_KEY_SERVICES[i])'));
pin('src.level1.noOutfitDigit8', !/n === 8/.test(level1Block) && !/armOutfitPapers/.test(level1Block));
pin('src.level1.digit0.last', level1Block.includes('DOCK_KEY_SERVICES[DOCK_KEY_SERVICES.length - 1]'));

const outfitDigit = stationSrc.slice(
  stationSrc.indexOf("} else if (ui.service === 'outfitting') {"),
  stationSrc.indexOf("} else if (ui.service === 'launch') {"),
);
pin('src.outfit.digit17', outfitDigit.includes('n === 1') && outfitDigit.includes('n >= 5 && n <= 7'));
pin('src.outfit.digit89', outfitDigit.includes('n === 8 || n === 9') && outfitDigit.includes('armOutfitPapers'));
pin('src.outfit.noDebitOnDigit', !outfitDigit.includes('confirmOutfitPapers')
  && !outfitDigit.includes('credits -='));

pin('src.oneKeydown', (stationSrc.match(/window\.addEventListener\('keydown'/g) || []).length === 1);
pin('src.escCancelsOutfit', stationSrc.includes("ui.service === 'outfitting' && cancelOutfitPending(ui)"));
pin('src.confirmLabel', stationSrc.includes("'Confirm papers'"));
pin('src.h.textContent', /function h\(tag, cls, parent, text\) \{[\s\S]*?node\.textContent = text/.test(stationSrc));
pin('src.noInnerHtmlCatalog', !/innerHTML/.test(stationSrc));
const yardSrc = readFileSync(join(here, '../../../src/systems/shipyard-desk.js'), 'utf8');
pin('src.yard.noLauncherSku', !yardSrc.includes('LAUNCHER_IDS') && !yardSrc.includes('TURRET_IDS'));
pin('src.station.yardCallPlain', stationSrc.includes('renderShipyardDesk(h, btn, panel, ctx, ui, render)'));

// --- arm papers: no debit ---
{
  const ctx = makeCtx('heavy', { credits: 20000 });
  const ui = uiOf();
  const armed = armOutfitPapers(ctx, ui, 8);
  pin('arm8.ok', armed === true);
  pin('arm8.pending.kind', ui.outfitPending?.kind === 'offer' && ui.outfitPending?.id === 'dart');
  pin('arm8.pending.noCost', ui.outfitPending && !Object.hasOwn(ui.outfitPending, 'cost'));
  pin('arm8.noDebit', ctx.world.credits === 20000 && ctx.world.launcher === '');
}

{
  const ctx = makeCtx('light', { credits: 20000 });
  const ui = uiOf();
  armOutfitPapers(ctx, ui, 8);
  pin('arm8.light.noPending', ui.outfitPending == null);
  pin('arm8.light.notice', ui.notice === 'This hull has no launcher hardpoint.');
  pin('arm8.light.credits', ctx.world.credits === 20000);
}

{
  const ctx = makeCtx('heavy', { credits: 20000 });
  const ui = uiOf();
  armOutfitPapers(ctx, ui, 9);
  pin('arm9.pending', ui.outfitPending?.slot === 'turret' && ui.outfitPending?.id === 'auto');
  pin('arm9.noDebit', ctx.world.credits === 20000 && ctx.world.turret === '');
}

{
  const ctx = makeCtx('heavy', { credits: 20000, turret: 'auto' });
  const ui = uiOf();
  armOutfitPapers(ctx, ui, 9);
  pin('arm9.seated.noPending', ui.outfitPending == null);
}

{
  const ctx = makeCtx('heavy', { credits: 20000 });
  const ui = uiOf();
  armOutfitPapers(ctx, ui, 8);
  const first = ui.outfitPending;
  armOutfitPapers(ctx, ui, 9);
  pin('arm.pendingNoop', ui.outfitPending === first && ui.outfitPending?.id === 'dart');
}

{
  const ctx = makeCtx('heavy');
  const ui = uiOf();
  armOutfitPapers(ctx, ui, 8);
  pin('cancel.clears', cancelOutfitPending(ui) === true && ui.outfitPending == null);
  pin('cancel.empty', cancelOutfitPending(ui) === false);
}

// --- confirm: catalog price, live seat, no negative purse ---
{
  const ctx = makeCtx('heavy', { credits: 20000, hullKind: 'living' });
  ctx.player.hullKind = 'living';
  const ui = uiOf();
  armOutfitPapers(ctx, ui, 8);
  const result = confirmOutfitPapers(ctx, ui);
  const row = ctx.world.hangar.hulls[0];
  pin('buy.dart.ok', result.ok === true && result.price === 6500, result.reason);
  pin('buy.dart.credits', ctx.world.credits === 13500);
  pin('buy.dart.row', row.launcher === 'dart' && row.missileAmmo === 8);
  pin('buy.dart.world', ctx.world.launcher === 'dart' && ctx.world.missileAmmo === 8);
  pin('buy.dart.hullKind', row.hullKind === 'living' && ctx.player.hullKind === 'living');
  pin('buy.dart.pendingGone', ui.outfitPending == null);
}

{
  const ctx = makeCtx('heavy', { credits: 20000 });
  const ui = uiOf({
    outfitPending: { slot: 'launcher', kind: 'offer', id: 'dart', cost: 0, price: 1 },
  });
  const result = confirmOutfitPapers(ctx, ui);
  pin('buy.blobCost.ignored', result.ok === true && result.price === 6500);
  pin('buy.blobCost.debit', ctx.world.credits === 13500);
}

{
  const ctx = makeCtx('light', { credits: 20000 });
  const ui = uiOf({
    outfitPending: { slot: 'launcher', kind: 'offer', id: 'dart' },
  });
  const result = confirmOutfitPapers(ctx, ui);
  pin('buy.light.fail', result.ok === false);
  pin('buy.light.noDebit', ctx.world.credits === 20000);
  pin('buy.light.noRack', ctx.world.launcher === '' && ctx.world.hangar.hulls[0].launcher === '');
}

{
  const ctx = makeCtx('heavy', { credits: 6499 });
  const ui = uiOf();
  armOutfitPapers(ctx, ui, 8);
  const result = confirmOutfitPapers(ctx, ui);
  pin('buy.poor.fail', result.ok === false && result.reason === 'credits');
  pin('buy.poor.noDebit', ctx.world.credits === 6499 && ctx.world.launcher === '');
}

{
  const ctx = makeCtx('heavy', { credits: 6500 });
  const ui = uiOf();
  armOutfitPapers(ctx, ui, 8);
  const result = confirmOutfitPapers(ctx, ui);
  pin('buy.exact.ok', result.ok === true && ctx.world.credits === 0);
  pin('buy.exact.nonneg', ctx.world.credits >= 0);
}

{
  const ctx = makeCtx('heavy', { credits: 20000 });
  writeMountedGear(ctx, { launcher: 'dart', missileAmmo: 4 });
  const ui = uiOf();
  armOutfitPapers(ctx, ui, 8);
  pin('restock.arm.kind', ui.outfitPending?.kind === 'restock');
  const result = confirmOutfitPapers(ctx, ui);
  pin('restock.ok', result.ok === true && result.price === 400);
  pin('restock.ammo', ctx.world.missileAmmo === 6 && ctx.world.hangar.hulls[0].missileAmmo === 6);
  pin('restock.credits', ctx.world.credits === 19600);
}

{
  const ctx = makeCtx('heavy', { credits: 20000 });
  writeMountedGear(ctx, { launcher: 'dart', missileAmmo: 8 });
  const ui = uiOf();
  armOutfitPapers(ctx, ui, 8);
  const result = confirmOutfitPapers(ctx, ui);
  pin('restock.full.fail', result.ok === false && result.reason === 'full');
  pin('restock.full.noDebit', ctx.world.credits === 20000 && ctx.world.missileAmmo === 8);
}

{
  const ctx = makeCtx('heavy', { credits: 20000 });
  writeMountedGear(ctx, { launcher: 'dart', missileAmmo: 7 });
  const ui = uiOf();
  armOutfitPapers(ctx, ui, 8);
  const result = confirmOutfitPapers(ctx, ui);
  pin('restock.heal', result.ok === true && ctx.world.missileAmmo === 8);
  pin('restock.heal.credits', ctx.world.credits === 19600);
}

{
  const ctx = makeCtx('heavy', { credits: 20000, hullKind: 'living' });
  ctx.player.hullKind = 'living';
  const ui = uiOf();
  armOutfitPapers(ctx, ui, 9);
  const result = confirmOutfitPapers(ctx, ui);
  pin('buy.turret.ok', result.ok === true && result.price === 4200);
  pin('buy.turret.row', ctx.world.turret === 'auto' && ctx.world.hangar.hulls[0].turret === 'auto');
  pin('buy.turret.credits', ctx.world.credits === 15800);
  pin('buy.turret.hullKind', ctx.player.hullKind === 'living' && ctx.world.hangar.hulls[0].hullKind === 'living');
}

{
  const ctx = makeCtx('cutter', { credits: 20000 });
  const ui = uiOf({
    outfitPending: { slot: 'turret', kind: 'offer', id: 'auto' },
  });
  const result = confirmOutfitPapers(ctx, ui);
  pin('buy.turret.cutter.fail', result.ok === false);
  pin('buy.turret.cutter.noDebit', ctx.world.credits === 20000 && ctx.world.turret === '');
}

{
  const ctx = makeCtx('heavy', { credits: 20000 });
  const ui = uiOf({
    outfitPending: { slot: 'launcher', kind: 'offer', id: '__proto__' },
  });
  const result = confirmOutfitPapers(ctx, ui);
  pin('buy.proto.fail', result.ok === false);
  pin('buy.proto.noDebit', ctx.world.credits === 20000 && ctx.world.launcher === '');
}

{
  const ctx = makeCtx('heavy', { credits: 20000 });
  const ui = uiOf();
  const empty = confirmOutfitPapers(ctx, ui);
  pin('confirm.empty', empty.ok === false && empty.reason === 'invalid');
  pin('arm.badDigit', armOutfitPapers(ctx, ui, 7) === false && ui.outfitPending == null);
}

{
  const ctx = makeCtx('heavy', { credits: 20000 });
  const dock = uiOf({ level: 1, service: null });
  pin('arm.level1.refuse', armOutfitPapers(ctx, dock, 8) === false && dock.outfitPending == null);
  pin('arm.level1.noDebit', ctx.world.credits === 20000);
  dock.outfitPending = { slot: 'launcher', kind: 'offer', id: 'dart' };
  const stole = confirmOutfitPapers(ctx, dock);
  pin('confirm.level1.refuse', stole.ok === false);
  pin('confirm.level1.noDebit', ctx.world.credits === 20000 && ctx.world.launcher === '');
  pin('confirm.level1.pendingKept', dock.outfitPending?.id === 'dart');
}

{
  const ctx = makeCtx('heavy', { credits: 20000 });
  const ui = uiOf();
  ui.outfitPending = Object.create({ slot: 'launcher', kind: 'offer', id: 'dart' });
  const result = confirmOutfitPapers(ctx, ui);
  pin('confirm.protoInherit.fail', result.ok === false);
  pin('confirm.protoInherit.noDebit', ctx.world.credits === 20000 && ctx.world.launcher === '');
}

{
  pin('h.usesTextContent', stationSrc.includes('node.textContent = text'));
  pin('desk.needsDom', stationSrc.includes("window.addEventListener('keydown'")
    && stationSrc.includes('document.createElement'));
}

if (fails.length) {
  console.log('W68 PR3a DESK PROBE FAIL');
  for (const f of fails) console.log('  ', f);
  process.exit(1);
}
console.log('W68 PR3a DESK PROBE PASS', fails.length);
process.exit(0);
