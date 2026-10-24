// Web Audio API procedural sound synthesizer for Zombie Rules

class SoundManager {
  constructor() {
    this.ctx = null;
    this.master = null;
    this.muted = localStorage.getItem('zombie_game_muted') === '1';
  }

  init() {
    if (!this.ctx) {
      const Ctx = window.AudioContext || window.webkitAudioContext;
      if (!Ctx) return;
      this.ctx = new Ctx();
      this.master = this.ctx.createGain();
      this.master.gain.value = this.muted ? 0 : 0.8;
      this.master.connect(this.ctx.destination);
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  setMuted(muted) {
    this.muted = muted;
    localStorage.setItem('zombie_game_muted', muted ? '1' : '0');
    if (this.master) this.master.gain.value = muted ? 0 : 0.8;
  }

  // Short oscillator blip with an exponential fade
  tone(type, from, to, duration, volume, delay = 0) {
    this.init();
    if (!this.ctx) return;
    const now = this.ctx.currentTime + delay;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(from, now);
    if (to !== from) osc.frequency.exponentialRampToValueAtTime(to, now + duration);
    gain.gain.setValueAtTime(volume, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + duration);
    osc.connect(gain);
    gain.connect(this.master);
    osc.start(now);
    osc.stop(now + duration);
  }

  // Filtered white noise burst (explosions, impacts)
  noise(duration, volume, freqFrom, freqTo, filterType = 'lowpass') {
    this.init();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const size = Math.floor(this.ctx.sampleRate * duration);
    const buffer = this.ctx.createBuffer(1, size, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < size; i++) data[i] = Math.random() * 2 - 1;
    const src = this.ctx.createBufferSource();
    src.buffer = buffer;
    const filter = this.ctx.createBiquadFilter();
    filter.type = filterType;
    filter.frequency.setValueAtTime(freqFrom, now);
    filter.frequency.exponentialRampToValueAtTime(freqTo, now + duration);
    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(volume, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + duration);
    src.connect(filter);
    filter.connect(gain);
    gain.connect(this.master);
    src.start(now);
  }

  playHandgun() {
    this.tone('sawtooth', 300, 30, 0.15, 0.5);
    this.noise(0.08, 0.35, 3000, 400);
  }

  playShotgun() {
    this.noise(0.3, 0.9, 900, 50);
    this.tone('square', 120, 40, 0.2, 0.3);
  }

  playKnife() {
    this.noise(0.12, 0.25, 6000, 1500, 'highpass');
  }

  playReload() {
    this.tone('square', 400, 400, 0.06, 0.15);
    this.tone('square', 650, 650, 0.08, 0.15, 0.12);
  }

  playReloadDone() {
    this.tone('square', 900, 900, 0.05, 0.15);
  }

  playZombieGrowl() {
    this.init();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(70 + Math.random() * 30, now);
    osc.frequency.linearRampToValueAtTime(110, now + 0.2);
    osc.frequency.linearRampToValueAtTime(55, now + 0.45);
    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.45);
    osc.connect(gain);
    gain.connect(this.master);
    osc.start(now);
    osc.stop(now + 0.45);
  }

  playZombieHit() {
    this.noise(0.08, 0.3, 700, 150);
  }

  playZombieDeath() {
    this.tone('sawtooth', 140, 40, 0.35, 0.25);
    this.noise(0.25, 0.3, 500, 80);
  }

  playFall() {
    this.tone('sine', 700, 60, 0.7, 0.25);
  }

  playHurt() {
    this.tone('square', 200, 70, 0.22, 0.3);
    this.noise(0.12, 0.3, 1200, 200);
  }

  playPickup() {
    this.tone('triangle', 523.25, 523.25, 0.08, 0.3);
    this.tone('triangle', 659.25, 659.25, 0.08, 0.3, 0.08);
    this.tone('triangle', 783.99, 783.99, 0.15, 0.3, 0.16);
  }

  playWeaponPickup() {
    this.tone('square', 220, 220, 0.1, 0.2);
    this.tone('square', 330, 330, 0.1, 0.2, 0.1);
    this.tone('square', 440, 440, 0.25, 0.2, 0.2);
  }

  playUnlock() {
    this.tone('triangle', 880, 880, 0.12, 0.3);
    this.tone('triangle', 1318.5, 1318.5, 0.3, 0.3, 0.12);
  }

  playAlarm() {
    for (let i = 0; i < 3; i++) {
      this.tone('sawtooth', 520, 340, 0.4, 0.18, i * 0.45);
    }
  }

  playVictory() {
    [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => this.tone('triangle', f, f, 0.3, 0.3, i * 0.12));
  }

  playCeilingCrack() {
    this.noise(0.5, 0.25, 4000, 900, 'bandpass');
    this.tone('sawtooth', 60, 40, 0.6, 0.12);
  }

  playDropLand() {
    this.noise(0.35, 0.8, 600, 40);
    this.tone('sine', 90, 30, 0.3, 0.5);
    this.playZombieGrowl();
  }

  playEmptyClick() {
    this.tone('square', 800, 800, 0.03, 0.15);
  }
}

export const sounds = new SoundManager();
