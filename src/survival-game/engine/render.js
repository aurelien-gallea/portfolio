// Canvas drawing for Zombie Rules: a pre-rendered mansion layer plus animated sprites.

import { MAP_W, MAP_H, ZOMBIE_TYPES, SPIT } from './config';

const shade = (hex, amount) => {
  const n = parseInt(hex.slice(1), 16);
  const f = (v) => Math.max(0, Math.min(255, Math.round(v + 255 * amount)));
  return `rgb(${f(n >> 16)}, ${f((n >> 8) & 255)}, ${f(n & 255)})`;
};

const seeded = (seed) => {
  let s = seed;
  return () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
};

const makeCanvas = () => {
  const c = document.createElement('canvas');
  c.width = MAP_W;
  c.height = MAP_H;
  return c;
};

// ---------- Static layer: floors, lights, props and walls ----------

const drawFloor = (ctx, room) => {
  const { x, y, w, h, tint } = room;
  const rnd = seeded(room.id * 97 + 13);
  ctx.save();
  ctx.beginPath();
  ctx.rect(x, y, w, h);
  ctx.clip();

  if (room.style === 'wood') {
    const plank = 22;
    for (let py = y, row = 0; py < y + h; py += plank, row++) {
      const offset = (row % 3) * 60;
      for (let px = x - offset; px < x + w; px += 140) {
        ctx.fillStyle = shade('#3a2a1d', tint + (rnd() - 0.5) * 0.04);
        ctx.fillRect(px, py, 140, plank);
        ctx.strokeStyle = 'rgba(0,0,0,0.35)';
        ctx.lineWidth = 1;
        ctx.strokeRect(px + 0.5, py + 0.5, 140, plank);
      }
    }
  } else if (room.style === 'tiles') {
    const tile = 40;
    for (let ty = y, i = 0; ty < y + h; ty += tile, i++) {
      for (let tx = x, j = 0; tx < x + w; tx += tile, j++) {
        ctx.fillStyle = shade((i + j) % 2 ? '#2b3236' : '#22282b', tint + (rnd() - 0.5) * 0.02);
        ctx.fillRect(tx, ty, tile, tile);
      }
    }
    ctx.strokeStyle = 'rgba(0,0,0,0.4)';
    ctx.lineWidth = 2;
    for (let tx = x; tx < x + w; tx += 40) { ctx.beginPath(); ctx.moveTo(tx, y); ctx.lineTo(tx, y + h); ctx.stroke(); }
    for (let ty = y; ty < y + h; ty += 40) { ctx.beginPath(); ctx.moveTo(x, ty); ctx.lineTo(x + w, ty); ctx.stroke(); }
  } else if (room.style === 'carpet') {
    ctx.fillStyle = shade('#2b2320', tint);
    ctx.fillRect(x, y, w, h);
    ctx.fillStyle = shade('#4a1d26', tint);
    ctx.fillRect(x + 40, y + 40, w - 80, h - 80);
    ctx.strokeStyle = shade('#a16207', tint - 0.15);
    ctx.lineWidth = 3;
    ctx.strokeRect(x + 52, y + 52, w - 104, h - 104);
    ctx.setLineDash([6, 8]);
    ctx.lineWidth = 1.5;
    ctx.strokeRect(x + 62, y + 62, w - 124, h - 124);
    ctx.setLineDash([]);
  } else {
    ctx.fillStyle = shade('#292624', tint);
    ctx.fillRect(x, y, w, h);
    for (let i = 0; i < 260; i++) {
      ctx.fillStyle = rnd() > 0.5 ? 'rgba(255,255,255,0.025)' : 'rgba(0,0,0,0.12)';
      ctx.fillRect(x + rnd() * w, y + rnd() * h, 2 + rnd() * 3, 2 + rnd() * 3);
    }
    ctx.strokeStyle = 'rgba(0,0,0,0.35)';
    ctx.lineWidth = 1.5;
    for (let i = 0; i < 3; i++) {
      let cx = x + rnd() * w;
      let cy = y + rnd() * h;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      for (let k = 0; k < 5; k++) {
        cx += (rnd() - 0.5) * 50;
        cy += (rnd() - 0.5) * 50;
        ctx.lineTo(cx, cy);
      }
      ctx.stroke();
    }
  }

  // Ceiling lamp light pool
  const light = ctx.createRadialGradient(room.light.x, room.light.y, 0, room.light.x, room.light.y, 190);
  light.addColorStop(0, 'rgba(255, 214, 150, 0.13)');
  light.addColorStop(1, 'rgba(255, 214, 150, 0)');
  ctx.fillStyle = light;
  ctx.fillRect(x, y, w, h);

  // Soft darkening towards the walls
  const edge = ctx.createRadialGradient(room.cx, room.cy, Math.min(w, h) * 0.3, room.cx, room.cy, Math.max(w, h) * 0.7);
  edge.addColorStop(0, 'rgba(0,0,0,0)');
  edge.addColorStop(1, 'rgba(0,0,0,0.35)');
  ctx.fillStyle = edge;
  ctx.fillRect(x, y, w, h);

  // Room name painted on the floor
  ctx.fillStyle = 'rgba(255,255,255,0.07)';
  ctx.font = 'bold 13px monospace';
  ctx.textAlign = 'left';
  ctx.fillText(room.name.toUpperCase(), x + 22, y + 34);
  ctx.restore();
};

const drawStartZone = (ctx, room) => {
  ctx.save();
  ctx.translate(room.cx, room.cy);
  ctx.strokeStyle = 'rgba(56, 189, 248, 0.35)';
  ctx.lineWidth = 3;
  ctx.setLineDash([14, 10]);
  ctx.beginPath();
  ctx.arc(0, 0, 70, 0, Math.PI * 2);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.fillStyle = 'rgba(56, 189, 248, 0.25)';
  ctx.font = 'bold 12px monospace';
  ctx.textAlign = 'center';
  ctx.fillText('ZONE SÛRE', 0, 95);
  ctx.restore();
};

