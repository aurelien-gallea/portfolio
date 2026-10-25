// Pixel art des personnages, objets et effets ; le décor est dans tiles.js
import { TILE } from './world';
import { S, Pix, relief, ramp, rgb, refined, vnoise } from './pixel';

export { roomCanvas } from './tiles';

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

// Position arrondie au pixel d'écran (2 par unité de jeu)
const snap = v => Math.round(v * S) / S;

// Ombre douce posée au sol sous un personnage
function groundShadow(ctx, cx, cy, rx, ry, a = 0.3) {
  ctx.fillStyle = `rgba(16,26,30,${a})`;
  ctx.beginPath();
  ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
  ctx.fill();
}

// Dessine un sprite affiné (2x) à sa taille de jeu
function blit(ctx, img, x, y) {
  ctx.drawImage(img, x, y, img.width / S, img.height / S);
}

function rect(ctx, color, x, y, w = 1, h = 1) {
  ctx.fillStyle = color;
  ctx.fillRect(x, y, w, h);
}

// ---------- Héros ----------

// Sprites 16x16 dessinés pixel par pixel ('.' = transparent)
const HERO_PALETTE = {
  k: '#1a1426', // contour
  t: '#8a5a32', // chapeau
  T: '#5a3820', // chapeau ombré
  L: '#bb8650', // reflet du chapeau
  f: '#f6f2e8', // plume
  F: '#c8bca8', // plume ombrée
  h: '#3f8cff', // cheveux bleus
  H: '#2350c8', // cheveux ombrés
  s: '#ffd2a6', // peau
  S: '#e09a6c', // peau ombrée
  e: '#121a38', // yeux
  w: '#ffffff', // reflet des yeux
  a: '#b9c5d8', // armure
  A: '#6c7c98', // armure ombrée
  m: '#eef4fc', // reflet métal
  r: '#c8383c', // écharpe et tunique
  R: '#8a2026', // rouge ombré
  b: '#8a4f24', // cuir
  B: '#5a3214', // cuir foncé
  y: '#f6cf3a', // boucle dorée
  u: '#a9b8cf', // bouclier
  U: '#5d6d8a', // bouclier ombré
};

const BODY_FRONT = [
  '.kAAkrrrrrrkAAk.',
  '.kmakAammaAkamk.',
  '.kskbbbyybbbksk.',
  '..kkrRrrrrRrkk..',
  '...kBBbbbbBBk...',
];
const BODY_BACK = [
  '.kAAkrrrrrrkAAk.',
  '.kmakAaaaaAkamk.',
  '.kskbbbbbbbbksk.',
  '..kkrRrrrrRrkk..',
  '...kBBbbbbBBk...',
];
const FEET_A = ['..kBBk....kBBk..', '..kkkk....kkkk..'];
const FEET_B = ['...kBBk..kBBk...', '....kk....kk....'];

// Chapeau d'aventurier en feutre avec un ruban rouge et une plume plantée sur le côté, couchée vers l'arrière, mèches bleues sur les côtés
const HEAD_DOWN = [
  '....kkkkkkkk....',
  '...kLtttttttk...',
  '...kLLttttttTkkk',
  '..krrrrrrrrrrFfk',
  'kTttttttttttttTk',
  '.kTTTTTTTTTTTTk.',
  '.khHssssssssHhk.',
  '.kHswesssswesHk.',
  '..kSsesssssesk..',
  '...kkSssssSkk...',
  '.....kkkkkk.....',
];
const HEAD_UP = [
  '....kkkkkkkk....',
  '...kLtttttttk...',
  'kkkkLLttttttTk..',
  'kfFrrrrrrrrrrk..',
  'kTttttttttttttTk',
  '.kTTTTTTTTTTTTk.',
  '.khhhhhhhhhhhhk.',
  '.kShHhhhhhhHhSk.',
  '..kHhHhhhhHhHk..',
  '...kkSssssSkk...',
  '.....kkkkkk.....',
];
const HEAD_SIDE = [
  '.....kkkkkkk....',
  'kk..kLttttttk...',
  'kffkkLLtttttTk..',
  '.kFffFrrrrrrrk..',
  '.kTttttttttttttk',
  '..kTTTTTTTTTTTk.',
  '..khhHhsssssssk.',
  '..kHhhSsssswesk.',
  '...kHSssssssesk.',
  '....kkSsssSkk...',
  '......kkkkkk....',
];
const BODY_SIDE = [
  '.....krrrrrk....',
  '....kmaaaAak....',
  '....kbbbbybbk...',
  '....kRrrrrrRk...',
  '....kBBbbBBk....',
];
const FEET_SIDE_A = ['...kBBk..kBBk...', '...kkkk..kkkk...'];
const FEET_SIDE_B = ['.....kBBkBBk....', '.....kkkkkkk....'];

