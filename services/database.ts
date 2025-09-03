import SQLite from 'react-native-sqlite-storage';

// Enable debug mode
SQLite.DEBUG(true);
SQLite.enablePromise(true);

const database_name = "ManifestationJournal.db";
const database_version = "1.0";
const database_displayname = "Manifestation Journal SQLite Database";
const database_size = 200000;

export interface JournalEntry {
  id: number;
  title: string;
  content: string;
  mood: string;
  category: string;
  created_at: string;
  updated_at: string;
}

export interface JournalPrompt {
  id: number;
  category: string;
  title: string;
  prompt: string;
}

class DatabaseService {
  private db: SQLite.SQLiteDatabase | null = null;

  async initDB(): Promise<SQLite.SQLiteDatabase> {
    try {
      this.db = await SQLite.openDatabase(
        database_name,
        database_version,
        database_displayname,
        database_size
      );
      
      await this.createTables();
      await this.insertDefaultPrompts();
      return this.db;
    } catch (error) {
      console.error('Database initialization failed:', error);
      throw error;
    }
  }

  private async createTables(): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    // Create journal_entries table
    const createJournalTable = `
      CREATE TABLE IF NOT EXISTS journal_entries (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        content TEXT NOT NULL,
        mood TEXT NOT NULL,
        category TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `;

    // Create journal_prompts table
    const createPromptsTable = `
      CREATE TABLE IF NOT EXISTS journal_prompts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        category TEXT NOT NULL,
        title TEXT NOT NULL,
        prompt TEXT NOT NULL
      );
    `;

    await this.db.executeSql(createJournalTable);
    await this.db.executeSql(createPromptsTable);
  }

  private async insertDefaultPrompts(): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    // Check if prompts already exist
    const [results] = await this.db.executeSql('SELECT COUNT(*) as count FROM journal_prompts');
    if (results.rows.item(0).count > 0) {
      return; // Prompts already inserted
    }

    const defaultPrompts = [
      // Gratitude
      { category: 'Gratitude', title: 'Daily Blessings', prompt: 'I am so grateful for... (Write as if it has already happened)' },
      { category: 'Gratitude', title: 'Appreciation Practice', prompt: 'Thank you universe for bringing me... (Feel the gratitude as real)' },
      { category: 'Gratitude', title: 'Abundance Gratitude', prompt: 'I am overflowing with gratitude for the abundance that flows to me...' },
      
      // Manifestation
      { category: 'Manifestation', title: 'Living in the End', prompt: 'I am living my dream life. Today I woke up and... (Write in present tense)' },
      { category: 'Manifestation', title: 'Assumption Script', prompt: 'It is wonderful! I now have... (Assume it is yours now)' },
      { category: 'Manifestation', title: 'Bridge of Incidents', prompt: 'The perfect circumstances unfolded when... (Script the how)' },
      { category: 'Manifestation', title: 'Revision Practice', prompt: 'Today went perfectly. Instead of what happened, this is what occurred...' },
      
      // Abundance
      { category: 'Abundance', title: 'Financial Freedom', prompt: 'Money flows to me easily and abundantly. I am financially free because...' },
      { category: 'Abundance', title: 'Prosperity Mindset', prompt: 'I am a money magnet. Wealth comes to me from expected and unexpected sources...' },
      { category: 'Abundance', title: 'Abundant Living', prompt: 'I live in abundance. My life overflows with...' },
    ];

    for (const prompt of defaultPrompts) {
      await this.db.executeSql(
        'INSERT INTO journal_prompts (category, title, prompt) VALUES (?, ?, ?)',
        [prompt.category, prompt.title, prompt.prompt]
      );
    }
  }

  async saveJournalEntry(entry: Omit<JournalEntry, 'id' | 'created_at' | 'updated_at'>): Promise<number> {
    if (!this.db) throw new Error('Database not initialized');

    const [result] = await this.db.executeSql(
      'INSERT INTO journal_entries (title, content, mood, category) VALUES (?, ?, ?, ?)',
      [entry.title, entry.content, entry.mood, entry.category]
    );

    return result.insertId;
  }

  async getJournalEntries(): Promise<JournalEntry[]> {
    if (!this.db) throw new Error('Database not initialized');

    const [results] = await this.db.executeSql(
      'SELECT * FROM journal_entries ORDER BY created_at DESC'
    );

    const entries: JournalEntry[] = [];
    for (let i = 0; i < results.rows.length; i++) {
      entries.push(results.rows.item(i));
    }

    return entries;
  }

  async searchJournalEntries(searchTerm: string, category?: string): Promise<JournalEntry[]> {
    if (!this.db) throw new Error('Database not initialized');

    let query = 'SELECT * FROM journal_entries WHERE (title LIKE ? OR content LIKE ?)';
    let params = [`%${searchTerm}%`, `%${searchTerm}%`];

    if (category) {
      query += ' AND category = ?';
      params.push(category);
    }

    query += ' ORDER BY created_at DESC';

    const [results] = await this.db.executeSql(query, params);

    const entries: JournalEntry[] = [];
    for (let i = 0; i < results.rows.length; i++) {
      entries.push(results.rows.item(i));
    }

    return entries;
  }

  async getJournalPrompts(category?: string): Promise<JournalPrompt[]> {
    if (!this.db) throw new Error('Database not initialized');

    let query = 'SELECT * FROM journal_prompts';
    let params: string[] = [];

    if (category) {
      query += ' WHERE category = ?';
      params.push(category);
    }

    const [results] = await this.db.executeSql(query, params);

    const prompts: JournalPrompt[] = [];
    for (let i = 0; i < results.rows.length; i++) {
      prompts.push(results.rows.item(i));
    }

    return prompts;
  }

  async deleteJournalEntry(id: number): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    await this.db.executeSql('DELETE FROM journal_entries WHERE id = ?', [id]);
  }

  async updateJournalEntry(id: number, entry: Partial<JournalEntry>): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    const fields = Object.keys(entry).filter(key => key !== 'id' && key !== 'created_at');
    const values = fields.map(field => entry[field as keyof JournalEntry]);
    
    const setClause = fields.map(field => `${field} = ?`).join(', ');
    
    await this.db.executeSql(
      `UPDATE journal_entries SET ${setClause}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
      [...values, id]
    );
  }

  async closeDatabase(): Promise<void> {
    if (this.db) {
      await this.db.close();
      this.db = null;
    }
  }
}

export const databaseService = new DatabaseService();