// Monde du jeu : une grille 3x3 d'écrans en extérieur + le donjon de la montagne

export const TILE = 16;
export const COLS = 16;
export const ROWS = 11;
export const W = COLS * TILE;
export const H = ROWS * TILE;

// T arbre · R rocher · W eau · B buisson · G tombe · D porte verrouillée · # mur
export const SOLID = new Set(['T', 'R', 'W', 'B', 'G', 'D', '#']);

export const START_ROOM = '1,1';
export const START_POS = { x: 120, y: 112 };
export const CAVE_ROOM = 'cave';
export const CAVE_DOOR_ROOM = '2,0';
export const CAVE_ENTRY = { x: 120, y: 128 };
export const CAVE_EXIT = { x: 112, y: 32 };

// Le coffre apparaît quand le cimetière est nettoyé
export const CHEST = { room: '2,2', c: 8, r: 7 };
// Buisson qui cache un réceptacle de cœur
export const SECRET = { room: '0,0', c: 5, r: 4 };

const ROOMS = {
  '0,0': {
    name: 'Bois Murmurants',
    enemies: ['bat', 'bat', 'bat'],
    map: [
      'TTTTTTTTTTTTTTTT',
      'TT.T..T...T..TTT',
      'T....T....,..T.T',
      'T.T.....T......T',
      'T....B......T..T',
      'T..T....T......T',
      'T......T....B..T',
      'TT..T......T...T',
      'T.....T..T.....T',
      'TT.T.......T..TT',
      'TTTTTTTTTTTTTTTT',
    ],
  },
  '1,0': {
    name: 'Lac Miroir',
    enemies: ['slime', 'slime', 'bat'],
    map: [
      'TTTTTTTTTTTTTTTT',
      'T..............T',
      'T...WWWWWWW....T',
      'T..WWWWWWWWW...T',
      'T..WWWWWWWWW.,.T',
      'T...WWWWWWW....T',
      'T..............T',
      'T.B..,......B..T',
      'T......SS......T',
      'T......SS......T',
      'TTTTTTTTTTTTTTTT',
    ],
  },
  '2,0': {
    name: 'Contreforts',
    enemies: ['slime', 'slime', 'knight'],
    map: [
      'RRRRRRRRRRRRRRRR',
      'RRRRRRRDRRRRRRRR',
      'RR.....S.....RRR',
      'R......S......RR',
      'R..R...S...R...R',
      'R......S.......R',
      'R..............R',
      'RR....R....R...R',
      'R..............R',
      'RRR....SS....RRR',
      'RRRRRRRRRRRRRRRR',
    ],
  },
  '0,1': {
    name: 'Prairie de l\'Ouest',
    enemies: ['slime', 'slime', 'slime'],
    map: [
      'TTTTTTTTTTTTTTTT',
      'T..............T',
      'T.B.B.B........T',
      'T..........,...T',
      'T....TT........T',
      'T....TT....B...T',
      'T..............T',
      'T..,.....RR....T',
      'T.B.B.B........T',
      'T..............T',
      'TTTTTTTTTTTTTTTT',
    ],
  },
  '1,1': {
    name: 'Plaine du Départ',
    enemies: ['slime', 'slime'],
    map: [
      'TTTTTTTTTTTTTTTT',
      'T..............T',
      'T..B.......B...T',
      'T......,.......T',
      'T...RR....,....T',
      'T......SS......T',
      'T..,...SS..RR..T',
      'T......SS......T',
      'T..B.......B...T',
      'T..............T',
      'TTTTTTTTTTTTTTTT',
    ],
  },
  '2,1': {
    name: 'Plateau de l\'Est',
    enemies: ['slime', 'slime', 'bat'],
    map: [
      'TTTTTTTTTTTTTTTT',
      'T..............T',
      'T...,....R.....T',
      'T..RR..........T',
      'T.........B....T',
      'T.....SSSS.....T',
      'T..B......,..RRT',
      'T........R.....T',
      'T..,...........T',
      'T..............T',
      'TTTTTTTTTTTTTTTT',
    ],
  },
  '0,2': {
    name: 'Ruines Oubliées',
    enemies: ['knight', 'knight'],
    map: [
      'TTTTTTTTTTTTTTTT',
      'T..............T',
      'T.RR..RR..RR...T',
      'T..............T',
      'T.R..........R.T',
      'T....SSSSSS....T',
      'T.R..........R.T',
      'T..............T',
      'T.RR..RR..RR...T',
      'T..............T',
      'TTTTTTTTTTTTTTTT',
    ],
  },
  '1,2': {
    name: 'Plage du Sud',
    enemies: ['slime', 'slime'],
    map: [
      'TTTTTTTTTTTTTTTT',
      'T......SS......T',
      'T..B.......,...T',
      'T..............T',
      'TSSSSSSSSSSSSSST',
      'SSSSSSSSSSSSSSSS',
      'SSSSSSSSSSSSSSSS',
      'SSSSSSSSSSSSSSSS',
      'WWWWWWWWWWWWWWWW',
      'WWWWWWWWWWWWWWWW',
      'WWWWWWWWWWWWWWWW',
    ],
  },
  '2,2': {
    name: 'Vieux Cimetière',
    enemies: ['knight', 'knight', 'knight', 'bat'],
    map: [
      'TTTTTTTTTTTTTTTT',
      'T..............T',
      'T.G..G..G..G...T',
      'T..............T',
      'T.G..G..G..G...T',
      'T..............T',
      'T.G..G.....G...T',
      'T..............T',
      'T..............T',
      'T..............T',
      'TTTTTTTTTTTTTTTT',
    ],
  },
  cave: {
    name: 'Donjon de la Montagne',
    enemies: [],
    boss: true,
    map: [
      '################',
      '#FFFFFFFFFFFFFF#',
      '#FF#FFFFFFFF#FF#',
      '#FFFFFFFFFFFFFF#',
      '#FFFFFFFFFFFFFF#',
      '#FF#FFFFFFFF#FF#',
      '#FFFFFFFFFFFFFF#',
      '#FFFFFFFFFFFFFF#',
      '#FF#FFFFFFFF#FF#',
      '#FFFFFFEEFFFFFF#',
      '#######EE#######',
    ],
  },
};

