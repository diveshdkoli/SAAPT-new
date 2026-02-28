import { initializeApp, getApps, getApp } from 'firebase/app';
import { initializeAuth, getReactNativePersistence, getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';

const firebaseConfig = {
  apiKey:            "AIzaSyB_VbyXqeGnxQ_S6_cn7L8u1sPG_XiCSbE",
  authDomain:        "saapt-863fc.firebaseapp.com",
  projectId:         "saapt-863fc",
  storageBucket:     "saapt-863fc.firebasestorage.app",
  messagingSenderId: "758554569710",
  appId:             "1:758554569710:web:b3a409d25d568f9af83cff"
};

// Only initialize if not already initialized
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

export const auth = getApps().length === 0
  ? initializeAuth(app, { persistence: getReactNativePersistence(AsyncStorage) })
  : getAuth(app);

export const db = getFirestore(app);

export default app;