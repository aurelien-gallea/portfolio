import React, { useRef, useState } from 'react';

// Croix directionnelle : on peut glisser le doigt d'une direction à l'autre
export const DPad = ({ controls }) => {
  const ref = useRef(null);
  const [active, setActive] = useState(null);

  const update = e => {
    const rect = ref.current.getBoundingClientRect();
    const dx = e.clientX - (rect.left + rect.width / 2);
    const dy = e.clientY - (rect.top + rect.height / 2);
    const dir = Math.hypot(dx, dy) < 10 ? null
      : Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : (dy > 0 ? 'down' : 'up');
    controls.current.dir = dir;
    setActive(dir);
  };
  const release = () => {
    controls.current.dir = null;
    setActive(null);
  };

  const arm = (dir, cls) => (
    <div className={`absolute w-12 h-12 rounded-lg border border-white/15 flex items-center justify-center text-white/70 text-lg ${cls} ${active === dir ? 'bg-emerald-500/60' : 'bg-white/10'}`}>
      {{ up: '▲', down: '▼', left: '◀', right: '▶' }[dir]}
    </div>
  );

  return (
    <div
      ref={ref}
      className="relative w-36 h-36 touch-none select-none shrink-0"
      onPointerDown={e => { e.currentTarget.setPointerCapture(e.pointerId); update(e); }}
      onPointerMove={e => { if (e.buttons || e.pointerType === 'touch') update(e); }}
      onPointerUp={release}
      onPointerCancel={release}
    >
      {arm('up', 'left-12 top-0')}
      {arm('down', 'left-12 bottom-0')}
      {arm('left', 'left-0 top-12')}
      {arm('right', 'right-0 top-12')}
      <div className="absolute left-12 top-12 w-12 h-12 rounded-lg bg-white/5" />
    </div>
  );
};

export const AttackButton = ({ controls }) => (
  <button
    type="button"
    className="w-20 h-20 rounded-full bg-amber-500/80 active:bg-amber-400 border-4 border-amber-300/40 text-black font-black text-sm shadow-lg touch-none select-none shrink-0"
    onPointerDown={e => { e.preventDefault(); controls.current.attack = true; }}
  >
    ÉPÉE
  </button>
);
