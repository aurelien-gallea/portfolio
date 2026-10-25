// Petits sons 8 bits synthétisés avec la Web Audio API

class Sfx {
  constructor() {
    this.ctx = null;
    this.master = null;
    this.muted = localStorage.getItem('zelda2d_muted') === '1';
  }

  init() {
    if (!this.ctx) {
      const Ctx = window.AudioContext || window.webkitAudioContext;
      if (!Ctx) return;
      this.ctx = new Ctx();
      this.master = this.ctx.createGain();
      this.master.gain.value = this.muted ? 0 : 0.5;
      this.master.connect(this.ctx.destination);
    }
    if (this.ctx.state === 'suspended') this.ctx.resume();
  }

  setMuted(muted) {
    this.muted = muted;
    localStorage.setItem('zelda2d_muted', muted ? '1' : '0');
    if (this.master) this.master.gain.value = muted ? 0 : 0.5;
  }

  tone(type, from, to, duration, volume, delay = 0) {
    if (!this.ctx) return;
    const now = this.ctx.currentTime + delay;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(from, now);
    if (to !== from) osc.frequency.exponentialRampToValueAtTime(to, now + duration);
    gain.gain.setValueAtTime(volume, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);
    osc.connect(gain);
    gain.connect(this.master);
    osc.start(now);
    osc.stop(now + duration);
  }

  noise(duration, volume, freq) {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const buffer = this.ctx.createBuffer(1, Math.floor(this.ctx.sampleRate * duration), this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
    const src = this.ctx.createBufferSource();
    const filter = this.ctx.createBiquadFilter();
    const gain = this.ctx.createGain();
    src.buffer = buffer;
    filter.type = 'bandpass';
    filter.frequency.value = freq;
    gain.gain.setValueAtTime(volume, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);
    src.connect(filter);
    filter.connect(gain);
    gain.connect(this.master);
    src.start(now);
  }

  play(name) {
    switch (name) {
      case 'sword': this.noise(0.12, 0.35, 2400); this.tone('square', 900, 500, 0.08, 0.04); break;
      case 'beam': this.tone('square', 1200, 1800, 0.15, 0.05); break;
      case 'hit': this.tone('square', 300, 120, 0.1, 0.08); break;
      case 'kill': this.noise(0.25, 0.4, 600); this.tone('triangle', 400, 80, 0.2, 0.08); break;
      case 'hurt': this.tone('sawtooth', 220, 90, 0.25, 0.08); break;
      case 'block': this.tone('square', 1500, 1500, 0.05, 0.05); break;
      case 'cut': this.noise(0.1, 0.3, 1200); break;
      case 'rupee': this.tone('square', 1320, 1320, 0.06, 0.05); this.tone('square', 1760, 1760, 0.1, 0.05, 0.06); break;
      case 'heart': this.tone('triangle', 660, 990, 0.15, 0.08); break;
      case 'shoot': this.tone('square', 500, 250, 0.08, 0.04); break;
      case 'door': this.noise(0.4, 0.3, 300); this.tone('square', 110, 80, 0.4, 0.05); break;
      case 'secret':
        [523, 659, 784, 1047].forEach((f, i) => this.tone('square', f, f, 0.14, 0.05, i * 0.1));
        break;
      case 'item':
        [392, 494, 587, 784].forEach((f, i) => this.tone('triangle', f, f, 0.2, 0.09, i * 0.12));
        break;
      case 'victory':
        [523, 659, 784, 659, 784, 1047].forEach((f, i) => this.tone('square', f, f, 0.22, 0.05, i * 0.16));
        break;
      case 'gameover':
        [392, 330, 262, 196].forEach((f, i) => this.tone('triangle', f, f * 0.98, 0.3, 0.09, i * 0.25));
        break;
      default:
    }
  }
}

export const sfx = new Sfx();