const drawProp = (ctx, p) => {
  ctx.save();
  ctx.fillStyle = 'rgba(0,0,0,0.45)';
  ctx.fillRect(p.x + 6, p.y + 7, p.w, p.h);

  if (p.kind === 'crate') {
    ctx.fillStyle = '#7c5a2e';
    ctx.fillRect(p.x, p.y, p.w, p.h);
    ctx.strokeStyle = '#3f2a12';
    ctx.lineWidth = 3;
    for (let cx = p.x; cx < p.x + p.w - 1; cx += 36) {
      ctx.strokeRect(cx + 1.5, p.y + 1.5, 33, p.h - 3);
      ctx.beginPath();
      ctx.moveTo(cx + 4, p.y + 4); ctx.lineTo(cx + 32, p.y + p.h - 4);
      ctx.moveTo(cx + 32, p.y + 4); ctx.lineTo(cx + 4, p.y + p.h - 4);
      ctx.stroke();
    }
    ctx.fillStyle = 'rgba(255,255,255,0.08)';
    ctx.fillRect(p.x, p.y, p.w, 4);
  } else if (p.kind === 'table') {
    ctx.fillStyle = '#4a2f1b';
    ctx.fillRect(p.x, p.y, p.w, p.h);
    ctx.fillStyle = '#6b4426';
    ctx.fillRect(p.x + 4, p.y + 4, p.w - 8, p.h - 8);
    ctx.fillStyle = '#e7e5e4';
    ctx.save();
    ctx.translate(p.x + p.w * 0.35, p.y + p.h * 0.45);
    ctx.rotate(0.3);
    ctx.fillRect(-9, -6, 18, 12);
    ctx.restore();
    ctx.fillStyle = '#a8a29e';
    ctx.beginPath();
    ctx.arc(p.x + p.w * 0.7, p.y + p.h * 0.5, 6, 0, Math.PI * 2);
    ctx.fill();
  } else if (p.kind === 'shelf') {
    ctx.fillStyle = '#27272a';
    ctx.fillRect(p.x, p.y, p.w, p.h);
    const horizontal = p.w > p.h;
    const colors = ['#b91c1c', '#1d4ed8', '#a16207', '#15803d', '#7e22ce', '#57534e'];
    for (let i = 0, pos = 3; pos < (horizontal ? p.w : p.h) - 6; i++) {
      const size = 5 + ((i * 7) % 5);
      ctx.fillStyle = colors[i % colors.length];
      if (horizontal) ctx.fillRect(p.x + pos, p.y + 4, size, p.h - 8);
      else ctx.fillRect(p.x + 4, p.y + pos, p.w - 8, size);
      pos += size + 1;
    }
    ctx.strokeStyle = '#52525b';
    ctx.lineWidth = 2;
    ctx.strokeRect(p.x + 1, p.y + 1, p.w - 2, p.h - 2);
  } else if (p.kind === 'sofa') {
    ctx.fillStyle = '#5f1d1d';
    ctx.fillRect(p.x, p.y, p.w, p.h);
    ctx.fillStyle = '#7f2a2a';
    const cushion = (p.w - 16) / 3;
    for (let i = 0; i < 3; i++) ctx.fillRect(p.x + 8 + i * cushion + 1, p.y + 10, cushion - 2, p.h - 14);
    ctx.fillStyle = '#4c1414';
    ctx.fillRect(p.x, p.y, p.w, 8);
  }
  ctx.restore();
};

const drawWall = (ctx, w) => {
  ctx.fillStyle = '#44403c';
  ctx.fillRect(w.x, w.y, w.w, w.h);
  ctx.fillStyle = '#57534e';
  ctx.fillRect(w.x + 3, w.y + 3, Math.max(0, w.w - 6), Math.max(0, w.h - 6));
  ctx.strokeStyle = '#1c1917';
  ctx.lineWidth = 2;
  ctx.strokeRect(w.x + 1, w.y + 1, w.w - 2, w.h - 2);
};

export const buildStaticLayer = (level) => {
  const canvas = makeCanvas();
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#0c0a09';
  ctx.fillRect(0, 0, MAP_W, MAP_H);

  level.rooms.forEach(room => drawFloor(ctx, room));
  drawStartZone(ctx, level.startRoom);

  // Thresholds under the door openings
  level.doorways.forEach(d => {
    ctx.fillStyle = '#3f2d1f';
    ctx.fillRect(d.x, d.y, d.w, d.h);
    ctx.strokeStyle = 'rgba(0,0,0,0.5)';
    ctx.strokeRect(d.x + 0.5, d.y + 0.5, d.w - 1, d.h - 1);
  });

  // Wall shadows first so they fall onto the floor only
  ctx.fillStyle = 'rgba(0,0,0,0.5)';
  level.walls.forEach(w => ctx.fillRect(w.x + 5, w.y + 6, w.w, w.h));
  level.props.forEach(p => drawProp(ctx, p));
  level.walls.forEach(w => drawWall(ctx, w));
  return canvas;
};

// ---------- Persistent decals (blood, scorch marks) ----------

export const createDecalLayer = () => makeCanvas();

export const stampBlood = (decalCtx, x, y, size = 1, color = '120, 20, 20') => {
  decalCtx.save();
  for (let i = 0; i < 7; i++) {
    const r = (3 + Math.random() * 9) * size;
    const ox = (Math.random() - 0.5) * 26 * size;
    const oy = (Math.random() - 0.5) * 26 * size;
    decalCtx.fillStyle = `rgba(${color}, ${0.25 + Math.random() * 0.3})`;
    decalCtx.beginPath();
    decalCtx.arc(x + ox, y + oy, r, 0, Math.PI * 2);
    decalCtx.fill();
  }
  decalCtx.restore();
};

// ---------- Dynamic sprites ----------

