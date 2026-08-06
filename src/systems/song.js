/**
 * RIMWARD web — bio whalesong (doc §19.2) + minimal combat/UI cues (§19.1).
 * Pure WebAudio synthesis, no external assets. The AudioContext is created
 * and resumed on the first user gesture (autoplay policy); every audio path
 * is failure-safe and never throws if audio is blocked.
 *
 * Whalesong: mood-voiced phrases — detuned sine/triangle voices through a
 * lowpass and a generated-impulse convolver reverb, phrase scheduling via a
 * lookahead timer in update() (no per-sample work, no per-frame allocs).
 * The ship's voice is the warmest sound in the game: keep it gentle.
 */

const MASTER_GAIN = 0.15;
const REVERB_SECONDS = 2.5;
const REVERB_GAIN = 0.6;
const PAD_GAIN = 0.012; // continuous pad, barely-there
const PHRASE_LOOKAHEAD = 0.2; // s of schedule-ahead horizon

// Per-mood voice (§19.2: pitch, interval, rhythm, intensity communicate mood).
const MOOD_SONG = {
  // low, slow, sparse, warm
  serene: { base: 110, ratios: [1, 3 / 2, 2, 4 / 3], gap: [14, 20], dur: [2.5, 4.0], gain: 0.2, vibRate: 0, vibDepth: 0, fall: 1 },
  // brighter, quicker phrases
  keen: { base: 165, ratios: [1, 5 / 4, 3 / 2, 15 / 8], gap: [8, 14], dur: [1.2, 2.2], gain: 0.22, vibRate: 0, vibDepth: 0, fall: 1 },
  // higher, warbling vibrato
  anxious: { base: 196, ratios: [1, 16 / 15, 15 / 16, 9 / 8], gap: [7, 12], dur: [1.0, 2.0], gain: 0.18, vibRate: 5.5, vibDepth: 35, fall: 1 },
  // low, strained, slow fall
  pained: { base: 82, ratios: [1, 8 / 9, 4 / 5], gap: [12, 18], dur: [3.0, 5.0], gain: 0.16, vibRate: 0, vibDepth: 0, fall: 0.82 },
  // dissonant minor seconds, louder
  feral: { base: 130, ratios: [1, 16 / 15, 15 / 16, 9 / 8], gap: [6, 10], dur: [0.8, 1.6], gain: 0.3, vibRate: 7, vibDepth: 25, fall: 1 },
};

// Cue table: [type, f0, f1, duration, gain, lowpassHz(0=none), delay]
const CUES = {
  podCollected: [['sine', 880, 1320, 0.3, 0.12, 0, 0]], // soft chime
  shieldDown: [['triangle', 180, 90, 0.25, 0.18, 400, 0]], // hollow thunk
  playerHit: [['sine', 110, 55, 0.2, 0.2, 300, 0]], // dull lowpassed thud
  npcDisabled: [['sine', 440, 110, 0.6, 0.12, 0, 0]], // falling tone
  milestone: [ // two-note sting
    ['sine', 660, 660, 0.15, 0.1, 0, 0],
    ['sine', 990, 990, 0.25, 0.1, 0, 0.16],
  ],
  docked: [ // warm confirm (major third swell)
    ['sine', 330, 330, 0.5, 0.1, 0, 0],
    ['sine', 415, 415, 0.5, 0.08, 0, 0],
  ],
  hailOpened: [['square', 1200, 1200, 0.06, 0.05, 2000, 0]], // comms blip
};

