import React, { useState } from 'react';
import { Crosshair, RefreshCw, Shield, Swords } from 'lucide-react';

const MobileControls = ({ onMove, onFire, onReload, onQuickKnife, onNextWeapon }) => {
  const [joystickPos, setJoystickPos] = useState({ x: 0, y: 0 });
  const [activeTouch, setActiveTouch] = useState(false);

  const handleTouchStart = (e) => {
    setActiveTouch(true);
    handleTouchMove(e);
  };

  const handleTouchMove = (e) => {
    const touch = e.touches[0];
    const target = e.currentTarget.getBoundingClientRect();
    const centerX = target.left + target.width / 2;
    const centerY = target.top + target.height / 2;

    const dx = touch.clientX - centerX;
    const dy = touch.clientY - centerY;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const maxDist = 45;

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

  const handleTouchEnd = () => {
    setActiveTouch(false);
    setJoystickPos({ x: 0, y: 0 });
    onMove({ x: 0, y: 0 });
  };

  return (
    <div className="absolute inset-0 pointer-events-none z-40 flex justify-between items-end p-6 select-none md:hidden">
      {/* Left Virtual Joystick */}
      <div 
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        className="w-32 h-32 rounded-full bg-white/10 border-2 border-white/20 backdrop-blur-sm pointer-events-auto relative flex items-center justify-center shadow-2xl"
      >
        <div 
          className="w-14 h-14 rounded-full bg-gradient-to-br from-yellow-400 to-amber-600 shadow-lg border border-yellow-200 pointer-events-none transition-transform duration-75"
          style={{
            transform: `translate(${joystickPos.x}px, ${joystickPos.y}px)`
          }}
        />
      </div>

      {/* Right Touch Action Buttons */}
      <div className="flex flex-col gap-3 items-end pointer-events-auto">
        <div className="flex gap-3">
          {/* Quick Knife */}
          <button
            onTouchStart={(e) => { e.preventDefault(); onQuickKnife(); }}
            onClick={onQuickKnife}
            className="w-12 h-12 rounded-full bg-stone-800/80 border border-stone-500 text-stone-200 flex items-center justify-center active:scale-95 shadow-lg"
          >
            <Swords size={20} />
          </button>

          {/* Reload */}
          <button
            onTouchStart={(e) => { e.preventDefault(); onReload(); }}
            onClick={onReload}
            className="w-12 h-12 rounded-full bg-blue-900/80 border border-blue-500 text-blue-200 flex items-center justify-center active:scale-95 shadow-lg"
          >
            <RefreshCw size={20} />
          </button>
        </div>

        {/* Big Fire / Shoot Button */}
        <button
          onTouchStart={(e) => { e.preventDefault(); onFire(); }}
          onClick={onFire}
          className="w-20 h-20 rounded-full bg-gradient-to-br from-red-600 to-red-800 border-2 border-red-400 text-white flex items-center justify-center active:scale-90 shadow-2xl shadow-red-600/40"
        >
          <Crosshair size={32} />
        </button>
      </div>
    </div>
  );
};

export default MobileControls;
