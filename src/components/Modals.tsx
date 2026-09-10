import React from 'react';
import { DungeonFloor } from '../types';
import { ArrowRight, RefreshCw, Skull, Trophy, CheckCircle, Shield, Award, Terminal } from 'lucide-react';

interface LevelCompletedModalProps {
  floor: DungeonFloor;
  intelCount: number;
  onNextFloor: () => void;
  onOpenLeaderboard?: () => void;
}

export const LevelCompletedModal: React.FC<LevelCompletedModalProps> = ({
  floor,
  intelCount,
  onNextFloor,
  onOpenLeaderboard,
}) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 backdrop-blur-md p-4 select-none animate-in fade-in duration-300">
      <div className="w-full max-w-md bg-slate-900 border border-emerald-500/50 rounded-xl p-6 shadow-2xl text-center font-mono">
        <div className="mx-auto w-14 h-14 bg-emerald-950/60 border border-emerald-500/60 rounded-full flex items-center justify-center text-emerald-400 mb-4 shadow-lg shadow-emerald-950/50">
          <Trophy className="w-7 h-7" />
        </div>

        <h2 className="text-xl font-bold text-white tracking-wider mb-1">
          OPERACIÓN EXITOSA // PISO {floor.floorLevel}
        </h2>
        <p className="text-xs text-emerald-400 mb-4 font-semibold">
          NÚCLEO DEL JEFE NEUTRALIZADO Y ASCENSOR HABILITADO
        </p>

        <div className="bg-slate-950/70 border border-slate-800 rounded-lg p-4 mb-6 text-xs text-left space-y-2">
          <div className="flex justify-between text-slate-400">
            <span>Sector Superado:</span>
            <span className="text-slate-200 font-bold">{floor.name}</span>
          </div>
          <div className="flex justify-between text-slate-400">
            <span>Salas Infiltradas:</span>
            <span className="text-cyan-400 font-bold">{floor.rooms.size} salas procedimentales</span>
          </div>
          <div className="flex justify-between text-slate-400">
            <span>Ruta Crítica Transitada:</span>
            <span className="text-emerald-400 font-bold">100% Completada</span>
          </div>
          <div className="flex justify-between text-slate-400">
            <span>Intel Confidencial / Rads:</span>
            <span className="text-amber-400 font-bold">{intelCount} recolectados</span>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <button
            onClick={onNextFloor}
            className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 active:scale-98 text-slate-950 font-bold text-sm rounded-lg transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-emerald-600/30"
          >
            <span>DESCENDER AL SIGUIENTE NIVEL (NUEVO PLANO)</span>
            <ArrowRight className="w-4 h-4" />
          </button>
          {onOpenLeaderboard && (
            <button
              onClick={onOpenLeaderboard}
              className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-emerald-400 text-xs rounded-lg transition-all flex items-center justify-center gap-2 cursor-pointer border border-emerald-500/30"
            >
              <Trophy className="w-3.5 h-3.5" />
              <span>VER MARCADORES & PERFIL EN LA NUBE (FIREBASE)</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

interface GameOverModalProps {
  onRetry: () => void;
  onOpenLeaderboard?: () => void;
}

export const GameOverModal: React.FC<GameOverModalProps> = ({ onRetry, onOpenLeaderboard }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/90 backdrop-blur-md p-4 select-none animate-in fade-in duration-300">
      <div className="w-full max-w-md bg-slate-900 border border-rose-500/50 rounded-xl p-6 shadow-2xl text-center font-mono">
        <div className="mx-auto w-14 h-14 bg-rose-950/60 border border-rose-500/60 rounded-full flex items-center justify-center text-rose-400 mb-4 shadow-lg shadow-rose-950/50">
          <Skull className="w-7 h-7" />
        </div>

        <h2 className="text-xl font-bold text-white tracking-wider mb-1">
          AGENTE 077 CAÍDO EN COMBATE
        </h2>
        <p className="text-xs text-rose-400 mb-4 font-semibold">
          LA SEGURIDAD DE LA BASE HA COMPROMETIDO TU IDENTIDAD
        </p>

        <p className="text-xs text-slate-400 mb-6 leading-relaxed">
          En cada reintento, los planos de la base enemiga se vuelven a generar de forma totalmente aleatoria con nuevas salas y una ruta transitable garantizada.
        </p>

        <div className="flex flex-col gap-2">
          <button
            onClick={onRetry}
            className="w-full py-3 bg-rose-600 hover:bg-rose-500 active:scale-98 text-white font-bold text-sm rounded-lg transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-rose-600/30"
          >
            <RefreshCw className="w-4 h-4" />
            <span>INICIAR NUEVA INFILTRACIÓN (NUEVO PLANO AL AZAR)</span>
          </button>
          {onOpenLeaderboard && (
            <button
              onClick={onOpenLeaderboard}
              className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-amber-400 text-xs rounded-lg transition-all flex items-center justify-center gap-2 cursor-pointer border border-amber-500/30"
            >
              <Trophy className="w-3.5 h-3.5" />
              <span>CONSULTAR CLASIFICACIÓN GLOBAL (FIREBASE)</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

interface InstructionsModalProps {
  onClose: () => void;
}

export const InstructionsModal: React.FC<InstructionsModalProps> = ({ onClose }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 backdrop-blur-md p-4 select-none animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-slate-900 border border-cyan-500/40 rounded-xl p-6 shadow-2xl font-mono text-xs">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
          <div className="flex items-center gap-2 text-cyan-400">
            <Terminal className="w-5 h-5" />
            <h3 className="font-bold text-sm text-white tracking-wider">MANUAL DE OPERACIONES // AGENTE 077</h3>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white px-2 py-1 bg-slate-800 rounded cursor-pointer"
          >
            ✕
          </button>
        </div>

        <div className="space-y-3 text-slate-300 mb-6">
          <div className="p-2.5 bg-slate-950 rounded border border-emerald-500/40 flex items-center justify-between">
            <span className="text-emerald-400 font-bold">MOVIMIENTO (8 DIR):</span>
            <span className="text-white font-mono">[W, A, S, D] (Sin ratón)</span>
          </div>
          <div className="p-2.5 bg-slate-950 rounded border border-amber-500/40 flex items-center justify-between">
            <span className="text-amber-400 font-bold">DISPARO CONTINUO:</span>
            <span className="text-white font-mono">[FLECHITAS] ↑ ↓ ← →</span>
          </div>
          <div className="p-2.5 bg-slate-950/70 rounded border border-slate-800 text-[11px] text-slate-400">
            ⚡ <span className="text-amber-300 font-bold">ACCIONES SIMULTÁNEAS:</span> Muévete en cualquier dirección con WASD mientras mantienes presionadas las flechitas para disparar en ráfaga automática hacia otro lado.
          </div>
          <div className="p-2.5 bg-slate-950 rounded border border-slate-800 flex items-center justify-between">
            <span className="text-slate-400 font-bold">ESQUIVE TÁCTICO (DASH):</span>
            <span className="text-cyan-300">[ESPACIO]</span>
          </div>
          <div className="p-2.5 bg-slate-950 rounded border border-slate-800 flex items-center justify-between">
            <span className="text-slate-400 font-bold">INTERACTUAR / HACKEAR:</span>
            <span className="text-cyan-300">[E] cerca de terminales</span>
          </div>
          <div className="p-2.5 bg-slate-950 rounded border border-slate-800 flex items-center justify-between">
            <span className="text-slate-400 font-bold">PLANO TÁCTICO PROCEDIMENTAL:</span>
            <span className="text-cyan-300">TECLA [M] o BOTÓN PLANO</span>
          </div>
          <div className="p-2.5 bg-slate-950 rounded border border-slate-800 flex items-center justify-between">
            <span className="text-slate-400 font-bold">GUÍA DE RUTA TRANSITABLE:</span>
            <span className="text-cyan-300">TECLA [T]</span>
          </div>
          <div className="p-2.5 bg-slate-950 rounded border border-slate-800 flex items-center justify-between">
            <span className="text-slate-400 font-bold">RECARGAR ARMA:</span>
            <span className="text-cyan-300">TECLA [R]</span>
          </div>
          <div className="p-2.5 bg-slate-950 rounded border border-amber-500/30 flex items-center justify-between">
            <span className="text-amber-400 font-bold">CAMBIAR ARMA (MÁX 2):</span>
            <span className="text-white font-mono">TECLAS [1] y [2]</span>
          </div>
          <div className="p-2.5 bg-slate-950 rounded border border-emerald-500/30 flex items-center justify-between">
            <span className="text-emerald-400 font-bold">SUSTITUIR / RECOGER ARMA:</span>
            <span className="text-white font-mono">TECLA [E] junto al arma</span>
          </div>
          <div className="p-2.5 bg-slate-950 rounded border border-slate-800 flex items-center justify-between">
            <span className="text-slate-400 font-bold">LANZAR EXPLOSIVOS:</span>
            <span className="text-orange-400 font-mono">TECLA [Q]</span>
          </div>
        </div>

        <button
          onClick={onClose}
          className="w-full py-2.5 bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-bold rounded transition-colors cursor-pointer"
        >
          ENTENDIDO // COMENZAR OPERACIÓN
        </button>
      </div>
    </div>
  );
};
