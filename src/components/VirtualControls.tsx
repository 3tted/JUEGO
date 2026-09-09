import React, { useRef } from 'react';
import { Crosshair, Shield, Zap, Wind, RotateCcw } from 'lucide-react';

interface VirtualControlsProps {
  onMove: (dx: number, dy: number) => void;
  onStopMove: () => void;
  onShoot: () => void;
  onDash: () => void;
  onReload: () => void;
  onInteract: () => void;
}

export const VirtualControls: React.FC<VirtualControlsProps> = ({
  onMove,
  onStopMove,
  onShoot,
  onDash,
  onReload,
  onInteract,
}) => {
  const joystickRef = useRef<HTMLDivElement>(null);
  const touchIdRef = useRef<number | null>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    if (touchIdRef.current !== null) return;
    const touch = e.changedTouches[0];
    touchIdRef.current = touch.identifier;
    updateJoystick(touch.clientX, touch.clientY);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    for (let i = 0; i < e.changedTouches.length; i++) {
      const touch = e.changedTouches[i];
      if (touch.identifier === touchIdRef.current) {
        updateJoystick(touch.clientX, touch.clientY);
        break;
      }
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    for (let i = 0; i < e.changedTouches.length; i++) {
      const touch = e.changedTouches[i];
      if (touch.identifier === touchIdRef.current) {
        touchIdRef.current = null;
        onStopMove();
        break;
      }
    }
  };

  const updateJoystick = (clientX: number, clientY: number) => {
    if (!joystickRef.current) return;
    const rect = joystickRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    const dx = clientX - centerX;
    const dy = clientY - centerY;
    const dist = Math.hypot(dx, dy);
    const maxRadius = rect.width / 2;

    const normX = dist === 0 ? 0 : (dx / dist) * Math.min(1, dist / maxRadius);
    const normY = dist === 0 ? 0 : (dy / dist) * Math.min(1, dist / maxRadius);

    onMove(normX, normY);
  };

  return (
    <div className="absolute inset-0 pointer-events-none z-30 flex justify-between items-end p-4 md:hidden select-none">
      {/* Virtual D-Pad / Joystick */}
      <div
        ref={joystickRef}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onTouchCancel={handleTouchEnd}
        className="pointer-events-auto w-28 h-28 rounded-full bg-slate-900/60 border-2 border-cyan-500/40 backdrop-blur flex items-center justify-center active:border-cyan-400"
      >
        <div className="w-10 h-10 rounded-full bg-cyan-500/40 border border-cyan-300" />
      </div>

      {/* Action Buttons */}
      <div className="pointer-events-auto flex flex-col gap-2 items-end">
        <div className="flex gap-2">
          <button
            onTouchStart={(e) => {
              e.preventDefault();
              onInteract();
            }}
            className="w-12 h-12 rounded-full bg-emerald-600/80 border border-emerald-400 text-white font-mono font-bold text-xs flex items-center justify-center active:scale-90"
          >
            [E]
          </button>
          <button
            onTouchStart={(e) => {
              e.preventDefault();
              onReload();
            }}
            className="w-12 h-12 rounded-full bg-slate-800/80 border border-slate-600 text-cyan-300 flex items-center justify-center active:scale-90"
          >
            <RotateCcw className="w-5 h-5" />
          </button>
        </div>

        <div className="flex gap-2">
          <button
            onTouchStart={(e) => {
              e.preventDefault();
              onDash();
            }}
            className="w-14 h-14 rounded-full bg-cyan-600/80 border border-cyan-300 text-slate-950 font-bold flex items-center justify-center active:scale-90"
          >
            <Wind className="w-6 h-6" />
          </button>
          <button
            onTouchStart={(e) => {
              e.preventDefault();
              onShoot();
            }}
            className="w-16 h-16 rounded-full bg-rose-600/90 border-2 border-rose-300 text-white font-bold flex items-center justify-center active:scale-90 shadow-lg shadow-rose-950/50"
          >
            <Crosshair className="w-7 h-7" />
          </button>
        </div>
      </div>
    </div>
  );
};
