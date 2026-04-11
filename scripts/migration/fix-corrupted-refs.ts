import * as dotenv from 'dotenv';
import { database } from '../src/db/database';

dotenv.config();

async function fixCorruptedRefs() {
  try {
    console.log('Connecting to database...');
    await database.connect();

    console.log('Finding corrupted set_external_refs (set_id = null)...');
    
    // Encontrar referencias corruptas
    const corruptedResult = await database.query(
      `SELECT id, source_code, external_id FROM set_external_refs 
       WHERE set_id IS NULL`
    );

    console.log(`Found ${corruptedResult.rows.length} corrupted references`);

    // Para cada referencia corrupta, buscar el set correspondiente
    for (const ref of corruptedResult.rows) {
      const setResult = await database.query(
        `SELECT id FROM sets WHERE canonical_code = $1 LIMIT 1`,
        [ref.external_id]
      );

      if (setResult.rows.length > 0) {
        const setId = setResult.rows[0].id;
        
        // Actualizar la referencia
        await database.query(
          `UPDATE set_external_refs SET set_id = $1 WHERE id = $2`,
          [setId, ref.id]
        );
        
        console.log(`✓ Fixed ref ${ref.id}: set_id = ${setId}`);
      } else {
        console.log(`✗ No set found for external_id ${ref.external_id}, deleting reference`);
        await database.query(
          `DELETE FROM set_external_refs WHERE id = $1`,
          [ref.id]
        );
      }
    }

    console.log('\nFinding corrupted card_external_refs (card_id = null)...');
    
    const corruptedCardsResult = await database.query(
      `SELECT id, source_code, external_id FROM card_external_refs 
       WHERE card_id IS NULL LIMIT 100`
    );

    console.log(`Found ${corruptedCardsResult.rows.length} corrupted card references`);

    if (corruptedCardsResult.rows.length > 0) {
      // Borrar referencias corruptas de cartas
      await database.query(
        `DELETE FROM card_external_refs WHERE card_id IS NULL`
      );
      console.log(`Deleted ${corruptedCardsResult.rows.length} corrupted card references`);
    }

    console.log('\n✓ Database fixed successfully!');
    
    // Ver status final
    const setsCount = await database.query('SELECT COUNT(*) as count FROM sets');
    const refsCount = await database.query('SELECT COUNT(*) as count FROM set_external_refs WHERE set_id IS NOT NULL');
    
    console.log(`\nFinal status:`);
    console.log(`  Sets: ${setsCount.rows[0].count}`);
    console.log(`  Valid references: ${refsCount.rows[0].count}`);

    await database.close();
    process.exit(0);
  } catch (error) {
    console.error('Fix failed:', error);
    await database.close();
    process.exit(1);
  }
}

fixCorruptedRefs();
