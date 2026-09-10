import React from 'react';
import { PlayerState, DungeonFloor, RoomInstance } from '../types';
import { Map, RefreshCw, Volume2, VolumeX, Route, Trophy, Save, Crosshair, Zap, Flame } from 'lucide-react';
import { getWeaponDef } from '../game/weapons';

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
}) => {
  const currentHealth = Math.round(player.health);
  const maxHealth = player.maxHealth || 8;
  const hpRatio = Math.max(0, Math.min(1, currentHealth / maxHealth));
  const currentWeaponDef = getWeaponDef(player.currentWeapon || 'pistol');

  return (
    <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-3 sm:p-5 select-none font-['Press_Start_2P',monospace]">
      {/* TOP SECTION */}
      <div className="flex items-start justify-between">
        {/* EXACT NUCLEAR THRONE HUD (Top Left from Screenshot) */}
        <div className="flex flex-col gap-1 drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
          {/* Row 1: Weapon Box + Health Bar */}
          <div className="flex items-stretch gap-1">
            {/* Weapon Box with Weapon Type indicator & Slot Number */}
            <div
              className="w-12 h-14 bg-black border-2 rounded-t-md flex flex-col items-center justify-between p-1 transition-colors"
              style={{ borderColor: currentWeaponDef.color }}
              title={`Arma: ${currentWeaponDef.name}`}
            >
              {/* Ammo/energy indicators matching weapon tech */}
              <div className="flex gap-1 justify-center pt-0.5">
                <div
                  className="w-1.5 h-3 border border-black rounded-t-sm"
                  style={{ backgroundColor: currentWeaponDef.color }}
                />
                <div
                  className="w-1.5 h-3 border border-black rounded-t-sm"
                  style={{ backgroundColor: currentWeaponDef.color }}
                />
                <div
                  className="w-1.5 h-3 border border-black rounded-t-sm"
                  style={{ backgroundColor: currentWeaponDef.color }}
                />
              </div>
              {/* Bold slot number or weapon code */}
              <span
                className="text-xl font-bold tracking-tight pb-0.5"
                style={{ color: currentWeaponDef.color }}
              >
                {player.currentWeapon === 'shotgun'
                  ? 'SG'
                  : player.currentWeapon === 'laser'
                  ? 'LZ'
                  : player.currentWeapon === 'plasma'
                  ? 'PL'
                  : player.activeWeaponSlot || '2'}
              </span>
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

              {/* Weapon Banner: Name + Attack Style Description */}
              <div className="flex items-center gap-1.5 px-2 py-0.5 bg-black/90 border border-stone-800 rounded text-[8px] sm:text-[9px]">
                <span
                  className="w-2 h-2 rounded-full inline-block animate-pulse"
                  style={{ backgroundColor: currentWeaponDef.color, boxShadow: `0 0 6px ${currentWeaponDef.color}` }}
                />
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
        <div className="hidden md:flex items-center gap-2 bg-black/80 border border-stone-700 px-3 py-1 rounded text-[8px] text-stone-300">
          <span className="text-emerald-400 font-bold">WASD</span>
          <span>MOVER</span>
          <span className="text-stone-600">•</span>
          <span className="text-amber-400 font-bold">FLECHITAS ↑↓←→</span>
          <span>DISPARAR</span>
        </div>

        {/* Floor Level */}
        <div className="bg-black/80 border-2 border-black p-1.5 rounded text-stone-300 text-xs font-bold">
          WASTELAND 1-{dungeon.floorLevel}
        </div>
      </div>
    </div>
  );
};
