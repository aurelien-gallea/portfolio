import React from 'react';
import { Key, Pause, Volume2, VolumeX, Skull, Timer, DoorOpen } from 'lucide-react';

const formatTime = (sec) => {
  const s = Math.floor(sec);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
};

const WeaponSlot = ({ weapon, active, reload, alwaysShow = false }) => {
  const isKnife = weapon.id === 'knife';
  const empty = !isKnife && weapon.owned && weapon.mag === 0;
  return (
    <div
      className={`relative overflow-hidden rounded-xl border px-2.5 py-1.5 min-w-[74px] md:min-w-[92px] transition-all ${active || alwaysShow ? '' : 'hidden lg:block'} ${
        !weapon.owned
          ? 'border-white/5 bg-black/50 opacity-40'
          : active
            ? 'border-yellow-400/70 bg-black/85 shadow-lg shadow-yellow-500/20 scale-105'
            : 'border-white/10 bg-black/70'
      }`}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="text-[9px] font-mono text-gray-500">{weapon.slot}</span>
        <span className={`text-[9px] md:text-[10px] font-bold tracking-wider font-mono ${active ? 'text-yellow-400' : 'text-gray-400'}`}>
          {weapon.owned ? weapon.short : '???'}
        </span>
      </div>
      <div className="font-mono text-right leading-tight">
        {isKnife ? (
          <span className="text-sm md:text-base font-black text-gray-200">∞</span>
        ) : weapon.owned ? (
          <>
            <span className={`text-sm md:text-lg font-black ${empty ? 'text-red-400' : 'text-white'}`}>{weapon.mag}</span>
            <span className="text-[10px] md:text-xs text-gray-400"> / {weapon.reserve}</span>
          </>
        ) : (
          <span className="text-[10px] text-gray-500">à trouver</span>
        )}
      </div>
      {active && reload !== null && (
        <div className="absolute left-0 bottom-0 h-1 bg-sky-400" style={{ width: `${reload * 100}%` }} />
      )}
    </div>
  );
};

export const HealthCard = ({ hud, className = '' }) => {
  const hpPercent = Math.max(0, (hud.hp / hud.maxHp) * 100);
  const hpTone = hpPercent <= 30 ? 'red' : hpPercent <= 60 ? 'yellow' : 'green';
  const tones = {
    green: { bar: 'bg-green-500', text: 'text-green-400', border: 'border-green-500/40' },
    yellow: { bar: 'bg-yellow-500', text: 'text-yellow-400', border: 'border-yellow-500/40' },
    red: { bar: 'bg-red-500', text: 'text-red-400', border: 'border-red-500/60' },
  }[hpTone];

  return (
    <div className={`px-3 py-1.5 rounded-xl border backdrop-blur-md bg-black/80 ${tones.border} shadow-md ${hpPercent <= 30 ? 'animate-pulse' : ''} ${className}`}>
      <div className="flex justify-between items-center gap-3 min-w-[96px] md:min-w-[130px]">
        <span className="text-[10px] text-gray-400 font-mono uppercase tracking-wider">❤️ Vie</span>
        <span className={`text-xs font-black font-mono ${tones.text}`}>{Math.round(hud.hp)}</span>
      </div>
      <div className="w-full h-2 mt-1 bg-white/10 rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all duration-300 ${tones.bar}`} style={{ width: `${hpPercent}%` }} />
      </div>
    </div>
  );
};

export const ScoreChip = ({ hud, className = '' }) => (
  <div className={`bg-black/75 border border-yellow-500/30 backdrop-blur-md px-3 py-1.5 rounded-xl shadow-md font-mono ${className}`}>
    <div className="text-xs font-black text-yellow-400">⭐ {hud.score}</div>
    <div className="text-[10px] text-gray-400 flex items-center gap-1">
      <Skull size={10} /> {hud.kills} · x{hud.multiplier}
    </div>
  </div>
);

