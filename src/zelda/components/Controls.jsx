import React, { useRef, useState } from 'react';
import { Sword } from 'lucide-react';

// Huit secteurs de 45° autour du centre (0 = droite, sens horaire)
const SECTORS = [['right'], ['right', 'down'], ['down'], ['down', 'left'], ['left'], ['left', 'up'], ['up'], ['up', 'right']];
const BASE = 120;        // diamètre du socle en px
const TRAVEL = 42;       // course maximale de la manette
const DEADZONE = 0.28;   // en dessous, le héros ne bouge pas

const buzz = ms => { try { navigator.vibrate?.(ms); } catch { /* non supporté */ } };

// Joystick flottant : le socle apparaît là où le pouce se pose dans la zone
export const Joystick = ({ controls }) => {
  const zone = useRef(null);
  const pointer = useRef(null);
  const last = useRef('');
  const baseRef = useRef(null);
  const [base, setBase] = useState(null); // centre du socle quand le pouce est posé
  const [knob, setKnob] = useState({ x: 0, y: 0 });
  const [dirs, setDirs] = useState([]);

  const steer = (e, center) => {
    const dx = e.clientX - center.x, dy = e.clientY - center.y;
    const dist = Math.hypot(dx, dy);
    const k = dist > TRAVEL ? TRAVEL / dist : 1;
    setKnob({ x: dx * k, y: dy * k });
    const next = dist < TRAVEL * DEADZONE ? [] : SECTORS[(Math.round(Math.atan2(dy, dx) / (Math.PI / 4)) + 8) % 8];
    controls.current.dirs = next;
    if (next.join() !== last.current) {
      last.current = next.join();
      setDirs(next);
      if (next.length) buzz(6);
    }
  };

  const onDown = e => {
    if (pointer.current !== null) return;
    pointer.current = e.pointerId;
    try { e.currentTarget.setPointerCapture(e.pointerId); } catch { /* pointeur déjà relâché */ }
    const rect = zone.current.getBoundingClientRect();
    // Le socle reste entièrement dans la zone
    const center = {
      x: Math.min(Math.max(e.clientX, rect.left + BASE / 2), rect.right - BASE / 2),
      y: Math.min(Math.max(e.clientY, rect.top + BASE / 2), rect.bottom - BASE / 2),
    };
    baseRef.current = center;
    setBase(center);
    steer(e, center);
  };
  const onMove = e => {
    if (e.pointerId === pointer.current && baseRef.current) steer(e, baseRef.current);
  };
  const onUp = e => {
    if (e.pointerId !== pointer.current) return;
    pointer.current = null;
    baseRef.current = null;
    last.current = '';
    controls.current.dirs = [];
    setBase(null);
    setKnob({ x: 0, y: 0 });
    setDirs([]);
  };

  const rect = zone.current?.getBoundingClientRect();
  const center = base && rect ? { left: base.x - rect.left, top: base.y - rect.top } : null;

  return (
    <div
      ref={zone}
      className="relative w-full h-full touch-none select-none"
      onPointerDown={onDown}
      onPointerMove={onMove}
      onPointerUp={onUp}
      onPointerCancel={onUp}
    >
      <div
        className={`absolute rounded-full border-2 transition-opacity ${base ? 'border-white/30 bg-white/10 opacity-100' : 'border-white/15 bg-white/5 opacity-60'}`}
        style={{
          width: BASE, height: BASE,
          left: center ? center.left - BASE / 2 : `calc(50% - ${BASE / 2}px)`,
          top: center ? center.top - BASE / 2 : `calc(100% - ${BASE + 16}px)`,
        }}
      >
        {[['up', 'left-1/2 top-1 -translate-x-1/2', '▲'], ['down', 'left-1/2 bottom-1 -translate-x-1/2', '▼'],
          ['left', 'top-1/2 left-1.5 -translate-y-1/2', '◀'], ['right', 'top-1/2 right-1.5 -translate-y-1/2', '▶']].map(([d, cls, glyph]) => (
          <span key={d} className={`absolute text-[10px] ${cls} ${dirs.includes(d) ? 'text-emerald-300' : 'text-white/35'}`}>{glyph}</span>
        ))}
        <div
          className={`absolute left-1/2 top-1/2 w-14 h-14 -ml-7 -mt-7 rounded-full border-2 shadow-lg ${dirs.length ? 'bg-emerald-400/80 border-emerald-200/70' : 'bg-white/35 border-white/50'} ${base ? '' : 'transition-transform duration-150'}`}
          style={{ transform: `translate(${knob.x}px, ${knob.y}px)` }}
        />
      </div>
    </div>
  );
};

export const AttackButton = ({ controls }) => {
  const [pressed, setPressed] = useState(false);
  return (
    <button
      type="button"
      aria-label="Épée"
      className={`w-24 h-24 rounded-full border-4 font-black text-xs shadow-xl touch-none select-none shrink-0 flex flex-col items-center justify-center gap-0.5 transition-transform ${pressed ? 'scale-90 bg-amber-300 border-amber-100 text-black' : 'bg-amber-500/85 border-amber-300/50 text-black'}`}
      onPointerDown={e => { e.preventDefault(); controls.current.attack = true; setPressed(true); buzz(12); }}
      onPointerUp={() => setPressed(false)}
      onPointerCancel={() => setPressed(false)}
      onPointerLeave={() => setPressed(false)}
    >
      <Sword size={26} />
      ÉPÉE
    </button>
  );
};
