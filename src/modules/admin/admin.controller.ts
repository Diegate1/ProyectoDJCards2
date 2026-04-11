import express, { Request, Response } from 'express';
import { database } from '../../db/database';
import { pokemonTcgClient } from '../pokemon-tcg/pokemon-tcg.client';
import { tcgdexClient } from '../tcgdex/tcgdex.client';
import { tcgcsvClient } from '../tcgcsv/tcgcsv.client';
import { apiLogService } from '../../common/api-log.service';
import { setSyncService } from '../sync/set-sync.service';
import { cardSyncService } from '../sync/card-sync.service';
import { productSyncService } from '../sync/product-sync.service';

export class AdminController {
  // ===== Debug endpoints (raw API calls) =====

  async getPokemonTCGSets(req: express.Request, res: express.Response) {
    const startTime = Date.now();
    try {
      const page = parseInt(req.query.page as string) || 1;
      const pageSize = parseInt(req.query.pageSize as string) || 50;

      const data = await pokemonTcgClient.getAllSets(page, pageSize);

      const result = {
        provider: 'pokemontcg',
        request: {
          method: 'GET',
          url: `https://api.pokemontcg.io/v2/sets?page=${page}&pageSize=${pageSize}`,
          headers: {
            'X-Api-Key': '***masked***',
          },
        },
        response: {
          status: 200,
          durationMs: Date.now() - startTime,
          body: data,
        },
      };

      // Log the API call
      await apiLogService.logApiCall({
        provider: 'pokemontcg',
        method: 'GET',
        url: `https://api.pokemontcg.io/v2/sets?page=${page}&pageSize=${pageSize}`,
        statusCode: 200,
        durationMs: Date.now() - startTime,
        responseBody: data,
      });

      res.json(result);
    } catch (error: any) {
      const durationMs = Date.now() - startTime;
      
      await apiLogService.logApiCall({
        provider: 'pokemontcg',
        method: 'GET',
        url: 'https://api.pokemontcg.io/v2/sets',
        statusCode: error.response?.status,
        errorText: error.message,
        durationMs,
      });

      res.status(error.response?.status || 500).json({
        error: error.message,
        durationMs,
      });
    }
  }

  async getPokemonTCGCards(req: express.Request, res: express.Response) {
    const startTime = Date.now();
    try {
      const setId = req.query.setId as string;
      if (!setId) {
        return res.status(400).json({ error: 'setId parameter required' });
      }

      const page = parseInt(req.query.page as string) || 1;
      const pageSize = parseInt(req.query.pageSize as string) || 50;

      const data = await pokemonTcgClient.getCardsBySet(setId, page, pageSize);

      const result = {
        provider: 'pokemontcg',
        request: {
          method: 'GET',
          url: `https://api.pokemontcg.io/v2/cards?q=set.id:${setId}&page=${page}&pageSize=${pageSize}`,
          headers: {
            'X-Api-Key': '***masked***',
          },
        },
        response: {
          status: 200,
          durationMs: Date.now() - startTime,
          body: data,
        },
      };

      await apiLogService.logApiCall({
        provider: 'pokemontcg',
        method: 'GET',
        url: `https://api.pokemontcg.io/v2/cards?q=set.id:${setId}&page=${page}&pageSize=${pageSize}`,
        statusCode: 200,
        durationMs: Date.now() - startTime,
        responseBody: data,
      });

      res.json(result);
    } catch (error: any) {
      const durationMs = Date.now() - startTime;
      
      await apiLogService.logApiCall({
        provider: 'pokemontcg',
        method: 'GET',
        url: 'https://api.pokemontcg.io/v2/cards',
        statusCode: error.response?.status,
        errorText: error.message,
        durationMs,
      });

      res.status(error.response?.status || 500).json({
        error: error.message,
        durationMs,
      });
    }
  }

