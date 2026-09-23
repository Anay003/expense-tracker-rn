import * as SQLite from 'expo-sqlite';
import { Platform } from 'react-native';
import { Expense, ExpenseCategory, ExpenseFilter, ExpenseType } from '@/types/expense';
import { User } from '@/types/auth';
import { logger } from './logger';

export interface IDatabaseService {
  init(): Promise<void>;
  getAll(userId?: string, filter?: ExpenseFilter): Promise<Expense[]>;
  getById(id: string): Promise<Expense | null>;
  upsert(expense: Expense, userId?: string, syncStatus?: number): Promise<void>;
  delete(id: string): Promise<void>;
  bulkUpsert(expenses: Expense[], userId?: string): Promise<void>;
  getPendingSync(userId?: string): Promise<Expense[]>;
  markSynced(id: string): Promise<void>;
  clearAll(): Promise<void>;
  saveUser(user: User): Promise<void>;
  getCachedUser(): Promise<User | null>;
  clearUser(): Promise<void>;
}

/**
 * Enterprise Local-First SQLite Database Service
 * 
 * Provides high-speed, local persistence for transactions and user profiles.
 * Implements multi-tenant user isolation (user_id) and runs in WAL mode.
 */
class DatabaseService implements IDatabaseService {
  private db: SQLite.SQLiteDatabase | null = null;
  private isInitialized = false;
  private initPromise: Promise<void> | null = null;

  /**
   * Initializes the SQLite database and executes migrations if needed.
   * Safe to call multiple times; will reuse in-flight initialization.
   */
  public async init(): Promise<void> {
    if (this.isInitialized && this.db) {
      return;
    }

    if (this.initPromise) {
      return this.initPromise;
    }

    this.initPromise = (async () => {
      if (Platform.OS === 'web') {
        logger.info('DatabaseService: Skipping native SQLite on web platform');
        this.isInitialized = true;
        return;
      }

      try {
        logger.info('DatabaseService: Initializing expenses.db...');
        this.db = await SQLite.openDatabaseAsync('expenses.db');

        // Configure WAL mode for fast writes and non-blocking reads
        await this.db.execAsync(`
          PRAGMA journal_mode = WAL;

          CREATE TABLE IF NOT EXISTS users (
            id TEXT PRIMARY KEY NOT NULL,
            name TEXT NOT NULL,
            email TEXT NOT NULL
          );

          CREATE TABLE IF NOT EXISTS expenses (
            id TEXT PRIMARY KEY NOT NULL,
            user_id TEXT,
            title TEXT NOT NULL,
            amount REAL NOT NULL,
            category TEXT NOT NULL,
            type TEXT NOT NULL,
            date TEXT NOT NULL,
            note TEXT,
            sync_status INTEGER DEFAULT 1,
            created_at TEXT DEFAULT (datetime('now'))
          );

          CREATE INDEX IF NOT EXISTS idx_expenses_date ON expenses (date DESC);
          CREATE INDEX IF NOT EXISTS idx_expenses_sync ON expenses (sync_status);
        `);

        // Migration: Ensure user_id column exists if table was created in an older migration
        try {
          await this.db.execAsync(`
            ALTER TABLE expenses ADD COLUMN user_id TEXT;
          `);
        } catch {
          // Column already exists, safe to ignore
        }

        try {
          await this.db.execAsync(`
            CREATE INDEX IF NOT EXISTS idx_expenses_user ON expenses (user_id);
          `);
        } catch {
          // Index creation safe
        }

        this.isInitialized = true;
        logger.info('DatabaseService: SQLite initialized successfully with multi-tenant support');
      } catch (error) {
        logger.error('DatabaseService: Failed to initialize SQLite database', error);
        throw error;
      } finally {
        this.initPromise = null;
      }
    })();

    return this.initPromise;
  }

  private async ensureDatabase(): Promise<SQLite.SQLiteDatabase | null> {
    if (!this.isInitialized) {
      await this.init();
    }
    return this.db;
  }

