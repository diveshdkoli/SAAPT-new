// src/services/offline/attendanceOffline.js
//
// ─── WHAT THIS FILE DOES ───────────────────────────────────────────────────
// Provides offline attendance marking for teachers.
//
// HOW IT WORKS:
//   1. Teacher marks attendance → ALWAYS save to SQLite first (works offline)
//   2. If internet is available RIGHT NOW → also push to Firestore immediately
//   3. If offline → add to sync_queue table in SQLite
//   4. When internet comes back → syncPendingToFirestore() drains the queue
//
// WHY SQLite FIRST, NOT FIRESTORE FIRST:
//   If we tried Firestore first and failed, we'd lose data.
//   SQLite is local → always succeeds → data is safe regardless of internet.
//
// TABLES CREATED:
//   attendance_sessions  — mirrors Firestore attendance collection
//   sync_queue           — pending sessions waiting to be uploaded
//
// ─── HOW TO USE IN AttendanceScreen ───────────────────────────────────────
//   import { initOfflineDB, saveAttendanceOffline, syncPendingToFirestore } from './attendanceOffline';
//
//   // On app start (in AttendanceScreen useEffect):
//   await initOfflineDB();
//
//   // When teacher hits "Submit":
//   await saveAttendanceOffline(sessionData); // saves + syncs if online
//
//   // Call this when NetInfo says internet is back:
//   await syncPendingToFirestore();
// ───────────────────────────────────────────────────────────────────────────

import * as SQLite from 'expo-sqlite';
import NetInfo from '@react-native-community/netinfo';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase/config';

// ─── Open (or create) the local SQLite database ───────────────────────────────
// WHY: openDatabaseAsync is the modern Expo SQLite API (expo-sqlite v13+)
let database = null;

const getDB = async () => {
  if (!database) {
    database = await SQLite.openDatabaseAsync('saapt_offline.db');
  }
  return database;
};

// ─── Create tables if they don't exist ───────────────────────────────────────
// WHY: We need two tables:
//   attendance_sessions — full record of what teacher submitted
//   sync_queue          — IDs of sessions that haven't been uploaded yet
export const initOfflineDB = async () => {
  const db_local = await getDB();
  await db_local.execAsync(`
    PRAGMA journal_mode = WAL;

    CREATE TABLE IF NOT EXISTS attendance_sessions (
      id           INTEGER PRIMARY KEY AUTOINCREMENT,
      local_id     TEXT UNIQUE NOT NULL,
      class_id     TEXT NOT NULL,
      class_name   TEXT NOT NULL,
      subject_id   TEXT NOT NULL,
      subject_name TEXT NOT NULL,
      teacher_id   TEXT NOT NULL,
      date         TEXT NOT NULL,
      records      TEXT NOT NULL,
      saved_at     TEXT NOT NULL,
      synced       INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS sync_queue (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      local_id   TEXT UNIQUE NOT NULL,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS cached_assignments (
      id           TEXT PRIMARY KEY,
      class_id     TEXT NOT NULL,
      class_name   TEXT NOT NULL,
      subject_id   TEXT NOT NULL,
      subject_name TEXT NOT NULL,
      teacher_id   TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS cached_students (
      uid      TEXT NOT NULL,
      class_id TEXT NOT NULL,
      name     TEXT NOT NULL,
      PRIMARY KEY (uid, class_id)
    );

    CREATE TABLE IF NOT EXISTS cache_meta (
      key   TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );
  `);
  console.log('✅ Offline DB ready (saapt_offline.db)');
};

