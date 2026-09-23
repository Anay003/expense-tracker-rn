import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, LoginCredentials, RegisterCredentials } from '@/types/auth';
import { authService } from '@/services/authService';
import { tokenStorage } from '@/services/tokenStorage';
import { databaseService } from '@/services/databaseService';
import { logger } from '@/services/logger';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (credentials: RegisterCredentials) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  login: async () => {},
  register: async () => {},
  logout: async () => {},
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Fast offline session recovery on boot (< 30ms)
  useEffect(() => {
    let isMounted = true;

    const bootstrapAuth = async () => {
      try {
        const token = await tokenStorage.getAccessToken();
        const refreshToken = await tokenStorage.getRefreshToken();

        if (token || refreshToken) {
          // Recover cached user profile from local SQLite
          const cached = await databaseService.getCachedUser();
          if (isMounted) {
            if (cached) {
              setUser(cached);
              setIsAuthenticated(true);
            } else {
              // Valid tokens exist, set generic fallback until refreshed
              setUser({ id: 'local-user', name: 'User', email: '' });
              setIsAuthenticated(true);
            }
          }

          // Non-blocking silent background token verification
          authService.refreshAccessToken().catch((err) => {
            logger.warn('AuthContext: Silent background token refresh check failed', err);
          });
        }
      } catch (error) {
        logger.error('AuthContext: Failed to bootstrap session', error);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    bootstrapAuth();

    return () => {
      isMounted = false;
    };
  }, []);

  const login = async (credentials: LoginCredentials) => {
    const loggedInUser = await authService.login(credentials);
    setUser(loggedInUser);
    setIsAuthenticated(true);
  };

  const register = async (credentials: RegisterCredentials) => {
    const registeredUser = await authService.register(credentials);
    setUser(registeredUser);
    setIsAuthenticated(true);
  };

  const logout = async () => {
    await authService.logout();
    setUser(null);
    setIsAuthenticated(false);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        isLoading,
        login,
        register,
        logout,
      }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
