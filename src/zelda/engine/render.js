// Pixel art dessiné au pinceau : tuiles, héros, ennemis, objets et effets
import { TILE, COLS, ROWS, W, H } from './world';

const C = {
  grass: '#58a83f', grassDark: '#3f8a30', grassLight: '#7cc45c',
  sand: '#e2c98b', sandDark: '#c8aa66',
  water: '#2f6fd0', waterLight: '#6aa0ee',
  trunk: '#6b4423', leaf: '#1f6b2c', leafLight: '#2f8f3a', leafDark: '#164d20',
  rock: '#8a6d55', rockLight: '#ad8f74', rockDark: '#5e4838',
  bush: '#2e8b3a', bushLight: '#57b55a', bushDark: '#1c5e26',
  stone: '#a7a7ad', stoneDark: '#6c6c75', stoneLight: '#d2d2d9',
  floor: '#3b4058', floorLine: '#2c3044', floorLight: '#474d69',
  wall: '#5b4a70', wallDark: '#3b2f4a', wallLight: '#7a6694',
  black: '#0b0b10', gold: '#f2c230', goldDark: '#b4861a',
  tunic: '#3fae49', tunicDark: '#24792e', skin: '#f3c38f', hair: '#b06a26', boot: '#6b3d1c',
  shield: '#6b4a2b', shieldRim: '#c9a227', blade: '#e4e8ef', bladeDark: '#8a93a3',
};

const FLASH = { main: '#ffffff', dark: '#9fe8ff', light: '#ffffff' };

function hash(x, y, s = 0) {
  let h = Math.imul(x + 11, 374761393) ^ Math.imul(y + 7, 668265263) ^ Math.imul(s + 3, 982451653);
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}

function rect(ctx, color, x, y, w = 1, h = 1) {
  ctx.fillStyle = color;
  ctx.fillRect(x, y, w, h);
}

// ---------- Tuiles ----------

function grass(ctx, x, y, c, r) {
  rect(ctx, C.grass, x, y, TILE, TILE);
  for (let i = 0; i < 3; i++) {
    const gx = Math.floor(hash(c, r, i) * 13) + 1;
    const gy = Math.floor(hash(c, r, i + 5) * 12) + 2;
    rect(ctx, C.grassDark, x + gx, y + gy, 1, 2);
    rect(ctx, C.grassDark, x + gx + 2, y + gy, 1, 2);
    rect(ctx, C.grassDark, x + gx + 1, y + gy + 1, 1, 2);
  }
}

function flowers(ctx, x, y, c, r) {
  grass(ctx, x, y, c, r);
  const spots = [[3, 4], [10, 9], [6, 11]];
  spots.forEach(([fx, fy], i) => {
    const col = hash(c, r, i + 20) > 0.5 ? '#ffffff' : '#ffd84a';
    rect(ctx, col, x + fx, y + fy - 1, 1, 1);
    rect(ctx, col, x + fx - 1, y + fy, 3, 1);
    rect(ctx, col, x + fx, y + fy + 1, 1, 1);
    rect(ctx, '#e0573a', x + fx, y + fy, 1, 1);
  });
}

function sand(ctx, x, y, c, r) {
  rect(ctx, C.sand, x, y, TILE, TILE);
  for (let i = 0; i < 4; i++) {
    rect(ctx, C.sandDark, x + Math.floor(hash(c, r, i) * 15), y + Math.floor(hash(c, r, i + 9) * 15), 1, 1);
  }
}

function tree(ctx, x, y, c, r) {
  grass(ctx, x, y, c, r);
  rect(ctx, C.trunk, x + 6, y + 11, 4, 5);
  rect(ctx, C.leafDark, x + 1, y + 2, 14, 10);
  rect(ctx, C.leafDark, x + 2, y + 1, 12, 12);
  rect(ctx, C.leaf, x + 2, y + 2, 12, 9);
  rect(ctx, C.leaf, x + 3, y + 1, 10, 11);
  rect(ctx, C.leafLight, x + 4, y + 3, 4, 3);
  rect(ctx, C.leafLight, x + 9, y + 6, 3, 2);
}

