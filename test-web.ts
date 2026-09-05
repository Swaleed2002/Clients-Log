import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import fs from 'fs';
import path from 'path';

const configPath = path.resolve('firebase-applet-config.json');
const firebaseConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

async function test() {
  try {
    console.log("Trying login...");
    await signInWithEmailAndPassword(auth, 'ADMIN@engineerlog.local', 'Admin001');
    console.log("Login success");
  } catch (e: any) {
    console.error("Login failed:", e.code);
    if (e.code === 'auth/invalid-credential') {
      try {
        console.log("Trying create...");
        await createUserWithEmailAndPassword(auth, 'ADMIN@engineerlog.local', 'Admin001');
        console.log("Create success");
      } catch(e2: any) {
        console.error("Create failed:", e2.code);
      }
    }
  }
}
test();
