/**
 * Client settings + accessibility (doc §18.4/§20: "important states are
 * legible without relying on color"). settings.js is the ONLY writer of
 * ctx.settings; every other system reads it live (song.js volume/mute/hudAlerts,
 * onboarding.js hints, ship/gate/hud reducedMotion).
 *
 * Persisted under its own localStorage key 'rimward-settings-v1' — client
 * state, NOT world state, so it never rides save.js WORLD_FIELDS. Corrupt or
 * absent storage silently falls back to the ctx.js defaults.
 *
 * KeyO toggles the settings panel (Escape closes). The panel is plain DOM
 * with inline layout styles in the hail.js self-contained pattern; it is the
 * topmost interactive surface at z-index 80, above the title screen (70),
 * the pause overlay (50) and every 60-level panel, and below only #fatal
 * (99). It is display:none when closed so it never swallows gameplay input.
 * Every control applies + persists immediately.
 *
 * Apply side effects: body classes rw-colorblind / rw-contrast /
 * rw-reduced-motion (CSS in hud.css/screens.css reacts), and --rw-text-scale
 * on #hud (font sizes multiply by it). hudAlerts has no body class; song.js
 * reads the bool live, same as mute.
 */

const STORAGE_KEY = 'rimward-settings-v1';
const TEXT_SCALES = [0.85, 1, 1.2, 1.5];
const TEXT_SCALE_LABELS = ['S', 'M', 'L', 'XL'];

// Known keys + validators — anything else in storage is ignored.
const FIELDS = {
  colorblind: (v) => typeof v === 'boolean',
  highContrast: (v) => typeof v === 'boolean',
  reducedMotion: (v) => typeof v === 'boolean',
  muted: (v) => typeof v === 'boolean',
  hudAlerts: (v) => typeof v === 'boolean',
  hints: (v) => typeof v === 'boolean',
  textScale: (v) => TEXT_SCALES.includes(v),
  masterVolume: (v) => typeof v === 'number' && v >= 0 && v <= 1,
  mouseSensitivity: (v) => typeof v === 'number' && Number.isFinite(v) && v >= 0.25 && v <= 3,
  invertX: (v) => typeof v === 'boolean',
  invertY: (v) => typeof v === 'boolean',
  musicVolume: (v) => typeof v === 'number' && v >= 0 && v <= 1,
  effectsVolume: (v) => typeof v === 'number' && v >= 0 && v <= 1,
  voiceVolume: (v) => typeof v === 'number' && v >= 0 && v <= 1,
  uiVolume: (v) => typeof v === 'number' && v >= 0 && v <= 1,
};

const CHECKBOXES = [
  ['colorblind', 'Colorblind-safe palette'],
  ['highContrast', 'High contrast HUD'],
  ['reducedMotion', 'Reduced motion'],
  ['hudAlerts', 'HUD audio alerts'],
  ['muted', 'Mute all audio'],
  ['hints', 'Onboarding hints'],
];