// Ouvre le bord d'un écran là où un voisin existe (2 tuiles de profondeur)
function carve(tiles, cells, inner) {
  for (const [c, r] of cells) {
    const [ic, ir] = inner(c, r);
    const ground = SOLID.has(tiles[ir][ic]) ? '.' : tiles[ir][ic];
    if (SOLID.has(tiles[r][c])) tiles[r][c] = ground;
  }
}

export function createWorld() {
  const rooms = {};
  for (const [key, def] of Object.entries(ROOMS)) {
    rooms[key] = { key, ...def, tiles: def.map.map(row => row.split('')), canvas: null, dirty: true, neighbors: {} };
  }

  for (const room of Object.values(rooms)) {
    if (room.key === CAVE_ROOM) continue;
    const [x, y] = room.key.split(',').map(Number);
    const at = (dx, dy) => (rooms[`${x + dx},${y + dy}`] ? `${x + dx},${y + dy}` : null);
    room.neighbors = { up: at(0, -1), down: at(0, 1), left: at(-1, 0), right: at(1, 0) };

    const t = room.tiles;
    if (room.neighbors.up) carve(t, [[7, 0], [8, 0], [7, 1], [8, 1]], c => [c, 2]);
    if (room.neighbors.down) carve(t, [[7, 10], [8, 10], [7, 9], [8, 9]], c => [c, 8]);
    if (room.neighbors.left) carve(t, [[0, 4], [0, 5], [0, 6], [1, 4], [1, 5], [1, 6]], (c, r) => [2, r]);
    if (room.neighbors.right) carve(t, [[15, 4], [15, 5], [15, 6], [14, 4], [14, 5], [14, 6]], (c, r) => [13, r]);
  }
  return rooms;
}
