#!/usr/bin/env node
// HUD-03 Wave 103 source pins (settings restore + song gate). No Vite.
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..', '..', '..');
const src = (rel) => readFileSync(join(root, rel), 'utf8');

const settingsSrc = src('src/systems/settings.js');
const ctxSrc = src('src/core/ctx.js');
const songSrc = src('src/systems/song.js');
const toastSrc = src('src/game/npc-fire-toast.js');
const hudSrc = src('src/systems/hud.js');
const cssSrc = src('src/ui/hud.css');
const stationSrc = src('src/systems/station.js');
const saveSrc = src('src/game/save.js');
const ctrlSrc = src('src/systems/controls.js');

const { HUD_ALERT_TYPES } = await import(pathToFileURL(join(root, 'src/systems/song.js')).href);

const FIELDS = {
  colorblind: (v) => typeof v === 'boolean',
  highContrast: (v) => typeof v === 'boolean',
  reducedMotion: (v) => typeof v === 'boolean',
  muted: (v) => typeof v === 'boolean',
  hudAlerts: (v) => typeof v === 'boolean',
  hints: (v) => typeof v === 'boolean',
  textScale: (v) => [0.85, 1, 1.2, 1.5].includes(v),
  masterVolume: (v) => typeof v === 'number' && v >= 0 && v <= 1,
};

function restoreObj(data, seed) {
  const s = { ...seed };
  if (data && typeof data === 'object') {
    for (const key of Object.keys(FIELDS)) {
      if (Object.prototype.hasOwnProperty.call(data, key) && FIELDS[key](data[key])) s[key] = data[key];
    }
  }
  return s;
}

function restore(blob, seed) {
  try {
    return restoreObj(JSON.parse(blob), seed);
  } catch {
    return { ...seed };
  }
}

const seed = { hudAlerts: false, muted: false };
const MASTER = 0.15;
const masterGain = (s) => MASTER * (s.muted ? 0 : (s.masterVolume ?? 1));
const checkboxBlock = settingsSrc.slice(
  settingsSrc.indexOf('const CHECKBOXES'),
  settingsSrc.indexOf('export function initSettings'),
);
const worldFields = saveSrc.slice(
  saveSrc.indexOf('export const WORLD_FIELDS'),
  saveSrc.indexOf('const SURVIVOR'),
);
const applySlice = settingsSrc.slice(
  settingsSrc.indexOf('function apply()'),
  settingsSrc.indexOf('function persist()'),
);
const songCueSlice = songSrc.slice(
  songSrc.indexOf('const cue ='),
  songSrc.indexOf("if (typ === 'songShift')"),
);
const subset = ['hudMechRange', 'hudMechMatch', 'hudMechContact', 'hostileEnter', 'hullBand', 'reticleLock'];
const combat = ['npcFire', 'npcFireMissile', 'playerHit'];

JSON.parse('{"__proto__":{"hudAlerts":true}}');
const protoPollute = Object.prototype.hudAlerts === true;

const pins = {
  defaultFalse: ctxSrc.includes('hudAlerts: false'),
  fieldsBool: settingsSrc.includes("hudAlerts: (v) => typeof v === 'boolean'"),
  checkboxOrder:
    checkboxBlock.indexOf("['reducedMotion', 'Reduced motion']") >= 0
    && checkboxBlock.indexOf("['hudAlerts', 'HUD audio alerts']")
      > checkboxBlock.indexOf("['reducedMotion', 'Reduced motion']")
    && checkboxBlock.indexOf("['muted', 'Mute all audio']")
      > checkboxBlock.indexOf("['hudAlerts', 'HUD audio alerts']"),
  persistKey: settingsSrc.includes("STORAGE_KEY = 'rimward-settings-v1'")
    && !settingsSrc.includes('rimward-hud-alerts'),
  loadWalk: settingsSrc.includes('for (const key of Object.keys(FIELDS))')
    && settingsSrc.includes('Object.prototype.hasOwnProperty.call(data, key)')
    && !/for\s*\(\s*const\s+\w+\s+in\s+data\s*\)/.test(settingsSrc),
  restoreOn: restore('{"hudAlerts":true}', seed).hudAlerts === true,
  restoreType: restore('{"hudAlerts":"true"}', seed).hudAlerts === false,
  restoreUnknown: restore('{"hudAlerts":true,"klaxonSku":true}', seed).klaxonSku === undefined,
  restoreProto: restore('{"__proto__":{"hudAlerts":true},"constructor":true}', seed).hudAlerts === false
    && protoPollute === false
    && restoreObj(Object.create({ hudAlerts: true }), seed).hudAlerts === false,
  restoreCorrupt: restore('{not json', seed).hudAlerts === false,
  noInnerHtml: !settingsSrc.includes('innerHTML') && !songSrc.includes('innerHTML'),
  subsetSet: subset.every((k) => HUD_ALERT_TYPES.has(k)) && HUD_ALERT_TYPES.size === 6
    && combat.every((k) => !HUD_ALERT_TYPES.has(k)),
  songGate: songCueSlice.includes('HUD_ALERT_TYPES.has(typ)')
    && songCueSlice.includes('hudAlerts === true'),
  muteWins: masterGain({ muted: true, hudAlerts: true, masterVolume: 1 }) === 0
    && masterGain({ muted: false, hudAlerts: true, masterVolume: 0 }) === 0
    && songSrc.includes('ctx.settings?.muted ? 0 : (ctx.settings?.masterVolume ?? 1)'),
  combatCues: songSrc.includes('\n  npcFire:') && songSrc.includes('\n  npcFireMissile:')
    && !songSrc.includes('incomingFire') && !songSrc.includes('incomingDart'),
  incomingFreeze: toastSrc.includes("INCOMING_FIRE_TOAST = 'Incoming fire.'")
    && toastSrc.includes("INCOMING_DART_TOAST = 'Incoming dart.'")
    && hudSrc.includes('npcFireToast'),
  hubEmpty: hudSrc.includes('keep the 80 px hub on glass') && !hudSrc.includes('HUD audio alerts'),
  digit0: stationSrc.includes("i === DOCK_KEY_SERVICES.length - 1 ? 0") && stationSrc.includes("'shipyard'"),
  digit89: stationSrc.includes('else if (n === 8 || n === 9)') && stationSrc.includes('armOutfitPapers'),
  keysStay: ctrlSrc.includes("'KeyT'") && ctrlSrc.includes("'KeyV'")
    && ctrlSrc.includes("'KeyK'") && ctrlSrc.includes("'KeyX'")
    && settingsSrc.includes("e.code === 'KeyO'"),
  visualHud03: applySlice.includes('rw-colorblind') && applySlice.includes('rw-contrast')
    && applySlice.includes('rw-reduced-motion') && !applySlice.includes('hudAlerts')
    && !/hud-alert|hudAlert/.test(cssSrc),
  noWorldField: !/hudAlert/.test(worldFields),
  familyStill: songCueSlice.includes('FAMILY_CUES[typ]'),
};

const failed = Object.entries(pins).filter(([, v]) => !v).map(([k]) => k);
console.log(JSON.stringify(pins, null, 2));
if (failed.length) {
  console.log('WAVE103 PROBE FAIL', failed.join(','));
  process.exit(1);
}
console.log('WAVE103 PROBE PASS');
