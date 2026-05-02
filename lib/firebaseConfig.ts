import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyAe2j2--6Juom-940oNb0eAxE-UvJKxp3o",
  authDomain: "luci-gestao.firebaseapp.com",
  projectId: "luci-gestao",
  storageBucket: "luci-gestao.firebasestorage.app",
  messagingSenderId: "958031002720",
  appId: "1:958031002720:web:97aeb47c742e6962689705"
};

// Inicializa o Firebase
const app = initializeApp(firebaseConfig);

// Exporta o banco de dados e a autenticação para usar no resto do app
export const db = getFirestore(app);
export const auth = getAuth(app);
