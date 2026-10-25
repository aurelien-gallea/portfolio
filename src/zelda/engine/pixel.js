// Outils de pixel art : rampes de couleurs, bruit, formes en relief éclairées et affinage des sprites

export const S = 2; // pixels d'écran par unité de jeu

export function hash(x, y, s = 0) {
  let h = Math.imul(x + 11, 374761393) ^ Math.imul(y + 7, 668265263) ^ Math.imul(s + 3, 982451653);
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}

export function vnoise(x, y, seed = 0) {
  const xi = Math.floor(x), yi = Math.floor(y);
  const xf = x - xi, yf = y - yi;
  const u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf);
  const a = hash(xi, yi, seed), b = hash(xi + 1, yi, seed), c = hash(xi, yi + 1, seed), d = hash(xi + 1, yi + 1, seed);
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
}

export const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

// ---------- Couleurs ----------

export const rgb = hex => [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16));
const mixRgb = (a, b, t) => a.map((v, i) => Math.round(v + (b[i] - v) * t));
const WARM = [255, 244, 210];
const COOL = [22, 20, 56];

// Ombres bleutées, lumières chaudes : la teinte glisse avec la luminosité
export const tint = (c, k) => (k >= 0 ? mixRgb(c, WARM, k) : mixRgb(c, COOL, -k));

export function ramp(hex, spread = 1) {
  const c = rgb(hex);
  return [-0.6, -0.33, 0, 0.24, 0.48].map(k => tint(c, k * spread));
}

// ---------- Image en mémoire ----------

export class Pix {
  constructor(w, h) {
    this.w = w;
    this.h = h;
    this.d = new Uint8ClampedArray(w * h * 4);
  }

  set(x, y, c, a = 1) {
    x = Math.floor(x);
    y = Math.floor(y);
    if (x < 0 || y < 0 || x >= this.w || y >= this.h) return;
    const d = this.d, i = (y * this.w + x) * 4;
    if (a >= 1 || d[i + 3] === 0) {
      d[i] = c[0]; d[i + 1] = c[1]; d[i + 2] = c[2];
      d[i + 3] = a >= 1 ? 255 : Math.round(a * 255);
      return;
    }
    d[i] += (c[0] - d[i]) * a;
    d[i + 1] += (c[1] - d[i + 1]) * a;
    d[i + 2] += (c[2] - d[i + 2]) * a;
  }

  // Ombre portée douce en ellipse
  shadow(cx, cy, rx, ry, a = 0.32) {
    for (let y = -ry; y <= ry; y++) {
      for (let x = -rx; x <= rx; x++) {
        const d = (x / rx) ** 2 + (y / ry) ** 2;
        if (d < 1) this.set(cx + x, cy + y, [16, 26, 30], a * (1 - d * d));
      }
    }
  }

  toCanvas(canvas = document.createElement('canvas')) {
    canvas.width = this.w;
    canvas.height = this.h;
    canvas.getContext('2d').putImageData(new ImageData(this.d, this.w, this.h), 0, 0);
    return canvas;
  }
}

// ---------- Relief éclairé ----------

const LIGHT = (() => {
  const v = [-0.55, -0.75, 0.95];
  const n = Math.hypot(...v);
  return v.map(x => x / n);
})();
const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5].map(v => v / 16 - 0.47);

// height(x, y) donne la hauteur locale, ou -1 hors de la forme. La lumière vient du haut à gauche
// et la teinte est choisie dans la rampe selon l'orientation de la surface, avec un léger tramage.
// seamless : la hauteur est aussi lue au-delà du cadre, pour raccorder les sols d'une tuile à l'autre.
export function relief(pix, ox, oy, w, h, height, colors, { outline = null, dither = 0.7, bias = 0, steep = 1, seamless = false } = {}) {
  const hm = new Float32Array(w * h);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) hm[y * w + x] = height(x, y);
  const at = (x, y) => (x < 0 || y < 0 || x >= w || y >= h ? (seamless ? height(x, y) : -1) : hm[y * w + x]);
  const pos = v => (v < 0 ? 0 : v);

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const v = hm[y * w + x];
      if (v < 0) continue;
      if (outline && (at(x - 1, y) < 0 || at(x + 1, y) < 0 || at(x, y - 1) < 0 || at(x, y + 1) < 0)) {
        pix.set(ox + x, oy + y, outline);
        continue;
      }
      const nx = (pos(at(x - 1, y)) - pos(at(x + 1, y))) * 0.5 * steep;
      const ny = (pos(at(x, y - 1)) - pos(at(x, y + 1))) * 0.5 * steep;
      const lum = (nx * LIGHT[0] + ny * LIGHT[1] + LIGHT[2]) / Math.hypot(nx, ny, 1);
      const pal = typeof colors === 'function' ? colors(x, y, v) : colors;
      const t = (lum - LIGHT[2]) * 1.7 + 0.5 + bias + (BAYER[((oy + y) & 3) * 4 + ((ox + x) & 3)] * dither) / pal.length;
      pix.set(ox + x, oy + y, pal[clamp(Math.floor(t * pal.length), 0, pal.length - 1)]);
    }
  }
}

