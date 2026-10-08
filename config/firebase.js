// Shared PLATFORM Firebase project (menudock-platform) — same project the website,
// owner dashboard and admin console use. Config from EXPO_PUBLIC_* env with fallbacks.
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { initializeAuth, getAuth, getReactNativePersistence } from "firebase/auth";
import AsyncStorage from "@react-native-async-storage/async-storage";

const env = process.env;

const firebaseConfig = {
  apiKey: env.EXPO_PUBLIC_FIREBASE_API_KEY || "AIzaSyAm1bPTxm9csx2HYISUm35xlwUahGKxg8Q",
  authDomain: env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN || "menudock-platform.firebaseapp.com",
  projectId: env.EXPO_PUBLIC_FIREBASE_PROJECT_ID || "menudock-platform",
  storageBucket: env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET || "menudock-platform.firebasestorage.app",
  messagingSenderId: env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "824146300662",
  appId: env.EXPO_PUBLIC_FIREBASE_APP_ID || "1:824146300662:web:9b55170f16fd98bb62e6d7",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// React Native needs AsyncStorage-backed auth persistence. Plain getAuth() pulls in
// the web auth path, which references `document` and crashes Hermes at startup. Wrap
// in try/catch so Fast Refresh (which re-runs this module) doesn't re-initialize auth.
let auth;
try {
  auth = initializeAuth(app, { persistence: getReactNativePersistence(AsyncStorage) });
} catch (e) {
  auth = getAuth(app);
}

export { app, db, auth };
