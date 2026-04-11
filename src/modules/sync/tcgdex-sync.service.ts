import { v4 as uuidv4 } from 'uuid';
import { database } from '../../db/database';
import { tcgdexClient } from '../tcgdex/tcgdex.client';

export class TCGdexSyncService {
  async syncTCGdexSets(language: string = 'ja'): Promise<{ synced: number; errors: string[] }> {
    const errors: string[] = [];
    let synced = 0;

    console.log(`\n📚 Starting TCGdex ${language.toUpperCase()} sets synchronization...`);

    try {
      const sets = await tcgdexClient.getAllSets(language);
      console.log(`Found ${sets.length} sets for language '${language}'`);

      for (const set of sets) {
        try {
          // Verificar si el set ya existe para este idioma
          const existingRef = await database.query(
            `SELECT set_id FROM set_external_refs 
             WHERE source_code = $1 AND external_id = $2 AND language = $3`,
            ['tcgdex', set.id, language]
          );

          let setId: string;

          if (existingRef.rows.length > 0) {
            setId = existingRef.rows[0].set_id;
            console.log(`  ↻ Set already exists: ${set.name} (${set.id})`);
          } else {
            setId = uuidv4();
            console.log(`  ✓ New set: ${set.name} (${set.id})`);
          }

          // Upsert en tabla sets
          const setSql = `
            INSERT INTO sets (
              id, canonical_code, name, series, release_date, 
              printed_total, total, symbol_image_url, logo_image_url,
              language, metadata, created_at, updated_at
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
            ON CONFLICT (canonical_code) DO UPDATE SET
              name = EXCLUDED.name,
              series = EXCLUDED.series,
              release_date = EXCLUDED.release_date,
              printed_total = EXCLUDED.printed_total,
              total = EXCLUDED.total,
              symbol_image_url = EXCLUDED.symbol_image_url,
              logo_image_url = EXCLUDED.logo_image_url,
              metadata = EXCLUDED.metadata,
              updated_at = CURRENT_TIMESTAMP
            RETURNING id
          `;

          const setResult = await database.query(setSql, [
            setId,
            `${language}:${set.id}`,
            set.name,
            set.serie || null,
            null, // No release date in TCGdex
            set.cardCount?.total || null,
            set.cardCount?.total || null,
            set.symbol || null,
            set.logo || null,
            language,
            JSON.stringify({
              cardCount: set.cardCount,
              serieId: set.serieId,
            }),
          ]);

          const finalSetId = setResult.rows[0].id;

          // Upsert en set_external_refs
          const refSql = `
            INSERT INTO set_external_refs (
              set_id, source_code, external_id, external_code, external_name,
              language, raw_json, created_at, updated_at
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
            ON CONFLICT (source_code, external_id) DO UPDATE SET
              set_id = EXCLUDED.set_id,
              external_code = EXCLUDED.external_code,
              external_name = EXCLUDED.external_name,
              language = EXCLUDED.language,
              raw_json = EXCLUDED.raw_json,
              updated_at = CURRENT_TIMESTAMP
          `;

          await database.query(refSql, [
            finalSetId,
            'tcgdex',
            set.id,
            set.id,
            set.name,
            language,
            JSON.stringify(set),
          ]);

          synced++;
        } catch (error) {
          const errorMsg = `Failed to sync TCGdex set ${set.id}: ${(error as Error).message}`;
          console.error(`  ✗ ${errorMsg}`);
          errors.push(errorMsg);
        }
      }
    } catch (error) {
      const errorMsg = `Critical error during TCGdex ${language} sets sync: ${(error as Error).message}`;
      console.error(errorMsg);
      errors.push(errorMsg);
    }

    console.log(`✓ TCGdex ${language} sets sync completed. Synced: ${synced}, Errors: ${errors.length}\n`);
    return { synced, errors };
  }