// ─── Generate a local unique ID ───────────────────────────────────────────────
const generateLocalId = () =>
  `local_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

// ─── Save attendance locally AND sync if online ───────────────────────────────
// sessionData shape:
// {
//   classId, className, subjectId, subjectName, teacherId,
//   date: "YYYY-MM-DD",
//   records: [{ studentId, name, status }]
// }
export const saveAttendanceOffline = async (sessionData) => {
  const db_local = await getDB();
  const localId  = generateLocalId();
  const savedAt  = new Date().toISOString();

  // ── Step 1: Save to SQLite ────────────────────────────────────────────────
  // WHY: This ALWAYS works, online or offline. Data is safe.
  await db_local.runAsync(
    `INSERT OR REPLACE INTO attendance_sessions
      (local_id, class_id, class_name, subject_id, subject_name, teacher_id, date, records, saved_at, synced)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0)`,
    [
      localId,
      sessionData.classId,
      sessionData.className,
      sessionData.subjectId,
      sessionData.subjectName,
      sessionData.teacherId,
      sessionData.date,
      JSON.stringify(sessionData.records),
      savedAt,
    ]
  );

  // ── Step 2: Add to sync queue ─────────────────────────────────────────────
  await db_local.runAsync(
    `INSERT OR IGNORE INTO sync_queue (local_id, created_at) VALUES (?, ?)`,
    [localId, savedAt]
  );

  console.log(`💾 Saved locally: ${localId}`);

  // ── Step 3: Try to sync immediately if online ─────────────────────────────
  // WHY: Best case — if internet is available, upload right now.
  //      If offline, the sync_queue entry will be uploaded later.
  const netState = await NetInfo.fetch();
  if (netState.isConnected && netState.isInternetReachable) {
    await syncPendingToFirestore();
  } else {
    console.log('📴 Offline — attendance queued for sync when internet returns');
  }

  return localId;
};

// ─── Sync all pending sessions to Firestore ───────────────────────────────────
// Call this:
//   (a) Right after saveAttendanceOffline if online
//   (b) When NetInfo fires isConnected = true (internet just came back)
export const syncPendingToFirestore = async () => {
  const db_local = await getDB();

  // Get all sessions in queue
  const pending = await db_local.getAllAsync(`
    SELECT s.*
    FROM attendance_sessions s
    INNER JOIN sync_queue q ON s.local_id = q.local_id
    WHERE s.synced = 0
    ORDER BY s.saved_at ASC
  `);

  if (pending.length === 0) {
    console.log('✅ No pending sessions to sync');
    return { synced: 0, failed: 0 };
  }

  console.log(`🔄 Syncing ${pending.length} pending session(s) to Firestore...`);

  let synced = 0;
  let failed = 0;

  for (const session of pending) {
    try {
      // Parse records back from JSON string
      const records = JSON.parse(session.records);

      // Push to Firestore attendance collection
      // WHY: This mirrors exactly what AttendanceScreen does when online
      await addDoc(collection(db, 'attendance'), {
        classId:     session.class_id,
        className:   session.class_name,
        subjectId:   session.subject_id,
        subjectName: session.subject_name,
        teacherId:   session.teacher_id,
        date:        session.date,
        records:     records,
        savedAt:     serverTimestamp(),
        syncedFrom:  'offline', // flag so we know it came from offline queue
      });

      // Mark as synced in SQLite
      await db_local.runAsync(
        `UPDATE attendance_sessions SET synced = 1 WHERE local_id = ?`,
        [session.local_id]
      );

      // Remove from sync queue
      await db_local.runAsync(
        `DELETE FROM sync_queue WHERE local_id = ?`,
        [session.local_id]
      );

      synced++;
      console.log(`✅ Synced: ${session.local_id}`);

    } catch (err) {
      // Don't crash — just skip this one and try next time
      failed++;
      console.error(`❌ Failed to sync ${session.local_id}:`, err.message);
    }
  }

  console.log(`🔄 Sync complete: ${synced} synced, ${failed} failed`);
  return { synced, failed };
};

// ─── Get count of pending (unsynced) sessions ─────────────────────────────────
// WHY: Show a badge on AttendanceScreen like "3 sessions pending upload"
export const getPendingCount = async () => {
  const db_local = await getDB();
  const result = await db_local.getFirstAsync(
    `SELECT COUNT(*) as count FROM sync_queue`
  );
  return result?.count ?? 0;
};

// ─── Get all locally saved sessions for a specific teacher+date ───────────────
// WHY: Teacher can see what they marked today even if offline
export const getLocalSessions = async (teacherId, date) => {
  const db_local = await getDB();
  const rows = await db_local.getAllAsync(
    `SELECT * FROM attendance_sessions
     WHERE teacher_id = ? AND date = ?
     ORDER BY saved_at DESC`,
    [teacherId, date]
  );
  return rows.map(r => ({ ...r, records: JSON.parse(r.records) }));
};

export const syncTeacherStructureToCache = async (uid) => {
  // Import here to avoid circular dependency
  const { collection, getDocs, query, where, getDoc, doc } = await import('firebase/firestore');
  const { db } = await import('../firebase/config');

  const db_local = await getDB();

  // Step 1: fetch assignments from class_subjects
  const csSnap = await getDocs(
    query(collection(db, 'class_subjects'), where('teacherId', '==', uid))
  );

  const assignments = csSnap.docs.map(d => ({
    id:          d.id,
    classId:     d.data().classId     ?? '',
    className:   d.data().className   ?? '',
    subjectId:   d.data().subjectId   ?? '',
    subjectName: d.data().subjectName ?? '',
  }));

  // Step 2: fetch students for each unique class
  const uniqueClassIds = [...new Set(assignments.map(a => a.classId))];
  const studentsPerClass = {};

  for (const classId of uniqueClassIds) {
    const classSnap = await getDoc(doc(db, 'classes', classId));
    const studentUids = classSnap.exists() ? (classSnap.data().students ?? []) : [];

    const studentList = await Promise.all(
      studentUids.map(async (suid) => {
        const uSnap = await getDoc(doc(db, 'users', suid));
        const name  = uSnap.exists()
          ? (uSnap.data().full_name ?? uSnap.data().name ?? suid)
          : suid;
        return { uid: suid, name };
      })
    );

    studentsPerClass[classId] = studentList.sort((a, b) =>
      a.name.localeCompare(b.name)
    );
  }

  // Step 3: OVERWRITE cache — delete old data for this teacher first
  // WHY: if admin removed a subject, we don't want stale data showing
  await db_local.runAsync(
    `DELETE FROM cached_assignments WHERE teacher_id = ?`, [uid]
  );
  // Delete students belonging to this teacher's classes
  for (const classId of uniqueClassIds) {
    await db_local.runAsync(
      `DELETE FROM cached_students WHERE class_id = ?`, [classId]
    );
  }

  // Step 4: insert fresh data
  for (const a of assignments) {
    await db_local.runAsync(
      `INSERT OR REPLACE INTO cached_assignments
        (id, class_id, class_name, subject_id, subject_name, teacher_id)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [a.id, a.classId, a.className, a.subjectId, a.subjectName, uid]
    );
  }

  for (const classId of Object.keys(studentsPerClass)) {
    for (const student of studentsPerClass[classId]) {
      await db_local.runAsync(
        `INSERT OR REPLACE INTO cached_students (uid, class_id, name)
         VALUES (?, ?, ?)`,
        [student.uid, classId, student.name]
      );
    }
  }

  // Step 5: save sync timestamp
  await db_local.runAsync(
    `INSERT OR REPLACE INTO cache_meta (key, value) VALUES ('last_sync', ?)`,
    [new Date().toISOString()]
  );

  console.log(`✅ Teacher structure cached: ${assignments.length} assignments`);
  return assignments;
};

