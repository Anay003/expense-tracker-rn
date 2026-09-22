import React, { createContext, useContext, useEffect, useState, useRef, useCallback } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { biometricService, BiometricStatus } from '@/services/biometricService';
import { hapticService } from '@/services/hapticService';
import { logger } from '@/services/logger';

// 15 seconds grace period before re-locking when returning from background
const GRACE_PERIOD_MS = 15 * 1000;

interface AuthLockContextType {
  isLocked: boolean;
  isAuthenticating: boolean;
  biometricStatus: BiometricStatus | null;
  unlock: () => Promise<boolean>;
  lock: () => void;
}

const AuthLockContext = createContext<AuthLockContextType>({
  isLocked: false,
  isAuthenticating: false,
  biometricStatus: null,
  unlock: async () => false,
  lock: () => {},
});

export function AuthLockProvider({ children }: { children: React.ReactNode }) {
  const [isLocked, setIsLocked] = useState<boolean>(true);
  const [isAuthenticating, setIsAuthenticating] = useState<boolean>(false);
  const [biometricStatus, setBiometricStatus] = useState<BiometricStatus | null>(null);

  const appState = useRef<AppStateStatus>(AppState.currentState);
  const lastBackgroundTime = useRef<number | null>(null);

  // Request native authentication to unlock
  const unlock = useCallback(async (): Promise<boolean> => {
    setIsAuthenticating(true);
    try {
      const result = await biometricService.authenticate('Unlock Expense Tracker');
      if (result.success) {
        hapticService.success();
        setIsLocked(false);
        lastBackgroundTime.current = null;
        return true;
      }
      hapticService.error();
      return false;
    } finally {
      setIsAuthenticating(false);
    }
  }, []);

  const lock = useCallback(() => {
    setIsLocked(true);
  }, []);

  // 1. Initial check & Cold Start Authentication
  useEffect(() => {
    let mounted = true;

    async function initAuth() {
      const status = await biometricService.getStatus();
      if (!mounted) return;

      setBiometricStatus(status);

      if (status.isAvailable) {
        setIsLocked(true);
        // Prompt unlock on cold start
        unlock();
      } else {
        // If device has no biometrics/passcode, unlock automatically
        setIsLocked(false);
      }
    }

    initAuth();

    return () => {
      mounted = false;
    };
  }, [unlock]);

  // 2. AppState Lifecycle Listener (Background vs. Active)
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState: AppStateStatus) => {
      const previousState = appState.current;
      appState.current = nextAppState;

      logger.info(`AppState transition: ${previousState} -> ${nextAppState}`);

      // When app goes into background: record timestamp
      if (nextAppState === 'background' || nextAppState === 'inactive') {
        if (!lastBackgroundTime.current) {
          lastBackgroundTime.current = Date.now();
        }
      }

      // When app returns to foreground from background
      if (previousState.match(/inactive|background/) && nextAppState === 'active') {
        if (lastBackgroundTime.current && biometricStatus?.isAvailable) {
          const elapsed = Date.now() - lastBackgroundTime.current;
          logger.info(`App returned to foreground after ${Math.round(elapsed / 1000)}s`);

          // If away longer than the grace period, lock the app!
          if (elapsed >= GRACE_PERIOD_MS) {
            logger.info('Grace period exceeded. Locking application.');
            setIsLocked(true);
            unlock();
          }
        }
      }
    });

    return () => {
      subscription.remove();
    };
  }, [biometricStatus, unlock]);

  return (
    <AuthLockContext.Provider
      value={{
        isLocked,
        isAuthenticating,
        biometricStatus,
        unlock,
        lock,
      }}>
      {children}
    </AuthLockContext.Provider>
  );
}

export function useAppLock() {
  return useContext(AuthLockContext);
}
