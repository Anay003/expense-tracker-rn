import { useColorScheme } from 'react-native';
import { Colors } from '@/constants/theme';

/**
 * Custom hook that returns the active color palette based on the device's color scheme (light/dark).
 */
export function useTheme() {
  const scheme = useColorScheme();
  return Colors[scheme === 'dark' ? 'dark' : 'light'];
}

export default useTheme;
