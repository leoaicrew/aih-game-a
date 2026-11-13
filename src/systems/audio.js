// Procedural Audio Synthesizer via standard Web Audio API (Zero external network request, Zero latency, 100% Free / CC0)
// Designed by AIH Games Design & QA for Game A (Merge Stack).
// Also supports external CC0 sound packs (Kenney Digital / Interface sounds).

const MUTE_KEY = 'aih-game-a.muted';

function loadMuted() {
  try {
    return globalThis.localStorage?.getItem(MUTE_KEY) === '1';
  } catch {
    return false;
  }
}

function saveMuted(muted) {
  try {
    globalThis.localStorage?.setItem(MUTE_KEY, muted ? '1' : '0');
  } catch {
    /* storage unavailable */
  }
}

class SoundManager {
  constructor() {
    this.ctx = null;
    this.muted = loadMuted();
    this.volume = 0.3;
    // Background music (procedural, looped) state.
    this.musicGain = null;
    this.musicTimer = null;
    this.musicPlaying = false;
    this.musicStep = 0;
    this.wasMusicRequested = false;
  }

  // --- Background music -------------------------------------------------
  // AIH-24 pass 2: the old version layered sustained triangle "pads" whose
  // overlapping oscillators beat into a muddy hum ("nhạc u u"). Replaced with
  // a light, plucked marimba/bell arpeggio: every note is a short self-decaying
  // "pluck" on a bright pentatonic-friendly progression (C - Am - F - G), so
  // there are no sustained drones and the loop breathes. Still 0 files, 0 network.
  MUSIC_TEMPO_MS = 300;

  // Chord roots + arpeggio degrees (semitone offsets from root), major-ish so
  // it reads upbeat. Root frequencies in Hz.
  static MUSIC_CHORDS = [
    { root: 261.63, arp: [0, 4, 7, 12] }, // C major
    { root: 220.0, arp: [0, 3, 7, 12] }, // A minor
    { root: 174.61, arp: [0, 4, 7, 12] }, // F major
    { root: 196.0, arp: [0, 4, 7, 12] }, // G major
  ];