// Compact objective for the touch sidebar: key/exit, zombies left, timer
export const CompactObjective = ({ hud }) => (
  <div className={`w-full px-2.5 py-1.5 rounded-xl border font-mono text-[10px] leading-snug ${
    hud.hasKey ? 'bg-green-950/80 border-green-500/50 text-green-300' : 'bg-black/75 border-white/10 text-gray-200'
  }`}>
    <div className="font-bold">{hud.hasKey ? '🔓 SORTIE !' : '🔑 TROUVER LA CLÉ'}</div>
    <div className="flex justify-between text-gray-400">
      <span className={`flex items-center gap-1 ${hud.hordeActive ? 'text-red-400' : ''}`}><Skull size={10} /> {hud.zombiesLeft}</span>
      <span className="flex items-center gap-1"><Timer size={10} /> {formatTime(hud.time)}</span>
    </div>
  </div>
);

export const SystemButtons = ({ hud, onPause, onToggleMute }) => (
  <div className="flex items-center gap-2">
    <button
      onClick={onToggleMute}
      className="pointer-events-auto p-2 rounded-xl bg-black/75 hover:bg-white/20 text-white border border-white/10 shadow-md transition-all cursor-pointer active:scale-95"
      title="Son (M)"
    >
      {hud.muted ? <VolumeX size={16} /> : <Volume2 size={16} />}
    </button>
    <button
      onClick={onPause}
      className="pointer-events-auto p-2 rounded-xl bg-black/75 hover:bg-white/20 text-white border border-white/10 shadow-md transition-all cursor-pointer active:scale-95"
      title="Pause (P / Echap)"
    >
      <Pause size={16} />
    </button>
  </div>
);

export const ActiveWeapon = ({ hud }) => {
  const weapon = hud.weapons.find(w => w.id === hud.active);
  return weapon ? <WeaponSlot weapon={weapon} active reload={hud.reload} /> : null;
};

// Rooted by a spitter's web
export const RootedBanner = ({ hud }) => hud.rooted > 0 && (
  <div className="absolute left-1/2 top-[62%] -translate-x-1/2 z-30 pointer-events-none flex flex-col items-center gap-1 px-4 py-2 rounded-xl border border-lime-300/60 bg-black/80 backdrop-blur-md shadow-lg shadow-lime-400/20 animate-pulse whitespace-nowrap">
    <span className="text-sm font-black tracking-widest text-lime-200">🕸️ ENGLUÉ ! {hud.rooted.toFixed(1)}s</span>
    <span className="text-[10px] font-mono text-gray-300">Couteau (F / Lame) pour couper la toile</span>
  </div>
);

// Desktop HUD, overlaid on the canvas letterbox
const HUD = ({ hud, onPause, onToggleMute }) => (
  <div className="absolute inset-0 pointer-events-none z-30 p-2 md:p-3 flex flex-col justify-between select-none">
    <div className="flex justify-between items-start gap-2">
      <div className="flex items-center gap-2">
        <HealthCard hud={hud} />
        <ScoreChip hud={hud} />
      </div>

      {/* Objective */}
      <div className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border backdrop-blur-md shadow-md font-mono text-[11px] ${
        hud.hasKey ? 'bg-green-950/80 border-green-500/50 text-green-300' : 'bg-black/75 border-white/10 text-gray-200'
      }`}>
        {hud.hasKey ? <DoorOpen size={14} className="text-green-400" /> : <Key size={14} className="text-yellow-400" />}
        <span>{hud.hasKey ? 'Rejoignez la sortie !' : 'Trouvez la clé de sortie'}</span>
        <span className="text-gray-500">|</span>
        <span className={`flex items-center gap-1 ${hud.hordeActive ? 'text-red-400' : 'text-gray-400'}`}>
          <Skull size={12} /> {hud.zombiesLeft}
        </span>
        <span className="text-gray-500">|</span>
        <span className="flex items-center gap-1 text-gray-400"><Timer size={12} /> {formatTime(hud.time)}</span>
      </div>

      <SystemButtons hud={hud} onPause={onPause} onToggleMute={onToggleMute} />
    </div>

    <RootedBanner hud={hud} />

    <div className="flex justify-end items-end">
      <div className="flex gap-1.5 md:gap-2 backdrop-blur-sm">
        {hud.weapons.map(w => (
          <WeaponSlot key={w.id} weapon={w} active={hud.active === w.id} reload={hud.reload} alwaysShow />
        ))}
      </div>
    </div>
  </div>
);

export default HUD;
