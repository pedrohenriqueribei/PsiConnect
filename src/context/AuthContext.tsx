import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, UserRole } from '../types';
import { storage } from '../services/storage';

interface AuthContextType {
  user: User | null;
  role: UserRole | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => { success: boolean; error?: string };
  register: (data: Omit<User, 'id' | 'joinedAt'>) => { success: boolean; error?: string };
  logout: () => void;
  switchDemoUser: (userId: string) => void;
  updateProfile: (updatedData: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const current = storage.getCurrentUser();
    setUser(current);
  }, []);

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

  const logout = () => {
    storage.setCurrentUser(null);
    setUser(null);
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
        isAuthenticated: !!user,
        login,
        register,
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
