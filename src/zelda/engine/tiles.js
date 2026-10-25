// Décor en relief : chaque tuile fait 32 px et est éclairée depuis le haut à gauche
import { TILE, COLS, ROWS, W, H } from './world';
import { S, Pix, relief, ramp, rgb, tint, hash, vnoise } from './pixel';

const T = TILE * S;

const GRASS_A = ramp('#56a63d');
const GRASS_B = ramp('#62ac3a');
const SAND = ramp('#e0c58a', 0.5);
const PEBBLE = ramp('#b3a28a', 0.7);
const WATER = ramp('#2f6fd0', 0.9);
const DIRT = ramp('#8a5f3a', 0.8);
const BARK = ramp('#7a4a26');
const LEAF = ramp('#2f8a3a', 1.1);
const BUSH = ramp('#3e9c40');
const ROCK = ramp('#94806b');
const CLIFF = ramp('#7f6c5a');
const STONE = ramp('#a9a9b3');
const MOSS = ramp('#5d8a3a');
const WOOD = ramp('#7a5030');
const FLOOR_A = ramp('#4c5272', 0.8);
const FLOOR_B = ramp('#474d6b', 0.8);
const BRICK = ramp('#634e7c');
const GOLD = ramp('#e8b830');

const OUT_LEAF = rgb('#123d1a');
const OUT_BUSH = rgb('#174a1c');
const OUT_ROCK = rgb('#3a2e26');
const OUT_STONE = rgb('#3c3c48');
const MORTAR = rgb('#241b30');

const sphereH = (x, y, cx, cy, r) => {
  const d2 = (x - cx) ** 2 + (y - cy) ** 2;
  return d2 < r * r ? Math.sqrt(r * r - d2) : -1;
};
const blobH = (x, y, balls) => balls.reduce((h, [cx, cy, r]) => Math.max(h, sphereH(x, y, cx, cy, r)), -1);

// Distance au bord d'un rectangle, pour biseauter les blocs
const bevel = (x, y, x0, y0, x1, y1, b) => {
  if (x < x0 || y < y0 || x > x1 || y > y1) return -1;
  return Math.min(x - x0, x1 - x, y - y0, y1 - y, b);
};

// ---------- Sols ----------

function grass(pix, ox, oy, c, r) {
  relief(pix, ox, oy, T, T,
    (x, y) => vnoise((ox + x) / 6, (oy + y) / 5, 1) * 1.3 + vnoise((ox + x) / 1.5, (oy + y) / 2.5, 2) * 0.55,
    () => GRASS_A, { dither: 0.35, seamless: true, steep: 0.6 });
  // Variation de teinte à grande échelle, continue d'une tuile à l'autre
  for (let y = 0; y < T; y++) {
    for (let x = 0; x < T; x++) {
      const n = vnoise((ox + x) / 46, (oy + y) / 46, 3);
      if (n > 0.55) pix.set(ox + x, oy + y, GRASS_B[2], (n - 0.55) * 0.9);
    }
  }
  for (let i = 0; i < 2; i++) {
    const tx = ox + 4 + Math.floor(hash(c, r, i + 30) * 24);
    const ty = oy + 6 + Math.floor(hash(c, r, i + 40) * 22);
    for (const k of [-2, 0, 2]) {
      pix.set(tx + k + k / 2, ty - 3, GRASS_A[4]);
      pix.set(tx + k + k / 4, ty - 2, GRASS_A[3]);
      pix.set(tx + k, ty - 1, GRASS_A[2]);
      pix.set(tx + k, ty, GRASS_A[0]);
    }
  }
}

