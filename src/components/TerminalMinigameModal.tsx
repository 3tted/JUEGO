import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Terminal,
  Cpu,
  Zap,
  CheckCircle2,
  X,
  Key,
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  Radio,
  Sparkles,
  RefreshCw,
  Activity,
  Sliders,
  Layers,
  Shuffle,
  Volume2,
} from 'lucide-react';
import { TerminalEntity, TerminalMinigameType } from '../types';
import { sound } from '../game/audio';

interface TerminalMinigameModalProps {
  isOpen: boolean;
  terminal: TerminalEntity | null;
  onClose: () => void;
  onSuccess: (bonusRads: number) => void;
}

// ==========================================
// 1. CIRCUIT MAZE MINIGAME DATA & COMPONENT
// ==========================================
const MAZE_TEMPLATES = [
  // Template A: Corridor Web
  [
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    [1, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1],
    [1, 0, 1, 0, 1, 0, 1, 1, 1, 0, 1],
    [1, 0, 1, 0, 0, 0, 0, 0, 1, 0, 1],
    [1, 0, 1, 1, 1, 1, 1, 0, 1, 0, 1],
    [1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 1],
    [1, 1, 1, 0, 1, 0, 1, 1, 1, 0, 1],
    [1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 1],
    [1, 0, 1, 1, 1, 1, 1, 0, 1, 0, 1],
    [1, 0, 0, 0, 0, 0, 0, 0, 0, 3, 1],
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
  ],
  // Template B: Concentric Chambers
  [
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1],
    [1, 0, 1, 1, 0, 1, 0, 1, 1, 0, 1],
    [1, 0, 1, 0, 0, 0, 0, 0, 1, 0, 1],
    [1, 0, 1, 0, 1, 1, 1, 0, 1, 0, 1],
    [1, 0, 0, 0, 1, 0, 1, 0, 0, 0, 1],
    [1, 1, 1, 0, 1, 0, 1, 0, 1, 1, 1],
    [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
    [1, 0, 1, 1, 1, 0, 1, 1, 1, 0, 1],
    [1, 0, 0, 0, 1, 0, 0, 0, 0, 3, 1],
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
  ],
  // Template C: Matrix Hub
  [
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    [1, 0, 1, 0, 0, 0, 0, 0, 1, 0, 1],
    [1, 0, 1, 0, 1, 1, 1, 0, 1, 0, 1],
    [1, 0, 0, 0, 1, 0, 1, 0, 0, 0, 1],
    [1, 1, 1, 0, 0, 0, 0, 0, 1, 1, 1],
    [1, 0, 0, 0, 1, 1, 1, 0, 0, 0, 1],
    [1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1],
    [1, 0, 1, 0, 0, 0, 0, 0, 1, 0, 1],
    [1, 0, 1, 1, 1, 0, 1, 1, 1, 0, 1],
    [1, 0, 0, 0, 0, 0, 0, 0, 0, 3, 1],
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
  ],
];

interface Sentinel {
  x: number;
  y: number;
  dx: number;
  dy: number;
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
}