function rock(ctx, x, y, c, r) {
  rect(ctx, C.rockDark, x, y, TILE, TILE);
  rect(ctx, C.rock, x + 1, y + 1, 14, 13);
  rect(ctx, C.rockLight, x + 1, y + 1, 12, 2);
  rect(ctx, C.rockLight, x + 1, y + 1, 2, 10);
  const k = Math.floor(hash(c, r) * 6);
  rect(ctx, C.rockDark, x + 5 + k, y + 5, 1, 4);
  rect(ctx, C.rockDark, x + 6 + k, y + 9, 3, 1);
}

function water(ctx, x, y, c, r) {
  rect(ctx, C.water, x, y, TILE, TILE);
  for (let i = 0; i < 2; i++) {
    const wx = Math.floor(hash(c, r, i) * 10) + 1;
    const wy = Math.floor(hash(c, r, i + 4) * 12) + 2;
    rect(ctx, C.waterLight, x + wx, y + wy, 4, 1);
    rect(ctx, C.waterLight, x + wx + 4, y + wy - 1, 2, 1);
  }
}

function bush(ctx, x, y, c, r) {
  grass(ctx, x, y, c, r);
  rect(ctx, C.bushDark, x + 1, y + 3, 14, 12);
  rect(ctx, C.bushDark, x + 3, y + 1, 10, 15);
  rect(ctx, C.bush, x + 2, y + 3, 12, 10);
  rect(ctx, C.bush, x + 3, y + 2, 10, 12);
  rect(ctx, C.bushLight, x + 4, y + 4, 3, 2);
  rect(ctx, C.bushLight, x + 9, y + 7, 3, 2);
  rect(ctx, C.bushLight, x + 5, y + 10, 2, 1);
}

function grave(ctx, x, y, c, r) {
  grass(ctx, x, y, c, r);
  rect(ctx, 'rgba(0,0,0,0.25)', x + 3, y + 13, 11, 3);
  rect(ctx, C.stoneDark, x + 3, y + 3, 10, 11);
  rect(ctx, C.stoneDark, x + 4, y + 2, 8, 1);
  rect(ctx, C.stone, x + 4, y + 3, 8, 10);
  rect(ctx, C.stoneLight, x + 4, y + 3, 2, 9);
  rect(ctx, C.stoneDark, x + 7, y + 5, 2, 6);
  rect(ctx, C.stoneDark, x + 5, y + 7, 6, 2);
}

function doorway(ctx, x, y, c, r, locked) {
  rock(ctx, x, y, c, r);
  rect(ctx, C.black, x + 3, y + 4, 10, 12);
  rect(ctx, C.black, x + 4, y + 3, 8, 1);
  if (locked) {
    rect(ctx, C.rockDark, x + 3, y + 4, 10, 12);
    rect(ctx, '#4a3628', x + 4, y + 5, 8, 11);
    rect(ctx, C.gold, x + 6, y + 9, 4, 3);
    rect(ctx, C.goldDark, x + 7, y + 7, 2, 2);
    rect(ctx, C.black, x + 7, y + 10, 2, 1);
  }
}

function floor(ctx, x, y, c, r) {
  rect(ctx, C.floor, x, y, TILE, TILE);
  rect(ctx, C.floorLine, x, y, TILE, 1);
  rect(ctx, C.floorLine, x, y, 1, TILE);
  if ((c + r) % 2 === 0) rect(ctx, C.floorLight, x + 6, y + 6, 4, 4);
}

function wall(ctx, x, y, c, r) {
  rect(ctx, C.wallDark, x, y, TILE, TILE);
  const off = r % 2 ? 4 : 0;
  for (let by = 0; by < 16; by += 8) {
    for (let bx = -8; bx < 16; bx += 8) {
      const sx = Math.max(0, bx + off + ((by / 8) % 2) * 4);
      const ex = Math.min(16, bx + off + ((by / 8) % 2) * 4 + 7);
      if (ex > sx) {
        rect(ctx, C.wall, x + sx, y + by + 1, ex - sx, 6);
        rect(ctx, C.wallLight, x + sx, y + by + 1, ex - sx, 1);
      }
    }
  }
}

function stairs(ctx, x, y) {
  rect(ctx, C.black, x, y, TILE, TILE);
  for (let i = 0; i < 4; i++) rect(ctx, '#23263a', x, y + i * 4, TILE, 2);
}

const TILES = {
  '.': grass, ',': flowers, S: sand, T: tree, R: rock, W: water, B: bush, G: grave,
  D: (ctx, x, y, c, r) => doorway(ctx, x, y, c, r, true),
  C: (ctx, x, y, c, r) => doorway(ctx, x, y, c, r, false),
  F: floor, '#': wall, E: stairs,
};