export function initSettings(ctx) {
  const s = ctx.settings; // defaults live in ctx.js; we merge storage into it

  // ---------- load (guard parse errors: corrupt/absent = defaults) ----------
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const data = JSON.parse(raw);
      if (data && typeof data === 'object') {
        for (const key of Object.keys(FIELDS)) {
          if (Object.prototype.hasOwnProperty.call(data, key) && FIELDS[key](data[key])) s[key] = data[key];
        }
      }
    }
  } catch {
    /* corrupt JSON or storage denied → keep defaults */
  }

  const hudEl = document.getElementById('hud');

  function apply() {
    document.body.classList.toggle('rw-colorblind', s.colorblind);
    document.body.classList.toggle('rw-contrast', s.highContrast);
    document.body.classList.toggle('rw-reduced-motion', s.reducedMotion);
    if (hudEl) hudEl.style.setProperty('--rw-text-scale', String(s.textScale));
  }

  function persist() {
    try {
      const out = {};
      for (const key of Object.keys(FIELDS)) {
        if (Object.hasOwn(s, key)) out[key] = s[key];
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(out));
    } catch {
      /* storage denied → session-only settings */
    }
  }

  function change() {
    apply();
    persist();
  }

  // ---------- overlay DOM (inline layout styles, hail.js pattern) ----------
  const root = document.createElement('div');
  root.style.cssText =
    'position:fixed;inset:0;display:none;align-items:center;justify-content:center;' +
    'background:rgba(2,5,11,0.72);z-index:80;pointer-events:none;' +
    "font-family:'Consolas','Cascadia Mono','Courier New',monospace;color:#dce8f4;";

  const panel = document.createElement('div');
  panel.style.cssText =
    'pointer-events:auto;min-width:340px;max-width:92vw;max-height:82vh;overflow-y:auto;' +
    'padding:18px 22px 16px;background:linear-gradient(180deg,#101826 0%,#0a101b 100%);' +
    'border:1px solid #2c3d52;border-radius:2px;font-size:13px;line-height:1.5;' +
    'box-shadow:0 0 0 1px rgba(111,210,224,0.06),0 12px 48px rgba(0,0,0,0.65);';
  panel.setAttribute('role', 'dialog');
  panel.setAttribute('aria-label', 'Settings');
  // Clicks on the panel must not reach the canvas (fire input).
  panel.addEventListener('mousedown', (e) => e.stopPropagation());
  panel.addEventListener('click', (e) => e.stopPropagation());
  root.appendChild(panel);

  const title = document.createElement('div');
  title.textContent = 'SETTINGS';
  title.style.cssText =
    'font-size:15px;letter-spacing:0.3em;color:#6fd2e0;margin-bottom:4px;' +
    'border-bottom:1px solid #22303f;padding-bottom:8px;';
  panel.appendChild(title);

  const hint = document.createElement('div');
  hint.textContent = 'O or ESC to close — changes apply immediately';
  hint.style.cssText = 'color:#5f7185;font-size:11px;letter-spacing:0.1em;margin:6px 0 8px;';
  panel.appendChild(hint);

  const SECTION_HEAD_CSS =
    'font-size:12px;letter-spacing:0.28em;color:#6fd2e0;margin:14px 0 8px;' +
    'border-bottom:1px solid #22303f;padding-bottom:6px;';
  const SLIDER_CAPTION_CSS = 'color:#7d93ab;font-size:11px;letter-spacing:0.2em;margin:8px 0 6px;';

  function addSectionHead(text) {
    const el = document.createElement('div');
    el.textContent = text;
    el.style.cssText = SECTION_HEAD_CSS;
    panel.appendChild(el);
  }

  const checkboxInputs = {};
  function addCheckbox(key, label, rowExtra) {
    const row = document.createElement('label');
    row.style.cssText =
      'display:flex;align-items:center;gap:10px;padding:5px 2px;cursor:pointer;' +
      'letter-spacing:0.06em;' + (rowExtra || '');
    const input = document.createElement('input');
    input.type = 'checkbox';
    input.checked = !!s[key];
    input.style.cssText = 'accent-color:#6fd2e0;width:15px;height:15px;cursor:pointer;';
    input.setAttribute('aria-label', label);
    input.addEventListener('change', () => {
      s[key] = input.checked;
      change();
    });
    checkboxInputs[key] = input;
    row.appendChild(input);
    row.appendChild(document.createTextNode(label));
    panel.appendChild(row);
  }

  addSectionHead('ACCESSIBILITY');
  const A11Y_KEYS = ['colorblind', 'highContrast', 'reducedMotion', 'hints'];
  for (const [key, label] of CHECKBOXES) {
    if (A11Y_KEYS.includes(key)) addCheckbox(key, label);
  }

  // --- text scale segmented row ---
  const scaleLabel = document.createElement('div');
  scaleLabel.textContent = 'TEXT SIZE';
  scaleLabel.style.cssText = SLIDER_CAPTION_CSS;
  panel.appendChild(scaleLabel);

  const scaleRow = document.createElement('div');
  scaleRow.style.cssText = 'display:flex;gap:6px;';
  panel.appendChild(scaleRow);

  const scaleBtns = [];
  function refreshScaleButtons() {
    for (let i = 0; i < scaleBtns.length; i++) {
      const active = s.textScale === TEXT_SCALES[i];
      const b = scaleBtns[i];
      b.setAttribute('aria-pressed', active ? 'true' : 'false');
      b.style.borderColor = active ? '#6fd2e0' : '#31445c';
      b.style.color = active ? '#6fd2e0' : '#9fb2c6';
      b.style.background = active ? '#162437' : '#131e2e';
    }
  }
  for (let i = 0; i < TEXT_SCALES.length; i++) {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'screen-btn'; // shared overlay button treatment (screens.css)
    b.textContent = TEXT_SCALE_LABELS[i];
    b.style.cssText = 'width:auto;flex:1;padding:5px 0;text-align:center;';
    const scale = TEXT_SCALES[i];
    b.addEventListener('click', () => {
      s.textScale = scale;
      refreshScaleButtons();
      change();
    });
    scaleBtns.push(b);
    scaleRow.appendChild(b);
  }
  refreshScaleButtons();

  // --- flight comfort (RW-002 PR1) ---
  addSectionHead('FLIGHT');

  const flightChecks = {};
  const FLIGHT_CHECKS = [
    ['invertX', 'Invert yaw (X)'],
    ['invertY', 'Invert pitch (Y)'],
  ];
  for (const [key, label] of FLIGHT_CHECKS) {
    const row = document.createElement('label');
    row.style.cssText =
      'display:flex;align-items:center;gap:10px;padding:5px 2px;min-height:44px;cursor:pointer;' +
      'letter-spacing:0.06em;';
    const input = document.createElement('input');
    input.type = 'checkbox';
    input.checked = !!s[key];
    input.style.cssText = 'accent-color:#6fd2e0;width:15px;height:15px;cursor:pointer;';
    input.setAttribute('aria-label', label);
    input.addEventListener('change', () => {
      s[key] = input.checked;
      change();
    });
    flightChecks[key] = input;
    row.appendChild(input);
    row.appendChild(document.createTextNode(label));
    panel.appendChild(row);
  }

  const sensLabel = document.createElement('div');
  sensLabel.style.cssText = SLIDER_CAPTION_CSS;
  panel.appendChild(sensLabel);

  const sensRow = document.createElement('div');
  sensRow.style.cssText = 'display:flex;align-items:center;gap:10px;min-height:44px;';
  panel.appendChild(sensRow);

  const sens = document.createElement('input');
  sens.type = 'range';
  sens.min = '0.25';
  sens.max = '3';
  sens.step = '0.05';
  sens.style.cssText = 'flex:1;accent-color:#6fd2e0;cursor:pointer;min-height:44px;';
  sens.setAttribute('aria-label', 'Mouse sensitivity');
  const sensValue = document.createElement('span');
  sensValue.style.cssText = 'min-width:38px;text-align:right;color:#dce8f4;';
  function clampSensitivity(v) {
    if (typeof v !== 'number' || !Number.isFinite(v)) return 1;
    return Math.max(0.25, Math.min(3, v));
  }
  function refreshSensitivity() {
    const g = clampSensitivity(s.mouseSensitivity);
    s.mouseSensitivity = g;
    sens.value = String(g);
    sensLabel.textContent = 'MOUSE SENSITIVITY';
    sensValue.textContent = g.toFixed(2);
  }
  sens.addEventListener('input', () => {
    s.mouseSensitivity = clampSensitivity(Number(sens.value));
    refreshSensitivity();
    change();
  });
  refreshSensitivity();
  sensRow.appendChild(sens);
  sensRow.appendChild(sensValue);

  // --- audio (RW-002 PR2). Mute + master + buses. No preview blips. Reset audio is PR4. ---
  const busRefreshers = [];
  let vol = null;
  let refreshVolume = () => {};
  try {
    addSectionHead('AUDIO');
    const audioNote = document.createElement('div');
    audioNote.textContent =
      'Master multiplies every bus; mute silences output and does not change slider values.';
    audioNote.style.cssText = 'color:#5f7185;font-size:11px;letter-spacing:0.04em;margin:0 0 8px;';
    panel.appendChild(audioNote);

    const AUDIO_CHECK_KEYS = ['muted', 'hudAlerts'];
    for (let i = 0; i < AUDIO_CHECK_KEYS.length; i++) {
      const want = AUDIO_CHECK_KEYS[i];
      let pair = null;
      for (let j = 0; j < CHECKBOXES.length; j++) {
        if (CHECKBOXES[j][0] === want) pair = CHECKBOXES[j];
      }
      if (pair) addCheckbox(pair[0], pair[1], 'min-height:44px;');
    }

    const volLabel = document.createElement('div');
    volLabel.style.cssText = SLIDER_CAPTION_CSS;
    panel.appendChild(volLabel);
    const volRow = document.createElement('div');
    volRow.style.cssText = 'display:flex;align-items:center;gap:10px;min-height:44px;';
    panel.appendChild(volRow);
    vol = document.createElement('input');
    vol.type = 'range';
    vol.min = '0';
    vol.max = '100';
    vol.step = '1';
    vol.value = String(Math.round(s.masterVolume * 100));
    vol.style.cssText = 'flex:1;accent-color:#6fd2e0;cursor:pointer;min-height:44px;';
    vol.setAttribute('aria-label', 'Master volume');
    const volValue = document.createElement('span');
    volValue.style.cssText = 'min-width:38px;text-align:right;color:#dce8f4;';
    refreshVolume = () => {
      volLabel.textContent = 'MASTER VOLUME';
      volValue.textContent = vol.value + '%';
    };
    vol.addEventListener('input', () => {
      s.masterVolume = Math.max(0, Math.min(1, Number(vol.value) / 100));
      refreshVolume();
      change();
    });
    refreshVolume();
    volRow.appendChild(vol);
    volRow.appendChild(volValue);

    const BUS_SLIDERS = [
      ['musicVolume', 'MUSIC VOLUME', 'Music volume'],
      ['effectsVolume', 'EFFECTS VOLUME', 'Effects volume'],
      ['voiceVolume', 'VOICE VOLUME', 'Voice volume'],
      ['uiVolume', 'UI VOLUME', 'UI volume'],
    ];
    function clampBusVolume(v) {
      if (typeof v !== 'number' || !Number.isFinite(v)) return 1;
      return Math.max(0, Math.min(1, v));
    }
    for (const [key, heading, aria] of BUS_SLIDERS) {
      const busLabel = document.createElement('div');
      busLabel.style.cssText = SLIDER_CAPTION_CSS;
      panel.appendChild(busLabel);
      const busRow = document.createElement('div');
      busRow.style.cssText = 'display:flex;align-items:center;gap:10px;min-height:44px;';
      panel.appendChild(busRow);
      const busSl = document.createElement('input');
      busSl.type = 'range';
      busSl.min = '0';
      busSl.max = '100';
      busSl.step = '1';
      busSl.style.cssText = 'flex:1;accent-color:#6fd2e0;cursor:pointer;min-height:44px;';
      busSl.setAttribute('aria-label', aria);
      const busVal = document.createElement('span');
      busVal.style.cssText = 'min-width:38px;text-align:right;color:#dce8f4;';
      const refreshBus = () => {
        try {
          const g = clampBusVolume(s[key]);
          s[key] = g;
          busSl.value = String(Math.round(g * 100));
          busLabel.textContent = heading;
          busVal.textContent = busSl.value + '%';
        } catch {
          /* never throw from Settings paint */
        }
      };
      busSl.addEventListener('input', () => {
        try {
          s[key] = clampBusVolume(Number(busSl.value) / 100);
          refreshBus();
          change();
        } catch {
          /* never throw from Settings paint */
        }
      });
      refreshBus();
      busRow.appendChild(busSl);
      busRow.appendChild(busVal);
      busRefreshers.push(refreshBus);
    }
  } catch {
    /* never throw from Settings paint */
  }

  document.body.appendChild(root);

  // ---------- open/close ----------
  let open = false;
  function setOpen(next) {
    open = next;
    root.style.display = next ? 'flex' : 'none';
    if (next) {
      // refresh widget state in case anything else restored defaults
      for (const key of Object.keys(checkboxInputs)) checkboxInputs[key].checked = !!s[key];
      for (const key of Object.keys(flightChecks)) flightChecks[key].checked = !!s[key];
      refreshScaleButtons();
      if (vol) {
        vol.value = String(Math.round(s.masterVolume * 100));
        refreshVolume();
      }
      refreshSensitivity();
      for (let i = 0; i < busRefreshers.length; i++) busRefreshers[i]();
    }
  }

  window.addEventListener('keydown', (e) => {
    if (e.repeat) return;
    if (e.code === 'KeyO') {
      setOpen(!open);
    } else if (e.code === 'Escape' && open) {
      setOpen(false);
    }
  });

  apply(); // initial classes + text scale from loaded settings

  // Everything is event/DOM driven — nothing to do per frame.
  return { update() {} };
}
