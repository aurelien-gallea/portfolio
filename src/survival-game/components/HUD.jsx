import React, { useEffect } from 'react';
import { RefreshCw, Key, Pause } from 'lucide-react';

const HUD = ({ player, onReload, onPause, hasKey, score = 0, kills = 0, multiplier = 1.0 }) => {
  const hpPercent = (player.hp / player.maxHp) * 100;

  // Listen for 'P' or 'Escape' key to pause
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'p' || e.key === 'P' || e.key === 'Escape') {
        if (onPause) onPause();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onPause]);

  let statusText = 'FINE';
  let statusColor = 'text-green-400 border-green-500/30 bg-black/75';
  let pulseSpeed = 'animate-pulse';
  
  if (hpPercent <= 30) {
    statusText = 'DANGER';
    statusColor = 'text-red-400 border-red-500/40 bg-black/85';
  } else if (hpPercent <= 60) {
    statusText = 'CAUTION';
    statusColor = 'text-yellow-400 border-yellow-500/40 bg-black/80';
  }

  const currentWeapon = player.weapons[0] || { name: 'Pistolet 9mm', magAmmo: 12, reserveAmmo: 36 };

  return (
    <div className="absolute inset-0 pointer-events-none z-30 p-2 md:p-4 flex flex-col justify-between select-none">
      {/* Top Bar: Ultra Compact Status & Objective */}
      <div className="flex justify-between items-center gap-2">
        {/* Left Side: Health & Score Pills */}
        <div className="flex items-center gap-2">
          {/* ECG Health Pill */}
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border backdrop-blur-md ${statusColor} shadow-md`}>
            <div className="w-5 h-5 flex items-center justify-center">
              <svg className={`w-full h-full ${pulseSpeed}`} viewBox="0 0 50 30" fill="none" stroke="currentColor" strokeWidth="4">
                <path d="M0 15 H15 L18 5 L22 25 L25 10 L28 20 L32 15 H50" />
              </svg>
            </div>
            <span className="text-xs font-mono font-bold tracking-tight">
              {Math.max(0, Math.round(player.hp))} HP
            </span>
          </div>

          {/* Live Score Pill */}
          <div className="bg-black/75 border border-yellow-500/30 backdrop-blur-md px-3 py-1.5 rounded-xl flex items-center gap-1.5 shadow-md">
            <span className="text-xs">⭐</span>
            <span className="text-xs font-black font-mono text-yellow-400">
              {score} <span className="text-[10px] text-gray-400 font-normal">({multiplier}x)</span>
            </span>
          </div>
        </div>

        {/* Right Side: Objective & Pause Button */}
        <div className="flex items-center gap-2">
          {/* Objective Badge */}
          <div className="bg-black/75 border border-white/10 backdrop-blur-md px-3 py-1.5 rounded-xl flex items-center gap-1.5 text-[11px] font-mono text-gray-200 shadow-md">
            <Key className={hasKey ? "text-yellow-400 animate-bounce" : "text-gray-500"} size={14} />
            <span className="hidden sm:inline">{hasKey ? "Clé OK ! Allez à la sortie !" : "Trouver la clé"}</span>
            <span className="sm:hidden">{hasKey ? "🔓 SORTIE !" : "🔒 CLÉ"}</span>
          </div>

          {/* Pause Button */}
          <button
            onClick={onPause}
            className="pointer-events-auto p-2 rounded-xl bg-black/75 hover:bg-white/20 text-white border border-white/10 shadow-md transition-all flex items-center justify-center cursor-pointer active:scale-95"
            title="Pause (P / Echap)"
          >
            <Pause size={16} />
          </button>
        </div>
      </div>

      {/* Bottom Bar: Compact Ammo Counter */}
      <div className="flex justify-end items-end">
        <div className="bg-black/80 border border-white/10 backdrop-blur-md px-3 py-2 rounded-xl flex items-center gap-3 shadow-xl pointer-events-auto">
          <div className="text-right">
            <p className="text-[10px] text-yellow-400 font-bold tracking-wider font-mono uppercase">{currentWeapon.name}</p>
            <div className="flex items-baseline gap-1 font-mono">
              <span className="text-xl font-black text-white">{currentWeapon.magAmmo}</span>
              <span className="text-gray-400 text-xs">/ {currentWeapon.reserveAmmo}</span>
            </div>
          </div>

          <button
            onClick={onReload}
            className="p-2 rounded-lg bg-white/10 hover:bg-white/20 border border-white/10 text-gray-300 hover:text-white transition-colors flex items-center justify-center cursor-pointer"
            title="Recharger (R)"
          >
            <RefreshCw size={16} className={currentWeapon.magAmmo === 0 ? "animate-spin text-red-400" : ""} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default HUD;