export function roomCanvas(room) {
  if (room.canvas && !room.dirty) return room.canvas;
  if (!room.canvas) {
    room.canvas = document.createElement('canvas');
    room.canvas.width = W;
    room.canvas.height = H;
  }
  const ctx = room.canvas.getContext('2d');
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      (TILES[room.tiles[r][c]] || grass)(ctx, c * TILE, r * TILE, c, r);
    }
  }
  room.dirty = false;
  return room.canvas;
}

// ---------- Héros ----------

// Sprites 16x16 dessinés pixel par pixel ('.' = transparent)
const HERO_PALETTE = {
  k: '#1d1426', // contour
  G: '#1f7a34', // vert foncé
  g: '#3fb24a', // vert
  l: '#8fe07c', // reflet du bonnet
  h: '#f2c443', // cheveux blonds
  H: '#c98f22', // cheveux ombrés
  s: '#ffd2a6', // peau
  S: '#e09a6c', // peau ombrée
  e: '#1d3557', // yeux
  w: '#ffffff', // reflet des yeux
  b: '#8a4f24', // cuir
  B: '#5a3214', // cuir foncé
  y: '#f6cf3a', // boucle dorée
  u: '#3b6fd6', // bouclier
  U: '#26489a', // bouclier ombré
};

const BODY_FRONT = [
  '..kkGggggggGkk..',
  '.kskGggggggGksk.',
  '.kSkbbbyybbbkSk.',
  '..kkGggggggGkk..',
  '...kGGgggGGGk...',
];
const BODY_BACK = [
  '..kkGggggggGkk..',
  '.kskGggggggGksk.',
  '.kSkbbbbbbbbkSk.',
  '..kkGggggggGkk..',
  '...kGGgggGGGk...',
];
const FEET_A = ['..kBBk....kBBk..', '..kkkk....kkkk..'];
const FEET_B = ['...kBBk..kBBk...', '....kk....kk....'];

const HEAD_DOWN = [
  '.....kkkkkk.....',
  '....kGggglGk....',
  '...kGggggllgk...',
  '..kGgggggggggk..',
  '..khhhhhhhhhhk..',
  '.kshHhhhhhhhHhsk',
  'kSshwesssswehssk',
  '.kshessSSssehsk.',
  '..kSssssssssSk..',
  '...kkSsssssSkk..',
  '.....kkkkkk.....',
];
const HEAD_UP = [
  '.....kkkkkk.....',
  '....kGggggGk....',
  '...kGggggggGk...',
  '..kGgggggggggk..',
  '..kGgggggggggk..',
  '.khhGgggggggGhk.',
  'kShhhGgggggGhhSk',
  '.khHhhGgggGhHhk.',
  '..khHhhGGhhHhk..',
  '...kkhHhhHhkk...',
  '.....kkkkkk.....',
];
const HEAD_SIDE = [
  '....kkkkkk......',
  '...kGgggglk.....',
  '..kGggggggllk...',
  '.kGggggggggggk..',
  'kGgkhhhhhhhhhk..',
  'kGkhHhhhssssssk.',
  '.kkhHhhsssswesk.',
  '..kShhhsssseSssk',
  '...kSHhssssSSkk.',
  '....kkSssssSk...',
  '......kkkkkk....',
];
const BODY_SIDE = [
  '.....kGgggGk....',
  '....kGgggsgGk...',
  '....kbbbbybbk...',
  '....kGgggggGk...',
  '....kGGggGGk....',
];
const FEET_SIDE_A = ['...kBBk..kBBk...', '...kkkk..kkkk...'];
const FEET_SIDE_B = ['.....kBBkBBk....', '.....kkkkkkk....'];

const SHIELD = ['.kkkk.', 'kuuuuk', 'kuyyUk', 'kuyyUk', 'kuuuUk', '.kUUk.', '..kk..'];
const SHIELD_SIDE = ['.kk.', 'kuuk', 'kuyk', 'kuyk', 'kuUk', 'kUUk', '.kk.'];

const spriteCache = new Map();

