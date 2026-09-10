import React, { useEffect, useState } from 'react';
import {
  Trophy,
  User as UserIcon,
  LogIn,
  LogOut,
  Flame,
  Shield,
  X,
  RefreshCw,
  Save,
  Play,
  Trash2,
  CheckCircle2,
  Mail,
  KeyRound,
  MapPin,
  Heart,
  Database,
  UserCheck,
  AlertCircle,
} from 'lucide-react';
import { useFirebase } from '../firebase/FirebaseContext';
import {
  LeaderboardEntryData,
  subscribeToLeaderboard,
  SavedGameData,
  UserProfileData,
  subscribeToUserProfiles,
} from '../firebase/service';

interface LeaderboardModalProps {
  isOpen: boolean;
  onClose: () => void;
  onResumeGame?: (save: SavedGameData) => void;
  onSaveCurrentGame?: () => Promise<boolean> | boolean | void;
}

export const LeaderboardModal: React.FC<LeaderboardModalProps> = ({
  isOpen,
  onClose,
  onResumeGame,
  onSaveCurrentGame,
}) => {
  const {
    user,
    userProfile,
    savedGame,
    login,
    loginWithEmail,
    registerWithEmail,
    logout,
    deleteSavedGameProgress,
  } = useFirebase();

  const [entries, setEntries] = useState<LeaderboardEntryData[]>([]);
  const [loadingEntries, setLoadingEntries] = useState(true);
  const [registeredUsers, setRegisteredUsers] = useState<UserProfileData[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [activeTab, setActiveTab] = useState<'save' | 'leaderboard' | 'registros' | 'profile'>('save');

  // Email & Password Form State
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [faction, setFaction] = useState('');
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [saveActionMessage, setSaveActionMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    setLoadingEntries(true);
    const unsubscribeLeaderboard = subscribeToLeaderboard((data) => {
      setEntries(data);
      setLoadingEntries(false);
    });

    setLoadingUsers(true);
    const unsubscribeProfiles = subscribeToUserProfiles((data) => {
      setRegisteredUsers(data);
      setLoadingUsers(false);
    });

    return () => {
      unsubscribeLeaderboard();
      unsubscribeProfiles();
    };
  }, [isOpen]);

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setSaveActionMessage(null);

    if (!email.trim()) {
      setAuthError('Por favor ingresa un correo electrónico.');
      return;
    }
    if (!password || password.length < 6) {
      setAuthError('La contraseña debe tener al menos 6 caracteres.');
      return;
    }

    setAuthLoading(true);
    try {
      if (authMode === 'login') {
        await loginWithEmail(email, password);
        setSaveActionMessage('¡Sesión iniciada con éxito! Registro sincronizado con la base de datos.');
      } else {
        await registerWithEmail(email, password, displayName, faction);
        setSaveActionMessage('¡Registro guardado en la base de datos Firestore! (Campos opcionales procesados correctamente)');
        setActiveTab('registros');
      }
      setEmail('');
      setPassword('');
      setDisplayName('');
      setFaction('');
    } catch (err: any) {
      const code = err?.code || '';
      if (code === 'auth/operation-not-allowed') {
        setAuthError('auth/operation-not-allowed');
      } else if (
        code === 'auth/invalid-credential' ||
        code === 'auth/wrong-password' ||
        code === 'auth/user-not-found'
      ) {
        setAuthError('Correo o contraseña incorrectos.');
      } else if (code === 'auth/email-already-in-use') {
        setAuthError('Este correo ya está registrado. Selecciona "Iniciar Sesión".');
      } else if (code === 'auth/weak-password') {
        setAuthError('La contraseña debe contener mínimo 6 caracteres.');
      } else if (code === 'auth/invalid-email') {
        setAuthError('El correo ingresado no tiene un formato válido.');
      } else {
        setAuthError(err?.message || 'Error al conectar con la base de datos. Inténtalo de nuevo.');
      }
    } finally {
      setAuthLoading(false);
    }
  };

  const handleManualSave = async () => {
    setSaveActionMessage(null);
    if (!onSaveCurrentGame) return;
    try {
      await onSaveCurrentGame();
      setSaveActionMessage('¡Posición y progreso del muñeco guardados!');
      setTimeout(() => setSaveActionMessage(null), 4000);
    } catch (err) {
      setSaveActionMessage('Error al guardar partida.');
    }
  };

  const handleDeleteSave = async () => {
    if (confirm('¿Eliminar la partida guardada actual? Tendrás que empezar desde el inicio.')) {
      await deleteSavedGameProgress();
      setSaveActionMessage('Partida guardada eliminada.');
      setTimeout(() => setSaveActionMessage(null), 3000);
    }
  };

  const handleResume = () => {
    if (savedGame && onResumeGame) {
      onResumeGame(savedGame);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div
      id="leaderboard-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-xs p-3 sm:p-4 font-['Press_Start_2P']"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        id="leaderboard-modal"
        className="w-full max-w-xl bg-[#14100e] border-4 border-[#3d322a] p-4 shadow-[0_0_35px_rgba(0,0,0,0.95)] text-[#f4ecd8] flex flex-col max-h-[92vh] select-auto cursor-auto"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => e.stopPropagation()}
        onKeyUp={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b-2 border-[#3d322a] pb-3 mb-3">
          <div className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-[#4ade80]" />
            <h2 className="text-xs sm:text-sm tracking-wider text-[#e2b044] uppercase">
              INDUSTRIAL VAULT & CLOUD
            </h2>
          </div>
          <button
            id="close-leaderboard-btn"
            onClick={onClose}
            className="p-1 hover:bg-[#3d322a] text-[#8c786a] hover:text-[#fff] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* User Auth Banner & Email/Password Box */}
        <div className="bg-[#1f1916] border-2 border-[#3d322a] p-3 mb-3">
          {user ? (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                {user.photoURL ? (
                  <img
                    src={user.photoURL}
                    alt={user.displayName || 'Player'}
                    referrerPolicy="no-referrer"
                    className="w-8 h-8 rounded border-2 border-[#4ade80]"
                  />
                ) : (
                  <div className="w-8 h-8 bg-[#2a221d] flex items-center justify-center border-2 border-[#8c786a]">
                    <UserIcon className="w-4 h-4 text-[#4ade80]" />
                  </div>
                )}
                <div className="flex flex-col">
                  <span className="text-[10px] text-[#f4ecd8] truncate max-w-[200px]">
                    {user.displayName || user.email?.split('@')[0] || 'Mutant Scout'}
                  </span>
                  <span className="text-[8px] text-[#4ade80] flex items-center gap-1">
                    <CheckCircle2 className="w-2.5 h-2.5" /> CONECTADO A LA NUBE
                  </span>
                </div>
              </div>

              <button
                id="logout-btn"
                onClick={logout}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-[#2a221d] hover:bg-[#3d322a] border border-[#5a493c] text-[8px] text-[#e06c75] transition-colors cursor-pointer"
              >
                <LogOut className="w-3 h-3" />
                CERRAR SESIÓN
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {/* Google Button */}
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4 text-[#e2b044]" />
                  <span className="text-[9px] text-[#f4ecd8]">CONECTAR CUENTA</span>
                </div>
                <button
                  id="login-btn"
                  onClick={login}
                  className="flex items-center gap-2 px-3.5 py-2 bg-[#2563eb] hover:bg-[#1d4ed8] border border-[#60a5fa] text-[8px] text-[#ffffff] transition-colors shadow-[0_2px_0_#1e3a8a] cursor-pointer"
                >
                  <LogIn className="w-3.5 h-3.5" />
                  GOOGLE SIGN-IN
                </button>
              </div>

              {/* Email and Password Form (Directly below Google as requested) */}
              <div className="pt-2 border-t border-[#3d322a]/80">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[8px] text-[#e2b044] tracking-wider font-bold">
                    O INGRESA CON CORREO Y CONTRASEÑA:
                  </span>
                  <div className="flex gap-1">
                    <button
                      type="button"
                      id="auth-mode-login-btn"
                      onClick={() => {
                        setAuthMode('login');
                        setAuthError(null);
                      }}
                      className={`px-2 py-0.5 text-[7px] border cursor-pointer ${
                        authMode === 'login'
                          ? 'bg-[#e2b044] text-black border-[#e2b044] font-bold'
                          : 'bg-[#181311] text-[#8c786a] border-[#3d322a] hover:text-[#d4c5b9]'
                      }`}
                    >
                      INICIAR SESIÓN
                    </button>
                    <button
                      type="button"
                      id="auth-mode-register-btn"
                      onClick={() => {
                        setAuthMode('register');
                        setAuthError(null);
                      }}
                      className={`px-2 py-0.5 text-[7px] border cursor-pointer ${
                        authMode === 'register'
                          ? 'bg-[#e2b044] text-black border-[#e2b044] font-bold'
                          : 'bg-[#181311] text-[#8c786a] border-[#3d322a] hover:text-[#d4c5b9]'
                      }`}
                    >
                      CREAR CUENTA
                    </button>
                  </div>
                </div>

                <form
                  onSubmit={handleEmailAuth}
                  className="flex flex-col gap-2 select-text cursor-auto"
                  onKeyDown={(e) => e.stopPropagation()}
                  onKeyUp={(e) => e.stopPropagation()}
                >
                  {authMode === 'register' && (
                    <>
                      <div className="flex items-center bg-[#100d0b] border border-[#3d322a] px-2 py-1.5 focus-within:border-[#e2b044] cursor-text">
                        <UserIcon className="w-3.5 h-3.5 text-[#8c786a] mr-2 shrink-0" />
                        <input
                          id="auth-display-name-input"
                          name="displayName"
                          type="text"
                          placeholder="Nombre o Alias de Agente (opcional)"
                          value={displayName}
                          onChange={(e) => setDisplayName(e.target.value)}
                          onKeyDown={(e) => e.stopPropagation()}
                          onKeyUp={(e) => e.stopPropagation()}
                          className="bg-transparent text-[8px] text-[#f4ecd8] outline-none w-full placeholder:text-[#6e5d52] select-text cursor-text"
                        />
                        <span className="text-[7px] text-[#8c786a] uppercase ml-1 shrink-0 bg-[#1e1713] px-1.5 py-0.5 rounded border border-[#3d322a] select-none pointer-events-none">
                          Opcional
                        </span>
                      </div>

                      <div className="flex items-center bg-[#100d0b] border border-[#3d322a] px-2 py-1.5 focus-within:border-[#e2b044] cursor-text">
                        <Shield className="w-3.5 h-3.5 text-[#8c786a] mr-2 shrink-0" />
                        <input
                          id="auth-faction-input"
                          name="faction"
                          type="text"
                          placeholder="Facción / Escuadrón (opcional)"
                          value={faction}
                          onChange={(e) => setFaction(e.target.value)}
                          onKeyDown={(e) => e.stopPropagation()}
                          onKeyUp={(e) => e.stopPropagation()}
                          className="bg-transparent text-[8px] text-[#f4ecd8] outline-none w-full placeholder:text-[#6e5d52] select-text cursor-text"
                        />
                        <span className="text-[7px] text-[#8c786a] uppercase ml-1 shrink-0 bg-[#1e1713] px-1.5 py-0.5 rounded border border-[#3d322a] select-none pointer-events-none">
                          Opcional
                        </span>
                      </div>
                    </>
                  )}

                  <div className="flex items-center bg-[#100d0b] border border-[#3d322a] px-2 py-1.5 focus-within:border-[#e2b044] cursor-text">
                    <Mail className="w-3.5 h-3.5 text-[#8c786a] mr-2 shrink-0" />
                    <input
                      id="auth-email-input"
                      name="email"
                      type="email"
                      required
                      placeholder="agente@complejo.net (obligatorio)"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      onKeyDown={(e) => e.stopPropagation()}
                      onKeyUp={(e) => e.stopPropagation()}
                      className="bg-transparent text-[8px] text-[#f4ecd8] outline-none w-full placeholder:text-[#6e5d52] select-text cursor-text"
                    />
                  </div>

                  <div className="flex items-center bg-[#100d0b] border border-[#3d322a] px-2 py-1.5 focus-within:border-[#e2b044] cursor-text">
                    <KeyRound className="w-3.5 h-3.5 text-[#8c786a] mr-2 shrink-0" />
                    <input
                      id="auth-password-input"
                      name="password"
                      type="password"
                      required
                      placeholder="Contraseña mínimo 6 caracteres (obligatorio)"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      onKeyDown={(e) => e.stopPropagation()}
                      onKeyUp={(e) => e.stopPropagation()}
                      className="bg-transparent text-[8px] text-[#f4ecd8] outline-none w-full placeholder:text-[#6e5d52] select-text cursor-text"
                    />
                  </div>

                  {authError && authError === 'auth/operation-not-allowed' ? (
                    <div className="bg-[#241212] border-2 border-[#ef4444] text-[#fecaca] text-[7.5px] p-2.5 flex flex-col gap-2 rounded">
                      <div className="flex items-center gap-1.5 text-[#f87171] font-bold text-[8px] uppercase">
                        <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                        <span>Proveedor de Correo no habilitado en Firebase</span>
                      </div>
                      <p className="leading-relaxed text-[#fca5a5]">
                        Firebase bloquea el inicio con correo/contraseña por defecto hasta que lo habilitas en su consola.
                      </p>
                      <div className="bg-[#180c0c] border border-[#7f1d1d] p-2 rounded flex flex-col gap-1 text-[7px] text-[#fed7aa]">
                        <span className="font-bold text-[#fbbf24]">CÓMO HABILITARLO EN 3 PASOS:</span>
                        <span>1. Entra a tu Firebase Console &gt; <strong>Authentication</strong>.</span>
                        <span>2. Ve a la pestaña <strong>Sign-in method</strong> (Métodos de acceso).</span>
                        <span>3. Haz clic en <strong>Correo electrónico/Contraseña</strong>, activa el interruptor de <strong>Habilitar</strong> y pulsa <strong>Guardar</strong>.</span>
                      </div>
                      <div className="flex items-center justify-between flex-wrap gap-1.5 pt-1">
                        <a
                          href="https://console.firebase.google.com/project/ai-studio-agente077roguees-207f82bd-d188-49a9-97cd-3571fe51477e/authentication/providers"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-2 py-1 bg-[#ef4444] hover:bg-[#dc2626] text-white font-bold rounded text-[7px] inline-flex items-center gap-1"
                        >
                          ABRIR CONSOLA FIREBASE &rarr;
                        </a>
                        <span className="text-[7px] text-[#9ca3af]">
                          O utiliza <strong>Google Sign-In</strong> arriba.
                        </span>
                      </div>
                    </div>
                  ) : authError ? (
                    <div className="bg-red-950/80 border border-red-500/80 text-red-200 text-[7px] p-2 leading-relaxed flex items-center gap-1.5">
                      <AlertCircle className="w-3 h-3 text-red-400 shrink-0" />
                      <span>{authError}</span>
                    </div>
                  ) : null}

                  <button
                    id="auth-submit-btn"
                    type="submit"
                    disabled={authLoading}
                    className="w-full py-2 bg-[#2a221d] hover:bg-[#3d322a] border border-[#e2b044] text-[#e2b044] text-[8px] font-bold cursor-pointer transition-colors flex items-center justify-center gap-2 shadow-[0_2px_0_#1a1512]"
                  >
                    {authLoading ? (
                      <RefreshCw className="w-3 h-3 animate-spin" />
                    ) : (
                      <LogIn className="w-3 h-3" />
                    )}
                    <span>
                      {authMode === 'login'
                        ? 'INICIAR SESIÓN Y CARGAR PARTIDA'
                        : 'CREAR REGISTRO EN BD Y GUARDAR PROGRESO'}
                    </span>
                  </button>
                </form>
              </div>
            </div>
          )}
        </div>

        {/* Action feedback message */}
        {saveActionMessage && (
          <div className="bg-[#1b1e16] border border-[#4ade80] text-[#4ade80] text-[8px] p-2 mb-3 flex items-center gap-2">
            <CheckCircle2 className="w-3 h-3 shrink-0" />
            <span>{saveActionMessage}</span>
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-2 mb-3">
          <button
            id="tab-save-btn"
            onClick={() => setActiveTab('save')}
            className={`flex-1 py-1.5 text-[8px] sm:text-[9px] border-2 uppercase transition-colors cursor-pointer ${
              activeTab === 'save'
                ? 'bg-[#3d322a] border-[#e2b044] text-[#e2b044]'
                : 'bg-[#181311] border-[#2a221d] text-[#8c786a] hover:text-[#d4c5b9]'
            }`}
          >
            PARTIDA GUARDADA
          </button>
          <button
            id="tab-leaderboard-btn"
            onClick={() => setActiveTab('leaderboard')}
            className={`flex-1 py-1.5 text-[8px] sm:text-[9px] border-2 uppercase transition-colors cursor-pointer ${
              activeTab === 'leaderboard'
                ? 'bg-[#3d322a] border-[#e2b044] text-[#e2b044]'
                : 'bg-[#181311] border-[#2a221d] text-[#8c786a] hover:text-[#d4c5b9]'
            }`}
          >
            TOP SURVIVORS
          </button>
          <button
            id="tab-registros-btn"
            onClick={() => setActiveTab('registros')}
            className={`flex-1 py-1.5 text-[8px] sm:text-[9px] border-2 uppercase transition-colors cursor-pointer flex items-center justify-center gap-1 ${
              activeTab === 'registros'
                ? 'bg-[#3d322a] border-[#e2b044] text-[#e2b044]'
                : 'bg-[#181311] border-[#2a221d] text-[#8c786a] hover:text-[#d4c5b9]'
            }`}
          >
            <Database className="w-3 h-3" />
            REGISTROS EN BD {registeredUsers.length > 0 && `(${registeredUsers.length})`}
          </button>
          <button
            id="tab-profile-btn"
            onClick={() => setActiveTab('profile')}
            className={`flex-1 py-1.5 text-[8px] sm:text-[9px] border-2 uppercase transition-colors cursor-pointer ${
              activeTab === 'profile'
                ? 'bg-[#3d322a] border-[#e2b044] text-[#e2b044]'
                : 'bg-[#181311] border-[#2a221d] text-[#8c786a] hover:text-[#d4c5b9]'
            }`}
          >
            ESTADÍSTICAS
          </button>
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto pr-1">
          {activeTab === 'save' && (
            <div className="flex flex-col gap-3 py-1">
              {savedGame ? (
                <div className="bg-[#181311] border-2 border-[#4ade80] p-3 sm:p-4 flex flex-col gap-3 shadow-[0_0_15px_rgba(74,222,128,0.15)]">
                  <div className="flex items-center justify-between border-b border-[#3d322a] pb-2">
                    <span className="text-[10px] text-[#4ade80] font-bold flex items-center gap-1.5">
                      <Save className="w-3.5 h-3.5 text-[#4ade80]" /> PUNTO DE CONTROL DISPONIBLE
                    </span>
                    <span className="text-[7px] text-[#8c786a]">
                      {savedGame.updatedAt?.toDate
                        ? new Date(savedGame.updatedAt.toDate()).toLocaleDateString() +
                          ' ' +
                          new Date(savedGame.updatedAt.toDate()).toLocaleTimeString()
                        : 'Reciente'}
                    </span>
                  </div>

                  {/* Saved Stats Card */}
                  <div className="grid grid-cols-2 gap-2 text-[8px]">
                    <div className="bg-[#100d0b] border border-[#3d322a] p-2 flex flex-col gap-1">
                      <span className="text-[#8c786a]">PISO ACTUAL</span>
                      <span className="text-sm text-[#e2b044] font-bold">
                        Sector Industrial 1-{savedGame.floorLevel}
                      </span>
                    </div>
                    <div className="bg-[#100d0b] border border-[#3d322a] p-2 flex flex-col gap-1">
                      <span className="text-[#8c786a]">SALUD DEL MUÑECO</span>
                      <span className="text-sm text-[#ef4444] font-bold flex items-center gap-1">
                        <Heart className="w-3.5 h-3.5 fill-[#ef4444]" />
                        {savedGame.health} / {savedGame.maxHealth} HP
                      </span>
                    </div>
                    <div className="bg-[#100d0b] border border-[#3d322a] p-2 flex flex-col gap-1">
                      <span className="text-[#8c786a]">UBICACIÓN EXACTA</span>
                      <span className="text-[8px] text-[#f4ecd8] flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-[#e2b044]" />
                        X: {savedGame.playerX}, Y: {savedGame.playerY}
                      </span>
                      <span className="text-[7px] text-[#8c786a] truncate">
                        Sala: {savedGame.currentRoomId}
                      </span>
                    </div>
                    <div className="bg-[#100d0b] border border-[#3d322a] p-2 flex flex-col gap-1">
                      <span className="text-[#8c786a]">MUNICIÓN & RADS</span>
                      <span className="text-[9px] text-[#f4ecd8]">
                        Munición: {savedGame.ammo} | Rads: {savedGame.intelCollected || 0} ☢
                      </span>
                      <span className="text-[7px] text-[#4ade80]">
                        Salas despejadas: {savedGame.clearedRoomIds?.length || 0}
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col sm:flex-row gap-2 mt-1">
                    {onResumeGame && (
                      <button
                        id="resume-game-btn"
                        onClick={handleResume}
                        className="flex-1 py-2.5 bg-[#15803d] hover:bg-[#16a34a] border-2 border-[#4ade80] text-white text-[9px] font-bold flex items-center justify-center gap-2 cursor-pointer transition-all shadow-[0_3px_0_#14532d]"
                      >
                        <Play className="w-4 h-4 fill-white" />
                        REANUDAR DONDE SE QUEDÓ
                      </button>
                    )}

                    {onSaveCurrentGame && (
                      <button
                        id="overwrite-save-btn"
                        onClick={handleManualSave}
                        className="py-2.5 px-3 bg-[#2a221d] hover:bg-[#3d322a] border border-[#e2b044] text-[#e2b044] text-[8px] flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
                        title="Guardar estado actual del muñeco"
                      >
                        <Save className="w-3.5 h-3.5" />
                        ACTUALIZAR GUARDADO
                      </button>
                    )}

                    <button
                      id="delete-save-btn"
                      onClick={handleDeleteSave}
                      className="py-2.5 px-3 bg-[#2a221d] hover:bg-red-950/60 border border-red-800/60 text-red-400 text-[8px] flex items-center justify-center gap-1 cursor-pointer transition-colors"
                      title="Borrar partida guardada"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ) : (
                <div className="bg-[#181311] border-2 border-[#3d322a] p-4 text-center flex flex-col items-center gap-2.5">
                  <Save className="w-8 h-8 text-[#8c786a]" />
                  <div className="text-[9px] text-[#f4ecd8]">NO HAY PARTIDA GUARDADA ACTIVA</div>
                  <p className="text-[7.5px] text-[#8c786a] max-w-sm leading-relaxed">
                    {user
                      ? 'Guarda la posición exacta de tu muñeco y el piso en cualquier momento para continuar cuando quieras.'
                      : 'Inicia sesión con correo y contraseña o Google arriba para guardar tu progreso en la nube.'}
                  </p>

                  {user && onSaveCurrentGame && (
                    <button
                      id="save-now-btn"
                      onClick={handleManualSave}
                      className="mt-1 py-2 px-4 bg-[#e2b044] hover:bg-[#f59e0b] text-black text-[8px] font-bold border-2 border-[#fbbf24] flex items-center gap-1.5 cursor-pointer shadow-[0_2px_0_#b45309]"
                    >
                      <Save className="w-3.5 h-3.5" />
                      GUARDAR POSICIÓN ACTUAL AHORA
                    </button>
                  )}
                </div>
              )}
            </div>
          )}

          {activeTab === 'leaderboard' && (
            <div>
              {loadingEntries ? (
                <div className="py-12 flex flex-col items-center justify-center gap-2 text-[#8c786a]">
                  <RefreshCw className="w-5 h-5 animate-spin text-[#4ade80]" />
                  <span className="text-[9px]">CONNECTING TO SECTOR DB...</span>
                </div>
              ) : entries.length === 0 ? (
                <div className="py-12 text-center text-[#8c786a] text-[9px] leading-relaxed">
                  NO SURVIVOR RECORDS YET.
                  <br />
                  <span className="text-[#4ade80]">BE THE FIRST MUTANT TO CLAIM GLORY!</span>
                </div>
              ) : (
                <div className="flex flex-col gap-1.5">
                  <div className="grid grid-cols-12 text-[8px] text-[#8c786a] px-2 py-1 border-b border-[#2a221d]">
                    <span className="col-span-1">#</span>
                    <span className="col-span-6">MUTANT</span>
                    <span className="col-span-2 text-center">LEVEL</span>
                    <span className="col-span-3 text-right">RADS</span>
                  </div>
                  {entries.map((entry, idx) => {
                    const isTop3 = idx < 3;
                    const rankColor =
                      idx === 0 ? 'text-[#facc15]' : idx === 1 ? 'text-[#e2e8f0]' : idx === 2 ? 'text-[#d97706]' : 'text-[#8c786a]';

                    return (
                      <div
                        key={entry.id || idx}
                        className={`grid grid-cols-12 items-center px-2 py-2 border text-[9px] ${
                          entry.userId === user?.uid
                            ? 'bg-[#1f291e] border-[#4ade80]/60 text-[#f4ecd8]'
                            : 'bg-[#181311] border-[#2a221d] text-[#d4c5b9]'
                        }`}
                      >
                        <span className={`col-span-1 ${rankColor}`}>{idx + 1}</span>
                        <div className="col-span-6 flex items-center gap-2 truncate">
                          {entry.photoURL ? (
                            <img
                              src={entry.photoURL}
                              alt=""
                              referrerPolicy="no-referrer"
                              className="w-4 h-4 rounded-xs border border-[#3d322a]"
                            />
                          ) : (
                            <div className="w-4 h-4 bg-[#2a221d] flex items-center justify-center text-[7px] text-[#4ade80]">
                              ☢
                            </div>
                          )}
                          <span className="truncate">{entry.displayName || 'Unknown'}</span>
                        </div>
                        <span className="col-span-2 text-center text-[#e2b044]">
                          {entry.floorLevel}-{1}
                        </span>
                        <span className="col-span-3 text-right text-[#4ade80]">
                          {entry.radsCollected} ☢
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {activeTab === 'registros' && (
            <div className="py-1 flex flex-col gap-3">
              {/* Active User Record in Firestore */}
              {user && userProfile && (
                <div className="bg-[#181311] border-2 border-[#4ade80]/70 p-3 flex flex-col gap-2">
                  <div className="flex items-center justify-between border-b border-[#3d322a] pb-2">
                    <span className="text-[9px] text-[#4ade80] font-bold flex items-center gap-1.5">
                      <UserCheck className="w-3.5 h-3.5 text-[#4ade80]" />
                      TU REGISTRO VIVO EN FIRESTORE
                    </span>
                    <span className="text-[7px] text-[#4ade80] bg-[#14532d]/40 px-2 py-0.5 rounded border border-[#4ade80]/50">
                      🟢 GUARDADO EN BASE DE DATOS
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[8px]">
                    <div className="bg-[#100d0b] border border-[#3d322a] p-2 flex flex-col gap-0.5">
                      <span className="text-[#8c786a]">DOCUMENTO UID</span>
                      <span className="text-[#f4ecd8] font-mono truncate">{userProfile.id}</span>
                    </div>
                    <div className="bg-[#100d0b] border border-[#3d322a] p-2 flex flex-col gap-0.5">
                      <span className="text-[#8c786a]">ALIAS / NOMBRE (CAMPO OPCIONAL)</span>
                      <span className="text-[#e2b044] font-bold">
                        {userProfile.displayName || (
                          <span className="text-[#8c786a] italic font-normal">(Opcional dejado vacío - Registrado en BD)</span>
                        )}
                      </span>
                    </div>
                    <div className="bg-[#100d0b] border border-[#3d322a] p-2 flex flex-col gap-0.5">
                      <span className="text-[#8c786a]">CORREO DE CONTACTO</span>
                      <span className="text-[#f4ecd8]">{userProfile.email || user.email || 'No especificado'}</span>
                    </div>
                    <div className="bg-[#100d0b] border border-[#3d322a] p-2 flex flex-col gap-0.5">
                      <span className="text-[#8c786a]">FACCIÓN / ESCUADRÓN (CAMPO OPCIONAL)</span>
                      <span className="text-[#f4ecd8]">
                        {userProfile.faction || (
                          <span className="text-[#8c786a] italic font-normal">(Opcional dejado vacío - Registrado en BD)</span>
                        )}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* All Registered Agent Documents in Database */}
              <div className="bg-[#181311] border border-[#3d322a] p-3 flex flex-col gap-2">
                <div className="flex items-center justify-between border-b border-[#3d322a] pb-2">
                  <span className="text-[9px] text-[#f4ecd8] font-bold flex items-center gap-1.5">
                    <Database className="w-3.5 h-3.5 text-[#e2b044]" />
                    REGISTROS EN LA BASE DE DATOS (/users)
                  </span>
                  <span className="text-[7.5px] text-[#8c786a]">
                    Total: {registeredUsers.length} registros persistidos
                  </span>
                </div>

                {loadingUsers ? (
                  <div className="py-8 flex flex-col items-center justify-center gap-2 text-[#8c786a]">
                    <RefreshCw className="w-5 h-5 animate-spin text-[#e2b044]" />
                    <span className="text-[8px]">CONSULTANDO COLECCIÓN DE REGISTROS EN FIRESTORE...</span>
                  </div>
                ) : registeredUsers.length === 0 ? (
                  <div className="py-6 text-center text-[#8c786a] text-[8.5px]">
                    No hay registros aún en la colección /users.
                    <br />
                    ¡Crea una cuenta arriba para agregar el primer registro a la base de datos!
                  </div>
                ) : (
                  <div className="flex flex-col gap-1.5 max-h-60 overflow-y-auto">
                    <div className="grid grid-cols-12 text-[7.5px] text-[#8c786a] px-2 py-1 border-b border-[#2a221d]">
                      <span className="col-span-1">#</span>
                      <span className="col-span-4">NOMBRE / ALIAS</span>
                      <span className="col-span-4">CORREO</span>
                      <span className="col-span-3 text-right">ESTADO BD</span>
                    </div>
                    {registeredUsers.map((u, idx) => (
                      <div
                        key={u.id || idx}
                        className={`grid grid-cols-12 items-center px-2 py-1.5 border text-[8px] ${
                          u.id === user?.uid
                            ? 'bg-[#1f291e] border-[#4ade80]/60 text-[#f4ecd8]'
                            : 'bg-[#100d0b] border-[#2a221d] text-[#d4c5b9]'
                        }`}
                      >
                        <span className="col-span-1 text-[#8c786a]">{idx + 1}</span>
                        <div className="col-span-4 truncate font-medium">
                          {u.displayName ? (
                            <span className="text-[#f4ecd8]">{u.displayName}</span>
                          ) : (
                            <span className="text-[#8c786a] italic">(Opcional vacío)</span>
                          )}
                          {u.faction && (
                            <span className="text-[7px] text-[#e2b044] block truncate">[{u.faction}]</span>
                          )}
                        </div>
                        <span className="col-span-4 truncate text-[#8c786a]">
                          {u.email || (u.id.substring(0, 10) + '...')}
                        </span>
                        <span className="col-span-3 text-right text-[7px] text-[#4ade80]">
                          🟢 FIRESTORE
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'profile' && (
            <div className="py-2 flex flex-col gap-3">
              {user ? (
                <div className="flex flex-col gap-3">
                  <div className="bg-[#181311] border-2 border-[#3d322a] p-3 flex items-center gap-3">
                    {user.photoURL ? (
                      <img
                        src={user.photoURL}
                        alt=""
                        referrerPolicy="no-referrer"
                        className="w-12 h-12 rounded border-2 border-[#4ade80]"
                      />
                    ) : (
                      <div className="w-12 h-12 bg-[#2a221d] flex items-center justify-center border-2 border-[#8c786a]">
                        <UserIcon className="w-6 h-6 text-[#4ade80]" />
                      </div>
                    )}
                    <div>
                      <div className="text-[11px] text-[#f4ecd8]">{user.displayName || 'Agent Mutant'}</div>
                      <div className="text-[8px] text-[#8c786a] mt-1">{user.email}</div>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <div className="bg-[#181311] border-2 border-[#3d322a] p-3 text-center">
                      <div className="text-[8px] text-[#8c786a] mb-1">HIGHEST LEVEL</div>
                      <div className="text-lg text-[#e2b044]">{userProfile?.highestFloor || 1}-1</div>
                    </div>
                    <div className="bg-[#181311] border-2 border-[#3d322a] p-3 text-center">
                      <div className="text-[8px] text-[#8c786a] mb-1">TOTAL RADS</div>
                      <div className="text-lg text-[#4ade80]">{userProfile?.totalRads || 0} ☢</div>
                    </div>
                    <div className="bg-[#181311] border-2 border-[#3d322a] p-3 text-center">
                      <div className="text-[8px] text-[#8c786a] mb-1">RUNS STARTED</div>
                      <div className="text-lg text-[#f4ecd8]">{userProfile?.runsPlayed || 1}</div>
                    </div>
                  </div>

                  <div className="bg-[#1b1e16] border border-[#4ade80]/40 p-2.5 text-[8px] text-[#4ade80] leading-relaxed">
                    ✔ All completed runs & rads are continuously backed up to Google Cloud Firestore.
                  </div>
                </div>
              ) : (
                <div className="py-8 flex flex-col items-center justify-center gap-3 text-center">
                  <Flame className="w-8 h-8 text-[#e2b044]" />
                  <div className="text-[10px] text-[#f4ecd8]">NO CLOUD PROFILE LINKED</div>
                  <p className="text-[8px] text-[#8c786a] max-w-sm leading-relaxed">
                    Sign in with Google or Email/Password above to permanently track your mutant evolution, highest industrial sector, and compete on the global leaderboard.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="mt-3 pt-2 border-t border-[#3d322a] flex items-center justify-between text-[8px] text-[#8c786a]">
          <span>SERVER: US-WEST1</span>
          <span className="text-[#4ade80]">FIRESTORE ONLINE</span>
        </div>
      </div>
    </div>
  );
};
