import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authApi } from '../api/auth.api';
import { setAccessToken, setRefreshToken } from '../api/axios';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const login = useCallback(async (email, password) => {
    const response = await authApi.login(email, password);
    setAccessToken(response.accessToken);
    setRefreshToken(response.refreshToken);
    setUser(response.user);
    return response;
  }, []);

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } catch (error) {
      // Ignore errors during logout
    }
    setAccessToken(null);
    setRefreshToken(null);
    setUser(null);
  }, []);

  // Try to refresh token on mount
  useEffect(() => {
    const initAuth = async () => {
      try {
        const refreshResponse = await authApi.refresh();
        setAccessToken(refreshResponse.accessToken);
        setRefreshToken(refreshResponse.refreshToken);
        const userResponse = await authApi.getMe();
        setUser(userResponse);
      } catch (error) {
        // Not logged in or refresh token expired
        setAccessToken(null);
        setRefreshToken(null);
      } finally {
        setLoading(false);
      }
    };
    initAuth();
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isAuthenticated: !!user,
        isAdmin: user?.role === 'ADMIN',
        login,
        logout,
      }}
    >
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
