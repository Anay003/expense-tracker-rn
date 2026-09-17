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

export interface CategoryMeta {
  label: string;
  emoji: string;
  color: string;
}

export const CATEGORY_DETAILS: Record<ExpenseCategory, CategoryMeta> = {
  food: { label: 'Food & Dining', emoji: '🍔', color: '#F59E0B' },
  transport: { label: 'Transportation', emoji: '🚗', color: '#3B82F6' },
  shopping: { label: 'Shopping', emoji: '🛍️', color: '#EC4899' },
  bills: { label: 'Bills & Utilities', emoji: '⚡', color: '#8B5CF6' },
  entertainment: { label: 'Entertainment', emoji: '🎬', color: '#6366F1' },
  salary: { label: 'Salary & Earnings', emoji: '💰', color: '#10B981' },
  investment: { label: 'Investment & Dividends', emoji: '📈', color: '#06B6D4' },
  health: { label: 'Health & Wellness', emoji: '💊', color: '#14B8A6' },
  other: { label: 'General / Misc', emoji: '📦', color: '#64748B' },
};
