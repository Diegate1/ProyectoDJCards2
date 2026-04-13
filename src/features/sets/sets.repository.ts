import { Pool, QueryResult, QueryResultRow } from 'pg';
import { config } from '../../config';

export class BaseRepository {
  protected pool: Pool;

  constructor() {
    this.pool = new Pool({
      host: config.database.host,
      port: config.database.port,
      user: config.database.user,
      password: config.database.password,
      database: config.database.database,
    });
  }

  async query<T extends QueryResultRow = any>(sql: string, params?: any[]): Promise<QueryResult<T>> {
    try {
      return await this.pool.query<T>(sql, params);
    } catch (error) {
      console.error('Query error:', sql, params, error);
      throw error;
    }
  }

  async connect(): Promise<void> {
    const client = await this.pool.connect();
    client.release();
  }

  async close(): Promise<void> {
    await this.pool.end();
  }
}

export const database = new BaseRepository();
