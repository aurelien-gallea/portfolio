import React, { useEffect, useRef } from 'react';
import { sounds } from '../utils/audio';
import { MAP_W, MAP_H, DIFFICULTIES, ZOMBIE_TYPES, WEAPONS } from '../engine/config';
import { generateLevel, makeZombie, pickZombieType, randomFreePoint } from '../engine/level';
import { moveCircle, pointInRect, hasLineOfSight, rayLength, buildNavGrid, updateFlowField, flowDirection, pathDistance } from '../engine/physics';
import {
  buildStaticLayer, createDecalLayer, stampBlood,
  drawPit, drawPickup, drawKey, drawExitDoor, drawZombie, drawPlayer,
} from '../engine/render';

const WEAPON_ORDER = ['handgun', 'shotgun', 'knife'];

const GameCanvas = ({
  difficulty = 'normal',
  isPaused = false,
  onGameOver,
  onVictory,
  onHudUpdate,
  mobileMove,
  mobileFireTrigger,
  mobileReloadTrigger,
  mobileKnifeTrigger,
  mobileSwitchTrigger,
}) => {
  const canvasRef = useRef(null);
  const mobileMoveRef = useRef(mobileMove);
  const stateRef = useRef(null);
  const actionsRef = useRef({});

  // Always keep mobileMoveRef in sync with the latest mobileMove prop
  useEffect(() => {
    mobileMoveRef.current = mobileMove;
  }, [mobileMove]);

  // Sync isPaused prop to the engine & clear held keys on pause
  useEffect(() => {
    const s = stateRef.current;
    if (!s) return;
    s.isPaused = isPaused;
    if (isPaused) {
      s.keys = {};
      s.isFireHeld = false;
    }
  }, [isPaused]);

  // Mobile buttons arrive as incrementing counters
  useEffect(() => { if (mobileFireTrigger > 0) actionsRef.current.fire?.(true); }, [mobileFireTrigger]);
  useEffect(() => { if (mobileReloadTrigger > 0) actionsRef.current.reload?.(); }, [mobileReloadTrigger]);
  useEffect(() => { if (mobileKnifeTrigger > 0) actionsRef.current.knife?.(true); }, [mobileKnifeTrigger]);
  useEffect(() => { if (mobileSwitchTrigger > 0) actionsRef.current.cycle?.(1); }, [mobileSwitchTrigger]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    canvas.width = MAP_W;
    canvas.height = MAP_H;

    const diff = DIFFICULTIES[difficulty] || DIFFICULTIES.normal;
    const level = generateLevel(diff);
    const decal = createDecalLayer();

    const s = {
      level,
      nav: buildNavGrid(level.solids, level.pits),
      staticLayer: buildStaticLayer(level),
      decal,
      decalCtx: decal.getContext('2d'),
      player: {
        x: level.playerStart.x,
        y: level.playerStart.y,
        radius: 16,
        angle: -Math.PI / 4,
        hp: 100,
        maxHp: 100,
        invuln: 0,
        muzzle: 0,
        kx: 0,
        ky: 0,
        active: 'handgun',
        ammo: {
          handgun: { owned: true, mag: WEAPONS.handgun.magCapacity, reserve: diff.startReserve },
          shotgun: { owned: false, mag: 0, reserve: 0 },
        },
        reload: null,
        safeSpots: [],
      },
      zombies: level.zombies,
      pickups: level.pickups,
      pits: level.pits,
      bullets: [],
      particles: [],
      slashes: [],
      texts: [],
      keys: {},
      mouse: { x: 0, y: 0 },
      hasMouseMoved: false,
      isMobileControl: false,
      isFireHeld: false,
      hasKey: false,
      kills: 0,
      score: 0,
      shots: 0,
      hits: 0,
      clock: 0,
      lastShot: -9999,
      lastKnife: -9999,
      shake: 0,
      damageFlash: 0,
      banner: null,
      horde: { active: false, remaining: 0, nextSpawn: 0 },
      navTimer: 0,
      safeTimer: 0,
      hudTimer: 0,
      isEnded: false,
      isPaused,
      moving: false,
    };
    stateRef.current = s;
    updateFlowField(s.nav, s.player.x, s.player.y);

    const vignette = ctx.createRadialGradient(MAP_W / 2, MAP_H / 2, MAP_H * 0.45, MAP_W / 2, MAP_H / 2, MAP_W * 0.62);
    vignette.addColorStop(0, 'rgba(0,0,0,0)');
    vignette.addColorStop(1, 'rgba(0,0,0,0.55)');

    // ---------- Helpers ----------

    const showBanner = (title, sub, color, duration = 2.6) => {
      s.banner = { title, sub, color, life: duration, duration };
    };

    const floatText = (x, y, text, color = '#fde047', size = 14) => {
      s.texts.push({ x, y, text, color, size, life: 1 });
    };

    const burst = (x, y, count, color, speed = 3, size = 3, decay = 0.03) => {
      for (let i = 0; i < count; i++) {
        const a = Math.random() * Math.PI * 2;
        const v = Math.random() * speed;
        s.particles.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, life: 1, decay, size: size * (0.5 + Math.random()), color, friction: 0.9 });
      }
      if (s.particles.length > 500) s.particles.splice(0, s.particles.length - 500);
    };

    const weaponState = () => {
      const p = s.player;
      return WEAPON_ORDER.map(id => {
        const w = WEAPONS[id];
        const a = p.ammo[id];
        return {
          id, name: w.name, short: w.short, slot: w.slot,
          owned: id === 'knife' ? true : a.owned,
          mag: a ? a.mag : null,
          capacity: w.magCapacity || null,
          reserve: a ? a.reserve : null,
        };
      });
    };

    const emitHud = () => {
      const p = s.player;
      const reload = p.reload ? Math.min(1, (s.clock - p.reload.start) / p.reload.duration) : null;
      onHudUpdate({
        hp: Math.max(0, p.hp),
        maxHp: p.maxHp,
        active: p.active,
        weapons: weaponState(),
        reload,
        hasKey: s.hasKey,
        score: Math.round(s.score * diff.multiplier),
        kills: s.kills,
        multiplier: diff.multiplier,
        zombiesLeft: s.zombies.filter(z => !z.dead && z.falling === undefined).length + s.horde.remaining,
        hordeActive: s.horde.active,
        time: s.clock / 1000,
        muted: sounds.muted,
      });
    };

    const triggerEnd = (type) => {
      if (s.isEnded) return;
      s.isEnded = true;
      const isVictory = type === 'victory';
      const seconds = Math.round(s.clock / 1000);
      const killScore = s.score;
      const victoryBonus = isVictory ? 1000 : 0;
      const hpBonus = isVictory ? Math.max(0, Math.round(s.player.hp * 10)) : 0;
      const timeBonus = isVictory ? Math.max(0, (300 - seconds) * 5) : 0;
      const rawScore = killScore + victoryBonus + hpBonus + timeBonus;
      const finalScore = Math.round(rawScore * diff.multiplier);

      const prevHighScore = parseInt(localStorage.getItem('zombie_game_highscore') || '0', 10);
      const isNewRecord = finalScore > prevHighScore;
      if (isNewRecord) localStorage.setItem('zombie_game_highscore', finalScore.toString());

      const payload = {
        kills: s.kills,
        score: finalScore,
        rawScore,
        killScore,
        victoryBonus,
        hpBonus,
        timeBonus,
        time: seconds,
        accuracy: s.shots ? Math.round((s.hits / s.shots) * 100) : 0,
        multiplier: diff.multiplier,
        isNewRecord,
        highScore: Math.max(prevHighScore, finalScore),
      };
      emitHud();
      if (isVictory) {
        sounds.playVictory();
        onVictory(payload);
      } else {
        onGameOver(payload);
      }
    };

    const alertZombie = (z) => {
      if (z.state === 'chase') return;
      z.state = 'chase';
      z.alertTimer = 0.6;
    };

    // Noise travels along corridors (path distance), not through walls
    const makeNoise = (radius) => {
      s.zombies.forEach(z => {
        if (pathDistance(s.nav, z.x, z.y) < radius) alertZombie(z);
      });
    };

    const killZombie = (z, viaPit = false) => {
      z.dead = !viaPit;
      const type = ZOMBIE_TYPES[z.type];
      const points = type.score + (viaPit ? 50 : 0);
      s.kills++;
      s.score += points;
      floatText(z.x, z.y - 20, viaPit ? `+${Math.round(points * diff.multiplier)} CHUTE !` : `+${Math.round(points * diff.multiplier)}`, viaPit ? '#fb923c' : '#fde047');
      if (viaPit) {
        sounds.playFall();
      } else {
        sounds.playZombieDeath();
        stampBlood(s.decalCtx, z.x, z.y, z.radius / 12);
        burst(z.x, z.y, 18, '#b91c1c', 4, 3.5);
      }
    };

    const damageZombie = (z, damage, angle, knockback) => {
      if (z.dead || z.falling !== undefined) return;
      const type = ZOMBIE_TYPES[z.type];
      z.hp -= damage;
      z.hitFlash = 0.08;
      z.vx += Math.cos(angle) * knockback * type.knockback;
      z.vy += Math.sin(angle) * knockback * type.knockback;
      alertZombie(z);
      burst(z.x, z.y, 5, '#dc2626', 2.5, 3);
      if (z.hp <= 0) killZombie(z);
      else sounds.playZombieHit();
    };

    const hurtPlayer = (amount, fromX, fromY, knock = true) => {
      const p = s.player;
      if (p.invuln > 0 || s.isEnded) return;
      p.hp -= amount;
      p.invuln = 0.6;
      if (knock) {
        const a = Math.atan2(p.y - fromY, p.x - fromX);
        p.kx += Math.cos(a) * 7;
        p.ky += Math.sin(a) * 7;
      }
      s.shake = Math.max(s.shake, 9);
      s.damageFlash = 1;
      sounds.playHurt();
      floatText(p.x, p.y - 26, `-${Math.round(amount)}`, '#f87171', 16);
      stampBlood(s.decalCtx, p.x, p.y, 0.5, '30, 64, 175');
      if (p.hp <= 0) triggerEnd('gameover');
      emitHud();
    };

    const cancelReload = () => { s.player.reload = null; };

    const startReload = () => {
      const p = s.player;
      if (s.isEnded || s.isPaused || p.reload || p.active === 'knife') return;
      const a = p.ammo[p.active];
      const w = WEAPONS[p.active];
      if (a.reserve <= 0 || a.mag >= w.magCapacity) return;
      p.reload = { weapon: p.active, start: s.clock, duration: w.reloadTime };
      sounds.playReload();
      emitHud();
    };

    const finishReload = () => {
      const p = s.player;
      const a = p.ammo[p.reload.weapon];
      const w = WEAPONS[p.reload.weapon];
      const moved = Math.min(w.magCapacity - a.mag, a.reserve);
      a.mag += moved;
      a.reserve -= moved;
      p.reload = null;
      sounds.playReloadDone();
      emitHud();
    };

    const switchWeapon = (id) => {
      const p = s.player;
      if (s.isEnded || p.active === id) return;
      if (id !== 'knife' && !p.ammo[id].owned) {
        floatText(p.x, p.y - 30, 'Arme non trouvée', '#a8a29e', 12);
        return;
      }
      cancelReload();
      p.active = id;
      emitHud();
    };

    const cycleWeapon = (dir) => {
      const owned = WEAPON_ORDER.filter(id => id === 'knife' || s.player.ammo[id].owned);
      const i = owned.indexOf(s.player.active);
      switchWeapon(owned[(i + dir + owned.length) % owned.length]);
    };

    // Touch & keyboard-only players get a gentle snap toward the nearest visible threat
    const aimAssist = () => {
      const p = s.player;
      let best = null;
      let bestScore = Infinity;
      s.zombies.forEach(z => {
        if (z.dead || z.falling !== undefined) return;
        const d = Math.hypot(z.x - p.x, z.y - p.y);
        if (d > 520) return;
        let diffA = Math.abs(Math.atan2(z.y - p.y, z.x - p.x) - p.angle);
        if (diffA > Math.PI) diffA = Math.PI * 2 - diffA;
        if (diffA > 0.75 && d > 200) return;
        if (!hasLineOfSight(p.x, p.y, z.x, z.y, s.level.solids)) return;
        const score = d + diffA * 300;
        if (score < bestScore) { bestScore = score; best = z; }
      });
      if (best) p.angle = Math.atan2(best.y - p.y, best.x - p.x);
    };

    const knifeSlash = (fromTouch = false) => {
      const p = s.player;
      if (s.isEnded || s.isPaused) return;
      const w = WEAPONS.knife;
      if (s.clock - s.lastKnife < w.cooldown) return;
      s.lastKnife = s.clock;
      if (fromTouch || !s.hasMouseMoved) aimAssist();
      sounds.playKnife();
      p.swing = 1;
      s.slashes.push({ x: p.x, y: p.y, angle: p.angle, life: 1 });
      s.zombies.forEach(z => {
        const d = Math.hypot(z.x - p.x, z.y - p.y);
        const za = Math.atan2(z.y - p.y, z.x - p.x);
        let diffA = Math.abs(p.angle - za);
        if (diffA > Math.PI) diffA = Math.PI * 2 - diffA;
        if ((d < w.reach + z.radius && diffA < w.arc) || d < p.radius + z.radius + 8) {
          damageZombie(z, w.damage, za, w.knockback);
        }
      });
      burst(p.x + Math.cos(p.angle) * 35, p.y + Math.sin(p.angle) * 35, 4, '#e2e8f0', 2, 2);
    };

    const fire = (fromTouch = false) => {
      const p = s.player;
      if (s.isEnded || s.isPaused) return;
      if (p.active === 'knife') { knifeSlash(fromTouch); return; }
      const w = WEAPONS[p.active];
      const a = p.ammo[p.active];
      if (s.clock - s.lastShot < w.cooldown || p.reload) return;
      s.lastShot = s.clock;

      if (a.mag <= 0) {
        if (a.reserve > 0) startReload();
        else {
          sounds.playEmptyClick();
          floatText(p.x, p.y - 30, 'Plus de munitions !', '#f87171', 12);
        }
        return;
      }

      if (fromTouch || !s.hasMouseMoved || s.isMobileControl) aimAssist();
      a.mag--;
      s.shots++;
      sounds[w.sound]();
      p.muzzle = 0.06;
      s.shake = Math.max(s.shake, p.active === 'shotgun' ? 7 : 2.5);

      const mx = p.x + Math.cos(p.angle) * 26;
      const my = p.y + Math.sin(p.angle) * 26;
      for (let i = 0; i < w.pellets; i++) {
        const spread = (Math.random() - 0.5) * 2 * w.spread + (w.pellets > 1 ? ((i / (w.pellets - 1)) - 0.5) * w.spread * 2 : 0);
        const angle = p.angle + spread;
        const speed = w.bulletSpeed * (0.92 + Math.random() * 0.16);
        s.bullets.push({ x: mx, y: my, px: mx, py: my, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed, damage: w.damage, range: w.range, knockback: w.knockback, angle, shotId: s.shots });
      }

      // Ejected casing
      const side = p.angle + Math.PI / 2;
      s.particles.push({ x: p.x, y: p.y, vx: Math.cos(side) * 3, vy: Math.sin(side) * 3, life: 1, decay: 0.02, size: 2, color: p.active === 'shotgun' ? '#dc2626' : '#eab308', friction: 0.85 });

      makeNoise(w.noise);
      if (a.mag === 0 && a.reserve > 0) startReload();
      emitHud();
    };

    actionsRef.current = { fire, reload: startReload, knife: knifeSlash, cycle: cycleWeapon };

    const startHorde = () => {
      s.horde = { active: true, remaining: diff.horde, nextSpawn: s.clock + 2500 };
      s.zombies.forEach(alertZombie);
      sounds.playAlarm();
      s.shake = 12;
      showBanner('LA HORDE SE RÉVEILLE', 'Clé récupérée — foncez vers la sortie !', '#ef4444', 3.2);
    };

    const spawnHordeZombie = () => {
      const p = s.player;
      const rooms = s.level.rooms.filter(r =>
        r.id !== s.level.startRoom.id && Math.hypot(r.cx - p.x, r.cy - p.y) > 480
      );
      if (!rooms.length) return;
      const room = rooms[Math.floor(Math.random() * rooms.length)];
      const spot = randomFreePoint(s.level, room, 24, s.zombies);
      if (!spot) return;
      const z = makeZombie(pickZombieType(diff), spot.x, spot.y, diff.zombieSpeed, 'chase');
      s.zombies.push(z);
      burst(spot.x, spot.y, 16, '#7e22ce', 3, 4, 0.02);
      s.horde.remaining--;
    };

    // ---------- Input ----------

    const handleKeyDown = (e) => {
      const key = e.key.toLowerCase();
      s.keys[key] = true;
      if (s.isPaused) return;
      if (e.key === '1') switchWeapon('handgun');
      if (e.key === '2') switchWeapon('shotgun');
      if (e.key === '3') switchWeapon('knife');
      if (key === 'r') startReload();
      if (key === 'f' || key === 'e') knifeSlash();
      if (key === 'm') { sounds.setMuted(!sounds.muted); emitHud(); }
      if ((e.key === ' ' || e.code === 'Space') && !e.repeat) {
        e.preventDefault();
        fire();
      }
    };

    const handleKeyUp = (e) => {
      s.keys[e.key.toLowerCase()] = false;
    };

    // The canvas is letterboxed with object-fit: contain, so map the pointer into the drawn area
    const toCanvas = (clientX, clientY) => {
      const rect = canvas.getBoundingClientRect();
      const scale = Math.min(rect.width / MAP_W, rect.height / MAP_H);
      const ox = rect.left + (rect.width - MAP_W * scale) / 2;
      const oy = rect.top + (rect.height - MAP_H * scale) / 2;
      return { x: (clientX - ox) / scale, y: (clientY - oy) / scale };
    };

    const handleMouseMove = (e) => {
      // Ignore simulated mouse events from touch interfaces
      if (e.sourceCapabilities && e.sourceCapabilities.firesTouchEvents) return;
      s.hasMouseMoved = true;
      s.isMobileControl = false;
      s.mouse = toCanvas(e.clientX, e.clientY);
    };

    const handleMouseDown = (e) => {
      if (e.sourceCapabilities && e.sourceCapabilities.firesTouchEvents) return;
      if (e.button === 0) {
        s.isFireHeld = true;
        fire();
      } else if (e.button === 2) {
        knifeSlash();
      }
    };

    const handleMouseUp = (e) => {
      if (e.button === 0) s.isFireHeld = false;
    };

    const handleWheel = (e) => {
      e.preventDefault();
      cycleWeapon(e.deltaY > 0 ? 1 : -1);
    };

    const preventMenu = (e) => e.preventDefault();

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('mousedown', handleMouseDown);
    canvas.addEventListener('wheel', handleWheel, { passive: false });
    canvas.addEventListener('contextmenu', preventMenu);
    window.addEventListener('mouseup', handleMouseUp);

    // ---------- Simulation ----------

    const update = (f, dtSec) => {
      const p = s.player;
      const solids = s.level.solids;
      s.clock += dtSec * 1000;

      p.invuln = Math.max(0, p.invuln - dtSec);
      p.muzzle = Math.max(0, p.muzzle - dtSec);
      s.damageFlash = Math.max(0, s.damageFlash - dtSec * 2);
      if (p.reload && s.clock - p.reload.start >= p.reload.duration) finishReload();

      // Held mouse button: the pistol stays semi-automatic, the shotgun pumps on its own cooldown
      if (s.isFireHeld && p.active === 'shotgun') fire();

      // 1. PLAYER MOVEMENT
      let dx = 0;
      let dy = 0;
      if (s.keys['w'] || s.keys['z'] || s.keys['arrowup']) dy -= 1;
      if (s.keys['s'] || s.keys['arrowdown']) dy += 1;
      if (s.keys['a'] || s.keys['q'] || s.keys['arrowleft']) dx -= 1;
      if (s.keys['d'] || s.keys['arrowright']) dx += 1;
      const mm = mobileMoveRef.current;
      if (mm.x !== 0 || mm.y !== 0) {
        dx = mm.x;
        dy = mm.y;
      }
      s.moving = dx !== 0 || dy !== 0;
      if (s.moving) {
        const len = Math.hypot(dx, dy);
        const mag = Math.min(1, len);
        const speed = diff.playerSpeed * (p.reload ? 0.85 : 1) * mag * f;
        moveCircle(p, (dx / len) * speed, (dy / len) * speed, p.radius, solids);
      }
      if (p.kx || p.ky) {
        moveCircle(p, p.kx * f, p.ky * f, p.radius, solids);
        p.kx *= Math.pow(0.8, f);
        p.ky *= Math.pow(0.8, f);
        if (Math.abs(p.kx) + Math.abs(p.ky) < 0.05) { p.kx = 0; p.ky = 0; }
      }

      // Aim: stick direction on touch, cursor on desktop, movement for keyboard-only players
      if (mm.x !== 0 || mm.y !== 0) {
        s.isMobileControl = true;
        p.angle = Math.atan2(mm.y, mm.x);
      } else if (s.hasMouseMoved && !s.isMobileControl) {
        p.angle = Math.atan2(s.mouse.y - p.y, s.mouse.x - p.x);
      } else if (s.moving) {
        p.angle = Math.atan2(dy, dx);
      }

      // Remember safe ground to respawn after a fall
      s.safeTimer -= dtSec;
      if (s.safeTimer <= 0) {
        s.safeTimer = 0.25;
        if (s.pits.every(pit => Math.hypot(p.x - pit.x, p.y - pit.y) > pit.radius + 55)) {
          p.safeSpots.push({ x: p.x, y: p.y });
          if (p.safeSpots.length > 6) p.safeSpots.shift();
        }
      }

      s.navTimer -= dtSec;
      if (s.navTimer <= 0) {
        s.navTimer = 0.15;
        updateFlowField(s.nav, p.x, p.y);
      }

      // 2. BULLETS (sub-stepped so fast pellets never tunnel through zombies)
      s.bullets.forEach(b => {
        b.px = b.x;
        b.py = b.y;
        const steps = 3;
        for (let k = 0; k < steps && b.range > 0; k++) {
          b.x += (b.vx * f) / steps;
          b.y += (b.vy * f) / steps;
          b.range -= Math.hypot(b.vx, b.vy) * f / steps;
          if (solids.some(w => pointInRect(b.x, b.y, w))) {
            b.range = 0;
            burst(b.x, b.y, 4, '#fde68a', 2, 2, 0.08);
            break;
          }
          const z = s.zombies.find(zz => !zz.dead && zz.falling === undefined && Math.hypot(zz.x - b.x, zz.y - b.y) < zz.radius + 2);
          if (z) {
            b.range = 0;
            if (b.shotId !== s.lastHitShot) { s.hits++; s.lastHitShot = b.shotId; }
            damageZombie(z, b.damage, b.angle, b.knockback);
          }
        }
      });
      s.bullets = s.bullets.filter(b => b.range > 0);

      // 3. ZOMBIES
      s.zombies.forEach(z => {
        z.hitFlash = Math.max(0, z.hitFlash - dtSec);
        z.alertTimer = Math.max(0, (z.alertTimer || 0) - dtSec);
        if (z.dead) return;
        if (z.falling !== undefined) {
          z.falling += dtSec * 1.6;
          return;
        }
        const type = ZOMBIE_TYPES[z.type];
        const toPlayer = Math.hypot(p.x - z.x, p.y - z.y);

        // Vision, refreshed a few times per second
        if (s.clock >= z.nextSight) {
          z.nextSight = s.clock + 150 + Math.random() * 100;
          z.sees = toPlayer < 420 && hasLineOfSight(z.x, z.y, p.x, p.y, solids);
          if (z.state !== 'chase' && (z.sees || toPlayer < 90)) alertZombie(z);
        }

        let mx = 0;
        let my = 0;
        if (z.state === 'chase') {
          let dir = null;
          if (!(z.sees && toPlayer < 260)) dir = flowDirection(s.nav, z.x, z.y);
          if (!dir) dir = { x: (p.x - z.x) / (toPlayer || 1), y: (p.y - z.y) / (toPlayer || 1) };
          mx = dir.x * z.speed;
          my = dir.y * z.speed;

          if (s.clock - z.lastGrowl > 4000 && Math.random() < 0.004) {
            sounds.playZombieGrowl();
            z.lastGrowl = s.clock;
          }

          if (toPlayer < p.radius + z.radius + 4 && s.clock - z.lastAttack > 800) {
            z.lastAttack = s.clock;
            hurtPlayer(diff.zombieDamage * type.damage, z.x, z.y);
          }
        } else {
          if (Math.random() < 0.01 * f) z.wanderAngle += (Math.random() - 0.5) * 2.5;
          mx = Math.cos(z.wanderAngle) * z.speed * 0.3;
          my = Math.sin(z.wanderAngle) * z.speed * 0.3;
        }

        const hit = moveCircle(z, (mx + z.vx) * f, (my + z.vy) * f, z.radius, solids);
        if (hit && z.state !== 'chase') z.wanderAngle = Math.random() * Math.PI * 2;
        z.vx *= Math.pow(0.82, f);
        z.vy *= Math.pow(0.82, f);

        const targetAngle = z.state === 'chase' ? Math.atan2(p.y - z.y, p.x - z.x) : Math.atan2(my, mx);
        let da = targetAngle - z.angle;
        while (da > Math.PI) da -= Math.PI * 2;
        while (da < -Math.PI) da += Math.PI * 2;
        z.angle += da * Math.min(1, 0.15 * f);

        // Zombies charging blindly can stumble into pits
        const pit = s.pits.find(pt => Math.hypot(z.x - pt.x, z.y - pt.y) < pt.radius - 4);
        if (pit) {
          z.falling = 0;
          z.x = pit.x;
          z.y = pit.y;
          killZombie(z, true);
        }
      });

      // Keep the horde from stacking into a single blob
      const live = s.zombies.filter(z => !z.dead && z.falling === undefined);
      for (let i = 0; i < live.length; i++) {
        for (let j = i + 1; j < live.length; j++) {
          const a = live[i];
          const b = live[j];
          const ddx = b.x - a.x;
          const ddy = b.y - a.y;
          const min = a.radius + b.radius;
          const d2 = ddx * ddx + ddy * ddy;
          if (d2 > 0 && d2 < min * min) {
            const d = Math.sqrt(d2);
            const push = (min - d) / 2;
            const wa = a.type === 'brute' ? 0.3 : 1;
            const wb = b.type === 'brute' ? 0.3 : 1;
            moveCircle(a, (-ddx / d) * push * wa, (-ddy / d) * push * wa, a.radius, solids);
            moveCircle(b, (ddx / d) * push * wb, (ddy / d) * push * wb, b.radius, solids);
          }
        }
      }
      // Zombies crowd around the player instead of overlapping them
      live.forEach(z => {
        const ddx = z.x - p.x;
        const ddy = z.y - p.y;
        const min = z.radius + p.radius;
        const d = Math.hypot(ddx, ddy);
        if (d > 0 && d < min) moveCircle(z, (ddx / d) * (min - d), (ddy / d) * (min - d), z.radius, solids);
      });
      s.zombies = s.zombies.filter(z => !z.dead && (z.falling === undefined || z.falling < 1));

      // 4. PITS (player)
      const pit = s.pits.find(pt => Math.hypot(p.x - pt.x, p.y - pt.y) < pt.radius + 2);
      if (pit && !s.isEnded) {
        const spot = p.safeSpots[0] || s.level.playerStart;
        burst(pit.x, pit.y, 14, '#78716c', 3, 3);
        sounds.playFall();
        p.x = spot.x;
        p.y = spot.y;
        p.kx = 0;
        p.ky = 0;
        p.safeSpots = [];
        p.invuln = 0;
        hurtPlayer(15, p.x, p.y, false);
        p.invuln = 1.2;
        floatText(p.x, p.y - 44, 'CHUTE !', '#fb923c', 14);
      }

      // 5. PICKUPS
      s.pickups.forEach(item => {
        if (item.collected || Math.hypot(p.x - item.x, p.y - item.y) > 30) return;
        const ammo = p.ammo;
        if (item.type === 'medkit') {
          if (p.hp >= p.maxHp) return;
          p.hp = Math.min(p.maxHp, p.hp + item.amount);
          floatText(item.x, item.y - 20, `+${item.amount} PV`, '#4ade80');
          sounds.playPickup();
        } else if (item.type === 'ammo') {
          if (ammo.handgun.reserve >= WEAPONS.handgun.maxReserve) return;
          ammo.handgun.reserve = Math.min(WEAPONS.handgun.maxReserve, ammo.handgun.reserve + item.amount);
          floatText(item.x, item.y - 20, `+${item.amount} balles`, '#fde047');
          sounds.playPickup();
        } else if (item.type === 'shells') {
          ammo.shotgun.reserve = Math.min(WEAPONS.shotgun.maxReserve, ammo.shotgun.reserve + item.amount);
          floatText(item.x, item.y - 20, `+${item.amount} cartouches`, '#fb923c');
          sounds.playPickup();
        } else if (item.type === 'shotgun') {
          ammo.shotgun.owned = true;
          ammo.shotgun.mag = WEAPONS.shotgun.magCapacity;
          ammo.shotgun.reserve += 12;
          cancelReload();
          p.active = 'shotgun';
          sounds.playWeaponPickup();
          showBanner('FUSIL À POMPE', 'Touche 2 ou molette pour changer d\'arme', '#fb923c', 2.4);
        }
        item.collected = true;
        burst(item.x, item.y, 10, '#fef9c3', 2.5, 2);
        emitHud();
      });

      // 6. KEY & HORDE
      if (!s.hasKey && Math.hypot(p.x - s.level.key.x, p.y - s.level.key.y) < 32) {
        s.hasKey = true;
        s.level.exitDoor.locked = false;
        sounds.playUnlock();
        burst(s.level.key.x, s.level.key.y, 24, '#fbbf24', 4, 3);
        startHorde();
        emitHud();
      }
      if (s.horde.active && s.horde.remaining > 0 && s.clock >= s.horde.nextSpawn) {
        spawnHordeZombie();
        s.horde.nextSpawn = s.clock + (difficulty === 'hard' ? 1800 : 2600);
      }

      // 7. EXIT
      const door = s.level.exitDoor;
      if (s.hasKey && Math.hypot(p.x - (door.x + door.w / 2), p.y - (door.y + door.h / 2)) < 50) {
        triggerEnd('victory');
      }
    };

    // ---------- Rendering ----------

    const render = (t) => {
      const p = s.player;
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.fillStyle = '#000';
      ctx.fillRect(0, 0, MAP_W, MAP_H);

      if (s.shake > 0.1) {
        ctx.translate((Math.random() - 0.5) * s.shake, (Math.random() - 0.5) * s.shake);
      }

      ctx.drawImage(s.staticLayer, 0, 0);
      ctx.drawImage(s.decal, 0, 0);

      s.pits.forEach(pit => drawPit(ctx, pit, t));
      drawExitDoor(ctx, s.level.exitDoor, t);
      s.pickups.forEach(item => { if (!item.collected) drawPickup(ctx, item, t); });
      if (!s.hasKey) drawKey(ctx, s.level.key, t);

      // Aiming laser (mouse players only)
      if (s.hasMouseMoved && !s.isMobileControl && p.active !== 'knife' && !s.isEnded) {
        const len = rayLength(p.x, p.y, p.angle, 260, s.level.solids);
        const grad = ctx.createLinearGradient(p.x, p.y, p.x + Math.cos(p.angle) * len, p.y + Math.sin(p.angle) * len);
        grad.addColorStop(0, 'rgba(248, 113, 113, 0.45)');
        grad.addColorStop(1, 'rgba(248, 113, 113, 0)');
        ctx.strokeStyle = grad;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(p.x + Math.cos(p.angle) * 26, p.y + Math.sin(p.angle) * 26);
        ctx.lineTo(p.x + Math.cos(p.angle) * len, p.y + Math.sin(p.angle) * len);
        ctx.stroke();
      }

      s.zombies.filter(z => z.falling !== undefined).forEach(z => drawZombie(ctx, z, t));
      s.zombies.filter(z => z.falling === undefined).forEach(z => drawZombie(ctx, z, t));

      s.slashes.forEach(slash => {
        ctx.save();
        ctx.translate(slash.x, slash.y);
        ctx.rotate(slash.angle);
        ctx.globalAlpha = Math.max(0, slash.life);
        ctx.strokeStyle = '#38bdf8';
        ctx.shadowColor = '#0ea5e9';
        ctx.shadowBlur = 15;
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.arc(0, 0, 55, -1.1, 1.1);
        ctx.stroke();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(0, 0, 51, -0.8, 0.8);
        ctx.stroke();
        ctx.restore();
      });

      drawPlayer(ctx, p, p.active, s.moving, t);

      // Reload ring around the player
      if (p.reload) {
        const k = Math.min(1, (s.clock - p.reload.start) / p.reload.duration);
        ctx.strokeStyle = 'rgba(56, 189, 248, 0.9)';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(p.x, p.y, 26, -Math.PI / 2, -Math.PI / 2 + k * Math.PI * 2);
        ctx.stroke();
      }

      // Objective arrow towards the exit once the key is in hand
      if (s.hasKey && !s.isEnded) {
        const door = s.level.exitDoor;
        const a = Math.atan2(door.y + door.h / 2 - p.y, door.x + door.w / 2 - p.x);
        const r = 42 + Math.sin(t * 0.008) * 4;
        ctx.save();
        ctx.translate(p.x + Math.cos(a) * r, p.y + Math.sin(a) * r);
        ctx.rotate(a);
        ctx.fillStyle = '#4ade80';
        ctx.shadowColor = '#22c55e';
        ctx.shadowBlur = 10;
        ctx.beginPath();
        ctx.moveTo(9, 0); ctx.lineTo(-5, -7); ctx.lineTo(-2, 0); ctx.lineTo(-5, 7);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
      }

      s.bullets.forEach(b => {
        ctx.strokeStyle = '#fef08a';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(b.px - b.vx * 0.8, b.py - b.vy * 0.8);
        ctx.lineTo(b.x, b.y);
        ctx.stroke();
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(b.x, b.y, 2.5, 0, Math.PI * 2);
        ctx.fill();
      });

      s.particles.forEach(pt => {
        ctx.globalAlpha = Math.max(0, pt.life);
        ctx.fillStyle = pt.color;
        ctx.fillRect(pt.x - pt.size / 2, pt.y - pt.size / 2, pt.size, pt.size);
      });
      ctx.globalAlpha = 1;

      s.texts.forEach(tx => {
        ctx.globalAlpha = Math.min(1, tx.life * 2);
        ctx.font = `bold ${tx.size}px monospace`;
        ctx.textAlign = 'center';
        ctx.lineWidth = 3;
        ctx.strokeStyle = 'rgba(0,0,0,0.8)';
        ctx.strokeText(tx.text, tx.x, tx.y);
        ctx.fillStyle = tx.color;
        ctx.fillText(tx.text, tx.x, tx.y);
      });
      ctx.globalAlpha = 1;

      // Screen-space overlays
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.fillStyle = vignette;
      ctx.fillRect(0, 0, MAP_W, MAP_H);

      const lowHp = p.hp / p.maxHp < 0.3 && !s.isEnded;
      const redness = Math.max(s.damageFlash * 0.5, lowHp ? 0.18 + Math.sin(t * 0.006) * 0.1 : 0);
      if (redness > 0.01) {
        const hurt = ctx.createRadialGradient(MAP_W / 2, MAP_H / 2, MAP_H * 0.3, MAP_W / 2, MAP_H / 2, MAP_W * 0.6);
        hurt.addColorStop(0, 'rgba(127, 29, 29, 0)');
        hurt.addColorStop(1, `rgba(185, 28, 28, ${redness})`);
        ctx.fillStyle = hurt;
        ctx.fillRect(0, 0, MAP_W, MAP_H);
      }

      if (s.banner) {
        const b = s.banner;
        const k = b.life / b.duration;
        const alpha = Math.min(1, b.life * 2, (1 - k) * 8);
        ctx.globalAlpha = alpha;
        ctx.fillStyle = 'rgba(0,0,0,0.65)';
        ctx.fillRect(0, 160, MAP_W, 110);
        ctx.fillStyle = b.color;
        ctx.fillRect(0, 160, MAP_W, 3);
        ctx.fillRect(0, 267, MAP_W, 3);
        ctx.font = '900 46px system-ui, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(b.title, MAP_W / 2, 220);
        ctx.fillStyle = '#e7e5e4';
        ctx.font = 'bold 18px monospace';
        ctx.fillText(b.sub, MAP_W / 2, 252);
        ctx.globalAlpha = 1;
      }

      // Custom crosshair
      if (s.hasMouseMoved && !s.isMobileControl && !s.isEnded) {
        const { x, y } = s.mouse;
        const gap = p.reload ? 9 : 6;
        ctx.strokeStyle = p.reload ? '#38bdf8' : '#fef2f2';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(x - gap - 8, y); ctx.lineTo(x - gap, y);
        ctx.moveTo(x + gap, y); ctx.lineTo(x + gap + 8, y);
        ctx.moveTo(x, y - gap - 8); ctx.lineTo(x, y - gap);
        ctx.moveTo(x, y + gap); ctx.lineTo(x, y + gap + 8);
        ctx.stroke();
        ctx.fillStyle = '#ef4444';
        ctx.fillRect(x - 1.5, y - 1.5, 3, 3);
      }
    };

    // Visual effects keep animating at the same pace whatever the refresh rate
    const updateEffects = (f, dtSec) => {
      s.shake = Math.max(0, s.shake * Math.pow(0.85, f));
      s.player.swing = Math.max(0, (s.player.swing || 0) - dtSec * 5);
      s.particles.forEach(pt => {
        pt.x += pt.vx * f;
        pt.y += pt.vy * f;
        pt.vx *= Math.pow(pt.friction, f);
        pt.vy *= Math.pow(pt.friction, f);
        pt.life -= pt.decay * f;
      });
      s.particles = s.particles.filter(pt => pt.life > 0);
      s.slashes.forEach(sl => { sl.life -= 0.1 * f; });
      s.slashes = s.slashes.filter(sl => sl.life > 0);
      s.texts.forEach(tx => { tx.y -= 0.6 * f; tx.life -= dtSec * 0.9; });
      s.texts = s.texts.filter(tx => tx.life > 0);
      if (s.banner) {
        s.banner.life -= dtSec;
        if (s.banner.life <= 0) s.banner = null;
      }
    };

    let animationFrameId;
    let last = performance.now();
    showBanner('TROUVEZ LA CLÉ', 'Explorez le manoir… sans réveiller tout le monde', '#fbbf24', 2.8);
    emitHud();

    const loop = (now) => {
      const elapsed = Math.min(50, now - last);
      last = now;
      const f = elapsed / (1000 / 60);
      const dtSec = elapsed / 1000;
      if (!s.isPaused) {
        if (!s.isEnded) update(f, dtSec);
        updateEffects(f, dtSec);
        s.hudTimer -= dtSec;
        if (s.hudTimer <= 0 && !s.isEnded) {
          s.hudTimer = 0.1;
          emitHud();
        }
      }
      render(now);
      animationFrameId = requestAnimationFrame(loop);
    };
    animationFrameId = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('mousemove', handleMouseMove);
      canvas.removeEventListener('mousedown', handleMouseDown);
      canvas.removeEventListener('wheel', handleWheel);
      canvas.removeEventListener('contextmenu', preventMenu);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [difficulty]);

  return (
    <div className="relative w-full h-full flex justify-center items-center overflow-hidden bg-black">
      <canvas
        ref={canvasRef}
        className="w-full h-full max-w-[1600px] max-h-[1000px] object-contain cursor-none"
      />
    </div>
  );
};

export default GameCanvas;
