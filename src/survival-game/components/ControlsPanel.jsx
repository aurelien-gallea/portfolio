import React, { useEffect, useState } from 'react';
import { Keyboard, Package } from 'lucide-react';

// Each row lists the keys (lowercased KeyboardEvent.key values, or mouse ids) that trigger it
const CONTROLS = [
  { label: 'Se déplacer', keys: [['z', 'w'], ['q', 'a'], ['s'], ['d']], display: ['Z', 'Q', 'S', 'D'] },
  { label: 'Viser', keys: [['mouse-move']], display: ['Souris'] },
  { label: 'Tirer', keys: [['mouse-0'], [' ']], display: ['Clic G', 'Espace'] },
  { label: 'Couteau', keys: [['mouse-2'], ['f']], display: ['Clic D', 'F'] },
  { label: 'Changer d\'arme', keys: [['1'], ['2'], ['3'], ['wheel']], display: ['1', '2', '3', 'Molette'] },
  { label: 'Recharger', keys: [['r']], display: ['R'] },
  { label: 'Pause', keys: [['p'], ['escape']], display: ['P', 'Échap'] },
  { label: 'Couper le son', keys: [['m']], display: ['M'] },
];

const ResourceIcon = ({ type }) => {
  switch (type) {
    case 'medkit':
      return (
        <svg viewBox="0 0 24 24" className="w-6 h-6">
          <rect x="3" y="5" width="18" height="14" rx="2" fill="#f5f5f4" />
          <rect x="10" y="7.5" width="4" height="9" fill="#16a34a" />
          <rect x="7.5" y="10" width="9" height="4" fill="#16a34a" />
        </svg>
      );
    case 'ammo':
      return (
        <svg viewBox="0 0 24 24" className="w-6 h-6">
          <rect x="3" y="6" width="18" height="14" rx="2" fill="#3f6212" />
          {[6.5, 11, 15.5].map(x => (
            <g key={x}>
              <rect x={x} y="10" width="3" height="7" fill="#eab308" />
              <path d={`M${x} 10 L${x + 1.5} 6.5 L${x + 3} 10 Z`} fill="#f97316" />
            </g>
          ))}
        </svg>
      );
    case 'shells':
      return (
        <svg viewBox="0 0 24 24" className="w-6 h-6">
          <rect x="3" y="6" width="18" height="14" rx="2" fill="#7c2d12" />
          {[5.5, 10.5, 15.5].map(x => (
            <g key={x}>
              <rect x={x} y="8" width="3.5" height="7" fill="#dc2626" />
              <rect x={x} y="15" width="3.5" height="2.5" fill="#facc15" />
            </g>
          ))}
        </svg>
      );
    case 'shotgun':
      return (
        <svg viewBox="0 0 24 24" className="w-6 h-6">
          <g transform="rotate(-25 12 12)">
            <path d="M1 11 L7 10.5 L7 15 L1 16 Z" fill="#92400e" />
            <rect x="7" y="10.5" width="5" height="4" fill="#1e293b" />
            <rect x="12" y="10.5" width="11" height="2" fill="#94a3b8" />
            <rect x="13.5" y="12.2" width="5" height="3" rx="1" fill="#b45309" />
          </g>
        </svg>
      );
    case 'key':
      return (
        <svg viewBox="0 0 24 24" className="w-6 h-6">
          <circle cx="7" cy="12" r="4" fill="none" stroke="#fbbf24" strokeWidth="2.5" />
          <rect x="10" y="10.8" width="11" height="2.6" fill="#fbbf24" />
          <rect x="15" y="13" width="2" height="3.5" fill="#fbbf24" />
          <rect x="18.5" y="13" width="2" height="2.8" fill="#fbbf24" />
        </svg>
      );
    default:
      return (
        <svg viewBox="0 0 24 24" className="w-6 h-6">
          <circle cx="12" cy="12" r="9" fill="#050505" stroke="#ef4444" strokeWidth="1.5" strokeDasharray="3 2.5" />
        </svg>
      );
  }
};

