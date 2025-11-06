export class SettingsManager {
  private db: any;

  constructor(db: any) {
    this.db = db;
  }

  setSetting(key: string, value: string): void {
    const now = new Date().toISOString();
    this.db
      .prepare(
        `INSERT OR REPLACE INTO app_settings (key, value, createdAt, updatedAt) VALUES (?, ?, ?, ?)`
      )
      .run(key, value, now, now);
  }

  getSetting(key: string): string | null {
    const result = this.db
      .prepare("SELECT value FROM app_settings WHERE key = ?")
      .get(key);
    return result ? result.value : null;
  }

  deleteSetting(key: string): void {
    this.db.prepare("DELETE FROM app_settings WHERE key = ?").run(key);
  }

  clearAllSettings(): void {
    this.db.prepare("DELETE FROM app_settings").run();
  }
}
