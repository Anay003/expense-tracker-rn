import { Platform } from 'react-native';
import { AuthTokens } from '../types/auth';
import { logger } from './logger';

let SecureStore: typeof import('expo-secure-store') | null = null;
try {
  SecureStore = require('expo-secure-store');
} catch (e) {
  logger.warn('ExpoSecureStore native module not found in binary. Using memory store until next native rebuild.');
}

const memoryStore = new Map<string, string>();

const ACCESS_TOKEN_KEY = 'auth_access_token';
const REFRESH_TOKEN_KEY = 'auth_refresh_token';
const USER_KEY = 'auth_user_cache';

/**
 * Hardware-backed Secure Store Service
 * Stores sensitive JWT access/refresh tokens inside Android Keystore / iOS Keychain.
 * Includes graceful memory fallback if native module is not yet compiled into the APK.
 */
class TokenStorageService {
  /**
   * Save access & refresh tokens securely.
   */
  async saveTokens(tokens: AuthTokens): Promise<void> {
    try {
      if (Platform.OS === 'web') {
        localStorage.setItem(ACCESS_TOKEN_KEY, tokens.accessToken);
        localStorage.setItem(REFRESH_TOKEN_KEY, tokens.refreshToken);
        return;
      }
      if (SecureStore) {
        await SecureStore.setItemAsync(ACCESS_TOKEN_KEY, tokens.accessToken, {
          keychainAccessible: SecureStore.AFTER_FIRST_UNLOCK,
        });
        await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, tokens.refreshToken, {
          keychainAccessible: SecureStore.AFTER_FIRST_UNLOCK,
        });
      } else {
        memoryStore.set(ACCESS_TOKEN_KEY, tokens.accessToken);
        memoryStore.set(REFRESH_TOKEN_KEY, tokens.refreshToken);
      }
    } catch (error) {
      logger.error('Failed to save tokens to SecureStore', error);
      memoryStore.set(ACCESS_TOKEN_KEY, tokens.accessToken);
      memoryStore.set(REFRESH_TOKEN_KEY, tokens.refreshToken);
    }
  }

  /**
   * Get the current JWT access token.
   */
  async getAccessToken(): Promise<string | null> {
    try {
      if (Platform.OS === 'web') {
        return localStorage.getItem(ACCESS_TOKEN_KEY);
      }
      if (SecureStore) {
        return await SecureStore.getItemAsync(ACCESS_TOKEN_KEY);
      }
      return memoryStore.get(ACCESS_TOKEN_KEY) ?? null;
    } catch (error) {
      logger.error('Failed to retrieve access token', error);
      return memoryStore.get(ACCESS_TOKEN_KEY) ?? null;
    }
  }

  /**
   * Get the rotating refresh token.
   */
  async getRefreshToken(): Promise<string | null> {
    try {
      if (Platform.OS === 'web') {
        return localStorage.getItem(REFRESH_TOKEN_KEY);
      }
      if (SecureStore) {
        return await SecureStore.getItemAsync(REFRESH_TOKEN_KEY);
      }
      return memoryStore.get(REFRESH_TOKEN_KEY) ?? null;
    } catch (error) {
      logger.error('Failed to retrieve refresh token', error);
      return memoryStore.get(REFRESH_TOKEN_KEY) ?? null;
    }
  }

  /**
   * Clear all stored tokens on logout.
   */
  async clearAll(): Promise<void> {
    try {
      if (Platform.OS === 'web') {
        localStorage.removeItem(ACCESS_TOKEN_KEY);
        localStorage.removeItem(REFRESH_TOKEN_KEY);
        localStorage.removeItem(USER_KEY);
        return;
      }
      if (SecureStore) {
        await SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY);
        await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);
        await SecureStore.deleteItemAsync(USER_KEY);
      }
      memoryStore.clear();
    } catch (error) {
      logger.error('Failed to clear tokens from SecureStore', error);
      memoryStore.clear();
    }
  }
}

export const tokenStorage = new TokenStorageService();
