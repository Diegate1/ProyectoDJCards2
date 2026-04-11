import { v4 as uuidv4 } from 'uuid';
import { database } from '../../db/database';
import { pokemonTcgClient } from '../pokemon-tcg/pokemon-tcg.client';
import { PokemonTCGCard } from '../../common/types';

export class CardSyncService {
  async syncCardsBySet(setId: string): Promise<{ synced: number; errors: string[] }> {
    const errors: string[] = [];
    let synced = 0;
    let page = 1;
    let hasMore = true;

    console.log(`Starting card synchronization for set ${setId}...`);

    try {
      // Primero, obtener el set interno para enlazar las cartas
      const setResult = await database.query(
        `SELECT set_id FROM set_external_refs 
         WHERE source_code = $1 AND external_id = $2`,
        ['pokemontcg', setId]
      );

      if (setResult.rows.length === 0) {
        throw new Error(`Set ${setId} not found in database. Please sync sets first with: npm run sync:sets/pokemontcg`);
      }

      const internalSetId = setResult.rows[0].set_id;
      
      if (!internalSetId) {
        throw new Error(`Set ${setId} found in references but has no internal set_id. Database corrupted?`);
      }

      while (hasMore) {
        try {
          console.log(`Fetching page ${page} for set ${setId}...`);
          const response = await pokemonTcgClient.getCardsBySet(setId, page, 250);
          console.log(`  API returned ${response.data.length} items (totalCount: ${response.totalCount})`);
          console.log(`  First card of page ${page}: #${response.data[0]?.number} ${response.data[0]?.name}`);
          console.log(`  Last card of page ${page}: #${response.data[response.data.length - 1]?.number} ${response.data[response.data.length - 1]?.name}`);

          for (const card of response.data) {
            try {
              await this.upsertCard(card, internalSetId);
              synced++;
            } catch (error) {
              const errorMsg = `Failed to sync card ${card.id}: ${(error as Error).message}`;
              console.error(errorMsg);
              errors.push(errorMsg);
            }
          }

          hasMore = (page * 250) < response.totalCount; // Check if there are more pages using totalCount
          console.log(`Processed page ${page} for set ${setId}, total synced: ${synced}, hasMore: ${hasMore}`);
          page++;
        } catch (error) {
          const errorMsg = `Error fetching page ${page} for set ${setId}: ${(error as Error).message}`;
          console.error(errorMsg);
          errors.push(errorMsg);
          break;
        }
      }
    } catch (error) {
      const errorMsg = `Critical error during card sync for set ${setId}: ${(error as Error).message}`;
      console.error(errorMsg);
      errors.push(errorMsg);
    }

    console.log(`✓ Card sync for set ${setId} completed. Synced: ${synced}, Errors: ${errors.length}`);
    return { synced, errors };
  }

  async syncAllCardsBySets(): Promise<{ totalSynced: number; totalErrors: number }> {
    try {
      // Obtener todos los sets sincronizados
      const setsResult = await database.query(
        `SELECT DISTINCT external_id FROM set_external_refs WHERE source_code = $1`,
        ['pokemontcg']
      );

      const sets = setsResult.rows.map((row: any) => row.external_id);
      let totalSynced = 0;
      let totalErrors = 0;

      console.log(`Syncing cards for ${sets.length} sets...`);

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

      console.log(`✓ All sets card sync completed. Total synced: ${totalSynced}, Total errors: ${totalErrors}`);
      return { totalSynced, totalErrors };
    } catch (error) {
      console.error('Error in syncAllCardsBySets:', error);
      throw error;
    }
  }

