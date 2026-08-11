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
    if (now - s.lastKnifeSlash < 400) return;
    s.lastKnifeSlash = now;

    sounds.playKnife();

    // Knife Arc Hitbox
    const px = s.player.x;
    const py = s.player.y;
    const angle = s.player.angle;

    s.zombies.forEach(z => {
      const dx = z.x - px;
      const dy = z.y - py;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const zAngle = Math.atan2(dy, dx);
      let angleDiff = Math.abs(angle - zAngle);
      if (angleDiff > Math.PI) angleDiff = Math.PI * 2 - angleDiff;

      if (dist < 70 && angleDiff < 1.0) {
        z.hp -= 45;
        createBloodParticles(z.x, z.y, 8);
        if (z.hp <= 0) {
          s.kills++;
        }
      }
    });

    createBloodParticles(px + Math.cos(angle) * 30, py + Math.sin(angle) * 30, 3, '#aaaaaa');
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

    // Build Mansion Walls
    s.walls = [
      // Outer boundaries
      { x: 0, y: 0, w: 1600, h: 20 },
      { x: 0, y: 980, w: 1600, h: 20 },
      { x: 0, y: 0, w: 20, h: 1000 },
      { x: 1580, y: 0, w: 20, h: 1000 },
      
      // Rooms & Corridors
      { x: 400, y: 20, w: 20, h: 650 },
      { x: 400, y: 750, w: 20, h: 250 },
      { x: 800, y: 200, w: 20, h: 800 },
      { x: 1200, y: 20, w: 20, h: 700 },
      { x: 400, y: 400, w: 400, h: 20 },
      { x: 800, y: 600, w: 400, h: 20 },
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
        if (distToPlayer < 300) z.state = 'chase';

        if (z.state === 'chase') {
          const zAngle = Math.atan2(s.player.y - z.y, s.player.x - z.x);
          z.x += Math.cos(zAngle) * z.speed;
          z.y += Math.sin(zAngle) * z.speed;

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
          z.x += Math.cos(z.patrolAngle) * (z.speed * 0.3);
          z.y += Math.sin(z.patrolAngle) * (z.speed * 0.3);
          if (Math.random() < 0.02) z.patrolAngle = Math.random() * Math.PI * 2;
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

      // 5. RENDERING
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Floor tiles
      ctx.fillStyle = '#18181c';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Grid Lines
      ctx.strokeStyle = '#222228';
      ctx.lineWidth = 1;
      for (let x = 0; x < canvas.width; x += 60) {
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, canvas.height); ctx.stroke();
      }
      for (let y = 0; y < canvas.height; y += 60) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(canvas.width, y); ctx.stroke();
      }

      // Draw Pickups
      s.pickups.filter(p => !p.collected).forEach(p => {
        ctx.fillStyle = p.type === 'medkit' ? '#22c55e' : '#eab308';
        ctx.beginPath();
        ctx.arc(p.x, p.y, 10, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#ffffff';
        ctx.stroke();
      });

      // Draw Key
      if (!s.keyItem.collected) {
        ctx.fillStyle = '#f59e0b';
        ctx.beginPath();
        ctx.arc(s.keyItem.x, s.keyItem.y, 12, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#ffffff';
        ctx.stroke();
      }

      // Draw Exit Door
      ctx.fillStyle = s.exitDoor.locked ? '#dc2626' : '#16a34a';
      ctx.fillRect(s.exitDoor.x, s.exitDoor.y, s.exitDoor.width, s.exitDoor.height);

      // Draw Walls
      ctx.fillStyle = '#374151';
      s.walls.forEach(w => {
        ctx.fillRect(w.x, w.y, w.w, w.h);
        ctx.strokeStyle = '#4b5563';
        ctx.strokeRect(w.x, w.y, w.w, w.h);
      });

      // Draw Bullets
      ctx.fillStyle = '#fef08a';
      s.bullets.forEach(b => {
        ctx.beginPath();
        ctx.arc(b.x, b.y, 3, 0, Math.PI * 2);
        ctx.fill();
      });

      // Draw Zombies
      s.zombies.forEach(z => {
        ctx.save();
        ctx.translate(z.x, z.y);
        ctx.fillStyle = '#15803d'; // Zombie Green
        ctx.beginPath();
        ctx.arc(0, 0, z.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#000000';
        ctx.stroke();

        // Zombie Eyes
        ctx.fillStyle = '#ef4444';
        ctx.beginPath();
        ctx.arc(4, -4, 3, 0, Math.PI * 2);
        ctx.arc(4, 4, 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      });

      // Draw Player
      ctx.save();
      ctx.translate(s.player.x, s.player.y);
      ctx.rotate(s.player.angle);
      
      // Body
      ctx.fillStyle = '#3b82f6';
      ctx.beginPath();
      ctx.arc(0, 0, s.player.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.stroke();

      // Gun / Hands
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(8, 4, 14, 5);
      ctx.restore();

      // Draw Blood Particles
      s.particles.forEach(p => {
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
      s.particles = s.particles.filter(p => p.life > 0);

      // 6. DYNAMIC FLASHLIGHT & DARKNESS FOG
      ctx.save();
      ctx.fillStyle = 'rgba(5, 5, 8, 0.92)'; // Dark Fog
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Cutout Flashlight Cone
      ctx.globalCompositeOperation = 'destination-out';
      ctx.beginPath();
      ctx.moveTo(s.player.x, s.player.y);
      ctx.arc(
        s.player.x, 
        s.player.y, 
        420, 
        s.player.angle - 0.45, 
        s.player.angle + 0.45
      );
      ctx.closePath();
      ctx.fill();

      // Small ambient light around player
      ctx.beginPath();
      ctx.arc(s.player.x, s.player.y, 60, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();

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
