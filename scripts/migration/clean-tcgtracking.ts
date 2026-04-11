import * as dotenv from 'dotenv';
import { database } from '../src/db/database';

dotenv.config();

async function cleanTCGTrackingData() {
  try {
    console.log('='.repeat(80));
    console.log('CLEANING TCGTracking Data from Database');
    console.log('='.repeat(80));

    await database.connect();
    console.log('✓ Connected to database\n');

    // 1. Obtener IDs de sets de TCGTracking
    console.log('1️⃣  Getting TCGTracking sets...');
    const setsResult = await database.query(
      `SELECT set_id FROM set_external_refs WHERE source_code = 'tcgtracking'`
    );
    const setIds = setsResult.rows.map((r: any) => r.set_id);
    console.log(`  Found ${setIds.length} TCGTracking sets`);

    // 2. Obtener cartas de esos sets
    console.log('\n2️⃣  Getting cards for those sets...');
    if (setIds.length > 0) {
      const cardIds = await database.query(
        `SELECT COUNT(*) as count FROM cards WHERE set_id = ANY($1)`,
        [setIds]
      );
      console.log(`  Found ${cardIds.rows[0].count} cards`);

      // 3. Eliminar cartas
      console.log('\n3️⃣  Deleting cards...');
      await database.query(
        `DELETE FROM card_external_refs WHERE card_id IN (
          SELECT id FROM cards WHERE set_id = ANY($1)
        )`,
        [setIds]
      );
      const deleteCardsResult = await database.query(
        `DELETE FROM cards WHERE set_id = ANY($1)`,
        [setIds]
      );
      console.log(`  ✓ Deleted ${deleteCardsResult.rowCount} cards`);
    }

    // 4. Eliminar sets (opcional - si quieres re-sincronizar sets también)
    // Descomentar la siguiente línea si quieres limpiar todos los sets:
    // await database.query(`DELETE FROM set_external_refs WHERE source_code = 'tcgtracking'`);
    // await database.query(`DELETE FROM sets WHERE language = 'ja' AND canonical_code LIKE 'tcgtracking:%'`);

    console.log('\n✅ Cleanup complete!');
    console.log('   Now run: npm run sync:tcgtracking');
    console.log('='.repeat(80));

    await database.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error during cleanup:', error);
    await database.close();
    process.exit(1);
  }
}

cleanTCGTrackingData();
