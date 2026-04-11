import { database } from '../db/database';
import { ApiLogEntry } from './types';

export class ApiLogService {
  async logApiCall(entry: ApiLogEntry): Promise<void> {
    try {
      const sql = `
        INSERT INTO api_logs (
          provider, method, url, status_code,
          request_headers, request_params,
          response_headers, response_body,
          error_text, duration_ms
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      `;

      await database.query(sql, [
        entry.provider,
        entry.method,
        entry.url,
        entry.statusCode || null,
        entry.requestHeaders ? JSON.stringify(entry.requestHeaders) : null,
        entry.requestParams ? JSON.stringify(entry.requestParams) : null,
        entry.responseHeaders ? JSON.stringify(entry.responseHeaders) : null,
        entry.responseBody ? JSON.stringify(entry.responseBody) : null,
        entry.errorText || null,
        entry.durationMs || null,
      ]);
    } catch (error) {
      console.error('Error logging API call:', error);
      // No lanzamos error para no interrumpir el flujo principal
    }
  }

  async getLogsByProvider(provider: string, limit: number = 100): Promise<any[]> {
    try {
      const sql = `
        SELECT * FROM api_logs
        WHERE provider = $1
        ORDER BY created_at DESC
        LIMIT $2
      `;

      const result = await database.query(sql, [provider, limit]);
      return result.rows;
    } catch (error) {
      console.error('Error fetching logs:', error);
      throw error;
    }
  }

  async getLogsByStatus(statusCode: number, limit: number = 100): Promise<any[]> {
    try {
      const sql = `
        SELECT * FROM api_logs
        WHERE status_code = $1
        ORDER BY created_at DESC
        LIMIT $2
      `;

      const result = await database.query(sql, [statusCode, limit]);
      return result.rows;
    } catch (error) {
      console.error('Error fetching logs by status:', error);
      throw error;
    }
  }

  async getAllLogs(limit: number = 1000): Promise<any[]> {
    try {
      const sql = `
        SELECT * FROM api_logs
        ORDER BY created_at DESC
        LIMIT $1
      `;

      const result = await database.query(sql, [limit]);
      return result.rows;
    } catch (error) {
      console.error('Error fetching all logs:', error);
      throw error;
    }
  }

  async clearOldLogs(daysOld: number = 30): Promise<number> {
    try {
      const sql = `
        DELETE FROM api_logs
        WHERE created_at < NOW() - INTERVAL '${daysOld} days'
      `;

      const result = await database.query(sql);
      return result.rowCount || 0;
    } catch (error) {
      console.error('Error clearing old logs:', error);
      throw error;
    }
  }
}

export const apiLogService = new ApiLogService();