  async getTCGdexSets(req: express.Request, res: express.Response) {
    const startTime = Date.now();
    try {
      const lang = (req.query.lang as string) || 'en';
      const data = await tcgdexClient.getAllSets(lang);

      const result = {
        provider: 'tcgdex',
        request: {
          method: 'GET',
          url: `https://api.tcgdex.net/v2/${lang}/sets`,
        },
        response: {
          status: 200,
          durationMs: Date.now() - startTime,
          body: data,
        },
      };

      await apiLogService.logApiCall({
        provider: 'tcgdex',
        method: 'GET',
        url: `https://api.tcgdex.net/v2/${lang}/sets`,
        statusCode: 200,
        durationMs: Date.now() - startTime,
        responseBody: data,
      });

      res.json(result);
    } catch (error: any) {
      const durationMs = Date.now() - startTime;

      await apiLogService.logApiCall({
        provider: 'tcgdex',
        method: 'GET',
        url: 'https://api.tcgdex.net/v2/sets',
        statusCode: error.response?.status,
        errorText: error.message,
        durationMs,
      });

      res.status(error.response?.status || 500).json({
        error: error.message,
        durationMs,
      });
    }
  }

  async getTCGCSVGroups(req: express.Request, res: express.Response) {
    const startTime = Date.now();
    try {
      const data = await tcgcsvClient.getGroups();

      const result = {
        provider: 'tcgcsv',
        request: {
          method: 'GET',
          url: 'https://tcgcsv.com/tcgplayer/3/groups',
        },
        response: {
          status: 200,
          durationMs: Date.now() - startTime,
          body: data,
        },
      };

      await apiLogService.logApiCall({
        provider: 'tcgcsv',
        method: 'GET',
        url: 'https://tcgcsv.com/tcgplayer/3/groups',
        statusCode: 200,
        durationMs: Date.now() - startTime,
        responseBody: data,
      });

      res.json(result);
    } catch (error: any) {
      const durationMs = Date.now() - startTime;

      await apiLogService.logApiCall({
        provider: 'tcgcsv',
        method: 'GET',
        url: 'https://tcgcsv.com/tcgplayer/3/groups',
        statusCode: error.response?.status,
        errorText: error.message,
        durationMs,
      });

      res.status(error.response?.status || 500).json({
        error: error.message,
        durationMs,
      });
    }
  }

  // ===== Sync endpoints =====

  async syncPokemonTCGSets(req: express.Request, res: express.Response) {
    try {
      const result = await setSyncService.syncPokemonTCGSets();
      res.json({
        status: 'completed',
        synced: result.synced,
        errors: result.errors,
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  async syncCardsBySet(req: express.Request, res: express.Response) {
    try {
      const setId = req.params.setId as string;
      if (!setId) {
        return res.status(400).json({ error: 'setId parameter required' });
      }

      const result = await cardSyncService.syncCardsBySet(setId);
      res.json({
        status: 'completed',
        setId,
        synced: result.synced,
        errors: result.errors,
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  async syncAllCards(req: express.Request, res: express.Response) {
    try {
      const result = await cardSyncService.syncAllCardsBySets();
      res.json({
        status: 'completed',
        totalSynced: result.totalSynced,
        totalErrors: result.totalErrors,
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  async syncProductsByGroup(req: express.Request, res: express.Response) {
    try {
      const groupId = parseInt(req.params.groupId as string);
      if (!groupId) {
        return res.status(400).json({ error: 'groupId parameter required' });
      }

      const result = await productSyncService.syncProductsByGroup(groupId);
      res.json({
        status: 'completed',
        groupId,
        synced: result.synced,
        errors: result.errors,
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  async syncAllProducts(req: express.Request, res: express.Response) {
    try {
      const result = await productSyncService.syncAllGroupsProducts();
      res.json({
        status: 'completed',
        totalSynced: result.totalSynced,
        totalErrors: result.totalErrors,
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  // ===== Log endpoints =====

  async getApiLogs(req: express.Request, res: express.Response) {
    try {
      const provider = req.query.provider as string;
      const limit = parseInt(req.query.limit as string) || 100;

      let logs;
      if (provider) {
        logs = await apiLogService.getLogsByProvider(provider, limit);
      } else {
        logs = await apiLogService.getAllLogs(limit);
      }

      res.json({ logs, count: logs.length });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  async getDbStatus(req: express.Request, res: express.Response) {
    try {
      const result = await database.query('SELECT COUNT(*) as count FROM sets');
      const setsCount = result.rows[0].count;

      const result2 = await database.query('SELECT COUNT(*) as count FROM cards');
      const cardsCount = result2.rows[0].count;

      const result3 = await database.query('SELECT COUNT(*) as count FROM products');
      const productsCount = result3.rows[0].count;

      res.json({
        sets: setsCount,
        cards: cardsCount,
        products: productsCount,
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
}
