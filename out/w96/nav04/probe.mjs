// Wave 96 NAV-04 hoverModel pins. Run:
// node --import ./scripts/with-css-stub.mjs out/w96/nav04/probe.mjs
import { readFileSync } from 'node:fs';
import { SYSTEMS, FACTIONS, rankFor } from '../../../src/game/state.js';
import { standingRead } from '../../../src/game/data-trade.js';
import { hoverModel } from '../../../src/game/chart-hover.js';

const results = {};
const fails = [];

function pin(name, cond, extra = '') {
  results[name] = !!cond;
  if (!cond) fails.push(extra ? `${name}: ${extra}` : name);
}

function digit9(model) {
  return `${model.factionName}: ${model.rankName} (${model.rep >= 0 ? '+' : ''}${Math.round(model.rep)})`;
}

function ctxOf(rep) {
  return {
    world: { reputation: rep },
    emit() { throw new Error('hoverModel must not emit'); },
  };
}

function firstIndependentId() {
  for (const id of Object.keys(SYSTEMS)) {
    if (SYSTEMS[id] && SYSTEMS[id].faction === 'independent') return id;
  }
  return null;
}

function withTemp(id, rec, fn) {
  const prev = Object.hasOwn(SYSTEMS, id) ? SYSTEMS[id] : undefined;
  const had = Object.hasOwn(SYSTEMS, id);
  SYSTEMS[id] = rec;
  try {
    return fn();
  } finally {
    if (had) SYSTEMS[id] = prev;
    else delete SYSTEMS[id];
  }
}

const hoverSrc = readFileSync(new URL('../../../src/game/chart-hover.js', import.meta.url), 'utf8');
const chartSrc = readFileSync(new URL('../../../src/systems/galaxychart.js', import.meta.url), 'utf8');
const cssSrc = readFileSync(new URL('../../../src/ui/hud.css', import.meta.url), 'utf8');

const independentId = firstIndependentId();
pin('catalog.hasIndependent', !!independentId, 'no independent system in SYSTEMS');

const emptyCtx = ctxOf({});
pin('id.protoNull', hoverModel(emptyCtx, '__proto__') === null);
pin('id.constructorNull', hoverModel(emptyCtx, 'constructor') === null);
pin('id.prototypeNull', hoverModel(emptyCtx, 'prototype') === null);
pin('id.missingNull', hoverModel(emptyCtx, 'nav04_not_a_system') === null);
pin('id.nonStringNull', hoverModel(emptyCtx, 12) === null);

const freehold = hoverModel(emptyCtx, 'freehold');
pin('freehold.ok', !!freehold && freehold.id === 'freehold');
pin('freehold.name', !!freehold && freehold.name === 'Freehold Drift');
pin('freehold.political', !!freehold && freehold.political === 'controlled');
pin('freehold.factionKey', !!freehold && freehold.factionKey === 'freehold');
pin('freehold.factionName', !!freehold && freehold.factionName === FACTIONS.freehold.name);
pin('freehold.showStanding', !!freehold && freehold.showStanding === true);
pin('freehold.missingRepStranger', !!freehold && freehold.rep === 0 && freehold.rankName === 'Stranger');
pin('freehold.digit9', !!freehold && digit9(freehold) === 'Freehold Compact: Stranger (+0)');

const hollow = hoverModel(emptyCtx, 'hollowreach');
pin('hollow.ok', !!hollow && hollow.political === 'controlled');
pin('hollow.name', !!hollow && hollow.factionName === 'Hollow Reach');
pin('hollow.notUnclaimed', !!hollow && hollow.factionName !== 'Unclaimed' && !String(hollow.factionName).includes('Unclaimed'));
pin('hollow.key', !!hollow && hollow.factionKey === 'hollow');

const veil = hoverModel(emptyCtx, 'veil');
pin('veil.ok', !!veil && veil.political === 'controlled');
pin('veil.key', !!veil && veil.factionKey === 'unknowables');
pin('veil.factionName', !!veil && veil.factionName === 'Unknowables');
pin('veil.notIndependent', !!veil && veil.political !== 'independent' && veil.factionName !== 'Independent');
pin('veil.notUnknown', !!veil && veil.political !== 'unknown' && veil.factionName !== 'Unknown');
pin('veil.notHollow', !!veil && veil.factionName !== 'Hollow' && veil.factionName !== 'Hollow Reach');
pin('veil.missingRepStranger', !!veil && veil.showStanding === true && veil.rep === 0 && veil.rankName === 'Stranger');

if (independentId) {
  const ind = hoverModel(emptyCtx, independentId);
  pin('independent.political', !!ind && ind.political === 'independent');
  pin('independent.key', !!ind && ind.factionKey === 'independent');
  pin('independent.factionName', !!ind && ind.factionName === 'Independent');
  pin('independent.showStanding', !!ind && ind.showStanding === true);
  pin('independent.stranger0', !!ind && ind.rep === 0 && ind.rankName === 'Stranger');
  pin('independent.digit9', !!ind && digit9(ind) === 'Independent: Stranger (+0)');
}

