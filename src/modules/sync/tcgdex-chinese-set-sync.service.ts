/**
 * TCGdex Chinese Set Synchronization Service
 * Sincroniza sets chinos desde TCGdex API
 */

import { database } from '../../db/database';
import { tcgdexClient } from '../tcgdex/tcgdex.client';
import { v4 as uuidv4 } from 'uuid';

export class TCGdexChineseSetSyncService {
  private language = 'zh'; // Chino simplificado

  async syncAllSets(): Promise<void> {
    try {
      console.log('\n' + '═'.repeat(80));
      console.log('🇨🇳 SYNCING TCGDEX CHINESE SETS');
      console.log('═'.repeat(80) + '\n');

      // 1. Obtener todos los sets
      console.log('1️⃣  Fetching all Chinese sets from TCGdex...');
      const tcgdexSets = await tcgdexClient.getAllSets('zh-cn');
      console.log(`   ✓ Found ${tcgdexSets.length} sets\n`);

      // 2. Procesar cada set
      let synced = 0;
      let errors = 0;

      for (let i = 0; i < tcgdexSets.length; i++) {
        const tcgSet = tcgdexSets[i];
        process.stdout.write(
          `\r2️⃣  Processing sets... [${i + 1}/${tcgdexSets.length}] ${tcgSet.name}`
        );

        try {
          await this.upsertSet(tcgSet);
          synced++;
        } catch (error: any) {
          console.error(`\n   ❌ Error syncing set ${tcgSet.id}:`, error.message);
          errors++;
        }
      }

      console.log('\n\n' + '═'.repeat(80));
      console.log('📊 RESULTS:');
      console.log(`   ✅ Synced: ${synced}`);
      console.log(`   ❌ Errors: ${errors}`);
      console.log('═'.repeat(80) + '\n');

    } catch (error: any) {
      console.error('Fatal error:', error.message);
      throw error;
    }
  }

  private async upsertSet(tcgSet: any): Promise<void> {
    const setId = uuidv4();

    // Extraer release date si está disponible
    let releaseDate = null;
    if (tcgSet.releaseDate) {
      releaseDate = new Date(tcgSet.releaseDate);
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

    const cardCount = tcgSet.cardCount?.total || 0;
    const setResult = await database.query(setSql, [
      setId,
      `${this.language}:${tcgSet.id}`,
      tcgSet.name,
      tcgSet.serie || null,
      releaseDate,
      cardCount,
      cardCount,
      tcgSet.symbol || null,
      tcgSet.logo || null,
      this.language,
      JSON.stringify({
        cardCount: tcgSet.cardCount,
        serieId: tcgSet.serieId,
      }),
    ]);

    const internalSetId = setResult.rows[0].id;

    // Upsert en set_external_refs
    const refSql = `
      INSERT INTO set_external_refs (
        set_id, source_code, external_id, external_code, external_name, 
        language, raw_json, created_at, updated_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      ON CONFLICT (source_code, external_id) DO UPDATE SET
        set_id = EXCLUDED.set_id,
        external_code = EXCLUDED.external_code,
        external_name = EXCLUDED.external_name,
        language = EXCLUDED.language,
        raw_json = EXCLUDED.raw_json,
        updated_at = CURRENT_TIMESTAMP
    `;

    await database.query(refSql, [
      internalSetId,
      'tcgdex',
      tcgSet.id,
      tcgSet.id,
      tcgSet.name,
      this.language,
      JSON.stringify(tcgSet),
    ]);
  }
}

export const tcgdexChineseSetSyncService = new TCGdexChineseSetSyncService();
