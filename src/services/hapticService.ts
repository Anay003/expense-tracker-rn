import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';
import { logger } from './logger';

export type HapticType =
  | 'selection'
  | 'light'
  | 'medium'
  | 'heavy'
  | 'success'
  | 'warning'
  | 'error'
  | 'none';

class HapticService {
  private isEnabled: boolean = true;

  /**
   * Enable or disable haptics globally (e.g. user preference setting).
   */
  public setEnabled(enabled: boolean): void {
    this.isEnabled = enabled;
  }

  public getEnabled(): boolean {
    return this.isEnabled;
  }

  /**
   * Micro-tick for selection changes, pickers, and tab transitions.
   */
  public async selection(): Promise<void> {
    if (!this.canTrigger()) return;
    try {
      await Haptics.selectionAsync();
    } catch (err) {
      logger.warn('Haptic selection failed', err);
    }
  }

  /**
   * Light mechanical click for small buttons, chips, and category pills.
   */
  public async impactLight(): Promise<void> {
    if (!this.canTrigger()) return;
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch (err) {
      logger.warn('Haptic impactLight failed', err);
    }
  }

  /**
   * Medium impact for primary actions, modal triggers, and form submits.
   */
  public async impactMedium(): Promise<void> {
    if (!this.canTrigger()) return;
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch (err) {
      logger.warn('Haptic impactMedium failed', err);
    }
  }

  /**
   * Heavy thump for dismissals or major state transitions.
   */
  public async impactHeavy(): Promise<void> {
    if (!this.canTrigger()) return;
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    } catch (err) {
      logger.warn('Haptic impactHeavy failed', err);
    }
  }

  /**
   * Double-pulse confirmation for successfully saving expenses or unlocking.
   */
  public async success(): Promise<void> {
    if (!this.canTrigger()) return;
    try {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (err) {
      logger.warn('Haptic success failed', err);
    }
  }

  /**
   * Cautionary vibration for destructive actions (e.g. delete prompt).
   */
  public async warning(): Promise<void> {
    if (!this.canTrigger()) return;
    try {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    } catch (err) {
      logger.warn('Haptic warning failed', err);
    }
  }

  /**
   * Multi-buzz alert for validation errors or biometric rejection.
   */
  public async error(): Promise<void> {
    if (!this.canTrigger()) return;
    try {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } catch (err) {
      logger.warn('Haptic error failed', err);
    }
  }

  /**
   * Triggers haptic feedback by semantic name.
   */
  public async trigger(type: HapticType = 'light'): Promise<void> {
    switch (type) {
      case 'selection':
        return this.selection();
      case 'light':
        return this.impactLight();
      case 'medium':
        return this.impactMedium();
      case 'heavy':
        return this.impactHeavy();
      case 'success':
        return this.success();
      case 'warning':
        return this.warning();
      case 'error':
        return this.error();
      case 'none':
      default:
        return;
    }
  }

  private canTrigger(): boolean {
    return this.isEnabled && Platform.OS !== 'web';
  }
}

export const hapticService = new HapticService();
