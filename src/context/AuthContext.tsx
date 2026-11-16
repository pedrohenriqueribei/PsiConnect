import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, UserRole, ProfessionalType } from '../types';
import { storage } from '../services/storage';
import { auth, googleProvider, signInWithPopup, fbSignOut, onAuthStateChanged, FirebaseUser } from '../services/firebase';

interface AuthContextType {
  user: User | null;
  role: UserRole | null;
  firebaseUser: FirebaseUser | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string; user?: User }>;
  register: (data: Omit<User, 'id' | 'joinedAt'>) => Promise<{ success: boolean; error?: string; user?: User }>;
  signInWithGoogle: (preferredRole?: UserRole) => Promise<{ success: boolean; error?: string; user?: User }>;
  logout: () => Promise<void>;
  updateProfile: (updatedData: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => storage.getCurrentUser());
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const pendingGoogleRoleRef = React.useRef<UserRole | null>(null);

  useEffect(() => {
    // 1. Sync initial check from storage
    const current = storage.getCurrentUser();
    if (current) {
      setUser(current);
    }

    // 2. Firebase Auth state listener
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      setFirebaseUser(fbUser);
      if (fbUser) {
        let resolvedUser = await storage.fetchUserByIdFromFirestore(fbUser.uid);
        if (!resolvedUser && fbUser.email) {
          resolvedUser = await storage.fetchUserByEmailFromFirestore(fbUser.email);
        }

        let finalUser: User;
        if (!resolvedUser) {
          const initialRole = pendingGoogleRoleRef.current || 'patient';
          const mappedProfType: ProfessionalType =
            initialRole === 'pastor' || initialRole === 'therapist' || initialRole === 'psychoanalyst'
              ? initialRole
              : 'psychologist';
          finalUser = {
            id: fbUser.uid,
            name: fbUser.displayName || (initialRole === 'patient' ? 'Usuário Psiconnect' : 'Profissional Psiconnect'),
            email: fbUser.email || '',
            passwordHash: '',
            role: initialRole,
            ...(initialRole !== 'patient'
              ? {
                  professionalType: mappedProfType,
                  careCategory: initialRole === 'pastor' ? 'biblical' : 'therapy',
                }
              : {}),
            avatar: fbUser.photoURL || undefined,
            joinedAt: new Date().toISOString(),
          };
          await storage.saveUserToFirestore(finalUser);
        } else if (resolvedUser.id !== fbUser.uid) {
          finalUser = { ...resolvedUser, id: fbUser.uid, avatar: fbUser.photoURL || resolvedUser.avatar };
          await storage.saveUserToFirestore(finalUser);
        } else {
          finalUser = resolvedUser;
        }

        storage.setCurrentUser(finalUser);
        setUser(finalUser);
      }
    });

    // 3. Keep active user synced with real-time Firestore user updates
    const unsubscribeStorage = storage.subscribe(() => {
      const currentStored = storage.getCurrentUser();
      if (!currentStored) return;
      const latest = storage.getUsers().find(u => u.id === currentStored.id);
      if (latest) {
        setUser(prev => {
          if (!prev || prev.id !== latest.id) return prev;
          if (
            prev.isAcceptingNewPatients === latest.isAcceptingNewPatients &&
            prev.professionalProfile?.acceptsNewMatchedPatients === latest.professionalProfile?.acceptsNewMatchedPatients &&
            prev.professionalProfile?.updatedAt === latest.professionalProfile?.updatedAt &&
            prev.name === latest.name
          ) {
            return prev;
          }
          storage.setCurrentUser(latest);
          return latest;
        });
      } else if (storage.isUsersLoaded() && !auth.currentUser) {
        storage.setCurrentUser(null);
        setUser(null);
      }
    });

    return () => {
      unsubscribe();
      unsubscribeStorage();
    };
  }, []);

  const signInWithGoogle = async (preferredRole: UserRole = 'patient'): Promise<{ success: boolean; error?: string; user?: User }> => {
    pendingGoogleRoleRef.current = preferredRole;
    try {
      const res = await signInWithPopup(auth, googleProvider);
      const fbUser = res.user;

      let resolvedUser = await storage.fetchUserByIdFromFirestore(fbUser.uid);
      if (!resolvedUser && fbUser.email) {
        resolvedUser = await storage.fetchUserByEmailFromFirestore(fbUser.email);
      }

      let finalUser: User;
      if (!resolvedUser) {
        const mappedProfType: ProfessionalType =
          preferredRole === 'pastor' || preferredRole === 'therapist' || preferredRole === 'psychoanalyst'
            ? preferredRole
            : 'psychologist';
        finalUser = {
          id: fbUser.uid,
          name: fbUser.displayName || (preferredRole === 'psychologist' ? 'Dr(a). Psicólogo(a)' : 'Paciente'),
          email: fbUser.email || '',
          passwordHash: '',
          role: preferredRole,
          ...(preferredRole !== 'patient'
            ? {
                professionalType: mappedProfType,
                careCategory: preferredRole === 'pastor' ? 'biblical' : 'therapy',
              }
            : {}),
          avatar: fbUser.photoURL || undefined,
          joinedAt: new Date().toISOString(),
        };
        await storage.saveUserToFirestore(finalUser);
      } else {
        finalUser = resolvedUser;
      }

      storage.setCurrentUser(finalUser);
      setUser(finalUser);
      return { success: true, user: finalUser };
    } catch (err: any) {
      console.error('Google Sign In Error:', err);
      return { success: false, error: err?.message || 'Falha ao autenticar com conta Google.' };
    } finally {
      pendingGoogleRoleRef.current = null;
    }
  };

  const login = async (email: string, password: string): Promise<{ success: boolean; error?: string; user?: User }> => {
    const found = await storage.fetchUserByEmailFromFirestore(email);
    if (!found) {
      return { success: false, error: 'E-mail não encontrado no sistema.' };
    }
    if (found.passwordHash !== password) {
      return { success: false, error: 'Senha incorreta. Por favor, verifique seus dados.' };
    }

    storage.setCurrentUser(found);
    setUser(found);
    return { success: true, user: found };
  };

  const register = async (data: Omit<User, 'id' | 'joinedAt'>): Promise<{ success: boolean; error?: string; user?: User }> => {
    const res = await storage.saveUserAsync(data);
    if (res.success && res.user) {
      storage.setCurrentUser(res.user);
      setUser(res.user);
      return { success: true, user: res.user };
    }
    return { success: false, error: res.error || 'Erro ao realizar cadastro.' };
  };

  const logout = async () => {
    try {
      await fbSignOut(auth);
    } catch (err) {
      console.warn('Signout warning:', err);
    }
    storage.setCurrentUser(null);
    setUser(null);
    setFirebaseUser(null);
  };

  const updateProfile = (updatedData: Partial<User>) => {
    if (!user) return;
    const updated: User = { ...user, ...updatedData };
    storage.updateUser(updated);
    setUser(updated);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        role: user ? user.role : null,
        firebaseUser,
        isAuthenticated: !!user,
        login,
        register,
        signInWithGoogle,
        logout,
        updateProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth deve ser utilizado dentro de um AuthProvider');
  }
  return context;
};
