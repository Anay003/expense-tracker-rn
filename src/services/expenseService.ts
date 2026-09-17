import {
  Expense,
  ExpenseFilter,
  ExpenseSummary,
  ExpenseCategory,
  CategoryStat,
} from '@/types/expense';

/**
 * Service interface mirroring standard ASP.NET Core Web API endpoints:
 * - GET    /api/expenses
 * - GET    /api/expenses/{id}
 * - POST   /api/expenses
 * - DELETE /api/expenses/{id}
 * - GET    /api/expenses/summary
 */
export interface IExpenseService {
  getAll(filter?: ExpenseFilter): Promise<Expense[]>;
  getById(id: string): Promise<Expense | undefined>;
  add(item: Omit<Expense, 'id'>): Promise<Expense>;
  delete(id: string): Promise<boolean>;
  getSummary(): Promise<ExpenseSummary>;
  subscribe(listener: () => void): () => void;
}

const INITIAL_EXPENSES: Expense[] = [
  {
    id: 'exp-1',
    title: 'Monthly Salary',
    amount: 5200,
    category: 'salary',
    type: 'income',
    date: '2026-09-01',
    note: 'Tech Corp direct deposit',
  },
  {
    id: 'exp-2',
    title: 'Grocery Supermarket',
    amount: 142.5,
    category: 'food',
    type: 'expense',
    date: '2026-09-03',
    note: 'Weekly essentials and fruits',
  },
  {
    id: 'exp-3',
    title: 'Electricity & Water Bill',
    amount: 95.0,
    category: 'bills',
    type: 'expense',
    date: '2026-09-05',
    note: 'Apartment utilities',
  },
  {
    id: 'exp-4',
    title: 'Metro Transit Pass',
    amount: 60.0,
    category: 'transport',
    type: 'expense',
    date: '2026-09-08',
    note: 'Monthly city pass',
  },
  {
    id: 'exp-5',
    title: 'Freelance Design Project',
    amount: 850.0,
    category: 'salary',
    type: 'income',
    date: '2026-09-10',
    note: 'Landing page redesign client milestone',
  },
  {
    id: 'exp-6',
    title: 'New Mechanical Keyboard',
    amount: 120.0,
    category: 'shopping',
    type: 'expense',
    date: '2026-09-12',
    note: 'Work from home upgrade',
  },
  {
    id: 'exp-7',
    title: 'Cinema & Dinner with Friends',
    amount: 78.5,
    category: 'entertainment',
    type: 'expense',
    date: '2026-09-14',
    note: 'Weekend outing',
  },
  {
    id: 'exp-8',
    title: 'Stock Dividend Yield',
    amount: 145.0,
    category: 'investment',
    type: 'income',
    date: '2026-09-15',
    note: 'Quarterly index fund distribution',
  },
  {
    id: 'exp-9',
    title: 'Pharmacy & Vitamins',
    amount: 34.0,
    category: 'health',
    type: 'expense',
    date: '2026-09-16',
    note: 'Health supplements',
  },
];

class ExpenseService implements IExpenseService {
  private items: Expense[] = [...INITIAL_EXPENSES];
  private listeners: Set<() => void> = new Set();

  public subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify(): void {
    this.listeners.forEach((listener) => {
      try {
        listener();
      } catch (err) {
        console.error('Error executing expense listener', err);
      }
    });
  }

  /**
   * Future .NET API integration:
   * const res = await fetch('http://<api-host>:5000/api/expenses', ...);
   * return await res.json();
   */
  public async getAll(filter?: ExpenseFilter): Promise<Expense[]> {
    let result = [...this.items];

    if (filter?.search && filter.search.trim().length > 0) {
      const q = filter.search.toLowerCase().trim();
      result = result.filter(
        (e) =>
          e.title.toLowerCase().includes(q) ||
          (e.note && e.note.toLowerCase().includes(q))
      );
    }

    if (filter?.category && filter.category !== 'all') {
      result = result.filter((e) => e.category === filter.category);
    }

    if (filter?.type && filter.type !== 'all') {
      result = result.filter((e) => e.type === filter.type);
    }

    // Sort descending by date
    return result.sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );
  }

  public async getById(id: string): Promise<Expense | undefined> {
    return this.items.find((item) => item.id === id);
  }

  /**
   * Future .NET API integration:
   * const res = await fetch('http://<api-host>:5000/api/expenses', {
   *   method: 'POST',
   *   headers: { 'Content-Type': 'application/json' },
   *   body: JSON.stringify(item),
   * });
   * return await res.json();
   */
  public async add(item: Omit<Expense, 'id'>): Promise<Expense> {
    const newItem: Expense = {
      ...item,
      id: `exp-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    };
    this.items.unshift(newItem);
    this.notify();
    return newItem;
  }

  /**
   * Future .NET API integration:
   * await fetch(`http://<api-host>:5000/api/expenses/${id}`, { method: 'DELETE' });
   */
  public async delete(id: string): Promise<boolean> {
    const initialLen = this.items.length;
    this.items = this.items.filter((item) => item.id !== id);
    if (this.items.length !== initialLen) {
      this.notify();
      return true;
    }
    return false;
  }

  public async getSummary(): Promise<ExpenseSummary> {
    let totalIncome = 0;
    let totalExpense = 0;
    const categoryTotals: Partial<Record<ExpenseCategory, { amount: number; count: number }>> = {};

    for (const item of this.items) {
      if (item.type === 'income') {
        totalIncome += item.amount;
      } else {
        totalExpense += item.amount;
        if (!categoryTotals[item.category]) {
          categoryTotals[item.category] = { amount: 0, count: 0 };
        }
        categoryTotals[item.category]!.amount += item.amount;
        categoryTotals[item.category]!.count += 1;
      }
    }

    const breakdown: CategoryStat[] = Object.entries(categoryTotals).map(
      ([category, data]) => ({
        category: category as ExpenseCategory,
        amount: data!.amount,
        percentage:
          totalExpense > 0
            ? Math.round((data!.amount / totalExpense) * 100)
            : 0,
        count: data!.count,
      })
    );

    // Sort highest spending first
    breakdown.sort((a, b) => b.amount - a.amount);

    const totalBalance = totalIncome - totalExpense;
    const savingsRate =
      totalIncome > 0
        ? Math.max(0, Math.round(((totalIncome - totalExpense) / totalIncome) * 100))
        : 0;

    return {
      totalBalance,
      totalIncome,
      totalExpense,
      savingsRate,
      breakdown,
    };
  }
}

export const expenseService: IExpenseService = new ExpenseService();
