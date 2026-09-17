import { View, StyleSheet, Text } from 'react-native';
import { useTheme } from '@/hooks/use-theme';
import { Spacing } from '@/constants/theme';

interface StatCardProps {
  title: string;
  amount: number;
  type?: 'balance' | 'income' | 'expense';
  subtitle?: string;
  icon?: string;
}

export function StatCard({
  title,
  amount,
  type = 'balance',
  subtitle,
  icon,
}: StatCardProps) {
  const theme = useTheme();

  const formattedAmount = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(amount);

  const getAmountColor = () => {
    if (type === 'income') return theme.income;
    if (type === 'expense') return theme.expense;
    return theme.text;
  };

  const getBadgeBg = () => {
    if (type === 'income') return theme.incomeBg;
    if (type === 'expense') return theme.expenseBg;
    return theme.backgroundElement;
  };

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: theme.card,
          borderColor: theme.border,
        },
      ]}>
      <View style={styles.header}>
        <View style={styles.titleRow}>
          {icon && (
            <View style={[styles.iconBadge, { backgroundColor: getBadgeBg() }]}>
              <Text style={styles.iconText}>{icon}</Text>
            </View>
          )}
          <Text style={[styles.title, { color: theme.textSecondary }]}>
            {title}
          </Text>
        </View>
      </View>

      <Text
        numberOfLines={1}
        adjustsFontSizeToFit
        style={[styles.amount, { color: getAmountColor() }]}>
        {formattedAmount}
      </Text>

      {subtitle ? (
        <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
          {subtitle}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    padding: Spacing.four,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.two,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  iconBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconText: {
    fontSize: 14,
  },
  title: {
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
  amount: {
    fontSize: 22,
    fontWeight: '700',
    letterSpacing: -0.5,
    marginVertical: Spacing.half,
  },
  subtitle: {
    fontSize: 12,
    marginTop: Spacing.half,
  },
});
