import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, UserRole } from '../types';
import { storage } from '../services/storage';
import { auth, googleProvider, signInWithPopup, fbSignOut, onAuthStateChanged, FirebaseUser } from '../services/firebase';

interface AuthContextType {
  user: User | null;
  role: UserRole | null;
  firebaseUser: FirebaseUser | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => { success: boolean; error?: string };
  register: (data: Omit<User, 'id' | 'joinedAt'>) => { success: boolean; error?: string };
  signInWithGoogle: (preferredRole?: UserRole) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  switchDemoUser: (userId: string) => void;
  updateProfile: (updatedData: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);

  useEffect(() => {
    // 1. Initial check from storage
    const current = storage.getCurrentUser();
    setUser(current);

    // 2. Firebase Auth state listener
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      setFirebaseUser(fbUser);
      if (fbUser) {
        // Try to match or create user profile
        const existingUsers = storage.getUsers();
        let matched = existingUsers.find(
          u => u.id === fbUser.uid || (fbUser.email && u.email.toLowerCase() === fbUser.email.toLowerCase())
        );

        if (!matched) {
          matched = {
            id: fbUser.uid,
            name: fbUser.displayName || 'Usuário Psiconnect',
            email: fbUser.email || '',
            passwordHash: '',
            role: 'patient',
            avatar: fbUser.photoURL || undefined,
            joinedAt: new Date().toISOString(),
          };
          await storage.saveUserToFirestore(matched);
        } else if (matched.id !== fbUser.uid) {
          matched = { ...matched, id: fbUser.uid, avatar: fbUser.photoURL || matched.avatar };
          await storage.saveUserToFirestore(matched);
        }

        storage.setCurrentUser(matched);
        setUser(matched);
      }
    });

    return () => unsubscribe();
  }, []);

  const signInWithGoogle = async (preferredRole: UserRole = 'patient'): Promise<{ success: boolean; error?: string }> => {
    try {
      const res = await signInWithPopup(auth, googleProvider);
      const fbUser = res.user;

      const existingUsers = storage.getUsers();
      let matched = existingUsers.find(
        u => u.id === fbUser.uid || (fbUser.email && u.email.toLowerCase() === fbUser.email.toLowerCase())
      );

      if (!matched) {
        matched = {
          id: fbUser.uid,
          name: fbUser.displayName || (preferredRole === 'psychologist' ? 'Dr(a). Psicólogo(a)' : 'Paciente'),
          email: fbUser.email || '',
          passwordHash: '',
          role: preferredRole,
          avatar: fbUser.photoURL || undefined,
          joinedAt: new Date().toISOString(),
        };
        await storage.saveUserToFirestore(matched);
      }

      storage.setCurrentUser(matched);
      setUser(matched);
      return { success: true };
    } catch (err: any) {
      console.error('Google Sign In Error:', err);
      return { success: false, error: err?.message || 'Falha ao autenticar com conta Google.' };
    }
  };

  const login = (email: string, password: string): { success: boolean; error?: string } => {
    const found = storage.findUserByEmail(email);
    if (!found) {
      return { success: false, error: 'E-mail não encontrado no sistema.' };
    }
    if (found.passwordHash !== password) {
      return { success: false, error: 'Senha incorreta. Por favor, verifique seus dados.' };
    }

    storage.setCurrentUser(found);
    setUser(found);
    return { success: true };
  };

  const register = (data: Omit<User, 'id' | 'joinedAt'>): { success: boolean; error?: string } => {
    const res = storage.saveUser(data);
    if (res.success && res.user) {
      storage.setCurrentUser(res.user);
      setUser(res.user);
      return { success: true };
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

  const switchDemoUser = (userId: string) => {
    const all = storage.getUsers();
    const target = all.find(u => u.id === userId);
    if (target) {
      storage.setCurrentUser(target);
      setUser(target);
    }
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
        switchDemoUser,
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
