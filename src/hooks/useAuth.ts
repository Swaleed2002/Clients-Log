import { useState, useEffect } from 'react';
import { auth, db, functions } from '../firebase';
import { 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged, 
  User as FirebaseUser
} from 'firebase/auth';
import { doc, onSnapshot } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { UserProfile } from '../types';

export const DOMAIN_SUFFIX = '@fieldengineer.local';

export function useAuth() {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let unsubscribeProfile: (() => void) | undefined;
    const unsubscribeAuth = onAuthStateChanged(auth, (firebaseUser) => {
      unsubscribeProfile?.();
      unsubscribeProfile = undefined;
      setUser(firebaseUser);
      setProfile(null);
      if (!firebaseUser) {
        setLoading(false);
        return;
      }

      setLoading(true);
      unsubscribeProfile = onSnapshot(doc(db, 'users', firebaseUser.uid), (snapshot) => {
        if (!snapshot.exists() || snapshot.data().status === 'Disabled') {
          setProfile(null);
          setLoading(false);
          void signOut(auth).catch(error => console.error('Failed to sign out revoked user', error));
          return;
        }
        setProfile({ ...snapshot.data(), uid: firebaseUser.uid } as UserProfile);
        setLoading(false);
      }, (error) => {
        console.error('User profile subscription failed', error);
        setProfile(null);
        setLoading(false);
      });
    });

    return () => {
      unsubscribeProfile?.();
      unsubscribeAuth();
    };
  }, []);

  useEffect(() => {
    if (!user) return;

    const verify = httpsCallable(functions, 'verifySession');
    let checking = false;

    const checkSession = async () => {
      if (checking || !auth.currentUser) return;
      checking = true;

      try {
        const idToken = await auth.currentUser.getIdToken(false);
        await verify({ idToken });
      } catch (error: any) {
        const code = String(error?.code || '');
        if (code.includes('unauthenticated') || code.includes('permission-denied')) {
          console.warn('Session revoked - logging out');
          await signOut(auth);
        } else {
          console.warn('Session verification unavailable; preserving offline session', error);
        }
      } finally {
        checking = false;
      }
    };

    void checkSession();

    const timer = window.setInterval(checkSession, 15000);
    window.addEventListener('focus', checkSession);

    return () => {
      window.clearInterval(timer);
      window.removeEventListener('focus', checkSession);
    };
  }, [user?.uid]);

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
