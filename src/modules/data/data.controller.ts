import { Request, Response } from 'express';
import { database } from '../../db/database';
import { DataFormatterService } from './data-formatter.service';
import { SetDto, CardDto, CardDetailDto, PaginatedResponse } from '../../common/types';

export class DataController {
  /**
   * GET /api/data/sets
   * Listado paginado de sets para dashboard principal
   * Parámetros: page=1, pageSize=20
   * Retorna: PaginatedResponse<SetDto>
   */
  async getSets(req: Request, res: Response): Promise<void> {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const pageSize = parseInt(req.query.pageSize as string) || 20;
      const offset = (page - 1) * pageSize;

      // Query: obtener sets ordenados, más nuevos primero
      const result = await database.query(
        `SELECT 
          s.id, 
          s.name, 
          s.release_date, 
          s.total, 
          s.printed_total,
          s.logo_image_url,
          s.symbol_image_url,
          s.metadata,
          s.language,
          ser.external_id as set_code
         FROM sets s
         LEFT JOIN set_external_refs ser ON s.id = ser.set_id AND ser.source_code IN ('pokemontcg', 'tcgdex')
         ORDER BY s.release_date DESC NULLS LAST, s.name ASC
         LIMIT $1 OFFSET $2`,
        [pageSize, offset]
      );

      // Query: contar total
      const countResult = await database.query('SELECT COUNT(*) as total FROM sets');
      const totalItems = parseInt(countResult.rows[0].total);
      const totalPages = Math.ceil(totalItems / pageSize);

      // Formatear DTOs
      const items: SetDto[] = result.rows.map((row: any) => {
        const languageMap: { [key: string]: string } = {
          'en': 'English',
          'ja': '日本語',
          'zh': '中文',
        };
        
        const langName = languageMap[row.language] || (row.language ? row.language.toUpperCase() : 'N/A');
        
        return {
          id: row.id,
          name: row.name,
          releaseDate: row.release_date || null,
          cardCount: row.total || row.printed_total || 0,
          languages: [langName],
          setCode: row.set_code || undefined,
          imageUrl: DataFormatterService.resolveImageUrl(
            row.logo_image_url,
            row.symbol_image_url,
            undefined,
            '/images/placeholder-set.png'
          ),
        };
      });

      const response: PaginatedResponse<SetDto> = {
        items,
        pagination: {
          page,
          pageSize,
          totalItems,
          totalPages,
        },
      };

      res.json(response);
    } catch (error) {
      console.error('Error in getSets:', error);
      res.status(500).json({ error: (error as Error).message });
    }
  }

  /**
   * GET /api/data/sets/:setId/cards
   * DEPRECATED - Mantiene compatibilidad hacia atrás pero usa nueva lógica
   */
  async getCardsBySet(req: Request, res: Response): Promise<void> {
    // Redirigir al nuevo endpoint con query params
    const setId = req.params.setId as string;
    req.query.setId = setId;
    await this.getCards(req, res);
  }

  /**
   * GET /api/data/cards
   * Listado paginado de cartas con soporte para filtro por setId
   * Parámetros: page=1, pageSize=20, setId=UUID (opcional)
   * Retorna: PaginatedResponse<CardDto>
   */
  async getCards(req: Request, res: Response): Promise<void> {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const pageSize = parseInt(req.query.pageSize as string) || 20;
      const offset = (page - 1) * pageSize;
      const setId = req.query.setId as string | undefined;

      let query = `
        SELECT 
          c.id,
          c.name,
          c.number,
          c.image_small_url,
          c.image_large_url,
          c.set_id,
          s.name as set_name,
          NULL as current_price,
          'USD' as currency
        FROM cards c
        INNER JOIN sets s ON c.set_id = s.id
      `;

      const params: any[] = [];

      // Filtrar por setId si existe
      if (setId) {
        query += ` WHERE c.set_id = $1`;
        params.push(setId);
      }

      // Contar total antes de paginación
      let countQuery = 'SELECT COUNT(*) as total FROM cards c INNER JOIN sets s ON c.set_id = s.id';
      const countParams: any[] = [];
      if (setId) {
        countQuery += ' WHERE c.set_id = $1';
        countParams.push(setId);
      }
      const countResult = await database.query(countQuery, countParams);
      const totalItems = parseInt(countResult.rows[0].total);
      const totalPages = Math.ceil(totalItems / pageSize);

      // Agregar paginación y ordenamiento
      const paramIndex = params.length + 1;
      // Usar CAST con CASE para manejar números que podrían tener letras
      query += ` ORDER BY 
        CASE 
          WHEN c.number ~ '^[0-9]+$' THEN CAST(c.number AS NUMERIC)
          ELSE 999999
        END ASC,
        c.number ASC
        LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
      params.push(pageSize);
      params.push(offset);

      const result = await database.query(query, params);

      // Formatear DTOs
      const items: CardDto[] = result.rows.map((row: any) => ({
        id: row.id,
        name: row.name,
        number: row.number,
        imageUrl: DataFormatterService.resolveImageUrl(
          row.image_small_url,
          row.image_large_url,
          undefined,
          '/images/placeholder-card.png'
        ),
        currentPrice: DataFormatterService.formatCurrentPrice(
          row.current_price,
          undefined,
          undefined,
          row.currency
        ),
        set: {
          id: row.set_id,
          name: row.set_name,
        },
      }));

      const response: PaginatedResponse<CardDto> = {
        items,
        pagination: {
          page,
          pageSize,
          totalItems,
          totalPages,
        },
      };

      res.json(response);
    } catch (error) {
      console.error('Error in getCards:', error);
      res.status(500).json({ error: (error as Error).message });
    }
  }

  /**
   * GET /api/data/cards/search
   * Buscar cartas por nombre, número o set (búsqueda avanzada)
   * Parámetros: name=string, setId=UUID (opcional), page=1, pageSize=20
   * Retorna: PaginatedResponse<CardDto>
   * 
   * Soporta:
   * - Búsqueda simple: "Charizard" 
   * - Búsqueda con número: "Charizard 1" o "Charizard 1/102"
   * - Búsqueda con set: "Charizard Base"
   * - Espacios ignorados al inicio/final
   */
  async searchCards(req: Request, res: Response): Promise<void> {
    try {
      let searchName = ((req.query.name as string) || '').trim();
      const setId = req.query.setId as string | undefined;
      const page = parseInt(req.query.page as string) || 1;
      const pageSize = parseInt(req.query.pageSize as string) || 20;
      const offset = (page - 1) * pageSize;

      if (searchName.length < 1) {
        res.status(400).json({ error: 'Search query must be at least 1 character' });
        return;
      }

      // Analizar términos de búsqueda para soportar formato "Nombre Número" o "Nombre Set"
      const terms = searchName.split(/\s+/);
      let cardNameTerm = searchName;
      let numberTerm: string | null = null;
      let setNameTerm: string | null = null;

      // Si hay 2+ términos, el último podría ser número o set
      if (terms.length >= 2) {
        const lastTerm = terms[terms.length - 1];
        
        // Verificar si el último término es un número o número/total (ej: "1" o "1/102")
        if (/^[0-9]+(\/)?\d*$/.test(lastTerm)) {
          // Extraer solo el número antes del slash (ej: "4/102" -> "4")
          numberTerm = lastTerm.split('/')[0];
          cardNameTerm = terms.slice(0, -1).join(' ').trim();
        } else {
          // Si no es número, podría ser nombre del set
          setNameTerm = lastTerm;
          cardNameTerm = terms.slice(0, -1).join(' ').trim();
        }
      }

      let query = `
        SELECT 
          c.id,
          c.name,
          c.number,
          c.image_small_url,
          c.image_large_url,
          c.set_id,
          s.name as set_name,
          NULL as current_price,
          'USD' as currency
        FROM cards c
        INNER JOIN sets s ON c.set_id = s.id
        WHERE c.name ILIKE $1
      `;

      const params: any[] = [`%${cardNameTerm}%`];
      let paramIndex = 2;

      // Agregar búsqueda por número si fue detectado
      if (numberTerm) {
        query += ` AND c.number ILIKE $${paramIndex}`;
        params.push(`%${numberTerm}%`);
        paramIndex++;
      }

      // Agregar búsqueda por nombre de set si fue detectado
      if (setNameTerm) {
        query += ` AND s.name ILIKE $${paramIndex}`;
        params.push(`%${setNameTerm}%`);
        paramIndex++;
      }

      // Filtrar por setId si existe
      if (setId) {
        query += ` AND c.set_id = $${paramIndex}`;
        params.push(setId);
        paramIndex++;
      }

      // Contar total (usando la misma lógica de búsqueda avanzada)
      let countQuery = `SELECT COUNT(*) as total FROM cards c INNER JOIN sets s ON c.set_id = s.id WHERE c.name ILIKE $1`;
      const countParams: any[] = [`%${cardNameTerm}%`];
      let countParamIndex = 2;

      if (numberTerm) {
        countQuery += ` AND c.number ILIKE $${countParamIndex}`;
        countParams.push(`%${numberTerm}%`);
        countParamIndex++;
      }

      if (setNameTerm) {
        countQuery += ` AND s.name ILIKE $${countParamIndex}`;
        countParams.push(`%${setNameTerm}%`);
        countParamIndex++;
      }

      if (setId) {
        countQuery += ` AND c.set_id = $${countParamIndex}`;
        countParams.push(setId);
      }

      const countResult = await database.query(countQuery, countParams);
      const totalItems = parseInt(countResult.rows[0].total);
      const totalPages = Math.ceil(totalItems / pageSize);

      // Agregar paginación y ordenamiento
      query += ` ORDER BY 
        CASE 
          WHEN c.number ~ '^[0-9]+$' THEN CAST(c.number AS NUMERIC)
          ELSE 999999
        END ASC,
        c.number ASC
        LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
      params.push(pageSize);
      params.push(offset);

      const result = await database.query(query, params);

      // Formatear DTOs
      const items: CardDto[] = result.rows.map((row: any) => ({
        id: row.id,
        name: row.name,
        number: row.number,
        imageUrl: DataFormatterService.resolveImageUrl(
          row.image_small_url,
          row.image_large_url,
          undefined,
          '/images/placeholder-card.png'
        ),
        currentPrice: DataFormatterService.formatCurrentPrice(
          row.current_price,
          undefined,
          undefined,
          row.currency
        ),
        set: {
          id: row.set_id,
          name: row.set_name,
        },
      }));

      const response: PaginatedResponse<CardDto> = {
        items,
        pagination: {
          page,
          pageSize,
          totalItems,
          totalPages,
        },
      };

      res.json(response);
    } catch (error) {
      console.error('Error in searchCards:', error);
      res.status(500).json({ error: (error as Error).message });
    }
  }

  /**
   * GET /api/data/sets/search
   * Buscar sets por nombre o código (búsqueda avanzada)
   * Parámetros: name=string, page=1, pageSize=20
   * Retorna: PaginatedResponse<SetDto>
   * 
   * Soporta:
   * - Búsqueda simple: "Base"
   * - Búsqueda con código: "Base base1"
   * - Espacios ignorados al inicio/final
   */
  async searchSets(req: Request, res: Response): Promise<void> {
    try {
      let searchName = ((req.query.name as string) || '').trim();
      const page = parseInt(req.query.page as string) || 1;
      const pageSize = parseInt(req.query.pageSize as string) || 20;
      const offset = (page - 1) * pageSize;

      if (searchName.length < 1) {
        res.status(400).json({ error: 'Search query must be at least 1 character' });
        return;
      }

      // Analizar términos de búsqueda
      const terms = searchName.split(/\s+/);
      let setNameTerm = searchName;
      let setCodeTerm: string | null = null;

      // Si hay 2+ términos, el último podría ser código de set
      if (terms.length >= 2) {
        const lastTerm = terms[terms.length - 1];
        // El código de set suele ser alfanumérico corto (ej: "base1", "sv4pt")
        if (lastTerm.length <= 10 && /^[a-z0-9]+$/i.test(lastTerm)) {
          setCodeTerm = lastTerm;
          setNameTerm = terms.slice(0, -1).join(' ').trim();
        }
      }

      let query = `
        SELECT 
          s.id,
          s.name,
          s.release_date,
          s.total,
          s.printed_total,
          s.logo_image_url,
          s.symbol_image_url,
          ser.external_id as set_code,
          s.language
        FROM sets s
        LEFT JOIN set_external_refs ser ON s.id = ser.set_id AND ser.source_code IN ('pokemontcg', 'tcgdex')
        WHERE s.name ILIKE $1
      `;

      const params: any[] = [`%${setNameTerm}%`];
      let paramIndex = 2;

      // Agregar búsqueda por código si fue detectado
      if (setCodeTerm) {
        query += ` AND ser.external_id ILIKE $${paramIndex}`;
        params.push(`%${setCodeTerm}%`);
        paramIndex++;
      }

      // Contar total
      let countQuery = `SELECT COUNT(DISTINCT s.id) as total FROM sets s LEFT JOIN set_external_refs ser ON s.id = ser.set_id AND ser.source_code IN ('pokemontcg', 'tcgdex') WHERE s.name ILIKE $1`;
      const countParams: any[] = [`%${setNameTerm}%`];

      if (setCodeTerm) {
        countQuery += ` AND ser.external_id ILIKE $2`;
        countParams.push(`%${setCodeTerm}%`);
      }

      const countResult = await database.query(countQuery, countParams);
      const totalItems = parseInt(countResult.rows[0].total);
      const totalPages = Math.ceil(totalItems / pageSize);

      // Agregar paginación y ordenamiento
      query += ` ORDER BY s.release_date DESC NULLS LAST, s.name ASC
        LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
      params.push(pageSize);
      params.push(offset);

      const result = await database.query(query, params);

      // Formatear DTOs
      const languageMap: { [key: string]: string } = {
        'en': 'English',
        'ja': '日本語',
        'zh': '中文',
      };

      const items: SetDto[] = result.rows.map((row: any) => {
        const langName = languageMap[row.language] || (row.language ? row.language.toUpperCase() : 'N/A');
        return {
          id: row.id,
          name: row.name,
          releaseDate: row.release_date || null,
          cardCount: row.total || row.printed_total || 0,
          languages: [langName],
          setCode: row.set_code || undefined,
          imageUrl: DataFormatterService.resolveImageUrl(
            row.logo_image_url,
            row.symbol_image_url,
            undefined,
            '/images/placeholder-set.png'
          ),
        };
      });

      const response: PaginatedResponse<SetDto> = {
        items,
        pagination: {
          page,
          pageSize,
          totalItems,
          totalPages,
        },
      };

      res.json(response);
    } catch (error) {
      console.error('Error in searchSets:', error);
      res.status(500).json({ error: (error as Error).message });
    }
  }

  /**
   * GET /api/data/cards/:cardId
   * Obtener detalle completo de una carta
   * Retorna: CardDetailDto con toda la información
   */
  async getCardDetails(req: Request, res: Response): Promise<void> {
    try {
      const cardId = req.params.cardId as string;

      // Query principal de carta
      const cardResult = await database.query(
        `SELECT 
          c.id,
          c.name,
          c.number,
          c.rarity,
          c.supertype,
          c.hp,
          c.artist,
          c.image_small_url,
          c.image_large_url,
          c.flavor_text,
          c.metadata,
          c.set_id,
          s.name as set_name
         FROM cards c
         INNER JOIN sets s ON c.set_id = s.id
         WHERE c.id = $1`,
        [cardId]
      );

      if (cardResult.rows.length === 0) {
        res.status(404).json({ error: 'Card not found' });
        return;
      }

      const card = cardResult.rows[0];

      // Query: ataques
      const attacksResult = await database.query(
        `SELECT name, damage, text, cost 
         FROM card_attacks 
         WHERE card_id = $1 
         ORDER BY position ASC`,
        [cardId]
      );

      // Query: habilidades
      const abilitiesResult = await database.query(
        `SELECT name, type, text 
         FROM card_abilities 
         WHERE card_id = $1`,
        [cardId]
      );

      // Query: precio actual
      const priceResult = await database.query(
        `SELECT DISTINCT ON (product_id)
          market_price,
          mid_price,
          low_price,
          currency
         FROM product_prices
         WHERE product_id = (
           SELECT id FROM products 
           WHERE source_code = 'tcgcsv' 
           LIMIT 1
         )
         ORDER BY product_id, captured_at DESC
         LIMIT 1`
      );

      // Formatear respuesta
      const detail: CardDetailDto = {
        id: card.id,
        name: card.name,
        number: card.number,
        rarity: card.rarity || null,
        supertype: card.supertype || 'Unknown',
        hp: card.hp || null,
        artist: card.artist || null,
        imageUrl: DataFormatterService.resolveImageUrl(
          card.image_small_url,
          card.image_large_url,
          undefined,
          '/images/placeholder-card.png'
        ),
        flavorText: card.flavor_text || null,
        set: {
          id: card.set_id,
          name: card.set_name,
        },
        currentPrice: priceResult.rows.length > 0
          ? DataFormatterService.formatCurrentPrice(
              priceResult.rows[0].market_price,
              priceResult.rows[0].mid_price,
              priceResult.rows[0].low_price,
              priceResult.rows[0].currency
            )
          : DataFormatterService.formatCurrentPrice(null, null, null, 'USD'),
        attacks: attacksResult.rows.map((row: any) => ({
          name: row.name,
          damage: row.damage || null,
          text: row.text || null,
          cost: Array.isArray(row.cost) ? row.cost : [],
        })),
        abilities: abilitiesResult.rows.map((row: any) => ({
          name: row.name,
          type: row.type,
          text: row.text,
        })),
        weaknesses: DataFormatterService.extractWeaknesses(card.metadata),
        resistances: DataFormatterService.extractResistances(card.metadata),
      };

      res.json(detail);
    } catch (error) {
      console.error('Error in getCardDetails:', error);
      res.status(500).json({ error: (error as Error).message });
    }
  }

  /**
   * GET /api/data/prices/card
   * Obtener precios históricos de una carta (legacy)
   * Esta será reemplazada en fase futura con gráficos
   */
  async getCardPrices(req: Request, res: Response): Promise<void> {
    try {
      const cardName = (req.query.name as string) || '';

      if (cardName.length < 2) {
        res.status(400).json({ error: 'Card name must be at least 2 characters' });
        return;
      }

      const result = await database.query(
        `SELECT p.name, p.clean_name, pp.variant_name, pp.low_price, pp.mid_price, 
                pp.high_price, pp.market_price, pp.captured_at
         FROM products p
         JOIN product_prices pp ON p.id = pp.product_id
         WHERE p.clean_name ILIKE $1
           AND p.product_type = 'single_card'
         ORDER BY pp.captured_at DESC
         LIMIT 50`,
        [`%${cardName}%`]
      );

      if (result.rows.length === 0) {
        res.status(404).json({ error: `No prices found for card "${cardName}"` });
        return;
      }

      res.json({
        cardName,
        prices: result.rows,
        count: result.rows.length,
      });
    } catch (error) {
      console.error('Error in getCardPrices:', error);
      res.status(500).json({ error: (error as Error).message });
    }
  }

  /**
   * GET /api/data/products/sealed
   * Obtener productos sellados (boxes, tins, etc)
   */
  async getSealedProducts(req: Request, res: Response): Promise<void> {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const pageSize = parseInt(req.query.pageSize as string) || 50;
      const offset = (page - 1) * pageSize;

      const result = await database.query(
        `SELECT p.id, p.name, p.clean_name, p.image_url, p.product_url,
                AVG(pp.mid_price) as avg_price, MAX(pp.high_price) as max_price, MIN(pp.low_price) as min_price
         FROM products p
         LEFT JOIN product_prices pp ON p.id = pp.product_id
         WHERE p.product_type = 'sealed_product'
         GROUP BY p.id
         ORDER BY p.name
         LIMIT $1 OFFSET $2`,
        [pageSize, offset]
      );

      const countResult = await database.query(
        'SELECT COUNT(*) as total FROM products WHERE product_type = $1',
        ['sealed_product']
      );

      res.json({
        data: result.rows,
        page,
        pageSize,
        total: parseInt(countResult.rows[0].total),
      });
    } catch (error) {
      console.error('Error in getSealedProducts:', error);
      res.status(500).json({ error: (error as Error).message });
    }
  }

  /**
   * GET /api/data/stats
   * Estadísticas generales de la base de datos
   */
  async getStats(req: Request, res: Response): Promise<void> {
    try {
      const setsResult = await database.query('SELECT COUNT(*) as count FROM sets');
      const cardsResult = await database.query('SELECT COUNT(*) as count FROM cards');
      const productsResult = await database.query('SELECT COUNT(*) as count FROM products');
      const pricesResult = await database.query('SELECT COUNT(*) as count FROM product_prices');

      res.json({
        stats: {
          sets: parseInt(setsResult.rows[0].count),
          cards: parseInt(cardsResult.rows[0].count),
          products: parseInt(productsResult.rows[0].count),
          priceEntries: parseInt(pricesResult.rows[0].count),
        },
      });
    } catch (error) {
      console.error('Error in getStats:', error);
      res.status(500).json({ error: (error as Error).message });
    }
  }
}
