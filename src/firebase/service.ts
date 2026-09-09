import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from './config';

export interface UserProfileData {
  id: string;
  displayName?: string;
  email?: string;
  faction?: string;
  photoURL?: string;
  highestFloor: number;
  totalRads: number;
  runsPlayed: number;
  createdAt?: any;
  updatedAt?: any;
}

export interface SavedGameData {
  userId: string;
  floorLevel: number;
  seed: number;
  playerX: number;
  playerY: number;
  currentRoomId: string;
  health: number;
  maxHealth: number;
  ammo: number;
  explosivesAmmo?: number;
  intelCollected?: number;
  clearedRoomIds?: string[];
  visitedRoomIds?: string[];
  updatedAt?: any;
}

export interface LeaderboardEntryData {
  id: string;
  userId: string;
  displayName: string;
  photoURL?: string;
  floorLevel: number;
  radsCollected: number;
  outcome: 'victory' | 'defeated';
  createdAt?: any;
}

export async function getUserProfile(userId: string): Promise<UserProfileData | null> {
  const path = `users/${userId}`;
  try {
    const docRef = doc(db, 'users', userId);
    const snap = await getDoc(docRef);
    if (!snap.exists()) return null;
    return snap.data() as UserProfileData;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
  }
}

export async function createUserRecord(
  userId: string,
  email: string,
  displayName?: string,
  faction?: string,
  photoURL?: string
): Promise<UserProfileData> {
  const path = `users/${userId}`;
  try {
    const docRef = doc(db, 'users', userId);
    const newProfile: Record<string, any> = {
      id: userId,
      highestFloor: 1,
      totalRads: 0,
      runsPlayed: 0,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    // Optional field: displayName (can be omitted or set if provided)
    if (displayName !== undefined && displayName !== null && displayName.trim() !== '') {
      newProfile.displayName = displayName.trim().slice(0, 64);
    }
    // Optional field: email
    if (email && email.trim() !== '') {
      newProfile.email = email.trim().slice(0, 128);
    }
    // Optional field: faction
    if (faction !== undefined && faction !== null && faction.trim() !== '') {
      newProfile.faction = faction.trim().slice(0, 64);
    }
    // Optional field: photoURL
    if (photoURL && photoURL.trim() !== '') {
      newProfile.photoURL = photoURL.trim().slice(0, 500);
    }

    await setDoc(docRef, newProfile);
    return newProfile as UserProfileData;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function upsertUserProfile(
  userId: string,
  displayName: string | undefined,
  photoURL: string | undefined,
  runFloor: number,
  runRads: number,
  email?: string,
  faction?: string
): Promise<UserProfileData> {
  const path = `users/${userId}`;
  try {
    const docRef = doc(db, 'users', userId);
    const existing = await getDoc(docRef);

    if (!existing.exists()) {
      const newProfile: Record<string, any> = {
        id: userId,
        highestFloor: Math.max(1, runFloor),
        totalRads: Math.max(0, runRads),
        runsPlayed: 1,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };
      if (displayName !== undefined && displayName !== null && displayName.trim() !== '') {
        newProfile.displayName = displayName.trim().slice(0, 64);
      }
      if (email && email.trim() !== '') {
        newProfile.email = email.trim().slice(0, 128);
      }
      if (faction && faction.trim() !== '') {
        newProfile.faction = faction.trim().slice(0, 64);
      }
      if (photoURL && photoURL.trim() !== '') {
        newProfile.photoURL = photoURL.trim().slice(0, 500);
      }
      await setDoc(docRef, newProfile);
      return newProfile as UserProfileData;
    } else {
      const curr = existing.data() as UserProfileData;
      const updatePayload: Record<string, any> = {
        highestFloor: Math.max(curr.highestFloor || 1, runFloor),
        totalRads: (curr.totalRads || 0) + runRads,
        runsPlayed: (curr.runsPlayed || 0) + 1,
        updatedAt: serverTimestamp(),
      };
      if (displayName !== undefined && displayName !== null && displayName.trim() !== '') {
        updatePayload.displayName = displayName.trim().slice(0, 64);
      }
      if (email && email.trim() !== '' && !curr.email) {
        updatePayload.email = email.trim().slice(0, 128);
      }
      if (faction && faction.trim() !== '' && !curr.faction) {
        updatePayload.faction = faction.trim().slice(0, 64);
      }
      if (photoURL && photoURL.trim() !== '') {
        updatePayload.photoURL = photoURL.trim().slice(0, 500);
      }
      await updateDoc(docRef, updatePayload);
      return { ...curr, ...updatePayload };
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export function subscribeToUserProfiles(callback: (entries: UserProfileData[]) => void): () => void {
  const path = 'users';
  const q = query(collection(db, 'users'), orderBy('createdAt', 'desc'), limit(50));

  return onSnapshot(
    q,
    (snapshot) => {
      const entries: UserProfileData[] = [];
      snapshot.forEach((docSnap) => {
        entries.push(docSnap.data() as UserProfileData);
      });
      callback(entries);
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, path);
    }
  );
}

export async function submitLeaderboardRun(
  userId: string,
  displayName: string,
  photoURL: string | undefined,
  floorLevel: number,
  radsCollected: number,
  outcome: 'victory' | 'defeated'
): Promise<void> {
  const runId = `run_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  const path = `leaderboard/${runId}`;
  try {
    const docRef = doc(db, 'leaderboard', runId);
    const payload: Record<string, any> = {
      id: runId,
      userId,
      displayName: displayName.slice(0, 64) || 'Mutant Runner',
      floorLevel: Math.max(1, floorLevel),
      radsCollected: Math.max(0, radsCollected),
      outcome,
      createdAt: serverTimestamp(),
    };
    if (photoURL) {
      payload.photoURL = photoURL.slice(0, 500);
    }
    await setDoc(docRef, payload);
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export function subscribeToLeaderboard(callback: (entries: LeaderboardEntryData[]) => void): () => void {
  const path = 'leaderboard';
  const q = query(collection(db, 'leaderboard'), orderBy('floorLevel', 'desc'), limit(20));

  return onSnapshot(
    q,
    (snapshot) => {
      const entries: LeaderboardEntryData[] = [];
      snapshot.forEach((docSnap) => {
        entries.push(docSnap.data() as LeaderboardEntryData);
      });
      callback(entries);
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, path);
    }
  );
}

export async function getSavedGame(userId: string): Promise<SavedGameData | null> {
  const path = `saves/${userId}`;
  try {
    const docRef = doc(db, 'saves', userId);
    const snap = await getDoc(docRef);
    if (!snap.exists()) return null;
    return snap.data() as SavedGameData;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
  }
}

export async function saveGame(
  userId: string,
  gameData: Omit<SavedGameData, 'userId' | 'updatedAt'>
): Promise<void> {
  const path = `saves/${userId}`;
  try {
    const docRef = doc(db, 'saves', userId);
    const payload: Record<string, any> = {
      userId,
      floorLevel: Math.max(1, gameData.floorLevel),
      seed: gameData.seed,
      playerX: Math.round(gameData.playerX),
      playerY: Math.round(gameData.playerY),
      currentRoomId: gameData.currentRoomId.slice(0, 64),
      health: Math.max(0, gameData.health),
      maxHealth: Math.max(1, gameData.maxHealth),
      ammo: Math.max(0, gameData.ammo),
      explosivesAmmo: Math.max(0, gameData.explosivesAmmo ?? 18),
      intelCollected: Math.max(0, gameData.intelCollected ?? 0),
      clearedRoomIds: (gameData.clearedRoomIds || []).slice(0, 50),
      visitedRoomIds: (gameData.visitedRoomIds || []).slice(0, 50),
      updatedAt: serverTimestamp(),
    };
    await setDoc(docRef, payload);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function deleteSavedGame(userId: string): Promise<void> {
  const path = `saves/${userId}`;
  try {
    const docRef = doc(db, 'saves', userId);
    await deleteDoc(docRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

