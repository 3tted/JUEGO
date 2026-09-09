import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth, loginWithGoogle, loginWithEmail as loginWithEmailAuth, registerWithEmail as registerWithEmailAuth, logoutUser } from './config';
import {
  getUserProfile,
  upsertUserProfile,
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
  registerWithEmail: (email: string, pass: string, displayName?: string) => Promise<void>;
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
  registerWithEmail: async () => {},
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
          currentUser.displayName || currentUser.email?.split('@')[0] || 'Mutant Scout',
          currentUser.photoURL || undefined,
          1,
          0
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
        setSavedGame(null);
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

  const registerWithEmail = async (email: string, pass: string, displayName?: string) => {
    try {
      await registerWithEmailAuth(email, pass, displayName);
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
    if (!user) return false;
    try {
      await saveGameFirestore(user.uid, data);
      await refreshSavedGame();
      return true;
    } catch (err) {
      console.error('Failed to save game progress:', err);
      return false;
    }
  };

  const loadSavedGame = async (): Promise<SavedGameData | null> => {
    if (!user) return null;
    try {
      const save = await getSavedGame(user.uid);
      setSavedGame(save || null);
      return save || null;
    } catch (err) {
      console.error('Failed to load saved game:', err);
      return null;
    }
  };

  const deleteSavedGameProgress = async () => {
    if (!user) return;
    try {
      await deleteSavedGameFirestore(user.uid);
      setSavedGame(null);
    } catch (err) {
      console.error('Failed to delete saved game:', err);
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