// ---------- Affinage des sprites ----------
// Les sprites 16 px sont doublés avec Scale2x (contours adoucis), le contour extérieur est
// aminci à 1 px, puis chaque zone de couleur reçoit un liseré clair en haut à gauche et sombre
// en bas à droite pour donner du volume.

const work = document.createElement('canvas');
const cache = new Map();

export function refined(w, h, draw) {
  work.width = w;
  work.height = h;
  const ctx = work.getContext('2d', { willReadFrequently: true });
  ctx.imageSmoothingEnabled = false;
  draw(ctx);
  const src = new Uint32Array(ctx.getImageData(0, 0, w, h).data.buffer);
  for (let i = 0; i < src.length; i++) if ((src[i] >>> 24) < 255) src[i] = 0;

  let key = 2166136261;
  for (let i = 0; i < src.length; i++) key = Math.imul(key ^ src[i], 16777619);
  key = `${w}x${h}:${key}`;
  const hit = cache.get(key);
  if (hit) return hit;

  const W2 = w * 2, H2 = h * 2;
  const big = new Uint32Array(W2 * H2);
  const p = (x, y) => (x < 0 || y < 0 || x >= w || y >= h ? 0 : src[y * w + x]);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const E = p(x, y), A = p(x, y - 1), B = p(x + 1, y), Cc = p(x - 1, y), D = p(x, y + 1);
      let e0 = E, e1 = E, e2 = E, e3 = E;
      if (A !== D && Cc !== B) {
        if (Cc === A) e0 = A;
        if (A === B) e1 = B;
        if (Cc === D) e2 = Cc;
        if (D === B) e3 = D;
      }
      const i = y * 2 * W2 + x * 2;
      big[i] = e0; big[i + 1] = e1; big[i + W2] = e2; big[i + W2 + 1] = e3;
    }
  }

  const q = (x, y) => (x < 0 || y < 0 || x >= W2 || y >= H2 ? 0 : big[y * W2 + x]);
  const lum = c => (c & 255) * 0.3 + ((c >>> 8) & 255) * 0.59 + ((c >>> 16) & 255) * 0.11;
  const out = new Uint8ClampedArray(W2 * H2 * 4);

  for (let y = 0; y < H2; y++) {
    for (let x = 0; x < W2; x++) {
      let c = big[y * W2 + x];
      if (!c) continue;
      let k = 0;
      if (lum(c) < 38) {
        // Contour : on ne garde que le pixel extérieur
        const edge1 = !q(x - 1, y) || !q(x + 1, y) || !q(x, y - 1) || !q(x, y + 1);
        const edge2 = !q(x - 2, y) || !q(x + 2, y) || !q(x, y - 2) || !q(x, y + 2);
        if (!edge1 && edge2) {
          const inner = [q(x - 1, y), q(x + 1, y), q(x, y - 1), q(x, y + 1)].find(n => n && lum(n) >= 38);
          if (inner) { c = inner; k = -0.38; }
        }
      } else {
        const ul = q(x - 1, y) !== c || q(x, y - 1) !== c;
        const dr = q(x + 1, y) !== c || q(x, y + 1) !== c;
        if (ul && !dr) k = 0.3;
        else if (dr && !ul) k = -0.26;
      }
      k -= (y / H2 - 0.5) * 0.16;
      const col = tint([c & 255, (c >>> 8) & 255, (c >>> 16) & 255], k);
      const i = (y * W2 + x) * 4;
      out[i] = col[0]; out[i + 1] = col[1]; out[i + 2] = col[2]; out[i + 3] = 255;
    }
  }

  const canvas = document.createElement('canvas');
  canvas.width = W2;
  canvas.height = H2;
  canvas.getContext('2d').putImageData(new ImageData(out, W2, H2), 0, 0);
  if (cache.size > 600) cache.clear();
  cache.set(key, canvas);
  return canvas;
}
