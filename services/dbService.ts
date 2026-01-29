
import { collection, addDoc, query, where, orderBy, limit, getDocs } from "firebase/firestore";
import { db } from "../firebase";
import { TestAttempt } from "../types";

export const saveTestAttempt = async (attempt: TestAttempt) => {
  try {
    const docRef = await addDoc(collection(db, "testAttempts"), {
      ...attempt,
      createdAt: Date.now()
    });
    return docRef.id;
  } catch (error) {
    console.error("Error saving attempt:", error);
    throw error;
  }
};

export const getUserHistory = async (userId: string): Promise<TestAttempt[]> => {
  try {
    const q = query(
      collection(db, "testAttempts"),
      where("userId", "==", userId),
      orderBy("createdAt", "desc"),
      limit(5)
    );
    const querySnapshot = await getDocs(q);
    const history: TestAttempt[] = [];
    querySnapshot.forEach((doc) => {
      history.push({ id: doc.id, ...doc.data() } as TestAttempt);
    });
    return history;
  } catch (error) {
    console.error("Error fetching history:", error);
    return [];
  }
};
