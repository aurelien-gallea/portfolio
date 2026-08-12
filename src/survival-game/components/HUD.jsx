import React from 'react';
import { RefreshCw, Key } from 'lucide-react';

const HUD = ({ player, onReload, hasKey }) => {
  const hpPercent = (player.hp / player.maxHp) * 100;
  
  let statusText = 'FINE';
  let statusColor = 'text-green-500 border-green-500/40 bg-green-500/10';
  let pulseSpeed = 'animate-pulse';
  
  if (hpPercent <= 30) {
    statusText = 'DANGER';
    statusColor = 'text-red-500 border-red-500/40 bg-red-500/10';
  } else if (hpPercent <= 60) {
    statusText = 'CAUTION';
    statusColor = 'text-yellow-500 border-yellow-500/40 bg-yellow-500/10';
  }

  const currentWeapon = player.weapons[0] || { name: 'Pistolet 9mm', magAmmo: 12, reserveAmmo: 36 };

  return (
    <div className="absolute inset-0 pointer-events-none z-30 p-4 md:p-6 flex flex-col justify-between select-none">
      {/* Top Bar: ECG Status & Objective */}
      <div className="flex justify-between items-start gap-4">
        {/* ECG Monitor (Resident Evil style) */}
        <div className={`flex items-center gap-3 px-4 py-2.5 rounded-2xl border backdrop-blur-md ${statusColor} shadow-xl`}>
          <div className="relative w-8 h-8 flex items-center justify-center">
            <svg className={`w-full h-full ${pulseSpeed}`} viewBox="0 0 50 30" fill="none" stroke="currentColor" strokeWidth="3">
              <path d="M0 15 H15 L18 5 L22 25 L25 10 L28 20 L32 15 H50" />
            </svg>
          </div>
          <div>
            <p className="text-[10px] text-gray-400 font-mono tracking-widest uppercase">Équilibre vital</p>
            <p className="text-base font-black tracking-widest">{statusText} ({Math.max(0, Math.round(player.hp))} HP)</p>
          </div>
        </div>

        {/* Objective Badge */}
        <div className="bg-black/60 border border-white/10 backdrop-blur-md px-4 py-2 rounded-2xl flex items-center gap-2 text-xs font-mono text-gray-300 shadow-lg">
          <Key className={hasKey ? "text-yellow-400 animate-bounce" : "text-gray-500"} size={16} />
          <span>{hasKey ? "Clé récupérée ! Allez à la sortie !" : "Objectif : Trouver la clé de sortie"}</span>
        </div>
      </div>

      {/* Bottom Bar: Ammo Counter */}
      <div className="flex justify-end items-end">
        {/* Ammo Display Box */}
        <div className="bg-black/80 border border-white/10 backdrop-blur-md p-4 rounded-2xl flex items-center gap-4 shadow-2xl pointer-events-auto">
          <div className="text-right">
            <p className="text-xs text-yellow-400 font-bold tracking-wider font-mono uppercase">{currentWeapon.name}</p>
            <div className="flex items-baseline gap-1 font-mono">
              <span className="text-3xl font-black text-white">{currentWeapon.magAmmo}</span>
              <span className="text-gray-500 text-sm">/ {currentWeapon.reserveAmmo}</span>
            </div>
          </div>

          <button
            onClick={onReload}
            className="p-2.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/10 text-gray-300 hover:text-white transition-colors flex items-center justify-center cursor-pointer"
            title="Recharger (R)"
          >
            <RefreshCw size={20} className={currentWeapon.magAmmo === 0 ? "animate-spin text-red-400" : ""} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default HUD;
