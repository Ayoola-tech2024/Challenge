
import { collection, addDoc, query, where, getDocs } from "firebase/firestore";
import { db } from "../firebase";
import { StudySession } from "../types";

const LOCAL_STORAGE_KEY = 'exampro_local_vault';

// Helper to manage local fallback
const getLocalHistory = (): StudySession[] => {
  try {
    const data = localStorage.getItem(LOCAL_STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch (e) {
    return [];
  }
};

const saveToLocal = (session: StudySession) => {
  const history = getLocalHistory();
  const newSession = { ...session, id: `local_${Date.now()}`, createdAt: Date.now() };
  localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify([newSession, ...history].slice(0, 20)));
  return newSession.id;
};

export const saveStudySession = async (session: StudySession) => {
  try {
    // Attempt Cloud Sync
    const docRef = await addDoc(collection(db, "studySessions"), {
      ...session,
      createdAt: Date.now()
    });
    return docRef.id;
  } catch (error: any) {
    console.warn("Cloud Sync Permission Denied. Falling back to Local Vault.", error.message);
    // Fallback to local storage if Firestore permissions fail
    return saveToLocal(session);
  }
};

export const getStudyHistory = async (userId: string): Promise<StudySession[]> => {
  let cloudHistory: StudySession[] = [];
  
  try {
    const q = query(
      collection(db, "studySessions"),
      where("userId", "==", userId)
    );
    
    const querySnapshot = await getDocs(q);
    querySnapshot.forEach((doc) => {
      cloudHistory.push({ id: doc.id, ...doc.data() } as StudySession);
    });
  } catch (error: any) {
    console.warn("Database Access Restricted. Retrieving Local Vault only.", error.message);
  }

  // Merge Cloud and Local history, sort by date
  const localHistory = getLocalHistory();
  const combined = [...cloudHistory, ...localHistory];
  
  return combined
    .sort((a, b) => b.createdAt - a.createdAt)
    .filter((v, i, a) => a.findIndex(t => t.id === v.id) === i) // Deduplicate
    .slice(0, 15);
};
