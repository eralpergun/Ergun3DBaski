import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyATkskjf6QCic66jK7wR3dKHYqHUa_Y17o",
  authDomain: "ergun3dbaski.firebaseapp.com",
  databaseURL: "https://ergun3dbaski-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "ergun3dbaski",
  storageBucket: "ergun3dbaski.firebasestorage.app",
  messagingSenderId: "559413510900",
  appId: "1:559413510900:web:93ae8b73a0df7c2d6114a1",
  measurementId: "G-W441BC1VGF"
};

const app = initializeApp(firebaseConfig);
export const database = getDatabase(app);
export const auth = getAuth(app);
