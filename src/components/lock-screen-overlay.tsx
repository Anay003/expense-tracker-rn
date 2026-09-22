import { useAppLock } from '@/hooks/use-app-lock';
import { useTheme } from '@/hooks/use-theme';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export function LockScreenOverlay() {
  const theme = useTheme();
  const { isLocked, isAuthenticating, biometricStatus, unlock } = useAppLock();

  // If the app is unlocked, do not render anything
  if (!isLocked) {
    return null;
  }

  const biometricName =
    biometricStatus?.biometricTypes.length && biometricStatus.biometricTypes.length > 0
      ? biometricStatus.biometricTypes.join(' / ')
      : 'Biometrics';

  return (
    <View style={[styles.overlay, { backgroundColor: theme.background }]}>
      <SafeAreaView style={styles.content}>
        {/* Header Icon Badge */}
        <View style={[styles.iconBadge, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <Text style={styles.lockEmoji}>🔒</Text>
        </View>

        {/* Title and Subtitle */}
        <Text style={[styles.title, { color: theme.text }]}>Expense Tracker</Text>
        <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
          Your financial data is locked for privacy.
        </Text>

        {/* Biometric Type Indicator */}
        <View style={[styles.chip, { backgroundColor: theme.backgroundElement }]}>
          <Text style={[styles.chipText, { color: theme.textSecondary }]}>
            Protected by {biometricName}
          </Text>
        </View>

        {/* Unlock Action Button */}
        <Pressable
          onPress={() => unlock()}
          disabled={isAuthenticating}
          style={({ pressed }) => [
            styles.unlockButton,
            { backgroundColor: theme.accent },
            pressed && { opacity: 0.8 },
            isAuthenticating && { opacity: 0.6 },
          ]}>
          {isAuthenticating ? (
            <ActivityIndicator color="#ffffff" size="small" />
          ) : (
            <Text style={styles.unlockButtonText}>Unlock with {biometricName}</Text>
          )}
        </Pressable>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFill,
    zIndex: 99999, // Guarantees it sits above all tabs, modals, and screen stacks
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    width: '100%',
    maxWidth: 400,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  iconBadge: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  lockEmoji: {
    fontSize: 36,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 16,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    marginBottom: 36,
  },
  chipText: {
    fontSize: 12,
    fontWeight: '500',
  },
  unlockButton: {
    width: '100%',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  unlockButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
});
