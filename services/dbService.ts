
import { collection, addDoc, query, where, getDocs, deleteDoc, doc } from "firebase/firestore";
import { db } from "../firebase";
import { StudySession } from "../types";

const VAULT_KEY_PREFIX = 'exampro_vault_v3_';
const ACTIVE_SESSION_KEY_PREFIX = 'exampro_active_session_';

const getVaultKey = (userId: string) => `${VAULT_KEY_PREFIX}${userId}`;
const getActiveKey = (userId: string) => `${ACTIVE_SESSION_KEY_PREFIX}${userId}`;

export const getLocalHistory = (userId: string): StudySession[] => {
  try {
    const data = localStorage.getItem(getVaultKey(userId));
    return data ? JSON.parse(data) : [];
  } catch (e) {
    return [];
  }
};

const saveToLocalHistory = (userId: string, session: StudySession) => {
  const history = getLocalHistory(userId);
  // Match by ID or by exact creation timestamp + title
  const existingIndex = history.findIndex(s => 
    (session.id && s.id === session.id) || 
    (s.createdAt === session.createdAt && s.title === session.title)
  );
  
  let updatedHistory = [...history];
  if (existingIndex > -1) {
    updatedHistory[existingIndex] = { ...updatedHistory[existingIndex], ...session };
  } else {
    updatedHistory.unshift(session);
  }

  updatedHistory = updatedHistory
    .sort((a, b) => b.createdAt - a.createdAt)
    .slice(0, 100);

  localStorage.setItem(getVaultKey(userId), JSON.stringify(updatedHistory));
};

export const saveActiveSessionState = (userId: string, session: StudySession | null) => {
  if (session) {
    localStorage.setItem(getActiveKey(userId), JSON.stringify(session));
  } else {
    localStorage.removeItem(getActiveKey(userId));
  }
};

export const getActiveSessionState = (userId: string): StudySession | null => {
  try {
    const data = localStorage.getItem(getActiveKey(userId));
    return data ? JSON.parse(data) : null;
  } catch (e) {
    return null;
  }
};

export const saveStudySession = async (session: StudySession) => {
  const localId = session.id || `local_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
  const sessionToSave = { ...session, id: localId, createdAt: session.createdAt || Date.now() };

  // 1. Immediate Local Persistance
  saveToLocalHistory(session.userId, sessionToSave);
  saveActiveSessionState(session.userId, sessionToSave);

  // 2. Background Sync
  try {
    const { id, ...dataForCloud } = sessionToSave;
    const docRef = await addDoc(collection(db, "studySessions"), dataForCloud);
    
    // 3. Upgrade local reference to Cloud ID
    const syncedSession = { ...sessionToSave, id: docRef.id };
    
    // Remove the old local-only entry if IDs differ
    if (localId !== docRef.id) {
       const history = getLocalHistory(session.userId).filter(s => s.id !== localId);
       // Fix: use session.userId instead of undefined userId
       localStorage.setItem(getVaultKey(session.userId), JSON.stringify([syncedSession, ...history]));
    } else {
       saveToLocalHistory(session.userId, syncedSession);
    }
    
    saveActiveSessionState(session.userId, syncedSession);
    return docRef.id;
  } catch (error: any) {
    console.warn("Offline: Data stored locally for future sync.", error.message);
    return localId;
  }
};

export const deleteStudySession = async (userId: string, sessionId: string) => {
  // 1. Local Delete
  const history = getLocalHistory(userId).filter(s => s.id !== sessionId);
  localStorage.setItem(getVaultKey(userId), JSON.stringify(history));
  
  // 2. Clear active if it matches
  const active = getActiveSessionState(userId);
  if (active?.id === sessionId) {
    saveActiveSessionState(userId, null);
    localStorage.removeItem(`exampro_progress_${userId}`);
  }

  // 3. Cloud Delete (if it's not a local-only ID)
  if (!sessionId.startsWith('local_')) {
    try {
      await deleteDoc(doc(db, "studySessions", sessionId));
    } catch (error) {
      console.error("Cloud deletion failed:", error);
    }
  }
};

export const getStudyHistory = async (userId: string): Promise<StudySession[]> => {
  const localData = getLocalHistory(userId);

  try {
    const q = query(
      collection(db, "studySessions"),
      where("userId", "==", userId)
    );
    
    const querySnapshot = await getDocs(q);
    const cloudSessions: StudySession[] = [];
    querySnapshot.forEach((doc) => {
      cloudSessions.push({ id: doc.id, ...doc.data() } as StudySession);
    });

    // Merge cloud data into local storage for caching
    cloudSessions.forEach(s => saveToLocalHistory(userId, s));
    return getLocalHistory(userId);
  } catch (error: any) {
    return localData; // Fallback to local on connection issues
  }
};

export const clearUserVault = (userId: string) => {
  localStorage.removeItem(getVaultKey(userId));
  localStorage.removeItem(getActiveKey(userId));
  localStorage.removeItem(`exampro_progress_${userId}`);
};