export const drawPit = (ctx, pit, t) => {
  if (!pit.shape) {
    pit.shape = Array.from({ length: 14 }, () => 0.82 + Math.random() * 0.3);
  }
  ctx.save();
  ctx.translate(pit.x, pit.y);
  const pulse = 0.5 + Math.sin(t * 0.004 + pit.x) * 0.5;

  // Broken floor edge
  ctx.fillStyle = '#1c1410';
  ctx.beginPath();
  pit.shape.forEach((k, i) => {
    const a = (i / pit.shape.length) * Math.PI * 2;
    const r = pit.radius * (k + 0.22);
    if (i === 0) ctx.moveTo(Math.cos(a) * r, Math.sin(a) * r);
    else ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r);
  });
  ctx.closePath();
  ctx.fill();

  // Abyss
  const hole = ctx.createRadialGradient(0, 0, 2, 0, 0, pit.radius);
  hole.addColorStop(0, '#000000');
  hole.addColorStop(0.75, '#050505');
  hole.addColorStop(1, '#2a1a12');
  ctx.fillStyle = hole;
  ctx.beginPath();
  pit.shape.forEach((k, i) => {
    const a = (i / pit.shape.length) * Math.PI * 2;
    const r = pit.radius * k;
    if (i === 0) ctx.moveTo(Math.cos(a) * r, Math.sin(a) * r);
    else ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r);
  });
  ctx.closePath();
  ctx.fill();

  // Danger ring
  ctx.strokeStyle = `rgba(239, 68, 68, ${0.25 + pulse * 0.35})`;
  ctx.lineWidth = 2;
  ctx.setLineDash([5, 6]);
  ctx.lineDashOffset = -t * 0.01;
  ctx.beginPath();
  ctx.arc(0, 0, pit.radius + 9, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();
};

const label = (ctx, text, y, color) => {
  ctx.font = 'bold 9px monospace';
  ctx.textAlign = 'center';
  const w = ctx.measureText(text).width + 10;
  ctx.fillStyle = 'rgba(0,0,0,0.85)';
  ctx.strokeStyle = color;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.roundRect(-w / 2, y - 8, w, 13, 4);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = color;
  ctx.fillText(text, 0, y + 1.5);
};

const PICKUP_COLORS = {
  medkit: '74, 222, 128',
  ammo: '250, 204, 21',
  shells: '251, 146, 60',
  shotgun: '249, 115, 22',
};

// Floor glow plus an expanding ring so supplies stand out on every floor style
const drawBeacon = (ctx, p, t) => {
  const rgb = PICKUP_COLORS[p.type];
  const glow = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, 46);
  glow.addColorStop(0, `rgba(${rgb}, 0.38)`);
  glow.addColorStop(1, `rgba(${rgb}, 0)`);
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(p.x, p.y, 46, 0, Math.PI * 2);
  ctx.fill();

  const k = ((t * 0.0007 + p.bob) % 1);
  ctx.strokeStyle = `rgba(${rgb}, ${0.7 * (1 - k)})`;
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.arc(p.x, p.y, 16 + k * 34, 0, Math.PI * 2);
  ctx.stroke();
};

export const drawPickup = (ctx, p, t) => {
  drawBeacon(ctx, p, t);
  const bob = Math.sin(t * 0.005 + p.bob) * 2.5;
  ctx.save();
  ctx.translate(p.x, p.y + bob);
  ctx.scale(1.3, 1.3);

  ctx.fillStyle = 'rgba(0,0,0,0.4)';
  ctx.beginPath();
  ctx.ellipse(0, 14 - bob, 12, 4, 0, 0, Math.PI * 2);
  ctx.fill();

  if (p.type === 'medkit') {
    ctx.shadowColor = '#22c55e';
    ctx.shadowBlur = 14;
    ctx.fillStyle = '#f5f5f4';
    ctx.fillRect(-12, -10, 24, 20);
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#16a34a';
    ctx.fillRect(-3, -7, 6, 14);
    ctx.fillRect(-7, -3, 14, 6);
    label(ctx, '+SOIN', 24, '#4ade80');
  } else if (p.type === 'ammo') {
    ctx.shadowColor = '#eab308';
    ctx.shadowBlur = 14;
    ctx.fillStyle = '#3f6212';
    ctx.fillRect(-12, -9, 24, 18);
    ctx.shadowBlur = 0;
    for (let i = -1; i <= 1; i++) {
      ctx.fillStyle = '#eab308';
      ctx.fillRect(i * 6 - 2, -4, 4, 9);
      ctx.fillStyle = '#f97316';
      ctx.beginPath();
      ctx.moveTo(i * 6 - 2, -4); ctx.lineTo(i * 6, -9); ctx.lineTo(i * 6 + 2, -4);
      ctx.fill();
    }
    label(ctx, '+BALLES', 24, '#fde047');
  } else if (p.type === 'shells') {
    ctx.shadowColor = '#f97316';
    ctx.shadowBlur = 14;
    ctx.fillStyle = '#7c2d12';
    ctx.fillRect(-12, -9, 24, 18);
    ctx.shadowBlur = 0;
    for (let i = -1; i <= 1; i++) {
      ctx.fillStyle = '#dc2626';
      ctx.fillRect(i * 7 - 3, -6, 6, 9);
      ctx.fillStyle = '#facc15';
      ctx.fillRect(i * 7 - 3, 3, 6, 3);
    }
    label(ctx, '+CARTOUCHES', 24, '#fb923c');
  } else if (p.type === 'shotgun') {
    const glow = 10 + Math.sin(t * 0.006) * 6;
    ctx.shadowColor = '#f97316';
    ctx.shadowBlur = glow;
    ctx.strokeStyle = 'rgba(249, 115, 22, 0.6)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, 0, 22, 0, Math.PI * 2);
    ctx.stroke();
    ctx.rotate(-0.4);
    ctx.fillStyle = '#78350f';
    ctx.fillRect(-20, -3, 12, 8);
    ctx.fillStyle = '#334155';
    ctx.fillRect(-9, -3, 30, 5);
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(0, 2, 12, 4);
    ctx.rotate(0.4);
    ctx.shadowBlur = 0;
    label(ctx, 'FUSIL À POMPE', 34, '#fb923c');
  }
  ctx.restore();
};