// Read assignments from SQLite (works offline)
export const getCachedAssignments = async (uid) => {
  const db_local = await getDB();
  const rows = await db_local.getAllAsync(
    `SELECT * FROM cached_assignments WHERE teacher_id = ?`, [uid]
  );
  return rows.map(r => ({
    id:          r.id,
    classId:     r.class_id,
    className:   r.class_name,
    subjectId:   r.subject_id,
    subjectName: r.subject_name,
  }));
};

// Read students for a class from SQLite (works offline)
export const getCachedStudents = async (classId) => {
  const db_local = await getDB();
  const rows = await db_local.getAllAsync(
    `SELECT * FROM cached_students WHERE class_id = ? ORDER BY name ASC`,
    [classId]
  );
  return rows.map(r => ({ uid: r.uid, name: r.name }));
};

// Check if any cached data exists for this teacher
export const hasCachedStructure = async (uid) => {
  const db_local = await getDB();
  const row = await db_local.getFirstAsync(
    `SELECT COUNT(*) as count FROM cached_assignments WHERE teacher_id = ?`,
    [uid]
  );
  return (row?.count ?? 0) > 0;
};

// Get last sync time for display
export const getCacheTimestamp = async () => {
  const db_local = await getDB();
  try {
    const row = await db_local.getFirstAsync(
      `SELECT value FROM cache_meta WHERE key = 'last_sync'`
    );
    return row?.value ?? null;
  } catch {
    return null;
  }
};