function flowers(pix, ox, oy, c, r) {
  grass(pix, ox, oy, c, r);
  [[7, 9], [21, 18], [11, 24]].forEach(([fx, fy], i) => {
    const P = ramp(hash(c, r, i + 20) > 0.5 ? '#f4f1ff' : '#ffd84a', 0.8);
    const x = ox + fx, y = oy + fy;
    pix.set(x, y + 3, GRASS_A[0]); pix.set(x, y + 4, GRASS_A[0]);
    const petals = [[0, -2, 4], [-2, 0, 3], [2, 0, 1], [0, 2, 1]];
    for (const [dx, dy, k] of petals) {
      pix.set(x + dx, y + dy, P[k]); pix.set(x + dx + 1, y + dy, P[k - 1 < 0 ? 0 : k - 1]);
      pix.set(x + dx, y + dy + 1, P[k]); pix.set(x + dx + 1, y + dy + 1, P[Math.max(0, k - 1)]);
    }
    pix.set(x, y, [240, 120, 50]); pix.set(x + 1, y, [250, 160, 60]);
    pix.set(x, y + 1, [200, 90, 40]); pix.set(x + 1, y + 1, [230, 120, 50]);
  });
}

function sand(pix, ox, oy, c, r) {
  relief(pix, ox, oy, T, T,
    (x, y) => 1 + Math.sin((ox + x) * 0.22 + (oy + y) * 0.6 + vnoise((ox + x) / 9, (oy + y) / 9, 4) * 4) * 0.45 + vnoise((ox + x) / 2, (oy + y) / 2, 5) * 0.35,
    SAND, { dither: 0.5, seamless: true, steep: 0.6 });
  if (hash(c, r, 50) > 0.6) {
    const px = ox + 6 + Math.floor(hash(c, r, 51) * 20), py = oy + 6 + Math.floor(hash(c, r, 52) * 20);
    relief(pix, px, py, 5, 4, (x, y) => sphereH(x, y * 1.3, 2, 2, 2.4), PEBBLE);
  }
}

function water(pix, ox, oy, c, r, tiles) {
  relief(pix, ox, oy, T, T,
    (x, y) => 2 + Math.sin((ox + x) / 5 + Math.sin((oy + y) / 7) * 2) * 0.7 + Math.sin((oy + y) / 3.5 + (ox + x) / 9) * 0.45,
    WATER, { dither: 0.9, seamless: true, steep: 0.8 });
  for (let i = 0; i < 3; i++) {
    if (hash(c, r, i + 60) > 0.5) continue;
    const sx = ox + Math.floor(hash(c, r, i + 61) * 28), sy = oy + 4 + Math.floor(hash(c, r, i + 62) * 26);
    pix.set(sx, sy, [220, 240, 255]); pix.set(sx + 1, sy, [170, 210, 255]); pix.set(sx + 2, sy, [220, 240, 255]);
  }
  // Berges : l'eau est en contrebas, on voit la paroi du rivage
  const isWater = (cc, rr) => rr < 0 || rr >= ROWS || cc < 0 || cc >= COLS || tiles[rr][cc] === 'W';
  if (!isWater(c, r - 1)) {
    const wall = tiles[r - 1][c] === 'S' ? SAND : DIRT;
    for (let y = 0; y < 6; y++) {
      for (let x = 0; x < T; x++) {
        const k = y === 0 ? 3 : y < 3 ? 1 + ((x + y) & 1) : 0;
        pix.set(ox + x, oy + y, wall[k]);
      }
    }
    for (let x = 0; x < T; x++) if (vnoise((ox + x) / 3, oy, 8) > 0.45) pix.set(ox + x, oy + 6, [200, 228, 255]);
  }
  if (!isWater(c - 1, r)) for (let y = 0; y < T; y++) { pix.set(ox, oy + y, DIRT[1]); pix.set(ox + 1, oy + y, DIRT[0]); pix.set(ox + 2, oy + y, [190, 220, 250], 0.6); }
  if (!isWater(c + 1, r)) for (let y = 0; y < T; y++) { pix.set(ox + T - 1, oy + y, DIRT[2]); pix.set(ox + T - 3, oy + y, [190, 220, 250], 0.6); }
}

function floor(pix, ox, oy, c, r, tiles) {
  const pal = (c + r) % 2 ? FLOOR_A : FLOOR_B;
  relief(pix, ox, oy, T, T,
    (x, y) => {
      const b = bevel(x, y, 0, 0, T - 1, T - 1, 3);
      return b < 0 ? -1 : b * 0.9 + vnoise((ox + x) / 5, (oy + y) / 5, 9) * 0.6;
    }, pal, { dither: 0.5 });
  for (let i = 0; i < T; i++) { pix.set(ox + i, oy, MORTAR); pix.set(ox, oy + i, MORTAR); }
  // Le mur au-dessus projette son ombre
  if (r > 0 && tiles[r - 1][c] === '#') {
    for (let y = 0; y < 8; y++) for (let x = 0; x < T; x++) pix.set(ox + x, oy + y, [10, 8, 24], 0.5 * (1 - y / 8));
  }
}

