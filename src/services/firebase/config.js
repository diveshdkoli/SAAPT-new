import { initializeApp, getApps, getApp } from 'firebase/app';
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

// Initialize Firebase only if not already initialized
const app = getApps().length === 0
  ? initializeApp(firebaseConfig)
  : getApp();

// Initialize Auth with AsyncStorage persistence (IMPORTANT for React Native)
export const auth = getApps().length === 0
  ? initializeAuth(app, {
      persistence: getReactNativePersistence(AsyncStorage),
    })
  : getAuth(app);

// Initialize Firestore
export const db = getFirestore(app);

export default app;