
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCpK157jIqdaUirEzvUpk1hoe8rCxcdW14",
  authDomain: "challenge-b9a9f.firebaseapp.com",
  projectId: "challenge-b9a9f",
  storageBucket: "challenge-b9a9f.firebasestorage.app",
  messagingSenderId: "657491885000",
  appId: "1:657491885000:web:4d67f81b0adddbf3a85efd"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();
