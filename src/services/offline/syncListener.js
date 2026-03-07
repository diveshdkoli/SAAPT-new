// src/services/offline/syncListener.js
//
// ─── WHAT THIS FILE DOES ───────────────────────────────────────────────────
// Watches for internet connectivity changes.
// When internet comes BACK → automatically drains the sync queue.
//
// ─── HOW TO USE ────────────────────────────────────────────────────────────
// Call startSyncListener() once when the teacher logs in.
// Call stopSyncListener() when they log out.
//
// In TeacherNavigator.js or RootNavigator.js:
//
//   import { startSyncListener, stopSyncListener } from '../services/offline/syncListener';
//
//   // When teacher logs in:
//   useEffect(() => {
//     startSyncListener();
//     return () => stopSyncListener();
//   }, []);
// ───────────────────────────────────────────────────────────────────────────

import NetInfo from '@react-native-community/netinfo';
import { syncPendingToFirestore } from './attendanceOffline';

let unsubscribe = null;
let wasOffline   = false; // track previous state to detect reconnect

export const startSyncListener = () => {
  if (unsubscribe) return; // already running

  console.log('🔌 Starting network sync listener...');

  unsubscribe = NetInfo.addEventListener(async (state) => {
    const isOnline = state.isConnected && state.isInternetReachable;

    if (isOnline && wasOffline) {
      // Just came back online after being offline
      console.log('🌐 Internet restored — syncing pending attendance...');
      try {
        const result = await syncPendingToFirestore();
        if (result.synced > 0) {
          console.log(`✅ Auto-synced ${result.synced} sessions to Firestore`);
        }
      } catch (err) {
        console.error('Auto-sync failed:', err);
      }
    }

    wasOffline = !isOnline;
  });
};

export const stopSyncListener = () => {
  if (unsubscribe) {
    unsubscribe();
    unsubscribe = null;
    console.log('🔌 Sync listener stopped');
  }
};

// ─── One-time sync check on app open ─────────────────────────────────────────
// WHY: If teacher had unsync'd sessions from yesterday and opens app today,
//      we should sync immediately if online.
export const syncOnAppOpen = async () => {
  const state = await NetInfo.fetch();
  if (state.isConnected && state.isInternetReachable) {
    console.log('📱 App opened with internet — checking sync queue...');
    await syncPendingToFirestore();
  }
};