const CircuitMazeGame: React.FC<{
  isHacked: boolean;
  onVictory: () => void;
  addLog: (msg: string) => void;
}> = ({ isHacked, onVictory, addLog }) => {
  const [playerPos, setPlayerPos] = useState<{ x: number; y: number }>({ x: 1, y: 1 });
  const [maze, setMaze] = useState<number[][]>([]);
  const [keysCollected, setKeysCollected] = useState<number>(0);
  const [totalKeys] = useState<number>(3);
  const [traceTimer, setTraceTimer] = useState<number>(60);
  const [sentinels, setSentinels] = useState<Sentinel[]>([]);
  const hasWonRef = useRef<boolean>(false);

  // Randomize maze layout and keys
  const randomizeMaze = useCallback(() => {
    hasWonRef.current = false;
    const templateIndex = Math.floor(Math.random() * MAZE_TEMPLATES.length);
    const base = MAZE_TEMPLATES[templateIndex].map((r) => [...r]);

    // Find valid empty spots for 3 keys
    const openSpots: { x: number; y: number }[] = [];
    for (let r = 1; r < base.length - 1; r++) {
      for (let c = 1; c < base[0].length - 1; c++) {
        if (base[r][c] === 0 && !(r === 1 && c === 1) && !(r === 9 && c === 9)) {
          openSpots.push({ x: c, y: r });
        }
      }
    }

    // Shuffle and pick 3 keys
    openSpots.sort(() => Math.random() - 0.5);
    const pickedKeys = openSpots.slice(0, 3);
    for (const k of pickedKeys) {
      base[k.y][k.x] = 2; // 2 = Cipher Key
    }

    setMaze(base);
    setPlayerPos({ x: 1, y: 1 });
    setKeysCollected(0);
    setTraceTimer(60);

    // Randomize 2 sentinels
    const s1X = Math.random() > 0.5 ? 5 : 7;
    const s2Y = Math.random() > 0.5 ? 5 : 7;
    setSentinels([
      { x: s1X, y: 1, dx: 1, dy: 0, minX: 4, maxX: 8, minY: 1, maxY: 1 },
      { x: 1, y: s2Y, dx: 0, dy: 1, minX: 1, maxX: 1, minY: 4, maxY: 8 },
    ]);
    addLog('> CIRCUITO LABERÍNTICO CARGADO: Extrae las 3 llaves (🔷) para vulnerar el Núcleo (💾).');
  }, [addLog]);

  useEffect(() => {
    randomizeMaze();
  }, [randomizeMaze]);

  // Trace countdown
  useEffect(() => {
    if (isHacked) return;
    const timer = setInterval(() => {
      setTraceTimer((prev) => {
        if (prev <= 1) {
          setPlayerPos({ x: 1, y: 1 });
          sound.playExplosion();
          addLog('⚠️ RASTREO COMPLETADO: Centinela reinició tu conexión al nodo inicial.');
          return 45;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [isHacked, addLog]);

  // Sentinel movement loop
  useEffect(() => {
    if (isHacked) return;
    const interval = setInterval(() => {
      setSentinels((prev) =>
        prev.map((s) => {
          let nx = s.x + s.dx;
          let ny = s.y + s.dy;
          let ndx = s.dx;
          let ndy = s.dy;
          if (nx > s.maxX || nx < s.minX) {
            ndx = -ndx;
            nx = s.x + ndx;
          }
          if (ny > s.maxY || ny < s.minY) {
            ndy = -ndy;
            ny = s.y + ndy;
          }
          return { ...s, x: nx, y: ny, dx: ndx, dy: ndy };
        })
      );
    }, 650);
    return () => clearInterval(interval);
  }, [isHacked]);

  // Check collision with Sentinels
  useEffect(() => {
    if (isHacked) return;
    for (const s of sentinels) {
      if (s.x === playerPos.x && s.y === playerPos.y) {
        sound.playPlayerDamage();
        setPlayerPos({ x: 1, y: 1 });
        addLog('🛑 ¡COLISIÓN CON FIREWALL! Sonda reiniciada al punto de acceso.');
        break;
      }
    }
  }, [playerPos, sentinels, isHacked, addLog]);

  // Movement Logic
  const handleMove = useCallback(
    (dx: number, dy: number) => {
      if (isHacked || maze.length === 0) return;
      const newX = playerPos.x + dx;
      const newY = playerPos.y + dy;

      if (newX < 0 || newX >= maze[0].length || newY < 0 || newY >= maze.length) return;
      const targetTile = maze[newY][newX];
      if (targetTile === 1) {
        sound.playEmptyClick();
        return;
      }

      sound.playHackBeep();
      setPlayerPos({ x: newX, y: newY });

      // Check for Cipher Key (2)
      if (targetTile === 2) {
        sound.playPickup();
        const nextKeys = keysCollected + 1;
        setKeysCollected(nextKeys);
        setMaze((prev) => {
          const copy = prev.map((r) => [...r]);
          copy[newY][newX] = 0;
          return copy;
        });
        addLog(`🔑 PAQUETE DESENCRIPTADO [${nextKeys}/3]! Cifrado vulnerable.`);
      }

      // Check for Core CPU (3)
      if (targetTile === 3) {
        if (keysCollected >= 3) {
          if (!hasWonRef.current) {
            hasWonRef.current = true;
            sound.playBossDeath();
            onVictory();
            addLog('🏆 ¡ACCESO TOTAL CONCEDIDO! NÚCLEO DESCARGADO (+35 RADS).');
          }
        } else {
          sound.playEmptyClick();
          addLog(`🔒 NÚCLEO BLOQUEADO: Requiere las 3 llaves criptográficas (${keysCollected}/3).`);
        }
      }
    },
    [playerPos, maze, keysCollected, isHacked, onVictory, addLog]
  );

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['ArrowUp', 'KeyW'].includes(e.code)) {
        e.preventDefault();
        handleMove(0, -1);
      } else if (['ArrowDown', 'KeyS'].includes(e.code)) {
        e.preventDefault();
        handleMove(0, 1);
      } else if (['ArrowLeft', 'KeyA'].includes(e.code)) {
        e.preventDefault();
        handleMove(-1, 0);
      } else if (['ArrowRight', 'KeyD'].includes(e.code)) {
        e.preventDefault();
        handleMove(1, 0);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleMove]);

  if (maze.length === 0) return null;

  return (
    <div className="flex flex-col items-center w-full">
      {/* Status Bar */}
      <div className="w-full flex items-center justify-between bg-[#040806] border border-emerald-900/80 px-3 py-1.5 rounded mb-2.5 text-[9px]">
        <span className="text-yellow-400 flex items-center gap-1 font-bold">
          <Key className="w-3.5 h-3.5" />
          LLAVES: {keysCollected} / {totalKeys}
        </span>
        <span
          className={`flex items-center gap-1 font-bold ${
            traceTimer < 15 ? 'text-red-400 animate-pulse' : 'text-emerald-400'
          }`}
        >
          <Radio className="w-3.5 h-3.5 animate-spin" />
          RASTREO: {traceTimer}s
        </span>
        <button
          onClick={randomizeMaze}
          className="flex items-center gap-1 text-emerald-400 hover:text-emerald-200 cursor-pointer bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800"
          title="Generar nueva matriz aleatoria"
        >
          <RefreshCw className="w-3 h-3" />
          REGENERAR
        </button>
      </div>

      {/* Grid Canvas */}
      <div className="bg-[#020604] border-2 border-emerald-700/60 p-2 rounded shadow-[inset_0_0_15px_rgba(16,185,129,0.2)]">
        <div
          className="grid gap-1"
          style={{ gridTemplateColumns: `repeat(${maze[0].length}, minmax(0, 1fr))` }}
        >
          {maze.map((row, rIdx) =>
            row.map((cell, cIdx) => {
              const isPlayer = playerPos.x === cIdx && playerPos.y === rIdx;
              const isSentinel = sentinels.some((s) => s.x === cIdx && s.y === rIdx);
              const isWall = cell === 1;
              const isKey = cell === 2;
              const isCore = cell === 3;

              return (
                <div
                  key={`${rIdx}-${cIdx}`}
                  onClick={() => {
                    const dx = cIdx - playerPos.x;
                    const dy = rIdx - playerPos.y;
                    if (Math.abs(dx) + Math.abs(dy) === 1) {
                      handleMove(dx, dy);
                    }
                  }}
                  className={`w-6 h-6 sm:w-7 sm:h-7 rounded flex items-center justify-center text-xs font-bold transition-all relative ${
                    isWall
                      ? 'bg-[#0f172a] border border-[#1e293b]'
                      : 'bg-[#021f14]/80 border border-emerald-950 hover:bg-[#064e3b]/50 cursor-pointer'
                  }`}
                >
                  {!isWall && <div className="w-1.5 h-1.5 rounded-full bg-emerald-900/50" />}
                  {isPlayer && (
                    <div className="absolute w-5 h-5 rounded-full bg-emerald-400 border-2 border-white shadow-[0_0_12px_#34d399] flex items-center justify-center animate-pulse z-20">
                      <div className="w-2 h-2 rounded-full bg-white" />
                    </div>
                  )}
                  {isSentinel && !isPlayer && (
                    <div className="absolute w-4 h-4 rounded-xs bg-red-600 border border-red-300 shadow-[0_0_8px_#ef4444] animate-ping z-10" />
                  )}
                  {isKey && (
                    <span className="text-yellow-300 text-sm animate-bounce drop-shadow-[0_0_6px_#facc15]">
                      🔷
                    </span>
                  )}
                  {isCore && (
                    <span className="text-cyan-300 text-sm drop-shadow-[0_0_8px_#38bdf8]">
                      💾
                    </span>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* D-Pad Controls */}
      <div className="mt-2.5 flex flex-col items-center gap-1">
        <button
          onClick={() => handleMove(0, -1)}
          className="w-9 h-9 bg-[#064e3b] hover:bg-[#047857] active:scale-95 border border-emerald-400 rounded flex items-center justify-center text-white cursor-pointer shadow-[0_2px_0_#065f46]"
        >
          <ArrowUp className="w-4 h-4" />
        </button>
        <div className="flex gap-2">
          <button
            onClick={() => handleMove(-1, 0)}
            className="w-9 h-9 bg-[#064e3b] hover:bg-[#047857] active:scale-95 border border-emerald-400 rounded flex items-center justify-center text-white cursor-pointer shadow-[0_2px_0_#065f46]"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleMove(0, 1)}
            className="w-9 h-9 bg-[#064e3b] hover:bg-[#047857] active:scale-95 border border-emerald-400 rounded flex items-center justify-center text-white cursor-pointer shadow-[0_2px_0_#065f46]"
          >
            <ArrowDown className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleMove(1, 0)}
            className="w-9 h-9 bg-[#064e3b] hover:bg-[#047857] active:scale-95 border border-emerald-400 rounded flex items-center justify-center text-white cursor-pointer shadow-[0_2px_0_#065f46]"
          >
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

// ==========================================
// 2. FREQUENCY LOCK / OSCILLOSCOPE MINIGAME
// ==========================================
const FrequencyLockGame: React.FC<{
  isHacked: boolean;
  onVictory: () => void;
  addLog: (msg: string) => void;
}> = ({ isHacked, onVictory, addLog }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const hasWonRef = useRef<boolean>(false);

  // Target carrier wave
  const [targetFreq, setTargetFreq] = useState<number>(2.4);
  const [targetAmp, setTargetAmp] = useState<number>(45);
  const [targetPhase, setTargetPhase] = useState<number>(120);

  // User tuning parameters
  const [userFreq, setUserFreq] = useState<number>(1.2);
  const [userAmp, setUserAmp] = useState<number>(25);
  const [userPhase, setUserPhase] = useState<number>(40);

  const [resonance, setResonance] = useState<number>(0);
  const [lockProgress, setLockProgress] = useState<number>(0);

  // Victory trigger handler outside of setState
  const handleConfirmLock = useCallback(() => {
    if (hasWonRef.current || isHacked) return;
    hasWonRef.current = true;
    setLockProgress(100);
    sound.playBossDeath();
    addLog('🏆 ¡FRECUENCIA SINCRONIZADA AL 100%! Subportadora de seguridad vulnerada.');
    onVictory();
  }, [isHacked, onVictory, addLog]);

  // Randomize target waveform
  const randomizeFrequency = useCallback(() => {
    hasWonRef.current = false;
    const f = Number((Math.random() * 2.8 + 1.2).toFixed(1));
    const a = Math.floor(Math.random() * 32 + 28);
    const p = Math.floor(Math.random() * 280 + 30);
    setTargetFreq(f);
    setTargetAmp(a);
    setTargetPhase(p);

    // Set user away from target
    setUserFreq(Number((f > 2.5 ? f - 1.4 : f + 1.4).toFixed(1)));
    setUserAmp(a > 42 ? 20 : 56);
    setUserPhase((p + 140) % 360);
    setLockProgress(0);
    addLog(
      `> SEÑAL HOSTIL INTERCEPTADA (${f} kHz ~${a}V). Modula Frecuencia, Amplitud y Desfase para sintonizar.`
    );
  }, [addLog]);

  useEffect(() => {
    randomizeFrequency();
  }, [randomizeFrequency]);

  // Calculate resonance with forgiving tolerance
  useEffect(() => {
    const fDiff = Math.abs(userFreq - targetFreq) / 3.5;
    const aDiff = Math.abs(userAmp - targetAmp) / 60;
    let pDiff = Math.abs(userPhase - targetPhase) % 360;
    if (pDiff > 180) pDiff = 360 - pDiff;
    const pNorm = pDiff / 180;

    const totalDiff = fDiff * 0.45 + aDiff * 0.35 + pNorm * 0.2;
    const res = Math.max(0, Math.min(100, Math.round((1 - Math.min(totalDiff, 1)) * 100)));
    setResonance(res);
  }, [userFreq, userAmp, userPhase, targetFreq, targetAmp, targetPhase]);

  // Lock-in progress loop (pure progress accumulation)
  useEffect(() => {
    if (isHacked || hasWonRef.current) return;
    const interval = setInterval(() => {
      if (hasWonRef.current) return;
      if (resonance >= 75) {
        setLockProgress((prev) => {
          const increment = resonance >= 88 ? 35 : 22;
          const next = Math.min(100, prev + increment);
          if (next < 100) {
            sound.playTone(320 + next * 5, 0.05);
          }
          return next;
        });
      } else {
        setLockProgress((prev) => Math.max(0, prev - 10));
      }
    }, 110);
    return () => clearInterval(interval);
  }, [resonance, isHacked]);

  // Watch lockProgress reaching 100% to trigger victory cleanly
  useEffect(() => {
    if (lockProgress >= 100 && !hasWonRef.current && !isHacked) {
      handleConfirmLock();
    }
  }, [lockProgress, handleConfirmLock, isHacked]);

  // Keyboard shortcut: Space or Enter triggers lock if resonance is sufficient
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.code === 'Space' || e.code === 'Enter') && resonance >= 70 && !hasWonRef.current) {
        e.preventDefault();
        handleConfirmLock();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [resonance, handleConfirmLock]);

  // Oscilloscope Canvas Rendering
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let t = 0;

    const render = () => {
      t += 0.035;
      ctx.fillStyle = '#030d14';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Grid lines
      ctx.strokeStyle = 'rgba(14, 116, 144, 0.25)';
      ctx.lineWidth = 1;
      for (let x = 0; x < canvas.width; x += 25) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
      }
      for (let y = 0; y < canvas.height; y += 20) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
      }

      // Center crossline
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.4)';
      ctx.beginPath();
      ctx.moveTo(0, canvas.height / 2);
      ctx.lineTo(canvas.width, canvas.height / 2);
      ctx.stroke();

      const midY = canvas.height / 2;

      // 1. Target Signal (Amber Phosphor)
      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 2;
      ctx.beginPath();
      for (let x = 0; x < canvas.width; x++) {
        const rad = (x * targetFreq * 0.05 + t * 4 + (targetPhase * Math.PI) / 180);
        const y = midY + Math.sin(rad) * targetAmp;
        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();

      // 2. User Tuned Signal (Cyan / Green Laser)
      ctx.strokeStyle = resonance >= 80 ? '#22c55e' : '#38bdf8';
      ctx.lineWidth = 2.5;
      ctx.shadowColor = resonance >= 80 ? '#4ade80' : '#38bdf8';
      ctx.shadowBlur = 8;
      ctx.beginPath();
      for (let x = 0; x < canvas.width; x++) {
        const rad = (x * userFreq * 0.05 + t * 4 + (userPhase * Math.PI) / 180);
        const y = midY + Math.sin(rad) * userAmp;
        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
      ctx.shadowBlur = 0;

      animId = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(animId);
  }, [targetFreq, targetAmp, targetPhase, userFreq, userAmp, userPhase, resonance]);

  return (
    <div className="flex flex-col items-center w-full max-w-lg">
      {/* Top Indicators with Target Hints */}
      <div className="w-full flex items-center justify-between bg-[#04111d] border border-cyan-900 px-3 py-1.5 rounded mb-2 text-[9px]">
        <div className="flex items-center gap-2">
          <Activity className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
          <span className="text-cyan-200">
            RESONANCIA:{' '}
            <strong
              className={
                resonance >= 80
                  ? 'text-emerald-400 font-bold'
                  : resonance >= 60
                  ? 'text-cyan-300'
                  : 'text-amber-400'
              }
            >
              {resonance}%
            </strong>
          </span>
          <span className="hidden sm:inline text-slate-500">|</span>
          <span className="hidden sm:inline text-[8px] text-amber-300/90 font-mono">
            OBJETIVO: ~{targetFreq}kHz • {targetAmp}V
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-cyan-400">BLOQUEO:</span>
          <div className="w-20 sm:w-24 h-2.5 bg-black/60 border border-cyan-700 rounded overflow-hidden">
            <div
              className={`h-full transition-all duration-100 ${
                lockProgress >= 80 ? 'bg-emerald-400' : 'bg-cyan-400'
              }`}
              style={{ width: `${lockProgress}%` }}
            />
          </div>
        </div>
        <button
          onClick={randomizeFrequency}
          className="flex items-center gap-1 text-cyan-400 hover:text-cyan-200 cursor-pointer bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-800 text-[8px]"
        >
          <RefreshCw className="w-3 h-3" />
          REINICIAR
        </button>
      </div>

      {/* Oscilloscope Canvas */}
      <div className="relative border-2 border-cyan-600 rounded bg-[#030d14] overflow-hidden shadow-[0_0_15px_rgba(56,189,248,0.2)]">
        <canvas ref={canvasRef} width={360} height={130} className="block" />
        <div className="absolute top-1.5 left-2 flex items-center gap-3 text-[8px] pointer-events-none">
          <span className="text-amber-400 flex items-center gap-1 font-bold">
            <span className="w-2 h-0.5 bg-amber-400 inline-block" /> PORTADORA ENEMIGA ({targetFreq} kHz)
          </span>
          <span className="text-cyan-400 flex items-center gap-1 font-bold">
            <span className="w-2 h-0.5 bg-cyan-400 inline-block" /> TU SONDA ({userFreq} kHz)
          </span>
        </div>
        {(isHacked || lockProgress >= 100) && (
          <div className="absolute inset-0 bg-emerald-950/85 backdrop-blur-[1px] flex items-center justify-center pointer-events-none">
            <div className="bg-black/90 border-2 border-emerald-400 px-4 py-2 rounded text-emerald-300 font-bold text-xs flex items-center gap-2 shadow-[0_0_25px_#10b981]">
              <CheckCircle2 className="w-5 h-5 text-emerald-400 animate-pulse" />
              <span>FRECUENCIA SINCRONIZADA AL 100%</span>
            </div>
          </div>
        )}
      </div>

      {/* Instant Sync Action Button */}
      <div className="w-full mt-2">
        <button
          id="frequency-sync-now-btn"
          disabled={isHacked || resonance < 70}
          onClick={handleConfirmLock}
          className={`w-full py-2 px-3 rounded font-bold text-[9px] sm:text-[10px] flex items-center justify-center gap-2 border transition-all cursor-pointer ${
            resonance >= 70
              ? 'bg-emerald-600 hover:bg-emerald-500 text-white border-emerald-300 shadow-[0_0_15px_rgba(16,185,129,0.5)] animate-pulse'
              : 'bg-slate-900 text-slate-500 border-slate-800 cursor-not-allowed'
          }`}
        >
          <Activity className="w-4 h-4" />
          {resonance >= 70
            ? '⚡ ¡ENGANCHAR FRECUENCIA Y DESBLOQUEAR TERMINAL! (+35 RADS)'
            : `SINTONIZA LAS ONDAS (ACTUAL: ${resonance}% / MÍN. 70%)`}
        </button>
      </div>

      {/* Sliders & Fine-Tune Controls */}
      <div className="w-full mt-2 grid grid-cols-1 sm:grid-cols-3 gap-2 bg-[#051624] border border-cyan-900/80 p-2.5 rounded">
        {/* Frequency */}
        <div className="flex flex-col gap-1">
          <div className="flex justify-between text-[8px] text-cyan-300 font-bold">
            <span>FRECUENCIA</span>
            <span className="text-cyan-100">{userFreq} kHz</span>
          </div>
          <input
            type="range"
            min="0.8"
            max="4.5"
            step="0.1"
            value={userFreq}
            disabled={isHacked}
            onChange={(e) => {
              const val = parseFloat(e.target.value);
              setUserFreq(val);
              sound.playTone(val * 160, 0.04);
            }}
            className="accent-cyan-400 cursor-pointer h-1.5 bg-cyan-950 rounded disabled:opacity-50"
          />
          <div className="flex justify-between text-[7px] text-cyan-600">
            <button
              disabled={isHacked}
              onClick={() => setUserFreq((f) => Math.max(0.8, Number((f - 0.1).toFixed(1))))}
              className="px-1.5 py-0.5 bg-cyan-950 hover:bg-cyan-900 text-cyan-300 rounded border border-cyan-800 cursor-pointer disabled:opacity-50"
            >
              -0.1
            </button>
            <button
              disabled={isHacked}
              onClick={() => setUserFreq((f) => Math.min(4.5, Number((f + 0.1).toFixed(1))))}
              className="px-1.5 py-0.5 bg-cyan-950 hover:bg-cyan-900 text-cyan-300 rounded border border-cyan-800 cursor-pointer disabled:opacity-50"
            >
              +0.1
            </button>
          </div>
        </div>

        {/* Amplitude */}
        <div className="flex flex-col gap-1">
          <div className="flex justify-between text-[8px] text-cyan-300 font-bold">
            <span>AMPLITUD</span>
            <span className="text-cyan-100">{userAmp} V</span>
          </div>
          <input
            type="range"
            min="10"
            max="70"
            step="1"
            value={userAmp}
            disabled={isHacked}
            onChange={(e) => {
              const val = parseInt(e.target.value, 10);
              setUserAmp(val);
              sound.playTone(200 + val * 3, 0.03);
            }}
            className="accent-cyan-400 cursor-pointer h-1.5 bg-cyan-950 rounded disabled:opacity-50"
          />
          <div className="flex justify-between text-[7px] text-cyan-600">
            <button
              disabled={isHacked}
              onClick={() => setUserAmp((a) => Math.max(10, a - 2))}
              className="px-1.5 py-0.5 bg-cyan-950 hover:bg-cyan-900 text-cyan-300 rounded border border-cyan-800 cursor-pointer disabled:opacity-50"
            >
              -2
            </button>
            <button
              disabled={isHacked}
              onClick={() => setUserAmp((a) => Math.min(70, a + 2))}
              className="px-1.5 py-0.5 bg-cyan-950 hover:bg-cyan-900 text-cyan-300 rounded border border-cyan-800 cursor-pointer disabled:opacity-50"
            >
              +2
            </button>
          </div>
        </div>

        {/* Phase */}
        <div className="flex flex-col gap-1">
          <div className="flex justify-between text-[8px] text-cyan-300 font-bold">
            <span>DESFASE</span>
            <span className="text-cyan-100">{userPhase}°</span>
          </div>
          <input
            type="range"
            min="0"
            max="360"
            step="5"
            value={userPhase}
            disabled={isHacked}
            onChange={(e) => {
              const val = parseInt(e.target.value, 10);
              setUserPhase(val);
              sound.playTone(320 + (val / 360) * 120, 0.03);
            }}
            className="accent-cyan-400 cursor-pointer h-1.5 bg-cyan-950 rounded disabled:opacity-50"
          />
          <div className="flex justify-between text-[7px] text-cyan-600">
            <button
              disabled={isHacked}
              onClick={() => setUserPhase((p) => (p - 10 + 360) % 360)}
              className="px-1.5 py-0.5 bg-cyan-950 hover:bg-cyan-900 text-cyan-300 rounded border border-cyan-800 cursor-pointer disabled:opacity-50"
            >
              -10°
            </button>
            <button
              disabled={isHacked}
              onClick={() => setUserPhase((p) => (p + 10) % 360)}
              className="px-1.5 py-0.5 bg-cyan-950 hover:bg-cyan-900 text-cyan-300 rounded border border-cyan-800 cursor-pointer disabled:opacity-50"
            >
              +10°
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ==========================================
// 3. MEMORY CIPHER / QUANTUM SIMON PROTOCOL
// ==========================================
const CIPHER_NODES = [
  { id: 0, label: 'ALFA', hex: '0x1A', color: 'border-cyan-400 text-cyan-300 bg-cyan-950/70', freq: 294 },
  { id: 1, label: 'BETA', hex: '0x4B', color: 'border-emerald-400 text-emerald-300 bg-emerald-950/70', freq: 370 },
  { id: 2, label: 'GAMMA', hex: '0x7C', color: 'border-amber-400 text-amber-300 bg-amber-950/70', freq: 440 },
  { id: 3, label: 'DELTA', hex: '0x9D', color: 'border-purple-400 text-purple-300 bg-purple-950/70', freq: 554 },
  { id: 4, label: 'OMEGA', hex: '0xFE', color: 'border-rose-400 text-rose-300 bg-rose-950/70', freq: 659 },
];

const MemoryCipherGame: React.FC<{
  isHacked: boolean;
  onVictory: () => void;
  addLog: (msg: string) => void;
}> = ({ isHacked, onVictory, addLog }) => {
  const [currentStage, setCurrentStage] = useState<number>(1); // 1 to 3
  const [sequence, setSequence] = useState<number[]>([]);
  const [playerInputStep, setPlayerInputStep] = useState<number>(0);
  const [activeFlashingNode, setActiveFlashingNode] = useState<number | null>(null);
  const [gameState, setGameState] = useState<'IDLE' | 'PLAYING' | 'WAITING_INPUT' | 'ERROR'>('IDLE');
  const [lives, setLives] = useState<number>(3);
  const hasWonRef = useRef<boolean>(false);

  // Generate sequence for current stage
  const startStage = useCallback(
    (stage: number) => {
      const length = stage === 1 ? 3 : stage === 2 ? 4 : 5;
      const newSeq: number[] = [];
      for (let i = 0; i < length; i++) {
        newSeq.push(Math.floor(Math.random() * 5));
      }
      setSequence(newSeq);
      setPlayerInputStep(0);
      setGameState('PLAYING');
      addLog(`> SECUENCIA PROTOCOLO [FASE ${stage}/3]: Memoriza el patrón criptográfico.`);

      // Playback sequence
      let idx = 0;
      const interval = setInterval(() => {
        if (idx < newSeq.length) {
          const nodeIdx = newSeq[idx];
          setActiveFlashingNode(nodeIdx);
          sound.playTone(CIPHER_NODES[nodeIdx].freq, 0.25);
          setTimeout(() => setActiveFlashingNode(null), 250);
          idx++;
        } else {
          clearInterval(interval);
          setActiveFlashingNode(null);
          setGameState('WAITING_INPUT');
          addLog('> TU TURNO: Introduce los códigos en el orden exacto.');
        }
      }, 550);
    },
    [addLog]
  );

  useEffect(() => {
    startStage(1);
  }, [startStage]);

  const handleNodeClick = (nodeId: number) => {
    if (gameState !== 'WAITING_INPUT' || isHacked) return;

    sound.playTone(CIPHER_NODES[nodeId].freq, 0.18);
    setActiveFlashingNode(nodeId);
    setTimeout(() => setActiveFlashingNode(null), 180);

    if (nodeId === sequence[playerInputStep]) {
      // Correct!
      const nextStep = playerInputStep + 1;
      setPlayerInputStep(nextStep);

      if (nextStep === sequence.length) {
        // Stage Complete!
        sound.playPickup();
        if (currentStage >= 3) {
          if (!hasWonRef.current) {
            hasWonRef.current = true;
            sound.playBossDeath();
            onVictory();
            addLog('🏆 ¡SECUENCIA NEMÓNICA COMPLETADA! Cortafuegos desmantelado.');
          }
        } else {
          addLog(`✅ FASE ${currentStage} VERIFICADA. Avanzando a fase siguiente...`);
          setCurrentStage((s) => s + 1);
          setTimeout(() => startStage(currentStage + 1), 700);
        }
      }
    } else {
      // Mistake!
      sound.playPlayerDamage();
      setGameState('ERROR');
      const nextLives = lives - 1;
      setLives(nextLives);
      addLog(`⚠️ SECUENCIA ERRÓNEA: Código incorrecto. Intentos restantes: ${nextLives}`);

      setTimeout(() => {
        if (nextLives <= 0) {
          setLives(3);
          setCurrentStage(1);
          startStage(1);
        } else {
          startStage(currentStage);
        }
      }, 900);
    }
  };

  return (
    <div className="flex flex-col items-center w-full max-w-md">
      {/* Top Banner */}
      <div className="w-full flex items-center justify-between bg-[#140e04] border border-amber-900 px-3 py-1.5 rounded mb-3 text-[9px]">
        <span className="text-amber-400 font-bold flex items-center gap-1">
          <Layers className="w-3.5 h-3.5" />
          FASE: {currentStage} / 3
        </span>
        <span className="text-amber-200">
          PROGRESO: {playerInputStep} / {sequence.length}
        </span>
        <span className="text-rose-400 font-bold">INTENTOS: {'❤️'.repeat(lives)}</span>
        <button
          onClick={() => {
            setCurrentStage(1);
            startStage(1);
          }}
          className="text-amber-400 hover:text-amber-200 cursor-pointer bg-amber-950/60 px-2 py-0.5 rounded border border-amber-800 flex items-center gap-1"
        >
          <RefreshCw className="w-3 h-3" />
          REINICIAR
        </button>
      </div>

      {/* State Instruction */}
      <div className="text-center mb-3">
        {gameState === 'PLAYING' && (
          <span className="text-amber-300 font-bold text-xs animate-pulse">
            TRANSMITIENDO SECUENCIA... OBSERVA LA PANTALLA
          </span>
        )}
        {gameState === 'WAITING_INPUT' && (
          <span className="text-emerald-400 font-bold text-xs">
            ¡TU TURNO! PULSA LOS RELÉS EN EL ORDEN MOSTRADO
          </span>
        )}
        {gameState === 'ERROR' && (
          <span className="text-red-400 font-bold text-xs animate-bounce">
            FALLO DE SECUENCIA // REINTENTANDO FASE...
          </span>
        )}
      </div>

      {/* Cryptographic Relay Nodes */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 w-full">
        {CIPHER_NODES.map((node) => {
          const isFlashing = activeFlashingNode === node.id;
          return (
            <button
              key={node.id}
              onClick={() => handleNodeClick(node.id)}
              disabled={gameState !== 'WAITING_INPUT' || isHacked}
              className={`p-3 rounded-lg border-2 flex flex-col items-center justify-center transition-all cursor-pointer select-none active:scale-95 ${
                node.color
              } ${
                isFlashing
                  ? 'bg-white text-black border-white shadow-[0_0_20px_#ffffff] scale-105'
                  : 'hover:brightness-125'
              }`}
            >
              <span className="text-xs font-bold tracking-widest">{node.label}</span>
              <span className="text-[9px] opacity-75 font-mono">{node.hex}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

// ==========================================
// 4. WIRE BYPASS / CONDUIT MATRIX ROUTER
// ==========================================
// Direction bits: 1 = Top, 2 = Right, 4 = Bottom, 8 = Left
type TileType = 'straight' | 'corner' | 'tee' | 'cross';

interface ConduitTile {
  type: TileType;
  rotation: number; // 0, 1, 2, 3 (times 90 deg clockwise)
  isPowered: boolean;
}

const WireBypassGame: React.FC<{
  isHacked: boolean;
  onVictory: () => void;
  addLog: (msg: string) => void;
}> = ({ isHacked, onVictory, addLog }) => {
  const GRID_SIZE = 4;
  const [grid, setGrid] = useState<ConduitTile[][]>([]);
  const hasWonRef = useRef<boolean>(false);

  // Rotate connections array [top, right, bottom, left]
  const getConnections = (type: TileType, rot: number): boolean[] => {
    let base = [false, false, false, false];
    if (type === 'straight') base = [true, false, true, false]; // vertical initially
    if (type === 'corner') base = [true, true, false, false]; // top-right
    if (type === 'tee') base = [true, true, false, true]; // top-right-left
    if (type === 'cross') base = [true, true, true, true];

    const shifted = [false, false, false, false];
    for (let i = 0; i < 4; i++) {
      shifted[(i + rot) % 4] = base[i];
    }
    return shifted;
  };

  // Generate a guaranteed solvable matrix
  const generateSolvableGrid = useCallback(() => {
    hasWonRef.current = false;
    // Generate empty board
    const newGrid: ConduitTile[][] = [];
    const tileTypesPool: TileType[] = ['straight', 'corner', 'tee', 'cross'];

    for (let r = 0; r < GRID_SIZE; r++) {
      const row: ConduitTile[] = [];
      for (let c = 0; c < GRID_SIZE; c++) {
        const randomType = tileTypesPool[Math.floor(Math.random() * tileTypesPool.length)];
        const randomRot = Math.floor(Math.random() * 4);
        row.push({ type: randomType, rotation: randomRot, isPowered: false });
      }
      newGrid.push(row);
    }

    // Carve a guaranteed path from (0,0) to (3,3):
    // Simple L / S path: (0,0) -> (0,2) -> (2,2) -> (2,3) -> (3,3)
    newGrid[0][0] = { type: 'corner', rotation: 1, isPowered: false }; // connects top/source and right
    newGrid[0][1] = { type: 'straight', rotation: 1, isPowered: false }; // horizontal
    newGrid[0][2] = { type: 'corner', rotation: 2, isPowered: false }; // right-down
    newGrid[1][2] = { type: 'straight', rotation: 0, isPowered: false }; // vertical
    newGrid[2][2] = { type: 'corner', rotation: 1, isPowered: false }; // up-right
    newGrid[2][3] = { type: 'corner', rotation: 2, isPowered: false }; // left-down
    newGrid[3][3] = { type: 'corner', rotation: 0, isPowered: false }; // connects up to core

    // Now scramble rotations (1 to 3 times each)
    for (let r = 0; r < GRID_SIZE; r++) {
      for (let c = 0; c < GRID_SIZE; c++) {
        const scramble = Math.floor(Math.random() * 3) + 1;
        newGrid[r][c].rotation = (newGrid[r][c].rotation + scramble) % 4;
      }
    }

    setGrid(newGrid);
    addLog('> MATRIZ ELÉCTRICA ACTIVADA: Rota los conductos para llevar corriente al Núcleo.');
  }, [addLog]);

  useEffect(() => {
    generateSolvableGrid();
  }, [generateSolvableGrid]);

  // Electrical Flow Tracer
  useEffect(() => {
    if (grid.length === 0 || isHacked) return;

    // Reset powered states
    const updated = grid.map((r) => r.map((c) => ({ ...c, isPowered: false })));

    // BFS Queue
    const queue: [number, number][] = [];

    // Check if (0,0) can receive power from Top or Left (source)
    const startConn = getConnections(updated[0][0].type, updated[0][0].rotation);
    if (startConn[0] || startConn[3]) {
      updated[0][0].isPowered = true;
      queue.push([0, 0]);
    }

    const visited = new Set<string>();
    visited.add('0,0');

    // BFS through connected adjacent ports
    const deltas = [
      { dr: -1, dc: 0, outDir: 0, inDir: 2 }, // Top
      { dr: 0, dc: 1, outDir: 1, inDir: 3 }, // Right
      { dr: 1, dc: 0, outDir: 2, inDir: 0 }, // Bottom
      { dr: 0, dc: -1, outDir: 3, inDir: 1 }, // Left
    ];

    while (queue.length > 0) {
      const [r, c] = queue.shift()!;
      const currConn = getConnections(updated[r][c].type, updated[r][c].rotation);

      for (const d of deltas) {
        const nr = r + d.dr;
        const nc = c + d.dc;
        if (nr >= 0 && nr < GRID_SIZE && nc >= 0 && nc < GRID_SIZE) {
          const neighborConn = getConnections(updated[nr][nc].type, updated[nr][nc].rotation);
          if (currConn[d.outDir] && neighborConn[d.inDir]) {
            if (!visited.has(`${nr},${nc}`)) {
              visited.add(`${nr},${nc}`);
              updated[nr][nc].isPowered = true;
              queue.push([nr, nc]);
            }
          }
        }
      }
    }

    // Check victory: is (3,3) powered and connected towards destination?
    const destConn = getConnections(updated[3][3].type, updated[3][3].rotation);
    if (updated[3][3].isPowered && (destConn[1] || destConn[2] || destConn[0] || destConn[3])) {
      if (!hasWonRef.current) {
        hasWonRef.current = true;
        sound.playBossDeath();
        onVictory();
        addLog('🏆 ¡CIRCUITO CERRADO! Descarga de voltaje anuló los cerrojos del sector.');
      }
    }

    setGrid(updated);
  }, [grid.length, onVictory, isHacked, addLog]);

  const handleRotateTile = (r: number, c: number) => {
    if (isHacked || grid.length === 0) return;
    sound.playEmptyClick();
    setGrid((prev) => {
      const copy = prev.map((row) => row.map((tile) => ({ ...tile })));
      copy[r][c].rotation = (copy[r][c].rotation + 1) % 4;
      return copy;
    });
  };

  if (grid.length === 0) return null;

  return (
    <div className="flex flex-col items-center w-full max-w-md">
      {/* Top Banner */}
      <div className="w-full flex items-center justify-between bg-[#150a21] border border-purple-900 px-3 py-1.5 rounded mb-2.5 text-[9px]">
        <span className="text-purple-300 font-bold flex items-center gap-1">
          <Zap className="w-3.5 h-3.5 text-purple-400 animate-pulse" />
          FLUJO: ENTRADA (0,0) ➔ NÚCLEO (3,3)
        </span>
        <button
          onClick={generateSolvableGrid}
          className="text-purple-400 hover:text-purple-200 cursor-pointer bg-purple-950/60 px-2 py-0.5 rounded border border-purple-800 flex items-center gap-1"
        >
          <RefreshCw className="w-3 h-3" />
          REBARAJAR
        </button>
      </div>

      {/* Conduit Grid */}
      <div className="bg-[#0b0412] p-2.5 rounded-lg border-2 border-purple-600/80 shadow-[0_0_20px_rgba(192,132,252,0.25)] relative">
        {/* Source and Core Badges */}
        <div className="absolute -top-2.5 left-4 px-2 py-0.5 bg-cyan-600 text-white font-bold text-[7px] rounded border border-cyan-400">
          ⚡ ENTRADA
        </div>
        <div className="absolute -bottom-2.5 right-4 px-2 py-0.5 bg-yellow-500 text-black font-bold text-[7px] rounded border border-yellow-300">
          💾 NÚCLEO
        </div>

        <div className="grid grid-cols-4 gap-1.5 mt-1">
          {grid.map((row, r) =>
            row.map((tile, c) => {
              const conns = getConnections(tile.type, tile.rotation);
              const isEnergized = tile.isPowered;

              return (
                <button
                  key={`${r}-${c}`}
                  onClick={() => handleRotateTile(r, c)}
                  className={`w-12 h-12 sm:w-14 sm:h-14 rounded-md border-2 relative flex items-center justify-center transition-all cursor-pointer active:scale-95 ${
                    isEnergized
                      ? 'bg-purple-950/80 border-cyan-400 shadow-[0_0_12px_rgba(56,189,248,0.5)]'
                      : 'bg-[#150a21] border-purple-900/60 hover:border-purple-500'
                  }`}
                >
                  {/* Central Node */}
                  <div
                    className={`w-3.5 h-3.5 rounded-full z-10 transition-all ${
                      isEnergized
                        ? 'bg-cyan-300 shadow-[0_0_8px_#38bdf8]'
                        : 'bg-purple-800/80'
                    }`}
                  />

                  {/* Wire Ports: Top */}
                  {conns[0] && (
                    <div
                      className={`absolute top-0 w-2.5 h-5 -translate-y-0.5 transition-colors ${
                        isEnergized ? 'bg-cyan-400' : 'bg-purple-700'
                      }`}
                    />
                  )}
                  {/* Wire Ports: Right */}
                  {conns[1] && (
                    <div
                      className={`absolute right-0 h-2.5 w-5 translate-x-0.5 transition-colors ${
                        isEnergized ? 'bg-cyan-400' : 'bg-purple-700'
                      }`}
                    />
                  )}
                  {/* Wire Ports: Bottom */}
                  {conns[2] && (
                    <div
                      className={`absolute bottom-0 w-2.5 h-5 translate-y-0.5 transition-colors ${
                        isEnergized ? 'bg-cyan-400' : 'bg-purple-700'
                      }`}
                    />
                  )}
                  {/* Wire Ports: Left */}
                  {conns[3] && (
                    <div
                      className={`absolute left-0 h-2.5 w-5 -translate-x-0.5 transition-colors ${
                        isEnergized ? 'bg-cyan-400' : 'bg-purple-700'
                      }`}
                    />
                  )}
                </button>
              );
            })
          )}
        </div>
      </div>
      <span className="text-[8px] text-purple-400/80 mt-2">
        Toca cualquier conducto para rotarlo 90°. Conecta la corriente desde la entrada al núcleo.
      </span>
    </div>
  );
};

// ==========================================
// MAIN TERMINAL MINIGAME MODAL
// ==========================================
export const TerminalMinigameModal: React.FC<TerminalMinigameModalProps> = ({
  isOpen,
  terminal,
  onClose,
  onSuccess,
}) => {
  const [activeMinigame, setActiveMinigame] = useState<TerminalMinigameType>('circuit_maze');
  const [isHacked, setIsHacked] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'game' | 'logs'>('game');
  const [logMessages, setLogMessages] = useState<string[]>([]);
  const [isQuickBypassing, setIsQuickBypassing] = useState<boolean>(false);
  const [quickBypassProgress, setQuickBypassProgress] = useState<number>(0);

  const hasClaimedRef = useRef<boolean>(false);
  const pendingRewardRef = useRef<number>(35);
  const autoExitTimerRef = useRef<NodeJS.Timeout | null>(null);

  const onSuccessRef = useRef(onSuccess);
  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onSuccessRef.current = onSuccess;
    onCloseRef.current = onClose;
  }, [onSuccess, onClose]);

  const addLog = useCallback((msg: string) => {
    setLogMessages((prev) => [...prev.slice(-6), msg]);
  }, []);

  const handleClaimAndClose = useCallback((customReward?: number) => {
    if (hasClaimedRef.current) return;
    hasClaimedRef.current = true;
    if (autoExitTimerRef.current) {
      clearTimeout(autoExitTimerRef.current);
      autoExitTimerRef.current = null;
    }
    const reward = customReward ?? pendingRewardRef.current ?? 35;
    try {
      if (onSuccessRef.current) onSuccessRef.current(reward);
    } catch (e) {
      console.error('Error during terminal reward claim:', e);
    }
    try {
      if (onCloseRef.current) onCloseRef.current();
    } catch (e) {
      console.error('Error closing terminal modal:', e);
    }
  }, []);

  const handleMinigameVictory = useCallback((bonusRads: number = 35) => {
    if (hasClaimedRef.current) return;
    setIsHacked(true);
    pendingRewardRef.current = bonusRads;
    addLog(`🏆 ¡PROTOCOLO SUPERADO! Concedidos +${bonusRads} RADS. Cerrando consola...`);

    if (autoExitTimerRef.current) {
      clearTimeout(autoExitTimerRef.current);
    }
    // Auto-exit after 350ms so player gets immediate audio-visual reward feedback, then returns straight to action
    autoExitTimerRef.current = setTimeout(() => {
      handleClaimAndClose(bonusRads);
    }, 350);
  }, [handleClaimAndClose, addLog]);

  const handleSafeClose = useCallback(() => {
    if (isHacked && !hasClaimedRef.current) {
      handleClaimAndClose();
    } else {
      if (autoExitTimerRef.current) {
        clearTimeout(autoExitTimerRef.current);
        autoExitTimerRef.current = null;
      }
      try {
        if (onCloseRef.current) onCloseRef.current();
      } catch (e) {
        console.error('Error in safe close:', e);
      }
    }
  }, [isHacked, handleClaimAndClose]);

  // Keyboard shortcut: Escape always closes or claims terminal safely
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        handleSafeClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, handleSafeClose]);

  // Initialize or randomize minigame when opened
  useEffect(() => {
    if (isOpen) {
      hasClaimedRef.current = false;
      pendingRewardRef.current = 35;
      if (autoExitTimerRef.current) {
        clearTimeout(autoExitTimerRef.current);
        autoExitTimerRef.current = null;
      }
      const allTypes: TerminalMinigameType[] = [
        'circuit_maze',
        'frequency_lock',
        'memory_cipher',
        'wire_bypass',
      ];
      // Pick terminal's assigned type or choose randomly
      const chosen = terminal?.minigameType || allTypes[Math.floor(Math.random() * allTypes.length)];
      setActiveMinigame(chosen);
      setIsHacked(terminal?.hacked || false);
      setIsQuickBypassing(false);
      setQuickBypassProgress(0);
      setActiveTab('game');
      setLogMessages([
        '> INICIANDO ENLACE DE CONSOLA TÁCTICA SEC-OS v4.2...',
        `> PROTOCOLO DE SEGURIDAD DETECTADO: [${chosen.toUpperCase().replace('_', ' ')}]`,
        '> INFILTRACIÓN EN CURSO // DESBLOQUEA EL NODO PARA EXTRAER INTELIGENCIA.',
      ]);
    } else {
      if (autoExitTimerRef.current) {
        clearTimeout(autoExitTimerRef.current);
        autoExitTimerRef.current = null;
      }
    }
  }, [isOpen, terminal]);

  // Quick Bypass action
  const handleQuickBypass = () => {
    if (isQuickBypassing || isHacked) return;
    setIsQuickBypassing(true);
    let progress = 0;
    const interval = setInterval(() => {
      progress += 25;
      setQuickBypassProgress(progress);
      sound.playHackBeep();
      if (progress >= 100) {
        clearInterval(interval);
        setIsQuickBypassing(false);
        sound.playPickup();
        addLog('⚡ BYPASS FORZADO EXITOSO: Protocolos eludidos de emergencia (+15 RADS).');
        handleMinigameVictory(15);
      }
    }, 200);
  };

  if (!isOpen) return null;

  // Theme color accents per minigame
  const minigameColors = {
    circuit_maze: {
      border: 'border-emerald-600',
      shadow: 'shadow-[0_0_40px_rgba(34,197,94,0.25)]',
      text: 'text-emerald-400',
      title: 'LABERINTO CRIPTOGRÁFICO',
    },
    frequency_lock: {
      border: 'border-cyan-600',
      shadow: 'shadow-[0_0_40px_rgba(56,189,248,0.25)]',
      text: 'text-cyan-400',
      title: 'SINTONIZADOR DE ONDAS',
    },
    memory_cipher: {
      border: 'border-amber-600',
      shadow: 'shadow-[0_0_40px_rgba(245,158,11,0.25)]',
      text: 'text-amber-400',
      title: 'SECUENCIA NEMÓNICA',
    },
    wire_bypass: {
      border: 'border-purple-600',
      shadow: 'shadow-[0_0_40px_rgba(192,132,252,0.25)]',
      text: 'text-purple-400',
      title: 'DERIVACIÓN DE CONDUCTOS',
    },
  };

  const currentTheme = minigameColors[activeMinigame];

  return (
    <div
      id="terminal-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-xs p-2 sm:p-4 select-none font-mono"
      onClick={(e) => {
        if (e.target === e.currentTarget) handleSafeClose();
      }}
    >
      {/* Console Frame */}
      <div
        id="terminal-console-chassis"
        className={`w-full max-w-xl bg-[#0a0e14] border-4 ${currentTheme.border} rounded-lg ${currentTheme.shadow} flex flex-col max-h-[96vh] overflow-hidden relative ${currentTheme.text}`}
      >
        {/* CRT Scanline Overlay */}
        <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle,transparent_60%,rgba(0,0,0,0.4)_100%)] opacity-80" />
        <div
          className="absolute inset-0 pointer-events-none opacity-15"
          style={{
            backgroundImage:
              'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255, 255, 255, 0.4) 3px, rgba(255, 255, 255, 0.4) 4px)',
          }}
        />

        {/* Console Header */}
        <div className="bg-[#0f172a] border-b-2 border-slate-800 p-2.5 sm:p-3 flex items-center justify-between z-10">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_#22c55e]" />
            <Terminal className="w-5 h-5 text-emerald-400" />
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold tracking-wider text-slate-100 uppercase">
                  {currentTheme.title}
                </span>
                <span className="text-[8px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                  {terminal?.label || 'CONSOLA TÁCTICA'}
                </span>
              </div>
              <div className="text-[9px] text-slate-400 flex items-center gap-2">
                <span>SEC-OS v4.2</span>
                <span>•</span>
                <span>NODO SEGURO: ACTIVO</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Protocol Switcher / Randomizer Button */}
            <button
              onClick={() => {
                const types: TerminalMinigameType[] = [
                  'circuit_maze',
                  'frequency_lock',
                  'memory_cipher',
                  'wire_bypass',
                ];
                const currentIndex = types.indexOf(activeMinigame);
                const nextType = types[(currentIndex + 1) % types.length];
                setActiveMinigame(nextType);
                setIsHacked(false);
                addLog(`> CAMBIO DE PROTOCOLO // Conectando a [${nextType.toUpperCase()}]...`);
              }}
              className="flex items-center gap-1 text-[8px] bg-slate-800 hover:bg-slate-700 text-slate-200 px-2 py-1 rounded border border-slate-600 cursor-pointer"
              title="Alternar a otro minijuego aleatorio"
            >
              <Shuffle className="w-3 h-3 text-cyan-400" />
              OTRO MINIJUEGO
            </button>

            <button
              id="close-terminal-btn"
              onClick={handleSafeClose}
              className="p-1 hover:bg-slate-800 text-slate-400 hover:text-white transition-colors border border-slate-700 rounded cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Selection */}
        <div className="bg-[#080d16] border-b border-slate-900 px-4 py-1.5 flex items-center justify-between text-[9px] z-10">
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab('game')}
              className={`px-3 py-1 rounded text-[8px] font-bold border cursor-pointer ${
                activeTab === 'game'
                  ? 'bg-slate-800 text-white border-slate-500'
                  : 'text-slate-500 border-transparent hover:text-slate-300'
              }`}
            >
              PRUEBA DE SEGURIDAD
            </button>
            <button
              onClick={() => setActiveTab('logs')}
              className={`px-3 py-1 rounded text-[8px] font-bold border cursor-pointer ${
                activeTab === 'logs'
                  ? 'bg-slate-800 text-white border-slate-500'
                  : 'text-slate-500 border-transparent hover:text-slate-300'
              }`}
            >
              REGISTROS DEL SECTOR
            </button>
          </div>

          <span className="text-[8px] text-slate-500">
            PROPIEDAD DE: COMPLEJO ROGUE-077
          </span>
        </div>

        {/* Main Interactive Content */}
        <div className="p-3 sm:p-4 overflow-y-auto z-10 flex flex-col items-center">
          {activeTab === 'game' && (
            <div className="w-full flex flex-col items-center">
              {/* Active Minigame Engine */}
              {activeMinigame === 'circuit_maze' && (
                <CircuitMazeGame
                  isHacked={isHacked}
                  onVictory={() => handleMinigameVictory(35)}
                  addLog={addLog}
                />
              )}
              {activeMinigame === 'frequency_lock' && (
                <FrequencyLockGame
                  isHacked={isHacked}
                  onVictory={() => handleMinigameVictory(35)}
                  addLog={addLog}
                />
              )}
              {activeMinigame === 'memory_cipher' && (
                <MemoryCipherGame
                  isHacked={isHacked}
                  onVictory={() => handleMinigameVictory(35)}
                  addLog={addLog}
                />
              )}
              {activeMinigame === 'wire_bypass' && (
                <WireBypassGame
                  isHacked={isHacked}
                  onVictory={() => handleMinigameVictory(35)}
                  addLog={addLog}
                />
              )}

              {/* Quick Bypass Button */}
              {!isHacked && (
                <div className="mt-3 w-full max-w-sm flex items-center justify-between bg-[#07140e] border border-emerald-900/60 p-2 rounded">
                  <div className="flex flex-col">
                    <span className="text-[8px] text-emerald-400 font-bold">
                      ¿EN APUROS? BYPASS FORZADO
                    </span>
                    <span className="text-[7px] text-emerald-600">
                      Otorga +15 Rads rápidos sin resolver el puzzle.
                    </span>
                  </div>
                  <button
                    onClick={handleQuickBypass}
                    disabled={isQuickBypassing}
                    className="px-3 py-1.5 bg-emerald-950 hover:bg-emerald-900 border border-emerald-500 text-emerald-300 text-[8px] rounded font-bold transition-all cursor-pointer"
                  >
                    {isQuickBypassing ? `DECODIFICANDO ${quickBypassProgress}%` : 'BYPASS RÁPIDO'}
                  </button>
                </div>
              )}

              {/* Victory Banner with Automatic Exit */}
              {isHacked && (
                <div className="mt-3 w-full max-w-md bg-[#064e3b] border-2 border-emerald-400 p-3 rounded text-center flex flex-col items-center gap-2 shadow-[0_0_20px_rgba(52,211,153,0.3)]">
                  <div className="flex items-center gap-2 text-white font-bold text-xs sm:text-sm">
                    <CheckCircle2 className="w-5 h-5 text-emerald-300 animate-bounce" />
                    ¡TERMINAL HACKEADA CON ÉXITO! (+{pendingRewardRef.current} RADS)
                  </div>
                  <p className="text-[9px] text-emerald-200">
                    Sistemas desmantelados y mapa del sector actualizado. Regresando a la partida automáticamente...
                  </p>
                  <div className="w-full bg-emerald-950 h-1.5 rounded overflow-hidden border border-emerald-700/60 my-0.5">
                    <div className="bg-emerald-400 h-full w-full animate-pulse" />
                  </div>
                  <button
                    id="claim-hack-reward-btn"
                    onClick={() => handleClaimAndClose()}
                    className="mt-1 px-5 py-2 bg-yellow-500 hover:bg-yellow-400 text-black font-bold text-[9px] rounded border-2 border-yellow-300 shadow-[0_3px_0_#ca8a04] cursor-pointer flex items-center gap-1.5"
                  >
                    <Sparkles className="w-4 h-4" />
                    VOLVER AL JUEGO AHORA (+{pendingRewardRef.current} RADS)
                  </button>
                </div>
              )}
            </div>
          )}

          {activeTab === 'logs' && (
            <div className="w-full flex flex-col gap-2 p-2 bg-[#040806] border border-emerald-900 rounded font-mono text-[9px]">
              <span className="text-emerald-500 font-bold border-b border-emerald-950 pb-1">
                REGISTROS Y ARCHIVOS DEL SECTOR:
              </span>
              <div className="text-emerald-400 space-y-1">
                <p>• [REG_01]: "Sistemas de vigilancia del complejo conectados a la subred."</p>
                <p>• [REG_02]: "El jefe de sector custodia el portal de evacuación hacia el siguiente piso."</p>
                <p>• [REG_03]: "Los suministros de munición 9mm y botiquines se almacenan en cajas reforzadas."</p>
                <p>• [REG_04]: "Para superar el blindaje de las compuertas, despeja a todas las criaturas hostiles."</p>
              </div>

              <span className="text-emerald-600 text-[8px] mt-2 border-t border-emerald-950 pt-1">
                HISTORIAL DE SESIÓN EN VIVO:
              </span>
              <div className="text-emerald-300 space-y-0.5">
                {logMessages.map((msg, i) => (
                  <div key={i}>{msg}</div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Console Footer */}
        <div className="bg-[#0a0f16] border-t border-slate-900 px-3 py-1.5 flex items-center justify-between text-[8px] text-slate-500 z-10">
          <span>SISTEMA TÁCTICO // 007 HACK DECK</span>
          <span>ESTADO: {isHacked ? 'ACCESO TOTAL' : 'ENLACE ACTIVO'}</span>
        </div>
      </div>
    </div>
  );
};
