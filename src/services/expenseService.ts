import {
  Expense,
  ExpenseFilter,
  ExpenseSummary,
  ExpenseCategory,
  CategoryStat,
} from '@/types/expense';
import { API_BASE_URL } from '@/config/api';
import { logger } from './logger';
import { databaseService } from './databaseService';
import { tokenStorage } from './tokenStorage';

export interface IExpenseService {
  getAll(filter?: ExpenseFilter): Promise<Expense[]>;
  add(item: Omit<Expense, 'id'>): Promise<Expense>;
  delete(id: string): Promise<boolean>;
  getSummary(items?: Expense[]): Promise<ExpenseSummary>;
  subscribe(listener: () => void): () => void;
  sync(force?: boolean): Promise<void>;
  reset(): void;
}

/**
 * Enterprise Expense Service (Local-First Architecture)
 * 
 * Orchestrates between local SQLite persistence and the remote .NET backend.
 * - Authenticated with JWT Bearer tokens from hardware-backed tokenStorage.
 * - Reads are served instantly (0ms) from local SQLite, isolated per user.
 * - Network synchronization runs non-blockingly in the background.
 * - Writes are optimistic: saved locally first, then synced to .NET.
 */
class ExpenseService implements IExpenseService {
  private cachedItems: Expense[] = [];
  private inFlightFetch: Promise<Expense[]> | null = null;
  private listeners: Set<() => void> = new Set();
  private endpoint = `${API_BASE_URL}/expenses`;
  private isSyncing = false;
  private lastSyncTime = 0;
  private readonly SYNC_COOLDOWN_MS = 15000;

