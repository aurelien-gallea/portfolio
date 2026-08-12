import React, { useState, useRef } from 'react';
import { Crosshair, RefreshCw } from 'lucide-react';

const MobileControls = ({ onMove, onFire, onReload }) => {
  const [joystickPos, setJoystickPos] = useState({ x: 0, y: 0 });
  const touchIdRef = useRef(null);
  const joystickBoundsRef = useRef(null);

  const updateJoystick = (touch, rect) => {
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

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
    <div className="absolute inset-0 pointer-events-none z-40 flex justify-between items-end p-4 md:p-6 select-none touch-none overflow-hidden">
      {/* Left Virtual Joystick - Bottom Left */}
      <div 
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onTouchCancel={handleTouchEnd}
        className="w-28 h-28 md:w-32 md:h-32 rounded-full bg-black/60 border-2 border-yellow-500/50 backdrop-blur-md pointer-events-auto relative flex items-center justify-center shadow-[0_0_20px_rgba(234,179,8,0.3)] touch-none"
      >
        <div className="absolute inset-2 rounded-full border border-dashed border-yellow-500/30 pointer-events-none" />
        <div 
          className="w-12 h-12 md:w-14 md:h-14 rounded-full bg-gradient-to-br from-yellow-400 to-amber-600 shadow-xl border-2 border-white pointer-events-none transition-transform duration-75 flex items-center justify-center text-black font-black text-[10px]"
          style={{
            transform: `translate(${joystickPos.x}px, ${joystickPos.y}px)`
          }}
        >
          🕹️
        </div>
      </div>

      {/* Right Touch Action Buttons */}
      <div className="flex flex-col gap-3 items-end pointer-events-auto touch-none">
        <div className="flex gap-3">
          {/* Reload */}
          <button
            onTouchStart={(e) => { e.preventDefault(); onReload(); }}
            onClick={onReload}
            className="w-12 h-12 rounded-full bg-blue-900/80 border border-blue-500 text-blue-200 flex items-center justify-center active:scale-95 shadow-lg cursor-pointer touch-none"
          >
            <RefreshCw size={20} />
          </button>
        </div>

        {/* Big Fire / Shoot Button */}
        <button
          onTouchStart={(e) => { e.preventDefault(); onFire(); }}
          onClick={onFire}
          className="w-20 h-20 rounded-full bg-gradient-to-br from-red-600 to-red-800 border-2 border-red-400 text-white flex items-center justify-center active:scale-90 shadow-2xl shadow-red-600/40 cursor-pointer touch-none"
        >
          <Crosshair size={32} />
        </button>
      </div>
    </div>
  );
};

export default MobileControls;
