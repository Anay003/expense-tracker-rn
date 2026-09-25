import { API_BASE_URL } from '@/config/api';
import { AuthResponse, LoginCredentials, RegisterCredentials, User } from '@/types/auth';
import { tokenStorage } from './tokenStorage';
import { databaseService } from './databaseService';
import { expenseService } from './expenseService';
import { logger } from './logger';

const AUTH_URL = `${API_BASE_URL}/auth`;
const REQUEST_TIMEOUT = 10000;

class AuthService {
  /**
   * Helper for network requests with timeout
   */
  private async fetchWithTimeout(url: string, options: RequestInit): Promise<Response> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          ...(options.headers || {}),
        },
      });
      return response;
    } finally {
      clearTimeout(timeoutId);
    }
  }

  /**
   * Log in user with email & password.
   * Saves tokens to hardware SecureStore and caches user in SQLite.
   */
  async login(credentials: LoginCredentials): Promise<User> {
    try {
      logger.info(`AuthService: Attempting login for ${credentials.email}...`);
      const response = await this.fetchWithTimeout(`${AUTH_URL}/login`, {
        method: 'POST',
        body: JSON.stringify(credentials),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || `Login failed (${response.status})`);
      }

      const data: AuthResponse = await response.json();

      // 1. Secure token storage (Keystore / Keychain)
      await tokenStorage.saveTokens({
        accessToken: data.accessToken,
        refreshToken: data.refreshToken,
      });

      // 2. Cache user profile in SQLite for offline greeting
      await databaseService.saveUser(data.user);

      // 3. Reset in-memory cache to guarantee fresh state for the new user
      expenseService.reset();

      logger.info(`AuthService: Login successful for ${data.user.email}`);
      return data.user;
    } catch (error) {
      logger.error('AuthService.login failed', error);
      throw error;
    }
  }

  /**
   * Register a new user account.
   */
  async register(credentials: RegisterCredentials): Promise<User> {
    try {
      logger.info(`AuthService: Registering user ${credentials.email}...`);
      const response = await this.fetchWithTimeout(`${AUTH_URL}/register`, {
        method: 'POST',
        body: JSON.stringify(credentials),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || `Registration failed (${response.status})`);
      }

      const data: AuthResponse = await response.json();

      await tokenStorage.saveTokens({
        accessToken: data.accessToken,
        refreshToken: data.refreshToken,
      });

      await databaseService.saveUser(data.user);

      // Reset in-memory cache to guarantee fresh state for the new user
      expenseService.reset();

      logger.info(`AuthService: User registered successfully: ${data.user.email}`);
      return data.user;
    } catch (error) {
      logger.error('AuthService.register failed', error);
      throw error;
    }
  }

  /**
   * Silent background token refresh.
   */
  async refreshAccessToken(): Promise<string | null> {
    try {
      const refreshToken = await tokenStorage.getRefreshToken();
      if (!refreshToken) return null;

      const response = await this.fetchWithTimeout(`${AUTH_URL}/refresh`, {
        method: 'POST',
        body: JSON.stringify({ refreshToken }),
      });

      if (!response.ok) {
        logger.warn('AuthService: Refresh token expired or revoked');
        return null;
      }

      const data: AuthResponse = await response.json();

      await tokenStorage.saveTokens({
        accessToken: data.accessToken,
        refreshToken: data.refreshToken,
      });

      return data.accessToken;
    } catch (error) {
      logger.error('AuthService.refreshAccessToken failed', error);
      return null;
    }
  }

  /**
   * Returns current access token. If null, attempts silent refresh.
   */
  async getValidToken(): Promise<string | null> {
    const token = await tokenStorage.getAccessToken();
    if (token) return token;
    return await this.refreshAccessToken();
  }

  /**
   * Logs out user: attempts sync of offline changes, resets cache, purges local SQLite data and SecureStore.
   */
  async logout(): Promise<void> {
    try {
      // 1. Attempt to flush pending offline transactions if online before session ends
      try {
        await expenseService.sync(true);
      } catch {
        // Safe to ignore if backend is unreachable
      }

      // 2. Reset in-memory expense service cache and cooldowns
      expenseService.reset();

      // 3. Clear local SQLite database (expenses and user profile)
      await databaseService.clearAll();
      await databaseService.clearUser();

      // 4. Clear secure tokens from KeyStore/Keychain
      await tokenStorage.clearAll();
      logger.info('AuthService: User logged out cleanly, local session wiped');
    } catch (error) {
      logger.error('AuthService.logout failed', error);
    }
  }
}

export const authService = new AuthService();
