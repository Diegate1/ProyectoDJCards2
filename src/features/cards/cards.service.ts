import { z } from 'zod';
import { database } from '../sets/sets.repository';

export const paginationSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  pageSize: z.coerce.number().min(1).max(100).default(20),
});

export const cardSearchSchema = paginationSchema.extend({
  name: z.string().min(1).default(''),
  setId: z.string().uuid().optional(),
  rarity: z.string().optional(),
});

export type PaginationParams = z.infer<typeof paginationSchema>;
export type CardSearchParams = z.infer<typeof cardSearchSchema>;

export interface CardEntity {
  id: string;
  name: string;
  number: string;
  rarity: string | null;
  image_small_url: string | null;
  image_large_url: string | null;
  set_id: string;
  set_name: string;
  current_price: number | null;
  currency: string;
}

export interface CardListItem {
  id: string;
  name: string;
  number: string;
  imageUrl: string;
  rarity?: string;
  currentPrice: {
    amount: number | null;
    currency: string;
    label: string;
  };
  set: {
    id: string;
    name: string;
  };
}

export interface CardDetailItem extends CardListItem {
  flavorText: string | null;
  hp: string | null;
  artist: string | null;
  supertype: string;
  attacks: Array<{
    name: string;
    damage: string | null;
    text: string | null;
    cost: string[];
  }>;
  abilities: Array<{
    name: string;
    type: string;
    text: string;
  }>;
}

export class CardsRepository {
  async findAll(setId: string | undefined, page: number, pageSize: number): Promise<{ items: CardListItem[]; total: number }> {
    const offset = (page - 1) * pageSize;

    let whereClause = '';
    const params: any[] = [];
    let paramIndex = 1;

    if (setId) {
      whereClause = `WHERE c.set_id = $${paramIndex}`;
      params.push(setId);
      paramIndex++;
    }

    const result = await database.query<CardEntity>(
      `SELECT 
        c.id, c.name, c.number, c.rarity, c.image_small_url, c.image_large_url,
        c.set_id, s.name as set_name,
        NULL as current_price, 'USD' as currency
       FROM cards c
       INNER JOIN sets s ON c.set_id = s.id
       ${whereClause}
       ORDER BY 
         CASE WHEN c.number ~ '^[0-9]+$' THEN CAST(c.number AS NUMERIC) ELSE 999999 END ASC,
         c.number ASC
       LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
      [...params, pageSize, offset]
    );

    const countResult = await database.query(
      `SELECT COUNT(*) as total FROM cards c ${whereClause}`,
      setId ? [setId] : []
    );
    const total = parseInt(countResult.rows[0].total);

    const items = result.rows.map((row) => this.mapToDto(row));

    return { items, total };
  }

  async search(query: string, setId: string | undefined, page: number, pageSize: number): Promise<{ items: CardListItem[]; total: number }> {
    const offset = (page - 1) * pageSize;
    const searchTerm = `%${query}%`;

    let whereClause = 'WHERE c.name ILIKE $1';
    const params: any[] = [searchTerm];
    let paramIndex = 2;

    if (setId) {
      whereClause += ` AND c.set_id = $${paramIndex}`;
      params.push(setId);
      paramIndex++;
    }

    const result = await database.query<CardEntity>(
      `SELECT 
        c.id, c.name, c.number, c.rarity, c.image_small_url, c.image_large_url,
        c.set_id, s.name as set_name,
        NULL as current_price, 'USD' as currency
       FROM cards c
       INNER JOIN sets s ON c.set_id = s.id
       ${whereClause}
       ORDER BY 
         CASE WHEN c.number ~ '^[0-9]+$' THEN CAST(c.number AS NUMERIC) ELSE 999999 END ASC,
         c.number ASC
       LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
      [...params, pageSize, offset]
    );

    const countResult = await database.query(
      `SELECT COUNT(*) as total FROM cards c ${whereClause}`,
      setId ? [searchTerm, setId] : [searchTerm]
    );
    const total = parseInt(countResult.rows[0].total);

    const items = result.rows.map((row) => this.mapToDto(row));

    return { items, total };
  }

  async findById(id: string): Promise<CardDetailItem | null> {
    const result = await database.query<CardEntity>(
      `SELECT 
        c.id, c.name, c.number, c.rarity, c.supertype, c.hp, c.artist,
        c.image_small_url, c.image_large_url, c.flavor_text,
        c.set_id, s.name as set_name,
        NULL as current_price, 'USD' as currency
       FROM cards c
       INNER JOIN sets s ON c.set_id = s.id
       WHERE c.id = $1`,
      [id]
    );

    if (result.rows.length === 0) return null;

    const row = result.rows[0];

    const attacksResult = await database.query(
      `SELECT name, damage, text, cost FROM card_attacks WHERE card_id = $1 ORDER BY position ASC`,
      [id]
    );

    const abilitiesResult = await database.query(
      `SELECT name, type, text FROM card_abilities WHERE card_id = $1`,
      [id]
    );

    return {
      id: row.id,
      name: row.name,
      number: row.number,
      rarity: row.rarity || undefined,
      imageUrl: row.image_small_url || row.image_large_url || '/images/placeholder-card.png',
      currentPrice: {
        amount: row.current_price,
        currency: row.currency,
        label: row.current_price ? `$${row.current_price.toFixed(2)}` : 'N/A',
      },
      set: {
        id: row.set_id,
        name: row.set_name,
      },
      flavorText: (row as any).flavor_text || null,
      hp: (row as any).hp || null,
      artist: (row as any).artist || null,
      supertype: (row as any).supertype || 'Unknown',
      attacks: attacksResult.rows.map((a) => ({
        name: a.name,
        damage: a.damage || null,
        text: a.text || null,
        cost: Array.isArray(a.cost) ? a.cost : [],
      })),
      abilities: abilitiesResult.rows.map((a) => ({
        name: a.name,
        type: a.type,
        text: a.text,
      })),
    };
  }

  private mapToDto(row: CardEntity): CardListItem {
    return {
      id: row.id,
      name: row.name,
      number: row.number,
      rarity: row.rarity || undefined,
      imageUrl: row.image_small_url || row.image_large_url || '/images/placeholder-card.png',
      currentPrice: {
        amount: row.current_price,
        currency: row.currency,
        label: row.current_price ? `$${row.current_price.toFixed(2)}` : 'N/A',
      },
      set: {
        id: row.set_id,
        name: row.set_name,
      },
    };
  }
}

export const cardsRepository = new CardsRepository();