withTemp('nav04_badfaction', { name: 'Ghost Flag', faction: 'not_a_banner' }, () => {
  const m = hoverModel(emptyCtx, 'nav04_badfaction');
  pin('unknown.ok', !!m && m.political === 'unknown');
  pin('unknown.factionKeyEmpty', !!m && m.factionKey === '');
  pin('unknown.factionNameEmpty', !!m && m.factionName === '');
  pin('unknown.noStanding', !!m && m.showStanding === false && m.rep === 0 && m.rankName === '');
  pin('unknown.name', !!m && m.name === 'Ghost Flag');
});

withTemp('nav04_reservedfac', { name: 'Reserved Flag', faction: 'constructor' }, () => {
  const m = hoverModel(emptyCtx, 'nav04_reservedfac');
  pin('reservedFaction.unknown', !!m && m.political === 'unknown' && m.showStanding === false);
});

withTemp('nav04_protofac', { name: 'Proto Flag', faction: '__proto__' }, () => {
  const m = hoverModel(emptyCtx, 'nav04_protofac');
  pin('protoFaction.unknown', !!m && m.political === 'unknown' && m.showStanding === false);
});

withTemp('nav04_ctrlname', { name: 'Hi\u0000There', faction: 'independent' }, () => {
  const m = hoverModel(emptyCtx, 'nav04_ctrlname');
  pin('name.stripControl', !!m && m.name === 'HiThere');
});

withTemp('nav04_emptyname', { name: '', faction: 'veridian' }, () => {
  const m = hoverModel(emptyCtx, 'nav04_emptyname');
  pin('name.emptyFallsToId', !!m && m.name === 'nav04_emptyname');
});

const swornCtx = ctxOf({ veridian: 50, hollow: -40, independent: 12, unknowables: -15 });
const vSworn = hoverModel(swornCtx, 'veridian');
pin('rank.sworn', !!vSworn && vSworn.rep === 50 && vSworn.rankName === 'Sworn');
pin('rank.swornMatchesHelpers', !!vSworn && vSworn.rankName === rankFor(standingRead(swornCtx.world.reputation, 'veridian')).name);
pin('rank.swornDigit9', !!vSworn && digit9(vSworn) === 'Veridian Combine: Sworn (+50)');

const hMarked = hoverModel(swornCtx, 'hollowreach');
pin('rank.marked', !!hMarked && hMarked.rep === -40 && hMarked.rankName === 'Marked');
pin('rank.markedDigit9', !!hMarked && digit9(hMarked) === 'Hollow Reach: Marked (-40)');

const vSuspect = hoverModel(swornCtx, 'veil');
pin('rank.veilSuspect', !!vSuspect && vSuspect.rep === -15 && vSuspect.rankName === 'Suspect');
pin('rank.veilDigit9', !!vSuspect && digit9(vSuspect) === 'Unknowables: Suspect (-15)');

if (independentId) {
  const indKnown = hoverModel(swornCtx, independentId);
  pin('rank.independentKnown', !!indKnown && indKnown.rep === 12 && indKnown.rankName === 'Known');
  pin('rank.independentDigit9', !!indKnown && digit9(indKnown) === 'Independent: Known (+12)');
}

const liveBag = { veridian: 0 };
const liveCtx = ctxOf(liveBag);
const before = hoverModel(liveCtx, 'veridian');
liveBag.veridian = 25;
const after = hoverModel(liveCtx, 'veridian');
pin('fresh.noCache', !!before && before.rankName === 'Stranger' && !!after && after.rankName === 'Trusted' && after.rep === 25);
pin('fresh.digit9', !!after && digit9(after) === 'Veridian Combine: Trusted (+25)');

