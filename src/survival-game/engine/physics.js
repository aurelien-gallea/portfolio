// Collision, line of sight and path-finding helpers shared by the player and the zombies.

import { MAP_W, MAP_H } from './config';

// Pushes a circle out of every rectangle it overlaps. Returns true when a collision happened.
const resolveCircle = (ent, radius, rects) => {
  let hit = false;
  for (const r of rects) {
    const cx = Math.max(r.x, Math.min(ent.x, r.x + r.w));
    const cy = Math.max(r.y, Math.min(ent.y, r.y + r.h));
    const dx = ent.x - cx;
    const dy = ent.y - cy;
    const d2 = dx * dx + dy * dy;
    if (d2 >= radius * radius) continue;
    hit = true;
    if (d2 > 0.0001) {
      const d = Math.sqrt(d2);
      ent.x += (dx / d) * (radius - d);
      ent.y += (dy / d) * (radius - d);
    } else {
      // Center inside the rectangle: exit through the closest side
      const left = ent.x - r.x, right = r.x + r.w - ent.x;
      const top = ent.y - r.y, bottom = r.y + r.h - ent.y;
      const m = Math.min(left, right, top, bottom);
      if (m === left) ent.x = r.x - radius;
      else if (m === right) ent.x = r.x + r.w + radius;
      else if (m === top) ent.y = r.y - radius;
      else ent.y = r.y + r.h + radius;
    }
  }
  return hit;
};

// Moves one axis at a time so entities slide along walls instead of sticking to them
export const moveCircle = (ent, dx, dy, radius, rects) => {
  ent.x += dx;
  const hitX = resolveCircle(ent, radius, rects);
  ent.y += dy;
  const hitY = resolveCircle(ent, radius, rects);
  return hitX || hitY;
};

export const pointInRect = (x, y, r) => x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h;

// Slab test between segment (x1,y1)-(x2,y2) and an axis-aligned rectangle
const segmentHitsRect = (x1, y1, x2, y2, r) => {
  let tMin = 0;
  let tMax = 1;
  const dx = x2 - x1;
  const dy = y2 - y1;
  const axes = [[dx, x1, r.x, r.x + r.w], [dy, y1, r.y, r.y + r.h]];
  for (const [d, p, lo, hi] of axes) {
    if (Math.abs(d) < 1e-9) {
      if (p < lo || p > hi) return false;
    } else {
      let t1 = (lo - p) / d;
      let t2 = (hi - p) / d;
      if (t1 > t2) [t1, t2] = [t2, t1];
      tMin = Math.max(tMin, t1);
      tMax = Math.min(tMax, t2);
      if (tMin > tMax) return false;
    }
  }
  return true;
};

export const hasLineOfSight = (x1, y1, x2, y2, rects) => !rects.some(r => segmentHitsRect(x1, y1, x2, y2, r));

// Distance along a ray until it meets a rectangle (used for the aiming laser)
export const rayLength = (x, y, angle, maxLen, rects) => {
  let lo = 0;
  let hi = maxLen;
  const ex = x + Math.cos(angle) * maxLen;
  const ey = y + Math.sin(angle) * maxLen;
  if (hasLineOfSight(x, y, ex, ey, rects)) return maxLen;
  for (let i = 0; i < 10; i++) {
    const mid = (lo + hi) / 2;
    if (hasLineOfSight(x, y, x + Math.cos(angle) * mid, y + Math.sin(angle) * mid, rects)) lo = mid;
    else hi = mid;
  }
  return lo;
};

// ---- Flow field: breadth-first distances from the player over a coarse grid ----

export const NAV_CELL = 20;
const NAV_COLS = Math.ceil(MAP_W / NAV_CELL);
const NAV_ROWS = Math.ceil(MAP_H / NAV_CELL);

