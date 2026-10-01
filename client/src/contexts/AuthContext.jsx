import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import authService from '@/services/authService';
import { storage } from '@/utils/storage';
import { ROLES } from '@/utils/constants';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(storage.getUser());
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    // Check if user is stored (auto-login)
    const storedUser = storage.getUser();
    if (storedUser && storage.getAccessToken()) {
      setUser(storedUser);
    }
    // Dev bypass: ?dev_login=admin|dosen|mahasiswa
    const params = new URLSearchParams(window.location.search);
    const devRole = params.get('dev_login');
    if (devRole && ['admin', 'dosen', 'mahasiswa'].includes(devRole)) {
      const dummyUser = {
        id: 1,
        name: devRole === 'admin' ? 'Admin Ko+Lab' : devRole === 'dosen' ? 'Dr. Budi Santoso' : 'Rina Wijaya',
        email: `${devRole}@kolab.id`,
        role: devRole,
        startup_id: 1,
        startup_name: 'Teknologi Informasi',
        avatar: null,
        created_at: '2026-01-15',
      };
      storage.setTokens('dev-token-access', 'dev-token-refresh');
      storage.setUser(dummyUser);
      setUser(dummyUser);
      // Clean URL
      window.history.replaceState({}, '', window.location.pathname);
    }
    setLoading(false);
  }, []);

  const login = useCallback(async (email, password) => {
    const res = await authService.login(email, password);
    const { user: userData, access_token, refresh_token } = res.data;

    storage.setTokens(access_token, refresh_token);
    storage.setUser(userData);
    setUser(userData);

    // Redirect based on role
    switch (userData.role) {
      case ROLES.ADMIN:
        navigate('/admin');
        break;
      case ROLES.DOSEN:
        navigate('/dosen');
        break;
      case ROLES.MAHASISWA:
        navigate('/mahasiswa');
        break;
      default:
        navigate('/');
    }

    return userData;
  }, [navigate]);

  const register = useCallback(async (data) => {
    const res = await authService.register(data);
    const { user: userData, access_token, refresh_token } = res.data;

    storage.setTokens(access_token, refresh_token);
    storage.setUser(userData);
    setUser(userData);

    switch (userData.role) {
      case ROLES.DOSEN:
        navigate('/dosen');
        break;
      default:
        navigate('/mahasiswa');
    }

    return userData;
  }, [navigate]);

  const logout = useCallback(async () => {
    try {
      const refreshToken = storage.getRefreshToken();
      if (refreshToken) {
        await authService.logout(refreshToken);
      }
    } catch {
      // Ignore logout errors
    } finally {
      storage.clear();
      setUser(null);
      navigate('/login');
    }
  }, [navigate]);

  const updateUser = useCallback((userData) => {
    storage.setUser(userData);
    setUser(userData);
  }, []);

  const value = {
    user,
    loading,
    isAuthenticated: !!user,
    isAdmin: user?.role === ROLES.ADMIN,
    isDosen: user?.role === ROLES.DOSEN,
    isMahasiswa: user?.role === ROLES.MAHASISWA,
    login,
    register,
    logout,
    updateUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuthContext() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuthContext must be used within an AuthProvider');
  }
  return context;
}
