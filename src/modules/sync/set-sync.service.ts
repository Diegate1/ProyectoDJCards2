import { v4 as uuidv4 } from 'uuid';
import { database } from '../../db/database';
import { pokemonTcgClient } from '../pokemon-tcg/pokemon-tcg.client';
import { PokemonTCGSet } from '../../common/types';

export class SetSyncService {
  async syncPokemonTCGSets(): Promise<{ synced: number; errors: string[] }> {
    const errors: string[] = [];
    let synced = 0;
    let page = 1;
    let hasMore = true;

    console.log('Starting Pokemon TCG sets synchronization...');

    try {
      while (hasMore) {
        try {
          const response = await pokemonTcgClient.getAllSets(page, 250);
          
          for (const set of response.data) {
            try {
              await this.upsertSet(set);
              synced++;
            } catch (error) {
              const errorMsg = `Failed to sync set ${set.id}: ${(error as Error).message}`;
              console.error(errorMsg);
              errors.push(errorMsg);
            }
          }

          page++;
          hasMore = page * 250 < response.totalCount;
          console.log(`Processed page ${page - 1}, total synced: ${synced}`);
        } catch (error) {
          const errorMsg = `Error fetching page ${page}: ${(error as Error).message}`;
          console.error(errorMsg);
          errors.push(errorMsg);
          break;
        }
      }
    } catch (error) {
      const errorMsg = `Critical error during sync: ${(error as Error).message}`;
      console.error(errorMsg);
      errors.push(errorMsg);
    }

    console.log(`✓ Pokemon TCG sets sync completed. Synced: ${synced}, Errors: ${errors.length}`);
    return { synced, errors };
  }

  private async upsertSet(set: PokemonTCGSet): Promise<void> {
    try {
      // Primero, intentar obtener un set existente con este código externo
      const existingRefResult = await database.query(
        `SELECT set_id FROM set_external_refs 
         WHERE source_code = $1 AND external_id = $2`,
        ['pokemontcg', set.id]
      );

      let setId: string;

      if (existingRefResult.rows.length > 0 && existingRefResult.rows[0].set_id) {
        // Si existe una referencia con set_id válido, usar ese
        setId = existingRefResult.rows[0].set_id;
      } else {
        // Si no existe o está null, crear/buscar uno nuevo
        // Primero intentar buscar por canonical_code
        const existingSetResult = await database.query(
          `SELECT id FROM sets WHERE canonical_code = $1 LIMIT 1`,
          [set.id]
        );

        if (existingSetResult.rows.length > 0) {
          setId = existingSetResult.rows[0].id;
        } else {
          // Si no existe, crear un nuevo
          setId = uuidv4();
        }
      }

      // Upsert en la tabla sets
      const setSql = `
        INSERT INTO sets (
          id, canonical_code, name, series, release_date,
          printed_total, total, symbol_image_url, logo_image_url,
          metadata, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
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
        set.id,
        set.name,
        set.series || null,
        set.releaseDate ? new Date(set.releaseDate).toISOString().split('T')[0] : null,
        set.printedTotal || null,
        set.total || null,
        set.images?.symbol || null,
        set.images?.logo || null,
        JSON.stringify({ ptcgoCode: set.ptcgoCode, legalities: set.legalities }),
      ]);

      const finalSetId = setResult.rows[0].id;

      // Upsert en set_external_refs
      const refSql = `
        INSERT INTO set_external_refs (
          set_id, source_code, external_id, external_code, external_name, raw_json
        ) VALUES ($1, $2, $3, $4, $5, $6)
        ON CONFLICT (source_code, external_id) DO UPDATE SET
          set_id = EXCLUDED.set_id,
          external_code = EXCLUDED.external_code,
          external_name = EXCLUDED.external_name,
          raw_json = EXCLUDED.raw_json,
          updated_at = CURRENT_TIMESTAMP
      `;

      await database.query(refSql, [
        finalSetId,
        'pokemontcg',
        set.id,
        set.ptcgoCode || null,
        set.name,
        JSON.stringify(set),
      ]);

      console.log(`✓ Set synced: ${set.name} (${set.id})`);
    } catch (error) {
      console.error(`Error upserting set ${set.id}:`, error);
      throw error;
    }
  }
}

export const setSyncService = new SetSyncService();