// Petit bouclier rond en acier
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
  const x = snap(p.x), y = snap(p.y);
  groundShadow(ctx, x + 8, y + 15, 6, 2);
  if (p.invuln > 0 && Math.floor(t * 20) % 2 === 0) return;
  const swinging = p.attack > 0 && p.swing !== undefined;
  // Lame pointée vers le haut : elle passe derrière le héros
  const behind = swinging && Math.sin(p.swing) < -0.3;
  if (behind) drawSwing(ctx, p, x, y);
  blit(ctx, refined(48, 48, c => heroLo(c, { ...p, x: 16, y: 16, attack: 0 }, t)), x - 16, y - 16);
  if (swinging && !behind) drawSwing(ctx, p, x, y);
}

function swordLo(ctx) {
  rect(ctx, HERO_PALETTE.k, 0, 6, 4, 4);
  rect(ctx, HERO_PALETTE.b, 1, 7, 2, 2);
  rect(ctx, HERO_PALETTE.k, 3, 4, 3, 8);
  rect(ctx, HERO_PALETTE.y, 4, 5, 1, 6);
  rect(ctx, HERO_PALETTE.k, 6, 6, 9, 4);
  rect(ctx, HERO_PALETTE.k, 15, 7, 1, 2);
  rect(ctx, C.blade, 6, 7, 9, 2);
  rect(ctx, '#ffffff', 6, 7, 7, 1);
}

// Traînée du coup puis lame orientée selon l'angle courant
function drawSwing(ctx, p, x, y) {
  const cx = x + 8, cy = y + 10;
  const a0 = Math.min(p.swingFrom, p.swing), a1 = Math.max(p.swingFrom, p.swing);
  const fade = Math.min(1, p.attack / 0.12);
  if (a1 - a0 > 0.05) {
    ctx.fillStyle = `rgba(255,255,255,${0.42 * fade})`;
    ctx.beginPath();
    ctx.arc(cx, cy, 17, a0, a1);
    ctx.arc(cx, cy, 9, a1, a0, true);
    ctx.fill();
    ctx.fillStyle = `rgba(190,235,255,${0.5 * fade})`;
    ctx.beginPath();
    // Bord d'attaque plus vif, juste derrière la lame (le coup tourne vers les angles décroissants)
    const lead = Math.min(a1, p.swing + 0.5);
    ctx.arc(cx, cy, 17, p.swing, lead);
    ctx.arc(cx, cy, 14, lead, p.swing, true);
    ctx.fill();
  }
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(p.swing);
  blit(ctx, refined(16, 16, swordLo), 2, -8);
  ctx.restore();
}

function heroLo(ctx, p, t) {
  const { x, y } = p;
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
  const x = snap(e.x), y = snap(e.y), n = e.size;
  if (e.type === 'bat') groundShadow(ctx, x + 8, y + 17, 4, 1.5, 0.2);
  else groundShadow(ctx, x + n / 2, y + n - 1, n * 0.4, n / 8);
  if (e.type === 'slime') {
    blit(ctx, slimeHi(e.dir, Math.floor(t * 6) % 2, flash), x, y);
    return;
  }
  if (e.type === 'boss') {
    const bob = Math.floor(t * 4) % 2;
    blit(ctx, bossHi(bob, Math.floor(t * 6) % 2, flash), x - 4, y - 4 + bob * 0.5);
    return;
  }
  const pad = 4;
  const img = refined(n + pad * 2, n + pad * 2, c => ENEMY_DRAW[e.type](c, { ...e, x: pad, y: pad }, t, flash));
  blit(ctx, img, x - pad, y - pad);
}