export const drawKey = (ctx, key, t) => {
  const bob = Math.sin(t * 0.004) * 3;
  ctx.save();
  ctx.translate(key.x, key.y + bob);

  ctx.save();
  ctx.rotate(t * 0.0008);
  ctx.fillStyle = 'rgba(251, 191, 36, 0.08)';
  for (let i = 0; i < 6; i++) {
    ctx.rotate(Math.PI / 3);
    ctx.beginPath();
    ctx.moveTo(0, 0); ctx.lineTo(48, -9); ctx.lineTo(48, 9);
    ctx.fill();
  }
  ctx.restore();

  ctx.shadowColor = '#fbbf24';
  ctx.shadowBlur = 18;
  ctx.strokeStyle = '#fbbf24';
  ctx.lineWidth = 3.5;
  ctx.beginPath();
  ctx.arc(-8, 0, 7, 0, Math.PI * 2);
  ctx.stroke();
  ctx.fillStyle = '#fbbf24';
  ctx.fillRect(-3, -2.5, 18, 5);
  ctx.fillRect(7, 2.5, 3.5, 6);
  ctx.fillRect(12, 2.5, 3.5, 5);
  ctx.fillStyle = '#fef08a';
  ctx.fillRect(-2, -1, 15, 2);
  ctx.shadowBlur = 0;
  label(ctx, 'CLÉ DE SORTIE', 26, '#fbbf24');
  ctx.restore();
};

export const drawExitDoor = (ctx, door, t) => {
  const locked = door.locked;
  const cx = door.x + door.w / 2;
  const cy = door.y + door.h / 2;
  const pulse = 0.6 + Math.sin(t * (locked ? 0.003 : 0.008)) * 0.4;
  ctx.save();

  const glow = ctx.createRadialGradient(cx, cy, 5, cx, cy, locked ? 110 : 160);
  glow.addColorStop(0, locked ? `rgba(239, 68, 68, ${0.35 * pulse})` : `rgba(34, 197, 94, ${0.55 * pulse})`);
  glow.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = glow;
  ctx.fillRect(cx - 170, cy - 170, 340, 340);

  ctx.fillStyle = locked ? '#7f1d1d' : '#14532d';
  ctx.shadowColor = locked ? '#ef4444' : '#22c55e';
  ctx.shadowBlur = 20;
  ctx.fillRect(door.x - 3, door.y - 3, door.w + 6, door.h + 6);
  ctx.fillStyle = '#1c1917';
  ctx.fillRect(door.x, door.y, door.w, door.h);
  ctx.strokeStyle = locked ? '#f87171' : '#4ade80';
  ctx.lineWidth = 2.5;
  ctx.strokeRect(door.x + 2, door.y + 2, door.w - 4, door.h - 4);
  ctx.shadowBlur = 0;

  // Hazard stripes when locked, arrows when open
  ctx.save();
  ctx.beginPath();
  ctx.rect(door.x + 4, door.y + 4, door.w - 8, door.h - 8);
  ctx.clip();
  if (locked) {
    ctx.fillStyle = 'rgba(239, 68, 68, 0.7)';
    for (let i = -140; i < 140; i += 16) {
      ctx.beginPath();
      ctx.moveTo(cx + i, cy - 70); ctx.lineTo(cx + i + 8, cy - 70); ctx.lineTo(cx + i + 88, cy + 70); ctx.lineTo(cx + i + 80, cy + 70);
      ctx.fill();
    }
  } else {
    ctx.fillStyle = `rgba(74, 222, 128, ${pulse})`;
    ctx.fillRect(door.x, door.y, door.w, door.h);
  }
  ctx.restore();

  // Sign placed on the inner side of the wall
  const inward = { top: [0, 1], bottom: [0, -1], left: [1, 0], right: [-1, 0] }[door.side];
  const sx = cx + inward[0] * 58;
  const sy = cy + inward[1] * 34;
  ctx.fillStyle = 'rgba(5, 5, 8, 0.9)';
  ctx.strokeStyle = locked ? '#ef4444' : '#22c55e';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(sx - 46, sy - 11, 92, 22, 10);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = locked ? '#f87171' : '#4ade80';
  ctx.font = 'bold 11px monospace';
  ctx.textAlign = 'center';
  ctx.fillText(locked ? 'VERROUILLÉ' : 'SORTIE  ➜', sx, sy + 4);
  ctx.restore();
};

