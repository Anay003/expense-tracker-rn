import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

import { useTheme } from '@/hooks/use-theme';
import { useExpenses } from '@/hooks/use-expenses';
import { useAuth } from '@/context/auth-context';
import { StatCard } from '@/components/stat-card';
import { TransactionItem } from '@/components/transaction-item';
import { AddExpenseModal } from '@/components/add-expense-modal';
import { HapticPressable } from '@/components/haptic-pressable';
import { AppIcon } from '@/components/app-icon';
import { Spacing, MaxContentWidth, BottomTabInset } from '@/constants/theme';

export default function DashboardScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { expenses, summary, loading, deleteExpense, refresh } = useExpenses();
  const { user, logout } = useAuth();
  const [modalVisible, setModalVisible] = useState(false);

  const handleLogout = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out? Your offline data is safely stored.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            await logout();
            refresh();
          },
        },
      ]
    );
  };

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
            <View style={{ flex: 1 }}>
              <Text style={[styles.greeting, { color: theme.textSecondary }]}>
                {user?.name ? `Hi, ${user.name} 👋` : 'Welcome back 👋'}
              </Text>
              <Text style={[styles.appTitle, { color: theme.text }]}>
                Expense Tracker
              </Text>
            </View>

            <View style={styles.headerActions}>
              <HapticPressable
                haptic="light"
                onPress={handleLogout}
                style={({ pressed }) => [
                  styles.iconBtn,
                  { backgroundColor: theme.backgroundElement, borderColor: theme.border },
                  pressed && { opacity: 0.8 },
                ]}>
                <AppIcon name="log-out" size={18} color={theme.textSecondary} />
              </HapticPressable>

              <HapticPressable
                haptic="medium"
                onPress={() => setModalVisible(true)}
                style={({ pressed }) => [
                  styles.addBtn,
                  { backgroundColor: theme.accent },
                  pressed && { opacity: 0.8 },
                ]}>
                <Text style={styles.addBtnText}>+ Add</Text>
              </HapticPressable>
            </View>
          </View>

          {/* Balance Card */}
          <View style={styles.section}>
            <StatCard
              title="Total Balance"
              amount={summary.totalBalance}
              type="balance"
              subtitle={`Savings Rate: ${summary.savingsRate}%`}
              icon="balance"
            />
          </View>

          {/* Income & Expense Row */}
          <View style={styles.statsRow}>
            <StatCard
              title="Income"
              amount={summary.totalIncome}
              type="income"
              icon="income"
            />
            <StatCard
              title="Expenses"
              amount={summary.totalExpense}
              type="expense"
              icon="expense"
            />
          </View>

          {/* Quick CTA Banner */}
          <HapticPressable
            haptic="light"
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
              <AppIcon name="bolt" size={20} color={theme.accent} />
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
            <AppIcon name="arrow-right" size={18} color={theme.accent} />
          </HapticPressable>

          {/* Recent Transactions Header */}
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>
              Recent Transactions
            </Text>
            {expenses.length > 5 && (
              <HapticPressable
                haptic="selection"
                onPress={() => router.push('/transactions' as any)}
                hitSlop={8}>
                <Text style={[styles.viewAllText, { color: theme.accent }]}>
                  View All ({expenses.length})
                </Text>
              </HapticPressable>
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
              <AppIcon name="empty" size={36} color={theme.textSecondary} style={{ marginBottom: Spacing.two }} />
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
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  iconBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
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
