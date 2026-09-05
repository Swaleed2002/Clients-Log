import { useState, useEffect } from 'react';
import { auth, db } from '../firebase';
import { 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged, 
  User as FirebaseUser
} from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { UserProfile } from '../types';

export const DOMAIN_SUFFIX = '@fieldengineer.local';

export function useAuth() {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        try {
          // Fetch user profile from Firestore
          const userId = firebaseUser.email?.replace(DOMAIN_SUFFIX, '') || firebaseUser.uid;
          let userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
          
          if (!userDoc.exists() && userId.toUpperCase() === 'ADMIN') {
            // Auto-heal admin profile if it got out of sync
            const { setDoc } = await import('firebase/firestore');
            await setDoc(doc(db, 'users', firebaseUser.uid), {
              userId: 'ADMIN',
              fullName: 'Administrator',
              role: 'ADMIN',
              status: 'Active'
            });
            userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
          }

          if (userDoc.exists()) {
            setProfile(userDoc.data() as UserProfile);
          } else {
            setProfile(null);
          }
        } catch (error) {
          console.error("Failed to fetch user profile", error);
          setProfile(null);
        }
      } else {
        setProfile(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const login = async (userId: string, password: string) => {
    const email = `${userId.trim().toUpperCase()}${DOMAIN_SUFFIX}`;
    await signInWithEmailAndPassword(auth, email, password);
  };

  const logout = async () => {
    await signOut(auth);
  };

  return {
    user,
    profile,
    loading,
    login,
    logout
  };
}