  /**
   * Resets in-memory cached state, in-flight promises, and sync cooldowns.
   * Call upon user logout or session switch to prevent cross-account cache leakage.
   */
  public reset(): void {
    this.cachedItems = [];
    this.inFlightFetch = null;
    this.isSyncing = false;
    this.lastSyncTime = 0;
    this.notify();
  }

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
   * Helper to build authenticated HTTP headers
   */
  private async getAuthHeaders(): Promise<Record<string, string>> {
    const token = await tokenStorage.getAccessToken();
    const headers: Record<string, string> = {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    return headers;
  }

  /**
   * GET /api/expenses with Local-First Strategy
   * 1. Returns local SQLite records immediately (< 5ms).
   * 2. Triggers background network sync with .NET backend (with cooldown).
   * 3. Updates SQLite and notifies UI only if server has newer data.
   */
  public async getAll(filter?: ExpenseFilter): Promise<Expense[]> {
    const cachedUser = await databaseService.getCachedUser();

    // Step 1: Ensure SQLite is loaded into memory if cache is empty
    if (this.cachedItems.length === 0) {
      try {
        const localRecords = await databaseService.getAll(cachedUser?.id);
        if (localRecords.length > 0) {
          this.cachedItems = localRecords;
          logger.info(`ExpenseService: Loaded ${localRecords.length} records instantly from SQLite`);
        }
      } catch (err) {
        logger.warn('ExpenseService: Failed to read local SQLite cache', err);
      }
    }

    // Step 2: Trigger background sync with .NET backend (debounced with cooldown)
    this.syncWithBackend(false).catch((err) => {
      logger.warn('ExpenseService: Background sync completed with warning', err);
    });

    // Step 3: Return local records immediately to UI
    return this.applyFilter(this.cachedItems, filter);
  }

  /**
   * Background Synchronization Worker
   * Fetches latest records from .NET API, merges into SQLite, and syncs pending offline creations.
   */
  public async sync(force: boolean = true): Promise<void> {
    return this.syncWithBackend(force);
  }

  private async syncWithBackend(force: boolean = false): Promise<void> {
    const now = Date.now();
    if (!force && now - this.lastSyncTime < this.SYNC_COOLDOWN_MS) {
      return;
    }

    if (this.isSyncing) return;
    this.isSyncing = true;
    this.lastSyncTime = now;

    try {
      // 1. Process any pending offline records first
      await this.flushPendingSync();

      // 2. Fetch latest data from .NET
      if (this.inFlightFetch) {
        await this.inFlightFetch;
        return;
      }

      this.inFlightFetch = (async () => {
        logger.http('GET', this.endpoint);
        const headers = await this.getAuthHeaders();

        const response = await fetch(this.endpoint, {
          method: 'GET',
          headers,
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const rawItems: any[] = await response.json();
        logger.httpSuccess('GET', this.endpoint, response.status, `Received ${rawItems.length} items`);

        // Normalize data from .NET
        const serverItems: Expense[] = rawItems.map((item) => ({
          id: String(item.id || item.Id || ''),
          title: item.title || item.Title || '',
          amount: Number(item.amount ?? item.Amount ?? 0),
          category: (item.category || item.Category || 'other').toLowerCase() as ExpenseCategory,
          type: (item.type || item.Type || 'expense').toLowerCase() as 'expense' | 'income',
          date: item.date || item.Date || new Date().toISOString().split('T')[0],
          note: item.note ?? item.Note ?? '',
        }));

        const cachedUser = await databaseService.getCachedUser();

        // Check if server items are actually different from current local cache
        const hasChanged =
          serverItems.length !== this.cachedItems.length ||
          JSON.stringify(serverItems) !== JSON.stringify(this.cachedItems);

        if (hasChanged) {
          // Write to SQLite atomically with user_id
          await databaseService.bulkUpsert(serverItems, cachedUser?.id);

          // Refresh in-memory cache from updated SQLite
          const updatedLocal = await databaseService.getAll(cachedUser?.id);
          this.cachedItems = updatedLocal;
          this.notify();
        }

        return this.cachedItems;
      })();

      await this.inFlightFetch;
    } catch (error) {
      logger.httpError(
        'GET',
        this.endpoint,
        0,
        `Backend unreachable (operating in offline SQLite mode): ${error instanceof Error ? error.message : String(error)}`
      );
    } finally {
      this.inFlightFetch = null;
      this.isSyncing = false;
    }
  }

  /**
   * Pushes any local transactions that were recorded while offline up to the backend.
   */
  private async flushPendingSync(): Promise<void> {
    try {
      const cachedUser = await databaseService.getCachedUser();
      const pendingItems = await databaseService.getPendingSync(cachedUser?.id);
      if (pendingItems.length === 0) return;

      logger.info(`ExpenseService: Syncing ${pendingItems.length} pending offline transactions...`);
      const headers = await this.getAuthHeaders();

      for (const item of pendingItems) {
        try {
          const response = await fetch(this.endpoint, {
            method: 'POST',
            headers,
            body: JSON.stringify({
              title: item.title,
              amount: item.amount,
              category: item.category,
              type: item.type,
              date: item.date,
              note: item.note,
            }),
          });

          if (response.ok) {
            const created = await response.json();
            const serverId = String(created.id || created.Id || item.id);

            // Reconcile temporary local ID with server ID if server generated a new one
            if (serverId !== item.id) {
              await databaseService.delete(item.id);
              await databaseService.upsert({ ...item, id: serverId }, cachedUser?.id, 1);
            } else {
              await databaseService.markSynced(item.id);
            }
          }
        } catch {
          // Leave pending if network is still down
          break;
        }
      }
    } catch (err) {
      logger.warn('ExpenseService: flushPendingSync error', err);
    }
  }

  private applyFilter(items: Expense[], filter?: ExpenseFilter): Expense[] {
    let result = [...items];

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
   * POST /api/expenses with Optimistic Local-First Write
   */
  public async add(item: Omit<Expense, 'id'>): Promise<Expense> {
    const tempId = `local_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const localExpense: Expense = {
      ...item,
      id: tempId,
    };

    const cachedUser = await databaseService.getCachedUser();

    // 1. Save to local SQLite immediately (marked as pending sync: 0)
    await databaseService.upsert(localExpense, cachedUser?.id, 0);
    this.cachedItems.unshift(localExpense);
    this.notify();

    // 2. Asynchronously sync to .NET backend
    (async () => {
      try {
        logger.http('POST', this.endpoint, item);
        const headers = await this.getAuthHeaders();

        const response = await fetch(this.endpoint, {
          method: 'POST',
          headers,
          body: JSON.stringify(item),
        });

        if (response.ok) {
          const created = await response.json();
          const serverId = String(created.id || created.Id || tempId);
          logger.httpSuccess('POST', this.endpoint, response.status, `Created expense with ID: ${serverId}`);

          if (serverId !== tempId) {
            await databaseService.delete(tempId);
            await databaseService.upsert({ ...localExpense, id: serverId }, cachedUser?.id, 1);
            const idx = this.cachedItems.findIndex((e) => e.id === tempId);
            if (idx !== -1) {
              this.cachedItems[idx] = { ...localExpense, id: serverId };
              this.notify();
            }
          } else {
            await databaseService.markSynced(tempId);
          }
        } else {
          logger.warn(`ExpenseService: Backend responded ${response.status} to POST; saved locally in SQLite`);
        }
      } catch (error) {
        logger.httpError(
          'POST',
          this.endpoint,
          0,
          `Saved locally in SQLite (will sync when online): ${error instanceof Error ? error.message : String(error)}`
        );
      }
    })();

    return localExpense;
  }

  /**
   * DELETE /api/expenses/{id}
   */
  public async delete(id: string): Promise<boolean> {
    // Optimistic local deletion
    const original = [...this.cachedItems];
    this.cachedItems = this.cachedItems.filter((e) => e.id !== id);
    this.notify();

    try {
      await databaseService.delete(id);
    } catch (err) {
      logger.error(`ExpenseService: Failed to delete ${id} from SQLite`, err);
    }

    try {
      logger.http('DELETE', `${this.endpoint}/${id}`);
      const headers = await this.getAuthHeaders();

      const response = await fetch(`${this.endpoint}/${id}`, {
        method: 'DELETE',
        headers,
      });

      if (!response.ok && response.status !== 404) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      logger.httpSuccess('DELETE', `${this.endpoint}/${id}`, response.status, `Deleted expense ID: ${id}`);
      return true;
    } catch (error) {
      logger.httpError(
        'DELETE',
        `${this.endpoint}/${id}`,
        0,
        `Backend offline; deleted locally from SQLite: ${error instanceof Error ? error.message : String(error)}`
      );
      return true;
    }
  }

  /**
   * Calculates financial summary metrics from cached expenses.
   */
  public async getSummary(items?: Expense[]): Promise<ExpenseSummary> {
    const list = items !== undefined ? items : await this.getAll();

    let totalIncome = 0;
    let totalExpense = 0;
    const categoryTotals: Record<ExpenseCategory, { amount: number; count: number }> = {
      food: { amount: 0, count: 0 },
      transport: { amount: 0, count: 0 },
      shopping: { amount: 0, count: 0 },
      bills: { amount: 0, count: 0 },
      entertainment: { amount: 0, count: 0 },
      salary: { amount: 0, count: 0 },
      investment: { amount: 0, count: 0 },
      health: { amount: 0, count: 0 },
      other: { amount: 0, count: 0 },
    };

    list.forEach((item) => {
      const amt = Number(item.amount) || 0;
      if (item.type === 'income') {
        totalIncome += amt;
      } else {
        totalExpense += amt;
      }

      const cat = item.category in categoryTotals ? item.category : 'other';
      categoryTotals[cat].amount += amt;
      categoryTotals[cat].count += 1;
    });

    const totalBalance = totalIncome - totalExpense;
    const savingsRate =
      totalIncome > 0
        ? Math.max(0, Math.round(((totalIncome - totalExpense) / totalIncome) * 100))
        : 0;

    const breakdown: CategoryStat[] = (
      Object.keys(categoryTotals) as ExpenseCategory[]
    )
      .map((cat) => {
        const { amount, count } = categoryTotals[cat];
        const percentage =
          totalExpense > 0 ? Math.round((amount / totalExpense) * 100) : 0;
        return { category: cat, amount, percentage, count };
      })
      .filter((s) => s.amount > 0)
      .sort((a, b) => b.amount - a.amount);

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