pin('src.noMysteryImport', !/from ['"][^'"]*mystery/.test(hoverSrc) && !/from ['"][^'"]*mystery/.test(chartSrc));
pin('src.noWorldMystery', !/world\.mystery/.test(hoverSrc) && !/world\.mystery/.test(chartSrc));
pin('src.noInnerHtmlHover', !/innerHTML/.test(hoverSrc) && !/innerHTML/.test(chartSrc));
pin('src.noWorldFields', !/WORLD_FIELDS/.test(hoverSrc) && !/WORLD_FIELDS/.test(chartSrc));
pin('src.noEmitInModel', !/\.emit\s*\(/.test(hoverSrc));
pin('src.sanitizeSystemId', hoverSrc.includes('sanitizeSystemId') && chartSrc.includes("sanitizeSystemId(t.getAttribute('data-system-id'))"));
pin('src.standingRead', hoverSrc.includes('standingRead') && hoverSrc.includes('rankFor'));
pin('src.unknownBeforeStanding', hoverSrc.indexOf("political: 'unknown'") < hoverSrc.indexOf('standingRead(bag'));
pin('src.pointerover', chartSrc.includes("addEventListener('pointerover'"));
pin('src.pointerleave', chartSrc.includes("addEventListener('pointerleave'"));
pin('src.clickUnchanged', /svg\.addEventListener\('click', \(e\) => \{\s*const t = e && e\.target;\s*if \(!isHitDisc\(t\)\) return;\s*const id = sanitizeSystemId\(t\.getAttribute\('data-system-id'\)\);\s*if \(!id\) return;\s*const here = sanitizeSystemId\(ctx\.world\.currentSystem\);\s*if \(id === here\) clearRoute\(ctx\);\s*else plotRoute\(ctx, id\);\s*retargetPlot\(true\);\s*\}\);/.test(chartSrc));
pin('src.hoverIdLocal', chartSrc.includes('let hoverId = null') && !/ctx\.(hoverId|chartHover|navHover)/.test(chartSrc));
pin('src.clearOnClose', /if \(next\) updateHitRadii\(\);\s*else clearHover\(\);/.test(chartSrc));
pin('src.updateLive', /if \(hoverId\) applyHoverId\(hoverId\);/.test(chartSrc));
pin('src.plotClassesSurvive', chartSrc.includes("classList.remove('is-dest', 'is-hop', 'is-unreachable')") && !chartSrc.includes("classList.remove('is-dest', 'is-hop', 'is-unreachable', 'is-hover')"));
pin('src.isHoverAdd', chartSrc.includes("classList.add('is-hover')"));
pin('src.hoverMarker', chartSrc.includes('rw-galaxy-hover-marker') && cssSrc.includes('.rw-galaxy-hover-marker'));
pin('src.readoutRole', chartSrc.includes("setAttribute('role', 'status')") && chartSrc.includes("setAttribute('aria-live', 'polite')") && chartSrc.includes("className = 'rw-galaxy-hover is-hidden'"));
pin('src.readoutOrder', chartSrc.indexOf('panel.appendChild(hoverReadout)') < chartSrc.indexOf('panel.appendChild(status)') && chartSrc.indexOf('panel.appendChild(svg)') < chartSrc.indexOf('panel.appendChild(hoverReadout)'));
pin('src.textContent', chartSrc.includes('hoverNameEl.textContent') && chartSrc.includes('hoverControlEl.textContent') && chartSrc.includes('hoverStandingEl.textContent'));
pin('src.noTitleTooltip', !/setAttribute\('title'/.test(chartSrc));
pin('src.ariaGate', chartSrc.includes('lastHoverAria') && chartSrc.includes('ariaKey'));

const hoverChunkStart = chartSrc.indexOf("svg.addEventListener('pointerover'");
const hoverChunkEnd = chartSrc.indexOf("window.addEventListener('keydown'");
const hoverChunk = hoverChunkStart >= 0 && hoverChunkEnd > hoverChunkStart
  ? chartSrc.slice(hoverChunkStart, hoverChunkEnd)
  : '';
pin('src.hoverNoPlot', hoverChunk.includes('applyHoverId') && !hoverChunk.includes('plotRoute') && !hoverChunk.includes('clearRoute') && !hoverChunk.includes('tryEngage'));
pin('src.hoverNoPrevent', hoverChunk && !hoverChunk.includes('preventDefault') && !hoverChunk.includes('stopPropagation'));
pin('src.hoverNoNavWrite', !/world\.nav\s*=/.test(chartSrc) && !/hover[\s\S]{0,80}world\.nav/.test(hoverSrc));
pin('css.isHover', cssSrc.includes('.rw-galaxy-node.is-hover'));
pin('css.readout', cssSrc.includes('.rw-galaxy-hover') && cssSrc.includes('pointer-events: none'));
pin('css.noHoverAnim', !/\.rw-galaxy-hover-marker\s*\{[^}]*animation/.test(cssSrc));
pin('css.reducedMotion', cssSrc.includes('body.rw-reduced-motion .rw-galaxy-chart'));
pin('css.idleKeepsFlow', /\.rw-galaxy-hover\.is-hidden\s*\{[^}]*visibility:\s*hidden/.test(cssSrc) && !/\.rw-galaxy-hover\.is-hidden\s*\{[^}]*display:\s*none/.test(cssSrc));
pin('copy.noContestedToken', !/Contested/.test(hoverSrc) && !/Unclaimed/.test(hoverSrc));

const failN = fails.length;
const passN = Object.keys(results).filter((k) => results[k]).length;
console.log(JSON.stringify({ pass: passN, fail: failN, fails, results }, null, 2));
if (failN) {
  console.error(`NAV-04 probe FAIL ${failN}`);
  process.exit(1);
}
console.log('NAV-04 probe PASS');
