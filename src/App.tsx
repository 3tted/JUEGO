import React, { useEffect, useRef, useState, useCallback } from 'react';
import { generateDungeon } from './game/generator';
import { GameEngine } from './game/engine';
import { sound } from './game/audio';
import { DungeonFloor, PlayerState, RoomInstance, TerminalEntity } from './types';
import { HUD } from './components/HUD';
import { BlueprintViewer } from './components/BlueprintViewer';
import { LevelCompletedModal, GameOverModal, InstructionsModal } from './components/Modals';
import { LeaderboardModal } from './components/LeaderboardModal';
import { TerminalMinigameModal } from './components/TerminalMinigameModal';
import { VirtualControls } from './components/VirtualControls';
import { HelpCircle, Route, Trophy } from 'lucide-react';
import { useFirebase } from './firebase/FirebaseContext';
import { submitLeaderboardRun, SavedGameData } from './firebase/service';

export default function App() {
  const { user, userProfile, saveRun, savedGame, saveGameProgress } = useFirebase();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef<GameEngine | null>(null);

  const [floorLevel, setFloorLevel] = useState<number>(1);
  const [seed, setSeed] = useState<number>(() => Math.floor(Math.random() * 1000000));
  const [dungeon, setDungeon] = useState<DungeonFloor>(() => generateDungeon(seed, 1));

  // Game UI States
  const [playerState, setPlayerState] = useState<PlayerState | null>(null);
  const [currentRoom, setCurrentRoom] = useState<RoomInstance | undefined>(undefined);
  const [alarmLevel, setAlarmLevel] = useState<number>(0);
  const [showBlueprint, setShowBlueprint] = useState<boolean>(false);
  const [showInstructions, setShowInstructions] = useState<boolean>(false);
  const [showLeaderboard, setShowLeaderboard] = useState<boolean>(false);
  const [showPathGuide, setShowPathGuide] = useState<boolean>(true);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [isFloorCleared, setIsFloorCleared] = useState<boolean>(false);
  const [isGameOver, setIsGameOver] = useState<boolean>(false);
  const [interactionPrompt, setInteractionPrompt] = useState<string | null>(null);
  const [pathVerifiedBadge, setPathVerifiedBadge] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [activeTerminal, setActiveTerminal] = useState<TerminalEntity | null>(null);
  const [showTerminalModal, setShowTerminalModal] = useState<boolean>(false);

  // Initialize or Rebuild Engine
  const startEngine = useCallback(
    (targetDungeon: DungeonFloor, restoredSave?: SavedGameData) => {
      if (!canvasRef.current) return;

      if (engineRef.current) {
        engineRef.current.destroy();
        engineRef.current = null;
      }

      const canvas = canvasRef.current;
      const engine = new GameEngine(
        canvas,
        targetDungeon,
        {
          onFloorCleared: () => {
            setIsFloorCleared(true);
            // Sync run victory to Firestore
            if (user && engineRef.current) {
              const rads = engineRef.current.player.intelCollected || 0;
              saveRun(targetDungeon.floorLevel, rads, 'victory');
              submitLeaderboardRun(
                user.uid,
                user.displayName || 'Mutant Scout',
                user.photoURL || undefined,
                targetDungeon.floorLevel,
                rads,
                'victory'
              ).catch((err) => console.error('Error saving leaderboard victory:', err));
            }
          },
          onPlayerDied: () => {
            setIsGameOver(true);
            // Sync run defeat to Firestore
            if (user && engineRef.current) {
              const rads = engineRef.current.player.intelCollected || 0;
              saveRun(targetDungeon.floorLevel, rads, 'defeated');
              submitLeaderboardRun(
                user.uid,
                user.displayName || 'Mutant Scout',
                user.photoURL || undefined,
                targetDungeon.floorLevel,
                rads,
                'defeated'
              ).catch((err) => console.error('Error saving leaderboard run:', err));
            }
          },
          onAlarmChange: (lvl) => {
            setAlarmLevel(lvl);
          },
          onRoomEntered: (room) => {
            setCurrentRoom(room);
          },
          onTerminalOpen: (term) => {
            engine.pause();
            setActiveTerminal(term);
            setShowTerminalModal(true);
          },
        },
        restoredSave
      );

      engine.showPathGuide = showPathGuide;
      engine.start();
      engineRef.current = engine;

      setPlayerState({ ...engine.player });
      const initialRoom =
        restoredSave && targetDungeon.rooms.has(restoredSave.currentRoomId)
          ? targetDungeon.rooms.get(restoredSave.currentRoomId)
          : targetDungeon.rooms.get(targetDungeon.startRoomId);
      setCurrentRoom(initialRoom);
      setIsFloorCleared(false);
      setIsGameOver(false);
      setAlarmLevel(0);

      // Flash path verification notification
      setPathVerifiedBadge(true);
      setTimeout(() => setPathVerifiedBadge(false), 4500);
    },
    [showPathGuide, user, saveRun]
  );

  // Manual save of game progress and exact player position
  const handleSaveCurrentGame = useCallback(async () => {
    if (!engineRef.current) return;
    setIsSaving(true);
    try {
      const snapshot = engineRef.current.getSaveDataSnapshot();
      await saveGameProgress(snapshot);
      setInteractionPrompt('¡PROGRESO Y POSICIÓN DEL MUÑECO GUARDADOS!');
      setTimeout(() => setInteractionPrompt(null), 4000);
    } catch (err) {
      console.error('Error saving game:', err);
      setInteractionPrompt('ERROR AL GUARDAR PARTIDA');
      setTimeout(() => setInteractionPrompt(null), 3000);
    } finally {
      setIsSaving(false);
    }
  }, [saveGameProgress]);

  // Resume saved game where the player left off
  const handleResumeGame = useCallback(
    (save: SavedGameData) => {
      setFloorLevel(save.floorLevel);
      setSeed(save.seed);
      const restoredDungeon = generateDungeon(save.seed, save.floorLevel);
      setDungeon(restoredDungeon);
      startEngine(restoredDungeon, save);
      setInteractionPrompt('¡PARTIDA CARGADA! MUÑECO RESTAURADO');
      setTimeout(() => setInteractionPrompt(null), 4000);
    },
    [startEngine]
  );

  // Handle new seed generation
  const handleRegenerateFloor = useCallback(() => {
    const newSeed = Math.floor(Math.random() * 1000000);
    setSeed(newSeed);
    const newDungeon = generateDungeon(newSeed, floorLevel);
    setDungeon(newDungeon);
    startEngine(newDungeon);
  }, [floorLevel, startEngine]);

  const handleCloseTerminal = useCallback(() => {
    setShowTerminalModal(false);
    setActiveTerminal(null);
    if (engineRef.current) {
      engineRef.current.resume();
    }
  }, []);

  const handleTerminalSuccess = useCallback(
    (bonusRads: number) => {
      if (engineRef.current && activeTerminal) {
        activeTerminal.hacked = true;
        activeTerminal.hackProgress = 100;
        engineRef.current.player.intelCollected += bonusRads;
        engineRef.current.spawnRadDrops(activeTerminal.x, activeTerminal.y, 5);
        engineRef.current.addFloatingNotice(
          activeTerminal.x,
          activeTerminal.y - 12,
          `+${bonusRads} RADS EXTRA`,
          '#22c55e'
        );

        if (activeTerminal.type === 'map_reveal' || bonusRads >= 30) {
          for (const room of engineRef.current.dungeon.rooms.values()) {
            room.hasBeenRevealed = true;
          }
          engineRef.current.addFloatingNotice(
            activeTerminal.x,
            activeTerminal.y - 24,
            'MAPA COMPLETO REVELADO',
            '#38bdf8'
          );
        }
      }
    },
    [activeTerminal]
  );

  const handleNextFloor = () => {
    const nextLevel = floorLevel + 1;
    setFloorLevel(nextLevel);
    const newSeed = Math.floor(Math.random() * 1000000);
    setSeed(newSeed);
    const newDungeon = generateDungeon(newSeed, nextLevel);
    setDungeon(newDungeon);
    startEngine(newDungeon);
  };

  const handleRetry = () => {
    const newDungeon = generateDungeon(seed, floorLevel);
    setDungeon(newDungeon);
    startEngine(newDungeon);
  };

  // Canvas Resize Observer
  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        if (width > 0 && height > 0) {
          // Sharp internal resolution (scaled by devicePixelRatio)
          const dpr = Math.min(window.devicePixelRatio || 1, 2);
          canvas.width = Math.floor(width * dpr);
          canvas.height = Math.floor(height * dpr);
          if (engineRef.current) {
            engineRef.current.zoom = 2.2 * dpr;
          }
        }
      }
    });

    resizeObserver.observe(container);
    return () => resizeObserver.disconnect();
  }, []);

  // Mount engine on startup
  useEffect(() => {
    startEngine(dungeon);
    return () => {
      if (engineRef.current) {
        engineRef.current.destroy();
      }
    };
  }, [dungeon, startEngine]);

  // Sync state loop for HUD
  useEffect(() => {
    const interval = setInterval(() => {
      if (!engineRef.current) return;
      const eng = engineRef.current;
      setPlayerState({ ...eng.player });
      setAlarmLevel(eng.alarmLevel);

      // Check interaction prompts & item legends
      const room = eng.dungeon.rooms.get(eng.player.currentRoomId);
      let prompt: string | null = eng.activeLegend;

      if (!prompt && room) {
        // Near terminal?
        for (const term of room.terminals) {
          const dist = Math.hypot(eng.player.x - term.x, eng.player.y - term.y);
          if (dist < 45 && !term.hacked) {
            prompt = `MANTÉN [E] PARA HACKEAR (${Math.round(term.hackProgress)}%)`;
            break;
          }
        }
        // Near boss elevator?
        if (!prompt && room.type === 'BOSS') {
          const bossDead = !room.boss || room.boss.defeated;
          if (bossDead) {
            const elX = room.bounds.worldX + 7 * 48 + 24;
            const elY = room.bounds.worldY + 5 * 48 + 24;
            if (Math.hypot(eng.player.x - elX, eng.player.y - elY) < 55) {
              prompt = 'PRESIONA [E] PARA ENTRAR AL PORTAL';
            }
          }
        }
      }
      setInteractionPrompt(prompt);
    }, 60);

    return () => clearInterval(interval);
  }, []);

  // Automatically pause engine when any modal or overlay is active
  useEffect(() => {
    const isAnyModalActive =
      showLeaderboard ||
      showTerminalModal ||
      showBlueprint ||
      showInstructions ||
      isFloorCleared ||
      isGameOver;

    if (engineRef.current) {
      if (isAnyModalActive) {
        engineRef.current.pause();
      } else {
        engineRef.current.resume();
      }
    }
  }, [
    showLeaderboard,
    showTerminalModal,
    showBlueprint,
    showInstructions,
    isFloorCleared,
    isGameOver,
  ]);

  // Global key listener for Blueprint (M or Tab) and Help (H)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // NEVER intercept keys if user is typing in an input field or textarea
      const target = e.target as HTMLElement | null;
      if (
        (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)) ||
        (document.activeElement && (document.activeElement.tagName === 'INPUT' || document.activeElement.tagName === 'TEXTAREA'))
      ) {
        return;
      }

      if (showLeaderboard || showTerminalModal) {
        if (e.code === 'Escape') {
          setShowLeaderboard(false);
          setShowTerminalModal(false);
        }
        return;
      }

      if (e.code === 'KeyM' || e.code === 'Tab') {
        e.preventDefault();
        setShowBlueprint((prev) => !prev);
      } else if (e.code === 'KeyH') {
        setShowInstructions((prev) => !prev);
      } else if (e.code === 'Escape') {
        setShowBlueprint(false);
        setShowInstructions(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showLeaderboard, showTerminalModal]);

  const handleTogglePathGuide = () => {
    const next = !showPathGuide;
    setShowPathGuide(next);
    if (engineRef.current) {
      engineRef.current.showPathGuide = next;
    }
  };

  const handleToggleSound = () => {
    sound.enabled = !soundEnabled;
    setSoundEnabled(!soundEnabled);
  };

  return (
    <main className="relative w-screen h-screen overflow-hidden bg-[#0c0907] select-none flex items-center justify-center font-['Press_Start_2P',monospace]">
      {/* Authentic Nuclear Throne Side Pillar Borders */}
      <div className="hidden md:block absolute inset-y-0 left-0 w-[calc((100vw-133.33vh)/2)] min-w-[24px] nt-side-pattern border-r-4 border-black" />
      <div className="hidden md:block absolute inset-y-0 right-0 w-[calc((100vw-133.33vh)/2)] min-w-[24px] nt-side-pattern border-l-4 border-black" />

      {/* 4:3 Centered Nuclear Throne Game Screen */}
      <div
        ref={containerRef}
        className="relative w-full h-full max-w-[133.33vh] max-h-screen aspect-[4/3] bg-[#1c150e] overflow-hidden shadow-2xl flex items-center justify-center border-x-4 border-black"
      >
        {/* Pixel Canvas */}
        <canvas
          ref={canvasRef}
          className="w-full h-full block pixelated cursor-none"
        />

        {/* Verified Transitable Path Notification Badge */}
        {pathVerifiedBadge && (
          <div className="absolute top-20 left-1/2 -translate-x-1/2 z-40 bg-black/95 border-2 border-white text-yellow-300 px-4 py-2 font-mono text-[10px] shadow-2xl flex items-center gap-2.5 animate-in fade-in slide-in-from-top-4 duration-300">
            <Route className="w-4 h-4 text-yellow-400 animate-pulse" />
            <span>
              <strong>DESIERTO GENERADO:</strong> Ruta 100% transitable garantizada hasta el jefe.
            </span>
          </div>
        )}

        {/* Interaction Prompt & Item Inability Legend */}
        {interactionPrompt && (
          <div
            id="legend-interaction-banner"
            className={`absolute bottom-16 left-1/2 -translate-x-1/2 z-30 border-2 px-4 py-2 font-mono text-xs shadow-2xl flex items-center gap-2.5 max-w-xl text-center pointer-events-none transition-all duration-200 ${
              interactionPrompt.includes('NO PUEDES') ||
              interactionPrompt.includes('BLOQUEADO') ||
              interactionPrompt.includes('LLENA') ||
              interactionPrompt.includes('MÁXIMO')
                ? 'bg-red-950/95 border-red-500 text-red-100 shadow-[0_0_15px_rgba(239,68,68,0.5)] font-bold animate-pulse'
                : 'bg-black/95 border-yellow-400 text-yellow-300 shadow-[0_0_15px_rgba(0,0,0,0.8)]'
            }`}
          >
            <span className="text-base shrink-0">
              {interactionPrompt.includes('NO PUEDES') ||
              interactionPrompt.includes('BLOQUEADO') ||
              interactionPrompt.includes('LLENA') ||
              interactionPrompt.includes('MÁXIMO')
                ? '⛔'
                : '💡'}
            </span>
            <span className="tracking-wide leading-snug">{interactionPrompt}</span>
          </div>
        )}

        {/* Authentic Nuclear Throne HUD */}
        {playerState && (
          <HUD
            player={playerState}
            dungeon={dungeon}
            currentRoom={currentRoom}
            alarmLevel={alarmLevel}
            soundEnabled={soundEnabled}
            onToggleSound={handleToggleSound}
            onOpenBlueprint={() => setShowBlueprint(true)}
            onRegenerateFloor={handleRegenerateFloor}
            showPathGuide={showPathGuide}
            onTogglePathGuide={handleTogglePathGuide}
            onOpenLeaderboard={() => setShowLeaderboard(true)}
            onSaveGame={handleSaveCurrentGame}
            isSaving={isSaving}
            hasSavedGame={!!savedGame}
            interactionPrompt={interactionPrompt}
          />
        )}

        {/* Floating Controls Guide Button */}
        <button
          onClick={() => setShowInstructions(true)}
          className="absolute bottom-2 left-1/2 -translate-x-1/2 z-30 bg-black/80 hover:bg-black border border-stone-600 text-stone-300 px-3 py-1 rounded text-[9px] flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer"
          title="Ver Controles [H]"
        >
          <HelpCircle className="w-3 h-3 text-yellow-400" />
          <span>AYUDA [H]</span>
        </button>

        {/* Mobile Virtual Controls */}
        <VirtualControls
          onMove={(dx, dy) => {
            if (!engineRef.current) return;
            engineRef.current.keys['KeyW'] = dy < -0.3;
            engineRef.current.keys['KeyS'] = dy > 0.3;
            engineRef.current.keys['KeyA'] = dx < -0.3;
            engineRef.current.keys['KeyD'] = dx > 0.3;
          }}
          onStopMove={() => {
            if (!engineRef.current) return;
            engineRef.current.keys['KeyW'] = false;
            engineRef.current.keys['KeyS'] = false;
            engineRef.current.keys['KeyA'] = false;
            engineRef.current.keys['KeyD'] = false;
          }}
          onShoot={() => {
            if (engineRef.current) engineRef.current.swingKatanaOrShoot();
          }}
          onDash={() => {
            if (engineRef.current) engineRef.current.triggerDash();
          }}
          onReload={() => {
            if (engineRef.current) engineRef.current.startReload();
          }}
          onInteract={() => {
            if (!engineRef.current) return;
            engineRef.current.keys['KeyE'] = true;
            setTimeout(() => {
              if (engineRef.current) engineRef.current.keys['KeyE'] = false;
            }, 300);
          }}
        />
      </div>

      {/* Tactical Blueprint Viewer Modal */}
      {showBlueprint && (
        <BlueprintViewer
          dungeon={dungeon}
          currentRoomId={playerState?.currentRoomId || dungeon.startRoomId}
          onRegenerate={handleRegenerateFloor}
          onClose={() => setShowBlueprint(false)}
          showPathGuide={showPathGuide}
          onTogglePathGuide={handleTogglePathGuide}
        />
      )}

      {/* Floor Cleared Transition Modal */}
      {isFloorCleared && (
        <LevelCompletedModal
          floor={dungeon}
          intelCount={playerState?.intelCollected || 0}
          onNextFloor={handleNextFloor}
          onOpenLeaderboard={() => setShowLeaderboard(true)}
        />
      )}

      {/* Game Over Modal */}
      {isGameOver && (
        <GameOverModal
          onRetry={handleRetry}
          onOpenLeaderboard={() => setShowLeaderboard(true)}
        />
      )}

      {/* Leaderboard & Firebase Cloud Stats Modal */}
      <LeaderboardModal
        isOpen={showLeaderboard}
        onClose={() => setShowLeaderboard(false)}
        onResumeGame={handleResumeGame}
        onSaveCurrentGame={handleSaveCurrentGame}
      />

      {/* Terminal Console Mini-game Modal */}
      <TerminalMinigameModal
        isOpen={showTerminalModal}
        terminal={activeTerminal}
        onClose={handleCloseTerminal}
        onSuccess={handleTerminalSuccess}
      />

      {/* Instructions Modal */}
      {showInstructions && <InstructionsModal onClose={() => setShowInstructions(false)} />}
    </main>
  );
}
