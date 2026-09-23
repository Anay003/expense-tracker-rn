export type ExpenseCategory =
  | 'food'
  | 'transport'
  | 'shopping'
  | 'bills'
  | 'entertainment'
  | 'salary'
  | 'investment'
  | 'health'
  | 'other';

export type ExpenseType = 'expense' | 'income';

export interface Expense {
  id: string;
  title: string;
  amount: number;
  category: ExpenseCategory;
  type: ExpenseType;
  date: string; // ISO date string e.g. "2026-09-17"
  note?: string;
}

export interface CategoryStat {
  category: ExpenseCategory;
  amount: number;
  percentage: number;
  count: number;
}

export interface ExpenseSummary {
  totalBalance: number;
  totalIncome: number;
  totalExpense: number;
  savingsRate: number;
  breakdown: CategoryStat[];
}

export interface ExpenseFilter {
  search?: string;
  category?: ExpenseCategory | 'all';
  type?: ExpenseType | 'all';
}

export type AppIconName =
  | 'food'
  | 'transport'
  | 'shopping'
  | 'bills'
  | 'entertainment'
  | 'salary'
  | 'investment'
  | 'health'
  | 'other'
  | 'lock'
  | 'balance'
  | 'income'
  | 'expense'
  | 'search'
  | 'close'
  | 'plus'
  | 'arrow-right'
  | 'empty'
  | 'shield-check'
  | 'bolt';

export interface CategoryMeta {
  label: string;
  icon: AppIconName;
  emoji: string;
  color: string;
}

export const CATEGORY_DETAILS: Record<ExpenseCategory, CategoryMeta> = {
  food: { label: 'Food & Dining', icon: 'food', emoji: '🍔', color: '#F59E0B' },
  transport: { label: 'Transportation', icon: 'transport', emoji: '🚗', color: '#3B82F6' },
  shopping: { label: 'Shopping', icon: 'shopping', emoji: '🛍️', color: '#EC4899' },
  bills: { label: 'Bills & Utilities', icon: 'bills', emoji: '⚡', color: '#8B5CF6' },
  entertainment: { label: 'Entertainment', icon: 'entertainment', emoji: '🎬', color: '#6366F1' },
  salary: { label: 'Salary & Earnings', icon: 'salary', emoji: '💰', color: '#10B981' },
  investment: { label: 'Investment & Dividends', icon: 'investment', emoji: '📈', color: '#06B6D4' },
  health: { label: 'Health & Wellness', icon: 'health', emoji: '💊', color: '#14B8A6' },
  other: { label: 'General / Misc', icon: 'other', emoji: '📦', color: '#64748B' },
};