function sprite(name, rows) {
  if (spriteCache.has(name)) return spriteCache.get(name);
  const cv = document.createElement('canvas');
  cv.width = Math.max(...rows.map(r => r.length));
  cv.height = rows.length;
  const ctx = cv.getContext('2d');
  rows.forEach((row, y) => {
    for (let x = 0; x < row.length; x++) {
      const col = HERO_PALETTE[row[x]];
      if (col) rect(ctx, col, x, y, 1, 1);
    }
  });
  spriteCache.set(name, cv);
  return cv;
}

// La tête fait 11 lignes, le corps 5 et les pieds 2 : on les superpose pour gagner en hauteur
function heroSprite(dir, step) {
  const key = `${dir}${step}`;
  if (spriteCache.has(key)) return spriteCache.get(key);
  let head, body, feet;
  if (dir === 'side') {
    head = HEAD_SIDE; body = BODY_SIDE; feet = step ? FEET_SIDE_B : FEET_SIDE_A;
  } else {
    head = dir === 'up' ? HEAD_UP : HEAD_DOWN;
    body = dir === 'up' ? BODY_BACK : BODY_FRONT;
    feet = step ? FEET_B : FEET_A;
  }
  const rows = [...head.slice(0, 10), ...body, ...feet].slice(-17);
  return sprite(key, rows);
}

function sword(ctx, x, y, dir, reach) {
  const len = Math.round(11 * reach);
  if (len <= 0) return;
  if (dir === 'up') {
    rect(ctx, HERO_PALETTE.k, x + 5, y + 1 - len, 4, len + 1);
    rect(ctx, C.blade, x + 6, y + 1 - len, 2, len);
    rect(ctx, C.bladeDark, x + 7, y + 2 - len, 1, len - 1);
    rect(ctx, HERO_PALETTE.k, x + 3, y, 8, 3);
    rect(ctx, HERO_PALETTE.y, x + 4, y + 1, 6, 1);
  } else if (dir === 'down') {
    rect(ctx, HERO_PALETTE.k, x + 7, y + 15, 4, len + 1);
    rect(ctx, C.blade, x + 8, y + 15, 2, len);
    rect(ctx, C.bladeDark, x + 9, y + 15, 1, len - 1);
    rect(ctx, HERO_PALETTE.k, x + 5, y + 13, 8, 3);
    rect(ctx, HERO_PALETTE.y, x + 6, y + 14, 6, 1);
  } else {
    rect(ctx, HERO_PALETTE.k, x + 15, y + 9, len + 1, 4);
    rect(ctx, C.blade, x + 15, y + 10, len, 2);
    rect(ctx, C.bladeDark, x + 15, y + 11, len - 1, 1);
    rect(ctx, HERO_PALETTE.k, x + 13, y + 7, 3, 8);
    rect(ctx, HERO_PALETTE.y, x + 14, y + 8, 1, 6);
  }
}

export function drawHero(ctx, p, t) {
  const x = Math.round(p.x);
  const y = Math.round(p.y);
  rect(ctx, 'rgba(0,0,0,0.25)', x + 3, y + 14, 10, 2);
  if (p.invuln > 0 && Math.floor(t * 20) % 2 === 0) return;

  const step = p.moving ? Math.floor(t * 8) % 2 : 0;
  const reach = p.attack > 0 ? Math.min(1, (0.26 - p.attack) / 0.05) : 0;
  const top = y - 1;

  if (p.dir === 'left' || p.dir === 'right') {
    ctx.save();
    if (p.dir === 'left') {
      ctx.translate(2 * x + 16, 0);
      ctx.scale(-1, 1);
    }
    if (reach) sword(ctx, x, y, 'right', reach);
    ctx.drawImage(heroSprite('side', step), x, top);
    if (!reach) ctx.drawImage(sprite('shieldSide', SHIELD_SIDE), x + 11, y + 7);
    ctx.restore();
  } else if (p.dir === 'up') {
    if (reach) sword(ctx, x, y, 'up', reach);
    ctx.drawImage(sprite('shield', SHIELD), x - 1, y + 8);
    ctx.drawImage(heroSprite('up', step), x, top);
  } else {
    ctx.drawImage(heroSprite('down', step), x, top);
    if (!reach) ctx.drawImage(sprite('shield', SHIELD), x + 10, y + 8);
    else sword(ctx, x, y, 'down', reach);
  }
}

// ---------- Ennemis ----------