  /**
   * Retrieves all expenses from local SQLite, matching optional filters and scoped by user_id.
   */
  public async getAll(userId?: string, filter?: ExpenseFilter): Promise<Expense[]> {
    const db = await this.ensureDatabase();
    if (!db) return [];

    try {
      let query = `
        SELECT id, title, amount, category, type, date, note 
        FROM expenses 
        WHERE 1=1
      `;
      const params: any[] = [];

      if (userId) {
        query += ' AND (user_id = ? OR user_id IS NULL)';
        params.push(userId);
      }

      if (filter?.category && filter.category !== 'all') {
        query += ' AND category = ?';
        params.push(filter.category);
      }

      if (filter?.type && filter.type !== 'all') {
        query += ' AND type = ?';
        params.push(filter.type);
      }

      if (filter?.search && filter.search.trim().length > 0) {
        query += ' AND (LOWER(title) LIKE ? OR LOWER(COALESCE(note, "")) LIKE ?)';
        const pattern = `%${filter.search.toLowerCase().trim()}%`;
        params.push(pattern, pattern);
      }

      query += ' ORDER BY date DESC, created_at DESC';

      const rows = await db.getAllAsync<any>(query, params);

      return rows.map((r) => ({
        id: String(r.id),
        title: String(r.title),
        amount: Number(r.amount),
        category: String(r.category) as ExpenseCategory,
        type: String(r.type) as ExpenseType,
        date: String(r.date),
        note: r.note ? String(r.note) : undefined,
      }));
    } catch (error) {
      logger.error('DatabaseService.getAll failed', error);
      return [];
    }
  }

  /**
   * Retrieves a single expense by ID.
   */
  public async getById(id: string): Promise<Expense | null> {
    const db = await this.ensureDatabase();
    if (!db) return null;

    try {
      const row = await db.getFirstAsync<any>(
        'SELECT id, title, amount, category, type, date, note FROM expenses WHERE id = ?;',
        [id]
      );

      if (!row) return null;

      return {
        id: String(row.id),
        title: String(row.title),
        amount: Number(row.amount),
        category: String(row.category) as ExpenseCategory,
        type: String(row.type) as ExpenseType,
        date: String(row.date),
        note: row.note ? String(row.note) : undefined,
      };
    } catch (error) {
      logger.error(`DatabaseService.getById(${id}) failed`, error);
      return null;
    }
  }

  /**
   * Inserts or updates an expense in SQLite with user ownership.
   */
  public async upsert(expense: Expense, userId?: string, syncStatus: number = 1): Promise<void> {
    const db = await this.ensureDatabase();
    if (!db) return;

    try {
      await db.runAsync(
        `INSERT INTO expenses (id, user_id, title, amount, category, type, date, note, sync_status)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
         ON CONFLICT(id) DO UPDATE SET
           user_id = COALESCE(excluded.user_id, expenses.user_id),
           title = excluded.title,
           amount = excluded.amount,
           category = excluded.category,
           type = excluded.type,
           date = excluded.date,
           note = excluded.note,
           sync_status = excluded.sync_status;`,
        [
          expense.id,
          userId ?? null,
          expense.title,
          expense.amount,
          expense.category,
          expense.type,
          expense.date,
          expense.note ?? null,
          syncStatus,
        ]
      );
    } catch (error) {
      logger.error(`DatabaseService.upsert(${expense.id}) failed`, error);
      throw error;
    }
  }

  /**
   * Deletes an expense by its unique ID.
   */
  public async delete(id: string): Promise<void> {
    const db = await this.ensureDatabase();
    if (!db) return;

    try {
      await db.runAsync('DELETE FROM expenses WHERE id = ?;', [id]);
    } catch (error) {
      logger.error(`DatabaseService.delete(${id}) failed`, error);
      throw error;
    }
  }