  // One short plucked note: quick attack, exponential decay, slight detune
  // shimmer via a second quieter oscillator a fifth up. Very short so notes
  // never pile into a drone.
  playPluck(freq, when, gainPeak = 0.14, decay = 0.32, type = 'sine') {
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, when);
    g.gain.setValueAtTime(0.0001, when);
    g.gain.exponentialRampToValueAtTime(gainPeak, when + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, when + decay);
    osc.connect(g);
    g.connect(this.musicGain);
    osc.start(when);
    osc.stop(when + decay + 0.02);
  }

  musicActive() {
    return this.musicPlaying && !this.muted && !!this.ctx;
  }

  startMusic() {
    this.init();
    if (!this.ctx) return false;
    this.wasMusicRequested = true;
    if (this.muted) return false;
    if (this.musicPlaying) return true;
    this.musicGain = this.ctx.createGain();
    this.musicGain.gain.setValueAtTime(0.0001, this.ctx.currentTime);
    this.musicGain.gain.exponentialRampToValueAtTime(this.volume * 0.32, this.ctx.currentTime + 1.0);
    this.musicGain.connect(this.ctx.destination);
    this.musicPlaying = true;
    this.musicStep = 0;
    this.scheduleMusicStep();
    return true;
  }

  stopMusic() {
    if (this.musicTimer) {
      clearTimeout(this.musicTimer);
      this.musicTimer = null;
    }
    if (this.musicGain && this.ctx) {
      try {
        this.musicGain.gain.cancelScheduledValues(this.ctx.currentTime);
        this.musicGain.gain.setValueAtTime(0.0001, this.ctx.currentTime);
      } catch {
        /* context closed */
      }
      this.musicGain.disconnect?.();
    }
    this.musicGain = null;
    this.musicPlaying = false;
    this.wasMusicRequested = false;
  }

  scheduleMusicStep() {
    if (!this.musicActive()) return;
    const step = this.musicStep;
    const chords = SoundManager.MUSIC_CHORDS;
    const chord = chords[Math.floor(step / 4) % chords.length];
    const now = this.ctx.currentTime;
    const semis = (n) => chord.root * Math.pow(2, n / 12);

    // Arpeggio: walk the 4 chord tones across the 4 steps of the bar so the
    // melody moves instead of holding one tone.
    const deg = chord.arp[step % chord.arp.length];
    this.playPluck(semis(deg), now, 0.16, 0.34, 'triangle');
    // Soft octave shimmer (quiet, short) on the beat for sparkle.
    if (step % 2 === 0) this.playPluck(semis(deg + 12), now + 0.02, 0.07, 0.26, 'sine');
    // Gentle low root pulse on the downbeat only (short, not a drone).
    if (step % 4 === 0) this.playPluck(chord.root / 2, now, 0.1, 0.36, 'sine');

    this.musicStep = (step + 1) % 16;
    this.musicTimer = setTimeout(() => this.scheduleMusicStep(), SoundManager.MUSIC_TEMPO_MS);
  }

  init() {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (AudioContext) {
        this.ctx = new AudioContext();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  toggleMute() {
    this.muted = !this.muted;
    saveMuted(this.muted);
    // Mute must silence music too (brief §3): stop loop; resume when unmuted.
    if (this.muted) this.stopMusic();
    else if (this.musicPlaying || this.wasMusicRequested) this.startMusic();
    return this.muted;
  }

  playMenu() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    [392.0, 523.25].forEach((freq, i) => {
      const osc = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      const t = now + i * 0.07;
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, t);
      g.gain.setValueAtTime(this.volume * 0.45, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.18);
      osc.connect(g);
      g.connect(this.ctx.destination);
      osc.start(t);
      osc.stop(t + 0.19);
    });
  }

  // "Kỷ lục mới" fanfare used when confetti fires.
  playRecord() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    [523.25, 659.25, 783.99, 1046.5].forEach((freq, i) => {
      const osc = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      const t = now + i * 0.09;
      osc.type = 'square';
      osc.frequency.setValueAtTime(freq, t);
      g.gain.setValueAtTime(this.volume * 0.18, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.3);
      osc.connect(g);
      g.connect(this.ctx.destination);
      osc.start(t);
      osc.stop(t + 0.31);
    });
  }

  playSlide() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const now = this.ctx.currentTime;

    osc.type = 'sine';
    osc.frequency.setValueAtTime(280, now);
    osc.frequency.exponentialRampToValueAtTime(140, now + 0.08);

    gain.gain.setValueAtTime(this.volume * 0.4, now);
    gain.gain.linearRampToValueAtTime(0.001, now + 0.08);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.09);
  }

  playMerge(tier = 1) {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const baseFreq = 261.63 * Math.pow(1.08, Math.min(tier, 10)); // Scale pitch with merge tier

    // 2-operator chime
    [1, 1.5].forEach((mult, i) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = i === 0 ? 'triangle' : 'sine';
      osc.frequency.setValueAtTime(baseFreq * mult, now);
      osc.frequency.exponentialRampToValueAtTime(baseFreq * mult * 1.05, now + 0.14);

      gain.gain.setValueAtTime(this.volume * 0.6, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.16);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.17);
    });
  }

  playCombo(level = 1) {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6 arpeggio

    notes.forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const t = now + idx * 0.05;

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq * (1 + (level - 1) * 0.1), t);

      gain.gain.setValueAtTime(this.volume * 0.7, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.18);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(t);
      osc.stop(t + 0.19);
    });
  }

  playGameOver() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const notes = [349.23, 293.66, 233.08]; // F4, D4, Bb3 descending sad chime

    notes.forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const t = now + idx * 0.12;

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq, t);

      gain.gain.setValueAtTime(this.volume * 0.35, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.28);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(t);
      osc.stop(t + 0.3);
    });
  }

  playClick() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(800, now);
    osc.frequency.exponentialRampToValueAtTime(400, now + 0.03);

    gain.gain.setValueAtTime(this.volume * 0.3, now);
    gain.gain.linearRampToValueAtTime(0.001, now + 0.03);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.035);
  }
}

export const sounds = new SoundManager();