function slime(ctx, e, t, flash) {
  const x = Math.round(e.x), y = Math.round(e.y);
  const main = flash ? FLASH.main : '#d6403a';
  const dark = flash ? FLASH.dark : '#8a2320';
  const light = flash ? FLASH.light : '#f58a74';
  const step = Math.floor(t * 6) % 2;
  rect(ctx, 'rgba(0,0,0,0.22)', x + 3, y + 14, 10, 2);
  rect(ctx, dark, x + 3 + step, y + 13, 3, 3);
  rect(ctx, dark, x + 10 - step, y + 13, 3, 3);
  rect(ctx, dark, x + 2, y + 3, 12, 11);
  rect(ctx, dark, x + 3, y + 2, 10, 13);
  rect(ctx, main, x + 3, y + 3, 10, 10);
  rect(ctx, light, x + 4, y + 4, 3, 2);
  const [dx, dy] = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] }[e.dir] || [0, 1];
  rect(ctx, '#ffffff', x + 5, y + 6, 2, 3);
  rect(ctx, '#ffffff', x + 9, y + 6, 2, 3);
  rect(ctx, C.black, x + 5 + (dx > 0 ? 1 : 0), y + 7 + (dy > 0 ? 1 : dy < 0 ? -1 : 0), 1, 1);
  rect(ctx, C.black, x + 9 + (dx > 0 ? 1 : 0), y + 7 + (dy > 0 ? 1 : dy < 0 ? -1 : 0), 1, 1);
  // Museau dans la direction du regard
  if (e.dir === 'up') rect(ctx, dark, x + 6, y, 4, 3);
  else if (e.dir === 'down') rect(ctx, dark, x + 6, y + 12, 4, 2);
  else if (e.dir === 'left') rect(ctx, dark, x, y + 7, 3, 4);
  else rect(ctx, dark, x + 13, y + 7, 3, 4);
}

function bat(ctx, e, t, flash) {
  const x = Math.round(e.x), y = Math.round(e.y);
  const body = flash ? FLASH.main : '#4a2a6a';
  const wing = flash ? FLASH.dark : '#6d3f99';
  const up = e.resting ? false : Math.floor(t * 12) % 2 === 0;
  rect(ctx, 'rgba(0,0,0,0.18)', x + 5, y + 15, 6, 1);
  if (up) {
    rect(ctx, wing, x + 1, y + 3, 5, 3);
    rect(ctx, wing, x + 10, y + 3, 5, 3);
    rect(ctx, wing, x, y + 2, 2, 2);
    rect(ctx, wing, x + 14, y + 2, 2, 2);
  } else {
    rect(ctx, wing, x + 1, y + 8, 5, 2);
    rect(ctx, wing, x + 10, y + 8, 5, 2);
    rect(ctx, wing, x, y + 9, 2, 2);
    rect(ctx, wing, x + 14, y + 9, 2, 2);
  }
  rect(ctx, body, x + 5, y + 5, 6, 6);
  rect(ctx, body, x + 5, y + 4, 1, 1);
  rect(ctx, body, x + 10, y + 4, 1, 1);
  rect(ctx, '#ff4d4d', x + 6, y + 7, 1, 1);
  rect(ctx, '#ff4d4d', x + 9, y + 7, 1, 1);
}

function knight(ctx, e, t, flash) {
  const x = Math.round(e.x), y = Math.round(e.y);
  const armor = flash ? FLASH.main : '#5f7fa8';
  const helm = flash ? FLASH.light : '#93acd0';
  const dark = flash ? FLASH.dark : '#33476a';
  const step = Math.floor(t * (e.charging ? 10 : 5)) % 2;
  rect(ctx, 'rgba(0,0,0,0.22)', x + 3, y + 14, 10, 2);
  rect(ctx, dark, x + 4, y + 13 - step, 3, 3);
  rect(ctx, dark, x + 9, y + 12 + step, 3, 3);
  rect(ctx, dark, x + 3, y + 6, 10, 8);
  rect(ctx, armor, x + 4, y + 7, 8, 6);
  rect(ctx, dark, x + 4, y + 1, 8, 7);
  rect(ctx, helm, x + 5, y + 2, 6, 5);
  rect(ctx, '#d64545', x + 7, y, 2, 2);
  if (e.dir !== 'up') rect(ctx, C.black, x + 5, y + 4, 6, 1);
  if (e.dir === 'left') rect(ctx, C.shieldRim, x + 1, y + 7, 3, 6);
  else if (e.dir === 'right') rect(ctx, C.shieldRim, x + 12, y + 7, 3, 6);
  else rect(ctx, C.shieldRim, x + 11, y + 8, 4, 5);
}

