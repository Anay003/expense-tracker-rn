import { View, Text, StyleSheet, Pressable, Alert, Platform } from 'react-native';
import { Expense, CATEGORY_DETAILS } from '@/types/expense';
import { useTheme } from '@/hooks/use-theme';
import { Spacing } from '@/constants/theme';

interface TransactionItemProps {
  item: Expense;
  onDelete?: (id: string) => void;
}

export function TransactionItem({ item, onDelete }: TransactionItemProps) {
  const theme = useTheme();
  const categoryMeta = CATEGORY_DETAILS[item.category] ?? CATEGORY_DETAILS.other;

  const isIncome = item.type === 'income';
  const amountPrefix = isIncome ? '+' : '-';
  const formattedAmount = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(item.amount);

  const handleDelete = () => {
    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined' && window.confirm(`Are you sure you want to delete "${item.title}"?`)) {
        onDelete?.(item.id);
      }
      return;
    }

    try {
      Alert.alert(
        'Delete Transaction',
        `Are you sure you want to delete "${item.title}"?`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Delete',
            style: 'destructive',
            onPress: () => onDelete?.(item.id),
          },
        ],
        { cancelable: true }
      );
    } catch {
      // Fallback if native DialogModule is not attached to an active Activity
      onDelete?.(item.id);
    }
  };


  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: theme.card,
          borderColor: theme.border,
        },
      ]}>
      <View
        style={[
          styles.iconContainer,
          { backgroundColor: categoryMeta.color + '22' },
        ]}>
        <Text style={styles.emoji}>{categoryMeta.emoji}</Text>
      </View>

      <View style={styles.details}>
        <Text style={[styles.title, { color: theme.text }]} numberOfLines={1}>
          {item.title}
        </Text>
        <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
          {categoryMeta.label} • {item.date}
        </Text>
        {item.note ? (
          <Text
            style={[styles.note, { color: theme.textSecondary }]}
            numberOfLines={1}>
            {item.note}
          </Text>
        ) : null}
      </View>

      <View style={styles.rightSection}>
        <Text
          style={[
            styles.amount,
            { color: isIncome ? theme.income : theme.expense },
          ]}>
          {amountPrefix}
          {formattedAmount}
        </Text>

        {onDelete && (
          <Pressable
            onPress={handleDelete}
            hitSlop={8}
            style={({ pressed }) => [
              styles.deleteBtn,
              pressed && { opacity: 0.6 },
            ]}>
            <Text style={[styles.deleteText, { color: theme.textSecondary }]}>
              ✕
            </Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.three,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: Spacing.two,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.three,
  },
  emoji: {
    fontSize: 22,
  },
  details: {
    flex: 1,
    justifyContent: 'center',
  },
  title: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 2,
  },
  subtitle: {
    fontSize: 12,
  },
  note: {
    fontSize: 11,
    fontStyle: 'italic',
    marginTop: 2,
  },
  rightSection: {
    alignItems: 'flex-end',
    justifyContent: 'center',
    marginLeft: Spacing.two,
  },
  amount: {
    fontSize: 15,
    fontWeight: '700',
  },
  deleteBtn: {
    marginTop: 4,
    padding: 2,
  },
  deleteText: {
    fontSize: 12,
    fontWeight: '600',
  },
});
