import React, { useRef, useState, useCallback, useEffect } from 'react';
import { Crosshair, Wind, RotateCcw, ArrowRightLeft } from 'lucide-react';

interface VirtualControlsProps {
  onMove: (dx: number, dy: number) => void;
  onStopMove: () => void;
  onShootVector: (dx: number, dy: number) => void;
  onStopShoot: () => void;
  onDash: () => void;
  onReload: () => void;
  onInteract: () => void;
  onPickupWeapon?: () => void;
  onSwitchWeaponSlot?: (slot: 1 | 2) => void;
  activeWeaponSlot?: 1 | 2;
  hasSecondWeapon?: boolean;
}

export const VirtualControls: React.FC<VirtualControlsProps> = ({
  onMove,
  onStopMove,
  onShootVector,
  onStopShoot,
  onDash,
  onReload,
  onInteract,
  onPickupWeapon,
  onSwitchWeaponSlot,
  activeWeaponSlot = 1,
  hasSecondWeapon = false,
}) => {
  // Mobile / Phone Device Detection: strictly hidden on desktop (mouse/keyboard), active on phones/tablets
  const [isMobileDevice, setIsMobileDevice] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    const isTouch = 'ontouchstart' in window || (typeof navigator !== 'undefined' && navigator.maxTouchPoints > 0);
    const isCoarse = typeof window.matchMedia === 'function' && window.matchMedia('(pointer: coarse)').matches;
    const isMobileUA = typeof navigator !== 'undefined' && /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    return isMobileUA || (isTouch && isCoarse) || (isTouch && window.innerWidth <= 1024);
  });

  useEffect(() => {
    const checkDevice = () => {
      if (typeof window === 'undefined') return;
      const isTouch = 'ontouchstart' in window || (typeof navigator !== 'undefined' && navigator.maxTouchPoints > 0);
      const isCoarse = typeof window.matchMedia === 'function' && window.matchMedia('(pointer: coarse)').matches;
      const isMobileUA = typeof navigator !== 'undefined' && /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

      const isPhone = isMobileUA || (isTouch && isCoarse) || (isTouch && window.innerWidth <= 1024);
      setIsMobileDevice(Boolean(isPhone));
    };

    checkDevice();
    window.addEventListener('resize', checkDevice);

    // If the user taps the screen with a touch gesture, immediately activate touch HUD
    const onTouch = () => {
      setIsMobileDevice(true);
    };
    window.addEventListener('touchstart', onTouch, { once: true, passive: true });

    return () => {
      window.removeEventListener('resize', checkDevice);
      window.removeEventListener('touchstart', onTouch);
    };
  }, []);

  // Move Joystick (Left)
  const moveStickRef = useRef<HTMLDivElement>(null);
  const moveTouchIdRef = useRef<number | null>(null);
  const [moveKnob, setMoveKnob] = useState({ x: 0, y: 0, active: false });

  // Shoot / Aim Joystick (Right)
  const shootStickRef = useRef<HTMLDivElement>(null);
  const shootTouchIdRef = useRef<number | null>(null);
  const [shootKnob, setShootKnob] = useState({ x: 0, y: 0, active: false, angle: 0 });

  // --------------------------------------------------------------------------
  // Left Joystick Logic (Movement 360°)
  // --------------------------------------------------------------------------
  const updateMove = useCallback((clientX: number, clientY: number) => {
    if (!moveStickRef.current) return;
    const rect = moveStickRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    const dx = clientX - centerX;
    const dy = clientY - centerY;
    const dist = Math.hypot(dx, dy);
    const maxRadius = rect.width / 2;

    const clampedDist = Math.min(dist, maxRadius);
    const angle = Math.atan2(dy, dx);
    const knobX = Math.cos(angle) * clampedDist;
    const knobY = Math.sin(angle) * clampedDist;

    setMoveKnob({ x: knobX, y: knobY, active: true });

    if (dist < 8) {
      onMove(0, 0);
    } else {
      const normX = (dx / dist) * Math.min(1, dist / maxRadius);
      const normY = (dy / dist) * Math.min(1, dist / maxRadius);
      onMove(normX, normY);
    }
  }, [onMove]);

  const handleMoveTouchStart = (e: React.TouchEvent) => {
    e.preventDefault();
    if (moveTouchIdRef.current !== null) return;
    const touch = e.changedTouches[0];
    moveTouchIdRef.current = touch.identifier;
    updateMove(touch.clientX, touch.clientY);
  };

  const handleMoveTouchMove = (e: React.TouchEvent) => {
    e.preventDefault();
    for (let i = 0; i < e.changedTouches.length; i++) {
      const touch = e.changedTouches[i];
      if (touch.identifier === moveTouchIdRef.current) {
        updateMove(touch.clientX, touch.clientY);
        break;
      }
    }
  };

  const handleMoveTouchEnd = (e: React.TouchEvent) => {
    e.preventDefault();
    for (let i = 0; i < e.changedTouches.length; i++) {
      const touch = e.changedTouches[i];
      if (touch.identifier === moveTouchIdRef.current) {
        moveTouchIdRef.current = null;
        setMoveKnob({ x: 0, y: 0, active: false });
        onStopMove();
        break;
      }
    }
  };

  // --------------------------------------------------------------------------
  // Right Joystick Logic (Aim & Shoot 360°)
  // --------------------------------------------------------------------------
  const updateShoot = useCallback((clientX: number, clientY: number) => {
    if (!shootStickRef.current) return;
    const rect = shootStickRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    const dx = clientX - centerX;
    const dy = clientY - centerY;
    const dist = Math.hypot(dx, dy);
    const maxRadius = rect.width / 2;

    const clampedDist = Math.min(dist, maxRadius);
    const angle = Math.atan2(dy, dx);
    const knobX = Math.cos(angle) * clampedDist;
    const knobY = Math.sin(angle) * clampedDist;

    setShootKnob({ x: knobX, y: knobY, active: true, angle });

    // Deadzone check for firing
    if (dist < 10) {
      onStopShoot();
    } else {
      const normX = (dx / dist) * Math.min(1, dist / maxRadius);
      const normY = (dy / dist) * Math.min(1, dist / maxRadius);
      onShootVector(normX, normY);
    }
  }, [onShootVector, onStopShoot]);

  const handleShootTouchStart = (e: React.TouchEvent) => {
    e.preventDefault();
    if (shootTouchIdRef.current !== null) return;
    const touch = e.changedTouches[0];
    shootTouchIdRef.current = touch.identifier;
    updateShoot(touch.clientX, touch.clientY);
  };

  const handleShootTouchMove = (e: React.TouchEvent) => {
    e.preventDefault();
    for (let i = 0; i < e.changedTouches.length; i++) {
      const touch = e.changedTouches[i];
      if (touch.identifier === shootTouchIdRef.current) {
        updateShoot(touch.clientX, touch.clientY);
        break;
      }
    }
  };

  const handleShootTouchEnd = (e: React.TouchEvent) => {
    e.preventDefault();
    for (let i = 0; i < e.changedTouches.length; i++) {
      const touch = e.changedTouches[i];
      if (touch.identifier === shootTouchIdRef.current) {
        shootTouchIdRef.current = null;
        setShootKnob({ x: 0, y: 0, active: false, angle: 0 });
        onStopShoot();
        break;
      }
    }
  };

  const toggleWeaponSlot = () => {
    if (!onSwitchWeaponSlot) return;
    const nextSlot = activeWeaponSlot === 1 ? 2 : 1;
    onSwitchWeaponSlot(nextSlot);
  };

  // Completely hidden on desktop computers (mouse & keyboard)
  if (!isMobileDevice) {
    return null;
  }

  return (
    <div className="absolute inset-0 pointer-events-none z-30 flex justify-between items-end p-3 sm:p-5 select-none overflow-hidden touch-none">
      {/* ------------------------------------------------------------------ */}
      {/* LEFT: VIRTUAL MOVEMENT JOYSTICK (Cyan Tactical HUD)               */}
      {/* ------------------------------------------------------------------ */}
      <div className="pointer-events-auto flex flex-col items-center gap-1.5 pb-2 pl-1">
        <div
          ref={moveStickRef}
          onTouchStart={handleMoveTouchStart}
          onTouchMove={handleMoveTouchMove}
          onTouchEnd={handleMoveTouchEnd}
          onTouchCancel={handleMoveTouchEnd}
          className={`relative w-32 h-32 rounded-full border-2 transition-colors flex items-center justify-center backdrop-blur-sm touch-none ${
            moveKnob.active
              ? 'bg-slate-950/80 border-cyan-400 shadow-lg shadow-cyan-500/20'
              : 'bg-slate-950/60 border-cyan-500/40 shadow-md shadow-black/60'
          }`}
        >
          {/* Compass Axis Marks */}
          <div className="absolute top-1.5 w-1 h-2 bg-cyan-400/50 rounded-full" />
          <div className="absolute bottom-1.5 w-1 h-2 bg-cyan-400/50 rounded-full" />
          <div className="absolute left-1.5 w-2 h-1 bg-cyan-400/50 rounded-full" />
          <div className="absolute right-1.5 w-2 h-1 bg-cyan-400/50 rounded-full" />
          <div className="absolute inset-3 rounded-full border border-dashed border-cyan-500/20 pointer-events-none" />

          {/* Floating Movable Thumb Knob */}
          <div
            className={`w-14 h-14 rounded-full border-2 flex items-center justify-center transition-transform duration-75 ${
              moveKnob.active
                ? 'bg-cyan-500/60 border-cyan-200 shadow-md shadow-cyan-400/50 scale-105'
                : 'bg-cyan-600/40 border-cyan-400 shadow-sm'
            }`}
            style={{
              transform: `translate(${moveKnob.x}px, ${moveKnob.y}px)`,
            }}
          >
            <div className="w-5 h-5 rounded-full bg-cyan-300/80" />
          </div>
        </div>
        <span className="text-[9px] font-mono font-bold tracking-widest text-cyan-400/80 uppercase">
          MOVER
        </span>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* RIGHT: VIRTUAL AIM & SHOOT JOYSTICK + ACTION BUTTONS               */}
      {/* ------------------------------------------------------------------ */}
      <div className="pointer-events-auto flex flex-col items-end gap-2 pb-2 pr-1">
        {/* Upper Action Utility Buttons */}
        <div className="flex items-center gap-2 mb-1">
          {/* Weapon Slot Toggle Button */}
          {hasSecondWeapon && (
            <button
              onTouchStart={(e) => {
                e.preventDefault();
                toggleWeaponSlot();
              }}
              onClick={(e) => {
                e.preventDefault();
                toggleWeaponSlot();
              }}
              className="px-2.5 h-9 rounded-md bg-stone-900/90 border-2 border-amber-400/70 text-amber-300 text-[9px] font-mono font-bold flex items-center gap-1 active:scale-90 shadow-md shadow-black/50 cursor-pointer"
              title="Cambiar Ranura de Arma"
            >
              <ArrowRightLeft className="w-3.5 h-3.5 text-amber-400" />
              <span>SLOT {activeWeaponSlot}</span>
            </button>
          )}

          {/* Reload Magazine Button */}
          <button
            onTouchStart={(e) => {
              e.preventDefault();
              onReload();
            }}
            onClick={(e) => {
              e.preventDefault();
              onReload();
            }}
            className="w-10 h-10 rounded-full bg-slate-900/90 border border-slate-600 text-stone-300 flex items-center justify-center active:scale-90 shadow-md shadow-black/60 cursor-pointer"
            title="Recargar [R]"
          >
            <RotateCcw className="w-4 h-4 text-cyan-300" />
          </button>

          {/* Pickup / Substitute Weapon Button [F] */}
          {onPickupWeapon && (
            <button
              onTouchStart={(e) => {
                e.preventDefault();
                onPickupWeapon();
              }}
              onClick={(e) => {
                e.preventDefault();
                onPickupWeapon();
              }}
              className="h-10 px-2.5 rounded-full bg-amber-600/90 border-2 border-amber-300 text-white font-mono font-bold text-[10px] flex items-center gap-1 active:scale-90 shadow-md shadow-amber-950/60 cursor-pointer"
              title="Recoger / Sustituir Arma [F]"
            >
              <span>[F]</span>
              <span className="text-[8px] font-normal opacity-90">ARMA</span>
            </button>
          )}

          {/* Interact / Hack Console Button [E] */}
          <button
            onTouchStart={(e) => {
              e.preventDefault();
              onInteract();
            }}
            onClick={(e) => {
              e.preventDefault();
              onInteract();
            }}
            className="h-10 px-2.5 rounded-full bg-emerald-600/90 border-2 border-emerald-300 text-white font-mono font-bold text-[10px] flex items-center gap-1 active:scale-90 shadow-md shadow-emerald-950/60 cursor-pointer"
            title="Interactuar Consola / Ascensor [E]"
          >
            <span>[E]</span>
            <span className="text-[8px] font-normal opacity-90">CONSOLA</span>
          </button>
        </div>

        {/* Lower Row: Dash Button & Aim/Shoot Joystick */}
        <div className="flex items-center gap-3">
          {/* Tactical Dash / Dodge Button */}
          <button
            onTouchStart={(e) => {
              e.preventDefault();
              onDash();
            }}
            onClick={(e) => {
              e.preventDefault();
              onDash();
            }}
            className="w-12 h-12 rounded-full bg-cyan-600/80 border-2 border-cyan-300 text-slate-950 font-bold flex flex-col items-center justify-center active:scale-90 shadow-md shadow-cyan-950/50 cursor-pointer"
            title="Esquivar [Espacio]"
          >
            <Wind className="w-5 h-5" />
            <span className="text-[7px] font-mono uppercase tracking-tighter mt-[-2px]">DASH</span>
          </button>

          {/* Aim & Shoot Joystick */}
          <div className="flex flex-col items-center gap-1.5">
            <div
              ref={shootStickRef}
              onTouchStart={handleShootTouchStart}
              onTouchMove={handleShootTouchMove}
              onTouchEnd={handleShootTouchEnd}
              onTouchCancel={handleShootTouchEnd}
              className={`relative w-32 h-32 rounded-full border-2 transition-colors flex items-center justify-center backdrop-blur-sm touch-none ${
                shootKnob.active
                  ? 'bg-slate-950/85 border-rose-400 shadow-xl shadow-rose-600/30'
                  : 'bg-slate-950/60 border-rose-500/40 shadow-md shadow-black/60'
              }`}
            >
              {/* Reticle Ticks & Crosshair Hashmarks */}
              <div className="absolute top-1.5 w-1 h-2 bg-rose-400/60 rounded-full" />
              <div className="absolute bottom-1.5 w-1 h-2 bg-rose-400/60 rounded-full" />
              <div className="absolute left-1.5 w-2 h-1 bg-rose-400/60 rounded-full" />
              <div className="absolute right-1.5 w-2 h-1 bg-rose-400/60 rounded-full" />
              <div className="absolute inset-3 rounded-full border border-dashed border-rose-500/25 pointer-events-none" />

              {/* Firing Direction Indicator Ray */}
              {shootKnob.active && (
                <div
                  className="absolute w-12 h-1 bg-gradient-to-r from-rose-500 via-rose-300 to-white origin-left pointer-events-none shadow-sm shadow-rose-500"
                  style={{
                    left: '50%',
                    top: '50%',
                    transform: `translateY(-50%) rotate(${shootKnob.angle}rad)`,
                  }}
                />
              )}

              {/* Floating Movable Thumb Knob */}
              <div
                className={`w-14 h-14 rounded-full border-2 flex items-center justify-center transition-transform duration-75 ${
                  shootKnob.active
                    ? 'bg-rose-600/80 border-rose-200 shadow-lg shadow-rose-500/60 scale-105'
                    : 'bg-rose-700/40 border-rose-400 shadow-sm'
                }`}
                style={{
                  transform: `translate(${shootKnob.x}px, ${shootKnob.y}px)`,
                }}
              >
                <Crosshair
                  className={`w-6 h-6 ${
                    shootKnob.active ? 'text-white animate-pulse' : 'text-rose-300'
                  }`}
                />
              </div>
            </div>
            <span className="text-[9px] font-mono font-bold tracking-widest text-rose-400/90 uppercase">
              DISPARAR
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