  async syncTCGdexCardsBySet(setId: string, language: string = 'ja'): Promise<{ synced: number; errors: string[] }> {
    const errors: string[] = [];
    let synced = 0;

    console.log(`\n🃏 Starting TCGdex ${language.toUpperCase()} cards sync for set ${setId}...`);

    try {
      // Obtener el set interno
      const setResult = await database.query(
        `SELECT set_id FROM set_external_refs 
         WHERE source_code = $1 AND external_id = $2 AND language = $3`,
        ['tcgdex', setId, language]
      );

      if (setResult.rows.length === 0) {
        throw new Error(`Set ${setId} not found for language ${language}. Sync sets first.`);
      }

      const internalSetId = setResult.rows[0].set_id;

      // Obtener cartas del set
      let cards: any[] = [];
      try {
        cards = await tcgdexClient.getSetCards(setId, language);
        console.log(`Found ${cards.length} cards for ${setId} in ${language}`);
      } catch (apiError: any) {
        // Si es 404, el set no tiene cartas en este idioma - saltamos silenciosamente
        if (apiError.response?.status === 404) {
          console.log(`  ℹ️ No cards found for ${setId} in ${language} (404) - skipping`);
          return { synced: 0, errors: [] };
        }
        throw apiError;
      }

      for (const card of cards) {
        try {
          // Buscar referencia externa existente
          const existingRef = await database.query(
            `SELECT card_id FROM card_external_refs 
             WHERE source_code = $1 AND external_id = $2`,
            ['tcgdex', card.id]
          );

          let cardId: string;

          if (existingRef.rows.length > 0) {
            cardId = existingRef.rows[0].card_id;
          } else {
            cardId = uuidv4();
          }

          // Upsert card
          const cardSql = `
            INSERT INTO cards (
              id, set_id, canonical_card_code, number, name,
              supertype, rarity, artist, hp, flavor_text,
              image_small_url, image_large_url,
              metadata, created_at, updated_at
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
            ON CONFLICT (set_id, number, name) DO UPDATE SET
              supertype = EXCLUDED.supertype,
              rarity = EXCLUDED.rarity,
              artist = EXCLUDED.artist,
              hp = EXCLUDED.hp,
              flavor_text = EXCLUDED.flavor_text,
              image_small_url = EXCLUDED.image_small_url,
              image_large_url = EXCLUDED.image_large_url,
              metadata = EXCLUDED.metadata,
              updated_at = CURRENT_TIMESTAMP
            RETURNING id
          `;

          const cardResult = await database.query(cardSql, [
            cardId,
            internalSetId,
            `${language}:${setId}-${card.number || card.id}`,
            card.number || card.id,
            card.name,
            card.supertype || null,
            card.rarity || null,
            card.illustrator || null,
            card.hp || null,
            null, // No flavor text in TCGdex
            typeof card.image === 'string' ? card.image : card.image?.small || null,
            typeof card.image === 'string' ? null : card.image?.large || null,
            JSON.stringify({
              types: card.types,
              stage: card.stage,
              evolvesFrom: card.evolvesFrom,
              attacks: card.attacks,
              abilities: card.abilities,
            }),
          ]);

          if (!cardResult.rows?.length) {
            throw new Error(`Card insert failed for ${card.id}`);
          }

          const finalCardId = cardResult.rows[0].id;

          // Upsert card_external_refs
          await database.query(
            `INSERT INTO card_external_refs (
               card_id, source_code, external_id, local_number, raw_json, created_at, updated_at
             ) VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
             ON CONFLICT (source_code, external_id) DO UPDATE SET
               card_id = EXCLUDED.card_id,
               local_number = EXCLUDED.local_number,
               raw_json = EXCLUDED.raw_json,
               updated_at = CURRENT_TIMESTAMP`,
            [finalCardId, 'tcgdex', card.id, card.number || card.id, JSON.stringify(card)]
          );

          synced++;
        } catch (error) {
          const errorMsg = `Failed to sync card ${card.id}: ${(error as Error).message}`;
          console.error(`  ✗ ${errorMsg}`);
          errors.push(errorMsg);
        }
      }
    } catch (error) {
      const errorMsg = `Critical error: ${(error as Error).message}`;
      console.error(errorMsg);
      errors.push(errorMsg);
    }

    console.log(`✓ TCGdex cards sync completed. Synced: ${synced}, Errors: ${errors.length}\n`);
    return { synced, errors };
  }

  async syncAllTCGdexCards(language: string = 'ja'): Promise<{ totalSynced: number; totalErrors: number }> {
    let totalSynced = 0;
    let totalErrors = 0;

    console.log(`\n🌐 Starting FULL TCGdex ${language.toUpperCase()} sync...`);

    try {
      // Primero sincronizar sets
      const setResult = await this.syncTCGdexSets(language);
      totalSynced += setResult.synced;
      totalErrors += setResult.errors.length;

      // Luego sincronizar todas las cartas
      const setsResult = await database.query(
        `SELECT DISTINCT external_id FROM set_external_refs 
         WHERE source_code = $1 AND language = $2`,
        ['tcgdex', language]
      );

      const setIds = setsResult.rows.map((row: any) => row.external_id);
      console.log(`Syncing cards for ${setIds.length} TCGdex sets...`);

      for (const setId of setIds) {
        const cardResult = await this.syncTCGdexCardsBySet(setId, language);
        totalSynced += cardResult.synced;
        totalErrors += cardResult.errors.length;
      }

      console.log(`\n✅ FULL TCGdex ${language} sync completed!`);
      console.log(`   Total synced: ${totalSynced}`);
      console.log(`   Total errors: ${totalErrors}`);
    } catch (error) {
      console.error('Error in sync:', error);
      totalErrors++;
    }

    return { totalSynced, totalErrors };
  }
}

export const tcgdexSyncService = new TCGdexSyncService();
