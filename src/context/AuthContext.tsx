import { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { authAPI, setToken, clearToken, getToken } from '../utils/apiClient';

type User = {
  id: string;
  email: string;
  isAdmin: boolean;
};

type AuthContextValue = {
  user: User | null;
  loading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Check for existing token on mount
  useEffect(() => {
    const token = getToken();
    if (token) {
      // Decode token to restore user (in production, verify with backend)
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        setUser({
          id: payload.user_id,
          email: payload.email,
          isAdmin: payload.is_admin || false
        });
      } catch (e) {
        clearToken();
      }
    }
  }, []);

  const login = async (email: string, password: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await authAPI.login(email, password);
      const { token, user: userData } = response;
      
      // Store token
      setToken(token);
      
      // Store user in state
      setUser({
        id: userData.id,
        email: userData.email,
        isAdmin: userData.is_admin || false
      });
      
      navigate('/app', { replace: true });
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Login failed';
      setError(errorMsg);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const register = async (email: string, password: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await authAPI.signup(email, password);
      const { token, user: userData } = response;
      
      // Store token
      setToken(token);
      
      // Store user in state
      setUser({
        id: userData.id,
        email: userData.email,
        isAdmin: userData.is_admin || false
      });
      
      navigate('/app', { replace: true });
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Registration failed';
      setError(errorMsg);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    clearToken();
    setUser(null);
    setError(null);
    navigate('/login', { replace: true });
  };

  return (
    <AuthContext.Provider value={{ user, loading, error, login, register, logout }}>
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
