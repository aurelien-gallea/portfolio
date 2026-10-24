// Procedural mansion: a grid of rooms linked by a random spanning tree plus a few loops.
// Every room keeps a free walking ring along its walls, so props and pits can never cut a path.

import { MAP_W, MAP_H, WALL, ZOMBIE_TYPES } from './config';

export const COLS = 4;
export const ROWS = 3;
const ROOM_W = (MAP_W - WALL * 2) / COLS;
const ROOM_H = (MAP_H - WALL * 2) / ROWS;
const DOOR = 110;
const RING = 70;

const FLOOR_STYLES = [
  { style: 'wood', names: ['Salon', 'Bibliothèque', 'Bureau', 'Salle à manger'] },
  { style: 'tiles', names: ['Cuisine', 'Salle de bain', 'Laboratoire', 'Infirmerie'] },
  { style: 'concrete', names: ['Garage', 'Cave', 'Atelier', 'Chaufferie'] },
  { style: 'carpet', names: ['Chambre', 'Salle de jeux', 'Boudoir', 'Archives'] },
];

const rand = (min, max) => min + Math.random() * (max - min);
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
const shuffle = (arr) => {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
};

const roomId = (c, r) => r * COLS + c;

const makeRooms = () => {
  const usedNames = new Set();
  const rooms = [];
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      const x = WALL + c * ROOM_W;
      const y = WALL + r * ROOM_H;
      const theme = pick(FLOOR_STYLES);
      const name = theme.names.find(n => !usedNames.has(n)) || theme.names[0];
      usedNames.add(name);
      rooms.push({
        id: roomId(c, r), c, r, x, y, w: ROOM_W, h: ROOM_H,
        cx: x + ROOM_W / 2, cy: y + ROOM_H / 2,
        style: theme.style, name, links: [], tint: rand(-0.08, 0.08),
        light: { x: x + rand(110, ROOM_W - 110), y: y + rand(90, ROOM_H - 90) },
      });
    }
  }
  return rooms;
};

const neighbours = (room) => {
  const list = [];
  if (room.c > 0) list.push(roomId(room.c - 1, room.r));
  if (room.c < COLS - 1) list.push(roomId(room.c + 1, room.r));
  if (room.r > 0) list.push(roomId(room.c, room.r - 1));
  if (room.r < ROWS - 1) list.push(roomId(room.c, room.r + 1));
  return list;
};

const edgeKey = (a, b) => (a < b ? `${a}-${b}` : `${b}-${a}`);

// Randomised depth-first search gives a perfect maze; extra links add loops so the horde can flank
const carveConnections = (rooms, startId) => {
  const links = new Map();
  const visited = new Set([startId]);
  const stack = [startId];
  while (stack.length) {
    const current = stack[stack.length - 1];
    const options = neighbours(rooms[current]).filter(n => !visited.has(n));
    if (!options.length) { stack.pop(); continue; }
    const next = pick(options);
    links.set(edgeKey(current, next), Math.random() < 0.18 ? 'open' : 'door');
    visited.add(next);
    stack.push(next);
  }
  const extra = shuffle(rooms.flatMap(room => neighbours(room).filter(n => n > room.id).map(n => edgeKey(room.id, n))))
    .filter(k => !links.has(k))
    .slice(0, 3);
  extra.forEach(k => links.set(k, 'door'));

  links.forEach((_, key) => {
    const [a, b] = key.split('-').map(Number);
    rooms[a].links.push(b);
    rooms[b].links.push(a);
  });
  return links;
};

const buildWalls = (links) => {
  const walls = [
    { x: 0, y: 0, w: MAP_W, h: WALL },
    { x: 0, y: MAP_H - WALL, w: MAP_W, h: WALL },
    { x: 0, y: 0, w: WALL, h: MAP_H },
    { x: MAP_W - WALL, y: 0, w: WALL, h: MAP_H },
  ];
  const doorways = [];

  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      const x0 = WALL + c * ROOM_W;
      const y0 = WALL + r * ROOM_H;
      // Vertical wall on the right of the room
      if (c < COLS - 1) {
        const kind = links.get(edgeKey(roomId(c, r), roomId(c + 1, r)));
        const wx = x0 + ROOM_W - WALL / 2;
        if (!kind) {
          walls.push({ x: wx, y: y0, w: WALL, h: ROOM_H });
        } else if (kind === 'door') {
          const gy = y0 + rand(50, ROOM_H - 50 - DOOR);
          walls.push({ x: wx, y: y0, w: WALL, h: gy - y0 });
          walls.push({ x: wx, y: gy + DOOR, w: WALL, h: y0 + ROOM_H - gy - DOOR });
          doorways.push({ x: wx, y: gy, w: WALL, h: DOOR, vertical: true });
        }
      }
      // Horizontal wall below the room
      if (r < ROWS - 1) {
        const kind = links.get(edgeKey(roomId(c, r), roomId(c, r + 1)));
        const wy = y0 + ROOM_H - WALL / 2;
        if (!kind) {
          walls.push({ x: x0, y: wy, w: ROOM_W, h: WALL });
        } else if (kind === 'door') {
          const gx = x0 + rand(50, ROOM_W - 50 - DOOR);
          walls.push({ x: x0, y: wy, w: gx - x0, h: WALL });
          walls.push({ x: gx + DOOR, y: wy, w: x0 + ROOM_W - gx - DOOR, h: WALL });
          doorways.push({ x: gx, y: wy, w: DOOR, h: WALL, vertical: false });
        }
      }
    }
  }
  return { walls, doorways };
};

