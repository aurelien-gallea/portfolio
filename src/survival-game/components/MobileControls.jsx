import React, { useState, useRef } from 'react';
import { Crosshair, RefreshCw, Swords, Repeat } from 'lucide-react';

// Touch controls live in the side columns next to the canvas, never on top of it
export const Joystick = ({ onMove }) => {
  const [joystickPos, setJoystickPos] = useState({ x: 0, y: 0 });
  const touchIdRef = useRef(null);
  const joystickBoundsRef = useRef(null);

  const updateJoystick = (touch, rect) => {
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    const dx = touch.clientX - centerX;
    const dy = touch.clientY - centerY;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const maxDist = 40;

    const angle = Math.atan2(dy, dx);
    const limitedDist = Math.min(dist, maxDist);

    const x = Math.cos(angle) * limitedDist;
    const y = Math.sin(angle) * limitedDist;

    setJoystickPos({ x, y });

    // Normalize movement -1 to 1
    onMove({
      x: x / maxDist,
      y: y / maxDist
    });
  };

  const handleTouchStart = (e) => {
    e.preventDefault();
    if (touchIdRef.current !== null) return;
    const touch = e.changedTouches[0];
    touchIdRef.current = touch.identifier;
    const rect = e.currentTarget.getBoundingClientRect();
    joystickBoundsRef.current = rect;
    updateJoystick(touch, rect);
  };

  const handleTouchMove = (e) => {
    e.preventDefault();
    if (touchIdRef.current === null || !joystickBoundsRef.current) return;
    for (let i = 0; i < e.changedTouches.length; i++) {
      if (e.changedTouches[i].identifier === touchIdRef.current) {
        updateJoystick(e.changedTouches[i], joystickBoundsRef.current);
        break;
      }
    }
  };

  const handleTouchEnd = (e) => {
    e.preventDefault();
    if (touchIdRef.current === null) return;
    for (let i = 0; i < e.changedTouches.length; i++) {
      if (e.changedTouches[i].identifier === touchIdRef.current) {
        touchIdRef.current = null;
        setJoystickPos({ x: 0, y: 0 });
        onMove({ x: 0, y: 0 });
        break;
      }
    }
  };

  return (
    <div
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchEnd}
      className="w-[104px] h-[104px] shrink-0 rounded-full bg-black/60 border-2 border-yellow-500/50 relative flex items-center justify-center shadow-[0_0_20px_rgba(234,179,8,0.3)] touch-none select-none"
    >
      <div className="absolute inset-2 rounded-full border border-dashed border-yellow-500/30 pointer-events-none" />
      <div
        className="w-11 h-11 rounded-full bg-gradient-to-br from-yellow-400 to-amber-600 shadow-xl border-2 border-white pointer-events-none transition-transform duration-75 flex items-center justify-center text-black font-black text-[10px]"
        style={{
          transform: `translate(${joystickPos.x}px, ${joystickPos.y}px)`
        }}
      >
        🕹️
      </div>
    </div>
  );
};

const press = (handler) => (e) => { e.preventDefault(); e.stopPropagation(); handler(); };

export const ActionButtons = ({ onFire, onReload, onKnife, onSwitch }) => (
  <div className="grid grid-cols-2 gap-2 place-items-center touch-none select-none">
    {/* Weapon Switch Button */}
    <button
      type="button"
      onPointerDown={press(onSwitch)}
      className="w-11 h-11 rounded-full bg-zinc-800/80 border-2 border-yellow-500/70 text-yellow-200 flex items-center justify-center active:scale-90 shadow-lg cursor-pointer touch-none"
    >
      <Repeat size={18} />
    </button>

    {/* Reload Button */}
    <button
      type="button"
      onPointerDown={press(onReload)}
      className="w-11 h-11 rounded-full bg-blue-900/80 border-2 border-blue-500 text-blue-200 flex items-center justify-center active:scale-90 shadow-lg cursor-pointer touch-none"
    >
      <RefreshCw size={18} />
    </button>

    {/* Knife Button */}
    <button
      type="button"
      onPointerDown={press(onKnife)}
      className="w-[52px] h-[52px] rounded-full bg-sky-900/80 border-2 border-sky-400 text-sky-100 flex flex-col items-center justify-center active:scale-90 shadow-lg cursor-pointer touch-none"
    >
      <Swords size={18} />
      <span className="text-[8px] font-bold leading-none opacity-80">LAME</span>
    </button>

    {/* Big Fire / Shoot Button — shoots in movement direction */}
    <button
      type="button"
      onPointerDown={press(onFire)}
      className="w-16 h-16 rounded-full bg-gradient-to-br from-red-600 to-red-800 border-2 border-red-400 text-white flex flex-col items-center justify-center active:scale-90 shadow-2xl shadow-red-600/40 cursor-pointer touch-none gap-0.5"
    >
      <Crosshair size={24} />
      <span className="text-[9px] font-bold tracking-tight leading-none opacity-80">TIRER</span>
    </button>
  </div>
);
