import { useEffect } from 'react';
import { DarkTheme, DefaultTheme, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useColorScheme } from 'react-native';

import AppTabs from '@/components/app-tabs';
import { AuthLockProvider } from '@/hooks/use-app-lock';
import { LockScreenOverlay } from '@/components/lock-screen-overlay';
import { databaseService } from '@/services/databaseService';
import { AuthProvider, useAuth } from '@/context/auth-context';
import { AuthModal } from '@/components/auth-modal';

// Prevent native splash screen from hiding before initial mount
SplashScreen.preventAutoHideAsync().catch(() => {});

function RootContent() {
  const { isAuthenticated, isLoading } = useAuth();

  return (
    <>
      <AppTabs />
      <LockScreenOverlay />
      {!isLoading && !isAuthenticated && <AuthModal visible={!isAuthenticated} />}
    </>
  );
}

export default function TabLayout() {
  const colorScheme = useColorScheme();

  useEffect(() => {
    // Initialize local SQLite database and dismiss splash screen safely
    const initApp = async () => {
      try {
        await databaseService.init();
      } catch (err) {
        console.warn('Failed to initialize local SQLite database', err);
      }

      try {
        await SplashScreen.hideAsync();
      } catch {
        setTimeout(() => {
          SplashScreen.hideAsync().catch(() => {});
        }, 100);
      }
    };
    initApp();
  }, []);

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <AuthProvider>
        <AuthLockProvider>
          <RootContent />
        </AuthLockProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
