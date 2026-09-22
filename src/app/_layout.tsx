import { useEffect } from 'react';
import { DarkTheme, DefaultTheme, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useColorScheme } from 'react-native';

import AppTabs from '@/components/app-tabs';
import { AuthLockProvider } from '@/hooks/use-app-lock';
import { LockScreenOverlay } from '@/components/lock-screen-overlay';

// Prevent native splash screen from hiding before initial mount
SplashScreen.preventAutoHideAsync().catch(() => {});

export default function TabLayout() {
  const colorScheme = useColorScheme();

  useEffect(() => {
    // Hide native splash screen safely with retry if native view was animating
    const dismissSplash = async () => {
      try {
        await SplashScreen.hideAsync();
      } catch {
        setTimeout(() => {
          SplashScreen.hideAsync().catch(() => {});
        }, 100);
      }
    };
    dismissSplash();
  }, []);

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <AuthLockProvider>
        <AppTabs />
        <LockScreenOverlay />
      </AuthLockProvider>
    </ThemeProvider>
  );
}