export const drawZombie = (ctx, z, t) => {
  const type = ZOMBIE_TYPES[z.type];
  const scale = z.radius / 16;
  const wobble = Math.sin(t * 0.01 * (z.type === 'runner' ? 1.8 : 1) + z.phase) * 4;
  const flash = z.hitFlash > 0;

  if (z.type === 'brute' && z.falling === undefined) drawBruteAura(ctx, z, t);
  if (z.type === 'spitter' && z.falling === undefined) drawSpitterAura(ctx, z, t);

  ctx.save();
  ctx.translate(z.x, z.y);
  if (z.falling !== undefined) {
    const k = Math.max(0, 1 - z.falling);
    ctx.scale(k, k);
    ctx.rotate(z.falling * 6);
  }
  ctx.rotate(z.angle);
  ctx.scale(scale, scale);

  ctx.fillStyle = 'rgba(0,0,0,0.4)';
  ctx.beginPath();
  ctx.ellipse(2, 3, 18, 14, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = flash ? '#ffffff' : type.arm;
  ctx.fillRect(4 + wobble, -12, 16, 5);
  ctx.fillRect(4 - wobble, 7, 16, 5);
  ctx.fillStyle = flash ? '#ffffff' : type.skin;
  ctx.beginPath();
  ctx.arc(20 + wobble, -10, 3, 0, Math.PI * 2);
  ctx.arc(20 - wobble, 9, 3, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = flash ? '#ffffff' : type.body;
  ctx.beginPath();
  ctx.arc(0, 0, 15, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = 'rgba(0,0,0,0.6)';
  ctx.lineWidth = 2;
  ctx.stroke();

  if (z.type === 'brute') {
    // Armored shoulders
    ctx.fillStyle = flash ? '#ffffff' : '#312e81';
    ctx.fillRect(-8, -16, 12, 6);
    ctx.fillRect(-8, 10, 12, 6);
  }

  ctx.fillStyle = flash ? '#ffffff' : type.skin;
  ctx.beginPath();
  ctx.arc(-2, 0, 10, 0, Math.PI * 2);
  ctx.fill();

  if (z.type === 'spitter') {
    // Throat sac swells while the spitter prepares its web
    const charge = z.spit ? 1 - z.spit / SPIT.windup : 0;
    ctx.fillStyle = flash ? '#ffffff' : `rgba(190, 242, 100, ${0.75 + charge * 0.25})`;
    ctx.shadowColor = '#d9f99d';
    ctx.shadowBlur = charge * 14;
    ctx.beginPath();
    ctx.arc(10, 0, 4 + charge * 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.strokeStyle = 'rgba(245, 245, 244, 0.7)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(13, -2); ctx.lineTo(19, -4);
    ctx.moveTo(13, 2); ctx.lineTo(18, 5);
    ctx.stroke();
  }

  const chasing = z.state === 'chase';
  ctx.fillStyle = chasing ? '#ef4444' : '#7f1d1d';
  ctx.shadowColor = '#ef4444';
  ctx.shadowBlur = chasing ? 8 : 0;
  ctx.beginPath();
  ctx.arc(4, -4, 2.5, 0, Math.PI * 2);
  ctx.arc(4, 4, 2.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  if (z.falling !== undefined) return;

  // Colossi always show their (big) health bar; others only once damaged
  if (z.type === 'brute') {
    const w = 64;
    ctx.fillStyle = 'rgba(0,0,0,0.8)';
    ctx.fillRect(z.x - w / 2 - 1, z.y - z.radius - 15, w + 2, 7);
    ctx.fillStyle = z.enraged ? '#ef4444' : '#a78bfa';
    ctx.fillRect(z.x - w / 2, z.y - z.radius - 14, (Math.max(0, z.hp) / z.maxHp) * w, 5);
    ctx.font = 'bold 9px monospace';
    ctx.textAlign = 'center';
    ctx.fillStyle = z.enraged ? '#fca5a5' : '#c4b5fd';
    ctx.fillText(z.enraged ? 'COLOSSE ENRAGÉ' : 'COLOSSE', z.x, z.y - z.radius - 19);
  } else if (z.type === 'spitter' && z.state === 'chase') {
    ctx.font = 'bold 9px monospace';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#fde047';
    ctx.fillText('CRACHEUR', z.x, z.y - z.radius - (z.hp < z.maxHp ? 15 : 8));
  }
  if (z.type !== 'brute' && z.hp < z.maxHp) {
    const w = z.radius * 2;
    ctx.fillStyle = 'rgba(0,0,0,0.7)';
    ctx.fillRect(z.x - w / 2, z.y - z.radius - 11, w, 4);
    ctx.fillStyle = z.type === 'brute' ? '#a78bfa' : '#ef4444';
    ctx.fillRect(z.x - w / 2, z.y - z.radius - 11, (z.hp / z.maxHp) * w, 4);
  }

  // Alert marker when a zombie spots the player
  if (z.alertTimer > 0) {
    ctx.save();
    ctx.globalAlpha = Math.min(1, z.alertTimer * 3);
    ctx.fillStyle = '#facc15';
    ctx.font = 'bold 18px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('!', z.x, z.y - z.radius - 16 - (0.6 - z.alertTimer) * 10);
    ctx.restore();
  }
};

// Toxic glow, plus a dashed aim line while the spitter prepares its web
const drawSpitterAura = (ctx, z, t) => {
  ctx.save();
  const pulse = 0.5 + Math.sin(t * 0.008 + z.phase) * 0.5;
  const g = ctx.createRadialGradient(z.x, z.y, z.radius * 0.5, z.x, z.y, z.radius * 2.4);
  g.addColorStop(0, `rgba(190, 242, 100, ${0.2 + pulse * 0.15})`);
  g.addColorStop(1, 'rgba(190, 242, 100, 0)');
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(z.x, z.y, z.radius * 2.4, 0, Math.PI * 2);
  ctx.fill();
  if (z.spit && z.spitAngle !== undefined) {
    const k = 1 - z.spit / SPIT.windup;
    ctx.strokeStyle = `rgba(217, 249, 157, ${0.35 + k * 0.6})`;
    ctx.lineWidth = 2 + k * 2;
    ctx.setLineDash([6, 8]);
    ctx.lineDashOffset = -t * 0.06;
    ctx.beginPath();
    ctx.moveTo(z.x + Math.cos(z.spitAngle) * z.radius, z.y + Math.sin(z.spitAngle) * z.radius);
    ctx.lineTo(z.x + Math.cos(z.spitAngle) * SPIT.maxRange, z.y + Math.sin(z.spitAngle) * SPIT.maxRange);
    ctx.stroke();
    ctx.setLineDash([]);
  }
  ctx.restore();
};

// Charge telegraph (aim line + pulsing ring), dash trail glow and rage aura for the colossus
const drawBruteAura = (ctx, z, t) => {
  const c = z.charge;
  ctx.save();
  if (z.enraged) {
    const pulse = 0.5 + Math.sin(t * 0.012) * 0.5;
    const g = ctx.createRadialGradient(z.x, z.y, z.radius * 0.6, z.x, z.y, z.radius * 2.2);
    g.addColorStop(0, `rgba(239, 68, 68, ${0.25 + pulse * 0.2})`);
    g.addColorStop(1, 'rgba(239, 68, 68, 0)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(z.x, z.y, z.radius * 2.2, 0, Math.PI * 2);
    ctx.fill();
  }
  if (c && c.phase === 'windup') {
    const locked = c.timer <= 0.15;
    ctx.strokeStyle = locked ? 'rgba(254, 202, 202, 0.95)' : 'rgba(239, 68, 68, 0.75)';
    ctx.lineWidth = locked ? 5 : 3;
    ctx.setLineDash([14, 10]);
    ctx.lineDashOffset = -t * 0.08;
    ctx.beginPath();
    ctx.moveTo(z.x + Math.cos(c.angle) * z.radius, z.y + Math.sin(c.angle) * z.radius);
    ctx.lineTo(z.x + Math.cos(c.angle) * 340, z.y + Math.sin(c.angle) * 340);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.strokeStyle = `rgba(239, 68, 68, ${0.5 + Math.sin(t * 0.04) * 0.4})`;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(z.x, z.y, z.radius + 8 + Math.sin(t * 0.04) * 4, 0, Math.PI * 2);
    ctx.stroke();
  } else if (c && c.phase === 'dash') {
    ctx.fillStyle = 'rgba(167, 139, 250, 0.35)';
    for (let i = 1; i <= 3; i++) {
      ctx.beginPath();
      ctx.arc(z.x - Math.cos(c.angle) * i * 14, z.y - Math.sin(c.angle) * i * 14, z.radius * (1 - i * 0.15), 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.restore();
};

export const drawPlayer = (ctx, player, weaponId, moving, t) => {
  const legs = moving ? Math.sin(t * 0.015) * 6 : 0;
  ctx.save();
  ctx.translate(player.x, player.y);
  if (player.invuln > 0 && Math.floor(t / 70) % 2 === 0) ctx.globalAlpha = 0.45;
  ctx.rotate(player.angle);

  ctx.fillStyle = 'rgba(0,0,0,0.5)';
  ctx.beginPath();
  ctx.ellipse(2, 3, 20, 15, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#1e293b';
  ctx.fillRect(-10 + legs, -12, 10, 6);
  ctx.fillRect(-10 - legs, 6, 10, 6);
  ctx.fillStyle = '#0f172a';
  ctx.fillRect(-12 + legs, -13, 5, 8);
  ctx.fillRect(-12 - legs, 5, 5, 8);

  ctx.fillStyle = '#2563eb';
  ctx.beginPath();
  ctx.arc(0, 0, 16, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#60a5fa';
  ctx.lineWidth = 2.5;
  ctx.stroke();
  ctx.fillStyle = '#1e3a8a';
  ctx.fillRect(-16, -9, 8, 18);

  // Recoil pushes the weapon and hands back for a few frames
  const kick = player.muzzle > 0 ? (weaponId === 'shotgun' ? 5 : 3) * Math.min(1, player.muzzle * 16) : 0;
  ctx.save();
  ctx.translate(-kick, 0);
  if (weaponId === 'knife') {
    // The swing rotates the striking arm through the slash arc
    const swing = player.swing > 0 ? Math.sin((1 - player.swing) * Math.PI) * 1.1 - 0.4 : 0;
    drawArm(ctx, [[2, -12], [9, -11]]);
    drawHand(ctx, 9, -11);
    ctx.save();
    ctx.translate(2, 11);
    ctx.rotate(-swing);
    drawArm(ctx, [[0, 0], [14, -3]]);
    drawKnife(ctx, 14, -3);
    drawHand(ctx, 14, -3);
    ctx.restore();
  } else if (weaponId === 'shotgun') {
    // Arms go under the weapon; the left elbow bends out to reach the pump
    drawArm(ctx, [[2, 12], [10, 11], [17, 6]]);
    drawArm(ctx, [[2, -12], [20, -9], [34, 1]]);
    drawShotgun(ctx);
    drawHand(ctx, 17, 6);
    drawHand(ctx, 34, 2.5);
  } else {
    drawArm(ctx, [[2, 12], [16, 3.5]]);
    drawArm(ctx, [[2, -12], [16, -2.5]]);
    drawPistol(ctx);
    drawHand(ctx, 16, 3);
    drawHand(ctx, 16.5, -2);
  }
  ctx.restore();

  ctx.fillStyle = '#0f172a';
  ctx.beginPath();
  ctx.arc(-2, 0, 10, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#334155';
  ctx.fillRect(2, -3, 5, 6);

  if (player.muzzle > 0) {
    drawMuzzleFlash(ctx, weaponId === 'shotgun' ? 51 - kick : 36 - kick, weaponId === 'shotgun' ? 2 : 0, weaponId === 'shotgun' ? 1.6 : 1, Math.min(1, player.muzzle * 12));
  }
  ctx.restore();
};

// ---------- Held weapons (drawn in the player's local frame, +x = aiming direction) ----------

const metal = (ctx, y0, y1, dark = '#334155', light = '#cbd5e1') => {
  const g = ctx.createLinearGradient(0, y0, 0, y1);
  g.addColorStop(0, dark);
  g.addColorStop(0.35, light);
  g.addColorStop(1, dark);
  return g;
};

const drawArm = (ctx, points) => {
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.beginPath();
  points.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
  ctx.strokeStyle = '#172554';
  ctx.lineWidth = 6;
  ctx.stroke();
  ctx.strokeStyle = '#2563eb';
  ctx.lineWidth = 3.5;
  ctx.stroke();
  ctx.lineCap = 'butt';
  ctx.lineJoin = 'miter';
};

const drawHand = (ctx, x, y) => {
  ctx.fillStyle = '#292524';
  ctx.beginPath();
  ctx.arc(x, y, 3.6, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#57534e';
  ctx.lineWidth = 1;
  ctx.stroke();
};

const drawPistol = (ctx) => {
  // Frame & grip (mostly hidden by the hands)
  ctx.fillStyle = '#1f2937';
  ctx.beginPath();
  ctx.roundRect(12, -2.5, 9, 6, 1.5);
  ctx.fill();
  // Slide
  ctx.fillStyle = metal(ctx, -3.5, 3.5, '#374151', '#d1d5db');
  ctx.beginPath();
  ctx.roundRect(14, -3.5, 21, 7, 1.5);
  ctx.fill();
  ctx.strokeStyle = '#111827';
  ctx.lineWidth = 1;
  ctx.stroke();
  // Rear serrations
  ctx.strokeStyle = 'rgba(17, 24, 39, 0.8)';
  for (let x = 15.5; x < 20; x += 1.5) {
    ctx.beginPath();
    ctx.moveTo(x, -3); ctx.lineTo(x, 3);
    ctx.stroke();
  }
  // Ejection port, sights and muzzle
  ctx.fillStyle = '#111827';
  ctx.fillRect(24, -3.5, 4, 2);
  ctx.fillStyle = '#f8fafc';
  ctx.fillRect(33, -0.6, 1.5, 1.2);
  ctx.fillStyle = '#030712';
  ctx.beginPath();
  ctx.arc(35, 0, 1.4, 0, Math.PI * 2);
  ctx.fill();
};

const drawShotgun = (ctx) => {
  // Wooden stock against the shoulder
  const wood = ctx.createLinearGradient(0, -3, 0, 8);
  wood.addColorStop(0, '#b45309');
  wood.addColorStop(0.5, '#78350f');
  wood.addColorStop(1, '#451a03');
  ctx.fillStyle = wood;
  ctx.beginPath();
  ctx.moveTo(1, -2); ctx.lineTo(15, -1); ctx.lineTo(15, 6); ctx.lineTo(1, 8);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = '#1c0a00';
  ctx.lineWidth = 1;
  ctx.stroke();
  // Receiver with side shell carrier
  ctx.fillStyle = metal(ctx, -1.5, 6.5, '#0f172a', '#475569');
  ctx.fillRect(14, -1.5, 11, 8);
  ['#dc2626', '#dc2626', '#dc2626'].forEach((c, i) => {
    ctx.fillStyle = c;
    ctx.fillRect(15.5 + i * 3, -3.5, 2.2, 2.5);
    ctx.fillStyle = '#facc15';
    ctx.fillRect(15.5 + i * 3, -1.5, 2.2, 0.8);
  });
  // Barrel above the magazine tube
  ctx.fillStyle = '#1e293b';
  ctx.fillRect(25, 2.5, 19, 3);
  ctx.fillStyle = metal(ctx, -0.5, 3, '#334155', '#e2e8f0');
  ctx.fillRect(25, -0.5, 26, 3.5);
  ctx.strokeStyle = '#0f172a';
  ctx.strokeRect(25, -0.5, 26, 3.5);
  // Pump with grip grooves
  ctx.fillStyle = wood;
  ctx.beginPath();
  ctx.roundRect(29, -1.8, 11, 8.6, 2);
  ctx.fill();
  ctx.strokeStyle = 'rgba(28, 10, 0, 0.8)';
  for (let x = 31; x < 39; x += 2) {
    ctx.beginPath();
    ctx.moveTo(x, -1.2); ctx.lineTo(x, 6.2);
    ctx.stroke();
  }
  // Front bead
  ctx.fillStyle = '#fbbf24';
  ctx.beginPath();
  ctx.arc(50, 1.2, 1.2, 0, Math.PI * 2);
  ctx.fill();
};

const drawKnife = (ctx, x, y) => {
  ctx.save();
  ctx.translate(x, y);
  // Handle wrapped in cord
  ctx.fillStyle = '#18181b';
  ctx.beginPath();
  ctx.roundRect(-4, -2.2, 9, 4.4, 1.5);
  ctx.fill();
  ctx.strokeStyle = '#3f3f46';
  ctx.lineWidth = 1;
  for (let k = -2; k < 5; k += 2) {
    ctx.beginPath();
    ctx.moveTo(k, -2); ctx.lineTo(k + 1, 2);
    ctx.stroke();
  }
  // Cross guard
  ctx.fillStyle = '#9ca3af';
  ctx.fillRect(5, -4, 2, 8);
  // Blade with a bright cutting edge
  const steel = ctx.createLinearGradient(0, -2.5, 0, 3);
  steel.addColorStop(0, '#f8fafc');
  steel.addColorStop(0.5, '#94a3b8');
  steel.addColorStop(1, '#475569');
  ctx.fillStyle = steel;
  ctx.shadowColor = '#7dd3fc';
  ctx.shadowBlur = 6;
  ctx.beginPath();
  ctx.moveTo(7, -2.5);
  ctx.lineTo(19, -2.5);
  ctx.quadraticCurveTo(24, -1.5, 25, 0.5);
  ctx.lineTo(7, 2.8);
  ctx.closePath();
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 0.8;
  ctx.beginPath();
  ctx.moveTo(8, 2.4); ctx.lineTo(24.5, 0.6);
  ctx.stroke();
  ctx.restore();
};

const drawMuzzleFlash = (ctx, x, y, size, alpha) => {
  ctx.save();
  ctx.translate(x, y);
  ctx.globalAlpha = alpha;
  ctx.shadowColor = '#f59e0b';
  ctx.shadowBlur = 24;
  ctx.fillStyle = '#fbbf24';
  ctx.beginPath();
  const spikes = 7;
  for (let i = 0; i <= spikes * 2; i++) {
    const a = -0.9 + (i / (spikes * 2)) * 1.8;
    const r = (i % 2 ? 7 : 18 + Math.random() * 6) * size;
    if (i === 0) ctx.moveTo(0, 0);
    ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r);
  }
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#fffbeb';
  ctx.beginPath();
  ctx.ellipse(4 * size, 0, 7 * size, 3.5 * size, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
};

// Warning on the floor while a zombie crashes through the ceiling, then the zombie itself falling in
export const drawCeilingDrop = (ctx, d, t) => {
  const k = 1 - d.timer / d.duration;
  if (!d.cracks) {
    d.cracks = Array.from({ length: 7 }, () => ({ a: Math.random() * Math.PI * 2, len: 18 + Math.random() * 22, bend: (Math.random() - 0.5) * 0.6 }));
  }
  ctx.save();
  ctx.translate(d.x, d.y);

  // Growing shadow
  ctx.fillStyle = `rgba(0, 0, 0, ${0.2 + k * 0.5})`;
  ctx.beginPath();
  ctx.ellipse(0, 0, 8 + k * 22, 6 + k * 16, 0, 0, Math.PI * 2);
  ctx.fill();

  // Plaster cracks spreading outwards
  ctx.strokeStyle = `rgba(214, 211, 209, ${0.25 + k * 0.4})`;
  ctx.lineWidth = 1.5;
  d.cracks.forEach(c => {
    const len = c.len * Math.min(1, k * 1.4);
    ctx.beginPath();
    ctx.moveTo(Math.cos(c.a) * 10, Math.sin(c.a) * 10);
    ctx.lineTo(Math.cos(c.a + c.bend) * (10 + len * 0.6), Math.sin(c.a + c.bend) * (10 + len * 0.6));
    ctx.lineTo(Math.cos(c.a) * (10 + len), Math.sin(c.a) * (10 + len));
    ctx.stroke();
  });

  // Target ring closing in, blinking faster as impact nears
  const blink = Math.sin(t * (0.015 + k * 0.03)) > -0.3;
  if (blink) {
    ctx.strokeStyle = `rgba(239, 68, 68, ${0.5 + k * 0.5})`;
    ctx.lineWidth = 3;
    ctx.setLineDash([8, 6]);
    ctx.lineDashOffset = t * 0.05;
    ctx.beginPath();
    ctx.arc(0, 0, 54 - k * 26, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = '#fca5a5';
    ctx.font = 'bold 16px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('!', 0, -60 + k * 26);
  }

  // The zombie falls in during the last part of the warning
  if (k > 0.65) {
    const kk = (k - 0.65) / 0.35;
    const scale = 1 + (1 - kk) * 1.3;
    ctx.globalAlpha = kk;
    ctx.scale(scale, scale);
    const type = ZOMBIE_TYPES[d.type];
    drawZombie(ctx, {
      type: d.type, x: 0, y: 0, radius: type.radius, hp: type.hp, maxHp: type.hp,
      angle: t * 0.004, phase: 0, hitFlash: 0, state: 'chase', alertTimer: 0,
    }, t);
  }
  ctx.restore();
};

// ---------- Spitter webs ----------

const webPattern = (ctx, radius, spokes, rings, angle) => {
  ctx.beginPath();
  for (let i = 0; i < spokes; i++) {
    const a = angle + (i / spokes) * Math.PI * 2;
    ctx.moveTo(0, 0);
    ctx.lineTo(Math.cos(a) * radius, Math.sin(a) * radius);
  }
  for (let r = 1; r <= rings; r++) {
    const rr = (radius * r) / (rings + 0.3);
    for (let i = 0; i <= spokes; i++) {
      const a = angle + (i / spokes) * Math.PI * 2;
      const sag = i % 2 ? 0.88 : 1;
      if (i === 0) ctx.moveTo(Math.cos(a) * rr, Math.sin(a) * rr);
      else ctx.lineTo(Math.cos(a) * rr * sag, Math.sin(a) * rr * sag);
    }
  }
  ctx.stroke();
};

// Sticky patch left on the floor: slows the player down
export const drawWebPatch = (ctx, w, radius, life) => {
  const alpha = Math.min(1, w.life / 1.5) * 0.75;
  ctx.save();
  ctx.translate(w.x, w.y);
  ctx.fillStyle = `rgba(217, 249, 157, ${alpha * 0.18})`;
  ctx.beginPath();
  ctx.arc(0, 0, radius, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = `rgba(245, 245, 244, ${alpha})`;
  ctx.lineWidth = 1.3;
  webPattern(ctx, radius, 9, 3, w.angle);
  ctx.restore();
};

export const drawWebShot = (ctx, w, t) => {
  ctx.save();
  ctx.translate(w.x, w.y);
  ctx.rotate(w.angle);
  ctx.strokeStyle = 'rgba(245, 245, 244, 0.6)';
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  for (let i = -1; i <= 1; i++) {
    ctx.moveTo(0, i * 2);
    ctx.quadraticCurveTo(-14, i * 6 + Math.sin(t * 0.03 + i) * 3, -26, i * 4);
  }
  ctx.stroke();
  ctx.fillStyle = '#f5f5f4';
  ctx.shadowColor = '#d9f99d';
  ctx.shadowBlur = 12;
  ctx.beginPath();
  ctx.arc(0, 0, 7, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#bef264';
  ctx.beginPath();
  ctx.arc(1, 0, 3.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
};

// Net wrapped over a rooted player, with a ring showing the time left
export const drawWebNet = (ctx, p, remaining, t) => {
  ctx.save();
  ctx.translate(p.x, p.y);
  ctx.strokeStyle = 'rgba(250, 250, 249, 0.9)';
  ctx.lineWidth = 1.6;
  webPattern(ctx, 27, 10, 3, t * 0.0004);
  ctx.strokeStyle = 'rgba(217, 249, 157, 0.95)';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(0, 0, 33, -Math.PI / 2, -Math.PI / 2 + remaining * Math.PI * 2);
  ctx.stroke();
  ctx.restore();
};
