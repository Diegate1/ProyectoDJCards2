import { Pool, PoolClient } from 'pg';
import * as fs from 'fs';
import * as path from 'path';

export class Database {
  private pool: Pool;

  constructor() {
    this.pool = new Pool({
      connectionString: process.env.DATABASE_URL || 'postgresql://pokemon:pokemon@localhost:5432/pokemontcg',
    });
  }

  async connect(): Promise<void> {
    try {
      const client = await this.pool.connect();
      console.log('Database connected');
      client.release();
    } catch (error) {
      console.error('Database connection failed:', error);
      throw error;
    }
  }

  async close(): Promise<void> {
    await this.pool.end();
    console.log('Database disconnected');
  }

  async query(sql: string, params?: any[]): Promise<any> {
    try {
      return await this.pool.query(sql, params);
    } catch (error) {
      console.error('Query error:', error);
      throw error;
    }
  }

  async runMigrations(): Promise<void> {
    const migrationDir = path.join(__dirname, 'migrations');
    const files = fs.readdirSync(migrationDir).sort();

    for (const file of files) {
      if (file.endsWith('.sql')) {
        const filePath = path.join(migrationDir, file);
        const sql = fs.readFileSync(filePath, 'utf8');
        
        try {
          await this.pool.query(sql);
          console.log(`✓ Migration executed: ${file}`);
        } catch (error) {
          console.error(`✗ Migration failed: ${file}`, error);
          throw error;
        }
      }
    }
  }
}

export const database = new Database();
