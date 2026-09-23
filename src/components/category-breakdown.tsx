import { View, Text, StyleSheet } from 'react-native';
import { CategoryStat, CATEGORY_DETAILS } from '@/types/expense';
import { useTheme } from '@/hooks/use-theme';
import { Spacing } from '@/constants/theme';
import { CategoryIcon } from '@/components/app-icon';

interface CategoryBreakdownProps {
  stats: CategoryStat[];
}

export function CategoryBreakdown({ stats }: CategoryBreakdownProps) {
  const theme = useTheme();

  if (stats.length === 0) {
    return (
      <View
        style={[
          styles.container,
          {
            backgroundColor: theme.card,
            borderColor: theme.border,
          },
        ]}>
        <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
          No expense data recorded yet.
        </Text>
      </View>
    );
  }

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: theme.card,
          borderColor: theme.border,
        },
      ]}>
      <Text style={[styles.title, { color: theme.text }]}>
        Spending by Category
      </Text>

      {stats.map((stat) => {
        const meta = CATEGORY_DETAILS[stat.category] ?? CATEGORY_DETAILS.other;
        const formattedAmount = new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: 'USD',
          minimumFractionDigits: 0,
        }).format(stat.amount);

        return (
          <View key={stat.category} style={styles.row}>
            <View style={styles.labelRow}>
              <View style={styles.nameGroup}>
                <CategoryIcon
                  category={stat.category}
                  size={16}
                  style={{ marginRight: Spacing.two }}
                />
                <Text style={[styles.label, { color: theme.text }]}>
                  {meta.label}
                </Text>
              </View>

              <View style={styles.valueGroup}>
                <Text style={[styles.amount, { color: theme.text }]}>
                  {formattedAmount}
                </Text>
                <Text style={[styles.percentage, { color: theme.textSecondary }]}>
                  {stat.percentage}%
                </Text>
              </View>
            </View>

            {/* Progress Bar */}
            <View
              style={[
                styles.progressBarBg,
                { backgroundColor: theme.backgroundElement },
              ]}>
              <View
                style={[
                  styles.progressBarFill,
                  {
                    backgroundColor: meta.color,
                    width: `${Math.min(100, Math.max(2, stat.percentage))}%`,
                  },
                ]}
              />
            </View>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    padding: Spacing.four,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: Spacing.three,
  },
  emptyText: {
    fontSize: 14,
    textAlign: 'center',
    paddingVertical: Spacing.four,
  },
  row: {
    marginBottom: Spacing.three,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  nameGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  emoji: {
    fontSize: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
  },
  valueGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  amount: {
    fontSize: 14,
    fontWeight: '600',
  },
  percentage: {
    fontSize: 12,
    minWidth: 32,
    textAlign: 'right',
  },
  progressBarBg: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
    width: '100%',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4,
  },
});
