import * as LocalAuthentication from 'expo-local-authentication';
import { Platform } from 'react-native';
import { logger } from './logger';

export interface BiometricStatus {
  isAvailable: boolean;
  hasHardware: boolean;
  isEnrolled: boolean;
  biometricTypes: string[];
}

export interface AuthResult {
  success: boolean;
  error?: string;
}

class BiometricService {
  /**
   * Inspect the physical device to check if biometric sensors exist
   * and if the user has enrolled their fingerprints or face.
   */
  public async getStatus(): Promise<BiometricStatus> {
    // Web browsers don't have mobile biometric sensor hardware
    if (Platform.OS === 'web') {
      return {
        isAvailable: false,
        hasHardware: false,
        isEnrolled: false,
        biometricTypes: [],
      };
    }

    try {
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();
      const types = await LocalAuthentication.supportedAuthenticationTypesAsync();

      const biometricTypes: string[] = [];
      types.forEach((type) => {
        if (type === LocalAuthentication.AuthenticationType.FINGERPRINT) {
          biometricTypes.push('Fingerprint');
        } else if (type === LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION) {
          biometricTypes.push('Face ID');
        } else if (type === LocalAuthentication.AuthenticationType.IRIS) {
          biometricTypes.push('Iris');
        }
      });

      return {
        isAvailable: hasHardware && isEnrolled,
        hasHardware,
        isEnrolled,
        biometricTypes,
      };
    } catch (err) {
      logger.error('Failed to query biometric status', err);
      return {
        isAvailable: false,
        hasHardware: false,
        isEnrolled: false,
        biometricTypes: [],
      };
    }
  }

  /**
   * Triggers the native BiometricPrompt dialog (Android) or FaceID prompt (iOS).
   * Includes device passcode/PIN fallback if biometrics fail or are cancelled.
   */
  public async authenticate(reason: string = 'Unlock your Expense Tracker'): Promise<AuthResult> {
    if (Platform.OS === 'web') {
      // On web during dev/preview, allow access gracefully
      return { success: true };
    }

    try {
      const status = await this.getStatus();

      // If no hardware or enrollment, allow user in gracefully
      if (!status.isAvailable) {
        logger.info('Biometrics unavailable or not enrolled on device, bypassing.');
        return { success: true };
      }

      logger.info('Prompting native biometric authentication...');

      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: reason,
        cancelLabel: 'Cancel',
        fallbackLabel: 'Use Device Passcode',
        disableDeviceFallback: false, // Allows device PIN/pattern fallback
      });

      if (result.success) {
        logger.info('Biometric authentication succeeded.');
        return { success: true };
      }

      logger.warn('Biometric authentication failed or cancelled:', result.error);
      return { success: false, error: result.error };
    } catch (err) {
      logger.error('Biometric authentication encountered exception', err);
      return { success: false, error: 'Authentication error' };
    }
  }
}

export const biometricService = new BiometricService();
