import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { firebaseAuth, firestore } from '../config/firebase';

interface AuthState {
  user: User | null;
  familyId: string | null;
  role: 'admin' | 'member' | null;
  canUpload: boolean;
  memberName: string | null;
  loading: boolean;
}

interface AuthContextValue extends AuthState {
  setFamilyId: (id: string) => void;
  refreshAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

async function loadUserFamily(uid: string): Promise<{
  familyId: string | null;
  role: 'admin' | 'member' | null;
  canUpload: boolean;
  memberName: string | null;
}> {
  const userDoc = await getDoc(doc(firestore, 'users', uid));
  const familyIds: string[] = userDoc.data()?.familyIds ?? [];
  if (familyIds.length === 0) return { familyId: null, role: null, canUpload: false, memberName: null };

  const familyId = familyIds[0];
  const memberDoc = await getDoc(doc(firestore, 'families', familyId, 'members', uid));
  const role = (memberDoc.data()?.role ?? null) as 'admin' | 'member' | null;
  const canUpload = (memberDoc.data()?.canUpload ?? false) as boolean;
  const memberName = (memberDoc.data()?.name ?? null) as string | null;

  const status = memberDoc.data()?.status;
  if (status !== 'active') return { familyId: null, role: null, canUpload: false, memberName: null };

  return { familyId, role, canUpload, memberName };
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    familyId: null,
    role: null,
    canUpload: false,
    memberName: null,
    loading: true,
  });

  async function refreshAuth() {
    const user = firebaseAuth.currentUser;
    if (!user) return;
    const { familyId, role, canUpload, memberName } = await loadUserFamily(user.uid);
    setState((prev) => ({ ...prev, familyId, role, canUpload, memberName }));
  }

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(firebaseAuth, async (user) => {
      if (user) {
        const { familyId, role, canUpload, memberName } = await loadUserFamily(user.uid);
        setState({ user, familyId, role, canUpload, memberName, loading: false });
      } else {
        setState({ user: null, familyId: null, role: null, canUpload: false, memberName: null, loading: false });
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