// ---------- Ennemis modelés en relief ----------

const hiCache = new Map();
const cached = (key, make) => {
  if (!hiCache.has(key)) hiCache.set(key, make());
  return hiCache.get(key);
};
const FLASH_RAMP = ramp('#bfefff', 0.5);
const DIR_V = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] };

function eye(pix, cx, cy, dx, dy, pupil = [20, 16, 40]) {
  for (let y = -3; y <= 3; y++) {
    for (let x = -2; x <= 2; x++) {
      if ((x / 2.6) ** 2 + (y / 3.4) ** 2 > 1) continue;
      pix.set(cx + x, cy + y, y < -1 && x < 1 ? [255, 255, 255] : [228, 232, 245]);
    }
  }
  for (let y = 0; y < 3; y++) for (let x = 0; x < 2; x++) pix.set(cx + dx * 1.2 + x - 1, cy + dy * 1.5 + y - 1, pupil);
  pix.set(cx + dx * 1.2 - 1, cy + dy * 1.5 - 1, [255, 255, 255]);
}

// Slime : un dôme gélatineux qui s'écrase en marchant
function slimeHi(dir, frame, flash) {
  return cached(`slime${dir}${frame}${flash}`, () => {
    const pix = new Pix(32, 32);
    const body = flash ? FLASH_RAMP : ramp('#d8433b', 1.1);
    const rx = frame ? 14 : 13, ry = frame ? 11 : 12, cy = frame ? 19 : 18;
    const [dx, dy] = DIR_V[dir];
    // Museau, sous le corps quand il regarde vers le haut
    const snout = () => relief(pix, 16 + dx * 12 - 4, cy + dy * 9 - 4, 8, 8,
      (x, y) => { const d = (x - 3.5) ** 2 + (y - 3.5) ** 2; return d < 12 ? Math.sqrt(12 - d) : -1; },
      flash ? FLASH_RAMP : ramp('#a82a26'), { outline: rgb('#3f0c0b') });
    if (dir === 'up') snout();
    relief(pix, 0, 0, 32, 32, (x, y) => {
      const d = ((x - 16) / rx) ** 2 + ((y - cy) / ry) ** 2;
      if (d >= 1 || y > 30) return -1;
      return Math.sqrt(1 - d) * 11;
    }, body, { outline: rgb('#4a0f0e'), dither: 0.5 });
    // Reflet brillant
    for (const [x, y] of [[9, 10], [10, 10], [9, 11], [12, 9], [13, 9]]) pix.set(x, y + (cy - 18), [255, 236, 226]);
    if (dir !== 'up') {
      const ex = dx * 3;
      eye(pix, 12 + ex, cy - 3, dx, dy);
      eye(pix, 20 + ex, cy - 3, dx, dy);
      snout();
    }
    return pix.toCanvas();
  });
}

