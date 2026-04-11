import { v4 as uuidv4 } from 'uuid';
import { database } from '../../db/database';
import { tcgtrackingClient } from '../tcgtracking/tcgtracking.client';

export class TCGTrackingSetSyncService {
  async syncTCGTrackingSets(): Promise<{ synced: number; errors: string[] }> {
    const errors: string[] = [];
    let synced = 0;

    console.log('\n📚 Starting TCGTracking Japanese sets synchronization...');

    try {
      const sets = await tcgtrackingClient.getAllSets();
      console.log(`Found ${sets.length} sets from TCGTracking (category 85: Pokemon Japan)`);

      for (const set of sets) {
        try {
          // Verificar si el set ya existe para TCGTracking
          const existingRef = await database.query(
            `SELECT set_id FROM set_external_refs 
             WHERE source_code = $1 AND external_id = $2`,
            ['tcgtracking', set.id.toString()]
          );

          let setId: string;

          if (existingRef.rows.length > 0) {
            setId = existingRef.rows[0].set_id;
            console.log(`  ↻ Set already exists: ${set.name} (ID: ${set.id})`);
          } else {
            setId = uuidv4();
            console.log(`  ✓ New set: ${set.name} (ID: ${set.id})`);
          }

          // Obtener imagen del set desde los productos
          let setImage: string | null = null;
          try {
            setImage = await tcgtrackingClient.getSetImage(set.id);
          } catch (error) {
            console.log(`  ℹ️  No image found for set ${set.id}`);
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
            `tcgtracking:${set.abbreviation}`,
            set.name,
            null, // Series not available in TCGTracking
            set.published_on || null,
            null, // printed_total not available
            null, // total not available
            setImage, // symbol_image_url = first product image (logo)
            setImage, // logo_image_url = first product image
            'ja',
            JSON.stringify({
              product_count: set.product_count,
              sku_count: set.sku_count,
              api_url: set.api_url,
              pricing_url: set.pricing_url,
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
            'tcgtracking',
            set.id.toString(),
            set.abbreviation,
            set.name,
            'ja',
            JSON.stringify(set),
          ]);

          synced++;
        } catch (error) {
          const errorMsg = `Failed to sync TCGTracking set ${set.id}: ${(error as Error).message}`;
          console.error(`  ✗ ${errorMsg}`);
          errors.push(errorMsg);
        }
      }
    } catch (error) {
      const errorMsg = `Critical error during TCGTracking sets sync: ${(error as Error).message}`;
      console.error(errorMsg);
      errors.push(errorMsg);
    }

    console.log(`✓ TCGTracking sets sync completed. Synced: ${synced}, Errors: ${errors.length}\n`);
    return { synced, errors };
  }
}

export const tcgtrackingSetSyncService = new TCGTrackingSetSyncService();
