import { v4 as uuidv4 } from 'uuid';
import { database } from '../../db/database';
import { tcgdexChineseClient } from './tcgdex-chinese.client';

export class TCGdexChineseSyncService {
  /**
   * Sincronizar todos los sets y cartas en chino desde TCGdex
   */
  async syncChineseSets(): Promise<{ synced: number; errors: string[] }> {
    const errors: string[] = [];
    let synced = 0;

    try {
      console.log('🌐 Starting TCGdex Chinese (zh-cn) sets synchronization...');

      // Obtener lista de sets en chino
      const sets = await tcgdexChineseClient.getSets();
      console.log(`📦 Found ${sets.length} sets in Chinese`);

      if (sets.length === 0) {
        console.warn('⚠️ No sets found from TCGdex Chinese API');
        return { synced: 0, errors: ['No sets found'] };
      }

      for (const set of sets) {
        try {
          console.log(`\n📥 Processing set: ${set.id} - ${set.name}`);

          // Insertar set en la BD
          const setQuery = `
            INSERT INTO sets (name, language, metadata, created_at, updated_at)
            VALUES ($1, $2, $3, NOW(), NOW())
            ON CONFLICT (name, language) DO UPDATE SET updated_at = NOW()
            RETURNING id;
          `;

          const setResult = await database.query(setQuery, [
            set.name,
            'zh',
            JSON.stringify({
              tcgdex_id: set.id,
              card_count: set.cardCount
            })
          ]);

          const setInternalId = setResult.rows[0].id;

          // Insertar referencia externa
          const refQuery = `
            INSERT INTO set_external_refs (set_id, source_code, external_id, external_name, language, raw_json, created_at, updated_at)
            VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
            ON CONFLICT (source_code, external_id) DO NOTHING;
          `;

          await database.query(refQuery, [
            setInternalId,
            'tcgdex-zh',
            set.id,
            set.name,
            'zh',
            JSON.stringify(set)
          ]);

          // Obtener cartas del set
          const cards = await tcgdexChineseClient.getCardsBySet(set.id);
          console.log(`  📄 Found ${cards.length} cards in set ${set.id}`);

          // Sincronizar cartas
          for (const card of cards) {
            try {
              // Obtener detalle completo de la carta
              const cardDetail = await tcgdexChineseClient.getCard(card.id);
              
              if (!cardDetail) {
                console.log(`    ⚠️ Could not fetch full details for ${card.id}`);
                continue;
              }

              // Insertar carta
              const cardQuery = `
                INSERT INTO cards (
                  set_id, 
                  name, 
                  number, 
                  rarity, 
                  supertype,
                  hp,
                  artist,
                  image_small_url,
                  image_large_url,
                  flavor_text,
                  metadata,
                  created_at,
                  updated_at
                )
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW(), NOW())
                ON CONFLICT (set_id, number, name) DO UPDATE SET updated_at = NOW()
                RETURNING id;
              `;

              const cardResult = await database.query(cardQuery, [
                setInternalId,
                cardDetail.name,
                cardDetail.localId,
                cardDetail.rarity || null,
                cardDetail.category || null,
                cardDetail.hp || null,
                cardDetail.illustrator || null,
                cardDetail.image?.small || null,
                cardDetail.image?.large || null,
                null,
                JSON.stringify({
                  tcgdex_id: cardDetail.id,
                  types: cardDetail.types || [],
                  weaknesses: cardDetail.weaknesses || [],
                  resistances: cardDetail.resistances || [],
                  attacks: cardDetail.attacks || [],
                  abilities: cardDetail.abilities || []
                })
              ]);

              const cardInternalId = cardResult.rows[0].id;

              // Insertar referencia externa de carta
              const cardRefQuery = `
                INSERT INTO card_external_refs (card_id, source_code, external_id, local_number, raw_json, created_at, updated_at)
                VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
                ON CONFLICT (source_code, external_id) DO NOTHING;
              `;

              await database.query(cardRefQuery, [
                cardInternalId,
                'tcgdex-zh',
                cardDetail.id,
                cardDetail.localId,
                JSON.stringify(cardDetail)
              ]);

              synced++;
            } catch (cardError) {
              const errorMsg = `Error syncing card ${card.id}: ${(cardError as Error).message}`;
              console.error(`    ❌ ${errorMsg}`);
              errors.push(errorMsg);
            }
          }

          console.log(`  ✓ Set ${set.id} completed. Total synced: ${synced}`);
        } catch (setError) {
          const errorMsg = `Error syncing set ${set.id}: ${(setError as Error).message}`;
          console.error(`❌ ${errorMsg}`);
          errors.push(errorMsg);
        }
      }

      console.log(`\n✓ TCGdex Chinese sets sync completed. Synced: ${synced}, Errors: ${errors.length}`);
      return { synced, errors };
    } catch (error) {
      const errorMsg = `Critical error during TCGdex Chinese sync: ${(error as Error).message}`;
      console.error(errorMsg);
      errors.push(errorMsg);
      return { synced, errors };
    }
  }
}

export const tcgdexChineseSyncService = new TCGdexChineseSyncService();
