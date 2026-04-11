import { createContext, useContext, useState, ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';

type User = {
  email: string;
  isAdmin: boolean;
};

type AuthContextValue = {
  user: User | null;
  login: (email: string, password: string) => void;
  register: (email: string, password: string) => void;
  logout: () => void;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);

  const buildUser = (email: string): User => ({
    email,
    isAdmin: email.toLowerCase() === 'admin@test.com'
  });

  const login = (email: string, password: string) => {
    setUser(buildUser(email));
    navigate('/app', { replace: true });
  };

  const register = (email: string, password: string) => {
    setUser(buildUser(email));
    navigate('/app', { replace: true });
  };

  const logout = () => {
    setUser(null);
    navigate('/login', { replace: true });
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
