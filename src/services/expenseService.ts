import {
  Expense,
  ExpenseFilter,
  ExpenseSummary,
  ExpenseCategory,
  CategoryStat,
} from '@/types/expense';
import { API_BASE_URL } from '@/config/api';
import { logger } from './logger';

export interface IExpenseService {
  getAll(filter?: ExpenseFilter): Promise<Expense[]>;
  add(item: Omit<Expense, 'id'>): Promise<Expense>;
  delete(id: string): Promise<boolean>;
  getSummary(items?: Expense[]): Promise<ExpenseSummary>;
  subscribe(listener: () => void): () => void;
}

class ExpenseService implements IExpenseService {
  private cachedItems: Expense[] = [];
  private inFlightFetch: Promise<Expense[]> | null = null;
  private listeners: Set<() => void> = new Set();
  private endpoint = `${API_BASE_URL}/expenses`;

  public subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify(): void {
    this.listeners.forEach((listener) => {
      try {
        listener();
      } catch (err) {
        logger.error('Error executing expense listener callback', err);
      }
    });
  }

  /**
   * GET /api/expenses
   */
  public async getAll(filter?: ExpenseFilter): Promise<Expense[]> {
    if (this.inFlightFetch) {
      const items = await this.inFlightFetch;
      return this.applyFilter(items, filter);
    }

    this.inFlightFetch = (async () => {
      logger.http('GET', this.endpoint);

      try {
        const response = await fetch(this.endpoint, {
          method: 'GET',
          headers: {
            Accept: 'application/json',
          },
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const rawItems: any[] = await response.json();
        logger.httpSuccess('GET', this.endpoint, response.status, `Received ${rawItems.length} items`);

        // Normalize data from .NET
        this.cachedItems = rawItems.map((item) => ({
          id: String(item.id || item.Id || ''),
          title: item.title || item.Title || '',
          amount: Number(item.amount ?? item.Amount ?? 0),
          category: (item.category || item.Category || 'other').toLowerCase() as ExpenseCategory,
          type: (item.type || item.Type || 'expense').toLowerCase() as 'expense' | 'income',
          date: item.date || item.Date || new Date().toISOString().split('T')[0],
          note: item.note ?? item.Note ?? '',
        }));

        return this.cachedItems;
      } catch (error) {
        logger.httpError(
          'GET',
          this.endpoint,
          0,
          `Failed to reach .NET backend: ${error instanceof Error ? error.message : String(error)}`
        );
        if (this.cachedItems.length === 0) {
          throw error;
        }
        return this.cachedItems;
      } finally {
        this.inFlightFetch = null;
      }
    })();

    const items = await this.inFlightFetch;
    return this.applyFilter(items, filter);
  }

  private applyFilter(items: Expense[], filter?: ExpenseFilter): Expense[] {
    let result = [...items];

    // Client-side filtering
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

    return result.sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );
  }

  /**
   * POST /api/expenses
   */
  public async add(item: Omit<Expense, 'id'>): Promise<Expense> {
    logger.http('POST', this.endpoint, item);

    const response = await fetch(this.endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify(item),
    });

    if (!response.ok) {
      const errorText = await response.text();
      logger.httpError('POST', this.endpoint, response.status, errorText);
      throw new Error(`HTTP ${response.status}: ${errorText || response.statusText}`);
    }

    const createdItem = await response.json();
    const normalized: Expense = {
      id: String(createdItem.id || createdItem.Id),
      title: createdItem.title || createdItem.Title,
      amount: Number(createdItem.amount ?? createdItem.Amount),
      category: (createdItem.category || createdItem.Category).toLowerCase() as ExpenseCategory,
      type: (createdItem.type || createdItem.Type).toLowerCase() as 'expense' | 'income',
      date: createdItem.date || createdItem.Date,
      note: createdItem.note ?? createdItem.Note,
    };

    logger.httpSuccess('POST', this.endpoint, response.status, `Created ID: ${normalized.id}`);
    this.cachedItems.unshift(normalized);
    this.notify();
    return normalized;
  }

  /**
   * DELETE /api/expenses/{id}
   */
  public async delete(id: string): Promise<boolean> {
    const url = `${this.endpoint}/${id}`;
    logger.http('DELETE', url);

    const response = await fetch(url, {
      method: 'DELETE',
    });

    if (response.status === 204 || response.ok) {
      logger.httpSuccess('DELETE', url, response.status, `Deleted ID: ${id}`);
      this.cachedItems = this.cachedItems.filter((e) => e.id !== id);
      this.notify();
      return true;
    }

    logger.httpError('DELETE', url, response.status, 'Delete failed');
    return false;
  }

  /**
   * Aggregates summary stats directly from current expenses in memory
   * (Zero duplicate network calls)
   */
  public async getSummary(items?: Expense[]): Promise<ExpenseSummary> {
    let sourceItems = items ?? this.cachedItems;
    if (!items && this.cachedItems.length === 0) {
      sourceItems = await this.getAll();
    }

    let totalIncome = 0;
    let totalExpense = 0;
    const categoryTotals: Partial<Record<ExpenseCategory, { amount: number; count: number }>> = {};

    for (const item of sourceItems) {
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
