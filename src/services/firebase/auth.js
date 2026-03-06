import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db } from './config';

/* ===========================
   LOGIN — email + password
=========================== */
export const loginUser = async (email, password) => {
  try {
    const credential = await signInWithEmailAndPassword(
      auth,
      email.toLowerCase().trim(),
      password
    );

    const userRef = doc(db, 'users', credential.user.uid);
    const userDoc = await getDoc(userRef);

    if (!userDoc.exists()) throw new Error('User profile not found');

    return { uid: credential.user.uid, ...userDoc.data() };
  } catch (error) {
    throw new Error(getFriendlyError(error.code));
  }
};

/* ===========================
   CREATE USER — admin creates teacher/student
=========================== */
export const createUser = async (email, password, profileData) => {
  try {
    const cleanedEmail = email.toLowerCase().trim();

    const credential = await createUserWithEmailAndPassword(
      auth,
      cleanedEmail,
      password
    );

    await setDoc(doc(db, 'users', credential.user.uid), {
      uid: credential.user.uid,
      email: cleanedEmail,     // ✅ store real email
      ...profileData,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

    return credential.user.uid;
  } catch (error) {
    throw new Error(getFriendlyError(error.code));
  }
};

/* ===========================
   LOGOUT
=========================== */
export const logoutUser = async () => {
  await signOut(auth);
};

/* ===========================
   AUTH LISTENER
=========================== */
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

/* ===========================
   FRIENDLY ERRORS
=========================== */
const getFriendlyError = (code) => {
  switch (code) {
    case 'auth/user-not-found':         return 'Email not found';
    case 'auth/wrong-password':         return 'Incorrect password';
    case 'auth/too-many-requests':      return 'Too many attempts. Try again later';
    case 'auth/network-request-failed': return 'No internet connection';
    case 'auth/email-already-in-use':   return 'Email already registered';
    case 'auth/invalid-email':          return 'Invalid email format';
    default:                            return 'Something went wrong. Try again';
  }
};