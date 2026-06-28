import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { firebaseAuth, firestore } from '../config/firebase';

interface AuthState {
  user: User | null;
  familyId: string | null;
  role: 'admin' | 'member' | null;
  canUpload: boolean;
  loading: boolean;
}

interface AuthContextValue extends AuthState {
  setFamilyId: (id: string) => void;
  refreshAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

async function loadUserFamily(uid: string): Promise<{ familyId: string | null; role: 'admin' | 'member' | null; canUpload: boolean }> {
  const userDoc = await getDoc(doc(firestore, 'users', uid));
  const familyIds: string[] = userDoc.data()?.familyIds ?? [];
  if (familyIds.length === 0) return { familyId: null, role: null, canUpload: false };

  const familyId = familyIds[0];
  const memberDoc = await getDoc(doc(firestore, 'families', familyId, 'members', uid));
  const role = (memberDoc.data()?.role ?? null) as 'admin' | 'member' | null;
  const canUpload = (memberDoc.data()?.canUpload ?? false) as boolean;

  const status = memberDoc.data()?.status;
  if (status !== 'active') return { familyId: null, role: null, canUpload: false };

  return { familyId, role, canUpload };
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    familyId: null,
    role: null,
    canUpload: false,
    loading: true,
  });

  async function refreshAuth() {
    const user = firebaseAuth.currentUser;
    if (!user) return;
    const { familyId, role, canUpload } = await loadUserFamily(user.uid);
    setState((prev) => ({ ...prev, familyId, role, canUpload }));
  }

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(firebaseAuth, async (user) => {
      if (user) {
        const { familyId, role, canUpload } = await loadUserFamily(user.uid);
        setState({ user, familyId, role, canUpload, loading: false });
      } else {
        setState({ user: null, familyId: null, role: null, canUpload: false, loading: false });
      }
    });
    return unsubscribe;
  }, []);

  const setFamilyId = (id: string) =>
    setState((prev) => ({ ...prev, familyId: id }));

  return (
    <AuthContext.Provider value={{ ...state, setFamilyId, refreshAuth }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
