
import { collection, addDoc, query, where, orderBy, limit, getDocs } from "firebase/firestore";
import { db } from "../firebase";
import { StudySession } from "../types";

export const saveStudySession = async (session: StudySession) => {
  try {
    const docRef = await addDoc(collection(db, "studySessions"), {
      ...session,
      createdAt: Date.now()
    });
    return docRef.id;
  } catch (error) {
    console.error("Error saving session:", error);
    throw error;
  }
};

export const getStudyHistory = async (userId: string): Promise<StudySession[]> => {
  try {
    const q = query(
      collection(db, "studySessions"),
      where("userId", "==", userId),
      orderBy("createdAt", "desc"),
      limit(10)
    );
    const querySnapshot = await getDocs(q);
    const history: StudySession[] = [];
    querySnapshot.forEach((doc) => {
      history.push({ id: doc.id, ...doc.data() } as StudySession);
    });
    return history;
  } catch (error) {
    console.error("Error fetching study history:", error);
    return [];
  }
};
