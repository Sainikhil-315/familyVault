import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { firebaseAuth, firestore } from '../config/firebase';

interface AuthState {
  user: User | null;
  familyId: string | null;
  loading: boolean;
}

interface AuthContextValue extends AuthState {
  setFamilyId: (id: string) => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    familyId: null,
    loading: true,
  });

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(firebaseAuth, async (user) => {
      if (user) {
        // Check if this user has a family
        const userDoc = await getDoc(doc(firestore, 'users', user.uid));
        const familyIds: string[] = userDoc.data()?.familyIds ?? [];
        setState({ user, familyId: familyIds[0] ?? null, loading: false });
      } else {
        setState({ user: null, familyId: null, loading: false });
      }
    });
    return unsubscribe;
  }, []);

  const setFamilyId = (id: string) =>
    setState((prev) => ({ ...prev, familyId: id }));

  return (
    <AuthContext.Provider value={{ ...state, setFamilyId }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
