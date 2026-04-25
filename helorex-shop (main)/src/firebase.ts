import { initializeApp } from 'firebase/app';
import { 
  getAuth,
  useDeviceLanguage,
  browserLocalPersistence,
  setPersistence
} from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getAnalytics, isSupported } from 'firebase/analytics';

import firebaseConfig from '../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);

// Standard Auth initialization
export const auth = getAuth(app);

// Set persistence explicitly to local (default)
setPersistence(auth, browserLocalPersistence).catch(err => {
  console.error("Failed to set auth persistence:", err);
});

useDeviceLanguage(auth);

// Use the specified database ID or fallback to (default)
const dbId = firebaseConfig.firestoreDatabaseId;
export const db = (dbId && dbId !== '(default)') ? getFirestore(app, dbId) : getFirestore(app);

// Optional Analytics
export const analytics = isSupported().then(yes => yes ? getAnalytics(app) : null);