function boss(ctx, e, t, flash) {
  const x = Math.round(e.x), y = Math.round(e.y);
  const body = flash ? FLASH.main : '#6a3d9a';
  const dark = flash ? FLASH.dark : '#3e2161';
  const light = flash ? FLASH.light : '#9465c7';
  const bob = Math.floor(t * 4) % 2;
  rect(ctx, 'rgba(0,0,0,0.3)', x + 4, y + 29, 24, 3);
  rect(ctx, dark, x + 5, y + 25 + bob, 7, 6);
  rect(ctx, dark, x + 20, y + 26 - bob, 7, 6);
  rect(ctx, dark, x + 2, y + 6, 28, 22);
  rect(ctx, dark, x + 5, y + 3, 22, 26);
  rect(ctx, body, x + 4, y + 7, 24, 19);
  rect(ctx, body, x + 6, y + 5, 20, 22);
  rect(ctx, light, x + 7, y + 7, 6, 3);
  // Cornes
  rect(ctx, '#e8dcc0', x + 4, y, 3, 6);
  rect(ctx, '#e8dcc0', x + 25, y, 3, 6);
  // Yeux et gueule
  const glow = Math.floor(t * 6) % 2 ? '#ffe14d' : '#ffb020';
  rect(ctx, C.black, x + 9, y + 11, 5, 4);
  rect(ctx, C.black, x + 18, y + 11, 5, 4);
  rect(ctx, glow, x + 10, y + 12, 3, 2);
  rect(ctx, glow, x + 19, y + 12, 3, 2);
  rect(ctx, C.black, x + 10, y + 19, 12, 3);
  rect(ctx, '#ffffff', x + 11, y + 19, 2, 2);
  rect(ctx, '#ffffff', x + 19, y + 19, 2, 2);
  // Bras
  rect(ctx, dark, x - 2, y + 12 + bob, 5, 9);
  rect(ctx, dark, x + 29, y + 12 - bob, 5, 9);
}

const ENEMY_DRAW = { slime, bat, knight, boss };

function puff(ctx, cx, cy, k) {
  const r = 2 + k * 6;
  ctx.fillStyle = `rgba(255,255,255,${1 - k * 0.7})`;
  for (let i = 0; i < 4; i++) {
    const a = i * Math.PI / 2 + k * 2;
    ctx.fillRect(Math.round(cx + Math.cos(a) * r) - 2, Math.round(cy + Math.sin(a) * r) - 2, 4, 4);
  }
}

export function drawEnemy(ctx, e, t) {
  if (e.spawn > 0) {
    puff(ctx, e.x + e.size / 2, e.y + e.size / 2, 1 - e.spawn / 0.5);
    return;
  }
  const flash = e.invuln > 0 && Math.floor(t * 24) % 2 === 0;
  ENEMY_DRAW[e.type](ctx, e, t, flash);
}

// ---------- Projectiles, objets, effets ----------

export function drawProjectile(ctx, pr, t) {
  const x = Math.round(pr.x), y = Math.round(pr.y);
  if (pr.kind === 'rock') {
    rect(ctx, C.rockDark, x - 3, y - 2, 6, 4);
    rect(ctx, C.rockDark, x - 2, y - 3, 4, 6);
    rect(ctx, C.rockLight, x - 2, y - 2, 2, 2);
  } else if (pr.kind === 'fire') {
    const hot = Math.floor(t * 20) % 2;
    rect(ctx, hot ? '#ff7a1a' : '#ffcf3a', x - 3, y - 3, 6, 6);
    rect(ctx, hot ? '#ffe680' : '#ff5a1a', x - 1, y - 1, 2, 2);
  } else if (pr.kind === 'beam') {
    const col = ['#ffffff', '#7fd9ff', '#ffe066', '#ff8fa3'][Math.floor(t * 20) % 4];
    if (pr.vx !== 0) {
      rect(ctx, col, x - 6, y - 1, 12, 3);
      rect(ctx, C.goldDark, pr.vx > 0 ? x - 7 : x + 5, y - 3, 2, 7);
    } else {
      rect(ctx, col, x - 1, y - 6, 3, 12);
      rect(ctx, C.goldDark, x - 3, pr.vy > 0 ? y - 7 : y + 5, 7, 2);
    }
  }
}

