// Moteur du jeu : déplacements, combat à l'épée, ennemis, transitions d'écran
import {
  TILE, COLS, ROWS, W, H, SOLID, createWorld,
  START_ROOM, START_POS, CAVE_ROOM, CAVE_DOOR_ROOM, CAVE_ENTRY, CAVE_EXIT, CHEST, SECRET,
} from './world';
import { roomCanvas, drawHero, drawEnemy, drawProjectile, drawPickup, drawChest, drawEffect } from './render';
import { sfx } from './audio';
import { S } from './pixel';

const DIRV = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] };
const DIRS = Object.keys(DIRV);
const OPPOSITE = { up: 'down', down: 'up', left: 'right', right: 'left' };

const PLAYER_SPEED = 80;
const ATTACK_TIME = 0.26;
const SCROLL_TIME = 0.6;
const FADE_TIME = 0.8;

const ENEMY_TYPES = {
  slime: { hp: 1, dmg: 1, size: 16, speed: 30 },
  bat: { hp: 1, dmg: 1, size: 16, speed: 70 },
  knight: { hp: 2, dmg: 2, size: 16, speed: 32 },
  boss: { hp: 10, dmg: 2, size: 32, speed: 34 },
};

const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const overlap = (a, b) => a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
const playerBox = p => ({ x: p.x + 2, y: p.y + 6, w: 12, h: 10 });
const walkBox = e => ({ x: e.x + 2, y: e.y + 4, w: 12, h: 12 });
const hitBox = e => (e.size === 32 ? { x: e.x + 3, y: e.y + 3, w: 26, h: 27 } : { x: e.x + 2, y: e.y + 2, w: 12, h: 13 });
const centerOf = b => ({ x: b.x + b.w / 2, y: b.y + b.h / 2 });
const randomDir = () => DIRS[Math.floor(Math.random() * 4)];

function swordBox(p) {
  const { x, y } = p;
  switch (p.dir) {
    case 'up': return { x: x + 4, y: y - 10, w: 8, h: 14 };
    case 'down': return { x: x + 4, y: y + 12, w: 8, h: 14 };
    case 'left': return { x: x - 10, y: y + 6, w: 14, h: 8 };
    default: return { x: x + 12, y: y + 6, w: 14, h: 8 };
  }
}

