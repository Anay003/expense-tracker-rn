import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useTheme } from '@/hooks/use-theme';
import { useExpenses } from '@/hooks/use-expenses';
import { CategoryBreakdown } from '@/components/category-breakdown';
import { CATEGORY_DETAILS } from '@/types/expense';
import { Spacing, MaxContentWidth, BottomTabInset } from '@/constants/theme';

export default function AnalyticsScreen() {
  const theme = useTheme();
  const { summary, expenses } = useExpenses();

  const topCategoryStat = summary.breakdown.length > 0 ? summary.breakdown[0] : null;
  const topCategoryMeta = topCategoryStat
    ? CATEGORY_DETAILS[topCategoryStat.category]
    : null;

  const totalExpenseFormatted = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(summary.totalExpense);

  const totalIncomeFormatted = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(summary.totalIncome);

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
            <Text style={[styles.title, { color: theme.text }]}>
              Financial Insights
            </Text>
            <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
              Spending breakdown & architecture
            </Text>
          </View>

          {/* Quick Stats Grid */}
          <View style={styles.statsGrid}>
            <View
              style={[
                styles.statBox,
                {
                  backgroundColor: theme.card,
                  borderColor: theme.border,
                },
              ]}>
              <Text style={styles.statEmoji}>🎯</Text>
              <Text
                style={[styles.statLabel, { color: theme.textSecondary }]}>
                Savings Rate
              </Text>
              <Text style={[styles.statValue, { color: theme.income }]}>
                {summary.savingsRate}%
              </Text>
            </View>

            <View
              style={[
                styles.statBox,
                {
                  backgroundColor: theme.card,
                  borderColor: theme.border,
                },
              ]}>
              <Text style={styles.statEmoji}>
                {topCategoryMeta ? topCategoryMeta.emoji : '📊'}
              </Text>
              <Text
                style={[styles.statLabel, { color: theme.textSecondary }]}>
                Top Expense
              </Text>
              <Text
                numberOfLines={1}
                style={[styles.statValue, { color: theme.text }]}>
                {topCategoryMeta ? topCategoryMeta.label.split(' ')[0] : 'None'}
              </Text>
            </View>

            <View
              style={[
                styles.statBox,
                {
                  backgroundColor: theme.card,
                  borderColor: theme.border,
                },
              ]}>
              <Text style={styles.statEmoji}>🧾</Text>
              <Text
                style={[styles.statLabel, { color: theme.textSecondary }]}>
                Total Items
              </Text>
              <Text style={[styles.statValue, { color: theme.text }]}>
                {expenses.length}
              </Text>
            </View>
          </View>

          {/* Cashflow Summary Card */}
          <View
            style={[
              styles.cashflowCard,
              {
                backgroundColor: theme.card,
                borderColor: theme.border,
              },
            ]}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>
              Net Cashflow
            </Text>
            <View style={styles.cashflowRow}>
              <View>
                <Text
                  style={[styles.cashflowLabel, { color: theme.textSecondary }]}>
                  Earned
                </Text>
                <Text style={[styles.cashflowIncome, { color: theme.income }]}>
                  {totalIncomeFormatted}
                </Text>
              </View>
              <View style={styles.divider} />
              <View>
                <Text
                  style={[styles.cashflowLabel, { color: theme.textSecondary }]}>
                  Spent
                </Text>
                <Text
                  style={[styles.cashflowExpense, { color: theme.expense }]}>
                  {totalExpenseFormatted}
                </Text>
              </View>
            </View>
          </View>

          {/* Category Breakdown Progress Bars */}
          <View style={styles.section}>
            <CategoryBreakdown stats={summary.breakdown} />
          </View>

          {/* .NET Backend Integration Guide Card */}
          <View
            style={[
              styles.backendCard,
              {
                backgroundColor: theme.backgroundElement,
                borderColor: theme.border,
              },
            ]}>
            <View style={styles.backendHeader}>
              <Text style={styles.backendEmoji}>🚀</Text>
              <Text style={[styles.backendTitle, { color: theme.text }]}>
                Ready for .NET Web API
              </Text>
            </View>

            <Text
              style={[styles.backendDescription, { color: theme.textSecondary }]}>
              This frontend connects to an abstract repository layer (
              <Text style={{ fontWeight: '700' }}>IExpenseService</Text>). When
              you are ready to add your ASP.NET Core backend, simply plug in
              your endpoints:
            </Text>

            <View
              style={[
                styles.codeBlock,
                { backgroundColor: theme.card, borderColor: theme.border },
              ]}>
              <Text style={[styles.codeText, { color: theme.accent }]}>
                GET /api/expenses → returns Expense[]
              </Text>
              <Text style={[styles.codeText, { color: theme.accent }]}>
                POST /api/expenses → creates new Expense
              </Text>
              <Text style={[styles.codeText, { color: theme.accent }]}>
                DELETE /api/expenses/&#123;id&#125; → removes record
              </Text>
              <Text style={[styles.codeText, { color: theme.accent }]}>
                GET /api/expenses/summary → returns totals
              </Text>
            </View>

            <Text style={[styles.backendNote, { color: theme.textSecondary }]}>
              File to update:{' '}
              <Text style={{ fontWeight: '600' }}>
                src/services/expenseService.ts
              </Text>
            </Text>
          </View>
        </View>
      </ScrollView>
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
    marginBottom: Spacing.four,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 13,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: Spacing.two,
    marginBottom: Spacing.three,
  },
  statBox: {
    flex: 1,
    padding: Spacing.three,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
  },
  statEmoji: {
    fontSize: 20,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  statValue: {
    fontSize: 16,
    fontWeight: '700',
    marginTop: 2,
  },
  cashflowCard: {
    padding: Spacing.four,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: Spacing.three,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: Spacing.two,
  },
  cashflowRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  cashflowLabel: {
    fontSize: 12,
    fontWeight: '500',
  },
  cashflowIncome: {
    fontSize: 18,
    fontWeight: '700',
    marginTop: 2,
  },
  cashflowExpense: {
    fontSize: 18,
    fontWeight: '700',
    marginTop: 2,
  },
  divider: {
    width: 1,
    height: 36,
    backgroundColor: '#E2E8F0',
  },
  section: {
    marginBottom: Spacing.three,
  },
  backendCard: {
    padding: Spacing.four,
    borderRadius: 16,
    borderWidth: 1,
    marginTop: Spacing.two,
  },
  backendHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    marginBottom: Spacing.two,
  },
  backendEmoji: {
    fontSize: 20,
  },
  backendTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  backendDescription: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: Spacing.two,
  },
  codeBlock: {
    padding: Spacing.three,
    borderRadius: 10,
    borderWidth: 1,
    gap: 4,
    marginBottom: Spacing.two,
  },
  codeText: {
    fontSize: 12,
    fontFamily: 'monospace',
    fontWeight: '600',
  },
  backendNote: {
    fontSize: 12,
    fontStyle: 'italic',
  },
});