const HEART_SHAPE = ['.##.##.', '#######', '#######', '.#####.', '..###..', '...#...'];

function heartShape(ctx, x, y, fill, outline) {
  HEART_SHAPE.forEach((row, j) => {
    for (let i = 0; i < row.length; i++) if (row[i] === '#') rect(ctx, fill, x + i, y + j, 1, 1);
  });
  if (outline) rect(ctx, '#ffffff', x + 1, y + 1, 1, 1);
}

export function drawPickup(ctx, pk, t) {
  if (pk.life !== undefined && pk.life < 2 && Math.floor(t * 12) % 2) return;
  const x = Math.round(pk.x), y = Math.round(pk.y + Math.sin(t * 4 + pk.x) * 1);
  if (pk.kind === 'rupee' || pk.kind === 'rupee5') {
    const main = pk.kind === 'rupee' ? '#3ad35a' : '#3a8bff';
    const dark = pk.kind === 'rupee' ? '#1d8a35' : '#1d4fb0';
    rect(ctx, dark, x + 5, y + 2, 6, 12);
    rect(ctx, dark, x + 4, y + 4, 8, 8);
    rect(ctx, main, x + 6, y + 3, 4, 10);
    rect(ctx, main, x + 5, y + 5, 6, 6);
    rect(ctx, '#ffffff', x + 6, y + 4, 1, 3);
  } else if (pk.kind === 'heart') {
    heartShape(ctx, x + 4, y + 5, '#e83a4f', true);
  } else if (pk.kind === 'container') {
    rect(ctx, '#ffffff', x + 1, y + 2, 14, 12);
    rect(ctx, '#ffd84a', x + 2, y + 3, 12, 10);
    heartShape(ctx, x + 4, y + 5, '#e83a4f', true);
  } else if (pk.kind === 'fragment') {
    const glow = 0.35 + Math.sin(t * 5) * 0.2;
    ctx.fillStyle = `rgba(255,230,120,${glow})`;
    ctx.fillRect(x - 4, y - 4, 24, 24);
    for (let j = 0; j < 12; j++) {
      const half = Math.floor(j / 2);
      rect(ctx, j < 2 ? '#fff6c2' : C.gold, x + 8 - half - 1, y + 2 + j, half * 2 + 2, 1);
    }
    rect(ctx, C.goldDark, x + 2, y + 13, 14, 1);
  }
}

export function drawChest(ctx, c, r, opened) {
  const x = c * TILE, y = r * TILE;
  rect(ctx, 'rgba(0,0,0,0.25)', x + 1, y + 13, 15, 3);
  rect(ctx, '#4a2c12', x + 1, y + 3, 14, 12);
  rect(ctx, '#8b5a2b', x + 2, y + 4, 12, 10);
  rect(ctx, C.gold, x + 1, y + 7, 14, 2);
  if (opened) {
    rect(ctx, C.black, x + 2, y + 3, 12, 4);
  } else {
    rect(ctx, '#a8703a', x + 2, y + 4, 12, 3);
    rect(ctx, C.gold, x + 7, y + 7, 2, 4);
  }
}

export function drawEffect(ctx, fx) {
  const k = fx.t / fx.dur;
  if (fx.kind === 'puff') {
    puff(ctx, fx.x, fx.y, k);
  } else if (fx.kind === 'leaf') {
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2;
      rect(ctx, i % 2 ? C.bush : C.bushLight, Math.round(fx.x + Math.cos(a) * k * 10), Math.round(fx.y + Math.sin(a) * k * 10 - k * 4), 2, 2);
    }
  } else if (fx.kind === 'spark') {
    ctx.fillStyle = `rgba(255,255,200,${1 - k})`;
    ctx.fillRect(Math.round(fx.x) - 3, Math.round(fx.y), 7, 1);
    ctx.fillRect(Math.round(fx.x), Math.round(fx.y) - 3, 1, 7);
  } else if (fx.kind === 'boom') {
    for (let i = 0; i < 10; i++) {
      const a = (i / 10) * Math.PI * 2 + i;
      const d = k * (14 + (i % 3) * 6);
      rect(ctx, i % 2 ? '#ffcf3a' : '#ff6a1a', Math.round(fx.x + Math.cos(a) * d) - 2, Math.round(fx.y + Math.sin(a) * d) - 2, 4, 4);
    }
  }
}
