import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

import { useTheme } from '@/hooks/use-theme';
import { useExpenses } from '@/hooks/use-expenses';
import { StatCard } from '@/components/stat-card';
import { TransactionItem } from '@/components/transaction-item';
import { AddExpenseModal } from '@/components/add-expense-modal';
import { Spacing, MaxContentWidth, BottomTabInset } from '@/constants/theme';

export default function DashboardScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { expenses, summary, loading, deleteExpense, refresh } = useExpenses();
  const [modalVisible, setModalVisible] = useState(false);

  const recentTransactions = expenses.slice(0, 5);

  return (
    <SafeAreaView
      edges={['top', 'left', 'right']}
      style={[styles.safeArea, { backgroundColor: theme.background }]}>
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={[styles.greeting, { color: theme.textSecondary }]}>
                Welcome back 👋
              </Text>
              <Text style={[styles.appTitle, { color: theme.text }]}>
                Expense Tracker
              </Text>
            </View>

            <Pressable
              onPress={() => setModalVisible(true)}
              style={({ pressed }) => [
                styles.addBtn,
                { backgroundColor: theme.accent },
                pressed && { opacity: 0.8 },
              ]}>
              <Text style={styles.addBtnText}>+ Add</Text>
            </Pressable>
          </View>

          {/* Balance Card */}
          <View style={styles.section}>
            <StatCard
              title="Total Balance"
              amount={summary.totalBalance}
              type="balance"
              subtitle={`Savings Rate: ${summary.savingsRate}%`}
              icon="💳"
            />
          </View>

          {/* Income & Expense Row */}
          <View style={styles.statsRow}>
            <StatCard
              title="Income"
              amount={summary.totalIncome}
              type="income"
              icon="📈"
            />
            <StatCard
              title="Expenses"
              amount={summary.totalExpense}
              type="expense"
              icon="📉"
            />
          </View>

          {/* Quick CTA Banner */}
          <Pressable
            onPress={() => setModalVisible(true)}
            style={({ pressed }) => [
              styles.ctaCard,
              {
                backgroundColor: theme.backgroundElement,
                borderColor: theme.border,
              },
              pressed && { opacity: 0.8 },
            ]}>
            <View style={styles.ctaLeft}>
              <Text style={styles.ctaEmoji}>⚡</Text>
              <View>
                <Text style={[styles.ctaTitle, { color: theme.text }]}>
                  Track a payment or expense
                </Text>
                <Text
                  style={[styles.ctaSubtitle, { color: theme.textSecondary }]}>
                  Tap here to record cash, bills or salary
                </Text>
              </View>
            </View>
            <Text style={[styles.ctaArrow, { color: theme.accent }]}>→</Text>
          </Pressable>

          {/* Recent Transactions Header */}
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>
              Recent Transactions
            </Text>
            {expenses.length > 5 && (
              <Pressable
                onPress={() => router.push('/transactions' as any)}
                hitSlop={8}>
                <Text style={[styles.viewAllText, { color: theme.accent }]}>
                  View All ({expenses.length})
                </Text>
              </Pressable>
            )}
          </View>

          {/* Recent Transactions List */}
          {loading ? (
            <ActivityIndicator
              size="large"
              color={theme.accent}
              style={{ marginTop: Spacing.four }}
            />
          ) : recentTransactions.length === 0 ? (
            <View
              style={[
                styles.emptyState,
                {
                  backgroundColor: theme.card,
                  borderColor: theme.border,
                },
              ]}>
              <Text style={styles.emptyEmoji}>📝</Text>
              <Text style={[styles.emptyTitle, { color: theme.text }]}>
                No transactions yet
              </Text>
              <Text
                style={[styles.emptySubtitle, { color: theme.textSecondary }]}>
                Add your first expense or income to see stats.
              </Text>
            </View>
          ) : (
            recentTransactions.map((item) => (
              <TransactionItem
                key={item.id}
                item={item}
                onDelete={deleteExpense}
              />
            ))
          )}
        </View>
      </ScrollView>

      {/* Add Expense Modal */}
      <AddExpenseModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        onSuccess={refresh}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  scrollContainer: {
    alignItems: 'center',
    paddingBottom: BottomTabInset + Spacing.six,
  },
  content: {
    width: '100%',
    maxWidth: MaxContentWidth,
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.two,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.four,
  },
  greeting: {
    fontSize: 13,
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  appTitle: {
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  addBtn: {
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
  section: {
    marginBottom: Spacing.three,
  },
  statsRow: {
    flexDirection: 'row',
    gap: Spacing.two,
    marginBottom: Spacing.three,
  },
  ctaCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.three,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: Spacing.four,
  },
  ctaLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    flex: 1,
  },
  ctaEmoji: {
    fontSize: 20,
  },
  ctaTitle: {
    fontSize: 14,
    fontWeight: '600',
  },
  ctaSubtitle: {
    fontSize: 12,
  },
  ctaArrow: {
    fontSize: 18,
    fontWeight: '700',
    marginLeft: Spacing.two,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.two,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  viewAllText: {
    fontSize: 13,
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.six,
    borderRadius: 16,
    borderWidth: 1,
    marginTop: Spacing.two,
  },
  emptyEmoji: {
    fontSize: 36,
    marginBottom: Spacing.two,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  emptySubtitle: {
    fontSize: 13,
    textAlign: 'center',
  },
});
