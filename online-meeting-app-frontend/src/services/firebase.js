import { initializeApp, getApps } from "firebase/app";
import { getAuth, GoogleAuthProvider, setPersistence, browserLocalPersistence } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyCdjgZ3CE7Nl9iuVzgp_dCHSgIQqXEymP4",
  authDomain: "ai-meeting-app-141e0.firebaseapp.com",
  projectId: "ai-meeting-app-141e0",
  storageBucket: "ai-meeting-app-141e0.firebasestorage.app",
  messagingSenderId: "522741413504",
  appId: "1:522741413504:web:e0030b4f107cce65fad865"
};

// ✅ prevent multiple initialization
const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);

export const auth = getAuth(app);

// ✅ force session persistence
setPersistence(auth, browserLocalPersistence)
  .then(() => console.log("Firebase persistence set ✅"))
  .catch(console.error);

export const googleProvider = new GoogleAuthProvider();