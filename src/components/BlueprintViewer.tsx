import React, { useState } from 'react';
import { DungeonFloor, RoomInstance, RoomType } from '../types';
import { Shield, Eye, Cpu, Crosshair, Skull, CheckCircle2, RefreshCw, X, Compass, Zap, MapPin, Route } from 'lucide-react';

interface BlueprintViewerProps {
  dungeon: DungeonFloor;
  currentRoomId: string;
  onRegenerate: () => void;
  onClose: () => void;
  showPathGuide: boolean;
  onTogglePathGuide: () => void;
}

export const BlueprintViewer: React.FC<BlueprintViewerProps> = ({
  dungeon,
  currentRoomId,
  onRegenerate,
  onClose,
  showPathGuide,
  onTogglePathGuide,
}) => {
  const [selectedRoomId, setSelectedRoomId] = useState<string>(currentRoomId);

  const selectedRoom = dungeon.rooms.get(selectedRoomId) || dungeon.rooms.get(currentRoomId);

  // Helper for room icons
  const getRoomIcon = (type: RoomType) => {
    switch (type) {
      case 'START':
        return <Compass className="w-4 h-4 text-emerald-400" />;
      case 'BOSS':
        return <Skull className="w-4 h-4 text-rose-500" />;
      case 'ARMORY':
        return <Shield className="w-4 h-4 text-amber-400" />;
      case 'SERVER_HUB':
        return <Cpu className="w-4 h-4 text-cyan-400" />;
      case 'CCTV_ROOM':
        return <Eye className="w-4 h-4 text-purple-400" />;
      case 'LASER_GRID':
        return <Zap className="w-4 h-4 text-red-400" />;
      case 'LABORATORY':
        return <Crosshair className="w-4 h-4 text-blue-400" />;
      default:
        return <Crosshair className="w-4 h-4 text-slate-400" />;
    }
  };

  const getRoomTypeName = (type: RoomType) => {
    switch (type) {
      case 'START':
        return 'Punto de Inserción';
      case 'BOSS':
        return 'Búnker del Jefe';
      case 'ARMORY':
        return 'Armería Táctica';
      case 'SERVER_HUB':
        return 'Hub de Servidores';
      case 'CCTV_ROOM':
        return 'Monitoreo CCTV';
      case 'LASER_GRID':
        return 'Corredor Láser';
      case 'LABORATORY':
        return 'Laboratorio I+D';
      default:
        return 'Zona de Patrulla';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 backdrop-blur-md p-4 sm:p-6 select-none animate-in fade-in duration-200">
      <div className="relative w-full max-w-5xl bg-slate-900 border border-cyan-500/40 rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header - Tactical Blueprint Style */}
        <div className="px-6 py-4 bg-slate-950/90 border-b border-cyan-500/30 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-cyan-950/80 border border-cyan-500/50 rounded-lg text-cyan-400">
              <Route className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold tracking-wider text-cyan-100 font-mono">
                  PLANO TÁCTICO PROCEDIMENTAL // NIVEL {dungeon.floorLevel}
                </h2>
                <span className="px-2 py-0.5 text-xs font-mono font-semibold bg-emerald-950/70 border border-emerald-500/50 text-emerald-400 rounded">
                  RUTA FÍSICA TRANSITABLE GARANTIZADA
                </span>
              </div>
              <p className="text-xs text-slate-400 font-mono">
                Semilla #{dungeon.seed} • {dungeon.name} • {dungeon.rooms.size} Salas Instanciadas
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onRegenerate}
              className="flex items-center gap-2 px-3 py-1.5 bg-cyan-900/40 hover:bg-cyan-800/60 border border-cyan-500/40 text-cyan-300 rounded text-xs font-mono transition-colors active:scale-95 cursor-pointer"
              title="Generar nueva distribución procedimental al azar"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Regenerar Plano</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Main Body */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 overflow-hidden">
          {/* Blueprint Grid Canvas Area (Left 8 cols) */}
          <div className="lg:col-span-8 p-6 flex flex-col items-center justify-center bg-slate-950/60 relative border-b lg:border-b-0 lg:border-r border-slate-800/80">
            {/* Blueprint Grid Lines & Overlay */}
            <div className="relative w-[360px] h-[360px] sm:w-[440px] sm:h-[440px] bg-slate-900/90 border-2 border-cyan-600/30 rounded-lg p-4 grid grid-cols-5 grid-rows-5 gap-2 shadow-inner">
              {/* Background blueprint grid watermark */}
              <div
                className="absolute inset-0 pointer-events-none opacity-15"
                style={{
                  backgroundImage:
                    'radial-gradient(circle, #38bdf8 1px, transparent 1px), linear-gradient(to right, #0284c7 1px, transparent 1px), linear-gradient(to bottom, #0284c7 1px, transparent 1px)',
                  backgroundSize: '20px 20px, 40px 40px, 40px 40px',
                }}
              />

              {/* Render Room Cells */}
              {Array.from({ length: 5 }).map((_, gy) =>
                Array.from({ length: 5 }).map((_, gx) => {
                  const roomId = dungeon.roomGrid[gy][gx];
                  const room = roomId ? dungeon.rooms.get(roomId) : null;
                  const isCurrent = roomId === currentRoomId;
                  const isSelected = roomId === selectedRoomId;
                  const isStart = room?.type === 'START';
                  const isBoss = room?.type === 'BOSS';
                  const isOnCriticalPath = roomId && dungeon.criticalPath.includes(roomId);

                  if (!room) {
                    return (
                      <div
                        key={`cell-${gx}-${gy}`}
                        className="border border-slate-800/30 rounded flex items-center justify-center"
                      >
                        <span className="text-[9px] font-mono text-slate-800">
                          {gx},{gy}
                        </span>
                      </div>
                    );
                  }

                  return (
                    <button
                      key={`cell-${gx}-${gy}`}
                      onClick={() => setSelectedRoomId(room.id)}
                      className={`relative flex flex-col items-center justify-center p-1 rounded transition-all cursor-pointer text-left ${
                        isSelected
                          ? 'ring-2 ring-cyan-400 bg-cyan-950/60 shadow-lg shadow-cyan-950/50'
                          : isCurrent
                          ? 'bg-emerald-950/50 border border-emerald-500/70'
                          : isStart
                          ? 'bg-emerald-950/40 border border-emerald-500/40'
                          : isBoss
                          ? 'bg-rose-950/50 border border-rose-500/70 animate-pulse'
                          : isOnCriticalPath
                          ? 'bg-slate-800/90 border border-cyan-500/50'
                          : 'bg-slate-800/60 border border-slate-700/60 hover:border-slate-500'
                      }`}
                    >
                      {/* Critical path route badge */}
                      {isOnCriticalPath && (
                        <div className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-cyan-500 text-slate-950 text-[9px] font-mono font-bold flex items-center justify-center">
                          {dungeon.criticalPath.indexOf(room.id) + 1}
                        </div>
                      )}

                      {/* Current player beacon */}
                      {isCurrent && (
                        <div className="absolute -top-1 -left-1 flex h-3 w-3">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                        </div>
                      )}

                      <div className="mb-0.5">{getRoomIcon(room.type)}</div>
                      <span className="text-[10px] font-mono font-bold text-slate-200 truncate w-full text-center">
                        {isStart ? 'INICIO' : isBoss ? 'JEFE' : getRoomTypeName(room.type).slice(0, 7)}
                      </span>

                      {/* Doors markers */}
                      <div className="flex gap-0.5 mt-0.5">
                        {room.doors.N && <span className="w-1 h-1 bg-cyan-400 rounded-full" title="Puerta Norte" />}
                        {room.doors.S && <span className="w-1 h-1 bg-cyan-400 rounded-full" title="Puerta Sur" />}
                        {room.doors.W && <span className="w-1 h-1 bg-cyan-400 rounded-full" title="Puerta Oeste" />}
                        {room.doors.E && <span className="w-1 h-1 bg-cyan-400 rounded-full" title="Puerta Este" />}
                      </div>
                    </button>
                  );
                })
              )}
            </div>

            {/* Path Controls & Legend */}
            <div className="mt-4 flex flex-wrap items-center justify-between gap-4 w-full max-w-[440px] text-xs font-mono">
              <div className="flex items-center gap-3">
                <label className="flex items-center gap-2 text-cyan-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showPathGuide}
                    onChange={onTogglePathGuide}
                    className="rounded bg-slate-800 border-cyan-500 text-cyan-500 focus:ring-cyan-400"
                  />
                  <span>Guía Holográfica en Juego</span>
                </label>
              </div>

              <div className="flex items-center gap-3 text-slate-400">
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span> Agente 077
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-cyan-500"></span> Ruta Crítica
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span> Sala del Jefe
                </span>
              </div>
            </div>
          </div>

          {/* Room Details & Path Validation Info (Right 4 cols) */}
          <div className="lg:col-span-4 p-5 flex flex-col justify-between bg-slate-900 overflow-y-auto">
            <div className="space-y-4">
              {/* Guaranteed Path Verification Card */}
              <div className="p-3.5 bg-emerald-950/30 border border-emerald-500/40 rounded-lg">
                <div className="flex items-center gap-2 text-emerald-400 font-mono text-xs font-bold mb-1.5">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>COMPROBACIÓN DE TRANSITABILIDAD</span>
                </div>
                <p className="text-xs text-slate-300 font-mono leading-relaxed">
                  Camino físico verificado: <span className="text-emerald-300 font-bold">{dungeon.criticalPath.length} salas conectadas</span> desde Inserción hasta la puerta de Voronin.
                </p>
                <div className="mt-2.5 flex items-center justify-between text-[11px] font-mono text-slate-400 border-t border-emerald-500/20 pt-2">
                  <span>Distancia crítica:</span>
                  <span className="text-cyan-300 font-bold">{dungeon.detailedPathWaypoints.length * 24} metros</span>
                </div>
              </div>

              {/* Selected Room Details */}
              {selectedRoom && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                    <div className="flex items-center gap-2">
                      {getRoomIcon(selectedRoom.type)}
                      <span className="font-mono font-bold text-sm text-white">{selectedRoom.name}</span>
                    </div>
                    <span className="text-xs font-mono text-slate-400 px-1.5 py-0.5 bg-slate-800 rounded">
                      ({selectedRoom.gridX}, {selectedRoom.gridY})
                    </span>
                  </div>

                  <p className="text-xs text-slate-300 leading-relaxed">{selectedRoom.description}</p>

                  <div className="bg-slate-950/60 p-3 rounded border border-slate-800 space-y-2 text-xs font-mono">
                    <div className="flex justify-between text-slate-400">
                      <span>Tipo de Instalación:</span>
                      <span className="text-cyan-400 font-bold">{getRoomTypeName(selectedRoom.type)}</span>
                    </div>
                    <div className="flex justify-between text-slate-400">
                      <span>Centinelas Hostiles:</span>
                      <span className={selectedRoom.guards.length > 0 ? 'text-rose-400 font-bold' : 'text-slate-500'}>
                        {selectedRoom.guards.length} detectados
                      </span>
                    </div>
                    <div className="flex justify-between text-slate-400">
                      <span>Cámaras CCTV:</span>
                      <span className={selectedRoom.cameras.length > 0 ? 'text-purple-400 font-bold' : 'text-slate-500'}>
                        {selectedRoom.cameras.length} activas
                      </span>
                    </div>
                    <div className="flex justify-between text-slate-400">
                      <span>Rejillas Láser:</span>
                      <span className={selectedRoom.lasers.length > 0 ? 'text-red-400 font-bold' : 'text-slate-500'}>
                        {selectedRoom.lasers.length} líneas
                      </span>
                    </div>
                    <div className="flex justify-between text-slate-400">
                      <span>Consolas Terminales:</span>
                      <span className={selectedRoom.terminals.length > 0 ? 'text-emerald-400 font-bold' : 'text-slate-500'}>
                        {selectedRoom.terminals.length} hackeables
                      </span>
                    </div>
                    <div className="flex justify-between text-slate-400">
                      <span>Suministros Tácticos:</span>
                      <span className={selectedRoom.items.length > 0 ? 'text-amber-400 font-bold' : 'text-slate-500'}>
                        {selectedRoom.items.length} objetos
                      </span>
                    </div>
                  </div>

                  {/* Connected Doors List */}
                  <div>
                    <span className="text-[11px] font-mono text-slate-400 font-semibold block mb-1.5">
                      CONEXIONES FÍSICAS DE PUERTAS:
                    </span>
                    <div className="grid grid-cols-2 gap-1.5 text-xs font-mono">
                      {(['N', 'S', 'E', 'W'] as const).map((dir) => {
                        const door = selectedRoom.doors[dir];
                        const dirNames = { N: 'Norte', S: 'Sur', E: 'Este', W: 'Oeste' };
                        return (
                          <div
                            key={dir}
                            className={`p-1.5 rounded border text-[11px] flex items-center justify-between ${
                              door
                                ? 'bg-slate-800/80 border-cyan-500/40 text-cyan-200'
                                : 'bg-slate-950/40 border-slate-800 text-slate-600'
                            }`}
                          >
                            <span>{dirNames[dir]}</span>
                            <span>{door ? 'ABIERTA' : 'MURO'}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Bottom Actions */}
            <div className="pt-4 border-t border-slate-800 mt-4 space-y-2">
              <button
                onClick={onClose}
                className="w-full py-2 bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-bold font-mono text-xs rounded transition-colors cursor-pointer"
              >
                VOLVER A LA OPERACIÓN (CERRAR PLANO)
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