function wall(pix, ox, oy, c, r, tiles) {
  for (let y = 0; y < T; y++) for (let x = 0; x < T; x++) pix.set(ox + x, oy + y, MORTAR);
  for (let row = 0; row < 4; row++) {
    const off = ((r * 4 + row) % 2) * 8;
    for (let bx = -16 + off; bx < T; bx += 16) {
      relief(pix, ox, oy + row * 8, T, 8,
        (x, y) => {
          const b = bevel(x, y, bx + 1, 1, bx + 15, 7, 2);
          return b < 0 ? -1 : b + vnoise((ox + x) / 4, (oy + row * 8 + y) / 4, 10) * 0.4;
        }, BRICK, { dither: 0.5 });
    }
  }
  if (r < ROWS - 1 && tiles[r + 1][c] !== '#') {
    for (let x = 0; x < T; x++) { pix.set(ox + x, oy + T - 1, [10, 8, 20]); pix.set(ox + x, oy + T - 2, [20, 14, 34], 0.6); }
  }
}

function stairs(pix, ox, oy) {
  for (let step = 0; step < 4; step++) {
    const pal = ramp('#4c5272', 0.8).map(col => tint(col, -0.22 * step));
    relief(pix, ox, oy + step * 8, T, 8,
      (x, y) => (y < 6 ? Math.min(y + 1, 6 - y, 2) * 1.2 : -1), pal, { dither: 0.4 });
    for (let x = 0; x < T; x++) { pix.set(ox + x, oy + step * 8 + 6, [8, 8, 16]); pix.set(ox + x, oy + step * 8 + 7, [4, 4, 10]); }
  }
}

// Bloc de falaise plein, sous les portes de la montagne
function cliffBlock(pix, ox, oy) {
  relief(pix, ox, oy, T, T,
    (x, y) => {
      const b = bevel(x, y, 0, 0, T - 1, T - 1, 4);
      return b * 1.4 + Math.floor(vnoise((ox + x) / 5, (oy + y) / 5, 11) * 4) * 0.9;
    }, CLIFF, { dither: 0.5 });
}

// ---------- Objets (dessinés après les ombres, rangée par rangée) ----------

function tree(pix, ox, oy) {
  relief(pix, ox + 11, oy + 17, 11, 15,
    (x, y) => {
      const half = y > 11 ? 5.5 : 4.2;
      const dx = (x - 5) / half;
      return Math.abs(dx) < 1 ? Math.sqrt(1 - dx * dx) * 4 + vnoise(x / 1.2, (oy + y) / 5, 12) * 0.8 : -1;
    }, BARK, { outline: rgb('#3a2010') });
  const balls = [[16, 18, 12], [7, 22, 8.5], [25, 22, 8.5], [16, 9, 9.5], [9, 13, 7.5], [23, 13, 7.5]];
  relief(pix, ox, oy - 6, T, 36,
    (x, y) => {
      if (y > 33) return -1;
      const h = blobH(x, y, balls);
      return h < 0 ? -1 : h + vnoise((ox + x) / 2.4, (oy + y) / 2.4, 13) * 2.4;
    }, LEAF, { outline: OUT_LEAF, steep: 1.1 });
}

function bush(pix, ox, oy) {
  const balls = [[16, 19, 9], [9, 21, 7], [23, 21, 7], [12, 13, 7], [20, 13, 7]];
  relief(pix, ox, oy, T, T,
    (x, y) => {
      const h = blobH(x, y, balls);
      return h < 0 || y > 28 ? -1 : h + vnoise((ox + x) / 2, (oy + y) / 2, 14) * 2;
    }, BUSH, { outline: OUT_BUSH });
}