  /**
   * Atomically bulk upserts an array of expenses inside a single database transaction.
   */
  public async bulkUpsert(expenses: Expense[], userId?: string): Promise<void> {
    const db = await this.ensureDatabase();
    if (!db || expenses.length === 0) return;

    try {
      await db.withTransactionAsync(async () => {
        for (const item of expenses) {
          await db.runAsync(
            `INSERT INTO expenses (id, user_id, title, amount, category, type, date, note, sync_status)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1)
             ON CONFLICT(id) DO UPDATE SET
               user_id = COALESCE(excluded.user_id, expenses.user_id),
               title = excluded.title,
               amount = excluded.amount,
               category = excluded.category,
               type = excluded.type,
               date = excluded.date,
               note = excluded.note,
               sync_status = 1;`,
            [
              item.id,
              userId ?? null,
              item.title,
              item.amount,
              item.category,
              item.type,
              item.date,
              item.note ?? null,
            ]
          );
        }
      });
      logger.info(`DatabaseService: Bulk upserted ${expenses.length} records into SQLite`);
    } catch (error) {
      logger.error('DatabaseService.bulkUpsert failed', error);
      throw error;
    }
  }

  /**
   * Retrieves any local transactions that haven't been synchronized with the backend yet.
   */
  public async getPendingSync(userId?: string): Promise<Expense[]> {
    const db = await this.ensureDatabase();
    if (!db) return [];

    try {
      let query = 'SELECT id, title, amount, category, type, date, note FROM expenses WHERE sync_status = 0';
      const params: any[] = [];

      if (userId) {
        query += ' AND (user_id = ? OR user_id IS NULL)';
        params.push(userId);
      }

      const rows = await db.getAllAsync<any>(query, params);

      return rows.map((r) => ({
        id: String(r.id),
        title: String(r.title),
        amount: Number(r.amount),
        category: String(r.category) as ExpenseCategory,
        type: String(r.type) as ExpenseType,
        date: String(r.date),
        note: r.note ? String(r.note) : undefined,
      }));
    } catch (error) {
      logger.error('DatabaseService.getPendingSync failed', error);
      return [];
    }
  }

  /**
   * Marks a transaction as successfully synced to the backend.
   */
  public async markSynced(id: string): Promise<void> {
    const db = await this.ensureDatabase();
    if (!db) return;

    try {
      await db.runAsync('UPDATE expenses SET sync_status = 1 WHERE id = ?;', [id]);
    } catch (error) {
      logger.error(`DatabaseService.markSynced(${id}) failed`, error);
    }
  }

  /**
   * Clears all local expenses from SQLite.
   */
  public async clearAll(): Promise<void> {
    const db = await this.ensureDatabase();
    if (!db) return;

    try {
      await db.runAsync('DELETE FROM expenses;');
      logger.info('DatabaseService: All expenses cleared from SQLite');
    } catch (error) {
      logger.error('DatabaseService.clearAll failed', error);
    }
  }

  /**
   * Caches active user profile locally for instant offline greeting.
   */
  public async saveUser(user: User): Promise<void> {
    const db = await this.ensureDatabase();
    if (!db) return;

    try {
      await db.runAsync(
        `INSERT INTO users (id, name, email) VALUES (?, ?, ?)
         ON CONFLICT(id) DO UPDATE SET name = excluded.name, email = excluded.email;`,
        [user.id, user.name, user.email]
      );
    } catch (error) {
      logger.error('DatabaseService.saveUser failed', error);
    }
  }

  /**
   * Retrieves the locally cached user profile.
   */
  public async getCachedUser(): Promise<User | null> {
    const db = await this.ensureDatabase();
    if (!db) return null;

    try {
      const row = await db.getFirstAsync<any>('SELECT id, name, email FROM users LIMIT 1;');
      if (!row) return null;
      return {
        id: String(row.id),
        name: String(row.name),
        email: String(row.email),
      };
    } catch (error) {
      logger.error('DatabaseService.getCachedUser failed', error);
      return null;
    }
  }

  /**
   * Clears cached user profile on logout.
   */
  public async clearUser(): Promise<void> {
    const db = await this.ensureDatabase();
    if (!db) return;

    try {
      await db.runAsync('DELETE FROM users;');
    } catch (error) {
      logger.error('DatabaseService.clearUser failed', error);
    }
  }
}

export const databaseService: IDatabaseService = new DatabaseService();
