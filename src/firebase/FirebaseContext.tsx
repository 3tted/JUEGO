import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth, loginWithGoogle, loginWithEmail as loginWithEmailAuth, registerWithEmail as registerWithEmailAuth, logoutUser } from './config';
import {
  getUserProfile,
  upsertUserProfile,
  createUserRecord,
  UserProfileData,
  SavedGameData,
  getSavedGame,
  saveGame as saveGameFirestore,
  deleteSavedGame as deleteSavedGameFirestore,
} from './service';

interface FirebaseContextType {
  user: User | null;
  userProfile: UserProfileData | null;
  savedGame: SavedGameData | null;
  loading: boolean;
  login: () => Promise<void>;
  loginWithEmail: (email: string, pass: string) => Promise<void>;
  registerWithEmail: (email: string, pass: string, displayName?: string, faction?: string) => Promise<UserProfileData | undefined>;
  logout: () => Promise<void>;
  saveRun: (floorLevel: number, radsCollected: number, outcome: 'victory' | 'defeated') => Promise<void>;
  saveGameProgress: (data: Omit<SavedGameData, 'userId' | 'updatedAt'>) => Promise<boolean>;
  loadSavedGame: () => Promise<SavedGameData | null>;
  deleteSavedGameProgress: () => Promise<void>;
  refreshSavedGame: () => Promise<void>;
}

const FirebaseContext = createContext<FirebaseContextType>({
  user: null,
  userProfile: null,
  savedGame: null,
  loading: true,
  login: async () => {},
  loginWithEmail: async () => {},
  registerWithEmail: async () => undefined,
  logout: async () => {},
  saveRun: async () => {},
  saveGameProgress: async () => false,
  loadSavedGame: async () => null,
  deleteSavedGameProgress: async () => {},
  refreshSavedGame: async () => {},
});

export const useFirebase = () => useContext(FirebaseContext);

export const FirebaseProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfileData | null>(null);
  const [savedGame, setSavedGame] = useState<SavedGameData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchUserData = useCallback(async (currentUser: User) => {
    try {
      const [profile, save] = await Promise.all([
        getUserProfile(currentUser.uid),
        getSavedGame(currentUser.uid),
      ]);
      if (profile) {
        setUserProfile(profile);
      } else {
        const newProf = await upsertUserProfile(
          currentUser.uid,
          currentUser.displayName || undefined,
          currentUser.photoURL || undefined,
          1,
          0,
          currentUser.email || undefined
        );
        setUserProfile(newProf);
      }
      setSavedGame(save || null);
    } catch (err) {
      console.error('Error fetching user data from Firestore:', err);
    }
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        await fetchUserData(currentUser);
      } else {
        setUserProfile(null);
        try {
          const localSaveStr = localStorage.getItem('mutant_roguelike_saved_game');
          if (localSaveStr) {
            setSavedGame(JSON.parse(localSaveStr));
          } else {
            setSavedGame(null);
          }
        } catch {
          setSavedGame(null);
        }
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [fetchUserData]);

  const login = async () => {
    try {
      await loginWithGoogle();
    } catch (err) {
      console.error('Login failed:', err);
      throw err;
    }
  };

  const loginWithEmail = async (email: string, pass: string) => {
    try {
      await loginWithEmailAuth(email, pass);
    } catch (err) {
      console.error('Email login failed:', err);
      throw err;
    }
  };

  const registerWithEmail = async (email: string, pass: string, displayName?: string, faction?: string) => {
    try {
      const authUser = await registerWithEmailAuth(email, pass, displayName);
      // Guarantee that the record is immediately created and persists in Firestore database
      const profile = await createUserRecord(authUser.uid, email, displayName, faction);
      if (profile) {
        setUserProfile(profile);
      }
      return profile;
    } catch (err) {
      console.error('Email registration failed:', err);
      throw err;
    }
  };

  const logout = async () => {
    try {
      await logoutUser();
      setUserProfile(null);
      setSavedGame(null);
    } catch (err) {
      console.error('Logout failed:', err);
      throw err;
    }
  };

  const refreshSavedGame = async () => {
    if (!user) return;
    try {
      const save = await getSavedGame(user.uid);
      setSavedGame(save || null);
    } catch (err) {
      console.error('Error refreshing saved game:', err);
    }
  };

  const saveRun = async (floorLevel: number, radsCollected: number, outcome: 'victory' | 'defeated') => {
    if (!user) return;
    try {
      const updated = await upsertUserProfile(
        user.uid,
        user.displayName || user.email?.split('@')[0] || 'Mutant Scout',
        user.photoURL || undefined,
        floorLevel,
        radsCollected
      );
      setUserProfile(updated);
    } catch (err) {
      console.error('Failed to save run stats:', err);
    }
  };

  const saveGameProgress = async (data: Omit<SavedGameData, 'userId' | 'updatedAt'>): Promise<boolean> => {
    const localSave: SavedGameData = {
      ...data,
      userId: user?.uid || 'local_agent',
      updatedAt: new Date().toISOString() as any,
    };
    try {
      localStorage.setItem('mutant_roguelike_saved_game', JSON.stringify(localSave));
      setSavedGame(localSave);
    } catch (e) {
      console.warn('Could not cache save to localStorage:', e);
    }

    if (!user) return true;
    try {
      await saveGameFirestore(user.uid, data);
      await refreshSavedGame();
      return true;
    } catch (err) {
      console.error('Failed to save game progress to Firestore:', err);
      return true;
    }
  };

  const loadSavedGame = async (): Promise<SavedGameData | null> => {
    if (user) {
      try {
        const save = await getSavedGame(user.uid);
        if (save) {
          setSavedGame(save);
          return save;
        }
      } catch (err) {
        console.warn('Failed to load saved game from Firestore, checking local backup:', err);
      }
    }
    try {
      const local = localStorage.getItem('mutant_roguelike_saved_game');
      if (local) {
        const parsed = JSON.parse(local) as SavedGameData;
        setSavedGame(parsed);
        return parsed;
      }
    } catch {
      // ignore
    }
    return null;
  };

  const deleteSavedGameProgress = async () => {
    try {
      localStorage.removeItem('mutant_roguelike_saved_game');
      setSavedGame(null);
    } catch {
      // ignore
    }
    if (!user) return;
    try {
      await deleteSavedGameFirestore(user.uid);
    } catch (err) {
      console.error('Failed to delete saved game from Firestore:', err);
    }
  };

  return (
    <FirebaseContext.Provider
      value={{
        user,
        userProfile,
        savedGame,
        loading,
        login,
        loginWithEmail,
        registerWithEmail,
        logout,
        saveRun,
        saveGameProgress,
        loadSavedGame,
        deleteSavedGameProgress,
        refreshSavedGame,
      }}
    >
      {children}
    </FirebaseContext.Provider>
  );
};

