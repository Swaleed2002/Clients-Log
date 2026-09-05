import { initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

async function seedAdmin() {
  try {
    const app = initializeApp();
    const auth = getAuth(app);
    const db = getFirestore(app);

    const userId = 'ADMIN';
    const password = 'Admin001';
    const email = 'ADMIN@engineerlog.local';

    console.log('Creating Admin user in Firebase Auth...');
    try {
      await auth.createUser({
        uid: userId,
        email: email,
        password: password,
        displayName: 'Administrator',
      });
      console.log('Admin Auth user created.');
    } catch (e: any) {
      if (e.code === 'auth/email-already-exists' || e.code === 'auth/uid-already-exists') {
        console.log('Admin Auth user already exists, updating password...');
        await auth.updateUser(userId, { password: password });
      } else {
        throw e;
      }
    }

    console.log('Creating Admin profile in Firestore...');
    await db.collection('users').doc(userId).set({
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
