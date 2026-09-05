import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import { getFirestore, doc, setDoc, getDoc } from 'firebase/firestore';
import fs from 'fs';
import path from 'path';

const configPath = path.resolve('firebase-applet-config.json');
const firebaseConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

async function run() {
  try {
    const cred = await signInWithEmailAndPassword(auth, 'ADMIN@fieldengineer.local', 'Admin001');
    const uid = cred.user.uid;
    console.log("Logged in with UID:", uid);
    
    // Check if profile exists
    const snap = await getDoc(doc(db, 'users', uid));
    if (snap.exists()) {
      console.log("Profile exists:", snap.data());
    } else {
      console.log("Profile does not exist, creating...");
      await setDoc(doc(db, 'users', uid), {
        userId: 'ADMIN',
        fullName: 'Administrator',
        role: 'ADMIN',
        status: 'Active'
      });
      console.log("Profile created.");
    }
  } catch (e: any) {
    console.error("Login failed:", e.code, e.message);
  }
}
run();