const graphDistances = (rooms, fromId) => {
  const dist = rooms.map(() => Infinity);
  dist[fromId] = 0;
  const queue = [fromId];
  while (queue.length) {
    const id = queue.shift();
    rooms[id].links.forEach(n => {
      if (dist[n] === Infinity) {
        dist[n] = dist[id] + 1;
        queue.push(n);
      }
    });
  }
  return dist;
};

const PROP_SHAPES = [
  { kind: 'crate', w: 36, h: 36 },
  { kind: 'crate', w: 72, h: 36 },
  { kind: 'table', w: 84, h: 46 },
  { kind: 'shelf', w: 110, h: 24 },
  { kind: 'shelf', w: 24, h: 100 },
  { kind: 'sofa', w: 90, h: 36 },
];

// Interior zone = room minus its walking ring
const interior = (room) => ({
  x: room.x + RING, y: room.y + RING, w: room.w - RING * 2, h: room.h - RING * 2,
});

const rectsOverlap = (a, b, pad = 0) =>
  a.x - pad < b.x + b.w && a.x + a.w + pad > b.x && a.y - pad < b.y + b.h && a.y + a.h + pad > b.y;

const circleRectGap = (x, y, r) => {
  const cx = Math.max(r.x, Math.min(x, r.x + r.w));
  const cy = Math.max(r.y, Math.min(y, r.y + r.h));
  return Math.hypot(x - cx, y - cy);
};

// Random point inside a room that keeps `clearance` from walls, props, pits and other occupied spots
export const randomFreePoint = (level, room, clearance = 30, occupied = [], zone = null) => {
  const area = zone || { x: room.x + 30, y: room.y + 30, w: room.w - 60, h: room.h - 60 };
  for (let attempt = 0; attempt < 60; attempt++) {
    const x = rand(area.x, area.x + area.w);
    const y = rand(area.y, area.y + area.h);
    if (level.solids.some(s => circleRectGap(x, y, s) < clearance)) continue;
    if (level.pits.some(p => Math.hypot(x - p.x, y - p.y) < p.radius + clearance + 10)) continue;
    if (occupied.some(o => Math.hypot(x - o.x, y - o.y) < (o.radius || 20) + clearance)) continue;
    return { x, y };
  }
  return null;
};

export const roomAt = (level, x, y) => {
  const c = Math.max(0, Math.min(COLS - 1, Math.floor((x - WALL) / ROOM_W)));
  const r = Math.max(0, Math.min(ROWS - 1, Math.floor((y - WALL) / ROOM_H)));
  return level.rooms[roomId(c, r)];
};

export const makeZombie = (type, x, y, speedMul, state = 'idle') => {
  const t = ZOMBIE_TYPES[type];
  return {
    type, x, y,
    radius: t.radius,
    hp: t.hp,
    maxHp: t.hp,
    speed: t.speed * speedMul * rand(0.85, 1.15),
    state,
    angle: Math.random() * Math.PI * 2,
    wanderAngle: Math.random() * Math.PI * 2,
    lastAttack: 0,
    lastGrowl: 0,
    nextSight: 0,
    hitFlash: 0,
    vx: 0,
    vy: 0,
    phase: Math.random() * 10,
  };
};

export const pickZombieType = (diff) => {
  const roll = Math.random();
  if (roll < diff.bruteRate) return 'brute';
  if (roll < diff.bruteRate + diff.runnerRate) return 'runner';
  return 'walker';
};