// Gardien : un golem de pierre violette aux yeux brûlants
function bossHi(bob, glow, flash) {
  return cached(`boss${bob}${glow}${flash}`, () => {
    const pix = new Pix(80, 80);
    const stone = flash ? FLASH_RAMP : ramp('#6d40a0', 1.1);
    const dark = rgb('#1e0f33');
    const ox = 8, oy = 8;
    // Bras puis jambes, derrière le corps
    for (const [ax, ay] of [[ox - 6, oy + 22 + bob * 2], [ox + 56, oy + 22 - bob * 2]]) {
      relief(pix, ax, ay, 14, 22, (x, y) => {
        const d = ((x - 6.5) / 6.5) ** 2 + ((y - 10.5) / 10.5) ** 2;
        return d < 1 ? Math.sqrt(1 - d) * 7 + vnoise(x / 3, y / 3, 3) * 2 : -1;
      }, stone, { outline: dark });
    }
    for (const [lx, ly] of [[ox + 10, oy + 48 + bob * 2], [ox + 38, oy + 50 - bob * 2]]) {
      relief(pix, lx, ly, 16, 14, (x, y) => (bevelBox(x, y, 16, 14, 4) * 1.4), stone, { outline: dark });
    }
    relief(pix, ox + 2, oy + 6, 60, 50, (x, y) => {
      const b = bevelBox(x, y, 60, 50, 12);
      return b < 0 ? -1 : b * 1.1 + Math.floor(vnoise(x / 6, y / 6, 21) * 4) * 1.2;
    }, stone, { outline: dark, dither: 0.5 });
    // Cornes
    for (const hx of [ox + 6, ox + 50]) {
      relief(pix, hx, oy - 6, 8, 16, (x, y) => {
        const w = 3.8 * (y / 16) + 0.5;
        const d = Math.abs(x - 3.5) / w;
        return d < 1 ? Math.sqrt(1 - d * d) * 4 : -1;
      }, ramp('#e8dcc0', 0.8), { outline: rgb('#4a3e2a') });
    }
    // Orbites creusées et yeux
    const fire = glow ? [255, 225, 77] : [255, 170, 32];
    for (const ex of [ox + 16, ox + 36]) {
      for (let y = 0; y < 10; y++) for (let x = 0; x < 12; x++) pix.set(ex + x, oy + 20 + y, y < 2 ? [26, 12, 40] : [12, 6, 20]);
      for (let y = 3; y < 8; y++) for (let x = 3; x < 9; x++) pix.set(ex + x, oy + 20 + y, (x + y) % 3 ? fire : [255, 250, 200]);
    }
    // Gueule et crocs
    for (let y = 0; y < 7; y++) for (let x = 0; x < 24; x++) pix.set(ox + 20 + x, oy + 38 + y, [14, 6, 22]);
    for (const tx of [ox + 22, ox + 38]) for (let y = 0; y < 4; y++) for (let x = 0; x < 4 - y; x++) pix.set(tx + x + y / 2, oy + 38 + y, [240, 236, 220]);
    return pix.toCanvas();
  });
}

function bevelBox(x, y, w, h, b) {
  if (x < 0 || y < 0 || x >= w || y >= h) return -1;
  const cx = Math.min(x, w - 1 - x), cy = Math.min(y, h - 1 - y);
  if (cx < b && cy < b && (b - cx) ** 2 + (b - cy) ** 2 > b * b) return -1;
  return Math.min(cx, cy, b);
}

// ---------- Projectiles, objets, effets ----------

// Petites sphères éclairées pour les projectiles
const orbs = {};
function orb(name, colors, outline) {
  if (!orbs[name]) {
    const pix = new Pix(14, 14);
    relief(pix, 0, 0, 14, 14, (x, y) => {
      const d2 = (x - 6.5) ** 2 + (y - 6.5) ** 2;
      return d2 < 42 ? Math.sqrt(42 - d2) : -1;
    }, colors, { outline: outline && rgb(outline) });
    orbs[name] = pix.toCanvas();
  }
  return orbs[name];
}

export function drawProjectile(ctx, pr, t) {
  const x = snap(pr.x), y = snap(pr.y);
  if (pr.kind === 'rock') {
    groundShadow(ctx, x + 1, y + 5, 3, 1, 0.25);
    blit(ctx, orb('rock', ramp('#8f7a66'), '#3a2e26'), x - 3.5, y - 3.5);
  } else if (pr.kind === 'fire') {
    const hot = Math.floor(t * 20) % 2;
    ctx.fillStyle = 'rgba(255,140,40,0.35)';
    ctx.beginPath();
    ctx.arc(x, y, 6, 0, Math.PI * 2);
    ctx.fill();
    blit(ctx, orb(hot ? 'fireA' : 'fireB', ramp(hot ? '#ff7a1a' : '#ffb030', 1.3), '#7a1a08'), x - 3.5, y - 3.5);
  } else if (pr.kind === 'beam') {
    const col = ['#ffffff', '#7fd9ff', '#ffe066', '#ff8fa3'][Math.floor(t * 20) % 4];
    ctx.fillStyle = 'rgba(180,230,255,0.3)';
    ctx.beginPath();
    ctx.arc(x, y, 7, 0, Math.PI * 2);
    ctx.fill();
    const dir = pr.vx > 0 ? 'right' : pr.vx < 0 ? 'left' : pr.vy > 0 ? 'down' : 'up';
    blit(ctx, refined(16, 16, c => beamLo(c, dir, col)), x - 8, y - 8);
  }
}

