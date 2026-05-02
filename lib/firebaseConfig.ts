import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyAe2j2--6Juom-940oNb0eAxE-UvJKxp3o",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "luci-gestao.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "luci-gestao",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "luci-gestao.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "958031002720",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:958031002720:web:97aeb47c742e6962689705"
};

// Inicializa o Firebase
const app = initializeApp(firebaseConfig);

// Exporta o banco de dados e a autenticação para usar no resto do app
export const db = getFirestore(app);
export const auth = getAuth(app);