function boulder(pix, ox, oy, c, r) {
  const sx = 13.5 + hash(c, r, 70), sy = 12.5 + hash(c, r, 71);
  relief(pix, ox, oy, T, T,
    (x, y) => {
      const dx = (x - 16) / (sx + 1), dy = (y - 17) / sy;
      const d = dx * dx + dy * dy;
      if (d >= 1) return -1;
      // Facettes : la hauteur est arrondie par paliers pour des plans nets
      const h = Math.sqrt(1 - d) * 11 + vnoise((ox + x) / 5, (oy + y) / 5, 15) * 5;
      return Math.floor(h / 1.6) * 1.6;
    }, ROCK, { outline: OUT_ROCK, dither: 0.5 });
}

function grave(pix, ox, oy) {
  relief(pix, ox + 6, oy + 24, 20, 7,
    (x, y) => sphereH(x / 1.8, y, 5.5, 3.5, 4), MOSS, { outline: rgb('#2a4018') });
  relief(pix, ox + 8, oy + 3, 17, 24,
    (x, y) => {
      const inArch = y >= 8 || (x - 8) ** 2 + (y - 8) ** 2 <= 72;
      if (!inArch || x > 16 || y > 23) return -1;
      const edge = Math.min(x, 16 - x, 23 - y, y >= 8 ? 99 : 8.5 - Math.hypot(x - 8, y - 8));
      let h = Math.min(edge, 3) * 1.3;
      const cross = (x >= 7 && x <= 9 && y >= 6 && y <= 17) || (y >= 9 && y <= 11 && x >= 4 && x <= 12);
      if (cross) h -= 1.8;
      return Math.max(0, h);
    }, STONE, { outline: OUT_STONE });
}

function door(pix, ox, oy) {
  cliffBlock(pix, ox, oy);
  const inArch = (x, y) => x >= 7 && x <= 24 && y >= 8 && (y >= 15 || (x - 15.5) ** 2 + (y - 15) ** 2 <= 80);
  relief(pix, ox, oy, T, T,
    (x, y) => {
      if (!inArch(x, y)) return -1;
      const plank = (x - 7) % 5;
      return Math.min(plank, 4 - plank) * 1.2 + 1;
    }, WOOD, { outline: OUT_ROCK });
  for (const by of [13, 24]) for (let x = 8; x < 24; x++) { pix.set(ox + x, oy + by, [60, 60, 70]); pix.set(ox + x, oy + by + 1, [110, 110, 120]); }
  relief(pix, ox + 13, oy + 17, 6, 6, (x, y) => sphereH(x, y, 2.5, 2.5, 3), GOLD, { outline: rgb('#5a3a08') });
}

function caveMouth(pix, ox, oy) {
  cliffBlock(pix, ox, oy);
  for (let y = 7; y < T; y++) {
    for (let x = 6; x <= 25; x++) {
      if (y < 15 && (x - 15.5) ** 2 + (y - 15) ** 2 > 90) continue;
      const k = Math.min(1, (y - 7) / 30);
      pix.set(ox + x, oy + y, [Math.round(8 + 22 * k), Math.round(6 + 14 * k), Math.round(12 + 10 * k)]);
    }
  }
}

const GROUND = { ',': flowers, S: sand, W: water, F: floor, E: stairs, '#': wall, D: cliffBlock, C: cliffBlock };
const OBJECTS = { T: tree, B: bush, R: boulder, G: grave, D: door, C: caveMouth };
const SHADOWS = { T: [19, 30, 13, 5], B: [18, 28, 11, 4], R: [19, 29, 13, 4], G: [18, 28, 9, 3] };

export function roomCanvas(room) {
  if (room.canvas && !room.dirty) return room.canvas;
  const pix = new Pix(W * S, H * S);
  const t = room.tiles;
  for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) (GROUND[t[r][c]] || grass)(pix, c * T, r * T, c, r, t);
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      const sh = SHADOWS[t[r][c]];
      if (sh) pix.shadow(c * T + sh[0], r * T + sh[1], sh[2], sh[3]);
    }
  }
  for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) OBJECTS[t[r][c]]?.(pix, c * T, r * T, c, r);
  room.canvas = pix.toCanvas(room.canvas || undefined);
  room.dirty = false;
  return room.canvas;
}
