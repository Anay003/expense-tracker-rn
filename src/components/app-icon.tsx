import React from 'react';
import { View, StyleSheet, ViewStyle, StyleProp } from 'react-native';
import {
  Utensils,
  Car,
  ShoppingBag,
  Zap,
  Film,
  Banknote,
  TrendingUp,
  TrendingDown,
  Pill,
  Package,
  Lock,
  CreditCard,
  Search,
  X,
  Plus,
  ArrowRight,
  FileText,
  ShieldCheck,
  LucideIcon,
  LucideProps,
} from 'lucide-react-native';
import { AppIconName, ExpenseCategory, CATEGORY_DETAILS } from '@/types/expense';

/**
 * Single-entrypoint Icon Map.
 * No file outside of this module should ever import from 'lucide-react-native'.
 */
const ICON_MAP: Record<AppIconName, LucideIcon> = {
  food: Utensils,
  transport: Car,
  shopping: ShoppingBag,
  bills: Zap,
  entertainment: Film,
  salary: Banknote,
  investment: TrendingUp,
  health: Pill,
  other: Package,
  lock: Lock,
  balance: CreditCard,
  income: TrendingUp,
  expense: TrendingDown,
  search: Search,
  close: X,
  plus: Plus,
  'arrow-right': ArrowRight,
  empty: FileText,
  'shield-check': ShieldCheck,
  bolt: Zap,
};

export interface AppIconProps extends Omit<LucideProps, 'color'> {
  name: AppIconName;
  size?: number;
  color?: string;
  strokeWidth?: number;
  style?: StyleProp<ViewStyle>;
}

/**
 * Reusable Enterprise Vector Icon Component.
 */
export function AppIcon({
  name,
  size = 20,
  color = '#FFFFFF',
  strokeWidth = 2,
  style,
  ...rest
}: AppIconProps) {
  const IconComponent = ICON_MAP[name] ?? Package;

  return (
    <IconComponent
      size={size}
      color={color}
      strokeWidth={strokeWidth}
      style={style}
      {...rest}
    />
  );
}

export interface CategoryIconProps {
  category: ExpenseCategory;
  size?: number;
  color?: string;
  badge?: boolean;
  badgeSize?: number;
  style?: StyleProp<ViewStyle>;
}

/**
 * Reusable Category Icon with optional tinted circular background badge.
 */
export function CategoryIcon({
  category,
  size = 18,
  color,
  badge = false,
  badgeSize = 36,
  style,
}: CategoryIconProps) {
  const meta = CATEGORY_DETAILS[category] ?? CATEGORY_DETAILS.other;
  const iconColor = color ?? meta.color;

  if (badge) {
    return (
      <View
        style={[
          styles.badge,
          {
            width: badgeSize,
            height: badgeSize,
            borderRadius: badgeSize / 2,
            backgroundColor: `${meta.color}22`,
          },
          style,
        ]}>
        <AppIcon name={meta.icon} size={size} color={iconColor} />
      </View>
    );
  }

  return <AppIcon name={meta.icon} size={size} color={iconColor} style={style} />;
}

const styles = StyleSheet.create({
  badge: {
    justifyContent: 'center',
    alignItems: 'center',
  },
});
