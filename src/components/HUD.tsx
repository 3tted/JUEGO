import React from 'react';
import { PlayerState, DungeonFloor, RoomInstance } from '../types';
import { Map, RefreshCw, Volume2, VolumeX, Route, Trophy, Save, Crosshair, Zap, Flame } from 'lucide-react';
import { getWeaponDef } from '../game/weapons';
import { InfiltrationLogo } from './InfiltrationLogo';

interface HUDProps {
  player: PlayerState;
  dungeon: DungeonFloor;
  currentRoom?: RoomInstance;
  alarmLevel: number;
  soundEnabled: boolean;
  onToggleSound: () => void;
  onOpenBlueprint: () => void;
  onRegenerateFloor: () => void;
  showPathGuide: boolean;
  onTogglePathGuide: () => void;
  onOpenLeaderboard: () => void;
  onSaveGame?: () => void;
  isSaving?: boolean;
  hasSavedGame?: boolean;
  interactionPrompt?: string | null;
  onSwitchWeaponSlot?: (slot: 1 | 2) => void;
}

export const HUD: React.FC<HUDProps> = ({
  player,
  dungeon,
  currentRoom,
  soundEnabled,
  onToggleSound,
  onOpenBlueprint,
  onRegenerateFloor,
  showPathGuide,
  onTogglePathGuide,
  onOpenLeaderboard,
  onSaveGame,
  isSaving = false,
  hasSavedGame = false,
  onSwitchWeaponSlot,
}) => {
  const currentHealth = Math.round(player.health);
  const maxHealth = player.maxHealth || 8;
  const hpRatio = Math.max(0, Math.min(1, currentHealth / maxHealth));
  
  const w1 = player.weapons ? player.weapons[0] : (player.currentWeapon || 'pistol');
  const w2 = player.weapons ? player.weapons[1] : null;
  const wDef1 = getWeaponDef(w1 || 'pistol');
  const wDef2 = w2 ? getWeaponDef(w2) : null;
  const activeSlot = player.activeWeaponSlot || 1;
  const currentWeaponDef = activeSlot === 2 && wDef2 ? wDef2 : wDef1;

  return (
    <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-3 sm:p-5 select-none font-['Press_Start_2P',monospace]">
      {/* TOP SECTION */}
      <div className="flex items-start justify-between">
        {/* EXACT NUCLEAR THRONE HUD (Top Left from Screenshot) */}
        <div className="flex flex-col gap-1 drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
          {/* Row 1: Dual Weapon Boxes + Health Bar */}
          <div className="flex items-stretch gap-1.5">
            {/* 2 Weapon Slots (Slot 1 & Slot 2) */}
            <div className="flex items-center gap-1">
              {/* Slot 1 Box */}
              <button
                type="button"
                onClick={() => onSwitchWeaponSlot?.(1)}
                className={`w-11 h-14 bg-black border-2 rounded-t-md flex flex-col items-center justify-between p-1 transition-all pointer-events-auto cursor-pointer ${
                  activeSlot === 1
                    ? 'shadow-[0_0_10px_rgba(255,255,255,0.35)] scale-100'
                    : 'border-stone-700 opacity-60 hover:opacity-90 hover:border-stone-500 scale-95'
                }`}
                style={{ borderColor: activeSlot === 1 ? wDef1.color : '#44403c' }}
                title={`[1] ${wDef1.name} (Presiona tecla 1)`}
              >
                <div className="flex gap-0.5 justify-center pt-0.5">
                  <div className="w-1.5 h-3 border border-black rounded-t-sm" style={{ backgroundColor: wDef1.color }} />
                  <div className="w-1.5 h-3 border border-black rounded-t-sm" style={{ backgroundColor: wDef1.color }} />
                  <div className="w-1.5 h-3 border border-black rounded-t-sm" style={{ backgroundColor: wDef1.color }} />
                </div>
                <div className="flex flex-col items-center pb-0.5">
                  <span className="text-xs font-bold tracking-tight" style={{ color: wDef1.color }}>
                    1
                  </span>
                  <span className="text-[6px] text-stone-400 font-sans font-bold">
                    {wDef1.id === 'shotgun' ? 'SG' : wDef1.id === 'laser' ? 'LZ' : wDef1.id === 'plasma' ? 'PL' : 'PPK'}
                  </span>
                </div>
              </button>

              {/* Slot 2 Box */}
              <button
                type="button"
                onClick={() => onSwitchWeaponSlot?.(2)}
                className={`w-11 h-14 bg-black border-2 rounded-t-md flex flex-col items-center justify-between p-1 transition-all pointer-events-auto cursor-pointer ${
                  activeSlot === 2
                    ? 'shadow-[0_0_10px_rgba(255,255,255,0.35)] scale-100'
                    : wDef2
                    ? 'border-stone-700 opacity-60 hover:opacity-90 hover:border-stone-500 scale-95'
                    : 'border-dashed border-stone-800 opacity-40 hover:opacity-60 scale-95'
                }`}
                style={{ borderColor: activeSlot === 2 && wDef2 ? wDef2.color : wDef2 ? '#44403c' : '#292524' }}
                title={wDef2 ? `[2] ${wDef2.name} (Presiona tecla 2)` : 'Ranura 2 vacía. Recoge un arma del suelo con [F]'}
              >
                {wDef2 ? (
                  <>
                    <div className="flex gap-0.5 justify-center pt-0.5">
                      <div className="w-1.5 h-3 border border-black rounded-t-sm" style={{ backgroundColor: wDef2.color }} />
                      <div className="w-1.5 h-3 border border-black rounded-t-sm" style={{ backgroundColor: wDef2.color }} />
                      <div className="w-1.5 h-3 border border-black rounded-t-sm" style={{ backgroundColor: wDef2.color }} />
                    </div>
                    <div className="flex flex-col items-center pb-0.5">
                      <span className="text-xs font-bold tracking-tight" style={{ color: wDef2.color }}>
                        2
                      </span>
                      <span className="text-[6px] text-stone-400 font-sans font-bold">
                        {wDef2.id === 'shotgun' ? 'SG' : wDef2.id === 'laser' ? 'LZ' : wDef2.id === 'plasma' ? 'PL' : 'PPK'}
                      </span>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="pt-2 text-stone-600 text-[8px]">+</div>
                    <span className="text-[8px] font-bold text-stone-500 tracking-tight pb-0.5">
                      2 VACÍA
                    </span>
                  </>
                )}
              </button>
            </div>

            {/* Health Bar + Current Weapon Banner Stack */}
            <div className="flex flex-col gap-0.5">
              {/* Red Health Bar with "8/8" centered */}
              <div className="relative w-48 sm:w-64 h-8 bg-black border-2 border-white flex items-center overflow-hidden">
                {/* Red fill */}
                <div
                  className="h-full bg-[#ff2000] transition-all duration-150"
                  style={{ width: `${hpRatio * 100}%` }}
                />
                {/* Text "8/8" centered in bold white pixel font with black outline */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <span
                    className="text-white text-sm font-bold tracking-widest"
                    style={{
                      textShadow:
                        '-2px -2px 0 #000, 2px -2px 0 #000, -2px 2px 0 #000, 2px 2px 0 #000, 0 2px 0 #000, 0 -2px 0 #000',
                    }}
                  >
                    {currentHealth}/{maxHealth}
                  </span>
                </div>
              </div>

              {/* Weapon Banner: Active Slot Tag + Weapon Name + Fire Mode */}
              <div className="flex items-center gap-1.5 px-2 py-0.5 bg-black/90 border border-stone-800 rounded text-[8px] sm:text-[9px]">
                <span
                  className="w-2 h-2 rounded-full inline-block animate-pulse"
                  style={{ backgroundColor: currentWeaponDef.color, boxShadow: `0 0 6px ${currentWeaponDef.color}` }}
                />
                <span className="text-stone-400 font-bold">[{activeSlot}]</span>
                <span className="font-bold tracking-wider" style={{ color: currentWeaponDef.color }}>
                  {currentWeaponDef.name.toUpperCase()}
                </span>
                <span className="text-stone-400 text-[7px] sm:text-[8px] font-sans font-semibold">
                  • {currentWeaponDef.fireMode}
                </span>
              </div>
            </div>
          </div>

          {/* Row 2: Ammo Category Icons + Melee Sword & Explosives Count */}
          <div className="flex items-center gap-2 pt-0.5">
            {/* 5 Ammo Category Icons directly under Weapon Box */}
            <div className="w-12 flex items-center justify-between px-0.5">
              {/* 1. Bullets (Red) */}
              <div className="w-1.5 h-3.5 bg-red-600 border border-black" title="Bullets" />
              {/* 2. Shells (Grey) */}
              <div className="w-1.5 h-3.5 bg-slate-400 border border-black" title="Shells" />
              {/* 3. Bolts (Arrow/Up) */}
              <svg className="w-2 h-3.5 text-amber-500 fill-current" viewBox="0 0 8 14">
                <path d="M4 0 L8 6 L5 6 L5 14 L3 14 L3 6 L0 6 Z" stroke="#000" strokeWidth="1" />
              </svg>
              {/* 4. Explosives (Orange Bomb with fuse) */}
              <div className="w-2.5 h-3 relative">
                <div className="w-2.5 h-2.5 bg-amber-500 rounded-full border border-black" />
                <div className="absolute -top-1 right-0.5 w-1 h-1 bg-yellow-300" />
              </div>
              {/* 5. Energy (Pink/Red Lightning) */}
              <svg className="w-2 h-3.5 text-rose-500 fill-current" viewBox="0 0 8 14">
                <path d="M5 0 L0 8 L4 8 L3 14 L8 6 L4 6 Z" stroke="#000" strokeWidth="1" />
              </svg>
            </div>

            {/* Sword Icon + "+18 EXPLOSIVES" from screenshot */}
            <div className="flex items-center gap-2 pl-1">
              {/* Sword / Katana Icon */}
              <svg className="w-6 h-4" viewBox="0 0 24 16" fill="none">
                <path
                  d="M2 14 L18 4 L22 2 L20 6 L8 14 Z"
                  fill="#ffffff"
                  stroke="#000000"
                  strokeWidth="1.5"
                />
                <line x1="1" y1="15" x2="5" y2="11" stroke="#000000" strokeWidth="2.5" />
              </svg>

              {/* Text: "+18 EXPLOSIVES" in white pixel text with black outline */}
              <span
                className="text-white text-xs sm:text-sm font-bold tracking-wider"
                style={{
                  textShadow:
                    '-1.5px -1.5px 0 #000, 1.5px -1.5px 0 #000, -1.5px 1.5px 0 #000, 1.5px 1.5px 0 #000, 0 2px 0 #000',
                }}
              >
                +{player.explosivesAmmo || 18} EXPLOSIVES
              </span>
            </div>
          </div>
        </div>

        {/* Top Center: Infiltration Tactical Insignia */}
        <div className="hidden sm:flex items-center gap-2 bg-black/90 border border-red-900/60 px-2.5 py-1 rounded-md shadow-lg shadow-red-950/40 pointer-events-auto backdrop-blur-sm">
          <InfiltrationLogo size="xs" withGlow={true} />
          <div className="flex flex-col text-left">
            <span className="text-[9px] text-white font-black tracking-widest font-mono leading-none">
              INFILTRATION
            </span>
            <span className="text-[7px] text-red-500 font-mono tracking-tighter leading-none mt-0.5">
              ROGUE 077
            </span>
          </div>
        </div>

        {/* Top Right: Retro Tactical Tools */}
        <div className="flex items-center gap-2 pointer-events-auto">
          {onSaveGame && (
            <button
              id="hud-save-btn"
              onClick={onSaveGame}
              disabled={isSaving}
              className={`p-2 border-2 rounded transition-all cursor-pointer flex items-center gap-1 ${
                hasSavedGame
                  ? 'bg-stone-900 border-[#e2b044] text-[#e2b044] hover:bg-stone-800 shadow-[0_0_8px_rgba(226,176,68,0.3)]'
                  : 'bg-stone-900 border-stone-600 text-stone-300 hover:bg-stone-800'
              }`}
              title="Guardar Progreso & Posición del Muñeco en la Nube"
            >
              <Save className={`w-4 h-4 ${isSaving ? 'animate-spin' : ''}`} />
            </button>
          )}
          <button
            id="hud-leaderboard-btn"
            onClick={onOpenLeaderboard}
            className="p-2 bg-stone-900 border-2 border-[#4ade80] text-[#4ade80] hover:bg-stone-800 rounded transition-all cursor-pointer shadow-[0_0_8px_rgba(74,222,128,0.3)]"
            title="Marcadores & Perfil Firebase"
          >
            <Trophy className="w-4 h-4" />
          </button>
          <button
            onClick={onTogglePathGuide}
            className={`p-2 border-2 border-black rounded transition-all cursor-pointer ${
              showPathGuide ? 'bg-amber-500 text-black' : 'bg-stone-800 text-stone-400'
            }`}
            title="Ruta Garantizada (Tecla T)"
          >
            <Route className="w-4 h-4" />
          </button>
          <button
            onClick={onOpenBlueprint}
            className="p-2 bg-stone-900 border-2 border-black text-amber-400 hover:bg-stone-800 rounded transition-all cursor-pointer"
            title="Ver Plano Táctico (Tecla M)"
          >
            <Map className="w-4 h-4" />
          </button>
          <button
            onClick={onToggleSound}
            className="p-2 bg-stone-900 border-2 border-black text-stone-200 hover:bg-stone-800 rounded transition-all cursor-pointer"
            title="Sonido (Tecla P)"
          >
            {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4 text-stone-500" />}
          </button>
          <button
            onClick={onRegenerateFloor}
            className="p-2 bg-stone-900 border-2 border-black text-amber-500 hover:bg-stone-800 rounded transition-all cursor-pointer"
            title="Nuevo Nivel Aleatorio (Tecla R)"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* BOTTOM SECTION: Rads / Level indicator */}
      <div className="flex items-end justify-between">
        {/* Rads (EXP Canisters) */}
        <div className="flex items-center gap-2 bg-black/80 border-2 border-black p-1.5 rounded">
          <div className="w-3 h-4 bg-emerald-400 border border-white" />
          <span
            className="text-emerald-400 text-xs font-bold"
            style={{ textShadow: '1px 1px 0 #000' }}
          >
            RADS: {player.intelCollected || 0}
          </span>
        </div>

        {/* Room Combat Lockdown Status */}
        {currentRoom?.isLockedDown && (
          <div className="flex items-center gap-2 bg-red-950/90 border-2 border-red-500 text-red-200 px-3 py-1.5 rounded animate-pulse text-[10px] tracking-wider font-bold shadow-lg shadow-red-900/50">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
            <span>SALA BLOQUEADA: EN COMBATE</span>
          </div>
        )}
        {currentRoom?.isCleared && currentRoom.type !== 'START' && !currentRoom.isLockedDown && (
          <div className="hidden sm:flex items-center gap-2 bg-emerald-950/80 border-2 border-emerald-500 text-emerald-300 px-3 py-1.5 rounded text-[10px] tracking-wider font-bold">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span>SALA DESPEJADA</span>
          </div>
        )}

        {/* Center: Controls Banner */}
        <div className="hidden md:flex items-center gap-2 bg-black/85 border border-stone-700 px-3 py-1 rounded text-[8px] text-stone-300">
          <span className="text-emerald-400 font-bold">WASD</span>
          <span>MOVER</span>
          <span className="text-stone-600">•</span>
          <span className="text-amber-400 font-bold">FLECHITAS ↑↓←→</span>
          <span>DISPARAR</span>
          <span className="text-stone-600">•</span>
          <span className="text-cyan-400 font-bold">1 / 2</span>
          <span>CAMBIAR</span>
          <span className="text-stone-600">•</span>
          <span className="text-amber-300 font-bold">F</span>
          <span>ARMA</span>
          <span className="text-stone-600">•</span>
          <span className="text-emerald-400 font-bold">E</span>
          <span>CONSOLA</span>
        </div>

        {/* Floor Level */}
        <div className="bg-black/80 border-2 border-stone-800 p-1.5 rounded text-amber-400 text-xs font-bold tracking-wider">
          SECTOR INDUSTRIAL 1-{dungeon.floorLevel}
        </div>
      </div>
    </div>
  );
};
