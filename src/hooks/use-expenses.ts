import { useState, useEffect, useCallback } from 'react';
import { expenseService } from '@/services/expenseService';
import { Expense, ExpenseFilter, ExpenseSummary } from '@/types/expense';

export function useExpenses(initialFilter?: ExpenseFilter) {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [summary, setSummary] = useState<ExpenseSummary>({
    totalBalance: 0,
    totalIncome: 0,
    totalExpense: 0,
    savingsRate: 0,
    breakdown: [],
  });
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<ExpenseFilter | undefined>(initialFilter);

  const refresh = useCallback(async () => {
    try {
      const list = await expenseService.getAll(filter);
      const sum = await expenseService.getSummary(list);
      setExpenses(list);
      setSummary(sum);
    } catch (err) {
      console.error('Failed to load expenses', err);
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    refresh();
    const unsubscribe = expenseService.subscribe(() => {
      refresh();
    });
    return unsubscribe;
  }, [refresh]);

  const addExpense = useCallback(
    async (item: Omit<Expense, 'id'>) => {
      return await expenseService.add(item);
    },
    []
  );

  const deleteExpense = useCallback(async (id: string) => {
    return await expenseService.delete(id);
  }, []);

  return {
    expenses,
    summary,
    loading,
    filter,
    setFilter,
    refresh,
    addExpense,
    deleteExpense,
  };
}
