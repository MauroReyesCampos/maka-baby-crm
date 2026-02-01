import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyAABB6m_D6sss3m99-uJj3KcmcBLonH21M",
  authDomain: "maka-baby-crm.firebaseapp.com",
  projectId: "maka-baby-crm",
  storageBucket: "maka-baby-crm.firebasestorage.app",
  messagingSenderId: "256345649630",
  appId: "1:256345649630:web:ab7cb93408a247f4846d4f"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
