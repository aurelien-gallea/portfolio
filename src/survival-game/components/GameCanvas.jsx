import React, { useEffect, useRef, useState } from 'react';
import { sounds } from '../utils/audio';

const GameCanvas = ({ 
  difficulty = 'normal', 
  isPaused = false,
  onGameOver, 
  onVictory, 
  onPlayerUpdate, 
  mobileMove, 
  mobileFireTrigger, 
  mobileReloadTrigger,
  mobileKnifeTrigger 
}) => {
  const canvasRef = useRef(null);
  const mobileMoveRef = useRef(mobileMove);

  // Always keep mobileMoveRef in sync with the latest mobileMove prop
  useEffect(() => {
    mobileMoveRef.current = mobileMove;
  }, [mobileMove]);

  // Map & Game State Ref (to avoid closure stale state in rAF)
  const stateRef = useRef({
    player: {
      x: 150,
      y: 850,
      radius: 16,
      angle: 0,
      hp: 100,
      maxHp: 100,
      activeWeaponIndex: 0,
      weapons: [
        { id: 'handgun', name: 'Pistolet 9mm', magAmmo: 12, magCapacity: 12, reserveAmmo: 36, maxReserve: 72, damage: 35, sound: 'playHandgun' }
      ]
    },
    keys: {},
    mouse: { x: 0, y: 0 },
    zombies: [],
    bullets: [],
    particles: [],
    slashes: [],
    pickups: [],
    pits: [],
    walls: [],
    exitDoor: { x: 1400, y: 850, width: 80, height: 20, locked: true },
    keyItem: { x: 1480, y: 220, width: 24, height: 24, collected: false },
    hasKey: false,
    kills: 0,
    timeElapsed: 0,
    isEnded: false,
    isPaused: false
  });

  // Sync isPaused prop to ref to avoid closure stale state & clear keys on pause
  useEffect(() => {
    stateRef.current.isPaused = isPaused;
    if (isPaused && stateRef.current) {
      stateRef.current.keys = {};
    }
  }, [isPaused]);

  // Handle Mobile Fire Trigger
  useEffect(() => {
    if (mobileFireTrigger > 0) shootWeapon();
  }, [mobileFireTrigger]);

  // Handle Mobile Reload Trigger
  useEffect(() => {
    if (mobileReloadTrigger > 0) reloadWeapon();
  }, [mobileReloadTrigger]);

  // Handle Mobile Knife Trigger
  useEffect(() => {
    if (mobileKnifeTrigger > 0) performKnifeSlash();
  }, [mobileKnifeTrigger]);

  const reloadWeapon = () => {
    const s = stateRef.current;
    if (s.isEnded || s.isPaused) return;
    const w = s.player.weapons[s.player.activeWeaponIndex];
    if (w.id === 'knife' || w.reserveAmmo <= 0 || w.magAmmo === w.magCapacity) return;

    const needed = w.magCapacity - w.magAmmo;
    const available = Math.min(needed, w.reserveAmmo);
    w.magAmmo += available;
    w.reserveAmmo -= available;
    sounds.playReload();
    onPlayerUpdate({ ...s.player });
  };

  const performKnifeSlash = () => {
    const s = stateRef.current;
    const now = Date.now();
    if (now - s.lastKnifeSlash < 300) return;
    s.lastKnifeSlash = now;

    sounds.playKnife();

    const px = s.player.x;
    const py = s.player.y;
    const angle = s.player.angle;

    // Add slash visual effect arc
    if (!s.slashes) s.slashes = [];
    s.slashes.push({
      x: px,
      y: py,
      angle: angle,
      life: 1.0
    });

    s.zombies.forEach(z => {
      const dx = z.x - px;
      const dy = z.y - py;
      const dist = Math.hypot(dx, dy);
      const zAngle = Math.atan2(dy, dx);
      let angleDiff = Math.abs(angle - zAngle);
      if (angleDiff > Math.PI) angleDiff = Math.PI * 2 - angleDiff;

      // Hit range: within 90px in 140deg cone, or touching distance (<45px)
      if ((dist < 90 && angleDiff < 1.25) || dist < 45) {
        z.hp -= 60;
        z.state = 'chase';
        createBloodParticles(z.x, z.y, 10);
        if (z.hp <= 0) {
          s.kills++;
        }
      }
    });

    createBloodParticles(px + Math.cos(angle) * 35, py + Math.sin(angle) * 35, 4, '#e2e8f0');
  };

  const shootWeapon = () => {
    const s = stateRef.current;
    if (s.isEnded || s.isPaused) return;
    const w = s.player.weapons[s.player.activeWeaponIndex];

    if (w.id === 'knife') {
      performKnifeSlash();
      return;
    }

    if (w.magAmmo <= 0) {
      sounds.playEmptyClick();
      return;
    }

    w.magAmmo--;
    sounds[w.sound]();
    onPlayerUpdate({ ...s.player });

    const px = s.player.x;
    const py = s.player.y;
    const angle = s.player.angle;

    if (w.id === 'handgun') {
      s.bullets.push({
        x: px + Math.cos(angle) * 20,
        y: py + Math.sin(angle) * 20,
        vx: Math.cos(angle) * 16,
        vy: Math.sin(angle) * 16,
        damage: w.damage,
        range: 600
      });
      alertZombiesInRadius(px, py, 400);
    } else if (w.id === 'shotgun') {
      // 5 Pellets spread
      for (let i = -2; i <= 2; i++) {
        const spreadAngle = angle + (i * 0.12);
        s.bullets.push({
          x: px + Math.cos(angle) * 20,
          y: py + Math.sin(angle) * 20,
          vx: Math.cos(spreadAngle) * 14,
          vy: Math.sin(spreadAngle) * 14,
          damage: w.damage,
          range: 350
        });
      }
      alertZombiesInRadius(px, py, 700); // Big noise!
    }
  };

  const alertZombiesInRadius = (x, y, radius) => {
    const s = stateRef.current;
    s.zombies.forEach(z => {
      const dist = Math.hypot(z.x - x, z.y - y);
      if (dist < radius) {
        z.state = 'chase';
      }
    });
  };

  const createBloodParticles = (x, y, count = 10, color = '#b91c1c') => {
    const s = stateRef.current;
    for (let i = 0; i < count; i++) {
      s.particles.push({
        x, y,
        vx: (Math.random() - 0.5) * 6,
        vy: (Math.random() - 0.5) * 6,
        life: 1.0,
        color
      });
    }
  };

  const triggerEnd = (type) => {
    const s = stateRef.current;
    if (s.isEnded) return;
    s.isEnded = true;

    const diffMultiplier = difficulty === 'hard' ? 2.5 : difficulty === 'easy' ? 1.0 : 1.5;
    const killScore = s.kills * 100;
    const isVictory = type === 'victory';
    const victoryBonus = isVictory ? 1000 : 0;
    const hpBonus = Math.max(0, Math.round(s.player.hp * 10));
    const rawScore = killScore + victoryBonus + hpBonus;
    const finalScore = Math.round(rawScore * diffMultiplier);

    const prevHighScore = parseInt(localStorage.getItem('zombie_game_highscore') || '0', 10);
    const isNewRecord = finalScore > prevHighScore;
    if (isNewRecord) {
      localStorage.setItem('zombie_game_highscore', finalScore.toString());
    }

    const payload = {
      kills: s.kills,
      score: finalScore,
      rawScore,
      killScore,
      victoryBonus,
      hpBonus,
      multiplier: diffMultiplier,
      isNewRecord,
      highScore: Math.max(prevHighScore, finalScore)
    };

    if (isVictory) {
      onVictory(payload);
    } else {
      onGameOver(payload);
    }
  };

  // Setup Map & Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    // Resize canvas
    canvas.width = 1600;
    canvas.height = 1000;

    const s = stateRef.current;

    // Reset Game State based on Difficulty
    const startingReserve = difficulty === 'hard' ? 12 : difficulty === 'easy' ? 48 : 36;
    const playerSpeed = difficulty === 'hard' ? 3.7 : difficulty === 'easy' ? 3.2 : 3.5;

    s.player.hp = 100;
    s.player.x = 150;
    s.player.y = 850;
    s.player.weapons[0].magAmmo = 12;
    s.player.weapons[0].reserveAmmo = startingReserve;
    s.playerSpeed = playerSpeed;
    s.hasKey = false;
    s.keyItem.collected = false;
    s.exitDoor.locked = true;
    s.kills = 0;
    s.isEnded = false;

    // Build Mansion Walls Procedurally (Random layout with guaranteed corridor gaps)
    const generateWalls = () => {
      const wList = [
        { x: 0, y: 0, w: 1600, h: 20 },
        { x: 0, y: 980, w: 1600, h: 20 },
        { x: 0, y: 0, w: 20, h: 1000 },
        { x: 1580, y: 0, w: 20, h: 1000 },
      ];

      // Random Vertical Partition Columns
      const columns = [350, 700, 1050, 1350];
      columns.forEach(colX => {
        const gapY = 180 + Math.floor(Math.random() * 400);
        const gapH = 220; // 220px open gap
        wList.push({ x: colX, y: 20, w: 20, h: gapY - 20 });
        wList.push({ x: colX, y: gapY + gapH, w: 20, h: 980 - (gapY + gapH) });
      });

      // Random Horizontal Dividers
      wList.push(
        { x: 20, y: 480, w: 220, h: 20 },
        { x: 370, y: 300 + Math.floor(Math.random() * 120), w: 180, h: 20 },
        { x: 720, y: 200 + Math.floor(Math.random() * 120), w: 200, h: 20 },
        { x: 720, y: 680 + Math.floor(Math.random() * 100), w: 200, h: 20 },
        { x: 1070, y: 450 + Math.floor(Math.random() * 120), w: 180, h: 20 }
      );

      return wList;
    };

    s.walls = generateWalls();

    // Random Exit Door Location (Pick 1 of 4 outer wall positions)
    const doorCandidates = [
      { x: 1350, y: 975, w: 120, h: 25, side: 'bottom', locked: true },
      { x: 1350, y: 0, w: 120, h: 25, side: 'top', locked: true },
      { x: 1575, y: 440, w: 25, h: 120, side: 'right', locked: true },
      { x: 740, y: 0, w: 120, h: 25, side: 'top', locked: true },
      { x: 180, y: 0, w: 120, h: 25, side: 'top', locked: true }
    ];
    s.exitDoor = doorCandidates[Math.floor(Math.random() * doorCandidates.length)];
    const isSafeFromWalls = (x, y, radius = 16, margin = 45) => {
      const safeR = radius + margin;
      return s.walls.every(w => (
        x + safeR < w.x ||
        x - safeR > w.x + w.w ||
        y + safeR < w.y ||
        y - safeR > w.y + w.h
      ));
    };

    // Random Key Location (Pick 1 of 4 candidate room locations)
    const keyCandidates = [
      { x: 1480, y: 220 },
      { x: 880, y: 150 },
      { x: 1200, y: 450 },
      { x: 520, y: 180 }
    ];
    const chosenKey = keyCandidates[Math.floor(Math.random() * keyCandidates.length)];
    s.keyItem.x = chosenKey.x;
    s.keyItem.y = chosenKey.y;
    s.keyItem.collected = false;

    // Spawn Pit Traps Procedurally (Easy: 3, Normal: 6, Hard: 10)
    const pitCount = difficulty === 'hard' ? 10 : difficulty === 'easy' ? 3 : 6;
    s.pits = [];
    for (let i = 0; i < pitCount; i++) {
      let px = 500, py = 500, safe = false, attempts = 0;
      while (!safe && attempts < 150) {
        attempts++;
        px = 150 + Math.random() * 1350;
        py = 100 + Math.random() * 800;
        if (Math.hypot(px - 150, py - 850) > 240 && Math.hypot(px - s.keyItem.x, py - s.keyItem.y) > 100 && isSafeFromWalls(px, py, 26, 45)) {
          safe = true;
        }
      }
      s.pits.push({ id: i + 1, x: px, y: py, radius: 24 + Math.floor(Math.random() * 4) });
    }

    // Spawn Pickups Procedurally
    s.pickups = [];
    for (let i = 0; i < 5; i++) {
      let px = 400, py = 400, safe = false, attempts = 0;
      while (!safe && attempts < 150) {
        attempts++;
        px = 150 + Math.random() * 1350;
        py = 100 + Math.random() * 800;
        if (Math.hypot(px - 150, py - 850) > 200 && isSafeFromWalls(px, py, 14, 40)) {
          safe = true;
        }
      }
      s.pickups.push({
        id: i + 1,
        type: i < 3 ? 'ammo_handgun' : 'medkit',
        x: px,
        y: py,
        amount: i < 3 ? 12 : 40
      });
    }

    // Spawn Zombies based on difficulty (Easy: 6, Normal: 12, Hard: 20)
    const zombieCount = difficulty === 'hard' ? 20 : difficulty === 'easy' ? 6 : 12;
    s.zombies = [];
    for (let i = 0; i < zombieCount; i++) {
      let zx = 500, zy = 200, safe = false;
      let attempts = 0;
      while (!safe && attempts < 150) {
        attempts++;
        zx = 250 + Math.random() * 1250;
        zy = 80 + Math.random() * 840;
        if (Math.hypot(zx - 150, zy - 850) > 280 && isSafeFromWalls(zx, zy, 16, 45)) {
          safe = true;
        }
      }

      // Zombie Speed by difficulty
      const zSpeed = difficulty === 'hard'
        ? (2.2 + Math.random() * 1.0)
        : difficulty === 'easy'
          ? (1.0 + Math.random() * 0.4)
          : (1.4 + Math.random() * 0.7);

      s.zombies.push({
        id: i,
        x: zx,
        y: zy,
        radius: 16,
        hp: 60,
        speed: zSpeed,
        state: 'patrol',
        patrolAngle: Math.random() * Math.PI * 2,
        lastGrowl: 0
      });
    }

    // Input Handlers
    const handleKeyDown = (e) => {
      s.keys[e.key.toLowerCase()] = true;

      if (e.key === '1') { s.player.activeWeaponIndex = 0; onPlayerUpdate({ ...s.player }); }
      if (e.key === '2') { s.player.activeWeaponIndex = 1; onPlayerUpdate({ ...s.player }); }
      if (e.key === '3') { s.player.activeWeaponIndex = 2; onPlayerUpdate({ ...s.player }); }
      if (e.key.toLowerCase() === 'r') reloadWeapon();
    };

    const handleKeyUp = (e) => {
      s.keys[e.key.toLowerCase()] = false;
    };

    const handleMouseMove = (e) => {
      const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;
      s.mouse.x = (e.clientX - rect.left) * scaleX;
      s.mouse.y = (e.clientY - rect.top) * scaleY;
    };

    const handleMouseDown = (e) => {
      if (e.button === 0) shootWeapon();
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('mousedown', handleMouseDown);

    let animationFrameId;

      // Main Game Engine Loop (60 FPS)
      const render = () => {
        const now = Date.now();
        let dx = 0;
        let dy = 0;
        if (!s.isEnded && !stateRef.current.isPaused) {
          // 1. UPDATE PLAYER
          const speed = s.playerSpeed || 3.5;

          if (s.keys['w'] || s.keys['z'] || s.keys['arrowup']) dy -= 1;
          if (s.keys['s'] || s.keys['arrowdown']) dy += 1;
          if (s.keys['a'] || s.keys['q'] || s.keys['arrowleft']) dx -= 1;
          if (s.keys['d'] || s.keys['arrowright']) dx += 1;

          const mm = mobileMoveRef.current;
          if (mm.x !== 0 || mm.y !== 0) {
            dx = mm.x;
            dy = mm.y;
          }

          if (dx !== 0 || dy !== 0) {
            const len = Math.hypot(dx, dy);
            const nx = s.player.x + (dx / len) * speed;
            const ny = s.player.y + (dy / len) * speed;

            // Wall collisions
            let canMoveX = true;
            let canMoveY = true;
            s.walls.forEach(w => {
              if (nx + s.player.radius > w.x && nx - s.player.radius < w.x + w.w &&
                  s.player.y + s.player.radius > w.y && s.player.y - s.player.radius < w.y + w.h) {
                canMoveX = false;
              }
              if (s.player.x + s.player.radius > w.x && s.player.x - s.player.radius < w.x + w.w &&
                  ny + s.player.radius > w.y && ny - s.player.radius < w.y + w.h) {
                canMoveY = false;
              }
            });

            if (canMoveX) s.player.x = nx;
            if (canMoveY) s.player.y = ny;
          }

          // Player Aim Angle
          // On mobile: always aim in movement direction (fire = shoot where you walk)
          // On desktop: aim toward mouse cursor
          if (mm.x !== 0 || mm.y !== 0) {
            s.player.angle = Math.atan2(mm.y, mm.x);
            s.player.lastMoveAngle = s.player.angle;
          } else if (dx !== 0 || dy !== 0) {
            s.player.angle = Math.atan2(dy, dx);
            s.player.lastMoveAngle = s.player.angle;
          } else {
            // Desktop mouse aim
            s.player.angle = Math.atan2(s.mouse.y - s.player.y, s.mouse.x - s.player.x);
          }

          // 2. UPDATE BULLETS
          s.bullets.forEach((b, idx) => {
            b.x += b.vx;
            b.y += b.vy;
            b.range -= Math.hypot(b.vx, b.vy);

            // Bullet wall collisions
            s.walls.forEach(w => {
              if (b.x > w.x && b.x < w.x + w.w && b.y > w.y && b.y < w.y + w.h) {
                b.range = 0;
              }
            });

            // Bullet zombie hit
            s.zombies.forEach(z => {
              if (Math.hypot(z.x - b.x, z.y - b.y) < z.radius) {
                z.hp -= b.damage;
                b.range = 0;
                createBloodParticles(z.x, z.y, 6);
                if (z.hp <= 0) {
                  s.kills++;
                  const diffMultiplier = difficulty === 'hard' ? 2.5 : difficulty === 'easy' ? 1.0 : 1.5;
                  const liveScore = Math.round((s.kills * 100) * diffMultiplier);
                  onPlayerUpdate({ ...s.player, score: liveScore, kills: s.kills, multiplier: diffMultiplier });
                }
              }
            });
          });
          s.bullets = s.bullets.filter(b => b.range > 0);

          // Remove Dead Zombies
          s.zombies = s.zombies.filter(z => z.hp > 0);

          // 3. UPDATE ZOMBIES & AI
          s.zombies.forEach(z => {
            const distToPlayer = Math.hypot(s.player.x - z.x, s.player.y - z.y);

            // Vision check
            if (distToPlayer < 350) z.state = 'chase';

            let zdx = 0;
            let zdy = 0;

            if (z.state === 'chase') {
              const zAngle = Math.atan2(s.player.y - z.y, s.player.x - z.x);
              zdx = Math.cos(zAngle) * z.speed;
              zdy = Math.sin(zAngle) * z.speed;

              // Sound growl
              if (now - z.lastGrowl > 5000 && Math.random() < 0.05) {
                sounds.playZombieGrowl();
                z.lastGrowl = now;
              }

              // Damage player on contact
              if (distToPlayer < s.player.radius + z.radius) {
                s.player.hp -= 0.5;
                const diffMultiplier = difficulty === 'hard' ? 2.5 : difficulty === 'easy' ? 1.0 : 1.5;
                const liveScore = Math.round((s.kills * 100) * diffMultiplier);
                onPlayerUpdate({ ...s.player, score: liveScore, kills: s.kills, multiplier: diffMultiplier });
                if (s.player.hp <= 0 && !s.isEnded) {
                  triggerEnd('gameover');
                }
              }
            } else {
              // Patrol random movement
              zdx = Math.cos(z.patrolAngle) * (z.speed * 0.3);
              zdy = Math.sin(z.patrolAngle) * (z.speed * 0.3);
              if (Math.random() < 0.02) z.patrolAngle = Math.random() * Math.PI * 2;
            }

            // Zombie Wall Collisions (Prevents zombies from walking through walls)
            const nzx = z.x + zdx;
            const nzy = z.y + zdy;
            let canZMoveX = true;
            let canZMoveY = true;

            s.walls.forEach(w => {
              if (nzx + z.radius > w.x && nzx - z.radius < w.x + w.w &&
                  z.y + z.radius > w.y && z.y - z.radius < w.y + w.h) {
                canZMoveX = false;
              }
              if (z.x + z.radius > w.x && z.x - z.radius < w.x + w.w &&
                  nzy + z.radius > w.y && nzy - z.radius < w.y + w.h) {
                canZMoveY = false;
              }
            });

            if (canZMoveX) z.x = nzx;
            if (canZMoveY) z.y = nzy;

            if (!canZMoveX || !canZMoveY) {
              if (z.state !== 'chase') {
                z.patrolAngle = Math.random() * Math.PI * 2;
              }
            }
          });

          // 4. PICKUPS & OBJECTIVES
          s.pickups.forEach(p => {
            if (!p.collected && Math.hypot(s.player.x - p.x, s.player.y - p.y) < 30) {
              p.collected = true;
              sounds.playPickup();
              if (p.type === 'ammo_handgun') {
                s.player.weapons[0].reserveAmmo = Math.min(s.player.weapons[0].maxReserve, s.player.weapons[0].reserveAmmo + p.amount);
              } else if (p.type === 'medkit') {
                s.player.hp = Math.min(s.player.maxHp, s.player.hp + p.amount);
              }
              onPlayerUpdate({ ...s.player });
            }
          });

          // Pit Traps Check (Teleport to start & -10 HP)
          s.pits.forEach(pit => {
            const dist = Math.hypot(s.player.x - pit.x, s.player.y - pit.y);
            if (dist < s.player.radius + pit.radius - 4) {
              s.player.hp = Math.max(0, s.player.hp - 10);
              const diffMultiplier = difficulty === 'hard' ? 2.5 : difficulty === 'easy' ? 1.0 : 1.5;
              const liveScore = Math.round((s.kills * 100) * diffMultiplier);
              onPlayerUpdate({ ...s.player, score: liveScore, kills: s.kills, multiplier: diffMultiplier });

              // Particles
              createBloodParticles(pit.x, pit.y, 14, '#ef4444');
              createBloodParticles(150, 850, 10, '#38bdf8');

              // Repop at start
              s.player.x = 150;
              s.player.y = 850;

              if (s.player.hp <= 0 && !s.isEnded) {
                triggerEnd('gameover');
              }
            }
          });

          // Key Pickup Check
          if (!s.keyItem.collected && Math.hypot(s.player.x - s.keyItem.x, s.player.y - s.keyItem.y) < 35) {
            s.keyItem.collected = true;
            s.hasKey = true;
            s.exitDoor.locked = false;
            sounds.playPickup();
          }

          // Exit Door Check (Victory)
          const doorCX = s.exitDoor.x + (s.exitDoor.w || 80) / 2;
          const doorCY = s.exitDoor.y + (s.exitDoor.h || 20) / 2;
          if (!s.isEnded && s.hasKey && Math.hypot(s.player.x - doorCX, s.player.y - doorCY) < 55) {
            triggerEnd('victory');
          }
        }

      // 5. RENDERING (NO DARKNESS FOG - FULL VISIBILITY)
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Floor tiles (Textured Wooden/Stone floor)
      ctx.fillStyle = '#1c1917';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Grid Lines
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.04)';
      ctx.lineWidth = 1;
      for (let x = 0; x < canvas.width; x += 50) {
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, canvas.height); ctx.stroke();
      }
      for (let y = 0; y < canvas.height; y += 50) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(canvas.width, y); ctx.stroke();
      }

      // Draw Persistent Blood Splatters
      s.particles.filter(p => p.life <= 0.1).forEach(p => {
        ctx.fillStyle = 'rgba(127, 29, 29, 0.6)';
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size || 4, 0, Math.PI * 2);
        ctx.fill();
      });

      // Draw Pit Holes / Traps
      s.pits.forEach(pit => {
        ctx.save();
        ctx.translate(pit.x, pit.y);

        // Danger aura
        ctx.strokeStyle = '#ef4444';
        ctx.lineWidth = 2.5;
        ctx.shadowColor = '#ef4444';
        ctx.shadowBlur = 10;
        ctx.beginPath();
        ctx.arc(0, 0, pit.radius + 3, 0, Math.PI * 2);
        ctx.stroke();

        // Dark Abyssal Void Hole
        ctx.fillStyle = '#050508';
        ctx.beginPath();
        ctx.arc(0, 0, pit.radius, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = '#7f1d1d';
        ctx.lineWidth = 3;
        ctx.stroke();

        // Hazard Label
        ctx.fillStyle = '#f87171';
        ctx.font = 'bold 9px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('PIÈGE', 0, 3);

        ctx.restore();
      });

      // Draw Pickups (Medkit with Green Cross & Ammo Boxes)
      s.pickups.filter(p => !p.collected).forEach(p => {
        ctx.save();
        ctx.translate(p.x, p.y);

        if (p.type === 'medkit') {
          // Green Medkit Box / Circle
          ctx.fillStyle = '#15803d';
          ctx.shadowColor = '#22c55e';
          ctx.shadowBlur = 15;
          ctx.beginPath();
          ctx.arc(0, 0, 14, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = '#4ade80';
          ctx.lineWidth = 2;
          ctx.stroke();

          // Green Cross (Croix Verte Medicale)
          ctx.fillStyle = '#ffffff';
          ctx.shadowBlur = 0;
          ctx.fillRect(-3, -8, 6, 16); // vertical
          ctx.fillRect(-8, -3, 16, 6); // horizontal

          // Label
          ctx.fillStyle = '#4ade80';
          ctx.font = 'bold 9px monospace';
          ctx.textAlign = 'center';
          ctx.fillText('+SOIN', 0, 24);
        } else {
          // Ammo Box with Bullet Icons
          ctx.fillStyle = '#854d0e';
          ctx.shadowColor = '#eab308';
          ctx.shadowBlur = 15;
          ctx.beginPath();
          ctx.arc(0, 0, 14, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = '#fde047';
          ctx.lineWidth = 2;
          ctx.stroke();

          // 2 Brass Bullet Cartridges Vector Icons
          ctx.shadowBlur = 0;

          // Bullet 1 (Left)
          // Casing (Brass)
          ctx.fillStyle = '#eab308';
          ctx.fillRect(-5, -2, 4, 10);
          // Tip (Pointed copper tip)
          ctx.fillStyle = '#f97316';
          ctx.beginPath();
          ctx.moveTo(-5, -2);
          ctx.lineTo(-3, -7);
          ctx.lineTo(-1, -2);
          ctx.fill();

          // Bullet 2 (Right)
          // Casing (Brass)
          ctx.fillStyle = '#eab308';
          ctx.fillRect(1, -2, 4, 10);
          // Tip (Pointed copper tip)
          ctx.fillStyle = '#f97316';
          ctx.beginPath();
          ctx.moveTo(1, -2);
          ctx.lineTo(3, -7);
          ctx.lineTo(5, -2);
          ctx.fill();

          // Shiny metallic highlights
          ctx.fillStyle = '#fef08a';
          ctx.fillRect(-4, -1, 1, 8);
          ctx.fillRect(2, -1, 1, 8);

          // Label
          ctx.fillStyle = '#fde047';
          ctx.font = 'bold 9px monospace';
          ctx.textAlign = 'center';
          ctx.fillText('+BALLES', 0, 24);
        }

        ctx.restore();
      });

      // Draw Key (Detailed Golden Key Sprite)
      if (!s.keyItem.collected) {
        ctx.save();
        ctx.translate(s.keyItem.x, s.keyItem.y);

        // Golden Glow
        ctx.shadowColor = '#fbbf24';
        ctx.shadowBlur = 18;

        // Key Ring (Head)
        ctx.strokeStyle = '#fbbf24';
        ctx.lineWidth = 3.5;
        ctx.beginPath();
        ctx.arc(-8, 0, 7, 0, Math.PI * 2);
        ctx.stroke();

        // Key Shaft
        ctx.fillStyle = '#fbbf24';
        ctx.fillRect(-3, -2.5, 18, 5);

        // Key Teeth
        ctx.fillRect(7, 2.5, 3.5, 6);
        ctx.fillRect(12, 2.5, 3.5, 5);

        // Shiny inner highlight
        ctx.fillStyle = '#fef08a';
        ctx.fillRect(-2, -1, 15, 2);

        // Label
        ctx.fillStyle = '#fbbf24';
        ctx.font = 'bold 10px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('CLÉ DE SORTIE', 0, 24);

        ctx.restore();
      }

      // Draw Exit Door (Highly Visible 3D Reinforced Door & Light Beacon)
      ctx.save();
      const door = s.exitDoor;
      const isLocked = door.locked;
      const dw = door.w || 80;
      const dh = door.h || 20;
      const dcx = door.x + dw / 2;
      const dcy = door.y + dh / 2;

      // 1. Directional Light Beam spill onto the floor
      const beamGrad = ctx.createRadialGradient(dcx, dcy, 10, dcx, dcy, 140);
      beamGrad.addColorStop(0, isLocked ? 'rgba(239, 68, 68, 0.45)' : 'rgba(34, 197, 94, 0.65)');
      beamGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = beamGrad;
      ctx.beginPath();
      ctx.arc(dcx, dcy, 140, 0, Math.PI * 2);
      ctx.fill();

      // 2. Door Outer Frame & Glow
      ctx.fillStyle = isLocked ? '#7f1d1d' : '#14532d';
      ctx.shadowColor = isLocked ? '#ef4444' : '#22c55e';
      ctx.shadowBlur = 25;
      ctx.fillRect(door.x - 3, door.y - 3, dw + 6, dh + 6);

      // 3. Double Metallic Doors
      ctx.fillStyle = '#1c1917';
      ctx.fillRect(door.x, door.y, dw, dh);

      // Metallic border inner line
      ctx.strokeStyle = isLocked ? '#f87171' : '#4ade80';
      ctx.lineWidth = 2.5;
      ctx.strokeRect(door.x + 2, door.y + 2, dw - 4, dh - 4);

      // Metallic Door Handles
      ctx.fillStyle = isLocked ? '#ef4444' : '#facc15';
      ctx.shadowBlur = 8;
      if (dw > dh) {
        ctx.fillRect(dcx - 15, dcy - 3, 10, 6);
        ctx.fillRect(dcx + 5, dcy - 3, 10, 6);
      } else {
        ctx.fillRect(dcx - 3, dcy - 15, 6, 10);
        ctx.fillRect(dcx - 3, dcy + 5, 6, 10);
      }

      // 4. Large Pulsing Floating Neon Sign ("🔒 SORTIE" / "🔓 SORTIE !")
      const signY = door.y <= 30 ? door.y + dh + 20 : door.y - 12;
      const signX = door.x >= 1550 ? door.x - 45 : dcx;

      ctx.fillStyle = 'rgba(5, 5, 8, 0.9)';
      ctx.strokeStyle = isLocked ? '#ef4444' : '#22c55e';
      ctx.lineWidth = 2;
      ctx.shadowBlur = 15;
      ctx.beginPath();
      ctx.roundRect(signX - 45, signY - 12, 90, 22, 10);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = isLocked ? '#f87171' : '#4ade80';
      ctx.font = 'bold 11px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(isLocked ? '🔒 SORTIE' : '🔓 SORTIE !', signX, signY + 3);

      ctx.restore();

      // Draw Walls (Solid Textured Barriers)
      s.walls.forEach(w => {
        ctx.fillStyle = '#292524';
        ctx.fillRect(w.x, w.y, w.w, w.h);
        ctx.strokeStyle = '#78716c';
        ctx.lineWidth = 2;
        ctx.strokeRect(w.x, w.y, w.w, w.h);
      });

      // Draw Bullet Tracers (Crystal Clear Trajectories)
      s.bullets.forEach(b => {
        ctx.save();
        ctx.strokeStyle = '#fef08a';
        ctx.lineWidth = 3;
        ctx.shadowColor = '#eab308';
        ctx.shadowBlur = 8;
        ctx.beginPath();
        ctx.moveTo(b.x - b.vx * 2, b.y - b.vy * 2);
        ctx.lineTo(b.x, b.y);
        ctx.stroke();

        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(b.x, b.y, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      });

      // Draw Knife Slash Arc Effects
      if (s.slashes) {
        s.slashes.forEach(slash => {
          slash.life -= 0.12;
          ctx.save();
          ctx.translate(slash.x, slash.y);
          ctx.rotate(slash.angle);

          ctx.strokeStyle = '#38bdf8';
          ctx.shadowColor = '#0ea5e9';
          ctx.shadowBlur = 15;
          ctx.lineWidth = 4;
          ctx.globalAlpha = Math.max(0, slash.life);

          ctx.beginPath();
          ctx.arc(0, 0, 55, -0.8, 0.8);
          ctx.stroke();

          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 2.5;
          ctx.beginPath();
          ctx.arc(0, 0, 52, -0.6, 0.6);
          ctx.stroke();

          ctx.restore();
        });
        s.slashes = s.slashes.filter(slash => slash.life > 0);
      }

      // Draw Animated Zombie Sprites
      s.zombies.forEach((z, idx) => {
        ctx.save();
        ctx.translate(z.x, z.y);
        const zAngle = z.state === 'chase' ? Math.atan2(s.player.y - z.y, s.player.x - z.x) : z.patrolAngle;
        ctx.rotate(zAngle);

        const walkWobble = Math.sin(now * 0.01 + idx) * 4;

        // Zombie Shadow
        ctx.fillStyle = 'rgba(0,0,0,0.4)';
        ctx.beginPath(); ctx.ellipse(0, 0, 18, 14, 0, 0, Math.PI * 2); ctx.fill();

        // Zombie Outstretched Arms
        ctx.fillStyle = '#15803d';
        ctx.fillRect(4 + walkWobble, -12, 16, 5); // Right Arm
        ctx.fillRect(4 - walkWobble, 7, 16, 5);  // Left Arm

        // Zombie Hands / Claws
        ctx.fillStyle = '#86efac';
        ctx.beginPath();
        ctx.arc(20 + walkWobble, -10, 3, 0, Math.PI * 2);
        ctx.arc(20 - walkWobble, 9, 3, 0, Math.PI * 2);
        ctx.fill();

        // Zombie Shoulders & Torso (Tattered clothes)
        ctx.fillStyle = '#166534';
        ctx.beginPath();
        ctx.arc(0, 0, 15, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#052e16';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Zombie Head
        ctx.fillStyle = '#4ade80';
        ctx.beginPath();
        ctx.arc(-2, 0, 10, 0, Math.PI * 2);
        ctx.fill();

        // Glowing Red Eyes
        ctx.fillStyle = '#ef4444';
        ctx.shadowColor = '#ef4444';
        ctx.shadowBlur = 8;
        ctx.beginPath();
        ctx.arc(4, -4, 2.5, 0, Math.PI * 2);
        ctx.arc(4, 4, 2.5, 0, Math.PI * 2);
        ctx.fill();

        // HP Bar above zombie
        ctx.restore();
        ctx.fillStyle = 'rgba(0,0,0,0.6)';
        ctx.fillRect(z.x - 16, z.y - 26, 32, 5);
        ctx.fillStyle = '#ef4444';
        ctx.fillRect(z.x - 16, z.y - 26, (z.hp / 60) * 32, 5);
      });

      // Draw Animated Player SWAT/Survivor Sprite
      ctx.save();
      ctx.translate(s.player.x, s.player.y);
      ctx.rotate(s.player.angle);

      const pLegWobble = (dx !== 0 || dy !== 0) ? Math.sin(now * 0.015) * 6 : 0;

      // Player Shadow
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.beginPath(); ctx.ellipse(0, 0, 20, 15, 0, 0, Math.PI * 2); ctx.fill();

      // Legs
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(-10 + pLegWobble, -12, 10, 6);
      ctx.fillRect(-10 - pLegWobble, 6, 10, 6);

      // Boots
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(-12 + pLegWobble, -13, 5, 8);
      ctx.fillRect(-12 - pLegWobble, 5, 5, 8);

      // Body Armor / Vest
      ctx.fillStyle = '#2563eb';
      ctx.beginPath();
      ctx.arc(0, 0, 16, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#60a5fa';
      ctx.lineWidth = 2.5;
      ctx.stroke();

      // Backpack
      ctx.fillStyle = '#1e3a8a';
      ctx.fillRect(-16, -9, 8, 18);

      // Helmet / Head
      ctx.fillStyle = '#0f172a';
      ctx.beginPath();
      ctx.arc(-2, 0, 10, 0, Math.PI * 2);
      ctx.fill();

      // Hands & Weapon Barrel
      const activeW = s.player.weapons[s.player.activeWeaponIndex];
      if (activeW.id === 'knife') {
        ctx.fillStyle = '#1e293b';
        ctx.fillRect(8, 2, 8, 4); // handle
        ctx.fillStyle = '#e2e8f0';
        ctx.shadowColor = '#38bdf8';
        ctx.shadowBlur = 8;
        ctx.beginPath();
        ctx.moveTo(16, 2);
        ctx.lineTo(30, 4);
        ctx.lineTo(16, 6);
        ctx.closePath();
        ctx.fill();
      } else {
        ctx.fillStyle = '#475569';
        ctx.fillRect(8, 2, activeW.id === 'shotgun' ? 22 : 15, 6);
        
        ctx.fillStyle = '#94a3b8';
        ctx.fillRect(activeW.id === 'shotgun' ? 28 : 22, 1, 4, 8);
      }

      ctx.restore();

      // Draw Active Blood Particles
      s.particles.filter(p => p.life > 0.1).forEach(p => {
        p.x += p.vx;
        p.y += p.vy;
        p.life -= 0.02;
        ctx.fillStyle = p.color;
        ctx.globalAlpha = Math.max(0, p.life);
        ctx.beginPath();
        ctx.arc(p.x, p.y, 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1.0;
      });

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      canvas.removeEventListener('mousemove', handleMouseMove);
      canvas.removeEventListener('mousedown', handleMouseDown);
    };
  }, [difficulty]);

  return (
    <div className="relative w-full h-full flex justify-center items-center overflow-hidden bg-black">
      <canvas 
        ref={canvasRef} 
        className="w-full h-full max-w-[1600px] max-h-[1000px] object-contain cursor-crosshair shadow-2xl"
      />
    </div>
  );
};

export default GameCanvas;
