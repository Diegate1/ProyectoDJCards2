/**
 * TCGdex Chinese Card Synchronization Service
 * Sincroniza cartas chinas desde TCGdex API
 * 
 * IMPORTANTE: TCGdex para zh-cn tiene limitaciones:
 * - Solo 829 cartas totales (cobertura limitada)
 * - No hay endpoint por set (/sets/{id}/cards)
 * - Debe usarse endpoint global /zh-cn/cards
 */

import { database } from '../../db/database';
import { tcgdexClient } from '../tcgdex/tcgdex.client';
import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';

export class TCGdexChineseCardSyncService {
  private language = 'zh';
  private sourceCode = 'tcgdex';

  async syncAllCards(): Promise<void> {
    try {
      console.log('\n' + '═'.repeat(80));
      console.log('🇨🇳 SYNCING TCGDEX CHINESE CARDS (Global endpoint)');
      console.log('═'.repeat(80) + '\n');

      console.log('⚠️  NOTE: TCGdex zh-cn has VERY LIMITED coverage\n');
      console.log('   - Only 829 total cards');
      console.log('   - Only 7 sets have cartas: sv8a, sv7a, sv9, sv9a, sv10, sv8, sv7');
      console.log('   - 41 sets (CSM/CS series) have NO card data\n');

      // 1. Obtener TODAS las cartas chinas del endpoint global
      console.log('1️⃣  Fetching all Chinese cards from global endpoint...');
      
      let allCards: any[] = [];
      try {
        const response = await axios.get('https://api.tcgdex.net/v2/zh-cn/cards', {
          timeout: 30000,
        });
        allCards = response.data;
      } catch (error: any) {
        console.error('Error fetching cards:', error.message);
        throw error;
      }

      console.log(`   ✓ Found ${allCards.length} cards\n`);

      // 2. Procesar cartas
      let synced = 0;
      let errors = 0;
      let skipped = 0;

      for (let i = 0; i < allCards.length; i++) {
        const card = allCards[i];
        process.stdout.write(
          `\r2️⃣  Processing cards... [${i + 1}/${allCards.length}] ${card.name}`
        );

        try {
          // Extraer set ID del card ID (ej: "SV8a-001" -> "sv8a")
          const cardSetId = card.id?.split('-')[0]?.toLowerCase();
          
          if (!cardSetId) {
            skipped++;
            continue;
          }

          await this.upsertCard(cardSetId, card);
          synced++;
        } catch (error: any) {
          console.error(`\n   ❌ Error syncing card ${card.id}:`, error.message);
          errors++;
        }
      }

      console.log('\n\n' + '═'.repeat(80));
      console.log('📊 RESULTS:');
      console.log(`   ✅ Synced: ${synced} (only 7 sets have data)`);
      console.log(`   ⏭️  Skipped: ${skipped} (set not in database)`);
      console.log(`   ❌ Errors: ${errors}`);
      console.log('═'.repeat(80) + '\n');
      console.log('💡 TIP: For full coverage, consider using TCGdex EN/JA or other sources\n');

    } catch (error: any) {
      console.error('Fatal error:', error.message);
      throw error;
    }
  }

  private async upsertCard(externalSetId: string, card: any): Promise<void> {
    try {
      // 1. Buscar set en BD por external_id
      // Puede ser que el set esté guardado con ese ID chino directo O con su equivalente inglés
      const setResults = await database.query(
        `SELECT DISTINCT set_id FROM set_external_refs 
         WHERE (external_id = $1 OR external_id = $2 OR external_id = $3)
           AND source_code = 'tcgdex'
         LIMIT 1`,
        [
          externalSetId,
          externalSetId.toUpperCase(),
          `zh:${externalSetId}`,
        ]
      );

      if (setResults.rows.length === 0) {
        // Set no existe en BD - saltarlo
        return;
      }

      const internalSetId = setResults.rows[0].set_id;
      const cardId = uuidv4();

      // 2. Extraer imagen
      let imageUrl = null;
      if (card.image?.small) {
        imageUrl = card.image.small;
      } else if (card.image) {
        imageUrl = card.image;
      }

      const localId = card.localId || card.id?.split('-')[1] || null;

      // 3. Upsert en cards
      const cardQuery = `
        INSERT INTO cards (
          id, set_id, name, number, rarity, 
          image_small_url, created_at, updated_at
        )
        VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
        ON CONFLICT (set_id, number) DO UPDATE SET
          name = EXCLUDED.name,
          image_small_url = EXCLUDED.image_small_url,
          updated_at = NOW()
        RETURNING id
      `;

      const cardQueryResult = await database.query(cardQuery, [
        cardId,
        internalSetId,
        card.name,
        localId,
        card.rarity || null,
        imageUrl,
      ]);

      const internalCardId = cardQueryResult.rows[0].id;

      // 4. Upsert en card_external_refs
      const refQuery = `
        INSERT INTO card_external_refs (
          card_id, source_code, external_id, local_number, 
          raw_json, created_at, updated_at
        )
        VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
        ON CONFLICT (source_code, external_id) DO UPDATE SET
          raw_json = EXCLUDED.raw_json,
          updated_at = NOW()
      `;

      const externalId = card.id;

      await database.query(refQuery, [
        internalCardId,
        this.sourceCode,
        externalId,
        localId,
        JSON.stringify({
          hp: card.hp,
          types: card.types,
          rarity: card.rarity,
          illustrator: card.illustrator,
          image: card.image,
        }),
      ]);

    } catch (error: any) {
      throw error;
    }
  }
}

export const tcgdexChineseCardSyncService = new TCGdexChineseCardSyncService();
