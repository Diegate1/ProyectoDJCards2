import { v4 as uuidv4 } from 'uuid';
import { database } from '../../db/database';
import { tcgtrackingClient } from '../tcgtracking/tcgtracking.client';

export class TCGTrackingCardSyncService {
  async syncCardsBySet(setId: number): Promise<{ synced: number; errors: string[] }> {
    const errors: string[] = [];
    let synced = 0;

    console.log(`🃏 Starting card synchronization for TCGTracking set ${setId}...`);

    try {
      // Primero, obtener el set interno para enlazar las cartas
      const setResult = await database.query(
        `SELECT set_id FROM set_external_refs 
         WHERE source_code = $1 AND external_id = $2`,
        ['tcgtracking', setId.toString()]
      );

      if (setResult.rows.length === 0) {
        throw new Error(
          `Set ${setId} not found in database. Please sync sets first with: npm run sync:sets/tcgtracking`
        );
      }

      const internalSetId = setResult.rows[0].set_id;

      if (!internalSetId) {
        throw new Error(
          `Set ${setId} found in references but has no internal set_id. Database corrupted?`
        );
      }

      // Obtener cartas del set
      const cards = await tcgtrackingClient.getCardsBySet(setId);
      console.log(`  Found ${cards.length} cards for set ${setId}`);

      for (const card of cards) {
        try {
          await this.upsertCard(card, internalSetId);
          synced++;
        } catch (error) {
          const errorMsg = `Failed to sync card ${card.id}: ${(error as Error).message}`;
          console.error(`  ✗ ${errorMsg}`);
          errors.push(errorMsg);
        }
      }

      console.log(
        `  ✓ Card sync for set ${setId} completed. Synced: ${synced}, Errors: ${errors.length}`
      );
    } catch (error) {
      const errorMsg = `Critical error during card sync for set ${setId}: ${(error as Error).message}`;
      console.error(errorMsg);
      errors.push(errorMsg);
    }

    return { synced, errors };
  }

  async syncAllCardsBySets(): Promise<{ totalSynced: number; totalErrors: number }> {
    try {
      // Obtener todos los sets sincronizados de TCGTracking
      const setsResult = await database.query(
        `SELECT DISTINCT external_id FROM set_external_refs WHERE source_code = $1`,
        ['tcgtracking']
      );

      const sets = setsResult.rows.map((row: any) => parseInt(row.external_id, 10));
      let totalSynced = 0;
      let totalErrors = 0;

      console.log(`\nSyncing cards for ${sets.length} TCGTracking sets...`);

      for (const setId of sets) {
        try {
          const result = await this.syncCardsBySet(setId);
          totalSynced += result.synced;
          totalErrors += result.errors.length;
        } catch (error) {
          console.error(`Error syncing set ${setId}:`, error);
          totalErrors++;
        }
      }

      console.log(
        `✓ All TCGTracking sets card sync completed. Total synced: ${totalSynced}, Total errors: ${totalErrors}\n`
      );
      return { totalSynced, totalErrors };
    } catch (error) {
      console.error('Error in syncAllCardsBySets:', error);
      throw error;
    }
  }

  private async upsertCard(card: any, internalSetId: string): Promise<void> {
    try {
      // Buscar referencia externa existente
      const existingRefResult = await database.query(
        `SELECT card_id FROM card_external_refs 
         WHERE source_code = $1 AND external_id = $2`,
        ['tcgtracking', card.id.toString()]
      );

      let cardId: string;

      if (existingRefResult.rows.length > 0) {
        cardId = existingRefResult.rows[0].card_id;
      } else {
        cardId = uuidv4();
      }

      // Upsert en la tabla cards
      const cardSql = `
        INSERT INTO cards (
          id, set_id, canonical_card_code, number, name,
          supertype, rarity, artist, hp, flavor_text,
          image_small_url, image_large_url,
          metadata, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        ON CONFLICT (set_id, number, name) DO UPDATE SET
          rarity = EXCLUDED.rarity,
          image_small_url = EXCLUDED.image_small_url,
          metadata = EXCLUDED.metadata,
          updated_at = CURRENT_TIMESTAMP
        RETURNING id
      `;

      const cardResult = await database.query(cardSql, [
        cardId,
        internalSetId,
        `tcgtracking-${card.number}`,
        card.number,
        card.name || card.clean_name,
        'Pokemon', // supertype
        card.rarity || null,
        null, // artist not available
        null, // hp not available
        null, // flavor_text not available
        card.image_url || null,
        card.image_url || null,
        JSON.stringify({
          tcgplayer_id: card.id,
          tcgplayer_url: card.tcgplayer_url,
          image_count: card.image_count,
          manapool_url: card.manapool_url,
        }),
      ]);

      const finalCardId = cardResult.rows[0].id;

      // Upsert en card_external_refs
      const refSql = `
        INSERT INTO card_external_refs (
          card_id, source_code, external_id, raw_json, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        ON CONFLICT (source_code, external_id) DO UPDATE SET
          card_id = EXCLUDED.card_id,
          raw_json = EXCLUDED.raw_json,
          updated_at = CURRENT_TIMESTAMP
      `;

      await database.query(refSql, [
        finalCardId,
        'tcgtracking',
        card.id.toString(),
        JSON.stringify(card),
      ]);
    } catch (error) {
      throw error;
    }
  }
}

export const tcgtrackingCardSyncService = new TCGTrackingCardSyncService();
