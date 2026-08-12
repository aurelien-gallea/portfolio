import React, { useEffect, useRef, useState } from 'react';
import { sounds } from '../utils/audio';

const GameCanvas = ({ 
  difficulty = 'normal', 
  onGameOver, 
  onVictory, 
  onPlayerUpdate, 
  mobileMove, 
  mobileFireTrigger, 
  mobileReloadTrigger,
  mobileKnifeTrigger 
}) => {
  const canvasRef = useRef(null);

  // Map & Game State Ref (to avoid closure stale state in rAF)
  const stateRef = useRef({
    player: {
      x: 200,
      y: 200,
      radius: 16,
      angle: 0,
      hp: 100,
      maxHp: 100,
      activeWeaponIndex: 0,
      weapons: [
        { id: 'handgun', name: 'Pistolet 9mm', magAmmo: 12, magCapacity: 12, reserveAmmo: 24, maxReserve: 48, damage: 30, sound: 'playHandgun' },
        { id: 'shotgun', name: 'Shotgun', magAmmo: 6, magCapacity: 6, reserveAmmo: 12, maxReserve: 24, damage: 25, sound: 'playShotgun' },
        { id: 'knife', name: 'Couteau', magAmmo: 0, magCapacity: 0, reserveAmmo: 0, maxReserve: 0, damage: 45, sound: 'playKnife' }
      ]
    },
    keys: {},
    mouse: { x: 0, y: 0 },
    zombies: [],
    bullets: [],
    particles: [],
    slashes: [],
    pickups: [],
    walls: [],
    exitDoor: { x: 1400, y: 850, width: 80, height: 20, locked: true },
    keyItem: { x: 1350, y: 150, width: 24, height: 24, collected: false },
    hasKey: false,
    kills: 0,
    timeElapsed: 0,
    lastKnifeSlash: 0
  });

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

  // Setup Map & Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    // Resize canvas
    canvas.width = 1600;
    canvas.height = 1000;

    const s = stateRef.current;

    // Reset Game State
    s.player.hp = 100;
    s.player.x = 150;
    s.player.y = 850;
    s.player.weapons[0].magAmmo = 12;
    s.player.weapons[0].reserveAmmo = 24;
    s.player.weapons[1].magAmmo = 6;
    s.player.weapons[1].reserveAmmo = 12;
    s.hasKey = false;
    s.keyItem.collected = false;
    s.exitDoor.locked = true;
    s.kills = 0;

    // Build Mansion Walls (Spacious layout with 360-degree open traversal corridors)
    s.walls = [
      // Outer boundaries
      { x: 0, y: 0, w: 1600, h: 20 },
      { x: 0, y: 980, w: 1600, h: 20 },
      { x: 0, y: 0, w: 20, h: 1000 },
      { x: 1580, y: 0, w: 20, h: 1000 },
      
      // Vertical Partition 1 (x: 400) - Openings at top (y:20-200), middle (y:400-550), and bottom (y:750-980)
      { x: 400, y: 200, w: 20, h: 200 },
      { x: 400, y: 550, w: 20, h: 200 },

      // Vertical Partition 2 (x: 800) - Openings at top (y:20-180), middle (y:380-540), and bottom (y:740-980)
      { x: 800, y: 180, w: 20, h: 200 },
      { x: 800, y: 540, w: 20, h: 200 },

      // Vertical Partition 3 (x: 1200) - Openings at top (y:20-200), middle (y:450-600), and bottom (y:800-980)
      { x: 1200, y: 200, w: 20, h: 250 },
      { x: 1200, y: 600, w: 20, h: 200 },

      // Horizontal dividers with wide gaps
      { x: 420, y: 350, w: 230, h: 20 },  // Gap at x:650-800
      { x: 820, y: 650, w: 230, h: 20 },  // Gap at x:1050-1200
    ];

    // Spawn Pickups
    s.pickups = [
      { id: 1, type: 'ammo_handgun', x: 250, y: 250, amount: 12 },
      { id: 2, type: 'ammo_shotgun', x: 600, y: 150, amount: 6 },
      { id: 3, type: 'medkit', x: 950, y: 850, amount: 40 },
      { id: 4, type: 'ammo_handgun', x: 1050, y: 350, amount: 12 },
    ];

    // Spawn Zombies based on difficulty
    const zombieCount = difficulty === 'hard' ? 18 : difficulty === 'easy' ? 8 : 12;
    s.zombies = [];
    for (let i = 0; i < zombieCount; i++) {
      s.zombies.push({
        id: i,
        x: 450 + Math.random() * 1000,
        y: 100 + Math.random() * 800,
        radius: 16,
        hp: 60,
        speed: 1.2 + Math.random() * 0.8,
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
      // 1. UPDATE PLAYER
      let dx = 0;
      let dy = 0;
      const speed = 3.5;

      if (s.keys['w'] || s.keys['z'] || s.keys['arrowup']) dy -= 1;
      if (s.keys['s'] || s.keys['arrowdown']) dy += 1;
      if (s.keys['a'] || s.keys['q'] || s.keys['arrowleft']) dx -= 1;
      if (s.keys['d'] || s.keys['arrowright']) dx += 1;

      if (mobileMove.x !== 0 || mobileMove.y !== 0) {
        dx = mobileMove.x;
        dy = mobileMove.y;
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
      if (mobileMove.x !== 0 || mobileMove.y !== 0) {
        s.player.angle = Math.atan2(mobileMove.y, mobileMove.x);
      } else {
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
            if (z.hp <= 0) s.kills++;
          }
        });
      });
      s.bullets = s.bullets.filter(b => b.range > 0);

      // Remove Dead Zombies
      s.zombies = s.zombies.filter(z => z.hp > 0);

      // 3. UPDATE ZOMBIES & AI
      const now = Date.now();
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
            onPlayerUpdate({ ...s.player });
            if (s.player.hp <= 0) {
              onGameOver({ kills: s.kills });
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

        // If zombie hits a wall while patrolling, pick a new angle
        if (!canZMoveX || !canZMoveY) {
          z.patrolAngle = Math.random() * Math.PI * 2;
        }
      });

      // 4. PICKUPS & OBJECTIVES
      s.pickups.forEach(p => {
        if (!p.collected && Math.hypot(s.player.x - p.x, s.player.y - p.y) < 30) {
          p.collected = true;
          sounds.playPickup();
          if (p.type === 'ammo_handgun') {
            s.player.weapons[0].reserveAmmo = Math.min(s.player.weapons[0].maxReserve, s.player.weapons[0].reserveAmmo + p.amount);
          } else if (p.type === 'ammo_shotgun') {
            s.player.weapons[1].reserveAmmo = Math.min(s.player.weapons[1].maxReserve, s.player.weapons[1].reserveAmmo + p.amount);
          } else if (p.type === 'medkit') {
            s.player.hp = Math.min(s.player.maxHp, s.player.hp + p.amount);
          }
          onPlayerUpdate({ ...s.player });
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
      if (s.hasKey && Math.hypot(s.player.x - (s.exitDoor.x + 40), s.player.y - s.exitDoor.y) < 40) {
        onVictory({ kills: s.kills });
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

      // Draw Pickups (Medkit & Ammo Boxes with icons/glowing borders)
      s.pickups.filter(p => !p.collected).forEach(p => {
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.fillStyle = p.type === 'medkit' ? '#22c55e' : '#eab308';
        ctx.shadowColor = p.type === 'medkit' ? '#22c55e' : '#eab308';
        ctx.shadowBlur = 12;
        ctx.beginPath();
        ctx.arc(0, 0, 12, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Label
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 9px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(p.type === 'medkit' ? '+SOIN' : '+BALLES', 0, 20);
        ctx.restore();
      });

      // Draw Key
      if (!s.keyItem.collected) {
        ctx.save();
        ctx.translate(s.keyItem.x, s.keyItem.y);
        ctx.fillStyle = '#f59e0b';
        ctx.shadowColor = '#f59e0b';
        ctx.shadowBlur = 15;
        ctx.beginPath();
        ctx.arc(0, 0, 14, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 10px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('CLÉ', 0, 24);
        ctx.restore();
      }

      // Draw Exit Door
      ctx.save();
      ctx.fillStyle = s.exitDoor.locked ? '#dc2626' : '#16a34a';
      ctx.shadowColor = s.exitDoor.locked ? '#dc2626' : '#16a34a';
      ctx.shadowBlur = 15;
      ctx.fillRect(s.exitDoor.x, s.exitDoor.y, s.exitDoor.width, s.exitDoor.height);
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 12px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(s.exitDoor.locked ? 'PORTE VERROUILLÉE' : 'SORTIE ESPACE !', s.exitDoor.x + 40, s.exitDoor.y - 8);
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