export const generateLevel = (diff) => {
  const rooms = makeRooms();
  const startRoom = rooms[roomId(0, ROWS - 1)];
  const links = carveConnections(rooms, startRoom.id);
  const { walls, doorways } = buildWalls(links);
  const fromStart = graphDistances(rooms, startRoom.id);

  // Key goes to the deepest room; the exit sits far from the key so the escape crosses the mansion
  const maxDepth = Math.max(...fromStart);
  const keyRoom = pick(rooms.filter(r => fromStart[r.id] === maxDepth));
  const fromKey = graphDistances(rooms, keyRoom.id);
  const outerRooms = rooms.filter(r =>
    r.id !== startRoom.id && r.id !== keyRoom.id && (r.c === 0 || r.r === 0 || r.c === COLS - 1 || r.r === ROWS - 1)
  );
  const exitScore = (r) => fromKey[r.id] + fromStart[r.id] * 0.5 + Math.random() * 0.4;
  const exitRoom = outerRooms.sort((a, b) => exitScore(b) - exitScore(a))[0];

  const sides = [];
  if (exitRoom.r === 0) sides.push('top');
  if (exitRoom.r === ROWS - 1) sides.push('bottom');
  if (exitRoom.c === 0) sides.push('left');
  if (exitRoom.c === COLS - 1) sides.push('right');
  const side = pick(sides);
  const exitDoor = { side, locked: true };
  if (side === 'top' || side === 'bottom') {
    Object.assign(exitDoor, { x: exitRoom.cx - 60, y: side === 'top' ? 0 : MAP_H - WALL - 4, w: 120, h: WALL + 4 });
  } else {
    Object.assign(exitDoor, { x: side === 'left' ? 0 : MAP_W - WALL - 4, y: exitRoom.cy - 60, w: WALL + 4, h: 120 });
  }
  startRoom.name = 'Point de départ';
  startRoom.style = 'concrete';

  // Props: never in the start room, always inside the interior zone
  const props = [];
  rooms.forEach(room => {
    if (room.id === startRoom.id) return;
    const zone = interior(room);
    const count = Math.floor(rand(1, 3.6));
    for (let i = 0; i < count; i++) {
      const shape = pick(PROP_SHAPES);
      for (let attempt = 0; attempt < 20; attempt++) {
        const prop = {
          kind: shape.kind, w: shape.w, h: shape.h,
          x: rand(zone.x, zone.x + zone.w - shape.w),
          y: rand(zone.y, zone.y + zone.h - shape.h),
        };
        if (props.some(p => rectsOverlap(p, prop, 40))) continue;
        props.push(prop);
        break;
      }
    }
  });

  const level = {
    rooms, walls, doorways, props, exitDoor,
    solids: [...walls, ...props],
    startRoom, keyRoom, exitRoom,
    pits: [], pickups: [], zombies: [],
    playerStart: { x: startRoom.cx, y: startRoom.cy },
  };

  // Key in the middle-ish of its room
  level.key = randomFreePoint(level, keyRoom, 40, [], interior(keyRoom)) || { x: keyRoom.cx, y: keyRoom.cy };

  // Pits: one per room at most while possible, never in the start room or its neighbours
  const pitRooms = shuffle(rooms.filter(r => fromStart[r.id] >= 2 || (fromStart[r.id] === 1 && Math.random() < 0.3)));
  for (let i = 0; i < diff.pits; i++) {
    const room = pitRooms[i % pitRooms.length];
    const spot = randomFreePoint(level, room, 34, [{ ...level.key, radius: 60 }], interior(room));
    if (spot) level.pits.push({ x: spot.x, y: spot.y, radius: Math.round(rand(22, 28)) });
  }

  // Loot: dead ends hide the shotgun and the best supplies, rewarding exploration
  const deadEnds = shuffle(rooms.filter(r => r.links.length === 1 && r.id !== startRoom.id && r.id !== keyRoom.id));
  const others = shuffle(rooms.filter(r => r.id !== startRoom.id && !deadEnds.includes(r)));
  const lootRooms = [...deadEnds, ...others];
  const occupied = [{ ...level.key, radius: 40 }];
  const place = (type, room, extra = {}) => {
    const spot = randomFreePoint(level, room, 26, occupied);
    if (!spot) return;
    const item = { type, x: spot.x, y: spot.y, radius: 14, collected: false, bob: Math.random() * 6, ...extra };
    occupied.push(item);
    level.pickups.push(item);
  };
  place('shotgun', lootRooms[0]);
  for (let i = 0; i < diff.ammoPickups; i++) place('ammo', lootRooms[(i + 1) % lootRooms.length], { amount: 12 });
  for (let i = 0; i < diff.medkits; i++) place('medkit', lootRooms[(i + 2 + diff.ammoPickups) % lootRooms.length], { amount: 35 });
  place('shells', lootRooms[(1 + diff.ammoPickups + diff.medkits) % lootRooms.length], { amount: 6 });

  // Zombies: deeper rooms are more crowded; the start room and its neighbours stay quiet
  const weighted = rooms.flatMap(r => Array(Math.max(0, fromStart[r.id] - 1)).fill(r));
  for (let i = 0; i < diff.zombies; i++) {
    const room = pick(weighted);
    const spot = randomFreePoint(level, room, 26, [...occupied, ...level.zombies, { ...level.playerStart, radius: 340 }]);
    if (!spot) continue;
    level.zombies.push(makeZombie(pickZombieType(diff), spot.x, spot.y, diff.zombieSpeed));
  }

  return level;
};
