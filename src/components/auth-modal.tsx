import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { useTheme } from '@/hooks/use-theme';
import { Spacing, MaxContentWidth } from '@/constants/theme';
import { useAuth } from '@/context/auth-context';
import { hapticService } from '@/services/hapticService';
import { HapticPressable } from '@/components/haptic-pressable';
import { AppIcon } from '@/components/app-icon';

interface AuthModalProps {
  visible: boolean;
}

export function AuthModal({ visible }: AuthModalProps) {
  const theme = useTheme();
  const { login, register } = useAuth();

  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setError(null);

    if (mode === 'register' && !name.trim()) {
      hapticService.error();
      setError('Please enter your full name');
      return;
    }

    if (!email.trim() || !email.includes('@')) {
      hapticService.error();
      setError('Please enter a valid email address');
      return;
    }

    if (!password || password.length < 6) {
      hapticService.error();
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    try {
      if (mode === 'login') {
        await login({ email: email.trim(), password });
      } else {
        await register({ name: name.trim(), email: email.trim(), password });
      }
      hapticService.success();
    } catch (err: any) {
      hapticService.error();
      setError(err?.message || 'Authentication failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={false}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={[styles.container, { backgroundColor: theme.background }]}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled">
          <View style={styles.card}>
            {/* Header Icon & Brand */}
            <View style={[styles.iconCircle, { backgroundColor: theme.accent + '20' }]}>
              <AppIcon name="lock" size={32} color={theme.accent} />
            </View>

            <Text style={[styles.title, { color: theme.text }]}>
              {mode === 'login' ? 'Welcome Back' : 'Create Account'}
            </Text>
            <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
              {mode === 'login'
                ? 'Sign in to sync your financial records'
                : 'Join Expense Tracker to safeguard your finances'}
            </Text>

            {/* Mode Switcher Tabs */}
            <View style={[styles.tabBar, { backgroundColor: theme.backgroundElement }]}>
              <HapticPressable
                haptic="selection"
                onPress={() => {
                  setMode('login');
                  setError(null);
                }}
                style={[
                  styles.tabBtn,
                  mode === 'login' && { backgroundColor: theme.accent },
                ]}>
                <Text
                  style={[
                    styles.tabText,
                    { color: mode === 'login' ? '#FFFFFF' : theme.textSecondary },
                  ]}>
                  Sign In
                </Text>
              </HapticPressable>

              <HapticPressable
                haptic="selection"
                onPress={() => {
                  setMode('register');
                  setError(null);
                }}
                style={[
                  styles.tabBtn,
                  mode === 'register' && { backgroundColor: theme.accent },
                ]}>
                <Text
                  style={[
                    styles.tabText,
                    { color: mode === 'register' ? '#FFFFFF' : theme.textSecondary },
                  ]}>
                  Register
                </Text>
              </HapticPressable>
            </View>

            {/* Error Message Box */}
            {error && (
              <View style={[styles.errorBox, { backgroundColor: theme.expenseBg }]}>
                <Text style={[styles.errorText, { color: theme.expense }]}>
                  {error}
                </Text>
              </View>
            )}

            {/* Form Fields */}
            {mode === 'register' && (
              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: theme.textSecondary }]}>
                  Full Name
                </Text>
                <TextInput
                  style={[
                    styles.input,
                    {
                      backgroundColor: theme.card,
                      borderColor: theme.border,
                      color: theme.text,
                    },
                  ]}
                  placeholder="e.g. Alex Morgan"
                  placeholderTextColor={theme.textSecondary}
                  value={name}
                  onChangeText={setName}
                  autoCapitalize="words"
                />
              </View>
            )}

            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: theme.textSecondary }]}>
                Email Address
              </Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: theme.card,
                    borderColor: theme.border,
                    color: theme.text,
                  },
                ]}
                placeholder="name@example.com"
                placeholderTextColor={theme.textSecondary}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: theme.textSecondary }]}>
                Password
              </Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: theme.card,
                    borderColor: theme.border,
                    color: theme.text,
                  },
                ]}
                placeholder="••••••••"
                placeholderTextColor={theme.textSecondary}
                value={password}
                onChangeText={setPassword}
                secureTextEntry
              />
            </View>

            {/* Submit Button */}
            <HapticPressable
              haptic="medium"
              disabled={loading}
              onPress={handleSubmit}
              style={[
                styles.submitBtn,
                { backgroundColor: theme.accent },
                loading && { opacity: 0.7 },
              ]}>
              {loading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.submitBtnText}>
                  {mode === 'login' ? 'Sign In' : 'Create Account'}
                </Text>
              )}
            </HapticPressable>

            {/* Offline Local Note */}
            <Text style={[styles.footerNote, { color: theme.textSecondary }]}>
              🔐 Token secured by device Keystore. SQLite caches your records for 0ms offline access.
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.four,
  },
  card: {
    width: '100%',
    maxWidth: MaxContentWidth,
    alignItems: 'center',
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.three,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    marginBottom: 6,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: Spacing.four,
    paddingHorizontal: Spacing.two,
  },
  tabBar: {
    flexDirection: 'row',
    width: '100%',
    borderRadius: 14,
    padding: 4,
    marginBottom: Spacing.four,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '700',
  },
  errorBox: {
    width: '100%',
    padding: Spacing.three,
    borderRadius: 12,
    marginBottom: Spacing.three,
  },
  errorText: {
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
  },
  inputGroup: {
    width: '100%',
    marginBottom: Spacing.three,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 6,
  },
  input: {
    width: '100%',
    height: 50,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: Spacing.three,
    fontSize: 15,
  },
  submitBtn: {
    width: '100%',
    height: 52,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing.two,
    marginBottom: Spacing.three,
  },
  submitBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  footerNote: {
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 18,
    marginTop: Spacing.two,
    paddingHorizontal: Spacing.two,
  },
});
