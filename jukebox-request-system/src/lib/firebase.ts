import { initializeApp } from 'firebase/app';
import { getFirestore, doc, getDocFromServer } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);

// Initialize Firestore with the database ID specified in firebase-applet-config.json
export const db = getFirestore(
  app,
  firebaseConfig.firestoreDatabaseId || '(default)'
);

export const auth = getAuth(app);

// Test connection on boot
async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error) {
      if (error.message.includes('offline') || error.message.includes('unavailable')) {
        console.warn('Firestore initial connection check: client operating or connecting.', error.message);
      } else {
        console.warn('Firestore test connection notice:', error.message);
      }
    }
  }
}

testConnection();
