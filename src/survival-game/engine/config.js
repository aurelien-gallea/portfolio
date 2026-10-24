// Game tuning for Zombie Rules. Speeds are expressed in pixels per 60 FPS frame.

export const MAP_W = 1600;
export const MAP_H = 1000;
export const WALL = 20;

export const DIFFICULTIES = {
  easy: {
    label: 'Recrue',
    multiplier: 1.0,
    zombies: 8,
    runnerRate: 0.25,
    bruteRate: 0.05,
    spitterRate: 0.1,
    horde: 4,
    pits: 3,
    ammoPickups: 5,
    medkits: 3,
    startReserve: 48,
    zombieSpeed: 0.8,
    zombieDamage: 8,
    playerSpeed: 3.3,
    // Ceiling drops during the escape: first interval, fastest interval, seconds shaved off per second
    dropStart: 5.5,
    dropMin: 2.8,
    dropRamp: 0.05,
    maxZombies: 22,
  },
  normal: {
    label: 'Survivant',
    multiplier: 1.5,
    zombies: 14,
    runnerRate: 0.4,
    bruteRate: 0.12,
    spitterRate: 0.18,
    horde: 8,
    pits: 5,
    ammoPickups: 4,
    medkits: 2,
    startReserve: 36,
    zombieSpeed: 1.0,
    zombieDamage: 12,
    playerSpeed: 3.4,
    dropStart: 4,
    dropMin: 1.6,
    dropRamp: 0.07,
    maxZombies: 32,
  },
  hard: {
    label: 'Cauchemar',
    multiplier: 2.5,
    zombies: 22,
    runnerRate: 0.5,
    bruteRate: 0.18,
    spitterRate: 0.24,
    horde: 14,
    pits: 8,
    ammoPickups: 3,
    medkits: 2,
    startReserve: 18,
    zombieSpeed: 1.2,
    zombieDamage: 16,
    playerSpeed: 3.5,
    dropStart: 2.8,
    dropMin: 0.9,
    dropRamp: 0.08,
    maxZombies: 45,
  },
};

export const ZOMBIE_TYPES = {
  walker: { hp: 60, radius: 16, speed: 1.25, damage: 1, score: 100, knockback: 1, skin: '#4ade80', body: '#166534', arm: '#15803d' },
  runner: { hp: 35, radius: 14, speed: 2.6, damage: 0.7, score: 150, knockback: 1.3, skin: '#d9f99d', body: '#57534e', arm: '#78716c' },
  spitter: { hp: 45, radius: 15, speed: 1.15, damage: 0.6, score: 200, knockback: 1.1, skin: '#fef08a', body: '#713f12', arm: '#a16207' },
  brute: { hp: 480, radius: 26, speed: 1.0, damage: 3, score: 500, knockback: 0.08, skin: '#a78bfa', body: '#4c1d95', arm: '#5b21b6' },
};

export const WEAPONS = {
  handgun: {
    id: 'handgun', name: 'Pistolet 9mm', short: 'PISTOLET', slot: 1,
    magCapacity: 12, maxReserve: 96, damage: 34, pellets: 1, spread: 0.03,
    bulletSpeed: 17, range: 650, cooldown: 190, reloadTime: 1100, knockback: 3, noise: 420, sound: 'playHandgun',
  },
  shotgun: {
    id: 'shotgun', name: 'Fusil à pompe', short: 'POMPE', slot: 2,
    magCapacity: 6, maxReserve: 30, damage: 20, pellets: 7, spread: 0.11,
    bulletSpeed: 15, range: 360, cooldown: 650, reloadTime: 1600, knockback: 5, noise: 750, sound: 'playShotgun',
  },
  knife: {
    id: 'knife', name: 'Couteau', short: 'COUTEAU', slot: 3,
    damage: 60, cooldown: 380, reach: 70, arc: 1.2, knockback: 8, noise: 0, sound: 'playKnife',
  },
};

// Web spitter: keeps its distance and glues the player to the floor
export const SPIT = {
  minRange: 190,
  maxRange: 430,
  windup: 0.55,
  cooldown: 3.2,
  speed: 7.5,
  rootTime: 2,
  rootImmunity: 1,
  patchLife: 7,
  patchRadius: 34,
  patchSlow: 0.45,
};