const RESOURCES = [
  { type: 'medkit', label: 'Trousse de soin', detail: '+35 PV', color: 'text-green-400' },
  { type: 'ammo', label: 'Balles 9mm', detail: '+12 pour le pistolet', color: 'text-yellow-400' },
  { type: 'shells', label: 'Cartouches', detail: '+6 pour le pompe', color: 'text-orange-400' },
  { type: 'shotgun', label: 'Fusil à pompe', detail: 'Caché dans un cul-de-sac', color: 'text-orange-500' },
  { type: 'key', label: 'Clé de sortie', detail: 'Réveille la horde', color: 'text-amber-400' },
  { type: 'pit', label: 'Trou', detail: '-15 PV · piège à zombies', color: 'text-red-400' },
];

const Kbd = ({ children, active }) => (
  <kbd
    className={`inline-flex items-center justify-center min-w-[22px] h-[22px] px-1.5 rounded-md border text-[10px] font-mono font-bold transition-all duration-75 ${
      active
        ? 'bg-yellow-400 text-black border-yellow-200 shadow-[0_0_10px_rgba(250,204,21,0.6)] translate-y-px'
        : 'bg-white/5 text-gray-200 border-white/20 border-b-2'
    }`}
  >
    {children}
  </kbd>
);

const ControlsPanel = () => {
  const [pressed, setPressed] = useState(() => new Set());

  // Light up keys as the player uses them, which doubles as an input tutorial
  useEffect(() => {
    const press = (id) => setPressed(prev => (prev.has(id) ? prev : new Set(prev).add(id)));
    const release = (id) => setPressed(prev => {
      if (!prev.has(id)) return prev;
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
    const flash = (id) => {
      press(id);
      setTimeout(() => release(id), 150);
    };
    let moveTimer;
    const onKeyDown = (e) => press(e.key.toLowerCase());
    const onKeyUp = (e) => release(e.key.toLowerCase());
    const onMouseDown = (e) => press(`mouse-${e.button}`);
    const onMouseUp = (e) => release(`mouse-${e.button}`);
    const onWheel = () => flash('wheel');
    const onMouseMove = () => {
      press('mouse-move');
      clearTimeout(moveTimer);
      moveTimer = setTimeout(() => release('mouse-move'), 120);
    };
    const onBlur = () => setPressed(new Set());
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    window.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mouseup', onMouseUp);
    window.addEventListener('wheel', onWheel);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('blur', onBlur);
    return () => {
      clearTimeout(moveTimer);
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      window.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mouseup', onMouseUp);
      window.removeEventListener('wheel', onWheel);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('blur', onBlur);
    };
  }, []);

  return (
    <aside className="hidden lg:flex flex-col gap-4 w-60 xl:w-64 shrink-0 h-full overflow-y-auto border-l border-white/10 bg-gradient-to-b from-zinc-950 to-black px-4 py-5 select-none">
      <section>
        <h3 className="flex items-center gap-2 text-[11px] font-black tracking-[0.2em] text-red-500 mb-3">
          <Keyboard size={14} /> COMMANDES
        </h3>
        <ul className="space-y-2">
          {CONTROLS.map(c => (
            <li key={c.label} className="flex items-center justify-between gap-2">
              <span className="text-[11px] text-gray-400">{c.label}</span>
              <span className="flex flex-wrap justify-end gap-1">
                {c.display.map((text, i) => (
                  <Kbd key={text} active={c.keys[i].some(k => pressed.has(k))}>{text}</Kbd>
                ))}
              </span>
            </li>
          ))}
        </ul>
        <p className="mt-2 text-[10px] text-gray-500 leading-snug">Les flèches du clavier marchent aussi pour se déplacer.</p>
      </section>

      <section>
        <h3 className="flex items-center gap-2 text-[11px] font-black tracking-[0.2em] text-red-500 mb-3">
          <Package size={14} /> RESSOURCES
        </h3>
        <ul className="space-y-2">
          {RESOURCES.map(r => (
            <li key={r.type} className="flex items-center gap-2.5 rounded-lg bg-white/[0.03] border border-white/5 px-2 py-1.5">
              <ResourceIcon type={r.type} />
              <div className="leading-tight">
                <p className={`text-[11px] font-bold ${r.color}`}>{r.label}</p>
                <p className="text-[10px] text-gray-500">{r.detail}</p>
              </div>
            </li>
          ))}
        </ul>
      </section>

      <p className="mt-auto text-[10px] text-gray-600 leading-snug">
        Astuce : chaque tir fait du bruit et attire les zombies. Le couteau est silencieux.
      </p>
    </aside>
  );
};

export default ControlsPanel;
