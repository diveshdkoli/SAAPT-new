import { initializeApp, getApps } from 'firebase/app';
import { initializeAuth, getReactNativePersistence, getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';

const firebaseConfig = {
  apiKey: "AIzaSyAmvBa6G9kt6Vrjx0_tf_QJoKAwMPrMSLA",
  authDomain: "saapt-new.firebaseapp.com",
  projectId: "saapt-new",
  storageBucket: "saapt-new.firebasestorage.app",
  messagingSenderId: "1084667160499",
  appId: "1:1084667160499:web:9f45f6cf28de68c4090dc6"
};

// ── Primary Firebase app ──────────────────────────────────────────────────────
// IMPORTANT: Always look for the '[DEFAULT]' app by name.
// getApps().length === 0 is WRONG — secondary apps (SecondaryApp, SecondaryAppClasses)
// can be initialized first, making length > 0 even when the primary app is missing.
// This caused auth to initialize WITHOUT AsyncStorage persistence, losing session on restart.
const primaryApp = getApps().find(a => a.name === '[DEFAULT]')
  ?? initializeApp(firebaseConfig);

// ── Auth with AsyncStorage persistence ───────────────────────────────────────
// initializeAuth throws if called twice on the same app, so check first.
export const auth = (() => {
  try {
    return initializeAuth(primaryApp, {
      persistence: getReactNativePersistence(AsyncStorage),
    });
  } catch {
    // Already initialized — return the existing instance
    return getAuth(primaryApp);
  }
})();

// ── Firestore ─────────────────────────────────────────────────────────────────
export const db = getFirestore(primaryApp);

export default primaryApp;