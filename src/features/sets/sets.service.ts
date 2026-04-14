import { z } from 'zod';
import { database } from './sets.repository';

export const paginationSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  pageSize: z.coerce.number().min(1).max(100).default(20),
});

export const setSearchSchema = paginationSchema.extend({
  name: z.string().optional().default(''),
  setId: z.string().uuid().optional(),
  releaseDateFrom: z.string().optional(),
  releaseDateTo: z.string().optional(),
  cardCountFrom: z.coerce.number().min(0).optional(),
  cardCountTo: z.coerce.number().min(0).optional(),
});

export type PaginationParams = z.infer<typeof paginationSchema>;
export type SetSearchParams = z.infer<typeof setSearchSchema>;

export interface SetEntity {
  id: string;
  name: string;
  release_date: string | null;
  total: number | null;
  printed_total: number | null;
  logo_image_url: string | null;
  symbol_image_url: string | null;
  language: string | null;
  set_code: string | null;
}

export interface SetListItem {
  id: string;
  name: string;
  releaseDate: string | null;
  cardCount: number;
  languages: string[];
  imageUrl: string;
  setCode?: string;
}

export interface SetFilters {
  releaseDateFrom?: string;
  releaseDateTo?: string;
  cardCountFrom?: number;
  cardCountTo?: number;
}

const languageMap: Record<string, string> = {
  en: 'English',
  ja: '日本語',
  zh: '中文',
};

export class SetsRepository {
  async findAll(
    page: number,
    pageSize: number,
    filters?: SetFilters
  ): Promise<{ items: SetListItem[]; total: number }> {
    const offset = (page - 1) * pageSize;

    let whereClause = '';
    const params: any[] = [];
    let paramIndex = 1;
    const conditions: string[] = [];

    console.log('[findAll] Input filters:', JSON.stringify(filters));

    if (filters) {
      if (filters.releaseDateFrom) {
        conditions.push(`s.release_date >= $${paramIndex}`);
        params.push(filters.releaseDateFrom);
        paramIndex++;
      }

      if (filters.releaseDateTo) {
        conditions.push(`s.release_date <= $${paramIndex}`);
        params.push(filters.releaseDateTo);
        paramIndex++;
      }

      if (filters.cardCountFrom !== undefined) {
        conditions.push(`COALESCE(s.total, s.printed_total, 0) >= $${paramIndex}`);
        params.push(filters.cardCountFrom);
        paramIndex++;
      }

      if (filters.cardCountTo !== undefined) {
        conditions.push(`COALESCE(s.total, s.printed_total, 0) <= $${paramIndex}`);
        params.push(filters.cardCountTo);
        paramIndex++;
      }

      if (conditions.length > 0) {
        whereClause = 'WHERE ' + conditions.join(' AND ');
      }
    }

    console.log('[findAll] WHERE:', whereClause, 'params:', params);

    const queryParams = [...params, pageSize, offset];
    
    const result = await database.query<SetEntity>(
      `SELECT 
        s.id, s.name, s.release_date, s.total, s.printed_total,
        s.logo_image_url, s.symbol_image_url, s.language,
        ser.external_id as set_code
       FROM sets s
       LEFT JOIN set_external_refs ser ON s.id = ser.set_id AND ser.source_code IN ('pokemontcg', 'tcgdex')
       ${whereClause}
       ORDER BY s.release_date DESC NULLS LAST, s.name ASC
       LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
      queryParams
    );

    const countResult = await database.query(
      `SELECT COUNT(*) as total FROM sets s ${whereClause}`,
      params
    );
    const total = parseInt(countResult.rows[0].total);

    const items = result.rows.map((row) => this.mapToDto(row));

    return { items, total };
  }

  async search(
    query: string,
    page: number,
    pageSize: number,
    filters?: SetFilters
): Promise<{ items: SetListItem[]; total: number }> {
    const offset = (page - 1) * pageSize;

    let whereClause = '';
    const params: any[] = [];
    let paramIndex = 1;
    const conditions: string[] = [];

    if (filters) {
      if (filters.releaseDateFrom) {
        whereClause += ` AND s.release_date >= $${paramIndex}`;
        params.push(filters.releaseDateFrom);
        paramIndex++;
      }

      if (filters.releaseDateTo) {
        whereClause += ` AND s.release_date <= $${paramIndex}`;
        params.push(filters.releaseDateTo);
        paramIndex++;
      }

      if (filters.cardCountFrom !== undefined) {
        whereClause += ` AND COALESCE(s.total, s.printed_total, 0) >= $${paramIndex}`;
        params.push(filters.cardCountFrom);
        paramIndex++;
      }

      if (filters.cardCountTo !== undefined) {
        whereClause += ` AND COALESCE(s.total, s.printed_total, 0) <= $${paramIndex}`;
        params.push(filters.cardCountTo);
        paramIndex++;
      }
    }

    const result = await database.query<SetEntity>(
      `SELECT 
        s.id, s.name, s.release_date, s.total, s.printed_total,
        s.logo_image_url, s.symbol_image_url, s.language,
        ser.external_id as set_code
       FROM sets s
       LEFT JOIN set_external_refs ser ON s.id = ser.set_id AND ser.source_code IN ('pokemontcg', 'tcgdex')
       ${whereClause}
       ORDER BY s.release_date DESC NULLS LAST, s.name ASC
       LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
      [...params, pageSize, offset]
    );

    const countResult = await database.query(
      `SELECT COUNT(DISTINCT s.id) as total FROM sets s ${whereClause}`,
      params
    );
    const total = parseInt(countResult.rows[0].total);

    const items = result.rows.map((row) => this.mapToDto(row));

    return { items, total };
  }

  async findById(id: string): Promise<SetListItem | null> {
    const result = await database.query<SetEntity>(
      `SELECT 
        s.id, s.name, s.release_date, s.total, s.printed_total,
        s.logo_image_url, s.symbol_image_url, s.language,
        ser.external_id as set_code
       FROM sets s
       LEFT JOIN set_external_refs ser ON s.id = ser.set_id AND ser.source_code IN ('pokemontcg', 'tcgdex')
       WHERE s.id = $1`,
      [id]
    );

    if (result.rows.length === 0) return null;
    return this.mapToDto(result.rows[0]);
  }

  private mapToDto(row: SetEntity): SetListItem {
    const langName = languageMap[row.language || ''] || (row.language?.toUpperCase() || 'N/A');
    
    return {
      id: row.id,
      name: row.name,
      releaseDate: row.release_date || null,
      cardCount: row.total || row.printed_total || 0,
      languages: [langName],
      setCode: row.set_code || undefined,
      imageUrl: row.logo_image_url || row.symbol_image_url || '/images/placeholder-set.png',
    };
  }
}

export const setsRepository = new SetsRepository();