export const buildNavGrid = (rects, pits, clearance = 13) => {
  const blocked = new Uint8Array(NAV_COLS * NAV_ROWS);
  for (let row = 0; row < NAV_ROWS; row++) {
    for (let col = 0; col < NAV_COLS; col++) {
      const cx = col * NAV_CELL + NAV_CELL / 2;
      const cy = row * NAV_CELL + NAV_CELL / 2;
      const nearRect = rects.some(r =>
        cx > r.x - clearance && cx < r.x + r.w + clearance && cy > r.y - clearance && cy < r.y + r.h + clearance
      );
      // Path-finding avoids pits; only zombies charging in a straight line fall into them
      const nearPit = pits.some(p => Math.hypot(cx - p.x, cy - p.y) < p.radius + 8);
      if (nearRect || nearPit) blocked[row * NAV_COLS + col] = 1;
    }
  }
  return { blocked, dist: new Int32Array(NAV_COLS * NAV_ROWS), queue: new Int32Array(NAV_COLS * NAV_ROWS) };
};

const cellIndex = (x, y) => {
  const col = Math.max(0, Math.min(NAV_COLS - 1, Math.floor(x / NAV_CELL)));
  const row = Math.max(0, Math.min(NAV_ROWS - 1, Math.floor(y / NAV_CELL)));
  return row * NAV_COLS + col;
};

export const updateFlowField = (nav, x, y) => {
  const { blocked, dist, queue } = nav;
  dist.fill(-1);
  const start = cellIndex(x, y);
  let head = 0;
  let tail = 0;
  dist[start] = 0;
  queue[tail++] = start;
  while (head < tail) {
    const i = queue[head++];
    const col = i % NAV_COLS;
    const row = (i - col) / NAV_COLS;
    const d = dist[i] + 1;
    if (col > 0 && dist[i - 1] < 0 && !blocked[i - 1]) { dist[i - 1] = d; queue[tail++] = i - 1; }
    if (col < NAV_COLS - 1 && dist[i + 1] < 0 && !blocked[i + 1]) { dist[i + 1] = d; queue[tail++] = i + 1; }
    if (row > 0 && dist[i - NAV_COLS] < 0 && !blocked[i - NAV_COLS]) { dist[i - NAV_COLS] = d; queue[tail++] = i - NAV_COLS; }
    if (row < NAV_ROWS - 1 && dist[i + NAV_COLS] < 0 && !blocked[i + NAV_COLS]) { dist[i + NAV_COLS] = d; queue[tail++] = i + NAV_COLS; }
  }
};

// Path distance (in pixels) from a point to the player, or Infinity when unreachable
export const pathDistance = (nav, x, y) => {
  const d = nav.dist[cellIndex(x, y)];
  return d < 0 ? Infinity : d * NAV_CELL;
};

// Direction (unit vector) a zombie should follow to get closer to the player
export const flowDirection = (nav, x, y) => {
  const { dist, blocked } = nav;
  const i = cellIndex(x, y);
  const col = i % NAV_COLS;
  const row = (i - col) / NAV_COLS;
  let best = dist[i] >= 0 ? dist[i] : Infinity;
  let bx = 0;
  let by = 0;
  for (let oy = -1; oy <= 1; oy++) {
    for (let ox = -1; ox <= 1; ox++) {
      if (!ox && !oy) continue;
      const c = col + ox;
      const r = row + oy;
      if (c < 0 || r < 0 || c >= NAV_COLS || r >= NAV_ROWS) continue;
      const j = r * NAV_COLS + c;
      if (dist[j] < 0 || blocked[j]) continue;
      // No corner cutting through blocked diagonals
      if (ox && oy && (blocked[row * NAV_COLS + c] || blocked[r * NAV_COLS + col])) continue;
      const score = dist[j] + (ox && oy ? 0.4 : 0);
      if (score < best) {
        best = score;
        bx = c * NAV_CELL + NAV_CELL / 2;
        by = r * NAV_CELL + NAV_CELL / 2;
      }
    }
  }
  if (best === Infinity || (!bx && !by)) return null;
  const dx = bx - x;
  const dy = by - y;
  const len = Math.hypot(dx, dy) || 1;
  return { x: dx / len, y: dy / len };
};
