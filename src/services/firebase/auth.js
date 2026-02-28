import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db } from './config';

// We convert username to email internally — user never sees this
// e.g. username "sarah" becomes "sarah@saapt.app" in Firebase Auth
const toEmail = (username) => `${username.toLowerCase().trim()}@saapt.app`;

// LOGIN — takes username + password, returns full user object with role
export const loginUser = async (username, password) => {
  try {
    const email = toEmail(username);
    console.log('Trying email:', email);
    const credential = await signInWithEmailAndPassword(auth, email, password);
    console.log('Auth success, UID:', credential.user.uid);
    const userRef = doc(db, 'users', credential.user.uid);
    console.log('Reading path:', `users/${credential.user.uid}`);
    console.log('DB instance:', db.app.options.projectId);
    const userDoc = await getDoc(userRef);
    console.log('Doc exists:', userDoc.exists());
    console.log('Doc data:', userDoc.data());
    if (!userDoc.exists()) throw new Error('User profile not found');
    return { uid: credential.user.uid, ...userDoc.data() };
  } catch (error) {
    console.log('Firebase error code:', error.code, error.message);
    throw new Error(getFriendlyError(error.code));
  }
};

// CREATE USER — called by admin when creating teacher/student accounts
export const createUser = async (username, password, profileData) => {
  try {
    const email = toEmail(username);
    const credential = await createUserWithEmailAndPassword(auth, email, password);
    // Save full profile to Firestore users collection
    await setDoc(doc(db, 'users', credential.user.uid), {
      uid: credential.user.uid,
      username: username.toLowerCase().trim(),
      ...profileData,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
    return credential.user.uid;
  } catch (error) {
    console.log('Firebase error code:', error.code, error.message);
    throw new Error(getFriendlyError(error.code));
  }
};

// LOGOUT
export const logoutUser = async () => {
  await signOut(auth);
};

// AUTH LISTENER — call this in RootNavigator on app open
// Fires immediately with current user or null
export const onAuthChange = (callback) => {
  return onAuthStateChanged(auth, async (firebaseUser) => {
    if (firebaseUser) {
      const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
      if (userDoc.exists()) {
        callback({ uid: firebaseUser.uid, ...userDoc.data() });
      } else {
        callback(null);
      }
    } else {
      callback(null);
    }
  });
};

// Convert Firebase error codes to readable messages
const getFriendlyError = (code) => {
  switch (code) {
    case 'auth/user-not-found':         return 'Username not found';
    case 'auth/wrong-password':         return 'Incorrect password';
    case 'auth/too-many-requests':      return 'Too many attempts. Try again later';
    case 'auth/network-request-failed': return 'No internet connection';
    case 'auth/email-already-in-use':   return 'Username already taken';
    default:                            return 'Something went wrong. Try again';
  }
};