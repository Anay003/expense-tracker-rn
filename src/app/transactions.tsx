import { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { HapticPressable } from '@/components/haptic-pressable';

import { useTheme } from '@/hooks/use-theme';
import { useExpenses } from '@/hooks/use-expenses';
import { TransactionItem } from '@/components/transaction-item';
import { AddExpenseModal } from '@/components/add-expense-modal';
import { AppIcon, CategoryIcon } from '@/components/app-icon';
import {
  ExpenseCategory,
  ExpenseType,
  CATEGORY_DETAILS,
} from '@/types/expense';
import { Spacing, MaxContentWidth, BottomTabInset } from '@/constants/theme';

const CATEGORIES: ExpenseCategory[] = [
  'food',
  'transport',
  'shopping',
  'bills',
  'entertainment',
  'salary',
  'investment',
  'health',
  'other',
];

export default function TransactionsScreen() {
  const theme = useTheme();
  const { expenses, loading, deleteExpense, refresh } = useExpenses();

  const [search, setSearch] = useState('');
  const [selectedType, setSelectedType] = useState<ExpenseType | 'all'>('all');
  const [selectedCategory, setSelectedCategory] = useState<
    ExpenseCategory | 'all'
  >('all');
  const [modalVisible, setModalVisible] = useState(false);

  const filteredExpenses = useMemo(() => {
    return expenses.filter((item) => {
      // Search text match
      if (search.trim()) {
        const query = search.toLowerCase().trim();
        const matchesTitle = item.title.toLowerCase().includes(query);
        const matchesNote = item.note?.toLowerCase().includes(query) ?? false;
        if (!matchesTitle && !matchesNote) return false;
      }

      // Type match
      if (selectedType !== 'all' && item.type !== selectedType) {
        return false;
      }

      // Category match
      if (selectedCategory !== 'all' && item.category !== selectedCategory) {
        return false;
      }

      return true;
    });
  }, [expenses, search, selectedType, selectedCategory]);

  const clearFilters = () => {
    setSearch('');
    setSelectedType('all');
    setSelectedCategory('all');
  };

  const hasActiveFilters =
    search.trim() !== '' ||
    selectedType !== 'all' ||
    selectedCategory !== 'all';

  return (
    <SafeAreaView
      edges={['top', 'left', 'right']}
      style={[styles.safeArea, { backgroundColor: theme.background }]}>
      <View style={styles.content}>
        {/* Top Header */}
        <View style={styles.header}>
          <View>
            <Text style={[styles.title, { color: theme.text }]}>
              Transactions
            </Text>
            <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
              {filteredExpenses.length} of {expenses.length} records
            </Text>
          </View>

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

        {/* Search Bar */}
        <View
          style={[
            styles.searchBox,
            {
              backgroundColor: theme.card,
              borderColor: theme.border,
            },
          ]}>
          <AppIcon
            name="search"
            size={16}
            color={theme.textSecondary}
            style={{ marginRight: Spacing.two }}
          />
          <TextInput
            style={[styles.searchInput, { color: theme.text }]}
            placeholder="Search transactions, notes..."
            placeholderTextColor={theme.textSecondary}
            value={search}
            onChangeText={setSearch}
          />
          {search.length > 0 && (
            <HapticPressable haptic="light" onPress={() => setSearch('')} hitSlop={8}>
              <AppIcon name="close" size={14} color={theme.textSecondary} />
            </HapticPressable>
          )}
        </View>

        {/* Type Filter Chips (All, Expense, Income) */}
        <View style={styles.typeFilterRow}>
          {(['all', 'expense', 'income'] as const).map((t) => {
            const isSelected = selectedType === t;
            return (
              <HapticPressable
                key={t}
                haptic="selection"
                onPress={() => setSelectedType(t)}
                style={[
                  styles.typeChip,
                  {
                    backgroundColor: isSelected
                      ? theme.accent
                      : theme.backgroundElement,
                  },
                ]}>
                <Text
                  style={[
                    styles.typeChipText,
                    {
                      color: isSelected ? '#FFFFFF' : theme.textSecondary,
                      fontWeight: isSelected ? '700' : '500',
                    },
                  ]}>
                  {t === 'all'
                    ? 'All'
                    : t.charAt(0).toUpperCase() + t.slice(1)}
                </Text>
              </HapticPressable>
            );
          })}
        </View>

        {/* Horizontal Category Scroll */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoryScroll}>
          <HapticPressable
            haptic="selection"
            onPress={() => setSelectedCategory('all')}
            style={[
              styles.catChip,
              {
                backgroundColor:
                  selectedCategory === 'all'
                    ? theme.accent
                    : theme.card,
                borderColor:
                  selectedCategory === 'all'
                    ? theme.accent
                    : theme.border,
              },
            ]}>
            <Text
              style={[
                styles.catChipText,
                {
                  color:
                    selectedCategory === 'all'
                      ? '#FFFFFF'
                      : theme.text,
                },
              ]}>
              All Categories
            </Text>
          </HapticPressable>

          {CATEGORIES.map((catKey) => {
            const meta = CATEGORY_DETAILS[catKey];
            const isSelected = selectedCategory === catKey;

            return (
              <HapticPressable
                key={catKey}
                haptic="selection"
                onPress={() => setSelectedCategory(catKey)}
                style={[
                  styles.catChip,
                  {
                    backgroundColor: isSelected ? meta.color : theme.card,
                    borderColor: isSelected ? meta.color : theme.border,
                  },
                ]}>
                <CategoryIcon
                  category={catKey}
                  size={14}
                  color={isSelected ? '#FFFFFF' : meta.color}
                  style={{ marginRight: 6 }}
                />
                <Text
                  style={[
                    styles.catChipText,
                    {
                      color: isSelected ? '#FFFFFF' : theme.text,
                      fontWeight: isSelected ? '700' : '500',
                    },
                  ]}>
                  {meta.label.split(' ')[0]}
                </Text>
              </HapticPressable>
            );
          })}
        </ScrollView>

        {/* Transactions List */}
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContainer}>
          {loading ? (
            <ActivityIndicator
              size="large"
              color={theme.accent}
              style={{ marginTop: Spacing.six }}
            />
          ) : filteredExpenses.length === 0 ? (
            <View
              style={[
                styles.emptyContainer,
                {
                  backgroundColor: theme.card,
                  borderColor: theme.border,
                },
              ]}>
              <AppIcon
                name="search"
                size={36}
                color={theme.textSecondary}
                style={{ marginBottom: Spacing.two }}
              />
              <Text style={[styles.emptyTitle, { color: theme.text }]}>
                No matching transactions
              </Text>
              <Text
                style={[styles.emptySubtitle, { color: theme.textSecondary }]}>
                Try adjusting your search query or filters.
              </Text>

              {hasActiveFilters && (
                <HapticPressable
                  haptic="selection"
                  onPress={clearFilters}
                  style={[styles.resetBtn, { backgroundColor: theme.accent }]}>
                  <Text style={styles.resetBtnText}>Clear All Filters</Text>
                </HapticPressable>
              )}
            </View>
          ) : (
            filteredExpenses.map((item) => (
              <TransactionItem
                key={item.id}
                item={item}
                onDelete={deleteExpense}
              />
            ))
          )}
        </ScrollView>
      </View>

      {/* Add Modal */}
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
  content: {
    flex: 1,
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.two,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.three,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 13,
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
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: Spacing.three,
    height: 48,
    marginBottom: Spacing.two,
  },
  searchIcon: {
    fontSize: 16,
    marginRight: Spacing.two,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    height: '100%',
  },
  clearBtn: {
    fontSize: 14,
    fontWeight: '700',
    padding: 4,
  },
  typeFilterRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: Spacing.two,
  },
  typeChip: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  typeChipText: {
    fontSize: 13,
  },
  categoryScroll: {
    paddingVertical: 4,
    gap: 8,
    marginBottom: Spacing.three,
  },
  catChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
    borderWidth: 1,
  },
  catChipEmoji: {
    fontSize: 13,
  },
  catChipText: {
    fontSize: 12,
  },
  listContainer: {
    paddingBottom: BottomTabInset + Spacing.six,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.six,
    borderRadius: 16,
    borderWidth: 1,
    marginTop: Spacing.four,
  },
  emptyEmoji: {
    fontSize: 36,
    marginBottom: Spacing.two,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  emptySubtitle: {
    fontSize: 13,
    textAlign: 'center',
    marginBottom: Spacing.four,
  },
  resetBtn: {
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.two,
    borderRadius: 12,
  },
  resetBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
  },
});
