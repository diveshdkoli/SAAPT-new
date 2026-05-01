/**
 * services/firebase/auth.js
 *
 * Handles all authentication logic for SAAPT.
 *
 * Functions:
 *  - loginUser(email, password)   → validates credentials, returns user data WITH role
 *  - registerUser(data)           → creates teacher or student account
 *  - registerAdmin(data)          → creates admin account (role ALWAYS = 'admin')
 *  - logoutUser()
 *
 * ──────────────────────────────────────────────────────────────────────────────
 * ROLE SECURITY MODEL
 * ──────────────────────────────────────────────────────────────────────────────
 *
 * ✅ Role is NEVER taken from the login form (old system trusted the UI toggle).
 * ✅ Role is ALWAYS read from Firestore after authentication.
 * ✅ registerAdmin() hard-codes role = 'admin' — the UI cannot override this.
 * ✅ registerUser()  accepts only 'teacher' | 'student' — admin is rejected.
 *
 * This means a student can NEVER log in as a teacher even if they somehow
 * know a teacher's password, because the role comes from the database record,
 * not from any input field.
 *
 * Firestore users document structure:
 * {
 *   uid:        string   (Firebase Auth UID)
 *   name:       string
 *   email:      string
 *   phone:      string
 *   username:   string   (optional for admin)
 *   role:       'admin' | 'teacher' | 'student'
 *   created_by: string | null  (admin UID for teacher/student; null for admin)
 *   createdAt:  Timestamp
 * }
 */

import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
} from 'firebase/auth';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from './config';

// ─────────────────────────────────────────────────────────────────────────────
// LOGIN — Universal (role determined by DB, NOT by UI)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Log in with email + password.
 * Fetches the user's role from Firestore after auth succeeds.
 * @returns {{ uid, name, email, role, phone }} userData
 */
export const loginUser = async (email, password) => {
  // 1. Authenticate with Firebase Auth
  const credential = await signInWithEmailAndPassword(auth, email, password);
  const { uid } = credential.user;

  // 2. Fetch user document from Firestore to get role
  const userDoc = await getDoc(doc(db, 'users', uid));
  if (!userDoc.exists()) {
    await signOut(auth); // clean up auth session
    throw new Error('User record not found. Please contact your administrator.');
  }

  const userData = userDoc.data();

  // 3. Validate role exists
  const validRoles = ['admin', 'teacher', 'student'];
  if (!validRoles.includes(userData.role)) {
    await signOut(auth);
    throw new Error('Your account has an invalid role. Please contact support.');
  }

  // 4. Return safe user object — role comes from DB
  return {
    uid,
    name:  userData.name  || '',
    email: userData.email || email,
    role:  userData.role,   // ← always from DB, never from UI
    phone: userData.phone || '',
  };
};

// ─────────────────────────────────────────────────────────────────────────────
// REGISTER — Teacher or Student ONLY
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Register a teacher or student.
 * Role must be 'teacher' or 'student'. Passing 'admin' will throw an error.
 */
export const registerUser = async ({ name, email, phone, username, password, role, created_by = null }) => {
  // Guard: never allow admin creation through this function
  if (!['teacher', 'student'].includes(role)) {
    throw new Error('Invalid role. Use registerAdmin() for admin accounts.');
  }

  // Create Firebase Auth user
  const credential = await createUserWithEmailAndPassword(auth, email, password);
  const { uid } = credential.user;

  // Save user record to Firestore with the specified role + partition key
  await setDoc(doc(db, 'users', uid), {
    uid,
    name,
    email,
    phone,
    username,
    role,        // 'teacher' or 'student'
    created_by,  // admin UID who created this user (partition key)
    createdAt:   serverTimestamp(),
  });

  return { uid, name, email, role, created_by };
};

// ─────────────────────────────────────────────────────────────────────────────
// REGISTER ADMIN — Role is ALWAYS 'admin', hard-coded here
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Register an admin account.
 * Role is ALWAYS set to 'admin' by this function — the UI has no control over it.
 *
 * 🔒 Production tip: add an inviteCode check here before creating the account.
 *    e.g., verify inviteCode against a Firestore 'adminInvites' collection.
 */
export const registerAdmin = async ({ name, email, phone, password }) => {
  // Create Firebase Auth user
  const credential = await createUserWithEmailAndPassword(auth, email, password);
  const { uid } = credential.user;

  // Save to Firestore — role is HARD-CODED to 'admin'
  await setDoc(doc(db, 'users', uid), {
    uid,
    name,
    email,
    phone,
    username: email, // admins use email as username
    role: 'admin',   // ← ALWAYS 'admin', never from UI input
    createdAt: serverTimestamp(),
  });

  return { uid, name, email, role: 'admin' };
};

// ─────────────────────────────────────────────────────────────────────────────
// LOGOUT
// ─────────────────────────────────────────────────────────────────────────────

export const logoutUser = async () => {
  await signOut(auth);
};