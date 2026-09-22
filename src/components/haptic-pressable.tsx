import React from 'react';
import { Pressable, PressableProps, GestureResponderEvent } from 'react-native';
import { hapticService, HapticType } from '@/services/hapticService';

export interface HapticPressableProps extends PressableProps {
  /**
   * The semantic type of haptic feedback to trigger when pressed.
   * Defaults to 'light'. Set to 'none' to disable haptics.
   */
  haptic?: HapticType;
}

/**
 * Reusable enterprise-grade touchable component with built-in Taptic/Haptic feedback.
 * Drop-in replacement for React Native's standard <Pressable>.
 */
export function HapticPressable({
  haptic = 'light',
  onPress,
  onPressIn,
  disabled,
  children,
  ...rest
}: HapticPressableProps) {
  const handlePressIn = (event: GestureResponderEvent) => {
    if (!disabled && haptic !== 'none') {
      hapticService.trigger(haptic);
    }
    onPressIn?.(event);
  };

  return (
    <Pressable
      disabled={disabled}
      onPress={onPress}
      onPressIn={handlePressIn}
      {...rest}>
      {children}
    </Pressable>
  );
}