export function createGame({ onHud, onMessage, onGameOver, onVictory }) {
  const s = {
    rooms: createWorld(),
    roomKey: START_ROOM,
    player: {
      x: START_POS.x, y: START_POS.y, dir: 'up', moving: false,
      hp: 6, maxHp: 6, invuln: 0, attack: 0, swingHits: null, kb: null,
      rupees: 0, hasKey: false,
    },
    enemies: [],
    projectiles: [],
    pickups: [],
    effects: [],
    transition: null,
    flags: { container: false, containerDropped: false, chestShown: false, chestOpened: false, bossDead: false, fragment: false },
    time: 0,
    clock: 0,
    dying: 0,
    over: false,
    doorMsg: 0,
    hudKey: '',
  };

  const room = () => s.rooms[s.roomKey];
  const message = text => onMessage?.(text);

  const chestVisible = r => s.flags.chestShown && r.key === CHEST.room;

  function solidAt(r, c, row) {
    if (chestVisible(r) && c === CHEST.c && row === CHEST.r) return true;
    return SOLID.has(r.tiles[row][c]);
  }

  // canExit : le joueur peut sortir de l'écran là où un voisin existe
  function blocked(r, box, canExit) {
    const c0 = Math.floor(box.x / TILE), c1 = Math.floor((box.x + box.w - 0.001) / TILE);
    const r0 = Math.floor(box.y / TILE), r1 = Math.floor((box.y + box.h - 0.001) / TILE);
    for (let row = r0; row <= r1; row++) {
      for (let c = c0; c <= c1; c++) {
        if (row < 0 || row >= ROWS || c < 0 || c >= COLS) {
          if (!canExit) return true;
          const side = row < 0 ? 'up' : row >= ROWS ? 'down' : c < 0 ? 'left' : 'right';
          if (!r.neighbors[side]) return true;
          // On ne passe que si l'écran voisin est libre au même endroit
          if (solidAt(s.rooms[r.neighbors[side]], (c + COLS) % COLS, (row + ROWS) % ROWS)) return true;
          continue;
        }
        if (solidAt(r, c, row)) return true;
      }
    }
    return false;
  }

  // Déplace sur un axe puis l'autre ; renvoie true si bloqué
  function move(ent, boxFn, dx, dy, canExit) {
    let hit = false;
    if (dx) {
      ent.x += dx;
      if (blocked(room(), boxFn(ent), canExit)) { ent.x -= dx; hit = true; }
    }
    if (dy) {
      ent.y += dy;
      if (blocked(room(), boxFn(ent), canExit)) { ent.y -= dy; hit = true; }
    }
    return hit;
  }

  function addEffect(kind, x, y, dur = 0.35) {
    s.effects.push({ kind, x, y, t: 0, dur });
  }

  function dropLoot(x, y) {
    const roll = Math.random();
    if (roll < 0.15) s.pickups.push({ kind: 'heart', x: x - 8, y: y - 8, life: 8 });
    else if (roll < 0.45) s.pickups.push({ kind: Math.random() < 0.15 ? 'rupee5' : 'rupee', x: x - 8, y: y - 8, life: 8 });
  }

  // ---------- Entrée dans un écran ----------

  function spawnEnemies() {
    const r = room();
    s.enemies = [];
    s.projectiles = [];
    s.pickups = [];
    s.effects = [];

    if (r.key === SECRET.room && s.flags.containerDropped && !s.flags.container) {
      s.pickups.push({ kind: 'container', x: SECRET.c * TILE, y: SECRET.r * TILE });
    }
    if (r.key === CAVE_ROOM) {
      if (!s.flags.bossDead) addEnemy('boss', 112, 32);
      else if (!s.flags.fragment) s.pickups.push({ kind: 'fragment', x: 120, y: 64 });
      return;
    }

    const pc = centerOf(playerBox(s.player));
    const spots = [];
    for (let row = 2; row <= 8; row++) {
      for (let c = 2; c <= 13; c++) {
        if (SOLID.has(r.tiles[row][c])) continue;
        if (r.key === CHEST.room && c === CHEST.c && row === CHEST.r) continue;
        const d = Math.hypot(c * TILE + 8 - pc.x, row * TILE + 8 - pc.y);
        if (d > 72) spots.push([c, row]);
      }
    }
    for (const type of r.enemies) {
      if (!spots.length) break;
      const [c, row] = spots.splice(Math.floor(Math.random() * spots.length), 1)[0];
      addEnemy(type, c * TILE, row * TILE);
    }
  }

  function addEnemy(type, x, y) {
    const def = ENEMY_TYPES[type];
    s.enemies.push({
      type, x, y, size: def.size, hp: def.hp, dmg: def.dmg, speed: def.speed,
      dir: randomDir(), state: 'walk', timer: 0.5 + Math.random(), invuln: 0, kb: null,
      spawn: 0.5, vx: 0, vy: 0, resting: false, charging: false, shot: 1.5,
    });
  }

  function startScroll(side) {
    const target = room().neighbors[side];
    if (!target) return;
    const [dx, dy] = DIRV[side];
    const p = s.player;
    const from = room();
    s.roomKey = target;
    s.enemies = [];
    s.projectiles = [];
    s.pickups = [];
    s.effects = [];
    const start = { x: p.x - dx * W, y: p.y - dy * H };
    const end = {
      x: dx > 0 ? 0 : dx < 0 ? W - 16 : start.x,
      y: dy > 0 ? 0 : dy < 0 ? H - 16 : start.y,
    };
    p.x = start.x;
    p.y = start.y;
    p.kb = null;
    s.transition = { type: 'scroll', dx, dy, t: 0, from, start, end };
  }

  function startFade(targetKey, pos, dir) {
    s.transition = { type: 'fade', t: 0, targetKey, pos, dir, swapped: false };
    sfx.play('door');
  }

  function updateTransition(dt) {
    const tr = s.transition;
    tr.t += dt;
    const p = s.player;
    if (tr.type === 'scroll') {
      const k = Math.min(1, tr.t / SCROLL_TIME);
      p.x = tr.start.x + (tr.end.x - tr.start.x) * k;
      p.y = tr.start.y + (tr.end.y - tr.start.y) * k;
      p.moving = true;
      if (k >= 1) {
        s.transition = null;
        spawnEnemies();
        message(room().name);
      }
    } else {
      if (!tr.swapped && tr.t >= FADE_TIME / 2) {
        tr.swapped = true;
        s.roomKey = tr.targetKey;
        p.x = tr.pos.x;
        p.y = tr.pos.y;
        p.dir = tr.dir;
        p.kb = null;
        spawnEnemies();
      }
      if (tr.t >= FADE_TIME) {
        s.transition = null;
        message(room().name);
      }
    }
  }

  // ---------- Joueur ----------

  function hurtPlayer(dmg, src) {
    const p = s.player;
    if (p.invuln > 0 || s.dying || s.over) return;
    p.hp = Math.max(0, p.hp - dmg);
    p.invuln = 1;
    p.attack = 0;
    const pc = centerOf(playerBox(p));
    const ddx = pc.x - src.x, ddy = pc.y - src.y;
    const kdir = Math.abs(ddx) > Math.abs(ddy) ? (ddx > 0 ? 'right' : 'left') : (ddy > 0 ? 'down' : 'up');
    p.kb = { dir: kdir, t: 0.18 };
    sfx.play('hurt');
    if (p.hp <= 0) {
      s.dying = 1.4;
      sfx.play('gameover');
    }
  }

  function startAttack() {
    const p = s.player;
    p.attack = ATTACK_TIME;
    p.swingHits = new Set();
    sfx.play('sword');
    if (p.hp === p.maxHp && !s.projectiles.some(pr => pr.kind === 'beam')) {
      const [dx, dy] = DIRV[p.dir];
      s.projectiles.push({ kind: 'beam', owner: 'player', x: p.x + 8 + dx * 10, y: p.y + 10 + dy * 10, vx: dx * 190, vy: dy * 190, dmg: 1 });
      sfx.play('beam');
    }
  }

  function cutBushes(box) {
    const r = room();
    const c0 = Math.floor(box.x / TILE), c1 = Math.floor((box.x + box.w - 0.001) / TILE);
    const r0 = Math.floor(box.y / TILE), r1 = Math.floor((box.y + box.h - 0.001) / TILE);
    for (let row = Math.max(0, r0); row <= Math.min(ROWS - 1, r1); row++) {
      for (let c = Math.max(0, c0); c <= Math.min(COLS - 1, c1); c++) {
        if (r.tiles[row][c] !== 'B') continue;
        r.tiles[row][c] = '.';
        r.dirty = true;
        addEffect('leaf', c * TILE + 8, row * TILE + 8, 0.4);
        sfx.play('cut');
        if (r.key === SECRET.room && c === SECRET.c && row === SECRET.r && !s.flags.container) {
          s.flags.containerDropped = true;
          s.pickups.push({ kind: 'container', x: c * TILE, y: row * TILE });
          sfx.play('secret');
          message('Un secret ! Un réceptacle de cœur était caché ici.');
        } else if (Math.random() < 0.25) {
          s.pickups.push({ kind: 'rupee', x: c * TILE, y: row * TILE, life: 8 });
        }
      }
    }
  }

  function hurtEnemy(e, dmg, dir) {
    if (e.invuln > 0 || e.spawn > 0) return;
    e.hp -= dmg;
    e.invuln = e.type === 'boss' ? 0.6 : 0.35;
    e.kb = { dir, t: e.type === 'boss' ? 0.05 : 0.15 };
    e.charging = false;
    if (e.hp > 0) {
      sfx.play('hit');
      return;
    }
    const c = centerOf(hitBox(e));
    s.enemies.splice(s.enemies.indexOf(e), 1);
    sfx.play('kill');
    if (e.type === 'boss') {
      addEffect('boom', c.x, c.y, 0.8);
      s.flags.bossDead = true;
      s.projectiles = s.projectiles.filter(pr => pr.owner === 'player');
      s.pickups.push({ kind: 'fragment', x: 120, y: 64 });
      sfx.play('secret');
      message('Le Gardien est vaincu ! L\'Éclat apparaît…');
      return;
    }
    addEffect('puff', c.x, c.y, 0.4);
    dropLoot(c.x, c.y);

    if (s.roomKey === CHEST.room && s.enemies.length === 0 && !s.flags.chestShown) {
      s.flags.chestShown = true;
      addEffect('puff', CHEST.c * TILE + 8, CHEST.r * TILE + 8, 0.5);
      sfx.play('secret');
      message('Le cimetière s\'apaise… un coffre apparaît !');
    }
  }

  function updatePlayer(dt, input) {
    const p = s.player;
    p.invuln = Math.max(0, p.invuln - dt);

    if (p.kb) {
      const [dx, dy] = DIRV[p.kb.dir];
      move(p, playerBox, dx * 170 * dt, dy * 170 * dt, false);
      p.kb.t -= dt;
      if (p.kb.t <= 0) p.kb = null;
      p.moving = false;
    } else if (p.attack > 0) {
      p.attack = Math.max(0, p.attack - dt);
      p.moving = false;
      if (p.attack < ATTACK_TIME - 0.03 && p.attack > 0.04) {
        const sb = swordBox(p);
        cutBushes(sb);
        for (const e of [...s.enemies]) {
          if (p.swingHits.has(e) || !overlap(sb, hitBox(e))) continue;
          p.swingHits.add(e);
          hurtEnemy(e, 1, p.dir);
        }
      }
    } else {
      // input.dirs : directions maintenues, la plus récente en dernier
      const dirs = input.dirs;
      const dx = (dirs.includes('right') ? 1 : 0) - (dirs.includes('left') ? 1 : 0);
      const dy = (dirs.includes('down') ? 1 : 0) - (dirs.includes('up') ? 1 : 0);
      if (dx || dy) {
        // En diagonale, on garde le regard actuel s'il fait partie du mouvement
        const active = dirs.filter(d => (DIRV[d][0] && DIRV[d][0] === dx) || (DIRV[d][1] && DIRV[d][1] === dy));
        if (!active.includes(p.dir) || !(dx && dy)) p.dir = active[active.length - 1];
        p.moving = true;
        const v = PLAYER_SPEED * dt;
        if (dx && dy) {
          move(p, playerBox, dx * v * Math.SQRT1_2, 0, true);
          move(p, playerBox, 0, dy * v * Math.SQRT1_2, true);
        } else if (dx) {
          // Alignement sur une grille de 8 px sur l'axe perpendiculaire (passages étroits)
          const off = Math.round(p.y / 8) * 8 - p.y;
          if (off) move(p, playerBox, 0, clamp(off, -v, v), true);
          move(p, playerBox, dx * v, 0, true);
        } else {
          const off = Math.round(p.x / 8) * 8 - p.x;
          if (off) move(p, playerBox, clamp(off, -v, v), 0, true);
          move(p, playerBox, 0, dy * v, true);
        }
        if (dy < 0) checkDoor('up');
      } else {
        p.moving = false;
      }
      if (input.attack) startAttack();
    }

    // Sortie d'écran
    if (s.roomKey !== CAVE_ROOM) {
      const cx = p.x + 8, cy = p.y + 10;
      if (cx > W) return startScroll('right');
      if (cx < 0) return startScroll('left');
      if (cy > H) return startScroll('down');
      if (cy < 0) return startScroll('up');
    }

    const tc = Math.floor((p.x + 8) / TILE), tr = Math.floor((p.y + 10) / TILE);
    const tile = room().tiles[tr]?.[tc];
    if (tile === 'C') return startFade(CAVE_ROOM, CAVE_ENTRY, 'up');
    if (tile === 'E' && tr === ROWS - 1) return startFade(CAVE_DOOR_ROOM, CAVE_EXIT, 'down');

    // Coffre
    if (chestVisible(room()) && !s.flags.chestOpened) {
      const cb = { x: CHEST.c * TILE - 2, y: CHEST.r * TILE - 2, w: TILE + 4, h: TILE + 4 };
      if (overlap(playerBox(p), cb)) {
        s.flags.chestOpened = true;
        p.hasKey = true;
        sfx.play('item');
        message('Tu obtiens la clé du donjon ! La porte est au nord-est, dans la montagne.');
      }
    }
  }

  function checkDoor(dir) {
    if (dir !== 'up') return;
    const p = s.player;
    const r = room();
    const box = playerBox(p);
    const row = Math.floor((box.y - 1) / TILE);
    const c = Math.floor((p.x + 8) / TILE);
    if (r.tiles[row]?.[c] !== 'D') return;
    if (p.hasKey) {
      r.tiles[row][c] = 'C';
      r.dirty = true;
      p.hasKey = false;
      sfx.play('door');
      message('La porte du donjon s\'ouvre…');
    } else if (s.clock - s.doorMsg > 3) {
      s.doorMsg = s.clock;
      message('Cette porte est verrouillée. Il faut trouver une clé.');
    }
  }

  // ---------- Ennemis ----------

  function updateEnemy(e, dt) {
    if (e.spawn > 0) {
      e.spawn -= dt;
      return;
    }
    e.invuln = Math.max(0, e.invuln - dt);
    if (e.kb) {
      const [dx, dy] = DIRV[e.kb.dir];
      if (e.type === 'bat') {
        e.x = clamp(e.x + dx * 160 * dt, 0, W - 16);
        e.y = clamp(e.y + dy * 160 * dt, 0, H - 16);
      } else if (e.type !== 'boss') {
        move(e, walkBox, dx * 160 * dt, dy * 160 * dt, false);
      }
      e.kb.t -= dt;
      if (e.kb.t <= 0) e.kb = null;
      return;
    }

    const p = s.player;
    const pc = centerOf(playerBox(p));
    const ec = centerOf(hitBox(e));
    e.timer -= dt;

    if (e.type === 'slime') {
      if (e.state === 'aim') {
        if (e.timer <= 0) {
          const [dx, dy] = DIRV[e.dir];
          s.projectiles.push({ kind: 'rock', owner: 'enemy', x: ec.x + dx * 8, y: ec.y + dy * 8, vx: dx * 110, vy: dy * 110, dmg: 1 });
          sfx.play('shoot');
          e.state = 'walk';
          e.timer = 1 + Math.random() * 1.5;
        }
        return;
      }
      const [dx, dy] = DIRV[e.dir];
      const hit = move(e, walkBox, dx * e.speed * dt, dy * e.speed * dt, false);
      if (hit || e.timer <= 0) {
        if (!hit && Math.random() < 0.4) {
          e.state = 'aim';
          e.timer = 0.45;
        } else {
          e.dir = Math.random() < 0.4 ? towards(ec, pc) : randomDir();
          e.timer = 0.8 + Math.random() * 1.5;
        }
      }
    } else if (e.type === 'knight') {
      if (!e.charging) {
        const ax = Math.abs(pc.x - ec.x) < 6, ay = Math.abs(pc.y - ec.y) < 6;
        if ((ax || ay) && Math.random() < 0.06) {
          e.dir = towards(ec, pc);
          e.charging = true;
          e.timer = 1.2;
        }
      }
      const [dx, dy] = DIRV[e.dir];
      const speed = e.charging ? 75 : e.speed;
      const hit = move(e, walkBox, dx * speed * dt, dy * speed * dt, false);
      if (hit || e.timer <= 0) {
        e.charging = false;
        e.dir = Math.random() < 0.5 ? towards(ec, pc) : randomDir();
        e.timer = 0.7 + Math.random() * 1.3;
      }
    } else if (e.type === 'bat') {
      if (e.timer <= 0) {
        if (!e.resting && Math.random() < 0.25) {
          e.resting = true;
          e.vx = 0;
          e.vy = 0;
          e.timer = 0.8;
        } else {
          e.resting = false;
          const toward = Math.random() < 0.35;
          const a = toward ? Math.atan2(pc.y - ec.y, pc.x - ec.x) : Math.random() * Math.PI * 2;
          e.vx = Math.cos(a) * e.speed;
          e.vy = Math.sin(a) * e.speed;
          e.timer = 0.4 + Math.random() * 0.8;
        }
      }
      e.x += e.vx * dt;
      e.y += e.vy * dt;
      if (e.x < 8 || e.x > W - 24) { e.vx = -e.vx; e.x = clamp(e.x, 8, W - 24); }
      if (e.y < 8 || e.y > H - 24) { e.vy = -e.vy; e.y = clamp(e.y, 8, H - 24); }
    } else if (e.type === 'boss') {
      if (!e.target || e.timer <= 0 || Math.hypot(e.target.x - e.x, e.target.y - e.y) < 4) {
        e.target = { x: 24 + Math.random() * (W - 80), y: 24 + Math.random() * (H - 96) };
        e.timer = 2 + Math.random() * 2;
      }
      const a = Math.atan2(e.target.y - e.y, e.target.x - e.x);
      const enraged = e.hp <= 4;
      e.x += Math.cos(a) * e.speed * (enraged ? 1.6 : 1) * dt;
      e.y += Math.sin(a) * e.speed * (enraged ? 1.6 : 1) * dt;
      e.shot -= dt;
      if (e.shot <= 0) {
        e.shot = enraged ? 1.5 : 2.3;
        const base = Math.atan2(pc.y - ec.y, pc.x - ec.x);
        const spread = enraged ? [-0.4, -0.2, 0, 0.2, 0.4] : [-0.25, 0, 0.25];
        for (const da of spread) {
          s.projectiles.push({ kind: 'fire', owner: 'enemy', x: ec.x, y: ec.y + 6, vx: Math.cos(base + da) * 95, vy: Math.sin(base + da) * 95, dmg: 2 });
        }
        sfx.play('shoot');
      }
    }
  }

  function towards(from, to) {
    const dx = to.x - from.x, dy = to.y - from.y;
    return Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : (dy > 0 ? 'down' : 'up');
  }

  // ---------- Projectiles et objets ----------

  function updateProjectiles(dt) {
    const p = s.player;
    const pb = playerBox(p);
    s.projectiles = s.projectiles.filter(pr => {
      pr.x += pr.vx * dt;
      pr.y += pr.vy * dt;
      if (pr.x < -8 || pr.x > W + 8 || pr.y < -8 || pr.y > H + 8) return false;
      const box = { x: pr.x - 3, y: pr.y - 3, w: 6, h: 6 };

      if (pr.owner === 'player') {
        const target = s.enemies.find(e => e.spawn <= 0 && overlap(box, hitBox(e)));
        if (target) {
          const dir = Math.abs(pr.vx) > Math.abs(pr.vy) ? (pr.vx > 0 ? 'right' : 'left') : (pr.vy > 0 ? 'down' : 'up');
          hurtEnemy(target, pr.dmg, dir);
          addEffect('spark', pr.x, pr.y, 0.25);
          return false;
        }
        return true;
      }

      const c = Math.floor(pr.x / TILE), r = Math.floor(pr.y / TILE);
      const tile = room().tiles[r]?.[c];
      if (pr.kind === 'rock' && tile && SOLID.has(tile) && tile !== 'W') {
        addEffect('spark', pr.x, pr.y, 0.2);
        return false;
      }
      if (overlap(box, pb)) {
        // Le bouclier bloque les pierres qui arrivent de face
        const from = Math.abs(pr.vx) > Math.abs(pr.vy) ? (pr.vx > 0 ? 'left' : 'right') : (pr.vy > 0 ? 'up' : 'down');
        if (pr.kind === 'rock' && p.attack <= 0 && p.dir === from) {
          sfx.play('block');
          addEffect('spark', pr.x, pr.y, 0.25);
          return false;
        }
        hurtPlayer(pr.dmg, { x: pr.x - pr.vx, y: pr.y - pr.vy });
        return false;
      }
      return true;
    });
  }

  function updatePickups(dt) {
    const p = s.player;
    const pb = playerBox(p);
    s.pickups = s.pickups.filter(pk => {
      if (pk.life !== undefined) {
        pk.life -= dt;
        if (pk.life <= 0) return false;
      }
      if (!overlap(pb, { x: pk.x + 3, y: pk.y + 3, w: 10, h: 10 })) return true;
      if (pk.kind === 'rupee') { p.rupees += 1; sfx.play('rupee'); }
      else if (pk.kind === 'rupee5') { p.rupees += 5; sfx.play('rupee'); }
      else if (pk.kind === 'heart') { p.hp = Math.min(p.maxHp, p.hp + 2); sfx.play('heart'); }
      else if (pk.kind === 'container') {
        s.flags.container = true;
        p.maxHp += 2;
        p.hp = p.maxHp;
        sfx.play('item');
        message('Réceptacle de cœur ! Ta vie maximale augmente.');
      } else if (pk.kind === 'fragment') {
        s.flags.fragment = true;
        s.over = true;
        sfx.play('victory');
        onVictory?.({ rupees: p.rupees, time: Math.floor(s.time), hearts: p.maxHp / 2 });
      }
      return false;
    });
  }

  function emitHud() {
    const p = s.player;
    const key = `${p.hp}|${p.maxHp}|${p.rupees}|${p.hasKey}|${s.roomKey}|${s.flags.chestOpened}`;
    if (key === s.hudKey) return;
    s.hudKey = key;
    onHud?.({ hp: p.hp, maxHp: p.maxHp, rupees: p.rupees, hasKey: p.hasKey, room: s.roomKey, zone: room().name });
  }

  // ---------- Boucle ----------

  function update(dt, input) {
    s.clock += dt;
    if (s.over) return;

    for (const fx of s.effects) fx.t += dt;
    s.effects = s.effects.filter(fx => fx.t < fx.dur);

    if (s.dying > 0) {
      s.dying -= dt;
      s.player.dir = DIRS[Math.floor(s.clock * 12) % 4];
      if (s.dying <= 0) {
        s.over = true;
        onGameOver?.({ rupees: s.player.rupees, time: Math.floor(s.time) });
      }
      emitHud();
      return;
    }

    s.time += dt;
    if (s.transition) {
      updateTransition(dt);
      emitHud();
      return;
    }

    updatePlayer(dt, input);
    if (s.transition) {
      emitHud();
      return;
    }
    for (const e of [...s.enemies]) updateEnemy(e, dt);
    updateProjectiles(dt);
    updatePickups(dt);

    const pb = playerBox(s.player);
    for (const e of s.enemies) {
      if (e.spawn > 0) continue;
      if (overlap(pb, hitBox(e))) hurtPlayer(e.dmg, centerOf(hitBox(e)));
    }
    emitHud();
  }

  function drawScene(ctx, r, ox, oy, withEntities) {
    ctx.drawImage(roomCanvas(r), ox, oy, W, H);
    if (chestVisible(r)) {
      ctx.save();
      ctx.translate(ox, oy);
      drawChest(ctx, CHEST.c, CHEST.r, s.flags.chestOpened);
      ctx.restore();
    }
    if (!withEntities) return;
    const t = s.clock;
    for (const pk of s.pickups) drawPickup(ctx, pk, t);
    // Tri par profondeur pour que les sprites se chevauchent correctement
    const sprites = [...s.enemies.map(e => ({ y: e.y + e.size, draw: () => drawEnemy(ctx, e, t) })),
      { y: s.player.y + 16, draw: () => drawHero(ctx, s.player, t) }];
    sprites.sort((a, b) => a.y - b.y).forEach(sp => sp.draw());
    for (const pr of s.projectiles) drawProjectile(ctx, pr, t);
    for (const fx of s.effects) drawEffect(ctx, fx);
  }

  function render(ctx) {
    // Le canvas est en double résolution : on dessine toujours en unités de jeu
    ctx.setTransform(S, 0, 0, S, 0, 0);
    ctx.imageSmoothingEnabled = false;
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, W, H);
    const tr = s.transition;

    if (tr && tr.type === 'scroll') {
      const k = Math.min(1, tr.t / SCROLL_TIME);
      const fx = Math.round(-tr.dx * W * k), fy = Math.round(-tr.dy * H * k);
      const tx = Math.round(tr.dx * W * (1 - k)), ty = Math.round(tr.dy * H * (1 - k));
      drawScene(ctx, tr.from, fx, fy, false);
      drawScene(ctx, room(), tx, ty, false);
      ctx.save();
      ctx.translate(tx, ty);
      drawHero(ctx, s.player, s.clock);
      ctx.restore();
      return;
    }

    drawScene(ctx, room(), 0, 0, true);

    if (tr && tr.type === 'fade') {
      const k = tr.t / FADE_TIME;
      ctx.fillStyle = `rgba(0,0,0,${k < 0.5 ? k * 2 : (1 - k) * 2})`;
      ctx.fillRect(0, 0, W, H);
    }
    if (s.dying > 0) {
      ctx.fillStyle = `rgba(140,0,0,${0.5 - s.dying * 0.3})`;
      ctx.fillRect(0, 0, W, H);
    }
  }

  return {
    update,
    render,
    start() {
      spawnEnemies();
      emitHud();
    },
  };
}