export function initSong(ctx) {
  let ac = null;
  let master = null;
  let convolver = null;
  let padOscA = null;
  let padOscB = null;
  let unlocked = false;
  let failed = false;
  let mood = 'serene';
  let nextPhraseAt = 0;

  function unlock() {
    if (unlocked || failed) return;
    try {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) {
        failed = true;
        return;
      }
      ac = new AC();

      master = ac.createGain();
      master.gain.value = MASTER_GAIN;
      master.connect(ac.destination);

      // Generated reverb: decaying stereo noise impulse (§19.2 generous tail).
      const len = Math.floor(ac.sampleRate * REVERB_SECONDS);
      const ir = ac.createBuffer(2, len, ac.sampleRate);
      for (let c = 0; c < 2; c++) {
        const d = ir.getChannelData(c);
        for (let i = 0; i < len; i++) {
          d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 2.5);
        }
      }
      convolver = ac.createConvolver();
      convolver.buffer = ir;
      const wet = ac.createGain();
      wet.gain.value = REVERB_GAIN;
      convolver.connect(wet);
      wet.connect(master);

      // Continuous pad at very low gain; pitch follows mood base.
      const padFilter = ac.createBiquadFilter();
      padFilter.type = 'lowpass';
      padFilter.frequency.value = 500;
      const padGain = ac.createGain();
      padGain.gain.value = PAD_GAIN;
      padGain.connect(padFilter);
      padFilter.connect(master);
      padFilter.connect(convolver);
      const half = MOOD_SONG[mood].base / 2;
      padOscA = ac.createOscillator();
      padOscA.type = 'sine';
      padOscA.frequency.value = half;
      padOscB = ac.createOscillator();
      padOscB.type = 'triangle';
      padOscB.frequency.value = half;
      padOscB.detune.value = 7;
      padOscA.connect(padGain);
      padOscB.connect(padGain);
      padOscA.start();
      padOscB.start();

      if (ac.state === 'suspended') ac.resume().catch(() => {});
      unlocked = true;
    } catch (err) {
      failed = true; // audio unavailable: game must run silent, never crash
      ac = null;
    }
  }
  window.addEventListener('keydown', unlock);
  window.addEventListener('pointerdown', unlock);

  /** One whalesong note: 3 detuned voices through lowpass into master+reverb. */
  function voice(freq, t, dur, p) {
    try {
      const g = ac.createGain();
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(p.gain, t + dur * 0.4); // slow swell
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      const lp = ac.createBiquadFilter();
      lp.type = 'lowpass';
      lp.frequency.value = 900;
      lp.Q.value = 0.5;
      g.connect(lp);
      lp.connect(master);
      lp.connect(convolver);

      const o1 = ac.createOscillator(); // warm fundamental
      o1.type = 'sine';
      o1.frequency.setValueAtTime(freq, t);
      const o2 = ac.createOscillator(); // slightly detuned body
      o2.type = 'triangle';
      o2.frequency.setValueAtTime(freq, t);
      o2.detune.value = -6;
      const o3 = ac.createOscillator(); // soft octave sheen
      o3.type = 'sine';
      o3.frequency.setValueAtTime(freq * 2, t);
      o3.detune.value = 5;
      const g2 = ac.createGain();
      g2.gain.value = 0.4;
      const g3 = ac.createGain();
      g3.gain.value = 0.25;

      if (p.fall < 1) {
        // pained: strained slow fall within the note
        o1.frequency.exponentialRampToValueAtTime(freq * p.fall, t + dur);
        o2.frequency.exponentialRampToValueAtTime(freq * p.fall, t + dur);
        o3.frequency.exponentialRampToValueAtTime(freq * 2 * p.fall, t + dur);
      }
      if (p.vibRate > 0) {
        const vib = ac.createOscillator();
        vib.frequency.value = p.vibRate;
        const vg = ac.createGain();
        vg.gain.value = p.vibDepth; // cents
        vib.connect(vg);
        vg.connect(o1.detune);
        vg.connect(o2.detune);
        vib.start(t);
        vib.stop(t + dur + 0.1);
      }

      o1.connect(g);
      o2.connect(g2);
      g2.connect(g);
      o3.connect(g3);
      g3.connect(g);
      const end = t + dur + 0.1;
      o1.start(t);
      o2.start(t);
      o3.start(t);
      o1.stop(end);
      o2.stop(end);
      o3.stop(end);
    } catch (err) {
      /* audio must never crash a frame */
    }
  }

  /** A phrase: 1–3 notes on the mood's interval pattern. */
  function schedulePhrase(t) {
    const p = MOOD_SONG[mood];
    const notes = 1 + ((Math.random() * 3) | 0);
    let at = t;
    for (let n = 0; n < notes; n++) {
      const dur = p.dur[0] + Math.random() * (p.dur[1] - p.dur[0]);
      const ratio = p.ratios[(Math.random() * p.ratios.length) | 0];
      voice(p.base * ratio, at, dur, p);
      at += dur * (0.7 + Math.random() * 0.6);
    }
  }

  /** Short synth cue. Allocates only on (rare) events. */
  function tone(spec, t) {
    const [type, f0, f1, dur, gain, lpf, delay] = spec;
    try {
      const t0 = t + delay;
      const o = ac.createOscillator();
      o.type = type;
      o.frequency.setValueAtTime(f0, t0);
      if (f1 !== f0) o.frequency.exponentialRampToValueAtTime(f1, t0 + dur);
      const g = ac.createGain();
      g.gain.setValueAtTime(0.0001, t0);
      g.gain.exponentialRampToValueAtTime(gain, t0 + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
      o.connect(g);
      if (lpf > 0) {
        const f = ac.createBiquadFilter();
        f.type = 'lowpass';
        f.frequency.value = lpf;
        g.connect(f);
        f.connect(master);
      } else {
        g.connect(master);
      }
      o.start(t0);
      o.stop(t0 + dur + 0.05);
    } catch (err) {
      /* never crash */
    }
  }

  return {
    update() {
      if (!unlocked || !ac) return; // silent until first user gesture
      if (ac.state === 'suspended') {
        ac.resume().catch(() => {});
        return;
      }

      // Mood follows bio (bio.js inits before song.js → same-frame value).
      const m = ctx.bio.mood;
      if (m !== mood) {
        mood = m;
        const half = MOOD_SONG[m].base / 2;
        const t = ac.currentTime;
        padOscA.frequency.setTargetAtTime(half, t, 1.5);
        padOscB.frequency.setTargetAtTime(half, t, 1.5);
      }

      // Cues from last frame's events (indexed loop: no per-frame allocs).
      const evs = ctx.lastEvents;
      const t = ac.currentTime;
      for (let i = 0; i < evs.length; i++) {
        const cue = CUES[evs[i].type];
        if (cue) for (let j = 0; j < cue.length; j++) tone(cue[j], t);
      }

      // Whalesong phrases via lookahead timer, every 6–20 s (mood-dependent).
      if (nextPhraseAt === 0) nextPhraseAt = t + 2; // first call shortly after unlock
      if (t >= nextPhraseAt - PHRASE_LOOKAHEAD) {
        schedulePhrase(Math.max(t + 0.05, nextPhraseAt));
        const p = MOOD_SONG[mood];
        nextPhraseAt = t + p.gap[0] + Math.random() * (p.gap[1] - p.gap[0]);
      }
    },
  };
}