  private async upsertCard(card: PokemonTCGCard, internalSetId: string): Promise<void> {
    try {
      // Primero, intentar obtener una tarjeta existente
      const existingRefResult = await database.query(
        `SELECT card_id FROM card_external_refs 
         WHERE source_code = $1 AND external_id = $2`,
        ['pokemontcg', card.id]
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

      console.log(`  [DB] → Attempting INSERT/UPDATE for ${card.id} (${card.number} ${card.name}) with internalSetId=${internalSetId}`);
      
      const cardResult = await database.query(cardSql, [
        cardId,
        internalSetId,
        `${card.set.id}-${card.number}`,
        card.number,
        card.name,
        card.supertype || null,
        card.rarity || null,
        card.artist || null,
        card.hp || null,
        card.flavorText || null,
        card.images?.small || null,
        card.images?.large || null,
        JSON.stringify({
          types: card.types,
          evolvesFrom: card.evolvesFrom,
          nationalPokedexNumbers: card.nationalPokedexNumbers,
          legalities: card.legalities,
        }),
      ]);

      if (!cardResult.rows || cardResult.rows.length === 0) {
        console.error(`  [DB] ⚠️ Card insert returned NO rows for ${card.id} (${card.number} ${card.name})`);
        throw new Error(`Card insert/update failed to return ID for ${card.id}`);
      }

      const finalCardId = cardResult.rows[0].id;
      console.log(`  [DB] ✓ Card saved: ${card.id} -> ${finalCardId}`);

      // Upsert en card_external_refs
      const refSql = `
        INSERT INTO card_external_refs (
          card_id, source_code, external_id, local_number, raw_json
        ) VALUES ($1, $2, $3, $4, $5)
        ON CONFLICT (source_code, external_id) DO UPDATE SET
          card_id = EXCLUDED.card_id,
          local_number = EXCLUDED.local_number,
          raw_json = EXCLUDED.raw_json,
          updated_at = CURRENT_TIMESTAMP
      `;

      console.log(`  [DB] Upserting ref for ${card.id}...`);
      await database.query(refSql, [
        finalCardId,
        'pokemontcg',
        card.id,
        card.number,
        JSON.stringify(card),
      ]);
      console.log(`  [DB] ✓ Ref saved for ${card.id}`);

      // Guardar ataques si existen
      if (card.attacks && card.attacks.length > 0) {
        try {
          await this.upsertAttacks(finalCardId, card.attacks);
        } catch (attackError) {
          console.error(`  ⚠️ Failed to sync attacks for ${card.id}:`, (attackError as Error).message);
        }
      }

      // Guardar habilidades si existen
      if (card.abilities && card.abilities.length > 0) {
        try {
          await this.upsertAbilities(finalCardId, card.abilities);
        } catch (abilityError) {
          console.error(`  ⚠️ Failed to sync abilities for ${card.id}:`, (abilityError as Error).message);
        }
      }

      console.log(`✓ Card synced: ${card.name} (${card.id})`);
    } catch (error) {
      console.error(`✗ ERROR upserting card ${card.id}:`, (error as Error).message);
      throw error;
    }
  }

  private async upsertAttacks(cardId: string, attacks: any[]): Promise<void> {
    try {
      // Primero, eliminar ataques existentes
      await database.query('DELETE FROM card_attacks WHERE card_id = $1', [cardId]);

      // Insertar nuevos ataques
      for (let i = 0; i < attacks.length; i++) {
        const attack = attacks[i];
        const sql = `
          INSERT INTO card_attacks (
            card_id, position, name, text, damage, cost
          ) VALUES ($1, $2, $3, $4, $5, $6)
        `;

        await database.query(sql, [
          cardId,
          i,
          attack.name || null,
          attack.text || null,
          attack.damage || null,
          attack.cost ? JSON.stringify(attack.cost) : null,
        ]);
      }
    } catch (error) {
      console.error(`Error upserting attacks for card ${cardId}:`, error);
      // No lanzamos error para no interrumpir el flujo
    }
  }

  private async upsertAbilities(cardId: string, abilities: any[]): Promise<void> {
    try {
      // Primero, eliminar habilidades existentes
      await database.query('DELETE FROM card_abilities WHERE card_id = $1', [cardId]);

      // Insertar nuevas habilidades
      for (const ability of abilities) {
        const sql = `
          INSERT INTO card_abilities (
            card_id, name, type, text
          ) VALUES ($1, $2, $3, $4)
        `;

        await database.query(sql, [
          cardId,
          ability.name || null,
          ability.type || null,
          ability.text || null,
        ]);
      }
    } catch (error) {
      console.error(`Error upserting abilities for card ${cardId}:`, error);
      // No lanzamos error para no interrumpir el flujo
    }
  }
}

export const cardSyncService = new CardSyncService();
