import { z } from 'zod';
import { database } from './sets.repository';

export const paginationSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  pageSize: z.coerce.number().min(1).max(100).default(20),
});

export const setSearchSchema = paginationSchema.extend({
  name: z.string().min(1).default(''),
  setId: z.string().uuid().optional(),
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

const languageMap: Record<string, string> = {
  en: 'English',
  ja: '日本語',
  zh: '中文',
};

export class SetsRepository {
  async findAll(page: number, pageSize: number): Promise<{ items: SetListItem[]; total: number }> {
    const offset = (page - 1) * pageSize;

    const result = await database.query<SetEntity>(
      `SELECT 
        s.id, s.name, s.release_date, s.total, s.printed_total,
        s.logo_image_url, s.symbol_image_url, s.language,
        ser.external_id as set_code
       FROM sets s
       LEFT JOIN set_external_refs ser ON s.id = ser.set_id AND ser.source_code IN ('pokemontcg', 'tcgdex')
       ORDER BY s.release_date DESC NULLS LAST, s.name ASC
       LIMIT $1 OFFSET $2`,
      [pageSize, offset]
    );

    const countResult = await database.query('SELECT COUNT(*) as total FROM sets');
    const total = parseInt(countResult.rows[0].total);

    const items = result.rows.map((row) => this.mapToDto(row));

    return { items, total };
  }

  async search(query: string, page: number, pageSize: number): Promise<{ items: SetListItem[]; total: number }> {
    const offset = (page - 1) * pageSize;
    const searchTerm = `%${query}%`;

    const result = await database.query<SetEntity>(
      `SELECT 
        s.id, s.name, s.release_date, s.total, s.printed_total,
        s.logo_image_url, s.symbol_image_url, s.language,
        ser.external_id as set_code
       FROM sets s
       LEFT JOIN set_external_refs ser ON s.id = ser.set_id AND ser.source_code IN ('pokemontcg', 'tcgdex')
       WHERE s.name ILIKE $1
       ORDER BY s.release_date DESC NULLS LAST, s.name ASC
       LIMIT $2 OFFSET $3`,
      [searchTerm, pageSize, offset]
    );

    const countResult = await database.query(
      'SELECT COUNT(DISTINCT s.id) as total FROM sets s WHERE s.name ILIKE $1',
      [searchTerm]
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
