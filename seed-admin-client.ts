import { initializeApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { getFirestore, doc, setDoc } from 'firebase/firestore';
import fs from 'fs';
import path from 'path';

// Read config from file
const configPath = path.resolve('firebase-applet-config.json');
const firebaseConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));

async function seedAdmin() {
  try {
    const app = initializeApp(firebaseConfig);
    const auth = getAuth(app);
    // Explicitly pass the databaseId if needed, but it's usually in firebaseConfig
    const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

    const userId = 'ADMIN';
    const password = 'Admin001';
    const email = 'ADMIN@engineerlog.local';

    console.log('Creating Admin user in Firebase Auth...');
    try {
      await createUserWithEmailAndPassword(auth, email, password);
      console.log('Admin Auth user created.');
    } catch (e: any) {
      if (e.code === 'auth/email-already-in-use') {
        console.log('Admin Auth user already exists, signing in...');
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        throw e;
      }
    }

    console.log('Creating Admin profile in Firestore...');
    await setDoc(doc(db, 'users', userId), {
      userId: userId,
      fullName: 'Administrator',
      role: 'ADMIN',
      status: 'Active'
    });
    console.log('Admin Firestore profile created successfully.');
    
    process.exit(0);
  } catch (error) {
    console.error('Error seeding admin:', error);
    process.exit(1);
  }
}

seedAdmin();