// Épée volante dessinée vers la droite puis tournée dans sa direction
function beamLo(ctx, dir, col) {
  const angle = { right: 0, down: Math.PI / 2, left: Math.PI, up: -Math.PI / 2 }[dir];
  ctx.translate(8, 8);
  ctx.rotate(angle);
  ctx.translate(-8, -8);
  rect(ctx, HERO_PALETTE.k, 2, 4, 3, 8);
  rect(ctx, HERO_PALETTE.y, 3, 5, 1, 6);
  rect(ctx, HERO_PALETTE.k, 5, 6, 10, 4);
  rect(ctx, HERO_PALETTE.k, 15, 7, 1, 2);
  rect(ctx, col, 5, 7, 10, 2);
  rect(ctx, '#ffffff', 5, 7, 8, 1);
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
  const x = snap(pk.x), y = snap(pk.y + Math.sin(t * 4 + pk.x) * 1);
  groundShadow(ctx, snap(pk.x) + 8, snap(pk.y) + 15, 4, 1.2, 0.22);
  if (pk.kind === 'fragment') {
    const glow = 0.3 + Math.sin(t * 5) * 0.15;
    const g = ctx.createRadialGradient(x + 8, y + 8, 1, x + 8, y + 8, 14);
    g.addColorStop(0, `rgba(255,240,150,${glow + 0.3})`);
    g.addColorStop(1, 'rgba(255,230,120,0)');
    ctx.fillStyle = g;
    ctx.fillRect(x - 6, y - 6, 28, 28);
  }
  blit(ctx, refined(16, 16, c => pickupLo(c, pk.kind)), x, y);
}

function pickupLo(ctx, kind) {
  const x = 0, y = 0;
  if (kind === 'rupee' || kind === 'rupee5') {
    const pk = { kind };
    const main = pk.kind === 'rupee' ? '#3ad35a' : '#3a8bff';
    const dark = pk.kind === 'rupee' ? '#1d8a35' : '#1d4fb0';
    rect(ctx, dark, x + 5, y + 2, 6, 12);
    rect(ctx, dark, x + 4, y + 4, 8, 8);
    rect(ctx, main, x + 6, y + 3, 4, 10);
    rect(ctx, main, x + 5, y + 5, 6, 6);
    rect(ctx, '#ffffff', x + 6, y + 4, 1, 3);
  } else if (kind === 'heart') {
    heartShape(ctx, x + 4, y + 5, '#e83a4f', true);
  } else if (kind === 'container') {
    rect(ctx, '#ffffff', x + 1, y + 2, 14, 12);
    rect(ctx, '#ffd84a', x + 2, y + 3, 12, 10);
    heartShape(ctx, x + 4, y + 5, '#e83a4f', true);
  } else if (kind === 'fragment') {
    for (let j = 0; j < 12; j++) {
      const half = Math.floor(j / 2);
      rect(ctx, j < 2 ? '#fff6c2' : C.gold, x + 8 - half - 1, y + 2 + j, half * 2 + 2, 1);
    }
    rect(ctx, C.goldDark, x + 2, y + 13, 14, 1);
  }
}

export function drawChest(ctx, c, r, opened) {
  groundShadow(ctx, c * TILE + 9, r * TILE + 15, 8, 2);
  blit(ctx, refined(16, 16, cx => chestLo(cx, opened)), c * TILE, r * TILE);
}

function chestLo(ctx, opened) {
  const x = 0, y = 0;
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
